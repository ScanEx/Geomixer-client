var nsGmx = nsGmx || {};

/** Вспомогательные ф-ции ГеоМиксера
@namespace _mapHelper
*/
nsGmx.mapHelper = {

}


var mapHelp =
{
	mapHelp: {},
	serviceHelp: {},
	tabs: {},
	externalMaps : {}
}

!(function(_) {

var mapHelper = function()
{
	this.builded = false;
    //this._treeView = false;

	this.defaultStyles =
	{
		'point':{outline:{color:0x0000FF, thickness:1},marker:{size:8}, fill:{color:0xFFFFFF, opacity:20}},
		'linestring':{outline:{color:0x0000FF, thickness:1}},
		'polygon':{outline:{color:0x0000FF, thickness:1}, fill:{color:0xFFFFFF, opacity:20}}
	}

	this.defaultPhotoIconStyles = {
		'point': {
			marker: {
				image: 'http://maps.kosmosnimki.ru/api/img/camera18.png',
				center: true
			}
		}
	}

	this.stylesDialogsHash = {};
	this.drawingDialogsHash = {};

	this.layerEditorsHash = {};

	this.layerStylesHash = {};

	this.attrValues = {};

	this.customErrorsHash = {
		"Unable to locate EXIF content" : "Unable to locate EXIF content"
	}

	// контролирует пользовательские объекты, которые являются редактируемыми контурами растровых слоёв.
	// все такие объекты не будут сериализоваться
	this.drawingBorders = (function()
	{
		var _borders = {};

		//не будем сериализовать все пользовательские объекты, являющиеся контурами слоёв, так как это временные объекты
		nsGmx.DrawingObjectCustomControllers.addDelegate({
			isSerializable: function(obj)
			{
				for (var name in _borders)
					if (_borders[name] === obj)
						return false;

				return true;
			}
		});

		return {
			set: function(name, obj)
			{
                if (name in _borders) {
                    _borders[name].drawingFeature.off('edit', _borders[name].editListener);
                }
                var editListener = function() {
                    _borders[name].isChanged = true;
                }

                obj.on('edit', editListener);

				_borders[name] = {
                    isChanged: !!_borders[name],
                    drawingFeature: obj,
                    editListener: editListener
                }
			},
			get: function(name)
			{
				return _borders[name] && _borders[name].drawingFeature;
			},
			length: function()
			{
				return objLength(_borders);
			},

			//callback(name, obj)
			forEach: function(callback)
			{
				for (var name in _borders)
					callback(name, _borders[name].drawingFeature);
			},

            isChanged: function(name) {
                return !!_borders[name] && _borders[name].isChanged;
            },

			updateBorder: function(name, span)
			{
				if (!_borders[name])
					return;

                var geom = _borders[name].drawingFeature.toGeoJSON().geometry,
                    areaStr = L.gmxUtil.prettifyArea(L.gmxUtil.geoArea(geom, false));

				if (span)
				{
					_(span, [_t(areaStr)]);
					return;
				}

				if (!$('#drawingBorderDescr' + name).length)
					return;

				$('#drawingBorderDescr' + name).empty();

				_($('#drawingBorderDescr' + name)[0], [_t(areaStr)]);
			},

			//Удаляет объект из списка контуров слоя
			//?removeDrawring {bool, default: false} - удалять ли сам пользовательский объект
			removeRoute: function(name, removeDrawing)
			{
				if (!(name in _borders))
					return;

                _borders[name].drawingFeature.off('edit', _borders[name].editListener);

				if (removeDrawing) {
					nsGmx.leafletMap.gmxDrawing.remove(_borders[name].drawingFeature);
                }

				delete _borders[name];

				$('#drawingBorderDescr' + name).empty();
			}
		}
	})();

	this.unsavedChanges = false;

}

mapHelper.prototype = new leftMenu();

/** Менеджер кастомных параметров карты.
 * Содержит набор провайдеров доп. параметров, которые могут сохранять и загружать данные из хранилища параметров
 * Данные загружаются один раз. Возможна асинхронная загрузка данных/добавление провайдеров.
 * Порядок вызова провайдеров не определён.
 *
 * @memberOf _mapHelper
 * @name customParamsManager
 */
mapHelper.prototype.customParamsManager = (function()
{
	var _providers = [];
	var _params = []; //хранит параметры, которые не были загружены провайдерами

	var loadProviderState = function( provider )
	{
		if ( provider.name in _params && typeof provider.loadState !== 'undefined')
		{
			provider.loadState( _params[ provider.name ] );
			delete _params[ provider.name ];
		}
	}

	return {
		saveParams: function()
		{
			if ( !_providers.length ) return;
			var params = {};
			for (var p = 0; p < _providers.length; p++ )
			{
				if (typeof _providers[p].saveState !== 'undefined')
                    params[_providers[p].name] = _providers[p].saveState();
			}

			return params;
		},
		loadParams: function(params)
		{
			_params = params;
			for (var p = 0; p < _providers.length; p++ )
				loadProviderState( _providers[p] );
		},

		//интерфейс провайдера: name, saveState(), loadState(state)
		addProvider: function(provider)
		{
			_providers.push( provider );
			loadProviderState( provider );
		},

        isProvider: function(providerName) {
            return !!nsGmx._.findWhere(_providers, {name: providerName});
        },
        removeProvider: function(providerName) {
            _providers = nsGmx._.filter(_providers, function(provider) {
                return provider.name !== providerName;
            })
        }
	}
})();

mapHelper.prototype.makeStyle = function(style)
{
    style = style || {};
	var givenStyle = {};

	if (typeof style.RenderStyle != 'undefined')
		givenStyle = style.RenderStyle;
	else if (style.outline || style.marker)
		givenStyle = style;
	else
	{
		if (style.PointSize)
			givenStyle.marker = { size: parseInt(style.PointSize) };
		if (style.Icon)
		{
			var src = (style.Icon.indexOf("http://") != -1) ?
				style.Icon :
				(baseAddress + "/" + style.Icon);
			givenStyle.marker = { image: src, center: true };
		}
		if (style.BorderColor || style.BorderWidth)
			givenStyle.outline = {
				color: parseColor(style.BorderColor),
				thickness: parseInt(style.BorderWidth || "1")
			};
		if (style.FillColor)
			givenStyle.fill = {
				color: parseColor(style.FillColor),
				opacity: 100 - parseInt(style.Transparency || "0")
			};

		var label = style.label || style.Label;
		if (label)
			givenStyle.label = {
				field: label.FieldName,
				color: parseColor(label.FontColor),
				size: parseInt(label.FontSize || "12")
			};
	}

	return givenStyle;
}

mapHelper.prototype.getMapStateAsPermalink = function(callback)
{
    // сохраняем состояние карты
    var mapState = _mapHelper.getMapState();

    // туда же сохраним созданные объекты
    nsGmx.userObjectsManager.collect();
    mapState.userObjects = JSON.stringify(nsGmx.userObjectsManager.getData());

    nsGmx.Utils.TinyReference.create(mapState, true).then(callback);
}

mapHelper.prototype.reloadMap = function()
{
    if (!nsGmx.gmxMap) {
        window.location.reload();
    }

    _mapHelper.getMapStateAsPermalink(function(permalinkID)
    {
        createCookie("TempPermalink", permalinkID);
        window.location.replace(window.location.href.split("?")[0] + "?permalink=" + permalinkID + (defaultMapID == globalMapName ? "" : ("&" + globalMapName)));
    })
}

mapHelper.prototype.updateUnloadEvent = function(flag)
{
	if (typeof flag != 'undefined')
		this.unsavedChanges = flag;

	if (this.unsavedChanges)
	{
		window.onbeforeunload = function(e)
		{
			return _gtxt("В дереве слоев остались несохраненные изменения!");
		}
	}
	else
		window.onbeforeunload = null;
}

mapHelper.prototype.setBalloon = function(filter, template)
{
	filter.enableHoverBalloon(function(o)
	{
		return template.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
		{
			var key = arguments[1];
			if (key == "SUMMARY")
				return o.getGeometrySummary();
			else
				return o.properties[key];
		});
	});
}

mapHelper.prototype.updateMapStyles = function(newStyles, name)
{
    var layer = nsGmx.gmxMap.layersByID[name],
        styles = newStyles.map(nsGmx.Utils.prepareGmxLayerStyle);

    layer.setStyles(styles);
}

//TODO: remove isEditableStyles
mapHelper.prototype.updateTreeStyles = function(newStyles, div, treeView, isEditableStyles)
{
    isEditableStyles = typeof isEditableStyles === 'undefined' || isEditableStyles;
	div.gmxProperties.content.properties.styles = newStyles;

	var multiStyleParent = $(div).children('[multiStyle]')[0];

	var parentIcon = $(div).children("[styleType]")[0],
		newIcon = _mapHelper.createStylesEditorIcon(newStyles, div.gmxProperties.content.properties.GeometryType.toLowerCase(), {addTitle: isEditableStyles});

	$(parentIcon).empty().append(newIcon).attr('styleType', $(newIcon).attr('styleType'));

	$(multiStyleParent).empty();

	_mapHelper.createMultiStyle(div.gmxProperties.content.properties, treeView, multiStyleParent)
}

mapHelper.prototype.restoreTinyReference = function(id, callbackSuccess, errorCallback)
{
	window.suppressDefaultPermalink = true;
    nsGmx.Utils.TinyReference.get(id).then(function(obj) {
		if (obj.position) {
            var latLngPos = L.Projection.Mercator.unproject(obj.position);
			obj.position.x = latLngPos.lng;
			obj.position.y = latLngPos.lat;
			obj.position.z = 17 - obj.position.z;
			if (obj.drawnObjects) {
				for (var i in obj.drawnObjects) {
                    //эта двойная конвертация в действительности просто перевод координат из Меркатора в LatLng
					obj.drawnObjects[i].geometry = L.gmxUtil.geoJSONtoGeometry(L.gmxUtil.geometryToGeoJSON(obj.drawnObjects[i].geometry, true));
				}
            }
		}
        obj.originalReference = id;
		callbackSuccess(obj);
    }, errorCallback);
}

mapHelper.prototype.getMapState = function() {
    var lmap = nsGmx.leafletMap;

    if (!lmap) {
        return {};
    }

    var drawnObjects = [],
		drawings = lmap.gmxDrawing.saveState(),
		features = drawings.featureCollection.features;
        openPopups = {},
        condition = {expanded:{}, visible:{}},
		LayersTreePermalinkParams = {},
		mercCenter = L.Projection.Mercator.project(lmap.getCenter());

		for (var i = 0; i < features.length; i++) {
			if (features[i].properties.exportRect) {
				features.splice(i, 1);
			}
		}

    lmap.gmxDrawing.getFeatures().forEach(function(feature) {
        if (!nsGmx.DrawingObjectCustomControllers.isSerializable(feature) || feature.options.exportRect) {
            return;
        }

        var geoJSON = feature.toGeoJSON();

        var elem = {
            properties: geoJSON.properties,
            geometry: L.gmxUtil.geoJSONtoGeometry(geoJSON, true)
        };

        if (elem.geometry.type !== "POINT") {
            var style = feature.getOptions().lineStyle;

            if (style) {
                elem.thickness = style.weight || 2;
                elem.color = style.color;
                elem.opacity = (style.opacity || 0.8) * 100;
            }
        }

        if (lmap.hasLayer(feature.getPopup())) {
            elem.isBalloonVisible = true;
        }

        drawnObjects.push(elem);
    });

    for (var l in nsGmx.gmxMap.layersByID) {
        var layer = nsGmx.gmxMap.layersByID[l];

        if (layer.getPopups) {
            var popups = layer.getPopups();
            if (popups.length) {
                openPopups[l] = popups;
            }
        }
    }

    this.findTreeElems(_layersTree.treeModel.getRawTree(), function(elem) {
        var props = elem.content.properties;
        if (elem.type == 'group') {
            var groupId = props.GroupID;

            if (!$("div[GroupID='" + groupId + "']").length && !props.changedByViewer)
                return;

            condition.visible[groupId] = props.visible;
            condition.expanded[groupId] = props.expanded;
        } else {
            if (props.changedByViewer) {
                condition.visible[props.name] = props.visible;
            }
        }
    });

	// layers tree permalink params (without server)
	this.findTreeElems(_layersTree.treeModel.getRawTree(), function(elem) {
		var props = elem.content.properties,
			id = elem.type == 'group' ? props.GroupID : props.LayerID;

		if (props.permalinkParams) {
			LayersTreePermalinkParams[id] = props.permalinkParams;
		}
	});

	var dateIntervals = {};

	for (var l in nsGmx.gmxMap.layersByID) {
		var layer = nsGmx.gmxMap.layersByID[l];
			props = layer.getGmxProperties(),
			isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.setDateInterval);

		if (isTemporalLayer && layer.getDateInterval) {
			dateIntervals[props.LayerID] = layer.getDateInterval();
		}
	}

    return {
        mode: lmap.gmxBaseLayersManager.getCurrentID(),
        mapName: globalMapName,
        position: {
            x: mercCenter.x,
            y: mercCenter.y,
            z: 17 - lmap.getZoom()
        },
        mapStyles: this.getMapStyles(),
		drawings: drawings,
		drawnObjects: drawnObjects,
        isFullScreen: window.layersShown ? "false" : "true",
        condition: condition,
		LayersTreePermalinkParams: LayersTreePermalinkParams,
        language: window.language,
		customParamsCollection: this.customParamsManager.saveParams(),
		dateIntervals: dateIntervals,
        openPopups: openPopups
    }
}

