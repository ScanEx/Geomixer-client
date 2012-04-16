import flash.events.Event;
	
class GetSWFTile
{
	private var onLoad:Array<Dynamic>->Void;
	private var links:Array<String>;
	private var data:Array<Dynamic>;

	private var count:Int;
	private var ver:Int;
	
	public function new(links_:Array<String>, ver_:Int, onLoad_:Array<Dynamic>->Void)
	{
		links = links_;
		ver = ver_;
		onLoad = onLoad_;
		init();
		count = links.length;
	}

	private function init()
	{
		data = new Array<Dynamic>();
		var me = this;
		for(url in links) {
			new GetSWFFile(url + '&v='+ver, function(arr:Array<Dynamic>) {
				me.count--;
				//for (it in arr) me.data.push(it);
				me.data = me.data.concat(arr);
				if (me.count < 1) {
					me.onLoad(me.data);
				}
			});
		}
	}
}