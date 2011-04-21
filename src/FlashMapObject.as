import flash.external.*;
import flash.geom.*;
import flash.filters.*;
import flash.display.BitmapData;

class FlashMapObject {

	static function createClip(parent, name)
	{
		return parent.createEmptyMovieClip(name || FlashMap.getNextId(), parent.getNextHighestDepth());
	}

	static function loadClip(url, parentClip, onLoad, onError)
	{
		var loader = new MovieClipLoader();
		loader.checkPolicyFile = true;
		loader.addListener({ 
			onLoadInit: onLoad || function() {}, 
			onLoadError: onError || function() {} 
		});
		loader.loadClip(url, createClip(parentClip));
	}

	static var crossDomainTouched = {};
	static var crossDomainLoaders = {};
	static var apiHost = false;
	static function loadShapesWithProxy(url, parentClip, onLoad, onError)
	{
		if (!apiHost)
			apiHost = ExternalInterface.call("getAPIHost");
		var host = ExternalInterface.call("parseUri", url).host;
		if (host == apiHost)
			loadClip(url, parentClip, onLoad, onError);
		else
		{
			if (!crossDomainTouched[host])
			{
				loadClip("http://" + host + "/api/proxy.swf", _root, function(mc_)
				{
					FlashMapObject.crossDomainLoaders[host] = function(url_, parentClip_, onLoad_, onError_)
					{
						mc_.loadClip(FlashMap.getNextId(), url_, parentClip_, onLoad_, onError_);
					}
				});
			}
			var finish;
			finish = function()
			{ 
				var loader = FlashMapObject.crossDomainLoaders[host];
				if (loader)
					loader(url, parentClip, onLoad, onError);
				else
					setTimeout(finish, 1000);
			}
			finish();
		}
	}

	static var allObjects = {};
	static var allSprites = {};
	static var spriteLoadCallbacks = {};
	static var hoveredObject = false;

	static function loadAllSprites(style)
	{
		if (!style)
			return;
		var url = style.marker.image;
		if (!spriteLoadCallbacks[url])
		{
			spriteLoadCallbacks[url] = {};
			loadClip(url, createClip(_root),
				function(loadedClip)
				{
					loadedClip._parent._visible = false;
					setTimeout(function() // bugfix for Chrome
					{
						loadedClip._parent._visible = true;
						if (!FlashMapObject.allSprites[url])
						{
							var bmp = new BitmapData(loadedClip._width, loadedClip._height, true, 0);
							bmp.draw(loadedClip._parent);
							FlashMapObject.allSprites[url] = bmp;
						}
						FlashMapObject.spriteLoaded(url);
						loadedClip._parent._visible = false;
					}, 50);
				}
			);
		}
	}

	public var id, clip, contentsClip, childrenClip, 
		parent, children, geometries, geometryBounds,
		tileBounds, properties, indicatorIdx, indicatorMC,
		style, activeStyle, isActive, isHovered,
		handlers, backgroundImageClip, backgroundImageMask,
		vectorTileCache, vectorObjectCache, haveVectorContents, isCacheable,
		objectRoot, minZ, maxZ, tileUpdateCallbacks,
		visibilitySet, hiddenByCaching, pendingTiles, filterCache;

	public function FlashMapObject(clip_, objectRoot_)
	{
		id = FlashMap.getNextId();
		clip = clip_;
		contentsClip = createClip(clip);
		childrenClip = createClip(clip);

		parent = false;
		children = {};
		geometries = [];
		geometryBounds = false;

		tileBounds = false;
		properties = [];
		indicatorIdx = -1;
		indicatorMC = createClip(contentsClip);
		style = false;
		activeStyle = false;
		isActive = false;
		isHovered = false;

		handlers = {};
		backgroundImageClip = false;
		backgroundImageMask = false;

		vectorTileCache = {};
		vectorObjectCache = false;
		haveVectorContents = false;
		isCacheable = false;

		objectRoot = objectRoot_;

		minZ = false;
		maxZ = false;
		tileUpdateCallbacks = [];

		visibilitySet = true;
		hiddenByCaching = false;
		pendingTiles = [];

		filterCache = false;

		allObjects[id] = this;

		var me = this;
		var needBackRepaint = false;
		contentsClip.onRollOver = function() 
		{ 
			var haveVectorContents = me.recurseUp(function(obj) { return obj.haveVectorContents; });
			if (!haveVectorContents)
			{
				me.isHovered = true;
				me.callHandler("onMouseOver");
			}
			//if (me.recurseUp(function(obj) { return obj.activeStyle; }))
			//{
				if (!haveVectorContents)
				{
					needBackRepaint = true;
					me.repaint();
				}
				else if (!me.haveVectorContents)
				{
					me.repaintIndicator();
					FlashMap.onMouseMove(function() { me.repaintIndicator(); });
				}
			//}
		}
		contentsClip.onRollOut = contentsClip.onDragOut = function() 
		{ 
			me.isHovered = false;
			if (needBackRepaint)
			{
				needBackRepaint = false;
				me.repaint();
			}
			if (!me.haveVectorContents)
			{
				me.hideIndicator();
				FlashMap.onMouseMove(false);
			}
			if (!me.recurseUp(function(obj) { return obj.haveVectorContents; }))
				me.callHandler("onMouseOut");
		}
		contentsClip.onPress = function()
		{
			if (me.getHandler("onMouseDown") || me.getHandler("onMouseUp") || me.getHandler("onClick"))
			{
				me.callHandler("onMouseDown");
				FlashMap.onFinishClick(
					function() { me.callHandler("onMouseUp"); },
					function() { me.callHandler("onClick"); }
				);
			}
		}
	}

