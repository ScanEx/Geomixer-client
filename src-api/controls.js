//Поддержка geomixerLink
(function()
{
	var addGeomixerLink = function(cont)
	{
		var apiBase = gmxAPI.getAPIFolderRoot();
		var geomixerLink = gmxAPI.newElement(
			"a",
			{
				href: "http://geomixer.ru",
				target: "_blank",
				className: "gmx_geomixerLink"
			},
			{
				position: "absolute",
				left: "8px",
				bottom: "8px"
			}
		);
		geomixerLink.appendChild(gmxAPI.newElement(
			"img",
			{
				src: apiBase + "img/geomixer_logo_api.png",
				title: gmxAPI.KOSMOSNIMKI_LOCALIZED("© 2007-2011 ИТЦ «СканЭкс»", "(c) 2007-2011 RDC ScanEx"),
				width: 130,
				height: 34
			},
			{
				border: 0
			}
		));
		cont.appendChild(geomixerLink);
		gmxAPI.map.setGeomixerLinkAlign = function(attr) {				// Изменить позицию ссылки на Geomixer
			var align = attr['align'];
			if(align === 'br') {			// Позиция br(BottomRight)
				gmxAPI.setPositionStyle(geomixerLink, { 'top': '', 'bottom': '8px', 'right': '8px', 'left': '' });
			} else if(align === 'bl') {		// Позиция bl(BottomLeft)
				gmxAPI.setPositionStyle(geomixerLink, { 'top': '', 'bottom': '8px', 'right': '', 'left': '8px' });
			} else if(align === 'tr') {		// Позиция tr(TopRight)
				gmxAPI.setPositionStyle(geomixerLink, { 'top': '8px', 'bottom': '', 'right': '8px', 'left': '' });
			} else if(align === 'tl') {		// Позиция tl(TopLeft)
				gmxAPI.setPositionStyle(geomixerLink, { 'top': '8px', 'bottom': '', 'right': '', 'left': '8px' });
			}
		}
		gmxAPI.map.geomixerLinkSetVisible = function(flag) {
			if(flag) {
				if(!geomixerLink.parentNode) cont.appendChild(geomixerLink);
			} else {
				if(geomixerLink.parentNode) cont.removeChild(geomixerLink);
			}
		}
	}
	gmxAPI._addGeomixerLink = addGeomixerLink;
})();

