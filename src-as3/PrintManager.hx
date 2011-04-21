/*
	Copyright(c) 2007 AnyChart.Com. All rights reserved.	
	ACPrintManager is distributed under LGPL license version 3.
	see license.txt
*/ 
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.Stage;
	import flash.events.Event;
	import flash.external.ExternalInterface;
	import flash.utils.ByteArray;
	import flash.errors.Error;
	
	/**
	 * Class for working with browser printing
	 * @see http://www.anychart.com/blog/projects/acprintmanagerlibrary/
	 * @version 0.1
	 * @author Alex Batsuev (alex@sibental.com)
	 */
	class PrintManager {
	
		private static var stage:Stage;
		private static var data:BitmapData;
		
		private static var dataWidth:Int;
		private static var dataHeight:Int;
		
		private static var isIE:Bool = false;
		
		/**
		 * Sets content to be printed in browser
		 * @pararm content
		 */
		public static function setPrintableContent(content:BitmapData):Void {
			
			if (!isAvailable())
				throw new Error("Can't set content: External interface is not available");
			
			data = content;
			
			if (data == null) return;
			
			var pngData:ByteArray = PNGEncoder.encode(data);
			var base64Data:String = Base64.encode64(pngData, true);
			
			dataWidth = data.width;
			dataHeight = data.height;
			
			if (ExternalInterface.available && ExternalInterface.objectID != null) {
				ExternalInterface.call('ACPrintManager.initFF',ExternalInterface.objectID, base64Data);
			}
		}
		
		/**
		 * Initialize browser printing
		 * @param Stage
		 */
		public static function init(stage:Stage):Void {
			if (!isAvailable()) {
				//FIXME throw error
			}
			PrintManager.stage = stage;
			isIE = ExternalInterface.call('ACPrintManager.isIE');
			ExternalInterface.addCallback('getWidth',getWidth);
			ExternalInterface.addCallback('getHeight',getHeight);
			//if ie - add callbacks
			if (isIE) {
				ExternalInterface.addCallback('onBeforePrint', onBeforePrint);
				ExternalInterface.addCallback('onAfterPrint', onAfterPrint);
				ExternalInterface.call('ACPrintManager.initIE',ExternalInterface.objectID);
			}
		}
		
		private static function isAvailable():Bool {
			return ExternalInterface.available && ExternalInterface.objectID != null;
		}
		
		private static var bitmap:Bitmap;
		
		private static function onBeforePrint():Void {
			if (data == null || stage == null) return;
			bitmap = new Bitmap(data);
			stage.addChild(bitmap);
		}
		
		private static function onAfterPrint():Void {
			stage.removeChild(bitmap);
			bitmap = null;
		}
		
		private static function getWidth():Int {
			return dataWidth;
		}
		
		private static function getHeight():Int {
			return dataHeight;
		}
	}
