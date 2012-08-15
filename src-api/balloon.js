//Поддержка Балунов
(function()
{
	/** Класс управления балунами
	* @function
	* @memberOf api
	* @see <a href="http://kosmosnimki.ru/geomixer/docs/api_examples.html">» Примеры использования</a>.
	* @author <a href="mailto:saleks@scanex.ru">Sergey Alexseev</a>
	*/
	function BalloonClass()
	{
		var map = gmxAPI.map;
		var div = gmxAPI._div;
		var apiBase = gmxAPI.getAPIFolderRoot();
		var balloons = [];
		var curMapObject = null;

		var mapX = 0;
		var mapY = 0;
		var stageZoom = 1;						// Коэф. масштабирования браузера
		var scale = 0;
		//map.getPosition();
		var currPos = null;

		// Обновить информацию текущего состояния карты
		function refreshMapPosition(ph)
		{
			currPos = ph || gmxAPI.currPosition || map.getPosition();
			mapX = currPos['x'];
			mapY = currPos['y'];
			scale = gmxAPI.getScale(currPos['z']);
			stageZoom =  currPos['stageHeight'] / div.clientHeight;	// Коэф. масштабирования браузера
		}
		// Формирование ID балуна
		function setID(o)
		{
			var id = o.objectId + '_balloon';
			if(o.properties) {
				var identityField = gmxAPI.getIdentityField(o);
				if(o.properties[identityField]) id +=  '_' + o.properties[identityField];
			}
			return id;
		}

		/** Проверка возвращенного пользовательским callback значения
		* @function
		* @memberOf BalloonClass private
		* @param {text} возвращенное значение пользовательским callback
		* @param {div} внутренний контейнер для размещения содержимого балуна
		* @return {<String><Bool><Object>}	
		*		если тип <String> то div.innerHTML = text
		*		если тип <Bool> и значение True то div.innerHTML = ''
		*		если тип <Object> никаких дополнительных действий - все действия были произведены в callback
		*/
		function chkBalloonText(text, div)
		{
			var type = typeof(text);
			if(type === 'string') div.innerHTML = '<div style="white-space: nowrap;">' + text + '</div>';
			else if(type === 'boolean' && text) div.innerHTML = ""; // затираем только если true
			// в случае type === 'object' ничего не делаем
		}

		// Текст по умолчанию для балуна (innerHTML)
		function getDefaultBalloonText(o)
		{
			var text = "";
			var identityField = gmxAPI.getIdentityField(o);
			var props = o.properties;
			for (var key in props)
			{
				if (key != identityField)
				{
					var value = "" + props[key];
					if (value.indexOf("http://") == 0)
						value = "<a href='" + value + "'>" + value + "</a>";
					else if (value.indexOf("www.") == 0)
						value = "<a href='http://" + value + "'>" + value + "</a>";
					text += "<b>" + key + ":</b> " + value + "<br />";
				}
			}
			var summary = o.getGeometrySummary();
			if(summary != '') text += "<br />" + summary;
			return text;
		}
		this.getDefaultBalloonText = getDefaultBalloonText;

		// Проверка наличия параметра по ветке родителей
		function chkAttr(name, o)
		{
			var attr = false;
			var hash = o._hoverBalloonAttr;
			if(hash && name in hash) {
				attr = hash[name];
			}
			if(!attr && o.parent) attr = chkAttr(name, o.parent);
			return attr;
		}

		function disableHoverBalloon(mapObject)
		{
			var listenersID = mapObject._attr['balloonListeners'];
			for (var key in listenersID) {
				mapObject.removeListener(key, listenersID[key]);
			}
			mapObject._attr['balloonListeners'] = {};
		}
		this.disableHoverBalloon = disableHoverBalloon;

		/** Задать пользовательский тип балуна для mapObject
		* @function
		* @memberOf BalloonClass public
		* @param {mapObject<mapObject>} обьект карты для которого устанавливается тип балуна
		* @param {callback<Function>} пользовательский метод формирования содержимого балуна mouseOver
		*		При вызове в callback передаются параметры:
		*		@param {obj<Hash>} properties обьекта карты для балуна
		*		@param {div<DIV>} нода контейнера содержимого балуна
		*		@return {<String><Bool><Object>}	
		*			если тип <String> то div.innerHTML = text
		*			если тип <Bool> и значение True то div.innerHTML = ''
		*			если тип <Object> никаких дополнительных действий - все действия были произведены в callback
		* @param {attr:<Hash>} атрибуты управления балуном
		*		свойства:
		*			'disableOnMouseOver<Bool>'	- по умолчанию False
		*			'disableOnClick'<Bool>		- по умолчанию False
		*			'maxFixedBallons'<Bool>		- по умолчанию 1 (максимальное количество фиксированных балунов)
		*			'clickCallback'<Function>	- пользовательский метод формирования содержимого фиксированного балуна при mouseClick
		*				@param {obj<Hash>} properties обьекта карты для балуна
		*				@param {div<DIV>} нода контейнера содержимого балуна
		*				@return {<String><Bool><Object>}	
		*					если тип <String> то div.innerHTML = text
		*					если тип <Bool> и значение True то div.innerHTML = ''
		*					если тип <Object> никаких дополнительных действий - все действия были произведены в clickCallback
		*			'OnClickSwitcher'<Function>	- по умолчанию null (при событии mouseClick - переключатель на пользовательский метод формирования всего фиксированного балуна)
		*				@param {obj<Hash>} properties обьекта карты для балуна
		*				@param {keyPress<Hash>} аттрибуты нажатых спец.клавиш при mouseClick событии
		*				свойства:
		*					'shiftKey<Bool>'	- по умолчанию False
		*					'ctrlKey<Bool>'		- по умолчанию False
		*				@return {Bool} если true то стандартный фиксированный балун НЕ создавать
		*			'customBalloon'<Function>	- пользовательский метод формирования содержимого фиксированного балуна при mouseClick
		*				@param {obj<Hash>} properties обьекта карты для балуна
		*				@param {div<DIV>} нода контейнера содержимого балуна
		*				@return {Bool} если true то стандартный балун НЕ создавать
		*/
		function enableHoverBalloon(mapObject, callback, attr)
		{
			var _this = this;
			mapObject._hoverBalloonAttr = (attr ? attr : {});				// Атрибуты управления балуном
			if (callback) {													// Пользовательский метод получения текста для балуна
				this.getDefaultBalloonText = mapObject._hoverBalloonAttr['callback'] = callback;
			} else {
				delete mapObject._hoverBalloonAttr['callback'];
			}

			var handlersObj = {
				onMouseOver: function(o, keyPress)
				{
					if('obj' in o) {
						//if('attr' in o && 'textFunc' in o.attr) keyPress = o.attr;
						if('attr' in o) keyPress = o.attr;
						o = o.obj;
					}
					gmxAPI.contDivPos = {
						'x': gmxAPI.getOffsetLeft(div),
						'y': gmxAPI.getOffsetTop(div)
					};
					if(keyPress && (keyPress['shiftKey'] || keyPress['ctrlKey'])) return false;	// При нажатых не показываем балун
					if (map.isDragging())
						return false;

					if(chkAttr('disableOnMouseOver', mapObject)) {			// Проверка наличия параметра disableOnMouseOver по ветке родителей 
						return false;
					}
					var customBalloonObject = chkAttr('customBalloon', mapObject);		// Проверка наличия параметра customBalloon по ветке родителей 
					if(customBalloonObject) {
						currPos = gmxAPI.currPosition || map.getPosition();
						currPos._x = propsBalloon.mouseX || 0;
						currPos._y = propsBalloon.mouseY || 0;
						var flag = customBalloonObject.onMouseOver(o, keyPress, currPos); // Вызов пользовательского метода вместо или перед балуном
						if(flag) return false;										// Если customBalloon возвращает true выходим
					}

					//if(keyPress['objType'] == 'cluster') {}; // Надо придумать как бороться с фикс.двойником

					var textFunc = chkAttr('callback', mapObject);			// Проверка наличия параметра callback по ветке родителей 
					//var text = (textFunc && (!keyPress['objType'] || keyPress['objType'] != 'cluster') ? textFunc(o, propsBalloon.div) : getDefaultBalloonText(o));
					var text = (textFunc ? textFunc(o, propsBalloon.div) : getDefaultBalloonText(o));
					if(typeof(text) == 'string' && text == '') return false;
					var id = setID(o);
					lastHoverBalloonId = o.objectId;
					
					if (!fixedHoverBalloons[id]) {
						propsBalloon.updatePropsBalloon(text);
					}
					else {
						propsBalloon.updatePropsBalloon(false);
					}

					map.clickBalloonFix = clickBalloonFix;
					return true;
				},
				onMouseOut: function(o) 
				{
					if('obj' in o) {
						o = o.obj;
					}
					var customBalloonObject = chkAttr('customBalloon', mapObject);		// Проверка наличия параметра customBalloon по ветке родителей 
					if(customBalloonObject) {
						var flag = customBalloonObject.onMouseOut(o);
						if(flag) return false;
					}
					if (lastHoverBalloonId == o.objectId) {
						propsBalloon.updatePropsBalloon(false);
					}
					return true;
				},
				onClick: function(o, keyPress)
				{
					if('obj' in o) {
						if('attr' in o) keyPress = o.attr;
						//if('attr' in o && 'textFunc' in o.attr) keyPress = o.attr;
						o = o.obj;
					}
					refreshMapPosition();
					var customBalloonObject = chkAttr('customBalloon', mapObject);		// Проверка наличия параметра customBalloon по ветке родителей 
					if(customBalloonObject) {
						currPos._x = propsBalloon.x;
						currPos._y = propsBalloon.y;
						var flag = customBalloonObject.onClick(o, keyPress, currPos);
						if(flag) return false;
					}
					if(chkAttr('disableOnClick', mapObject)) {			// Проверка наличия параметра disableOnMouseOver по ветке родителей 
						return false;
					}
					if(!keyPress) keyPress = {};
					keyPress['textFunc'] = chkAttr('callback', mapObject);			// Проверка наличия параметра callback по ветке родителей 
					return clickBalloonFix(o, keyPress);
				}
			};

			if(mapObject == map) return;								// На map Handlers не вешаем
			if(mapObject._hoverBalloonAttr) {							// есть юзерские настройки балунов
				if(mapObject._hoverBalloonAttr['disableOnMouseOver']) {			// для отключения балунов при наведении на обьект
					handlersObj['onMouseOver'] = null;
					handlersObj['onMouseOut'] = null;
				}
				if(mapObject._hoverBalloonAttr['disableOnClick']) {				// для отключения фиксированных балунов
					handlersObj['onClick'] = null;
				}
				//mapObject._hoverBalloonAttr['disableOnMouseOver']
			}
			//mapObject.setHandlers(handlersObj);
			if(!mapObject._attr['balloonListeners']) mapObject._attr['balloonListeners'] = {};
			disableHoverBalloon(mapObject);
			var level = (attr && attr['level'] ? attr['level'] : -10);
			for (var key in handlersObj) {
				if(handlersObj[key]) {
					var eID = mapObject.addListener(key, handlersObj[key], level);
					mapObject._attr['balloonListeners'][key] = eID;
					//gmxAPI._listeners.bringToBottom(mapObject, key, eID);
				}
			}
		}
		this.enableHoverBalloon = enableHoverBalloon;

		var lastHoverBalloonId = false;
		var fixedHoverBalloons = {};

		function showHoverBalloons()
		{
			for (var key in fixedHoverBalloons)
			{
				var balloon = fixedHoverBalloons[key];
				balloon.setVisible(true);
			}
			positionBalloons();
		}
		
		function removeHoverBalloons()
		{
			for (var key in fixedHoverBalloons)
			{
				fixedHoverBalloons[key].remove();
				delete fixedHoverBalloons[key];
			}
		}
		this.removeHoverBalloons = removeHoverBalloons;
		
		function hideHoverBalloons(flag)
		{
			var showFlag = false;
			for (var key in fixedHoverBalloons)
			{
				var balloon = fixedHoverBalloons[key];
				if(balloon.objType != 'cluster') {
					balloon.setVisible(false);
					showFlag = true;
				}
				else
				{
					fixedHoverBalloons[key].remove();
					delete fixedHoverBalloons[key];
				}
			}
			if(flag && showFlag) {
				var timeoutShowHoverBalloons = setTimeout(function()
				{
					clearTimeout(timeoutShowHoverBalloons);
					showHoverBalloons();
				}, 300);
			}
		}
		this.hideHoverBalloons = hideHoverBalloons;

		// Фиксация балуна
		function clickBalloonFix(o, keyPress)
		{
			var OnClickSwitcher = chkAttr('OnClickSwitcher', o);		// Проверка наличия параметра по ветке родителей 
			if(OnClickSwitcher && typeof(OnClickSwitcher) == 'function') {
				var flag = OnClickSwitcher(o, keyPress);				// Вызов пользовательского метода вместо или перед балуном
				if(flag) return true;										// Если OnClickSwitcher возвращает true выходим
			}

			if(chkAttr('disableOnClick', o))	// Проверка наличия параметра disableOnClick по ветке родителей 
				return false;

			var textFunc = chkAttr('clickCallback', o) || chkAttr('callback', o);	// Проверка наличия параметра callback по ветке родителей 
			if(keyPress) {
				if(keyPress['shiftKey'] || keyPress['ctrlKey']) return false;	// При нажатых не показываем балун
				if(keyPress['nodeFilter'] == o.parent.objectId && o.parent._hoverBalloonAttr.callback) textFunc = o.parent._hoverBalloonAttr.callback; // взять параметры балуна от фильтра родителя
				else if('textFunc' in keyPress) textFunc = keyPress['textFunc'];
			}

			var id = setID(o);
			if (!fixedHoverBalloons[id])
			{
				var maxFixedBallons = chkAttr('maxFixedBallons', o) || 1;	// Проверка наличия параметра maxFixedBallons по ветке родителей
				if(maxFixedBallons > 0 && balloons.length > 0)
				{
					if(maxFixedBallons <= balloons.length) {
						var balloon = null;
						for(var i=0; i<balloons.length; i++) {
							if(balloons[i].notDelFlag) continue;
							balloon = balloons[i];
							break;
						}
						if(balloon) {
							var fixedId = balloon.fixedId;
							balloon.remove();
							delete fixedHoverBalloons[fixedId];
						}
					}
				}
				var balloon = addBalloon();
				balloon.fixedId = id;
				if(keyPress && keyPress['objType']) balloon.objType = keyPress['objType'];

				//var text = (textFunc && (!keyPress['objType'] || keyPress['objType'] != 'cluster') ? textFunc(o, balloon.div) : getDefaultBalloonText(o));
				var text = (textFunc ? textFunc(o, balloon.div) : getDefaultBalloonText(o));
				if(typeof(text) == 'string' && text == '') return false;

				var mx = map.getMouseX();
				var my = map.getMouseY();
				
				mx = gmxAPI.chkPointCenterX(mx);

				if(o.getGeometryType() == 'POINT') {
					var gObj = o.getGeometry();
					var x = gObj.coordinates[0];
					var y = gObj.coordinates[1];

					balloon.fixedDeltaX =  (gmxAPI.merc_x(mx) -  gmxAPI.merc_x(x))/scale;
					balloon.fixedDeltaY =  (gmxAPI.merc_y(my) -  gmxAPI.merc_y(y))/scale;
					mx = x;
					my = y;
					balloon.fixedDeltaFlag = true;
				}

				balloon.setPoint(mx, my);
				chkBalloonText(text, balloon.div);

				balloon.resize();
				fixedHoverBalloons[id] = balloon;
				balloon.setVisible(true);
			}
			else
			{
				fixedHoverBalloons[id].remove();
				delete fixedHoverBalloons[id];
			}
			propsBalloon.updatePropsBalloon(false);
			return true;
		}
		this.clickBalloonFix = clickBalloonFix;

		// Создание DIV и позиционирование балуна
		function createBalloon()
		{
			var tlw = 14;
			var tlh = 14;
			var blw = 14;
			var blh = 41;
			var trw = 18;
			var trh = 13;
			var brw = 20;
			var brh = 41;
			var th = 2;
			var lw = 2;
			var bh = 2;
			var rw = 2;

			var legWidth = 68;

			var balloon = gmxAPI.newStyledDiv({
				position: "absolute",
				'font-family': 'Times New Roman',
/*
				paddingLeft: lw + "px",
				paddingRight: rw + "px",
				paddingTop: th + "px",
				paddingBottom: bh + "px",
*/
				width: "auto",
				//whiteSpace: "nowrap",
				zIndex: 1000
			});
			balloon.className = 'gmx_balloon';
			div.appendChild(balloon);

			var css = {
				'table': 'margin: 2px; border-collapse: collapse; font-size: 16px;',
				'bg_top_left': 'background-color: transparent; width: 13px; height: 18px; border: 0px none; padding: 1px; display: block; background-position: 2px 9px; background-image: url(\''+apiBase+'img/tooltip-top-left.png\'); background-repeat: no-repeat;',
				'bg_top': 'background-color: transparent; height: 18px; border: 0px none; padding: 0px; background-position: center 9px; background-image: url(\''+apiBase+'img/tooltip-top.png\'); background-repeat: repeat-x;',
				'bg_top_right': 'background-color: transparent; width: 18px; height: 18px; border: 0px none; padding: 1px; display: block; background-position: -5px 9px; background-image: url(\''+apiBase+'img/tooltip-top-right.png\'); background-repeat: no-repeat;',
				'bg_left': 'background-color: transparent; width: 13px; border: 0px none; padding: 1px; background-position: 2px top; background-image: url(\''+apiBase+'img/tooltip-left.png\'); background-repeat: repeat-y;',
				'bg_center': 'background-color: transparent; width: 50px; min-width: 50px; border: 0px none; background-color: white; padding: 4px; padding-right: 14px;',
				'bg_right': 'background-color: transparent; width: 13px; height: 18px; border: 0px none; padding: 1px; background-position: 0px top; background-image: url(\''+apiBase+'img/tooltip-right.png\'); background-repeat: repeat-y;',
				'bg_bottom_left': 'background-color: transparent; width: 13px; height: 18px; border: 0px none; padding: 1px; background-position: 2px top; background-image: url(\''+apiBase+'img/tooltip-bottom-left.png\'); background-repeat: no-repeat;',
				'bg_bottom': 'background-color: transparent; height: 18px; border: 0px none; padding: 1px; background-position: center top; background-image: url(\''+apiBase+'img/tooltip-bottom.png\'); background-repeat: repeat-x;',
				'bg_bottom_right': 'background-color: transparent; width: 18px; height: 18px; border: 0px none; padding: 1px; background-position: -2px top; background-image: url(\''+apiBase+'img/tooltip-bottom-right.png\'); background-repeat: no-repeat;',
				'leg': 'bottom: 18px; left: 0px; width: 68px; height: 41px; position: relative; background-repeat: no-repeat; background-image: url(\''+apiBase+'img/tooltip-leg.png\');'
			};

			var transp = '';
			if(gmxAPI.isChrome) transp =  '<img width="10" height="10" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi+P//PwNAgAEACPwC/tuiTRYAAAAASUVORK5CYII=">';	// Для Chrome добавляем невидимый контент в TD
			var body = 
				'<table cols="3" cellspacing="0" cellpadding="0" border="0" style="'+css['table']+'">'+
					'<tr>'+
						'<td style="'+css['bg_top_left']+'">'+transp+'</td>'+
						'<td style="'+css['bg_top']+'">'+transp+'</td>'+
						'<td style="'+css['bg_top_right']+'">'+transp+'</td>'+
					'</tr>'+
					'<tr>'+
						'<td style="'+css['bg_left']+'">'+transp+'</td>'+
						'<td style="'+css['bg_center']+'">'+
							'<div class="kosmosnimki_balloon">'+
							'</div>'+
						'</td>'+
						'<td style="'+css['bg_right']+'">'+transp+'</td>'+
					'</tr>'+
					'<tr>'+
						'<td style="'+css['bg_bottom_left']+'">'+transp+'</td>'+
						'<td style="'+css['bg_bottom']+'">'+transp+'</td>'+
						'<td style="'+css['bg_bottom_right']+'">'+transp+'</td>'+
					'</tr>'+
				'</table>';
			balloon.innerHTML = body;
			var nodes = balloon.getElementsByTagName("div");
			var balloonText = nodes[0];
			
			var imgStyle =	{
				position: "absolute",
				bottom: "-21px",
				right: "15px"
			};
			if(document.doctype) {
				if(gmxAPI.isChrome || gmxAPI.isSafari || gmxAPI.isIE) imgStyle["bottom"] = "-19px";
			} else if(gmxAPI.isIE && document.documentMode >= 8) imgStyle["bottom"] = "-19px";
			var leg = gmxAPI.newElement("img",
				{
					src: apiBase + "img/tooltip-leg.png"
				},
				imgStyle
			);
			balloon.appendChild(leg);

			var x = 0;
			var y = 0;
			var reposition = function()	
			{
				if(!wasVisible) return;
				var ww = balloon.clientWidth;
				var hh = balloon.clientHeight;

				var screenWidth = div.clientWidth;
				var xx = (x + ww < screenWidth) ? x : (ww < screenWidth) ? (screenWidth - ww) : 0;
				xx = Math.max(xx, x - ww + legWidth + brw);
				var dx = x - xx;
				leg.style.left = dx + "px";
				gmxAPI.bottomPosition(balloon, xx + 2, div.clientHeight - y + 20);
			}

			var updateVisible = function(flag)	
			{
				gmxAPI.setVisible(balloon, flag);
				if (flag && !wasVisible)
					ret.resize();
				wasVisible = flag;
			}
			var isVisible = function()	
			{
				return wasVisible;
			}

			var wasVisible = true;
			var setMousePos = function(x_, y_)	
			{
				x = this.mouseX = x_;
				y = this.mouseY = y_;
			}

			var ret = {						// Возвращаемый обьект
				outerDiv: balloon,
				div: balloonText,
				mouseX: 0,
				mouseY: 0,
				isVisible: isVisible,
				setVisible: updateVisible,
				setMousePos: setMousePos,
				setScreenPosition: function(x_, y_)
				{
					setMousePos(x_, y_);
					if(wasVisible) reposition();
				},
				resize: function()
				{
					reposition();
				},
				updatePropsBalloon: function(text)
				{
					updateVisible(text ? true : false);
					chkBalloonText(text, balloonText);
					reposition();
				}
			};
			return ret;
		}

		var propsBalloon = createBalloon();		// Balloon для mouseOver
		this.propsBalloon = propsBalloon;
		propsBalloon.setVisible(false);
		propsBalloon.outerDiv.style.zIndex = 10000;
		propsBalloon.outerDiv.style.display = "none";

		document.onmouseout = function(event)
		{
			if(!gmxAPI.contDivPos) return;
			var minx = gmxAPI.contDivPos['x'];
			var maxx = minx + gmxAPI._div.clientWidth;
			var eventX = gmxAPI.eventX(event);
			var miny = gmxAPI.contDivPos['y'];
			var maxy = miny + gmxAPI._div.clientHeight;
			var eventY = gmxAPI.eventY(event);
			if(eventX >= minx && eventX <= maxx && eventY >= miny && eventY <= maxy) return;
			propsBalloon.outerDiv.style.display = "none";
		}

		var positionBalloons = function(ph)	
		{
			if(balloons.length < 1) return;
			refreshMapPosition(ph);
			balloons.sort(function(b1, b2)
			{
				return b1.isHovered ? 1 : b2.isHovered ? -1 : (b2.geoY - b1.geoY);
			});
			for (var i = 0; i < balloons.length; i++)
			{
				var bal = balloons[i];
				bal.reposition();
				if(bal.outerDiv.style.zIndex != 1000 + i) bal.outerDiv.style.zIndex = 1000 + i;
			}
		}

		//map.addObject().setHandler("onMove", positionBalloons);
		gmxAPI.contDivPos = null;
		var eventXprev = 0; 
		var eventYprev = 0;
		var onmousemove = function(event)
		{
			var eventX = gmxAPI.eventX(event); 
			var eventY = gmxAPI.eventY(event);
			if(eventX == eventXprev && eventY == eventYprev) return;
			eventXprev = eventX; 
			eventYprev = eventY;
			if(!gmxAPI.contDivPos) {
				gmxAPI.contDivPos = {
					'x': gmxAPI.getOffsetLeft(div),
					'y': gmxAPI.getOffsetTop(div)
				};
			}
			var px = eventX - gmxAPI.contDivPos['x']; 
			var py = eventY - gmxAPI.contDivPos['y'];
			propsBalloon.setScreenPosition(px, py);
/*
			if(gmxAPI.proxyType == 'flash') {
				if (event.preventDefault)
				{
					event.stopPropagation();
				}
				else 
				{
					event.cancelBubble = true;
				}
			}
*/
		}

		gmxAPI._div.onmousemove = onmousemove;
		//new gmxAPI.GlobalHandlerMode("mousemove", onmousemove).set();
		
		gmxAPI.map.addListener('positionChanged', function(ph)
			{
				if(ph && ph.currZ != Math.floor(ph.currZ)) return;
				positionBalloons();
			}
		, -10);
		
		gmxAPI.map.addListener('onResizeMap', function()
			{
				gmxAPI.contDivPos = {
					'x': gmxAPI.getOffsetLeft(div),
					'y': gmxAPI.getOffsetTop(div)
				};
				positionBalloons();
			}
		, -10);
		
		function addBalloon(_notDelFlag)
		{
			var balloon = createBalloon();
			balloon.notDelFlag = _notDelFlag;
			balloon.geoX = 0;
			balloon.geoY = 0;
			balloon.isDraging = false;
			
			var oldSetVisible = balloon.setVisible;
			balloon.div.onmouseover = function()
			{
				balloon.isHovered = true;
				positionBalloons();
			}
			balloon.div.onmouseout = function()
			{
				balloon.isHovered = false;
				positionBalloons();
			}
			balloon.outerDiv.appendChild(gmxAPI.newElement(
				"img",
				{
					src: apiBase + "img/close.png",
					title: gmxAPI.KOSMOSNIMKI_LOCALIZED("Закрыть", "Close"),
					onclick: function() 
					{ 
						if(balloon.notDelFlag) {
							balloon.setVisible(false);
						}
						else
						{
							balloon.remove();
							balloon.isVisible = false;
						}
					},
					onmouseover: function()
					{
						this.src = apiBase + "img/close_orange.png";
					},
					onmouseout: function()
					{
						this.src = apiBase + "img/close.png";
					}
				},
				{
					position: "absolute",
					top: "15px",
					right: "15px",
					cursor: "pointer"
				}
			));
			balloon.isVisible = true;
			balloon.reposition = function()
			{
				if (balloon.isVisible)
				{
					refreshMapPosition();

					var sc = scale * stageZoom;
					
					// Смещение Балуна к центру
					var deltaX = 0;
					if(!balloon.isDraging) {
						var pos = gmxAPI.chkPointCenterX(this.geoX);
						var centrGEO = gmxAPI.from_merc_x(mapX);
						
						var mind = Math.abs(pos - centrGEO);
						for(var i = 1; i<4; i++) {
							var d1 = Math.abs(pos - centrGEO + i * 360);
							if (d1 < mind) { mind = d1; deltaX = i * 360; }
							d1 = Math.abs(pos - centrGEO - i * 360);
							if (d1 < mind) { mind = d1; deltaX = -i * 360; }
						}
						deltaX = gmxAPI.merc_x(deltaX) / sc;
					}

					var x = div.clientWidth/2 - (mapX - gmxAPI.merc_x(this.geoX))/sc + deltaX;
					var y = div.clientHeight/2 + (mapY - gmxAPI.merc_y(this.geoY))/sc;
					if(this.fixedDeltaFlag) {
						x += balloon.fixedDeltaX;
						y -= balloon.fixedDeltaY;
					}
					var flag = (y < 0 || y > div.clientHeight ? false : true);
					if (flag) {
						if (x < 0 || x > div.clientWidth) flag = false;
					}

					//if ((x >= 0) && (x <= div.clientWidth) && (y >= 0) && (y <= div.clientHeight))
					if (flag)
					{
						this.setScreenPosition(x, y);
						oldSetVisible(true);
					}
					else
						oldSetVisible(false);
				}
				else
				{
					oldSetVisible(false);
				}
			}
			balloon.setVisible = function(flag)
			{
				balloon.isVisible = flag;
				this.reposition();
			}
			balloon.setPoint = function(x_, y_, isDraging_)
			{
				this.geoX = x_;
				this.geoY = y_;
				this.isDraging = isDraging_;
				positionBalloons();
			}
			balloon.remove = function()
			{
				if(balloon.fixedId) delete fixedHoverBalloons[balloon.fixedId];
				var i = 0;
				while ((i < balloons.length) && (balloons[i] != this))
					i += 1;
				if (i < balloons.length)
				{
					balloons.splice(i, 1);
					div.removeChild(this.outerDiv);
				}
			}
			balloon.getX = function() { return this.geoX; }
			balloon.getY = function() { return this.geoY; }
			balloons.push(balloon);
			return balloon;
		}
		this.addBalloon = addBalloon;


		//Параметры:
		// * Balloon: текст баллуна
		// * BalloonEnable: показывать ли баллун
		// * DisableBalloonOnClick: не показывать при клике
		// * DisableBalloonOnMouseMove: не показывать при наведении
		var setBalloonFromParams = function(filter, balloonParams)
		{
/*			
			//по умолчанию балуны показываются
			if ( typeof balloonParams.BalloonEnable !== 'undefined' && !balloonParams.BalloonEnable )
			{
				disableHoverBalloon(filter);
				//return;
			}
*/			
			var balloonAttrs = {
				disableOnClick: balloonParams.DisableBalloonOnClick,
				disableOnMouseOver: balloonParams.DisableBalloonOnMouseMove
			}
			
			if ( balloonParams.Balloon )
			{
				enableHoverBalloon(filter, function(o)
					{
						var text = gmxAPI.applyTemplate(balloonParams.Balloon, o.properties);
						var summary = o.getGeometrySummary();
						text = gmxAPI.applyTemplate(text, { SUMMARY: summary });
						text = text.replace(/\[SUMMARY\]/g, '');
						return text;
					}
					,
					balloonAttrs);
			}
			else
			{
				enableHoverBalloon(filter, null, balloonAttrs);
			}
		}
		this.setBalloonFromParams = setBalloonFromParams;
		
		//явно прописывает все свойства балунов в стиле.
		var applyBalloonDefaultStyle = function(balloonStyle)
		{
			var out = gmxAPI.clone(balloonStyle);
			//слой только что создали - всё по умолчанию!
			if (typeof out.BalloonEnable === 'undefined')
			{
				out.BalloonEnable = true;
				out.DisableBalloonOnClick = false;
				out.DisableBalloonOnMouseMove = true;
			} 
			else
			{
				//поддержка совместимости - если слой уже был, но новых параметров нет 
				if (typeof out.DisableBalloonOnClick === 'undefined')
					out.DisableBalloonOnClick = false;
					
				if (typeof out.DisableBalloonOnMouseMove === 'undefined')
					out.DisableBalloonOnMouseMove = false;
			}
			return out;
		}
		this.applyBalloonDefaultStyle = applyBalloonDefaultStyle;
	}

	// Добавление прослушивателей событий
	gmxAPI._listeners.addListener({'level': -10, 'eventName': 'mapInit', 'func': function(map) {
			if(!gmxAPI.map || gmxAPI.map.balloonClassObject) return;
			gmxAPI.map.balloonClassObject = new BalloonClass();
			gmxAPI.map.addListener('zoomBy', function()	{ gmxAPI.map.balloonClassObject.hideHoverBalloons(true); });
			gmxAPI.map.addListener('hideBalloons', function() { gmxAPI.map.balloonClassObject.hideHoverBalloons(); });
			gmxAPI.map.addListener('clickBalloonFix', function(o) { gmxAPI.map.balloonClassObject.clickBalloonFix(o); });
			gmxAPI.map.addListener('initFilter', function(data)
				{
					var fullStyle = gmxAPI.map.balloonClassObject.applyBalloonDefaultStyle(data['filter']['_attr']);
					gmxAPI.map.balloonClassObject.setBalloonFromParams(data['filter'], fullStyle);
				}
			);
			
			//расширяем FlashMapObject
			gmxAPI.extendFMO('addBalloon', function() { return map.balloonClassObject.addBalloon(); });
			gmxAPI.extendFMO('enableHoverBalloon', function(callback, attr) { map.balloonClassObject.enableHoverBalloon(this, callback, attr); });
			gmxAPI.extendFMO('disableHoverBalloon', function() { map.balloonClassObject.disableHoverBalloon(this); });
		}
	});
	//gmxAPI.BalloonClass = BalloonClass;
})();