mapHelper.prototype.getMapStyles = function()
{
	var styles = {};

	this.findChilds(_layersTree.treeModel.getRawTree(), function(child)
	{
		if (child.content.properties.type == "Vector" && $("div[LayerID='" + child.content.properties.LayerID + "']").length)
			styles[child.content.properties.name] = child.content.properties.styles;
	}, true);

	return styles;
}

mapHelper.prototype.showPermalink = function()
{
	this.createPermalink(function(id){
        var url = "http://" + window.location.host + window.location.pathname + "?permalink=" + id + (defaultMapID == globalMapName ? "" : ("&" + globalMapName));
        var input = _input(null, [['dir','className','inputStyle inputFullWidth'],['attr','value', url]]);

        showDialog(_gtxt("Ссылка на текущее состояние карты"), _div([input]), 311, 80, false, false);

        input.select();
    });
}

mapHelper.prototype.createExportPermalink = function(params, callback)
{
	var mapState = $.extend(this.getMapState(), params),
		def = nsGmx.Utils.TinyReference.create(mapState, false);
    def.then(callback);
	return def;
}

mapHelper.prototype.createPermalink = function(callback)
{
	var mapState = this.getMapState(),
        def = nsGmx.Utils.TinyReference.create(mapState, false);

    def.then(callback);
    return def;
}

