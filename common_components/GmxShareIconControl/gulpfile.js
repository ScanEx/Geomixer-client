var gulp = require('gulp');
var concat = require('gulp-concat');
var header = require('gulp-header');
var footer = require('gulp-footer');
var streamqueue = require('streamqueue');
var html2jsobject = require('gulp-html2jsobject');

var styles = ['shareDialog.css'];
var scripts = ['ShareIconControl.js', 'ShareDialog.js', 'translations.js'];
var templates = ['shareDialog.html'];

gulp.task('default', function() {
    var sourcesStream = gulp.src(scripts);

    var templatesStream = gulp.src(templates)
        .pipe(html2jsobject('nsGmx.Templates.ShareIconControl'))
        .pipe(concat('templates.js'))
        .pipe(header('nsGmx.Templates.ShareIconControl = {};\n'))
        .pipe(header('nsGmx.Templates = nsGmx.Templates || {};'))
        .pipe(header('var nsGmx = nsGmx || {};'));

    var cssStream = gulp.src(styles)
        .pipe(concat('shareIconControl.css'));

    var jsStream = streamqueue({
            objectMode: true
        }, templatesStream, sourcesStream)
        .pipe(footer(';'))
        .pipe(concat('shareIconControl.js'));

    var finalStream = streamqueue({
            objectMode: true
        }, jsStream, cssStream)
        .pipe(gulp.dest('build'));
});

gulp.task('watch', ['default'], function() {
    gulp.watch([].concat(styles, scripts, templates), ['default']);
});