import flash.display.Shape;
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
//import flash.geom.Rectangle;
import flash.geom.Matrix;
import flash.printing.PrintJob;
import flash.printing.PrintJobOptions;
import flash.utils.Timer;
import flash.utils.ByteArray;
import flash.events.TimerEvent;

import flash.net.URLLoader;
import flash.net.URLRequest;
import flash.net.URLRequestMethod;
import flash.net.URLRequestHeader;

class Main
{
	public static var registerMouseDown:MapNode->MouseEvent->MapNode->Void;
	public static var refreshMap:Void->Void;			// Принудительный Refresh карты
	public static var chkStatus:Void->Dynamic;			// Текущие статусы карты
	public static var needRefreshMap:Bool = false;		// Флаг необходимости обновления карты
	
	static var flashUrlKey:String = '';					// Ключ сессии SWF
	public static var useFlashLSO:Bool = false;			// Использовать SharedObject
	public static var multiSessionLSO:Bool = false;		// Использовать SharedObject между сессиями
	public static var compressLSO:Bool = false;			// Сжатие SharedObject
	public static var flashStartTimeStamp:Float = 0;	// timeStamp загрузки SWF

	public static var isFluidZoom:Bool = false;			// Глобальный признак режима FluidZoom
	public static var isDrawing:Bool = false;			// Глобальный признак режима рисования
	public static var isDraggingNow:Bool = false;		// Глобальный признак Drag режима
	public static var draggingDisabled:Bool = false;
	public static var clickingDisabled:Bool = false;
	public static var mousePressed:Bool = false;
	public static var eventAttr:Dynamic = {};
	public static var clusterPointsViewer:ClusterPointsViewer = null;
	public static var removeClusterPointsViewer:MouseEvent->Void;		// Удаление ClusterPointsViewer
	public static var getMousePos:Void->Dynamic;		// Получить позицию мыши

	public static var messBuffToJS:Array<Dynamic> = new Array<Dynamic>();
	static var frameRate:Int = 40;			// максимальный frameRate

	// Команды от SWF в JS
	public static function cmdToJS(cmd:String, ?p1:Dynamic, ?p2:Dynamic, ?p3:Dynamic, ?eventName:String):Dynamic
	{
		var ret = null;
		//try {
			if(p1 == null) p1 = '';
			if(p2 == null) p2 = '';
			if(p3 == null) p3 = '';
			ret = ExternalInterface.call(cmd, p1, p2, p3);
			//trace(cmd + ' : ' + p1 + ' : ' + p2 + ' : ' + p3);
		//} catch (e:Error) {  }
		return ret;
	}
	
	static var lastFrameBumpTime:Float = 0;
	public static function bumpFrameRate()
	{
		lastFrameBumpTime = Date.now().getTime();
		var stage = flash.Lib.current.stage;
		if (stage.frameRate != frameRate)
			stage.frameRate = frameRate;
	}

	public static function chkEventAttr(event:MouseEvent)
	{
		eventAttr = { };
		if (event.shiftKey) eventAttr.shiftKey = 1;
		if (event.ctrlKey) eventAttr.ctrlKey = 1;
		if (event.altKey) eventAttr.altKey = 1;
		if (event.buttonDown) eventAttr.buttonDown = 1;
	}

	public static function dispatchMouseLeave()
	{
		flash.Lib.current.stage.dispatchEvent (new Event(Event.MOUSE_LEAVE));
	}

