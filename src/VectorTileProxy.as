import flash.external.*;

class VectorTileProxy 
{
	static function main(mc)
	{
		System.security.allowDomain("*");

		var deepCopy;
		deepCopy = function(obj)
		{
			var type = typeof obj;
			if (type == "string")
				return obj;
			if (type == "number")
				return obj;
			if (type == "object")
			{
				if (obj.concat)
				{
					var ret = [];
					for (var i = 0; i < obj.length; i++)
						ret[i] = deepCopy(obj[i]);
					return ret;
				}
				else
				{
					var ret = {};
					for (var key in obj)
						ret[key] = deepCopy(obj[key]);
					return ret;
				}
			}
		}

		mc.loadClip = function(id, url, parentClip, onLoad, onError)
		{
			var loader = new MovieClipLoader();
			loader.addListener({ 
				onLoadInit: function(loadedClip)
				{
					if (onLoad)
						onLoad({ shapes: deepCopy(loadedClip.shapes) });
				},
				onLoadError: onError || function() {}
			});
			loader.loadClip(url, parentClip.createEmptyMovieClip(id, parentClip.getNextHighestDepth()));
		}
	}
}
