/** 
* @name Message
* @namespace SDK для сообщений на карте
* @description SDK для сообщений на карте
*/
(function($){

_translationsHash.addtext("rus", {
	"Сообщение" : "Сообщение",
	"Сообщения" : "Сообщения",
	"Искать в видимой области" : "Искать в видимой области",
	"Добавьте объект на карту" : "Добавьте объект на карту",
	"Создать сообщение" : "Создать сообщение",
	"Сообщение уже редактируется": "Сообщение уже редактируется",
	"Вы действительно хотите удалить это сообщение?" : "Вы действительно хотите удалить это сообщение?",
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
	"Создать сообщение" : "Create message",
	"Сообщение уже редактируется": "Message editor is already open",
	"Вы действительно хотите удалить это сообщение?" : "Do you really want to delete the selected message?",
	"Для привязки сообщения к карте нужно добавить новый объект: точку или многоугольник": "Add new point or rectangle to create a message",
	"Объект не выбран": "Nothing selected",
	"Объект для привязки: ": "Message object: ",
	"Поделиться": "Share"
});

var oDrawingObjectsModule = null;
gmxCore.addModulesCallback(["DrawingObjects"], function(){
	oDrawingObjectsModule = gmxCore.getModule("DrawingObjects");
});

/**Возвращает Ид. карты
 @memberOf Message*/
var getMapId = function(oFlashMap){
	return oFlashMap.properties.name;
}

/** Конструктор
 @class Предоставляет методы общения с сервером сообщений
 @memberOf Message
 @param sServerBase путь к серверу Geomixer*/
var MessageService = function(sServerBase){

	/** Возврщает описание атрибутов сообщений */
	this.GetClassInfo = function(classID, callback){
		sendCrossDomainJSONRequest(sServerBase + 'Message/GetClassInfo.ashx?ClassID=' + classID , function(data){
			if (parseResponse(data) && callback) callback(data);
		});
	}
	
	/** Возвращает список сообщений на карте*/
	this.GetMessages = function(oFlashMap, callback){
		sendCrossDomainJSONRequest(sServerBase + 'Message/GetMessages.ashx?MapName=' + getMapId(oFlashMap) , function(data){
			if (parseResponse(data) && callback) callback(data);
		});
	}
	
	/** Обновляет сообщение*/
	this.UpdateMessage = function(oMessage, oFlashMap, callback){
		var _data = { WrapStyle: 'window'
				, MessageInstanceID: oMessage.MessageInstanceID.toString()
				, ClassID: oMessage.ClassID
				, MapName: getMapId(oFlashMap) 
				, Geometry: JSON.stringify(oMessage.Geometry)
				, AuthorNickname: oMessage.AuthorNickname
				, IsDeleted: oMessage.IsDeleted
				, Attributes: JSON.stringify(oMessage.Attributes)
			};
		sendCrossDomainPostRequest(sServerBase + 'Message/MessageUpdate.ashx', _data, function(data){
			if (parseResponse(data) && callback) callback(data);
		});
	}
}

/** Конструктор
 @class Редактор сообщений 
 @memberOf Message
 @param oInitContainer Куда добавлять редактор
 @param oService Сервис для серверной части
 @param oMessage Сообщение
 @param oFlashMap Карта*/
var MessageEditor = function(oInitContainer, oService, oMessage, oFlashMap){
	if (!oMessage.ClassID) throw ('MessageEditor failed. Invalid message');
	var _this = this;
	var container = _div();
	var attrsDiv = _div();
	var _drawing=null, _geometryRowContainer = _div();
	
	oService.GetClassInfo(oMessage.ClassID, function(classInfo){
		var divEditor = nsGmx.Controls.createInputForm(classInfo.Result, oMessage.Attributes);
		_(attrsDiv, [divEditor]);
	});
	var btnOK = makeLinkButton(_gtxt('Сохранить'));
	btnOK.onclick = function(){
		if(_drawing){
			oMessage.Geometry = _drawing.geometry;
		}
		else{
			oMessage.Geometry = null;
		}
		$(_this).triggerHandler('Update');
	}
	
	var setEmptyGeometryWarning = function(){
		_(_geometryRowContainer, [_t(_gtxt("Объект не выбран"))]);
	}
	
	this.SetGeometry = function(drawing){
		if (drawing && drawing.geometry.type == 'POLYGON'){
			var style = drawing.getStyle();
			style.regular.outline.color = 0x007700;
			style.hovered.outline.color = 0x009900;
			drawing.setStyle(style.regular, style.hovered);
		}
			
		if (_drawing && !(_drawing === drawing) ) _drawing.remove();
		if (drawing) {
			removeChilds(_geometryRowContainer);
			var _drawingObjectInfoRow = new oDrawingObjectsModule.DrawingObjectInfoRow(oFlashMap, _geometryRowContainer, drawing);
			$(_drawingObjectInfoRow).bind('onRemove', function(){
				_drawing.remove();
			}.bind(this));
		}
		else{
			setEmptyGeometryWarning()
		}
		_drawing = drawing;
	}
	
	_(container, [_t(_gtxt("Объект для привязки: ")), _br(), _geometryRowContainer, attrsDiv, btnOK]);
	_(oInitContainer, [container]);
	//var oMapObject;
	if (oMessage.Geometry) {
		var oMapObj = oFlashMap.drawing.addObject(oMessage.Geometry);
		this.SetGeometry(oMapObj);
	}
	else setEmptyGeometryWarning();
}

var publicInterface = {
	MessageService: MessageService,
	MessageEditor: MessageEditor
}

gmxCore.addModule("Message", publicInterface);

})(jQuery);