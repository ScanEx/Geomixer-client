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
		
		var copyrightUpdateTimeout = false;
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

		map.updateCopyright = function()
		{
			if (!copyrightUpdateTimeout)
			{
				copyrightUpdateTimeout = setTimeout(function()
				{
					var currPosition = map.getPosition();
					var x = gmxAPI.from_merc_x(currPosition['x']);
					var y = gmxAPI.from_merc_y(currPosition['y']);
					var texts = {};
					for (var i = 0; i < copyrightedObjects.length; i++)
					{
						var obj = copyrightedObjects[i];
						if (obj.copyright && obj.objectId && obj.getVisibility())
						{
							if (obj.geometry)
							{
								var bounds = gmxAPI.getBounds(obj.geometry.coordinates);
								if ((x < bounds.minX) || (x > bounds.maxX) || (y < bounds.minY) || (y > bounds.maxY))
									continue;
							}
							texts[obj.copyright] = true;
						}
					}
					
					//первым всегда будет располагаться копирайт СканЭкс. 
					//Если реализовать возможность задавать порядок отображения копирайтов, можно тоже самое сделать более культурно...
					var text = "<a target='_blank' style='color: inherit;' href='http://maps.kosmosnimki.ru/Apikey/License.html'>&copy; 2007-2011 " + gmxAPI.KOSMOSNIMKI_LOCALIZED("&laquo;СканЭкс&raquo;", "RDC ScanEx") + "</a>";
					
					for (var key in texts)
					{
						if (text != "")
							text += " ";
						text += key.split("<a").join("<a target='_blank' style='color: inherit;'");
					}
					copyright.innerHTML = text;
					copyrightUpdateTimeout = false;
					if(copyrightAlign) {
						copyrightPosition();
					}
				}, 0);
			}
		}

		var copyrightUpdateTimeout2 = false;
		// Добавление прослушивателей событий
		gmxAPI.map.addListener('positionChanged', function(ph)
			{
				if (copyrightUpdateTimeout2)
					clearTimeout(copyrightUpdateTimeout2);
				copyrightUpdateTimeout2 = setTimeout(function()
				{
					map.updateCopyright();
					copyrightUpdateTimeout2 = false;
				}, 250);
			}
		);

		// End: Блок управления копирайтами
	}
	gmxAPI._addCopyrightControl = addCopyrightControl;
})();
