//Управление drawFunctions
(function()
{
    "use strict";
	var outlineColor = 0x0000ff,
        fillColor = 0xffffff,
        currentDOMObject = null,    // текущий обьект рисования
        currentObjectID = null; // ID редактируемого обьекта

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
	//var multiObjects = {};
	var drawFunctions = {};

	var chkDrawingObjects = function() {
		for (var id in objects) {
			var cObj = objects[id];
			if(!cObj.geometry) cObj.remove();
		}
	};
	var endDrawing = function() {			// Вызывается при выходе из режима редактирования
		chkDrawingObjects();
		currentDOMObject = null;
        gmxAPI._drawing.type = '';
		gmxAPI._drawing.activeState = false;
	};

	var createDOMObject = function(ret, properties, propHiden)
	{
		var myId = gmxAPI.newFlashMapId();
		var myContents;
		var callHandler = function(eventName)
		{
			var handlers = gmxAPI.map.drawing.handlers[eventName] || [];
			for (var i = 0; i < handlers.length; i++)
				handlers[i](objects[myId]);

			//gmxAPI._listeners.dispatchEvent(eventName, gmxAPI.map.drawing, objects[myId]);
		}
		var addHandlerCalled = false;
		objects[myId] = {
			properties: properties || {},
			propHiden: propHiden || {},
			setText: ret.setText,
			setVisible: function(flag)
			{
				ret.setVisible(flag);
				this.properties.isVisible = flag;
			},
/*			updateCoordinates: function(coords)
			{
				if(coords.type) coords = coords.coordinates;	// Если это geometry берем только координаты
				if(!coords) return;				// Если нет coords ничего не делаем
				ret.updateCoordinates(coords);
			},
*/
			setGeometry: function(geo) {
                if('setGeometry' in ret) {
                    return ret.setGeometry(geo);
                }
                return false;
            },
			update: function(geometry, text)
			{
				if(!geometry) return;				// Если нет geometry ничего не делаем
				this.properties.text = text;
				this.properties.isVisible = ret.isVisible;
				this.geometry = geometry;
				this.balloon = ret.balloon;
				var evName = (addHandlerCalled ? "onEdit" : "onAdd");
				callHandler(evName);
                if(evName === 'onEdit') gmxAPI._listeners.dispatchEvent(evName, ret.domObj, ret.domObj);
				addHandlerCalled = true;
			},
			remove: function() {
                ret.remove();
            },
			removeInternal: function()
			{
                callHandler("onRemove");
				delete objects[myId];
                currentDOMObject = null;
			},
			chkZindex: function()
			{
				if('chkZindex' in ret) ret.chkZindex();
			},
			triggerInternal: function( callbackName ){ callHandler(callbackName); },
			getGeometry: function() { return gmxAPI.clone(this.geometry); },
			getLength: function() { return gmxAPI.geoLength(this.geometry); },
			getArea: function() { return gmxAPI.geoArea(this.geometry); },
			getCenter: function() { return gmxAPI.geoCenter(this.geometry); },
			setStyle: function(regularStyle, hoveredStyle) { ret.setStyle(regularStyle, hoveredStyle); },
			getVisibleStyle: function() { return ret.getVisibleStyle(); },
			getStyle: function(removeDefaults) { return ret.getStyle(removeDefaults); },
			stateListeners: {},
			addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); },
			removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
		}
		if('chkMouse' in ret) objects[myId].chkMouse = ret.chkMouse;
		if('getItemDownType' in ret) objects[myId].getItemDownType = ret.getItemDownType;
		if('itemMouseDown' in ret) objects[myId].itemMouseDown = ret.itemMouseDown;

		currentDOMObject = ret.domObj = objects[myId];
		return objects[myId];
	}

    //  Рисование через плагин gmxAPI._leaflet.LMap.gmxDrawing
    var getLatlngsFromGeometry = function(geom) {
        var geoJson = L.GeoJSON.geometryToLayer({
            geometry: geom,
            type: 'Feature'
            // ,
            // properties: {}
        });
        return geoJson._latlngs;
    }
    var checkLastPoint = function(geom) {
        var type = geom.type;
        if (type !== "Polyline") {
            var coords = geom.coordinates;
            for (var i = 0, len = coords.length; i < len; i++) {
                var arr = coords[i], len1 = arr.length - 1;
                if(len1 > 0) {
                    if(arr[0][0] !== arr[len1][0] || arr[0][1] !== arr[len1][1])
                        arr.push(arr[0]);
                }
            }
            if (type === "Polygon" || type === "Rectangle") {
                geom.type = "POLYGON";
            } else if (type === "Point") {
                geom.type = "POINT";
            }
        } else {
            geom.type = "LINESTRING";
        }
    }
    var domFeature = function(object, properties, propHiden) {
        var res = object.toGeoJSON(),
            domId = '_' + object._leaflet_id;

         if (objects[domId]) {
            var geoJSON = object.toGeoJSON();
            checkLastPoint(geoJSON.geometry);
            //objects[domId].geometry = geoJSON.geometry;
            res = objects[domId];
            res.geometry = res.domObj.geometry = geoJSON.geometry;
        } else {
            res.id = domId;
            //res.objectId = domId;
            res._object = object;

            var domObj = {
                objectId: domId,
                geometry: res.geometry || {},
                properties: properties || {},
                propHiden: propHiden || {},
                //setText: ret.setText,
                setVisible: function(flag)
                {
                    if (flag) {
                        gmxAPI._leaflet.LMap.addLayer(res._object);
                        res._object.setEditMode();
                    } else gmxAPI._leaflet.LMap.removeLayer(res._object);
                    this.properties.isVisible = flag;
                },

                setGeometry: function(geo) {
                    //console.log('setGeometry');
                    // if('setGeometry' in ret) {
                        // return ret.setGeometry(geo);
                    // }
                    return false;
                },
                update: function(geometry, text)
                {
                    //console.log('update');
                    // if(!geometry) return;				// Если нет geometry ничего не делаем
                    // this.properties.text = text;
                    // this.properties.isVisible = ret.isVisible;
                    // this.geometry = geometry;
                    // this.balloon = ret.balloon;
                    // var evName = (addHandlerCalled ? "onEdit" : "onAdd");
                    // callHandler(evName);
                    // if(evName === 'onEdit') gmxAPI._listeners.dispatchEvent(evName, ret.domObj, ret.domObj);
                    // addHandlerCalled = true;
                },
                remove: function() {
                    //console.log('remove', arguments);
                    var id = res.id,
                        obj = objects[id];
                    
                    //fireEvent('onRemove', obj._object);
                    obj._object.remove();
                    delete objects[id];
                },
                removeInternal: function()
                {
                },
                chkZindex: function()
                {
                },
                triggerInternal: function( callbackName ){ console.log('triggerInternal'); },
                getGeometry: function() { return gmxAPI.clone(this.geometry); },
                getLength: function() { return gmxAPI.geoLength(this.geometry); },
                getArea: function() { return gmxAPI.geoArea(this.geometry); },
                getCenter: function() { return gmxAPI.geoCenter(this.geometry); },
                setStyle: function(regularStyle, hoveredStyle) {
                    return res.setStyle(regularStyle, hoveredStyle);
                },
                getVisibleStyle: function() { 
                    return this.properties.isVisible || false; 
                },
                getStyle: function(removeDefaults) {
                    return res.getStyle(removeDefaults);
                },
                stateListeners: {},
                addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); },
                removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
            }
            // if('chkMouse' in ret) objects[myId].chkMouse = ret.chkMouse;
            // if('getItemDownType' in ret) objects[myId].getItemDownType = ret.getItemDownType;
            // if('itemMouseDown' in ret) objects[myId].itemMouseDown = ret.itemMouseDown;

            res.domObj = domObj;
            objects[domId] = res;
        }
        checkLastPoint(res.geometry);
        res.chkZindex = function() {
            if (object._map && 'bringToFront' in object) object.bringToFront();
        }
        res.setStyle = function(regularStyle, hoveredStyle) {
            var id = res.id,
                obj = objects[id];

            if (regularStyle) {
                var opt = {},
                    outline = regularStyle.outline,
                    marker = regularStyle.marker,
                    fill = regularStyle.fill;
                if (outline) {
                    if ('color' in outline) {
                        var val = outline.color;
                        opt.color = typeof val === 'number' ?
                            '#' + gmxAPI._leaflet.utils.dec2hex(val)
                            :
                            (val.substring(0, 1) !== '#' ? '#' : '') + val;
                    }
                    if ('thickness' in outline) opt.weight = outline.thickness;
                    if ('opacity' in outline) opt.opacity = outline.opacity/100;
                    obj._object.setLinesStyle(opt);
                }
                opt.size = 10;
                obj._object.setPointsStyle(opt);
            }
        }
        res.getStyle = function() {
            var id = res.id,
                obj = objects[id],
                _object = obj._object,
                linesOpt = _object.lines.options,
                pointsOpt = _object.points.options,
                styles = {
                    regular: {
                        outline: { color: linesOpt.color, thickness: linesOpt.weight, opacity: linesOpt.opacity * 100 },
                        marker: { size: pointsOpt.size },
                        fill: { color: pointsOpt.fillColor, opacity: pointsOpt.fillOpacity * 100 }
                    },
                    hovered: {
                        outline: { color: linesOpt.color, thickness: linesOpt.weight + 1 },
                        marker: { size: pointsOpt.size + 1 },
                        fill: { color: pointsOpt.fillColor }
                    }
                };
            return styles;
		}
        return res;
	}

    var fireEvent = function(eType, object) {
        if (!object._leaflet_id) return;
        var domId = '_' + object._leaflet_id,
            res = null;

        if (objects[domId]) {
            var geoJSON = object.toGeoJSON();
            checkLastPoint(geoJSON.geometry);
            objects[domId].geometry = geoJSON.geometry;
            res = objects[domId];
            res.geometry = res.domObj.geometry = geoJSON.geometry;
        } else {
            res = domFeature(object, object.options);
        }
        var handlers = gmxAPI.map.drawing.handlers[eType] || [];
        for (var i = 0; i < handlers.length; i++) handlers[i](res.domObj);
        gmxAPI._listeners.dispatchEvent(eType, res.domObj, res.domObj);
        gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, res.domObj);
        //console.log('fireEvent', eType, res.domObj);
        return domId;
    }

    var needListeners = function(gmxDrawing) {
        gmxDrawing
            // .on('dragstart', function (ev) { })
            // .on('dragend', function (ev) { })
            // .on('drawstart', function (ev) { })
            .on('drawstop', function (ev) { fireEvent('onFinish', ev.object); })
            .on('onMouseOver', function (ev) { fireEvent('onMouseOver', ev.object); })
            .on('onMouseOut', function (ev) {
                var domId = '_' + ev.object._leaflet_id;
                if (objects[domId]) fireEvent('onMouseOut', ev.object);
             })
            .on('add', function (ev) { fireEvent('onAdd', ev.object); })
            .on('edit', function (ev) { fireEvent('onEdit', ev.object); })
            .on('remove', function (ev) {
                var domId = fireEvent('onRemove', ev.object);
                delete objects[domId];
            })
            .on('drag', function (ev) { fireEvent('onEdit', ev.object); });
        needListeners = gmxAPI._drawing.needListeners = null;
    }

    drawFunctions.LINESTRING = function(coords, props, propHiden) {
        var LMap = gmxAPI._leaflet.LMap;
        var obj = null;
        if ('gmxDrawing' in LMap) {
            if (needListeners) needListeners(LMap.gmxDrawing);
            if (coords) {
                var _latlngs = getLatlngsFromGeometry({ type: 'LineString', coordinates: coords });
                obj = LMap.gmxDrawing.add(L.polyline(_latlngs), props);
                obj = domFeature(obj, props);
            } else obj = LMap.gmxDrawing.create('Polyline', {});
        }
        return obj;
	}
	drawFunctions.POLYGON = function(coords, props, propHiden)
	{
		if ((!propHiden || !propHiden.skipFrame) && gmxAPI.isRectangle(coords)) return drawFunctions.FRAME(coords, props);
        var LMap = gmxAPI._leaflet.LMap;
        var obj = null;
        if ('gmxDrawing' in LMap) {
            if (needListeners) needListeners(LMap.gmxDrawing);
            if (coords) {
                var _latlngs = getLatlngsFromGeometry({ type: 'Polygon', coordinates: coords });
                obj = LMap.gmxDrawing.add(L.polygon(_latlngs), props);
                obj = domFeature(obj, props);
            } else obj = LMap.gmxDrawing.create('Polygon', {});
        }
        return obj;
	}
	drawFunctions.FRAME = function(coords, props, propHiden)
	{
        var LMap = gmxAPI._leaflet.LMap;
        var obj = null;
        if ('gmxDrawing' in LMap) {
            if (needListeners) needListeners(LMap.gmxDrawing);
            if (coords) {
                var bounds = gmxAPIutils.bounds(coords[0]);
                var latLngBounds = L.latLngBounds(L.latLng(bounds.min.y, bounds.min.x), L.latLng(bounds.max.y, bounds.max.x));
                obj = LMap.gmxDrawing.add(L.rectangle(latLngBounds), props);
                obj = domFeature(obj, props);
            } else obj = LMap.gmxDrawing.create('Rectangle', {});
        }
        return obj;
	}
