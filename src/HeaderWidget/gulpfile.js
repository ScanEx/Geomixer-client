var gulp = require('gulp');
var through = require('through');
var html2jsobject = require('gulp-html2jsobject');
var concat = require('gulp-concat');
var header = require('gulp-header');
var footer = require('gulp-footer');
var es = require('event-stream');
var less = require('gulp-less');

gulp.task('default', function(cb) {
    var sourcesSream = gulp.src(['HeaderWidget.js', 'Translations.js']);

    var templatesStream = gulp.src('assets/*.html')
        .pipe(html2jsobject('nsGmx.Templates.HeaderWidget'))
        .pipe(concat('templates.js'))
        .pipe(header('nsGmx.Templates.HeaderWidget = {};\n'))
        .pipe(header('nsGmx.Templates = nsGmx.Templates || {};'))
        .pipe(header('var nsGmx = window.nsGmx = window.nsGmx || {};'));

    var mergedSourcesStream = es.merge(sourcesSream, templatesStream)
        .pipe(footer(';'))
        .pipe(concat('HeaderWidget.js'))
        .pipe(gulp.dest('build'));

    var cssStream = gulp.src('assets/styles.less')
        .pipe(less());

    var imagesStream = gulp.src([
        'assets/*.png'
    ]);

    var mergedAssetsStream = es.merge(cssStream, imagesStream)
        .pipe(gulp.dest('build/assets'));

    var finalStream = es.merge(mergedSourcesStream, mergedAssetsStream)
        .pipe(through(null, cb));
});