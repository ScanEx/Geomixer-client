//Управление временными тайлами
(function()
{
	var TemporalTiles =	function(obj_)		// атрибуты временных тайлов
	{
		var mapObj = obj_;	// Мультивременной слой
		var prop = mapObj.properties;	// Свойства слоя от сервера
		var TimeTemporal = true;		// Добавлять время в фильтры - пока только для поля layer.properties.TemporalColumnName == 'DateTime'

		var oneDay = 1000*60*60*24;	// один день
		var temporalData = null;
		var currentData = {};		// список тайлов для текущего daysDelta

		function prpTemporalTiles(data) {
			var deltaArr = [];			// интервалы временных тайлов [8, 16, 32, 64, 128, 256]
			var deltaHash = {};
			var ph = {};
			var arr = [];
			for (var nm=0; nm<data.length; nm++)
			{
				arr = data[nm];
				if(!gmxAPI.isArray(arr) || arr.length < 5) {
					gmxAPI.addDebugWarnings({'func': 'prpTemporalTiles', 'layer': prop.title, 'alert': 'Error in TemporalTiles array - line: '+nm+''});
					continue;
				}
				var z = arr[4];
				var i = arr[2];
				var j = arr[3];
				if(!ph[z]) ph[z] = {};
				if(!ph[z][i]) ph[z][i] = {};
				if(!ph[z][i][j]) ph[z][i][j] = [];
				ph[z][i][j].push(arr);

				if(!deltaHash[arr[0]]) deltaHash[arr[0]] = {};
				if(!deltaHash[arr[0]][arr[1]]) deltaHash[arr[0]][arr[1]] = [];
				deltaHash[arr[0]][arr[1]].push([i, j, z]);
			}
			var arr = [];
			for (var z in ph)
				for (var i in ph[z])
					for (var j in ph[z][i])
						arr.push(i, j, z);
			
			for (var delta in deltaHash) deltaArr.push(parseInt(delta));
			deltaArr = deltaArr.sort(function (a,b) { return a - b;});
			return {'dateTiles': arr, 'hash': ph, 'deltaHash': deltaHash, 'deltaArr': deltaArr};
		}

		temporalData = prpTemporalTiles(prop.TemporalTiles);
		var ZeroDateString = prop.ZeroDate || '01.01.2008';	// нулевая дата
		var arr = ZeroDateString.split('.');
		var ZeroDate = new Date(
			(arr.length > 2 ? arr[2] : 2008),
			(arr.length > 1 ? arr[1] - 1 : 0),
			(arr.length > 0 ? arr[0] : 1)
			);
		temporalData['ZeroDate'] = ZeroDate;
		var baseAddress = "http://" + prop.hostName + "/";
		var layerName = prop.name || prop.image;
		var sessionKey = isRequiredAPIKey( prop.hostName ) ? window.KOSMOSNIMKI_SESSION_KEY : false;
		var sessionKey2 = window.sessionKeyCache[prop.mapName];
		var prefix = baseAddress + 
				"TileSender.ashx?ModeKey=tile" + 
				"&MapName=" + prop.mapName + 
				"&LayerName=" + layerName + 
				(sessionKey ? ("&key=" + encodeURIComponent(sessionKey)) : "") +
				(sessionKey2 ? ("&MapSessionKey=" + sessionKey2) : "");
		if(prop._TemporalDebugPath) {
			prefix = prop._TemporalDebugPath;
			temporalData['_TemporalDebugPath'] = prop._TemporalDebugPath;
		}
		temporalData['_prefix'] = prefix;
		temporalData['identityField'] = prop.identityField;
		temporalData['TemporalColumnName'] = prop.TemporalColumnName || 'Date';
		temporalData['mapObj'] = mapObj;
		
		// Начальный интервал дат
		temporalData['DateEnd'] = new Date();
		if(prop.DateEnd) {
			var arr = prop.DateEnd.split('.');
			if(arr.length > 2) temporalData['DateEnd'] = new Date(arr[2], arr[1] - 1, arr[0]);
		}
		temporalData['DateBegin'] = new Date(temporalData['DateEnd'] - oneDay);

		this.temporalData = temporalData;


		var prpTemporalFilter = function(DateBegin, DateEnd, TemporalColumnName)	// Подготовка строки фильтра
		{
			var dt1 = DateBegin;		// начало периода
			var dt2 = DateEnd;			// конец периода
			var dt1str = dt1.getFullYear() + "." + gmxAPI.pad2(dt1.getMonth() + 1) + "." + gmxAPI.pad2(dt1.getDate());
			if(TimeTemporal) dt1str += ' ' + gmxAPI.pad2(dt1.getHours()) + ":" + gmxAPI.pad2(dt1.getMinutes()) + ":" + gmxAPI.pad2(dt1.getSeconds());
			var dt2str = dt2.getFullYear() + "." + gmxAPI.pad2(dt2.getMonth() + 1) + "." + gmxAPI.pad2(dt2.getDate());
			if(TimeTemporal) dt2str += ' ' + gmxAPI.pad2(dt2.getHours()) + ":" + gmxAPI.pad2(dt2.getMinutes()) + ":" + gmxAPI.pad2(dt2.getSeconds());
			var curFilter = "\""+TemporalColumnName+"\" >= '"+dt1str+"' AND \""+TemporalColumnName+"\" <= '"+dt2str+"'";
			return {'dt1': dt1, 'dt2': dt2, 'ut1': parseInt(dt1.getTime()/1000), 'ut2': parseInt(dt2.getTime()/1000), 'curFilter': curFilter};
		}

		var getDateIntervalTiles = function(dt1, dt2, tdata) {			// Расчет вариантов от begDate до endDate
			var days = parseInt(1 + (dt2 - dt1)/oneDay);
			var minFiles = 1000;
			var outHash = {};

			var ZeroDate = tdata['ZeroDate'];
			var _prefix = tdata['_prefix'];
			var _TemporalDebugPath = tdata['_TemporalDebugPath'];

			function getFiles(daysDelta) {
				var ph = {'files': [], 'dtiles': [], 'tiles': {}, 'out': ''};
				var mn = oneDay * daysDelta;
				var zn = parseInt((dt1 - ZeroDate)/mn);
				ph['beg'] = zn;
				ph['begDate'] = new Date(ZeroDate.getTime() + daysDelta * zn * oneDay);
				zn = parseInt(zn);
				var zn1 = Math.floor((dt2 - ZeroDate)/mn);
				ph['end'] = zn1;
				ph['endDate'] = new Date(ZeroDate.getTime() + daysDelta * oneDay * (zn1 + 1) - 1000);
				zn1 = parseInt(zn1);
				
				var dHash = tdata['deltaHash'][daysDelta] || {};
				for (var dz in dHash) {
					if(dz < zn || dz > zn1) continue;
					var arr = dHash[dz] || [];
					for (var i=0; i<arr.length; i++)
					{
						var pt = arr[i];
						var x = pt[0];
						var y = pt[1];
						var z = pt[2];
						var file = _prefix + "&Level=" + daysDelta + "&Span=" + dz + "&z=" + z + "&x=" + x + "&y=" + y;
						if(_TemporalDebugPath) file = _prefix + daysDelta + '/' + dz + '/' + z + '/' + x + '/' + z + '_' + x + '_' + y + '.swf'; // тайлы расположены в WEB папке
						
						if(!ph['tiles'][z]) ph['tiles'][z] = {};
						if(!ph['tiles'][z][x]) ph['tiles'][z][x] = {};
						if(!ph['tiles'][z][x][y]) ph['tiles'][z][x][y] = [];
						ph['tiles'][z][x][y].push(file);
						ph['files'].push(file);
					}
				}
				
				var arr = [];
				for (var z in ph['tiles'])
					for (var i in ph['tiles'][z])
						for (var j in ph['tiles'][z][i])
							arr.push(i, j, z);
				ph['dtiles'] = arr;
				return ph;
			}

			var deltaArr = tdata['deltaArr'];
			var i = deltaArr.length - 1;
			var curDaysDelta = deltaArr[i];
			while (i>=0)
			{
				curDaysDelta = deltaArr[i];
				if(days >= deltaArr[i]) {
					break;
				}
				i--;
			}
			var ph = getFiles(curDaysDelta);
			minFiles = ph['files'].length;

			var hash = prpTemporalFilter(dt1, dt2, tdata['TemporalColumnName']);
			var curTemporalFilter = hash['curFilter'];
			
			var tileDateFunction = function(i, j, z)
			{ 
				var filesHash = ph['tiles'] || {};
				var outArr = [];
				if(filesHash[z] && filesHash[z][i] && filesHash[z][i][j]) {
					outArr = filesHash[z][i][j];
				}
				return outArr;
			}

			var out = {
					'daysDelta': curDaysDelta
					,'files': ph['files']
					,'tiles': ph['tiles']
					,'dtiles': ph['dtiles'] || []		// список тайлов для daysDelta
					,'out': ph['out']
					,'beg': ph['beg']
					,'end': ph['end']
					,'begDate': ph['begDate']
					,'endDate': ph['endDate']
					,'ut1': hash['ut1']
					,'ut2': hash['ut2']
					,'dt1': dt1
					,'dt2': dt2
					,'curTemporalFilter': hash['curFilter']
					,'tileDateFunction': tileDateFunction
				};

			return out;
		}

		var ddt1 = new Date(); ddt1.setHours(0, 0, 0, 0);		// начало текущих суток
		var ddt2 = new Date(); ddt2.setHours(23, 59, 59, 999);	// конец текущих суток
		temporalData['currentData'] = getDateIntervalTiles(ddt1, ddt2, temporalData);	// По умолчанию за текущие сутки

		// 
		var me = this;
		
		var setDateInterval = function(dt1, dt2, tdata)
		{
			if(!tdata) tdata = me.temporalData;
			var mapObj = tdata['mapObj'];
			var currentData = tdata['currentData'];
			if(!dt1) {
				dt1 = currentData['dt1'];
			} else {
				currentData['dt1'] = dt1; 
			}
			if(!dt2) {
				dt2 = currentData['dt2'];
			} else {
				currentData['dt2'] = dt2; 
			}
			if(!mapObj.isVisible) return;

			var oldDt1 = currentData['begDate'];
			var oldDt2 = currentData['endDate'];
			var oldDaysDelta = currentData['daysDelta'];

			var hash = prpTemporalFilter(dt1, dt2, tdata['TemporalColumnName']);
			var ddt1 = hash['dt1'];
			var ddt2 = hash['dt2'];
			var data = getDateIntervalTiles(ddt1, ddt2, tdata);
			tdata['currentData'] = data;

			var attr = {
				'dtiles': (data['dtiles'] ? data['dtiles'] : []),
				'ut1': data['ut1'],
				'ut2': data['ut2']
			};
			if(oldDaysDelta == data['daysDelta'] && data['dt1'] >= oldDt1 && data['dt2'] <= oldDt2) {
						// если интервал временных тайлов не изменился и интервал дат не расширяется - только добавление новых тайлов 
				attr['notClear'] = true;
			} else {
				if(mapObj.tilesParent) {
					mapObj.tilesParent.clearItems();
				}
			}

			resetTiles(attr, mapObj);
			gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map);	// Проверка map Listeners на hideBalloons
			return data['daysDelta'];
		}
		this.setDateInterval = setDateInterval;
		
		var tileDateFunction = function(i, j, z)
		{ 
			var tdata = mapObj._temporalTiles.temporalData;
			var currentData = tdata['currentData']
			var filesHash = currentData['tiles'] || {};
			var outArr = [];
			if(filesHash[z] && filesHash[z][i] && filesHash[z][i][j]) {
				outArr = filesHash[z][i][j];
			}
			return outArr;
		}
		var setVectorTiles = function()
		{
			var tdata = mapObj._temporalTiles.temporalData;
			var currentData = tdata['currentData']
			var ph = {
				'tileDateFunction': tileDateFunction,
				'dtiles': (currentData['dtiles'] ? currentData['dtiles'] : []),
				'temporal': {
					'temporalFilter': (currentData['curTemporalFilter'] ? currentData['curTemporalFilter'] : '')
					,'TemporalColumnName': tdata['TemporalColumnName']
					,'ut1': currentData['ut1']
					,'ut2': currentData['ut2']
				}
			};
			mapObj.setVectorTiles(ph['tileDateFunction'], tdata['identityField'], ph['dtiles'], ph['temporal']);
		}
		this.setVectorTiles = setVectorTiles;

		resetTiles = function(attr, mapObj) {
			if(attr) startLoadTiles(attr, mapObj);
			for (var i=0; i<mapObj.filters.length; i++)	{ // переустановка фильтров
				mapObj.filters[i].setFilter(mapObj.filters[i]._sql, true);
			}
		}

		startLoadTiles = function(attr, mapObj) {
			var ret = gmxAPI._cmdProxy('startLoadTiles', { 'obj': mapObj, 'attr':attr });
			return ret;
		}

		//расширяем FlashMapObject
		gmxAPI.extendFMO('setDateInterval', function(dt1, dt2) {
			var tdata = this._temporalTiles.temporalData;
			setDateInterval(dt1, dt2, tdata);
		} );
		
		// Добавление прослушивателей событий
		gmxAPI._listeners.addMapStateListener(mapObj, 'onChangeVisible', function(flag)
			{
				if(flag) me.setDateInterval();
				gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map);	// Проверка map Listeners на hideBalloons
			}
		);
	}
	//расширяем namespace
    gmxAPI._TemporalTiles = TemporalTiles;
})();