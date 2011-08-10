import flash.display.Sprite;

class MultiGeometry extends Geometry
{
	public var members:Array<Geometry>;

	public function new()
	{
		super();
		members = new Array<Geometry>();
	}

	public override function paintWithExtent(sprite:Sprite, style:Style, window:MapWindow)
	{
		if (extent.overlaps(window.visibleExtent)) {
			for (member in members)
				member.paintWithExtent(sprite, style, window);
		} else {
			refreshFlag = true;
		}
	}

	public override function paint(sprite:Sprite, style: Style, window:MapWindow)
	{
		for (member in members) {
			//member.refreshFlag = true;
			member.paint(sprite, style, window);
		}
	}

	public override function distanceTo(x:Float, y:Float):Float
	{
		var distance = Geometry.MAX_DISTANCE;
		for (member in members)
			distance = Math.min(distance, member.distanceTo(x, y));
		return distance;
	}

	public function addMember(member:Geometry)
	{
		if (Std.is(member, MultiGeometry))
			for (member_ in cast(member, MultiGeometry).members)
				addMember(member_);
		else
		{
			members.push(member);
			extent.update(member.extent.minx, member.extent.miny);
			extent.update(member.extent.maxx, member.extent.maxy);
		}
		refreshFlag = true;
	}

	public override function export():Dynamic
	{
		var singleType = "";
		var coords = [];
		for (member in members)
		{
			var exp = member.export();
			singleType = cast(exp.type, String);
			coords.push(exp.coordinates);
		}
		
		return {
			type: "MULTI" + singleType,
			coordinates: coords
		};
	}

	public override function getLength():Float
	{
		var ret:Float = 0.0;
		for (member in members)
			ret += member.getLength();
		return ret;
	}

	public override function getArea():Float
	{
		var ret:Float = 0.0;
		for (member in members)
			ret += member.getArea();
		return ret;
	}

	public override function forEachLine(func:LineGeometry->Void):Bool
	{
		var ret = false;
		refreshFlag = true;
		for (member in members)
		{
			var ret2 = member.forEachLine(func);
			ret = ret || ret2;
		}
		return ret;
	}
}