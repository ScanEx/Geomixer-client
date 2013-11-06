(function(){

//для отслеживания того, что не открыли диалог редактирования одного и того же объекта несколько раз
var EditObjectControlsManager = {
    _editControls: [],
    find: function(layerName, oid)
    {
        for (var iD = 0; iD < this._editControls.length; iD++)
            if ( layerName == this._editControls[iD].layer && oid == this._editControls[iD].oid )
                return this._editControls[iD].control;
    },
    add: function(layerName, oid, control)
    {
        for (var iD = 0; iD < this._editControls.length; iD++)
            if ( layerName == this._editControls[iD].layer && oid == this._editControls[iD].oid )
            {
                this._editControls[iD].control = control;
                return;
            }
        this._editControls.push({ layer: layerName, oid: oid, control: control });
    },
    remove: function(layerName, oid)
    {
        for (var iD = 0; iD < this._editControls.length; iD++)
            if ( layerName == this._editControls[iD].layer && oid == this._editControls[iD].oid )
            {
                this._editControls.splice(iD, 1);
                return;
            }
    }
}

var getInputElement = function(type)
{
    var input = _input( null,[['css','width','200px'],['dir','className','inputStyle']] );
    
    if (type == 'date')
    {
        $(input).datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: "dd.mm.yy"
        });
    }
    else if ( type == 'datetime' )
    {
        $(input).datetimepicker(
        {
            changeMonth: true,
            changeYear: true,
            dateFormat: "dd.mm.yy",
            timeFormat: "hh:mm:ss",
            showSecond: true,
            timeOnly: false
        })
    }
    else if ( type == "time" )
    {
        $(input).timepicker({
            timeOnly: true,
            timeFormat: "hh:mm:ss",
            showSecond: true
        });
    }
    
    return input;
}

//Коллекция полей с информацией для создания диалога редактирования
var FieldsCollection = function() {
    var _asArray = [];
    var _asHash = {};
    
    this.append = function(field) {
        _asArray.push(field);
        _asHash[field.name] = field;
    }
    
    this.prepend = function(field) {
        _asArray.unshift(field);
        _asHash[field.name] = field;
    }
    
    this.update = function(field) {
        (field.name in _asHash) && $.extend(true, _asHash[field.name], field);
    }
    
    this.get = function(name) {
        return _asHash[name];
    }
    
    this.each = function(callback) {
        _asArray.forEach(callback);
    }
}

