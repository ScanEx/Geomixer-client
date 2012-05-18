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

var EditObjectControl = function(layerName, objectId, params)
{
    var _params = $.extend({drawingObject: null}, params);
    var _this = this;
    var isNew = objectId == null;
    if (!isNew && EditObjectControlsManager.find(layerName, objectId))
        return EditObjectControlsManager.find(layerName, objectId);
    
    EditObjectControlsManager.add(layerName, objectId, this);
    
    var layer = globalFlashMap.layers[layerName];
    var geometryInfoContainer = null;
    
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
            var objects = JSON.stringify([{action: 'delete', id: objectId}]);
            sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", {WrapStyle: 'window', LayerName: layerName, objects: objects}, function(response)
            {
                if (!parseResponse(response))
                    return;
                
                removeDialog(dialogDiv);
                layer.chkLayerVersion(closeFunc);
            });
        }
        
        removeButton.style.marginLeft = '10px';
	
        createButton.onclick = function()
        {
            var properties = {};
            var anyErrors = false;
            $(".inputStyle", canvas).each(function(index, elem)
            {
                var value = nsGmx.Utils.convertToServer(elem.rowType, elem.value);
                if (value !== null)
                    properties[elem.rowName] = nsGmx.Utils.convertToServer(elem.rowType, elem.value);
                else
                {
                    anyErrors = true;
                    inputError(elem);
                }
            });
            
            if (anyErrors) return;
            
            var obj = { action: isNew ? 'insert' : 'update', properties: properties };
            
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
                
            var objects = JSON.stringify([obj]);
            
            sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", {WrapStyle: 'window', LayerName: layerName, objects: objects}, function(response)
            {
                if (!parseResponse(response))
                    return;

                $(_this).trigger('modify');
                removeDialog(dialogDiv);
                layer.chkLayerVersion(closeFunc);
            });
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
                    
                var columnNames = response.Result.fields;
                
                $(canvas).children("[loading]").remove();
                
                var geometryRow = response.Result.values[0];
                var types = response.Result.types;
                
                trs[0] = trs[1] = null; //резервируем место под геометрию и строчку идентификатора
                for (var i = 0; i < geometryRow.length; ++i)
                {
                    var tdValue = _td();
                    
                    if (columnNames[i] === 'geomixergeojson')
                    {
                        geometryInfoContainer = _span(null, [['css','color','#215570'],['css','marginLeft','3px'],['css','fontSize','12px']]);

                        if (geometryRow[i].type == "POINT" || geometryRow[i].type == "LINESTRING" || geometryRow[i].type == "POLYGON")
                        {
                            
                            // добавим маленький сдвиг, чтобы рисовать полигон, а не прямоугольник
                            /*	if (geometryRow[0].type == "POLYGON")
                            {
                                geometryRow[0].coordinates[0][0][0] += 0.00001;
                                geometryRow[0].coordinates[0][0][1] += 0.00001;
                            }*/
                            
                            var geom = from_merc_geometry(geometryRow[i]);
                            bindDrawingObject(globalFlashMap.drawing.addObject(geom));
                            
                            originalGeometry = geometryInfoRow.getDrawingObject().getGeometry();
                            
                            _(tdValue, [geometryInfoContainer]);
                        }
                        else
                        {
                            var info = _span([_t(geometryRow[i].type)], [['css','marginLeft','3px'],['css','fontSize','12px']]);
                            
                            _title(info, JSON.stringify(geometryRow[i].coordinates));
                        }
                        
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
                        
                        trs[0] = _tr([_td([_span([_t(_gtxt("Геометрия")), drawingBorderLink],[['css','fontSize','12px']])],[['css','height','20px']]), tdValue])
                    }
                    else if ( columnNames[i] === identityField )
                    {
                        _(tdValue, [_span([_t(geometryRow[i])],[['css','marginLeft','3px'],['css','fontSize','12px']])])
                            
                        trs[1] = _tr([_td([_span([_t(columnNames[i])],[['css','fontSize','12px']])],[['css','height','20px']]), tdValue])
                    }
                    else
                    {
                        var input = getInputElement(types[i]);
                        input.rowName = columnNames[i];
                        input.rowType = types[i];
                        input.value = nsGmx.Utils.convertFromServer(types[i], geometryRow[i]);
                        
                        _(tdValue, [input]);
                        
                        trs.push(_tr([_td([_span([_t(columnNames[i])],[['css','fontSize','12px']])]), tdValue]))
                    }
                }
                
                _(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
                
                _(canvas, [_div([createButton, removeButton],[['css','margin','10px 0px'],['css','height','20px']])]);
                
                resizeFunc();
            })
        }
        else
        {
            geometryInfoContainer = _span(null, [['css','color','#215570'],['css','marginLeft','3px'],['css','fontSize','12px']]);

            var drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png");
            
            drawingBorderLink.onclick = function()
            {
                nsGmx.Controls.chooseDrawingBorderDialog(
                    'editObject', 
                    bindDrawingObject, 
                    { geomType: layer.properties.GeometryType }
                );
            }
            
            _params.drawingObject && bindDrawingObject(_params.drawingObject);
            
            drawingBorderLink.style.margin = '0px 5px 0px 3px';
            
            trs.push(_tr([_td([_span([_t(_gtxt("Геометрия")), drawingBorderLink],[['css','fontSize','12px']])],[['css','height','20px']]), _td([geometryInfoContainer])]));
            
            for (var i = 0; i < layer.properties.attributes.length; ++i)
            {
                var input = getInputElement(layer.properties.attrTypes[i]);
                input.rowName = layer.properties.attributes[i];
                input.rowType = layer.properties.attrTypes[i];
                
                trs.push(_tr([_td([_span([_t(layer.properties.attributes[i])],[['css','fontSize','12px']])]), _td([input])]))
            }
            
            _(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
            
            _(canvas, [_div([createButton],[['css','margin','10px 0px'],['css','height','20px']])]);
            
            resizeFunc();
        }
    }
    
    createDialog();
}

nsGmx.EditObjectControl = EditObjectControl;

})();