	public function remove()
	{
		callHandler("onRemove");
		for (var id in children)
			children[id].remove();
		for (var key in handlers)
			ExternalInterface.call(_root.clearCallback, handlers[key]);
		clip.removeMovieClip();
		if (parent)
			delete parent.children[id];
		objectRoot.removeTextField(id);
		objectRoot.removeChildRoot(id);
		delete allObjects[id];
	}

	public function recurseUp(callback)
	{
		var ret = callback(this);
		return (ret || !parent) ? ret : parent.recurseUp(callback);
	}

	public function recurseDown(callback)
	{
		if (callback(this))
			for (var id in children)
				children[id].recurseDown(callback);
	}

	public function bubble(sortOrder, multiplier)
	{
		if (!parent)
			return;
		var depths = [];
		for (var i in parent.childrenClip)
		{
			var depth = parent.childrenClip[i].getDepth();
			if (depth*multiplier > clip.getDepth()*multiplier)
				depths.push(depth);
		}
		depths = depths.sort(sortOrder | Array.NUMERIC);
		for (var i = 0; i < depths.length; i++)
			clip.swapDepths(depths[i]);
	}

	public function bringToDepth(n)
	{
		if (!parent)
			return;
		var depths = [];
		var myN = 0;
		var myDepth = clip.getDepth();
		for (var i in parent.childrenClip)
		{
			var depth = parent.childrenClip[i].getDepth();
			depths.push(depth);
			if (depth < myDepth)
				myN += 1;
		}
		depths = depths.sort(Array.ASCENDING | Array.NUMERIC);
		if (n == myN)
			return;
		var incr = (n > myN) ? 1 : -1;
		for (var i = myN; i != n; i += incr)
			clip.swapDepths(depths[i + incr]);
	}

	public function getEffectiveStyle()
	{
		var flag = isActive || isHovered;
		return recurseUp(function(obj) { return obj.style ? flag ? obj.activeStyle ? obj.activeStyle : obj.style : obj.style : false; });
	}

	public function updateVisibility()
	{
		var flag = visibilitySet && !hiddenByCaching && zoomInBounds();
		if (clip._visible != flag)
		{
			clip._visible = flag;
			if (flag)
			{
				for (var i in pendingTiles)
					pendingTiles[i]();
				pendingTiles = [];
			}
		}
		recurseDown(function(o) 
		{ 
			o.objectRoot.positionTextField(o.id); 
			return true; 
		});
	}

	public function setVisible(flag)
	{
		visibilitySet = flag;
		updateVisibility();
		if (objectRoot.mapWindow && objectRoot.mapWindow.getCurrentZ)
			repaintPoints();
	}

	public function setHandler(eventName, func)
	{
		if (handlers[eventName])
			ExternalInterface.call(_root.clearCallback, handlers[eventName]);
		handlers[eventName] = func;
		if (eventName == "onMouseMove")
		{
			var me = this;
			clip.onMouseMove = func && function() { me.callHandler(eventName); };
		}
	}

	public function getHandler(eventName)
	{
		return recurseUp(function(obj) { return obj.handlers[eventName]; });
	}

	public function callHandler(eventName)
	{
		var handler = getHandler(eventName);
		if (handler)
			ExternalInterface.call(handler, id, properties[(indicatorIdx == -1) ? 0 : indicatorIdx]);
	}

	public function setGeometry(geometry)
	{
		geometries = [];
		var p = properties[0];
		properties = [];
		geometryBounds = false;
		contentsClip.clear();
		addGeometry(geometry, p);
	}

	public function getGeometry()
	{
		return geometries[(indicatorIdx == -1) ? 0 : indicatorIdx];
	}

	private function forEachPart(callback)
	{
		var geom = getGeometry();
		var id = geom.objectId;
		if (id)
		{
			var parts = parent.vectorObjectCache[geom.objectId];
			for (var tileId in parts)
				callback(parent.vectorTileCache[tileId].geometries[parts[tileId]]);
		}
		else
			callback(geom);
	}

	public function getLength()
	{
		var l = 0;
		var processLine = function(c)
		{
			if (c[0].length)
				for (var i = 0; i < c.length - 1; i++)
					l += Merc.distVincenty(c[i][0], c[i][1], c[i + 1][0], c[i + 1][1]);
			else
				for (var i = 0; i < c.length/2 - 1; i++)
					l += Merc.distVincenty(c[i*2], c[i*2 + 1], c[i*2 + 2], c[i*2 + 3]);
		}
		forEachPart(function(part) 
		{ 
			var t = part.type;
			var c = part.coordinates;
			if (t == "LINESTRING")
				processLine(c);
			else if ((t == "POLYGON") || (t == "MULTILINESTRING"))
				for (var i in c)
					processLine(c[i]);
			else if (t == "MULTIPOLYGON")
				for (var i in c)
					for (var j in c[i])
						processLine(c[i][j]);
		});
		return l;
	}