mapHelper.prototype.updateTinyMCE = function(container) {
    gmxCore.loadModule('TinyMCELoader', 'http://' + window.location.host + window.location.pathname.replace('index.html', '') + 'TinyMCELoader.js', function() {
        $('.balloonEditor', container).each(function() {
            var id = $(this).attr('id');
            if (!tinyMCE.get(id)) {
                tinyMCE.execCommand("mceAddControl", true, id);
            }
        })
    });
}

//event: selected(url)
mapHelper.ImageSelectionWidget = Backbone.View.extend({
    tagName: 'span',
    className: 'gmx-icon-choose',
    events: {
        'click': function() {
            var imagesDir = nsGmx.AuthManager.getUserFolder() + 'images'
                _this = this;
            sendCrossDomainJSONRequest(serverBase + 'FileBrowser/CreateFolder.ashx?WrapStyle=func&FullName=' + encodeURIComponent(imagesDir), function(response) {
                if (!parseResponse(response))
                    return;

                _fileBrowser.createBrowser(_gtxt("Изображение"), ['jpg', 'jpeg', 'png', 'gif', 'swf'], function(path) {
                    var relativePath = path.substring(imagesDir.length);
                    if (relativePath[0] == '\\') {
                        relativePath = relativePath.substring(1);
                    }

                    var url = serverBase + "GetImage.ashx?usr=" + encodeURIComponent(nsGmx.AuthManager.getLogin()) + "&img=" + encodeURIComponent(relativePath);

                    _this.trigger('selected', url);
                }, {startDir: imagesDir, restrictDir: imagesDir});
            });
        }
    }
});

mapHelper.ImageInputControl = function(initURL) {
    var prevValue = initURL || '';
    var inputUrl = _input(null, [['dir','className','inputStyle'],['attr','value', prevValue], ['css','width','170px']]);
    _title(inputUrl, _gtxt('URL изображения'));

    var _this = this;

    var update = function() {
        if (inputUrl.value != prevValue) {
            prevValue = inputUrl.value;
            $(_this).change();
        }
    }

    var mainDiv = $('<div/>').append(inputUrl);
    inputUrl.onkeyup = inputUrl.change = update;

    if (nsGmx.AuthManager.canDoAction(nsGmx.ACTION_UPLOAD_FILES)) {
        var imageSelectionWidget = new mapHelper.ImageSelectionWidget();
        imageSelectionWidget.on('selected', function(url) {
            inputUrl.value = url;
            update();
        });

        mainDiv.append(imageSelectionWidget.el);
    }

    this.getControl = function()
    {
        return mainDiv[0];
    }

    this.value = function()
    {
        return inputUrl.value;
    }
}

//params:
//  * addTitle {bool, default: true}
mapHelper.prototype.createStylesEditorIcon = function(parentStyles, type, params)
{
    var _params = $.extend({addTitle: true}, params);
	var icon;

	if ($.isArray(parentStyles) && parentStyles.length > 1)
		icon =  _img(null, [['attr','src','img/misc.png'],['css','margin','0px 2px -3px 4px'],['css','cursor','pointer'],['attr','styleType','multi']]);
	else
	{
		var parentStyle = _mapHelper.makeStyle(parentStyles[0]);

		if (parentStyle.marker && parentStyle.marker.image)
		{
			if (true /*typeof parentStyle.marker.color == 'undefined'*/)
			{
				icon = _img(null, [['dir','className','icon'],['attr','styleType','icon']]);

				var fixFunc = function()
					{
						var width = this.width,
							height = this.height,
                            scale;

                        if (width && height) {
							var scaleX = 14.0 / width;
							var scaleY = 14.0 / height
							scale = Math.min(scaleX, scaleY);
                        } else {
                            scale = 1;
                            width = height = 14;
                        }

						setTimeout(function()
						{
							icon.style.width = Math.round(width * scale) + 'px';
							icon.style.height = Math.round(height * scale) + 'px';
						}, 10);
					}

				icon.onload = fixFunc;
                icon.src = parentStyle.marker.image;
			}
			else
			{
				var dummyStyle = {};

				$.extend(dummyStyle, parentStyle);

				dummyStyle.outline = {color: parentStyle.marker.color, opacity: 100};
				dummyStyle.fill = {color: parentStyle.marker.color, opacity: 100};

				icon = nsGmx.Controls.createGeometryIcon(dummyStyle, type);
			}
		}
		else
		{
			icon = nsGmx.Controls.createGeometryIcon(parentStyle, type);
		}
	}

    if (_params.addTitle)
        _title(icon, _gtxt("Редактировать стили"));

	icon.geometryType = type;

	return icon;
}

