/*
      Adobe Systems Incorporated(r) Source Code License Agreement
      Copyright(c) 2005 Adobe Systems Incorporated. All rights reserved.
      Please read this Source Code License Agreement carefully before using
      the source code.
      Adobe Systems Incorporated grants to you a perpetual, worldwide, non-exclusive,
      no-charge, royalty-free, irrevocable copyright license, to reproduce,
      prepare derivative works of, publicly display, publicly perform, and
      distribute this source code and such derivative works in source or
      object code form without any attribution requirements.
      The name "Adobe Systems Incorporated" must not be used to endorse or promote products
      derived from the source code without prior written permission.
      You agree to indemnify, hold harmless and defend Adobe Systems Incorporated from and
      against any loss, damage, claims or lawsuits, including attorney's
      fees that arise or result from your use or distribution of the source
      code.
      
      THIS SOURCE CODE IS PROVIDED "AS IS" AND "WITH ALL FAULTS", WITHOUT
      ANY TECHNICAL SUPPORT OR ANY EXPRESSED OR IMPLIED WARRANTIES, INCLUDING,
      BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
      FOR A PARTICULAR PURPOSE ARE DISCLAIMED. ALSO, THERE IS NO WARRANTY OF
      NON-INFRINGEMENT, TITLE OR QUIET ENJOYMENT. IN NO EVENT SHALL MACROMEDIA
      OR ITS SUPPLIERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
      EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
      PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
      OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
      WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
      OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOURCE CODE, EVEN IF
      ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
  
	//import flash.geom.*;
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.utils.ByteArray;
  
	class PNGEncoder
	{
		public static function encode(img:BitmapData):ByteArray {
			var png:ByteArray = new ByteArray();
			png.writeUnsignedInt(0x89504e47);
			png.writeUnsignedInt(0x0D0A1A0A);
			// Build IHDR chunk
			var IHDR:ByteArray = new ByteArray();
			IHDR.writeInt(img.width);
			IHDR.writeInt(img.height);
			IHDR.writeUnsignedInt(0x08060000); // 32bit RGBA
			IHDR.writeByte(0);
			writeChunk(png,0x49484452,IHDR);
			// Build IDAT chunk
			var IDAT:ByteArray= new ByteArray();
			for(i in 0...img.height) {
				// no filter
				IDAT.writeByte(0);
				var p:UInt;
				var j:Int;
				if ( !img.transparent ) {
					for(j in 0...img.width) {
						p = img.getPixel(j,i);
						IDAT.writeUnsignedInt(((p&0xFFFFFF) << 8)|0xFF);
					}
				} else {
					for(j in 0...img.width) {
						p = img.getPixel32(j,i);
						IDAT.writeUnsignedInt(((p&0xFFFFFF) << 8)|(p>>>24));
					}
				}
			}
			IDAT.compress();
			writeChunk(png,0x49444154,IDAT);
			// Build IEND chunk
			writeChunk(png,0x49454E44,null);
			// return PNG
			return png;
		}
		
		private static var crcTable:Array<UInt>;
		private static var crcTableComputed:Bool = false;
		
		private static function writeChunk(png:ByteArray, type:UInt, data:ByteArray):Void {
			if (!crcTableComputed) {
				crcTableComputed = true;
				crcTable = [];
				var c:UInt;
				for (n in 0...256) {
					c = n;
					for (k in 0...8) {
						if ((c & 1) != 0) {
							c = 0xedb88320 ^ (c >>> 1);
						} else {
							c = c >>> 1;
						}
					}
					crcTable[n] = c;
				}
			}
			var len:UInt = 0;
			if (data != null) {
				len = data.length;
			}
			png.writeUnsignedInt(len);
			var p:UInt = png.position;
			png.writeUnsignedInt(type);
			if ( data != null ) {
				png.writeBytes(data);
			}
			var e:UInt = png.position;
			png.position = p;
			var c:UInt = 0xffffffff;
			for (i in 0...(e-p)) {
				c = crcTable[(c ^ png.readUnsignedByte()) & 0xff] ^ (c >>> 8);
			}
			c = c ^ 0xffffffff;
			png.position = e;
			png.writeUnsignedInt(c);
		}
	}
