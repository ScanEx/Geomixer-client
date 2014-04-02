//Диалог создания/редактирования мультислоя.
(function(){

//params:
//  properties - свойства слоя по умолчанию
//  layers - список слоёв по умолчанию
var createMultiLayerEditorNew = function(layersTree, params)
{
    params = params || {};
    doCreateMultiLayerEditor( params.properties || {}, params.layers || [], null, layersTree );
}

//получает с сервера информацию о мультислое и рисует диалог редактирования его настроек
var createMultiLayerEditorServer = function(elemProperties, div, layersTree)
{
    sendCrossDomainJSONRequest(serverBase + "MultiLayer/GetMultiLayerFullInfo.ashx?MultiLayerID=" + elemProperties.MultiLayerID, function(response)
    {
        if (!parseResponse(response))
            return;
            
        var elemPropertiesFull = $.extend(true, response.Result.Properties, elemProperties);
        doCreateMultiLayerEditor(elemPropertiesFull, response.Result.Layers, div, layersTree);
    })
}

var doCreateMultiLayerEditor = function(elemProperties, layers, div, layersTree)
{
    var commonLayersListDiv = _div(null, [['css', 'height', '100%'], ['css', 'width', '100%']]);
    var selectedLayersDiv = _div(null, [['css', 'height', '100%'], ['css', 'margin', '10px 10px 0px 0px']]);
    
    var selectedLayersTable = new nsGmx.ScrollTable({height: div ? 255 : 280});
    
    var suggestLayersControl = new nsGmx.LayerManagerControl(commonLayersListDiv, 'multilayers', {
        fixType: ['raster', 'catalog'], 
        enableDragging: false,
        onclick: function(context)
        {
            selectedLayersTable.getDataProvider().addOriginalItem(context.elem);
            suggestLayersControl.disableLayers(context.elem.name);
        }
    });
    
    var suggestLayersTable = suggestLayersControl.getScrollTable();
    
    selectedLayersTable.createTable(selectedLayersDiv, 'selectedLayersTables', 0, 
        ["", _gtxt("Тип"), _gtxt("Имя"), _gtxt("Дата"), _gtxt("Владелец"), "", "", ""],
        ['1%','5%','40%','19%','20%', '5%', '5%', '5%'], 
        function(layer)
        {
            var baseTR = nsGmx.drawLayers.apply(this, [layer, {onclick: null, enableDragging: false}]);
            var downButton = makeImageButton('img/down.png', 'img/down_a.png');
            var upButton = makeImageButton('img/up.png', 'img/up_a.png');
            var deleteButton = makeImageButton('img/recycle.png', 'img/recycle_a.png');
            var _this = this;
            deleteButton.onclick = function()
            {
                _this.getDataProvider().filterOriginalItems(function(elem)
                {
                    return elem.LayerID != layer.LayerID;
                })
                
                //suggestLayersTable.getDataProvider().addOriginalItem(layer);
                suggestLayersControl.enableLayers(layer.name);
            }
            downButton.onclick = function()
            {
                var vals = _this.getDataProvider().getOriginalItems();
                for (var i = 0; i < vals.length-1; i++)
                    if (vals[i].LayerID === layer.LayerID)
                    {
                        vals.splice(i, 1);
                        vals.splice(i+1, 0, layer);
                        _this.getDataProvider().setOriginalItems(vals);
                        break;
                    }
            }
            upButton.onclick = function()
            {
                var vals = _this.getDataProvider().getOriginalItems();
                for (var i = 1; i < vals.length; i++)
                    if (vals[i].LayerID === layer.LayerID)
                    {
                        vals.splice(i, 1);
                        vals.splice(i-1, 0, layer);
                        _this.getDataProvider().setOriginalItems(vals);
                        break;
                    }
            }
            $('td:last', baseTR).remove(); //удаляем правый отступ
            $(baseTR).append($("<td></td>").append(downButton));
            $(baseTR).append($("<td></td>").append(upButton));
            $(baseTR).append($("<td></td>").append(deleteButton));
            return baseTR;
        }, {});
    
    selectedLayersTable.getDataProvider().setOriginalItems(layers);    
    
    var propertiesDiv = _div(null, [['css', 'width', '100%'], ['css', 'height', '100%']]);
    var shownProperties = [];
    var title = _input(null,[['attr','fieldName','title'],['attr','value', elemProperties.title || ''],['dir','className','inputStyle'],['css','width','220px']])
    var isCreatedDrawing = false;
    title.onkeyup = function()
    {
        if (div)
        {
            var span = $(div).find(".layer")[0];
        
            removeChilds(span);
            
            _(span, [_t(title.value)]);

            div.gmxProperties.content.properties.title = title.value;
            
            layersTree.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
        }
        
        return true;
    }
    var descr = _textarea(null,[['attr','fieldName','description'],['dir','className','inputStyle'],['css','width','220px'],['css','height','50px']]);
    descr.value = elemProperties.description || '';
    
    descr.onkeyup = function()
    {
        if (div)
        {
            var span = $(div).find(".layerDescription")[0];
        
            removeChilds(span);
            
            span.innerHTML = descr.value;

            div.gmxProperties.content.properties.description = descr.value;
            
            layersTree.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
        }
        
        return true;
    }
    
    var borderContainer = _div(),
        shpContainer = _div(null, [['css', 'display', 'none'], ['css', 'margin', '3px']]),
        borderLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
        shpBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png");
    var borderTr = _tr([
        _td([_t(_gtxt("Граница")), borderLink, _br(), _t(_gtxt("Из файла")), shpBorderLink], [['css','paddingLeft','5px'],['css','fontSize','12px']]), 
        _td([borderContainer, shpContainer])
    ]);
    
    var shpGeometry = null;
    var multiObj = null;
    var fileInput = _input(null, [['attr', 'type', 'file'], ['attr', 'name', 'file'], ['attr', 'id', 'upload_shapefile']]);
	fileInput.onchange = function()
	{
		if (this.value === "") 
            return;
            
        nsGmx.Utils.parseShpFile(postForm).done(function(objs)
        {
            if (objs.length == 0)
            {
                showErrorMessage(_gtxt("Загруженный shp-файл пуст"), true);
                return;
            }
            
            var joinedPolygon = nsGmx.Utils.joinPolygons(objs);
            
            if (!joinedPolygon)
            {
                //TODO: ошибка
            }
            else if (joinedPolygon.type === "MULTIPOLYGON")
            {
                bindMultipolygon(joinedPolygon)
            }
            else if (joinedPolygon.type === "POLYGON")
            {
                isCreatedDrawing = true;
                bindPolygon(globalFlashMap.drawing.addObject(joinedPolygon))
            }
            
            $(borderContainer).show();
            $(shpContainer).hide();
        })
	}
	
	//задаём одновременно и enctype и encoding для корректной работы в IE
	var postForm = _form([fileInput], [['attr', 'method', 'POST'], ['attr', 'encoding', 'multipart/form-data'], ['attr', 'enctype', 'multipart/form-data'], ['attr', 'id', 'upload_shapefile_form']]);
    $(shpContainer).append(postForm);
    
    var bindPolygon = function(polygon)
    {
        $(borderContainer).show();
        $(shpContainer).hide();
        
        geometryInfoRow && geometryInfoRow.RemoveRow();
        removeMultipolygon();
        var InfoRow = gmxCore.getModule('DrawingObjects').DrawingObjectInfoRow;
        geometryInfoRow = new InfoRow(
            globalFlashMap, 
            borderContainer, 
            polygon, 
            { editStyle: false }
        );
        
        $(geometryInfoRow).bind('onRemove', function()
        {
            if (isCreatedDrawing)
                geometryInfoRow.getDrawingObject().remove();
            else
                geometryInfoRow.RemoveRow();
            
            isCreatedDrawing = false;
            
            geometryInfoRow = null;
        })
    }
    
    var removeMultipolygon = function()
    {
        if (multiObj || shpGeometry)
        {
            multiObj && multiObj.remove();
            multiObj = null;
            shpGeometry = null;
            $(borderContainer).empty();
        }
    }
    
    var bindMultipolygon = function(multigeometry)
    {
        multiObj = globalFlashMap.addObject(multigeometry);
        multiObj.setStyle({outline: {color: 0x0000ff, thickness: 3}});
        
        if (geometryInfoRow && geometryInfoRow.getDrawingObject())
        {
            if (isCreatedDrawing)
                 geometryInfoRow.getDrawingObject().remove();
            else
                geometryInfoRow.RemoveRow();
                
            isCreatedDrawing = false;
        }
        
        geometryInfoRow = null;
        
        $(borderContainer).append($('<span/>').css('margin', '3px').text(_gtxt("Мультиполигон")));
        shpGeometry = multigeometry;
        var remove = makeImageButton(serverBase + 'api/img/closemin.png', serverBase + 'api/img/close_orange.png');
        remove.setAttribute('title', _gtxt('Удалить'));
        remove.onclick = removeMultipolygon;
        remove.style.verticalAlign = 'middle';
        
        $(borderContainer).append(remove);
    }
    
    var geometryInfoRow = null;
    borderLink.style.marginLeft = '3px';
    shpBorderLink.style.marginLeft = '3px';
    borderLink.onclick = function()
    {
        nsGmx.Controls.chooseDrawingBorderDialog( 
            '_MultilayerDialog', 
            bindPolygon, 
            {geomType: 'POLYGON', errorMessage: _gtxt("$$phrase$$_17")} 
        );
    }
    
    shpBorderLink.onclick = function()
    {
        $(borderContainer).hide();
        $(shpContainer).show();
    }
    
    if (elemProperties.UserBorder)
    {
        if (elemProperties.UserBorder.type == "MULTIPOLYGON")
        {
            bindMultipolygon(gmxAPI.from_merc_geometry(elemProperties.UserBorder));
        }
        else
        {
            isCreatedDrawing = true;
            bindPolygon(globalFlashMap.drawing.addObject(gmxAPI.from_merc_geometry(elemProperties.UserBorder)));
        }
    }
    
    shownProperties.push({name: _gtxt("Имя"), field: 'Title', elem: title});
    shownProperties.push({name: _gtxt("Описание"), field: 'Description', elem: descr});
    div && shownProperties.push({name: _gtxt("ID"), field: 'Name'});
    shownProperties.push({tr: borderTr});
    
    var trs = _mapHelper.createPropertiesTable(shownProperties, elemProperties, {leftWidth: 70});
    _(propertiesDiv, [_table([_tbody(trs)],[['dir','className','propertiesTable']])]);
    
    var getUserBorder = function()
    {
        if (geometryInfoRow && geometryInfoRow.getDrawingObject())
            return merc_geometry(geometryInfoRow.getDrawingObject().geometry);
        
        return merc_geometry(shpGeometry) || null;
    }
    
    var isCreate = div === null;
    var saveButton = makeLinkButton(isCreate ? _gtxt("Создать") : _gtxt("Изменить"));
    saveButton.onclick = function()
    {
        var errorElems = [];
        
        if (title.value === '') errorElems.push(title);
        if (!selectedLayersTable.getDataProvider().getOriginalItems().length) errorElems.push(selectedLayersDiv);
        
        for (var i = 0; i < errorElems.length; i++)
            inputError(errorElems[i], 2000);
        
        if (errorElems.length) return;
        
        var layers = [];
        var selectedItems = selectedLayersTable.getDataProvider().getOriginalItems();
        for (var l = 0; l < selectedItems.length; l++)
            layers.push({LayerID: selectedItems[l].LayerID});
            
        var updateInfo = {
            Properties: {
                MultiLayerID: elemProperties.MultiLayerID, 
                Title: title.value, 
                Description: descr.value, 
                WMSAccess: false,
                UserBorder: getUserBorder()
            },
            Layers: layers, 
            LayersChanged: true
        };
        
        var scriptName = isCreate ? "Insert.ashx" : "Update.ashx";
        
        sendCrossDomainPostRequest(serverBase + "MultiLayer/" + scriptName, {
                WrapStyle: 'window',
                MultiLayerInfo: JSON.stringify(updateInfo)
            },
            function(response)
            {
                if ( !parseResponse(response) )
                    return;
                    
                var layerDiv = null;
                
                if (!isCreate)
                {
                    layerDiv = $(_queryMapLayers.buildedTree).find("[MultiLayerID='" + response.Result.properties.MultiLayerID + "']")[0];
                }
                    
                var newLayerProperties = $.extend(true, response.Result.properties,
                {
                    mapName:  layersTree.treeModel.getMapProperties().name,
                    hostName: layersTree.treeModel.getMapProperties().hostName,
                    visible:  isCreate ? true : layerDiv.gmxProperties.content.properties.visible,
                    styles:   isCreate ? [{MinZoom: response.Result.properties.MinZoom, MaxZoom: response.Result.properties.MaxZoom}] : layerDiv.gmxProperties.content.properties.styles
                });

                var layerData = {type:'layer', content:{properties: newLayerProperties, geometry: response.Result.geometry}};
                
                if (!isCreate)
                    _queryMapLayers.removeLayer(newLayerProperties.name);

                _layersTree.addLayersToMap(layerData);
                
                var divParent = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
                
                var li = _layersTree.getChildsList(layerData, divParent.gmxProperties, false, true);
                
                if (isCreate)
                {
                    _abstractTree.addNode(_queryMapLayers.buildedTree.firstChild, li);
                    layersTree.addTreeElem(divParent, 0, layerData);
                }
                else
                {
                    $(layerDiv.parentNode).replaceWith(li);
                    _layersTree.findTreeElem($(li).children("div[MultiLayerID]")[0]).elem = layerData;
                }
                
                geometryInfoRow && geometryInfoRow.getDrawingObject() && geometryInfoRow.getDrawingObject().remove();
                
                removeMultipolygon();
                    
                _queryMapLayers.addSwappable(li);
                _queryMapLayers.addDraggable(li);
                _layersTree.updateListType(li);
                
                $(jQueryDialog).dialog("close");
                $(jQueryDialog).dialog("destroy");
                jQueryDialog.removeNode(true);
            }
        );
    }
    
    var divProperties = _div();
    _(divProperties, [_table([_tbody([
        _tr([
            _td([_table([_tbody([
                _tr([_td([propertiesDiv])]),
                _tr([_td([selectedLayersDiv])])
            ])], [['css', 'width', '100%']])], [['css', 'verticalAlign', 'top']]),
            _td([commonLayersListDiv], [['css', 'width', '60%']])]),
        _tr([_td([saveButton], [['attr', 'colSpan', '2']])])
    ])], [['css', 'width', '100%']])], [['attr','id','properties' + elemProperties.name]]);
    
    var dialogContainer;
    if (!isCreate)
    {
        var divStyles = _div(null, [['attr','id','styles' + elemProperties.name]]);
        
        var zoomPropertiesControl = new nsGmx.ZoomPropertiesControl(elemProperties.styles[0].MinZoom, elemProperties.styles[0].MaxZoom),
            liMinZoom = zoomPropertiesControl.getMinLi(),
            liMaxZoom = zoomPropertiesControl.getMaxLi();
                
        _(divStyles, [_ul([liMinZoom, liMaxZoom])]);
                
        $(zoomPropertiesControl).change(function()
        {
            globalFlashMap.layers[elemProperties.name].setZoomBounds(this.getMinZoom(), this.getMaxZoom());
            elemProperties.styles[0].MinZoom = zoomPropertiesControl.getMinZoom();
            elemProperties.styles[0].MaxZoom = zoomPropertiesControl.getMaxZoom();
            
            _layersTree.findTreeElem(div).elem.content.properties = elemProperties;
        });
        
        var dialogContainer = _div([_ul([_li([_a([_t(_gtxt("Общие"))],[['attr','href','#properties' + elemProperties.name]])]),
                                 _li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + elemProperties.name]])])])]);
                             
        _(dialogContainer, [divProperties, divStyles]);
        $(dialogContainer).tabs({selected: 0});
    }
    else
        dialogContainer = divProperties;
        
    var closeFunc = function()
    {
        removeMultipolygon();
        
        if (geometryInfoRow && geometryInfoRow.getDrawingObject())
        {
            if (isCreatedDrawing)
                 geometryInfoRow.getDrawingObject().remove();
            else
                geometryInfoRow.RemoveRow();
                
            isCreatedDrawing = false;
        }
    }
    
    var jQueryDialog = showDialog(_gtxt('Мультислой [value0]', elemProperties.title || ''), dialogContainer, 900, 530, false, false, null, closeFunc);
}

gmxCore.addModule('MultiLayerEditor', {
    createMultiLayerEditorServer: createMultiLayerEditorServer,
    createMultiLayerEditorNew: createMultiLayerEditorNew
})

})();