/*
	drawFunctions.zoom = function()
	{
		gmxAPI._drawing.activeState = true;
		gmxAPI._drawing.BoxZoom = true;
		gmxAPI._cmdProxy('startDrawing');
		var LMap = gmxAPI._leaflet.LMap;
		LMap.boxZoom.addHooks();

		gmxAPI._drawing.setMove = function() {
			gmxAPI._drawing.activeState = false;
			gmxAPI._drawing.BoxZoom = false;
            //if(gmxAPI._drawing.control) gmxAPI._drawing.control.selectTool("move");
            LMap.boxZoom.removeHooks();
		}
		LMap.on('boxzoomend', gmxAPI._drawing.setMove);

		var ret = {
			stopDrawing: function()
			{
				gmxAPI._drawing.activeState = false;
				gmxAPI._drawing.BoxZoom = false;
			}
		}
		return ret;
	}
*/
	drawFunctions["move"] = function()
	{
		//gmxAPI._drawing.BoxZoom = false;
    }
    drawFunctions.POINT = function(coords, props, propHiden)
    {
        var LMap = gmxAPI._leaflet.LMap;
        var obj = null;
        if ('gmxDrawing' in LMap) {
            if (needListeners) needListeners(LMap.gmxDrawing);
            var latlng = new L.LatLng(coords[1], coords[0]),
                icon = L.icon({iconUrl: 'http://maps.kosmosnimki.ru/api/img/flag_blau1.png'}),
                marker = L.marker(latlng, {draggable: true, title: props.text || '', icon: icon}),
                obj = LMap.gmxDrawing.add(marker, {});
            obj = domFeature(obj, props);
        }
        return obj;
    }
