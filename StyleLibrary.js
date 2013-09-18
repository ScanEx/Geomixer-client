(function(_) {

    //Data models
    var LibStyle = Backbone.Model.extend({

    });
    
    var LibStyleCollection = Backbone.Collection.extend({
        model: LibStyle
    })
    
    var LibCategory = Backbone.Model.extend({
        removeStyle: function(styleID) {
            var styleIDs = this.attributes.styleIDs;
            var newStyleIDs = _.without(styleIDs, styleID);
            
            if (newStyleIDs.length !== styleIDs.length) {
                this.set('styleIDs', newStyleIDs);
            }
        },
        addStyle: function(style) {
            var id = typeof style.id !== 'undefined' ? style.id : style.cid;
            if (_.indexOf(this.attributes.styleIDs, id) == -1) {
                var newStyles = this.attributes.styleIDs.splice(0);
                newStyles.push(id);
                this.set('styleIDs', newStyles);
            }
        }
    });
    
    var LibCategoryCollection = Backbone.Collection.extend({
        model: LibCategory
    });
    
    //test data
    var testStyles = new LibStyleCollection([
        {id: 1, type: 'POINT',      title: 'Водяной',   style: {marker: {size: 3}, outline: {color: 0xffff00, thickness: 2}}},
        {id: 2, type: 'POINT',      title: 'Леший',     style: {marker: {image: 'http://maps.kosmosnimki.ru/api/img/favicon16x16_sample6.png'}}},
        
        {id: 3, type: 'LINESTRING', title: 'Оборотень', style: {outline: {color: 0xff00ff, thickness: 10}}},
        {id: 4, type: 'LINESTRING', title: 'Бес',       style: {marker: {image: 'http://maps.kosmosnimki.ru/api/img/favicon16x16_sample6.png'}}},
        {id: 5, type: 'LINESTRING', title: 'Чёрт',      style: {}},
        {id: 6, type: 'LINESTRING', title: 'Барабашка', style: {outline: {color: 0xffff00}}},
        {id: 7, type: 'LINESTRING', title: 'Кикимора',  style: {}},
        
        {id: 8, type: 'POLYGON',    title: 'Вампир',    style: {fill: {color: 0xaaaaaa}, outline: {color: 0x00ff00}}},
        {id: 9, type: 'POLYGON',    title: 'Лесной',    style: {fill: {color: 0x444444}}}
    ])
    
    var testCategories = new LibCategoryCollection([
        {id: 1, title: 'Природа', styleIDs: [1, 2, 4, 6]},
        {id: 2, title: 'Домашние', styleIDs: [3, 4, 5]},
        {id: 3, title: 'Злые', styleIDs: [1, 2, 3, 4, 5, 6, 7, 8, 9]},
        {id: 4, title: 'Добрые', styleIDs: [9]}
    ])
    
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
                    return $('<div/>')
                        .append(
                            $('<span/>').text(category.get('title')),
                            $('<span class="stylelib-category-count"/>').text('(' + category.get('styleIDs').length + ')')
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
                style.set('style', styleClone);
                $(dialogDiv).dialog('close');
            })
            
            createStyleEditor(styleContainer[0], styleClone, style.get('type').toLowerCase());
            var dialogDiv = showDialog('Редактирование стиля ' + style.get('title'), container[0], {width: 300, height: 300});
        })
    }
    
    //main public function
    var showStyleLibraryDialog = function() {
    
        var drawCategoryStyles = function() {
            var categoryID = categoryView.model.get('activeID');
            var styleIDs = testCategories.get(categoryID).get('styleIDs');
            
            var categoryStyleCollection = new LibStyleCollection(_.map(styleIDs, function(id) {return testStyles.get(id)}));
            
            _.each(styleContainers, function(container, type) {
                var view = new LibStyleCollectionView(container, categoryStyleCollection, type);
                $(view).bind('select', function(event, style) {
                    //console.log(style.id, style.get('title'));
                    style && alert('Выбран стиль: ' + style.get('title'));
                })
                
                styleViews[type] = view;
            })
        }
        
        var container = $('<div/>');
        
        container.append($(
            '<table class="stylelib-main-table"><tr>' + 
                '<td class="stylelib-category-container"></td>' +
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
            
        var getCurrentStyleID = function() {
            var tabIndex = $(tabsContainer).tabs('option', 'selected');
            var styleView = styleViews[['POINT', 'LINESTRING', 'POLYGON'][tabIndex]];
            return styleView.model.get('activeID');
        }
            
        selectBtn.click(function() {
            var activeID = getCurrentStyleID();
            var style = testStyles.get(activeID);
            style && alert('Выбран стиль: ' + style.get('title'));
            //style && console.log(style.id, style.get('title'));
        })
        
        addBtn.click(function() {
            var tabIndex = $(tabsContainer).tabs('option', 'selected');
            var type = ['POINT', 'LINESTRING', 'POLYGON'][tabIndex],
                styleView = styleViews[type];
            var newStyle = new LibStyle({
                title: '',
                style: {},
                type: type
            });
            
            newStyle.on('change', function() {
                var categoryID = categoryView.model.get('activeID');
                testStyles.add(newStyle);
                testCategories.get(categoryID).addStyle(newStyle);
            })
            
            showEditDialog(newStyle);
        })
        
        editBtn.click(function() {
            var activeID = getCurrentStyleID();
            if (typeof activeID !== 'undefined') {
                showEditDialog(testStyles.get(activeID));
            }
        })
        
        deleteBtn.click(function() {
            var activeID = getCurrentStyleID();
            
            if (typeof activeID !== 'undefined') {
                var categoryID = categoryView.model.get('activeID');
                testCategories.get(categoryID).removeStyle(activeID);
            }
        })
        
        var styleContainers = {
            POINT:      container.find('#stylelib-markers-container'),
            LINESTRING: container.find('#stylelib-lines-container'),
            POLYGON:    container.find('#stylelib-polygons-container')
        };
        
        var categoryView = new LibCategoryView(container.find('.stylelib-category-container'), testCategories);
        
        categoryView.model.on('change', drawCategoryStyles);
        testCategories.on('change:styleIDs', drawCategoryStyles);
        drawCategoryStyles();
        
        showDialog('Библиотека стилей', container[0], {width: 500, height: 400});
    }
    
    gmxCore.addModule('StyleLibrary', {
        showStyleLibraryDialog: showStyleLibraryDialog,
        //интерфейс для подключения как плагин
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