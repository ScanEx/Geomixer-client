!(function() {

    //Взаимодействие с сервером
    var actionsManager = {
        catActions: [],
        styleActions: {},
        addCategoryAction: function(action, categoryID, data, beforeID, afterID) {
            var serverAction = {Action: action};

            if (categoryID) serverAction.Id = categoryID;
            if (data) serverAction.Category = data;
            if (beforeID) serverAction.BeforeId = beforeID;
            if (afterID) serverAction.AfterId = afterID;

            this.catActions.push(serverAction);
        },

        addStyleAction: function(action, categoryID, styleID, data, beforeID, afterID) {
            var serverAction = {Action: action};

            if (styleID) serverAction.Id = styleID;
            if (data) serverAction.Style = data;
            if (beforeID) serverAction.BeforeId = beforeID;
            if (afterID) serverAction.AfterId = afterID;

            this.styleActions[categoryID] = this.styleActions[categoryID] || [];
            this.styleActions[categoryID].push(serverAction);

        },

        clear: function() {
            this.catActions = [];
            this.styleActions = [];
        }
    }

    var dataProvider = {
        getCategoriesList: function() {
            var def = $.Deferred();
            sendCrossDomainJSONRequest(serverBase + 'StyleLib/GetCategories.ashx', function(response) {
                if (!parseResponse(response)) {
                    def.reject(response);
                    return;
                }
                def.resolve(response.Result);
            });
            return def;
        },
        getCategoryInfo: function(categoryID) {
            var def = $.Deferred();
            sendCrossDomainJSONRequest(serverBase + 'StyleLib/GetStyles.ashx?IdCategory=' + categoryID, function(response) {
                if (!parseResponse(response)) {
                    def.reject(response);
                    return;
                }

                def.resolve(response.Result);
            });
            return def;
        },

        saveChanges: function() {
            var def = $.Deferred();

            var request = [],
                catActions = actionsManager.catActions,
                styleActions = actionsManager.styleActions;

            catActions.length && request.push({
                ItemType: 'category',
                Actions: catActions
            });

            for (var cat in styleActions) {
                request.push({ItemType: 'style', IdCategory: cat, Actions: styleActions[cat]});
            }

            if (request.length) {
                sendCrossDomainPostRequest(serverBase + 'StyleLib/ModifyCategories.ashx', {WrapStyle: 'message', Request: JSON.stringify(request)}, function(response) {
                    if (!parseResponse(response)) {
                        def.reject(response);
                    } else {
                        def.resolve(response.Result);
                    }
                });
            } else {
                def.resolve();
            }

            actionsManager.clear();

            return def;
        }
    }

    //Data models

    var LibStyle = Backbone.Model.extend({
        initialize: function() {
            if (!this.id) {
                this.set('id', nsGmx.Utils.generateUniqueID());
            }
        }
    });

    LibStyle.getDefaultStyle = function(type) {
        return {
            POINT: {
                marker: {size: 3},
                outline: {color: 0x0000ff, thickness: 2, opacity: 100}
            },
            LINESTRING: {
                outline: {color: 0x0000ff, thickness: 2, opacity: 100}
            },
            POLYGON: {
                outline: {color: 0x0000ff, thickness: 2, opacity: 100}
            }
        }[type];
    }

    var LibStyleCollection = Backbone.Collection.extend({
        model: LibStyle,
        getLastID: function() {
            return this.length ? this.at(this.length-1).id : null;
        }
    })

    var LibCategory = Backbone.Model.extend({
        initialize: function() {
            this._isInited = 'styles' in this.attributes;
            this._isInited && this._bindStyleEvents();
        },

        loadFromServer: function() {
            if (this.attributes.styles) {
                var def = $.Deferred();
                def.resolve();
                return def;
            }

            var def = dataProvider.getCategoryInfo(this.id),
                _this = this;

            def.done(function(categotyInfo) {
                var styles = categotyInfo.Styles;
                var styleCollection = new LibStyleCollection();
                for (var i = 0; i < styles.length; i++) {
                    var s = styles[i];
                    styleCollection.add({
                        id: s.IdStyle,
                        title: s.Title,
                        type: s.GeometryType || 'POINT',
                        style: s.StyleJson
                    });
                }

                _this.set('styles', styleCollection);
                _this._bindStyleEvents();
            })

            return def;
        },

        _bindStyleEvents: function() {
            this.attributes.styles.on('change add remove', function() {
                this.trigger('change change:styles');
            }, this)
        }
    });

    var LibCategoryCollection = Backbone.Collection.extend({
        model: LibCategory,
        getLastID: function() {
            return this.length ? this.at(this.length-1).id : null;
        }
    });

    // Views
    var LibCategoryView = function(container, categoryCollection) {

        var _this = this;

        // attribute: activeID
        this.model = new (Backbone.Model.extend({
            initialize: function() {
                if (!categoryCollection.length) return;

                this.set({
                    activeID: categoryCollection.at(0).id
                })
            }
        }))();

        var updateActiveItem = function() {
            var activeID = _this.model.get('activeID');
            container.children().each(function() {
                $(this).toggleClass('stylelib-category-active', $(this).data('categoryID') === activeID);
            })
        }

        this.model.on('change:activeID', updateActiveItem);

        var draw = function() {
            container.empty();
            categoryCollection.each(function(category) {
                var getElem = function() {
                    return $('<div><span>' + category.get('title') + '</span></div>')
                        .data('categoryID', category.id)
                        .click(function() {
                            _this.model.set('activeID', $(this).data('categoryID'));
                        });
                }

                var elem = getElem();
                container.append(elem);

                category.on('change', function() {
                    var oldElem = elem;
                    elem = getElem();
                    oldElem.replaceWith(elem);
                    updateActiveItem();
                })
            })

            if (!categoryCollection.get(_this.model.get('activeID'))) {
                _this.model.set('activeID', categoryCollection.length ? categoryCollection.at(0).id : null);
            }

            updateActiveItem();
        }

        categoryCollection.on('add remove', draw);
        draw();
    }

    var LibStyleView = function(container, style) {
        var str2 = function(val) { return ('0' + val.toString(16)).slice(-2); } //2 char hex
        var colorToCSS = function(color) {
            var r = (color >> 16) & 255;
            var g = (color >> 8) & 255;
            var b = color & 255;
            return '#' + str2(r) + str2(g) + str2(b);
        }

        //рисует иконку стиля 64x64 пикселя. Возможно, асинхронно
        var drawIcon = function(div) {
            div.addClass('stylelib-style-icon-container');
            var rawStyle = style.get('style'),
                type = style.get('type');

            if (rawStyle.marker && rawStyle.marker.image) {
                var img = new Image();
                img.onload = function() {
                    var scale = 48 / Math.max(img.width, img.height);
                    img.width = img.width * scale;
                    img.height = img.height * scale;
                    div.append(img);
                }
                img.src = rawStyle.marker.image;
                return;
            }

            var appendOutlineStyle = function(div) {

                div.css({
                    position: 'absolute',
                    top: 2,
                    left: 2
                });

                if (rawStyle.outline && 'color' in rawStyle.outline) {
                    div.css({
                        width: 36,
                        height: 36,
                        'border-color': colorToCSS(rawStyle.outline.color),
                        'border-width': 6,
                        'border-style': 'solid'
                    })
                } else {
                    div.css({
                        width: 48,
                        height: 48
                    });
                }
            }

            var appendFillStyle = function(div) {
                if (rawStyle.fill && 'color' in rawStyle.fill) {
                    div.css({
                        'background-color': colorToCSS(rawStyle.fill.color),
                    });
                }
            }

            if (type === 'LINESTRING') {
                if (rawStyle.outline && 'color' in rawStyle.outline) {
                    div.css('position', 'relative');
                    var lineDiv = $('<div/>');
                    appendOutlineStyle(lineDiv);
                    lineDiv.appendTo(div);
                }
            } else if (type === 'POINT') {
                if (rawStyle.marker && rawStyle.marker.size) {
                    var lineDiv = $('<div/>');
                    appendOutlineStyle(lineDiv);
                    appendFillStyle(lineDiv);
                    lineDiv.appendTo(div);
                }
            } else { //POLIGON
                var lineDiv = $('<div/>');
                appendOutlineStyle(lineDiv);
                appendFillStyle(lineDiv);
                lineDiv.appendTo(div);
            }
        }

        style.on('change', function() {
            var newStyleIcon = $('<div/>');
            drawIcon(newStyleIcon);
            styleIcon.replaceWith(newStyleIcon);
            styleIcon = newStyleIcon;
            title.text(style.get('title'));
        });

        var styleIcon = $('<div/>');
        drawIcon(styleIcon);
        var title = $('<div class="stylelib-style-title"/>').text(style.get('title') || '' );
        container.append(styleIcon, title);
    }

    var LibStyleCollectionView = function(container, styleCollection, type) {
        var _this = this;

        var filteredDataCollection = new LibStyleCollection(styleCollection.filter(function(style) { return style.get('type') === type }))

        var updateActiveItem = function() {
            var activeID = _this.model.get('activeID');
            container.children().each(function() {
                $(this).toggleClass('stylelib-style-active', $(this).data('styleID') === activeID);
            })
        }

        this.model = new (Backbone.Model.extend({
            defaults: {
                activeID: null
            }
        }))();

        container.empty();


        filteredDataCollection.each(function(style) {
            var id = typeof style.id !== 'undefined' ? style.id : style.cid;
            var styleContainer = $('<div class="stylelib-style-container"/>')
                .data('styleID', id)
                .click(function() {
                    _this.model.set('activeID', $(this).data('styleID'))
                })
                .dblclick(function() {
                    $(_this).trigger('select', [style]);
                })
                .appendTo(container);
            new LibStyleView(styleContainer, style);
        })



        this.model.on('change:activeID', updateActiveItem);
        updateActiveItem();
    }

    var styleViews = {};

    //style edit dialog
    var showEditDialog = function(style) {
        gmxCore.loadModule('LayerStylesEditor').done(function() {
            var titleInput = $('<input class="stylelib-edit-title inputStyle">')
                    .val(style.get('title'))
                    .attr('title', 'Название стиля');
            var titleContainer = $('<div class="stylelib-edit-title-container"/>').append(titleInput);
            var styleContainer = $('<div/>');
            var saveBtn = $('<span class="buttonLink">Сохранить</span>');
            var container = $('<div/>').append(titleContainer, styleContainer, saveBtn);

            var styleClone = $.extend(true, {}, style.get('style'));

            saveBtn.click(function() {
                style.set({style: styleClone, title: titleInput.val()});
                style.trigger('doneEdit', true);
                $(dialogDiv).dialog('close');
            })

            var closeFunction = function() {
                style.trigger('doneEdit', false);
            }

            createStyleEditor(styleContainer[0], styleClone, style.get('type').toLowerCase());
            var dialogDiv = showDialog('Редактирование стиля ' + style.get('title'), container[0], {width: 300, height: 300, closeFunc: closeFunction});
        })
    }

    //main public function
    var showStyleLibraryDialog = function(dialogMode, geometryType) { //dialogMode: edit, select

        dialogMode = dialogMode || 'edit';
        var getActiveStyle = null; //будет проинициализировано после загрузки данных

        dataProvider.getCategoriesList().done(function(categories) {
            var categoriesCollection = new LibCategoryCollection();
            categories.Categories.forEach(function(c) {
                categoriesCollection.add({
                    id: c.IdCategory,
                    title: c.Title
                });
            })

            var currentDrawID = null;
            var drawCategoryStyles = function() {
                styleViews = {};
                var categoryID = categoryView.model.get('activeID');
                var category = categoriesCollection.get(categoryID);

                if (!category) return;

                var drawID = currentDrawID = nsGmx.Utils.generateUniqueID();
                category.loadFromServer().done(function() {
                    if (drawID !== currentDrawID) { //данные пришли, но пользователь уже кликнул на другую категорию
                        return;
                    }

                    var categoryStyleCollection = category.get('styles');

                    _.each(styleContainers, function(styleContainer, type) {
                        var view = new LibStyleCollectionView(styleContainer, categoryStyleCollection, type);
                        $(view).bind('select', function(event, style) {
                            container.dialog('destroy');
                            $(retObject).change();
                        })

                        view.model.on('change', function() {
                            $(retObject).change();
                        })

                        styleViews[type] = view;
                    })

                    $(retObject).change();
                })
            }

            var container = $('<div/>');

            container.append($(
                '<table class="stylelib-main-table"><tr>' +
                    '<td class="stylelib-category-panel">' +
                         '<div class="stylelib-category-actions">' +
                            '<div class="stylelib-iconhelper"><div class="stylelib-icon stylelib-category-add" title="Добавить категорию"></div></div>' +
                            '<div class="stylelib-iconhelper"><div class="stylelib-icon stylelib-category-edit" title="Изменить категорию"></div></div>' +
                            '<div class="stylelib-iconhelper"><div class="stylelib-icon stylelib-category-remove" title="Удалить категорию"></div></div>' +
                         '</div>' +
                         '<div class="stylelib-category-container"></div>' +
                    '</td>' +
                    '<td id="stylelib-styles-tab">' +
                        '<div id="stylelib-styles" class="stylelib-selection">' +
                            '<div class = "stylelib-style-controls">' +
                                '<div class="stylelib-iconhelper"><div class="stylelib-icon stylelib-style-add" title="Добавить стиль"></div></div>' +
                                '<div class="stylelib-iconhelper"><div class="stylelib-icon stylelib-style-edit" title="Изменить стиль"></div></div>' +
                                '<div class="stylelib-iconhelper"><div class="stylelib-icon stylelib-style-remove" title="Удалить стиль"></div></div>' +
                            '</div>' +
                            '<ul>' +
                                '<li><a href="#stylelib-markers-container">Точки</a>' +
                                '<li><a href="#stylelib-lines-container">Линии</a>' +
                                '<li><a href="#stylelib-polygons-container">Полигоны</a>' +
                            '</ul>' +
                            '<div id="stylelib-markers-container"  class="stylelib-styles-container"/>' +
                            '<div id="stylelib-lines-container"    class="stylelib-styles-container"/>' +
                            '<div id="stylelib-polygons-container" class="stylelib-styles-container"/>' +
                        '</div>' +
                        '<div id="stylelib-addcat" class="stylelib-subdialog" style="display: none">' +
                            '<div class="stylelib-subdialog-close"></div>' +
                            '<div class="stylelib-subdialog-title">Новая категория</div>' +
                            '<div class="stylelib-subdialog-helper"><input class="stylelib-subdialog-input"></div>' +
                            '<button class="stylelib-subdialog-button">Добавить</button>' +
                        '</div>' +
                        '<div id="stylelib-editcat" class="stylelib-subdialog" style="display: none">' +
                            '<div class="stylelib-subdialog-close"></div>' +
                            '<div class="stylelib-subdialog-title">Изменить категорию</div>' +
                            '<div class="stylelib-subdialog-helper"><input class="stylelib-subdialog-input"></div>' +
                            '<button class="stylelib-subdialog-button">Изменить</button>' +
                        '</div>' +
                        '<div id="stylelib-removecat" class="stylelib-subdialog" style="display: none">' +
                            '<div class="stylelib-subdialog-close"></div>' +
                            '<div class="stylelib-subdialog-title">Удалить категорию?</div>' +
                            '<button class="stylelib-subdialog-button">Удалить</button>' +
                        '</div>' +
                    '</td>' +
                '</tr></table>'
            ))

            var viewModeManager = {
                mode: 'styles',
                iconContainer: $('.stylelib-category-actions', container),
                icons: {
                    addcat: 'stylelib-category-add',
                    editcat: 'stylelib-category-edit',
                    removecat: 'stylelib-category-remove'
                },
                set: function(mode) {
                    if (mode !== 'styles' && this.mode === mode) {
                        this.set('styles');
                        return;
                    }

                    this.mode = mode;

                    var visibleContainer = container.find('#stylelib-' + mode);
                    visibleContainer.siblings().hide();
                    visibleContainer.show();

                    this.iconContainer.children().removeClass('stylelib-icon-active');
                    if (mode in this.icons) {
                        var iconHelper = $('.' + this.icons[mode], this.iconContainer).parent().addClass('stylelib-icon-active');
                    }
                }
            }

            $('.stylelib-subdialog-close', container).click(function() {
                viewModeManager.set('styles');
            })

            $('.stylelib-category-actions .stylelib-category-add', container).click(function() {
                viewModeManager.set('addcat');
                $('#stylelib-addcat .stylelib-subdialog-input', container).focus();
            })

            $('.stylelib-category-actions .stylelib-category-edit', container).click(function() {
                viewModeManager.set('editcat');
                var input = $('#stylelib-editcat .stylelib-subdialog-input', container);
                var activeCategory = categoriesCollection.get(categoryView.model.get('activeID'));
                input.val(activeCategory.get('title')).focus();
            })

            $('.stylelib-category-actions .stylelib-category-remove', container).click(function() {
                viewModeManager.set('removecat');
            })

            $('#stylelib-addcat .stylelib-subdialog-button', container).click(function() {
                var input = $('#stylelib-addcat .stylelib-subdialog-input', container),
                    val = input.val();

                input.val('');
                if (!val) return;

                var newCategory = new LibCategory({
                    id: nsGmx.Utils.generateUniqueID(),
                    title: val,
                    styles: new LibStyleCollection()
                });

                actionsManager.addCategoryAction('insert', null, {IdCategory: newCategory.id, Title: newCategory.get('title')}, categoriesCollection.getLastID());
                categoriesCollection.add(newCategory);
                dataProvider.saveChanges();

                viewModeManager.set('styles');
            })

            $('#stylelib-editcat .stylelib-subdialog-button', container).click(function() {
                var input = $('#stylelib-editcat .stylelib-subdialog-input', container),
                    val = input.val();

                input.val('');
                if (!val) return;

                var activeID = categoryView.model.get('activeID');
                var activeCategory = categoriesCollection.get(activeID);

                activeCategory.set('title', val);
                actionsManager.addCategoryAction('update', null, {IdCategory: activeCategory.id, Title: activeCategory.get('title')});
                dataProvider.saveChanges();

                viewModeManager.set('styles');
            })

            $('#stylelib-removecat .stylelib-subdialog-button', container).click(function() {
                var activeID = categoryView.model.get('activeID');
                var activeCategory = categoriesCollection.get(activeID);
                categoriesCollection.remove(activeCategory);
                actionsManager.addCategoryAction('delete', activeID);
                dataProvider.saveChanges();

                viewModeManager.set('styles');
            })

            var tabsContainer = container.find('#stylelib-styles-tab');
            tabsContainer.tabs({
                activate: function( event, ui ) {
                    $(retObject).change();
                },
                selected: (dialogMode === 'select' && {POINT: 0, LINESTRING: 1, POLYGON: 2}[geometryType]) || 0
            });

            if (dialogMode === 'select') {
                $('.stylelib-category-actions,.ui-tabs-nav,.stylelib-style-controls', container).hide();
            }

            getActiveStyle = function() {
                var tabIndex = $(tabsContainer).tabs('option', 'active');

                var styleView = styleViews[['POINT', 'LINESTRING', 'POLYGON'][tabIndex]];
                if (!styleView) return null;

                var activeID = styleView.model.get('activeID');
                if (!activeID) return null;

                var activeCategory = categoriesCollection.get(categoryView.model.get('activeID'));

                return activeCategory.get('styles').get(activeID);
            }

            $('.stylelib-style-controls .stylelib-style-add', container).click(function() {
                var tabIndex = $(tabsContainer).tabs('option', 'active');
                var type = ['POINT', 'LINESTRING', 'POLYGON'][tabIndex],
                    styleView = styleViews[type];

                var newStyle = new LibStyle({
                    title: '',
                    style: LibStyle.getDefaultStyle(type),
                    type: type
                });

                newStyle.once('doneEdit', function(isSaved) {
                    if (isSaved) {
                        var activeCategory = categoriesCollection.get(categoryView.model.get('activeID'));
                        activeCategory.loadFromServer().done(function() {
                            var styles = activeCategory.get('styles');

                            actionsManager.addStyleAction(
                                'insert',
                                activeCategory.id,
                                null,
                                {
                                    IdStyle: newStyle.id,
                                    Title: newStyle.get('title'),
                                    GeometryType: type,
                                    StyleJson: newStyle.get('style')
                                },
                                styles.getLastID()
                            );
                            dataProvider.saveChanges();
                            styles.add(newStyle);
                        })
                    }
                })

                showEditDialog(newStyle);
            })

            $('.stylelib-style-controls .stylelib-style-edit', container).click(function() {
                var style = getActiveStyle();

                if (style) {
                    style.once('doneEdit', function(isSaved) {
                        if (isSaved) {
                            var activeCategory = categoriesCollection.get(categoryView.model.get('activeID'));
                            actionsManager.addStyleAction(
                                'update',
                                activeCategory.id,
                                null,
                                {
                                    IdStyle: style.id,
                                    Title: style.get('title'),
                                    GeometryType: style.get('type'),
                                    StyleJson: style.get('style')
                                }
                            );
                            dataProvider.saveChanges();
                        }
                    })

                    showEditDialog(style);
                }
            })

            $('.stylelib-style-controls .stylelib-style-remove', container).click(function() {
                var style = getActiveStyle();

                if (style) {
                    var activeCategory = categoriesCollection.get(categoryView.model.get('activeID'));

                    activeCategory.get('styles').remove(style);
                    actionsManager.addStyleAction('delete', activeCategory.id, style.id);
                    dataProvider.saveChanges();
                }
            })

            var styleContainers = {
                POINT:      container.find('#stylelib-markers-container'),
                LINESTRING: container.find('#stylelib-lines-container'),
                POLYGON:    container.find('#stylelib-polygons-container')
            };

            var categoryView = new LibCategoryView(container.find('.stylelib-category-container'), categoriesCollection);

            categoryView.model.on('change', drawCategoryStyles);
            categoriesCollection.on('change', drawCategoryStyles);
            drawCategoryStyles();

            categoryView.model.on('change', function() {
                if (viewModeManager.mode !== 'styles') {
                    viewModeManager.set('styles');
                }
            });

            container.dialog({width: 500, height: dialogMode === 'select' ? 375 : 406, title: 'Библиотека стилей', resizable: false});
            $(container).parent().addClass('stylelib-dialog');

        });

        var retObject = {
            getActiveStyle: function() {
                var activeStyle = getActiveStyle ? getActiveStyle() : null;
                return activeStyle ? activeStyle.get('style') : null;
            }
        }

        return retObject;
    }

    gmxCore.addModule('StyleLibrary', {
        showStyleLibraryDialog: showStyleLibraryDialog,
        //интерфейс для подключения в виде плагина
        pluginName: 'Style Library Beta',
        afterViewer: function() {
            _menuUp.addChildItem({
                    id: 'styleLibrary',
                    title: 'Библиотека стилей',
                    onsel: showStyleLibraryDialog
            }, 'mapsMenu');
        }
    }, {
        css: 'css/StyleLibrary.css'
    })
})();
