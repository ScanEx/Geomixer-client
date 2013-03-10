// ClustersLeaflet - менеджер кластеризации
(function()
{
	var LMap = null;						// leafLet карта
	var utils = null;						// утилиты для leaflet
	var mapNodes = null;					// Хэш нод обьектов карты - аналог MapNodes.hx

	var init = function()	{				// инициализация кластеризации слоя
		LMap = gmxAPI._leaflet['LMap'];
		utils = gmxAPI._leaflet['utils'];
		mapNodes = gmxAPI._leaflet['mapNodes'];
	}

	var ClustersLeaflet = {
		'getTileClusterArray': function(iarr, tileAttr)	{			// Получить кластеры тайла
			var attr = this;
			var node = this.node;
			var identityField = node['identityField'];
			var iterCount = (attr.iterationCount != null ? attr.iterationCount : 1);	// количество итераций K-means
			var radius = (attr.radius != null ? attr.radius : 20);						// радиус кластеризации в пикселах
			var input = attr['input'] || {};
			var newProperties = input['newProperties'] || {'Количество': '[objectInCluster]'};	// properties кластеров

			var mInPixel = gmxAPI._leaflet['mInPixel'];
			//var radMercator = radius * scale;			// размер радиуса кластеризации в метрах меркатора
			var x = tileAttr['x'];
			var y = 256 + tileAttr['y'];
			//var flag = identityField; 
			var grpHash = {};
			var arr = [];
			var cnt = 0;
			for(var i=0; i<iarr.length; i++) {
				var item = iarr[i];
				if (item.type.indexOf('Point') == -1) continue;
				var p = item.coordinates;
//				if(!tileAttr.bounds.contains(p)) continue;
				var px1 = p.x * mInPixel - x;
				var py1 = y - p.y * mInPixel;

				var dx = Math.floor(px1 / radius);		// Координаты квадранта разбивки тайла
				if(dx < 0) continue;
				var dy = Math.floor(py1 / radius);
				if(dy < 0) continue;
				var key = dx + '_' + dy;
				var ph = grpHash[key] || {};
				var parr = ph['arr'] || [];
				parr.push(cnt);
				cnt++;
				arr.push(item);
				ph.arr = parr;
				grpHash[key] = ph;
			}
/*			
			function setProperties(prop_:Hash<String>, len_:Int):Void
			{
				var regObjectInCluster = ~/\[objectInCluster\]/g;
				for (i in 0...Std.int(propFields[0].length)) {
					var key:String = propFields[0][i];
					var valStr:String = propFields[1][i];
					valStr = regObjectInCluster.replace(valStr, cast(len_));
					prop_.set(key, valStr);
				}
			}
*/			
			function getCenterGeometry(parr)
			{
				if (parr.length < 1) return null;
				var xx = 0; var yy = 0;
				var lastID = null;
				var members = [];
				for(var i=0; i<parr.length; i++) {
					var index = parr[i];
					var item = arr[index];
					if (parr.length == 1) return item;
					lastID = item.id;
					var p = item.coordinates;
					xx += p.x;
					yy += p.y;
					members.push(item);
				}
				xx /= parr.length;
				yy /= parr.length;

				var rPoint = new L.Point(xx, yy)
				var bounds = new L.Bounds();
				bounds.extend(rPoint);
				
				var res = {
					'id': lastID
					,'type': 'Point'
					,'bounds': bounds
					,'coordinates': rPoint
					,'properties': {
					}
					,'propHiden': {
						'subType': 'cluster'
						,'_members': members
					}
				};
				return res;
			}

			// find the nearest group
			function findGroup(point) {
				var min = Number.MAX_VALUE; //10000000000000;
				var group = -1;
				for(var i=0; i<centersGeometry.length; i++) {
					var item = centersGeometry[i];
					var center = item.coordinates;
					var x = point.x - center.x,
						y = point.y - center.y;
					var d = x * x + y * y;
					if(d < min){
						min = d;
						group = i;
					}
				}
				return group;
			}
			
			
			var centersGeometry = [];
			var objIndexes =  [];
			// преобразование grpHash в массив центроидов и MultiGeometry
			var clusterNum =  0;
			for (var key in grpHash)
			{
				var ph = grpHash[key];
				if (ph == null || ph.arr.length < 1) continue;
				objIndexes.push(ph.arr);
				var pt = getCenterGeometry(ph.arr);
				var prop = {};
				var first = arr[ph.arr[0]];
				if (ph.arr.length == 1) {
					prop = gmxAPI.clone(node.getPropItem(first));
				}
				else
				{
					clusterNum++;
					pt['id'] = 'cl_' + clusterNum;
					pt['subType'] = 'cluster';
					pt.propHiden.curStyle = attr.regularStyle;
					pt.propHiden.toFilters = node.filters;
					prop[identityField] = pt['id'];
					//prop['d'] = 'cl_' + clusterNum;
					//setProperties(prop, ph.arr.length);
				}

				if(first.propTemporal != null) pt.propTemporal = first.propTemporal;
				pt.properties = prop;
				centersGeometry.push(pt);
			}

			// Итерация K-means
			function kmeansGroups()
			{
				var newObjIndexes =  [];
				for(var i=0; i<arr.length; i++) {
				//for (i in 0...Std.int(geom.members.length))				{
					var item = arr[i];
					//if (!Std.is(geom.members[i], PointGeometry)) continue;
					//var member:PointGeometry = cast(geom.members[i], PointGeometry);
					var point = item.coordinates;

					var group = findGroup(point);
					
					if (!newObjIndexes[group]) newObjIndexes[group] = [];
					newObjIndexes[group].push(i);
				}
				centersGeometry = [];
				objIndexes =  [];

				var clusterNum =  0;
				for(var i=0; i<newObjIndexes.length; i++) {
				//for (arr in newObjIndexes)				{
					var parr = newObjIndexes[i];
					if (!parr || parr.length == 0) continue;
					var pt = getCenterGeometry(parr);
					var prop = {};
					if (parr.length == 1) {
						prop = gmxAPI.clone(node.getPropItem(arr[parr[0]]));
						//var propOrig = geom.members[parr[0]].properties;
						//for(key in propOrig.keys()) prop.set(key, propOrig.get(key));
						//pt.propHiden.set('_paintStyle', vectorLayerFilter.mapNode.regularStyle);
					}
					else
					{
						clusterNum++;
						pt['id'] = 'cl_' + clusterNum;
						pt['subType'] = 'cluster';
						pt.propHiden.curStyle = attr.regularStyle;
						pt.propHiden.toFilters = node.filters;
						//pt.propHiden['_paintStyle'] = attr.regularStyle;
						prop[identityField] = pt['id'];
						//prop['dgg'] = 'cl_' + clusterNum;
					}
					pt.properties = prop;
					if(arr[parr[0]].propTemporal != null) pt.propTemporal = arr[parr[0]].propTemporal;
					
					centersGeometry.push(pt);
					objIndexes.push(parr);
				}
			}
			
			for(var i=0; i<iterCount; i++) {	// Итерации K-means
				kmeansGroups();
			}
			
			var regObjectInCluster = /\[objectInCluster\]/g;
			var res = [];
			for(var i=0; i<centersGeometry.length; i++) {	// Подготовка геометрий
 				var item = centersGeometry[i];
 				if(item['subType'] === 'cluster') {
					var p = item.coordinates;
					var geo = gmxAPI._leaflet['PointGeometry']({'coordinates': [p.x, p.y]});
					geo.id = item.id + '_' + tileAttr['drawTileID'];
					geo.curStyle = item.curStyle;
					geo.properties = item.properties;
					for (var key in newProperties)
					{
						var zn = newProperties[key];
						if(zn.match(regObjectInCluster)) zn = zn.replace(regObjectInCluster, item.propHiden._members.length);
						geo.properties[key] = zn;
					}

					geo.propHiden = item.propHiden;
					geo.propHiden['tileID'] = tileAttr['drawTileID'];
					geo.propHiden['fromTiles'] = {};
					
					res.push(geo);
				} else {
					res.push(item);
				}
			}
			return res;
		}
		,'setClusters': function(ph, id)	{			// Добавить кластеризацию к векторному слою
			//console.log('setClustersLayer ', id , ph);
			if(!mapNodes) init()						// инициализация
			var node = mapNodes[id];						// лефлет нода слоя
			if(node['type'] == 'filter') {				// через фильтр
				node = mapNodes[node.parentId];
			}
			var layerID = node.id;
			var gmxNode = gmxAPI.mapNodes[layerID];				// mapNode слоя
			var out = {
				'input': ph
				,'node': node
				,'getTileClusterArray': ClustersLeaflet.getTileClusterArray
				,'getItemsByPoint': ClustersLeaflet.getItemsByPoint
			};
			if(ph.iterationCount) out['iterationCount'] = ph.iterationCount;	// количество итераций K-means
			if(ph.radius) out['radius'] = ph.radius;							// радиус кластеризации в пикселах
			
			gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onIconLoaded', 'func': function(eID) {	// проверка загрузки иконок
				if(eID.indexOf('_clusters')) {
					if(eID == layerID + '_regularStyle_clusters') {
						out.regularStyle['ready'] = true;
					} else if(eID == layerID + '_hoveredStyle_clusters') {
						out.hoveredStyle['ready'] = true;
					}
				}
				//console.log(' onIconLoaded: ' + eID + ' : '); 
			}});
			if(ph.RenderStyle) {
				out.regularStyle = utils.parseStyle(ph.RenderStyle, layerID + '_regularStyle_clusters');
				out.regularStyleIsAttr = utils.isPropsInStyle(out.regularStyle);
				if(!out.regularStyleIsAttr) out.regularStyle = utils.evalStyle(out.regularStyle)
				if(ph.HoverStyle && ph.RenderStyle.label && !ph.HoverStyle.label) ph.HoverStyle.label = ph.RenderStyle.label;
			}
			if(ph.HoverStyle) {
				out.hoveredStyle = utils.parseStyle(ph.HoverStyle, layerID + '_hoveredStyle_clusters');
				out.hoveredStyleIsAttr = utils.isPropsInStyle(out.hoveredStyle);
				if(!out.hoveredStyleIsAttr) out.hoveredStyle = utils.evalStyle(out.hoveredStyle)
			}
			gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {});	// Проверка map Listeners на hideBalloons
			this.clustersData = out;
			return out;
		}
	};

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['ClustersLeaflet'] = ClustersLeaflet;	// менеджер отрисовки
})();
