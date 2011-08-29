var drawingObjects = 
{
	drawingObjects : {},
	loadShp: {}
}


var queryDrawingObjects = function()
{
	this.builded = false;
	
	this.objectsCanvas = null;
	this.downloadCanvas = null;
	
	this.downloadVectorForm = null;
	
	this.downloadRasterCanvas = null;
	
	this.count = 0;
	
	// this._visibilityDelegates = [];
}

queryDrawingObjects.prototype = new leftMenu();

// Делегаты пользовательских объектов - классы, управляющие отображением объектов на панели пользовательских объектов
// Методы:
//   - isHidden(elem) -> Bool
// queryDrawingObjects.prototype.addVisibilityDelegate = function( delegate )
// {
	// this._visibilityDelegates.push( delegate );
// }

queryDrawingObjects.prototype.createCanvas = function()
{
	this.objectsCanvas = _div(null, [['dir','className','drawingObjectsCanvas']]);
	this.downloadCanvas = _div(null, [['dir','className','drawingObjectsDownloadCanvas']]);
	
	this.downloadVectorForm = _form([_input(null,[['attr','name','name']]),
									 _input(null,[['attr','name','points']]),
									 _input(null,[['attr','name','lines']]),
									 _input(null,[['attr','name','polygons']])], [['css','display','none'],['attr','method','POST'],['attr','action',serverBase + "Shapefile.ashx"]]);
	
	var _this = this;
	
	var downloadVector = makeLinkButton(_gtxt("Скачать shp-файл"));
	downloadVector.onclick = function()
	{
		_this.downloadMarkers();
	}
	
	var downloadRaster = makeLinkButton(_gtxt("Скачать фрагмент растра"));
	downloadRaster.onclick = function()
	{
		_this.downloadRasters();
	}
	
	var delAll = makeLinkButton(_gtxt("Очистить"));
	delAll.onclick = function()
	{
		globalFlashMap.drawing.forEachObject(function(obj) { obj.remove(); }); 
		
		return false;
	}
	
	hide(this.downloadCanvas);
	
	_(this.downloadCanvas, [_div([downloadVector])]);
	
	if (_mapHelper.mapProperties.CanDownloadRasters)
	{
		this.downloadRasterCanvas = _div([downloadRaster]);
		this.downloadRasterCanvas.style.display = 'none';
		
		_(this.downloadCanvas, [this.downloadRasterCanvas]);
	}
	
	_(this.downloadCanvas, [_div([delAll]), this.downloadVectorForm]);
}

queryDrawingObjects.prototype.onAdd = function(elem)
{
	if (nsGmx.DrawingObjectCustomControllers.isHidden(elem))
		return;
		
	// for (var d = 0; d < _queryDrawingObjects._visibilityDelegates.length; d++)
		// if ( _queryDrawingObjects._visibilityDelegates[d].isHidden(elem) )
			// return;
	
	if (!$$('left_objects') ||
		$$('left_objects').style.display == 'none')
		drawingObjects.drawingObjects.load();
	
	elem.canvas = _div(null, [['dir','className','canvas']]);
	elem.title = _span(null, [['dir','className','title']]);
	elem.text = _span(null, [['dir','className','text']]);
	elem.summary = _span(null, [['dir','className','summary']]);
	
	elem.text.onclick = elem.title.onclick = function()
	{
		var bounds = getBounds(elem.geometry.coordinates),
			curZ = globalFlashMap.getZ();
		
		globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
		
		if (elem.geometry.type == "POINT")
			globalFlashMap.moveTo(globalFlashMap.getX(), globalFlashMap.getY(), Math.max(14, curZ));
	}
	
	var regularDrawingStyle = {
			marker: {size: 3},
			outline: { color: 0x0000ff, thickness: 3, opacity: 80 },
			fill: {color: 0xffffff}
		},
		icon = null;
	
	if (elem.geometry.type == "POINT")
	{
		icon = _img(null, [['attr','src','img/flag_min.png']])
	}
	else
	{
		icon = _mapHelper.createDrawingStylesEditorIcon(regularDrawingStyle, elem.geometry.type.toLowerCase());
		_mapHelper.createDrawingStylesEditor(elem, regularDrawingStyle, icon);
	}
	
	var remove = makeImageButton('img/closemin.png','img/close_orange.png')
	remove.onclick = function()
	{
		elem.remove();
	}
	
	remove.className = 'remove';		
	
	_(elem.canvas, [_div([icon, elem.title, elem.text, elem.summary], [['dir','className','item']]), remove]);
	
	if ($.browser.msie)
	{
		icon.style.marginLeft = '2px';
		icon.style.marginRight = '9px';
	}
	
	_(_queryDrawingObjects.objectsCanvas, [elem.canvas])
	
	_queryDrawingObjects.onEdit(elem);

	show(_queryDrawingObjects.downloadCanvas);
	
	_queryDrawingObjects.count++;
	
	if (_queryDrawingObjects.downloadRasterCanvas && isRectangle(elem.geometry.coordinates))
		_queryDrawingObjects.downloadRasterCanvas.style.display = '';
}

