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

var getValueForServer = function(type, input)
{
        
    if (type == 'integer' || type == 'float')
        return parseFloat(input.value);
        
    var value = input.value;
        
    if (type == 'date')
    {
        var localValue = $.datepicker.parseDate('dd.mm.yy', value).valueOf();
        var timeOffset = (new Date(localValue)).getTimezoneOffset()*60;
        
        return localValue/1000 - timeOffset;
    }
    else if (type == 'datetime')
    {
        var localValue = $.datepicker.parseDateTime('dd.mm.yy', 'hh:mm:ss', value).valueOf();
        var timeOffset = (new Date(localValue*1000)).getTimezoneOffset()*60;
        
        return localValue/1000 - timeOffset;
    }
    else if (type == 'time')
    {
        var resTime = $.datepicker.parseTime('hh:mm:ss', value);
        return resTime.hour*3600 + resTime.minute*60 + resTime.second;
    }
    
    return input.value;
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
    // if (type == 'integer' || type == 'float' || type == 'string' || type == 'boolean')
        // return _input( null,[['css','width','200px'],['dir','className','inputStyle']] );
        
    //return _span([_t('Не поддерживается')]);
}

var EditObjectControl = function(layerName, objectId)
{
    var _this = this;
    var isNew = typeof objectId === 'undefined';
    if (!isNew && EditObjectControlsManager.find(layerName, objectId))
        return EditObjectControlsManager.find(layerName, objectId);
    
    EditObjectControlsManager.add(layerName, objectId, this);
    
    var layer = globalFlashMap.layers[layerName];
    var geometryInfoContainer = null;
    
    var originalGeometry = null;
    var drawingBorderDialog = null;
    var identityField = layer.properties.identityField;
    
    
    var selectedDrawingObject = null;
    var selectedDrawingListener = null;
    var geometryInfoRow = null;
    
    layer.setVisibilityFilter('"' + identityField + '"<>' + objectId);
    
    var bindDrawingObject = function(obj)
    {
        if (selectedDrawingObject && selectedDrawingListener !== null)
        {
            selectedDrawingObject.removeListener('onRemove', selectedDrawingListener);
        }
        selectedDrawingObject = obj;
        selectedDrawingListener = selectedDrawingObject.addListener('onRemove', function()
        {
            selectedDrawingObject = null;
        })
        
        geometryInfoRow && geometryInfoRow.RemoveRow();
        $(geometryInfoContainer).empty();
        geometryInfoRow = new gmxCore.getModule('DrawingObjects').DrawingObjectInfoRow(
            globalFlashMap, 
            geometryInfoContainer, 
            selectedDrawingObject, 
            { editStyle: false, allowDelete: false }
        );        
    }
    
    var chooseDrawingBorderDialog = function()
    {
        if (drawingBorderDialog)
            return;
        
        var objects = [],
            _this = this;
        
        globalFlashMap.drawing.forEachObject(function(obj)
        {
            objects.push(obj);
        })
        
        if (!objects.length)
            showErrorMessage(_gtxt("$$phrase$$_12"), true, _gtxt("$$phrase$$_12"));
        else
        {
            var trs = [];
            
            for (var i = 0; i < objects.length; i++)
            {
                var type = objects[i].geometry.type,
                    coords = objects[i].geometry.coordinates,
                    title = _span(null, [['dir','className','title']]),
                    summary = _span(null, [['dir','className','summary']]),
                    tdName = _td([title, summary]),
                    returnButton = makeImageButton("img/choose.png", "img/choose_a.png"),
                    tr = _tr([_td([returnButton]), tdName]);
                
                if (type == "POINT")
                {
                    _(title, [_t(_gtxt("точка"))]);
                    _(summary, [_t("(" + formatCoordinates(merc_x(coords[0]), merc_y(coords[1])) + ")")]);
                }
                else if (type == "LINESTRING")
                {
                    _(title, [_t(_gtxt("линия"))]);
                    _(summary, [_t("(" + prettifyDistance(geoLength(coords)) + ")")]);
                }
                else if (type == "POLYGON")
                {
                    _(title, [_t(isRectangle(coords) ? _gtxt("прямоугольник") : _gtxt("многоугольник"))]);
                    _(summary, [_t("(" + prettifyArea(geoArea(coords)) + ")")]);
                }
                
                returnButton.style.cursor = 'pointer';
                returnButton.style.marginLeft = '5px';
                    
                (function(obj){
                    returnButton.onclick = function()
                    {
                        bindDrawingObject(obj);
                        removeDialog(drawingBorderDialog);
                        drawingBorderDialog = null;
                    }
                })(objects[i]);
                
                attachEffects(tr, 'hover')
                
                trs.push(tr)
            }
        
            var table = _table([_tbody(trs)], [['css','width','100%']]);
            
            drawingBorderDialog = showDialog(
                _gtxt("Выбор контура"), 
                _div([table], [['dir','className','drawingObjectsCanvas'],['css','width','220px']]), 
                250, 180, 
                false, false,
                false, function()
                {
                    drawingBorderDialog = null;
                }
            );
        }
    }    
    
    var createDialog = function()
    {
        var canvas = _div(),
		createButton = makeLinkButton(isNew ? _gtxt("Создать") : _gtxt("Изменить")),
		trs = [],
		tdGeometry = _td();
	
        createButton.onclick = function()
        {
            var properties = {};
            $(".inputStyle", canvas).each(function(index, elem)
            {
                properties[elem.rowName] = getValueForServer(elem.rowType, elem);
            });
            
            var obj = { action: isNew ? 'insert' : 'update', properties: properties };
            
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
                //closeFunc();
                removeDialog(dialogDiv);
                layer.chkLayerVersion(function()
                {
                    //layer.setVisibilityFilter();
                    closeFunc();
                });
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
            if (selectedDrawingObject)
                selectedDrawingObject.remove();
                
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
                            
                            originalGeometry = selectedDrawingObject.getGeometry();

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
                            chooseDrawingBorderDialog();
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
                        // var input = getInputElement(layer.properties.attrTypes[i]);
                        var input = getInputElement(types[i]);
                        input.rowName = columnNames[i];
                        input.rowType = types[i];
                        input.value = window._convertFromServer(types[i], geometryRow[i]);
                        //var input = _input(null,[['attr','value',geometryRow[i]],['css','width','200px'],['dir','className','inputStyle'], ['dir', 'rowName', columnNames[i]]]);
                        
                        _(tdValue, [input]);
                        
                        trs.push(_tr([_td([_span([_t(columnNames[i])],[['css','fontSize','12px']])]), tdValue]))
                    }
                }
                
                _(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
                
                _(canvas, [_div([createButton],[['css','margin','10px 0px'],['css','height','20px']])]);
                
                resizeFunc();
            })
        }
        else
        {
            geometryInfoContainer = _span(null, [['css','color','#215570'],['css','marginLeft','3px'],['css','fontSize','12px']]);

            var drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png");
            
            drawingBorderLink.onclick = function()
            {
                chooseDrawingBorderDialog();
            }
            
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