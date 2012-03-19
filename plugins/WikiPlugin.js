/** 
* @name Wiki
* @namespace Предоставляет возможность написания сообщений
* @description Предоставляет возможность написания сообщений
*/
(function wiki($, oFlashMap){

var pluginPath = null;
var oWiki;

_translationsHash.addtext("rus", {
	"Сообщение" : "Сообщение",
	"Сообщения" : "Сообщения",
	"Искать в видимой области" : "Искать в видимой области",
	"Добавьте объект на карту" : "Добавьте объект на карту",
	"Для подложки" : "Для подложки",
	"Создать сообщение" : "Создать сообщение",
	"Статья Wiki" : "Статья Wiki",
	"Заголовок" : "Заголовок",
	"Сообщение уже редактируется": "Сообщение уже редактируется",
	"Щелкните по слою в дереве слоёв, чтобы выбрать его": "Щелкните по слою в дереве слоёв, чтобы выбрать его",
	"Вы действительно хотите удалить это сообщение?" : "Вы действительно хотите удалить это сообщение?",
	"Удалить привязку к слою": "Удалить привязку к слою",
	"Для привязки сообщения к карте нужно добавить новый объект: точку или многоугольник": "Для привязки сообщения к карте нужно добавить новый объект: точку или многоугольник",
	"Объект не выбран": "Объект не выбран",
	"Объект для привязки: ": "Объект для привязки: ",
	"Поделиться": "Поделиться"
});
_translationsHash.addtext("eng", {
	"Сообщение" : "Message",
	"Сообщения" : "Messages",
	"Искать в видимой области" : "Only search in visible area",
	"Добавьте объект на карту" : "Add object on map",
	"Для подложки" : "For basemap",
	"Создать сообщение" : "Create message",
	"Статья Wiki" : "Wiki page",
	"Заголовок" : "Title",
	"Сообщение уже редактируется": "Message editor is already open",
	"Щелкните по слою в дереве слоёв, чтобы выбрать его": "Click layer to choose it",
	"Вы действительно хотите удалить это сообщение?" : "Do you really want to delete the selected message?",
	"Удалить привязку к слою": "Delete layer reference",
	"Для привязки сообщения к карте нужно добавить новый объект: точку или многоугольник": "Add new point or rectangle to create a message",
	"Объект не выбран": "Nothing selected",
	"Объект для привязки: ": "Message object: ",
	"Поделиться": "Share"
});

/**Контейнер меню (или диалога сообщений), содержащий список сообщений и кнопку "Создать сообщение"
 @memberOf Wiki*/
var oWikiDiv = _div(null, [['attr', 'Title', _gtxt("Сообщения")]]);

var oDrawingObjectsModule = null;

gmxCore.addModulesCallback(["DrawingObjects"], function(){
	oDrawingObjectsModule = gmxCore.getModule("DrawingObjects");
});

/**Возвращает Ид. карты
 @memberOf Wiki*/
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

/** Конструктор
 @class Предоставляет методы общения с сервером сообщений
 @memberOf Wiki
 @param {string} wikiBasePath Путь к серверу сообщений
*/
WikiService = function(wikiBasePath) {
    this._wikiBasePath = wikiBasePath;
}

WikiService.prototype = {

	/**Возвращает список страниц*/
    getPages: function(callback) {
        this._loadData(this.getWikiLink('GetMessages.ashx?MapName=' + getMapId()), callback);
    },
	/**Возвращает адрес серверного скрипта*/
    getWikiLink: function(relativeUrl) {
        return this._wikiBasePath + relativeUrl;
    },
    
	/**Сохраняет страницу*/
	updatePage: function(pageInfo, callback){
		var _data = {WrapStyle: 'window'
				, MessageID: pageInfo.MessageID.toString()
				, Title: pageInfo.Title
				, Content: pageInfo.Content
				, MapName: pageInfo.MapName
				, LayerName: pageInfo.LayerName
				, Geometry: JSON.stringify(pageInfo.Geometry)
				, AuthorNickname: pageInfo.AuthorNickname
				, IsDeleted: pageInfo.IsDeleted
		};
			
		sendCrossDomainPostRequest(this.getWikiLink('UpdateMessage.ashx'), _data, function(data) { if (parseResponse(data) && callback) callback(data); });
	},
	/**Загружает данные для списка страниц*/
    _loadData: function(url, callback) {
        $.ajax({
            url: url+ (url.indexOf('?') >= 0 ? '&' : '?') + 'callbackName=?',
            dataType: 'json',
            success: function(data) { if (parseResponse(data) && callback) callback('ok', data); }.bind(this),
            error: function() { if (callback) callback('error'); }.bind(this)
        });
    }
}

var bShareModuleLoaded = false;

var addthis_config = {
	pubid: "ra-4eeb41dd008d5d93",
	domready: true,
	ui_language: _translationsHash.getLanguage().substr(0,2)
};

var ActiveMessageID = null;
_mapHelper.customParamsManager.addProvider({
	name: 'WikiPlugin',
	loadState: function(state) { 
		if(state) oWiki.showPage(state); 
	},
	saveState: function() { 
		return ActiveMessageID; 
	}
});

var fnShare = function(pageInfo, container){
	var fnRenderShare = function(){
		var btnShare = makeLinkButton(_gtxt('Поделиться'));
		_(container, [btnShare]);
		btnShare.onclick = function(){
			ActiveMessageID = pageInfo.MessageID;
			hide(btnShare);
			_mapHelper.createPermalink(function(id){
				ActiveMessageID = null;
				var toolbox = _div(null, [['attr', 'class', 'addthis_toolbox addthis_default_style']]);
				var getButton = function(buttonName){
					return _a(null, [['attr', 'class', 'addthis_button_' + buttonName]]);
				}
				_(toolbox, [getButton('facebook'), getButton('twitter'), getButton('vk'), getButton('odnoklassniki_ru'), getButton('compact')]);
				_(container, [toolbox]);
				
				addthis.toolbox(toolbox, {}, {
					title: pageInfo.Title,
					url_transforms : { add: {permalink: id}}
					});
			});
		}
	};
	
	if (!bShareModuleLoaded){
				   //http://s7.addthis.com/js/300/addthis_widget.js#pubid=ra-4eeb41dd008d5d93
		$LAB.script("http://s7.addthis.com/js/300/addthis_widget.js#pubid=ra-4eeb41dd008d5d93").wait(function(){
			addthis.init();
			fnRenderShare();
			bShareModuleLoaded = true;
		});
	}
	else{
		fnRenderShare();
	}
}

	
/** Конструктор
 @class Класс, обеспечивающий отображение сообщений на карте
 @memberOf Wiki
 @param {object} map Карта, на которой отображать сообщения
 @param {object} wikiPlugin Плагин - основной класс
*/
WikiObjectsHandler = function(map, wikiPlugin) {
    this._map = map;
    this._wikiPlugin = wikiPlugin;
    
    this._objectsCache = {};
	this._pageLayer = map.addObject();
}

WikiObjectsHandler.prototype = {
	/**Рисует объекты на карте*/
    createObjects: function(objects) {
        
		for (var objectIndex = 0; objectIndex < objects.length; ++objectIndex) {
			this._createObject(objects[objectIndex]);
		}
    },

	/**Рисует объект на карте*/
	_createObject: function(pageInfo){
		var mapObject;
		if (pageInfo.LayerName && !this._map.layers[pageInfo.LayerName]){pageInfo.BadLayer = true; return;}

		if (!this._objectsCache[pageInfo.LayerName]) {
			this._objectsCache[pageInfo.LayerName] = this._pageLayer.addObject();
			if(pageInfo.LayerName) this._objectsCache[pageInfo.LayerName].setVisible(this._map.layers[pageInfo.LayerName].isVisible); 
		}
		mapObject = this._objectsCache[pageInfo.LayerName].addObject(pageInfo.Geometry);
		pageInfo.mapObject = mapObject;
		mapObject.enableHoverBalloon(this._getBaloon(pageInfo));
		switch (pageInfo.Geometry.type) {
			case 'POINT':
				mapObject.setStyle({ marker: { image: (pageInfo.IconUrl ? pageInfo.IconUrl : pluginPath + "img/wiki/page.gif"), center: true }});
				break;
			case 'POLYGON':
				mapObject.setStyle({outline: {thickness: 2, opacity: 100}});
				break;
		}
	},
	
	/** Отображает балун с сообщением*/
	showPage: function(pageInfo){
		if (!pageInfo) return;
		
		var coords = pageInfo.Geometry.coordinates;
		var balloon = this._map.addBalloon();
		balloon.setPoint(coords[0], coords[1]);
		this._getBaloon(pageInfo)(null, balloon.div);
		balloon.resize();
	},
	
	/**Возвращает функцию для отображения балуна к статье*/
	_getBaloon: function(pageInfo){
		var _this = this;
		return function(attr, div) { 
					var divEdit = _div();
					if (nsGmx.AuthManager.getNickname() == pageInfo.AuthorNickname || nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN)){
						var btnEdit = makeLinkButton(_gtxt("Редактировать"));
						var btnDelete = makeLinkButton(_gtxt("Удалить"));
						btnEdit.onclick = function() {_this._wikiPlugin.openEditor(pageInfo); _this._map.balloonClassObject.hideHoverBalloons(); }
						btnDelete.onclick = function() {
							if (confirm(_gtxt("Вы действительно хотите удалить это сообщение?"))){
								_this._wikiPlugin.deletePage(pageInfo); 
								_this._map.balloonClassObject.hideHoverBalloons(); 
							}
						}
						_(divEdit, [btnEdit, _t(" "), btnDelete]);
					};
					var divTitle = _div([_t(pageInfo.Title)], [['dir', 'className', 'wiki-message-title']]);
					var divContent = _div();
					divContent.innerHTML = pageInfo.Content;
					var divBaloon = _div([divTitle, divContent, divEdit]);
					
					removeChilds(div); 
					fnShare(pageInfo, divBaloon);
					
					_(div, [divBaloon]);
					return {}; 
				};
	},
	
	/**Удаляет все объекты с карты*/	
    removeObjects: function() {
        if (this._objectsCache.length == 0) return;
        for (var layerName in this._objectsCache) {
            this._objectsCache[layerName].remove();
        }
        this._objectsCache = {};
    },
	
	/**Устанавливает видимость всех объектов*/	
	setObjectsVisibility: function(isVisible) {
        this._pageLayer.setVisible(isVisible);
    },
    
	/**Устанавливает видимость объектов определённого слоя*/	
	setLayerVisible: function(layerName, isVisible){
		this._objectsCache[layerName] && this._objectsCache[layerName].setVisible(isVisible);
	}
}

/** Конструктор
 @class Класс, обеспечивающий отображение сообщений на карте
 @memberOf Wiki
 @param {object} oContainer Контейнер, содежащий все элементы этого класса
*/
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
	/**Отрисовка всех элементов пользовательского интерфейса*/	
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
				_this._moveListenerId = oFlashMap.addListener("positionChanged", fnFilter);
			}
			else{
				if (typeof _this._moveListenerId !== 'undefined')
                    oFlashMap.removeHandler("positionChanged", _this._moveListenerId);
			}
			return _this.filter();
		};
		this._input.onkeyup = fnFilter;
	},
	/**Отрисовка списка сообщений, удовлетворяющих фильтру, который задал пользователь*/
	filter: function(){
		var _this = this;
		var sFilter = new RegExp(this._input.value, "i");
		removeChilds(this._list);
		for(var i=0; i<this.pagesCache.length; i++){
			var page = this.pagesCache[i];
			var layerOK = !page.BadLayer && (!page.LayerID || oFlashMap.layers[page.LayerID].isVisible)
			var extentOK = !this._checkExtent.checked || boundsIntersect(getBounds(page.Geometry.coordinates), oFlashMap.getVisibleExtent());
			if ( layerOK && extentOK && (!sFilter || page.Title.match(sFilter))){
				var oPageRow = _span([_t(page.Title)], [['dir', 'className', 'wiki-filter-page']]);
				oPageRow.PageInfo = page;
				oPageRow.onclick = function(){
					oFlashMap.setMinMaxZoom(1, 13);
					var oExtent = getBounds(this.PageInfo.Geometry.coordinates);
					oFlashMap.zoomToExtent(oExtent.minX, oExtent.minY, oExtent.maxX, oExtent.maxY);
					oFlashMap.setMinMaxZoom(1, 17);
				}
				$(this._list).append(_ul([oPageRow]));
			}
		}
		$(this._list).treeview();
	}
}