	static function main()
	{
		var needOnMoveEnd:Bool = false;
		var needCacheBitmap:Bool = false;
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

		flashStartTimeStamp = Date.now().getTime();
		for (fKey in Reflect.fields(root.loaderInfo.parameters)) {
			var val:String = Reflect.field(root.loaderInfo.parameters, fKey);
			if (fKey == 'useFlashLSO') useFlashLSO = (val == 'true' ? true : false);
			else if (fKey == 'multiSessionLSO') multiSessionLSO = (val == 'true' ? true : false);
			else if (fKey == 'compressLSO') compressLSO = (val == 'true' ? true : false);
			else if (val == '') flashUrlKey = fKey;
		}

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
		mapSprite.name = 'mapSprite';
		var mapWindow = new MapWindow(mapSprite, function() { return currentZ; });
		var crosshair = Utils.addSprite(root);
		crosshair.name = 'crosshair';
		crosshair.mouseEnabled = crosshair.mouseChildren = false;
		var mapRoot = mapWindow.rootNode.addChild('mapRoot');
		var grid = mapWindow.rootNode.addChild('grid');
		grid.setVisible(false);
		nextFrameCallbacks.push(function() { grid.setContent(new GridContent()); });
		mapWindow.setCenter(currentX, currentY);

		var viewportHasMoved = false;
		
		var getNode = function(id) { return MapNode.allNodes.get(id); }
		var constrain = function(a:Float, t:Float, b:Float) { return (t < a) ? a : (t > b) ? b : t; }
		
		Main.getMousePos = function():Dynamic
		{
			var pos:Dynamic = { };
			pos.mouseX = root.mouseX;
			pos.mouseY = root.mouseY;
			return pos;
		}
		
		var dispatchEventPosition = function()
		{
			var pos:Dynamic = { };
			pos.currentX = currentX;
			pos.currentY = currentY;
			pos.currentZ = currentZ;
			stage.dispatchEvent( new APIEvent(APIEvent.CUSTOM_EVENT, pos) );
		}

		stage.addEventListener( 'chkLayerVersion', function(attr:Dynamic)		// событие проверки версии слоя
		{
			Main.cmdToJS('gmxAPI.swfWarning', attr.data);
		} );		

		var setCurrentPosition = function(x, y, z)
		{
			var ww = Utils.worldWidth;
			if(ww < maxX) currentX = constrain(-100000000, x, 100000000);
			else currentX = constrain(minX, x,  maxX);
			if(mapWindow.cacheBitmap != null && !mapWindow.cacheBitmap.visible) {
				currentX %= 2 * ww;
				if (currentX > ww) currentX -= 2*ww;
				else if (currentX < -ww) currentX += 2*ww;
			}
			currentY = constrain(minY, y, maxY);
			currentZ = constrain(minZ, z, maxZ);
			viewportHasMoved = true;
			Main.needRefreshMap = true;
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

		
		var onMoveEnd = function(?event:MouseEvent)
		{
			mapWindow.rootNode.callHandlersRecursively("onMoveEnd");
			dispatchEventPosition();
			Main.needRefreshMap = true;
		}
		
		var isFluidMoving:Bool = false;
		var fluidTargetZ:Float = 0;
		var stopFluidMove:Void->Void = null;
		var fluidMoveTo = function(newX:Float, newY:Float, newZ:Float, steps:Int)
		{
			if (isFluidMoving)
				return;
			mapWindow.setCacheBitmapVisible(true);
			steps = 5;
			var oldX:Float = currentX;
			var oldY:Float = currentY;
			var oldZ:Float = currentZ;
			fluidTargetZ = newZ;
			var t:Float = 0;
			Main.isFluidZoom = isFluidMoving = true;
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
					//mapWindow.rootNode.callHandlersRecursively("onMoveEnd");
					dispatchEventPosition();
					needOnMoveEnd = true;
					Main.needRefreshMap = true;
					mapWindow.setCacheBitmapVisible(false);
					Main.isFluidZoom = false;
				}
				mapWindow.setCenter(currentX, currentY);
			}
			root.addEventListener(Event.ENTER_FRAME, listener);
			stopFluidMove = function()
			{
				root.removeEventListener(Event.ENTER_FRAME, listener);
				isFluidMoving = false;
				stopFluidMove = null;
				Main.isDrawing = false;
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
		var nodeFrom:MapNode = null;	// Нода над которой находится мышь

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
			fluidMoveTo(mx + k*(currentX - mx), my + k*(currentY - my), newZ, 5);
		}
		
		Main.registerMouseDown = function(node:MapNode, ?event:MouseEvent, ?nodeFrom_:MapNode)
		{
			if (event != null) {
				Main.chkEventAttr(event);
				if (nodeFrom_ != null) eventAttr.nodeFilter = node.id;
			}

			if (Key.isDown(16) && ExternalInterface.call("kosmosnimkiBeginZoom"))
			//if (Key.isDown(16) && Main.cmdToJS("kosmosnimkiBeginZoom"))
				clickedNode = node;
			else if ((node.getHandler("onMouseDown") != null) || (node.getHandler("onMouseUp") != null) || (node.getHandler("onClick") != null))
			{
				nodeFrom = nodeFrom_;
				node.callHandler("onMouseDown", nodeFrom);
				clickedNode = node;
			}
		}
		root.addEventListener(MouseEvent.MOUSE_WHEEL, function(event:MouseEvent)
		{ 
			var sprite = getWindowUnderMouse().innerSprite;
			zoomBy((event.delta > 0) ? 1 : -1, sprite.mouseX, sprite.mouseY);
		});
		
		var onMoveBegin = function(?event:MouseEvent)
		{
			//Main.bumpFrameRate();
			mapWindow.rootNode.callHandlersRecursively("onMoveBegin");
		}

		var repaintCacheBitmap = function()
		{
			mapWindow.rootNode.repaintRecursively(true);
			//if(mapWindow.onUpdated) {
				mapWindow.cacheRepaintNeeded = true;
				mapWindow.repaintCacheBitmap();
			//}
			//mapWindow.onUpdated = false;
			mapWindow.setCacheBitmapVisible(true);		// Если Drag или Move режим - показываем CacheBitmap
		}

		var windowMouseDown = function(event)
		{
			if (!Main.draggingDisabled && clusterPointsViewer == null)
			{
				isDragging = true;
				Main.isDraggingNow = true;
				draggedWindow = getWindowUnderMouse();
				startMouseX = root.mouseX;
				startMouseY = root.mouseY;
				startMapX = currentX;
				startMapY = currentY;
			}
			//Main.bumpFrameRate();
			//Main.mousePressed = true;
		};
		//mapSprite.addEventListener(MouseEvent.MOUSE_DOWN, windowMouseDown);
		root.addEventListener(MouseEvent.MOUSE_DOWN, function(event)
		{
			windowMouseDown(event);
			pressTime = flash.Lib.getTimer();
			mapWindow.setCenter(currentX, currentY);
//			repaintCacheBitmap();
			Main.mousePressed = true;
			needCacheBitmap = true;
			Main.bumpFrameRate();
			onMoveBegin(event);
		});
		
		var chkClusterPointsViewer = function(vlf:VectorLayerFilter):Bool
		{
			if (vlf.clusterAttr.clusterView == null) return false;
			if (vlf.layer.lastGeometry == null) return false; // пред.геометрия
			var centrGeometry:PointGeometry = cast(vlf.layer.lastGeometry, PointGeometry);
			var members:Array<PointGeometry> = centrGeometry.propHiden.get('_members');
			if (members == null || members.length == 1) return false;
			var maxMembers:Int = (vlf.clusterAttr.clusterView.maxMembers == null ? 10 : cast(vlf.clusterAttr.clusterView.maxMembers));
			if (members.length > maxMembers) return false;

			if(clusterPointsViewer == null) {
				var nodeParent:MapNode = getNode(vlf.layer.mapNode.id);
				if (nodeParent == null) return false;
				var node:MapNode = nodeParent.addChild();
				clusterPointsViewer = new ClusterPointsViewer(vlf);
				node.setContent(clusterPointsViewer);
			}
			else
			{
				Main.removeClusterPointsViewer(null);
			}
			return true;
		}
		Main.removeClusterPointsViewer = function(?event:MouseEvent)
		{
			if (clusterPointsViewer == null) return;
			if (clusterPointsViewer.vlFilter.clusterAttr.hideFixedBalloons != null) { //удалить фиксированные балуны
				var name:String = clusterPointsViewer.vlFilter.clusterAttr.hideFixedBalloons;
				nextFrameCallbacks.push(function() { Main.cmdToJS(name);	});
			}
			clusterPointsViewer.remove();
			clusterPointsViewer = null;
			nodeFrom = null;
			clickedNode = null;
			isDragging = false;
			Main.isDraggingNow = false;
			mapWindow.rootNode.noteSomethingHasChanged();
			//Main.draggingDisabled = false;
			//viewportHasMoved = true;
		}
		
		root.addEventListener(MouseEvent.MOUSE_UP, function(event)
		{
			Main.mousePressed = false;
			mapWindow.setCacheBitmapVisible(false);		// Если Drag или Move режим - показываем CacheBitmap
			if (event != null) {
				Main.chkEventAttr(event);
			}
			needCacheBitmap = false;
			Main.isDraggingNow = false;
			isDragging = false;
			if (!isFluidMoving)
			{
				isMoving = false;
				viewportHasMoved = true;	// вьюпорт не двигался
			}
			if (clickedNode != null)
				clickedNode.callHandler("onMouseUp", nodeFrom);
			if ((flash.Lib.getTimer() - pressTime) < 300)
			{
				if (clickedNode != null)
				{
					if (Std.is(clickedNode.content, VectorLayerFilter))
					{
						var vlFilter:VectorLayerFilter = cast(clickedNode.content, VectorLayerFilter);
						if (vlFilter.clusterAttr != null) {
							eventAttr.objType = 'cluster';
							if(chkClusterPointsViewer(vlFilter)) return;
						}
					}
					clickedNode.callHandler("onClick", nodeFrom);
				}
				else if (!Main.clickingDisabled)
				{
					var sprite = draggedWindow.innerSprite;
					setCurrentPosition(sprite.mouseX, sprite.mouseY, currentZ);
					//fluidMoveTo(sprite.mouseX, sprite.mouseY, currentZ, 10);
				}
			}
			nodeFrom = null;
			clickedNode = null;
			setCurrentPosition(currentX, currentY, currentZ);
		});
		var cursor:Sprite = Utils.addSprite(root);
		cursor.name = 'cursor';
		cursor.mouseEnabled = cursor.mouseChildren = false;
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
		var windowMouseMove = function(?event:MouseEvent)
		{
			if (isDragging && !Main.draggingDisabled && (currentZ == Math.round(currentZ)))
			{
				// Происходит Drag карты
//				isMoving = true;
                var c = Utils.getScale(draggedWindow.getCurrentZ());
                var px = startMapX - (root.mouseX - startMouseX)*c;
                var py = startMapY + (root.mouseY - startMouseY)*c;
				setCurrentPosition(px, py, currentZ);
			}
		};

		mapSprite.addEventListener(MouseEvent.MOUSE_MOVE, windowMouseMove);
		root.addEventListener(MouseEvent.MOUSE_MOVE, function(event:MouseEvent)
		{
			Main.bumpFrameRate();
			//windowMouseMove(event);
			var dx:Float = root.mouseX - startMouseX;
			var dy:Float = root.mouseY - startMouseY;
			if ((dx*dx) + (dy*dy) > 6*6)
				pressTime = 0;
			repaintCursor();
			//if (!Main.isDraggingNow)	event.stopImmediatePropagation();
			if (!Main.draggingDisabled && event.buttonDown && needCacheBitmap) {		// При нажатой мышке и needCacheBitmap
				needCacheBitmap = false;
				Main.mousePressed = false;
				repaintCacheBitmap();
				Main.mousePressed = true;
				needOnMoveEnd = true;
			}
		});

		Main.chkStatus = function():Dynamic
		{
			return { isDragging: isDragging };
		}

		Main.refreshMap = function()
		{
			//viewportHasMoved = true;
			for (window in MapWindow.allWindows)
			{
				//if (isMoving && !wasMoving)
					//window.repaintCacheBitmap();
				window.setCenter(currentX, currentY);
				//window.setCacheBitmapVisible(isMoving || isDragging);		// Если Drag или Move режим - показываем CacheBitmap
				if (!isMoving)
				{
//trace('refreshMap _____________ ' + ' : ' + currentX + ' : ' + currentY + ' : ' + isMoving + ' : ' + Main.mousePressed + ' : ' +  flash.Lib.getTimer());
					window.rootNode.repaintRecursively(true);
					//window.repaintCacheBitmap();
				}
			}
			mapWindow.repaintCacheBitmap();
		}

		// текущее положение карты
		var getPosition = function():Dynamic
		{
			var res:Dynamic = { };
			res.mouseX = mapWindow.innerSprite.mouseX;
			res.mouseY = mapWindow.innerSprite.mouseY;
			res.stageHeight = stage.stageHeight;
			res.stageWidth = stage.stageWidth;
			res.x = currentX;
			res.y = currentY;
			res.z = currentZ;
			if (Main.mousePressed) res.mousePressed = Main.mousePressed;
			var extent:Dynamic = { };
			extent.minx = mapWindow.visibleExtent.minx;
			extent.maxx = mapWindow.visibleExtent.maxx;
			extent.miny = mapWindow.visibleExtent.miny;
			extent.maxy = mapWindow.visibleExtent.maxy;
			res.extent = extent;
			eventAttr.currPosition = res;			
			return res;
		}

		var initCalled = false;
		var needCallMoveHandler = 0.;
		var curTimer = 0.;
		var callHandlers = function(evName:String)
		{
			if(evName == 'onMove') {
				mapWindow.rootNode.callHandlersRecursively(evName);
				needCallMoveHandler = 0;
			}
		}
		stage.addEventListener(Event.ENTER_FRAME, function(event:Event)
		{
//var bTime = flash.Lib.getTimer();
			if (!initCalled)
			{
				try {
					Main.cmdToJS(flash.Lib.current.root.loaderInfo.parameters.loadCallback, mapRoot.id);
					initCalled = true;
				} catch (e:Error) {  }
			}
			var curTimerNew = Date.now().getTime();

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
				for (func in nextFrameCallbacks) {
					try { func(); } catch (e:Error) { } // Error при удаленных в JS callback
				}
				nextFrameCallbacks = new Array<Void->Void>();
			}
			if(!Main.isFluidZoom) {

				if (!Main.draggingDisabled && (viewportHasMoved || Main.needRefreshMap))
				{
					Main.refreshMap();
					Main.needRefreshMap = false;
				} else if(Main.draggingDisabled) {
					mapWindow.rootNode.repaintRecursively(false);
				}

				if (viewportHasMoved)
				{
					if(needCallMoveHandler == 0) needCallMoveHandler = curTimerNew + 40;
					viewportHasMoved = false;
					wasMoving = isMoving;
				}
/*			
			else if (!isMoving)
//trace('refreshMap ____1_________ ' + ' : ' + isMoving + ' : ' + Main.mousePressed + ' : ' +  flash.Lib.getTimer());
				for (window in MapWindow.allWindows) {
					//window.rootNode.repaintRecursively(false);
				}
*/

				if (!isMoving && !isDragging && !Main.draggingDisabled)
					mapWindow.repaintLabels();
			}
			curTimer = curTimerNew;
			var onMoveFlag:Bool = (needCallMoveHandler > 0 && (needCallMoveHandler < curTimerNew || Main.draggingDisabled));
			if (onMoveFlag) {
				callHandlers('onMove');
				if (needOnMoveEnd && !Main.mousePressed) {
//trace('_______onMoveEnd________ ' + needOnMoveEnd + ' : ' + mapWindow.id + ' : ' + mapWindow.rootNode.getHandler('onMoveEnd') + ' : ' + Main.mousePressed);
					onMoveEnd();
					needOnMoveEnd = false;
				}
			}

			if (!Main.mousePressed && (curTimer - Main.lastFrameBumpTime) > 2000)
			//if ((curTimer - Main.lastFrameBumpTime) > 2000)
			{
				//mapWindow.cacheRepaintNeeded = true;
				mapWindow.repaintCacheBitmap();
				if (stage.frameRate != 2)
					stage.frameRate = 2;

				if(Main.messBuffToJS.length > 0) {
					Main.cmdToJS('gmxAPI.swfWarning', Main.messBuffToJS);
					Main.messBuffToJS = [];
				}
			}
//bTime = flash.Lib.getTimer() - bTime;
//var st:String = ' : ' + Main.draggingDisabled + ' время: ' + bTime / 1000 + ' сек.' + mapWindow.cacheBitmap.visible;
//if(bTime > 10) trace('vvvvvvvvvvvvv ' + st);
		});


