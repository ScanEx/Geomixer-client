import flash.display.Stage;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.events.KeyboardEvent;
import flash.errors.Error;

class Key 
{
	private static var initialized:Bool = false;
	private static var keysDown:IntHash<Bool> = new IntHash<Bool>();
       
	public static function initialize(stage:Stage) 
	{
		if (!initialized) 
		{
			stage.addEventListener(KeyboardEvent.KEY_DOWN, function(event:KeyboardEvent) {
//trace('dddddddddddddd ' + event.keyCode);
//if(event.keyCode == 192) Main.testFilter();
				Key.keysDown.set(event.keyCode, true);
			});
			stage.addEventListener(KeyboardEvent.KEY_UP, function(event:KeyboardEvent) { Key.keysDown.remove(event.keyCode); });
			stage.addEventListener(Event.DEACTIVATE, function(event:Event) { Key.keysDown = new IntHash<Bool>(); });
			stage.addEventListener(MouseEvent.MOUSE_MOVE, function(event:MouseEvent)
			{
				if (event.shiftKey)
					Key.keysDown.set(16, true);
				else
					Key.keysDown.remove(16);
			});
			initialized = true;
		}
	}

    public static function isDown(keyCode:Int)
	{
		if (!initialized) 
			throw new Error("Key class has yet been initialized.");
		return keysDown.exists(keyCode);
	}
}