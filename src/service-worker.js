require("regenerator-runtime/runtime")

var foodRotesWorker = {}

//console.log("[serviceworker.js] Started")

const activate = async (s) => {
	if(foodRotesWorker.version) {
		return
	}
	//console.log("[service-worker.js] activate")
	const resp = await fetch('./version.json')
	const json = await resp.json()
	//console.log("[service-worker.js] JSON ", json)
	foodRotesWorker = json
	//console.log("[service-worker.js] Version ", foodRotesWorker.version)

	s.addEventListener("install",  e => e.waitUntil(install()))
	s.addEventListener('fetch', e => e.respondWith(pull(e.request)))
}

const install = async () => {
	//console.log("[service-worker.js] install ", foodRotesWorker.files)
	foodRotesWorker.cache = await caches.open('food-rotes-' + foodRotesWorker.version)
	await foodRotesWorker.cache.addAll(foodRotesWorker.files)
}

const pull = async (req) => {
	//console.log("[service-worker.js] pull", req)
	if(req) {
		const cach = await foodRotesWorker.cache.match(req)
		return cach || fetch(req)
	}
}

activate(self)

//console.log("[serviceworker.js] Listeners added")
