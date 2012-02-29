//Поддержка zoomControl
(function()
{

	var addZoomControl = function(cont)
	{
		var apiBase = gmxAPI.getAPIFolderRoot();
		var zoomParent = gmxAPI.newStyledDiv({
			position: "absolute",
			left: "40px",
			top: "5px"
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
		var zoomObj = false;
		for (var i = 0; i < 20; i++)
		{
			addZoomItem(i);
		}

		var minZoom, maxZoom;
		gmxAPI.map.zoomControl = {
			isVisible: true,
			isMinimized: false,
			setVisible: function(flag)
			{
				gmxAPI.setVisible(zoomParent, flag);
				this.isVisible = flag;
				if('_timeBarPosition' in gmxAPI) gmxAPI._timeBarPosition();
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

		gmxAPI.map.setMinMaxZoom = function(z1, z2) {
			minZoom = z1;
			maxZoom = z2;
			gmxAPI.map.zoomControl.repaint();
			return gmxAPI._cmdProxy('setMinMaxZoom', {'attr':{'z1':z1, 'z2':z2} });
		}
		gmxAPI.map.setMinMaxZoom(1, 17);

		// Добавление прослушивателей событий
		gmxAPI._listeners.addListener(gmxAPI.map, 'positionChanged', function(ph)
			{
				var z = ph.currZ;
				var newZoomObj = zoomArr[Math.round(z) - minZoom];
				if (newZoomObj != zoomObj)
				{
					if (zoomObj)
						zoomObj.src = apiBase + "img/zoom_raw.png";
					zoomObj = newZoomObj;
					zoomObj.src = apiBase + "img/zoom_active.png";
				}
			}
		);
	}

	gmxAPI._addZoomControl = addZoomControl;

})();


//Поддержка timeBar
(function()
{
	var timeBarInit = function(cont)
	{
		var apiBase = gmxAPI.getAPIFolderRoot();
		var map = gmxAPI.map;

		var timeBarWidth = 100;
		var leftMarkX = 0;
		var rightMarkX = timeBarWidth;

		var timeBarParent = gmxAPI.newStyledDiv({
			position: "absolute",
			top: "5px",
			display: "none"
		});
		cont.appendChild(timeBarParent);
		var timeBarPlaque = gmxAPI.newStyledDiv({
			backgroundColor: "#016a8a",
			opacity: 0.5,
			position: "absolute",
			left: 0,
			top: 0,
			height: "32px"
		});
		timeBarParent.appendChild(timeBarPlaque);
		var timeBar = gmxAPI.newStyledDiv({
			position: "absolute",
			height: "4px",
			border: "1px solid white",
			backgroundColor: "#387eaa",
			top: "13px",
			left: "13px"
		});
		timeBarParent.appendChild(timeBar);

		timeBar.style.width = timeBarWidth + 12 + "px";
		timeBarPlaque.style.width = timeBarWidth + 40 + "px";

		var minTime, maxTime;
		var tickMarks = [];
		var timeBarMinYear = 2050;
		window.updateTimeBarMinYear = function(year)
		{
			if (year >= timeBarMinYear)
				return;
			timeBarMinYear = year;
			minTime = new Date(year, 6, 1).getTime();
			maxTime = new Date().getTime();

			for (var i = 0; i < tickMarks.length; i++)
				timeBar.removeChild(tickMarks[i]);
			tickMarks = [];

			var curTime = new Date(year, 1, 1).getTime();
			while (curTime < maxTime)
			{
				var tickMark = gmxAPI.newStyledDiv({
					position: "absolute",
					height: "4px",
					top: 0,
					width: 0,
					borderLeft: "1px solid #b0b0b0",
					left: 6 + Math.round(timeBarWidth*(curTime - minTime)/(maxTime - minTime)) + "px"
				});
				tickMarks.push(tickMark);
				timeBar.appendChild(tickMark);
				var curDate = new Date(curTime);
				curTime = new Date(curDate.getFullYear(), curDate.getMonth() + 1, curDate.getDate()).getTime();
			}
			updateTimeBar();
		}

		var mouseInMark = false;
		var leftMark = gmxAPI.newElement(
			"img",
			{
				src: apiBase + "img/sliderIcon.png",
				onmousedown: function(event)
				{
					return startDraggingMark(event, false);
				},
				onmouseover: function()
				{
					this.src = apiBase + "img/sliderIcon_a.png";
					repaintDateTooltip(false);
					mouseInMark = true;
				},
				onmouseout: function()
				{
					this.src = apiBase + "img/sliderIcon.png";
					gmxAPI.hide(dateTooltip);
					mouseInMark = false;
				}
			},
			{
				display: "block",
				position: "absolute",
				top: "-5px",
				width: "12px",
				height: "14px",
				cursor: "pointer",
				marginLeft: "-6px"
			}
		);
		timeBar.appendChild(leftMark);

		var rightMark = gmxAPI.newElement(
			"img",
			{
				src: apiBase + "img/sliderIcon.png",
				onmousedown: function(event)
				{
					return startDraggingMark(event, true);
				},
				onmouseover: function()
				{
					this.src = apiBase + "img/sliderIcon_a.png";
					repaintDateTooltip(true);
					mouseInMark = true;
				},
				onmouseout: function()
				{
					this.src = apiBase + "img/sliderIcon.png";
					gmxAPI.hide(dateTooltip);
					mouseInMark = false;
				}
			},
			{
				display: "block",
				position: "absolute",
				top: "-5px",
				width: "12px",
				height: "14px",
				cursor: "pointer",
				marginLeft: "6px"
			}
		);
		timeBar.appendChild(rightMark);

		var getDateByX = function(x)
		{
			return new Date(minTime + (x/timeBarWidth)*(maxTime - minTime));
		}

		var getDateString = function(date)
		{
			return date.getFullYear() + "-" + gmxAPI.pad2(date.getMonth() + 1) + "-" + gmxAPI.pad2(date.getDate());
		}

		var getDatePretty = function(date)
		{
			return date.getDate() + " " + ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"][date.getMonth()] + " " + date.getFullYear();
		}

		var filterUpdateTimeout = false;

		var updateTimeBar = function()
		{
			if (!map.timeBar.isVisible)
				return;
			leftMark.style.left = leftMarkX + "px";
			rightMark.style.left = rightMarkX + "px";
			var leftDate = getDateByX(leftMarkX);
			var rightDate = getDateByX(rightMarkX);
			var leftDateString = getDateString(leftDate);
			var rightDateString = getDateString(rightDate);
			if (filterUpdateTimeout)
				clearTimeout(filterUpdateTimeout);
			filterUpdateTimeout = setTimeout(function()
			{
				for (var i = 0; i < map.layers.length; i++)
				{
					var layer = map.layers[i];
					if ((layer.isVisible || layer.hiddenByTimeBar) && (layer.properties.type == "Vector") && (layer.properties.description.toLowerCase() == "спутниковое покрытие"))
					{
						var attrs = layer.properties.attributes;
						var hasDateAttribute = false;
						for (var j = 0; j < attrs.length; j++)
						{
							var attr = attrs[j];
							if (attr.toLowerCase() == "date")
							{
								hasDateAttribute = true;
								var filterString = "`" + attr + "` >= '" + leftDateString + "' AND `" + attr + "` <= '" + rightDateString + "'";
								var filters = layer.filters;
								for (var k = 0; k < filters.length; k++)
								{
									var lastFilter = layer.properties.styles[k].Filter;
									filters[k].setFilter((lastFilter && (lastFilter == "")) ? ("(" + lastFilter + ") AND" + filterString) : filterString);
								}
							}
						}
						if (!hasDateAttribute)
						{
							var date = layer.properties.date;
							if (date.length == 10)
							{
								var date2 = date.substring(6, 10) + "-" + date.substring(3, 5) + "-" + date.substring(0, 2);
								var dateInRange = ((date2 >= leftDateString) && (date2 <= rightDateString));
								if (layer.isVisible && !dateInRange)
								{
									//layer.hiddenByTimeBar = true;
									//layer.setVisible(false);
								}
								else if (!layer.isVisible && layer.hiddenByTimeBar && dateInRange)
								{
									layer.hiddenByTimeBar = false;
									layer.setVisible(true);
								}
							}
						}
					}
				}
				filterUpdateTimeout = false;
			}, 50);
		}

		var startDraggingMark = function(event, isRight)
		{
			var startMouseX = gmxAPI.eventX(event);
			var startX = isRight ? rightMarkX : leftMarkX;
			document.documentElement.onmousemove = function(event)
			{
				var newX = startX + (gmxAPI.eventX(event) - startMouseX);
				if (isRight)
					rightMarkX = Math.max(leftMarkX, Math.min(timeBarWidth, newX));
				else
					leftMarkX = Math.min(rightMarkX, Math.max(0, newX));
				repaintDateTooltip(isRight);
				updateTimeBar();
				return false;
			}
			document.documentElement.onmouseup = function(event)
			{
				document.documentElement.onmousemove = null;
				document.documentElement.onmouseup = null;
				if (event && event.stopPropagation)
					event.stopPropagation();
				if (!mouseInMark)
					gmxAPI.hide(dateTooltip);
				return false;
			}
			if (event && event.stopPropagation)
				event.stopPropagation();
			return false;
		}

		var dateTooltip = gmxAPI.newStyledDiv({
			position: "absolute",
			top: "30px",
			padding: "3px",
			fontSize: "11px",
			fontFamily: "sans-serif",
			border: "1px solid black",
			backgroundColor: "#ffffe0",
			whiteSpace: "nowrap",
			display: "none"
		});
		timeBar.appendChild(dateTooltip);

		var repaintDateTooltip = function(isRight)
		{
			gmxAPI.show(dateTooltip);
			var x = isRight ? rightMarkX : leftMarkX;
			dateTooltip.style.left = x + (isRight ? 10 : 0);
			dateTooltip.innerHTML = getDatePretty(getDateByX(x));
		}

		map.timeBar = {
			isVisible: false,
			setVisible: function(flag)
			{
				this.isVisible = flag;
				gmxAPI.setVisible(timeBarParent, flag);
				if (flag)
					updateTimeBar();
			}
		}
		window.updateTimeBarMinYear(2010);

		var positionTimeBar = function()
		{
			if('zoomControl' in map) {
				gmxAPI.position(
					timeBarParent, 
					40 + (map.zoomControl.isVisible ? (map.zoomControl.width + 3) : 0),
					5
				);
			}
		}
		positionTimeBar();
		gmxAPI._timeBarPosition = positionTimeBar;

	}

	gmxAPI._timeBarInit = timeBarInit;
})();
