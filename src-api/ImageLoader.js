// imageLoader - менеджер загрузки image
(function()
{
    "use strict";
	var maxCount = 32;						// макс.кол. запросов
	var curCount = 0;						// номер текущего запроса
	var timer = null;						// таймер
	var items = [];							// массив текущих запросов
	var itemsCache = {};					// Кэш загруженных image по image.src
	var emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
	var falseFn = function () {	return false; };

	var parseSVG = function(item, str)	{		// парсинг SVG файла
		var out = {};
		var xml = gmxAPI.parseXML(str);
		
		var svg = xml.getElementsByTagName("svg");
		out.width = parseFloat(svg[0].getAttribute("width"));
		out.height = parseFloat(svg[0].getAttribute("height"));
		
		var polygons = svg[0].getElementsByTagName("polygon");
		var poly = [];
		for (var i = 0; i < polygons.length; i++)
		{
			var pt = {};
			var it = polygons[i];
			var hexString = it.getAttribute("fill"); hexString = hexString.replace(/^#/, '');
			pt.fill = parseInt(hexString, 16);
			pt.fill_rgba = gmxAPI._leaflet.utils.dec2rgba(pt.fill, 1);
			
			pt['stroke-width'] = parseFloat(it.getAttribute("stroke-width"));
			var points = it.getAttribute("points");
			if(points) {
				var arr = [];
				var pp = points.split(' ');
				for (var j = 0; j < pp.length; j++)
				{
					var t = pp[j];
					var xy = t.split(',');
					arr.push({x: parseFloat(xy[0]), y: parseFloat(xy[1])});
				}
				if(arr.length) arr.push(arr[0]);
			}
			pt.points = arr;
			poly.push(pt);
		}
		out.polygons = poly;
        //console.log('vvvvv ', item['src'], out);
		return out;
	}
	
	var callCacheItems = function(item)	{		// загрузка image
		if(itemsCache[item.src]) {
			var arr = itemsCache[item.src];
			var first = arr[0];
			for (var i = 0; i < arr.length; i++)
			{
				var it = arr[i];
				if(first.isError) {
					if(it.onerror) it.onerror(first.errorEvent);
				} else if(first.imageObj) {
					if(it.callback) it.callback(first.imageObj, false, it);
				} else if(first.svgPattern) {
					if(it.callback) it.callback(first.svgPattern, true, it);
				}
			}
			delete itemsCache[item.src];
		}
		nextLoad();
	}

	var setImage = function(item)	{		// загрузка image
        var arr = [];
        for(var i=0, len=items.length; i<len; i++) {
			var tItem = items[i];
            if(tItem.src === item.src) {
                itemsCache[item.src].push(tItem);
            } else {
                arr.push(tItem);
            }
        }
        items = arr;
		if(item.src.match(/\.svg$/)) {
			var xmlhttp = gmxAPI._leaflet.utils.getXmlHttp();
			xmlhttp.open('GET', item.src, false);
			xmlhttp.send(null);
			if(xmlhttp.status == 200) {
				item.svgPattern = parseSVG(item, xmlhttp.responseText);
				callCacheItems(item);
			}
			return;
		}

		var imageObj = new Image();
		var src = item.src;
		if(item.crossOrigin) {
            imageObj.crossOrigin = item.crossOrigin;
            if(item.crossOrigin === 'use-credentials') {    // иначе проблемы с кешированием заголовков
                src += (src.indexOf('?') === -1 ? '?':'&') + 'canvas=true';
            }
        }
		item.loaderObj = imageObj;
		//var cancelTimerID = null;
		var chkLoadedImage = function() {
            item.imageObj = imageObj;
            delete item.loaderObj;
            callCacheItems(item);
		}
		imageObj.onload = function(ev) {
            //console.log('ok ', ev.target.src);
			curCount--;
			if (gmxAPI.isIE) {
				setTimeout(function() { chkLoadedImage(); } , 0); //IE9 bug - black tiles appear randomly if call setPattern() without timeout
			} else {
				chkLoadedImage();
			}
		};
		imageObj.onerror = function(ev) {
            //console.log('onError', ev.target.src);
			curCount--;
			item.isError = true;
			item.errorEvent = ev;
			callCacheItems(item);
		};
		curCount++;
        //console.log('src', src);
		imageObj.src = src;
	}

	var nextLoad = function()	{		// загрузка image
		if(curCount > maxCount) return;
		if(items.length < 1) {
			curCount = 0;
			return false;
		}
		var item = items.shift();

		if(itemsCache[item.src]) {
			var pitem = itemsCache[item.src][0];
			if(pitem.isError) {
				if(item.onerror) item.onerror(null);
			} else if(pitem.imageObj) {
				if(item.callback) item.callback(pitem.imageObj, false, item);
			} else {
                //console.log('wait image: ', item.src);
				itemsCache[item.src].push(item);
			}
		} else {
			itemsCache[item.src] = [item];
			setImage(item);
		}
	}

	var removeItemsByZoom = function(zoom)	{	// остановить и удалить из очереди запросы не равные zoom
		if (!L.Browser.android) {
			for (var key in itemsCache)
			{
				var q = itemsCache[key][0];
				if('zoom' in q && q.zoom != zoom && q.loaderObj) {
                    if(q.loaderObj._item) {
                        q.loaderObj._item.callback = q.loaderObj._item.onerror = null;
                        delete q.loaderObj._item;
					}
                    q.loaderObj.src = emptyImageUrl;
                    curCount--;
				}
			}
		}
		var arr = [];
		for (var i = 0, len = items.length; i < len; i++)
		{
			var q = items[i];
			if(!q.zoom || q.zoom == zoom) arr.push(q);
		}
		items = arr;
		return items.length;
	}
	
	var chkTimer = function() {				// установка таймера
		if(!timer) {
			timer = setInterval(nextLoad, 50);
            gmxAPI._leaflet.LMap.on('zoomend', function(e) {
                var zoom = gmxAPI._leaflet.LMap.getZoom();
                removeItemsByZoom(zoom);
            });
		}
	}
	
	var imageLoader = {						// менеджер загрузки image
		push: function(item)	{					// добавить запрос в конец очереди
			items.push(item);
			chkTimer();
			return items.length;
		}
		,unshift: function(item)	{				// добавить запрос в начало очереди
			items.unshift(item);
			chkTimer();
			return items.length;
		}
		,getCounts: function()	{				// получить размер очереди + колич.выполняющихся запросов
			return items.length + (curCount > 0 ? curCount : 0);
		}
		,removeItemsBySrc: function(src)	{		// удалить запросы по src
            if (!L.Browser.android) {
                for (var key in itemsCache) {
                    var q = itemsCache[key][0];
                    if('src' in q && q.loaderObj && q.src.indexOf(src) !== -1) {
                        if(q.loaderObj._item) {
                            q.loaderObj._item.callback = q.loaderObj._item.onerror = null;
                            delete q.loaderObj._item;
                        }
                        q.loaderObj.src = emptyImageUrl;
                        curCount--;
                    }
                }
            }
            var arr = [];
            for (var i = 0, len = items.length; i < len; i++)
            {
                var q = items[i];
                if(!q.src || q.src.indexOf(src) === -1) arr.push(q);
            }
            items = arr;
            return items.length;
		}
		,clearLayer: function(id)	{				// Удалить все запросы по слою id
			for (var key in itemsCache) {
				var arr = itemsCache[key];
                for(var i=0, len=arr.length; i<len; i++) {
                    var item = arr[i];
                    if(item.layer == id) {
                        if('src' in item && item.loaderObj) {
                            //var loaderObj = item.loaderObj;
                            //if(loaderObj._item) {
                                //loaderObj._item.callback = loaderObj._item.onerror = null;
                                //delete item.loaderObj._item;
                            //}
                            item.loaderObj.src = emptyImageUrl;
                            curCount--;
                        }
                        // itemsCache[key].skip = true;
                        // if(item.onerror) item.onerror({skip: true, url: key, Error: 'removed by clearLayer'});
                    }
                }
                delete itemsCache[key];
			}
			var arr = [];
			for(var i=0, len=items.length; i<len; i++) {
				var item = items[i];
				if(item.layer != id) arr.push(item);
			}
			items = arr;
			return items.length;
		}
	};

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet.imageLoader = imageLoader;	// менеджер загрузки image
})();
