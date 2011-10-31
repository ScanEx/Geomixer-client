(function(){

	var winds = null;
	var weathers = null;
	//params:
	//    countryCode - {string} "0" для России
	//    initWeather - {bool, default: true} Показывать ли погоду по умолчанию
	//    initWind    - {bool, default: true} Показывать ли ветер по умолчанию
	//    imagesHost  - {Sting, default: 'http://maps.kosmosnimki.ru/api/img/weather/'} откуда подгружать картинки для иконок
	//    changeCallback - {function()} ф-ция, которую нужно дёргать, когда что-нибудь изменилось
	var weather = function (params, map)
	{
		var _map = map || globalFlashMap; //если не указана карта, попробуем взять из глобального пространства имён
		if (!_map) return;
		
		_translationsHash.addtext("rus", {
								"weatherMaplet.WindButton" : "Ветер",
								"weatherMaplet.WeatherButton" : "Погода",
								"weatherMaplet.AccordingTo" : "По данным Gismeteo.ru"
							 });
		_translationsHash.addtext("eng", {
								"weatherMaplet.WindButton" : "Wind",
								"weatherMaplet.WeatherButton" : "Weather",								
								"weatherMaplet.AccordingTo" : "According to the data from Gismeteo.ru"
							 });

		//если подгружать jquery, можно использовать $.extent
		if (!params) params = {};
		params.countryCode = params.copuntryCode || 0;
		if (typeof params.initWeather == 'undefined') params.initWeather = true;
		if (typeof params.initWind == 'undefined') params.initWind = true;
		if (typeof params.imagesHost == 'undefined') params.imagesHost = "http://maps.kosmosnimki.ru/api/img/weather/";
		
		var _serverResponce = null;
		var _serverError = false;
		
		function parseResponse(response)
		{
			if (response.Status == 'ok')
				return true
		else
			return false
		}
		
		var getTHClass = function(THs, value)
		{
			for (var i = 0; i < THs.length; i++)
				if (value <= THs[i]) 
					return i;
			
			return THs.length;
		}		
		
		function showWeather(weatherParent, cities)
		{
			var weekdays = ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'],
			tods = ['ночь','утро','день','вечер'],
			dir = ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'];
					
			var iconContainters = [];
			var iconGeometries = [];
			var iconTexts = [];
			for (var i = 0; i < 9; i++)
			{
				var iconContainer = weatherParent.addObject();
				iconContainer.setStyle({marker:{image: params.imagesHost + '24/' + i + '.png', dx: -12, dy:-16}});
				iconContainters.push(iconContainer);
				iconGeometries[i] = [];
				iconTexts[i] = [];
			}
			
			var textColors = [0x003fe0, 0x05cdff, 0x00f7b1, 0x7dfa00, 0xeeff00, 0xfc0d00];
			var temperatureTHs = [-25, -10, 5, 20, 30];
			
			var cityContainter = weatherParent.addObject();
			cityContainter.setStyle({label: { size: 14, color: 0xfaf087, haloColor: 0x8f6525, align: 'right'}});
			var cityGeometries = [];
			var cityNames = [];
			
			var tInfo = [];
			var tGeometries = [];
			for (var i = 0; i < textColors.length; i++)
			{
				tInfo[i] = [];
				tGeometries[i] = [];
			}
			
			for (var c = 0; c < cities.length; c++)
			{
				var city = cities[c];
				
				if (city.Error != null)
					continue;
			  
				var icon = 0;
			  
				if (city.Forecast[0].Precipitation < 9)
					icon = city.Forecast[0].Precipitation;
				else
					icon = city.Forecast[0].Cloudiness;
					
				var geometry = {geometry: {type:'POINT', coordinates: [city.Lng, city.Lat]}};
				cityGeometries.push(geometry);
				iconGeometries[icon].push(geometry);
				
				cityNames.push(city.Name);
			  
				var temperaure = Math.floor((city.Forecast[0].TemperatureMax + city.Forecast[0].TemperatureMin) / 2);
					
				var tClass = getTHClass(temperatureTHs, temperaure);
				tInfo[tClass].push((city.Forecast[0].TemperatureMin > 0 ? "+" : '') + city.Forecast[0].TemperatureMin + '..' + (city.Forecast[0].TemperatureMax > 0 ? "+" : '') + city.Forecast[0].TemperatureMax);
				tGeometries[tClass].push(geometry);
				//cityName.setStyle({label: { size: 14, color: 0xfaf087, haloColor: 0x8f6525, align: 'right'}})
				//cityName.setLabel(city.Name);
				
				var str = "<table style=\"width:375px;\"><tbody>";
			  
				for (var i = 0; i < city.Forecast.length; ++i)
				{
					var imgIcon = (city.Forecast[i].Precipitation < 9) ? city.Forecast[i].Precipitation : city.Forecast[i].Cloudiness,
						pres = Math.round((city.Forecast[i].PressureMax + city.Forecast[i].PressureMin) / 2),
						rel = Math.round((city.Forecast[i].HumidityMax + city.Forecast[i].HumidityMin) / 2),
						date = new Date(Number(city.Forecast[i].DateTime.replace("/Date(","").replace(")/","")));
				  
					str += "<tr><td style=\"width:70px\">" + weekdays[date.getDay()] + ", " + tods[city.Forecast[i].TimeOfDay] + "</td><td style=\"width:80px;text-align:center;\">" + (city.Forecast[i].TemperatureMin > 0 ? "+" : '') + city.Forecast[i].TemperatureMin + '..' + (city.Forecast[i].TemperatureMax > 0 ? "+" : '') + city.Forecast[i].TemperatureMax + "</td><td style=\"width:20px;text-align:right;\">" + dir[city.Forecast[i].WindDirection] + "</td><td style=\"width:80px;text-align:center;\">" + city.Forecast[i].WindMin + '-' + city.Forecast[i].WindMax + ' м/с' + "</td><td style=\"width:70px;text-align:center;\">" + pres + " м.р.с.</td><td style=\"width:35px;text-align:center;\">" + rel + "%</td><td style=\"width:20px;\"><img style=\"width:16px;height:16px;\" src=\"" + params.imagesHost + "16/" + imgIcon + ".png\"></td></tr>";
				}
			  
				str += "</table></tbody>";
				str += "<div style=\"margin-top:5px; font-size:10px; text-align:right; font-family: sans-serif;\">По данным <a href=\"http://gismeteo.ru\" target=\"_blank\">Gismeteo.ru</a></div>";
				
				iconTexts[icon].push({text: str, name: city.Name});
			}
			
			for (var i = 0; i < tInfo.length; i++)
			{
				var tempContainer = weatherParent.addObject();
				tempContainer.setStyle({label: { size: 14, color: textColors[i], align: 'left'}});
				var objs = tempContainer.addObjects(tGeometries[i]);
				for (var o = 0; o < objs.length; o++)
				{
					(function(info){
						objs[o].setLabel(info);
					})(tInfo[i][o]);
				}
			}
			
			for (var i = 0; i < 9; i++)
			{
				var objs = iconContainters[i].addObjects(iconGeometries[i]);
				for (var o = 0; o < objs.length; o++)
				{
					(function(info){
						objs[o].enableHoverBalloon(function(o)
						{
							return "<span style=\"font-size:14px; font-weight:bold; color:#000;\">" + info.name + "</span><br/>" + info.text;
						})
					})(iconTexts[i][o]);
				}
			}
			
			var objs = cityContainter.addObjects(cityGeometries);
			for (var o = 0; o < objs.length; o++)
				{
					(function(name){
						objs[o].setLabel(name);
					})(cityNames[o]);
				}
		}
	  
		function showWind(windParent, city)
		{
			if (city.Error != null)
				return;
		  
			var elem = windParent.addObject();
		  
			var angle = 180  + city.Forecast[0].WindDirection * 45,
				wind = Math.floor((city.Forecast[0].WindMax + city.Forecast[0].WindMin) / 2),
				scale,
				color;
		  
			if (wind <= 4)
			{
				color = 0x003fe0;
				scale = 0.5;
			}
			else if (wind <= 8)
			{
				color = 0x05cdff;
				scale = 0.6;
			}
			else if (wind <= 12)
			{
				color = 0x00f7b1;
				scale = 0.7;
			}
			else if (wind <= 16)
			{
				color = 0x7dfa00;
				scale = 0.8;
			}
			else if (wind <= 20)
			{
				color = 0xeeff00;
				scale = 0.8;
			}
			else
			{
				color = 0xfc0d00;
				scale = 1;
			}
		  
			elem.setGeometry({type:'POINT', coordinates: [city.Lng, city.Lat]})
			elem.setStyle({marker:{image: params.imagesHost + 'wind.png', center:true, angle:String(angle), scale: String(scale), color: color}})
			//elem.setStyle({marker:{angle:String(angle), scale: String(scale), color: color}});
		  
			var weekdays = ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'],
				tods = ['ночь','утро','день','вечер'],
				dir = ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'],
				str = "<table style=\"width:175px;\"></tbody>",
				trs = [];
		  
			for (var i = 0; i < city.Forecast.length; ++i)
			{
				var imgIcon = (city.Forecast[i].Precipitation < 9) ? city.Forecast[i].Precipitation : city.Forecast[i].Cloudiness,
					pres = Math.round((city.Forecast[i].PressureMax + city.Forecast[i].PressureMin) / 2),
					rel = Math.round((city.Forecast[i].HumidityMax + city.Forecast[i].HumidityMin) / 2),
					date = new Date(Number(city.Forecast[i].DateTime.replace("/Date(","").replace(")/","")));
			  
				str += "<tr><td style=\"width:70px\">" + weekdays[date.getDay()] + ", " + tods[city.Forecast[i].TimeOfDay] + "</td><td style=\"width:20px;text-align:right;\">" + dir[city.Forecast[i].WindDirection] + "</td><td style=\"width:80px;text-align:center;\">" + city.Forecast[i].WindMin + '-' + city.Forecast[i].WindMax + ' м/с' + "</td></tr>";
			}
		  
			str += "</table></tbody>",
		  
			elem.enableHoverBalloon(function(o)
			{
				return "<span style=\"font-size:14px; font-weight:bold; color:#000;\">" + city.Name + "</span><br/>" + str;
			})
		}
		
		weathers = _map.addObject(),
		winds = _map.addObject();
			
		weathers.setCopyright("<a href=\"http://www.gismeteo.ru\" target=\"_blank\">© Gismeteo</a>");
		winds.setCopyright("<a href=\"http://www.gismeteo.ru\" target=\"_blank\">© Gismeteo</a>");
		
		var lazyInitData = function()
		{
			if ( _serverError || (!_serverResponce && !weathers.visibleFlag && !winds.visibleFlag) ) return;
			if ( _serverResponce )
			{
				weathers.setVisible(weathers.visibleFlag);
				winds.setVisible(winds.visibleFlag);
				return;
			}
			
			sendCrossDomainJSONRequest("http://maps.kosmosnimki.ru/Weather.ashx?WrapStyle=func&country=" + params.countryCode, function(response)
			{
				if (!parseResponse(response))
				{
					_serverError = true;
					return;
				}
				
				_serverResponce = response;
				
				weathers.setVisible(false);
				//for (var i = 0; i < response.Result.length; ++i)
				showWeather(weathers, response.Result)
				
				weathers.setVisible(weathers.visibleFlag);
				
				winds.setVisible(false);
				for (var i = 0; i < response.Result.length; ++i)
					showWind(winds, response.Result[i])
				winds.setVisible(winds.visibleFlag);
			})
		}
		
		var aroundWeather = newElement(
				"div",
				{
					onclick: function()
					{
						weathers.visibleFlag = !weathers.visibleFlag;
						
						lazyInitData();
						
						this.lastChild.style.color = weathers.visibleFlag ? "orange" : "wheat";
						
						if (params.changeCallback) params.changeCallback();
					}
				},
				{
					position: "absolute",
					display: "block",
					left: "120px",
					top: "40px",
					width: "73px",
					height: "30px",
					color: "orange"
				}
			);
		aroundWeather.appendChild(newStyledDiv(
			{
				position: "absolute",
				left: 0,
				top: 0,
				width: "73px",
				height: "30px",
				backgroundColor: "#016a8a",
				opacity: 0.5
			}));
		aroundWeather.appendChild(newElement(
				"div",
				{
					innerHTML: _gtxt("weatherMaplet.WeatherButton")
				},
				{
					position: "absolute",
					padding: "15px",
					paddingTop: "8px",
					paddingBottom: "9px",
					fontSize: "12px",
					left: 0,
					top: 0,
					width: "43px",
					textAlign: "center",
					fontFamily: "sans-serif",
					fontWeight: "bold",
					cursor: "pointer",
					color: "orange"
				}
			));
	  
		_map.allControls.div.appendChild(aroundWeather);
		
		weathers.visibleFlag = !params.initWeather;
		weathers.setVisible(!weathers.visibleFlag);
		aroundWeather.onclick();
	  
		var aroundWind = newElement(
				"div",
				{
					onclick: function()
					{
						winds.visibleFlag = !winds.visibleFlag;
						
						lazyInitData();
					  
						this.lastChild.style.color = winds.visibleFlag ? "orange" : "wheat";
						
						if (params.changeCallback) params.changeCallback();
					}
				},
				{
					position: "absolute",
					display: "block",
					left: "120px",
					top: "70px",
					width: "73px",
					height: "30px",
					color: "orange"
				}
			);
		aroundWind.appendChild(newStyledDiv(
			{
				position: "absolute",
				left: 0,
				top: 0,
				width: "73px",
				height: "30px",
				backgroundColor: "#016a8a",
				opacity: 0.5
			}));
		aroundWind.appendChild(newElement(
				"div",
				{
					innerHTML: _gtxt("weatherMaplet.WindButton")
				},
				{
					position: "absolute",
					padding: "15px",
					paddingTop: "8px",
					paddingBottom: "9px",
					fontSize: "12px",
					left: 0,
					top: 0,
					width: "43px",
					textAlign: "center",
					fontFamily: "sans-serif",
					fontWeight: "bold",
					cursor: "pointer",
					color: "orange"
				}
			));
			
		winds.visibleFlag = !params.initWind;
		winds.setVisible(!winds.visibleFlag);
		aroundWind.onclick();
	  
		_map.allControls.div.appendChild(aroundWind);
	}
	
gmxCore.addModule('WeatherMaplet', {
	weather: weather,
	isWindVisible: function()
	{
		return 'visibleFlag' in winds ? winds.visibleFlag : false; 
	},
	isWeatherVisible: function()
	{
		return 'visibleFlag' in weathers ? weathers.visibleFlag : false;
	}
})

})();