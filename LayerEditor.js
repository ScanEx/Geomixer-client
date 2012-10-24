!function($){

/** Виджет для выбора полей для X и Y координат из списка полей
* @function
* @param parent {DOMElement} - контейнер для размещения виджета
* @param params {object} - параметры ф-ции (должны быть либо url, либо fields):
*   - url {string}- запросить список полей у сервера. В ответе - вектор из имён полей
*   - fields {array of string}- явный список полей
*   - defaultX {string} - дефолтное значение поля X (не обязятелен)
*   - defaultY {string} - дефолтное значение поля Y (не обязятелен)
*/
var selectColumns = function(parent, params)
{
	var doCreate = function(fields)
	{
		removeChilds(parent);
	
		if (fields && fields.length > 0)
        {
			var selectLat = nsGmx.Utils._select(null, [['attr','selectLat',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]),
				selectLon = nsGmx.Utils._select(null, [['attr','selectLon',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]);

			for (var i = 0; i < fields.length; i++)
			{
				var opt = _option([_t(fields[i])], [['attr','value',fields[i]]]);
		
				_(selectLat, [opt.cloneNode(true)]);
				_(selectLon, [opt.cloneNode(true)]);
            }
	
			_(parent, [_table([_tbody([_tr([_td([_span([_t(_gtxt("Y (широта)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]), _td([selectLat], [['css','width','150px'],['css','border','none']])]),
										_tr([_td([_span([_t(_gtxt("X (долгота)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]), _td([selectLon], [['css','width','150px'],['css','border','none']])])])])])
	
			if (params.defaultX)
				selectLon = switchSelect(selectLon, params.defaultX);
	
			if (params.defaultY)
				selectLat = switchSelect(selectLat, params.defaultY);
		}
	}
	
	if (params.url)
	{
        var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]);
        
        removeChilds(parent);
        _(parent, [loading])
        
        sendCrossDomainJSONRequest(params.url, function(response)
        {
            removeChilds(parent);
        
            if (!parseResponse(response))
                return;
            
            doCreate( response.Result );
        });
    }
    else
    {
		doCreate( params.fields );
	}
}

var createLayerEditorProperties = function(div, type, parent, properties, treeView, params)
{
    var _createLayerEditorPropertiesWithTags = function(div, type, parent, properties, tagsInfo, params)
    {
        var _params = $.extend({addToMap: true, doneCallback: null}, params);
        var getFileExt = function(path)
        {
            return String(path).substr(String(path).lastIndexOf('.') + 1, path.length);
        }
        
        var _this = this;

        var title = _input(null,[['attr','fieldName','title'],['attr','value',div ? (div.gmxProperties.content.properties.title ? div.gmxProperties.content.properties.title : '') :  (typeof properties.Title != 'undefined' ? properties.Title : '')],['dir','className','inputStyle'],['css','width','220px']])
        title.onkeyup = function()
        {
            if (div)
            {
                var span = $(div).find(".layer")[0];
            
                removeChilds(span);
                
                _(span, [_t(title.value)]);

                div.gmxProperties.content.properties.title = title.value;
                
                treeView.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
            }
            
            return true;
        }
        
        var copyright = _input(null,[['attr','fieldName','copyright'],['attr','value',div ? (div.gmxProperties.content.properties.Copyright ? div.gmxProperties.content.properties.Copyright : '') : (typeof properties.Copyright != 'undefined' ? properties.Copyright : '')],['dir','className','inputStyle'],['css','width','220px']])
        copyright.onkeyup = function()
        {
            if (div)
            {
                globalFlashMap.layers[div.gmxProperties.content.properties.name].setCopyright(copyright.value);
                
                div.gmxProperties.content.properties.Copyright = copyright.value;
                
                treeView.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
            }
            
            return true;
        }
        
        var legend = _input(null,[['attr','fieldName','Legend'],['attr','value',div ? (div.gmxProperties.content.properties.Legend ? div.gmxProperties.content.properties.Legend : '') : (typeof properties.Legend != 'undefined' ? properties.Legend : '')],['dir','className','inputStyle'],['css','width','220px']])
        legend.onkeyup = function()
        {
            if (div)
            {
                div.gmxProperties.content.properties.Legend = legend.value;
                
                treeView.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
            }
            
            return true;
        }
        
        var descr = _textarea(null,[['attr','fieldName','description'],['dir','className','inputStyle'],['css','width','220px'],['css','height','50px']]);
        descr.value = div ? (div.gmxProperties.content.properties.description ? div.gmxProperties.content.properties.description : '') : (properties.Description != null ? properties.Description : '');
        
        descr.onkeyup = function()
        {
            if (div)
            {
                var span = $(div).find(".layerDescription")[0];
            
                removeChilds(span);
                
                span.innerHTML = descr.value;

                div.gmxProperties.content.properties.description = descr.value;
                
                treeView.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
            }
            
            return true;
        }
        
        var shownProperties = [];
            
        shownProperties.push({name: _gtxt("Имя"), field: 'Title', elem: title});
        shownProperties.push({name: _gtxt("Копирайт"), field: 'Copyright', elem: copyright});
        
        if (div)
            shownProperties.push({name: _gtxt("ID"), field: 'Name'});
                                
        shownProperties.push({name: _gtxt("Описание"), field: 'Description', elem: descr});
        
        if (type != "Vector")
            shownProperties.push({name: _gtxt("Легенда"), field: 'Legend', elem: legend});
        
        var encodingParent = _div();
        var layerTagsParent = _div(null, [['dir', 'className', 'layertags-container']]);
        //var temporalLayerParent = _div(null, [['dir', 'className', 'TemporalLayer']]);
        
        var collapsableTagsParent = _div();
        new nsGmx.Controls.CollapsibleWidget(_gtxt('Метаданные'), $('<div/>').appendTo(collapsableTagsParent), layerTagsParent, type === "Vector");
        
        $(layerTagsParent).appendTo(collapsableTagsParent);
        
        //event: change
        var encodingWidget = new nsGmx.ShpEncodingWidget();
        
        var convertedTagValues = {};
        for (var mp in properties.MetaProperties)
        {
            var tagtype = properties.MetaProperties[mp].Type;
            convertedTagValues[mp] = {Type: tagtype, Value: nsGmx.Utils.convertFromServer(tagtype, properties.MetaProperties[mp].Value)};
        }
        
        var layerTags = new nsGmx.LayerTags(tagsInfo, convertedTagValues);
        var layerTagsControl = new nsGmx.LayerTagSearchControl(layerTags, layerTagsParent);
        
        if (type == "Vector")
        {
            var shapePath = _input(null,[['attr','fieldName','ShapePath.Path'],['attr','value',!properties.ShapePath ? properties.GeometryTable.TableName : properties.ShapePath.Path],['dir','className','inputStyle'],['css','width', '200px']]),
                shapeFileLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
                tableLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
                // trPath = _tr([_td([_t(_gtxt("Файл")), shapeFileLink, _br(), _t(_gtxt("Таблица")), tableLink],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
                              // _td([shapePath, columnsParent, encodingParent])]),
                tilePath = _div([_t(typeof properties.TilePath.Path != null ? properties.TilePath.Path : '')],[['css','marginLeft','3px'],['css','width','220px'],['css','whiteSpace','nowrap'],['css','overflowX','hidden']]),
                trTiles = _tr([_td([_t(_gtxt("Каталог с тайлами"))],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
                              _td([tilePath])]),
                tableColumnsParent = _div(),
                xlsColumnsParent = _div();
            
            shapePath.oldValue = shapePath.value;
            
            if (div && getFileExt(shapePath.value) === 'shp')
            {
                encodingWidget.drawWidget(encodingParent, properties.EncodeSource);
            }
            
            _title(tilePath, typeof properties.TilePath.Path != null ? properties.TilePath.Path : '')
            
            if (properties.ShapePath && properties.ShapePath.Path != null && properties.ShapePath.Path != '' && !properties.ShapePath.Exists)
                $(shapePath).addClass('error');

            if (properties.TilePath.Path != null && properties.TilePath.Path != '' && !properties.TilePath.Exists)
                tilePath.style.color = 'red';
            
            shapeFileLink.onclick = function()
            {
                _fileBrowser.createBrowser(_gtxt("Файл"), ['shp','tab', 'xls', 'xlsx', 'xlsm', 'mif', 'gpx', 'kml'], function(path)
                {
                    shapePath.value = path;
                    
                    var index = String(path).lastIndexOf('.'),
                        ext = String(path).substr(index + 1, path.length);
                    
                    if (title.value == '')
                    {
                        var indexSlash = String(path).lastIndexOf('\\'),
                            fileName = String(path).substring(indexSlash + 1, index);
                        
                        title.value = fileName;
                    }
                    
                    if (valueInArray(['xls', 'xlsx', 'xlsm'], ext))
                        selectColumns(xlsColumnsParent, {url: serverBase + "VectorLayer/GetExcelColumns.ashx?WrapStyle=func&ExcelFile=" + encodeURIComponent(path) })
                    else
                        removeChilds(xlsColumnsParent);
                        
                    $(encodingParent).empty();
                    if (ext === 'shp')
                    {
                        encodingWidget.drawWidget(encodingParent);
                    }
                })
            }
            
            tableLink.onclick = function()
            {
                _tableBrowser.createBrowser(function(name)
                {
                    tablePath.value = name;
                    
                    if (title.value == '')
                        title.value = name;
                    
                    selectColumns(tableColumnsParent, {url: serverBase + "VectorLayer/GetTableCoordinateColumns.ashx?WrapStyle=func&TableName=" + encodeURIComponent(name)})
                    
                    sendCrossDomainJSONRequest(serverBase + "VectorLayer/GetTableColumns.ashx?ColumnTypes=date,datetime&SourceName=" + encodeURIComponent(name), function(response)
                    {
                        if (!parseResponse(response)) return;
                        var columns = response.Result;
                        
                        temporalLayerViewTable.updateColumns(columns);
                    });
                })
            }

            shapeFileLink.style.marginLeft = '3px';
            tableLink.style.marginLeft = '3px';
            
            var index = String(shapePath.value).lastIndexOf('.'),
                ext = String(shapePath.value).substr(index + 1, shapePath.value.length);
                    
            // слой создан по таблице или excel файлу
            // и есть какие-нибудь данные
            if ((!properties.ShapePath || valueInArray(['xls', 'xlsx', 'xlsm'], ext)) && (properties.GeometryTable.XCol || properties.GeometryTable.YCol) &&
                properties.GeometryTable.Columns.length)
            {
                selectColumns(properties.ShapePath ? xlsColumnsParent : tableColumnsParent, {
                    fields: properties.GeometryTable.Columns,
                    defaultX: properties.GeometryTable.XCol,
                    defaultY: properties.GeometryTable.YCol
                });
            }
            
            //shownProperties.push({tr:trPath});
            
            if (div)
                shownProperties.push({tr:trTiles});
                        
            // shownProperties.push({tr:trTimeLayer});
            
            var boxSearch = _checkbox(div ? (div.gmxProperties.content.properties.AllowSearch ? div.gmxProperties.content.properties.AllowSearch : false) : (typeof properties.AllowSearch != 'undefined' ? properties.AllowSearch : false), 'checkbox');
            boxSearch.setAttribute('fieldName', 'AllowSearch');

            boxSearch.className = 'box';
            if ($.browser.msie)
                boxSearch.style.margin = '-3px -2px 0px -1px';
            else
                boxSearch.style.marginLeft = '3px';

            boxSearch.onclick = function()
            {
                if (div)
                {
                    div.gmxProperties.content.properties.AllowSearch = this.checked;
                    
                    treeView.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
                }
                
                return true;
            }
            
            if (div)
                shownProperties.push({name: _gtxt("Разрешить поиск"), elem: boxSearch});
            
            var addAttribute = makeLinkButton(_gtxt("Добавить атрибут"));
            addAttribute.onclick = function()
            {
                attrModel.addAttribute(attrModel.TYPES.STRING, "NewAttribute");
            }
            
            //events: newAttribute, delAttribute, updateAttribute, change
            var attrModel = (function()
            {
                var _attributes = [];
                return {
                    addAttribute: function(type, name)
                    {
                        _attributes.push({type: type, name: name});
                        $(this).triggerHandler('newAttribute');
                        $(this).triggerHandler('change');
                    },
                    changeName: function(idx, newName)
                    {
                        _attributes[idx].name = newName;
                        $(this).triggerHandler('updateAttribute');
                        $(this).triggerHandler('change');
                    },
                    changeType: function(idx, newType)
                    {
                        _attributes[idx].type = newType;
                        $(this).triggerHandler('updateAttribute');
                        $(this).triggerHandler('change');
                    },
                    deleteAttribute: function(idx)
                    {
                        //delete _attributes[idx];
                        _attributes.splice(idx, 1);
                        $(this).triggerHandler('delAttribute');
                        $(this).triggerHandler('change');
                    },
                    getAttribute: function(idx){ return _attributes[idx]; },
                    getCount: function(){ return _attributes.length; }
                }
            })();
            attrModel.TYPES = {
                DOUBLE:   {user: 'Float',    server: 'float'    },
                INTEGER:  {user: 'Integer',  server: 'integer'  },
                STRING:   {user: 'String',   server: 'string'   },
                TIME:     {user: 'Time',     server: 'time'     },
                DATE:     {user: 'Date',     server: 'date'     },
                DATETIME: {user: 'DateTime', server: 'datetime' },
                INTEGER:  {user: 'Integer',  server: 'integer'  },
                BOOL:     {user: 'Boolean',  server: 'boolean'  }
            };
            
            var attrView = (function()
            {
                var _parent = null;
                var _model = null;
                var _trs = [];
                
                var createTypeSelector = function()
                {
                    var s = nsGmx.Utils._select(null, [['css', 'width', '83px'], ['dir', 'className', 'selectStyle']]);
                    for (var type in attrModel.TYPES)
                        $(s).append(_option([_t(attrModel.TYPES[type].user)], [['dir', 'attrType', attrModel.TYPES[type]], ['attr', 'id', attrModel.TYPES[type].server]]));
                    return s;
                }
                
                var redraw = function()
                {
                    if (!_model) return;
                    
                    $(_parent).empty();
                    _trs = [];
                    
                    for (var i = 0; i < _model.getCount(); i++)
                    {
                        var attr = _model.getAttribute(i);
                        //if (!attr) continue;
                        
                        var typeSelector = createTypeSelector();
                        typeSelector.attrIdx = i;
                        $('#' + attr.type.server, typeSelector).attr('selected', 'selected');
                        
                        $(typeSelector).bind('change', function()
                        {
                            var attrType = $('option:selected', this)[0].attrType;
                            _model.changeType(this.attrIdx, attrType);
                        });
                        
                        var nameSelector = _input(null, [['attr', 'class', 'customAttrNameInput inputStyle'], ['css', 'width', '80px']]);
                        
                        $(nameSelector).attr({attrIdx: i}).val(attr.name);
                        
                        $(nameSelector).bind('keyup', function()
                        {
                            var idx = $(this).attr('attrIdx');
                            var name = $(this).val();
                            
                            _model.changeName(idx, name);
                        });
                        
                        var deleteIcon = makeImageButton("img/close.png", "img/close_orange.png");
                        deleteIcon.attrIdx = i;
                        deleteIcon.onclick = function()
                        {
                            _model.deleteAttribute(this.attrIdx);
                        }
                        
                        var moveIcon = _img(null, [['attr', 'src', "img/moveIcon.gif"], ['dir', 'className', 'moveIcon'], ['css', 'cursor', 'move'], ['css', 'width', '13px']]);
                        
                        _trs.push(_tr([_td([nameSelector]), _td([typeSelector]), _td([deleteIcon]), _td([moveIcon])]));
                    }
                    
                    var tbody = _tbody(_trs);
                    $(tbody).sortable({axis: 'y', handle: '.moveIcon'});
                    $(_parent).append(_table([tbody], [['dir', 'className', 'customAttributes']]));
                }
                return {
                    init: function(parent, model)
                    {
                        _parent = parent;
                        _model = model;
                        $(_model).bind('newAttribute', function(idx)
                        {
                            redraw();
                        });
                        
                        $(_model).bind('delAttribute', function()
                        {
                            redraw();
                        });
                        
                        $(_model).bind('updateAttribute', function()
                        {
                            //alert('change');
                        });					
                    }
                }
            })();
            
            var selectedSource = 0;
            
            var geometryTypes = [
                { title: _gtxt('многоугольники'), type: 'POLYGON'    },
                { title: _gtxt('линии'),          type: 'LINESTRING' },
                { title: _gtxt('точки'),          type: 'POINT'      }
            ];
            
            var geometryTypeSelect = $('<select/>', {'class': 'selectStyle'}).css('width', '110px');
            for (var g = 0; g < geometryTypes.length; g++)
                $('<option/>').text(geometryTypes[g].title).val(geometryTypes[g].type).appendTo(geometryTypeSelect);
                
            var attrViewParent = _div();
            var attrContainer = _div([
                _div([
                    _div([_span([_t('Геометрия: ')], [['css', 'height', '20px'], ['css', 'verticalAlign', 'middle']]), geometryTypeSelect[0]]),
                    addAttribute
                ]),
                _div([attrViewParent], [['css', 'margin', '3px']])
            ], [['css', 'marginLeft', '3px']]);
            
            //var createLayerFields = _tr([_td([boxManualAttributes, _span([_t(_gtxt("Задать атрибуты вручную"))]), attrContainer], [['attr', 'colSpan', 2]])]);
            attrView.init(attrViewParent, attrModel);
        
            //shownProperties.push({tr: createLayerFields});
            
            var sourceCheckbox = $('<form/>')
                .append($('<input/>', {type: 'radio', name: 'sourceCheckbox', id: 'chxFileSource', checked: 'checked'}).data('containerIdx', 0))
                .append($('<label/>', {'for': 'chxFileSource'}).text(_gtxt('Файл'))).append('<br/>')
                .append($('<input/>', {type: 'radio', name: 'sourceCheckbox', id: 'chxTableSource'}).data('containerIdx', 1))
                .append($('<label/>', {'for': 'chxTableSource'}).text(_gtxt('Таблица'))).append('<br/>')
                .append($('<input/>', {type: 'radio', name: 'sourceCheckbox', id: 'chxManualSource'}).data('containerIdx', 2))
                .append($('<label/>', {'for': 'chxManualSource'}).text(_gtxt('Вручную')));
                
            $(sourceCheckbox).find('input, label').css({verticalAlign: 'middle'});
            $(sourceCheckbox).find('label').css({marginLeft: 2});
                
            var sourceTab2 = $('<div/>');
            var sourceTr2 = _tr([_td([sourceCheckbox[0]], [['css','padding','5px'], ['css', 'verticalAlign', 'top'], ['css', 'lineHeight', '18px']]), _td([sourceTab2[0]])]);
            
            if (!div)
                shownProperties.push({tr: sourceTr2});
            
            sourceCheckbox.find('input').click(function()
            {
                var activeIdx = $(this).data('containerIdx');
                $(sourceTab).tabs('select', activeIdx);
            });
            
            var sourceTab = _div([_ul([
                _li([_a([_t(_gtxt('Файл'))],   [['attr','href','#fileSource' + properties.name]])]),
                _li([_a([_t(_gtxt('Таблица'))],[['attr','href','#tableSource' + properties.name]])]),
                _li([_a([_t(_gtxt('Вручную'))],[['attr','href','#manualSource' + properties.name]])])
            ], [['css', 'display', 'none']])]);
            
            var sourceFile = _div(null, [['dir', 'id', 'fileSource' + properties.name]])
            _(sourceFile, [shapePath, shapeFileLink, encodingParent, xlsColumnsParent]);
            
            var tablePath = _input(null,[
                ['attr','fieldName','GeometryTable.TableName'],
                ['attr','value',properties.GeometryTable ? properties.GeometryTable.TableName : ''],
                ['dir','className','inputStyle'],
                ['css','width', '200px']
            ]);
            var temporalLayerParentTable = _div(null, [['dir', 'className', 'TemporalLayer']]);
            var temporalLayerParamsTable = new nsGmx.TemporalLayerParams();
            temporalLayerParamsTable.setTemporal(div && div.gmxProperties.content.properties.Temporal);
            var temporalLayerViewTable = new nsGmx.TemporalLayerParamsControl(temporalLayerParentTable, temporalLayerParamsTable, []);
            
            var TableCSParent = _div();
            var TableCSSelect = $('<select/>', {'class': 'selectStyle'}).css('width', '165px')
                .append($('<option>').val('EPSG:4326').text(_gtxt('Широта/Долгота (EPSG:4326)')))
                .append($('<option>').val('EPSG:3395').text(_gtxt('Меркатор (EPSG:3395)')));
                
            if (properties.TableCS)
                TableCSSelect.find('[value="' + properties.TableCS +'"]').attr('selected', 'selected');
                
            $(TableCSParent).append($('<span/>').text(_gtxt('Проекция')).css('margin', '3px')).append(TableCSSelect);
            
            var sourceTable = _div([tablePath, tableLink, TableCSParent, temporalLayerParentTable, tableColumnsParent], [['dir', 'id', 'tableSource' + properties.name]])
            
            var temporalLayerParamsManual = new nsGmx.TemporalLayerParams();
            temporalLayerParamsTable.setTemporal(div && div.gmxProperties.content.properties.Temporal);
            var temporalLayerParentManual = _div(null, [['dir', 'className', 'TemporalLayer']]);
            var temporalLayerViewManual = new nsGmx.TemporalLayerParamsControl(temporalLayerParentManual, temporalLayerParamsManual, []);
            var sourceManual = _div([attrContainer, temporalLayerParentManual], [['dir', 'id', 'manualSource' + properties.name]])
            $(attrModel).change(function()
            {
                var count = attrModel.getCount();
                var columns = [];
                for (var k = 0; k < count; k++){
                    var attr = attrModel.getAttribute(k);
                    if (attr.type.server == 'date' || attr.type.server == 'datetime')
                        columns.push({Name: attrModel.getAttribute(k).name});
                }
                temporalLayerViewManual.updateColumns(columns);
            });
            
            var sourceContainers = [sourceFile, sourceTable, sourceManual];
            
            var sourceTr;
            if (!div)
            {            
                // _(sourceTab2[0], sourceContainers);
                _(sourceTab, sourceContainers);
                selectedSource = 0;
                $(sourceTab).tabs({
                    selected: selectedSource,
                    select: function(event, ui)
                    {
                        selectedSource = ui.index;
                    }
                });
                _(sourceTab2[0], [sourceTab]);
                // sourceTr = _tr([_td([sourceTab], [['dir', 'id', 'layerSource'], ['dir', 'colSpan', 2]])]);
                // shownProperties.push({tr: sourceTr});
            }
            else
            {
                if (properties.ShapePath && properties.ShapePath.Path) //из файла
                {
                    selectedSource = 0;
                    shownProperties.push({name: _gtxt("Файл"), elem: sourceFile});
                }
                else if (properties.GeometryTable && properties.GeometryTable.TableName)
                {
                    selectedSource = 1;
                    shownProperties.push({name: _gtxt("Таблица"), elem: sourceTable});
                }
                else
                {
                    selectedSource = 2;
                }
            }

            var rasterCatalogDiv = $('<div/>');
            shownProperties.push({name: _gtxt("Каталог растров"), elem: rasterCatalogDiv[0], iddom: 'RCCreate-container'});
        }
        else
        {
            if (typeof properties.ShapePath == 'undefined')
                properties.ShapePath = {Path: null, Exists: true}
            
            var shapePath = _input(null,[['attr','fieldName','ShapePath.Path'],['attr','value',properties.ShapePath.Path != null ? properties.ShapePath.Path : ''],['dir','className','inputStyle'],['css','width','220px']]),
                tilePath = _input(null,[['attr','fieldName','TilePath.Path'],['attr','value',properties.TilePath.Path != null ? properties.TilePath.Path : ''],['dir','className','inputStyle'],['css','width','220px']]),
                tileCatalogLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
                tileFileLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
                shapeLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
                drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
                drawingBorderDescr = _span(null, [['attr','id','drawingBorderDescr' + properties.Name],['css','color','#215570'],['css','marginLeft','3px']]),
                removeBorder = makeImageButton('img/closemin.png','img/close_orange.png'),
                divBorder = _div([drawingBorderDescr, removeBorder]),
                trPath = _tr([_td([_t(_gtxt("Каталог")), tileCatalogLink, _br(), _t(_gtxt("Файл")), tileFileLink],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
                              _td([tilePath])]),
                trShape = _tr([_td([_t(_gtxt("Граница")), shapeLink],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
                                _td([shapePath, divBorder])]),
                shapeVisible = function(flag)
                {
                    if (flag)
                    {
                        shapePath.style.display = '';
                        divBorder.style.display = 'none';
                    }
                    else
                    {
                        shapePath.style.display = 'none';
                        divBorder.style.display = '';
                    }
                };
            
            divBorder.style.cssText = "height:22px; padding-top:3px;";
            
            removeBorder.style.cssText = "height:16px;padding:0;width:16px;cursor:pointer;margin:-1px 0px -3px 5px;";
            
            _title(removeBorder, _gtxt("Удалить"));
            
            removeBorder.onclick = function()
            {
                shapeVisible(true);
                _mapHelper.drawingBorders.removeRoute(properties.Name, true);
            }
            
            if (div)
            {
                _(trShape.firstChild, [_br(), _t(_gtxt("Контур")), drawingBorderLink]);

                if (typeof properties.ShapePath.Path != 'undefined' && properties.ShapePath.Path != null && properties.ShapePath.Path != '')
                    shapeVisible(true);	
                else
                {
                    shapeVisible(false);
                    
                    // добавим маленький сдвиг, чтобы рисовать полигон, а не прямоугольник
                    properties.ShapePath.Geometry.coordinates[0][0][0] += 0.00001;
                    properties.ShapePath.Geometry.coordinates[0][0][1] += 0.00001;
                    
                    // чтобы если бы последняя точка совпадала с первой, то этобы ни на что не повлияло
                    var pointCount = properties.ShapePath.Geometry.coordinates[0].length;
                    properties.ShapePath.Geometry.coordinates[0][pointCount-1][0] += 0.00001;
                    properties.ShapePath.Geometry.coordinates[0][pointCount-1][1] += 0.00001;
                    
                    var drawingBorder = globalFlashMap.drawing.addObject(from_merc_geometry(properties.ShapePath.Geometry));
                
                    drawingBorder.setStyle({outline: {color: 0x0000FF, thickness: 3, opacity: 80 }, marker: { size: 3 }, fill: { color: 0xffffff }}, {outline: {color: 0x0000FF, thickness: 4, opacity: 100}, marker: { size: 4 }, fill: { color: 0xffffff }});
                    
                    _mapHelper.drawingBorders.set(properties.Name, drawingBorder);
                    
                    _mapHelper.drawingBorders.updateBorder(properties.Name, drawingBorderDescr);
                }
            }
            else
                shapeVisible(true);	
            
            if (properties.ShapePath && properties.ShapePath.Path != null && properties.ShapePath.Path != '' && !properties.ShapePath.Exists)
                $(shapePath).addClass('error');

            if (properties.TilePath.Path != null && properties.TilePath.Path != '' && !properties.TilePath.Exists)
                $(tilePath).addClass('error');
            
            tileCatalogLink.onclick = function()
            {
                _fileBrowser.createBrowser(_gtxt("Каталог"), [], function(path)
                {
                    tilePath.value = path;
                    
                    if (title.value == '')
                    {
                        var indexSlash = String(path).lastIndexOf('\\'),
                            fileName = String(path).substring(indexSlash + 1, path.length);
                        
                        title.value = fileName;
                    }
                })
            }
            
            var appendMetadata = function(data)
            {
                if (!data) return;
                
                var convertedTagValues = {};
                for (var mp in data)
                {
                    var tagtype = data[mp].Type;
                    layerTags.addNewTag(mp, nsGmx.Utils.convertFromServer(tagtype, data[mp].Value), tagtype);
                }
                
                if (title.value == '' )
                {
                    var platform = layerTags.getTagByName('platform');
                    var dateTag  = layerTags.getTagByName('acqdate');
                    var timeTag  = layerTags.getTagByName('acqtime');
                    
                    if (typeof platform !== 'undefined' && typeof dateTag !== 'undefined' && typeof timeTag !== 'undefined')
                    {
                        var timeOffset = (new Date()).getTimezoneOffset()*60*1000;
                        
                        var dateInt = nsGmx.Utils.convertToServer('Date', dateTag.value);
                        var timeInt = nsGmx.Utils.convertToServer('Time', timeTag.value);
                        
                        var date = new Date( (dateInt+timeInt)*1000 + timeOffset );
                        
                        var dateString = $.datepicker.formatDate('yy.mm.dd', date);
                        var timeString = $.datepicker.formatTime('hh:mm', {hour: date.getHours(), minute: date.getMinutes()});
                        
                        title.value = platform.value + '_' + dateString + '_' + timeString + '_UTC';
                    }
                }
            }
            
            tileFileLink.onclick = function()
            {
                _fileBrowser.createBrowser(_gtxt("Файл"), ['jpeg', 'jpg', 'tif', 'png', 'img', 'tiles', 'cpyr'], function(path)
                {
                    tilePath.value = path;
                    
                    sendCrossDomainJSONRequest(serverBase + 'Layer/GetMetadata.ashx?basepath=' + encodeURIComponent(path), function(response)
                    {
                        if (!parseResponse(response))
                            return;
                            
                        appendMetadata(response.Result.MetaProperties);
                        
                        if (title.value == '')
                        {
                            var indexExt = String(path).lastIndexOf('.');
                            var indexSlash = String(path).lastIndexOf('\\'),
                                fileName = String(path).substring(indexSlash + 1, indexExt);
                            
                            title.value = fileName;
                        }
                    })
                })
            }
            
            shapeLink.onclick = function()
            {
                _fileBrowser.createBrowser(_gtxt("Граница"), ['mif','tab','shp'], function(path)
                {
                    shapePath.value = path;
                    
                    shapeVisible(true);
                    
                    sendCrossDomainJSONRequest(serverBase + 'Layer/GetMetadata.ashx?geometryfile=' + encodeURIComponent(path), function(response)
                    {
                        if (!parseResponse(response))
                            return;
                            
                        appendMetadata(response.Result.MetaProperties);
                    })
                })
            }
            
            drawingBorderLink.onclick = function()
            {
                nsGmx.Controls.chooseDrawingBorderDialog( properties.Name, function(polygon)
                {
                    _mapHelper.drawingBorders.set(properties.Name, polygon);
                    _mapHelper.drawingBorders.updateBorder(properties.Name);
                    shapeVisible(false);
                    
                }, {geomType: 'POLYGON', errorMessage: _gtxt("$$phrase$$_17")} );
            }
            
            tileCatalogLink.style.marginLeft = '3px';
            tileFileLink.style.marginLeft = '3px';
            shapeLink.style.marginLeft = '3px';
            drawingBorderLink.style.marginLeft = '3px';

            shownProperties.push({tr:trPath});
            shownProperties.push({tr:trShape});
        }
        
        shownProperties.push({tr:_tr([_td([collapsableTagsParent], [['attr', 'colSpan', 2]])])});
            
        var trs = _mapHelper.createPropertiesTable(shownProperties, properties, {leftWidth: 70});
        _(parent, [_div([_table([_tbody(trs)],[['dir','className','propertiesTable']])])]);
        
        // в IE инициализировать чекбоксы можно только после их добавления в DOM-дерево
        $('input#chxFileSource').attr('checked', 'checked');
        
        //Обновим отображение каталога растров после создания виджета
        if (type === "Vector")
        {
            var rcProperties;
            if (div && div.gmxProperties.content.properties.IsRasterCatalog)
            {
                rcProperties = {
                    IsRasterCatalog: true,
                    RCMinZoomForRasters: properties.RCMinZoomForRasters,
                    RCMaskForRasterPath:  properties.RCMaskForRasterPath,
                    RCMaskForRasterTitle: properties.RCMaskForRasterTitle,
                    ColumnTagLinks: properties.ColumnTagLinks
                }
                // RCCheckbox.attr('checked', 'checked');
                // updateRCControls();
            }
            var rasterCatalogControl = new nsGmx.LayerRasterCatalogControl(rasterCatalogDiv, rcProperties);
            // RDCollapsableWidget.addManagedElements([$('#RCMaskForRasterTitle', parent), $('#RCMaskForRasterPath', parent)]);
            // updateRCControls();
        }
        
        // смотрим, а не выполняются ли для этого слоя задачи
        var haveTask = false;
        if (div)
        {
            for (var id in _mapHelper.asyncTasks)
                if (_mapHelper.asyncTasks[id] == div.gmxProperties.content.properties.name)
                {
                    haveTask = true;
                    
                    break;		
                }
        }
        
        if (!haveTask)
        {
            var saveButton = makeLinkButton(div ? _gtxt("Изменить") : _gtxt("Создать"));
            
            saveButton.style.marginLeft = '10px';
            
            saveButton.onclick = function()
            {
                var mapProperties = _layersTree.treeModel.getMapProperties();
                var isCustomAttributes = type === "Vector" && selectedSource === 2;
                var errorFlag = false,
                    checkFields = (type == "Vector" ? ['title', 'date'] : ['title', 'date']);
                    
                if (!isCustomAttributes)
                if (type !== "Vector")
                    checkFields.push('TilePath.Path');
                else if (selectedSource == 0)
                    checkFields.push('ShapePath.Path');
                else if (selectedSource == 1)
                    checkFields.push('GeometryTable.TableName');
                    
                for (var i = 0; i < checkFields.length; i++)
                {
                    var inputField = $(parent).find("[fieldName='" + checkFields[i] + "']");
                    
                    if (inputField.length && inputField[0].value == '')
                    {
                        errorFlag = true;
                        inputError(inputField[0], 2000);
                    }
                }
                
                if (errorFlag)
                    return;
                    
                var metaProperties = {};
                layerTags.eachValid(function(id, tag, value)
                {
                    var type = layerTags.getTagMetaInfo().getTagType(tag);
                    var value = nsGmx.Utils.convertToServer(type, value);
                    if (value !== null)
                        metaProperties[tag] = {Value: value, Type: type};
                })
                
                var metadataString = '&MetaProperties=' + encodeURIComponent(JSON.stringify(metaProperties));
                
                if (type == "Vector")
                {
                    var cols = '',
                        updateParams = '',
                        encoding = '&EncodeSource=' + encodeURIComponent(encodingWidget.getServerEncoding()),
                        columnsParent = selectedSource == 0 ? xlsColumnsParent : tableColumnsParent,
                        colXElem = $(columnsParent).find("[selectLon]"),
                        colYElem = $(columnsParent).find("[selectLat]"),
                        layerTitle = title.value,
                        temporalParams = '',
                        tableCSParam = selectedSource == 1 ? '&TableCS=' + encodeURIComponent(TableCSSelect.find(':selected').val()) : '',
                        RCParams = '';
                        
                    var rcProps = rasterCatalogControl.getRCProperties();
                    if (rcProps.IsRasterCatalog)
                    {
                        RCParams = '&IsRasterCatalog=true';
                        if ( rcProps.RCMinZoomForRasters ) RCParams += '&RCMinZoomForRasters=' + encodeURIComponent(rcProps.RCMinZoomForRasters);
                        if ( rcProps.RCMaskForRasterPath ) RCParams += '&RCMaskForRasterPath=' + encodeURIComponent(rcProps.RCMaskForRasterPath);
                        if ( rcProps.RCMaskForRasterTitle ) RCParams += '&RCMaskForRasterTitle=' + encodeURIComponent(rcProps.RCMaskForRasterTitle);
                        if ( rcProps.ColumnTagLinks ) RCParams += '&ColumnTagLinks=' + encodeURIComponent(JSON.stringify(rcProps.ColumnTagLinks));
                    }
                    else
                    {
                        RCParams = '&IsRasterCatalog=false';
                    }
                    
                    var temporalLayerParams = selectedSource == 1 ? temporalLayerParamsTable : temporalLayerParamsManual;
                    if ( !div && temporalLayerParams.getTemporal() )
                        temporalParams = '&TemporalLayer=true&TemporalColumnName=' + encodeURIComponent(temporalLayerParams.getColumnName()) + '&TemporalPeriods=' + encodeURIComponent(temporalLayerParams.getPeriodString());
                    
                    if (colXElem.length && colYElem.length)
                        cols = '&ColY=' + encodeURIComponent(colYElem[0].value) + '&ColX=' + encodeURIComponent(colXElem[0].value);
                    
                    if (div)
                    {
                        updateParams = '&VectorLayerID=' + div.gmxProperties.content.properties.LayerID;
                    }
                    
                    if (isCustomAttributes)
                    {
                        var count = attrModel.getCount();
                        var columnsString = "&FieldsCount=" + count;
                        for (var k = 0; k < count; k++){
                            columnsString += "&fieldName" + k + "=" + encodeURIComponent(attrModel.getAttribute(k).name) + "&fieldType" + k + "=" + attrModel.getAttribute(k).type.server;
                        }
                        
                        var geomType = $(':selected', geometryTypeSelect).val();
                        
                        sendCrossDomainJSONRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx?WrapStyle=func" + 
                            "&Title=" + encodeURIComponent(title.value) + 
                            "&Copyright=" + encodeURIComponent(copyright.value) + 
                            "&Description=" + encodeURIComponent(descr.value) + 
                            "&MapName=" + encodeURIComponent(mapProperties.name) + 
                            cols + columnsString + temporalParams +
                            "&geometrytype=" + geomType +
                            metadataString +
                            RCParams, 
                            function(response)
                            {
                                if (!parseResponse(response))
                                        return;
                                
                                var targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
                                var gmxProperties = {type: 'layer', content: response.Result};
                                gmxProperties.content.properties.mapName = mapProperties.name;
                                gmxProperties.content.properties.hostName = mapProperties.hostName;
                                gmxProperties.content.properties.visible = true;
                                
                                gmxProperties.content.properties.styles = [{
                                    MinZoom: gmxProperties.content.properties.MinZoom, 
                                    MaxZoom:21, 
                                    RenderStyle:_mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
                                }];
                                
                                _layersTree.copyHandler(gmxProperties, targetDiv, false, true);
                                
                                //реализует интерфейс AsyncTask
                                //TODO: test me!
                                var taskResult = {Result: response.Result, Completed: true};
                                var task = {
                                    deferred: $.when(taskResult),
                                    getCurrentStatus: function(){return 'completed'; },
                                    getCurrentResult: function(){return taskResult; }
                                }
                                _params.doneCallback && _params.doneCallback(task, response.Result.properties.title);
                            }
                        );
                    }
                    else
                    {
                        var geometryDataSource = selectedSource == 0 ? shapePath.value : tablePath.value;
                        sendCrossDomainJSONRequest(serverBase + "VectorLayer/" + (div ? "Update.ashx" : "Insert.ashx") + "?WrapStyle=func" + 
                            "&Title=" + encodeURIComponent(title.value) + 
                            "&Copyright=" + encodeURIComponent(copyright.value) + 
                            "&Description=" + encodeURIComponent(descr.value) + 
                            "&GeometryDataSource=" + encodeURIComponent(geometryDataSource) + 
                            "&MapName=" + encodeURIComponent(mapProperties.name) + 
                            cols + updateParams + encoding + temporalParams + metadataString + tableCSParam + RCParams, 
                            function(response)
                            {
                                if (!parseResponse(response))
                                    return;
                            
                                
                                var task = nsGmx.asyncTaskManager.addTask(response.Result, div ? div.gmxProperties.content.properties.name : null);
                                
                                
                                if (div)
                                {
                                    _queryMapLayers.asyncUpdateLayer(task, properties, true);
                                }
                                else 
                                {
                                    if (_params.addToMap)
                                        _queryMapLayers.asyncCreateLayer(task, layerTitle);
                                }
                                
                                _params.doneCallback && _params.doneCallback(task, layerTitle);
                            }
                        )
                    }
                }
                else
                {
                    var params = {
                            WrapStyle: "window",
                            Title: title.value,
                            Copyright: copyright.value,
                            Legend: legend.value,
                            Description: descr.value,
                            TilePath: $(parent).find("[fieldName='TilePath.Path']")[0].value,
                            BorderFile: typeof _mapHelper.drawingBorders.get(properties.Name) == 'undefined' ? $(parent).find("[fieldName='ShapePath.Path']")[0].value : '',
                            BorderGeometry: typeof _mapHelper.drawingBorders.get(properties.Name) == 'undefined' ? '' : JSON.stringify(merc_geometry(_mapHelper.drawingBorders.get(properties.Name).geometry)),
                            MapName: mapProperties.name,
                            MetaProperties: JSON.stringify(metaProperties)
                        },
                        needRetiling = false,
                        layerTitle = title.value;
                    
                    if (div)
                    {
                        params["RasterLayerID"] = div.gmxProperties.content.properties.LayerID;
                        
                        var oldShapePath = properties.ShapePath.Path,
                            oldTilePath = properties.TilePath.Path,
                            oldDrawing = properties.ShapePath.Geometry;
                        
                        // если изменились поля с геометрией, то нужно тайлить заново и перегрузить слой в карте
                        if ($(parent).find("[fieldName='ShapePath.Path']")[0].value != oldShapePath ||
                            $(parent).find("[fieldName='TilePath.Path']")[0].value != oldTilePath ||
                            oldDrawing && typeof _mapHelper.drawingBorders.get(properties.Name) != 'undefined' && JSON.stringify(_mapHelper.drawingBorders.get(properties.Name)) != JSON.stringify(oldDrawing) ||
                            !oldDrawing && typeof _mapHelper.drawingBorders.get(properties.Name) != 'undefined' ||
                            oldDrawing && typeof _mapHelper.drawingBorders.get(properties.Name) == 'undefined')
                            needRetiling = true;
                    }
                    
                    params["GeometryChanged"] = needRetiling;
                    
                    sendCrossDomainPostRequest(serverBase + "RasterLayer/" + (!div ? "Insert.ashx" : "Update.ashx"), params, function(response)
                        {
                            if (!parseResponse(response))
                                return;
                        
                            var task = nsGmx.asyncTaskManager.addTask(response.Result, div ? div.gmxProperties.content.properties.name : null);
                            
                            if (div)
                            {
                                _queryMapLayers.asyncUpdateLayer(task, properties, needRetiling);
                            }
                            else
                            {
                                if (_params.addToMap)
                                    _queryMapLayers.asyncCreateLayer(task, layerTitle);
                            }
                            
                            _params.doneCallback && _params.doneCallback(task, layerTitle);
                        })
                }
            }
            
            _(parent, [_div([saveButton], [['css','paddingTop','10px']])])
        }
        
        if (!div)
            title.focus();
    }
    
    nsGmx.TagMetaInfo.loadFromServer(function(tagsInfo)
    {
        if (tagsInfo)
            _createLayerEditorPropertiesWithTags(div, type, parent, properties, tagsInfo, params);
    })
}

gmxCore.addModule('LayerEditor', {
    createLayerEditorProperties: createLayerEditorProperties
})
    
}(jQuery)