//Необходимо для того, чтобы дополнительные скрипты tiny_mce загружались
window.tinyMCEPreInit = {
	base: getAPIHostRoot() + '/api/plugins/tiny_mce', 
	suffix : '', 
	query : ''
};      
var _wikiFileBrowser = null;

var tinyMCELoaded = false;
/** Инициализирует tiny_mce
 @memberOf Wiki
 @param {string} target id объекта для преобразования в tiny_mce editor
 */
var InitEditor = function(target) {
	var sFolder = nsGmx.AuthManager.getUserFolder() + '\\images';

	if (!window.WikiFileBrowser_open){

		window.WikiFileBrowser_open = function(field_name, url, type, win){
			_wikiFileBrowser = new fileBrowser();
			
			sendCrossDomainJSONRequest(getAPIHostRoot() + 'FileBrowser/CreateFolder.ashx?WrapStyle=func&FullName=' + sFolder, function(response){
				if (!parseResponse(response))
					return;
				
				_wikiFileBrowser.currentDir = sFolder;
				
				var oDialog = _wikiFileBrowser.createBrowser(_gtxt("Файл"), ['jpeg', 'jpg', 'tif', 'png', 'img', 'gif', 'bmp'], function(path){ 
					win.document.getElementById(field_name).value = getAPIHostRoot() + "GetImage.ashx?usr=" + nsGmx.AuthManager.getNickname() + "&img=" + path;  
				});
				
			});
		}
	}
	
	var applyChromeBugfix = function(){
		if (jQuery.browser.webkit){
				document.getElementById('message_content_parent').style.display = 'block';
				document.getElementById('message_content_parent').style.height = '100%'
		}
	}
	
    var options = {
        language : _translationsHash.getLanguage().substr(0,2),
        mode: 'exact',
        theme: 'advanced',
		skin : "o2k7",
        elements: target,
        //relative_urls : false,
        
		dialog_type: "window",
		
        theme_advanced_buttons1 : "bold,italic,underline,|,justifyleft,justifycenter,justifyright,justifyfull,|,formatselect,fontselect,fontsizeselect,|,bullist,numlist,|,outdent,indent,|,undo,redo,|,link,image,cleanup,help,code",
        theme_advanced_buttons2 : "", // "bullist,numlist,|,outdent,indent,|,undo,redo,|,link,unlink,anchor,image,cleanup,help,code",
        theme_advanced_buttons3 : "", //"hr,removeformat,visualaid,|,sub,sup,|,charmap",
        theme_advanced_toolbar_location : "top",
        theme_advanced_toolbar_align : "left",
        theme_advanced_statusbar_location : "none",

        plugins: 'advimage,jqueryinlinepopups',
        extended_valid_elements: 'img[!src|border:0|alt|title|width|height|style]a[name|href|target|title|onclick]',
		
		oninit: applyChromeBugfix
    };

    //if (fileBrowser) 
	options.file_browser_callback = "WikiFileBrowser_open";
	
	if(!tinyMCELoaded) {
		$LAB.script(getAPIHostRoot() + "/api/plugins/tiny_mce/tiny_mce_src.js").wait(function(){
			tinyMCELoaded = true;
			tinymce.dom.Event.domLoaded = true; 
			tinyMCE.init(options);
			applyChromeBugfix()
		});
	}
	else{
		tinyMCE.init(options);
		applyChromeBugfix()
	}
}


