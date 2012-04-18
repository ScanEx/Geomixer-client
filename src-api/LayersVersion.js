// Поддержка версионности слоев
(function()
{
	var intervalID = 0;
	var versionLayers = {};				// Версии слоев по картам

	// Запрос обновления версий слоев карты mapName
	function sendVersionRequest(host, mapName, arr, callback)
	{
		if(arr.length > 0) {
			var url = 'http://' + host + '/Layer/CheckVersion.ashx?layers=[' + arr.join(',') + ']';
			gmxAPI.sendCrossDomainJSONRequest(
				url,
				function(response)
				{
					if(response && response['Result'] && response['Result'].length > 0) {
						// Обработка запроса изменения версий слоев
						CheckVersionResponse({'host': host, 'mapName': mapName, 'arr': response['Result']});
						if(callback) callback(response);
					}
				}
			);
		}
	}
	
	// Проверка версий слоев
	function chkVersion(e)
	{
		var arr = [];
		var layersArr = gmxAPI.map.layers;
		for(var host in versionLayers) {
			for(var mapName in versionLayers[host]) {
				for(var layerName in versionLayers[host][mapName]) {
					if(layersArr[layerName].isVisible) arr.push('{ "Name":"'+ layerName +'","Version":' + layersArr[layerName]['properties']['LayerVersion'] +' }');
				}
				if(arr.length > 0) {
					sendVersionRequest(host, mapName, arr);
					arr = [];
				}
			}
		}
	}

	gmxAPI._listeners.addListener(null, 'mapInit', function(map) {
		intervalID = setInterval(chkVersion, 20000);
	});

	// Обработка ответа запроса CheckVersion
	function CheckVersionResponse(inp)
	{
		var mapHost = inp.host;
		var mapName = inp.mapName;
		var prev = versionLayers[inp.host][inp.mapName];
		var arr = [];
		for (var i = 0; i < inp.arr.length; i++) {
			var ph = inp.arr[i];
			var layerName = ph.properties.name;
			var layer = gmxAPI.map.layers[layerName];
			// обновить версию слоя
			layer.properties['LayerVersion'] = ph.properties['LayerVersion'];
			layer['_Processing'] = chkProcessing(layer, ph.properties);

			var ptOld = prev[layerName];
			var pt = getTilesHash(ph.properties, ptOld['tilesHash']);
			if(pt['count'] != ptOld['count'] || pt['add'].length > 0 || pt['del'].length > 0) {
				// обновить список тайлов слоя
				layer.properties['tiles'] = ph.properties['tiles'];
				layer.properties['tilesVers'] = ph.properties['tilesVers'];
				var attr = {
					'processing': layer['_Processing'],
					'tiles': layer.properties['tiles'],
					'tilesVers': layer.properties['tilesVers'],
					'add': pt['add'],
					'del': pt['del'],
					'notClear': true,
					'refresh': true
				};
				gmxAPI._cmdProxy('startLoadTiles', { 'obj': layer, 'attr':attr });
			}
		}
		return arr;
	}

	// Формирование Hash списка версий тайлов
	function getTilesHash(prop, ph)
	{
		var tiles = prop.tiles || [];
		var tilesVers = prop.tilesVers || [];
		var out = {'hash':{}, 'del': {}, 'add': [], 'res': false };		// в hash - Hash списка версий тайлов, в res = true - есть изменения с ph
		for (var i = 0; i < tiles.length; i+=3) {
			var x = tiles[i];
			var y = tiles[i+1];
			var z = tiles[i+2];
			var v = tilesVers[i / 3];
			var arr = [x, y, z, v];
			var st = arr.join('_');
			out['hash'][st] = true;
			if(ph && !ph[st]) {
				out['add'].push(arr);
				out['del'][z + '_' + x + '_' + y] = true;
			}
		}
		if(ph) {
			for (var key in ph) {
				if(!out['hash'][key]) {
					var arr = key.split('_');
					out['del'][arr[2] + '_' + arr[0] + '_' + arr[1]] = true;
				}
			}
		}
		out['count'] = tiles.length;
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
		var removeIDS = {};
		if (prop.Processing.Deleted && prop.Processing.Deleted.length > 0) {		// список удаляемых обьектов слоя
			for (var i = 0; i < prop.Processing.Deleted.length; i++) {			// добавляемые обьекты также необходимо удалить из тайлов
				removeIDS[prop.Processing.Deleted[i]['id']] = true;
			}
		}
		var arr = getAddObjects(prop.Processing);		// addobjects
		for (var i = 0; i < arr.length; i++) {			// добавляемые обьекты также необходимо удалить из тайлов
			removeIDS[arr[i]['id']] = true;
		}
		var out = {
			'removeIDS': removeIDS, 
			'addObjects': arr 
		};
		gmxAPI._cmdProxy('setEditObjects', { 'obj': obj, 'attr':out });
		return out;
	}
	
	var ret = {
		'chkVersionLayers': function (layers, layer) {
			if('LayerVersion' in layer.properties) {
				var mapHost = layers.properties.hostName;
				var mapName = layers.properties.name;
				if(!versionLayers[mapHost]) versionLayers[mapHost] = {};
				if(!versionLayers[mapHost][mapName]) versionLayers[mapHost][mapName] = {};
				var pt = getTilesHash(layer.properties);
				versionLayers[mapHost][mapName][layer.properties.name] = { 'LayerVersion': layer.properties.LayerVersion, 'tilesHash': pt['hash'], 'count': pt['count'] };
			}
		}
		,'chkVersion': function (layer) {		// Обработка списка редактируемых обьектов слоя
			if(!layer || !('Processing' in layer.properties)) return;
			gmxAPI._listeners.addListener(layer, 'onLayer', function(ph) {
				ph['_Processing'] = chkProcessing(ph, ph.properties);
			});
		}
		,'chkLayerVersion': function (layer, callback) {		// Запросить проверку версии слоя
			var host = layer.properties.hostName;
			var mapName = layer.properties.mapName;
			var layerName = layer.properties.name;
			var LayerVersion = layer.properties.LayerVersion;
			sendVersionRequest(host, mapName, ['{ "Name":"'+ layerName +'","Version":' + LayerVersion +' }'], callback);
		}
	};
	
	//расширяем namespace
    gmxAPI._layersVersion = ret;
})();
