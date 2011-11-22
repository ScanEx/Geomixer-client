var nsMapCommon = function($){
	var publicInterface = {
		//options:
		//    apiKey: String
		//    defaultLayersVisibility: Object {mapName => visibility}
		//    saveBaseLayers: Bool. Добавлять ли команды конструирования базовых слоёв (не работает для слоёв не из карты и без properties.title)
		createAPIMap: function(mapName, hostName, options)
		{
			var id = 'flash' + Math.random(),
				br = ($.browser.msie) ? "\n\r" : "\n",
				mapText = "<div>" + br + "\t<div id=\"" + id + "\" style=\"width: 600px; height: 400px; overflow:hidden;\"></div>" + br;
			
			if ( options && options.apiKey )
				mapText += "\t<script charset=\"windows-1251\" src=\"http://maps.kosmosnimki.ru/api/api.js?key=" + options.apiKey + "\"></script>" + br;
			else
				//mapText += "\t<script charset=\"windows-1251\" src=\"" + serverBase + "api/api.js?\"></script>" + br;
				mapText += "\t<script charset=\"windows-1251\" src=\"" + getAPIHostRoot() + "api/api.js?\"></script>" + br;
				
			mapText += "\t<script>" + br;
			
			mapText += "\t\tcreateFlashMap(document.getElementById(\"" + id + "\"), \"" + hostName + "\", \"" + mapName + "\", function(map)" + br;
			mapText += "\t\t{" + br;
			mapText += "\t\t\tglobalFlashMap = map;" + br;
			mapText += "\t\t\tmap.moveTo(" + globalFlashMap.getX() + ", " + globalFlashMap.getY() + ", " + globalFlashMap.getZ() + ");" + br;
			
			var currentBaseLayerName = globalFlashMap.getBaseLayer();
			var baseLayersVisibility = {};
			var baseLayersStructure = [];
			var baseLayerNames = globalFlashMap.baseLayerControl.getBaseLayerNames();
			
			for (var k = 0; k < baseLayerNames.length; k++)
			{
				var baseLayerLayers = globalFlashMap.baseLayerControl.getBaseLayerLayers(baseLayerNames[k]);
				for (var b = 0; b < baseLayerLayers.length; b++)
				{
					if (baseLayerLayers[b].objectId in baseLayersVisibility)
						baseLayersVisibility[baseLayerLayers[b].objectId] = baseLayersVisibility[baseLayerLayers[b].objectId] || (baseLayerNames[k] == currentBaseLayerName);
					else
						baseLayersVisibility[baseLayerLayers[b].objectId] = baseLayerNames[k] == currentBaseLayerName;
					
					if (baseLayerLayers[b].properties && baseLayerLayers[b].properties.title)
						baseLayersStructure.push ({title: baseLayerLayers[b].properties.title, baseLayer: baseLayerNames[k]});
				}
			}
			
			if (options && options.saveBaseLayers)
				for ( var k = 0; k < baseLayersStructure.length; k++ )
					mapText += "\t\t\tmap.layers[\"" + baseLayersStructure[k].title + "\"].setAsBaseLayer(\"" + baseLayersStructure[k].baseLayer + "\");" + br;
			
			if ( globalFlashMap.getBaseLayer() )
				mapText += "\t\t\tmap.setBaseLayer(\"" + currentBaseLayerName + "\");" + br;
			
			mapText += "\t\t\tmap.minimizeTools();" + br;
			
			//по умолчанию сетка отключена
			if ( globalFlashMap.grid.getVisibility() )
				mapText += "\t\t\tmap.grid.setVisible(true);" + br;
			
			globalFlashMap.drawing.forEachObject(function(o) 
			{
				var elemId = 'elem' + String(Math.random()).split(".")[1];
				var apiStyles = o.getStyle(true);
				mapText += "\t\t\tvar " + elemId + " = map.drawing.addObject(" + JSON.stringify(o.geometry) + ", " + JSON.stringify(o.properties) + ")" +  br;
				mapText += "\t\t\t" + elemId + ".setStyle(" + JSON.stringify(apiStyles.regular) + ", " + JSON.stringify(apiStyles.hovered) + ")" + br;
			});
			
			var defaultLayersVisibility = options && options.defaultLayersVisibility ? options.defaultLayersVisibility : {};
			
			for (var k = 0; k < globalFlashMap.layers.length; k++)
			{
				var layer = globalFlashMap.layers[k];
				var name = layer.properties.title;// || layer.properties.image;
				var isVisible = typeof layer.isVisible == 'undefined' ? false : layer.isVisible;
				var needUpdateAfterBaseLayers = (layer.objectId in baseLayersVisibility) && baseLayersVisibility[layer.objectId] != isVisible;
				var needUpdateDefault = !(layer.objectId in baseLayersVisibility) && (!(layer.properties.name in defaultLayersVisibility) || defaultLayersVisibility[layer.properties.name] != isVisible);
				if ( needUpdateAfterBaseLayers || needUpdateDefault )
					mapText += "\t\t\tmap.layers[\"" + name + "\"].setVisible(" + isVisible + ");" +  br;
			}
			
			mapText += "\t\t});" + br;
			mapText += "\t</script>" + br + "</div>";
			
			return mapText;
		},
		
		//options:
		//    requestAPIKey: Bool. По умолчанию - true
		//    requestTerms: Bool (если true, нужно указать termsURL) По умолчанию - false
		//    termsURL: String (требует requestTerms==true) Нет значения по умолчанию
		//    initialLayerVisibility: Object (имя слоя => видимость)
		//    saveBaseLayers: Bool. Добавлять ли команды конструирования базовых слоёв (не работает для слоёв не из карты и без properties.title)
		//    onBeforeGenerate: function(). Вызывается непосредственно перед генерацией кода
		//    onAfterGenerate: function(). Вызывается непосредственно после генерации кода
		createAPIMapDialog: function(mapName, hostName, options)
		{
			_translationsHash.addtext("rus", {
    								  	"Создать" : "Создать",
										"Получить API-ключ" : "Получить API-ключ",
										"Введите API-ключ" : "Введите API-ключ",
										"Код для вставки" : "Код для вставки карты",
										"Согласен с " : "Согласен с ",
										"Пользовательским соглашением" : "Пользовательским соглашением"
								     });
									 
			_translationsHash.addtext("eng", {
    								  	"Создать" : "Create",
										"Получить API-ключ" : "Get API-key",
										"Введите API-ключ" : "Enter API-key",
										"Код для вставки" : "Embed code",
										"Согласен с " : "Aggree with ",
										"Пользовательским соглашением" : "Terms of usage"
								     });
			
			var requestAPIKey = options && 'requestAPIKey' in options ? options.requestAPIKey : true;
			var requestTerms = options && 'requestTerms' in options ? options.requestTerms : false;

			var input = _input(null, [['dir','className','inputStyle'],['css','width','200px']]),
				button = makeButton(_gtxt("Создать")),
				getAPI = makeLinkButton(_gtxt("Получить API-ключ")),
				mapTextArea = _textarea(null,[['dir','className','inputStyle'],['css','width','100%'],['css','padding','0px'],['css','margin','0px'],['css','border','none']]),
				canvas = _div([_span([_div([_span([_t(_gtxt("Введите API-ключ"))],[['css','fontSize','12px'],['css','margin','0px 7px']]), getAPI, _div([input, button], [['css','margin','10px 0px 10px 5px']])])], [['attr', 'id', 'embedCodeControls'], ['css', 'display', 'block']]), mapTextArea]),
				inputError = function()
				{
					$(input).addClass('error');
					
					setTimeout(function()
					{
						if (input)
							$(input).removeClass('error');
					}, 1000)
				},
				resize = function()
				{
					mapTextArea.style.height = mapTextArea.parentNode.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 15 + 'px';
				},
				boxTerms = null,
				_this = this;
				
			if (requestTerms)
			{
				boxTerms = _checkbox(false, "checkbox");
				var divTerms = _div([boxTerms, _span([_t(_gtxt("Согласен с "))], [['css','fontSize','12px'], ['css','marginLeft','3px']]), _a([_t(_gtxt("Пользовательским соглашением"))], [['attr', 'href', options.termsURL], ['attr', 'target', '_blank'], ['css','fontSize','12px']])], [['css', 'margin', '3px']]);
					
				boxTerms.onclick = function()
				{
					button.disabled = !this.checked;
				}
				
				button.disabled = true;
					
				$('#embedCodeControls', canvas).append(divTerms);
			}
			
			var creationOptions = {};
			if (options && options.defaultLayersVisibility) 
				creationOptions.defaultLayersVisibility = options.defaultLayersVisibility;
				
			if (options && options.saveBaseLayers)
				creationOptions.saveBaseLayers = options.saveBaseLayers;
				
			var _generate = function(keyValue)
			{
				removeChilds(mapTextArea);
				
				if (keyValue)
					creationOptions['apiKey'] = keyValue;
				
				if (options && options.onBeforeGenerate) options.onBeforeGenerate();
				
				mapTextArea.value = nsMapCommon.createAPIMap(mapName, hostName, creationOptions);
				
				if (options && options.onAfterGenerate) options.onAfterGenerate();
				
				mapTextArea.select();
				
				if (boxTerms) boxTerms.disabled = true;			
			}
			
			if ( !requestAPIKey )
			{
				canvas.firstChild.style.display = 'none';
				
				showDialog(_gtxt("Код для вставки"), canvas, 325, 240, false, false, resize);
				resize();
				
				//mapTextArea.value = nsMapCommon.createAPIMap(mapName, hostName, creationOptions);
				//mapTextArea.select();
				_generate();
			}
			else
			{
				getAPI.onclick = function()
				{
					window.open("http://account.kosmosnimki.ru", "_blank");
				}
				
				input.onkeydown = function(e)
				{
					var evt = e || window.event;
					if (getkey(evt) == 13) 
					{
						if (input.value != '')
							_generate(input.value);
						else
							inputError();
						
						return false;
					}
				}
				
				button.onclick = function()
				{
					if (input.value != '')
					{
						_generate(input.value);
					}
					else
						inputError();
				}
				
				getAPI.style.marginLeft = '5px';
				
				showDialog(_gtxt("Код для вставки"), canvas, 325, 240, false, false, resize);
				
				resize();
			}
		},
		
		//events: change
		/*AuthorizationManager: (function()
		{
			var _userInfo;			
			
			var _pi = {
				ROLE_ADMIN: 'admin', 
				ROLE_USER: 'user',
				ROLE_GUEST: 'guest',
				ROLE_UNAUTHORIZED: 'none',
				
				ACTION_CREATE_LAYERS: 'createData',
				ACTION_CREATE_MAP: 'createMap',
				ACTION_SAVE_MAP: 'saveMap',
				ACTION_CHANGE_MAP_TYPE: 'changeType',
				ACTION_SEE_OPEN_MAP_LIST: 'openMap',
				ACTION_SEE_PRIVATE_MAP_LIST: 'privateMap',
				ACTION_SEE_MAP_RIGHTS: 'seeRights',
				ACTION_SEE_FILE_STRUCTURE: 'seeFiles',
				ACTION_SEE_ALL_USERS: 'seeUsers',
				
				isRole: function(role)
				{
					return _userInfo.Role === role;
				},
				
				canDoAction: function(action)
				{
					return _userInfo.Role in _actions && action in _actions[_userInfo.Role];
				},
				
				isAccounts: function()
				{
					return _userInfo.isAccounts;
				},
				
				setUserInfo: function(userInfo)
				{
					_userInfo = $.extend({}, {isAccounts: false, Role: this.ROLE_UNAUTHORIZED}, userInfo);
					$(this).trigger('change');
				}, 
				isLogin: function()
				{
					return _userInfo && _userInfo.Login !== false && _userInfo.Role !== this.ROLE_UNAUTHORIZED;
				}
			}
			
			var _actions = {};
			_actions[_pi.ROLE_ADMIN] = {};
			_actions[_pi.ROLE_ADMIN][_pi.ACTION_CREATE_LAYERS] = true;
			_actions[_pi.ROLE_ADMIN][_pi.ACTION_CREATE_MAP] = true;
			_actions[_pi.ROLE_ADMIN][_pi.ACTION_SAVE_MAP] = true;
			_actions[_pi.ROLE_ADMIN][_pi.ACTION_SEE_OPEN_MAP_LIST] = true;
			_actions[_pi.ROLE_ADMIN][_pi.ACTION_SEE_PRIVATE_MAP_LIST] = true;
			_actions[_pi.ROLE_ADMIN][_pi.ACTION_CHANGE_MAP_TYPE] = true;
			_actions[_pi.ROLE_ADMIN][_pi.ACTION_SEE_MAP_RIGHTS] = true;
			_actions[_pi.ROLE_ADMIN][_pi.ACTION_SEE_FILE_STRUCTURE] = true;
			_actions[_pi.ROLE_ADMIN][_pi.ACTION_SEE_ALL_USERS] = true;
			
			_actions[_pi.ROLE_USER] = {};
			_actions[_pi.ROLE_USER][_pi.ACTION_CREATE_LAYERS] = true;
			_actions[_pi.ROLE_USER][_pi.ACTION_CREATE_MAP] = true;
			_actions[_pi.ROLE_USER][_pi.ACTION_SAVE_MAP] = true;
			_actions[_pi.ROLE_USER][_pi.ACTION_SEE_OPEN_MAP_LIST] = true;
			_actions[_pi.ROLE_USER][_pi.ACTION_SEE_MAP_RIGHTS] = true;
			
			_actions[_pi.ROLE_GUEST] = {};
			_actions[_pi.ROLE_GUEST][_pi.ACTION_SEE_OPEN_MAP_LIST] = true;
			_actions[_pi.ROLE_GUEST][_pi.ACTION_CREATE_MAP] = true;
			_actions[_pi.ROLE_GUEST][_pi.ACTION_SAVE_MAP] = true;
			
			return _pi;
		})(),*/
		
		/**
		* Выбирает данные из дерева слоёв по описанию слоёв и групп
		* @param {FlashMapObject} map - текущая карта
		* @param {object} mapTree - дерево, в котором нужно искать
		* @param {array} description - массив с описанием нужных слоёв. Каждый элемент массива может быть либо строкой (имя слоя), либо объектом {group: '<groupName>'} - выбрать все слои из группы
		*/
		selectLayersFromTree: function(map, mapTree, description)
		{
			var _array = [];
			var _hash = {};
			
			var _getLayersInGroup = function(map, mapTree, groupTitle)
			{
				var res = {};
				var visitor = function(treeElem, isInGroup)
				{
					if (treeElem.type === "layer" && isInGroup)
					{
						res[treeElem.content.properties.name] = map.layers[treeElem.content.properties.name];
					}
					else if (treeElem.type === "group")
					{
						isInGroup = isInGroup || treeElem.content.properties.title == groupTitle;
						var a = treeElem.content.children;
						for (var k = a.length - 1; k >= 0; k--)
							visitor(a[k], isInGroup);
					}
				}

				visitor( {type: "group", content: { children: mapTree.children, properties: {} } }, false );
				return res;
			}	
			
			for (var k = 0; k < description.length; k++)
				if ( typeof description[k] === "string" )
				{
					_hash[description[k]] = map.layers[description[k]];
					_array.push( map.layers[description[k]] );
				}
				else if ('group' in description[k])
				{
					var groupHash = _getLayersInGroup(map, mapTree, description[k].group);
					for (var l in groupHash)
					{
						_hash[l] = groupHash[l];
						_array.push( groupHash[l] );
					}
				}
				
			return {
				asArray: function() { return _array; },
				asHash: function() { return _hash; },
				names: function()
				{
					var res = [];
					
					for (var l in _hash) 
						res.push(l);
						
					return res;
				}
			}
		}
	};
	
	if (typeof gmxCore !== 'undefined')
	{
		gmxCore.addModule('MapCommon', publicInterface);
	}
	
	return publicInterface;
}(jQuery);