queryDrawingObjects.prototype.onEdit = function(elem)
{
	var type = elem.geometry.type,
		coords = elem.geometry.coordinates,
		text = elem.properties.text;
	
	removeChilds(elem.title);
	removeChilds(elem.text);
	removeChilds(elem.summary);
	
	if (type == "POINT")
	{
		_(elem.title, [_t(_gtxt("точка"))]);
		_(elem.summary, [_t("(" + formatCoordinates(merc_x(coords[0]), merc_y(coords[1])) + ")")]);
	}
	else if (type == "LINESTRING")
	{
		_(elem.title, [_t(_gtxt("линия"))]);
		_(elem.summary, [_t("(" + prettifyDistance(geoLength(coords)) + ")")]);
	}
	else if (type == "POLYGON")
	{
		_(elem.title, [_t(isRectangle(coords) ? _gtxt("прямоугольник") : _gtxt("многоугольник"))]);
		_(elem.summary, [_t("(" + prettifyArea(geoArea(coords)) + ")")]);
	}
	
	_(elem.text, [_t(text ? text.replace(/<[^<>]*>/g, " ") : "")])
	
	if (text)
		elem.title.style.display = 'none';
	else
		elem.title.style.display = '';
}

queryDrawingObjects.prototype.onRemove = function(elem)
{
	if (!elem.canvas) return;
	
	_queryDrawingObjects.count--;
	
	elem.canvas.removeNode(true)
	
	if (_queryDrawingObjects.count == 0)
		hide(_queryDrawingObjects.downloadCanvas);
	
	if (_queryDrawingObjects.downloadRasterCanvas)
	{
		var rectCount = 0;
		
		globalFlashMap.drawing.forEachObject(function(ret)
		{
			if (isRectangle(ret.geometry.coordinates))
				rectCount++;
		})
		
		if (rectCount == 1 && elem.geometry.type == 'POLYGON' && isRectangle(elem.geometry.coordinates))
			_queryDrawingObjects.downloadRasterCanvas.style.display = 'none';
	}
}
/*
queryDrawingObjects.prototype.attachMapDrawingEvents = function()
{
	var _this = this;
	
	window.globalFlashMap.drawing.setHandlers(
	{
		onAdd: this.onAdd,
		onEdit: this.onEdit,
		onRemove: this.onRemove
	});
}
*/
queryDrawingObjects.prototype.attachMapDrawingEvents = function()
{
	var _this = this;
	
	window.globalFlashMap.drawing.setHandlers(
	{
		onAdd: this.onAdd,
		onEdit: function(elem)
		{
			_this.onEdit(elem);
			
			if (elem.geometry.type == 'POLYGON' &&
				_mapHelper.drawingBorders.length() > 0)
			{
				_mapHelper.drawingBorders.forEach(function(name, obj)
				{
					if (obj.canvas == elem.canvas)
						_mapHelper.drawingBorders.updateBorder(name);
				});
				// for (var name in _mapHelper.drawingBorders)
					// if (_mapHelper.drawingBorders[name].canvas == elem.canvas)
						// _mapHelper.updateBorder(name);
								
			}
			
			for (var name in _attrsTableHash.hash)
				for (var ogc_fid in _attrsTableHash.hash[name].drawingBorders)
					if (_attrsTableHash.hash[name].drawingBorders[ogc_fid].canvas == elem.canvas)
						_attrsTableHash.hash[name].updateObjectGeometry(ogc_fid.replace('ogc_fid',''));
		},
		onRemove: function(elem)
		{
			_this.onRemove(elem);
			
			if (elem.geometry.type == 'POLYGON' &&
				_mapHelper.drawingBorders.length() > 0)
			{
				_mapHelper.drawingBorders.forEach(function(name, obj)
				{
					if (obj.canvas == elem.canvas)
						_mapHelper.drawingBorders.removeRoute(name);
				});
				// for (var name in _mapHelper.drawingBorders)
					// if (_mapHelper.drawingBorders[name].canvas == elem.canvas)
						// _mapHelper.removeRoute(name);
								
			}
			
			for (var name in _attrsTableHash.hash)
				for (var ogc_fid in _attrsTableHash.hash[name].drawingBorders)
					if (_attrsTableHash.hash[name].drawingBorders[ogc_fid].canvas == elem.canvas)
						_attrsTableHash.hash[name].removeObjectGeometry(ogc_fid.replace('ogc_fid',''));
		}
	});
}