/** Контрол, который показывает диалог редактирования существующего или добавления нового объекта в слой.
* 
* @memberOf nsGmx
* @class
* @param {string} layerName ID слоя
* @param {int} objectId ID объекта (null для нового объекта)
* @param {Object} params Дополнительные параметры контрола
* @param {gmxAPI.drawingObject} params.drawingObject Пользовательский объект для задании геометрии или null, если геометрия не задана
* @param {function} params.onGeometrySelection Внешняя ф-ция для выбора геометрии объекта. 
         Сигнатура: function(callback), параметр callback(drawingObject) должен быть вызван когда будет выбрана геометрия.
* @param {Object[]} params.fields массив со значениями атрибутов. Должен содержать только атрибуты, которые есть в слое. Каждый элемент массива может содержать:
*
*  * name {String} - имя атрибута (обязательно)
*  * value {String|int} - значение атрибута в формате сервера (может отсутствовать)
*  * constant {bool} - можно ли редактировать атрибут (по умолчанию - можно)
*  * title {String} - что показывать вместо имени атрибута
*  * validate {function(val) -> Boolean} - ф-ция для валидации результата. На вход получает введённое пользователем значение 
*      (до преобразования в серверный формат), должна вернуть валидно ли это значение.
*/
var EditObjectControl = function(layerName, objectId, params)
{
    /** Изменение/добавление объекта
     * @event EditObjectControl#modify
     */
     /** Закрытие диалога редактирования
     * @event EditObjectControl#close
     */
    var _params = $.extend({drawingObject: null, fields: [], validate: {}}, params);
    var _this = this;
    var isNew = objectId == null;
    if (!isNew && EditObjectControlsManager.find(layerName, objectId))
        return EditObjectControlsManager.find(layerName, objectId);
    
    EditObjectControlsManager.add(layerName, objectId, this);
    
    var layer = globalFlashMap.layers[layerName];
    var geometryInfoContainer = _span(null, [['css','color','#215570'],['css','marginLeft','3px'],['css','fontSize','12px']]);
    
    var originalGeometry = null;
    var drawingBorderDialog = null;
    var identityField = layer.properties.identityField;
    
    var geometryInfoRow = null;
    var geometryMapObject = null;
    var bindDrawingObject = function(obj)
    {
        geometryInfoRow && geometryInfoRow.RemoveRow();
        if (geometryMapObject) {
            geometryMapObject.remove();
            geometryMapObject = null;
            $(geometryInfoContainer).empty();
        }
        
        if (!obj) return;
        
        if (!originalGeometry) {
            originalGeometry = $.extend(true, {}, obj.getGeometry());
        }
        
        var InfoRow = gmxCore.getModule('DrawingObjects').DrawingObjectInfoRow;
        geometryInfoRow = new InfoRow(
            globalFlashMap, 
            geometryInfoContainer, 
            obj, 
            { editStyle: false, allowDelete: false }
        );
    }
    
    //geom может быть либо классом gmxAPI.DrawingObject, либо просто описанием геометрии
    var bindGeometry = function(geom) {
        
        //gmxAPI.DrawingObject
        if (geom.getGeometry) {
            bindDrawingObject(geom);
            return;
        }
        
        if (geom.type == "POINT" || geom.type == "LINESTRING" || geom.type == "POLYGON") {
            if (geom.type === 'POLYGON') {
                // добавим маленький сдвиг, чтобы рисовать полигон, а не прямоугольник
                geom.coordinates[0][0][0] += 0.00001;
                geom.coordinates[0][0][1] += 0.00001;
                        
                // чтобы если бы последняя точка совпадала с первой, то это бы ни на что не повлияло
                var pointCount = geom.coordinates[0].length;
                geom.coordinates[0][pointCount-1][0] += 0.00001;
                geom.coordinates[0][pointCount-1][1] += 0.00001;
            }
            bindDrawingObject(globalFlashMap.drawing.addObject(geom));
        } else {
            if (!originalGeometry) {
                originalGeometry = $.extend(true, {}, geom);
            }
            
            geometryInfoRow && geometryInfoRow.RemoveRow();
            geometryInfoRow = null;
            
            var titles = {
                'MULTIPOLYGON':    _gtxt("Мультиполигон"),
                'MULTILINESTRING': _gtxt("Мультилиния"),
                'MULTIPOINT':      _gtxt("Мультиточка")
            };
            
            $(geometryInfoContainer).empty().append($('<span/>').css('margin', '3px').text(titles[geom.type]));
            
            geometryMapObject = globalFlashMap.addObject(geom);
            geometryMapObject.setStyle({outline: {color: 0x0000ff, thickness: 2}, marker: {size: 3}});
        }
    }

    var canvas = null;
    
    var createDialog = function()
    {
        var createButton = makeLinkButton(isNew ? _gtxt("Создать") : _gtxt("Изменить")),
            removeButton = makeLinkButton(_gtxt("Удалить")),
            trs = [];
            
        var canvas = _div();
        
        $(canvas).bind('dragover', function() {
            return false;
        });
        
        $(canvas).bind('drop', function(e) {
            var files = e.originalEvent.dataTransfer.files;
            nsGmx.Utils.parseShpFile(files[0]).done(function(objs) {
                bindGeometry(nsGmx.Utils.joinPolygons(objs));
            });
            return false;
        });
        
        removeButton.onclick = function()
        {
            _mapHelper.modifyObjectLayer(layerName, [{action: 'delete', id: objectId}]).done(function()
            {
                removeDialog(dialogDiv);
                closeFunc();
            })
        }
        
        removeButton.style.marginLeft = '10px';
	
        createButton.onclick = function()
        {
            var properties = {};
            var anyErrors = false;
            $(".edit-attr-value", canvas).each(function(index, elem)
            {
                if (elem.rowName === identityField) 
                    return;
                
                var clientValue = 'value' in elem ? elem.value : $(elem).text();
                var value = nsGmx.Utils.convertToServer(elem.rowType, clientValue);
                var validationFunc = fieldsCollection.get(elem.rowName).validate || _params.validate[elem.rowName];
                var isValid = !validationFunc || validationFunc(clientValue);
                
                if (isValid) {
                    properties[elem.rowName] = value;
                } else {
                    anyErrors = true;
                    inputError(elem);
                }
            });
            
            if (anyErrors) return;
            
            var obj = { properties: properties };
            
            
            var selectedGeom = null;
            
            if (geometryInfoRow && geometryInfoRow.getDrawingObject()) {
                selectedGeom = geometryInfoRow.getDrawingObject().getGeometry();
            } else if (geometryMapObject) {
                selectedGeom = geometryMapObject.getGeometry();
            }
            
            if (!selectedGeom)
            {
                showErrorMessage("Геометрия для объекта не задана", true, "Геометрия для объекта не задана");
                return;
            }
            
            if (!isNew)
            {
                obj.id = objectId;

                var curGeomString = JSON.stringify(selectedGeom);
                var origGeomString = JSON.stringify(originalGeometry);
                
                if (origGeomString !== curGeomString)
                    obj.geometry = gmxAPI.merc_geometry(selectedGeom);
            }
            else
            {
                obj.geometry = gmxAPI.merc_geometry(selectedGeom);
            }
            
            _mapHelper.modifyObjectLayer(layerName, [obj]).done(function()
            {
                $(_this).trigger('modify');
                removeDialog(dialogDiv);
                closeFunc();
            })
        }
    
        var resizeFunc = function(event, ui)
        {
            if (!isNew && $(canvas).children("[loading]").length)
                return;
            
            canvas.firstChild.style.height = canvas.parentNode.offsetHeight - 25 - 10 - 10 + 'px';
        }
        
        var closeFunc = function()
        {
            geometryInfoRow && geometryInfoRow.getDrawingObject() && geometryInfoRow.getDrawingObject().remove();
            geometryMapObject && geometryMapObject.remove();
                
            originalGeometry = null;
            
            if (drawingBorderDialog)
                removeDialog(drawingBorderDialog);
            
            EditObjectControlsManager.remove(layerName, objectId);
            
            $(_this).trigger('close');
        }
        
        var firstInput = null;
        var fieldsCollection = new FieldsCollection();
        
        //либо drawingObject либо geometry
        var drawAttrList = function(fields)
        {
            var trs = [];
            
            //сначала идёт геометрия
            var drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png");
            
            drawingBorderLink.onclick = function()
            {
                if (_params.onGeometrySelection) {
                    _params.onGeometrySelection(bindGeometry);
                } else {
                    nsGmx.Controls.chooseDrawingBorderDialog(
                        'editObject', 
                        bindDrawingObject,
                        { geomType: layer.properties.GeometryType }
                    );
                }
            }
            drawingBorderLink.style.margin = '0px 5px 0px 3px';
            
            var td = _td([geometryInfoContainer]);
            
            trs.push(_tr([_td([_span([_t(_gtxt("Геометрия")), drawingBorderLink],[['css','fontSize','12px']])],[['css','height','20px']]), td]))
            
            //потом все остальные поля
            fields.each(function(field) {
                var td = _td();
                if (field.constant)
                {
                    if ('value' in field)
                    {
                        var span = _span(null,[['css','marginLeft','3px'],['css','fontSize','12px'], ['dir', 'className', 'edit-attr-value']])
                        span.rowName = field.name;
                        span.rowType = field.type;
                        _(span, [_t(nsGmx.Utils.convertFromServer(field.type, field.value))]);
                    }
                    _(td, [span])
                }
                else
                {
                    var input = getInputElement(field.type);
                    input.rowName = field.name;
                    input.rowType = field.type;
                    
                    firstInput = firstInput || input;
                    
                    if ('value' in field)
                        input.value = nsGmx.Utils.convertFromServer(field.type, field.value);
                        
                    $(input).addClass('edit-attr-value');
                        
                    _(td, [input]);
                }
                
                trs.push(_tr([_td([_span([_t(field.title || field.name)],[['css','fontSize','12px']])]), td], [['css', 'height', '22px']]));
            })
            
            return trs;
        }
        
        var dialogDiv = showDialog(isNew ? _gtxt("Создать объект слоя [value0]", layer.properties.title) : _gtxt("Редактировать объект слоя [value0]", layer.properties.title), canvas, 400, 300, false, false, resizeFunc, closeFunc);
        
        if (!isNew)
        {
            var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px'],['attr','loading',true]]);
        
            _(canvas, [loading])
            
            //получаем геометрию объекта
            sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + layerName + "&page=0&pagesize=1&orderby=" + identityField + "&geometry=true&query=[" + identityField + "]=" + objectId, function(response)
            {
                if (!parseResponse(response))
                    return;
                    
                $(canvas).children("[loading]").remove();
                
                var columnNames = response.Result.fields;
                var drawingObject = null;
                var geometryRow = response.Result.values[0];
                var types = response.Result.types;
                
                for (var i = 0; i < geometryRow.length; ++i)
                {
                    if (columnNames[i] === 'geomixergeojson')
                    {
                        bindGeometry(from_merc_geometry(geometryRow[i]));
                    }
                    else
                    {
                        var field = {
                            value: geometryRow[i],
                            type: types[i], 
                            name: columnNames[i], 
                            constant: columnNames[i] === identityField
                        };
                        
                        if (columnNames[i] === identityField)
                            fieldsCollection.prepend(field);
                        else
                            fieldsCollection.append(field);
                    }
                }
                
                _params.fields.forEach(fieldsCollection.update);
                
                var trs = drawAttrList(fieldsCollection);
                
                _(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
                
                _(canvas, [_div([createButton, removeButton],[['css','margin','10px 0px'],['css','height','20px']])]);
                
                firstInput && firstInput.focus();
                
                resizeFunc();
            })
        }
        else
        {
            for (var i = 0; i < layer.properties.attributes.length; ++i)
            {
                fieldsCollection.append({type: layer.properties.attrTypes[i], name: layer.properties.attributes[i]})
            }
            
            _params.fields.forEach(fieldsCollection.update);
            
            if (_params.drawingObject) {
                bindDrawingObject(_params.drawingObject);
            }
            
            var trs = drawAttrList(fieldsCollection);
            
            _(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
            
            _(canvas, [_div([createButton],[['css','margin','10px 0px'],['css','height','20px']])]);
            
            firstInput && firstInput.focus();
            
            resizeFunc();
        }
    }
    
    createDialog();
    
    /** Получить текущее значение атрибута из контрола
      @memberOf nsGmx.EditObjectControl
      @param {String} fieldName Имя атрибута
      @method get
    */
    
    this.get = function(fieldName) {
        var resValue = null;
        $(".edit-attr-value", canvas).each(function(index, elem)
        {
            if (elem.rowName === fieldName) {
                resValue = 'value' in elem ? elem.value : $(elem).text();
            }
        });
        return resValue;
    }
    
    /** Задать значение атрибута объекта из контрола
      @memberOf nsGmx.EditObjectControl
      @method set
      @param {String} fieldName Имя атрибута
      @param {String|Integer} value Значение в клиентском формате, который нужно установить для этого атрибута
    */
    this.set = function(fieldName, value) {
        $(".edit-attr-value", canvas).each(function(index, elem)
        {
            if (elem.rowName === fieldName) {
                if ('value' in elem) {
                    elem.value = value;
                } else {
                    $(elem).text(value);
                }
            }
        });
    }
}

nsGmx.EditObjectControl = EditObjectControl;

})();