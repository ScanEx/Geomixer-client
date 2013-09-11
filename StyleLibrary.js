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
        }
    });
    
    var LibCategoryCollection = Backbone.Collection.extend({
        model: LibCategory
    });
    
    //test data
    var testStyles = new LibStyleCollection([
        {id: 1, type: 'POINT', title: 'Водяной', style: {}},
        {id: 2, type: 'POINT', title: 'Леший', style: {}},
        {id: 3, type: 'LINESTRING', title: 'Оборотень', style: {}},
        {id: 4, type: 'LINESTRING', title: 'Бес', style: {}},
        {id: 5, type: 'LINESTRING', title: 'Чёрт', style: {}},
        {id: 6, type: 'LINESTRING', title: 'Барабашка', style: {}},
        {id: 7, type: 'LINESTRING', title: 'Кикимора', style: {}},
        {id: 8, type: 'POLYGON', title: 'Вампир', style: {}},
        {id: 9, type: 'POLYGON', title: 'Лесной', style: {}}
    ])
    
    var testCategories = new LibCategoryCollection([
        {id: 1, title: 'Природа', styleIDs: [1, 2, 6]},
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
        
        
        container.empty();
        
        var activeID = this.model.get('activeID');
        categoryCollection.each(function(category) {
            var elem = $('<div/>')
                .text(category.get('title') + ' (' + category.get('styleIDs').length + ')')
                .data('categoryID', category.id)
                .click(function() {
                    _this.model.set('activeID', $(this).data('categoryID'));
                });
            
            container.append(elem);
        })
        
        this.model.on('change:activeID', updateActiveItem);
        updateActiveItem();
    }
    
    var LibStyleView = function(container, style) {
        var styleIcon = $('<div class="stylelib-style-icon-container"/>');
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
            var styleContainer = $('<div class="stylelib-style-container"/>')
                .data('styleID', style.id)
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
        var container = $('<div/>');
        showDialog('Редактирование стиля ' + style.get('title'), container[0], {width: 300, height: 400});
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
                    console.log(style.id, style.get('title'));
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
            style && console.log(style.id, style.get('title'));
        })
        
        deleteBtn.click(function() {
            var activeID = getCurrentStyleID();
            
            if (typeof activeID !== 'undefined') {
                var categoryID = categoryView.model.get('activeID');
                testCategories.get(categoryID).removeStyle(activeID);
            }
        })
        
        editBtn.click(function() {
            var activeID = getCurrentStyleID();
            if (typeof activeID !== 'undefined') {
                showEditDialog(testStyles.get(activeID));
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
        
        showDialog('Библиотека стилей', container[0], {width: 400, height: 220});
    }
    
    gmxCore.addModule('StyleLibrary', {
        showStyleLibraryDialog: showStyleLibraryDialog
    }, {
        css: 'css/StyleLibrary.css'
    })
})(nsGmx._);