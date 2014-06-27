// Поддержка версионности слоев
(function()
{
	var intervalID = 0;
    var chkVersionTimeOut = 20000;
	var versionLayers = {};				// Версии слоев по картам

	// Запрос обновления версий слоев карты mapName
	function sendVersionRequest(host, mapName, arr, callback)
	{
		if(arr.length > 0) {
			gmxAPI.sendCrossDomainPostRequest(
				'http://' + host + '/Layer/CheckVersion.ashx',
				{'WrapStyle': 'message', 'layers':'[' + arr.join(',') + ']'},
				function(response) {
					if(response && response.Result && response.Result.length > 0) {
						// Обработка запроса изменения версий слоев
						CheckVersionResponse({host: host, mapName: mapName, arr: response.Result});
					}
					if(callback) callback(response);
				}
			);
		}
	}

    // Проверка версий слоев
    function chkVersion(e)
    {
        if(gmxAPI.isPageHidden()) return;
        var layersArr = gmxAPI.map.layers;
        for(var host in versionLayers) {
            var arr = [];
            for(var mapName in versionLayers[host]) {
                for(var layerName in versionLayers[host][mapName]) {
                    var layer = layersArr[layerName];
                    if(layer && (layer.isVisible || layer.stateListeners.onChangeLayerVersion)) {
                        arr.push('{ "Name":"'+ layerName +'","Version":' + layer.properties.LayerVersion +' }');
                    }
                }
            }
            if(arr.length > 0) {
                sendVersionRequest(host, mapName, arr);
                arr = [];
            }
        }
    }

	var setVersionCheck = function(msek) {
		if(intervalID) clearInterval(intervalID);		
		intervalID = setInterval(chkVersion, msek);
	}
	var mapInitID = gmxAPI._listeners.addListener({'eventName': 'mapInit', 'func': function(map) {
		setVersionCheck(chkVersionTimeOut);
		gmxAPI._listeners.removeListener(null, 'mapInit', mapInitID);
		}
	});

	// Обработка ответа запроса CheckVersion
	function CheckVersionResponse(inp)
	{
		var mapHost = inp.host;
		var arr = [];
		for (var i = 0, len = inp.arr.length; i < len; i++) {
			var ph = inp.arr[i],
                layerName = ph.properties.name,
                layer = gmxAPI.map.layers[layerName],
                mapName = layer.properties.mapName,
                prev = versionLayers[mapHost][mapName],
                ptOld = prev[layerName] || {};
			// обновить версию слоя
			layer.properties.LayerVersion = ph.properties.LayerVersion;
			layer._Processing = chkProcessing(layer, ph.properties);
			for (var key in ph.properties) {
                layer.properties[key] = ph.properties[key];
            }
			var pt = null;
			var attr = {
				processing: layer._Processing,
				notClear: true,
				refresh: true
			};
			if('_temporalTiles' in layer) {		// мультивременной слой	- обновить в Temporal.js
				pt = layer._temporalTiles.getTilesHash(ph.properties, ptOld.tilesHash);
				if(pt.count != ptOld.count || pt.add.length > 0 || pt.del.length > 0) {
					layer.properties.TemporalTiles = ph.properties.TemporalTiles;
					layer.properties.TemporalVers = ph.properties.TemporalVers;
					attr.add = pt.add;
					attr.del = pt.del;

					attr.ut1 = pt.ut1;
					attr.ut2 = pt.ut2;
					attr.dtiles = pt.dtiles;
				}
			} else {
				pt = getTilesHash(ph.properties, ptOld.tilesHash);
				if(pt.count != ptOld.count || pt.add.length > 0 || pt.del.length > 0) {
					layer.properties.tiles = attr.tiles = ph.properties.tiles;
					layer.properties.tilesVers = attr.tilesVers = ph.properties.tilesVers;
					attr.add = pt.add;
					attr.del = pt.del;
				}
			}
			versionLayers[mapHost][mapName][layerName] = { 'LayerVersion': layer.properties.LayerVersion, 'tilesHash': pt.hash, 'count': pt.count };
			layer.geometry = gmxAPI.from_merc_geometry(ph.geometry);	// Обновить геометрию слоя
			gmxAPI._listeners.dispatchEvent('onChangeLayerVersion', layer, layer.properties.LayerVersion );			// Listeners на слое - произошло изменение LayerVersion
			// обновить список тайлов слоя
			if(attr.add || attr.del || attr.dtiles) {
				gmxAPI._cmdProxy('startLoadTiles', { obj: layer, attr: attr });
			}
		}
		return arr;
	}

	// Формирование Hash списка версий тайлов
	function getTilesHash(prop, ph)
	{
		var tiles = prop.tiles || [],
            tilesVers = prop.tilesVers || [],
            len = tiles.length,
            out = {hash:{}, del: {}, add: [], count: len, res: false };		// в hash - Hash списка версий тайлов, в res = true - есть изменения с ph
		for (var i = 0; i < len; i+=3) {
			var x = tiles[i], y = tiles[i+1], z = tiles[i+2], v = tilesVers[i / 3];
			var arr = [x, y, z, v];
			var st = arr.join('_');
			out.hash[st] = true;
			if(ph && !ph[st]) {
				out.add.push(arr);
				out.del[z + '_' + x + '_' + y] = true;
			}
		}
		if(ph) {
			for (var key in ph) {
				if(!out.hash[key]) {
					var arr = key.split('_');
					out.del[arr[2] + '_' + arr[0] + '_' + arr[1]] = true;
				}
			}
		}
		return out;
	}

	// Получить список обьектов слоя добавляемых через addobjects
	function getAddObjects(Processing)
	{
		var arr = [];
		if (Processing.Updated && Processing.Updated.length > 0) {
			arr = arr.concat(Processing.Updated);
		}
		if (Processing.Inserted && Processing.Inserted.length > 0) {
			arr = arr.concat(Processing.Inserted);
		}
		return arr;
	}

	// Обработка списка редактируемых обьектов слоя	//addobjects
	function chkProcessing(obj, prop)
	{
		var flagEditItems = false;
		var removeIDS = {};
		if (prop.Processing.Deleted && prop.Processing.Deleted.length > 0) {		// список удаляемых обьектов слоя
			for (var i = 0, len = prop.Processing.Deleted.length; i < len; i++) {			// добавляемые обьекты также необходимо удалить из тайлов
				removeIDS[prop.Processing.Deleted[i]] = true;
				flagEditItems = true;
			}
		}
		var arr = getAddObjects(prop.Processing);		// addobjects
		for (var i = 0, len = arr.length; i < len; i++) {			// добавляемые обьекты также необходимо удалить из тайлов
			var pt = arr[i];
			removeIDS[pt.id] = true;
			flagEditItems = true;
		}
		var out = {
			removeIDS: removeIDS, 
			addObjects: arr 
		};
		if(flagEditItems) {
			gmxAPI._cmdProxy('setEditObjects', { obj: obj, attr: out });
			gmxAPI.addDebugWarnings({'func': 'chkProcessing', 'warning': 'Processing length: ' + arr.length, 'layer': prop.title});
		}
		return out;
	}
	
	var ret = {
		'chkVersionLayers': function (layers, layer) {
			if(!('LayerVersion' in layer.properties)) return;
			var prop = layer.properties;
			if(!prop.tilesVers && !prop.TemporalVers) return false;
            var mapHost = prop.hostName || layers.properties.hostName;
            var mapName = prop.mapName || layers.properties.name;
            if(!versionLayers[mapHost]) versionLayers[mapHost] = {};
            if(!versionLayers[mapHost][mapName]) versionLayers[mapHost][mapName] = {};
            var layerObj = ('stateListeners' in layer ? layer : gmxAPI.map.layers[prop.name]);
            var pt = ('_temporalTiles' in layerObj ? layerObj._temporalTiles.getTilesHash(prop) : getTilesHash(prop));
            versionLayers[mapHost][mapName][prop.name] = { 'LayerVersion': layer.properties.LayerVersion, 'tilesHash': pt.hash, 'count': pt.count };
		}
		,'chkVersion': function (layer) {		// Обработка списка редактируемых обьектов слоя
			if(!layer || !('Processing' in layer.properties)) return;
			var onLayerID = layer.addListener('onLayer', function(ph) {
				layer.removeListener('onLayer', onLayerID);
				if(!layer.properties.tilesVers && !layer.properties.TemporalVers) return false;
				gmxAPI._layersVersion.chkVersionLayers(layer.parent, layer);
				ph._Processing = chkProcessing(ph, ph.properties);			// слой инициализирован во Flash
			});
			var BeforeLayerRemoveID = layer.addListener('BeforeLayerRemove', function(layerName) {				// Удаляется слой
				layer.removeListener('BeforeLayerRemove', BeforeLayerRemoveID);
				if(layer.properties.name != layerName) return false;
				var mapHost = layer.properties.hostName;
				if(!versionLayers[mapHost]) return false;
				var mapName = layer.properties.mapName;
				if(!versionLayers[mapHost][mapName]) return false;
				delete versionLayers[mapHost][mapName][layer.properties.name];
				//gmxAPI._listeners.dispatchEvent('AfterLayerRemove', layer, layer.properties.name);	// Удален слой
			}, -9);
		}
		,'chkLayerVersion': function (layer, callback) {		// Запросить проверку версии слоя
			var prop = layer.properties;
			if(!prop.tilesVers && !prop.TemporalVers) return false;
			sendVersionRequest(prop.hostName, prop.mapName, ['{ "Name":"'+ prop.name +'","Version":' + prop.LayerVersion +' }'], callback);
		}
		,'setVersionCheck': setVersionCheck						// Переустановка задержки запросов проверки версий слоев
	};
	
	//расширяем namespace
    gmxAPI._layersVersion = ret;
})();
