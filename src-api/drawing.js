//Управление drawFunctions
(function()
{
	var outlineColor = 0x0000ff;
	var fillColor = 0xffffff;
	var regularDrawingStyle = {
		marker: { size: 3 },
		outline: { color: outlineColor, thickness: 3, opacity: 80 },
		fill: { color: fillColor }
	};
	var hoveredDrawingStyle = { 
		marker: { size: 4 },
		outline: { color: outlineColor, thickness: 4 },
		fill: { color: fillColor }
	};

	var getStyle = function(removeDefaults, mObj){
		var out = mObj.getStyle( removeDefaults );
		if(out && !removeDefaults) {
			if(!out.regular) out.regular = regularDrawingStyle;
			if(!out.hovered) out.hovered = hoveredDrawingStyle;
		}
		return out;
	};
	
	var objects = {};
	var drawFunctions = {};

	var createDOMObject = function(ret, properties)
	{
		var myId = gmxAPI.newFlashMapId();
		var myContents;
		var callHandler = function(eventName)
		{
			var handlers = gmxAPI.map.drawing.handlers[eventName] || [];
			for (var i = 0; i < handlers.length; i++)
				handlers[i](objects[myId]);
		}
		var addHandlerCalled = false;
		objects[myId] = {
			properties: properties || {},
			setText: ret.setText,
			setVisible: function(flag)
			{
				ret.setVisible(flag);
				this.properties.isVisible = flag;
			},
			update: function(geometry, text)
			{
				//this.properties = { text: text, isVisible: ret.isVisible };
				this.properties.text = text;
				this.properties.isVisible = ret.isVisible;
				this.geometry = geometry;
				this.balloon = ret.balloon;
				callHandler(addHandlerCalled ? "onEdit" : "onAdd");
				addHandlerCalled = true;
			},
			remove: function() { ret.remove(); },
			removeInternal: function()
			{
				callHandler("onRemove");
				delete objects[myId];
			},
			triggerInternal: function( callbackName ){ callHandler(callbackName); },
			getGeometry: function() { return this.geometry; },
			getLength: function() { return gmxAPI.geoLength(this.geometry); },
			getArea: function() { return gmxAPI.geoArea(this.geometry); },
			getCenter: function() { return gmxAPI.geoCenter(this.geometry); },
			setStyle: function(regularStyle, hoveredStyle) { ret.setStyle(regularStyle, hoveredStyle); },
			getVisibleStyle: function() { return ret.getVisibleStyle(); },
			getStyle: function(removeDefaults) { return ret.getStyle(removeDefaults); },
			stateListeners: {},
			addMapStateListener: function(eventName, func) { return gmxAPI._listeners.addMapStateListener(this, eventName, func); },
			removeMapStateListener: function(eventName, id)	{ return gmxAPI._listeners.removeMapStateListener(this, eventName, id); }
		}
		ret.domObj = objects[myId];
		return objects[myId];
	}


	drawFunctions.POINT = function(coords, props)
	{
		if (!props)
			props = {};

		var toolsContainer = gmxAPI._tools['standart'];
		var text = props.text;
		if (!text)
			text = "";
		var x, y;
		var obj = false;
		var balloon = false;
		var domObj;
		var isDrawing = true;
		var ret = {};
		toolsContainer.currentlyDrawnObject = ret;

		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.stopDrawing = function()
		{
			if (!isDrawing)
				return;
			isDrawing = false;
			if (!coords)
			{
				gmxAPI.map.unfreeze();
				gmxAPI._sunscreen.setVisible(false);
				gmxAPI._setToolHandler("onClick", null);
				gmxAPI._setToolHandler("onMouseDown", null);
				gmxAPI.map.clearCursor();
			}
		}

		ret.remove = function()
		{
			if (isDrawing)
				toolsContainer.selectTool("move");
			if (obj)
			{
				gmxAPI._listeners.dispatchEvent('onRemove', gmxAPI.map.drawing, domObj);
				gmxAPI._listeners.dispatchEvent('onRemove', domObj, domObj);
				obj.remove();
				if(balloon) balloon.remove();
				domObj.removeInternal();
			}
		}

		ret.setStyle = function(regularStyle, hoveredStyle) {}

		var done = function(xx, yy)
		{
			obj = gmxAPI.map.addObject();
			balloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.addBalloon(true) : null);	// Редактируемый балун (только скрывать)

			var updateDOM = function()
			{
				xx = gmxAPI.chkPointCenterX(xx);
				domObj.update({ type: "POINT", coordinates: [xx, yy] }, text);
			}

			ret.setText = function(newText)
			{
				if(!balloon) return;
				text = newText;
				input.value = newText;
				updateText();
			}

			ret.setVisible = function(flag)
			{
				ret.isVisible = flag;
				obj.setVisible(ret.isVisible);
				if(balloon) balloon.setVisible(ret.isVisible && balloonVisible);
			}
			ret.balloon = balloon;
			ret.getVisibleStyle = function() { return obj.getVisibleStyle(); };
			ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, obj); };

			var position = function(x, y)
			{
				xx = x;
				yy = y;
				gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': isDragged} });
				obj.setPoint(xx, yy);
				if(balloon) balloon.setPoint(xx, yy, isDragged);
				updateDOM();
			}
			var apiBase = gmxAPI.getAPIFolderRoot();

			obj.setStyle(
				{ 
					marker: { image: apiBase + "img/flag_blau1.png", dx: -6, dy: -36 },
					label: { size: 12, color: 0xffffc0 }
				},
				{ 
					marker: { image: apiBase + "img/flag_blau1_a.png", dx: -6, dy: -36 },
					label: { size: 12, color: 0xffffc0 }
				}
			);
			var clickTimeout = false;
			obj.setHandler("onClick", function()
			{
				if (clickTimeout)
				{
					clearTimeout(clickTimeout);
					clickTimeout = false;
					ret.remove();
				}
				else
				{
					clickTimeout = setTimeout(function() { clickTimeout = false; }, 500);
					if(balloon) {
						balloonVisible = !balloon.isVisible;
						balloon.setVisible(balloonVisible);
						if (balloonVisible)
							setHTMLVisible(true);
						else
						{
							gmxAPI.hide(input);
							gmxAPI.hide(htmlDiv);
						}
					}
				}
			});
			var startDx, startDy, isDragged = false;
			var dragCallback = function(x, y)
			{
				position(x + startDx, y + startDy);
				gmxAPI._listeners.dispatchEvent('onEdit', domObj, domObj);
				gmxAPI._listeners.dispatchEvent('onEdit', gmxAPI.map.drawing, domObj);
			}
			var downCallback = function(x, y)
			{
				x = gmxAPI.chkPointCenterX(x);
				startDx = xx - x;
				startDy = yy - y;
				isDragged = true;
				gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': isDragged} });
			};
			var upCallback = function()
			{
				isDragged = false;
				gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': isDragged} });
				if(balloon) balloon.setPoint(xx, yy, isDragged);
				obj.setPoint(xx, yy);
			}
			obj.enableDragging(dragCallback, downCallback, upCallback);

			if(balloon) {	// Это все касается балуна для маркера
				var htmlDiv = document.createElement("div");
				htmlDiv.onclick = function(event)
				{
					event = event || window.event;
					var e = gmxAPI.compatTarget(event);
					if (e == htmlDiv)
					{
						setHTMLVisible(false);
						input.focus();
					}
				}
				balloon.div.appendChild(htmlDiv);
				var input = document.createElement("textarea");
				input.style.backgroundColor = "transparent";
				input.style.border = 0;
				input.style.overflow = "hidden";
				var fontSize = 16;
				input.style.fontSize = fontSize + 'px';
				input.setAttribute("wrap", "off");
				input.value = text ? text : "";
				var updateText = function() 
				{ 
					var newText = input.value;
					var rows = 1;
					for (var i = 0; i < newText.length; i++)
						if (newText.charAt(i) == '\n'.charAt(0))
							rows += 1;
					input.rows = rows;
					var lines = newText.split("\n");
					var cols = 2;
					for (var i in lines)
						cols = Math.max(cols, lines[i].length + 3);
					input.cols = cols;
					input.style.width = cols * (fontSize - (gmxAPI.isIE ? 5: 6));
					text = newText;
					if(balloon) balloon.resize();
					updateDOM();
				};
				input.onkeyup = updateText;
				input.onblur = function()
				{
					setHTMLVisible(true);
				}
				input.onmousedown = function(e)
				{
					if (!e)
						e = window.event;
					if (e.stopPropagation)
						e.stopPropagation();
					else
						e.cancelBubble = true;
				}
				if(balloon) balloon.div.appendChild(input);

				var setHTMLVisible = function(flag)
				{
					gmxAPI.setVisible(input, !flag);
					gmxAPI.setVisible(htmlDiv, flag);
					if (flag)
						htmlDiv.innerHTML = (gmxAPI.strip(input.value) == "") ? "&nbsp;" : input.value;
					if(balloon) balloon.resize();
				}

				var balloonVisible = (text && (text != "")) ? true : false;
				setHTMLVisible(balloonVisible);

				balloon.outerDiv.onmousedown = function(event)
				{
					gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': true} });
					var currPosition = gmxAPI.map.getPosition();
					var mapX = currPosition['x'];
					var mapY = currPosition['y'];
					var z = currPosition['z'];
					scale = gmxAPI.getScale(z);
					var x = gmxAPI.from_merc_x(mapX + (gmxAPI.eventX(event) - gmxAPI.getOffsetLeft(gmxAPI._div) - gmxAPI._div.clientWidth/2)*scale);
					var y = gmxAPI.from_merc_y(mapY - (gmxAPI.eventY(event) - gmxAPI.getOffsetTop(gmxAPI._div) - gmxAPI._div.clientHeight/2)*scale);
					downCallback(x, y);
					gmxAPI._startDrag(obj, dragCallback, upCallback);
					return false;
				}
				balloon.outerDiv.onmouseup = function(event)
				{
					gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': false} });
					gmxAPI._stopDrag();
					upCallback();
				}
				balloon.outerDiv.onmousemove = function(event)
				{
					if (isDragged)
					{
						var currPosition = gmxAPI.map.getPosition();
						var mapX = currPosition['x'];
						var mapY = currPosition['y'];
						var z = currPosition['z'];
						scale = gmxAPI.getScale(z);
						var x = startDx + gmxAPI.from_merc_x(mapX + (gmxAPI.eventX(event) - gmxAPI.getOffsetLeft(gmxAPI._div) - gmxAPI._div.clientWidth/2)*scale);
						var y = startDy + gmxAPI.from_merc_y(mapY - (gmxAPI.eventY(event) - gmxAPI.getOffsetTop(gmxAPI._div) - gmxAPI._div.clientHeight/2)*scale);
						position(x, y);
						gmxAPI.deselect();
						return false;
					}
				}
			}

			domObj = createDOMObject(ret);
			position(xx, yy);
			if(balloon) {
				balloon.setVisible(balloonVisible);
				updateText();
			}
			gmxAPI._listeners.dispatchEvent('onAdd', gmxAPI.map.drawing, domObj);
			gmxAPI._listeners.dispatchEvent('onAdd', domObj, domObj);

			ret.setVisible(ret.isVisible);
		}

		if (!coords)
		{
			gmxAPI._sunscreen.bringToTop();
			gmxAPI._sunscreen.setVisible(true);
			var apiBase = gmxAPI.getAPIFolderRoot();
			gmxAPI.map.setCursor(apiBase + "img/flag_blau1.png", -6, -36);
			gmxAPI._setToolHandler("onClick", function() 
			{
				done(gmxAPI.map.getMouseX(), gmxAPI.map.getMouseY());
				toolsContainer.selectTool("move");
				if (gmxAPI.map.isKeyDown(16)) {
					toolsContainer.selectTool("POINT");
				}
			});
		}
		else
			done(coords[0], coords[1]);

		domObj.objectId = obj.objectId;
		return ret;
	}

	drawFunctions.LINESTRING = function(coords, props)
	{
		if (!props)
			props = {};

		var toolsContainer = gmxAPI._tools['standart'];
		var text = props.text;
		if (!text)
			text = "";

		var ret = {};
		var domObj = false;
		var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);

		var obj = gmxAPI.map.addObject();
		obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
		obj.setEditable(true);
		
		// Проверка пользовательских Listeners
		var chkEvent = function(eType, out)
		{
			if(gmxAPI.map.drawing.enabledHoverBalloon) {
				var st = (out ? out : false);
				propsBalloon.updatePropsBalloon(st);
			}
			gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, domObj);
			gmxAPI._listeners.dispatchEvent(eType, domObj, domObj);
		}
		
		obj.setHandlers({
			onEdit: function()
			{
				var eventName = 'onEdit';
				if (!domObj) {
					domObj = createDOMObject(ret, props);
					eventName = 'onAdd';
				}
				callOnChange();
				chkEvent(eventName, false);
			},
			onFinish: function()
			{
				callOnChange();
				gmxAPI._listeners.dispatchEvent('onFinish', gmxAPI.map.drawing, domObj);
				gmxAPI._listeners.dispatchEvent('onFinish', domObj, domObj);
				toolsContainer.selectTool("move");
			},
			onRemove: function()
			{
				ret.remove();
			},
			onNodeMouseOver: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				var out = '';
				var type = obj.getGeometryType();
				if (type == "LINESTRING") out = gmxAPI.prettifyDistance(obj.getIntermediateLength());
				else if (type == "POLYGON")	out = obj.getGeometrySummary();
				chkEvent('onNodeMouseOver', out);
			},
			onNodeMouseOut: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onNodeMouseOut', false);
			},
			onEdgeMouseOver: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onEdgeMouseOver', gmxAPI.prettifyDistance(obj.getCurrentEdgeLength()));
			},
			onEdgeMouseOut: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onEdgeMouseOut', false);
			}
		});

		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.setVisible = function(flag) 
		{ 
			obj.setVisible(flag);
			ret.isVisible = flag;
		}
		ret.setVisible(ret.isVisible);

		ret.remove = function()
		{
//					if (obj.isDrawing()) selectTool("move");
			obj.remove();
			if (domObj) {
				gmxAPI._listeners.dispatchEvent('onRemove', gmxAPI.map.drawing, domObj);
				gmxAPI._listeners.dispatchEvent('onRemove', domObj, domObj);
				domObj.removeInternal();
			}
		}

		ret.setText = function(newText)
		{
			text = newText;
			callOnChange();
		}

		ret.setStyle = function(regularStyle, hoveredStyle) 
		{
			obj.setStyle(regularStyle, hoveredStyle);
		}

		ret.getVisibleStyle = function() { return obj.getVisibleStyle(); };
		ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, obj); };

		var callOnChange = function()
		{
			var geom = obj.getGeometry();
			if(domObj) domObj.update(geom, text);
		}

		toolsContainer.currentlyDrawnObject = ret;

		ret.stopDrawing = function()
		{
			obj.stopDrawing();
		}

		if (coords)
		{
			domObj = createDOMObject(ret, props);
			obj.setGeometry({ type: "LINESTRING", coordinates: coords });
			callOnChange();
		}
		else
		{
			obj.startDrawing("LINESTRING");
		}

		domObj.objectId = obj.objectId;
		return ret;
	}


	drawFunctions.POLYGON = function(coords, props)
	{
		if (gmxAPI.isRectangle(coords))
			return drawFunctions.FRAME(coords, props);

		var toolsContainer = gmxAPI._tools['standart'];
		if (!props)
			props = {};

		var text = props.text;
		if (!text)
			text = "";

		var ret = {};
		var domObj = false;
		
		var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);
		var obj = gmxAPI.map.addObject();
		obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
		obj.setEditable(true);

		// Проверка пользовательских Listeners
		var chkEvent = function(eType, out)
		{
			if(gmxAPI.map.drawing.enabledHoverBalloon) {
				var st = (out ? out : false);
				propsBalloon.updatePropsBalloon(st);
			}
			gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, domObj);
			gmxAPI._listeners.dispatchEvent(eType, domObj, domObj);
		}

		obj.setHandlers({
			onEdit: function()
			{
				var eventName = 'onEdit';
				if (!domObj) {
					domObj = createDOMObject(ret, props);
					eventName = 'onAdd';
				}
				callOnChange();
				chkEvent(eventName, false);
			},
			onFinish: function()
			{
				gmxAPI._listeners.dispatchEvent('onFinish', gmxAPI.map.drawing, domObj);
				gmxAPI._listeners.dispatchEvent('onFinish', domObj, domObj);
				toolsContainer.selectTool("move");
			},
			onRemove: function()
			{
				ret.remove();
			},
			onNodeMouseOver: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onNodeMouseOver', obj.getGeometrySummary());
			},
			onNodeMouseOut: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onNodeMouseOut', false);
			},
			onEdgeMouseOver: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onEdgeMouseOver', gmxAPI.prettifyDistance(obj.getCurrentEdgeLength()));
			},
			onEdgeMouseOut: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onEdgeMouseOut', false);
			}
		});

		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.setVisible = function(flag) 
		{ 
			obj.setVisible(flag); 
			ret.isVisible = flag;
		}
		ret.setVisible(ret.isVisible);

		ret.remove = function()
		{
			//if (obj.isDrawing())	selectTool("move");
			obj.remove();
			if (domObj) {
				gmxAPI._listeners.dispatchEvent('onRemove', gmxAPI.map.drawing, domObj);
				gmxAPI._listeners.dispatchEvent('onRemove', domObj, domObj);
				domObj.removeInternal();
			}
		}

		ret.setText = function(newText)
		{
			text = newText;
			callOnChange();
		}

		ret.setStyle = function(regularStyle, hoveredStyle) 
		{
			obj.setStyle(regularStyle, hoveredStyle);
		}

		ret.getVisibleStyle = function() { return obj.getVisibleStyle(); };
		ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, obj); };

		var callOnChange = function()
		{
			var geom = obj.getGeometry();
			if(domObj) domObj.update(geom, text);
		}

		toolsContainer.currentlyDrawnObject = ret;

		ret.stopDrawing = function()
		{
			obj.stopDrawing();
		}

		if (coords)
		{
			for (var i = 0; i < coords.length; i++) {
				var lastNum = coords[i].length - 1; 
				if (coords[i][0][0] == coords[i][lastNum][0] && coords[i][0][1] == coords[i][lastNum][1]) {
					coords[i].pop();	// если последняя точка совпадает с первой удаляем ее
				}
			}

			domObj = createDOMObject(ret, props);
			obj.setGeometry({ type: "POLYGON", coordinates: coords });
			callOnChange();
		}
		else
		{
			obj.startDrawing("POLYGON");
		}

		domObj.objectId = obj.objectId;
		return ret;
	}
	drawFunctions.FRAME = function(coords, props)
	{
		if (!props)
			props = {};

		var toolsContainer = gmxAPI._tools['standart'];
		var text = props.text;
		if (!text)
			text = "";

		var ret = {};
		toolsContainer.currentlyDrawnObject = ret;
		var domObj;

		var obj = gmxAPI.map.addObject();
		gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'FRAME'} });

		var borders = obj.addObject();
		var corners = obj.addObject();
		var x1, y1, x2, y2;
		var isDraging = false;
		var eventType = '';

		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.setVisible = function(flag)
		{ 
			obj.setVisible(flag); 
			ret.isVisible = flag;
		}
		ret.setVisible(ret.isVisible);

		borders.setStyle(regularDrawingStyle, hoveredDrawingStyle);

		var x1Border = borders.addObject();
		var y1Border = borders.addObject();
		var x2Border = borders.addObject();
		var y2Border = borders.addObject();

		var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);
		var mouseUP = function()
		{
			isDraging = false;
			if(propsBalloon) propsBalloon.updatePropsBalloon(false);
			domObj.triggerInternal("onMouseUp");
			chkEvent(null);
		}

		corners.setStyle(regularDrawingStyle, hoveredDrawingStyle);

		var x1y1Corner = corners.addObject();
		var x1y2Corner = corners.addObject();
		var x2y1Corner = corners.addObject();
		var x2y2Corner = corners.addObject();

		// Проверка пользовательских Listeners
		var chkEvent = function()
		{
			gmxAPI._listeners.dispatchEvent(eventType, gmxAPI.map.drawing, domObj);
			gmxAPI._listeners.dispatchEvent(eventType, domObj, domObj);
		}

		function getGeometryTitleMerc(geom)
		{
			var geomType = geom['type'];
			if (geomType.indexOf("POINT") != -1)
			{
				var c = geom.coordinates;
				return "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Координаты:", "Coordinates:") + "</b> " + gmxAPI.formatCoordinates(gmxAPI.merc_x(c[0]), gmxAPI.merc_y(c[1]));
			}
			else if (geomType.indexOf("LINESTRING") != -1)
				return "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Длина:", "Length:") + "</b> " + gmxAPI.prettifyDistance(gmxAPI.geoLength(geom));
			else if (geomType.indexOf("POLYGON") != -1)
				return "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Площадь:", "Area:") + "</b> " + gmxAPI.prettifyArea(gmxAPI.geoArea(geom));
			else
				return "?";
		}

		// Высвечивание балуна в зависимости от типа geometry
		var chkBalloon = function(tp)
		{
			if(!isDraging && propsBalloon) {
				var geom = { type: "POLYGON", coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] };
				if(gmxAPI.map.drawing.enabledHoverBalloon) {
						switch(tp) {
							case 'x1b':
								geom = { type: "LINESTRING", coordinates: [[[x1, y1], [x1, y2]]] };
								break;
							case 'x2b':
								geom = { type: "LINESTRING", coordinates: [[[x2, y1], [x2, y2]]] };
								break;
							case 'y1b':
								geom = { type: "LINESTRING", coordinates: [[[x1, y1], [x2, y1]]] };
								break;
							case 'y2b':
								geom = { type: "LINESTRING", coordinates: [[[x1, y2], [x2, y2]]] };
								break;
						}
					propsBalloon.updatePropsBalloon(getGeometryTitleMerc(geom));
				}
			}
			chkEvent();
		}

		var repaint = function(flag)
		{
			x1Border.setLine([[x1, y1], [x1, y2]]);
			y1Border.setLine([[x1, y1], [x2, y1]]);
			x2Border.setLine([[x2, y1], [x2, y2]]);
			y2Border.setLine([[x1, y2], [x2, y2]]);

			x1y1Corner.setPoint(x1, y1);
			x1y2Corner.setPoint(x1, y2);
			x2y1Corner.setPoint(x2, y1);
			x2y2Corner.setPoint(x2, y2);

			var geom = { type: "POLYGON", coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] };
			domObj.update(geom, text);
		}
		x1Border.setHandlers({
			onMouseOver: function() { eventType = 'onEdgeMouseOver'; chkBalloon('x1b') },
			onMouseOut: function() { eventType = 'onEdgeMouseOut'; if(!isDraging) mouseUP(); }
		});
		x2Border.setHandlers({
			onMouseOver: function() { eventType = 'onEdgeMouseOver'; chkBalloon('x2b') },
			onMouseOut: function() { eventType = 'onEdgeMouseOut'; if(!isDraging) mouseUP(); }
		});
		y1Border.setHandlers({
			onMouseOver: function() { eventType = 'onEdgeMouseOver'; chkBalloon('y1b') },
			onMouseOut: function() { eventType = 'onEdgeMouseOut'; if(!isDraging) mouseUP(); }
		});
		y2Border.setHandlers({
			onMouseOver: function() { eventType = 'onEdgeMouseOver'; chkBalloon('y2b') },
			onMouseOut: function() { eventType = 'onEdgeMouseOut'; if(!isDraging) mouseUP(); }
		});

		var objHandlerCorner = {
			onMouseOver: function() { eventType = 'onNodeMouseOver'; chkBalloon() },
			onMouseOut: function() { eventType = 'onNodeMouseOut'; if(!isDraging) mouseUP(); }
		};
		x1y1Corner.setHandlers(objHandlerCorner);
		x1y2Corner.setHandlers(objHandlerCorner);
		x2y1Corner.setHandlers(objHandlerCorner);
		x2y2Corner.setHandlers(objHandlerCorner);

		var dragMe = function(tp)
		{
			isDraging = true;
			chkBalloon(tp)
			repaint();
			eventType = 'onEdit';
			chkEvent(null);
			if(propsBalloon && gmxAPI.map.drawing.enabledHoverBalloon) propsBalloon.updatePropsBalloon(false);
		}
		x1Border.enableDragging(function(x, y) { x1 = x; dragMe('x1b'); }, null, mouseUP);
		y1Border.enableDragging(function(x, y) { y1 = y; dragMe('y1b'); }, null, mouseUP);
		x2Border.enableDragging(function(x, y) { x2 = x; dragMe('x2b'); }, null, mouseUP);
		y2Border.enableDragging(function(x, y) { y2 = y; dragMe('y2b'); }, null, mouseUP);

		x1y1Corner.enableDragging(function(x, y) { x1 = x; y1 = y; dragMe(); }, null, mouseUP);
		x1y2Corner.enableDragging(function(x, y) { x1 = x; y2 = y; dragMe(); }, null, mouseUP);
		x2y1Corner.enableDragging(function(x, y) { x2 = x; y1 = y; dragMe(); }, null, mouseUP);
		x2y2Corner.enableDragging(function(x, y) { x2 = x; y2 = y; dragMe(); }, null, mouseUP);

		var created = false;

		ret.remove = function()
		{
			eventType = 'onRemove';
			chkEvent(null);
			obj.remove();
			domObj.removeInternal();
		}

		ret.setStyle = function(regularStyle, hoveredStyle) 
		{
			borders.setStyle(regularStyle, hoveredStyle);
			corners.setStyle(regularStyle, hoveredStyle);
		}

		ret.getVisibleStyle = function(){
			return borders.getVisibleStyle();
		};
		ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, borders); };

		ret.stopDrawing = function()
		{
			gmxAPI.map.unfreeze();
			gmxAPI._sunscreen.setVisible(false);
			gmxAPI._setToolHandler("onMouseDown", null);
		}

		ret.setText = function(newText)
		{
			text = newText;
			repaint();
		}

		if (coords)
		{
			x1 = coords[0][0][0];
			y1 = coords[0][0][1];
			x2 = coords[0][2][0];
			y2 = coords[0][2][1];
			domObj = createDOMObject(ret, props);
			repaint();
			eventType = 'onAdd';
			chkEvent(null);
		}
		else
		{
			gmxAPI._sunscreen.bringToTop();
			gmxAPI._sunscreen.setVisible(true);
			gmxAPI.map.enableDragging(
				function(x, y)
				{
					isDraging = true;
					x2 = x;
					y2 = y;
					eventType = 'onEdit';
					if (!created) {
						domObj = createDOMObject(ret, props);
						eventType = 'onAdd';
					}
					chkEvent(null);
					created = true;
					repaint();
				},
				function(x, y)
				{
					x1 = x;
					y1 = y;
				},
				function()
				{
					isDraging = false;
					if(propsBalloon) propsBalloon.updatePropsBalloon(false);
					gmxAPI._setToolHandler("onMouseDown", null);
					toolsContainer.selectTool("move");
					if(domObj) domObj.triggerInternal("onMouseUp");
					eventType = 'onFinish';
					chkEvent(null);
				}
			);
		}

		domObj.objectId = obj.objectId;
		return ret;
	}

	drawFunctions.zoom = function()
	{
		var x1, y1, x2, y2;
		var rect;
		var toolsContainer = gmxAPI._tools['standart'];
		var ret = {
			stopDrawing: function()
			{
				gmxAPI._setToolHandler("onMouseDown", null);
			}
		}
		gmxAPI.map.enableDragging(
			function(x, y)
			{
				x2 = x;
				y2 = y;
				rect.setRectangle(x1, y1, x2, y2);
			},
			function(x, y)
			{
				x1 = x;
				y1 = y;
				rect = gmxAPI.map.addObject();
				rect.setStyle({ outline: { color: 0xa0a0a0, thickness: 1, opacity: 70 } });
			},
			function()
			{
				var d = 10*gmxAPI.getScale(gmxAPI.map.getZ());
				if (!x1 || !x2 || !y1 || !y2 || ((Math.abs(gmxAPI.merc_x(x1) - gmxAPI.merc_x(x2)) < d) && (Math.abs(gmxAPI.merc_y(y1) - gmxAPI.merc_y(y2)) < d)))
					gmxAPI.map.zoomBy(1, true);
				else
					gmxAPI.map.slideToExtent(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
				rect.remove();
				toolsContainer.selectTool("move");
			}
		);
		return ret;
	}
	drawFunctions["move"] = function()
	{
	}


	var drawing = {
		handlers: { onAdd: [], onEdit: [], onRemove: [] },
		mouseState: 'up',
		stateListeners: {},
		enabledHoverBalloon: true,
		enableHoverBalloon: function()
			{
				this.enabledHoverBalloon = true;
			}
		,
		disableHoverBalloon: function()
			{
				this.enabledHoverBalloon = false;
			}
		,				
		//props опционально
		addObject: function(geom, props)
		{
			if (geom.type.indexOf("MULTI") != -1)
			{
				for (var i = 0; i < geom.coordinates.length; i++)
					this.addObject(
						{ 
							type: geom.type.replace("MULTI", ""),
							coordinates: geom.coordinates[i]
						},
						props
					);
			}
			else
			{
				var o = drawFunctions[geom.type](geom.coordinates, props);
				gmxAPI._tools['standart'].selectTool("move");
				return o.domObj;
			}
		},
		
		//поддерживаются events: onAdd, onRemove, onEdit
		//onRemove вызывается непосредственно ПЕРЕД удалением объекта
		//для FRAME поддерживается event onMouseUp - завершение изменения формы рамки
		setHandler: function(eventName, callback)
		{
			if (!(eventName in this.handlers)) 
				this.handlers[eventName] = [];
				
			this.handlers[eventName].push(callback);
		},
		setHandlers: function(handlers)
		{
			for (var eventName in handlers)
				this.setHandler(eventName, handlers[eventName]);
		},
		forEachObject: function(callback)
		{
			for (var id in objects)
				callback(objects[id]);
		},
		tools: { 
			setVisible: function(flag) 
			{ 
				gmxAPI.map.toolsAll.standartTools.setVisible(flag);
			}
		},
		addTool: function(tn, hint, regularImageUrl, activeImageUrl, onClick, onCancel)
		{
			return gmxAPI.map.toolsAll.standartTools.addTool(tn, {
					'key': tn,
					'regularImageUrl': regularImageUrl,
					'activeImageUrl': activeImageUrl,
					'onClick': onClick,
					'onCancel': onCancel,
					'hint': hint
				});
		}, 
		selectTool: function(toolName)
		{
			gmxAPI._tools['standart'].selectTool(toolName);
		}
	}
	
	//расширяем namespace
    gmxAPI._drawFunctions = drawFunctions;
    gmxAPI._drawing = drawing;

})();
