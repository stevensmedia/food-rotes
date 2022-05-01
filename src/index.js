require("regenerator-runtime/runtime")

class FoodRotes extends HTMLElement {
	constructor() {
		super()

		if('serviceWorker' in navigator) {
			//console.log("[food-rotes] Creating worker")
			navigator.serviceWorker.register('./service-worker.js', {
				scope: window.location.href
			}).then((reg) => {
				//console.log("[food-rotes] Worker created")
				this.workerRegistration = reg
			})
		}

		this.reload = async () => {
			console.log("[food-rotes] Reload!")
			if(this.workerRegistration && this.workerRegistration.active) {
				console.log("[food-rotes] Updating worker")
				this.workerRegistration.update()
			}
			console.log("[food-rotes] reloading page")
			window.location.reload()
		}

		this.shadow = this.attachShadow({mode: 'open'})

		this.wrapper = document.createElement('div')
		this.wrapper.classList.add("wrapper")

		this.shadow.appendChild(this.wrapper)

		this.wrapper.innerHTML = `
<style type="text/css">
@import "./food-rotes.css";
</style>
<h2>Grocery List</h2>
<p>
	<button id="addButton">Add</button>
	<input id="addInput" type="text">
</p>
<p>
	<button id="resetButton">Reset Completed Items</button>
</p>
<ul id="list"></ul>
<p>
	<button id="clearButton">Clear list (Careful!)</button>
	<button id="reloadButton">Reload</button>
	<button id="exportButton">Export</button>
	<button id="importButton">Import</button>
</p>
`
		this.addButton = this.shadow.querySelector("#addButton")
		this.resetButton = this.shadow.querySelector("#resetButton")
		this.clearButton = this.shadow.querySelector("#clearButton")
		this.reloadButton = this.shadow.querySelector("#reloadButton")
		this.exportButton = this.shadow.querySelector("#exportButton")
		this.importButton = this.shadow.querySelector("#importButton")
		this.addInput = this.shadow.querySelector("#addInput")
		this.addInput.placeholder = "Green eggs and ham"
		this.list = this.shadow.querySelector("#list")
		this.databaseName = 'food-rotes-db'

		this.save = async () => {
			const items = this.list.querySelectorAll("li").entries()
			const saveTime = Date.now()

			var database = []
			for(var i = items.next(); !i.done; i = items.next()) {
				const item = i.value[1]
				const type = "item"
				const caption = item.querySelector(".caption").textContent
				const done = item.classList.contains("done")

				const row = {
					type: type,
					caption: caption,
					done: done,
				}
				database.push(row)
			}
			window.localStorage.setItem(this.databaseName, JSON.stringify(database))
		}

		this.resetList = () => {
			const items = this.list.querySelectorAll("li")
			items.forEach((item) => {
				item.classList.remove("done")
			})

			this.save()
		}

		this.clearList = () => {
			if(!window.confirm("Are you sure you want to clear the entire list?")) {
				return
			}

			const items = this.list.querySelectorAll("li")
			items.forEach((item) => {
				item.remove()
			})

			window.localStorage.setItem(this.databaseName, []);
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
				if(!window.confirm("Remove " + caption.textContent + "?")) {
					return
				}

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

		this.getDatabase = () => {
			const databaseStr = window.localStorage.getItem(this.databaseName) || "[]"
			return JSON.parse(databaseStr)
		}

		this.load = async () => {
			const database = this.getDatabase()

			const strcmp = function(x, y) {
				if(x < y) {
					return -1
				}
				if(x > y) {
					return 1
				}
				return 0
			}

			const isItem = x => x.type == "item"
			const byCaption = (x, y) => strcmp(x.caption.toLowerCase(), y.caption.toLowerCase())
			const items = database.filter(isItem).sort(byCaption)
			for(const i in items) {
				const item = items[i]
				try {
					this.appendItem(undefined, item.caption, item.done)
				} catch(e) {
					console.log("[load] Error loading item", item)
				}
			}
		}

		this.export = async (ev) => {
			const database = this.getDatabase()
			await navigator.clipboard.writeText(JSON.stringify(database))
			window.alert("Copied!")
		}

		this.import = async (ev) => {
			const string = await navigator.clipboard.readText()
			console.log("[import]", string)
			window.localStorage.setItem(this.databaseName, string)
			this.reload()
		}

		this.addInput.addEventListener('change', this.appendItem)
		this.addButton.addEventListener('click', this.appendItem)
		this.resetButton.addEventListener('click', this.resetList)
		this.clearButton.addEventListener('click', this.clearList)
		this.reloadButton.addEventListener('click', this.reload)
		this.exportButton.addEventListener('click', this.export)
		this.importButton.addEventListener('click', this.import)

		this.load()
	}
}

customElements.define("food-rotes", FoodRotes)
