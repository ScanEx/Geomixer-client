import flash.external.*;
import flash.geom.*;
import flash.filters.*;
import flash.display.BitmapData;

class FlashMap
{
	static var nextId = 0;

	static function getNextId()
	{
		nextId += 1;
		return "aa" + nextId;
	}

	static function createClip(parent, name)
	{
		return parent.createEmptyMovieClip(name || getNextId(), parent.getNextHighestDepth());
	}

	static function getScale(z)
	{
		return Math.pow(2, z - 17)*156543.033928041;
	}

	static var onFinishClick;
	static var onMouseMove;
	static var worldWidth, worldDelta;

	static function main(mc)
	{
		var menu = new ContextMenu();
		menu.hideBuiltInItems();
		_root.menu = menu;

		System.security.allowDomain("*");
		System.security.loadPolicyFile(ExternalInterface.call("getHTMLHostRoot") + "/crossdomain.xml");

		Stage.align = "TL";
		Stage.scaleMode = "noScale";

		var currentX = 0, currentY = 0, currentZ = 0;
		var frozen = false;

		createClip(_root, "map");
		createClip(_root, "statics");
		createClip(_root, "windows");
		var mapWindow = new FlashMapWindow(_root.map, function() { return currentZ; });
		var staticWindow = new FlashMapWindow(_root.statics);

		var getCurrentWindow = function()
		{
			var x = _root._xmouse, y = _root._ymouse;
			for (var id in FlashMapWindow.allWindows)
			{
				var win = FlashMapWindow.allWindows[id];
				if ((win != mapWindow) && win.getCurrentZ && win.clip._parent._parent._visible && (x >= win.x1) && (y >= win.y1) && (x <= win.x2) && (y <= win.y2))
					return win;
			}
			return mapWindow;
		}

		var mapIsMoving = false;

		var setMapIsMoving = function(flag)
		{
			mapIsMoving = flag;
			mapWindow.update(0, 0, Stage.width, Stage.height, mapIsMoving);
			staticWindow.update(0, 0, Stage.width, Stage.height, false);
		}

		var parseColor = function(colorStr) { return parseInt("0x" + colorStr); }
		var constrain = function(a, t, b) { return t < a ? a : t > b ? b : t; }

		var minX, minY, maxX, maxY, minZ, maxZ;
		FlashMap.worldWidth = Merc.x(180);
		FlashMap.worldDelta = FlashMap.worldWidth - 18410000;

		var getObject = function(id) { return FlashMapObject.allObjects[id]; }
		var onMoveIds = {};

		var readjust = function()
		{
			if (minX || maxX)
				currentX = constrain(minX, currentX, maxX);
			else
			{
				if (currentX > FlashMap.worldWidth + FlashMap.worldDelta)
					currentX -= 2*FlashMap.worldWidth;
				if (currentX < -FlashMap.worldWidth + FlashMap.worldDelta)
					currentX += 2*FlashMap.worldWidth;
			}
			if (minY || maxY)
				currentY = constrain(minY, currentY, maxY);
			if (minZ || maxZ)
				currentZ = constrain(minZ, currentZ, maxZ);
			for (var id in FlashMapWindow.allWindows)
			{
				var win = FlashMapWindow.allWindows[id];
				if (win.getCurrentZ)
					win.recenter(currentX, currentY);
			}
			for (var id in onMoveIds)
			{
				var o = getObject(id);
				if (o)
					o.callHandler("onMove");
				else
					delete onMoveIds[id];
			}
		}

		var resizeableIds = [], lastResizeableIdsLength = 0;
		var oldStageWidth = 0, oldStageHeight = 0;
		_root.onEnterFrame = function()
		{
			var wasResized = (Stage.width != oldStageWidth) || (Stage.height != oldStageHeight);
			if (wasResized)
			{
				oldStageWidth = Stage.width;
				oldStageHeight = Stage.height;
				setMapIsMoving(mapIsMoving);
				readjust();
			}
			if (wasResized) // || (resizeableIds.length != lastResizeableIdsLength))
			{
				for (var i in resizeableIds)
					getObject(resizeableIds[i]).callHandler("onResize");
				// lastResizeableIdsLength = resizeableIds.length;
			}
			if (wasResized || mapWindow.dirtyFlag)
			{
				mapWindow.dirtyFlag = false;
				mapWindow.repaintLabels();
			}
			if (wasResized || staticWindow.dirtyFlag)
			{
				staticWindow.dirtyFlag = false;
				staticWindow.repaintLabels();
			}
		}

		var fluidMoveTo = function(newX, newY, newZ, steps)
		{
			mapWindow.repaintVectorCache();

			var oldX = currentX, oldY = currentY, oldZ = currentZ;
			var t = 0;
			setMapIsMoving(true);
			_root.map.onEnterFrame = function()
			{
				t += 1.0/steps;
				var ending = (t > 1);
				if (ending)
					t = 1;
				var easeT = t - 2*t*(t - 0.5)*(t - 1);

				var k = newZ - oldZ;
				var zoomT = (oldZ == newZ) ? easeT : (Math.pow(2, k*easeT) - 1)/(Math.pow(2, k) - 1);
				currentX = (1 - zoomT)*oldX + zoomT*newX;
				currentY = (1 - zoomT)*oldY + zoomT*newY;
				currentZ = (newZ == oldZ) ? newZ : ((1 - easeT)*oldZ + easeT*newZ);
				readjust();
				if (ending)
				{
					_root.map.onEnterFrame = null;
					setMapIsMoving(false);

					//mapWindow.repaintVectorCache();
					mapWindow.objectRoot.rootObject.repaintPoints();
					mapWindow.repaintLabels();
				}
			}
		}

		var startMouseX, startMouseY, startMapX, startMapY;
		var isDragging = false;
		var pressTime = 0;
		var currentWindow_;

		_root.onMouseDown = function()
		{
			pressTime = getTimer();
			isDragging = true;
			currentWindow_ = getCurrentWindow();
			startMouseX = _root._xmouse;
			startMouseY = _root._ymouse;
			startMapX = currentX;
			startMapY = currentY;
			mapWindow.repaintVectorCache();
		}

		var mouseUpHandler = false, var clickHandler = false;
		FlashMap.onFinishClick = function(callback1, callback2)
		{
			mouseUpHandler = callback1;
			clickHandler = callback2;
		}
		var mouseMoveHandler = false;
		FlashMap.onMouseMove = function(callback)
		{
			if (!isDragging)
				mouseMoveHandler = callback;
		}

		_root.onMouseUp = function()
		{
			if (_root.map.onEnterFrame == null)
				setMapIsMoving(false);
			isDragging = false;
			if (mouseUpHandler)
				mouseUpHandler();
			if (getTimer() - pressTime < 300)
			{
				if (clickHandler)
					clickHandler();
				else if (!Selection.getFocus())
					fluidMoveTo(currentWindow_.objectRoot.cacheMC._xmouse, currentWindow_.objectRoot.cacheMC._ymouse, currentZ, 7);
			}
			else
			{
				//mapWindow.repaintVectorCache();
				mapWindow.objectRoot.rootObject.repaintPoints();
				mapWindow.repaintLabels();
			}
			mouseUpHandler = false;
			clickHandler = false;
		}

		_root.onMouseMove = function()
		{
			var dx = _root._xmouse - startMouseX;
			var dy = _root._ymouse - startMouseY;
			if ((dx*dx) + (dy*dy) > 6*6)
				pressTime = 0;
			if (isDragging && !frozen)
			{
				setMapIsMoving(true);
                        	var c = FlashMap.getScale(currentWindow_.getCurrentZ());
				currentX = startMapX - (_root._xmouse - startMouseX)*c;
				currentY = startMapY + (_root._ymouse - startMouseY)*c;
				readjust();
			}
			if (!isDragging && mouseMoveHandler)
				mouseMoveHandler();
		}

		var zoomBy = function(dz, mx, my) 
		{
			if (mapIsMoving)
				return;
			var newZ = currentZ + dz;
			if ((newZ < minZ) || (newZ > maxZ))
				return;
			var k = Math.pow(2, dz);
			fluidMoveTo(mx + k*(currentX - mx), my + k*(currentY - my), newZ, 6);
		}

		Mouse.addListener({ onMouseWheel: function(delta) 
		{ 
			var win = getCurrentWindow();
			zoomBy((delta < 0) ? 1 : -1, win.objectRoot.cacheMC._xmouse, win.objectRoot.cacheMC._ymouse);
		}});
		ExternalInterface.addCallback("zoomBy", null, function(dz, x, y) 
		{ 
			zoomBy(dz, x ? x : currentX, y ? y : currentY);
		});
		ExternalInterface.addCallback("moveTo", null, function(x, y, z)
		{
			currentX = x;
			currentY = y;
			currentZ = z;
			if (FlashMapObject.hoveredObject)
				FlashMapObject.hoveredObject.hideIndicator();
			readjust();

			//mapWindow.repaintVectorCache();
			mapWindow.objectRoot.rootObject.repaintPoints();
			mapWindow.repaintLabels();
		});
		ExternalInterface.addCallback("slideTo", null, function(x, y, z)
		{
			if ((x != currentX) || (y != currentY) || (z != currentZ))
				fluidMoveTo(x, y, z, 8);
		});

		ExternalInterface.addCallback("repaint", null, readjust);
		ExternalInterface.addCallback("getX", null, function() { return currentX; });
		ExternalInterface.addCallback("getY", null, function() { return currentY; });
		ExternalInterface.addCallback("getZ", null, function() { return currentZ; });
		ExternalInterface.addCallback("getMouseX", null, function() { return mapWindow.objectRoot.cacheMC._xmouse; });
		ExternalInterface.addCallback("getMouseY", null, function() { return mapWindow.objectRoot.cacheMC._ymouse; });
		ExternalInterface.addCallback("isKeyDown", null, function(code) { return Key.isDown(code); });
		ExternalInterface.addCallback("freeze", null, function() { frozen = true; });
		ExternalInterface.addCallback("unfreeze", null, function() { frozen = false; });

		ExternalInterface.addCallback("setBounds", null, function(x1, x2, y1, y2, z1, z2)
		{
			minX = x1;	
			minY = y1;
			maxX = x2;
			maxY = y2;
			minZ = z1;
			maxZ = z2;
			readjust();
		});

		var json = new JSON();
		ExternalInterface.addCallback("setStyle", null, function(id, style, activeStyle)
		{
			var o = getObject(id);
			var oldStyle = o.style;
			if (json.stringify(style) != json.stringify(oldStyle))
			{
				o.style = style;
				o.activeStyle = activeStyle;
				FlashMapObject.loadAllSprites(style);
				FlashMapObject.loadAllSprites(activeStyle);
				o.repaintRecursively();
				o.objectRoot.restyleTextField(id);
			}
		});

		ExternalInterface.addCallback("setHighlight", null, function(id, flag)
		{
			var o = getObject(id);
			if (o.isActive != flag)
			{
				o.isActive = flag;
				o.repaintRecursively();
			}
		});

		ExternalInterface.addCallback("setText", null, function(id, text)
		{
			if (!text || (text == "null"))
				text = "";
			var win = getObject(id).objectRoot;
			win.setTextField(id, text);
			win.needReposition = true;
		});
		var getTF = function(id)
		{
			return getObject(id).objectRoot.textFields[id];
		}
		ExternalInterface.addCallback("getText", null, function(id)
		{
			return getTF(id)._text;
		});
		ExternalInterface.addCallback("getTextWidth", null, function(id)
		{
			return getTF(id)._width - 5;
		});
		ExternalInterface.addCallback("getTextHeight", null, function(id)
		{
			return getTF(id)._height - 5;
		});
		ExternalInterface.addCallback("setEditable", null, function(id, flag)
		{			
			getObject(id).objectRoot.setTextFieldEditable(id, flag);
		});
		ExternalInterface.addCallback("setFocus", null, function(id, flag)
		{			
			var tf = getTF(id)
			Selection.setFocus(tf);
			Selection.setSelection(tf.text.length, tf.text.length);
		});

		ExternalInterface.addCallback("addObject", null, function(parentId, geometry, properties)
		{
			return getObject(parentId).addChild(geometry, properties).id;
		});

		ExternalInterface.addCallback("addFilter", null, function(parentId, field, operation, value)
		{
			return getObject(parentId).addFilter(field, operation, value).id;
		});

		ExternalInterface.addCallback("remove", null, function(id)
		{
			return getObject(id).remove();
		});

		ExternalInterface.addCallback("setGeometry", null, function(id, geometry)
		{
			var obj = getObject(id);
			obj.setGeometry(geometry);
			if (getTF(id) || obj.objectRoot.childRoots[id])
				obj.objectRoot.needReposition = true;
			if (getTF(id))
				obj.objectRoot.positionTextField(id);
		});

		ExternalInterface.addCallback("setVisible", null, function(id, flag)
		{
			var obj = getObject(id);
			if (obj.visibilitySet != flag)
			{
				obj.setVisible(flag);
				if (obj.recurseUp(function(o) { return o.haveVectorContents; }))
					obj.objectRoot.mapWindow.dirtyFlag = true;
			}
		});

		ExternalInterface.addCallback("setHandler", null, function(id, eventName, callbackName) 
		{ 
			getObject(id).setHandler(eventName, callbackName); 
			if (eventName == "onResize")
			{
				resizeableIds.push(id);
				getObject(id).callHandler("onResize");
			}
			if (eventName == "onMove")
				onMoveIds[id] = true;
		});
		ExternalInterface.addCallback("setZoomBounds", null, function(id, minZ_, maxZ_) { getObject(id).setZoomBounds(minZ_, maxZ_); });
		ExternalInterface.addCallback("setBackgroundImage", null, function(id, url, func) { getObject(id).setBackgroundImage(url, func); });
		ExternalInterface.addCallback("clearBackgroundImage", null, function(id) { getObject(id).clearBackgroundImage(); });
		ExternalInterface.addCallback("setBackgroundTiles", null, function(id, func, isAlternateProjection) { getObject(id).setBackgroundTiles(func, isAlternateProjection); });
		ExternalInterface.addCallback("setVectorTiles", null, function(id, format, z, func, field, tiles) { getObject(id).setVectorTiles(format, z, func, field, tiles); });
		ExternalInterface.addCallback("loadVectorTile", null, function(url, func) 
		{ 
			FlashMapObject.loadShapesWithProxy(
				url,
				_root,
				function(loadedClip) 
				{ 
					setTimeout(function()
					{
						var objects = [];
						if (loadedClip.shapes)
						{
							for (var k = 0; k < loadedClip.shapes.length; k++)
							{
								var obj = loadedClip.shapes[k];
								var props = {};
								var p = obj.properties;
								if (p.length > 0)
								{
									if (p[0].sort)
										for (var l = 0; l < p.length; l++)
											props[p[l][0]] = p[l][1];
									else
										for (var l = 0; l < p.length/2; l++)
											props[p[l*2]] = p[l*2 + 1];
								}
								obj.properties = props;
								objects.push(obj);
							}
						}
						ExternalInterface.call(func, objects);
					}, 50);
				}
			);
		});
		ExternalInterface.addCallback("setCacheable", null, function(id) { getObject(id).setCacheable(); });
		ExternalInterface.addCallback("bringToTop", null, function(id) { getObject(id).bubble(Array.ASCENDING, 1); });
		ExternalInterface.addCallback("bringToBottom", null, function(id) { getObject(id).bubble(Array.DESCENDING, -1); });
		ExternalInterface.addCallback("bringToDepth", null, function(id, n) { getObject(id).bringToDepth(n); });
		ExternalInterface.addCallback("getGeometry", null, function(id) { return getObject(id).getGeometry(); });
		ExternalInterface.addCallback("getLength", null, function(id) { return getObject(id).getLength(); });
		ExternalInterface.addCallback("getArea", null, function(id) { return getObject(id).getArea(); });
		ExternalInterface.addCallback("getCenter", null, function(id) { return getObject(id).getCenter(); });

		ExternalInterface.addCallback("addMapWindow", null, function(id, callbackName) 
		{ 
			var lastCurrentZ = -100, lastComputedZ;
			return (new FlashMapWindow(getObject(id).addChild().clip, function()
			{ 
				if (currentZ != lastCurrentZ)
				{
					lastCurrentZ = currentZ;
					lastComputedZ = ExternalInterface.call(callbackName, currentZ);
				}
				return lastComputedZ;
			})).id; 
		});
		ExternalInterface.addCallback("positionWindow", null, function(id, x1, y1, x2, y2) 
		{ 
			FlashMapWindow.allWindows[id].update(x1, y1, x2, y2, false); 
			readjust();
		});
		ExternalInterface.addCallback("setBackgroundColor", null, function(id, color)
		{ 
			FlashMapWindow.allWindows[id].setBackgroundColor(color);
		});
		ExternalInterface.addCallback("addChildRoot", null, function(id)
		{ 
			return FlashMapObject.allObjects[id].objectRoot.addChildRoot(id).rootObject.id;
		});

		ExternalInterface.addCallback("print", null, function()
		{
			var job = new PrintJob();
			if (job.start())
			{
				_root._xscale = 48;
				_root._yscale = 48;
				job.addPage(0, { xMin: 0, yMin: 0, xMax: Stage.width, yMax: Stage.height }, { printAsBitmap: true });
				job.send();
				_root._xscale = 100;
				_root._yscale = 100;
			}
			delete job;
		});
		
		setTimeout(function()
		{
			if (!FlashMap.loadDone)
				ExternalInterface.call(_root.loadCallback, mapWindow.id, staticWindow.id);
			FlashMap.loadDone = true;
		}, 0);
	}

	static var loadDone = false;
}
