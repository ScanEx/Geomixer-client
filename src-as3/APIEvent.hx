import flash.events.Event;

class APIEvent extends Event
{
    public static inline var CUSTOM_EVENT:String = "customevent";
    public var data:Dynamic;

    public function new( type:String, ?data:Null<Dynamic>, ?bubbles:Null<Bool>, ?cancelable:Null<Bool> )   
    {
        if (bubbles == null) bubbles = false;
        if (cancelable == null) cancelable = false;
        super(type, bubbles, cancelable);
        this.data = data;
    }
	
}