var pointsBinding = 
{
	pointsBinding: {}
}

var queryBinding = function()
{
	this.conf = false;
	
	this.imgPoints = [],
	this.mapPoints = [],
	this.mapPointsFlags = [0,0,0,0],
	this.parentImage = null;
	this.toggle = null;
	
	this.dx = -7;
	this.dy = -26;
	
	this.loadTimer = null;
	
	this.imgDialog = null;
}

queryBinding.prototype = new leftMenu();

queryBinding.prototype.load = function()
{
	this.parentImage = globalFlashMap.rasters.addObject();
	
	for (var i = 0; i < 4; i++)
	{
		this.mapPoints[i] = globalFlashMap.addObject({type:'POINT', coordinates: [0, 0]});
	  	this.mapPoints[i].setStyle({marker: {image: "img/" + (i + 1) + "u.png", dx: this.dx, dy: this.dy}},{marker: {image: "img/" + (i + 1) + "uh.png", dx: this.dx, dy: this.dy}});
		this.mapPoints[i].setVisible(false);
	}
	
	var _this = this;
	
	for (var i = 0; i < 4; i++)
	{
		(function(i)
		{
	    	_this.mapPoints[i].setHandler('onMouseDown', function()
	    	{
	    		var draggedPoint = _this.mapPoints[i];
	    		var dx = draggedPoint.getGeometry().coordinates[0] - globalFlashMap.getMouseX();
	    		var dy = draggedPoint.getGeometry().coordinates[1] - globalFlashMap.getMouseY();

				globalFlashMap.freeze();
				globalFlashMap.setHandler('onMouseMove', function()
				{
					draggedPoint.setPoint(globalFlashMap.getMouseX() + dx, globalFlashMap.getMouseY() + dy);
					
					if (_this.getConformity(true))
						_this.drawConformity();
				});
	    	});
	    	_this.mapPoints[i].setHandler('onMouseUp', function()
	    	{
	    		globalFlashMap.unfreeze();
				globalFlashMap.setHandler('onMouseMove', null);
	    	});
    	})(i)
	}
	
	this.workArea = _div(null,[['dir','className','workArea']]);
	this.imgCanvas = _img(null, [['css','display','none']]);
	
	_(this.workArea, [this.imgCanvas]);
	
	var formFile = _form(null,[['attr','enctype','multipart/form-data'],['dir','method','post'],['dir','action', getAPIHostRoot() + 'imgSave.ashx?WrapStyle=window'],['attr','target','pictureBinding_iframe']]);
	formFile.style.width = '220px';
	_(formFile, [_input(null,[['attr','type','hidden'],['attr','name','id'],['dir','className','inputStyle'], ['attr','value','pictureBinding' + Math.random()]])]);

	var attach = _input(null,[['attr','type','file'],['dir','name','rawdata'],['attr','size',25]]);
	_(formFile, [attach]);
	
	var loadButton = makeButton(_gtxt("Загрузить"));
	loadButton.onclick = function()
	{
		var iframe = createPostIframe("pictureBinding_iframe", function(response)
		{
			if (!parseResponse(response))
				return;
			
			reloadButton.disabled = false;
			
			_this.showPictureDialog();
			
			_this.reloadImg(response.Result)
		});
		
		_(document.body, [iframe]);
		
		formFile.firstChild.setAttribute('value','pictureBinding' + Math.random())
		formFile.submit();
	}
	
	_(this.workCanvas, [_table([_tbody([_tr([_td([formFile]), _td([loadButton])])])],[['css','margin','10px 0px 5px 20px']])]);
		
	var imgTds = [],
		mapTds = [];
	
	this.workArea.imgLeft = 0;
	this.workArea.imgTop = 0;
		
	for (var i = 0; i < 4; i++)
	{
		(function(i)
		{
			var imgPoint = _div(null, [['dir','className','imgBoundingPoint'],['css','position','absolute']]);
			
			imgPoint.style.marginLeft = _this.dx + 'px';
			imgPoint.style.marginTop = _this.dy + 'px';
			
			$(imgPoint).draggable(
			{
				containment: _this.workArea,
				drag: function(ev, ui)
				{
					var pos = _this.getImgPosition();
					
					imgPoint.beginLeft = ui.absolutePosition.left - _this.workArea.imgLeft - pos.left,
					imgPoint.beginTop = ui.absolutePosition.top - _this.workArea.imgTop - pos.top;
					
					if (_this.getConformity(true))
						_this.drawConformity();
				}
			})
			
			imgPoint.style.left = '-500px';
			imgPoint.style.top = '-500px';
			
			imgPoint.beginLeft = -500;
			imgPoint.beginTop = -500;
			
			imgPoint.style.display = 'none';

			_(_this.workArea, [imgPoint]);
				
			_this.imgPoints.push(imgPoint);
			
			var imgHelperPoint = _div(null, [['dir','className','imgHelperPoint']])
			imgHelperPoint.onclick = function()
			{
				imgPoint.style.left = Math.floor(_this.getImgWidth() / 2) + 'px';
				imgPoint.style.top = Math.floor(_this.getImgHeight() / 2) + 'px';
				
				imgPoint.beginLeft = Math.floor(_this.getImgWidth() / 2) - _this.workArea.imgLeft;
				imgPoint.beginTop = Math.floor(_this.getImgHeight() / 2) - _this.workArea.imgTop;
				
				imgPoint.style.display = '';
			}
			
			imgTds.push(_td([imgHelperPoint]));
			
			var mapHelperPoint = _div(null, [['dir','className','imgHelperPoint']])
			mapHelperPoint.onclick = function(e)
			{
				_this.mapPoints[i].setGeometry({type:'POINT', coordinates: [globalFlashMap.getX(),globalFlashMap.getY()]})
				
				_this.mapPoints[i].setVisible(true);
				
				_this.mapPointsFlags[i] = 1;
			}
			
			mapTds.push(_td([mapHelperPoint]));
			
			imgHelperPoint.style.backgroundImage = "url(img/" + (i + 1) + "i.png)";
			mapHelperPoint.style.backgroundImage = "url(img/" + (i + 1) + "i.png)";
			imgPoint.style.backgroundImage = "url(img/" + (i + 1) + "u.png)";
			
			imgPoint.onmouseover = function()
			{
				imgPoint.style.backgroundImage = "url(img/" + (i + 1) + "uh.png)";
			}
			imgPoint.onmouseout = function()
			{
				imgPoint.style.backgroundImage = "url(img/" + (i + 1) + "u.png)";
			}
		})(i)
	}
	
	_(this.workCanvas, [_div([_table([_tbody([_tr([_td([_t(_gtxt('Точки на изображении:'))],[['css','width','150px'],['css','fontSize','12px']])].concat(imgTds))])],[['css','margin','5px 0px 0px 20px']])]),
						  _div([_table([_tbody([_tr([_td([_t(_gtxt('Точки на карте:'))],[['css','width','150px'],['css','fontSize','12px']])].concat(mapTds))])],[['css','margin','5px 0px 0px 20px']])])]);
	
	var drawButton = makeButton(_gtxt('Нарисовать'))
	drawButton.onclick = function()
	{
		if (_this.getConformity())
			_this.drawConformity();
	}
	
	var reloadButton = makeButton(_gtxt("Восстановить"))
	reloadButton.onclick = function()
	{
		$(_this.imgDialog).dialog('open')
	}
	
	if (!this.imgLoaded)
		reloadButton.disabled = true;
	
	this.toggle = _input(null, [['attr','type','checkbox'],['dir','className','box']])
	this.toggle.onclick = function()
	{
		if (_this.parentImage)
			_this.parentImage.setVisible(this.checked);
	}
	
	var tempStyle = typeof this.tempStyle != 'undefined' ? this.tempStyle : {fill: {opacity: 100}};
	
	this.slider = nsGmx.Controls.createSlider(typeof this.tempStyle != 'undefined' ? _this.tempStyle.fill.opacity : 100, 
		function(event, ui)
		{
			if (_this.parentImage)
			{
				tempStyle.fill.opacity = ui.value;
				_this.tempStyle = tempStyle;
				
				_this.parentImage.setStyle(tempStyle);
			}
		});
	
	var table = _table([_tbody([_tr([_td([_t(_gtxt("Видимость"))],[['css','width','100px'],['css','fontSize','12px']]),_td([this.toggle])]),
								_tr([_td([_t(_gtxt("Прозрачность"))],[['css','fontSize','12px']]), _td([this.slider])])])], [['css','margin','15px 0px 10px 0px']])
	
	_(this.workCanvas, [_div([_table([_tbody([_tr([_td([drawButton],[['css','paddingRight','15px']]),_td([reloadButton])])])]), table],[['css','padding','15px 0px 0px 20px']])]);
}

