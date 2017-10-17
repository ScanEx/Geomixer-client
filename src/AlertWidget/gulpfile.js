var gulp = require('gulp');

var files = ['AlertWidget.js', 'alertWidget.css'];

gulp.task('default', function() {
    return gulp.src(files)
        .pipe(gulp.dest('build'));
});

gulp.task('watch', ['default'], function() {
    gulp.watch(files, ['default']);
});