//Поддержка copyright
(function()
{
	var addCopyrightControl = function(cont)
	{
		var map = gmxAPI.map;
		// Begin: Блок управления копирайтами
		var copyrightAttr = {
			'x': '26px'					// отступ по горизонтали
			,'y': '7px'					// отступ по вертикали
		};
		var copyright = gmxAPI.newElement(
			"span",
			{
				className: "gmx_copyright"
			},
			{
				position: "absolute",
				right: copyrightAttr['x'],
				bottom: copyrightAttr['y']
			}
		);
		gmxAPI._setCopyrightColor = function(color)
		{
			copyright.style.fontSize = "11px";
			copyright.style.color = color;
		};

		var copyrightAlign = '';
		cont.appendChild(copyright);
		map.setCopyrightVisibility = function(flag) {
			if(flag) {
				if(!copyright.parentNode) cont.appendChild(copyright);
			}
			else cont.removeChild(copyright);
		}
		// Изменить позицию контейнера копирайтов
		map.setCopyrightAlign = function(attr) {
			if(attr['align']) {
				copyrightAlign = attr['align'];
			}
			copyrightPosition();
		}
		var copyrightedObjects = [];
		map.addCopyrightedObject = function(obj)
		{
			var exists = false;
			for (var i = 0; i < copyrightedObjects.length; i++)
				if (copyrightedObjects[i] == obj)
				{
					exists = true;
					break;
				}
				
			if (!exists)
			{
				copyrightedObjects.push(obj);
				map.updateCopyright();
			}
			
		}
		map.removeCopyrightedObject = function(obj)
		{
			var foundID = -1;
			for (var i = 0; i < copyrightedObjects.length; i++)
				if (copyrightedObjects[i] == obj)
				{
					foundID = i;
					break;
				}
				
			if ( foundID >= 0 )
			{
				copyrightedObjects.splice(foundID, 1);
				map.updateCopyright();
			}
				
			
		}
		
		var copyrightLastAlign = null;

		// Изменить координаты HTML элемента
		function copyrightPosition()
		{
			var center = (cont.clientWidth - copyright.clientWidth) / 2;
			if(copyrightLastAlign != copyrightAlign) {
				copyrightLastAlign = copyrightAlign;
				if(copyrightAlign === 'bc') {				// Позиция bc(BottomCenter)
					gmxAPI.setPositionStyle(copyright, { 'top': '', 'bottom': copyrightAttr['y'], 'right': '', 'left': center + 'px' });
				} else if(copyrightAlign === 'br') {		// Позиция br(BottomRight)
					gmxAPI.setPositionStyle(copyright, { 'top': '', 'bottom': copyrightAttr['y'], 'right': copyrightAttr['x'], 'left': '' });
				} else if(copyrightAlign === 'bl') {		// Позиция bl(BottomLeft)
					gmxAPI.setPositionStyle(copyright, { 'top': '', 'bottom': copyrightAttr['y'], 'right': '', 'left': copyrightAttr['x'] });
				} else if(copyrightAlign === 'tc') {		// Позиция tc(TopCenter)
					gmxAPI.setPositionStyle(copyright, { 'top': '0px', 'bottom': '', 'right': '', 'left': center + 'px' });
				} else if(copyrightAlign === 'tr') {		// Позиция tr(TopRight)
					gmxAPI.setPositionStyle(copyright, { 'top': '0px', 'bottom': '', 'right': copyrightAttr['x'], 'left': '' });
				} else if(copyrightAlign === 'tl') {		// Позиция tl(TopLeft)
					gmxAPI.setPositionStyle(copyright, { 'top': '0px', 'bottom': '', 'right': '', 'left': copyrightAttr['x'] });
				}
			}
		}

		var copyrightText = '';
		map.updateCopyright = function()
		{
			var currPos = gmxAPI.currPosition || map.getPosition();
			if(!currPos['latlng']) return;
			var x = currPos['latlng']['x'];
			var y = currPos['latlng']['y'];
			var texts = {};
			for (var i = 0; i < copyrightedObjects.length; i++)
			{
				var obj = copyrightedObjects[i];
				if (obj.copyright && obj.objectId && obj.getVisibility())
				{
					if (obj.geometry)
					{
						var bounds = obj.bounds || gmxAPI.getBounds(obj.geometry.coordinates);
						if ((x < bounds.minX) || (x > bounds.maxX) || (y < bounds.minY) || (y > bounds.maxY))
							continue;
					}
					texts[obj.copyright] = true;
				}
			}
			
			//первым всегда будет располагаться копирайт СканЭкс. 
			//Если реализовать возможность задавать порядок отображения копирайтов, можно тоже самое сделать более культурно...
			var text = "<a target='_blank' style='color: inherit;' href='http://maps.kosmosnimki.ru/Apikey/License.html'>&copy; 2007-2013 " + gmxAPI.KOSMOSNIMKI_LOCALIZED("&laquo;СканЭкс&raquo;", "RDC ScanEx") + "</a>";
			
			for (var key in texts)
			{
				if (text != "")
					text += " ";
				text += key.split("<a").join("<a target='_blank' style='color: inherit;'");
			}
			if(gmxAPI.proxyType == 'leaflet') text += " <a target='_blank' style='color: inherit;' href='http://leafletjs.com'>&copy; Leaflet</a>";

			if(copyrightText != text) {
				copyrightText = text;
				copyright.innerHTML = text;
				gmxAPI._listeners.dispatchEvent('copyrightRepainted', map, text);
			}
			if(copyrightAlign) {
				copyrightPosition();
			}
		}

		var copyrightUpdateTimeout = false;
		// Добавление прослушивателей событий
		var evName = (gmxAPI.proxyType === 'flash' ? 'positionChanged' : 'onMoveEnd');
		gmxAPI.map.addListener(evName, function()
			{
				if (copyrightUpdateTimeout) return;
				copyrightUpdateTimeout = setTimeout(function()
				{
					map.updateCopyright();
					clearTimeout(copyrightUpdateTimeout);
					copyrightUpdateTimeout = false;
				}, 250);
			}
		);

		// End: Блок управления копирайтами
	}
	gmxAPI._addCopyrightControl = addCopyrightControl;
})();
//Поддержка - отображения строки текущего положения карты
(function()
{
	var addLocationTitleDiv = function(cont)
	{
		/** Добавить строку текущего положения карты
		* @function
		* @param {cont} контейнер в DOM модели для отображения строки, где будет показываться текущее положение карты
		*/
		var apiBase = gmxAPI.getAPIFolderRoot();
		gmxAPI.map.setLocationTitleDiv = null;
		var locationTitleDiv = gmxAPI.newElement(
			"div",
			{
			},
			{
			}
		);
		cont.appendChild(locationTitleDiv);
		gmxAPI._locationTitleDiv = locationTitleDiv;

		var coordinatesAttr = {
			'x': '27px'						// отступ по горизонтали
			,'y': '25px'					// по вертикали
			,'x1': '5px'					// отступ по горизонтали иконки смены формата координат
			,'scaleBar': {
				'bottom': {
					'x': '27px'				// отступ по горизонтали для scaleBar
					,'y': '47px'			// по вертикали
				}
				,'top': {
					'x': '27px'				// отступ по горизонтали для scaleBar
					,'y': '3px'				// по вертикали
				}
			}
		};

		var scaleBar = gmxAPI.newStyledDiv({
			position: "absolute",
			pointerEvents: "none",
			right: coordinatesAttr['scaleBar']['bottom']['x'],
			bottom: coordinatesAttr['scaleBar']['bottom']['y'],
			textAlign: "center"
		});
		scaleBar.className = "gmx_scaleBar";
		cont.appendChild(scaleBar);
		
		gmxAPI.map.scaleBar = { setVisible: function(flag) { gmxAPI.setVisible(scaleBar, flag); } };
		var scaleBarText, scaleBarWidth;
		var repaintScaleBar = function()
		{
			if (scaleBarText)
			{
				gmxAPI.size(scaleBar, scaleBarWidth, 16);
				scaleBar.innerHTML = scaleBarText;
			}
		}
		var coordinates = gmxAPI.newElement(
			"div",
			{
				className: "gmx_coordinates",
				onclick: function()
				{
					if (coordFormat > 2) return; //выдаем окошко с координатами только для стандартных форматов.
					var oldText = getCoordinatesText();
					var text = window.prompt(gmxAPI.KOSMOSNIMKI_LOCALIZED("Текущие координаты центра карты:", "Current center coordinates:"), oldText);
					if (text && (text != oldText))
						gmxAPI.map.moveToCoordinates(text);
				}
			},
			{
				position: "absolute",
				right: coordinatesAttr['x'],
				bottom: coordinatesAttr['y'],
				cursor: "pointer"
			}
		);
		cont.appendChild(coordinates);

		var getCoordinatesText = function(currPos)
		{
			if(!currPos) currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
			var x = (currPos['latlng'] ? currPos['latlng']['x'] : gmxAPI.from_merc_x(currPos['x']));
			var y = (currPos['latlng'] ? currPos['latlng']['y'] : gmxAPI.from_merc_y(currPos['y']));
			if (x > 180) x -= 360;
			if (x < -180) x += 360;
			if (coordFormat%3 == 0)
				return gmxAPI.LatLon_formatCoordinates(x, y);
			else if (coordFormat%3 == 1)
				return gmxAPI.LatLon_formatCoordinates2(x, y);
			else
				return Math.round(gmxAPI.merc_x(x)) + ", " + Math.round(gmxAPI.merc_y(y));
		}

		var clearCoordinates = function()
		{
			for (var i = 0; i < coordinates.childNodes.length; i++)
				coordinates.removeChild(coordinates.childNodes[i]);
		}

		var coordFormatCallbacks = [		// методы формирования форматов координат
			function() { return getCoordinatesText(); },
			function() { return getCoordinatesText(); },
			function() { return getCoordinatesText(); }
		];

		var coordFormat = 0;
		var prevCoordinates = '';
		var setCoordinatesFormat = function(num, screenGeometry)
		{
			if(!num) num = coordFormat;
			if(num < 0) num = coordFormatCallbacks.length - 1;
			else if(num >= coordFormatCallbacks.length) num = 0;
			coordFormat = num;
			if(!screenGeometry) screenGeometry = gmxAPI.map.getScreenGeometry();
			var attr = {'screenGeometry': screenGeometry, 'properties': gmxAPI.map.properties };
			var res = coordFormatCallbacks[coordFormat](coordinates, attr);		// если есть res значит запомним ответ
			if(res && prevCoordinates != res) coordinates.innerHTML = res;
			prevCoordinates = res;
			gmxAPI._listeners.dispatchEvent('onSetCoordinatesFormat', gmxAPI.map, coordFormat);
		}

		var changeCoords = gmxAPI.newElement(
			"div", 
			{ 
				className: "gmx_changeCoords",
				title: gmxAPI.KOSMOSNIMKI_LOCALIZED("Сменить формат координат", "Toggle coordinates format"),
				onclick: function()
				{
					coordFormat += 1;
					setCoordinatesFormat(coordFormat);
				}
			},
			{
				position: "absolute",
				backgroundImage: 'url("'+apiBase + 'img/coord_reload.png")',
				width: '19px',
				height: '19px',
				right: coordinatesAttr['x1'],
				bottom: coordinatesAttr['y'],
				cursor: "pointer"
			}
		);
		cont.appendChild(changeCoords);

		gmxAPI.map.coordinates = {
			setVisible: function(flag) 
			{ 
				gmxAPI.setVisible(coordinates, flag); 
				gmxAPI.setVisible(changeCoords, flag); 
			}
			,
			addCoordinatesFormat: function(func) 
			{ 
				coordFormatCallbacks.push(func);
				return coordFormatCallbacks.length - 1;
			}
			,
			removeCoordinatesFormat: function(num) 
			{ 
				coordFormatCallbacks.splice(num, 1);
				return coordFormatCallbacks.length - 1;
			}
			,
			setFormat: setCoordinatesFormat
		}

		gmxAPI.map.setCoordinatesAlign = function(attr) {			// Изменить позицию контейнера координат
			var align = attr['align'];
			if(align === 'br') {		// Позиция br(BottomRight)
				gmxAPI.setPositionStyle(coordinates, { 'top': '', 'bottom': coordinatesAttr['y'], 'right': coordinatesAttr['x'], 'left': '' });
				gmxAPI.setPositionStyle(changeCoords, { 'top': '', 'bottom': coordinatesAttr['y'], 'right': coordinatesAttr['x1'], 'left': '' });
				gmxAPI.setPositionStyle(scaleBar, { 'top': '', 'bottom': coordinatesAttr['scaleBar']['bottom']['y'], 'right': coordinatesAttr['scaleBar']['bottom']['x'], 'left': '' });
			} else if(align === 'bl') {		// Позиция bl(BottomLeft)
				gmxAPI.setPositionStyle(coordinates, { 'top': '', 'bottom': coordinatesAttr['y'], 'right': '', 'left': coordinatesAttr['x'] });
				gmxAPI.setPositionStyle(changeCoords, { 'top': '', 'bottom': coordinatesAttr['y'], 'right': '', 'left': coordinatesAttr['x1'] });
				gmxAPI.setPositionStyle(scaleBar, { 'top': '', 'bottom': coordinatesAttr['scaleBar']['bottom']['y'], 'right': '', 'left': coordinatesAttr['scaleBar']['bottom']['x'] });
			} else if(align === 'tr') {		// Позиция tr(TopRight)
				gmxAPI.setPositionStyle(coordinates, { 'top': coordinatesAttr['y'], 'bottom': '', 'right': coordinatesAttr['x'], 'left': '' });
				gmxAPI.setPositionStyle(changeCoords, { 'top': coordinatesAttr['y'], 'bottom': '', 'right': coordinatesAttr['x1'], 'left': '' });
				gmxAPI.setPositionStyle(scaleBar, { 'top': coordinatesAttr['scaleBar']['top']['y'], 'bottom': '', 'right': coordinatesAttr['scaleBar']['top']['x'], 'left': '' });
			} else if(align === 'tl') {		// Позиция tl(TopLeft)
				gmxAPI.setPositionStyle(coordinates, { 'top': coordinatesAttr['y'], 'bottom': '', 'right': '', 'left': coordinatesAttr['x'] });
				gmxAPI.setPositionStyle(changeCoords, { 'top': coordinatesAttr['y'], 'bottom': '', 'right': '', 'left': coordinatesAttr['x1'] });
				gmxAPI.setPositionStyle(scaleBar, { 'top': coordinatesAttr['scaleBar']['top']['y'], 'bottom': '', 'right': '', 'left': coordinatesAttr['scaleBar']['top']['x'] });
			}
		}
		var getLocalScale = function(x, y)
		{
			return gmxAPI.distVincenty(x, y, gmxAPI.from_merc_x(gmxAPI.merc_x(x) + 40), gmxAPI.from_merc_y(gmxAPI.merc_y(y) + 30))/50;
		}

		// Добавление прослушивателей событий
		var checkPositionChanged = function() {
			var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
			var z = Math.round(currPos['z']);
			var x = (currPos['latlng'] ? currPos['latlng']['x'] : 0);
			var y = (currPos['latlng'] ? currPos['latlng']['y'] : 0);
			if(gmxAPI.map.needMove) {
				z = gmxAPI.map.needMove['z'];
				x = gmxAPI.map.needMove['x'];
				y = gmxAPI.map.needMove['y'];
			}

			var metersPerPixel = getLocalScale(x, y)*gmxAPI.getScale(z);
			for (var i = 0; i < 30; i++)
			{
				var distance = [1, 2, 5][i%3]*Math.pow(10, Math.floor(i/3));
				var w = Math.floor(distance/metersPerPixel);
				if (w > 100)
				{
					var name = gmxAPI.prettifyDistance(distance);
					if ((name != scaleBarText) || (w != scaleBarWidth))
					{
						scaleBarText = name;
						scaleBarWidth = w;
						repaintScaleBar();
					}
					break;
				}
			}
			//setCoordinatesFormat();
		}

		var setCoordinatesFormatTimeout = false;
		var prpPosition = function() {
			if (setCoordinatesFormatTimeout) return;
			setCoordinatesFormatTimeout = setTimeout(function()
			{
				clearTimeout(setCoordinatesFormatTimeout);
				setCoordinatesFormatTimeout = false;
				if(gmxAPI.proxyType === 'flash') checkPositionChanged();
				setCoordinatesFormat();
			}, 150);
		}

		gmxAPI.map.addListener('positionChanged', prpPosition);
		if(gmxAPI.proxyType === 'flash') {
			gmxAPI.map.addListener('onResizeMap', prpPosition);
		} else {
			gmxAPI.map.addListener('onMoveEnd', checkPositionChanged);
		}

		gmxAPI._setCoordinatesColor = function(color, url, flag)
		{
			coordinates.style.fontSize = "14px";
			coordinates.style.color = color;
			scaleBar.style.border = "1px solid " + color;
			scaleBar.style.fontSize = "11px";
			scaleBar.style.color = color;
			changeCoords.style.backgroundImage = 'url("'+url+'")';
			if(flag) {
				checkPositionChanged();
			}
		}

	}
	gmxAPI._addLocationTitleDiv = addLocationTitleDiv;
})();
//Поддержка zoomControl
(function()
{

	var addZoomControl = function(cont)
	{
		var apiBase = gmxAPI.getAPIFolderRoot();
		var zoomParent = gmxAPI.newStyledDiv({
			position: "absolute",
			left: "40px",
			top: "-35px"
		});
		cont.appendChild(zoomParent);
		var zoomPlaque = gmxAPI.newStyledDiv({
			backgroundColor: "#016a8a",
			opacity: 0.5,
			position: "absolute",
			left: 0,
			top: 0
		});
		zoomParent.appendChild(zoomPlaque);

		zoomParent.appendChild(gmxAPI.newElement(
			"img",
			{
				src: apiBase + "img/zoom_minus.png",
				onclick: function()
				{
					gmxAPI.map.zoomBy(-1);
				},
				onmouseover: function()
				{
					this.src = apiBase + "img/zoom_minus_a.png";
				},
				onmouseout: function()
				{
					this.src = apiBase + "img/zoom_minus.png"
				}
			},
			{
				position: "absolute",
				left: "5px",
				top: "7px",
				cursor: "pointer"
			}
		));
		var zoomPlus = gmxAPI.newElement(
			"img",
			{
				src: apiBase + "img/zoom_plus.png",
				onclick: function()
				{
					gmxAPI.map.zoomBy(1);
				},
				onmouseover: function()
				{
					this.src = apiBase + "img/zoom_plus_a.png";
				},
				onmouseout: function()
				{
					this.src = apiBase + "img/zoom_plus.png"
				}
			},
			{
				position: "absolute",
				cursor: "pointer"
			}
		)
		zoomParent.appendChild(zoomPlus);

		var addZoomItem = function(i)
		{
			var zoomObj_ = gmxAPI.newElement(
				"img",
				{
					src: apiBase + "img/zoom_raw.png",
					title: "" + (i + 1),
					onclick: function()
					{
						gmxAPI.map.zoomBy(i + minZoom - gmxAPI.map.getZ());
					},
					onmouseover: function()
					{
						this.src = apiBase + "img/zoom_active.png";
						this.title = "" + (i + minZoom);
					},
					onmouseout: function()
					{
						this.src = (this == zoomObj) ? (apiBase + "img/zoom_active.png") : (apiBase + "img/zoom_raw.png");
					}
				},
				{
					position: "absolute",
					left: (22 + 12*i) + "px",
					top: "12px",
					width: "12px",
					height: "8px",
					border: 0,
					cursor: "pointer"
				}
			);
			zoomParent.appendChild(zoomObj_);
			zoomArr.push(zoomObj_);
		};

		var zoomArr = [];
		var zoomObj = null;
		for (var i = 0; i < 20; i++)
		{
			addZoomItem(i);
		}

		var minZoom = 1, maxZoom;
		gmxAPI.map.zoomControl = {
			isVisible: true,
			isMinimized: false,
			setVisible: function(flag)
			{
				gmxAPI.setVisible(zoomParent, flag);
				this.isVisible = flag;
				if('_timeBarPosition' in gmxAPI) gmxAPI._timeBarPosition();
			},
			setZoom: function(z)
			{
				var newZoomObj = zoomArr[Math.round(z) - minZoom];
				if (newZoomObj != zoomObj)
				{
					if (zoomObj) zoomObj.src = apiBase + "img/zoom_raw.png";
					zoomObj = newZoomObj;
					if (zoomObj) zoomObj.src = apiBase + "img/zoom_active.png";
				}
			},
			repaint: function()
			{
				var dz = maxZoom - minZoom + 1;
				var gap = this.isMinimized ? 8 : 12*dz;
				gmxAPI.position(zoomPlus, 20 + gap, 7);
				gmxAPI.size(zoomPlaque, 43 + gap, 32);
				gmxAPI.map.zoomControl.width = 43 + gap;
				for (var i = 0; i < dz; i++) {
					if(i == zoomArr.length) addZoomItem(i);
					gmxAPI.setVisible(zoomArr[i], !this.isMinimized && (i < dz));
				}
				if(dz < zoomArr.length) for (var i = dz; i < zoomArr.length; i++) gmxAPI.setVisible(zoomArr[i], false);
				if('_timeBarPosition' in gmxAPI) gmxAPI._timeBarPosition();
			},
			setMinMaxZoom: function(z1, z2)
			{
				minZoom = z1;
				maxZoom = z2;
				this.repaint();
			},
			getMinZoom: function()
			{
				return minZoom;
			},
			getMaxZoom: function()
			{
				return maxZoom;
			},
			minimize: function()
			{
				this.isMinimized = true;
				this.repaint();
			},
			maximize: function()
			{
				this.isMinimized = false;
				this.repaint();
			}
		}
		var cz = (gmxAPI.map.needMove ? gmxAPI.map.needMove.z || 1 : 4);
		gmxAPI.map.zoomControl.setZoom(cz);
		// Добавление прослушивателей событий
		gmxAPI.map.addListener('positionChanged', function(ph)
			{
				gmxAPI.map.zoomControl.setZoom(ph.currZ);
			}
		);
	}
	gmxAPI._addZoomControl = addZoomControl;
})();
