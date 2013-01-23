// imageLoader - менеджер загрузки image
(function()
{
	var maxCount = 48;						// макс.кол. запросов
	var curCount = 0;						// номер текущего запроса
	var timer = null;						// таймер
	var items = [];							// массив текущих запросов
	var itemsHash = {};						// Хэш по image.src
	var itemsCache = {};					// Кэш загруженных image по image.src

	var callCacheItems = function(item)	{		// загрузка image
		if(itemsCache[item.src]) {
			var arr = itemsCache[item.src];
			var first = arr[0];
			for (var i = 0; i < arr.length; i++)
			{
				var it = arr[i];
				if(first.isError) {
					if(it.onerror) it.onerror(null);
				} else if(first.imageObj) {
					if(it.callback) it.callback(first.imageObj);
				}
			}
			//itemsCache[item.src] = [first];
			delete itemsCache[item.src];
		} else {
			//item.onerror(null);
			//console.log('callCacheItems ', item);
		}
		nextLoad();
	}
	var setImage = function(item)	{		// загрузка image
		var imageObj = item['img'] || new Image();
		var chkLoadedImage = function() {
			//if (!imageObj.complete) {
				//setTimeout(function() { chkLoadedImage(); }, 1);
			//} else {
				curCount--;
				item.imageObj = imageObj;
				callCacheItems(item);
			//}
		}
		if(item['crossOrigin']) imageObj.crossOrigin = item['crossOrigin'];
		imageObj.onload = function() {
			chkLoadedImage();
			//setTimeout(function() { chkLoadedImage(); } , 25); //IE9 bug - black tiles appear randomly if call setPattern() without timeout
		};
		imageObj.onerror = function() { curCount--; item.isError = true;
			//setTimeout(function() { chkLoadedImage(); } , 25);
			callCacheItems(item);
			} ;
		curCount++;
		imageObj.src = item.src;
	}
		
	var nextLoad = function()	{		// загрузка image
		if(curCount > maxCount) return;
		if(items.length < 1) return false;
		var item = items.shift();
		//if(item.bounds && !item.shiftY && !gmxAPI._leaflet['zoomstart']) {			// удаление устаревших запросов по bounds
/*		if(item.bounds && !item.shiftY) {			// удаление устаревших запросов по bounds
			if(!gmxAPI._leaflet['utils'].chkBoundsVisible(item.bounds)) {
				curCount--; item.isError = true;
				callCacheItems(item);
				//item.onerror(null);
				return;
			}
		}*/
		
		if(itemsCache[item.src]) {
			var pitem = itemsCache[item.src][0];
			if(pitem.isError) {
				if(item.onerror) item.onerror(null);
			} else if(pitem.imageObj) {
				if(item.callback) item.callback(pitem.imageObj);
			} else {
				itemsCache[item.src].push(item);
			}
		} else {
			itemsCache[item.src] = [item];
			setImage(item);
		}
	}
	
	var chkTimer = function() {				// установка таймера
		if(!timer) timer = setInterval(nextLoad, 50);
	}
	
	var imageLoader = {						// менеджер загрузки image
		'push': function(item)	{					// добавить запрос в конец очереди
			items.push(item);
			chkTimer();
			return items.length;
		}
		,'unshift': function(item)	{				// добавить запрос в начало очереди
			items.unshift(item);
			chkTimer();
			return items.length;
		}
	};

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['imageLoader'] = imageLoader;	// менеджер загрузки image
})();
