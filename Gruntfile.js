const browserify = require('browserify')
const fs = require('fs')
const fsPromises = require('fs/promises')
const glob = require('glob')
const path = require('path')
const sass = require('sass')

function globPromise(g, opts) {
	return new Promise(function(resolve, reject) {
		glob(g, opts, function(er, files) {
			if(er) {
				reject(er)
			} else {
				resolve(files)
			}
		})
	})
}

module.exports = function(grunt) {
	async function jsTask(input, output) {
		grunt.log.subhead(input, "Read source")
		const raw = await fsPromises.readFile(input, 'utf8')

		grunt.log.subhead(input, "Babelify")
		const bopts = {
		}
		var b = browserify(input, bopts)
		b.transform("babelify", {
			presets: [ "@babel/preset-env", "minify" ]
		})

		grunt.log.subhead(input, "Browserify")
		var bundlePromise = new Promise(async function(resolve, reject) {
			try {
				b.bundle(function(err, buf) {
					if(err) {
						reject(err)
					} else {
						resolve(buf)
					}
				})
			} catch(e) {
				reject(e)
			}
		})
		var js = await bundlePromise

		grunt.log.subhead(input, "Write output")
		await fsPromises.mkdir(path.dirname(output), { recursive: true })
		await fsPromises.writeFile(output, js)
	}

	async function scssTask(input, output) {
		grunt.log.subhead(input, "Sass")
		var css = sass.renderSync({
			file: input
		})

		grunt.log.subhead(input, "Write output")
		await fsPromises.mkdir(path.dirname(output), { recursive: true })
		await fsPromises.writeFile(output, css.css)
	}

	async function copyTask(input, output) {
		grunt.log.subhead(input, "Copy")
		await fsPromises.mkdir(path.dirname(output), { recursive: true })
		await fsPromises.copyFile(input, output)
	}

	grunt.initConfig({})

	function src(file) {
		return path.join(__dirname, 'src', file)
	}
	function dist(file) {
		return path.join(__dirname, 'dist', file)
	}

	grunt.registerTask('js', async function() {
		const done = this.async()
		try {
			const files = await globPromise('src/*.js', {})
			for(i in files) {
				const file = files[i]
				await jsTask(file, dist(path.basename(file)))
			}
		} catch(e) {
			grunt.log.write("js task error", e)
		}
		done()
	})

	grunt.registerTask('assets', async function() {
		const done = this.async()
		try {
			const files = await globPromise('src/*.+(html|png|json|css)', {})
			for(i in files) {
				const file = files[i]
				await copyTask(file, dist(path.basename(file)))
			}
		} catch(e) {
			grunt.log.write("assets task error", e)
		}
		done()
	})

	grunt.registerTask('scss', async function() {
		const done = this.async()
		try {
			const files = await globPromise('src/*.scss', {})
			for(i in files) {
				const file = files[i]
				await scssTask(file, dist(path.basename(file, ".scss") + ".css"))
			}
		} catch(e) {
			grunt.log.write("scss task error", e)
		}
		done()
	})

	var tasks = ['js', 'scss', 'assets']
	grunt.registerTask('default', "Build assets", tasks)
}
