// REQUIRE PACKAGES
// For Gulp
let gulp = require('gulp')
let runSequence = require('run-sequence')
let clean = require('gulp-clean')
let browserSync = require('browser-sync').create()
let nodemon = require('gulp-nodemon')
let strip = require('gulp-strip-comments')
let stripDebug = require('gulp-config-strip-debug')
let noop = require('gulp-noop')

// For Css
let sass = require('gulp-sass')
let sourcemaps = require('gulp-sourcemaps')
let autoprefixer = require('gulp-autoprefixer')

// For Js
let babel = require("gulp-babel")
let uglify = require("gulp-uglify")
let concat = require("gulp-concat")

// For Json
let jsonminify = require('gulp-jsonminify')

// For Images
let imagemin = require('gulp-imagemin')

// For ejs
let ejsmin = require('gulp-htmlmin')

// Define I/O paths
let path = {
	css: {
		i: './src/scss/**/*.scss',
		o: './dist/css/'
	},
	js: {
		i: './src/js/**/*.js',
		o: './dist/js'
	},
	img: {
		i: './src/img/**/*',
		o: './dist/img'
	},
	data: {
		i: './src/data/**/*.json',
		o: './dist/data'
	},
	views: {
		i: './src/views/**/*.ejs',
		o: './dist/views'
	},
	modules: {
		i: './src/modules/**/*',
		o: './dist/modules'
	},
	txt: {
		i: './src/*.txt',
		o: './dist'
	},
	server: {
		i: './src/server.js',
		o: './dist'
	}
}

// Define options
let sassOptions = {
	errLogToConsole: true,
	outputStyle: 'expanded'
}

let autoprefixerOptions = {
	browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
}

let envProd = false

// TASKS

gulp.task('default', function(callback) {
	sassOptions = {
		errLogToConsole: true,
		outputStyle: 'expanded'
	}
	envProd = false
	runSequence('clean:dist', 'sass', 'js', 'img', 'data', 'views', 'txt', 'server', 'modules', callback)
})

// Watching for changes
gulp.task('watch', function(callback) {
	runSequence(['nodemon'], function() {
		browserSync.init({
			proxy: "http://localhost:8008",
			files: ["dist/**/*.*"],
			port: 1337
		})
		gulp.watch(path.js.i, ['js', browserSync.reload])
		gulp.watch(path.css.i, ['sass', browserSync.reload])
		gulp.watch(path.img.i, ['img', browserSync.reload])
		gulp.watch(path.data.i, ['data', browserSync.reload])
		gulp.watch(path.views.i, ['views', browserSync.reload])
		gulp.watch(path.server.i, ['server', browserSync.reload])
	})
})

// Bundle everything up ready for dropping onto the server
// Destroy comments, remove console.logging, minify
gulp.task('production', function(callback) {
	console.log('production build started')
	sassOptions = {
		errLogToConsole: false,
		outputStyle: 'compressed'
	}
	envProd = true
	runSequence('clean:dist', 'sass', 'js', 'img', 'data', 'views', 'txt', 'server', 'modules', () => {
		console.log('production build finished')
	})
})

// Delete the distribution folder
gulp.task('clean:dist', function() {
	return gulp.src('./dist', {
			read: false
		})
		.pipe(clean())
})

// SERVER
gulp.task('server', function() {
	gulp.src([path.server.i])
		.pipe(gulp.dest(path.server.o))
})

// Images
gulp.task('img', function() {
	gulp.src([path.img.i])
		.pipe((envProd) ? imagemin({
			progressive: true
		}) : noop())
		.pipe(gulp.dest(path.img.o))
})

// Data files
gulp.task('data', function() {
	gulp.src([path.data.i])
		.pipe((envProd) ? jsonminify() : noop())
		.pipe(gulp.dest(path.data.o))
})

// 3rd party plugins
gulp.task('views', function() {
	gulp.src([path.views.i])
		.pipe((envProd) ? ejsmin({
			collapseWhitespace: true
		}) : noop())
		.pipe(gulp.dest(path.views.o))
})

// .txt files (Robots and Humans)
gulp.task('txt', function() {
	gulp.src([path.txt.i])
		.pipe(gulp.dest(path.txt.o))
})

// Scss
gulp.task('sass', function() {
	return gulp.src(path.css.i)
		.pipe(sourcemaps.init())
		.pipe(sass(sassOptions).on('error', sass.logError))
		.pipe((envProd) ? noop() : sourcemaps.write())
		.pipe(autoprefixer((envProd) ? autoprefixerOptions : noop()))
		.pipe(gulp.dest(path.css.o))
})

// Javascript
gulp.task('js', function() {
	gulp.src(path.js.i)
		.pipe(sourcemaps.init())
		.pipe(concat('app.js'))
		.pipe(babel({
			presets: ['es2015'],
			minified: envProd
		}))
		.pipe((envProd) ? stripDebug() : noop())
		.pipe((envProd) ? strip() : noop())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.js.o))
})

// Modules
gulp.task('modules', function() {
	gulp.src(path.modules.i)
		.pipe((envProd) ? stripDebug() : noop())
		.pipe((envProd) ? strip() : noop())
		.pipe(gulp.dest(path.modules.o))
})

gulp.task('nodemon', function(cb) {
	var hasBooted = false
	return nodemon({
		script: './dist/server.js'
	}).on('start', function() {
		if (!hasBooted) {
			cb()
			hasBooted = true
		}
	})
})
