// drawManager - менеджер отрисовки
(function()
{
	var timerID = null;						// таймер
	var itemsHash = {};						// Хэш нод требующих отрисовки

	var repaintItems = function()	{			// отрисовка ноды
        var len = Object.keys(itemsHash).length;
		if(len < 1) {
			if(timerID) clearInterval(timerID);
			timerID = null;
			return false;
		}
		var nodes = gmxAPI._leaflet.mapNodes;
		for (var id in itemsHash) {
			var node = nodes[id];
			if(node) gmxAPI._leaflet.utils.repaintNode(node, true);
		}
		itemsHash = {};
		return true;
	}
	
	var chkTimer = function() {				// установка таймера
		if(!timerID) timerID = setInterval(repaintItems, 20);
	}
	
	var drawManager = {						// менеджер отрисовки
		'add': function(id)	{					// добавить ноду для отрисовки
			var node = gmxAPI._leaflet.mapNodes[id];
			if(!node) return false;
			itemsHash[id] = true;
			chkTimer();
			return Object.keys(itemsHash).length;
		}
		,'remove': function(id)	{				// удалить ноду
			if(itemsHash[id]) {
				delete itemsHash[id];
				return true;
			}
			return false;
		}
		,'repaint': function()	{				// отрисовка нод
			repaintItems();
		}
	};

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet.drawManager = drawManager;	// менеджер отрисовки
})();