	public function getArea()
	{
		var s = 0;
		var processPolygon = function(c)
		{
			s += Merc.area(c[0]);
			for (var i = 1; i < c.length; i++)
				s -= Merc.area(c[i]);
		}
		forEachPart(function(part) 
		{
			var c = part.coordinates;
			if (part.type == "POLYGON")
				processPolygon(c);
			else if (part.type == "MULTIPOLYGON")
				for (var i in c)
					processPolygon(c[i]);
		});
		return s;
	}

	public function getCenter()
	{
		var b = new Bounds();
		forEachPart(function(part) { b.update(part.coordinates); });
		return [Merc.from_x((b.minx + b.maxx)/2), Merc.from_y((b.miny + b.maxy)/2)];
	}

	public static function fixXCoordinate(c)
	{
		var flag = false;
		if (c[0].length)
		{
			for (var i = 0; i < c.length; i++)
			{
				var newFlag = fixXCoordinate(c[i]);
				flag = flag || newFlag;
			}
		}
		else
		{
			var ww = FlashMap.worldWidth;
			var cutoff = -ww + FlashMap.worldDelta, delta = 2*ww;
			for (var j = 0; j < c.length; j += 2)
			{
				if (c[j] < cutoff)
				{
					c[j] += delta;
					flag = true;
				}
			}
		}
		return flag;
	}

	public function addGeometry(geometry, properties_)
	{
		geometries.push(geometry);
		properties.push(properties_);

		var geomType = geometry.type;
		var myCoords = geometry.coordinates;

		if ((geomType == "POINT") && (myCoords.length == 1))
		{
			myCoords = myCoords[0];
			geometry.coordinates = myCoords;
		}

		var b = new Bounds(myCoords);
		geometry.bounds = b;
		var boundsArray = [b.minx, b.miny, b.maxx, b.maxy];
		recurseUp(function(obj)
		{
			if (!obj.geometryBounds)
				obj.geometryBounds = new Bounds();
			obj.geometryBounds.update(boundsArray);
			return true;
		});

		callHandler("onAdd");
		repaintGeometry(geometries.length - 1);
	}

	function countPoints(coords)
	{
		if (!coords[0].length)
			return coords.length/2;
		else
		{
			var n = 0;
			for (var i = 0; i < coords.length; i++)
				n += countPoints(coords[i]);
			return n;
		}
	}

	function setLineStyle(targetClip, s, hide)
	{
		if (s.outline)
			targetClip.lineStyle(s.outline.thickness, s.outline.color, hide ? 0 : ((typeof s.outline.opacity) == 'number' ? s.outline.opacity : 100), true, "none", "none");
		else
			targetClip.lineStyle(0, 0, 0);
	}

	function beginFill(targetClip, s)
	{
		if (s.fill)
			targetClip.beginFill(s.fill.color, (typeof s.fill.opacity == 'number') ? s.fill.opacity : 100);
	}

	function endFill(targetClip, s)
	{
		if (s.fill)
			targetClip.endFill();
	}

	static function spriteLoaded(url)
	{
		var objs = spriteLoadCallbacks[url];
		for (var key in objs)
		{
			var me = allObjects[key];
			if (me.recurseUp(function(obj) { return obj.haveVectorContents; }))
				me.repaintPoints();
			else
				me.repaint();
		}
		spriteLoadCallbacks[url] = {};
	}

