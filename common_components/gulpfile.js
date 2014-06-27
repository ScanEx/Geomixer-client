var es = require('event-stream');
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var async = require('async');
var mustache = require('mustache');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
var cp = require('child_process');
var through = require('through');
var semver = require('semver');
var _ = require('lodash');

/**
 * BUILD TOOLS
 */

/** Создать объект файла, используя его путь
 * Тут прописываются все характеристики файла по умолчанию
 * @param filePath
 * @param encoding
 * @param isStatic
 * @returns {}
 */
var createSourceFileObject = function(filePath, encoding, isStatic) {
    return {
        path: filePath,
        encoding: encoding || "utf-8",
        static: isStatic || false
    };
};

/** Превращает дерево файлов в массив строк с путями
 * @param {Object} fileTree дерево файлов
 * @returns {String} массив путей
 */
var parseFileTree = function(fileTree) {
    var createNode = function(something, prePath) {
        var path;
        if (typeof something === "string") {
            // считаем, что на входе путь к файлу
            // return true;
            path = something;
        } else if (typeof something === "object") {
            // на входе объект элемента (возможно, с кодировкой)
            if (typeof something.path === "string") {
                // в объекте есть хотя бы путь к файлу
                // return true;
                path = something.path;
            } else {
                return false;
            }
        } else {
            return false;
        }

        return createSourceFileObject(prePath + path, something.encoding, something.static);
    };

    var rParseTree = function(something, ar, prePath) {
        if (createNode(something, prePath)) { // если на входе элемент
            // добавляем элемент в общий массив
            ar.push(createNode(something, prePath));
        } else if (something instanceof Array) { // если на входе массив
            // цикл по массиву
            for (var i = 0; i < something.length; i++) {
                // рекурсивный вызов для каждого элемента
                rParseTree(something[i], ar, prePath);
            }
        } else if (typeof something === "object" && something !== null) { // если на входе объект
            // цикл по объекту
            for (var path in something) {
                if (something.hasOwnProperty(path)) {
                    // рекурсивный вызов для каждого элемента
                    rParseTree(something[path], ar, prePath + path);
                }
            }
        }
        return ar;
    };

    return rParseTree(fileTree, [], "");
};

/** Отбросить информацию о файлах, чтобы массив состоял только из строк путей
 *  @param {Array} complexFiles массив, содержащий как строки, так и объекты
 *  @returns {Array} массив, содержащий только строки
 */
var dropObjects = function(complexFiles) {
    var simpleFiles = [];
    for (var i = 0; i < complexFiles.length; i++) {
        if (typeof complexFiles[i].path === "string") {
            simpleFiles.push(complexFiles[i].path);
        } else if (typeof complexFiles[i] === "string") {
            simpleFiles.push(complexFiles[i]);
        } else {
            throw new Error("bad file array");
        }
    }
    return simpleFiles;
};

/** Получить конфиг сборщика. 
 * По сути просто берёт build config и подставляет в него переменные из config
 */
var getBuildConfig = function(config, buildConfigPath) {
    var rendered = entities.decode(
        mustache.render(
            JSON.stringify(require(buildConfigPath)),
            config
        )
    );
    return JSON.parse(rendered);
};

var getSources = function(buildConfig) {
    // локальные js-файлы, которые не грузятся динамически
    var staticJsSources = parseFileTree(buildConfig.local_sources.js).filter(function(script) {
        return !!(typeof script === "object" && script.static === true);
    });
    // локальные js-файлы, которые можно грузить динамически (static не true)
    var localJsSources = parseFileTree(buildConfig.local_sources.js).filter(function(script) {
        return !(typeof script === "object" && script.static === true);
    });
    // css-ки
    var localCssSources = parseFileTree(buildConfig.local_sources.css);
    // удалённые js-файлы (всегда грузятся динамически)
    var remoteJsSources = parseFileTree(buildConfig.remote_sources.js);

    return {
        staticJsSources: staticJsSources,
        localJsSources: localJsSources,
        remoteJsSources: remoteJsSources,
        localCssSources: localCssSources,
    }
};

/** Фабрика компонентов
 * @param  {String} componentName
 * @return {Object}
 */
