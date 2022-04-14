require("regenerator-runtime/runtime")
window.PouchDB = require('pouchdb')

class FoodRotes extends HTMLElement {
	constructor() {
		super()

		this.shadow = this.attachShadow({mode: 'open'})

		this.wrapper = document.createElement('div')
		this.wrapper.classList.add("wrapper")

		this.shadow.appendChild(this.wrapper)

		this.wrapper.innerHTML = `
<style type="text/css">
@import "./food-rotes.css";
</style>
<h2>Grocery List</h2>
<p><button id="addButton">Add new item</button>
<input id="addInput" type="text"></p>
<p><button id="resetButton">Reset Completed Items</button>
<ul id="list"></ul>
<p><button id="clearButton">Clear list (Careful!)</button>
`
		this.addButton = this.shadow.querySelector("#addButton")
		this.resetButton = this.shadow.querySelector("#resetButton")
		this.clearButton = this.shadow.querySelector("#clearButton")
		this.addInput = this.shadow.querySelector("#addInput")
		this.addInput.placeholder = "Green eggs and ham"
		this.list = this.shadow.querySelector("#list")

		this.database = window.PouchDB('food-rotes', {auto_compaction: true})

		this.save = async () => {
			const items = this.list.querySelectorAll("li").entries()
			const saveTime = Date.now()

			for(var i = items.next(); !i.done; i = items.next()) {
				const item = i.value[1]
				const type = "item"
				const caption = item.querySelector(".caption").textContent
				const done = item.classList.contains("done")

				const olddoc = await this.database.query((doc, emit) => {
					try {
						if(doc.type == type && doc.caption == caption) {
							emit("idrev", true)
						} else {
							emit("idrev", undefined)
						}
					} catch(e) {
						console.log("[SAVE] [Finding old doc] error", e)
						console.trace()
					}
				}, {include_docs: true})

				var puts = 0
				for(const r in olddoc.rows) {
					const row = olddoc.rows[r]
					if(row.key == "idrev" && row.value) {
						puts += 1
						await this.database.put({
							type: type,
							caption: caption,
							done: done,
							_id: row.doc._id,
							_rev: row.doc._rev,
							saveTime: saveTime
						})
					}
				}
				if(!puts) {
					await this.database.post({
						type: type,
						caption: caption,
						done: done,
						saveTime: saveTime
					})
				}
			}

			const unupdated = await this.database.query((doc, emit) => {
				if(doc.type == "item" && doc.saveTime != saveTime) {
					emit("idrev", true)
				} else {
					emit("idrev", false)
				}
			}, {include_docs: true})

			for(const r in unupdated.rows) {
				const row = unupdated.rows[r]
				if(row.key == "idrev" && row.value) {
					await this.database.remove(row.doc._id, row.doc._rev)
				}
			}
		}

		this.resetList = () => {
			const items = this.list.querySelectorAll("li")
			items.forEach((item) => {
				item.classList.remove("done")
			})

			this.save()
		}

		this.clearList = () => {
			const items = this.list.querySelectorAll("li")
			items.forEach((item) => {
				item.remove()
			})

			this.save()
		}

		this.appendItem = (event, newCaption, newDone) => {
			if(newCaption === undefined) {
				if(this.addInput.value) {
					newCaption = this.addInput.value
					this.addInput.value = ""
				} else {
					return
				}
			}

			const newItem = document.createElement("li")
			newItem.classList.add("item")

			newItem.innerHTML = `
<button class="doneButton">✅</button>
<button class="removeButton">⛔️</button>
<span class="caption"></span>
`
			const done = newItem.querySelector(".doneButton")
			const remove = newItem.querySelector(".removeButton")
			const caption = newItem.querySelector(".caption")

			caption.textContent = newCaption

			remove.addEventListener('click', () => {
				newItem.remove()
				this.save()
			})

			done.addEventListener('click', () => {
				if(newItem.classList.contains("done")) {
					newItem.classList.remove("done")
				} else {
					newItem.classList.add("done")
				}
				this.save()
			})

			if(newDone !== undefined && newDone) {
				newItem.classList.add("done")
			}

			this.list.appendChild(newItem)

			if(event) {
				this.save()
			}
		}

		this.load = async () => {
			const res = await this.database.query((doc, emit) => {
				if(doc.type == "item") {
					emit("rec", true)
				} else {
					emit("rec", false)
				}
			}, {include_docs: true})

			const strcmp = function(x, y) {
				if(x < y) {
					return -1
				}
				if(x > y) {
					return 1
				}
				return o
			}

			const isRec = x => x.key == "rec"
			const hasValue = x => x.value
			const byValue = (x, y) => strcmp(x.value.toLowerCase(), y.value.toLowerCase())
			const rows = res.rows.filter(isRec).filter(hasValue).sort(byValue)
			for(const r in res.rows) {
				const row = res.rows[r]
				this.appendItem(undefined, row.doc.caption, row.doc.done)
			}
		}

		this.addInput.addEventListener('change', this.appendItem)
		this.addButton.addEventListener('click', this.appendItem)
		this.resetButton.addEventListener('click', this.resetList)
		this.clearButton.addEventListener('click', this.clearList)

		this.load()
	}
}

customElements.define("food-rotes", FoodRotes)
