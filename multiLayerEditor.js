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
    
    // var _this = this;
    
    _queryMapLayers.layersList = layersToAdd;

    _queryMapLayers._createLayersManagerInDiv(commonLayersListDiv, 'multilayers', {
        showType: false, 
        enableDragging: false,
        onclick: function(context)
        {
            var filteredValues = _filter(function(elem)
            {
                return elem.LayerID != context.elem.LayerID;
            }, context.scrollTable.vals);
            
            context.scrollTable.setValues(filteredValues);
            
            context.scrollTable.drawFilterTable();
            
            selectedLayersTable.setValues(selectedLayersTable.vals.concat([context.elem]));
            selectedLayersTable.drawFilterTable();
        }
    });
    
    
    selectedLayersTable.createTable(selectedLayersDiv, 'selectedLayersTables', 0, 
        ["", _gtxt("Тип"), _gtxt("Имя"), _gtxt("Дата"), _gtxt("Владелец"), "", "", ""],
        ['1%','5%','40%','19%','20%', '5%', '5%', '5%'], 
        function(layer)
        {
            var baseTR = _queryMapLayers.drawLayers.apply(this, [layer, {onclick: null, enableDragging: false}]);
            var downButton = makeImageButton('img/down.png', 'img/down_a.png');
            var upButton = makeImageButton('img/up.png', 'img/up_a.png');
            var deleteButton = makeImageButton('img/recycle.png', 'img/recycle_a.png');
            var _this = this;
            deleteButton.onclick = function()
            {
                var filteredValues = _filter(function(elem)
                {
                    return elem.LayerID != layer.LayerID;
                }, _this.vals);
                _this.setValues(filteredValues);
                _this.drawFilterTable();
            }
            downButton.onclick = function()
            {
                for (var i = 0; i < _this.vals.length-1; i++)
                    if (_this.vals[i].LayerID === layer.LayerID)
                    {
                        _this.vals.splice(i, 1);
                        _this.vals.splice(i+1, 0, layer);
                        _this.setValues(_this.vals);
                        _this.drawFilterTable();
                        break;
                    }
            }
            upButton.onclick = function()
            {
                for (var i = 1; i < _this.vals.length; i++)
                    if (_this.vals[i].LayerID === layer.LayerID)
                    {
                        _this.vals.splice(i, 1);
                        _this.vals.splice(i-1, 0, layer);
                        _this.setValues(_this.vals);
                        _this.drawFilterTable();
                        break;
                    }
            }
            $('td:last', baseTR).remove(); //удаляем правый отступ
            $(baseTR).append($("<td></td>").append(downButton));
            $(baseTR).append($("<td></td>").append(upButton));
            $(baseTR).append($("<td></td>").append(deleteButton));
            return baseTR;
        }, {});
    
    selectedLayersTable.setValues(layers);
    selectedLayersTable.drawFilterTable();
    
    var propertiesDiv = _div(null, [['css', 'width', '100%'], ['css', 'height', '100%']]);
    var shownProperties = [];
    var title = _input(null,[['attr','fieldName','title'],['attr','value', elemProperties.title],['dir','className','inputStyle'],['css','width','220px']])
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
    descr.value = elemProperties.description;
    
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
        if (!selectedLayersTable.vals.length) errorElems.push(selectedLayersDiv);
        
        for (var i = 0; i < errorElems.length; i++)
            (function(elem)
            {
                $(elem).addClass('error');                
                setTimeout(function()
                {
                    if (elem)
                        $(elem).removeClass('error')
                }, 2000)
            })(errorElems[i]);
        
        if (errorElems.length) return;
        
        var layers = [];
        for (var l = 0; l < selectedLayersTable.vals.length; l++)
            layers.push({LayerID: selectedLayersTable.vals[l].LayerID});
            
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
                styles:   isCreate ? [{MinZoom: response.Result.properties.MinZoom, MaxZoom: 21}] : layerDiv.gmxProperties.content.properties.styles
            });
            var convertedCoords = from_merc_geometry(response.Result.geometry);
            
            
            if (!isCreate)
                _queryMapLayers.removeLayer(newLayerProperties.name);

            _layersTree.addLayersToMap({content:{properties:newLayerProperties, geometry:convertedCoords}});
            
            var divParent = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
            
            var li = _layersTree.getChildsList({type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}}, divParent.gmxProperties, false, true);
            
            
            
            var divElem = $(li).children("div[MultiLayerID]")[0],
                index = _mapHelper.findTreeElem(divElem).index;
                
            if (isCreate)
            {
                _abstractTree.addNode(_queryMapLayers.buildedTree.firstChild, li);
                _mapHelper.addTreeElem(divParent, index, {type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}});
            }
            else
            {
                $(layerDiv.parentNode).replaceWith(li);
                _mapHelper.findTreeElem($(li).children("div[MultiLayerID]")[0]).elem = {type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}};
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
    
    var dialogDiv = _div();
    _(dialogDiv, [_table([_tbody([
        _tr([
            _td([_table([_tbody([
                _tr([_td([propertiesDiv])]),
                _tr([_td([selectedLayersDiv])])
            ])], [['css', 'width', '100%']])], [['css', 'verticalAlign', 'top']]),
            _td([commonLayersListDiv], [['css', 'width', '60%']])]),
        _tr([_td([saveButton], [['attr', 'colspan', '2']])])
    ])], [['css', 'width', '100%'], ['css', 'height', '100%']])]);
    
    var jQueryDialog = showDialog(_gtxt('Мультислой [value0]', elemProperties.title), dialogDiv, 900, 500, false, false, null);
}

gmxCore.addModule('MultiLayerEditor', {
    createMultiLayerEditorServer: createMultiLayerEditorServer,
    doCreateMultiLayerEditor: doCreateMultiLayerEditor
})

})();