var createComponent = function(componentName, sourcePath, localPath) {
    var watchSources = [];
    var watchFilePath = path.normalize(sourcePath + '/watch.json');
    var npmFilePath = path.normalize(path.resolve('./', path.join(sourcePath, componentName, '/package.json')));
    // пробуем получить исходники компонента
    try {
        // содержимое вотчфайла
        var watchJson = require(path.resolve('./', path.normalize(path.join(sourcePath, componentName, '/watch.json'))));
        // временный объект, с помощью которого мы сымитируем дерево файлов (как в build_config)
        var o = {};
        // получим что-то вроде {"../CommonComponents/Component/": [file1, file2 .. вобщем то, что в watch]}
        o[dropObjects([path.join(sourcePath, componentName) + path.sep])] = watchJson.watch;
        // развернём сокращённые пути (например assets/*)
        dropObjects(parseFileTree(o)).map(function(watchPath) {
            // результат в watchSources
            watchSources = watchSources.concat(glob.sync(watchPath));
        });
    } catch (e) {
        watchSources = [];
    }
    return {
        name: componentName,
        sourcePath: path.normalize(path.join(sourcePath, componentName)),
        localPath: path.normalize(path.join(localPath, componentName)),
        npmFilePath: npmFilePath,
        gulpFilePath: path.normalize(path.join(localPath, componentName, '/gulpfile.js')),
        watchFilePath: watchFilePath,
        watchSources: watchSources.concat(
            path.join(sourcePath, componentName, '/gulpfile.js'),
            path.join(sourcePath, componentName, '/watch.json')
        ),
        nodeFolderPath: path.normalize(path.join(localPath, componentName, '/node_modules')),
        buildFolderPath: path.normalize(path.join(sourcePath, '/build')),
        dependencies: require(npmFilePath) //зависимости, присущие только этому компоненту
    }
};

/** Возвращает из массива компонентов тот, чьё имя встречается в resolvingPath
 * @param  {Array} from массив компонентов
 * @param  {String} resolvingPath путь к директории компонента или к какому-либо из его файлов
 * @return {Object} найденый компонент
 */
var getComponentByPath = function(from, resolvingPath) {
    var foundComponent = null;
    // убираем из строки пути все возможные директории расположения компонентов
    from.map(function(currentComponent) {
        var resolvingString = path.sep + currentComponent.name.toLowerCase() + path.sep;
        if (resolvingPath.toLowerCase().indexOf(resolvingString) !== -1) {
            foundComponent = currentComponent;
        }
    });
    return foundComponent;
};

/**
 * GLOBALS
 */

try {
    var local_config = require('./local_config.json');
    var build_config = getBuildConfig(local_config, './build_config.json');

    var sourceCommonComponentsPath = local_config.common_components;
    var localCommonComponentsPath = './client/common_components';
    var sourceLocalComponentsPath = './client/local_components';
    var localLocalComponentsPath = './client/local_components';

    // {Array} список имён общих компонентов
    // это потом надо будет убрать и сделать в build_config'е список имён компонентов
    var commonComponentsNames = build_config.common_components.map(function(componentPath) {
        return componentPath.replace(local_config.common_components, "").replace("/", "");
    });

    var commonComponents = commonComponentsNames.map(function(componentName) {
        return createComponent(componentName, sourceCommonComponentsPath, localCommonComponentsPath);
    });

    var localComponents = build_config.local_components.map(function(componentPath) {
        var componentName = path.basename(componentPath);
        return createComponent(componentName, sourceLocalComponentsPath, localLocalComponentsPath);
    });

    var totalComponents = [].concat(commonComponents, localComponents);

    // {Object} список исходников проекта
    var sources = getSources(build_config);

    var rootNpmFile = require('./package.json');
} catch (e) {
    console.warn('unable to init globals', e);
}

/**
 * GULP-RELATED
 */

var gulp = require('gulp');
var concat = require('gulp-concat');
var expand = require('gulp-expand');
var chug = require('gulp-chug');
var clean = require('gulp-clean');
var spawn = require('gulp-spawn');
var gutil = require('gulp-util');
var File = gutil.File;
var rebaseUrls = require('gulp-css-rebase-urls');
var rename = require('gulp-rename');
var bower = require('bower');

/**
 * TASKS
 */

/**
 * Получить список модулей компонента, которых нет в mutualDependencies
 * @param  {Object} component          компонент
 * @param  {Object} mutualDependencies корневой package.json
 * @return {Stream}
 */
