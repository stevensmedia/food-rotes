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
<p><button id="resetButton">Reset list</button>
<ul id="list"></ul>
`
		this.addButton = this.shadow.querySelector("#addButton")
		this.resetButton = this.shadow.querySelector("#resetButton")
		this.addInput = this.shadow.querySelector("#addInput")
		this.addInput.placeholder = "Green eggs and ham"
		this.list = this.shadow.querySelector("#list")

		this.database = window.PouchDB('food-rotes')

		this.save = async () => {
			await this.database.destroy()
			this.database = window.PouchDB('food-rotes')

			const items = this.list.querySelectorAll("li")
			items.forEach((item) => {
				this.database.post({
					type: "item",
					caption: item.querySelector(".caption").textContent,
					done: item.classList.contains("done")
				})
			})
		}

		this.resetList = () => {
			const items = this.list.querySelectorAll("li")
			items.forEach((item) => {
				item.classList.remove("done")
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

			console.log("[appendItem]")
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
				console.log("[Item removeButton click]")
				newItem.remove()
				this.save()
			})

			done.addEventListener('click', () => {
				console.log("[Item doneButton click]")
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

			this.save()
		}

		this.load = async () => {
			console.log("[load]")
			const res = await this.database.query(function(doc) {
				console.log("[load query]", doc)
				if(doc.type == "item") {
					emit({
						caption: doc.caption,
						done: doc.done
					})
				}
			})
			console.log("[load] got", res)
			if(res && res.rows) {
				res.rows.forEach((doc) => {
					console.log("[load] appending", doc.key)
					this.appendItem(undefined, doc.key.caption, doc.key.done)
				})
			}
		}

		this.addInput.addEventListener('change', this.appendItem)
		this.addButton.addEventListener('click', this.appendItem)
		this.resetButton.addEventListener('click', this.resetList)

		this.load()
	}
}

customElements.define("food-rotes", FoodRotes)