queryBinding.prototype.getImgWidth = function()
{
	return this.workArea.clientWidth;
}
queryBinding.prototype.getImgHeight = function()
{
	return this.workArea.clientHeight;
}
queryBinding.prototype.getImgPosition = function()
{
	return getOffsetRect(this.workArea);
}

queryBinding.prototype.showPictureDialog = function()
{
	if (this.imgDialog)
	{
		$(this.imgDialog).dialog('destroy');
		
		this.imgDialog.removeNode(true);
	}
	
	var canvas = _div([this.workArea]);
	
	showDialog(_gtxt("Привязка изображения"), canvas, 400, 400, 310, 35, null, function(){return true});
	
	this.imgDialog = canvas.parentNode;
}

queryBinding.prototype.reloadImg = function(id)
{
	var img = _img(null, [['attr','src',getAPIHostRoot() + 'imgSave.ashx?id=' + id]]),
		_this = this;
	
	img.onload = function()
	{
		img.style.width = img.width + 'px';
		img.style.height = img.height + 'px';
	}
	
	$(img).draggable(
	{
		cursor: 'crosshair',
		drag: function(ev,ui)
		{
			for (var i = 0; i < 4; i++)
			{
				var imgPoint = _this.imgPoints[i];
				
				var left = imgPoint.beginLeft + ui.position.left,
					top = imgPoint.beginTop + ui.position.top;
				
				imgPoint.style.left = left + 'px';
				imgPoint.style.top = top + 'px';
				
				if (top < 0 ||
					top > _this.getImgHeight() ||
					left < 0 ||
					left > _this.getImgWidth())
					imgPoint.style.display = 'none';
				else
					imgPoint.style.display = '';
			}
			
			_this.workArea.imgLeft = ui.position.left;
			_this.workArea.imgTop = ui.position.top;
		}
	});
	
	$(this.imgCanvas).replaceWith(img);
	
	this.imgCanvas = img;
	
	this.workArea.imgLeft = 0;
	this.workArea.imgTop = 0;
	
	delete this.tempStyle;
	
	for (var i = 0; i < 4; i++)
	{
		var imgPoint = this.imgPoints[i];
			
		imgPoint.style.left = '-500px';
		imgPoint.style.top = '-500px';
		
		imgPoint.beginLeft = -500;
		imgPoint.beginTop = -500;
		
		imgPoint.style.display = 'none';
	}
}

