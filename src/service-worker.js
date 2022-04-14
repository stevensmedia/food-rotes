var foodRotesWorker = {}

async function loadCaches() {
	const json = await fetch('./version.json')
	foodRotesWorker = JSON.parse(json)
	foodRotesWorker.caches = await caches.open('food-rotes-' + foodRotes.version)
	await cachesaddAll(foodRotes.files)
}

async function fetch(req) {
	const cach = await foodRotesWorker.caches.match(req)
	return cach || fetch(req)
}

self.addEventListener("install",  e => e.waitUntil(loadCaches))

self.addEventListener('fetch', e => e.respondWith(fetch(e.request)))
