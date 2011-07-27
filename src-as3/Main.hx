import flash.display.Sprite;
import flash.display.Stage;
import flash.display.StageAlign;
import flash.display.StageScaleMode;
import flash.display.StageQuality;
import flash.display.BitmapData;
import flash.ui.ContextMenu;
import flash.ui.ContextMenuItem;
import flash.ui.Mouse;
import flash.net.FileReference;
import flash.system.Security;
import flash.external.ExternalInterface;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.events.ContextMenuEvent;
import flash.errors.Error;
import flash.geom.Rectangle;
import flash.geom.Matrix;
import flash.printing.PrintJob;
import flash.printing.PrintJobOptions;
import flash.utils.Timer;
import flash.events.TimerEvent;

class Main
{
	public static var registerMouseDown:MapNode->MouseEvent->Void;
	public static var draggingDisabled:Bool = false;
	public static var clickingDisabled:Bool = false;
	public static var mousePressed:Bool = false;
	public static var eventAttr:Dynamic = {};

	static var lastFrameBumpTime:Float = 0;
	public static function bumpFrameRate()
	{
		lastFrameBumpTime = Date.now().getTime();
		var stage = flash.Lib.current.stage;
		if (stage.frameRate != 40)
			stage.frameRate = 40;
	}

	static function main()
	{
		var root = flash.Lib.current;
		var menu = new ContextMenu();
		menu.hideBuiltInItems();
		root.contextMenu = menu;
		var stage = root.stage;
		stage.align = StageAlign.TOP_LEFT;
		stage.scaleMode = StageScaleMode.NO_SCALE;
		stage.quality = StageQuality.MEDIUM;
		Key.initialize(stage);
		PrintManager.init(stage);
		Security.allowDomain("*");
		stage.frameRate = 1;

		var currentX:Float = 0;
		var currentY:Float = 0;
		var currentZ:Float = 4;
		var minX:Float = -100000000;
		var minY:Float = Merc.y(-60.0);
		var maxX:Float = 100000000;
		var maxY:Float = Merc.y(85.0);
		var minZ:Float = 1;
		var maxZ:Float = 17;
		var nextFrameCallbacks = new Array<Void->Void>();

		var mapSprite = Utils.addSprite(root);
		var mapWindow = new MapWindow(mapSprite, function() { return currentZ; });
		var crosshair = Utils.addSprite(root);
		var mapRoot = mapWindow.rootNode.addChild();
		var grid = mapWindow.rootNode.addChild();
		grid.setVisible(false);
		nextFrameCallbacks.push(function() { grid.setContent(new GridContent()); });
		mapWindow.setCenter(currentX, currentY);

		var viewportHasMoved = false;

		var getNode = function(id) { return MapNode.allNodes.get(id); }
		var constrain = function(a:Float, t:Float, b:Float) { return (t < a) ? a : (t > b) ? b : t; }
		var setCurrentPosition = function(x, y, z)
		{
			currentX = constrain(minX, x,  maxX);
			var ww = Utils.worldWidth;
			var wd = Utils.worldDelta;
			while (currentX > ww + wd)
				currentX -= 2*ww;
			while (currentX < -ww + wd)
				currentX += 2*ww;
			currentY = constrain(minY, y, maxY);
			currentZ = constrain(minZ, z, maxZ);
			viewportHasMoved = true;
		}

		var repaintCrosshair = function()
		{
			var g = crosshair.graphics;
			g.clear();
			var cx = Math.round(stage.stageWidth/2) + 0.5;
			var cy = Math.round(stage.stageHeight/2) + 0.5;
			g.lineStyle(1, (mapWindow.backgroundColor < 0x800000) ? 0xffffff : 0x216b9c, 0.7);
			g.moveTo(cx, cy - 6);
			g.lineTo(cx, cy + 6);
			g.moveTo(cx - 6, cy);
			g.lineTo(cx + 6, cy);
		}

		var isMoving:Bool = false;
		var wasMoving:Bool = isMoving;

		var getWindowUnderMouse = function()
		{
			var x = root.mouseX;
			var y = root.mouseY;
			for (id in MapWindow.allWindows.keys())
			{
				var win = MapWindow.allWindows.get(id);
				if ((win != mapWindow) && (x >= win.x1) && (y >= win.y1) && (x <= win.x2) && (y <= win.y2))
					return win;
			}
			return mapWindow;
		}

		var isFluidMoving:Bool = false;
		var fluidTargetZ:Float = 0;
		var stopFluidMove:Void->Void = null;
		var fluidMoveTo = function(newX:Float, newY:Float, newZ:Float, steps:Int)
		{
			if (isFluidMoving)
				return;
			steps = 5;
			var oldX:Float = currentX;
			var oldY:Float = currentY;
			var oldZ:Float = currentZ;
			fluidTargetZ = newZ;
			var t:Float = 0;
			isFluidMoving = true;
			isMoving = true;
			Main.bumpFrameRate();
			var listener = function(event)
			{
				t += 1.0/steps;
				var ending:Bool = (t > 1);
				if (ending)
					t = 1;
				var easeT:Float = t - 2*t*(t - 0.5)*(t - 1);
				var k:Float = oldZ - newZ;
				var zoomT:Float = (oldZ == newZ) ? easeT : (Math.pow(2, k*easeT) - 1)/(Math.pow(2, k) - 1);
				setCurrentPosition(
					(1 - zoomT)*oldX + zoomT*newX,
					(1 - zoomT)*oldY + zoomT*newY,
					(1 - easeT)*oldZ + easeT*newZ
				);
				if (ending)
				{
					stopFluidMove();
					isMoving = false;
				}
			}
			root.addEventListener(Event.ENTER_FRAME, listener);
			stopFluidMove = function()
			{
				root.removeEventListener(Event.ENTER_FRAME, listener);
				isFluidMoving = false;
				stopFluidMove = null;
			}
		}

		var startMouseX:Float = 0;
		var startMouseY:Float = 0;
		var startMapX:Float = 0;
		var startMapY:Float = 0;
		var isDragging:Bool = false;
		var pressTime:Float = 0;
		var draggedWindow:MapWindow = null;
		var clickedNode:MapNode = null;

		var zoomBy = function(dz:Float, mx:Float, my:Float) 
		{
			var newZ:Float = (isFluidMoving ? fluidTargetZ : currentZ) + dz;
			if ((newZ < minZ) || (newZ > maxZ))
				return;
			var k = Math.pow(2, currentZ - newZ);
			if (isFluidMoving && (Math.abs(fluidTargetZ - currentZ) > 0.9))
				return;
			if (isFluidMoving)
				stopFluidMove();
			fluidMoveTo(mx + k*(currentX - mx), my + k*(currentY - my), newZ, 15);
		}
		
		Main.registerMouseDown = function(node:MapNode, ?event:MouseEvent)
		{
			eventAttr = { };
			if (event != null) {
				if (event.shiftKey) eventAttr.shiftKey = 1;
				if (event.ctrlKey) eventAttr.ctrlKey = 1;
				if (event.altKey) eventAttr.altKey = 1;
			}
			if (Key.isDown(16) && ExternalInterface.call("kosmosnimkiBeginZoom"))
				clickedNode = node;
			else if ((node.getHandler("onMouseDown") != null) || (node.getHandler("onMouseUp") != null) || (node.getHandler("onClick") != null))
			{
				node.callHandler("onMouseDown");
				clickedNode = node;
			}
		}
		root.addEventListener(MouseEvent.MOUSE_WHEEL, function(event:MouseEvent)
		{ 
			var sprite = getWindowUnderMouse().innerSprite;
			zoomBy((event.delta > 0) ? 1 : -1, sprite.mouseX, sprite.mouseY);
		});
		root.addEventListener(MouseEvent.MOUSE_DOWN, function(event)
		{
			pressTime = flash.Lib.getTimer();
			Main.mousePressed = true;
		});
		var windowMouseDown = function(event)
		{
			if (!Main.draggingDisabled)
			{
				isDragging = true;
				draggedWindow = getWindowUnderMouse();
				startMouseX = root.mouseX;
				startMouseY = root.mouseY;
				startMapX = currentX;
				startMapY = currentY;
			}
			Main.bumpFrameRate();
		};
		mapSprite.addEventListener(MouseEvent.MOUSE_DOWN, windowMouseDown);
		root.addEventListener(MouseEvent.MOUSE_UP, function(event)
		{
			isDragging = false;
			if (!isFluidMoving)
			{
				isMoving = false;
				viewportHasMoved = true;
			}
			if (clickedNode != null)
				clickedNode.callHandler("onMouseUp");
			if ((flash.Lib.getTimer() - pressTime) < 300)
			{
				if (clickedNode != null)
				{
					clickedNode.callHandler("onClick");
				}
				else if (!Main.clickingDisabled)
				{
					var sprite = draggedWindow.innerSprite;
					fluidMoveTo(sprite.mouseX, sprite.mouseY, currentZ, 10);
				}
			}
			clickedNode = null;
		});
		var cursor:Sprite = Utils.addSprite(root);
		cursor.mouseEnabled = false;
		cursor.mouseChildren = false;
		var currentCursorURL:String = null;
		var repaintCursor = function()
		{
			cursor.x = root.mouseX;
			cursor.y = root.mouseY;
		}
		var deleteCurrentCursor = function()
		{
			if (cursor.numChildren > 0)
				cursor.removeChildAt(0);
		}
		ExternalInterface.addCallback("setCursor", function(url:String, dx:Int, dy:Int)
		{
			currentCursorURL = url;
			Utils.loadImage(url, function(loader)
			{
				if (currentCursorURL == url)
				{
					Mouse.hide();
					deleteCurrentCursor();
					cursor.addChild(loader);
					loader.x = dx;
					loader.y = dy;
				}
			});
		});
		ExternalInterface.addCallback("clearCursor", function()
		{
			deleteCurrentCursor();
			Mouse.show();
			currentCursorURL = null;
		});
		ExternalInterface.addCallback("setCursorVisible", function(flag:Bool)
		{
			cursor.visible = flag;
		});
		root.addEventListener(MouseEvent.MOUSE_MOVE, function(event)
		{
			var dx:Float = root.mouseX - startMouseX;
			var dy:Float = root.mouseY - startMouseY;
			if ((dx*dx) + (dy*dy) > 6*6)
				pressTime = 0;
			Main.bumpFrameRate();
			repaintCursor();
		});
		ExternalInterface.addCallback("stopDragging", function()
		{
			isDragging = false;
			if (!isFluidMoving)
				isMoving = false;
		});
		ExternalInterface.addCallback("isDragging", function()
		{
			return isDragging;
		});
		var windowMouseMove = function(?event)
		{
			if (isDragging && !Main.draggingDisabled && (currentZ == Math.round(currentZ)))
			{
				isMoving = true;
                var c = Utils.getScale(draggedWindow.getCurrentZ());
				setCurrentPosition(
					startMapX - (root.mouseX - startMouseX)*c,
					startMapY + (root.mouseY - startMouseY)*c,
					currentZ
				);
			}
		};
		mapSprite.addEventListener(MouseEvent.MOUSE_MOVE, windowMouseMove);
		ExternalInterface.addCallback("resumeDragging", windowMouseMove);

		var initCalled = false;
		root.addEventListener(Event.ENTER_FRAME, function(event:Event)
		{
			if (!initCalled)
			{
				try {
					ExternalInterface.call(flash.Lib.current.root.loaderInfo.parameters.loadCallback, mapRoot.id);
					initCalled = true;
				} catch (e:Error) {  }
			}

			var w = stage.stageWidth;
			var h = stage.stageHeight;
			if ((w != (mapWindow.x2 - mapWindow.x1)) || (h != (mapWindow.y2 - mapWindow.y1)))
			{
				mapWindow.resize(0, 0, w, h);
				mapWindow.rootNode.callHandlersRecursively("onResize");
				viewportHasMoved = true;
				repaintCrosshair();
			}

			if (nextFrameCallbacks.length > 0)
			{
				for (func in nextFrameCallbacks)
					func();
				nextFrameCallbacks = new Array<Void->Void>();
			}

			if (viewportHasMoved)
			{
				for (window in MapWindow.allWindows)
				{
					if (isMoving && !wasMoving)
						window.repaintCacheBitmap();
					window.setCenter(currentX, currentY);
					window.setCacheBitmapVisible(isMoving);
					if (!isMoving)
					{
						window.rootNode.repaintRecursively(true);
						window.repaintCacheBitmap();
					}
				}
				mapWindow.rootNode.callHandlersRecursively("onMove");
				viewportHasMoved = false;
				wasMoving = isMoving;
			}
			else if (!isMoving)
				for (window in MapWindow.allWindows)
					window.rootNode.repaintRecursively(false);
			if (!isMoving)
				for (window in MapWindow.allWindows)
					window.repaintLabels();

			if ((Date.now().getTime() - Main.lastFrameBumpTime) > 2000)
			{
				if (stage.frameRate != 2)
					stage.frameRate = 2;
			}
		});


		ExternalInterface.marshallExceptions = true;

		ExternalInterface.addCallback("freeze", function() 
		{ 
			Main.draggingDisabled = true; 
		});
		ExternalInterface.addCallback("unfreeze", function() 
		{ 
			Main.draggingDisabled = false; 
		});
		ExternalInterface.addCallback("zoomBy", function(dz:Float, ?useMouse:Dynamic)
		{ 
			if (useMouse != null)
			{
				var sprite = getWindowUnderMouse().innerSprite;
				zoomBy(-dz, sprite.mouseX, sprite.mouseY);
			}
			else
				zoomBy(-dz, currentX, currentY);
		});
		ExternalInterface.addCallback("moveTo", function(x:Float, y:Float, z:Float)
		{
			Main.bumpFrameRate();
			setCurrentPosition(x, y, Math.round(17 - z));
		});
		ExternalInterface.addCallback("slideTo", function(x:Float, y:Float, z:Float)
		{
			Main.bumpFrameRate();
			fluidMoveTo(x, y, 17 - z, 10);
		});
		ExternalInterface.addCallback("getPosition", function() {
			var out:Dynamic = { };
			out.mouseX = mapWindow.innerSprite.mouseX;
			out.mouseY = mapWindow.innerSprite.mouseY;
			out.stageHeight = stage.stageHeight;
			out.x = currentX;
			out.y = currentY;
			out.z = currentZ;
			var extent:Dynamic = { };
			extent.minx = mapWindow.visibleExtent.minx;
			extent.maxx = mapWindow.visibleExtent.maxx;
			extent.miny = mapWindow.visibleExtent.miny;
			extent.maxy = mapWindow.visibleExtent.maxy;
			out.extent = extent;
			return out;
		});
		ExternalInterface.addCallback("getX", function() { return currentX;	});
		ExternalInterface.addCallback("getY", function() { return currentY; });
		ExternalInterface.addCallback("getZ", function() { return 17 - currentZ; });
		ExternalInterface.addCallback("getMouseX", function() { return mapWindow.innerSprite.mouseX; });
		ExternalInterface.addCallback("getMouseY", function() { return mapWindow.innerSprite.mouseY; });
		ExternalInterface.addCallback("isKeyDown", function(code) { return Key.isDown(code); });
		ExternalInterface.addCallback("setExtent", function(x1:Float, x2:Float, y1:Float, y2:Float)
		{
			minX = x1;
			minY = y1;
			maxX = x2;
			maxY = y2;
			setCurrentPosition(currentX, currentY, currentZ);
		});
		ExternalInterface.addCallback("setMinMaxZoom", function(z1:Float, z2:Float)
		{
			minZ = z1;
			maxZ = z2;
			setCurrentPosition(currentX, currentY, currentZ);
		});
		ExternalInterface.addCallback("setStyle", function(id:String, ?regularStyle:Dynamic, ?hoveredStyle:Dynamic)
		{
			Main.bumpFrameRate();
			getNode(id).setStyle(new Style(regularStyle), (hoveredStyle != null) ? new Style(hoveredStyle) : null);
		});
		
		ExternalInterface.addCallback("getStyle", function(id:String, removeDefaults:Bool)
		{
			return getNode(id).getStyle(removeDefaults);
		});
		
		ExternalInterface.addCallback("addMapWindow", function(callbackName:String) 
		{ 
			var lastCurrentZ:Float = -100, lastComputedZ:Float = 0;
			var window = new MapWindow(Utils.addSprite(root), function()
			{ 
				if (currentZ != lastCurrentZ)
				{
					lastCurrentZ = currentZ;
					lastComputedZ = 0;
					try {
						lastComputedZ = 17 - ExternalInterface.call(callbackName, 17 - currentZ);
					} catch (e:Error) {  }
				}
				return lastComputedZ;
			});
			window.innerSprite.addEventListener(MouseEvent.MOUSE_DOWN, windowMouseDown);
			window.innerSprite.addEventListener(MouseEvent.MOUSE_MOVE, windowMouseMove);
			// window.setCenter(currentX, currentY);
			return window.id;
		});
		ExternalInterface.addCallback("positionWindow", function(id:String, x1:Float, y1:Float, x2:Float, y2:Float) 
		{ 
			var window = MapWindow.allWindows.get(id);
			var w = stage.stageWidth;
			var h = stage.stageHeight;
			window.resize(x1*w, y1*h, x2*w, y2*h);
			window.setCenter(currentX, currentY);
		});
		ExternalInterface.addCallback("setBackgroundColor", function(id:String, color:Int)
		{ 
			if (id == mapRoot.id)
				id = mapWindow.rootNode.id;
			var window = MapWindow.allWindows.get(id);
			if (window != null)
				window.setBackgroundColor(color);
			if (window == mapWindow)
				repaintCrosshair();
		});
		ExternalInterface.addCallback("remove", function(id:String) 
		{ 
			getNode(id).remove(); 
		});
		ExternalInterface.addCallback("setBackgroundTiles", function(id:String, func:String, ?projectionCode:Int)
		{ 
			var node = getNode(id);
			var newContent = new RasterLayer(
				function(i:Int, j:Int, z:Int)
				{
					var out:String = '';
					try {
						out = ExternalInterface.call(func, i, j, z);
					} catch (e:Error) {  }
					return out;
				}
			);
			if ((node.content != null) && Std.is(node.content, VectorObject))
				newContent.setMask(cast(node.content, VectorObject).geometry);
			node.setContent(newContent);
			if (projectionCode == 1)
			{
				newContent.setDisplacement(
					function(x:Float) { return 0.0; },
					function(y:Float) { return y - Merc.y_ex(Merc.from_y(y), Merc.r_major); }
				);
			}
		});
		ExternalInterface.addCallback("setDisplacement", function(id:String, dx:Float, dy:Float)
		{
			cast(getNode(id).content, RasterLayer).setDisplacement(
				function(x:Float):Float { return dx; },
				function(y:Float):Float { return dy; }
			);
		});
		ExternalInterface.addCallback("setTileCaching", function(id:String, flag:Bool)
		{
			cast(getNode(id).content, RasterLayer).tileCaching = flag;			
		});		
		ExternalInterface.addCallback("setEditable", function(id:String) { getNode(id).setContent(new EditableContent()); });
		ExternalInterface.addCallback("startDrawing", function(id:String, type:String) { cast(getNode(id).content, EditableContent).startDrawing(type); });
		ExternalInterface.addCallback("stopDrawing", function(id:String) { cast(getNode(id).content, EditableContent).stopDrawing(); });
		ExternalInterface.addCallback("isDrawing", function(id:String):Bool { return (cast(getNode(id).content, EditableContent).stopDrawing != null); });
		ExternalInterface.addCallback("getIntermediateLength", function(id:String):Float { return cast(getNode(id).content, EditableContent).getIntermediateLength(); });
		ExternalInterface.addCallback("getCurrentEdgeLength", function(id:String):Float { return cast(getNode(id).content, EditableContent).getCurrentEdgeLength(); });
		
		var setLabel = function(id:String, label:String)
		{
			nextFrameCallbacks.push(function()
			{
				var node = getNode(id);
				if ((node != null) && Std.is(node.content, VectorObject))
				{
					cast(node.content, VectorObject).label = label;
					node.noteSomethingHasChanged();
				}
			});
		}
		ExternalInterface.addCallback("setLabel", setLabel);

		var addObject = function(parentId:String, ?geometry:Dynamic, ?properties:Dynamic)
		{
			var node:MapNode = getNode(parentId);
			if (node == null) return '';
			node = node.addChild();
			if (geometry != null)
				node.setContent(new VectorObject(Utils.parseGeometry(geometry)));
			node.properties = properties;
			return node.id;
		}
		
		ExternalInterface.addCallback("addObject", addObject);

		ExternalInterface.addCallback("addObjects", function(_data:Array<Dynamic>)
		{
			var ret = new Array<String>();
			for (i in 0...Std.int(_data.length))
			{
				var tId:String = addObject(_data[i].parentId, _data[i].geometry, _data[i].properties);
				if (_data[i].setStyle) {
					getNode(tId).setStyle(new Style(_data[i].setStyle.regularStyle), (_data[i].setStyle.hoveredStyle != null) ? new Style(_data[i].setStyle.hoveredStyle) : null);
				}
				if (_data[i].setLabel) {
					var node = getNode(tId);
					if ((node != null) && Std.is(node.content, VectorObject))
						cast(node.content, VectorObject).label = _data[i].setLabel;
				}
				ret.push(tId);
			}
			return ret;
		});
		
		ExternalInterface.addCallback("setFilter", function(id:String, ?sql:String)
		{
			var func:Hash<String>->Bool = (sql == null) ? 
				function(props:Hash<String>):Bool { return true; } :
				Parsers.parseSQL(sql);
			if (func != null)
			{
				getNode(id).setContent(new VectorLayerFilter(func));
				return true;
			}
			else
				return false;
		});
		var geometriesToSet = new Hash<Geometry>();
		ExternalInterface.addCallback("setGeometry", function(id:String, geometry_:Dynamic)
		{
			var geometry = Utils.parseGeometry(geometry_);
			geometriesToSet.set(id, geometry);
			nextFrameCallbacks.push(function()
			{
				geometriesToSet.remove(id);
				var node = getNode(id);
				if (node != null)
				{
					if ((node.content != null) && Std.is(node.content, MaskedContent))
					{
						cast(node.content, MaskedContent).setMask(geometry);
						node.noteSomethingHasChanged();
					}
					else if ((node.content != null) && Std.is(node.content, EditableContent))
					{
						cast(node.content, EditableContent).setGeometry(geometry);
					}
					else
						node.setContent(new VectorObject(geometry));
				}
			});
		});

		ExternalInterface.addCallback("setVisible", function(id:String, flag:Bool)
		{
			Main.bumpFrameRate();
			var node = getNode(id);
			node.setVisible(flag);
			if (node.parent != null)
				for (child in node.parent.children)
					if (Std.is(child.content, VectorLayerObserver))
						child.noteSomethingHasChanged();
		});
		var exportProperties = function(p_:Hash<String>):Dynamic
		{
			var p = {};
			if (p_ != null)
				for (key in p_.keys())
					Reflect.setField(p, key, p_.get(key));
			return p;
		}
		var propertiesToArray = function(props:Dynamic)
		{
			var ret = [];
			for (ff in Reflect.fields(props))
				ret.push([ff, Reflect.field(props, ff)]);
			return ret;
		}
		
		ExternalInterface.addCallback("removeHandler", function(id:String, eventName:String) 
		{ 
			var node:MapNode = getNode(id);
			node.removeHandler(eventName);
		});
		ExternalInterface.addCallback("setHandler", function(id:String, eventName:String, ?callbackName:String) 
		{ 
			var node:MapNode = getNode(id);
			node.setHandler(eventName, (callbackName == null) ? null : function(node2:MapNode)
			{
				var props:Dynamic;
				if (Std.is(node2.content, VectorLayerFilter))
				{
					var layer = cast(node2.content, VectorLayerFilter).layer;
					props = exportProperties(layer.lastId == null ? null : layer.geometries.get(layer.lastId).properties);
				}
				else
					props = node2.properties;

				var arr = propertiesToArray(props);
				if ((eventName == "onMouseOver") || (eventName == "onMouseOut") || (eventName == "onMouseDown")) {
					try {
						ExternalInterface.call(callbackName, node2.id, arr, eventAttr);
					} catch (e:Error) {  }
				}
				else
				{
					nextFrameCallbacks.push(function()
					{
						try {
							ExternalInterface.call(callbackName, node2.id, arr, eventAttr);
						} catch (e:Error) {  }
					});
				}
			}); 
			if ((eventName == "onMove") || (eventName == "onResize"))
				node.callHandler(eventName);
		});
		ExternalInterface.addCallback("getChildren", function(id:String):Array<Dynamic>
		{
			var ret = [];
			for (node in getNode(id).children)
			{
				ret.push({
					id: node.id,
					properties: propertiesToArray(node.properties)
				});
			}
			return ret;
		});
		ExternalInterface.addCallback("setZoomBounds", function(id:String, minZ:Int, maxZ:Int) 
		{ 
			getNode(id).setZoomBounds(minZ, maxZ);
		});
		ExternalInterface.addCallback("setActive_", function(id:String, flag:Bool)
		{
			var content = getNode(id).content;
			if (Std.is(content, VectorObject))
				cast(content, VectorObject).setActive(flag);
		});
		
		ExternalInterface.addCallback("setImageExtent", function(id:String, attr:Dynamic)
		{
			var node = getNode(id);
			var minX = Merc.x(attr.extent.minX);
			var maxX = Merc.x(attr.extent.maxX);
			var minY = Merc.y(attr.extent.minY);
			var maxY = Merc.y(attr.extent.maxY);
			
			var newContent = new RasterImage(attr.url, minX,maxY, maxX,maxY, maxX,minY, minX,minY, attr.noCache);
			if (attr.notSetPolygon == true) {
				newContent.setControlPoints(minX,maxY, maxX,maxY, maxX,minY, minX,minY);
			}
			if ((node.content != null) && Std.is(node.content, VectorObject))
				newContent.setMask(cast(node.content, VectorObject).geometry);
			node.setContent(newContent);
		});
		ExternalInterface.addCallback("setImage", function(id:String, url:String, 
			x1:Float, y1:Float, x2:Float, y2:Float, x3:Float, y3:Float, x4:Float, y4:Float,
			?tx1:Float, ?ty1:Float, ?tx2:Float, ?ty2:Float, ?tx3:Float, ?ty3:Float, ?tx4:Float, ?ty4:Float
		)
		{
			var node = getNode(id);
			var newContent = new RasterImage(url, x1, y1, x2, y2, x3, y3, x4, y4);
			if (tx1 != null)
				newContent.setControlPoints(tx1, ty1, tx2, ty2, tx3, ty3, tx4, ty4);
			if ((node.content != null) && Std.is(node.content, VectorObject))
				newContent.setMask(cast(node.content, VectorObject).geometry);
			node.setContent(newContent);
		});
		ExternalInterface.addCallback("clearBackgroundImage", function(id:String)
		{
			var node = getNode(id);
			var newContent = null;
			if (Std.is(node.content, MaskedContent))
			{
				var geom = cast(node.content, MaskedContent).maskGeometry;
				if (geom != null)
					newContent = new VectorObject(geom);
			}
			node.setContent(newContent);
		});
		ExternalInterface.addCallback("setVectorTiles", function(id:String, tileFunction:String, identityField:String, tiles:Array<Int>)
		{
			var content = new VectorLayer(identityField, function(i:Int, j:Int, z:Int):String
			{
				var out:String = '';
				try {
					out = ExternalInterface.call(tileFunction, i, j, z);
				} catch (e:Error) {  }
				return out;
			});
			for (i in 0...Std.int(tiles.length/3))
				content.addTile(tiles[i*3], tiles[i*3 + 1], tiles[i*3 + 2]);
			getNode(id).setContent(content);
		});
		ExternalInterface.addCallback("setTiles", function(id:String, tiles:Array<Int>)
		{
			var node = getNode(id);
			if (node != null && node.content != null && Std.is(node.content, VectorLayer)) {
				var layer = cast(node.content, VectorLayer);
				for (i in 0...Std.int(tiles.length/3))
					layer.addTile(tiles[i*3], tiles[i*3 + 1], tiles[i*3 + 2]);
				layer.createLoader(null);
			}
		});
		ExternalInterface.addCallback("getStat", function(id:String)
		{
			var out:Dynamic = {};
			var node = getNode(id);
			if (node != null && node.content != null && Std.is(node.content, VectorLayer)) {
				var layer = cast(node.content, VectorLayer);
				out = layer.getStat();
			}
			return out;
			
		});		
		ExternalInterface.addCallback("observeVectorLayer", function(id:String, layerId:String, func:String)
		{
			var layer = cast(getNode(layerId).content, VectorLayer);
			getNode(id).setContent(new VectorLayerObserver(
				layer,
				function(id:String, flag:Bool)
				{
					var geom = layer.geometries.get(id);
					try {
						ExternalInterface.call(
							func,
							geom.export(),
							exportProperties(geom.properties),
							flag
						);
					} catch (e:Error) {  }
				}
			));
		});

		ExternalInterface.addCallback("bringToTop", function(id:String) 
		{
			var node = getNode(id);
			var n = node.rasterSprite.parent.numChildren - 1;
			node.bringToDepth(n);
			return n;
		});
		ExternalInterface.addCallback("bringToBottom", function(id:String) 
		{ 
			getNode(id).bringToDepth(0);
		});
		ExternalInterface.addCallback("bringToDepth", function(id:String, n:Int) 
		{ 
			var node = getNode(id);
			if(n < 0) n = 0;
			else if(n > node.rasterSprite.parent.numChildren - 1) n = node.rasterSprite.parent.numChildren - 1;
			node.bringToDepth(n);
			return n;
		});
		var getGeometry = function(id:String):Geometry
		{
			if (geometriesToSet.exists(id))
				return geometriesToSet.get(id);
			var content = getNode(id).content;
			if (Std.is(content, VectorObject))
				return cast(content, VectorObject).geometry;
			else if (Std.is(content, EditableContent))
				return cast(content, EditableContent).getGeometry();
			else if (Std.is(content, MaskedContent))
				return cast(content, MaskedContent).maskGeometry;
			else if (Std.is(content, VectorLayerFilter))
			{
				var layer = cast(content, VectorLayerFilter).layer;
				return layer.geometries.get(layer.lastId);
			}
			else
				return new Geometry();
		}
		ExternalInterface.addCallback("getGeometry", function(id:String) { return getGeometry(id).export(); });
		ExternalInterface.addCallback("getLength", function(id:String) { return getGeometry(id).getLength(); });
		ExternalInterface.addCallback("getArea", function(id:String) { return getGeometry(id).getArea(); });
		ExternalInterface.addCallback("getGeometryType", function(id:String) { return getGeometry(id).export().type; });
		ExternalInterface.addCallback("getCenter", function(id:String) { return [0.0, 0.0]; });
		ExternalInterface.addCallback("addChildRoot", function(id:String) { return getNode(id).addChild().id; });
		ExternalInterface.addCallback("print", function()
		{
			var data:BitmapData = new BitmapData(stage.stageWidth, stage.stageHeight, false, 0xFFFFFFFF);
			data.draw(root);
			PrintManager.setPrintableContent(data);
		});
		var fileRef:FileReference;
		ExternalInterface.addCallback("savePNG", function(fileName:String)
		{
			try {
			var data:BitmapData = new BitmapData(stage.stageWidth, stage.stageHeight, false, 0xFFFFFFFF);
			data.draw(root);
			fileRef = new FileReference();
			fileRef.save(PNGEncoder.encode(data), fileName);
			} catch (e:Error) { trace(e); }
		});
		ExternalInterface.addCallback("setGridVisible", function(flag)
		{
			Main.bumpFrameRate();
			grid.setVisible(flag);
		});
		ExternalInterface.addCallback("getGridVisibility", function() { return grid.getVisibility(); });
		
		ExternalInterface.addCallback("getVisibility", function(id:String) { return getNode(id).getVisibility(); });
		ExternalInterface.addCallback("getFeatures", function(id:String, geom:Dynamic, func:String)
		{
			var ret = new Hash<Bool>();
			var queryGeom = Utils.parseGeometry(geom);
			var queryExtent = queryGeom.extent;
			var layer = cast(getNode(id).content, VectorLayer);
			layer.createLoader(
				function(tile:VectorTile, tilesRemaining:Int)
				{
					for (i in 0...tile.ids.length)
					{
						var id = tile.ids[i];
						var geom = tile.geometries[i];
						if (Std.is(geom, PointGeometry))
						{
							var p = cast(geom, PointGeometry);
							if (queryGeom.distanceTo(p.x, p.y) == 0)
								ret.set(id, true);
						}
						else if (queryExtent.overlaps(geom.extent))
							ret.set(id, true);
					}
		
					if (tilesRemaining == 0)
					{
						var geoms = new Array<String>();
						var props = new Array<Dynamic>();
						for (id in ret.keys())
						{
							var geom = layer.geometries.get(id);
							geoms.push(geom.export());
							props.push(exportProperties(geom.properties));
						}
						try {
							ExternalInterface.call(func, geoms, props);
						} catch (e:Error) {  }
					}
				}
			)(queryExtent);
		});
		ExternalInterface.addCallback("getFeatureById", function(id:String, fid:String, func:String)
		{
			var layer = cast(getNode(id).content, VectorLayer);
			var extent = new Extent();
			var ww = Utils.worldWidth;
			extent.update(-ww, -ww);
			extent.update(ww, ww);
			layer.createLoader(
				function(tile:VectorTile, tilesRemaining:Int)
				{
					if (tilesRemaining == 0)
					{
						var geom = layer.geometries.get(fid);
						try {
							ExternalInterface.call(func, geom.export(), exportProperties(geom.properties));
						} catch (e:Error) {  }
					}
				}
			)(extent);
		});
		var getFeatureGeometry = function(objectId:String, featureId:String):Geometry { return cast(getNode(objectId).content, VectorLayer).geometries.get(featureId); }
		ExternalInterface.addCallback("getFeatureGeometry", function(objectId:String, featureId:String) { return getFeatureGeometry(objectId, featureId).export(); });
		ExternalInterface.addCallback("getFeatureLength", function(objectId:String, featureId:String) { return getFeatureGeometry(objectId, featureId).getLength(); });
		ExternalInterface.addCallback("getFeatureArea", function(objectId:String, featureId:String) { return getFeatureGeometry(objectId, featureId).getArea(); });
		ExternalInterface.addCallback("flip", function(objectId:String):Int 
		{ 
			var content = getNode(objectId).content;
			if (Std.is(content, VectorLayerFilter))
				return cast(content, VectorLayerFilter).layer.flip(); 
			else
				return 0;
		});
		ExternalInterface.addCallback("setQuality", function(quality) { stage.quality = quality; });
		ExternalInterface.addCallback("trace", function(x:Dynamic) { trace(x); });

		ExternalInterface.addCallback("addContextMenuItem", function(text:String, func:String)
		{
			var item = new ContextMenuItem(text);
			item.addEventListener(ContextMenuEvent.MENU_ITEM_SELECT, function(event)
			{
				try {
					ExternalInterface.call(func, mapWindow.innerSprite.mouseX, mapWindow.innerSprite.mouseY);
				} catch (e:Error) {  }
			});
			root.contextMenu.customItems.push(item);
		});


		/*var s = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNMёйцукенгшщзхъфывапролджэячсмитьбюЁЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ `1234567890-=[];',./~!@#$%^&*()_+{}:<>?№»«";
		var ascii = "";
		for (i in 0...s.length)
			ascii += '&#' + s.charCodeAt( i ) + ';'; 
		ExternalInterface.call("prompt", "glyphs:", ascii);*/
	}
}