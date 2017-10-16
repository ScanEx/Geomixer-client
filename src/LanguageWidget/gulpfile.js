var gulp = require('gulp');
var through = require('through');
var html2jsobject = require('gulp-html2jsobject');
var concat = require('gulp-concat');
var header = require('gulp-header');
var footer = require('gulp-footer');
var es = require('event-stream');
var less = require('gulp-less');

gulp.task('default', function(cb) {
    var sourcesSream = gulp.src(['LanguageWidget.js']);

    var templatesStream = gulp.src('assets/*.html')
        .pipe(html2jsobject('nsGmx.Templates.LanguageWidget'))
        .pipe(concat('templates.js'))
        .pipe(header('nsGmx.Templates.LanguageWidget = {};\n'))
        .pipe(header('nsGmx.Templates = nsGmx.Templates || {};'))
        .pipe(header('var nsGmx = window.nsGmx = window.nsGmx || {};'));

    var mergedSourcesStream = es.merge(sourcesSream, templatesStream)
        .pipe(footer(';'))
        .pipe(concat('languageWidget.js'))
        .pipe(gulp.dest('build'));

    var cssStream = gulp.src('assets/styles.less')
        .pipe(less());

    var mergedAssetsStream = es.merge(cssStream)
        .pipe(gulp.dest('build/assets'));

    var finalStream = es.merge(mergedSourcesStream, mergedAssetsStream)
        .pipe(through(null, cb));
});