queryBinding.prototype.unload = function()
{
/*	if (this.parentImage)
		this.parentImage.setVisible(false);*/
	if (this.mapPoints && this.mapPoints[0])
		this.mapPoints[0].setVisible(false);
	if (this.mapPoints && this.mapPoints[1])
		this.mapPoints[1].setVisible(false);
	if (this.mapPoints && this.mapPoints[2])
		this.mapPoints[2].setVisible(false);
	
	if (this.imgDialog)
	{
		$(this.imgDialog).dialog("destroy")
			
		this.imgDialog.removeNode(true);
	}
}
queryBinding.prototype.reload = function()
{
/*	if (this.parentImage)
		this.parentImage.setVisible(true);*/
	if (this.mapPoints && this.mapPoints[0])
		this.mapPoints[0].setVisible(true);
	if (this.mapPoints && this.mapPoints[1])
		this.mapPoints[1].setVisible(true);
	if (this.mapPoints && this.mapPoints[2])
		this.mapPoints[2].setVisible(true);
}

queryBinding.prototype.getConformity = function(skipMessage)
{
	this.conf = false;
	
	for (var i = 0; i < 4; i++)
	{
		var imgPoint = this.imgPoints[i],
			conformity = {};
		
		if (imgPoint.beginLeft < 0 ||
			imgPoint.beginLeft > this.imgCanvas.clientWidth ||
			imgPoint.beginTop < 0 ||
			imgPoint.beginTop > this.imgCanvas.clientHeight)
		{
			if (typeof skipMessage != 'undefined' && !skipMessage)
				showErrorMessage(_gtxt("$$phrase$$_2", i + 1), true)
			
			return false;
		}
		
		conformity.x = imgPoint.beginLeft;
		conformity.y = imgPoint.beginTop;
		
		if (!this.mapPointsFlags[i])
		{
			if (typeof skipMessage != 'undefined' && !skipMessage)
				showErrorMessage(_gtxt("$$phrase$$_3", i + 1), true)
			
			return false;
		}
		
		conformity.lat = this.mapPoints[i].getGeometry().coordinates[0];
		conformity.lon = this.mapPoints[i].getGeometry().coordinates[1];
		
		if (!this.conf)
			this.conf = [];
		
		this.conf.push(conformity)
	}
	
	return true;
}

queryBinding.prototype.drawConformity = function()
{
	this.parentImage.setImage(this.imgCanvas.getAttribute('src'), 	this.conf[0].x, this.conf[0].y,
																	this.conf[1].x, this.conf[1].y,
																	this.conf[2].x, this.conf[2].y,
																	this.conf[3].x, this.conf[3].y,
																	this.conf[0].lat, this.conf[0].lon,
																	this.conf[1].lat, this.conf[1].lon,
																	this.conf[2].lat, this.conf[2].lon,
																	this.conf[3].lat, this.conf[3].lon)
	
	this.parentImage.setVisible(true);
	
	this.parentImage.setStyle({fill: {opacity: $(this.slider).slider('option', 'value')}});
	
	this.toggle.checked = true;
}

var _queryBinding = new queryBinding();

pointsBinding.pointsBinding.load = function()
{
	var alreadyLoaded = _queryBinding.createWorkCanvas(arguments[0], _queryBinding.unload);
	
	if (!alreadyLoaded)
		_queryBinding.load();
	else
		_queryBinding.reload();
}
pointsBinding.pointsBinding.unload = function()
{
	_queryBinding.unload();
}