var getUniqueDependencies = function(mutualDependencies) {
    return through(function(npmFile) {
        var npmFileContents = npmFile.contents.toString('utf-8');
        var componentDependencies = JSON.parse(npmFileContents).devDependencies;
        var uniqueDependencies = {};
        _.forOwn(componentDependencies, function(num, key) {
            if (!_.has(mutualDependencies, key)) {
                // в корневом package.json такого компонента вообще нет
                uniqueDependencies[key] = componentDependencies[key];
            }
            // TODO: добавить обработку версий модулей
            /*else if (componentDependencies[key] !== mutualDependencies[key]) {
                // компонент есть, но версии не совпадают
                if (semver.valid(componentDependencies[key])) {
                    if (!semver.satisfies(mutualDependencies[key], componentDependencies[key])) {
                        uniqueDependencies[key] = componentDependencies[key];
                    }
                } else {
                    uniqueDependencies[key] = componentDependencies[key];
                }
            }*/
        });
        var newContents = {
            devDependencies: uniqueDependencies
        };
        var parsedFile = new File(npmFile);
        parsedFile.contents = new Buffer(JSON.stringify(newContents));
        this.emit('data', parsedFile);
    });
};

// скопировать один компонент
var copyComponent = function(component, done) {
    if (component.sourcePath !== component.localPath) {
        async.series({
                copy: function(callback) {
                    gulp.src(path.normalize(component.sourcePath + '/**'))
                        .pipe(gulp.dest(component.localPath))
                        .pipe(through(null, function() {
                            callback(null, {});
                        }));
                }
            },
            function(err, results) {
                gutil.log('copied ' + component.name);
                done();
            }
        );
    } else {
        done();
    }
};

// Копировать компоненты
gulp.task('copyComponents', function(done) {
    var funcs = commonComponents.map(function(component) {
        return function(callback) {
            // параллельно выполняем копирование директорий компонентов
            copyComponent(component, function() {
                callback(null, null);
            });
        };
    });
    async.parallel(funcs, function(err, results) {
        done();
    });
});

// Переименовать старый package.json в package.source.json, 
// а в новый записать только те зависимости, которых нет в корневом.
var pruneComponentDependencies = function(component, done) {
    async.series({
            rename: function(callback) {
                gulp.src(component.npmFilePath)
                    .pipe(rename('package.source.json'))
                    .pipe(gulp.dest(component.localPath))
                    .pipe(through(null, function() {
                        callback(null, {});
                    }));
            },
            createNpmFile: function(callback) {
                gulp.src(path.join(component.localPath, 'package.source.json'))
                    .pipe(getUniqueDependencies(rootNpmFile.devDependencies))
                    .pipe(rename('package.json'))
                    .pipe(gulp.dest(component.localPath))
                    .pipe(through(function(data) {}, function() {
                        component.uniqueDependencies = require(path.resolve(component.localPath, 'package.json'));
                        callback(null, {});
                    }));
            }
        },
        function(err, results) {
            gutil.log('pruned ' + component.name);
            done();
        }
    );
};

gulp.task('pruneDependencies', ['copyComponents'], function(done) {
    var funcs = commonComponents.map(function(component) {
        return (function(callback) {
            pruneComponentDependencies(component, function() {
                callback(null, {});
            });
        });
    });
    async.series(funcs, function(err, results) {
        done();
    });
});

// выполнить npm install для одного компонента
var installComponent = function(component, done) {
    // в windows npm не является исполняемым файлом
    // на самом деле выполняется батник npm.cmd
    var npm = (process.platform === "win32" ? "npm.cmd" : "npm");
    var npmProcessStream = cp.spawn(npm, ['install'], {
        cwd: component.localPath
    });
    npmProcessStream.stdout.pipe(process.stdout);
    npmProcessStream.stderr.pipe(process.stderr);
    npmProcessStream.on('exit', function() {
        done();
    })
};

// Сжать зависимости и запустить 'npm install' в директориях компонентов
gulp.task('installComponents', ['pruneDependencies'], function(done) {
    var funcs = commonComponents.map(function(component) {
        return (function(callback) {
            try {
                _.isEmpty(component.uniqueDependencies.devDependencies);
            } catch (e) {
                console.log(component);
            }
            if (
                component.uniqueDependencies && !_.isEmpty(component.uniqueDependencies.devDependencies)
            ) {
                gutil.log('running npm install in ' + component.localPath);
                installComponent(component, function() {
                    gutil.log('npm install complete (' + component.localPath + ')');
                    callback(null, null);
                });
            } else {
                gutil.log('devDependencies is empty, cancelling npm install.');
                callback(null, {});
            }
        });
    });
    async.series(funcs, function(err, results) {
        done();
    });
});

