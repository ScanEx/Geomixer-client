var gulp = require('gulp'),
    path = require('path'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    Handlebars = require('handlebars'),
    rebaseCssUrls = require('./common_components/builder/rebaseCssUrls.js'),
    concat = require('gulp-concat');
    //footer = require('gulp-footer');

var root = "../",
    commonRoot = root + 'common_components/repo/',
    distDir = root + 'common_components/dist/';

require('./common_components/builder')(gulp, {
    tempDir: 'temp',
    distDir: distDir
}, [
    {
        id: 'primary',
        cssDistFile: root + 'css/primary.css',
        jsDistFile: root + 'common_components/primary.js',
        components: [
            {
                bowerComponent: 'jsurl',
                distFiles: ['url.js']
            },
            commonRoot + 'GmxWidget',
            commonRoot + 'CommonStyles@build',
            commonRoot + 'DropdownMenuWidget@build',
            commonRoot + 'AuthWidget@build',
            commonRoot + 'LanguageWidget@build',
            commonRoot + 'HeaderWidget@build',
            commonRoot + 'TransparencySliderWidget@build',
            commonRoot + 'BaseLayersControl@build',
            commonRoot + 'Popover@build',
            commonRoot + 'DateInterval',
            commonRoot + 'CalendarWidget@build',
            commonRoot + 'AlertWidget@build',
            commonRoot + '../GmxShareIconControl@build',
            commonRoot + '../Leaflet-IconLayers/src',
            commonRoot + 'GmxIconLayers',
            {
                build: false,
                id: 'contextmenu',
                srcDir: root + 'leaflet/plugins/Leaflet.contextmenu',
                distFiles: ['dist/leaflet.contextmenu-src.js', 'dist/leaflet.contextmenu.css']
            },
            {
                build: true,
                id: 'markercluster',
                srcDir: root + 'leaflet/plugins/Leaflet.markercluster',
                distFiles: ['dist/leaflet.markercluster-src.js', 'dist/MarkerCluster.css', 'dist/MarkerCluster.Default.css']
            },
            {
                build: true,
                id: 'heatmap',
                srcDir: root + 'leaflet/plugins/Leaflet.heat',
                distFiles: ['dist/leaflet-heat.js']
            }
        ],
    }, {
        id: 'gmxapi',
        cssDistFile: 'temp/dummy.css',
        jsDistFile: 'temp/dummy.js',
        components: [
            root + 'leaflet/plugins/Leaflet-GeoMixer@dist',
            root + 'leaflet/plugins/gmxControls@dist',
            root + 'leaflet/plugins/gmxDrawing@dist'
        ],
    }]);

var addPrefix = function(prefix, array) {
    return array.map(function(elem) {return prefix + elem;});
}

gulp.task('gmx-pub', ['compile'], function(cb) {
    var gmxDeps = require('./deps.js'),
        buildUUID = uuid.v4().replace(/-/g, '');

    var thirdpartySources = addPrefix(root, gmxDeps.jsFilesThidparty);
    var mainSources = [].concat(
            [
                distDir + 'Leaflet-GeoMixer/dist/leaflet-geomixer-src.js',
                distDir + 'gmxControls/dist/gmxControls-src.js',
                distDir + 'gmxDrawing/dist/gmxDrawing-src.js'
            ],
            addPrefix(root, gmxDeps.jsFiles)
        );

    var cssSources = [].concat(addPrefix(root, gmxDeps.cssFiles), [
            distDir + 'Leaflet-GeoMixer/dist/leaflet-geomixer.css',
            distDir + 'gmxControls/dist/css/gmxControls.css',
            distDir + 'gmxDrawing/dist/css/gmxDrawing.css'
        ]
    );

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
    // var gmxAPIRelativePath = 'leaflet/plugins/Leaflet-GeoMixer/src/';
    // var gmxAPIDeps = require(root + 'leaflet/plugins/Leaflet-GeoMixer/build/deps.js').deps.map(function(file) {
        // return gmxAPIRelativePath + file;
    // });
    var gmxAPIRelativePath = 'leaflet/plugins/Leaflet-GeoMixer/src/',
        gmxAPIDeps = require(root + 'leaflet/plugins/Leaflet-GeoMixer/build/deps.js'),
        gmxAPIJS = addPrefix(gmxAPIRelativePath, gmxAPIDeps.depsJS);
        // gmxAPICSS = addPrefix(gmxAPIRelativePath, gmxAPIDeps.depsCSS);

    var gmxControlsRelativePath = 'leaflet/plugins/gmxControls/',
        gmxControlsDeps = require(root + 'leaflet/plugins/gmxControls/build/deps.js'),
        gmxControlsJS = addPrefix(gmxControlsRelativePath, gmxControlsDeps.depsJS),
        gmxControlsCSS = addPrefix(gmxControlsRelativePath, gmxControlsDeps.depsCSS);

    var gmxDrawingRelativePath = 'leaflet/plugins/gmxDrawing/',
        gmxDrawingDeps = require(root + 'leaflet/plugins/gmxDrawing/build/deps.js'),
        gmxDrawingJS = addPrefix(gmxDrawingRelativePath, gmxDrawingDeps.depsJS),
        gmxDrawingCSS = addPrefix(gmxDrawingRelativePath, gmxDrawingDeps.depsCSS);

    createLoader({
        thirdpartyList: gmxDeps.jsFilesThidparty,
        jsToLoad:       [].concat(gmxAPIJS, gmxControlsJS, gmxDrawingJS, gmxDeps.jsFiles),
        cssToLoad:      [].concat(gmxDeps.cssFiles, gmxControlsCSS, gmxDrawingCSS),
        moduleFiles:    gmxDeps.moduleFiles
    }, cb);
})