mapHelper.prototype.createLoadingLayerEditorProperties = function(div, parent, layerProperties, params)
{
	var elemProperties = div.gmxProperties.content.properties,
		loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]),
        type = elemProperties.type,
		_this = this;

    if (type == "Vector")
    {
        nsGmx.createLayerEditor(div, type, parent, layerProperties, params);

        return;
    }
    else
    {
        if (elemProperties.name)
        {
            _(parent, [loading]);

            sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?WrapStyle=func&LayerName=" + elemProperties.name, function(response)
            {
                if (!parseResponse(response))
                    return;

                loading.removeNode(true);

                nsGmx.createLayerEditor(div, type, parent, response.Result, params)
            })
        }
    }
}

mapHelper.prototype.createNewLayer = function(type)
{
	if ($('#new' + type + 'Layer').length)
		return;

	var parent = _div(null, [['attr','id','new' + type + 'Layer'], ['css', 'height', '100%']]),
		height = (type == 'Vector') ? 340 : 360;

    if (type !== 'Multi')
    {
		var properties = {Title:'', Description: '', Date: '', TilePath: {Path:''}, ShapePath: {Path:''}};
        var dialogDiv = showDialog(type != 'Vector' ? _gtxt('Создать растровый слой') : _gtxt('Создать векторный слой'), parent, 340, height, false, false);
        nsGmx.createLayerEditor(false, type, parent, properties,
            {
                doneCallback: function()
                {
                    removeDialog(dialogDiv);
                }
            }
        );
    }
    else
    { //мультислой
        var _this = this;
        nsGmx.createMultiLayerEditorNew( _layersTree );
    }
}

// перенос clipLayer из маплетов карты
mapHelper.prototype.clipLayer = function(layer, props)
{
	var sw = L.latLng([props.MinViewY, props.MinViewX]),
		nw = L.latLng([props.MaxViewY, props.MinViewX]),
		ne = L.latLng([props.MaxViewY, props.MaxViewX]),
		se = L.latLng([props.MinViewY, props.MaxViewX]),
		clip = L.polygon([sw, nw, ne, se, sw]);

	    layer.addClipPolygon(clip);
}

// Формирует набор элементов tr используя контролы из shownProperties.
// Параметры:
// - shownProperties: массив со следующими свойствами:
//   * tr - если есть это свойство, то оно помещается в tr, все остальные игнорируются
//   * name - названия свойства, которое будет писаться в левой колонке
//   * elem - если есть, то в правую колонку помещается этот элемент
//   * field - если нет "elem", в правый столбец подставляется layerProperties[field]
//   * trid - id для DOM элементов. Не применяется, если прямо указано tr
//   * trclass - class для DOM элементов. Не применяется, если прямо указано tr
// - layerProperties - просто хеш строк для подстановки в правую колонку
// - style:
//   * leftWidth - ширина левой колонки в пикселях
//   * leftcolumnclass - class для td элементов первого столбца. Не применяется, если прямо указано tr
//   * rightcolumnclass - class для td элементов второго столбца. Не применяется, если прямо указано tr
mapHelper.prototype.createPropertiesTable = function(shownProperties, layerProperties, style)
{
	var _styles = $.extend({leftWidth: 100}, style);
	var trs = [];
	for (var i = 0; i < shownProperties.length; i++)
	{
		var td;
		if (typeof shownProperties[i].tr !== 'undefined')
		{
			trs.push(shownProperties[i].tr);
			continue;
		}

		if (typeof shownProperties[i].elem !== 'undefined')
			td = _td([shownProperties[i].elem]);
		else
			td = _td([_t(layerProperties[shownProperties[i].field] != null ? layerProperties[shownProperties[i].field] : '')],[['css','padding','0px 3px']]);

        var tdTitle = _td([_t(shownProperties[i].name)],[['css','width', _styles.leftWidth + 'px']]);

		var tr = _tr([tdTitle, td]);

        _(tdTitle, [], [['dir', 'className', 'propertiesTable-title ' + (_styles.leftcolumnclass || '')]]);

        if (_styles.rightcolumnclass)
            _(td, [], [['dir', 'className', _styles.rightcolumnclass]]);

        if (shownProperties[i].trid)
            _(tr, [], [['attr', 'id', shownProperties[i].trid]]);

        if (shownProperties[i].trclass)
            _(tr, [], [['dir', 'className', shownProperties[i].trclass]]);

		trs.push(tr);
	}

	return trs;
}