/** Конструктор
 @class Редактор сообщений
 @memberOf Wiki
 @param {object} pageInfo Сообщение для редактирования
 @param {object} wikiPlugin Плагин - основной класс
*/
WikiEditor = function(pageInfo, wikiPlugin){
	this._wikiPlugin = wikiPlugin;
	this._pageInfo = pageInfo;
	this._layerChooseFlag = false;
	this._geometryChooseFlag = false;
	this._geometryRowContainer = _div();
	this._geometryTable = _table([_tbody([_tr([_td([_t(_gtxt("Объект для привязки: "))]), _td([this._geometryRowContainer]), _td([makeHelpButton(_gtxt("Для привязки сообщения к карте нужно добавить новый объект: точку или многоугольник"))])])])]);
	this._drawingObjectInfoRow = null;
	//this._divGeometry = _div([_t(_gtxt("Для привязки сообщения к карте нужно добавить новый объект: точку или многоугольник"))],[['dir', 'className', 'wiki-editor-helptext']]);
	this._txtLayer = _input(null, [['attr', 'readonly', 'true'], ['dir', 'className', 'wiki-editor-txtlayer']]);
	this._btnLayerClear = makeImageButton(pluginPath + '../img/closemin.png', pluginPath + '../img/close_orange.png');
	this._btnLayerClear.setAttribute('title', _gtxt('Удалить привязку к слою'));
	this._btnLayerClear.onclick = function(){ this.setLayer(null) }.bind(this);
	this._hlpLayer = makeHelpButton(_gtxt("Щелкните по слою в дереве слоёв, чтобы выбрать его"));
	this._txtTitle = _input(null, [['dir', 'className', 'wiki-editor-txttitle']]);
	this._fieldsTable = _table([_tbody([_tr([_td([_t(_gtxt("Слой"))]), _td([this._txtLayer]), _td([this._btnLayerClear]), _td([this._hlpLayer], [['css', 'width', '100%']]), _td([_t(_gtxt("Заголовок"))]), _td([this._txtTitle]), _td()])])], [['dir', 'className', 'wiki-editor-tblfields']]);
	this._txtContent = _textarea(null, [['attr', 'id', 'message_content'], ['css', 'width', '100%'], ['css', 'height', '100%']]);
	if (pageInfo.LayerName) this._txtLayer.value = this._wikiPlugin._map.layers[pageInfo.LayerName].properties.title;
	if (pageInfo.Title) this._txtTitle.value = pageInfo.Title;		
	if (pageInfo.Content) this._txtContent.value = pageInfo.Content;
	var _btnOK = _button([_t(_gtxt("Сохранить"))], [['dir', 'className', 'wiki-editor-btnok']]);
	if ($.browser.webkit || $.browser.opera) {_btnOK.style.padding='3px'}
	_btnOK.onclick = this.updatePage.bind(this);
	var trContent = _tr([_td([this._txtContent], [['css', 'height', '100%']])]);
	var tblAll = _table([_tbody([_tr([_td([this._geometryTable, this._fieldsTable])]), trContent, _tr([_td([_br(), _btnOK])])])], [['dir', 'className', 'wiki-editor-tblAll']]);
	this._div = _div([tblAll]);
}

