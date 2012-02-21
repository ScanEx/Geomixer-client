(function($){
	var coverageContainers = {};
	var layerStatus = {};

	var fnRefreshLayer = function(layerId){
		var layer = _mapHelper.findElem(_mapHelper.mapTree, "LayerID", layerId, []);
		if (!layerStatus[layerId]) return;
		
		if(layerId in coverageContainers) {
			removeChilds(coverageContainers[layerId]);
		}
		else {
			coverageContainers[layerId] = _span();
			var interval = setInterval(function(){
				var oNode = $("div[LayerID='" + layerId + "']", _queryMapLayers.buildedTree);
				if (oNode.length == 1){
					clearInterval(interval);
					_( oNode[0], [coverageContainers[layerId]]);
				}
			}, 20);
		}
		if (layerStatus[layerId] == 1){
			var sSubject = escape("Coverage layerName=" + layer.elem.content.properties.title);
			var sBody = escape("LayerID=" + layerId + "; User: " + nsGmx.AuthManager.getNickname() + "; Map ID: " + _mapHelper.mapProperties.name + "; Map Title: " + _mapHelper.mapProperties.title);
			var sLink = "mailto:sales@scanex.ru?subject=" + sSubject + "&body=" + sBody;
			var btnSend = _a([_t('Отправить заказ')], [["attr", "href", sLink]]);
			btnSend.onclick = function(){
				layerStatus[layerId] = 2;
				fnRefreshLayer(layerId);
			}
			_(coverageContainers[layerId], [btnSend]);
		}
		else{
			var lblAreadySent = _span([_t('Заказ отправлен')], [['css', 'font-style', 'italic'], ['css', 'color', 'red']]);
			_(coverageContainers[layerId], [lblAreadySent]);
		}
	}
	
	var fnRefreshTree = function(){
		for (var layerId in layerStatus){
			fnRefreshLayer(layerId);
		}
	}
	
	_userObjects.addDataCollector('Coverage', {
		collect: function(){
			return layerStatus;
		},
		load: function(data){
			if (data)
			{
				layerStatus = data;
				
				fnRefreshTree();
			}
			else
			{
				layerStatus = {};
			}
		}
	});
	
	
	
	var afterViewer = function(){
		fnRefreshTree();
		$(_mapHelper.mapTree).bind('addTreeElem', function(event, layer){
			layerStatus[layer.content.properties.LayerID] = 1;
			fnRefreshLayer(layer.content.properties.LayerID);
		})
	}
	
	var publicInterface = {
		afterViewer: afterViewer
	}

	gmxCore.addModule("Coverage", publicInterface, {init: function(module, path)
		{
			pluginPath = path;
		}
	});

})(jQuery)