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
<ul id="list"></ul>
`
		this.addButton = this.shadow.querySelector("#addButton")
		this.addInput = this.shadow.querySelector("#addInput")
		this.addInput.placeholder = "Green eggs and ham"
		this.list = this.shadow.querySelector("#list")

		this.save = () => {
		}

		this.load = () => {
		}

		this.appendItem = () => {
			const name = this.addInput.value
			if(name) {
				this.addInput.value = ""
			} else {
				return
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

			caption.textContent = name

			remove.addEventListener('click', () => {
				console.log("[Item removeButton click]")
				newItem.remove()
			})

			done.addEventListener('click', () => {
				console.log("[Item doneButton click]")
				if(newItem.classList.contains("done")) {
					newItem.classList.remove("done")
				} else {
					newItem.classList.add("done")
				}
			})

			this.list.appendChild(newItem)

			this.save()
		}

		this.addInput.addEventListener('change', this.appendItem)
		this.addButton.addEventListener('click', this.appendItem)

		this.load()
	}
}

customElements.define("food-rotes", FoodRotes)
