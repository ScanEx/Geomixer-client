import flash.events.Event;
import flash.utils.Timer;
import flash.events.TimerEvent;
	
class GetSWFTile
{
	private var onLoad:Array<Dynamic>->Void;
	private var links:Array<String>;
	private var data:Array<Dynamic>;
	private var myTimer:Timer;
	private static var reqCount:Int = 0;
	private static var reqLimit:Int = 16;
	
	public function new(links_:Array<String>, onLoad_:Array<Dynamic>->Void)
	{
		links = links_;
		onLoad = onLoad_;
		init();
	}

	private function init()
	{
		data = new Array<Dynamic>();
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
			if(myTimer.hasEventListener("timer")) myTimer.removeEventListener("timer", getNext);
			return;
		}
		else if(myTimer == null)
		{
			myTimer = new Timer(30);
			myTimer.addEventListener("timer", getNext);
			myTimer.start();
		}
		if (reqCount > reqLimit) return;
		var url:String = links.shift();
		reqCount++;
		new GetSWFFile(url, addMember);
	}
	
}