/*
	drawFunctions.POINT = function(coords, props, propHiden)
	{
		if (!props)
			props = {};

		var text = props.text;
		if (!text)
			text = "";
		var x, y;
		var obj = false;
		var balloon = false;
		var domObj;
		var onZoomendID = null;
		var zoomByID = null;
		var onMoveEndID = null;
		var onZoomendBalloonID = null;
		var onZoomstartBalloonID = null;
		var addItemListenerID = null;
		
		var isDrawing = true;
		var balloonVisible = false;

		// Проверка пользовательских Listeners POLYGON
		var chkEvent = function(eType, out)
		{
			var flag = gmxAPI._listeners.dispatchEvent(eType, domObj, domObj);
			if(!flag) flag = gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, domObj);
			return flag;
		}

		var ret = {
			'isVisible': (props.isVisible == undefined) ? true : props.isVisible
			,
			'setVisible': function(flag) { 
				obj.setVisible(flag); 
				ret.isVisible = flag;
				if(balloon) balloon.setVisible(ret.isVisible && balloonVisible);
			}
			,
			'stopDrawing': function() {
				if (!isDrawing) return;
				isDrawing = false;
				if (!coords) {
					if(addItemListenerID) gmxAPI.map.removeListener('onClick', addItemListenerID); addItemListenerID = null;
				}
			}
			,
			'remove' : function() {
				if (obj)
				{
					obj.remove();
					if(balloon) balloon.remove();
					domObj.removeInternal();
					chkEvent('onRemove');
					if(onZoomendID) gmxAPI._listeners.removeListener(null, 'onZoomend', onZoomendID); onZoomendID = null;
					if(zoomByID) gmxAPI.map.removeListener('zoomBy', zoomByID); zoomByID = null;
					if(onMoveEndID) gmxAPI.map.removeListener('onMoveEnd', onMoveEndID); onMoveEndID = null;

					if(onZoomendBalloonID) gmxAPI._listeners.removeListener(null, 'onZoomend', onZoomendBalloonID); onZoomendBalloonID = null;
					if(onZoomstartBalloonID) gmxAPI._listeners.removeListener(null, 'onZoomstart', onZoomstartBalloonID); onZoomstartBalloonID = null;
					if(addItemListenerID) gmxAPI.map.removeListener('onClick', addItemListenerID); addItemListenerID = null;
					// disableDragging					
				}
			}
			,
			'setStyle': function(regularStyle, hoveredStyle) {}
			,'setText': function(newText) {
				if(!balloon) return;
				text = newText;
				input.value = newText;
				balloon.updatePropsBalloon(newText);
				updateText();
			}
			,
			'getVisibleStyle': function() { return obj.getVisibleStyle(); }
			,
			'getStyle': function(removeDefaults) { return getStyle(removeDefaults, obj); }
		};
		var done = function(xx, yy)
		{
            //gmxAPI._drawing.activeState = false;
			obj = gmxAPI.map.addObject(null, null, {'subType': 'drawing'});
			balloon = null;
			if(gmxAPI.map.balloonClassObject) {
				balloon = gmxAPI.map.balloonClassObject.addBalloon(true);	// Редактируемый балун (только скрывать)
			}
			ret.balloon = balloon;

			var updateDOM = function()
			{
				xx = gmxAPI.chkPointCenterX(xx);
				domObj.update({ type: "POINT", coordinates: [xx, yy] }, text);
			}


			var position = function(x, y)
			{
				xx = x;
				yy = y;
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

			var startDx = 0, startDy = 0, isDragged = false;
			var clickTimeout = false;
			var needMouseOver = true;

			obj.setHandlers({
				"onClick": function()
				{
					if(domObj.stateListeners.onClick && chkEvent('onClick')) return;	// если установлен пользовательский onClick возвращающий true выходим
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
					return true;
				}
				,"onMouseOver": function()
				{
					if(!isDragged && needMouseOver) {
						chkEvent('onMouseOver');
						needMouseOver = false;
					}
				}
				,"onMouseOut": function()
				{
					if(!isDragged && !needMouseOver) {
						chkEvent('onMouseOut');
						needMouseOver = true;
					}
				}
			});

			var dragCallback = function(x, y)
			{
				position(x, y);
				chkEvent('onEdit');
			}
			var downCallback = function(x, y)
			{
				x = gmxAPI.chkPointCenterX(x);
				isDragged = true;
				if(balloon) {
					if(balloon.outerDiv.style.pointerEvents != 'none') balloon.outerDiv.style.pointerEvents = 'none';
				}
			};
			var upCallback = function()
			{
				if(balloon) {
					if(balloon.outerDiv.style.pointerEvents != 'auto') balloon.outerDiv.style.pointerEvents = 'auto';
				}
				isDragged = false;
				chkEvent('onFinish');
			}
			
			obj.enableDragging(function(x, y, o, data)
			{
				dragCallback(x, y);
				gmxAPI._drawing.activeState = true;
			}
			, function(x, y, o, data)
			{
				downCallback(x, y);
			}
			, function(o)
			{
				gmxAPI._drawing.activeState = false;
				upCallback();
			});

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
					for (var i = 0; i < newText.length; i++) {
						if (newText.charAt(i) == '\n'.charAt(0)) rows += 1;
						var tt = 1;
					}
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

				balloonVisible = (text && (text != "")) ? true : false;
				setHTMLVisible(balloonVisible);

				var showFlag = false;
				onZoomstartBalloonID = gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomstart', 'func': function(attr) {
					showFlag = balloon.isVisible;
					balloon.setVisible(false);
				}});
				onZoomendBalloonID = gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': function(attr) {
					balloon.setVisible(showFlag);
				}});
			}
			domObj = createDOMObject(ret, null, propHiden);
			domObj.objectId = obj.objectId;
			position(xx, yy);
			if(balloon) {
				balloon.setVisible(balloonVisible);
				updateText();
			}
			chkEvent('onAdd');

			ret.setVisible(ret.isVisible);
			chkEvent('onFinish');

			zoomByID = gmxAPI.map.addListener('zoomBy', function() {
				if(balloon.isVisible) gmxAPI.setVisible(balloon.outerDiv, false);
			});
			onMoveEndID = gmxAPI.map.addListener('onMoveEnd', function() {
				if(balloon.isVisible) {
					gmxAPI.setVisible(balloon.outerDiv, true);
					balloon.reposition();
				}
			});
			onZoomendID = gmxAPI._listeners.addListener({'eventName': 'onZoomend', 'func': upCallback });
		}

		if (!coords)
		{
			//gmxAPI._sunscreen.bringToTop();
			//gmxAPI._sunscreen.setVisible(true);
			//var apiBase = gmxAPI.getAPIFolderRoot();
            setTimeout(function() {
                addItemListenerID = gmxAPI.map.addListener('onClick', function()
                {
                    done(gmxAPI.map.getMouseX(), gmxAPI.map.getMouseY());
                    //if(gmxAPI._drawing.control) gmxAPI._drawing.control.selectTool((gmxAPI.map.isKeyDown(16) ? "POINT" : "move"));
                    ret.stopDrawing();
                    endDrawing();
                    if (gmxAPI.map.isKeyDown(16)) {
                        var control = gmxAPI.map.controlsManager.getControl('drawingPoint');
                        if(control && 'onclick' in control.options) control.options.onclick.call(control);
                        else if(gmxAPI.map.standartTools && 'selectTool' in gmxAPI.map.standartTools) gmxAPI.map.standartTools.selectTool("POINT");
                    }
                    return true;
                });
			}, 0);
            gmxAPI._drawing.type = 'POINT';
		}
		else {
			done(coords[0], coords[1]);
			endDrawing();
		}
		return ret;
	}
*/
    var chkZindexTimer = null,
        nullFunc = function() { };
	var drawing = {
		handlers: { onAdd: [], onEdit: [], onRemove: [] },
        needListeners: needListeners,
		mouseState: 'up',
		activeState: false,
		isEditable: true,
		endDrawing: endDrawing,
		stateListeners: {},
		setEditable: function(flag) { drawing.isEditable = flag; },
		addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); },
		removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); },
		enabledHoverBalloon: true,
		enableHoverBalloon: function() {
            this.enabledHoverBalloon = true;
        }
		,
		disableHoverBalloon: function() {
            this.enabledHoverBalloon = false;
        }
		,
        addObjects: function(data, format) {    // Добавление массива обьектов
            var out = [];
            var fmt = (format ? format : 'LatLng');
            for (var i=0, len=data.length; i<len; i++)
            {
                var ph = data[i];
                var prop = ph.properties || null;
                var propHiden = ph.propHiden || null;
                if(ph.geometry && ph.geometry.properties) prop = ph.geometry.properties;
                var geom = (fmt == 'LatLng' ? ph.geometry : gmxAPI.from_merc_geometry(ph.geometry));

                var aObj = drawing.addObject(geom, prop, propHiden);
                out.push(aObj);
            }
            return out;
        }
        ,
		//props опционально
		addObject: function(geom, props, propHiden)
		{
			if(!propHiden) propHiden = {};
			if(!props) props = {};
			if (geom.type.indexOf("MULTI") != -1)
			{
				if(!propHiden) propHiden = {};
				propHiden.multiFlag = true;
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
				var o = drawFunctions[geom.type](geom.coordinates, props, propHiden);
				//gmxAPI._tools.standart.selectTool("move");
                return o.domObj || o;
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
			if(!callback) return;
			for (var id in objects) {
				var cObj = objects[id];
				if(cObj.geometry) callback(cObj.domObj || cObj);
			}
/*			
			for (var id in objects) {
				var cObj = objects[id];
				if(cObj.geometry && !cObj.propHiden.multiFlag) callback(cObj);
			}
			for (var id in multiObjects) {
				var cObj = multiObjects[id];
				if(cObj.geometry) callback(cObj);
			}*/
		}
		,
        tools: { 
            setVisible: function(flag) { 
                //if(gmxAPI._drawing.control) gmxAPI._drawing.control.setVisible(flag);
            }
            ,
            zoom: { setVisible: nullFunc },
            POINT: { setVisible: nullFunc },
            LINESTRING: { setVisible: nullFunc },
            POLYGON: { setVisible: nullFunc },
            FRAME: { setVisible: nullFunc }
        }
        ,
		addTool: function(tn, hint, regularImageUrl, activeImageUrl, onClick, onCancel)
		{
			var ret = null;
			var attr = {
				'key': tn,
				'activeStyle': {},
				'regularStyle': {},
				'regularImageUrl': regularImageUrl,
				'activeImageUrl': activeImageUrl,
				'onClick': onClick,
				'onCancel': onCancel,
				'hint': hint
			};
            var controls = gmxAPI.map.controlsManager.getCurrent();
            if(controls && 'addControl' in controls) {
                ret = controls.addControl(tn, attr);
            } else {
                var control = gmxAPI.IconsControl || gmxAPI._drawing.control;
                if(!control) return null;
                ret = control.addTool(tn, {
                    'key': tn,
                    'activeStyle': {},
                    'regularStyle': {},
                    'regularImageUrl': regularImageUrl,
                    'activeImageUrl': activeImageUrl,
                    'onClick': onClick,
                    'onCancel': onCancel,
                    'hint': hint
                });
            }
			return ret;
		}
		, 
		removeTool: function(tn)
		{
			if(this.tools[tn]) {
				if(gmxAPI._drawing.control) gmxAPI._drawing.control.removeTool(tn);
			}
		}
		,
		selectTool: function(toolName) {
			if(gmxAPI._tools.standart) gmxAPI._tools.standart.selectTool(toolName);
		}
		,
		getHoverItem: function(attr)
		{
			//console.log('chkMouseHover ' );
			for (var id in objects) {
				var cObj = objects[id];
				if('getItemDownType' in cObj && cObj.getItemDownType.call(cObj, attr, cObj.getGeometry())) {
					return cObj;
				}
			}
			return null;
		}
		,
		chkZindex: function(pid)
		{
			if(chkZindexTimer) clearTimeout(chkZindexTimer);
			chkZindexTimer = setTimeout(function()
			{
				chkZindexTimer = null;
				for (var id in objects) {
					var cObj = objects[id];
					if('chkZindex' in cObj) cObj.chkZindex();
				}
			}, 10);
		}
	}

	//расширяем namespace
    gmxAPI._drawFunctions = drawFunctions;
    gmxAPI._drawing = drawing;
})();