// собрать один компонент
var buildComponent = function(component, done) {
    gutil.log('building ' + component.name);
    gulp.src(component.gulpFilePath)
        .pipe(chug())
        .pipe(through(null, function() {
            gutil.log('build complete (' + component.name + ')');
            done();
        }));
};

// Собрать все компоненты
gulp.task('buildComponents', ['copyComponents', 'installComponents'], function(done) {
    gutil.log('building components...');
    var gulpfiles = totalComponents.map(function(component) {
        return component.gulpFilePath;
    })
    if (gulpfiles.length > 0) {
        gulp.src(gulpfiles)
            .pipe(chug())
            .pipe(through(null, function() {
                done(null, null);
            }));
    } else {
        done(null, null);
    }
});

// отслеживать package.json компонентов
// при изменении выполнить npm install в директории изменившегося компонента
gulp.task('watchNpm', ['installComponents'], function() {
    gutil.log('now watching npm files');
    var npmfiles = totalComponents.map(function(component) {
        return component.npmFilePath;
    });

    gulp.watch(npmfiles, function(changed) {
        var component = getComponentByPath(totalComponents, changed.path);
        if (component) {
            async.series([
                // копируем изменённый package.json
                function(callback) {
                    gutil.log('copying ' + component.name + '...');
                    gulp.src(component.npmFilePath)
                        .pipe(gulp.dest(component.localPath))
                        .pipe(through(null, function() {
                            callback(null, null);
                        }));
                },
                // выполняем npm install
                function(callback) {
                    gutil.log('running npm install in ' + component.localPath);
                    installComponent(component, function() {
                        gutil.log('npm install complete (' + component.localPath + ')');
                        callback(null, null);
                    });
                }
            ]);
        }
    });
});

// собрать проект в development-режиме. (скомпилить js и css)
var assembleDevelopment = function(done) {
    gutil.log('assembling project...');
    async.parallel({
        createApplicationConfig: function(callback) {
            var applicationConfig = {
                host: local_config.host,
                sources: [].concat(
                    sources.remoteJsSources,
                    sources.localJsSources
                )
            };
            fs.writeFile('application_config.json', JSON.stringify(applicationConfig), function(err) {
                if (err) {
                    throw err;
                }
                callback(null, {});
            });
        },
        compileJs: function(callback) {
            var staticJsSources = dropObjects(sources.staticJsSources);
            if (staticJsSources.length > 0) {
                gulp.src(staticJsSources)
                    .pipe(concat('local.js'))
                    .pipe(gulp.dest('client/build/'))
                    .pipe(through(null, function() {
                        callback(null, {});
                    }));
            } else {
                callback(null, {});
            }
        },
        compileCss: function(callback) {
            var localCssSources = dropObjects(sources.localCssSources);
            if (localCssSources.length > 0) {
                gulp.src(dropObjects(sources.localCssSources))
                    .pipe(rebaseUrls())
                    .pipe(concat('build.css'))
                    .pipe(gulp.dest('./'))
                    .pipe(through(null, function() {
                        callback(null, {});
                    }));
            } else {
                callback(null, {});
            }
        }
    }, function(err, results) {
        gutil.log('done');
        done();
    });
};

// собрать проект в production-режиме. 
var assembleProduction = function(done) {
    gutil.log('assembling project...');
    async.parallel({
        createApplicationConfig: function(callback) {
            var applicationConfig = {
                host: local_config.host,
                sources: [].concat(
                    sources.remoteJsSources
                )
            };
            fs.writeFile('application_config.json', JSON.stringify(applicationConfig), function(err) {
                if (err) {
                    throw err;
                }
                callback(null, {});
            });
        },
        compileJs: function(callback) {
            var staticJsSources = sources.staticJsSources;
            var localJsSources = sources.localJsSources;
            if (staticJsSources.length > 0 || localJsSources.length > 0) {
                gulp.src([].concat(
                    dropObjects(staticJsSources),
                    dropObjects(localJsSources)
                ))
                    .pipe(concat('local.js'))
                    .pipe(gulp.dest('client/build/'))
                    .pipe(through(null, function() {
                        callback(null, {});
                    }));
            } else {
                callback(null, {});
            }
        },
        compileCss: function(callback) {
            var localCssSources = sources.localCssSources;
            if (localCssSources.length > 0) {
                gulp.src(dropObjects(sources.localCssSources))
                    .pipe(rebaseUrls())
                    .pipe(concat('build.css'))
                    .pipe(gulp.dest('./'))
                    .pipe(through(null, function() {
                        callback(null, {});
                    }));
            } else {
                callback(null, {});
            }
        }
    }, function(err, results) {
        gutil.log('done');
        done();
    });
};

