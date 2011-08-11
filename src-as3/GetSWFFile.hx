import flash.errors.Error;
import flash.net.URLRequest;
import flash.net.URLStream;
import flash.events.IOErrorEvent;
import flash.net.ObjectEncoding;
import flash.events.Event;

class GetSWFFile
{
	private var onLoad:Array<Dynamic>->Void;
	private var url:String;
	private var stream:URLStream;
	
	public function new(url_:String, onLoad_:Array<Dynamic>->Void)
	{
		url = url_;
		onLoad = onLoad_;
		init();
	}

	private function init()
	{
		stream = new URLStream();
		stream.objectEncoding = ObjectEncoding.AMF3;
		stream.addEventListener(IOErrorEvent.IO_ERROR, onError);
		stream.addEventListener(Event.COMPLETE, onComplete);
		stream.load(new flash.net.URLRequest(url));
	}
	
	private function destructor(data:Array<Dynamic>)
	{
		stream.removeEventListener(IOErrorEvent.IO_ERROR, onError);
		stream.removeEventListener(Event.COMPLETE, onComplete);
		onLoad(data);
		if ( stream.connected ) stream.close();
		data = null;
		stream = null;
	}
	private function onError(event:Event)
	{
		trace("error reading vector tile: " + url);
		destructor(null);
	}

	private function onComplete(event:Event)
	{
		var arr:Array<Dynamic> = [];
		try {
			arr = stream.readObject();
		} catch(e:Error) {
			//trace('File not found: ' + url);	// Скорее всего от сервера пришел статус ответа 200 вместо 404
		}
		destructor(arr);
	}
}