WikiEditor.prototype = {
	/** Отображает диалог редактирования */
	showDialog: function(){
		var _this = this;
		if (this._pageInfo.Geometry) { 
			if (this._pageInfo.mapObject) this._pageInfo.mapObject.remove();
			var obj = this._wikiPlugin._map.drawing.addObject(this._pageInfo.Geometry);
		}else{
			_(this._geometryRowContainer, [_t(_gtxt("Объект не выбран"))]);
		};
		this._dialog = showDialog(_gtxt('Сообщение'), this._div, 725, 500 , false, false, false, function(){ $(_this).triggerHandler('dialogclose'); if (_this._drawing) _this._drawing.remove();})
		$(this._dialog).dialog( "option", "minHeight", 50 );
		$(this._dialog).dialog( "option", "minWidth", 250 );
		//$(this._div).dialog({height: 350, width: 500, close: );
		InitEditor('message_content');
	},
	
	/** Обрабатывает события нажатия на кнопку "Сохранить"*/
	updatePage: function(){
		this._pageInfo.Title = this._txtTitle.value;
		tinyMCE.get('message_content').save();
		this._pageInfo.Content = this._txtContent.value;
		if (this._drawing) {
			this._pageInfo.Geometry = this._drawing.geometry;
			this._drawing.remove();
			this._drawing = null;
		}
		if (!this._pageInfo.Geometry) { alert(_gtxt("Для привязки сообщения к карте нужно добавить новый объект: точку или многоугольник")); return; };
		$(this).triggerHandler('updatePage', [this._pageInfo]);
	},
	
	/** Устанавливает для сообщения переданный объект на карте в качестве геометрии*/
	setGeometry: function(drawing){
		if (drawing && this._drawing) this._drawing.remove();
		if (drawing) {
			removeChilds(this._geometryRowContainer);
			this._drawingObjectInfoRow = new oDrawingObjectsModule.DrawingObjectInfoRow(this._wikiPlugin._map, this._geometryRowContainer, drawing);
			$(this._drawingObjectInfoRow).bind('onRemove', function(){
				this._drawing.remove();
			}.bind(this));
		}
		else{
			_(this._geometryRowContainer, [_t(_gtxt("Объект не выбран"))]);
		}
		this._drawing = drawing;
	},
	
	/** Устанавливает для сообщения переданный слой*/
	setLayer: function(layerName){
		if (layerName){
			this._txtLayer.value = this._wikiPlugin._map.layers[layerName].properties.title;
			this._pageInfo.LayerName = layerName;
		}
		else{
			this._txtLayer.value = ''; 
			this._pageInfo.LayerName = null;
		}
	},
	
	/** Закрывает диалог */
	closeDialog: function(){
		$(this._dialog).dialog('close');
	}
}

