(function($){

var testFires = function()
{
	_translationsHash.addtext("rus", {
								"firesWidget.FireSpotClusters.Description" : "Очаги и границы пожаров",
								"firesWidget.FireSpotClusters.onlySpotDescription" : "Очаги пожаров",
								"firesWidget.FireSpotClusters.onlyClusterDescription" : "Границы пожаров",
								"firesWidget.FireSpotClusters.onlyDialyClusterDescription" : "Границы пожаров по дням",
								"firesWidget.FireClustersSimple.Description": "Пожары",
							 });
							 
	_translationsHash.addtext("eng", {
								"firesWidget.FireSpotClusters.Description" : "Fire spots and contours",
								"firesWidget.FireSpotClusters.onlySpotDescription" : "Fire spots",
								"firesWidget.FireSpotClusters.onlyClusterDescription" : "Fire contours",
								"firesWidget.FireSpotClusters.onlyDialyClusterDescription" : "Dialy fire contours",
								"firesWidget.FireClustersSimple.Description" : "Fires"
							 });

	/** Провайдер данных об очагах и кластерах пожаров
	* @memberOf cover
	* @class 
	* @param {Object} params Параметры класса: <br/>
	* <i> {String} host </i> Сервер, с которого берутся данные о пожарах. Default: http://sender.kosmosnimki.ru/
	* <i> {Bool} onlyPoints </i> Возвращать только точки без класетеров
	* <i> {Bool} onlyClusters </i> Возвращать только кластеры без точек
	* <i> {String} description </i> ID текста для описания в _translation_hash. Default: firesWidget.FireSpotClusters.Description
	*/
	var FireSpotClusterProvider = function( params )
	{
		var _params = $.extend({ host: 'http://sender.kosmosnimki.ru/', onlyPoints: false, onlyClusters: false, onlyDialyClusters: false, description: "firesWidget.FireSpotClusters.Description" }, params );
		
		this.getDescription = function() { return _gtxt(_params.description); }
		this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
		{
			var urlBbox = bbox ? '&Polygon=POLYGON((' + bbox.minX + ' ' + bbox.minY + ', ' + bbox.minX + ' ' + bbox.maxY + ', ' + bbox.maxX + ' ' + bbox.maxY + ', ' + bbox.maxX + ' ' + bbox.minY + ', ' + bbox.minX + ' ' + bbox.minY + '))' : "";
			//var urlBbox = '&Polygon=n';
			var urlFires = _params.host + "DBWebProxy.ashx?Type=GetClustersPoints&StartDate=" + dateBegin + "&EndDate=" + dateEnd + urlBbox;
			
			IDataProvider.sendCachedCrossDomainJSONRequest(urlFires, function(data)
			{
				if (data.Result != 'Ok')
				{
					onError( data.Result == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
					return;
				}
				
				var resArr = [];
				var clusters = {};
				var dailyClusters = {};
				for ( var d = 0; d < data.Response.length; d++ )
				{
					var a = data.Response[d];
					var hotSpot = {hotspotId: a[7], x: a[1], y: a[0], date: a[3], category: a[6] < 50 ? 0 : (a[4] < 100 ? 1 : 2), balloonProps: {"Время": a[4] + "&nbsp;(Greenwich Mean Time)", "Вероятность": a[5]} };
					resArr.push(hotSpot);
					var clusterID = 'id' + a[2];
					
					if (a[2] >= 0)
					{
						if (typeof clusters[clusterID] === 'undefined')
						{
							clusters[clusterID] = [];
							dailyClusters[clusterID] = {};
						}
							
						clusters[clusterID].push([hotSpot.x, hotSpot.y]);
						
						if (typeof dailyClusters[clusterID][hotSpot.date] === 'undefined')
							dailyClusters[clusterID][hotSpot.date] = [];
							
						dailyClusters[clusterID][hotSpot.date].push([hotSpot.x, hotSpot.y]);
					}
				}
				
				var resDialyClusters = [];
				var clustersMinMaxDates = {};
				for (var k in dailyClusters)
				{
					var minDate = null;
					var maxDate = null;
					for (var d in dailyClusters[k])
					{
						var curDate = $.datepicker.parseDate('yy.mm.dd', d).valueOf();
						minDate = minDate != null ? Math.min(curDate, minDate) : curDate;
						maxDate = maxDate != null ? Math.max(curDate, maxDate) : curDate;
					}
					
					var numberDays = maxDate - minDate;
					
					clustersMinMaxDates[k] = {min: $.datepicker.formatDate('yy.mm.dd', new Date(minDate)), max: $.datepicker.formatDate('yy.mm.dd', new Date(maxDate))};
					
					for (var d in dailyClusters[k])
					{
						var daysFromBegin = ($.datepicker.parseDate('yy.mm.dd', d).valueOf() - minDate)/(24*3600*1000);
						var colorIndex = Math.round(($.datepicker.parseDate('yy.mm.dd', d).valueOf() - minDate)/numberDays*127);
						var lines = getConvexHull(dailyClusters[k][d]);
						var polyCoordinates = [lines[0][0]];
				
						for (var l = 0; l < lines.length; l++)
							polyCoordinates.push(lines[l][1]);
						
						resDialyClusters.push( { geometry: {type: "POLYGON", coordinates: [polyCoordinates]}, styleID: colorIndex, balloonProps: {"Кол-во точек": clusters[k].length, "Cluster ID": k, "Дата": d, "День:": daysFromBegin} } );
					}
				}
				
				var resClusters = [];
				for (var k in clusters)
				{
					var lines = getConvexHull(clusters[k]);
					var polyCoordinates = [lines[0][0]];
			
					for (var l = 0; l < lines.length; l++)
						polyCoordinates.push(lines[l][1]);
					
					resClusters.push( { geometry: {type: "POLYGON", coordinates: [polyCoordinates]}, 
										balloonProps: {"Кол-во точек": clusters[k].length, "Дата начала": clustersMinMaxDates[k].min, "Дата конца": clustersMinMaxDates[k].max} } );
				}				
				
				if (_params.onlyClusters)
					onSucceess( resClusters );
				else if (_params.onlyDialyClusters)
					onSucceess( resDialyClusters );
				else if (_params.onlyPoints)
					onSucceess( resArr );
				else
					onSucceess( {fires: resArr, clusters: resClusters, dialyClusters: resDialyClusters} );
			});
		}
	}
	
	var FireClusterSimpleProvider = function( params )
	{
		var _params = $.extend({ host: 'http://sender.kosmosnimki.ru/', description: "firesWidget.FireClustersSimple.Description" }, params );
		
		this.getDescription = function() { return _gtxt(_params.description); }
		this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
		{
			var urlBbox = bbox ? '&Polygon=POLYGON((' + bbox.minX + ' ' + bbox.minY + ', ' + bbox.minX + ' ' + bbox.maxY + ', ' + bbox.maxX + ' ' + bbox.maxY + ', ' + bbox.maxX + ' ' + bbox.minY + ', ' + bbox.minX + ' ' + bbox.minY + '))' : "";
			//var urlBbox = '&Polygon=n';
			var urlFires = _params.host + "DBWebProxy.ashx?Type=GetClusters&StartDate=" + dateBegin + "&EndDate=" + dateEnd + urlBbox;
			
			IDataProvider.sendCachedCrossDomainJSONRequest(urlFires, function(data)
			{
				if (data.Result != 'Ok')
				{
					onError( data.Result == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
					return;
				}
				
				var resArr = [];
				var clusters = [];
				for ( var d = 0; d < data.Response.length; d++ )
				{
					var a = data.Response[d];
					var hotSpot = { x: a[2], y: a[1], power: a[7], points: a[5], balloonProps: {"Число точек": a[5], "Мощность": a[7]} };
					resArr.push(hotSpot);
				}
				
				onSucceess( resArr );
				
			});
		}
	}
	
	var FireClusterSimpleRenderer = function( params )
	{
		var _clusterObj = null;
		var _balloonProps = {};
		this.bindData = function(data)
		{
			if (_clusterObj) _clusterObj.remove();
			_balloonProps = {};
			_clusterObj = globalFlashMap.addObject();
			_clusterObj.setZoomBounds(1, 9);
			_clusterObj.setVisible(false);
			_clusterObj.setStyle(
				{ outline: { color: 0xff00ff, thickness: 2 }, fill: { color: 0xff00ff, opacity: 50 } },
				{ outline: { color: 0xff00ff, thickness: 3 }, fill: { color: 0xff00ff, opacity: 100 } }
			);
			
			for (var i = 0; i < data.length; i++) 
				(function(b){
					if (!b) return;
					var obj = _clusterObj.addObject();
					obj.setCircle(b.x, b.y, 100*b.power);
					//obj.setStyle({ outline: {color: 0x0000ff, thickness: 3 }, })
					_balloonProps[obj.objectId] = $.extend({}, b.balloonProps);
				})(data[i]);
				
			_clusterObj.enableHoverBalloon(function(o)
			{
				var p = _balloonProps[o.objectId];
							
				var res = "<b style='color: red;'>СЛЕД ПОЖАРА</b><br />";
				for ( var i in p )
					res += "<b>" + i + ":</b> " + p[i] + "<br />";
					
				return res + o.getGeometrySummary();
			});
		}
		
		this.setVisible = function(flag)
		{
			if (_clusterObj) _clusterObj.setVisible(flag);
		}
	}	

	var CombinedRenderer = function( params )
	{
		var _firesRenderer = new FireSpotRenderer( params );
		var _clustersRenderer = new FireBurntRenderer();
		
		this.bindData = function(data)
		{
			_firesRenderer.bindData(data.fires);
			_clustersRenderer.bindData(data.clusters);
		}
		
		this.setVisible = function(flag)
		{
			_firesRenderer.setVisible(flag);
			_clustersRenderer.setVisible(flag);
		}
	}
	
	var generatePalette = function( numberColors )
	{
		var minColors = [0xff, 0x00, 0x00];
		var maxColors = [0x00, 0x00, 0xff];
		
		var resPalette = [];
		for (var i = 0; i < numberColors; i++)
		{
			var alpha = i/(numberColors-1);
			var curR = Math.round(minColors[0]*alpha + maxColors[0]*(1-alpha));
			var curG = Math.round(minColors[1]*alpha + maxColors[1]*(1-alpha));
			var curB = Math.round(minColors[2]*alpha + maxColors[2]*(1-alpha));
			
			resPalette.push((curR << 16) + (curG << 8) + curB);
		}
		
		return resPalette;
	}

	$.getScript("qh.js", function()
	{
		var interval = setInterval(function()
		{
			if (_queryMapLayers.buildedTree)
			{
				clearInterval(interval);
				
				var table = $(_queryMapLayers.workCanvas).children("table")[0],
					div = _div(),
					verificationDiv = _div(null, [['attr', 'id', 'firesVerificationDiv']]);
				
				$(table).after(verificationDiv);
				$(table).after(div);
				
				mapCalendar.init(div, {
					dateFormat: "dd.mm.yy",
					dateMin: new Date(2010, 06, 29),
					dateMax: new Date(),
					showYear: false,
					periods: ['','day','week','month'],
					periodDefault: 'day',
					fires: {
						fires: false,
						images: false
						//initExtent: {minY: 56, maxY: 64, minX: 123, maxX: 139},
						//showInitExtent: true
					},
					cover: {
						dateFormat: "yy-mm-dd",
						cloud: 4,
						dateAttribute: "DATE",
						cloudsAttribute: "CLOUDS",
						icons: ['img/weather/16/0.png','img/weather/16/1.png','img/weather/16/9.png','img/weather/16/2.png','img/weather/16/3.png'],
						layers: [{group: "Spot4_Landsat5"}]
				}
				})
				
				//mapCalendar.getFireControl().addDataProvider( "FireClusters", new FireSpotClusterProvider({host: 'http://new.test2.kosmosnimki.ru/'}), new CombinedRenderer() );
				
				var palette = generatePalette(128);
				var styles = [];
				for (var c = 0; c < palette.length; c++)
					styles.push([{outline: { color: palette[c], thickness: 2 }}, {outline: { color: palette[c], thickness: 2 }}]);
						
				var defStyle = [
					{ outline: { color: 0xff0000, thickness: 2 }, fill: { color: 0xff0000, opacity: 30 } },
					{ outline: { color: 0xff0000, thickness: 2 }, fill: { color: 0xff0000, opacity: 30 } }
				];
				
				var customStyleProvider = function(obj)
				{
					return { marker: { image: '../images/fire_sample.png', center: true, scale: String(Math.sqrt(obj.points)/5)} };
				}
				
				mapCalendar.getFireControl().addDataProvider( "FireClusters", new FireSpotClusterProvider({host: 'http://new.test2.kosmosnimki.ru/', onlyClusters: true, description: "firesWidget.FireSpotClusters.onlyClusterDescription"}), new FireBurntRenderer({minZoom: 8, defStyle: defStyle}) );
				//mapCalendar.getFireControl().addDataProvider( "DialyFireClusters", new FireSpotClusterProvider({host: 'http://new.test2.kosmosnimki.ru/', onlyDialyClusters: true, description: "firesWidget.FireSpotClusters.onlyDialyClusterDescription"}), new FireBurntRenderer({minZoom: 10, styles: styles, bringToTop: true}) );
				mapCalendar.getFireControl().addDataProvider( "FirePoints", new FireSpotClusterProvider({host: 'http://new.test2.kosmosnimki.ru/', onlyPoints: true, description: "firesWidget.FireSpotClusters.onlySpotDescription"}), new FireSpotRenderer({minZoom: 12/*, verificationContainerID: 'firesVerificationDiv'*/}) );
				// mapCalendar.getFireControl().addDataProvider( "FireClustersSimple", new FireClusterSimpleProvider({host: 'http://new.test2.kosmosnimki.ru/'}), new FireClusterSimpleRenderer() );
				//mapCalendar.getFireControl().addDataProvider( "FireClustersSimple", new FireClusterSimpleProvider({host: 'http://new.test2.kosmosnimki.ru/', onlyPoints: true}), new FireSpotRenderer({fireIcon: '../images/fire_sample.png', maxZoom: 7}) );
				mapCalendar.getFireControl().addDataProvider( "FireClustersSimple", 
														      new FireClusterSimpleProvider({host: 'http://new.test2.kosmosnimki.ru/', onlyPoints: true}), 
															  new FireSpotRenderer({maxZoom: 7, customStyleProvider: customStyleProvider}) );
				
				_mapHelper.customParamsManager.addProvider({
					name: 'firesWidget',
					loadState: function(state) { mapCalendar.loadState(state); },
					saveState: function() { return mapCalendar.saveState(); }
				});
			}
		}, 200)	
	});
}

gmxCore.addModule('FiresMapplet2', 
{
	beforeViewer: function(){
		testFires();
	}
});

})(jQuery);