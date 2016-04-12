//Диалог создания/редактирования мультислоя.
!(function(_){

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
    var isReadonly = div && _queryMapLayers.layerRights(div.gmxProperties.content.properties.name) !== 'edit';
    
    var commonLayersListDiv = _div(null, [['css', 'height', '100%'], ['css', 'width', '100%']]);
    var selectedLayersDiv = _div(null, [['css', 'height', '100%'], ['css', 'margin', '10px 0px 0px 0px']]);
    
    var selectedLayersTable = new nsGmx.ScrollTable({height: div ? 255 : 280});
        
    if (!isReadonly) {
        var suggestLayersControl = new nsGmx.LayerManagerControl(commonLayersListDiv, 'multilayers', {
            fixType: ['raster', 'catalog'], 
            enableDragging: false,
            onclick: function(context)
            {
                selectedLayersTable.getDataProvider().addOriginalItem(context.elem);
                suggestLayersControl.disableLayers(context.elem.name);
            }
        });
    }
    
    var uiSelectedRowTemplate = Handlebars.compile('<tr>' +
        '<td><div class="gmx-icon-{{iconClass}}"></div></td>' +
        '<td><div class="multilayer-row-title-outer"><div class="multilayer-row-title-inner" title="{{title}}">{{title}}</div></div></td>' +
        '{{#unless isReadonly}}' +
            '<td><div class="gmx-icon-downtriangle"></div></td>' +
            '<td><div class="gmx-icon-uptriangle"></div></td>' +
            '<td class="multilayer-row-td"><div class="gmx-icon-recycle"></div></td>' +
        '{{/unless}}' +
    '</tr>');
        
    selectedLayersTable.createTable(selectedLayersDiv, 'selectedLayersTables', 0, 
        isReadonly ? [_gtxt("Тип"), _gtxt("Имя")] : [_gtxt("Тип"), _gtxt("Имя"), "", "", ""],
        isReadonly ? ['5%','95%'] : ['5%','80%', '5%', '5%', '5%'], 
        function(layer)
        {
            var ui = $(uiSelectedRowTemplate({
                title: layer.title,
                iconClass: layer.type == "Vector" ? 'vector' : 'raster',
                isReadonly: isReadonly
            }));

            var _this = this;
            ui.find('.gmx-icon-recycle').click(function()
            {
                _this.getDataProvider().filterOriginalItems(function(elem)
                {
                    return elem.LayerID != layer.LayerID;
                })
                
                suggestLayersControl.enableLayers(layer.name);
            });
            
            ui.find('.gmx-icon-downtriangle').click(function()
            {
                var vals = _this.getDataProvider().getOriginalItems();
                for (var i = 0; i < vals.length-1; i++) {
                    if (vals[i].LayerID === layer.LayerID) {
                        vals.splice(i, 1);
                        vals.splice(i+1, 0, layer);
                        _this.getDataProvider().setOriginalItems(vals);
                        break;
                    }
                }
            });
            
            ui.find('.gmx-icon-uptriangle').click(function()
            {
                var vals = _this.getDataProvider().getOriginalItems();
                for (var i = 1; i < vals.length; i++) {
                    if (vals[i].LayerID === layer.LayerID) {
                        vals.splice(i, 1);
                        vals.splice(i-1, 0, layer);
                        _this.getDataProvider().setOriginalItems(vals);
                        break;
                    }
                }
            });
            
            ui.children().each(function(i, elem) {
                elem.style.width = _this._fields[i].width;
            });
            
            return ui[0];
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
        
            $(span).empty();
            
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
        
            $(span).empty();
            
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
            
            var joinedPolygon = nsGmx.Utils.joinPolygons(nsGmx._.pluck(objs, 'geometry'));
            
            if (!joinedPolygon) {
                //TODO: ошибка
            } else {
                isCreatedDrawing = true;
                bindPolygon(nsGmx.leafletMap.gmxDrawing.addGeoJSON(L.gmxUtil.geometryToGeoJSON(joinedPolygon))[0]);
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
        var InfoRow = gmxCore.getModule('DrawingObjects').DrawingObjectInfoRow;
        geometryInfoRow = new InfoRow(
            nsGmx.leafletMap, 
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
        isCreatedDrawing = true;
        bindPolygon(nsGmx.leafletMap.gmxDrawing.addGeoJSON(L.gmxUtil.geometryToGeoJSON(elemProperties.UserBorder, true))[0]);
    }
    
    shownProperties.push({name: _gtxt("Имя"), field: 'Title', elem: title});
    shownProperties.push({name: _gtxt("Описание"), field: 'Description', elem: descr});
    div && shownProperties.push({name: _gtxt("ID"), field: 'Name'});
    
    isReadonly || shownProperties.push({tr: borderTr});
    
    var trs = _mapHelper.createPropertiesTable(shownProperties, elemProperties, {leftWidth: 70});
    _(propertiesDiv, [_table([_tbody(trs)],[['dir','className','propertiesTable']])]);
    
    var getUserBorder = function()
    {
        if (geometryInfoRow && geometryInfoRow.getDrawingObject()) {
            return L.gmxUtil.geoJSONtoGeometry(geometryInfoRow.getDrawingObject().toGeoJSON().geometry, true);
        } else {
            return null;
        }
    }
    
    var isCreate = div === null;
    var saveButton;
    
    if (isReadonly) {
        saveButton = _div([_t(_gtxt("Недостаточно прав для редактирования настроек слоя"))],[['css','color','red']]);
    } else {
        saveButton = makeLinkButton(isCreate ? _gtxt("Создать") : _gtxt("Изменить"));
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
                    
                    _queryMapLayers.addSwappable(li);
                    _queryMapLayers.addDraggable(li);
                    _layersTree.updateListType(li);
                    
                    $(jQueryDialog).dialog("destroy");
                    jQueryDialog.removeNode(true);
                }
            );
        }
    }
    
    var divProperties = _div();
    _(divProperties, [_table([_tbody([
        _tr([
            _td([_table([_tbody([
                _tr([_td([propertiesDiv])]),
                _tr([_td([selectedLayersDiv])])
            ])], [['css', 'width', '100%']])], [['css', 'verticalAlign', 'top'], ['css', 'width', '311px']]),
            _td([commonLayersListDiv], [['css', 'paddingLeft', '10px']])]),
        _tr([_td([saveButton], [['attr', 'colSpan', '2']])])
    ])], [['css', 'width', '100%']])], [['attr','id','properties' + elemProperties.name]]);
    
    var dialogContainer;
    if (!isCreate)
    {
        var divStyles = _div(null, [['attr','id','styles' + elemProperties.name]]);
        
        var zoomSource = elemProperties.styles && elemProperties.styles[0] || elemProperties;
        var zoomPropertiesControl = new nsGmx.ZoomPropertiesControl(zoomSource.MinZoom, zoomSource.MaxZoom),
            liMinZoom = zoomPropertiesControl.getMinLi(),
            liMaxZoom = zoomPropertiesControl.getMaxLi();
                
        _(divStyles, [_ul([liMinZoom, liMaxZoom])]);
                
        $(zoomPropertiesControl).change(function()
        {
            nsGmx.gmxMap.layersByID[elemProperties.name].setZoomBounds(this.getMinZoom(), this.getMaxZoom());
            
            elemProperties.styles = elemProperties.styles || [];
            elemProperties.styles[0] = elemProperties.styles[0] || {};
            elemProperties.styles[0].MinZoom = zoomPropertiesControl.getMinZoom();
            elemProperties.styles[0].MaxZoom = zoomPropertiesControl.getMaxZoom();
            
            _layersTree.findTreeElem(div).elem.content.properties = elemProperties;
        });
        
        var dialogContainer = _div([_ul([_li([_a([_t(_gtxt("Общие"))],[['attr','href','#properties' + elemProperties.name]])]),
                                 _li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + elemProperties.name]])])])]);
                             
        _(dialogContainer, [divProperties, divStyles]);
        $(dialogContainer).tabs({active: 0});
    }
    else
        dialogContainer = divProperties;
        
    var closeFunc = function()
    {
        if (geometryInfoRow && geometryInfoRow.getDrawingObject())
        {
            if (isCreatedDrawing)
                 geometryInfoRow.getDrawingObject().remove();
            else
                geometryInfoRow.RemoveRow();
                
            isCreatedDrawing = false;
        }
    }
    
    if (isReadonly) {
        $(dialogContainer).find('input, textarea').prop('disabled', true);
    }
    
    var jQueryDialog = showDialog(_gtxt('Мультислой [value0]', elemProperties.title || ''), dialogContainer, isReadonly ? 340 : 900, 530, false, false, null, closeFunc);
}

gmxCore.addModule('MultiLayerEditor', {
    createMultiLayerEditorServer: createMultiLayerEditorServer,
    createMultiLayerEditorNew: createMultiLayerEditorNew
})

})(nsGmx.Utils._);