		ExternalInterface.marshallExceptions = true;

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

		var propertiesToHashString = function(props:Dynamic)
		{
			var ret = new Hash<String>();
			for (ff in Reflect.fields(props)) {
				ret.set(ff, Reflect.field(props, ff));
			}
			return ret;
		}

		var geometriesToSet = new Hash<Geometry>();
		function setGeometry(id:String, geometry_:Dynamic)
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
					Main.needRefreshMap = true;
					Main.bumpFrameRate();
				}
			});
			Main.bumpFrameRate();
		}
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
		var hashToArray = function(p_:Hash<String>)
		{
			var p = [];
			if (p_ != null)
				for (pkey in p_.keys()) {
					var zn = p_.get(pkey);
					p.push([pkey, zn]);
				}
			return p;
		}

		function setHandler(id:String, eventName:String, ?callbackName:String)
		{ 
			var node:MapNode = getNode(id);
//trace('_______________ ' + eventName + ' : ' + id + ' : ' + callbackName);

			node.setHandler(eventName, (callbackName == null) ? null : function(node2:MapNode, ?nodeFrom_:MapNode, ?data_:Dynamic)
			{
//trace('ssss22sss ' + eventName + ' : ' + callbackName + ' : ' + id + ' : ' + flash.Lib.getTimer());
				var props:Dynamic;
				if (data_ != null)
				{
					eventAttr.data = data_;
				}
				if (Std.is(node2.content, VectorLayerFilter))
				{
					if(nodeFrom_ == null) {
						var vlFilter = cast(node2.content, VectorLayerFilter);
						if (vlFilter.clusterAttr != null) eventAttr.objType = 'cluster';
						var geom = vlFilter.layer.lastGeometry;
						props = exportProperties(geom != null ? geom.properties : null);
					} else {
						props = nodeFrom_.properties;
						eventAttr.nodeFilter = nodeFrom_.id;
					}
				}
				else if (Std.is(node2.parent.content, ClusterPointsViewer))
				{
					props = exportProperties(node2.properties);
					eventAttr.objType = 'cluster';
				}
				else
				{
					props = node2.properties;
				}
				var arr = propertiesToArray(props);
				if(arr.length == 0) arr = null;

				if (eventName == "onMove") getPosition();
				if ((eventName == "onMouseOver")
					|| (eventName == "onTileLoaded")
					|| (eventName == "onTileLoadedURL")
					|| (eventName == "onMove")
					|| (eventName == "onMoveBegin")
					|| (eventName == "onMouseMove")
					|| (eventName == "onMoveEnd")
					|| (eventName == "onMouseOut")
					|| (eventName == "onMouseDown")) {
					Main.cmdToJS(callbackName, node2.id, arr, eventAttr, eventName);
					//|| (eventName == "onNodeMouseOver")	|| (eventName == "onNodeMouseOut") || (eventName == "onEdgeMouseOut") || (eventName == "onEdgeMouseOver") || (eventName == "onFinish") || (eventName == "onEdit") || (eventName == "onRemove")
				}
				else
				{
					var pID:String = node2.id;
					nextFrameCallbacks.push(function()
					{
						Main.cmdToJS(callbackName, pID, arr, eventAttr);
					});
				}
			}); 
			if ((eventName == "onMove") || (eventName == "onResize"))
				node.callHandler(eventName);
		};
		
		var getGeometry = function(id:String):Geometry
		{
			if (geometriesToSet.exists(id)) {
				return geometriesToSet.get(id);
			}
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
				var out = layer.geometries.get(layer.lastId);
				if (out == null && layer.lastGeometry != null) out = layer.lastGeometry;
				if (out == null) {
					var node = getNode(layer.lastId);
					if (node != null) out = cast(node.content, VectorObject).geometry;
				}
				return out;
			}
			else
				return new Geometry();
		}
		
		// Сохранение изображения карты в файл
		var savePNG = function(fileName:String)
		{
			try {
				var data:BitmapData = new BitmapData(stage.stageWidth, stage.stageHeight, false, 0xFFFFFFFF);
				data.draw(root);
				var fileRef:FileReference = new FileReference();
				fileRef.save(PNGEncoder.encode(data), fileName);
			} catch (e:Error) { trace(e); }
		};

		// Сохранение изображения карты на сервер
		var sendPNGFile = function(attr:Dynamic):String
		{
			try {
				var gridHidden:Bool = grid.hidden;
				var gridVisibility:Bool = (!attr.notSetGridVisible && gridHidden ? true : false);
				if (gridVisibility) {
					grid.hidden = false;
					grid.vectorSprite.visible = true;
					grid.content.paintLabels();
				}
				var data:BitmapData = new BitmapData(stage.stageWidth, stage.stageHeight, false, 0xFFFFFFFF);
				data.draw(root);
				if (gridVisibility) {
					grid.vectorSprite.visible = !gridHidden;
					grid.setVisible(!gridHidden);
				}
				var pngData:ByteArray = PNGEncoder.encode(data);
				
				var base64:Bool = (attr.getBase64 ? true : false);
				if(base64) return Base64.encode64(pngData, true);
				
				var loader:URLLoader = new URLLoader();
				var header:URLRequestHeader = new URLRequestHeader("Content-type", "application/octet-stream");
				var request:URLRequest = new URLRequest(attr.url);
				request.requestHeaders.push(header);
				request.method = URLRequestMethod.POST;
				request.data = pngData;
				loader.addEventListener(Event.COMPLETE, function(event:Event) {
					var st:String = loader.data;
					if (attr.func != null) Main.cmdToJS(attr.func, st);
				});
				loader.load(request);
			} catch (e:Error) { trace(e); }
			return '';
		}
		
		function setVisible(id:String, flag:Bool)
		{
			//Main.bumpFrameRate();
			var node = getNode(id);
			node.setVisible(flag);
			if (node.parent != null)
				for (child in node.parent.children)
					if (Std.is(child.content, VectorLayerObserver))
						child.noteSomethingHasChanged();
			Main.needRefreshMap = true;
		}
		
		function setZoomBounds(id:String, minZ:Int, maxZ:Int):Dynamic
		{
			Main.needRefreshMap = true;
			return getNode(id).setZoomBounds(minZ, maxZ);
		}

		function setClusters(id:String, data:Dynamic):Dynamic
		{
			var node = getNode(id);
			if (node == null || node.content == null || !Std.is(node.content, VectorLayerFilter)) return null;
			var ret = cast(node.content, VectorLayerFilter).setClusters(data);
			node.noteSomethingHasChanged();
			Main.needRefreshMap = true;
			return ret;
		}

		function delClusters(id:String):Dynamic
		{
			var node = getNode(id);
			if (node == null || node.content == null || !Std.is(node.content, VectorLayerFilter)) return null;
			return cast(node.content, VectorLayerFilter).delClusters();
		}

		function getDepth(id:String):Dynamic
		{
			var node = getNode(id);
			if (node == null) return null;
			return node.getDepth();
		}

		function getChildren(id:String):Array<Dynamic>
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
		}
		
		function addObject(parentId:String, ?geometry:Dynamic, ?properties:Dynamic):String
		{
			var nodeParent:MapNode = getNode(parentId);
			if (nodeParent == null) return '';
			var node:MapNode = nodeParent.addChild();
			node.properties = properties;
			node.propHash = propertiesToHashString(properties);
			if (geometry != null) {
				var geom = Utils.parseGeometry(geometry);
				geom.properties = node.propHash;
				node.setContent(new VectorObject(geom));
				Main.needRefreshMap = true;
			}
			return node.id;
		}

		function addObjects(_data:Array<Dynamic>, ?parentId:String):Array<String>
		{
			var ret = new Array<String>();
			for (i in 0...Std.int(_data.length))
			{
				var tId:String = addObject((_data[i].parentId ? _data[i].parentId : parentId), _data[i].geometry, _data[i].properties);
				if (_data[i].setStyle) {
					getNode(tId).setStyle(new Style(_data[i].setStyle.regularStyle), (_data[i].setStyle.hoveredStyle != null) ? new Style(_data[i].setStyle.hoveredStyle) : null);
				}
				if (_data[i].setLabel) {
					var node = getNode(tId);
					if ((node != null) && Std.is(node.content, VectorObject)) {
						cast(node.content, VectorObject).label = _data[i].setLabel;
						node.noteSomethingHasChanged();
					}
				}
				ret.push(tId);
			}
			Main.needRefreshMap = true;
			return ret;
		}

		function addObjectsFromSWF(_data:Dynamic)
		{
			if (_data.objectId != null && getNode(_data.objectId) != null && _data.attr != null && _data.attr.url != null) {
				var parentId:String = _data.objectId;
				var url:String = _data.attr.url;
				new GetSWFFile(url, function(arr:Array<Dynamic>) {
var bTime = flash.Lib.getTimer();
					for (i in 0...Std.int(arr.length))
					{
						var tId:String = addObject(parentId, arr[i].geometry, arr[i].properties);
					}
bTime = flash.Lib.getTimer() - bTime;
var st:String = 'Загрузка файла ' + url + ' обьектов: ' + arr.length + ' время: ' + bTime/1000 + ' сек.';
				Main.messBuffToJS.push( st );
				}, function(tileUrl:String) {});
			}
		}

		function setFilter(id:String, ?sql:String):Bool
		{
			if(sql == '') sql = null;
			var func:Hash<String>->Bool = (sql == null) ? 
				function(props:Hash<String>):Bool { return true; } :
				Parsers.parseSQL(sql);

			var node = getNode(id);
			if (func != null && node != null)
			{
				var clustersAttr:Dynamic = null;
				var cont:VectorLayerFilter = cast(node.content);
				if (cont != null && Std.is(cont, VectorLayerFilter)) {
					clustersAttr = cont.clusterAttr;
				}
				cont = new VectorLayerFilter(func);
				node.setContent(cont);
				if (clustersAttr != null) {
					cont.setClusters(clustersAttr);
				}
				Main.bumpFrameRate();
				return true;
			}
			return false;
		}

		function setVisibilityFilter(id:String, ?sql:String):Bool
		{
			var func:Hash<String>->Bool = (sql == null) ? 
				function(props:Hash<String>):Bool { return true; } :
				Parsers.parseSQL(sql);

			var node = getNode(id);
			if (node != null && func != null)
			{
				node.noteSomethingHasChanged();
				node.propHiden.set('_FilterVisibility', func);
				Main.needRefreshMap = true;		// Для обновления карты
				Main.bumpFrameRate();
				return true;
			}
			
			return false;
		}

		function setBackgroundTiles(id:String, func:String, minZoom:Int, maxZoom:Int, ?minZoomView:Int, ?maxZoomView:Int, ?projectionCode:Int)
		{ 
			var node = getNode(id);
			var newContent = new RasterLayer(
				function(i:Int, j:Int, z:Int)
				{
					var out:String = Main.cmdToJS(func, i, j, z);
					return out;
				}
			, minZoom, maxZoom, minZoomView, maxZoomView);
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
		}

		function startLoadTiles(id:String, attr:Dynamic)
		{
			var node = getNode(id);
			if (node == null || node.content == null || !Std.is(node.content, VectorLayer)) return;
			var vLayer:VectorLayer = cast(node.content, VectorLayer);
			vLayer.startLoadTiles(attr, mapWindow);
			//viewportHasMoved = true;
		}

		function setVectorTiles(attr:Dynamic)	//
		{
			var id:String = attr.objectId;
			var tileFunction:Dynamic = attr.tileFunction;
			var identityField:String = attr.identityField;
			var tiles:Array<Int> = attr.tiles;
			var tilesVers:Array<Int> = attr.tilesVers;
			var attrHash:Dynamic = attr.filesHash;
			var content = new VectorLayer(identityField, attrHash, function(i:Int, j:Int, z:Int):Dynamic
			{
				var out:Dynamic = Main.cmdToJS(tileFunction, i, j, z);
				return out;
			});
			for (i in 0...Std.int(tiles.length / 3)) {
				var ver:Int = (tilesVers != null ? tilesVers[i] : 0);
				content.addTile(tiles[i * 3], tiles[i * 3 + 1], tiles[i * 3 + 2], ver);
			}
			getNode(id).setContent(content);
		}

		function setTiles(id:String, tiles:Array<Int>, ?clrFlag:Bool)
		{
			var node = getNode(id);
			if (node != null && node.content != null && Std.is(node.content, VectorLayer)) {
				var layer = cast(node.content, VectorLayer);
				layer.flush();
				//if (clrFlag) layer.tiles = new Array<VectorTile>();
				for (i in 0...Std.int(tiles.length/3))
					layer.addTile(tiles[i*3], tiles[i*3 + 1], tiles[i*3 + 2], 0);
				layer.createLoader(function(tile:VectorTile, tilesRemaining:Int)
				{
					//trace('--------tile ---- visibleextent ------ ' + tilesRemaining + ' : ' +  flash.Lib.getTimer() );
					if (tilesRemaining < 0)
					{
						Main.bumpFrameRate();
						Main.needRefreshMap = true;
						//Main.refreshMap();
					}
				})(mapWindow.visibleExtent);
			}
		}

		function observeVectorLayer(id:String, layerId:String, func:String)
		{
			var layer = cast(getNode(layerId).content, VectorLayer);
			getNode(id).setContent(new VectorLayerObserver(
				layer,
				function(id:String, flag:Bool)
				{
					var geom = layer.geometries.get(id);
					var geoExp:Dynamic = null;
					var prop:Dynamic = null;
					if(geom == null) {
						var pNode:MapNode = getNode(id);
						if (pNode.content != null && Std.is(pNode.content, VectorObject)) {
							var vObj:VectorObject = cast(pNode.content, VectorObject);
							geoExp = vObj.geometry.export();
							prop = exportProperties(pNode.propHash);
						}
					}
					else
					{
						geoExp = geom.export();
						prop = exportProperties(geom.properties);
					}
//trace('-------- observeVectorLayer ------ ' + id + ' : ' +  flash.Lib.getTimer() );
					Main.cmdToJS(func, geoExp, prop, flag);
				}
			));
		}

		function setImageExtent(id:String, attr:Dynamic)
		{
			var node = getNode(id);
			var minX = Merc.x(attr.extent.minX);
			var maxX = Merc.x(attr.extent.maxX);
			var minY = Merc.y(attr.extent.minY);
			var maxY = Merc.y(attr.extent.maxY);
			
			var newContent = new RasterImage(attr.url, minX, maxY, maxX, maxY, maxX, minY, minX, minY, attr);
			if (attr.notSetPolygon == true) {
				newContent.setControlPoints(minX,maxY, maxX,maxY, maxX,minY, minX,minY);
			}
			if ((node.content != null) && Std.is(node.content, VectorObject))
				newContent.setMask(cast(node.content, VectorObject).geometry);
			node.setContent(newContent);
			Main.needRefreshMap = true;
		}

		function setImage(id:String, url:String, 
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
			Main.needRefreshMap = true;
		}

		function getFeatureById(id:String, fid:String, func:String)
		{
			var node = getNode(id);
			var layer = cast(node.content, VectorLayer);
			var geom = layer.getTileItem(fid);
			if (geom != null) {			// Тайл уже загружен
				Main.cmdToJS(func, geom.export(), hashToArray(geom.properties));
				return;
			}
			
			// В остальных случаях загрузка тайлов
			var extent = new Extent();
			var ww = Utils.worldWidth;
			extent.update(-ww, -ww);
			extent.update(ww, ww);
			layer.createLoader(
				function(tile:VectorTile, tilesRemaining:Int)
				{
					if (tilesRemaining == 0)
					{
						var geom = (layer.geometries.exists(fid) ? layer.geometries.get(fid) : new Geometry());
						Main.cmdToJS(func, geom.export(), hashToArray(geom.properties));
					}
				}
			)(extent);
		}
		
		function getFeatures(id:String, geom:Dynamic, func:String)
		{
			var node = getNode(id);
			var ret = new Hash<Bool>();
			var empty:Bool = true;
			var queryGeom = Utils.parseGeometry(geom);
			var queryExtent = queryGeom.extent;
			var layer = cast(node.content, VectorLayer);
			layer.createLoader(
				function(tile:VectorTile, tilesRemaining:Int)
				{
					var addItems = function(tile:VectorTile)
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
					}
					if (tile != null) {
						empty = false;
						addItems(tile);
					}
		
					if (tilesRemaining == 0)
					{
						if (empty)		// Все нужные тайлы уже были загружены
						{
							var w = 2 * Utils.worldWidth;
							for (i in 0...layer.tiles.length)
							{
								var tile = layer.tiles[i];
								if (tile.finishedLoading) {
									var e2 = tile.extent;
									if ((queryExtent.miny < e2.maxy) && (e2.miny < queryExtent.maxy) && (
										((queryExtent.minx < e2.maxx) && (e2.minx < queryExtent.maxx)) || 
										((queryExtent.minx < e2.maxx + w) && (e2.minx + w < queryExtent.maxx)) || 
										((queryExtent.minx < e2.maxx - w) && (e2.minx - w < queryExtent.maxx))
									))
									{
										addItems(tile);
									}
								}
							}
							
						}
						var geoms = new Array<String>();
						var props = new Array<Dynamic>();
						for (id in ret.keys())
						{
							var geom = layer.geometries.get(id);
							geoms.push(geom.export());
							props.push(hashToArray(geom.properties));
						}
						Main.cmdToJS(func, geoms, props);
					}
				}
			)(queryExtent);
		}

		var getFeatureGeometry = function(objectId:String, featureId:String):Geometry { return cast(getNode(objectId).content, VectorLayer).geometries.get(featureId); }

		// Парсинг команд от JavaScript
		var parseCmdFromJS = function(cmd:String, attr:Dynamic)
		{
			var out = { };
			//trace('parseCmdFromJS ' + cmd + ' : ' + flash.Lib.getTimer());
			switch (cmd) {
				case 'setFilter':
					out = cast(setFilter(attr.objectId, attr.sql));
				case 'setVisibilityFilter':
					out = cast(setVisibilityFilter(attr.objectId, attr.sql));
				case 'getChildren':
					out = getChildren(attr.objectId);
				case 'getDepth':		// Получить индекс обьекта
					out = getDepth(attr.objectId);
				case 'delClusters':		// Удалить кластеризацию потомков
					out = delClusters(attr.objectId);
					Main.bumpFrameRate();
				case 'setClusters':		// Установить кластеризацию потомков
					out = setClusters(attr.objectId, attr.data);
					Main.bumpFrameRate();
				case 'setZoomBounds':
					out = setZoomBounds(attr.objectId, attr.minZ, attr.maxZ);
				case 'getZoomBounds':
					var node = getNode(attr.objectId);
					out = node.getZoomBounds();
				case 'setVisible':
					setVisible(attr.objectId, attr.flag);
				case 'getVisibility':	// Получить видимость обьекта
					var node = getNode(attr.objectId);
					out = cast(node.getVisibility());
				case 'setGridVisible':
					Main.bumpFrameRate();
					grid.setVisible(attr.flag);
					Main.needRefreshMap = true;
				case 'getGridVisibility':
					out = cast(grid.getVisibility());
				case 'sendPNG':
					out = sendPNGFile(attr);
				case 'savePNG':
					savePNG(attr);
				case 'trace':
					trace(attr.data);
				case 'setQuality':
					stage.quality = attr.data;
				case 'print':
					var data:BitmapData = new BitmapData(stage.stageWidth, stage.stageHeight, false, 0xFFFFFFFF);
					data.draw(root);
					PrintManager.setPrintableContent(data);
				case 'addContextMenuItem':
					var func:String = attr.func;
					var item = new ContextMenuItem(attr.text);
					item.addEventListener(ContextMenuEvent.MENU_ITEM_SELECT, function(event)
					{
						Main.cmdToJS(func, mapWindow.innerSprite.mouseX, mapWindow.innerSprite.mouseY);
					});
					root.contextMenu.customItems.push(item);
				case 'slideTo':
					onMoveBegin();
					Main.bumpFrameRate();
					fluidMoveTo(attr.x, attr.y, attr.z, 10);
					//needOnMoveEnd = true;
				case 'moveTo':
					onMoveBegin();
					Main.bumpFrameRate();
					setCurrentPosition(attr.x, attr.y, Math.round(attr.z));
					dispatchEventPosition();
					//needOnMoveEnd = true;
				case 'zoomBy':
					onMoveBegin();
					var dz:Float = attr.dz;
					var mx:Float = currentX;
					var my:Float = currentY;
					if (attr.useMouse != null)
					{
						var sprite = getWindowUnderMouse().innerSprite;
						mx = sprite.mouseX;
						my = sprite.mouseY;
					}
					zoomBy(-dz, mx, my);
					//needOnMoveEnd = true;
				case 'freeze':
					Main.draggingDisabled = true; 
				case 'unfreeze':
					Main.draggingDisabled = false; 
				case 'setCursor':
					currentCursorURL = attr.url;
					Utils.loadCacheImage(currentCursorURL, function(contents)
					{
						if (currentCursorURL == attr.url)
						{
							Mouse.hide();
							deleteCurrentCursor();
							cursor.addChild(contents.loader);
							contents.loader.x = attr.dx;
							contents.loader.y = attr.dy;
						}
					});
				case 'clearCursor':
					deleteCurrentCursor();
					Mouse.show();
					currentCursorURL = null;
				case 'setCursorVisible':
					if(cursor.visible != attr.flag) cursor.visible = attr.flag;
				case 'stopDragging':
					isDragging = false;
					Main.isDraggingNow = false;
					if (!isFluidMoving)
						isMoving = false;
				case 'isDragging':
					out = cast(isDragging);
				case 'resumeDragging':
					windowMouseMove();
				case 'getPosition':
					out = cast(getPosition());
				case 'getX':
					out = cast(currentX);
				case 'getY':
					out = cast(currentY);
				case 'getZ':
					out = cast(currentZ);
				case 'getMouseX':
					out = cast(mapWindow.innerSprite.mouseX);
				case 'getMouseY':
					out = cast(mapWindow.innerSprite.mouseY);
				case 'isKeyDown':
					out = cast(Key.isDown(attr.code));
				case 'setExtent':
					minX = attr.x1;
					minY = attr.y1;
					maxX = attr.x2;
					maxY = attr.y2;
					onMoveBegin();
					setCurrentPosition(currentX, currentY, currentZ);
					dispatchEventPosition();
					//needOnMoveEnd = true;
				case 'setMinMaxZoom':
					minZ = attr.z1;
					maxZ = attr.z2;
					onMoveBegin();
					setCurrentPosition(currentX, currentY, currentZ);
					dispatchEventPosition();
					//needOnMoveEnd = true;
				case 'addMapWindow':
					var lastCurrentZ:Float = -100, lastComputedZ:Float = 0;
					var window = new MapWindow(Utils.addSprite(root), function()
					{ 
						if (currentZ != lastCurrentZ)
						{
							lastCurrentZ = currentZ;
							lastComputedZ = 0;
							var pz:Int = Main.cmdToJS(attr.callbackName, currentZ);
							lastComputedZ = pz;
						}
						return lastComputedZ;
					});
					window.innerSprite.addEventListener(MouseEvent.MOUSE_DOWN, windowMouseDown);
					window.innerSprite.addEventListener(MouseEvent.MOUSE_MOVE, windowMouseMove);
					// window.setCenter(currentX, currentY);
					out = cast(window.id);
				case 'setStyle':
					Main.bumpFrameRate();
					var node = getNode(attr.objectId);
					var data:Dynamic = cast(attr.data);
					node.setStyle(new Style(data.regularStyle), (data.hoveredStyle != null) ? new Style(data.hoveredStyle) : null);
					if (Std.is(node.content, VectorLayerFilter)) {
						cast(node.content, VectorLayerFilter).needRefreshClusters();
						node.parent.repaintObjects();			// отрисовка обьектов addObject родителя
					} else {
						node.repaintObjects();			// отрисовка обьектов addObject
					}
					Main.dispatchMouseLeave();
					Main.needRefreshMap = true;
				case 'getStyle':
					var node = getNode(attr.objectId);
					if(node != null) out = cast(node.getStyle(attr.removeDefaults));
				case 'getVisibleStyle':
					var node = getNode(attr.objectId);
					if(node != null) out = cast(node.getVisibleStyle());
				case 'positionWindow':
					var window = MapWindow.allWindows.get(attr.objectId);
					var data:Dynamic = cast(attr.data);
					var x1:Float = data.x1;
					var y1:Float = data.y1;
					var x2:Float = data.x2;
					var y2:Float = data.y2;
					var w = stage.stageWidth;
					var h = stage.stageHeight;
					window.resize(x1*w, y1*h, x2*w, y2*h);
					window.setCenter(currentX, currentY);
				case 'setBackgroundColor':
					if (attr.objectId == mapRoot.id)
						attr.objectId = mapWindow.rootNode.id;
					var window = MapWindow.allWindows.get(attr.objectId);
					if (window != null)
						window.setBackgroundColor(attr.color);
					
					if (window == mapWindow)
						repaintCrosshair();
						
					viewportHasMoved = true;
				case 'setHandler':
					setHandler(attr.objectId, attr.eventName, attr.callbackName);
				case 'removeHandler':
					var node:MapNode = getNode(attr.objectId);
					node.removeHandler(attr.eventName);
				case 'addObject':
					out = addObject(attr.objectId, attr.geometry, attr.properties);
				case 'addObjects':
					out = addObjects(attr);
				case 'addObjectsFromSWF':
					addObjectsFromSWF(attr);
				case 'remove':
					var node = getNode(attr.objectId);
					if(node != null) {
						node.remove();
						if(node.parent != null) node.parent.children.remove(node);
						Main.needRefreshMap = true;
					}
				case 'bringToTop':
					var node = getNode(attr.objectId);
					var n = node.rasterSprite.parent.numChildren - 1;
					if (node.content != null && Std.is(node.content, RasterLayer)) {
						cast(node.content, RasterLayer).bringToTop();
					}
					else 
						node.bringToDepth(n);
					out = cast(n);
				case 'bringToDepth':
					var node = getNode(attr.objectId);
					var n:Int = attr.zIndex;
					if(n < 0) n = 0;
					else if(n > node.rasterSprite.parent.numChildren - 1) n = node.rasterSprite.parent.numChildren - 1;
					node.bringToDepth(n);
					out = cast(n);
				case 'bringToBottom':
					getNode(attr.objectId).bringToDepth(0);
				case 'setActive':
					var content = getNode(attr.objectId).content;
					if (Std.is(content, VectorObject))
						cast(content, VectorObject).setActive(attr.flag);
				case 'setEditable':
					getNode(attr.objectId).setContent(new EditableContent());
				case 'startDrawing':
					Main.isDrawing = true;
					if(attr != null && attr.objectId != null) cast(getNode(attr.objectId).content, EditableContent).startDrawing(attr.type);
				case 'stopDrawing':
					Main.isDrawing = false;
					if (attr != null && attr.objectId != null) cast(getNode(attr.objectId).content, EditableContent).stopDrawing();
				case 'isDrawing':
					var flag:Bool = (cast(getNode(attr.objectId).content, EditableContent).stopDrawing != null);
					out = cast(flag);
				case 'getIntermediateLength':
					out = cast(getNode(attr.objectId).content, EditableContent).getIntermediateLength();
				case 'getCurrentEdgeLength':
					out = cast(getNode(attr.objectId).content, EditableContent).getCurrentEdgeLength();
				case 'setLabel':
					setLabel(attr.objectId, attr.label);
				case 'setBackgroundTiles':
					setBackgroundTiles(attr.objectId, attr.func, attr.minZoom, attr.maxZoom, attr.minZoomView, attr.maxZoomView, attr.projectionCode);
				case 'setDisplacement':
					cast(getNode(attr.objectId).content, RasterLayer).setDisplacement(
						function(x:Float):Float { return attr.dx; },
						function(y:Float):Float { return attr.dy; }
					);
				case 'setTileCaching':
					cast(getNode(attr.objectId).content, RasterLayer).tileCaching = attr.flag;			
				case 'setImageExtent':
					setImageExtent(attr.objectId, attr.data);
				case 'clearBackgroundImage':
					var node = getNode(attr.objectId);
					var newContent = null;
					if (Std.is(node.content, MaskedContent))
					{
						var geom = cast(node.content, MaskedContent).maskGeometry;
						if (geom != null)
							newContent = new VectorObject(geom);
					}
					node.setContent(newContent);
				case 'setGeometry':
					setGeometry(attr.objectId, attr.data);
				case 'getGeometry':
					var geom = getGeometry(attr.objectId);
					out = (geom == null ? null : geom.export());
				case 'getLength':
					var geom = getGeometry(attr.objectId);
					out = (geom == null ? null : geom.getLength());
				case 'getArea':
					var geom = getGeometry(attr.objectId);
					out = (geom == null ? null : geom.getArea());
				case 'getGeometryType':
					var geom = getGeometry(attr.objectId);
					out = (geom == null ? null : geom.export().type);
				case 'getCenter':
					out = [0.0, 0.0];
				case 'addChildRoot':
					out = getNode(attr.objectId).addChild().id;
				case 'setVectorTiles':
					setVectorTiles(attr);
				case 'startLoadTiles':
					startLoadTiles(attr.objectId, attr.data);
				case 'setTiles':
					setTiles(attr.objectId, attr.tiles, attr.flag);
				case 'getStat':
					var node = getNode(attr.objectId);
					if (node != null && node.content != null && Std.is(node.content, VectorLayer)) {
						var layer = cast(node.content, VectorLayer);
						out = layer.getStat();
					}
				case 'observeVectorLayer':
					observeVectorLayer(attr.objectId, attr.layerId, attr.func);
				case 'setImage':
					setImage(attr.objectId, attr.url,
						attr.x1, attr.y1, attr.x2, attr.y2, attr.x3, attr.y3, attr.x4, attr.y4,
						attr.tx1, attr.ty1, attr.tx2, attr.ty2, attr.tx3, attr.ty3, attr.tx4, attr.ty4
					);
				case 'flip':
					var node = getNode(attr.objectId);
					if(node != null) {
						var content = node.content;
						out = (Std.is(content, VectorLayerFilter) ? cast(content, VectorLayerFilter).layer.flip() : '');
					}
				case 'getFeatureGeometry':		// не используется
					var geom:Geometry = getFeatureGeometry(attr.objectId, attr.featureId);
					out = geom.export();
				case 'getFeatureLength':		// не используется
					var geom:Geometry = getFeatureGeometry(attr.objectId, attr.featureId);
					out = geom.getLength();
				case 'getFeatureArea':			// не используется
					var geom:Geometry = getFeatureGeometry(attr.objectId, attr.featureId);
					out = geom.getArea();
				case 'getFeatureById':		//
					getFeatureById(attr.objectId, attr.fid, attr.func);
				case 'getFeatures':		//
					getFeatures(attr.objectId, attr.geom, attr.func);
				case 'getTileItem':	// Получить атрибуты векторного обьекта из загруженных тайлов id по identityField
					var node = getNode(attr.objectId);
					if (node == null || !Std.is(node.content, VectorLayer)) return null;
					var geom:Geometry = cast(cast(node.content, VectorLayer).getTileItem(attr.vId));
					if (geom == null) return null;
					var tmp:Dynamic = { };
					tmp.geometry = geom.export();
					tmp.properties = exportProperties(geom.properties);
					out = cast(tmp);
				case 'setTileItem':	// Изменить атрибуты векторного обьекта из загруженных тайлов
					var node = getNode(attr.objectId);
					if (node == null || !Std.is(node.content, VectorLayer)) return null;
					out = cast(cast(node.content, VectorLayer).setTileItem(attr.data, attr.flag));
				case 'getItemsFromExtent':	// Получить список обьектов пересекающих заданный extent
					var arr:Array<String> = attr.data.layers;
					var ext:Extent = new Extent();
					if(attr.data.extent) {
						ext.update(attr.data.extent.x1, attr.data.extent.y1);
						ext.update(attr.data.extent.x2, attr.data.extent.y2);
					} else {
						var delta:Float = 2 * Utils.getScale(currentZ);
						ext.update(currentX - delta, currentY - delta);
						ext.update(currentX + delta, currentY + delta);
					}
					var outArr = [];
					for (lid in arr) {
						var node = getNode(lid);
						if (node != null && Std.is(node.content, VectorLayer)) {
							var objArr:Array<Dynamic> = cast(node.content, VectorLayer).getItemsFromExtent(ext);
							var arr1:Array<Dynamic> = new Array<Dynamic>();
							for (prop in objArr) {
								arr1.push(exportProperties(prop));
							}
							if (arr1.length > 0) {
								var pt:Dynamic = {};
								pt.id = lid;
								pt.arr = arr1;
								outArr.push(pt);
							}
						}
					}
					out = outArr;
				case 'setFlashLSO':	// Использование SharedObject
					if (attr.data == null || Std.is(attr.data, String)) {
						useFlashLSO = false;
					} else {
						useFlashLSO = true;
						if (attr.data.multiSession != null) multiSessionLSO = (attr.data.multiSession == true ? true : false);
						if (attr.data.compress != null) compressLSO = (attr.data.compress == true ? true : false);
						
					}
					out = (useFlashLSO ? 1 : 0);
				case 'getPatternIcon':		// base64-иконка по FillStyle
					var size = (attr.data.size != null ? attr.data.size : 32);
					var style:Dynamic = (attr.data.style != null && attr.data.style.fill != null ? attr.data.style.fill : {});
					if (style.pattern != null) {
						if (style.pattern.style == 'diagonal1' || style.pattern.style == 'diagonal2') {
							style.pattern.style = (style.pattern.style == 'diagonal2' ? 'diagonal1':'diagonal2');
						} else if (style.pattern.style == 'cross' || style.pattern.style == 'cross1') {
							style.pattern.style = (style.pattern.style == 'cross1' ? 'cross':'cross1');
						}
					}

					var fillStyle:FillStyle = new FillStyle(style);
					var data:BitmapData = fillStyle.getBitmapData();
					if(data != null) {
						var inv = mapWindow.matrix.clone();
						//inv.invert();
						var scale = Math.abs(inv.a);
						inv.scale(size / (scale*data.width), size / (scale*data.height));
						inv.tx = 0;
						inv.ty = 0;
						var shape:Shape = new Shape();
						shape.graphics.beginBitmapFill(data, inv);
						shape.graphics.drawRect(0, 0, size, size);
						shape.graphics.endFill();
						var res:BitmapData = new BitmapData(size, size, true, 0x00FFFFFF);
						res.draw(shape);
						//res.applyFilter(res, res.rect, new Point(0, 0), new ConvolutionFilter( 3, 3, [1, 1, 1, 1, 0, 1, 1, 1, 1], 9));
						var pngData:ByteArray = PNGEncoder.encode(res);
						out = cast(Base64.encode64(pngData, true));
					}
				case 'setAPIProperties':	// Установка дополнительных свойств
					var node = getNode(attr.objectId);
					out = cast(node != null ? node.setAPIProperties(attr.data) : false);
				case 'setEditObjects':		// Установка редактируемых обьектов слоя
					var node = getNode(attr.objectId);
					if (node == null || node.content == null || !Std.is(node.content, VectorLayer)) out = cast(false);
					else {
						var vLayer:VectorLayer = cast(node.content, VectorLayer);
						out = addObjects(attr.processing.addObjects, attr.objectId);
						vLayer.setEditedObjects(attr.processing.removeIDS, out);
					}
			}
			return out;
		}
		ExternalInterface.addCallback("cmdFromJS", parseCmdFromJS);
	}
}