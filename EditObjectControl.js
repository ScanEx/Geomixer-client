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

/** Контрол, который показывает диалог редактирования существующего или добавления нового объекта в слой.
* 
* @memberOf nsGmx
* @param {string} layerName ID слоя
* @param {int} objectId ID объекта (null для нового объекта)
* @param {Object} params Дополнительные параметры контрола
* @param {gmxAPI.drawingObject} params.drawingObject Пользовательский объект для задании геометрии или null, если геометрия не задана
* @param {function} params.onGeometrySelection Внешняя ф-ция для выбора геометрии объекта. 
         Сигнатура: function(callback), параметр callback(drawingObject) должен быть вызван когда будет выбрана геометрия.
* @param {Object} params.validate Пользовательские валидаторы типов. 
*        Хеш {name: function}, сами валидаторы имеют формат function(value) -> Boolean. True, если исходное значение валидное.
*        Передаются введённые пользователем значения до их преобразования в серверных формат
* @param {Object[]} params.fields массив со значениями атрибутов. Должен содержать только атрибуты, которые есть в слое. Каждый элемент массива может содержать:
*
*  * name {String} - имя атрибута (обязательно)
*  * value {String|int} - значение атрибута в формате сервера (может отсутствовать)
*  * constant {bool} - можно ли редактировать атрибут (по умолчанию - можно)
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
    
    //layer.setVisibilityFilter('"' + identityField + '"<>' + objectId);
    
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
    
    var bindGeometry = function(geom) {
        
        if (geom.type === 'POLYGON') {
            // добавим маленький сдвиг, чтобы рисовать полигон, а не прямоугольник
            geom.coordinates[0][0][0] += 0.00001;
            geom.coordinates[0][0][1] += 0.00001;
                    
            // чтобы если бы последняя точка совпадала с первой, то это бы ни на что не повлияло
            var pointCount = geom.coordinates[0].length;
            geom.coordinates[0][pointCount-1][0] += 0.00001;
            geom.coordinates[0][pointCount-1][1] += 0.00001;
        }
        
        if (geom.type == "POINT" || geom.type == "LINESTRING" || geom.type == "POLYGON") {
            bindDrawingObject(globalFlashMap.drawing.addObject(geom));
        } else {
            if (!originalGeometry) {
                originalGeometry = $.extend(true, {}, geom);
            }
            
            geometryInfoRow && geometryInfoRow.RemoveRow();
            geometryInfoRow = null;
            $(geometryInfoContainer).empty().append($('<span/>').css('margin', '3px').text(_gtxt("Мультиполигон")));
            
            geometryMapObject = globalFlashMap.addObject(geom);
            geometryMapObject.setStyle({outline: {color: 0x0000ff, thickness: 2}});
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
                var isValid = !_params.validate[elem.rowName] || _params.validate[elem.rowName](clientValue);
                
                if (value !== null && isValid) {
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
            //layer.setVisibilityFilter();
            
            $(_this).trigger('close');
        }
        
        var firstInput = null;
        
        //либо drawingObject либо geometry
        var drawAttrList = function(fields)
        {
            var trs = [];
            
            //сначала идёт геометрия
            var drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png");
            
            drawingBorderLink.onclick = function()
            {
                if (_params.onGeometrySelection) {
                    _params.onGeometrySelection(bindDrawingObject);
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
            for (var iF = 0; iF < fields.length; iF++)
            {
                var td = _td();
                if (fields[iF].constant)
                {
                    if ('value' in fields[iF])
                    {
                        var span = _span(null,[['css','marginLeft','3px'],['css','fontSize','12px'], ['dir', 'className', 'edit-attr-value']])
                        span.rowName = fields[iF].name;
                        span.rowType = fields[iF].type;
                        _(span, [_t(nsGmx.Utils.convertFromServer(fields[iF].type, fields[iF].value))]);
                    }
                    _(td, [span])
                }
                else
                {
                    var input = getInputElement(fields[iF].type);
                    input.rowName = fields[iF].name;
                    input.rowType = fields[iF].type;
                    
                    firstInput = firstInput || input;
                    
                    if ('value' in fields[iF])
                        input.value = nsGmx.Utils.convertFromServer(fields[iF].type, fields[iF].value);
                        
                    $(input).addClass('edit-attr-value');
                        
                    _(td, [input]);
                }
                
                trs.push(_tr([_td([_span([_t(fields[iF].name)],[['css','fontSize','12px']])]), td], [['css', 'height', '22px']]));
            }
            
            return trs;
        }
        
        var extendFields = function(fields, newFields)
        {
            for (var iNF = 0; iNF < newFields.length; iNF++)
            {
                for (var iF = 0; iF < fields.length; iF++)
                    if ( fields[iF].name === newFields[iNF].name )
                    {
                        $.extend( true, fields[iF], newFields[iNF] );
                        break;
                    }
            }
            
            return fields;
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
                
                var fields = [];
                
                for (var i = 0; i < geometryRow.length; ++i)
                {
                    if (columnNames[i] === 'geomixergeojson')
                    {
                        bindGeometry(from_merc_geometry(geometryRow[i]));
                    }
                    else
                    {
                        var item = {
                            value: geometryRow[i],
                            type: types[i], 
                            name: columnNames[i], 
                            constant: columnNames[i] === identityField
                        };
                        
                        if (columnNames[i] === identityField)
                            fields.unshift(item);
                        else
                            fields.push(item);
                    }
                }
                
                extendFields(fields, _params.fields);
                
                var trs = drawAttrList(fields);
                
                _(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
                
                _(canvas, [_div([createButton, removeButton],[['css','margin','10px 0px'],['css','height','20px']])]);
                
                firstInput && firstInput.focus();
                
                resizeFunc();
            })
        }
        else
        {
            var fields = [];
            
            for (var i = 0; i < layer.properties.attributes.length; ++i)
            {
                fields.push({type: layer.properties.attrTypes[i], name: layer.properties.attributes[i]});
            }
            
            extendFields(fields, _params.fields);
            
            if (_params.drawingObject) {
                bindDrawingObject(_params.drawingObject);
            }
            
            var trs = drawAttrList(fields);
            
            _(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
            
            _(canvas, [_div([createButton],[['css','margin','10px 0px'],['css','height','20px']])]);
            
            firstInput && firstInput.focus();
            
            resizeFunc();
        }
    }
    
    createDialog();
    
    this.get = function(name) {
        var resValue = null;
        $(".edit-attr-value", canvas).each(function(index, elem)
        {
            if (elem.rowName === name) {
                resValue = 'value' in elem ? elem.value : $(elem).text();
            }
        });
        return resValue;
    }
}

nsGmx.EditObjectControl = EditObjectControl;

})();