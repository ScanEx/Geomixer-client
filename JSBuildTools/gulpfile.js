var gulp = require('gulp'),
    path = require('path'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    Handlebars = require('handlebars'),
    rebaseCssUrls = require('./common_components/builder/rebaseCssUrls.js'),
    concat = require('gulp-concat');
    //footer = require('gulp-footer');

var root = "../",
    srcRoot = root + 'src/',
    distDir = root + 'common_components/dist/';

require('./common_components/builder')(gulp, {
    tempDir: 'temp',
    distDir: distDir
}, [
    {
        id: 'primary',
        cssDistFile: root + 'css/primary.css',
        jsDistFile: srcRoot + 'primary.js',
        components: [
            {
                bowerComponent: 'jsurl',
                distFiles: ['url.js']
            },
            srcRoot + 'GmxWidget',
            srcRoot + 'CommonStyles@dist',
            srcRoot + 'DropdownMenuWidget@build',
            srcRoot + 'AuthWidget@build',
            srcRoot + 'LanguageWidget@build',
            srcRoot + 'HeaderWidget@build',
            srcRoot + 'TransparencySliderWidget@build',
            srcRoot + 'Popover@dist',
            srcRoot + 'DateInterval',
            srcRoot + 'CalendarWidget@build',
            {
                build: false,
                id: 'calendar-new',
                srcDir: srcRoot + 'CalendarWidget-new',
                distFiles: ['CalendarWidget.js', 'CalendarWidget.css']
            },
            srcRoot + 'AlertWidget@build',
            srcRoot + 'GmxShareIconControl@build',
            root + 'leaflet/plugins/' + 'Leaflet-IconLayers/src',
            srcRoot + 'GmxIconLayers',
            {
                build: false,
                id: 'extsearch',
                srcDir: root + 'leaflet/plugins/Leaflet.ExtSearch',
                distFiles: ['dist/bundle.js']
            }
        ],
    }]);

var addPrefix = function(prefix, array) {
    return array.map(function(elem) {return prefix + elem;});
}

gulp.task('gmx-pub', ['compile'], function(cb) {
    var gmxDeps = require('./deps.js'),
        buildUUID = uuid.v4().replace(/-/g, '');

    var thirdpartySources = addPrefix(root, gmxDeps.jsFilesThirdparty);

    var mainSources = [].concat(
        [],
        addPrefix(root, gmxDeps.jsFiles)
    );

    var cssSources = [].concat(addPrefix(root, gmxDeps.cssFiles));

    var distRoot = root + 'dist/';
    gulp.src(thirdpartySources)
        .pipe(concat('thirdparty.js'))
        .pipe(gulp.dest(distRoot));

    gulp.src(mainSources)
        .pipe(concat('ViewerCore.js'))
        .pipe(gulp.dest(distRoot));

    gulp.src(cssSources)
        .pipe(rebaseCssUrls({
            root: distRoot
        }))
        .pipe(concat('viewer.css'))
        .pipe(gulp.dest(distRoot));

    createLoader({
        thirdpartyList: ['dist/thirdparty.js'],
        jsToLoad:       ['dist/ViewerCore.js'],
        cssToLoad:      ['dist/viewer.css'],
        moduleFiles:    gmxDeps.moduleFiles
    }, cb);
})

// gulp.task('gmx-pub', ['compile', 'gmx-pub-self']);

var createLoader = function(params, cb) {
    var buildUUID = uuid.v4().replace(/-/g, ''),
        loaderScript = fs.readFileSync(root + 'loader.js', {encoding: 'utf8'}),
        loaderTemplate = Handlebars.compile(
            '+function() {' +
                'var buildGUID = "{{{buildUUID}}}";' +
                'var gmxFilesList = {{{jsToLoad}}};' +
                'var thirdpartyList = {{{thirdpartyList}}};' +
                'var cssToLoad = {{{cssToLoad}}};' +
                'var moduleFiles = {{{moduleFiles}}};' +
                '{{{loaderScript}}} ' +
            '}()'
        );

    console.log('GUID:', buildUUID);

    fs.mkdir(root + 'dist/', function() {
        fs.writeFileSync(root + 'dist/geomixer.js', loaderTemplate({
            buildUUID: buildUUID,
            thirdpartyList: JSON.stringify(params.thirdpartyList),
            jsToLoad:       JSON.stringify(params.jsToLoad),
            cssToLoad:      JSON.stringify(params.cssToLoad),
            moduleFiles:    JSON.stringify(params.moduleFiles),
            loaderScript: loaderScript
        }));

        cb();
    });
}

gulp.task('gmx-dev', ['compile', 'gmx-dev-self']);

gulp.task('gmx-dev-self', function(cb) {
    var gmxDeps = require('./deps.js');

    createLoader({
        thirdpartyList: gmxDeps.jsFilesThirdparty,
        jsToLoad:       [].concat(gmxDeps.jsFiles),
        cssToLoad:      [].concat(gmxDeps.cssFiles),
        moduleFiles:    gmxDeps.moduleFiles
    }, cb);
})
