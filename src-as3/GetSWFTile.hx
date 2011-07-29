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
	}

	private function init()
	{
		data = new Array<Dynamic>();
		loaders = new Array<GetSWFFile>();
		myTimer = null;
		getNext();
	}

	public function addMember(arr:Array<Dynamic>)
	{
		if (arr != null) {
			data = data.concat(arr);
		}
		arr = null;

		reqCount--;
		getNext();
	}

	private function getNext(?event:TimerEvent)
	{
		if (links.length < 1) 
		{
			onLoad(data);
			myTimer.stop();
			if (myTimer.hasEventListener("timer")) myTimer.removeEventListener("timer", getNext);
			data = null;
			for (loader in loaders) loader = null;
			loaders = null;
			return;
		}
		else if(myTimer == null)
		{
			myTimer = new Timer(10);
			myTimer.addEventListener("timer", getNext);
			myTimer.start();
		}
		if (reqCount > reqLimit) return;
		var url:String = links.shift();
		reqCount++;
		loaders.push(new GetSWFFile(url, addMember));
	}
	
}