/** Конструктор
 @class Плагин - основной класс
 @memberOf Wiki
*/
WikiPlugin = function() {
    this._wikiService = null;
    this._wikiObjects = null;
	this._wikiEditor = null;
    this._pagesCache = [];
    this._map = null;
	
    this._treeView = null;
	this._uiWikiButton = null;
    
    this._createButton = null;
    this._filter = null;
	this._pageToShow = null;
}

WikiPlugin.prototype = {
	/** Инициализирует все что можно */
    initialize: function(map, sWikiServer) {
        $.getCSS(getAPIHostRoot() + '/api/plugins/WikiPlugin.css');
		this._map = map;
        this._wikiService = new WikiService(sWikiServer);
        this._wikiObjects = new WikiObjectsHandler(this._map, this);

		this._addButton();
		this._attachTreeEvents();
        this._attachDrawingObjectsEvents();
        this._treeView = $('ul.treeview');
		this._filter = new WikiFilter(oWikiDiv);

		this._map.drawing.addTool('textTool'
									,'activeStyle': {}
									,'regularStyle': {}
									, _gtxt("Создать сообщение")
									, pluginPath + 'img/wiki/text_tool.png'
									, pluginPath + 'img/wiki/text_tool_a.png'
									, function(){this._map.drawing.selectTool('move'); this.createPage(); }.bind(this)
									, function(){})
		this._loadPages();
    },
    
	/** Создает новое сообщение */
	createPage: function(layerID){
		if (this._isUserLoggedIn()) {
			this.openEditor({MessageID: -1, MapName: getMapId(), LayerName: layerID, AuthorNickname: nsGmx.AuthManager.getNickname(), IsDeleted: 0});
		}
		else {
			$('.loginCanvas div.log span.buttonLink').click();
		}
	},
	/** Показывает сообщение */
	showPage: function(pageID){
		if (this._pagesCache.length) {
			this._wikiObjects.showPage(this._getPageInfo(pageID));
		}
		else{
			this._pageToShow = pageID;
		}
	},
	
	/** Открывает редактор сообщения*/
	openEditor: function(pageInfo){
		if (this._wikiEditor){
			alert(_gtxt("Сообщение уже редактируется"));
		}
		else{
			var _this = this;
			this._wikiEditor = new WikiEditor(pageInfo, this);
			$(this._wikiEditor).bind('dialogclose', function(){
					_this._wikiEditor = null;
					_this._loadPages();
				});
			$(this._wikiEditor).bind('updatePage', function(){
					_this._wikiService.updatePage(pageInfo, function(response) { _this._loadPages(); _this._wikiEditor.closeDialog();  } );
				});
			this._wikiEditor.showDialog();
		}
	},
    
	/** Удаляет сообщение */
	deletePage: function(pageInfo){
		var _this = this;
		pageInfo.IsDeleted = 1;
		this._wikiService.updatePage(pageInfo, function(response) { _this._loadPages(); } );
	},
	
	/** Возвращает сообщение по его Ид.*/
	_getPageInfo: function(pageID){
		var pageInfo = null;
		for(var i=0; i<this._pagesCache.length; i++){
			if (this._pagesCache[i].MessageID == pageID){
				pageInfo = this._pagesCache[i];
				break;
			}
		}
		return pageInfo
	},
	
	/** Проверяет, авторизован ли пользователь*/
    _isUserLoggedIn: function() {
        return nsGmx.AuthManager.isLogin();
    },
       
	/** Добавляет кнопку "Создать сообщение" */
	_addButton: function(){
        var clickFunction = function() {
					this.createPage();
                }.bind(this);
		
		this._createButton = $('<span class="wiki-wizard-button">' + _gtxt("Создать сообщение") + '</span>').click(clickFunction);
		$(oWikiDiv).append($('<div class="wiki-wizard-button"></div>').append(this._createButton));
	},
	
	/** Добавляет обработчик события добавления нового объекта на карту */
    _attachDrawingObjectsEvents: function() {
        if (!this._isUserLoggedIn()) return;
    
        this._map.drawing.setHandlers({
		    onAdd: this._onDrawingObjectAdded.bind(this),
			onRemove: this._onDrawingObjectRemove.bind(this)
		});
    },
    
	/** Обработчик события добавления нового объекта на карту */
    _onDrawingObjectAdded: function(elem) {
        if (elem.geometry.type != 'POINT' &&
            elem.geometry.type != 'POLYGON') return;
			
		if(this._wikiEditor) {
			this._wikiEditor.setGeometry(elem);
			if (elem.geometry.type == 'POLYGON'){
				var style = elem.getStyle();
				style.regular.outline.color = 0x007700;
				style.hovered.outline.color = 0x009900;
				elem.setStyle(style.regular, style.hovered);
			}
		}
    },
	
	/** Обработчик события удаления объекта с карты */
	_onDrawingObjectRemove: function(){
		if(this._wikiEditor) this._wikiEditor.setGeometry(null);
	},
	
	/** Добавляет обработчик события выбора слоя в дереве слоев */
	_attachTreeEvents: function() {
        var that = this;
                
        var oldLayerVisible = layersTree.prototype.layerVisible;
		//обработчик события выбора слоя в дереве слоев
        layersTree.prototype.layerVisible = function(box, flag) {
            (oldLayerVisible.bind(this))(box, flag);
            var layerInfo = box.parentNode.gmxProperties.content.properties;
            if(that._wikiObjects) that._wikiObjects.setLayerVisible(layerInfo.name, layerInfo.visible);
			if(that._wikiEditor) that._wikiEditor.setLayer(layerInfo.name);

			that._filter.filter();
        }
    },
    
	/** Добавляет кнопку "Отобразить/скрыть все сообщения на карте" */
	_ensureWikiButton: function() {
        if (!this._pagesCache || !this._pagesCache.length) return;        
        if (!this._uiWikiButton) {
            this._uiWikiButton = $('<div class="wiki-button" title="Показать/скрыть статьи Wiki на карте" />')
                .addClass('page-button-on')
                .click(function() { this._toggleWikiObjectsVisibility(); }.bind(this));
        }
		if (jQuery.browser.msie) { this._uiWikiButton.css('display', 'inline'); };
        this._treeView.find('div[mapid="' + this._map.properties.MapID + '"] div:first').append(this._uiWikiButton);
    },
    
	/** Обрабатывает событие нажатия на кнопку "Отобразить/скрыть все сообщения на карте"  */
    _toggleWikiObjectsVisibility: function() {
        this._wikiObjects.setObjectsVisibility( 
            this._isWikiButtonOn(this._uiWikiButton.toggleClass('page-button-on').toggleClass('page-button-off'))
        );
    },
	
	/** Переключает состояние кнопки "Отобразить/скрыть все сообщения на карте"  */
	_setWikiButtonState: function(button, isOn) {
        if (!button) return;
        button.removeClass('page-button-on page-button-off').addClass('page-button-' + (isOn ? 'on' : 'off'));
    },
    
	/** Возвращает состояние кнопки "Отобразить/скрыть все сообщения на карте" */
    _isWikiButtonOn: function(button) {
        return button && button.length && button.hasClass('page-button-on');
    },
    
	/** Загружает список сообщений */
    _loadPages: function() {
		var _this = this;
		var objects = this._wikiObjects;
        objects.removeObjects();
		
        this._wikiService.getPages(function(status, data){
			if (status != 'ok' || data.Status != 'ok') {
				// Something went wrong
				_this._pagesCache = [];
				return;
			}
			data.Result.sort(function (page_a, page_b){
				if (page_a == null || page_a == null) return 0;
				if (page_a.Title > page_b.Title )
					return 1;
				if (page_a.Title  < page_b.Title )
					return -1;
				return 0;
			});
			_this._pagesCache = data.Result;
			for (var index = 0; index < _this._pagesCache.length; ++index) {
				_this._pagesCache[index].Geometry = _this._pagesCache[index].wkb_geometry;
			}

			objects.createObjects(_this._pagesCache);
			if (_this._pageToShow){
				objects.showPage(_this._getPageInfo(_this._pageToShow));
				_this._pageToShow = null;
			}
			
			_this._filter.pagesCache = _this._pagesCache;
			_this._filter.filter();
			
			_this._ensureWikiButton();
		});
    }
}