mapHelper.prototype.createLayerEditor = function(div, treeView, selected, openedStyleIndex)
{
	var elemProperties = div.gmxProperties.content.properties,
        layerName = elemProperties.name,
		_this = this;

	if (elemProperties.type == "Vector")
	{
		if (typeof this.layerEditorsHash[layerName] != 'undefined')
		{
			if (this.layerEditorsHash[layerName] != false) {
                this.layerEditorsHash[layerName].selectTab(selected);
            }

			return;
		}

		this.layerEditorsHash[layerName] = false;

		var mapName = elemProperties.mapName,
			createTabs = function(layerProperties)
			{
				var id = 'layertabs' + layerName,
					divProperties = _div(null,[['attr','id','properties' + id], ['css', 'height', '100%']]),
					tabMenu,
                    additionalTabs = [];

				var pos = nsGmx.Utils.getDialogPos(div, true, 390),
                    updateFunc = function()
                    {
                    },
					closeFunc = function()
					{
                        updateFunc();
						return false;
					};

				_this.createLoadingLayerEditorProperties(div, divProperties, layerProperties, {
                    doneCallback: function()
                    {
                        $(divDialog).dialog('close');
                    },
                    additionalTabs: additionalTabs,
                    selected: selected,
                    createdCallback: function(layerEditor) {
                        _this.layerEditorsHash[layerName] = layerEditor;
                        _this.layerEditorsHash[layerName].closeFunc = closeFunc;
                        _this.layerEditorsHash[layerName].updateFunc = updateFunc;
                    }
                });

				var divDialog = showDialog(_gtxt('Слой [value0]', elemProperties.title), divProperties, 350, 470, pos.left, pos.top, null, function()
                {
                    closeFunc();
                    delete _this.layerEditorsHash[layerName];
                });

				// при сохранении карты сбросим все временные стили в json карты
				divProperties.closeFunc = closeFunc;
				divProperties.updateFunc = updateFunc;
			};

		if (!this.attrValues[mapName])
			this.attrValues[mapName] = {};

		sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?WrapStyle=func&NeedAttrValues=false&LayerName=" + layerName, function(response)
		{
			if (!parseResponse(response))
				return;

            var columns = response.Result.Columns;
            var attributesHash = {};

            for (var i = 0; i < columns.length; i++) {
                attributesHash[columns[i].Name] = [];
            }

			_this.attrValues[mapName][layerName] = new nsGmx.LazyAttributeValuesProviderFromServer(attributesHash, layerName);

			createTabs(response.Result);
		})
	}
	else if (elemProperties.type == "Raster")
	{
		if (elemProperties.LayerID)
		{
			if (this.layerEditorsHash[layerName])
				return;

			this.layerEditorsHash[layerName] = true;

			var id = 'layertabs' + layerName,
				divProperties = _div(null,[['attr','id','properties' + id], ['css', 'height', '100%']]),
				divStyles = _div(null,[['attr','id','styles' + id], ['css', 'height', '100%'], ['css', 'overflowY', 'auto']]);

			var layer = nsGmx.gmxMap.layersByID[layerName],
				parentStyle = elemProperties.styles && elemProperties.styles[0] || elemProperties;

            var zoomPropertiesControl = new nsGmx.ZoomPropertiesControl(parentStyle.MinZoom, parentStyle.MaxZoom),
                liMinZoom = zoomPropertiesControl.getMinLi(),
                liMaxZoom = zoomPropertiesControl.getMaxLi();

            $(zoomPropertiesControl).change(function()
            {
                layer.setZoomBounds(this.getMinZoom(), this.getMaxZoom());
            });

			_(divStyles, [_ul([liMinZoom, liMaxZoom])]);

			this.createLoadingLayerEditorProperties(div, divProperties, null, {
                doneCallback: function()
                {
                    $(divDialog).dialog('close');
                },
                additionalTabs: [{title: _gtxt("Стили"), name: 'styles', container: divStyles}]

            });

			var pos = nsGmx.Utils.getDialogPos(div, true, 330),
				closeFunc = function()
				{
                    elemProperties.styles = elemProperties.styles || [];
                    elemProperties.styles[0] = elemProperties.styles[0] || {};

					elemProperties.styles[0].MinZoom = zoomPropertiesControl.getMinZoom();
					elemProperties.styles[0].MaxZoom = zoomPropertiesControl.getMaxZoom();

					delete _this.layerEditorsHash[layerName];

					treeView.findTreeElem(div).elem.content.properties = elemProperties;

					_this.drawingBorders.removeRoute(layerName, true);

					if ($('#drawingBorderDialog' + layerName).length)
						removeDialog($('#drawingBorderDialog' + layerName)[0].parentNode);

					return false;
				};

			var divDialog = showDialog(_gtxt('Слой [value0]', elemProperties.title), divProperties, 330, 410, pos.left, pos.top, null, closeFunc);
		}
		else
		{
            nsGmx.createMultiLayerEditorServer(elemProperties, div, treeView);
        }
	} else if (elemProperties.type == "Virtual"){
        var divProperties = _div(null,[['attr','id','properties' + id], ['css', 'height', '100%']]);

        this.createLoadingLayerEditorProperties(div, divProperties, null, {
            doneCallback: function() {
                $(divDialog).dialog('close');
            }
        });

        var closeFunc = function() {
            delete _this.layerEditorsHash[layerName];
        };

        var pos = nsGmx.Utils.getDialogPos(div, true, 330);

        var divDialog = showDialog(_gtxt('Слой [value0]', elemProperties.title), divProperties, 330, 410, pos.left, pos.top, null);
    }
}

mapHelper.prototype.createWFSStylesEditor = function(parentObject, style, geometryType, divCanvas)
{
	var _this = this,
		templateStyle = {};

	$.extend(true, templateStyle, style);

    var elemCanvas = _mapHelper.createStylesEditorIcon([{MinZoom:1, MaxZoom: 21, RenderStyle: style.regularStyle}], geometryType);
    var spanIcon = _span([elemCanvas]);

	spanIcon.onclick = function()
	{
        var listenerId = parentObject.addListener('onSetStyle', function(style)
            {
                var newIcon = _this.createStylesEditorIcon([{MinZoom:1,MaxZoom:21,RenderStyle:style.regularStyle}], geometryType);
                $(spanIcon).empty().append(newIcon).attr('styleType', $(newIcon).attr('styleType'));
            });

		var canvasStyles = _div(null,[['css','marginTop','10px']]),
			canvasCharts = _div(null,[['css','marginTop','10px']]),
			closeFunc = function()
			{
				$(canvasStyles).find(".colorSelector").each(function()
				{
					$('#' + $(this).data("colorpickerId")).remove();
				});

				var layerElemCanvas = $(divCanvas).find("[geometryType='" + geometryType.toUpperCase() + "']")[0];
				layerElemCanvas.graphDataType = $(canvasCharts).find("select")[0].value;
				layerElemCanvas.graphDataProperties = $(canvasCharts).find("input")[0].value;

                parentObject.removeMapStateListener('onSetStyle', listenerId);
			};

		var id = 'wfstabs' + String(Math.random()).substring(2, 9),
			tabMenu = _div([_ul([_li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + id]])]),
								 _li([_a([_t(_gtxt("Диаграммы"))],[['attr','href','#graph' + id]])])])]),
			divStyles = _div(null,[['attr','id','styles' + id]]),
			divGraph = _div(null,[['attr','id','graph' + id]]);

		_(tabMenu, [divStyles, divGraph]);

        gmxCore.loadModule('LayerStylesEditor').done(function(module) {
            var resObject = module.createStyleEditor(canvasStyles, templateStyle, geometryType, false);

            $(resObject).change(function()
            {
                nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
            })
        });

		canvasStyles.firstChild.style.marginLeft = '0px';
		_(divStyles, [canvasStyles]);

		_mapHelper.createChartsEditor(canvasCharts, $(divCanvas).find("[geometryType='" + geometryType.toUpperCase() + "']")[0]);
		canvasCharts.firstChild.style.marginLeft = '0px';
		_(divGraph, [canvasCharts]);

		var pos = nsGmx.Utils.getDialogPos(spanIcon, false, 160);
		showDialog(_gtxt('Редактирование стилей объекта'), tabMenu, 330, 180, pos.left, pos.top, false, closeFunc);

		$(tabMenu).tabs({active: 0});
	}

	spanIcon.getStyle = function()
	{
		return templateStyle;
	}

    return spanIcon;
}