	public function paintGeometry(targetClip, type, coords, s)
	{
		if (type == "POINT")
		{
			if (s.marker)
			{
				var x = coords[0], y = coords[1];
				var scale = 1.0/objectRoot.cacheMC.transform.matrix.a;
				var url = s.marker.image;
				if (s.marker.size && !url)
				{
					var size = scale*s.marker.size;
					setLineStyle(targetClip, s);
					beginFill(targetClip, s);
					targetClip.moveTo(x + size, y + size);
					targetClip.lineTo(x + size, y - size);
					targetClip.lineTo(x - size, y - size);
					targetClip.lineTo(x - size, y + size);
					targetClip.lineTo(x + size, y + size);
					endFill(targetClip, s);
				}
				if (url)
				{
					if (allSprites[url])
					{
						var scaleY = 1.0/objectRoot.cacheMC.transform.matrix.d;
						var bmp = allSprites[url];
						var x1 = x + scale*(s.marker.dx || (s.marker.center ? -bmp.width/2 : 0));
						var y1 = y + scaleY*(s.marker.dy || (s.marker.center ? -bmp.height/2 : 0));
						var x2 = x1 + scale*bmp.width;
						var y2 = y1 + scaleY*bmp.height;
						targetClip.beginBitmapFill(bmp, new Matrix(scale, 0, 0, scaleY, x1, y1));
						targetClip.moveTo(x1, y1);
						targetClip.lineTo(x2, y1);
						targetClip.lineTo(x2, y2);
						targetClip.lineTo(x1, y2);
						targetClip.lineTo(x1, y1);
						targetClip.endFill();
					}
					else
						spriteLoadCallbacks[url][this.id] = true;
				}
			}
		}
		else if (type == "LINESTRING")
		{
			setLineStyle(targetClip, s);
			var isFlat = !coords[0].length;
			targetClip.moveTo(
				isFlat ? coords[0] : coords[0][0],
				isFlat ? coords[1] : coords[0][1]
			);
			var targetClip_ = targetClip;
			if (isFlat)
			{
				var cl2 = coords.length/2;
				for (var i = 1; i < cl2; i++)
				{
					var i_ = i*2;
					targetClip_.lineTo(coords[i_], coords[i_ + 1]);
				}
			}
			else
			{
				var cl = coords.length;
				for (var i = 1; i < cl; i++)
				{
					var c_ = coords[i];
					targetClip_.lineTo(c_[0], c_[1]);
				}
			}
		}
		else if (type == "POLYGON")
		{
			var minX, minY, maxX, maxY;
			if (tileBounds)
			{
				minX = tileBounds.minx;
				minY = tileBounds.miny;
				maxX = tileBounds.maxx;
				maxY = tileBounds.maxy;
			}
			beginFill(targetClip, s);
			for (var i in coords)
			{
				var ring = coords[i];
				var oldIsOnEdge = false;
				var targetClip_ = targetClip;
				setLineStyle(targetClip, s);
				if (!ring[0].length)
				{
					targetClip_.moveTo(ring[0], ring[1]);
					var rl = ring.length/2;
					for (var j = 1; j < rl; j++)
					{
						var j_ = j*2;
						var x = ring[j_], y = ring[j_ + 1];
						if (tileBounds)
						{
							var flag = false;
							if ((x < minX) || (x > maxX) || (y < minY) || (y > maxY))
							{
								var oldX = ring[j_ - 2], oldY = ring[j_ - 1];
								if ((((x < minX) || (x > maxX)) && ((oldX < minX) || (oldX > maxX))) || (((y < minY) || (y > maxY)) && ((oldY < minY) || (oldY > maxY))))
									flag = true;
							}
							if (flag != oldIsOnEdge)
							{
								setLineStyle(targetClip, s, flag);
								oldIsOnEdge = flag;
							}
						}
						targetClip_.lineTo(x, y);
					}
				}
				else
				{
					targetClip_.moveTo(ring[0][0], ring[0][1]);
					var rl = ring.length;
					for (var j = 1; j < rl; j++)
					{
						var x = ring[j][0], y = ring[j][1];
						if (tileBounds)
						{
							var flag = false;
							if ((x < minX) || (x > maxX) || (y < minY) || (y > maxY))
							{
								var oldX = ring[j - 1][0], oldY = ring[j - 1][1];
								if ((((x < minX) || (x > maxX)) && ((oldX < minX) || (oldX > maxX))) || (((y < minY) || (y > maxY)) && ((oldY < minY) || (oldY > maxY))))
									flag = true;
							}
							if (flag != oldIsOnEdge)
							{
								setLineStyle(targetClip, s, flag);
								oldIsOnEdge = flag;
							}
						}
						targetClip_.lineTo(x, y);
					}
				}
			}
			endFill(targetClip, s);
		}
		else if (type == "MULTILINESTRING")
		{
			for (var i in coords)
				paintGeometry(targetClip, "LINESTRING", coords[i], s);
		}
		else if (type == "MULTIPOLYGON")
		{
			for (var i in coords)
				paintGeometry(targetClip, "POLYGON", coords[i], s);
		}
	}

	function repaintGeometry(j)
	{
		if (!zoomInBounds())
			return;
		var geometry = geometries[j];
		paintGeometry(contentsClip, geometry.type, geometry.coordinates, getEffectiveStyle());

		if (geometry.indicatorClip)
			geometry.indicatorClip.clear();
		if (recurseUp(function(obj) { return obj.activeStyle; }) && (countPoints(geometry.coordinates) > 2000))
		{
			if (!geometry.indicatorClip)
			{
				geometry.indicatorClip = createClip(indicatorMC);
				geometry.indicatorClip._visible = false;
			}
			geometry.needIndicator = true;
		}
		else if (geometry.indicatorClip)
		{
			geometry.indicatorClip.removeMovieClip();
			geometry.indicatorClip = false;
			geometry.needIndicator = false;
		}
	}

	public function repaint()
	{
		contentsClip.clear();
		if (!haveVectorContents)
			for (var j in geometries)
				repaintGeometry(j);
	}

	public function repaintPoints()
	{
		var currentZ = objectRoot.mapWindow.getCurrentZ ? objectRoot.mapWindow.getCurrentZ() : 0;
		if (currentZ != Math.round(currentZ))
			return;
		var vb = objectRoot.mapWindow.getVisibleBounds();
		recurseDown(function(obj)
		{
			if (!obj.visibilitySet || !obj.zoomInBounds())
				return false;
			var b = obj.geometryBounds;
			if (b && ((b.minx > vb.maxx) || (b.maxx < vb.minx) || (b.miny > vb.maxy) || (b.maxy < vb.miny)))
				return false;
			var geoms = obj.geometries;
			if ((geoms.length > 0) && (geoms[0].type == "POINT"))
			{
				obj.contentsClip.clear();
				for (var j = 0; j < geoms.length; j++)
				{
					var c = geoms[j].coordinates;
					var x = c[0], y = c[1];
					if ((x > vb.minx) && (x < vb.maxx) && (y > vb.miny) && (y < vb.maxy))
						obj.repaintGeometry(j);
				}
			}
			return true;
		});
	}

