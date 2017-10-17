var gulp = require('gulp');
var concat = require('gulp-concat');
var footer = require('gulp-footer');
var streamqueue = require('streamqueue');

var styles = ['TransparencySliderWidget.css'];
var scripts = ['TransparencySliderWidget.js', 'translations.js'];
var templates = [];

gulp.task('default', function() {
    var sourcesStream = gulp.src(scripts);

    var cssStream = gulp.src(styles);
    
    var templatesStream = gulp.src(templates);
    
    var imgStream = gulp.src('img/*');

    var jsStream = streamqueue({
            objectMode: true
        }, templatesStream, sourcesStream)
        .pipe(footer(';'))
        .pipe(concat('TransparencySliderWidget.js'));

    streamqueue({
        objectMode: true
    }, jsStream, cssStream)
    .pipe(gulp.dest('build'));
    
    imgStream.pipe(gulp.dest('build/img'));
});

gulp.task('watch', ['default'], function() {
    gulp.watch([].concat(styles, scripts, templates), ['default']);
});