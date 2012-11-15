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

//Контрол, который показывает диалог редактирования существующего или добавления нового объекта в слой.
//События: modify - когда изменили/добавили объект
//Параметры:
// * layerName {string} - ID слоя
// * objectId {int} - ID объекта. Если новый объект, то null
// * params
//    * drawingObject {DrawingObject} - пользовательский объект для задании геометрии или null, если геометрия не задана
//    * fields {Array} - массив со значениями атрибутов. Должен содержать только атрибуты, которые есть в слое. Каждый элемент массива может содержать:
//       * name {String} - имя атрибута (обязательно)
//       * value {String|int} - значение атрибута в формате сервера (может отсутствовать)
//       * constant {bool} - можно ли редактировать атрибут (по умолчанию - можно)
var EditObjectControl = function(layerName, objectId, params)
{
    var _params = $.extend({drawingObject: null, fields: []}, params);
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
    
    layer.setVisibilityFilter('"' + identityField + '"<>' + objectId);
    
    var geometryInfoRow = null;
    var bindDrawingObject = function(obj)
    {
        geometryInfoRow && geometryInfoRow.RemoveRow();
        var InfoRow = gmxCore.getModule('DrawingObjects').DrawingObjectInfoRow;
        geometryInfoRow = new InfoRow(
            globalFlashMap, 
            geometryInfoContainer, 
            obj, 
            { editStyle: false, allowDelete: false }
        );
    }
    
    var createDialog = function()
    {
        var canvas = _div(),
		createButton = makeLinkButton(isNew ? _gtxt("Создать") : _gtxt("Изменить")),
        removeButton = makeLinkButton(_gtxt("Удалить")),
		trs = [],
		tdGeometry = _td();
        
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
                
                var value = nsGmx.Utils.convertToServer(elem.rowType, 'value' in elem ? elem.value : $(elem).text());
                if (value !== null)
                    properties[elem.rowName] = value;
                else
                {
                    anyErrors = true;
                    inputError(elem);
                }
            });
            
            if (anyErrors) return;
            
            var obj = { properties: properties };
            
            var selectedDrawingObject = geometryInfoRow ? geometryInfoRow.getDrawingObject() : null;
            
            if (!selectedDrawingObject)
            {
                showErrorMessage("Геометрия для объекта не задана", true, "Геометрия для объекта не задана");
                return;
            }
            
            if (!isNew)
            {
                obj.id = objectId;
                if (selectedDrawingObject)
                {
                    var curGeomString = JSON.stringify(selectedDrawingObject.getGeometry());
                    var origGeomString = JSON.stringify(originalGeometry);
                    
                    if (origGeomString !== curGeomString)
                        obj.geometry = gmxAPI.merc_geometry(selectedDrawingObject.getGeometry());
                }
            }
            else
            {
                if (selectedDrawingObject)
                    obj.geometry = gmxAPI.merc_geometry(selectedDrawingObject.getGeometry());
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
                
            originalGeometry = null;
            
            if (drawingBorderDialog)
                removeDialog(drawingBorderDialog);
            
            EditObjectControlsManager.remove(layerName, objectId);
            layer.setVisibilityFilter();
        }
        
        var drawAttrList = function(drawingObject, fields)
        {
            var trs = [];
            
            //сначала идёт геометрия
            var drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png");
            
            drawingBorderLink.onclick = function()
            {
                nsGmx.Controls.chooseDrawingBorderDialog(
                    'editObject', 
                    bindDrawingObject, 
                    { geomType: layer.properties.GeometryType }
                );
            }
            drawingBorderLink.style.margin = '0px 5px 0px 3px';
            
            var td = _td();
            if (drawingObject)
            {
                var geom = drawingObject.getGeometry();
                if (geom.type == "POINT" || geom.type == "LINESTRING" || geom.type == "POLYGON")
                {
                    bindDrawingObject(drawingObject);
                    originalGeometry = geometryInfoRow.getDrawingObject().getGeometry();
                    
                    _(td, [geometryInfoContainer]);
                }
                else
                {
                    var info = _span([_t(geom.type)], [['css','marginLeft','3px'],['css','fontSize','12px']]);
                    _title(info, JSON.stringify(geom.coordinates));
                    _(td, [info]);
                }
            }
            else
            {
                _(td, [geometryInfoContainer]);
            }
            
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
            sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + layerName + "&page=0&pagesize=1&orderby=" + identityField + "&geometry=true&query='" + identityField + "'=" + objectId, function(response)
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
                        var geom = from_merc_geometry(geometryRow[i]);
                        drawingObject = globalFlashMap.drawing.addObject(geom);
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
                
                var trs = drawAttrList(drawingObject, fields);
                
                _(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
                
                _(canvas, [_div([createButton, removeButton],[['css','margin','10px 0px'],['css','height','20px']])]);
                
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
            
            var trs = drawAttrList(_params.drawingObject, fields);
            
            _(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
            
            _(canvas, [_div([createButton],[['css','margin','10px 0px'],['css','height','20px']])]);
            
            resizeFunc();
        }
    }
    
    createDialog();
}

nsGmx.EditObjectControl = EditObjectControl;

})();