	public function repaintIndicator()
	{
		var x = objectRoot.cacheMC._xmouse;
		var y = objectRoot.cacheMC._ymouse;
		var scale = FlashMap.getScale(objectRoot.mapWindow.getCurrentZ());
		var type = geometries[0].type;
		var newIdx = -1;
		if (type == "POINT")
		{
			var minDist = 1E30;
			var gl = geometries.length;
			for (var i = 0; i < gl; i++)
			{
				var c = geometries[i].coordinates;
				var cx = c[0] - x;
				var cy = c[1] - y;
				var dist = cx*cx + cy*cy;
				if (dist < minDist)
				{
					minDist = dist;
					newIdx = i;
				}
			}
		}
		else if ((type == "LINESTRING") || (type == "MULTILINESTRING"))
		{
			var testLineString = function(line, r)
			{
				var isFlat = !line[0].length;
				if (!isFlat)
				{
					var ll = line.length - 1;
					for (var j = 0; j < ll; j++)
					{
						var l1 = line[j], l2 = line[j + 1];
						var x1 = l1[0] - x;
						var y1 = l1[1] - y;
						var x2 = l2[0] - x;
						var y2 = l2[1] - y;
						var a = (x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1);
						var b = 2*x1*(x2 - x1) + 2*y1*(y2 - y1);
						var c = x1*x1 + y1*y1 - r*r;
						var d = b*b - 4*a*c;
						if (d < 0)
							continue;
						d = Math.sqrt(d);
						if (((-b + d)/(2*a) > 0) && ((-b - d)/(2*a) < 1))
							return true;
					}
				}
				else
				{
					var ll = line.length/2 - 1;
					for (var j = 0; j < ll; j++)
					{
						var jj = j*2;
						var x1 = line[jj] - x;
						var y1 = line[jj + 1] - y;
						var x2 = line[jj + 2] - x;
						var y2 = line[jj + 3] - y;
						var a = (x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1);
						var b = 2*x1*(x2 - x1) + 2*y1*(y2 - y1);
						var c = x1*x1 + y1*y1 - r*r;
						var d = b*b - 4*a*c;
						if (d < 0)
							continue;
						d = Math.sqrt(d);
						if (((-b + d)/(2*a) > 0) && ((-b - d)/(2*a) < 1))
							return true;
					}
				}
				return false;
			}
			var testMultiLineString = function(multiLine, r)
			{
				for (var j = 0; j < multiLine.length - 1; j++)
					if (testLineString(multiLine[j], r))
						return true;
				return false;
			}
			var effectiveStyle = getEffectiveStyle();
			for (var i = 0; i < geometries.length; i++)
			{
				var geom = geometries[i];
				var b = geom.bounds;
				if ((x >= b.minx) && (x <= b.maxx) && (y >= b.miny) && (y <= b.maxy))
				{
					var outline = effectiveStyle.outline;
					if (!outline)
						continue;
					if (((geom.type == "LINESTRING") ? testLineString : testMultiLineString)(geom.coordinates, 2*scale*(outline.thickness || 0)))
					{
						newIdx = i;
						break;
					}
				}
			}
		}
		else if ((type == "POLYGON") || (type == "MULTIPOLYGON"))
		{
			var r = 2*scale;
			var testRing = function(ring)
			{
				var isInside = false;
				var isFlat = !ring[0].length;
				if (!isFlat)
				{
					var rl = ring.length - 1;
					for (var j = 0; j < rl; j++)
					{
						var r1 = ring[j], r2 = ring[j + 1];
						var y1 = r1[1];
						var y2 = r2[1];
						if ((y1 >= y) != (y2 >= y))
						{
							var x1 = r1[0];
							var x2 = r2[0];
							var tx = x1 + (x2 - x1)*(y - y1)/(y2 - y1) - x;
							if ((tx > -r) && (tx < r))
								return true;
							if (tx > 0)
								isInside = !isInside;
						}
					}
				}
				else
				{
					var rl = ring.length/2 - 1;
					for (var j = 0; j < rl; j++)
					{
						var jj = j*2;
						var y1 = ring[jj + 1];
						var y2 = ring[jj + 3];
						if ((y1 >= y) != (y2 >= y))
						{
							var x1 = ring[jj];
							var x2 = ring[jj + 2];
							var tx = x1 + (x2 - x1)*(y - y1)/(y2 - y1) - x;
							if ((tx > -r) && (tx < r))
								return true;
							if (tx > 0)
								isInside = !isInside;
						}
					}
				}
				return isInside;
			}
			var testPolygon = function(polygon)
			{
				for (var j = 0; j < polygon.length; j++)
					if (testRing(polygon[j]) != (j == 0))
						return false;
				return true;
			}
			var testMultiPolygon = function(multiPolygon)
			{
				for (var j = 0; j < multiPolygon.length; j++)
					if (testPolygon(multiPolygon[j]))
						return true;
				return false;
			}

			var effectiveStyle = getEffectiveStyle();
			for (var i = 0; i < geometries.length; i++)
			{
				var style = effectiveStyle;
				if (!style.outline && !style.fill)
					continue;
				var geom = geometries[i];
				var b = geom.bounds;
				if ((x >= b.minx) && (x <= b.maxx) && (y >= b.miny) && (y <= b.maxy))
				{
					if (((geom.type == "POLYGON") ? testPolygon : testMultiPolygon)(geom.coordinates))
					{
						newIdx = i;
						break;
					}
				}
			}
		}
		if (newIdx != indicatorIdx)
		{
			hideIndicator();
			indicatorIdx = newIdx;
			if (indicatorIdx != -1)
			{
				FlashMapObject.hoveredObject = this;
				callHandler("onMouseOver");
				var myActiveStyle = recurseUp(function(obj) { return obj.activeStyle; });
				if (myActiveStyle && (newIdx != -1))
				{
					var geom = geometries[indicatorIdx];
					var myGeometryStyle = myActiveStyle;
					if (!geom.objectId)
					{
						if (!geom.indicatorClip)
							paintGeometry(indicatorMC, geom.type, geom.coordinates, myGeometryStyle);
						else
						{
							if (geom.needIndicator)
							{
								paintGeometry(geom.indicatorClip, geom.type, geom.coordinates, myGeometryStyle);
								geom.needIndicator = false;
							}
							geom.indicatorClip._visible = true;
						}
					}
					else
					{
						var parts = parent.vectorObjectCache[geom.objectId];
						var nParts = 0;
						for (var tileId in parts)
						{
							var o2 = parent.vectorTileCache[tileId];
							var geom2 = o2.geometries[parts[tileId]];
							if (!geom2.indicatorClip)
								o2.paintGeometry(indicatorMC, geom2.type, geom2.coordinates, myGeometryStyle);
							else
							{
								if (geom2.needIndicator)
								{
									o2.paintGeometry(geom2.indicatorClip, geom2.type, geom2.coordinates, myGeometryStyle);
									geom2.needIndicator = false;
								}
								geom2.indicatorClip._visible = true;
							}
						}
					}
				}
			}
		}
	}

