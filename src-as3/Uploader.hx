import flash.display.Sprite;
import flash.display.Stage;
import flash.display.StageAlign;
import flash.display.StageScaleMode;
import flash.ui.ContextMenu;
import flash.net.FileReference;
import flash.net.FileReferenceList;
import flash.net.FileFilter;
import flash.net.URLRequest;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.events.SecurityErrorEvent;
import flash.events.HTTPStatusEvent;
import flash.events.IOErrorEvent;
import flash.events.ProgressEvent;
import flash.external.ExternalInterface;
import flash.geom.Matrix;

class Uploader
{
	static function main()
	{
		var root = flash.Lib.current;
		var stage = root.stage;

		stage.align = StageAlign.TOP_LEFT;
		stage.scaleMode = StageScaleMode.NO_SCALE;

		var menu = new ContextMenu();
		menu.hideBuiltInItems();
		root.contextMenu = menu;

		var sprite = new Sprite();
		root.addChild(sprite);

		sprite.buttonMode = sprite.useHandCursor = true;

		var g = sprite.graphics;
		g.beginFill(0xffffff, 0.0);
		g.moveTo(0, 0);
		g.lineTo(1000, 0);
		g.lineTo(1000, 1000);
		g.lineTo(0, 1000);
		g.endFill();		

		var eventFunc:String = root.loaderInfo.parameters.eventFunc;

		var isMultiple:Bool = false;
		var filters:Array<FileFilter> = new Array<FileFilter>();
		var currentRef:Dynamic = null;

		ExternalInterface.addCallback("addFilter", function(desc:String, exts:String)
		{
			filters.push(new FileFilter(desc, exts));
		});

		ExternalInterface.addCallback("setMultiple", function(flag:Bool)
		{
			isMultiple = flag;
		});

		ExternalInterface.addCallback("upload", function(url:String)
		{
			var finish = function(eventName:String)
			{
				ExternalInterface.call(eventFunc, eventName);
				currentRef = null;
			}
			

			var uploadOneFile = function(ref:FileReference, onProgress:Float->Void, onComplete:Void->Void)
			{
				var onError = function(e:Event)
				{
					finish("onError");
				}

				ref.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onError);
				ref.addEventListener(HTTPStatusEvent.HTTP_STATUS, onError);
				ref.addEventListener(IOErrorEvent.IO_ERROR, onError);

				ref.addEventListener(ProgressEvent.PROGRESS, function(e:ProgressEvent)
				{
					onProgress(e.bytesLoaded*1.0/e.bytesTotal);
				});

				ref.addEventListener(Event.COMPLETE, function(e:Event)
				{
					onComplete();
				});

				ref.upload(new URLRequest(url));
			}

			if (isMultiple)
			{
				var refs = cast(currentRef, FileReferenceList).fileList;
				var nextIdx = 0;
				var loadNext:Void->Void = null;
				loadNext = function()
				{
					if (nextIdx == refs.length)
						finish("onComplete");
					else
					{
						var idx = nextIdx;
						nextIdx += 1;
						uploadOneFile(
							refs[idx],
							function(f:Float)
							{
								ExternalInterface.call(eventFunc, "onProgress", 100.0*(idx + f)/refs.length);
							},
							loadNext
						);
					}							
				}
				loadNext();
			}
			else
			{
				uploadOneFile(
					currentRef,
					function(f:Float)
					{
						ExternalInterface.call(eventFunc, "onProgress", f*100.0);
					},
					function()
					{
						finish("onComplete");
					}
				);
			}
		});

		sprite.addEventListener(MouseEvent.CLICK, function(e:MouseEvent)
		{
			if (currentRef == null)
			{
				if (isMultiple)
					currentRef = new FileReferenceList();
				else
					currentRef = new FileReference();
	
				currentRef.addEventListener(Event.SELECT, function(e:Event)
				{
					ExternalInterface.call(eventFunc, "onSelect");
				});
				currentRef.addEventListener(Event.CANCEL, function(e:Event)
				{
					currentRef = null;
				});
				currentRef.browse(filters);
			}
		});

		ExternalInterface.call(eventFunc, "onLoad");
	}
}