mapHelper.prototype.createChartsEditor = function(parent, elemCanvas)
{
	var graphTypeSel = nsGmx.Utils._select([_option([_t(_gtxt("График по времени"))], [['attr','value','func']]),
								_option([_t(_gtxt("Круговая"))], [['attr','value','pie']])], [['dir','className','selectStyle'],['css','width','180px']]),
		propertiesMask = _input(null, [['dir','className','inputStyle'],['css','width','180px']]);

	switchSelect(graphTypeSel, elemCanvas.graphDataType);
	propertiesMask.value = elemCanvas.graphDataProperties;

	_(parent, [_table([_tbody([_tr([_td([_t(_gtxt("Тип"))], [['css','width','100px']]), _td([graphTypeSel])]),
								_tr([_td([_t(_gtxt("Маска атрибутов"))]), _td([propertiesMask])])])])]);
}

mapHelper.prototype.createMultiStyle = function(elem, treeView, multiStyleParent, treeviewFlag, layerManagerFlag)
{
	var filters = elem.styles;

	if (filters.length < 2)
	{
		multiStyleParent.style.display = 'none';

		return;
	}

	multiStyleParent.style.display = '';

	var ulFilters = _ul();

	for (var i = 0; i < filters.length; i++)
	{
		var icon = this.createStylesEditorIcon([elem.styles[i]], elem.GeometryType.toLowerCase(), {addTitle: !layerManagerFlag}),
			name = elem.styles[i].Name || elem.styles[i].Filter || 'Без имени ' + (i + 1),
            iconSpan = _span([icon]),
			li = _li([_div([iconSpan, _span([_t(name)],[['css','marginLeft','3px']])])]);

        $(iconSpan).attr('styleType', $(icon).attr('styleType'));

		if (!layerManagerFlag)
		{
			(function(i)
			{
				iconSpan.onclick = function()
				{
                    nsGmx.createStylesDialog(elem, treeView, i);
					//_mapHelper.createLayerEditor(multiStyleParent.parentNode, treeView, 'styles', i);
				}
			})(i);
		}

		_(ulFilters, [li])
	}

	ulFilters.style.display = 'none';
	ulFilters.className = 'hiddenTree';

	_(multiStyleParent, [_ul([_li([_div([_t(_gtxt("Стили слоя"))]), ulFilters])])]);

	if (typeof treeviewFlag == 'undefined')
        $(multiStyleParent.firstChild).treeview();
}

mapHelper.prototype.load = function()
{
	var _this = this;

	if (!this.builded)
	{
		var fileName;

		if (typeof window.gmxViewerUI !== 'undefined' && typeof window.gmxViewerUI.usageFilePrefix !== 'undefined')
			fileName = window.gmxViewerUI.usageFilePrefix;
		else
			fileName = window.gmxJSHost ? window.gmxJSHost + "usageHelp" : "usageHelp";

		fileName += _gtxt("helpPostfix");

		_mapHelper._loadHelpTextFromFile(fileName, function( text )
		{
			var div = _div(null, [['dir','className','help']]);
			div.innerHTML = text;
			_(_this.workCanvas, [div]);
		});

		this.builded = true;
	}
}

mapHelper.prototype._loadHelpTextFromFile = function( fileName, callback, num, data )
{
	var proceess = function( text ) {
		callback(Handlebars.compile(text)({gmxVersion: num, gmxData: data}));
	}

	if (fileName.indexOf("http://") !== 0)
		$.ajax({url: fileName, success: proceess});
	else
		sendCrossDomainJSONRequest(serverBase + "ApiSave.ashx?get=" + encodeURIComponent(fileName), function(response)
		{
			proceess(response.Result);
		});
}

mapHelper.prototype.version = function()
{
    var div = $("<div class='gmx-about'></div>");

    var fileName;

    if (typeof window.gmxViewerUI !== 'undefined' && typeof window.gmxViewerUI.helpFilePrefix !== 'undefined')
        fileName = window.gmxViewerUI.helpFilePrefix;
    else
        fileName = window.gmxJSHost ? window.gmxJSHost + "help" : "help";

    fileName += _gtxt("helpPostfix");

    _mapHelper._loadHelpTextFromFile( fileName, function(text)
    {
        div.html(text);
        showDialog(_gtxt("О проекте"), div[0], 500, 300, false, false);
    }, window.nsGmx.GeomixerFrameworkVersion, '' );
}

mapHelper.prototype.print = function() {
	var centerControl = nsGmx.leafletMap.gmxControlsManager.get('center'),
		map = nsGmx.leafletMap,
    	toggleMode = function(isPreviewMode) {
        	map.gmxControlsManager.get('hide').setActive(!isPreviewMode);
        	window.printMode = isPreviewMode;
        	$('#header, #leftMenu, #leftCollapser, #bottomContent, #tooltip, .ui-datepicker-div').toggleClass('print-preview-hide', isPreviewMode);
        	$('#all').toggleClass('print-preview-all', isPreviewMode);
			$('.ui-dialog').toggle();
			$('.leaflet-gmx-iconSvg-hide').toggle();
			$('.leaflet-control-container').toggle();
    	};

    toggleMode(true);
	centerControl.removeFrom(map);

    var ui = $(Handlebars.compile('<div class="print-ui"><span class="print-ui-inner">' +
        '<button class="print-ui-close">Закрыть</button>' +
        '<button class="print-ui-print">Печать</button>' +
			'<span class="layoutContainer">' +
				'<label><input type="radio" name="layout" value="portrait" checked="true">' + _gtxt('портретная') + '</label>' +
				'<label><input type="radio" name="layout" value="layout">' + _gtxt('альбомная') + '</label>' +
			'</span>' +
		'</span>' +
		'</div>')());

	var BIG = 1150,
		SMALL = BIG / 1.4142
	var layout = {
		width: SMALL + 'px',
		height: BIG + 'px'
	};

	ui.find('input[value="portrait"]').click(function() {
		this.checked = true;
		layout.width = SMALL + 'px';
		layout.height = BIG + 'px';

		$('#flash').css({
			width: layout.width,
			height: layout.height
		});

	    map.invalidateSize();
	});

	ui.find('input[value="layout"]').click(function() {
		this.checked = true;
		layout.width = BIG + 'px';
		layout.height = SMALL + 'px';

		$('#flash').css({
			width: layout.width,
			height: layout.height
		});

	    map.invalidateSize();
	});

	ui.find('.print-ui-print').click(function() {
		window.print();
	})

    ui.find('.print-ui-close').click(function() {
        toggleMode(false);
		centerControl.addTo(map);

        $('#flash').css({
            marginLeft: '0px',
            marginTop: '0px'
        });

        window.resizeAll();
        ui.remove();
    });

    $('body').append(ui);

    $('#flash').css({
		top: '0px',
		left: '0px',
		width: layout.width,
		height: layout.height
	});

    map.invalidateSize();
}