/** Собрать проект и запустить watch
 * @param  {Function} assemble функция сборки проекта
 */
var buildProject = function(assemble) {
    var watchSources = [];
    totalComponents.map(function(component) {
        watchSources = watchSources.concat(component.watchSources);
    });
    // вот так приходится делать потому-что таски галпа не поддерживают аргументы
    assemble(function() {
        // изменился исходный файл компонента или watch.json
        gulp.watch(watchSources, function(event) {
            var component = getComponentByPath(totalComponents, event.path);
            // и вот так
            async.series({
                copyComponent: function(callback) {
                    // копируем изменившийся компонент, если файл относится к нему
                    if (component) {
                        copyComponent(component, function() {
                            callback(null, {});
                        });
                    }
                },
                buildComponent: function(callback) {
                    // собираем изменившийся компонент, если файл относится к нему
                    if (component) {
                        buildComponent(component, function() {
                            callback(null, {});
                        });
                    }
                },
                assembleProject: function(callback) {
                    assemble(function() {
                        callback(null, {});
                    });
                }
            });
        });
    });
};

gulp.task('development', ['buildComponents', 'bowerinstall'], function(cb) {
    buildProject(assembleDevelopment);
});

gulp.task('production', ['buildComponents', 'bowerinstall'], function(cb) {
    buildProject(assembleProduction);
});

gulp.task('deploy', ['buildComponents'], function(cb) {
    if (!fs.existsSync('local_config_remote.json')) {
        gutil.log(gutil.colors.red('Unable to deploy. Remote config not found.'));
        cb();
    } else {
        var removeThis = [];
        for (var i = 0; i < totalComponents.length; i++) {
            removeThis.push(totalComponents[i].nodeFolderPath);
        }

        var configStream = gulp.src('local_config_remote.json')
            .pipe(rename('local_config.json'))
            .pipe(gulp.dest('./'))
            .pipe(through(null, function() {
                local_config = require('./local_config_remote.json');
                build_config = getBuildConfig(local_config, './build_config.json');
                sources = getSources(build_config);
                assembleProduction(function() {
                    var destroyingStream = gulp.src(removeThis)
                        .pipe(clean())
                        .pipe(through(null, cb));
                });
            }));
    }
});

gulp.task('bowerinstall', function(cb) {
    if (build_config.bower_components && build_config.bower_components.length > 0) {
        bower.commands
            .install(build_config.bower_components, {
                save: true
            }, {
                directory: "client/bower_components"
            })
            .on('end', function(installed) {
                cb();
            });
    } else {
        cb();
    }
});

gulp.task('bootstrap', function(cb) {
    var localConfigStream = gulp.src('local_config_local_sample.json')
        .pipe(rename('local_config_local.json'))
        .pipe(gulp.dest('./'));

    var remoteConfigStream = gulp.src('local_config_remote_sample.json')
        .pipe(rename('local_config_remote.json'))
        .pipe(gulp.dest('./'));

    var finalStream = es.merge(localConfigStream, remoteConfigStream)
        .pipe(through(null, function() {
            cb();
        }));
});

var useConfig = function(configFile, cb) {
    if (!fs.existsSync(configFile)) {
        gutil.log(gutil.colors.red(configFile + ' not found.'));
        cb();
    } else {
        var configStream = gulp.src(configFile)
            .pipe(rename('local_config.json'))
            .pipe(gulp.dest('./'))
            .pipe(through(null, function() {
                cb();
            }));
    }
};

gulp.task('useLocalConfig', function(cb) {
    useConfig('local_config_local.json', cb);
});

gulp.task('useRemoteConfig', function(cb) {
    useConfig('local_config_remote.json', cb);
});

gulp.task('deploy', ['useRemoteConfig', 'bowerinstall', 'buildComponents'], function(cb) {
    assembleProduction(cb);
});