queryDrawingObjects.prototype.load = function()
{
	if (!this.builded)
	{
		_(this.workCanvas, [this.objectsCanvas, this.downloadCanvas])
		
		this.builded = true;
	}
}

queryDrawingObjects.prototype.downloadMarkers = function()
{
	var canvas = _div(),
		filename = _input(null, [['dir','className','filename'],['attr','value','markers']]),
		_this = this;
	
	var downloadButton = makeButton(_gtxt("Скачать"));
	downloadButton.onclick = function()
	{
		if (filename.value == '')
		{
			$(filename).addClass("error")
			
			setTimeout(function(){if (filename) $(filename).removeClass("error")}, 2000);
			
			return
		}
		
		var objectsByType = {},
			markerIdx = 1;
		
		globalFlashMap.drawing.forEachObject(function(ret)
		{
			var type = ret.geometry.type;
			
			if (!objectsByType[type])
				objectsByType[type] = [];
			if (ret.geometry.type == "POINT" && ((ret.properties.text == "") || !ret.properties.text))
			{
				ret.properties.text = "marker " + markerIdx;
				markerIdx++;
			}
			
			objectsByType[type].push({ geometry: ret.geometry, properties: ret.properties });
		});
		
		_this.downloadVectorForm.childNodes[0].value = filename.value;
		_this.downloadVectorForm.childNodes[1].value = objectsByType["POINT"] ? JSON.stringify(objectsByType["POINT"]) : '';
		_this.downloadVectorForm.childNodes[2].value = objectsByType["LINESTRING"] ? JSON.stringify(objectsByType["LINESTRING"]) : '';
		_this.downloadVectorForm.childNodes[3].value = objectsByType["POLYGON"] ? JSON.stringify(objectsByType["POLYGON"]) : '';
		
		_this.downloadVectorForm.submit();
		
		$(canvas.parentNode).dialog("destroy")
		canvas.parentNode.removeNode(true);
	}
	
	_(canvas, [_div([_t(_gtxt("Введите имя файла для скачивания")), filename],[['css','textAlign','center']]), _div([downloadButton],[['css','height','25px'],['css','width','100px'],['css','margin','15px 0px 0px 100px']])])
	
	var area = getOffsetRect(this.workCanvas)
	showDialog(_gtxt("Скачать shp-файл"), canvas, 291, 120, 30, area.top + 10)
}

