gmxCore.addModule('WeatherMaplet', {
	//params:
	//    countryCode - {string} "0" для России
	//    initWeather - {bool, default: true} Показывать ли погоду по умолчанию
	//    initWind    - {bool, default: true} Показывать ли ветер по умолчанию
	weather: function (params, map)
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

		if (!params) params = {};
		params.countryCode = params.copuntryCode || 0;
		if (typeof params.initWeather == 'undefined') params.initWeather = true;
		if (typeof params.initWind == 'undefined') params.initWind    = true;
		
		var _serverResponce = null;
		var _serverError = false;
		
		function parseResponse(response)
		{
			if (response.Status == 'ok')
				return true
		else
			return false
		}
		
		function showWeather(weatherParent, city)
		{
			if (city.Error != null)
				return;
		  
			var elem = weatherParent.addObject(),
				temp = weatherParent.addObject(),
				cityName = weatherParent.addObject();
		  
			elem.setGeometry({type:'POINT', coordinates: [city.Lng, city.Lat]})
			temp.setGeometry({type:'POINT', coordinates: [city.Lng, city.Lat]})
			cityName.setGeometry({type:'POINT', coordinates: [city.Lng, city.Lat]})
		  
			var icon = 0;
		  
			if (city.Forecast[0].Precipitation < 9)
				icon = city.Forecast[0].Precipitation;
			else
				icon = city.Forecast[0].Cloudiness;
		  
			var temperaure = Math.floor((city.Forecast[0].TemperatureMax + city.Forecast[0].TemperatureMin) / 2),
				color,
				haloColor;
		  
			if (temperaure <= -25)
			{
				color = 0x003fe0;
				haloColor = 0x8f6525;
			}
			else if (temperaure <= -10)
			{
				color = 0x05cdff;
				haloColor = 0x8f6525;
			}
			else if (temperaure <= 5)
			{
				color = 0x00f7b1;
				haloColor = 0x8f6525;
			}
			else if (temperaure <= 20)
			{
				color = 0x7dfa00;
				haloColor = 0x8f6525;
			}
			else if (temperaure <= 30)
			{
				color = 0xeeff00;
				haloColor = 0x8f6525;
			}
			else
			{
				color = 0xfc0d00;
				haloColor = 0x8f6525;
			}
		  
			elem.setStyle({marker:{image:'http://mapstest.kosmosnimki.ru/api/img/weather/24/' + icon + '.png', dx: -12, dy:-16}})
			temp.setStyle({label: { size: 14, color: color, align: 'left'}})
			temp.setLabel((city.Forecast[0].TemperatureMin > 0 ? "+" : '') + city.Forecast[0].TemperatureMin + '..' + (city.Forecast[0].TemperatureMax > 0 ? "+" : '') + city.Forecast[0].TemperatureMax)
			cityName.setStyle({label: { size: 14, color: 0xfaf087, haloColor: 0x8f6525, align: 'right'}})
			cityName.setLabel(city.Name);
		  
			var weekdays = ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'],
				tods = ['ночь','утро','день','вечер'],
				dir = ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'],
				str = "<table style=\"width:375px;\"></tbody>",
				trs = [];
		  
			for (var i = 0; i < city.Forecast.length; ++i)
			{
				var imgIcon = (city.Forecast[i].Precipitation < 9) ? city.Forecast[i].Precipitation : city.Forecast[i].Cloudiness,
					pres = Math.round((city.Forecast[i].PressureMax + city.Forecast[i].PressureMin) / 2),
					rel = Math.round((city.Forecast[i].HumidityMax + city.Forecast[i].HumidityMin) / 2),
					date = new Date(Number(city.Forecast[i].DateTime.replace("/Date(","").replace(")/","")));
			  
				str += "<tr><td style=\"width:70px\">" + weekdays[date.getDay()] + ", " + tods[city.Forecast[i].TimeOfDay] + "</td><td style=\"width:80px;text-align:center;\">" + (city.Forecast[i].TemperatureMin > 0 ? "+" : '') + city.Forecast[i].TemperatureMin + '..' + (city.Forecast[i].TemperatureMax > 0 ? "+" : '') + city.Forecast[i].TemperatureMax + "</td><td style=\"width:20px;text-align:right;\">" + dir[city.Forecast[i].WindDirection] + "</td><td style=\"width:80px;text-align:center;\">" + city.Forecast[i].WindMin + '-' + city.Forecast[i].WindMax + ' м/с' + "</td><td style=\"width:70px;text-align:center;\">" + pres + " м.р.с.</td><td style=\"width:35px;text-align:center;\">" + rel + "%</td><td style=\"width:20px;\"><img style=\"width:16px;height:16px;\" src=\"http://mapstest.kosmosnimki.ru/api/img/weather/16/" + imgIcon + ".png\"></td></tr>";
			}
		  
			str += "</table></tbody>",
		  
			elem.enableHoverBalloon(function(o)
			{
				return "<span style=\"font-size:14px; font-weight:bold; color:#000;\">" + city.Name + "</span><br/>" + str;
			})
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
			elem.setStyle({marker:{image:'http://mapstest.kosmosnimki.ru/api/img/weather/wind.png', center:true, angle:String(angle), scale: String(scale), color: color}})
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
		
		var weathers = _map.addObject(),
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
				for (var i = 0; i < response.Result.length; ++i)
					showWeather(weathers, response.Result[i])
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
		aroundWeather.onclick();
	  
		var aroundWind = newElement(
				"div",
				{
					onclick: function()
					{
						winds.visibleFlag = !winds.visibleFlag;
						
						lazyInitData();
					  
						this.lastChild.style.color = winds.visibleFlag ? "orange" : "wheat";
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
		aroundWind.onclick();
	  
		_map.allControls.div.appendChild(aroundWind);

		aroundWeather.setAttribute("title", _gtxt("weatherMaplet.AccordingTo"));
		aroundWind.setAttribute("title", _gtxt("weatherMaplet.AccordingTo"));
	}
})