	public function hideIndicator()
	{
		if (indicatorIdx != -1)
		{
			var geom = geometries[indicatorIdx];
			indicatorMC.clear();
			if (!geom.objectId)
			{
				if (geom.indicatorClip)
					geom.indicatorClip._visible = false;
			}
			else
			{
				var parts = parent.vectorObjectCache[geom.objectId];
				var nParts = 0;
				for (var tileId in parts)
				{
					var geom2 = parent.vectorTileCache[tileId].geometries[parts[tileId]];
					if (geom2.indicatorClip)
						geom2.indicatorClip._visible = false;
				}
			}
			callHandler("onMouseOut");
			indicatorIdx = -1;
			FlashMapObject.hoveredObject = false;
		}
	}

	public function setZoomBounds(minZ_, maxZ_)
	{
		minZ = minZ_;
		maxZ = maxZ_;
	}

	public function zoomInBounds()
	{
		if (!minZ && !maxZ)
			return true;
		if (!objectRoot.mapWindow)
			return true;
		var z = objectRoot.mapWindow.getCurrentZ();
		return ((z >= minZ) && (z <= maxZ));
	}

	public function repaintRecursively()
	{
		recurseDown(function(obj)
		{
			if (obj.clip._visible)
				obj.repaint();
			return obj.clip._visible;
		});
	}

	public function setCacheable()
	{
		this.isCacheable = true;
	}

	public function addChild(geometry, properties_, tileBounds_, tileId, objectId)
	{
		var child;
		if (tileId && vectorTileCache[tileId])
			child = vectorTileCache[tileId];
		else
		{
			child = new FlashMapObject(createClip(childrenClip), objectRoot);
			child.parent = this;
			children[child.id] = child;
			if (tileId)
				vectorTileCache[tileId] = child;
			if (tileBounds_)
				child.tileBounds = tileBounds_;
		}
		if (geometry)
		{
			if (objectId)
			{
				geometry.objectId = objectId;
				if (!vectorObjectCache)
					vectorObjectCache = {};
				if (!vectorObjectCache[objectId])
					vectorObjectCache[objectId] = {};
				vectorObjectCache[objectId][tileId] = child.geometries.length;
			}
			child.addGeometry(geometry, properties_);
		}
		else
			child.properties = [properties_];
		return child;
	}

	public function addFilter(field, operation, value)
	{
		var child = this.addChild();
		if (!this.filterCache)
			this.filterCache = [];
		this.filterCache.push({
			field: field,
			operation: operation,
			value: value,
			child: child
		});
		return child;
	}

	public function createMask()
	{
		var mask = createClip(clip);
		var worldWidth = 256*FlashMap.getScale(17);
		for (var i in geometries)
		{
			var callback = function(polygon)
			{
				var maxM = 1;
				for (var m = -maxM; m <= maxM; m++)
				{
					for (var k = 0; k < polygon.length; k++)
					{
						mask.beginFill(0xff000000);
						var ring = polygon[k];
						var isFlat = !ring[0].length;
						if (isFlat)
						{
							mask.moveTo(ring[0] + m*worldWidth, ring[1]);
							for (var l = 1; l < ring.length/2; l++)
								mask.lineTo(ring[l*2] + m*worldWidth, ring[l*2 + 1]);
							mask.endFill();
						}
						else
						{
							mask.moveTo(ring[0][0] + m*worldWidth, ring[0][1]);
							for (var l = 1; l < ring.length; l++)
								mask.lineTo(ring[l][0] + m*worldWidth, ring[l][1]);
							mask.endFill();
						}
					}
				}
			}

			var type = geometries[i].type.toUpperCase();
			var coords = geometries[i].coordinates;
			if (type == "POLYGON")
				callback(coords);
			else if (type == "MULTIPOLYGON")
				for (var j = 0; j < coords.length; j++)
					callback(coords[j]);
		}
		mask._visible = false;
		return mask;
	}

