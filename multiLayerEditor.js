(function(){

//получает с сервера информацию о мультислое и рисует диалог редактирования его настроек
var createMultiLayerEditorServer = function(elemProperties, div, mapHelper)
{
    sendCrossDomainJSONRequest(serverBase + "MultiLayer/GetMultiLayerFullInfo.ashx?MultiLayerID=" + elemProperties.MultiLayerID, function(response)
    {
        if (!parseResponse(response))
            return;
            
        doCreateMultiLayerEditor(elemProperties, response.Result.Layers, response.Result.LayersToAdd, div, mapHelper);
    })
}

var doCreateMultiLayerEditor = function(elemProperties, layers, layersToAdd, div, mapHelper)
{
    var commonLayersListDiv = _div(null, [['css', 'height', '100%'], ['css', 'width', '100%']]);
    var selectedLayersDiv = _div(null, [['css', 'height', '100%'], ['css', 'margin', '10px 10px 0px 0px']]);
    
    var selectedLayersTable = new scrollTable();
    
    _queryMapLayers.layersList = layersToAdd;

    var suggestLayersTable = nsGmx.createLayersManagerInDiv(commonLayersListDiv, 'multilayers', {
        showType: false, 
        enableDragging: false,
        onclick: function(context)
        {
            context.scrollTable.getDataProvider().filterOriginalItems(function(elem)
            {
                return elem.LayerID != context.elem.LayerID;
            });
            
            selectedLayersTable.getDataProvider().addOriginalItem(context.elem);
        }
    });
    
    
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
                
                suggestLayersTable.getDataProvider().addOriginalItem(layer);
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
    title.onkeyup = function()
    {
        if (div)
        {
            var span = $(div).find(".layer")[0];
        
            removeChilds(span);
            
            _(span, [_t(title.value)]);

            div.gmxProperties.content.properties.title = title.value;
            
            mapHelper.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
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
            
            mapHelper.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
        }
        
        return true;
    }
    
    shownProperties.push({name: _gtxt("Имя"), field: 'Title', elem: title});
    shownProperties.push({name: _gtxt("Описание"), field: 'Description', elem: descr});
    
    var trs = _mapHelper.createPropertiesTable(shownProperties, elemProperties, {leftWidth: 70});
    _(propertiesDiv, [_table([_tbody(trs)],[['dir','className','propertiesTable']])]);
    
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
            
        var updateInfo = {Properties: {MultiLayerID: elemProperties.MultiLayerID, Title: title.value, Description: descr.value, WMSAccess: false}, Layers: layers, LayersChanged: true};
        
        var scriptName = isCreate ? "Insert.ashx" : "Update.ashx";
        
        sendCrossDomainJSONRequest(serverBase + "MultiLayer/" + scriptName + "?MultiLayerInfo=" + encodeURIComponent(JSON.stringify(updateInfo)), function(response)
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
                mapName:  mapHelper.mapProperties.name,
                hostName: mapHelper.mapProperties.hostName,
                visible:  isCreate ? true : layerDiv.gmxProperties.content.properties.visible,
                styles:   isCreate ? [{MinZoom: response.Result.properties.MinZoom, MaxZoom: response.Result.properties.MaxZoom}] : layerDiv.gmxProperties.content.properties.styles
            });
            var convertedCoords = from_merc_geometry(response.Result.geometry);
            
            var layerData = {type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}};
            
            if (!isCreate)
                _queryMapLayers.removeLayer(newLayerProperties.name);

            _layersTree.addLayersToMap(layerData);
            
            var divParent = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
            
            var li = _layersTree.getChildsList(layerData, divParent.gmxProperties, false, true);
            
            
            
            var divElem = $(li).children("div[MultiLayerID]")[0],
                index = _mapHelper.findTreeElem(divElem).index;
                
            if (isCreate)
            {
                _abstractTree.addNode(_queryMapLayers.buildedTree.firstChild, li);
                _mapHelper.addTreeElem(divParent, index, layerData);
            }
            else
            {
                $(layerDiv.parentNode).replaceWith(li);
                _mapHelper.findTreeElem($(li).children("div[MultiLayerID]")[0]).elem = layerData;
            }
                
            _queryMapLayers.addSwappable(li);
            _queryMapLayers.addDraggable(li);
            _layersTree.updateListType(li);
            _mapHelper.updateUnloadEvent(true);
            
            $(jQueryDialog).dialog("close");
			$(jQueryDialog).dialog("destroy");
            jQueryDialog.removeNode(true);
        });
    }
    
    var divProperties = _div();
    _(divProperties, [_table([_tbody([
        _tr([
            _td([_table([_tbody([
                _tr([_td([propertiesDiv])]),
                _tr([_td([selectedLayersDiv])])
            ])], [['css', 'width', '100%']])], [['css', 'verticalAlign', 'top']]),
            _td([commonLayersListDiv], [['css', 'width', '60%']])]),
        _tr([_td([saveButton], [['attr', 'colspan', '2']])])
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
            
            _mapHelper.findTreeElem(div).elem.content.properties = elemProperties;
        });
        
        var dialogContainer = _div([_ul([_li([_a([_t(_gtxt("Свойства"))],[['attr','href','#properties' + elemProperties.name]])]),
                                 _li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + elemProperties.name]])])])]);
                             
        _(dialogContainer, [divProperties, divStyles]);
        $(dialogContainer).tabs({selected: 0});
    }
    else
        dialogContainer = divProperties;
    
    var jQueryDialog = showDialog(_gtxt('Мультислой [value0]', elemProperties.title || ''), dialogContainer, 900, 500, false, false, null);
}

gmxCore.addModule('MultiLayerEditor', {
    createMultiLayerEditorServer: createMultiLayerEditorServer,
    doCreateMultiLayerEditor: doCreateMultiLayerEditor
})

})();