oWiki = new WikiPlugin();
var loadMenu = function(){
	$(oWikiDiv).dialog();
}

var unloadMenu = function(){
}

var beforeViewer = function(){
	nsGmx.ContextMenuController.addContextMenuElem({
		title: _gtxt("Создать сообщение"),
		isVisible: function(context)
		{
			return !context.layerManagerFlag && nsGmx.AuthManager.isLogin();
		},
		isSeparatorBefore: function(layerManagerFlag, elem)
		{
			return true;
		},
		clickCallback: function(context)
		{
			if(context.elem && context.elem.LayerID)
				oWiki.createPage(context.elem.name);
			else
				oWiki.createPage();
		}
	}, ['Layer', 'Map']);
}

var afterViewer = function(){
	if (jQuery.browser.opera){
		setTimeout(function(){
			oWiki.initialize(oFlashMap, serverBase + 'Wiki/');
		}, 3000)
	}
	else {
		oWiki.initialize(oFlashMap, serverBase + 'Wiki/');
	}
}

var addMenuItems = function(){
	return [{item: {id:'wiki', title:_gtxt('Сообщения'),func:loadMenu},
			parentID: 'viewMenu'}];
}
 
var publicInterface = {
	beforeViewer: beforeViewer,
	afterViewer: afterViewer,
	addMenuItems: addMenuItems
}

gmxCore.addModule("wiki", publicInterface, {init: function(module, path)
    {
        pluginPath = path;
    }
});

})(jQuery, globalFlashMap)