// экспортный режим редактора
mapHelper.prototype.exportMap = function(params) {
	var map = nsGmx.leafletMap;

    map.gmxControlsManager.get('hide').setActive(false);
	map.gmxControlsManager.get('center').removeFrom(map);
    window.exportMode = true;

	if (params.grid) {
		var grid = nsGmx.gridManager.gridControl;

		grid.setFixBounds(L.latLngBounds(params.exportBounds._southWest, params.exportBounds._northEast));

	} else {
		nsGmx.gridManager.setState(false);
	}

    $('#header, #leftMenu, #leftCollapser, #bottomContent, #tooltip, .ui-datepicker-div').toggleClass('print-preview-hide', true);

    $('#all').toggleClass('print-preview-all', true);

	$('.leaflet-control-container').hide();

    $('#leftContent').mCustomScrollbar({live:"off"});

	var exportCssParams = {
		top: '0px',
		left: '0px',
		width: '100%',
		height: '100%'
	};

	$('#flash').css(exportCssParams);
	map.invalidateSize();
}

//вызывает callback для всех слоёв поддерева treeElem. Параметры: callback(layerInfo, visibilityFlag)
mapHelper.prototype.findChilds = function(treeElem, callback, flag)
{
	var childsArr = treeElem.content ? treeElem.content.children : treeElem.children;
	if (childsArr)
	{
		for (var i = 0; i < childsArr.length; i++)
		{
			var child = childsArr[i];

			if (child.type == 'group')
				this.findChilds(child, callback, flag && child.content.properties.visible)
			else
				callback(child, flag && child.content.properties.visible);
		}
	}
}

mapHelper.prototype.findTreeElems = function(treeElem, callback, flag, list)
{
	var childsArr = treeElem.content ? treeElem.content.children : treeElem.children;

	for (var i = 0; i < childsArr.length; i++)
	{
		var child = childsArr[i];

		if (child.type == 'group')
		{
			callback(child, flag, treeElem.content ? treeElem.content.properties.list : treeElem.properties.list, i);

			this.findTreeElems(child, callback, flag && child.content.properties.visible, treeElem.content ? treeElem.content.properties.list : treeElem.properties.list)
		}
		else
			callback(child, flag, treeElem.content ? treeElem.content.properties.list : treeElem.properties.list, i);
	}
}

/**
 *  Модифицирует объекты внутри векторного слоя, отправляя изменения на сервер и информируя об этом API
 *
 * @memberOf _mapHelper
 * @name modifyObjectLayer
 * @function
 * @param {String} layerName Имя слоя
 * @param {Object[]} objs Массив описания объектов. Каждое описание представляет из себя объект:
 *
 *  * id {String} ID объекта слоя, над которым производятся изменения (только для модификации и удаления)
 *  * geometry Описание геометрии (вставка и изменение). GeoJSON
 *  * source: {rc: <name КР-источника>, rcobj: <id объекта внутри КР>}
 *  * properties Свойства объекта (вставка и изменение)
 *  * action {'delete'|'insert'|'update'} Производимое действие. Если не указано, то вычисляется следующим образом:
 *    * Если не указан id, то вставка
 *    * Если указан id, то модифицируем
 *    * Для удаления объекта нужно явно прописать параметр
 * @param {String} [crs='EPSG:3395'] Название системы координат геометрии объектов. Поддерживаются 3395, 4326, 3857
 * @return {jQuery.Deferred} Ресолвится в соответствии с ответом сервера
*/
mapHelper.prototype.modifyObjectLayer = function(layerName, objs, crs)
{
    var def = $.Deferred();

    $.each(objs, function(i, obj)
    {
        obj.action = obj.action || (obj.id ? 'update' : 'insert');
    });
    var params = {
        WrapStyle: 'window',
        LayerName: layerName,
        objects: JSON.stringify(objs)
    };
    if (crs) {
        params.geometry_cs = crs;
    }
    sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx",
        params
        ,
        function(addResponse)
        {
            if (!parseResponse(addResponse))
            {
                def.reject();
                return;
            }

            var mapLayer = nsGmx.gmxMap.layersByID[layerName];
            if (mapLayer) {
                L.gmx.layersVersion.chkVersion(mapLayer, function() {
                    def.resolve();
                });
            }
            else
            {
                def.resolve();
            }
        }
    )

    return def.promise();
}

/** Запросить с сервера объекты векторного слоя
 * @memberOf _mapHelper
 * @name searchObjectLayer
 * @function
 * @param {String} layerName ID векторного слоя
 * @param {Object} options Параметры запроса
 * @param {String} [options.query] SQL-подобное выражение для выборки объектов
 * @param {Boolean} [options.includeGeometry=false] Возвращать ли геометрию с сервера или нет
 * @param {Object} [options.border=null] GeoJSON для ограничения выборки по геометрии
 * @param {Number} [options.page=0] номер страницы результатов (0 - результаты с самого первого)
 * @param {Number} [options.pagesize=100000] максимальное кол-во объектов в ответе
 * @return {jQuery.Deferred} Promise, который ресолвится массивом найденных объектов. Каждый объект имеет свойства properties и, возможно, geometry
*/
mapHelper.prototype.searchObjectLayer = function(layerName, options) {
    options = options || {};

    var def = $.Deferred();

    var requestParams = {
        WrapStyle: 'message',
        layer: layerName
    }

    if (options.query) {
        requestParams.query = options.query;
    }

    if (options.includeGeometry) {
        requestParams.geometry = true;
    }

    if (options.border) {
        requestParams.border = JSON.stringify(options.border);
    }

    requestParams.page = options.page || 0;
    requestParams.pagesize = options.pagesize || 100000;

    sendCrossDomainPostRequest(serverBase + "VectorLayer/Search.ashx", requestParams, function(response) {
        if (!parseResponse(response)) {
            def.reject(response);
            return;
        }
        var values = response.Result.values;
        var fields = response.Result.fields;
        var objects = [];
        for (var i = 0; i < values.length; i++) {
            var obj = {properties: {}};

            for (var p = 0; p < values[i].length; p++) {
                if (fields[p] === 'geomixergeojson') {
                    obj.geometry = values[i][p];
                } else {
                    obj.properties[fields[p]] = values[i][p];
                }
            }
            objects.push(obj);
        }

        def.resolve(objects);
    });

    return def.promise();
}

