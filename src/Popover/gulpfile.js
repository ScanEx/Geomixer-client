var gulp = require('gulp');
var html2jsobject = require('gulp-html2jsobject');
var concat = require('gulp-concat');
var header = require('gulp-header');
var footer = require('gulp-footer');
var rename = require('gulp-rename');
var less = require('gulp-less');
var es = require('event-stream');

var styles = ['variables.less', 'mixins/opacity.less', 'mixins/vendor-prefixes.less', 'component-animations.less', 'tooltip.less', 'popovers.less'];
var scripts = ['tooltip.js', 'popover.js'];

gulp.task('default', function() {
    var cssStream = gulp.src(styles)
        .pipe(concat('popover.less'))
        .pipe(less())
        .pipe(gulp.dest('dist'))

    var jsStream = gulp.src(scripts)
        .pipe(concat('popover.js'))
        .pipe(gulp.dest('dist'));

    return es.merge(jsStream, cssStream)
});

gulp.task('watch', ['default'], function() {
    console.log([].concat(styles, scripts));
    gulp.watch([].concat(styles, scripts), ['default']);
});
