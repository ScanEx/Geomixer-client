import flash.events.Event;
import flash.utils.Timer;
import flash.events.TimerEvent;
	
class GetSWFTile
{
	private var onLoad:Array<Dynamic>->Void;
	private var links:Array<String>;
	private var data:Array<Dynamic>;
	private var loaders:Array<GetSWFFile>;

	private var myTimer:Timer;
	private static var reqCount:Int = 0;
	private static var reqLimit:Int = 8;
	
	public function new(links_:Array<String>, onLoad_:Array<Dynamic>->Void)
	{
		links = links_;
		onLoad = onLoad_;
		init();
		//trace('--------linkslinkslinks ---------- ' + links.length + ' : ' );
	}

	private function init()
	{
		data = new Array<Dynamic>();
		loaders = new Array<GetSWFFile>();
		myTimer = null;
		myTimer = new Timer(10);
		myTimer.addEventListener("timer", getNext);
		myTimer.start();
	}

	public function addMember(arr:Array<Dynamic>)
	{
		if (arr != null) {
			data = data.concat(arr);
		}
		arr = null;

		reqCount--;
		//trace('------------------ ' + reqCount + ' : ' + links.length);
		if (links.length < 1) 
		{
			onLoad(data);
			//data = null;
			//for (loader in loaders) loader = null;
			//loaders = null;
			if(myTimer != null) {
				myTimer.stop();
				if (myTimer.hasEventListener("timer")) myTimer.removeEventListener("timer", getNext);
				return;
			}
		}
	}

	private function getNext(?event:TimerEvent)
	{
		
		//trace('nnnnnnnnnnn ' + reqCount + ' : ' + reqLimit + ' : ' + links.length + ' : ' + myTimer.currentCount);
		if (reqCount > reqLimit || links.length < 1) return;
		var url:String = links.shift();
		reqCount++;
		loaders.push(new GetSWFFile(url, addMember));
	}
	
}