queryDrawingObjects.prototype.downloadRasters = function()
{
	var obj = false,
		_this = this;
	
	globalFlashMap.drawing.forEachObject(function(elem)
	{
		var coords = elem.geometry.coordinates[0];
		
		if ((elem.geometry.type == "POLYGON") && (coords.length == 5) && ((coords[0][0] == coords[1][0]) || (coords[0][1] == coords[1][1])))
			obj = elem;
	});
	
	if (!obj)
	{
		showErrorMessage(_gtxt("Выберите область рамкой на карте"), true);
		
		return;
	}
	
	var bounds = getBounds(obj.geometry.coordinates),
		x1 = bounds.minX,
		y1 = bounds.minY,
		x2 = bounds.maxX,
		y2 = bounds.maxY,
		x = (x1 + x2) / 2,
		y = (y1 + y2) / 2,
		layer = false,
		layersToTest = 0,
		tryToFinish = function()
		{
			if (layersToTest == 0)
			{
				if (layer)
				{
					var canvas = _div(),
						filename = _input(null, [['dir','className','filename'],['attr','value',translit(layer.properties.title)]]),
						_this = this;
					
					var downloadButton = makeButton(_gtxt("Скачать"));
					downloadButton.onclick = function()
					{
						if (filename.value == '')
						{
							$(filename).addClass("error")
							
							setTimeout(function(){if (filename) $(filename).removeClass("error")});
							
							return
						}
						
						$(canvas.parentNode).dialog("destroy")
						canvas.parentNode.removeNode(true);
						
						window.location.href = 
								serverBase + "DownloadLayer.ashx" + 
								"?name=" + translit(filename.value) + 
								"&t=" + layer.properties.name + 
								"&MinX=" + truncate9(Math.min(x1, x2)) + 
								"&MinY=" + truncate9(Math.min(y1, y2)) +
								"&MaxX=" + truncate9(Math.max(x1, x2)) + 
								"&MaxY=" + truncate9(Math.max(y1, y2)) + 
								"&Area=" + Math.ceil(fragmentArea([[x1, y1], [x1, y2], [x2, y2], [x2, y1]])/1000000);
					}
					
					_(canvas, [_div([_t(_gtxt("Введите имя файла для скачивания")), filename],[['css','textAlign','center']]), _div([downloadButton],[['css','height','25px'],['css','width','100px'],['css','margin','15px 0px 0px 100px']])])
	
					var area = getOffsetRect(_queryDrawingObjects.workCanvas)
					showDialog(_gtxt("Вырезать фрагмент растра"), canvas, 291, 120, 10, area.top + 10)
				}
				else
					showErrorMessage(_gtxt("К прямоугольнику не подходит ни одного растрового слоя"), true);
			}
		}
	
	_mapHelper.forEachMyLayer(function(l)
	{
		if (l.properties.type != "Raster")
			return;
		if (!l.isVisible)
			return;
		if ((x < l.bounds.minX) || (x > l.bounds.maxX) || (y < l.bounds.minY) || (y > l.bounds.maxY))
			return;

		var coords = l.geometry.coordinates;

		if (l.geometry.type == "POLYGON" && !_this.testPolygon(coords, x, y))
			return;
		else if (l.geometry.type == "MULTIPOLYGON")
			for (var k = 0; k < coords.length; k++)
				if (!_this.testPolygon(coords[k], x, y))
					return;
		if (l && (!layer || (l.properties.MaxZoom > layer.properties.MaxZoom)))
			layer = l;
	});
	
	tryToFinish();
}

queryDrawingObjects.prototype.testRing = function(ring, x, y)
{
	var isInside = false;
	for (var j = 0; j < ring.length - 1; j++)
	{
		var x1 = ring[j][0],
			y1 = ring[j][1],
			x2 = ring[j + 1][0],
			y2 = ring[j + 1][1];
		
		if (((y1 >= y) != (y2 >= y)) && ((x1 + (x2 - x1)*(y - y1)/(y2 - y1)) > x))
			isInside = !isInside;
	}
	
	return isInside;
}
	
queryDrawingObjects.prototype.testPolygon = function(polygon, x, y)
{
	for (var j = 0; j < polygon.length; j++)
		if (this.testRing(polygon[j], x, y) != (j == 0))
			return false;

	return true;
}

var _queryDrawingObjects = new queryDrawingObjects();


var queryLoadShp = function()
{
	this.builded = false;
	
	this.uploader = null;
}

queryLoadShp.prototype = new leftMenu();

