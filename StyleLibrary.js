(function(_) {

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
                sendCrossDomainPostRequest(serverBase + 'StyleLib/ModifyCategories.ashx', {Request: JSON.stringify(request)}, function(response) {
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
    var generateUniqueID = function()
    {
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
            randomstring = '';
        
        for (var i = 0; i < 16; i++) 
        {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.charAt(rnum);
        }
        
        return randomstring;
    }
    

    var LibStyle = Backbone.Model.extend({
        initialize: function() {
            if (!this.id) {
                this.set('id', generateUniqueID());
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
                    var count = category.get('styles') ? category.get('styles').length : 0;
                    return $('<div/>')
                        .append(
                            $('<span/>').text(category.get('title')),
                            $('<span class="stylelib-category-count"/>').text('(' + count + ')')
                        )
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
                    var scale = 64 / Math.max(img.width, img.height);
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
                        width: 48,
                        height: 48,
                        'border-color': colorToCSS(rawStyle.outline.color),
                        'border-width': 6,
                        'border-style': 'solid'
                    })
                } else {
                    div.css({
                        width: 60,
                        height: 60
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
        
        // attribute: activeID
        this.model = new (Backbone.Model.extend({
            initialize: function() {
                if (!filteredDataCollection.length) return;
                
                this.set({
                    activeID: filteredDataCollection.at(0).id
                })
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
    var showStyleLibraryDialog = function() {
    
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
                
                var drawID = currentDrawID = generateUniqueID();
                category.loadFromServer().done(function() {
                    if (drawID !== currentDrawID) { //данные пришли, но пользователь уже кликнул на другую категорию
                        return;
                    }
                    
                    var categoryStyleCollection = category.get('styles');
                    
                    _.each(styleContainers, function(container, type) {
                        var view = new LibStyleCollectionView(container, categoryStyleCollection, type);
                        $(view).bind('select', function(event, style) {
                            style && alert('Выбран стиль: ' + style.get('title'));
                        })
                        
                        styleViews[type] = view;
                    })
                })
            }
            
            var container = $('<div/>');
            
            container.append($(
                '<table class="stylelib-main-table"><tr>' + 
                    '<td class="stylelib-category-panel">' +
                         '<div class="stylelib-category-container"></div>' + 
                         '<div class="stylelib-category-controls">' + 
                            '<div class="buttonLink" id="addBtn">Добавить</div>' + 
                            '<div class="buttonLink" id="editBtn">Изменить</div>' +
                            '<div class="buttonLink" id="delBtn">Удалить</div>' +
                            '<div class="buttonLink" id="saveBtn">Сохранить</div>' +
                         '</div>' + 
                    '</td>' +
                    '<td id="stylelib-styles-tab">' +
                        '<ul>' +
                            '<li><a href="#stylelib-markers-container">Точки</a>' +
                            '<li><a href="#stylelib-lines-container">Линии</a>' +
                            '<li><a href="#stylelib-polygons-container">Полигоны</a>' +
                        '</ul>' +
                        '<div id="stylelib-markers-container"  class="stylelib-styles-container"/>' +
                        '<div id="stylelib-lines-container"    class="stylelib-styles-container"/>' +
                        '<div id="stylelib-polygons-container" class="stylelib-styles-container"/>' +
                    '</td>' +
                '</tr></table>'
            ))
            
            $('.stylelib-category-controls > #addBtn', container).click(function() {
                var container = $('<div><input class="stylelib-newcat-input"><button class="stylelib-newcat-add">Добавить</button></div>');
                $(".stylelib-newcat-add", container).click(function() {
                    var newCategory = new LibCategory({
                        id: generateUniqueID(), 
                        title: $(".stylelib-newcat-input", container).val(), 
                        styles: new LibStyleCollection()
                    });
                    
                    $(dialogDiv).dialog('close');
                    
                    actionsManager.addCategoryAction('insert', null, {IdCategory: newCategory.id, Title: newCategory.get('title')}, categoriesCollection.getLastID());
                    
                    categoriesCollection.add(newCategory);
                })
                
                var dialogDiv = showDialog('Новая категория', container[0], {width: 190, height: 60});
            })
            
            $('.stylelib-category-controls > #editBtn', container).click(function() {
                var activeID = categoryView.model.get('activeID');
                var activeCategory = categoriesCollection.get(activeID);
                var container = $('<div><input class="stylelib-editcat-input" value="' + activeCategory.get('title') + '"><button class="stylelib-editcat-add">Изменить</button></div>');
                $(".stylelib-editcat-add", container).click(function() {
                    activeCategory.set('title', $(".stylelib-editcat-input", container).val());
                    $(dialogDiv).dialog('close');
                    
                    actionsManager.addCategoryAction('update', null, {IdCategory: activeCategory.id, Title: activeCategory.get('title')});
                })
                
                var dialogDiv = showDialog('Новая категория', container[0], {width: 190, height: 60});
            })
            
            $('.stylelib-category-controls > #delBtn', container).click(function() {
                var activeID = categoryView.model.get('activeID');
                var activeCategory = categoriesCollection.get(activeID);
                categoriesCollection.remove(activeCategory);
                actionsManager.addCategoryAction('delete', activeID);
            })
            
            $('.stylelib-category-controls > #saveBtn', container).click(function() {
                dataProvider.saveChanges();
            })
            
            var tabsContainer = container.find('#stylelib-styles-tab');
            tabsContainer.tabs();
            
            //controls
            var selectBtn = $('<span class="buttonLink">Выбрать</span>');
            var addBtn    = $('<span class="buttonLink">Добавить</span>');
            var editBtn   = $('<span class="buttonLink">Изменить</span>');
            var deleteBtn = $('<span class="buttonLink">Удалить</span>');
            var controls = $('<div class="stylelib-controls"/>')
                .append(selectBtn, addBtn, editBtn, deleteBtn)
                .appendTo(tabsContainer);
            
            var getActiveStyle = function() {
                var tabIndex = $(tabsContainer).tabs('option', 'selected');
                
                var styleView = styleViews[['POINT', 'LINESTRING', 'POLYGON'][tabIndex]];
                if (!styleView) return null;
                
                var activeID = styleView.model.get('activeID');
                if (!activeID) return null;
                
                var activeCategory = categoriesCollection.get(categoryView.model.get('activeID'));
                
                return activeCategory.get('styles').get(activeID);
            }
                
            selectBtn.click(function() {
                var style = getActiveStyle();
                style && alert('Выбран стиль: ' + style.get('title'));
            })
            
            addBtn.click(function() {
                var tabIndex = $(tabsContainer).tabs('option', 'selected');
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
                            
                            styles.add(newStyle);
                        })
                    }
                })
                
                showEditDialog(newStyle);
            })
            
            editBtn.click(function() {
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
                        }
                    })
                    
                    showEditDialog(style);
                }
            })
            
            deleteBtn.click(function() {
                var style = getActiveStyle();
                
                if (style) {
                    var activeCategory = categoriesCollection.get(categoryView.model.get('activeID'));
                    
                    activeCategory.get('styles').remove(style);
                    actionsManager.addStyleAction('delete', activeCategory.id, style.id);
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
            
            showDialog('Библиотека стилей', container[0], {width: 500, height: 400});
        });
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
})(nsGmx._);