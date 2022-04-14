require("regenerator-runtime/runtime")

var foodRotesWorker = {}

//console.log("[serviceworker.js] Started")

const activate = async () => {
	if(foodRotesWorker.version) {
		return
	}
	//console.log("[service-worker.js] activate")
	const resp = await fetch('./version.json')
	const json = await resp.json()
	//console.log("[service-worker.js] JSON ", json)
	foodRotesWorker = json
	//console.log("[service-worker.js] Version ", foodRotesWorker.version)
}

const install = async () => {
	await activate()
	//console.log("[service-worker.js] install ", foodRotesWorker.files)
	foodRotesWorker.cache = await caches.open('food-rotes-' + foodRotesWorker.version)
	await foodRotesWorker.cache.addAll(foodRotesWorker.files)
}

const pull = async (req) => {
	//console.log("[service-worker.js] pull", req)
	await activate()
	const cach = await foodRotesWorker.cache.match(req)
	return cach || fetch(req)
}

self.addEventListener("install",  e => e.waitUntil(install()))

self.addEventListener('fetch', e => e.respondWith(pull(e.request)))

//console.log("[serviceworker.js] Listeners added")