queryLoadShp.prototype.load = function()
{
	if (!this.builded)
	{
		this.iframe = _iframe(null,[['attr','id','upload_iframe'],['dir','src','upload-iframe.html'],['css','border','none'],['css','height','45px'],['css','width','250px']]);
		this.progress = _img(null,[['attr','src','img/progress.gif'],['css','display','none']])
			
		_(this.workCanvas, [_div([this.iframe, this.progress], [['css','padding','10px 0px 5px 20px']])])
	
	/*	this.uploader = makeLinkButton("Загрузить");
		
		_(this.workCanvas, [_div([this.uploader], [['css','padding','10px 0px 5px 20px']])]);
		
		this.createUploader();*/
		
		this.builded = true;
	}
}

queryLoadShp.prototype.createUploader = function()
{
	var uploader = createFlashUploader(this.uploader);
	uploader.setMultiple(false);
//	uploader.addFilter("ESRI Shapefiles (.shp, .shx, .dbf, .prj)", "*.shp;*.shx;*.dbf;*.prj");
	uploader.addFilter("ESRI Shapefile archive (.zip)", "*.zip;");
	uploader.onSelect = function()
	{
		uploader.upload(serverBase + "ShapeLoader.ashx");
	}
	uploader.onProgress = function(f)
	{
	//	document.getElementById("progress").innerHTML = f + "%";
		console.log(f)
	}
	uploader.onComplete = function(obj)
	{
		if (obj.length == 0)
		{
			showErrorMessage(_gtxt("Загруженный shp-файл пуст"), true);
			return;
		}
		
		var b = getBounds();
		for (var i = 0; i < obj.length; i++)
		{
			for (var j = 0; j < obj[i].length; j++)
			{
				var o = obj[i][j];
				globalFlashMap.drawing.addObject(o.geometry, o.properties);
				b.update(o.geometry.coordinates);
			}
		}
		globalFlashMap.zoomToExtent(b.minX, b.minY, b.maxX, b.maxY);
	}
	uploader.onError = function()
	{
		showErrorMessage(_gtxt("Ошибка скачивания"))
	}
}

queryLoadShp.prototype.upload = function()
{
	hide(this.iframe);
	show(this.progress);
	
	var _this = this,
		iframe$ = function(id) { return _this.iframe.contentWindow.document.getElementById(id); };
	
	iframe$("upload_shapefile_form").action = serverBase + "ShapeLoader.ashx";
	iframe$("upload_shapefile_response_url").value = 
		documentBase + "response-iframe.html?callbackName=" +
		uniqueGlobalName(function(id)
		{
			_mapHelper.restoreTinyReference(id, function(obj)
			{
				if (!$.browser.safari)
					_this.iframe.contentWindow.history.back();
				else
				{
					var newFrame = _iframe(null,[['attr','id','upload_iframe'],['dir','src','upload-iframe.html'],['css','border','none'],['css','height','45px'],['css','width','250px']]);
					$(_this.iframe).replaceWith(newFrame)
					
					_this.iframe = newFrame;
				}
				
				show(_this.iframe);
				hide(_this.progress);
				
				if (obj.length == 0)
				{
					showErrorMessage(_gtxt("Загруженный shp-файл пуст"), true);
					return;
				}
				
				var b = getBounds();
				for (var i = 0; i < obj.length; i++)
				{
					for (var j = 0; j < obj[i].length; j++)
					{
						var o = obj[i][j];
						globalFlashMap.drawing.addObject(o.geometry, o.properties);
						b.update(o.geometry.coordinates);
					}
				}
				globalFlashMap.zoomToExtent(b.minX, b.minY, b.maxX, b.maxY);
			});
		}) +
		"&text=";
	iframe$("upload_shapefile_form").submit();
}


var _queryLoadShp = new queryLoadShp();



drawingObjects.drawingObjects.load = function()
{
	var alreadyLoaded = _queryDrawingObjects.createWorkCanvas(arguments[0] || "objects");
	
	if (!alreadyLoaded)
		_queryDrawingObjects.load()
}

drawingObjects.drawingObjects.unload = function()
{
}

drawingObjects.loadShp.load = function()
{
	var alreadyLoaded = _queryLoadShp.createWorkCanvas(arguments[0] || "shp");
	
	if (!alreadyLoaded)
		_queryLoadShp.load()
}

drawingObjects.loadShp.unload = function()
{
}