/** Скачать векторный слой с сервера
 * @memberOf _mapHelper
 * @name downloadVectorLayer
 * @function
 * @param {Object} params Параметры запроса
 * @param {String} params.name ID векторного слоя, который нужно скачать
 * @param {String} params.host хост, с которого будем скачивать слой
 * @param {String} [params.format=Shape] В каком формате хотим получить (Shape, Tab, gpx, csv, csv_wkt, excel, kml или несколько через запятую)
 * @param {String} [params.query] SQL запрос для сохранения выборки данных вместо всех данных слоя
 * @param {Array} [params.columns] Атрибуты, которые нужно скачать. Массив объектов с ключами {Value, Alias}
*/
mapHelper.prototype.downloadVectorLayer = function(params) {
    var requestParams = {
        t: params.name
    };

    if (params.format) {
        requestParams.format = params.format;
    }

    if (params.query) {
        requestParams.query = params.query;
    }

    if (params.columns) {
        requestParams.columns = JSON.stringify(params.columns);
    }

    sendCrossDomainPostRequest("http://" + params.host + "/" + "DownloadLayer.ashx", requestParams);


	// if (window.FormData) {
	//
	// 	var form = document.createElement("form");
	// 	form.style.display = 'none';
	// 	form.setAttribute('enctype', 'multipart/form-data');
	// 	form.name = 'uploadFile';
	//
	// 	var hiddenParamsDiv = document.createElement("div");
	// 	hiddenParamsDiv.style.display = 'none';
	//
	// 	for (var paramName in requestParams) {
	// 		var input = document.createElement("input");
	// 		var value = typeof requestParams[paramName] !== 'undefined' ? requestParams[paramName] : '';
	//
	// 		input.setAttribute('type', 'hidden');
	// 		input.setAttribute('name', paramName);
	// 		input.setAttribute('value', value);
	//
	// 		hiddenParamsDiv.appendChild(input)
	// 	}
	//
	//     form.appendChild(hiddenParamsDiv);
	//
	// 	var formData = new FormData(form);
	//
	//
	// 	var xhr = new XMLHttpRequest();
	// 	// :attachment; filename="suda_15062017_Sentinel_poly.zip";
	// 	xhr.open('POST', /*"http://" + /*params.host*/ window.serverBase + /*"/" + */"DownloadLayer.ashx");
	//
	// 	// xhr.setRequestHeader('Content-Disposition', 'attachment');
	// 	xhr.onload = function () {
	// 		if (xhr.status === 200) {
	// 			// var blob = new Blob([xhr.response], {type: "application/zip"});
	// 			var blob = xhr.response;
	// 			console.log(xhr);
	// 			console.log(blob);
	// 			saveData(blob, params.name);
	// 		}
	// 	}
	//
	// 	xhr.withCredentials = true;
	// 	xhr.responseType = "blob";
	// 	xhr.send(formData);
	//
	// 	function saveData(blob, name) {
	// 		var url = window.URL.createObjectURL(blob),
	// 		a = document.createElement("a");
	// 		console.log(url);
	// 		document.body.appendChild(a);
	// 		a.style = "display: none";
	// 		a.href = url;
	// 		a.download = name;
	// 		// a.click();
	// 		window.URL.revokeObjectURL(url);
	// 	};
	// }
}

var _mapHelper = new mapHelper();
window._mapHelper = _mapHelper;
window.mapHelper = mapHelper;

mapHelp.mapHelp.load = function()
{
	var alreadyLoaded = _mapHelper.createWorkCanvas(arguments[0]);

	if (!alreadyLoaded)
		_mapHelper.load()
}

mapHelp.mapHelp.unload = function()
{
}

mapHelp.serviceHelp.load = function()
{
	var alreadyLoaded = _serviceHelper.createWorkCanvas(arguments[0]);

	if (!alreadyLoaded)
		_serviceHelper.load()
}
mapHelp.serviceHelp.unload = function()
{
}

var serviceHelper = function()
{
	this.builded = false;
}

serviceHelper.prototype = new leftMenu();

serviceHelper.prototype.load = function()
{
	var _this = this;
	if (!this.builded)
	{
		var fileName;

		if (typeof window.gmxViewerUI !== 'undefined' && typeof window.gmxViewerUI.servicesFilePrefix !== 'undefined')
			fileName = window.gmxViewerUI.servicesFilePrefix;
		else
			fileName = window.gmxJSHost ? window.gmxJSHost + "servicesHelp" : "servicesHelp";

		fileName += _gtxt("helpPostfix");

		_mapHelper._loadHelpTextFromFile(fileName, function( text )
		{
			var div = _div(null, [['dir','className','help']]);
			div.innerHTML = text;
			_(_this.workCanvas, [div]);
		});

		this.builded = true;
	}
}

var _serviceHelper = new serviceHelper();
window._serviceHelper = _serviceHelper;

mapHelp.tabs.load = function()
{
	var alreadyLoaded = _queryTabs.createWorkCanvas(arguments[0]);

	if (!alreadyLoaded)
		_queryTabs.load()
}
mapHelp.tabs.unload = function()
{
}

mapHelp.externalMaps.load = function()
{
	var alreadyLoaded = _queryExternalMaps.createWorkCanvas(arguments[0]);

	if (!alreadyLoaded)
		_queryExternalMaps.load()
}
mapHelp.externalMaps.unload = function()
{
}

//Динамически подгружаемые части вьюера

//Редактирование мультислоя
nsGmx.createMultiLayerEditorServer = gmxCore.createDeferredFunction('MultiLayerEditor', 'createMultiLayerEditorServer');
nsGmx.createMultiLayerEditorNew = gmxCore.createDeferredFunction('MultiLayerEditor', 'createMultiLayerEditorNew');

//Редактирование карты и группы
nsGmx.addSubGroup = gmxCore.createDeferredFunction('GroupEditor', 'addSubGroup');
nsGmx.createGroupEditor = gmxCore.createDeferredFunction('GroupEditor', 'createGroupEditor');
nsGmx.createMapEditor = gmxCore.createDeferredFunction('GroupEditor', 'createMapEditor');

//Редактирование свойств слоя
nsGmx.createLayerEditor = gmxCore.createDeferredFunction('LayerEditor', 'createLayerEditor');

//Редактирование стилей векторного слоя
nsGmx.createStylesDialog = gmxCore.createDeferredFunction('LayerStylesEditor', 'createStylesDialog');

//Библиотека стилей
nsGmx.showStyleLibraryDialog = gmxCore.createDeferredFunction('StyleLibrary', 'showStyleLibraryDialog');

})(nsGmx.Utils._);
