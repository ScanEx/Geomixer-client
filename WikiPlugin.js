(function wiki($, oFlashMap){
_translationsHash.addtext("rus", {
	"Статьи" : "Статьи",
	"Искать в видимой области" : "Искать в видимой области",
	"Добавьте объект на карту" : "Добавьте объект на карту",
	"Для подложки" : "Для подложки",
	"Создать статью" : "Создать статью",
	"Статья Wiki" : "Статья Wiki"
});
_translationsHash.addtext("eng", {
	"Статьи" : "Wiki pages",
	"Искать в видимой области" : "Only search in visible area",
	"Для подложки" : "For basemap",
	"Создать статью" : "Create wiki page",
	"Статья Wiki" : "Wiki page"
});

var oWikiDiv = _div();
//Возвращает Ид. карты
var getMapId = function(){
	return oFlashMap.properties.name;
}

/* --------------------------------
 * Function extensions
 * -------------------------------- */
Function.prototype.bind = Function.prototype.bind ||
    function(scope) {
        var fn = this;
        return function() {
            return fn.apply(scope, arguments);
        }
    }

/* --------------------------------
 * jQuery extensions
 * -------------------------------- */
 
var extendJQuery;
extendJQuery = function() { 
    if (typeof $ !== 'undefined') {
        $.getCSS = $.getCSS || function(url) {
            if (document.createStyleSheet) {
                document.createStyleSheet(url);
            } else {
                $("head").append("<link rel='stylesheet' type='text/css' href='" + url + "'>");
            }
        }
    } else {
        setTimeout(extendJQuery, 100);
    }
}
extendJQuery();

var WHOLE_MAP_LAYER_KEY = 'map-scoped';

/* --------------------------------
 * Service to access Wiki
 * -------------------------------- */

WikiService = function(wikiBasePath) {
    this._wikiBasePath = wikiBasePath;
}

WikiService.prototype = {
    getPages: function(callback) {
        this._loadData(this.getWikiLink('GetPages/?mapId=' + getMapId()), callback);
    },

    logon: function(username, password) {
        this._loadData(this.getWikiLink('LogOn/?username=' + username + '&password=' + password));
    },
    
    logoff: function() {
        this._loadData(this.getWikiLink('LogOff/'));
    },

    getWikiLink: function(relativeUrl) {
        return this._wikiBasePath + relativeUrl;
    },
    
    _loadData: function(url, callback) {
        $.ajax({
            url: url+ (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=?',
            dataType: 'json',
            success: function(data) { if (callback) callback('ok', data); }.bind(this),
            error: function() { if (callback) callback('error'); }.bind(this)
        });
    }
}

/* --------------------------------
 * Handles wiki objects on map
 * -------------------------------- */
WikiObjectsHandler = function(map, wikiPlugin) {
    this._map = map;
    this._wikiPlugin = wikiPlugin;
    
    this._objectsCache = [];
	this._pageLayer = map.addObject();
}

WikiObjectsHandler.prototype = {
    createObjects: function(objects) {
        /*if (this._objectsCache.length > 0) {
            //alert('Wiki: Для слоя "' + layer.info.title + '" уже существуют объекты на карте.');
            return;
        }*/
        
		for (var objectIndex = 0; objectIndex < objects.length; ++objectIndex) {
			this._createObject(objects[objectIndex]);
		}
    },

	_createObject: function(pageInfo){
		var mapObject;
		if (pageInfo.LayerID ){
			if (!this._map.layers[pageInfo.LayerID]) {pageInfo.BadLayer = true; return;}
			mapObject = this._map.layers[pageInfo.LayerID].addObject(pageInfo.ObjectsGeometry[0]);
		}
		else{
			mapObject = this._pageLayer.addObject(pageInfo.ObjectsGeometry[0]);
		}
		pageInfo.mapObject = mapObject;
		this._objectsCache.push(mapObject)
		mapObject.enableHoverBalloon(function() { return pageInfo.Title; });
		var clickHandler = this._objectClicked.bind(this);
		mapObject.setHandler("onClick", function() { clickHandler(pageInfo.Id); });
		switch (pageInfo.ObjectsGeometry[0].type) {
			case 'POINT':
				mapObject.setStyle({ marker: { image: (pageInfo.IconUrl ? pageInfo.IconUrl : "img/wiki/page.gif"), center: true }});
				break;
			case 'POLYGON':
				mapObject.setStyle({outline: {color: pageInfo.ObjectsGeometry[0].color, thickness: 1, opacity: 100}, fill: {color: pageInfo.ObjectsGeometry[0].color, opacity: 25}});
				break;
		}
	},
	
    _objectClicked: function(pageId) {
        this._wikiPlugin.showPage(pageId);
    },
        
    removeObjects: function() {
        if (this._objectsCache.length == 0) return;
        for (var objectIndex = 0; objectIndex < this._objectsCache.length; ++objectIndex) {
            this._objectsCache[objectIndex].remove();
        }
        this._objectsCache = [];
    },
	
	setObjectsVisibility: function(isVisible) {
        this[isVisible ? 'showObjects' : 'hideObjects']();
    },
    
    showObjects: function() {
		for (var objectIndex = 0; objectIndex < this._objectsCache.length; ++objectIndex) {
			this._objectsCache[objectIndex].setVisible(true);
		}
    },
    
    hideObjects: function() {
        for (var objectIndex = 0; objectIndex < this._objectsCache.length; ++objectIndex) {
            this._objectsCache[objectIndex].setVisible(false);
        }
    }
}

/* --------------------------------
 * Wiki Wizard dialog
 * -------------------------------- */
WikiWizardDialog = function() {
    this._view = null;
    
    this._wizardStep = 0;
    this._stepsData = null;
    this._onClose = null;
    this._onCancel = null;
    
    this._initialize();
}
 
WikiWizardDialog.prototype = {
    _initialize: function() {
        this._view = $('<div style="display:none"><div class="content"></div><div class="cancel-button">' + _gtxt("Отмена") + '</div><div class="skip-button">' + _gtxt("Пропустить") + '</div><div class="clear"></div></div>').appendTo($('body'));
        this._view.find('.cancel-button').click(this._cancel.bind(this));
        this._view.find('.skip-button').click(this._skip.bind(this)).hide();
        var that = this;
        this._view.dialog({
		    autoOpen: false,
		    dialogClass: "wiki-wizard-dialog",
		    closeOnEscape: false,
		    draggable: false,
		    width: 200,
		    height: 40,
		    minHeight: 40,
		    modal: false,
		    buttons: {},
		    resizable: false,
		    open: function() {
			    // strange issue in IE9-QuirkMode and FF 4
		        that._view.removeAttr('style');
		    },
		    close: function() {
			    that._wizardStep = 0;
			    that.set_skipButtonVisibility(false);
			    that._stepsData = null;
			    if (that._onClose) that._onClose();
		    }
	    });
    },
    
    open: function(title, content, position) {
        this._stepsData = {};
        this.setStep(title, content, position);
	    this._view.dialog('open');
    },
    
    setStep: function(title, content, position, previousStepData) {
        if (previousStepData) this._stepsData[this._wizardStep] = previousStepData;
        ++this._wizardStep;
        this._view.find('div.content').html(content);
        this._view.dialog('option', 'position', position);
        this._view.dialog('option', 'title', title);
    },
    
    get_CurrentStep: function() {
        return this._wizardStep;
    },
    
    get_StepData: function(stepIndex) {
        return this._stepsData ? this._stepsData[stepIndex] : null;
    },
    
    set_onClose: function(handler) {
        this._onClose = handler;
    },
    set_onCancel: function(handler) {
        this._onCancel = handler;
    },
    set_onSkip: function(handler) {
        this._onSkip = handler;
    },
    
    set_skipButtonText: function(text) {
        this._view.find('.skip-button').html(text);
    },
    set_skipButtonVisibility: function(isVisible) {
        this._view.find('.skip-button')[isVisible ? 'show' : 'hide']();
    },
    
    _cancel: function() {
        if (this._onCancel) this._onCancel();
        this.close();
    },
    
    _skip: function() {
        if (this._onSkip) this._onSkip();
    },
    
    close: function() {
        this._view.dialog('close');
    }
}

WikiFilter = function(oContainer){
	this._container = oContainer;
	this._input = _input(null);
	this._list = _div(null, [['dir', 'className', 'wiki-filter-canvas']]);
	this._checkExtent = _checkbox(false, 'checkbox');
	this._checkExtent.id = 'wiki-filter-area-checkbox';
	this.pagesCache=[];
	
	this._initialize();
}

WikiFilter.prototype = {
	_initialize: function(){
		var _this = this;
		var label = _label([_t(_gtxt("Искать в видимой области"))], [['attr', 'for', 'wiki-filter-area-checkbox']]);
		var table = _table([_tbody([_tr([_td([this._input]), _td([this._checkExtent]), _td([label])])])], [['dir', 'className', 'wiki-filter-input']]);
		$(this._container).append(table);
		//$(this._container).append(_span([])], [['css', 'margin-top', '10px']]));
		$(this._container).append(this._list);
		var fnFilter = function(){ return _this.filter();}
		this._checkExtent.onclick = function(){ 
			if (this.checked) {
				oFlashMap.setHandler("onMove", fnFilter);
			}
			else{
				oFlashMap.removeHandler("onMove", fnFilter);
			}
			return _this.filter();
		};
		this._input.onkeyup = fnFilter;
	},
	filter: function(){
		var _this = this;
		var sFilter = new RegExp(this._input.value, "i");
		removeChilds(this._list);
		var arrTopicsLI = {};
		for(var i=0; i<this.pagesCache.length; i++){
			var page = this.pagesCache[i];
			var layerOK = !page.BadLayer && (!page.LayerID || oFlashMap.layers[page.LayerID].isVisible)
			var extentOK = !this._checkExtent.checked || boundsIntersect(getBounds(page.ObjectsGeometry[0].coordinates), oFlashMap.getVisibleExtent());
			if ( layerOK && extentOK && (!sFilter || page.TopicName.match(sFilter) || page.Title.match(sFilter))){
				if (!arrTopicsLI[page.TopicName]){
					arrTopicsLI[page.TopicName]=_li([_div([_span([_t(page.TopicName)], [['dir', 'className', 'wiki-filter-topic']])])]);
					$(this._list).append(_ul([arrTopicsLI[page.TopicName]]));
				}
				var oPageRow = _span([_t(page.Title)], [['dir', 'className', 'wiki-filter-page']]);
				oPageRow.PageInfo = page;
				oPageRow.onclick = function(){
					oFlashMap.setMinMaxZoom(1, 13);
					var oExtent = getBounds(this.PageInfo.ObjectsGeometry[0].coordinates);
					oFlashMap.zoomToExtent(oExtent.minX, oExtent.minY, oExtent.maxX, oExtent.maxY);
					oFlashMap.setMinMaxZoom(1, 17);
				}
				$(arrTopicsLI[page.TopicName]).append(_ul([oPageRow]));
			}
		}
		$(this._list).treeview();
	}
}

/* --------------------------------
 * Plug-in for Wiki integration
 * -------------------------------- */
WikiPlugin = function() {
    this._wikiService = null;
    this._wikiObjects = null;
    this._pagesCache = [];
    this._map = null;
	
    this._treeView = null;
	this._uiWikiButton = null;
    
    this._wizardButton = null;
    this._wizardDialog = null;
    this._filter = null;
}

WikiPlugin.prototype = {
    initialize: function(map) {
        $.getCSS('WikiPlugin.css');
		this._map = map;
        this._wikiService = //new WikiService('http://dev2.kosmosnimki.ru/GeoMixer/');
                            new WikiService('http://localhost:3017/GeoMixer/');
        this._wikiObjects = new WikiObjectsHandler(this._map, this);
        this._syncWikiLogin();
        
        this._attachWizard();
		this._attachTreeEvents();
        this._attachDrawingObjectsEvents();
        this._treeView = $('ul.treeview');
		this._filter = new WikiFilter(oWikiDiv);
		this._updatePages();
    },
    
	createPage: function(layerID){
		if (this._wizardDialog.get_CurrentStep() > 0) return;
		this._wizardDialog.layerID = layerID;
		this._wizardButton.addClass('disabled');
		this._wizardDialog.open('Шаг 1 из 1', _gtxt('Добавьте объект на карту'), [400, 240]);
	},
	
    _syncWikiLogin: function() {
        if (this._isUserLoggedIn())
            this._wikiService.logon('geomixeruser', 'geomixer315MANAGER');
        else
            this._wikiService.logoff();
    },
    
    _isUserLoggedIn: function() {
        return !!userInfo().Login;
    },
    
    _attachWizard: function() {
        var clickFunction;
        if (this._isUserLoggedIn()) {
            this._wizardDialog = new WikiWizardDialog();
            this._wizardDialog.set_onClose(this._wizardClosed.bind(this));
            this._wizardDialog.set_onCancel(this._wizardCanceled.bind(this));
            this._wizardDialog.set_skipButtonText(_gtxt('Для подложки'));
            this._wizardDialog.set_onSkip(function() {
                    this._createPage(_mapHelper.mapTree.properties.name, WHOLE_MAP_LAYER_KEY, this._wizardDialog.get_StepData(1));
                    this._wizardDialog.close();
                }.bind(this));
            clickFunction = function() {
                    if (this._wizardDialog.get_CurrentStep() > 0) return;
                    this._wizardButton.addClass('disabled');
                    this._wizardDialog.open('Шаг 1 из 2', _gtxt('Добавьте объект на карту'), [400, 240]);
                }.bind(this);
        } else {
            clickFunction = function() { $('.loginCanvas div.log span.buttonLink').click(); };
        }
        
        this._wizardButton = $('<span class="wiki-wizard-button">' + _gtxt("Создать статью") + '</span>').click(clickFunction);
        $(oWikiDiv).append(
            $('<div class="wiki-wizard-button"></div>').append(this._wizardButton)
        );
    },
    
    _wizardClosed: function() {
        this._wizardButton.removeClass('disabled');
    },
    
    _wizardCanceled: function() {
        if (this._wizardDialog.get_CurrentStep() == 2) {
            this._wizardDialog.get_StepData(1).remove();
        }
    },
   
    /* #region: queryDrawingObjects overrides */
   
    _attachDrawingObjectsEvents: function() {
        if (!this._isUserLoggedIn()) return;
    
        // Fix objects created before plugin started, e.g. from permalink
        this._map.drawing.forEachObject(function(drawingObject) {
            this._onDrawingObjectAdded(drawingObject);
        }.bind(this));
    
        this._map.drawing.setHandlers({
		    onAdd: this._onDrawingObjectAdded.bind(this)
		});
    },
    
    _onDrawingObjectAdded: function(elem) {
        if (elem.geometry.type != 'POINT' &&
            elem.geometry.type != 'POLYGON') return;
            
        if (this._wizardDialog.get_CurrentStep() == 1) {
			if (this._wizardDialog.layerID){
				this._createPage(getMapId(), this._wizardDialog.layerID, elem);
				this._wizardDialog.close();
			}
			else{
				$(elem.canvas).find('img.remove').hide();
				this._wizardDialog.set_skipButtonVisibility(true);
				this._wizardDialog.setStep('Шаг 2 из 2', 'Выберите слой', [365, 350], elem);
			}
            return;
        }
        
        $(elem.canvas).find('div.item')
            .data('drawingObject', elem)
            .draggable({
                addClasses: false,
                appendTo: 'body',
                scope: 'drawingObjects',
                helper: 'clone'
            }) 
            [0].onselectstart = function() { return false; };
    },
    
    /* #endregion:  */
            
	_attachTreeEvents: function() {
        var that = this;
        
        /*var oldDrawLayer = layersTree.prototype.drawLayer;
        layersTree.prototype.drawLayer = function(elem, parentParams, layerManagerFlag, parentVisibility) {
            var elements = (oldDrawLayer.bind(this))(elem, parentParams, layerManagerFlag, parentVisibility);
            that._onDrawLayer(elem, $(elements[elements.length -3]));
            return elements;
        };*/
        
        var oldLayerVisible = layersTree.prototype.layerVisible;
        layersTree.prototype.layerVisible = function(box, flag) {
            (oldLayerVisible.bind(this))(box, flag);
            var layerInfo = box.parentNode.properties.content.properties;
            
            if (that._wizardDialog && that._wizardDialog.get_CurrentStep() == 2) {
                that._createPage(getMapId(), layerInfo.name,
                                    that._wizardDialog.get_StepData(1));
                that._wizardDialog.close();
            }
			else{
				that._filter.filter();
			}
        }
        /*
        var oldUpdateChildLayersMapVisibility = layersTree.prototype.updateChildLayersMapVisibility;
        layersTree.prototype.updateChildLayersMapVisibility = function(div) {
            that._onUpdateChildLayersMapVisibility(div);
            (oldUpdateChildLayersMapVisibility.bind(this))(div);
        }*/
    },
	
    showPage: function(pageId) {
        this._openDialog('Preview/' + pageId + '?mapId=' + getMapId(),
            function() {
                this._updatePages();
            }.bind(this)
        );
    },
    
    _createPage: function(mapId, layerId, drawingObject) {
        var objectsGeometry = [ this._getObjectGeometry(drawingObject) ];
        drawingObject.remove();
        
        this._openDialog('Create/?mapId=' + mapId + 
                            (layerId != WHOLE_MAP_LAYER_KEY ? '&layerId=' + layerId : '') + 
                            '&objectsGeometry=' + encodeURIComponent(JSON.stringify(objectsGeometry)),
            function() {
                this._updatePages();
            }.bind(this)
        );
    },
    
    _getObjectGeometry: function(drawingObject) {
        var geometry = drawingObject.geometry;
        if (geometry.type == 'POLYGON') geometry.color = drawingObject.getStyle().regular.outline.color;
        return geometry;
    },
	
	_ensureWikiButton: function() {
        if (!this._pagesCache || !this._pagesCache.length) return;        
        if (!this._uiWikiButton) {
            this._uiWikiButton = $('<div class="wiki-button" title="Показать/скрыть статьи Wiki на карте" />')
                .addClass('page-button-on')
                .click(function() { this._toggleWikiObjectsVisibility(); }.bind(this));
        }
        this._treeView.find('div[mapid="' + this._map.properties.MapID + '"] div:first').append(this._uiWikiButton);
    },
    
    _toggleWikiObjectsVisibility: function() {
        this._wikiObjects.setObjectsVisibility( 
            this._isWikiButtonOn(this._uiWikiButton.toggleClass('page-button-on').toggleClass('page-button-off'))
        );
    },
	
	_setWikiButtonState: function(button, isOn) {
        if (!button) return;
        button.removeClass('page-button-on page-button-off').addClass('page-button-' + (isOn ? 'on' : 'off'));
    },
    
    _isWikiButtonOn: function(button) {
        return button && button.length && button.hasClass('page-button-on');
    },
    
    _updatePages: function() {
		var _this = this;
		var objects = this._wikiObjects;
        objects.removeObjects();
		
        this._wikiService.getPages(function(status, data){
			if (status != 'ok') {
				// Something went wrong
				_this._pagesCache = [];
				return;
			}
			data.sort(function (page_a, page_b){
				if (page_a == null || page_a == null) return 0;
				if (page_a.TopicName > page_b.TopicName)
					return 1;
				if (page_a.TopicName < page_b.TopicNamey)
					return -1;
				if (page_a.Title > page_b.Title )
					return 1;
				if (page_a.Title  < page_b.Title )
					return -1;
				return 0;
			});
			_this._pagesCache = data;
			for (var index = 0; index < _this._pagesCache.length; ++index) {
				_this._pagesCache[index].ObjectsGeometry = JSON.parse(_this._pagesCache[index].ObjectsGeometry);
			}

			objects.createObjects(_this._pagesCache);
			
			_this._filter.pagesCache = _this._pagesCache;
			_this._filter.filter();
			
			_this._ensureWikiButton();
		});
    },
    
    _openDialog: function(src, onClose) {
        var frame = newElement('iframe');
        frame.src = this._wikiService.getWikiLink(src);
        frame.frameBorder = 0;
        frame.style.width = '100%';
        frame.style.height = '100%';
        showDialog(_gtxt('Статья Wiki'), frame, 620, 400, 0, 0, null, function() { if (onClose) onClose(); }); 
    }
}
var oWiki = new WikiPlugin();
var oWikiLeftMenu = new leftMenu();
var loadMenu = function(){
	var alreadyLoaded = oWikiLeftMenu.createWorkCanvas("wiki", unloadMenu);
	$(oWikiLeftMenu.workCanvas).after(oWikiDiv)
}

var unloadMenu = function(){
}

var beforeViewer = function(){
	_layersTree.addContextMenuElem({
		getTitle: function()
		{
			return _gtxt("Создать статью");
		},
		isVisible: function(layerManagerFlag, elem)
		{
			return userInfo().Login;
		},
		isSeparatorBefore: function(layerManagerFlag, elem)
		{
			return true;
		},
		clickCallback: function(elem, tree, area)
		{
			oWiki.createPage(elem.name);
		}
	});
}

var afterViewer = function(){
	oWiki.initialize(oFlashMap);
}

var addMenuItems = function(upMenu){
	
	return [{item: {id:'wiki', title:_gtxt('Статьи'),onsel:loadMenu, onunsel:unloadMenu},
			parentID: 'viewMenu'}];
}
 
var publicInterface = {
	beforeViewer: beforeViewer,
	afterViewer: afterViewer,
	addMenuItems: addMenuItems
}

gmxCore.addModule("wiki", publicInterface);

})(jQuery, globalFlashMap)