	public function setBackgroundImage(url, matrixFunctionName)
	{
		if (backgroundImageClip)
			backgroundImageClip.removeMovieClip();
		if (backgroundImageMask)
			backgroundImageMask.removeMovieClip();
		backgroundImageClip = createClip(contentsClip);
		if (geometries.length > 0)
		{
			backgroundImageMask = createMask();
			backgroundImageClip.setMask(backgroundImageMask);
		}
		else
			backgroundImageMask = false;
		var bgClip = backgroundImageClip;
		loadClip(
			url, 
			bgClip, 
			function(loadedClip)
			{
				loadedClip._visible = true;
				var m = ExternalInterface.call(matrixFunctionName, loadedClip._width, loadedClip._height);
				ExternalInterface.call(_root.clearCallback, matrixFunctionName);
				bgClip.transform.matrix = new Matrix(m[0], m[1], m[2], m[3], m[4], m[5]);
			}
		);
	}

	public function clearBackgroundImage()
	{
		backgroundImageClip.removeMovieClip();
	}

	public function setBackgroundTiles(tileFunctionName, isAlternateProjection)
	{
		handlers["backgroundTileFunction"] = tileFunctionName;

		var me = this;
		var tileParentClip = createClip(contentsClip);

		if (geometries.length > 0)
			tileParentClip.setMask(createMask());

		var tiles = {};

		var isOverlay = false;
		var overlayDetermined = false;

		objectRoot.mapWindow.onTileUpdate(this, function()
		{
			var currentZ = me.objectRoot.mapWindow.getCurrentZ();
			var dy = 0;
			if (isAlternateProjection)
			{
				var vb = me.objectRoot.mapWindow.getVisibleBounds();
				var y = (vb.miny + vb.maxy)/2;
				dy = y - Merc.y_ex(Merc.from_y(y), Merc.r_major);
			}

			var toRemove = [];
			for (var key in tiles)
			{
				var tile = tiles[key];
				if ((isOverlay ? (tile.z != currentZ) : (tile.z < currentZ)) || (!tile.startedLoading && (tile.z != currentZ)))
				{
					tile.unload();
					toRemove.push(key);
				}
			}
			for (var k = 0; k < toRemove.length; k++)
				delete tiles[toRemove[k]];

			tileParentClip._y = dy;

			me.objectRoot.mapWindow.forEachTile(me.geometryBounds, currentZ, function(i, j, tileSize)
			{
				var id = i + "_" + j + "_" + currentZ;
				if (tiles[id])
					return false;

				var clip = FlashMapObject.createClip(tileParentClip);
				var tile;
				tile = {
					loaded: false,
					unloaded: false,
					startedLoading: false,
					load: function()
					{
						if (tile.unloaded)
							return;
	
						tile.startedLoading = true;
						if (!tiles[id])
						{
							tile.unload();
							return;
						}
	
						var worldSize = Math.pow(2, 17 - currentZ);
						var url = ExternalInterface.call(tileFunctionName, (i + 3*worldSize/2)%worldSize - worldSize/2, j, 17 - currentZ);

						FlashMapObject.loadClip(
							url, 
							clip,
							function(loadedClip)
							{
								if (tile.unloaded)
									clip.removeMovieClip();
								else
								{
									if (!overlayDetermined)
									{
										overlayDetermined = true;
										var w = loadedClip._width, h = loadedClip._height;
										var bmp = new BitmapData(w, h, true, 0);
										bmp.draw(loadedClip._parent);
										for (var k = 0; k < 1000; k++)
										{
											if (((bmp.getPixel32(Math.round(Math.random()*(w - 1)), Math.round(Math.random()*(h - 1))) >> 24) & 0xFF) < 0xFF)
											{
												isOverlay = true;
												break;
											}
										}
									}

									clip.transform.matrix = new Matrix(
										tileSize/256,
										0,
										0,
										-tileSize/256,
										i*tileSize,
										(j + 1)*tileSize
									);

									clip._alpha = 30;
									setTimeout(function() { clip._alpha = 60; }, 50);
									setTimeout(function() 
									{ 
										clip._alpha = 100; 
										me.objectRoot.mapWindow.tileFinishedLoading();
									}, 100);
								}
								tile.loaded = true;

								//ExternalInterface.call("updateTileQueue", -1, true);
							},
							function()
							{
								if (!tile.unloaded)
									me.objectRoot.mapWindow.tileFinishedLoading();
								tile.loaded = true;

								//ExternalInterface.call("updateTileQueue", -1, false);
							}
						);
					},
					unload: function()
					{
						if (tile.unloaded)
							return;
						if (tile.startedLoading && !tile.loaded)
							me.objectRoot.mapWindow.tileFinishedLoading();
						if (tile.loaded)
							clip.removeMovieClip();
						tile.unloaded = true;
					},
					mc: clip,
					z: currentZ
				};
				tiles[id] = tile;
				tile.load();
				return true;
			}, dy);
		});
	}

