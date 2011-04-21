import flash.external.*;
import flash.geom.*;
import flash.filters.*;
import flash.display.BitmapData;

class FlashMapObjectRoot {

	static function createClip(parent, name)
	{
		return parent.createEmptyMovieClip(name || FlashMap.getNextId(), parent.getNextHighestDepth());
	}

	static var htmlStyleSheet = (function()
	{
		var style = new TextField.StyleSheet();
		style.parseCSS(" a { text-decoration: underline; } ");
		return style;
	})();

	var clip, rootObject, childRoots, parentRoot, textFields, textFieldsMC, needReposition, cacheMC, mapWindow;

	function FlashMapObjectRoot(clip_, mapWindow_, parentRoot_)
	{
		var me = this;

		clip = clip_;
		rootObject = new FlashMapObject(createClip(clip), this);
		cacheMC = createClip(clip);
		mapWindow = mapWindow_;
		parentRoot = parentRoot_;
		childRoots = {};
		textFields = {};
		textFieldsMC = createClip(clip);
		needReposition = false;
		textFieldsMC.onEnterFrame = function() 
		{
			if (me.needReposition)
			{
				me.repositionChildren();
				me.needReposition = false;
			}
		}
	}

	function addChildRoot(objectId)
	{
		childRoots[objectId] = new FlashMapObjectRoot(createClip(clip), false, this);
		needReposition = true;
		return childRoots[objectId];
	}

	function removeChildRoot(objectId)
	{
		if (childRoots[objectId])
		{
			var cr = childRoots[objectId];
			delete childRoots[objectId];
			cr.rootObject.remove();
		}
		if ((objectId == rootObject.id) && parentRoot)
			for (var oid in parentRoot.childRoots)
				if (parentRoot.childRoots[oid] == this)
					parentRoot.removeChildRoot(oid);
	}

	function setTextField(objectId, htmlText)
	{
		if (!textFields[objectId])
		{
			textFieldsMC.createTextField(objectId, textFieldsMC.getNextHighestDepth(), 0, 0, 0, 0);
			var tf = textFieldsMC[objectId];
			tf._visible = true;
			tf.multiline = true;
			tf.condenseWhite = false;
			var me = this;
			tf.onChanged = function() 
			{ 
				tf._text = tf.text;
				me.updateTextFieldText(objectId); 
			}
			tf.onSetFocus = function() { FlashMapObject.allObjects[objectId].callHandler("onFocus"); }
			tf.onKillFocus = function() { FlashMapObject.allObjects[objectId].callHandler("onBlur"); }
			textFields[objectId] = tf;
			textFields[objectId]._text = htmlText;
			restyleTextField(objectId);
			positionTextField(objectId);
			setTextFieldEditable(objectId, false);
		}
		else
		{
			textFields[objectId]._text = htmlText;
			updateTextFieldText(objectId);
		}
	}

	function setTextFieldEditable(objectId, flag)
	{
		var tf = textFields[objectId];
		tf.type = flag ? "input" : "dynamic";
		tf.html = !flag;
		tf.selectable = flag;
		updateTextFieldText(objectId);
	}

	function updateTextFieldText(objectId)
	{
		var tf = textFields[objectId];
		if (tf.html)
		{
			tf.styleSheet = htmlStyleSheet;
			tf.htmlText = tf._text;
		}
		else
		{
			tf.styleSheet = undefined;
			tf.text = tf._text;
		}
		tf.autoSize = true;
		var w = tf._width, h = tf._height;
		tf.autoSize = false;
		tf._width = w + 5;
		tf._height = h + 5;
		tf.maxhscroll = 0;
		FlashMapObject.allObjects[objectId].callHandler("onEdit");
	}

	function removeTextField(objectId)
	{
		if (textFields[objectId])
		{
			textFields[objectId]._parent.removeMovieClip();
			delete textFields[objectId];
		}
	}

	function restyleTextField(objectId)
	{
		var tf = textFields[objectId];
		if (tf)
		{
			var obj = FlashMapObject.allObjects[objectId];
			var s = obj.getEffectiveStyle();
			if (s)
			{
				var l = s.label;
				if (l)
					tf.textColor = l.color;
			}
		}
	}

	function positionTextField(objectId)
	{		
		var tf = textFields[objectId];
		if (!tf)
			return;
		var obj = FlashMapObject.allObjects[objectId]
		tf._visible = !obj.recurseUp(function(o) { return !o.clip._visible; });
		if (!tf._visible)
			return;
		var b = obj.geometryBounds;
		var pt = cacheMC.transform.matrix.transformPoint(new Point((b.minx + b.maxx)/2, (b.miny + b.maxy)/2));
		var dx = 0, dy = 0;
		var s = obj.getEffectiveStyle();
		if (s)
		{
			var l = s.label;
			if (l)
			{
				dx = (l.align == "right") ? -tf._width : (l.align == "center") ? -tf._width/2 : 0;
				dy = -l.size*0.8;
			}
		}
		tf._x = pt.x + dx;
		tf._y = pt.y + dy;
	}

	function repositionChildren()
	{
		for (var objectId in textFields)
			positionTextField(objectId);
		for (var objectId in childRoots)
		{
			var cr = childRoots[objectId];
			var obj = FlashMapObject.allObjects[objectId];
			var b = obj.geometryBounds;
			var pt = cacheMC.transform.matrix.transformPoint(new Point((b.minx + b.maxx)/2, (b.miny + b.maxy)/2));
			cr.clip._x = pt.x;
			cr.clip._y = pt.y;
		}

		var depths = [];
		var clips = [];
		for (var objectId in childRoots)
		{
			var mc = childRoots[objectId].clip;
			depths.push(mc.getDepth());
			clips.push(mc);
		}
		depths = depths.sort(Array.ASCENDING | Array.NUMERIC);
		clips = clips.sort(function(o1, o2)
		{
			var y1 = o1._y, y2 = o2._y;
			return (y1 < y2) ? -1 : (y1 == y2) ? 0 : 1;
		});
		for (var i = 0; i < clips.length; i++)
			clips[i].swapDepths(depths[i]);
	}
}
                                                         