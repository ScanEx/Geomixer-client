var fs = require('fs');
var es = require('event-stream');
var through = es.through;
var xml2js = require('xml2js');
var mustache = require('mustache');
var punycode = require('punycode');
var Stream = require('stream');
var File = require('vinyl');
var streamqueue = require('streamqueue');

var gulp = require('gulp');
var concat = require('gulp-concat');
var less = require('gulp-less');
var svg2ttf = require('gulp-svg2ttf');
var ttf2eot = require('gulp-ttf2eot');
var ttf2woff = require('gulp-ttf2woff');

var glyphs;
// sets glyphs global variable
gulp.task('_getglyphs', function(cb) {
    fs.readFile('assets/font/fontello.svg', function(err, data) {
        if (err) {
            throw err;
        }
        xml2js.parseString(data.toString(), function(err, data) {
            if (err) {
                throw err;
            }
            glyphs = data.svg.defs[0].font[0].glyph;
            cb();
        });
    });
});

gulp.task('iconstream', ['_getglyphs'], function() {
    var iconsCssStream = new Stream;
    iconsCssStream.readable = true;
    setTimeout(function() {
        var template = '{{#glyphs}}.icon-{{name}}:before { content: \'\\{{code}}\'; } {{/glyphs}}';
        var css = mustache.render(template, {
            glyphs: glyphs.map(function(glyph) {
                return {
                    name: glyph.$['glyph-name'],
                    code: glyph.$['unicode'].toString(16)
                }
            })
        });
        iconsCssStream.emit('data', new File({
            cwd: '/',
            base: '/assets/',
            path: '/assets/fontello-codes.css',
            contents: new Buffer(css)
        }));
        iconsCssStream.emit('end');
    }, 0);
    return iconsCssStream.pipe(gulp.dest('dist'))
});

gulp.task('styles', ['_getglyphs'], function(cb) {
    var iconsCssStream = new Stream;
    iconsCssStream.readable = true;
    setTimeout(function() {
        var template = '{{#glyphs}}.icon-{{name}}:before { content: \'\\{{code}}\'; } \n{{/glyphs}}';
        var css = mustache.render(template, {
            glyphs: glyphs.map(function(glyph) {
                return {
                    name: glyph.$['glyph-name'],
                    code: glyph.$['unicode'].toString(16)
                }
            })
        });
        iconsCssStream.emit('data', new File({
            cwd: '/',
            base: '/assets/',
            path: '/assets/fontello-codes.css',
            contents: new Buffer(css)
        }));
        iconsCssStream.emit('end');
    }, 0);

    var lessCssStream = gulp.src([
            'assets/ui-core.less',
            'assets/ui-theme.less',

            'assets/ui-draggable.less',
            'assets/ui-resizable.less',
            'assets/ui-selectable.less',
            'assets/ui-sortable.less',

            'assets/ui-accordion.less',
            'assets/ui-autocomplete.less',
            'assets/ui-button.less',
            'assets/ui-datepicker.less',
            'assets/ui-dialog.less',
            'assets/ui-menu.less',
            'assets/ui-progressbar.less',
            'assets/ui-selectmenu.less',
            'assets/ui-slider.less',
            'assets/ui-spinner.less',
            'assets/ui-tabs.less',

            'assets/gmx.less',
            'assets/styles.less'
        ])
        .pipe(concat('core.less'))
        .pipe(less());

    var pureCssStream = gulp.src([
        'assets/picker.css',
        'assets/geosearch.css',
        'assets/jscrollpane.css',

        'assets/fontello.css',
        'assets/fontello-codes.css'
    ]);

    var svgFontsStream = gulp.src('assets/font/fontello.svg').pipe(gulp.dest('dist/font'));
    var ttfFontsStream = gulp.src('assets/font/fontello.svg').pipe(svg2ttf()).pipe(gulp.dest('dist/font'));
    var eotFontsStream = gulp.src('assets/font/fontello.svg').pipe(svg2ttf()).pipe(ttf2eot()).pipe(gulp.dest('dist/font'));
    var woffFontsStream = gulp.src('assets/font/fontello.svg').pipe(svg2ttf()).pipe(ttf2woff()).pipe(gulp.dest('dist/font'));

    var stylesStream = streamqueue({
            objectMode: true
        }, lessCssStream, pureCssStream, iconsCssStream)
        .pipe(concat('styles.css'))
        .pipe(gulp.dest('dist'));

    var imagesStream = gulp.src([
            'assets/images/*.png',
            'assets/images/*.gif'
        ])
        .pipe(gulp.dest('dist/images'));

    var finalStream = es.merge(stylesStream, imagesStream, ttfFontsStream, eotFontsStream, woffFontsStream)
        .pipe(through(null, cb));
});

gulp.task('docs', ['_getglyphs', 'styles'], function(cb) {
    var rows = [];
    var cols = [];
    glyphs.map(function(glyph, index) {
        cols.push({
            name: glyph.$['glyph-name'],
            code: punycode.ucs2.decode(glyph.$.unicode)[0].toString(16)
        });
        if (((index + 1) % 4 === 0) || (index === glyphs.length - 1)) {
            rows.push({
                cols: cols
            });
            cols = [];
        }
    });

    fs.readFile('htmldocs/icons-demo.html', function(err, data) {
        if (err) {
            throw err;
        }
        var tpl = data.toString();
        var html = mustache.render(tpl, {
            rows: rows
        });

        fs.writeFile('dist/icons-demo.html', html, function() {
            gulp.src('htmldocs/jqueryui-demo.html')
                .pipe(gulp.dest('dist'))
                .pipe(through(null, function() {
                    cb();
                }))
        });
    });
});

gulp.task('default', ['docs']);