	public function setVectorTiles(dataFormat, tileZoomLevel, tileFunctionName, cacheFieldName, tiles)
	{
		haveVectorContents = true;
		repaint();

		handlers["vectorTileFunction"] = tileFunctionName;

		var loadedUrls = {};
		var me = this;

		var addVectorObjects;
		var loadFinished = function() { me.objectRoot.mapWindow.tileFinishedLoading(); }
		addVectorObjects = function(objs, tileBounds, tileId, startingIdx)
		{
			if (!me.zoomInBounds())
			{
				me.pendingTiles.push(function()
				{
					addVectorObjects(objs, tileBounds, tileId, startingIdx);
				});
				return;
			}

			var k = startingIdx;
			var alternateBounds = false;
			while (k < objs.length)
			{
				var o = objs[k];
				var props = {};
				var p = o.properties;
				if (p.length > 0)
				{
					if (p[0].sort)
						for (var l = 0; l < p.length; l++)
							props[p[l][0]] = p[l][1];
					else
						for (var l = 0; l < p.length/2; l++)
							props[p[l*2]] = p[l*2 + 1];
				}

				var isAlternate = FlashMapObject.fixXCoordinate(o.geometry.coordinates);

				if (isAlternate && !alternateBounds)
				{
					var ww = 2*FlashMap.worldWidth;
					alternateBounds = new Bounds([tileBounds.minx + ww, tileBounds.miny, tileBounds.maxx + ww, tileBounds.maxy]);
				}

				var bounds = isAlternate ? alternateBounds : tileBounds;
				var tileId_ = isAlternate ? (tileId + "_alternate") : tileId;
				var cacheId = cacheFieldName && props[cacheFieldName];
				if (me.filterCache)
				{
					var nFilters = me.filterCache.length;
					var added = false;
					for (var i = 0; i < nFilters; i++)
					{
						var filter = me.filterCache[i];
						var operation = filter.operation;
						if (operation)
						{
							var value1 = props[filter.field];
							var value2 = filter.value;
							if ((operation == "=") || (operation == "=="))
							{
								if (value1 != value2)
									continue;
							}
							else if (operation == "<")
							{
								if (parseFloat(value1) >= parseFloat(value2))
									continue;
							}
							else if (operation == ">")
							{
								if (parseFloat(value1) <= parseFloat(value2))
									continue;
							}
							else if (operation == "<=")
							{
								if (parseFloat(value1) > parseFloat(value2))
									continue;
							}
							else if (operation == ">=")
							{
								if (parseFloat(value1) < parseFloat(value2))
									continue;
							}
							else
								continue;
						}
						if (operation || (!operation && !added && (i == nFilters - 1)))
						{
							filter.child.addChild(o.geometry, props, bounds, tileId_, cacheId);
							added = true;
						}
					}
				}
				else
					me.addChild(o.geometry, props, bounds, tileId_, cacheId);
				k += 1;
			}
			loadFinished();
		}

		var loadRequiredTilesFromList;

		var loadVectorTile = function(id, url, tileBounds)
		{
			if (dataFormat == "SWF")
			{
				FlashMapObject.loadShapesWithProxy(
					url,
					_root,
					function(loadedClip) 
					{ 
						setTimeout(function()
						{
							if (loadedClip.shapes)
								addVectorObjects(loadedClip.shapes, tileBounds, id, 0);
							else if (loadedClip.tiles)
							{
								loadRequiredTilesFromList(loadedClip.tiles);
								for (var i = 0; i < loadedClip.tiles.length; i++)
									tiles.push(loadedClip.tiles[i]);
								loadFinished();
							}
							else
								loadFinished();
						}, 50);
					},
					loadFinished
				);
			}
			else
			{
				var xml = new XML();
				xml.onData = function(data)
				{
					addVectorObjects((new JSON()).parse(data), tileBounds, id, 0);
				}
				xml.load(url);
			}
		}

		loadRequiredTilesFromList = function(tiles_)
		{
			var b = me.objectRoot.mapWindow.getVisibleBounds();
			for (var k = 0; k < tiles_.length/3; k++)
			{
				var i = tiles_[k*3];
				var j = tiles_[k*3 + 1];
				var z = tiles_[k*3 + 2];
				var id = i + "_" + j + "_" + z;
				if (loadedUrls[id])
					continue;
	
				var tileSize = 256*FlashMap.getScale(17 - z);
				var x1 = i*tileSize;
				var x2 = x1 + tileSize;
				var y1 = j*tileSize;
				var y2 = y1 + tileSize;
				var ww = 2*FlashMap.worldWidth;
				if ((((x1 > b.maxx) || (x2 < b.minx)) && ((x1 > b.maxx - ww) || (x2 < b.minx - ww)) && ((x1 > b.maxx + ww) || (x2 < b.minx + ww))) || (y1 > b.maxy) || (y2 < b.miny))
					continue;

				var tileBounds = new Bounds([
					x1 + tileSize/10000, 
					y1 + tileSize/10000, 
					x2 - tileSize/10000, 
					y2 - tileSize/10000
				]);
					
				loadedUrls[id] = true;
				me.objectRoot.mapWindow.tilesCurrentlyLoading += 1;
				var worldSize = Math.pow(2, z);
				loadVectorTile(id, ExternalInterface.call(tileFunctionName, (i + 3*worldSize/2)%worldSize - worldSize/2, j, z), tileBounds);
			}
		}

		objectRoot.mapWindow.onTileUpdate(this, function()
		{
			if (tiles)
				loadRequiredTilesFromList(tiles);
			else
			{
				var worldSize = Math.pow(2, tileZoomLevel);
				me.objectRoot.mapWindow.forEachTile(me.geometryBounds, 17 - tileZoomLevel, function(i, j, tileSize)
				{
					var id = i + "_" + j + "_" + tileZoomLevel;
					if (loadedUrls[id])
						return false;
					loadedUrls[id] = true;
					loadVectorTile(id, ExternalInterface.call(tileFunctionName, (i + 3*worldSize/2)%worldSize - worldSize/2, j, tileZoomLevel), tileSize);
				});
			}
		});
	}
}
