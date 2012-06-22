(function($){

var pluginPath = '';

var VerificationControl = function(parentDivId,fireControl)
{
	var PIXEL_RADIUS = 10;
	
	var fireModule = gmxCore.getModule('FireMapplet');
		
	var _verificationURL = "http://dev2.kosmosnimki.ru/";
	var _hotspotRequestURL = 'http://sender.kosmosnimki.ru/v3/';
	
	var _verificationResults = {};
	var _parentDiv = $("#" + parentDivId);
	var _id = null;
	var _verifiedUserId = '';
	var _lastHotspotId = null;
	var _currentHotspotId = null;
	var _lastImageName = null;
	var _currentMode = 0;  // 0 menu navigation, 1 - fire verification, 2 - fire marking
	var _lastHotspotMode = 0;
	var _trueTerrain = 'forest';
	var _trueSize = 10;
	var _isAdministrator = 0;
	
	
	var latestRandomHotspotData = null;
	
	var mapCalendar = nsGmx.widgets.getCommonCalendar();

	_translationsHash.addtext("eng", {
							"validationControl.Title" : "Firefighters from Outer Space!",
							"validationControl.UserName" : "Firefighter",
							"validationControl.Verified" : "Extinguished",
							"validationControl.Marked" : "Discoveredd",
							"validationControl.Accuracy" : "Accuracy",
							"validationControl.Score" : "Score",
							"validationControl.MenuHome" : "<br>Home",
							"validationControl.MenuVerification" : "Fight<br>Fires",
							"validationControl.MenuSearch" : "Dispatch<br>Brigades",
							"validationControl.MenuAchievments" : "<br>Achievments",
							"validationControl.MenuAdmin" : "<br>Admin",
							"validationControl.AlertMinScore" : "You need to become fire chief to access this mode. For that you need to score at least 250 points!",
							"validationControl.Place" : "Place",
							"validationControl.BtnRegister" : "Register",
							"validationControl.BestUsers" : "Top Firefighters",
							"validationControl.REGISTRATION" : "Registration",
							"validationControl.USER_REGISTRATION" : "User Registration",
							"validationControl.Password" : "Password",
							"validationControl.REPEAT_PASSWORD" : "Repeat Password",
							"validationControl.VIDEO" : "Video Instructions",
							"validationControl.SAVE" : "Save",
							"validationControl.SKIP" : "Skip",
							"validationControl.REMOVE_MARKER" : "Remove Marker",
							"validationControl.HINTS_ON" : "Hints",
							"validationControl.HINTS_OFF" : "Hints: OFF",
							"validationControl.ALRT_SKIP_IMAGE" : "Are you sure there are no fires in this image? Press \"Skip\".",
							"validationControl.ALRT_USER_EXISTS" : "Username is already taken, chose a different one!",	
							"validationControl.ALRT_EMAIL" : "Check your email address, perhaps there is a typo?",
							"validationControl.ALRT_PASSWD_MATCH" : "Passwords don't match!",
							"validationControl.TrainingAlertUndo" : "Good job finding the UNDO button - use it if you clicked the wrong button by accident.\n It doesn't work in training mode though, wait until we are done here.",
							"validationControl.TUT_EXAGERATING" : "Hey, you are wasting the country's resources! This foam is expensive! Try again, covering less area.",
							"validationControl.TUT_LARGER" : "Hey, watch out! THere is still some area that's burning!",
							"validationControl.TUT_WRONG_TERRAIN" : "Wrong terrain. Look more carefully!",
							"validationControl.SAVE_RESULT" : "Save Results",
							"validationControl.TUT_ALRT_SKIP" : "Why? It should be pretty clear from this image what kind of hot spot this is. You should at least try! Please :)",
							"validationControl.SKIP_HOTSPOT" : "Skip Hot Spot",
							"validationControl.BACK" : "Back",
							"validationControl.TERRAIN" : "Fire Type",
							"validationControl.SIZE" : "Size",
							"validationControl.HOTSPOT" : "Hot Spot",
							"validationControl.LOGIN" : "Log in",
							"validationControl.Achievment1" : 'Verify 75 hot spots.',
							"validationControl.Achievment2" : 'Verify 150 hot spots.',
							"validationControl.Achievment3" : 'Verify 500 hot spots.',
							"validationControl.Achievment4" : 'Find 30 fires',
							"validationControl.Achievment5" : 'Find 80 fires',
							"validationControl.Achievment6" : 'Find 150 fires',
							'validationControl.Terrain1' : 'Wild Fire',
							'validationControl.Terrain2' : 'Agricultural',
							'validationControl.Terrain3' : 'Industrial',
							'validationControl.Terrain4' : 'Vulcano',
							'validationControl.Terrain5' : 'Water/Ice (Sun Glint?)',
							'validationControl.Size1' : 'Huge (> 10km)',
							'validationControl.Size2' : 'Medium (2km - 10km)',
							'validationControl.Size3' : 'Small (< 2km)',
							'validationControl.Size4' : 'Possible Fire',
							'validationControl.Size5' : 'No Fire',
							"validationControl.FireCount" : 'Known Fires',
							"validationControl.MarksAvailable" : 'Brigades',
							"validationControl.FiresAddressed" : 'Fires Found',
							"validationControl.HintCount" : 'Hints',
							"validationControl.AlertNoBrigades" : "You dont have any more brigades to dispatch!",
							"validationControl.AlertNoHints" : "You don't have any more hints. Gain more points!",
							"validationControl.SaveMarkedFires" : "Done",
							"validationControl.SkipImage" : "Skip",
							"validationControl.ShowHints" : "Hints",
							"validationControl.MenuExtinguished" : "Finished!",
							"validationControl.MenuCancel" : "Cancel",
							"validationControl.ADMIN_SelectCaption" : "Select HiRes Image to Show",
							"validationControl.ADMIN_ShowButton" : "Load Image",
							"validationControl.INSP_NOT_FIRE_BUT_FARM" : "Should I provide you a trator instead fire truck?! Its a fire!",
							"validationControl.INSP_NOT_FIRE_BUT_INDUSTRY" : "What are you thinking, are they making electric cars here?!",
							"validationControl.INSP_NOT_FIRE_BUT_OIL" : "One thing is fore sure, you are not Khodorkovsky...",
							"validationControl.INSP_NOT_FIRE_BUT_NOTHING" : "Are you saying these flames and smoke are a bon fire?",
							"validationControl.INSP_TOO_SMALL" : "It's still burning there! I'll have to send another brigade now...",
							"validationControl.INSP_TOO_LARGE" : "You're wasting governpent property! Could have used less foam...",
							"validationControl.INSP_NOT_FARM" : "What is this, ministry of agriculture to do irregation?!"						
							});
							
	_translationsHash.addtext("rus", {
							"validationControl.Title" : "Космические Пожарные!",
							"validationControl.UserName" : "Пожарный",
							"validationControl.Verified" : "Потушено",
							"validationControl.Marked" : "Обнаружено",
							"validationControl.Accuracy" : "Точность",
							"validationControl.Score" : "Баллы",
							"validationControl.MenuHome" : "<br>Штаб",
							"validationControl.MenuVerification" : "Тушить<br>Пожары",
							"validationControl.MenuSearch" : "Направить<br>Бригады",
							"validationControl.MenuAchievments" : "<br>Достижения",
							"validationControl.MenuAdmin" : "<br>Админ",
							"validationControl.AlertMinScore" : "Для этого нужно дослужится до Бригадира! Для этого необходимо набрать как минимум 250 баллов!",
							"validationControl.Place" : "Место",
							"validationControl.BtnRegister" : "Зарегистрировать",
							"validationControl.BestUsers" : "Лучшие пользователи:",
							"validationControl.USER_REGISTRATION" : "Регистрация пользователей",
							"validationControl.Password" : "Пароль",	
							"validationControl.REGISTRATION" : "Регистрация",							
							"validationControl.REPEAT_PASSWORD" : "Повторите пароль",	
							"validationControl.VIDEO" : "Видео Инструкции",	
							"validationControl.SAVE" : "Запомнить",	
							"validationControl.SKIP" : "Пропустить",	
							"validationControl.REMOVE_MARKER" : "Стереть Маркер",	
							"validationControl.HINTS_ON" : "Подсказки",
							"validationControl.HINTS_OFF" : "Подсказки: ВЫКЛ",	
							"validationControl.ALRT_SKIP_IMAGE" : "Вы уверены что на снимке нет пожаров? Нажмите Пропустить.",
							"validationControl.ALRT_USER_EXISTS" : "Уже зарегистрирован пользователь с таким именем, выберите новое!",	
							"validationControl.ALRT_EMAIL" : "Проверьте адрес электронной почты, возможно вы опечатались?",	
							"validationControl.ALRT_PASSWD_MATCH" : "Пароли не совпадают!",	
							"validationControl.TrainingAlertUndo" : "Если вы ошибётесь и случайно нажмёте не ту кнопку, вы можете исправить ошибку. \nТолько давайте сначала закруглим с подготовкой!",
							"validationControl.TUT_EXAGERATING" : "Не разбазаривайте казённое имущество! Попробуйте снова не покрывая лишней площади!",	
							"validationControl.TUT_LARGER" : "Эй! Вы ещё не всё потушили!",	
							"validationControl.TUT_WRONG_TERRAIN" : "Посмотрите внимательней! Неправильный вид пожара!",
							"validationControl.SAVE_RESULT" : "Запомнить Результат",	
							"validationControl.TUT_ALRT_SKIP" : "Зачем? По этим снимком должно быть понятно что это за термо-точнка. Приложите хоть малейшие усилия!!!! Пожалуйста :)",	
							"validationControl.SKIP_HOTSPOT" : "Пропустить Термо-точку",	
							"validationControl.BACK" : "Назад",	
							"validationControl.TERRAIN" : "Местность",	
							"validationControl.SIZE" : "Размер",	
							"validationControl.HOTSPOT" : "Термоточка",	
							"validationControl.LOGIN" : "Войти",
							"validationControl.Achievment1" : 'Отметить 100 очагов',
							"validationControl.Achievment2" : 'Отметить 250 очагов',
							"validationControl.Achievment3" : 'Отметить 500 очагов',
							"validationControl.Achievment4" : 'Найти 50 очагов',
							"validationControl.Achievment5" : 'Найти 100 очагов',
							"validationControl.Achievment6" : 'Найти 150 очагов',
							'validationControl.Terrain1' : 'Леса/степи',
							'validationControl.Terrain2' : 'Сельхоз',
							'validationControl.Terrain3' : 'Индустрия',
							'validationControl.Terrain4' : 'Вулкан',
							'validationControl.Terrain5' : 'Возможно Вода (блики)',
							'validationControl.Size1' : 'Огромный (> 10km)',
							'validationControl.Size2' : 'Большой (2km - 10km)',
							'validationControl.Size3' : 'Небольшой (< 2km)',
							'validationControl.Size4' : 'Возможно горит',
							'validationControl.Size5' : 'Не горит',
							"validationControl.FireCount" : 'Известные Пожары',
							"validationControl.MarksAvailable" : 'Бригады',
							"validationControl.FiresAddressed" : 'Найдено',
							"validationControl.HintCount" : 'Подсказки',
							"validationControl.AlertNoBrigades" : "У вас не осталось брагад в этом районе!",
							"validationControl.AlertNoHints" : "У вас не осталось подсказок. Заработайте больше очков!",
							"validationControl.SaveMarkedFires" : "Закончить",
							"validationControl.SkipImage" : "Пропустить",
							"validationControl.ShowHints" : "Подсказки",
							"validationControl.MenuExtinguished" : "Потушено!",
							"validationControl.MenuCancel" : "Отменить",
							"validationControl.ADMIN_SelectCaption" : "Выберите снимок",
							"validationControl.ADMIN_ShowButton" : "Загрузить",
							"validationControl.INSP_NOT_FIRE_BUT_FARM" : "Может мне вам вместо пожарной машины, кобайн предоставить?",
							"validationControl.INSP_NOT_FIRE_BUT_INDUSTRY" : "И что, вы думаете зесь производят Ё-Мобили?",
							"validationControl.INSP_NOT_FIRE_BUT_OIL" : "Дамс, одно успокаевает, до Ходорковского вам далеко...",
							"validationControl.INSP_NOT_FIRE_BUT_NOTHING" : "Это что, костёр по вашему, а не пожар?",
							"validationControl.INSP_TOO_SMALL" : "Там еще пол леса горит, а вы слиняли! Придётся ещё бригаду посылать...",
							"validationControl.INSP_TOO_LARGE" : "Разбазариваете казённое имущество, потратили в два раза больше пены чем нужно было!",
							"validationControl.INSP_NOT_FARM" :  "У нас что пожаров мало чтобы просто так поля орашать?!"			
							});
							
	var apiBase = getAPIFolderRoot();
	var _extinguishPoints = [];
	var drawFunctions = {};
	
	
	
		
	function dragCallbackExtinguish(x,y)
	{
		try{
					var metersPerPixel = getLocalScale(x,y)*getScale(globalFlashMap.getZ());
					if(_extinguishPoints.length == 0 || ((distVincenty(_extinguishPoints[_extinguishPoints.length-1][1],_extinguishPoints[_extinguishPoints.length-1][2],x,y)/metersPerPixel) > 10))
					{
						var _smokePuff = window.globalFlashMap.addObject();
						_smokePuff.setPoint(x, y);
						_smokePuff.setStyle({marker: {image: pluginPath + "img/VerificationGame/foam_icon.png", center: true}});
						_extinguishPoints.push([_smokePuff,x,y]);
					}
				}catch(o){
					alert(o);
		}
	}
	
	function downCallbackExtinguish(x,y)
	{
		try{
			var metersPerPixel = getLocalScale(x,y)*getScale(globalFlashMap.getZ());
			if(_extinguishPoints.length == 0 || ((distVincenty(_extinguishPoints[_extinguishPoints.length-1][1],_extinguishPoints[_extinguishPoints.length-1][2],x,y)/metersPerPixel) > 10))
			{
				var _smokePuff = window.globalFlashMap.addObject();
				_smokePuff.setPoint(x, y);
				_smokePuff.setStyle({marker: {image: pluginPath + "img/VerificationGame/foam_icon.png", center: true}});
				_extinguishPoints.push([_smokePuff,x,y]);
			}
		}catch(o){
			alert(o);
		}
	}
	
	// Callback for extinguishing
	function extinguishCallback(coords, props)
	{
		hideMyToolboxes();
		showExtinguishToolbox();
		
		globalFlashMap.setCursor(apiBase + pluginPath + "img/VerificationGame/extinguish_tool.png", -6, -5);
			
		globalFlashMap.enableDragging(
			dragCallbackExtinguish,
			downCallbackExtinguish,
			null
		);
	}
	
	var myToolboxes = [];
	
	function hideMyToolboxes(){
		while(myToolboxes.length > 0){
			myToolboxes.pop().remove();
		}
	}
	
	function showVerificationToolbox(){
		hideMyToolboxes();
	
		var verificationToolbox = new globalFlashMap.ToolsContainer('verificationToolbox',{'notSticky':1,'style':{ 'position': "absolute", 'top': 0,'left': 0 }});

		verificationToolbox.addTool( 
			"extinguish", 
			{
				'regularImageUrl': pluginPath + "img/VerificationGame/firetruck_white.png",
				'activeImageUrl': pluginPath + "img/VerificationGame/firetruck_orange.png",
				'onClick': extinguishCallback,
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Тушить Пожар", "Extinguish")
			}
		);
		
		verificationToolbox.addTool( 
			"farm", 
			{
				'regularImageUrl': pluginPath + "img/VerificationGame/farm_white.png",
				'activeImageUrl': pluginPath + "img/VerificationGame/farm_orange.png",
				'onClick': farmActn,
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Сельхоз", "Agriculture")
			}
		);
		
		verificationToolbox.addTool( 
			"factory", 
			{
				'regularImageUrl': pluginPath + "img/VerificationGame/factory_white.png",
				'activeImageUrl': pluginPath + "img/VerificationGame/factory_orange.png",
				'onClick': industryActn,
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Завод", "Industry")
			}
		);
		
		verificationToolbox.addTool( 
			"oil", 
			{
				'regularImageUrl': pluginPath + "img/VerificationGame/oilpump_white.png",
				'activeImageUrl': pluginPath + "img/VerificationGame/oilpump_orange.png",
				'onClick': oilActn,
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Нефтедобыча", "Oil")
			}
		);
		
		verificationToolbox.addTool( 
			"clouds", 
			{
				'regularImageUrl': pluginPath + "img/VerificationGame/clouds_white.png",
				'activeImageUrl': pluginPath + "img/VerificationGame/clouds_orange.png",
				'onClick': cloudActn,
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Облака", "Clouds")
			}
		);
		
		verificationToolbox.addTool( 
			"nofire", 
			{
				'regularImageUrl': pluginPath + "img/VerificationGame/nofire_white.png",
				'activeImageUrl': pluginPath + "img/VerificationGame/nofire_orange.png",
				'onClick': nofireActn,
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Не Горит", "No Fire")
			}
		);
		
		myToolboxes.push(verificationToolbox);
	}
	
	function hideUndoButton() {
		if(myToolboxes.length > 0 && myToolboxes[0].getToolIndex("undo") != -1)
		{
			myToolboxes[0].removeTool('undo');
		}
	}
	
	function showUndoButton() {
		if(myToolboxes.length > 0 && myToolboxes[0].getToolIndex("undo") == -1)
		{
			myToolboxes[0].addTool( 
				"undo", 
				{
					'regularImageUrl': pluginPath + "img/VerificationGame/undo_white.png",
					'activeImageUrl': pluginPath + "img/VerificationGame/undo_orange.png",
					'onClick': undoActn,
					'onCancel': function() {},
					'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Назад", "Undo")
				}
			);
		}
	}
	
	// Hide verification tools.
	var switchBack = function(){
	
		globalFlashMap.clearCursor();
		
		// Remove extinguished puffs of smoke
		for(var i=0;i<_extinguishPoints.length;i++)
		{
			_extinguishPoints[i][0].remove();
		}
		_extinguishPoints = [];
		
		// Stop spraying foam.
		//globalFlashMap.enableDragging(null,gmxAPI._drawFunctions['move'],null);
		gmxAPI.map.disableDragging();
		//gmxAPI._tools.standart.selectTool("zoom");
		gmxAPI._tools.standart.selectTool("move");
		showVerificationToolbox();
		
	}
	
	// Create extinguish confirmation menu.
	
	
	function switchExtinguishToMove()
	{
		if(myToolboxes[0].getToolIndex("move") != -1)
		{
			myToolboxes[0].removeTool("move");
			addExtinguishTool(myToolboxes[0]);
		}
		
		globalFlashMap.clearCursor();
		gmxAPI.map.disableDragging();
		gmxAPI._tools.standart.selectTool("move");
	}
	
	function switchMoveToExtinguish()
	{
		if(myToolboxes[0].getToolIndex("extinguish") != -1)
		{
			myToolboxes[0].removeTool("extinguish");
			addMoveTool(myToolboxes[0]);
		}	
		
		globalFlashMap.setCursor(pluginPath + "img/VerificationGame/extinguish_tool.png", -6, -5);
		
		globalFlashMap.enableDragging(
			dragCallbackExtinguish,
			downCallbackExtinguish,
			null
		);
	}
	
	function addMoveTool(toolbox)
	{
		var tool = toolbox.addTool( 
			'move', 
			{
				'regularImageUrl': "img/move_tool.png",
				'activeImageUrl': "img/move_tool_a.png",
				'onClick': switchExtinguishToMove,
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Не Горит", "No Fire")
			}
		);
		//$(tool.tr).setStyle("
		toolbox.setToolIndex("move",0);
	}
	
	function addExtinguishTool(toolbox)
	{
		toolbox.addTool( 
			'extinguish', 
			{
				'regularImageUrl': pluginPath + "img/VerificationGame/firetruck_white.png",
				'activeImageUrl': pluginPath + "img/VerificationGame/firetruck_orange.png",
				'onClick': switchMoveToExtinguish,
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Не Горит", "No Fire")
			}
		);
		toolbox.setToolIndex("extinguish",0);
	}
	function showExtinguishToolbox() {
		hideMyToolboxes();
		
		var extinguishToolbox = new globalFlashMap.ToolsContainer('extinguishToolbox',{'notSticky':1,'style':{ 'color':'white','position': "absolute", 'top': 0,'left': 0 }});
		
		addMoveTool(extinguishToolbox);
		
		extinguishToolbox.addTool( 
			'extinguished',
			{
				'onCancel': function() { },
				'onmouseover' : function() { this.style.color = "orange"; },
				'onmouseout': function() { this.style.color = "white"; },
				'onClick': function() {
							var maxDistance = 500;
							if(_extinguishPoints.length == 0){
								alert("You have not extinghuished anything, is there no fire?\n Click Cancel and select appropriate action.");
							}else{
								var fireList = '';
								var lastFireListItm = null;
								
								var sumX = 0;
								var sumY = 0;
								
								// FIgure out the size of the fire based on the marked dots.
								for(var i=0;i<_extinguishPoints.length;i++){
									var coords = _extinguishPoints[i][0].getGeometry().coordinates;
									sumX += coords[0];
									sumY += coords[1];
									for(var j =i+1;j<_extinguishPoints.length;j++){
										var distance = parseFloat(distVincenty(_extinguishPoints[i][1],_extinguishPoints[i][2],_extinguishPoints[j][1],_extinguishPoints[j][2]));
										if(distance > maxDistance){
											maxDistance = distance;
										}
									}
									if(lastFireListItm == null || parseFloat(distVincenty(lastFireListItm[1],lastFireListItm[2],_extinguishPoints[i][1],_extinguishPoints[i][2])) > 500){
										lastFireListItm = _extinguishPoints[i];
										fireList += _extinguishPoints[i][1]+" "+_extinguishPoints[i][2]+";";
									}
								}
											
								var x = $("#flash.flashMap").width()/2 - (globalFlashMap.getX() - merc_x(sumX/_extinguishPoints.length))/getScale(globalFlashMap.getZ());
								var y = $("#flash.flashMap").height()/2 + (globalFlashMap.getY() - merc_y(sumY/_extinguishPoints.length))/getScale(globalFlashMap.getZ());
								
								
								extinguishActn(maxDistance,fireList,x,y);
								
								switchBack();  
							}
						},
				'hint': _gtxt("validationControl.MenuExtinguished")
			}
		);
		
		extinguishToolbox.addTool( 
			'cancel',
			{
				'onClick': function() {	switchBack(); },
				'onCancel': function() { },
				'onmouseover': function() { this.style.color = "orange"; },
				'onmouseout': function() { this.style.color = "wheat"; },
				'hint': _gtxt("validationControl.MenuCancel")
			}
		);
		
		myToolboxes.push(extinguishToolbox);
	}
	
	function showDispatchToolbox() {
		hideMyToolboxes();
		
		var dispatchToolbox = new globalFlashMap.ToolsContainer('dispatchToolbox',{'notSticky':1,'style':{ 'position': "absolute", 'top': 40,'left': 6 }});
		
		dispatchToolbox.addTool( 
			'save',
			{
				'onmouseover': function() { this.style.color = "orange"; },
				'onmouseout': function() { this.style.color = "white"; },
				'onClick': function() { dispatch_saveFctn(); },
				'onCancel': function() { },
				'hint': _gtxt("validationControl.SaveMarkedFires")
			}
		);
		
		dispatchToolbox.addTool( 
			'hints',
			{

				'onmouseover': function() { this.style.color = "orange"; },
				'onmouseout': function() { this.style.color = "white"; },
				'onClick': function() { 	dispatch_hintsFctn();},
				'onCancel': function() { },
				'hint': _gtxt("validationControl.ShowHints")
				
			}
		);
		
		
		myToolboxes.push(dispatchToolbox);
	}
	
	function hideSkipButton() {
		if(myToolboxes.length > 0 && myToolboxes[0].getToolIndex("skip") != -1)
		{	
			myToolboxes[0].removeTool('skip');
		}
	}
	
	function showSkipButton() {
		if(myToolboxes.length > 0 && myToolboxes[0].getToolIndex("skip") == -1)
		{
			myToolboxes[0].addTool( 
				'skip',
				{
					'onmouseover': function() { this.style.color = "orange"; },
					'onmouseout': function() { this.style.color = "white"; },
					'onClick': function() { dispatch_skipFctn();gmxAPI._tools.standart.selectTool("move"); },
					'onCancel': function() { },
					'hint': _gtxt("validationControl.SkipImage")
				}
			);
		}
	}
	
	var extinguishActn = null;
	var nofireActn = null;
	var oilActn = null;
	var industryActn = null;
	var cloudActn = null;
	var farmActn = null;
	var undoActn = null;
	
	var dispatch_saveFctn = null;
	var dispatch_hintsFctn = null;
	var dispatch_skipFctn = null;
	
	function setVerificationActionHandlers(extinguishFctn,farmFctn,industryFctn,oilFctn,cloudsFctn,nofireFctn,undoFctn)
	{
		extinguishActn = extinguishFctn;
		farmActn = farmFctn;
		industryActn = industryFctn;
		oilActn = oilFctn;
		cloudActn = cloudsFctn;
		nofireActn = nofireFctn;
		undoActn = undoFctn;
	}
	
	
	function setDispatchActionHandlers(saveFctn,hintsFctn,skipFctn)
	{
		dispatch_saveFctn = saveFctn;
		dispatch_hintsFctn = hintsFctn;
		dispatch_skipFctn = skipFctn;
	}
	
	var getLocalScale = function(x, y)
	{
		return distVincenty(x, y, from_merc_x(merc_x(x) + 40), from_merc_y(merc_y(y) + 30))/50;
	}
	/*
	drawFunctions.extinguish = function(coords, props)
	{
		globalFlashMap.verificationToolsControl.showVerificationButtons()
		
		globalFlashMap.setCursor(apiBase + "img/extinguish_tool.png", -6, -5);
			
		globalFlashMap.enableDragging(
			function(x, y)
			{
				try{
					var metersPerPixel = getLocalScale(x,y)*getScale(globalFlashMap.getZ());
					if(_extinguishPoints.length == 0 || ((distVincenty(_extinguishPoints[_extinguishPoints.length-1][1],_extinguishPoints[_extinguishPoints.length-1][2],x,y)/metersPerPixel) > 10))
					{
						var _smokePuff = window.globalFlashMap.addObject();
						_smokePuff.setPoint(x, y);
						_smokePuff.setStyle({marker: {image: "api/img/foam_icon.png", center: true}});
						_extinguishPoints.push([_smokePuff,x,y]);
					}
				}catch(o){
					alert(o);
				}
			},
			function(x, y)
			{
				try{
					var metersPerPixel = getLocalScale(x,y)*getScale(globalFlashMap.getZ());
					
					if(_extinguishPoints.length == 0 || ((distVincenty(_extinguishPoints[_extinguishPoints.length-1][1],_extinguishPoints[_extinguishPoints.length-1][2],x,y)/metersPerPixel) > 10))
					{
						var _smokePuff = window.globalFlashMap.addObject();
						_smokePuff.setPoint(x, y);
						_smokePuff.setStyle({marker: {image: "api/img/foam_icon.png", center: true}});
						_extinguishPoints.push([_smokePuff,x,y]);
					}
				}catch(o){
					alert(o);
				}
			},
			function()
			{
				//var d = 10*getScale(globalFlashMap.getZ());
				//if (!x1 || !x2 || !y1 || !y2 || ((Math.abs(merc_x(x1) - merc_x(x2)) < d) && (Math.abs(merc_y(y1) - merc_y(y2)) < d)))
				//	globalFlashMap.zoomBy(1, true);
				//else
				//	globalFlashMap.slideToExtent(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
				//rect.remove();
				//globalFlashMap.drawing.selectTool("move");
			}
		);
	}
	
	drawFunctions.clouds = function()
	{
		var x = $("#flash.flashMap").width()/2;
		var y = $("#flash.flashMap").height()/2;
		cloudsActn(x,y);
		globalFlashMap.drawing.selectTool("move");
	}
		
		
	drawFunctions.nofire = function()
	{
		var x = $("#flash.flashMap").width()/2;
		var y = $("#flash.flashMap").height()/2;
		nofireActn(x,y);
		globalFlashMap.drawing.selectTool("move");
	}
	drawFunctions.farm = function()
	{
		var x = $("#flash.flashMap").width()/2;
		var y = $("#flash.flashMap").height()/2;

		farmActn(x,y);
		globalFlashMap.drawing.selectTool("move");
	}
	drawFunctions.factory = function()
	{
		var x = $("#flash.flashMap").width()/2;
		var y = $("#flash.flashMap").height()/2;

		industryActn(x,y);
		globalFlashMap.drawing.selectTool("move");
	}
	drawFunctions.oil = function()
	{
		var x = $("#flash.flashMap").width()/2;
		var y = $("#flash.flashMap").height()/2;
		
		oilActn(x,y);
		globalFlashMap.drawing.selectTool("move");
	}
	drawFunctions.undo = function()
	{
		undoActn();
		globalFlashMap.drawing.selectTool("move");
	}
	
	var toolPlaqueX = 5;
	var toolPlaqueY = 40;
		
	//border: 0pt none; margin: 0pt; padding: 0pt; position: absolute;  background-color: rgb(1, 106, 138); opacity: 0.5; visibility: visible; display: block; width: 73px; height: 96px;
	var vfyToolsContainer = newStyledDiv({ position: "absolute", top: 0, left: 0,display:'none',left: toolPlaqueX + "px",top: toolPlaqueY + "px"});
	var vfyToolsBackground = newStyledDiv({
		position: "absolute",
		left: toolPlaqueX + "px",
		top: toolPlaqueY + "px",
		width: "80px",
		backgroundColor: "#016a8a",
		display:'none',
		opacity: 0.5
	});
	
	
	$("#allTools").append(vfyToolsBackground);
	$("#allTools").append(vfyToolsContainer);
	
	var vfyToolTypes_ = ["extinguish", "farm", "factory", "oil", "clouds", "nofire","undo"];
	var vfyImageNames = ["firetruck", "farm", "factory", "oilpump", "clouds", "nofire","undo"];
	var vfyToolHints = ["Тушить Пожар", "Сельхоз", "Завод", "Нефте-добыча", "Облака", "Не Горит","Назад"];
	var vfyToolHintsEng = ["Extinguish", "Agriculture", "Factory", "Oil Extraction", "Cloud", "No Fire","Undo"];
	
	
	for (var i = 0; i < vfyToolTypes_.length; i++)
	{
		globalFlashMap.drawing.addTool(
			vfyToolTypes_[i], 
			KOSMOSNIMKI_LOCALIZED(vfyToolHints[i], vfyToolHintsEng[i]),
			apiBase + "img/" + vfyImageNames[i] + "_white.png",
			apiBase + "img/" + vfyImageNames[i] + "_orange.png",
			drawFunctions[vfyToolTypes_[i]],
			function() {},
			vfyToolsContainer,
			vfyToolsBackground
		);
	}
	
	//Undo tool is not visible by default
//	globalFlashMap.drawing.tools["undo"].isVisible = false;
//	globalFlashMap.drawing.positionTools();  

		
	globalFlashMap.verificationToolsControl = {
		
		showVerificationButtons: function()
		{
			// Hide verification tools.
			var switchBack = function(){
				$(vfyToolsContainer).find("div").remove();
				
				// Make the tools visible again
				$(vfyToolsContainer).find("img").css('display','block'); 
				
				globalFlashMap.drawing.setToolHandler("onClick", null);
				globalFlashMap.drawing.setToolHandler("onMouseDown", null);
				//globalFlashMap.drawing.setHandler("onClick",null);
				//globalFlashMap.drawing.setHandler("onMouseDown",null);
				globalFlashMap.clearCursor();
				
				// Remove extinguished puffs of smoke
				for(var i=0;i<_extinguishPoints.length;i++)
				{
					_extinguishPoints[i][0].remove();
				}
				_extinguishPoints = [];
				
				globalFlashMap.drawing.selectTool("move");
				globalFlashMap.drawing.positionTools();  
			}
			
			vfyToolsContainer.appendChild(newElement(
				"div",
				{
					className: "vfyButton",
					innerHTML: _gtxt("validationControl.MenuExtinguished"),
					onmouseover: function() { this.style.color = "orange"; },
					onmouseout: function() { this.style.color = "white"; },
					onclick: function() { 
						var maxDistance = 500;
						if(_extinguishPoints.length == 0){
							alert("You have not extinghuished anything, is there no fire?\n Click Cancel and select appropriate action.");
						}else{
							var fireList = '';
							var lastFireListItm = null;
							
							var sumX = 0;
							var sumY = 0;
							
							// FIgure out the size of the fire based on the marked dots.
							for(var i=0;i<_extinguishPoints.length;i++){
								var coords = _extinguishPoints[i][0].getGeometry().coordinates;
								sumX += coords[0];
								sumY += coords[1];
								for(var j =i+1;j<_extinguishPoints.length;j++){
									var distance = parseFloat(distVincenty(_extinguishPoints[i][1],_extinguishPoints[i][2],_extinguishPoints[j][1],_extinguishPoints[j][2]));
									if(distance > maxDistance){
										maxDistance = distance;
									}
								}
								if(lastFireListItm == null || parseFloat(distVincenty(lastFireListItm[1],lastFireListItm[2],_extinguishPoints[i][1],_extinguishPoints[i][2])) > 500){
									lastFireListItm = _extinguishPoints[i];
									fireList += _extinguishPoints[i][1]+" "+_extinguishPoints[i][2]+";";
								}
							}
										
							var x = $("#flash.flashMap").width()/2 - (globalFlashMap.getX() - merc_x(sumX/_extinguishPoints.length))/getScale(globalFlashMap.getZ());
							var y = $("#flash.flashMap").height()/2 + (globalFlashMap.getY() - merc_y(sumY/_extinguishPoints.length))/getScale(globalFlashMap.getZ());
							
							
							extinguishActn(maxDistance,fireList,x,y);
							
							switchBack();  
						}
					}
				},
				{ 
					padding: "15px", 
					paddingTop: "8px", 
					paddingBottom: "9px", 
					fontSize: "12px",
					fontFamily: "sans-serif",
					cursor: "pointer", 
					color: "white",
					fontWeight: "bold"
				}
			));
			vfyToolsContainer.appendChild(newElement(
				"div",
				{
					className: "vfyButton",
					innerHTML: _gtxt("validationControl.MenuCancel"),
					onmouseover: function() { this.style.color = "orange"; },
					onmouseout: function() { this.style.color = "white"; },
					onclick: function() { switchBack();}
				},
				{ 
					padding: "15px", 
					paddingTop: "8px", 
					paddingBottom: "9px", 
					fontSize: "12px",
					fontFamily: "sans-serif",
					cursor: "pointer", 
					color: "white",
					fontWeight: "bold"
				}
			));
			
			$(vfyToolsContainer).find("img").css('display','none');
			
			setTimeout(function()
			{
				vfyToolsBackground.style.width = vfyToolsContainer.clientWidth + "px";
				vfyToolsBackground.style.height = vfyToolsContainer.clientHeight + "px";
			}, 50);
			
		},
		showUndoButton: function(){
			globalFlashMap.drawing.tools["undo"].isVisible = true;
			globalFlashMap.drawing.positionTools();  
		},
		hideUndoButton: function(){
			globalFlashMap.drawing.tools["undo"].isVisible = false;
			globalFlashMap.drawing.positionTools();  
		},
		show: function(fExtinguish)
		{
			extinguishAction = fExtinguish;
			
			globalFlashMap.baseLayerControl.setVisible(false);
			$(vfyToolsBackground).css('display','block');
			$(vfyToolsContainer).css('display','block');
			$('#toolPlaque').css('display','none');
			$('#toolsContainer').css('display','none');
			$(dispatchToolsContainer).css('display','none');
			$(dispatchToolsBackground).css('display','none');
			
		},
		hide: function()
		{
			$(vfyToolsBackground).css('display','none');
			$(vfyToolsContainer).css('display','none');
			$('#toolPlaque').css('display','block');
			$('#toolsContainer').css('display','block');
			$(dispatchToolsContainer).css('display','none');
			$(dispatchToolsBackground).css('display','none');
		}
	}
		
	
	// ---- Dispatch tool
	var dispatchToolsContainer = newStyledDiv({ position: "absolute", top: 0, left: 0,display:'none',left: toolPlaqueX + "px",top: toolPlaqueY + "px"});
	var dispatchToolsBackground = newStyledDiv({
		position: "absolute",
		left: toolPlaqueX + "px",
		top: toolPlaqueY + "px",
		width: "80px",
		backgroundColor: "#016a8a",
		display:'none',
		opacity: 0.5
	});
	
	$('#allTools').append(dispatchToolsBackground);
	$('#allTools').append(dispatchToolsContainer);
	
	globalFlashMap.dispatchToolsControl = {
	
		showSkipButton: function(){
			$(dispatchToolsContainer).find("#skipBtn").css('display','block');
			setTimeout(function()
			{
				dispatchToolsBackground.style.width = dispatchToolsContainer.clientWidth + "px";
				dispatchToolsBackground.style.height = dispatchToolsContainer.clientHeight + "px";
			}, 50);
			
		},
		hideSkipButton: function(){
			$(dispatchToolsContainer).find("#skipBtn").css('display','none');
			setTimeout(function()
			{
				dispatchToolsBackground.style.width = dispatchToolsContainer.clientWidth + "px";
				dispatchToolsBackground.style.height = dispatchToolsContainer.clientHeight + "px";
			}, 50);
			
		},
		show: function(fExtinguish)
		{
			extinguishAction = fExtinguish;
			
			globalFlashMap.baseLayerControl.setVisible(false);					
			$(dispatchToolsContainer).css('display','block');
			$(dispatchToolsBackground).css('display','block');
			$(vfyToolsBackground).css('display','none');
			$(vfyToolsContainer).css('display','none');
			$(toolPlaque).css('display','none');
			$(toolsContainer).css('display','none');
			
		},
		hide: function()
		{
			$(dispatchToolsContainer).css('display','none');
			$(dispatchToolsBackground).css('display','none');
			$(vfyToolsBackground).css('display','none');
			$(vfyToolsContainer).css('display','none');
			$(toolPlaque).css('display','block');
			$(toolsContainer).css('display','block');
		},
		
		{
			
			dispatchToolsContainer.appendChild(newElement(
				"div",
				{
					id: "btnSave",
					innerHTML: _gtxt("validationControl.SaveMarkedFires"),
					onmouseover: function() { this.style.color = "orange"; },
					onmouseout: function() { this.style.color = "white"; },
					onclick: function() { 
						saveFctn();
					}
				},
				{ 
					padding: "15px", 
					paddingTop: "8px", 
					paddingBottom: "9px", 
					fontSize: "12px",
					fontFamily: "sans-serif",
					cursor: "pointer", 
					color: "white",
					fontWeight: "bold"
				}
			));
			
			dispatchToolsContainer.appendChild(newElement(
				"div",
				{
					id: "btnHints",
					innerHTML: _gtxt("validationControl.ShowHints"),
					onmouseover: function() { this.style.color = "orange"; },
					onmouseout: function() { this.style.color = "white"; },
					onclick: function() { 
						hintsFctn();
					}
				},
				{ 
					padding: "15px", 
					paddingTop: "8px", 
					paddingBottom: "9px", 
					fontSize: "12px",
					fontFamily: "sans-serif",
					cursor: "pointer", 
					color: "white",
					fontWeight: "bold"
				}
			));
			dispatchToolsContainer.appendChild(newElement(
				"div",
				{
					id: "skipBtn",
					innerHTML: _gtxt("validationControl.SkipImage"),
					onmouseover: function() { this.style.color = "orange"; },
					onmouseout: function() { this.style.color = "white"; },
					onclick: function() { skipFctn();}
				},
				{ 
					padding: "15px", 
					paddingTop: "8px", 
					paddingBottom: "9px", 
					fontSize: "12px",
					fontFamily: "sans-serif",
					cursor: "pointer", 
					color: "white",
					fontWeight: "bold"
				}
			));
			setTimeout(function()
			{
				dispatchToolsBackground.style.width = dispatchToolsContainer.clientWidth + "px";
				dispatchToolsBackground.style.height = dispatchToolsContainer.clientHeight + "px";
			}, 50);
			
		}
	}
	
	*/
	
	var gameCommunicationDiv = newStyledDiv({ position: "absolute", top: "400px", left: 0,display:'block'});
	
	//allTools.appendChild(gameCommunicationDiv);
	//allTools.appendChild(gameCommunicationBkg);
	
	var gameCommunicationControl = 
	{
		msgHappy: function(x,y,msg)
		{
			$(gameCommunicationDiv).css("top",y+"px");
			$(gameCommunicationDiv).css("font-size","20pt");
			$(gameCommunicationDiv).css("color","green");
			$(gameCommunicationDiv).css("left",x+"px");
			$(gameCommunicationDiv).text(msg);
			
			setTimeout(function(){$(gameCommunicationDiv).text('')},3000);
		},
		msgUnhappy: function(x,y,msg)
		{
			$(gameCommunicationDiv).css("top",y+"px");
			$(gameCommunicationDiv).css("font-size","20pt");
			$(gameCommunicationDiv).css("color","red");
			$(gameCommunicationDiv).css("left",x+"px");
			$(gameCommunicationDiv).text(msg);
			
			setTimeout(function(){$(gameCommunicationDiv).text('')},3000);
		},
	
		show: function()
		{
			$(gameCommunicationDiv).css('display','block');
			//$(gameCommunicationBkg).css('display','block');
		},
		hide: function()
		{
			$(gameCommunicationDiv).css('display','none');
			//$(gameCommunicationBkg).css('display','none');
			
		}
	}
	
	
	function hideSystemMenues()
	{
		if(Object.keys(gmxAPI._tools).length > 0){
			for( var key in gmxAPI._tools){
				gmxAPI._tools[key].setVisible(false);
			}
		}
	}
	
	var changeFlashMapUIVerification = function()
	{
		hideSystemMenues();
		
		setVerificationActionHandlers(
			function(fireSize,fireList,x,y){_validationControl.processHotspotVerification(_currentHotspotId,'forest',Math.round(fireSize/1000),fireList,x,y);}, //Extinguish action
			function(x,y){_validationControl.processHotspotVerification(_currentHotspotId,'grass',0,'',x,y);}, //Farm action
			function(x,y){_validationControl.processHotspotVerification(_currentHotspotId,'factory',0,'',x,y);}, //Factory action
			function(x,y){_validationControl.processHotspotVerification(_currentHotspotId,'oil',0,'',x,y);}, //Oil action
			function(x,y){_validationControl.processHotspotVerification(_currentHotspotId,'clouds',0,'',x,y);}, //Clouds action
			function(x,y){_validationControl.processHotspotVerification(_currentHotspotId,'forest',-1,'',x,y);}, // No fire action
			function(){_validationControl.undoPreviousDecision();} //Undo action
		); //No Fire action
		
		showVerificationToolbox();
	}
	
	
	setDispatchActionHandlers(
		function(){ _validationControl.processMarkedFires(); },
		function(){ _validationControl.processShowHints(); },
		function(){ _validationControl.processSkipImage(); }
	);

	var changeFlashMapUIDispatch = function()
	{
		hideSystemMenues();
		showDispatchToolbox();
	}
	
	var showScore = function(nVerified,nImagesMarked,accuracy,score)
	{
		if(accuracy == 0){
			accuracy = 'N/A';
			score = 0;
		}else{
			accuracy = (accuracy*100).toFixed(2) + "%";
		}
		_parentDiv.append($("<b>"+_gtxt("validationControl.UserName")+":</b> " + _verifiedUserId + "<br><br>"));
		_parentDiv.append($("<table border=2 width=100%><tr><td><b>"+_gtxt("validationControl.Verified")+"</b></td><td><b>"+_gtxt("validationControl.Marked")+"</b></td><td><b>"+_gtxt("validationControl.Accuracy")+"</b></td></tr><tr><td><div>"+nVerified+"</div></td><td>"+nImagesMarked+"</td><td>"+accuracy+"</td></tr><tr><td colspan=3 align=center><b>"+_gtxt("validationControl.Score")+"</b></td></tr><tr><td colspan=3 align=center><div style='font-size:20pt;color:orange' id='currentScore'>"+score+"</div></td></tr></table><br>"));
	}
	
	var updateCurrentScore = function(score,x,y)
	{
		scoreDiff = score-_currentScore;
		
		// Penalize score accumulation based on accuracy
		if(scoreDiff > 0){
			newScore = _currentScore + Math.floor(scoreDiff*_currentAccuracy);
		}else{
			newScore = _currentScore + scoreDiff;
			
			//If we loose points, dont let it effect hint score accumulation negatively, just reset it
			_lastHintScore = newScore;
		}
		

		if((newScore - _lastHintScore) > 200){
			updateHintCount(_hintCount + Math.floor((newScore - _lastHintScore)/200));
			_lastHintScore = newScore;
		}
		if(x != null){
			if(newScore -_currentScore >= 0){
				gameCommunicationControl.msgHappy(x,y,"+"+(newScore-_currentScore));
			}else{
				gameCommunicationControl.msgUnhappy(x,y,"-"+(_currentScore-newScore));
			}
		}
		_currentScore = newScore;
		if($("#currentScore").length > 0){
			$("#currentScore").text(newScore);
		}
	}
	
	var updateHintCount = function(hintCount)
	{
		_hintCount = hintCount;
		
		if($("#hintCount").length > 0){
			$("#hintCount").text(hintCount);
		}
	}
	
	var showImageMarkingResources = function(nFires,nBrigades,nConfirmedFires,hintCount)
	{
		//check if the resources are already displayed, if so, just update them
		if($("#nFires").length > 0){
			$("#nFires").text(nFires);
			$("#nBrigades").text(nBrigades);
			$("#nConfirmedFires").text(nConfirmedFires);
			$("#hintCount").text(hintCount);
		}else{
			_parentDiv.append($("<table border=2 width=100%><tr><td><b>"+_gtxt("validationControl.MarksAvailable")+"</b></td><td><b>"+_gtxt("validationControl.FireCount")+"</b></td><td><b>"+_gtxt("validationControl.FiresAddressed")+"</b></td><td><b>"+_gtxt("validationControl.HintCount")+"</b></td></tr><tr><td><div id='nBrigades'>"+nBrigades+"</div></td><td><div id='nFires'>"+nFires+"</div></td><td><div id='nConfirmedFires'>"+nConfirmedFires+"</div></td><td><div id='hintCount'>"+hintCount+"</div></td></tr></table><br>"));
			$("#nFires").css('font-size','18pt');
			$("#nFires").css('color','red');
			$("#nBrigades").css('font-size','18pt');
			$("#nBrigades").css('color','blue');
			$("#nConfirmedFires").css('font-size','18pt');
			$("#nConfirmedFires").css('color','green');
			$("#hintCount").css('font-size','18pt');
			$("#hintCount").css('color','black');
		}
	}
	
	var showTabbedMenu = function(currentScore)
	{
		var menu = $("<ul id='globalnav'></ul>");
		var menuItem1 = $('<LI></LI>').append($("<a href='#'>"+_gtxt("validationControl.MenuHome")+"</a>").click(function(){_validationControl.showStartScreen(currentScore)}));
		var menuItem2 = $('<LI></LI>').append($("<a href='#'>"+_gtxt("validationControl.MenuVerification")+"</a>").click(function(){changeFlashMapUIVerification();_validationControl.nextVerificationHotspot()}));
		var menuItem3 = $('<LI></LI>').append($("<a href='#'>"+_gtxt("validationControl.MenuSearch")+"</a>").click(function(){
				if(currentScore < 250){
					alert(_gtxt("validationControl.AlertMinScore"));
				}else{
					changeFlashMapUIDispatch();_validationControl.nextFireSearchImage();
				}
			}));
		
		
		var menuItem4 = $('<LI></LI>').append($("<a href='#'>"+_gtxt("validationControl.MenuAchievments")+"</a>").click(function(){_validationControl.showAchievementsScreen()}));
		var menuItem5 = $('<LI></LI>').append($("<a href='#'>"+_gtxt("validationControl.MenuAdmin")+"</a>").click(function(){_validationControl.showAdminToolsScreen()}));
		
		if(_currentMode == 0){
			$(menuItem1).children().attr('class','here');
		}else if(_currentMode == 1){
			$(menuItem2).children().attr('class','here');
		}else if(_currentMode == 2){
			$(menuItem3).children().attr('class','here');
		}else if(_currentMode == 3){
			$(menuItem4).children().attr('class','here');
		}else if(_currentMode == 4){
			$(menuItem5).children().attr('class','here');
		}
		
		menu.append(menuItem1);
		menu.append(menuItem2);
		menu.append(menuItem3);
		menu.append(menuItem4);
		
		if(_isAdministrator == 1){
			menu.append(menuItem5);
		}
		
		_parentDiv.append(menu);
	}
	
	var sparseFireLocations = function(trueFireLocations)
	{
		// Weed out unnecessary fire locations.
		
		groupedFires = [];
		
		ungroupedFires = trueFireLocations;
		
		// Pick an ungrouped fire
		while(ungroupedFires.length > 0){
			var centerFire = ungroupedFires.pop();
			
			// Go backwards through the list so removing item does not effect index.
			for(var i=ungroupedFires.length-1;i>=0;i--){
				// Get rid of all fires within 2km of the center fire.
				if(parseFloat(distVincenty(centerFire[0],centerFire[1],ungroupedFires[i][0],ungroupedFires[i][1])) < 3500){
					ungroupedFires.splice(i,1);
				}
			}
			groupedFires.push(centerFire);
		}
		
		return groupedFires;
	}
	
	
	var showTopScore = function(parent)
	{
		// Request the server for top scoring users, sorted in order.
		var requestUrl = _verificationURL + "DBWebProxy.ashx?Type=GetTopUserScores&param_userid="+_verifiedUserId;
		
		sendCrossDomainJSONRequest(requestUrl, function(data)
		{
			if (data.Result != 'Ok')
			{
				alert("Error requesting top scores!");
				return;
			}
			
			
			var scoreTable = $("<table width=100%></table>");
			
			
			scoreTable.append("<tr><td><b>"+_gtxt("validationControl.Place")+"</b></td><td width=40px></td><td><b>ID</b></td><td><b>"+_gtxt("validationControl.Score")+"</b></td></tr>");
			
			for(var i = 0;i < data.Response.length;i++){
				var row = "<tr>";
				var rowStyle = ''
				if(data.Response[i][1] == _verifiedUserId){
					rowStyle = " style='color:red;text-weight:bold' ";
				}
				row += "<td "+rowStyle+">"+data.Response[i][0]+"</td><td>"
				if(data.Response[i][3] > 1){
					row += "<img src='"+pluginPath + "img/VerificationGame/tiny_medal_b.png'>";
				}
				if(data.Response[i][3] > 3){
					row += "<img src='"+pluginPath + "img/VerificationGame/tiny_medal_s.png'>";
				}
				if(data.Response[i][3] > 5){
					row += "<img src='"+pluginPath + "img/VerificationGame/tiny_medal_gold.png'>";
				}
				
				row +="</td><td "+rowStyle+">"+data.Response[i][1]+"</td><td "+rowStyle+">"+data.Response[i][2]+"</td></tr>";
				scoreTable.append(row);
			}
			parent.append("<h3>"+_gtxt("validationControl.BestUsers")+":</h3>");
			parent.append(scoreTable);
		});
	
	}
	
	var _Terrains = [];
	_Terrains[_gtxt('validationControl.Terrain1')] = ['forest'];
	_Terrains[_gtxt('validationControl.Terrain2')] = ['grass'];
	_Terrains[_gtxt('validationControl.Terrain3')] = ['industrial'];
	_Terrains[_gtxt('validationControl.Terrain4')] = ['Vulcano'];
	_Terrains[_gtxt('validationControl.Terrain5')] = ['water'];
	
	var _Sizes = [];
	_Sizes[_gtxt('validationControl.Size1')] = '10';
	_Sizes[_gtxt('validationControl.Size2')] = '8';
	_Sizes[_gtxt('validationControl.Size3')] = '6';
	_Sizes[_gtxt('validationControl.Size4')] = '4';
	_Sizes[_gtxt('validationControl.Size5')] = '2';
	
	var _highlightMarker = null;
	
	//элементы GUI
	var _selTerrain = null;
	var _selSize = null;
	var _txtComment = null;
	var _username = '';
	var _password = '';
	var _comboBonus = 0;
	var _hintCount = 0;
	var _currentScore = 0;
	var _currentAccuracy = 1;
	var _lastHintScore = 0;
	var _nFiresFound = 0;
	var _currentImageName = '';
	
	var _currentImageXY = [0,0];
	
	var _markedPoints = [];
	var _hintPoints = [];
	var _trueFireLocations = [];
	var _currentMapUIMode = "NORMAL";
	
	function clearMarkers()
	{	
		try
		{
			for(var i = 0;i < _markedPoints.length;i++){
				_markedPoints[i][0].remove();
			}
		}catch(e)
		{
			alert(e);
		}
		_markedPoints = [];
	}
	
	function clearLastMarker()
	{	
		if(_markedPoints.length > 0){
			var lastElt = _markedPoints.pop()
			lastElt[0].remove();
		}
	}
	
	function clearHints()
	{	
		for(var i = 0;i < _hintPoints.length;i++){
			_hintPoints[i][0].remove();
		}
		_hintPoints = [];
	}
	
	var rect;
	
	
	var _validationControl = {
		getLatestRandomHotspotData: function()
		{
			return latestRandomHotspotData;
		},
		getSpotLandsatName: function()
		{
			if(_currentImageName){
				return _currentImageName;
			}else{
				return '';
			}
		},
		showLoginScreen: function()
		{
			var _this = this;	
			_currentMode = 0;
			
			var inUsername = $('<input></input>');
			inUsername.addClass('in_username');
			inUsername.attr('type', 'text');
			
			var inPassword = $('<input></input>');
			inPassword.addClass('in_password');
			inPassword.attr('type', 'password');
			
			
			var registerButton = $('<button>'+_gtxt("validationControl.REGISTRATION")+'</button>').click(function()
				{
					_this.userRegistration();
				});
			var loginButton = $('<button>'+_gtxt("validationControl.LOGIN")+'</button>').click(function()
				{
					var requestUrl = _verificationURL + "DBWebProxy.ashx?Type=VerificationUserLogin&param_userid="+$(inUsername).val()+"&"+"param_password="+$(inPassword).val();
				
					sendCrossDomainJSONRequest(requestUrl, function(data)
					{
						if (data.Result != 'Ok')
						{
							//onError( data.Result == 'TooMuch' ? fireModule.IDataProvider.ERROR_TOO_MUCH_DATA : fireModule.IDataProvider.SERVER_ERROR );
							alert("Server error on logging in!");
							return;
						}
						if(data.Response[0][0] == 1){
							_verifiedUserId = $(inUsername).val();
							_isAdministrator = data.Response[0][2];
							_this.showStartScreen(data.Response[0][1]);
						}else{
							alert("Username or password are not valid! New User?");
						}
						
					});
					
				});
			
			
			_parentDiv.empty();
			
			_parentDiv.append($("<H3></H3>").append($("<a href='javascript:void(0);'>"+_gtxt("validationControl.Title")+" (?)</a>")).click( function(){_validationControl.showJoke()}));
			_parentDiv.append("<br>"+_gtxt("validationControl.UserName")+": <br>");
			_parentDiv.append(inUsername);
			_parentDiv.append("<br>"+_gtxt("validationControl.Password")+": <br>");
			_parentDiv.append(inPassword).append("<br><br>");
			
			_parentDiv.append(registerButton);
			_parentDiv.append(loginButton);
			_parentDiv.append("<br><br>");
			_parentDiv.append("<div style='display:none' id='titleJoke'><img src='"+pluginPath + "img/VerificationGame/medvejoke.png'></div>");
			$("#titleJoke").dialog({autoOpen:false,minWidth: 580,minHeight:360});			
		},
		showJoke: function()
		{
			$("#titleJoke").dialog("open");
		},
		userRegistration: function()
		{
			var _this = this;	
			_currentMode = 0;
			
			var inUsername = $('<input></input>');
			inUsername.addClass('in_username');
			inUsername.attr('type', 'text');
			
			var inEmail = $('<input></input>');
			inEmail.addClass('in_email');
			inEmail.attr('type', 'text');
			
			var inPassword = $('<input></input>');
			inPassword.addClass('in_password');
			inPassword.attr('type', 'password');
			
			var inPassword2 = $('<input></input>');
			inPassword2.addClass('in_password2');
			inPassword2.attr('type', 'password');
			
			
			var registerButton = $('<button>'+_gtxt("validationControl.BtnRegister")+'</button>').click(function()
				{
					// Check if passwords match.
					if($(inPassword).val() != $(inPassword2).val()){
						alert(_gtxt("validationControl.ALRT_PASSWD_MATCH"));return;
					}
					
					var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|edu|ru|su|uk|us|ua|by|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b/ ;
					if(!$(inEmail).val().match(re)){
						alert(_gtxt("validationControl.ALRT_EMAIL"));return;
					}
					
					var requestUrl = _verificationURL + "DBWebProxy.ashx?Type=AddNewVerificationUser&param_userid="+$(inUsername).val()+"&email="+$(inEmail).val()+"&param_password="+$(inPassword).val();
				
					sendCrossDomainJSONRequest(requestUrl, function(data)
					{
						if (data.Result != 'Ok')
						{
							//onError( data.Result == 'TooMuch' ? fireModule.IDataProvider.ERROR_TOO_MUCH_DATA : fireModule.IDataProvider.SERVER_ERROR );
							alert("ERROR on registering user!");
							return;
						}
						if(data.Response[0][0] == 1){
							_verifiedUserId = $(inUsername).val();
							_this.showStartScreen(0);
						}else{
							alert(_gtxt("validationControl.ALRT_USER_EXISTS"));
						}
						
					});
						
				});

			_parentDiv.empty();
			
			_parentDiv.append("<H3>"+_gtxt("validationControl.USER_REGISTRATION")+"</H3>");
			_parentDiv.append("<br>"+_gtxt("validationControl.UserName")+":<br>");
			_parentDiv.append(inUsername);
			_parentDiv.append("<br>E-Mail:<br>");
			_parentDiv.append(inEmail);
			_parentDiv.append("<br>"+_gtxt("validationControl.Password")+":<br>");
			_parentDiv.append(inPassword);
			_parentDiv.append("<br>"+_gtxt("validationControl.REPEAT_PASSWORD")+":<br>");
			_parentDiv.append(inPassword2);
			_parentDiv.append("<br>");
			_parentDiv.append(registerButton);
			
		},		
		sendImageToSkipedList: function(imageName)
		{
			var _this = this;
			var url = _verificationURL + "DBWebProxy.ashx?Type=AddImageToSkippedList&param_userid=" + _verifiedUserId + "&image_name=" + imageName;
			
			sendCrossDomainJSONRequest(url, function(data){
				if(data.Result != 'Ok'){
					alert("Error saving skipped image data!");
					_lastImageName = null;
				}else{
					_lastImageName = imageName;
				}
				_this.nextFireSearchImage();
			});
		
		},
		sendHotSpotToSkipedList: function(id)
		{
			var _this = this;
			var url = _verificationURL + "DBWebProxy.ashx?Type=AddSpotToSkippedList&param_userid=" + _verifiedUserId + "&hotspot_id=" + id;
			
			sendCrossDomainJSONRequest(url, function(data){
				if(data.Result != 'Ok'){
					alert("Error saving skipped hotspot data!");
					_lastHotspotId = null;
				}else{
					_lastHotspotId = id;
				}
				_this.nextVerificationHotspot();
			});
		},
		processShowHints : function()
		{
			if(_currentMode != 4 && _hintCount <= 0){
				alert(_gtxt("validationControl.AlertNoHints"));
				return;
			}
			
			if(_hintPoints.length == 0){
				window.globalFlashMap.moveTo(_currentImageXY[0],_currentImageXY[1],8);
			
				updateHintCount(_hintCount - 1);
				
				for(var i = 0;i < _trueFireLocations.length;i++){
					var x = _trueFireLocations[i][0],y = _trueFireLocations[i][1];
					
					_highlightMarker = window.globalFlashMap.addObject();
					_highlightMarker.setPoint(x, y);
					
					if(_trueFireLocations[i][3] == 0)
						_highlightMarker.setStyle({marker: {image: "http://maps.kosmosnimki.ru/images/fire_weak.png", center: true}});
					else
						_highlightMarker.setStyle({marker: {image: "http://maps.kosmosnimki.ru/images/fire.png", center: true}});
					
					_hintPoints.push([_highlightMarker,x,y]);
				}
				
				if(_currentMode == 4){
					setTimeout(function(){	clearHints();},15000);
				}else{
					setTimeout(function(){	clearHints();},5000);
				}
			}
			
		},
		processSkipImage : function()
		{
			var _this = this;
			clearHints();
			clearMarkers();
			_this.sendImageToSkipedList(_currentImageName);
		},
		processMarkedFires: function()
		{
			var _this = this;
			if(_markedPoints.length == 0){
				alert(_gtxt("validationControl.ALRT_SKIP_IMAGE"));
				return;
			}
		
			clearHints();
			 
			 // Update the score.
			 var firesNotFound = _trueFireLocations.length - _nFiresFound;
			 
			 var mapX=merc_x(globalFlashMap.getX());
			 var mapY=merc_y(globalFlashMap.getY());
			 var scale = getScale(globalFlashMap.getZ());
			 
			 var pixelX = $("#flash.flashMap").width()/2;
			 var pixelY = $("#flash.flashMap").height()/2;
			 
			 if(firesNotFound == 0){
				updateCurrentScore(_currentScore + _brigadesAvailable*20 + 30,pixelX,pixelY);
			 }else{
				updateCurrentScore(_currentScore + _brigadesAvailable*5 - firesNotFound*10,pixelX,pixelY);
			 }
			 
			 
			_this.sendMarkedFires(_currentImageName,'',_hintCount,_currentScore,_lastHintScore);
		},
		sendMarkedFires: function(imageName,comment,nHints,score,lastHintScore)
		{
			var _this = this;
			
			var fireList = '';
			
			
			// Construct a string representation of the list of points that the user just marked.
			for(var i = 0;i < _markedPoints.length;i++){
				fireList += _markedPoints[i][1]+" "+_markedPoints[i][2]+";";
			}
			
			clearMarkers();
			
			var url = _verificationURL + "DBWebProxy.ashx?Type=SaveMarkedFires&param_userid=" + _verifiedUserId + "&image_date="+mapCalendar.dateBegin.value+"&fireList=" + fireList + "&Comment=" + comment + "&image_name=" + imageName + "&lastHintScore="+lastHintScore+"&nHints="+nHints+"&score="+score;
			
			sendCrossDomainJSONRequest(url, function(data){
				if(data.Result != 'Ok'){
					alert("Error saving verified data!");
					_lastImageName = null;
				}else{
					_lastImageName = imageName;
				}
				_this.nextFireSearchImage();
			});
		},
		processHotspotVerification: function(id,terrain,size,comment,x,y)
		{
			var _this = this;
			
			var points = 10;
			
			// Training mode - don't allow mistakes
			if(_lastHotspotMode == 0){
				var error = 0;
				
				// Check against the true values whether this is corrent
				if(terrain != _trueTerrain){
					$("#instructions-msg").text(_gtxt("validationControl.TUT_WRONG_TERRAIN"));
					error =1;
				}else if(terrain == 'forest')
				{
					if(parseInt(size) < parseInt(_trueSize)-1)
					{
						$("#instructions-msg").text(_gtxt("validationControl.TUT_LARGER"));
						error = 1;
					}else if(parseInt(size) > parseInt(_trueSize)+1)
					{
						$("#instructions-msg").text(_gtxt("validationControl.TUT_EXAGERATING"));
						error = 1;
					}
				}
				if(error){
					$("#instructions").dialog('open');
					setTimeout(function(){$("#instructions").dialog('close');},3000);
					return;
				}
				points = 10;
				
			}else if(_lastHotspotMode == 1){
				if(_trueTerrain == 'forest'){
					if(terrain != _trueTerrain){
						if(terrain == 'grass')
							$("#inspection-msg").text(_gtxt("validationControl.INSP_NOT_FIRE_BUT_FARM"));
						else if(terrain == 'factory')
							$("#inspection-msg").text(_gtxt("validationControl.INSP_NOT_FIRE_BUT_INDUSTRY"));
						else if(terrain == 'oil')
							$("#inspection-msg").text(_gtxt("validationControl.INSP_NOT_FIRE_BUT_OIL"));
						else
							$("#inspection-msg").text(_gtxt("validationControl.INSP_NOT_FIRE_BUT_NOTHING"));
						points = -10;
					}else{
						if(parseInt(size) < parseInt(_trueSize)-2)
						{
							$("#inspection-msg").text(_gtxt("validationControl.INSP_TOO_SMALL"));
							points = -5;
						}else if(parseInt(size) > parseInt(_trueSize)+2)
						{
							$("#inspection-msg").text(_gtxt("validationControl.INSP_TOO_LARGE"));
							points = -5;
						}
					}
				}else{
					if(_trueTerrain == 'grass' && terrain != _trueTerrain){
						$("#inspection-msg").text(_gtxt("validationControl.INSP_NOT_FARM"));
						points = -5;
					}
				}
				
				if(points<0){
					$("#inspection").dialog('open');
					
					setTimeout(function(){$("#inspection").dialog('close');},3000);
				}
			}
			updateCurrentScore(_currentScore + points,x,y);
			_this.sendHotSpotVerification(_currentScore,_lastHintScore,_hintCount,id,terrain,size,comment);
		
		},
		sendHotSpotVerification: function(score,lastHintScore,hints,id, terrain, size, comment)
		{
			var _this = this;
			
			var url = _verificationURL + "DBWebProxy.ashx?Type=HotSpotVerification&param_userid=" + _verifiedUserId + "&score="+score+"&lastHintScore="+lastHintScore+"&hints="+hints+"&Terrain=" + terrain + "&Size=" + size + "&Comment=" + comment + "&HotSpotID=" + id;
			
			sendCrossDomainJSONRequest(url, function(data){
				if(data.Result != 'Ok'){
					alert("Error saving verified data!");
					_lastHotspotId = null;
				}else{
					_lastHotspotId = id;
				}
				_this.nextVerificationHotspot();
			});
		},
		undoPreviousDecision: function()
		{
			var _this = this;
			
			// If in training mode, show info alert only.
			if(_lastHotspotMode == 0){
				alert(_gtxt("validationControl.TrainingAlertUndo"));
				return;
			}
			
			var url = _verificationURL + "DBWebProxy.ashx?Type=DeleteVerifiedHotspotAndGetUserInfo&param_userid=" + _verifiedUserId + "&hotspot_id=" + _lastHotspotId;
			
			sendCrossDomainJSONRequest(url, function(data){
				if(data.Result != 'Ok'){
					alert("Error deleting verified hotspot!");
				}else{
					// Load the last hotspot id.
					
					// If last hotspot was a user defined one,use different mode.
					var spotMode = 3;
					if(_lastHotspotId > 2000000){
						spotMode = 4;
					}
					_this.nextFire(spotMode,data.Response[0][0],data.Response[0][1],data.Response[0][2],data.Response[0][3],data.Response[0][4],data.Response[0][5],_lastHotspotId,'','','');
					_lastHotspotId = null;
				}
			});
		
		},
		showAdminToolsScreen: function()
		{
			// Request full list of spot/landsat images.
			var _this = this;
			var url = _hotspotRequestURL + "DBWebProxy.ashx?Type=GetAllIntersectedSpotLandsat&minCount=10";
			sendCrossDomainJSONRequest(url, function(data){
				if(data.Result != 'Ok'){
					alert("Error retrieving spot landsat images for admin tab!");
				}else{
					// Load the last hotspot id.
					_this.renderAdminTab(data.Response);
				}
			});
		},
		showAchievementsScreen: function()
		{
			var _this = this;
			var url = _verificationURL + "DBWebProxy.ashx?Type=GetAchievements&param_userid=" + _verifiedUserId;
			sendCrossDomainJSONRequest(url, function(data){
				if(data.Result != 'Ok'){
					alert("Error retrieving achievements!");
				}else{
					// Load the last hotspot id.
					_this.renderAchievementsTab(data.Response);
				}
			});
		
		},
		nextFireSearchImage: function(forcedImgName)
		{
			var _this = this;
			
			// Request updated user info, and appropriate hotspot for display
			var requestUrl = _verificationURL + "DBWebProxy.ashx?Type=GetUserInfoAndNextImageInfo&lang="+window.language+"&param_userid="+_verifiedUserId;
			
			sendCrossDomainJSONRequest(requestUrl, function(data)
			{
				if (data.Result != 'Ok')
				{
					//onError( data.Result == 'TooMuch' ? fireModule.IDataProvider.ERROR_TOO_MUCH_DATA : fireModule.IDataProvider.SERVER_ERROR );
					alert("ERROR on getting next hotspot!");
					return;
				}
				
				var pointVerificationMode = data.Response[0][0];
				var nPointsVerified = data.Response[0][1];
				var nImagesMarked = data.Response[0][2];
				var currentAccuracy =  data.Response[0][3];
				var currentScore = data.Response[0][4];
				var lastHintScore = data.Response[0][5];
				var nHints = data.Response[0][6];
				var imageName = data.Response[0][7];
				var trainingComments = data.Response[0][8];
				
				if(forcedImgName){
					imageName = forcedImgName;
					pointVerificationMode = 3;
				}
				
				_this.nextImage(pointVerificationMode,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,imageName,trainingComments);
				
			});
		
		},
		nextVerificationHotspot: function()
		{
			var _this = this;
			
			// Request updated user info, and appropriate hotspot for display
			var requestUrl = _verificationURL + "DBWebProxy.ashx?Type=GetUserInfoAndNextHotspotInfo&lang="+window.language+"&param_userid="+_verifiedUserId;
				
			sendCrossDomainJSONRequest(requestUrl, function(data)
			{
				if (data.Result != 'Ok')
				{
					//onError( data.Result == 'TooMuch' ? fireModule.IDataProvider.ERROR_TOO_MUCH_DATA : fireModule.IDataProvider.SERVER_ERROR );
					alert("ERROR on getting next hotspot!");
					return;
				}
				
				var pointVerificationMode = data.Response[0][0];
				var nPointsVerified = data.Response[0][1];
				var nImagesMarked = data.Response[0][2];
				var currentAccuracy =  data.Response[0][3];
				var currentScore = data.Response[0][4];
				var lastHintScore = data.Response[0][5];
				var nHints = data.Response[0][6];
				var hostpotId = data.Response[0][7];
				var trueHotspotTerrain = data.Response[0][8];
				var trueHotspotSize = data.Response[0][9];
				var trainingComments = data.Response[0][10];
				
				_this.nextFire(pointVerificationMode,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,hostpotId,trueHotspotTerrain,trueHotspotSize,trainingComments);
				
			});
		},
		flashMapClicked: function(p1,x,y)
		{
			var _this = this;
			if(_currentMode == 2){
				
				// Check how many brigades the player has left
				if(_brigadesAvailable <= 0){
					alert(_gtxt("validationControl.AlertNoBrigades"));
					return;
				}
				
				hideSkipButton();
				
				// Check if the point is too close to already marked spot
				for(var i = 0;i < _markedPoints.length;i++){
					var distance = parseFloat(distVincenty(x,y,_markedPoints[i][1],_markedPoints[i][2]));
					
					if(distance < 5000){
						alert("Cannot mark fires closer then 5km appart. Your fire is only : "+distance+"m");
						return;
					}
				}
				
				var isCorrect = 0;
				var nAddressed = 0;
				
				// Check whether the point is near a "true" fire point
				for(var i = 0;i < _trueFireLocations.length;i++){
					var distance = parseFloat(distVincenty(x,y,_trueFireLocations[i][0],_trueFireLocations[i][1]));
					
					if(distance < 6500){
						isCorrect = 1;
						_trueFireLocations[i][3] = 1;
					}
					
					if(_trueFireLocations[i][3] == 1){
						nAddressed++;
					}
				}
				
				// Check for combo!
				var comboCount = nAddressed - _nFiresFound;
					
				
				var mapX=merc_x(globalFlashMap.getX());
				var mapY=merc_y(globalFlashMap.getY());
				var scale = getScale(globalFlashMap.getZ());
				 
				var pixelX = $("#flash.flashMap").width()/2 - (mapX - merc_x(x))/scale;
				var pixelY = $("#flash.flashMap").height()/2 + (mapY - merc_y(y))/scale;
				
				if(comboCount > 1){
					_comboBonus += comboCount * 5;
					
					//showComboBonusMessage(comboCount,x,y);
					updateCurrentScore(_currentScore + comboCount * 5,pixelX,pixelY);
				}else if(nAddressed > 0){
					updateCurrentScore(_currentScore + 5,pixelX,pixelY);
				}
				
				_nFiresFound = nAddressed;
				
				_highlightMarker = window.globalFlashMap.addObject();
				_highlightMarker.setPoint(x, y);
				
				if(isCorrect){
					_highlightMarker.setStyle({marker: {image: pluginPath + "img/VerificationGame/fire_truck.png", center: true}});
				}else{
					_highlightMarker.setStyle({marker: {image: pluginPath + "img/VerificationGame/unknown_fire.png", center: true}});
				}
				
				_markedPoints.push([_highlightMarker,x,y]);
				
				// Reduce available marks
				_brigadesAvailable--;
				showImageMarkingResources(_trueFireLocations.length - nAddressed,_brigadesAvailable,nAddressed,_hintCount);
			}
		},
		
		showStartScreen: function(currentScore)
		{
			var _this = this;
			_currentMode = 0;

			//startHotspotSearchButton.attr('disabled','disabled').attr('style','color:grey');
			
			_parentDiv.empty();
			showTabbedMenu(currentScore);
			
			var topScoreDiv = $("<div></div>");
			showTopScore(topScoreDiv);
			
			_parentDiv.append(topScoreDiv);
			_parentDiv.append("<br>");
			/*
			var showVideoBtn = $('<button>'+_gtxt("validationControl.VIDEO")+'</button>').click(function()
			{
				$("#dialog").dialog("open");
			});
			
			_parentDiv.append(showVideoBtn);
			_parentDiv.append('<div id="dialog" style="display:none" title="'+_gtxt("validationControl.VIDEO")+'"><iframe width="560" height="315" src="http://www.youtube.com/embed/bjqchBihh2Q" frameborder="0" allowfullscreen></iframe></div>');
			*/
			$( "#dialog" ).dialog({ autoOpen:false,minWidth: 580,minHeight:360});
			
		},
		nextImage: function(pointVerificationMode,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,imageName,trainingComments)
		{
			var _this = this;
			
			if(pointVerificationMode == 2){
				// Request a random image info from the production server.
				var urlFires = _hotspotRequestURL + "DBWebProxy.ashx?Type=GetRandomSpotLandsat&only_intersected=1";
			}else{ // In training, supervised, admin, and going back to previous mode, use specific image name.
				var urlFires = _hotspotRequestURL + "DBWebProxy.ashx?Type=GetSpecificSpotLandsat&image_name="+imageName;
			}
			
			sendCrossDomainJSONRequest(urlFires, function(data){
				latestRandomImageData = data;
				
				//Once recieved response, modify fire controller to show that dot.
				if (data.Result != 'Ok' || data.Response.length == 0)
				{
					alert("ERROR getting next hotspot!");
					return;
				}
				
				//var dateInt = .valueOf();
				var dateBegin = $.datepicker.parseDate('yy.mm.dd', data.Response[0][4]);
				
				dateBegin.setHours(dateBegin.getHours()+1);
				
				mapCalendar.setDateBegin(dateBegin);
				mapCalendar.setDateEnd(dateBegin);
				
				
				var pointX = from_merc_x(data.Response[0][5]);
				var pointY = from_merc_y(data.Response[0][6]);
				
				/* Here we need to hide all images except the one returned */
				//hideAllLayersExcept(data.Response[0][0]);
				
				
				_currentImageName = data.Response[0][3];
				_currentImageXY = [pointX,pointY];
				window.globalFlashMap.moveTo(pointX,pointY,8);
				
				slController = fireControl.dataControllers["spotlandsat"];
				
				slController.provider.getData( null, null, null, 
						function( data )
						{
							slController.renderer.bindData( data,function(event){_validationControl.flashMapClicked(null,event.X,event.Y)});
							slController.renderer.setVisible(true);
						},
						function( type){}
					);
					
				
				// Populate true hotspot locations array with hotspots from automated detection
				trueHotspots = [];
				for(var i=0;i< data.Response.length;i++){
					trueHotspots.push([data.Response[i][0],data.Response[i][1],0]);
				}
				
				
				// Ask the verification service if any info is already known about where the fires are in the image
				var urlFires = _verificationURL + "DBWebProxy.ashx?Type=GetTrueHotspotLocations&param_userid="+_verifiedUserId+"&image_name="+_currentImageName;
				
				sendCrossDomainJSONRequest(urlFires, function(verifData){
					if (verifData.Result != 'Ok'){
						_this.showNormalImageScreen(pointVerificationMode,_currentImageName,pointX,pointY,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,trueHotspots,trainingComments);
					}else{
						for(var i=0;i< data.Response.length;i++){
							trueHotspots.push([data.Response[i][0],data.Response[i][1],1]);
						}
						// If we are in the admin mode, don't change the panel, but set a global true hotspots variable.
						if(pointVerificationMode == 3){
							_trueFireLocations = trueHotspots;
						} else {
							_this.showNormalImageScreen(pointVerificationMode,_currentImageName,pointX,pointY,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,trueHotspots,trainingComments);
						}
					}
				});
			});
		
		},
		nextFire: function(pointVerificationMode,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,nextHotspotId,trueHotspotTerrain,trueHotspotSize,trainingComments)
		{
			var _this = this;
			
			if(pointVerificationMode == 2){
				// Request a random hotspot from the production server.
				var urlFires = _hotspotRequestURL + "DBWebProxy.ashx?Type=GetRandomFireDot&param_userid="+_verifiedUserId;
			}else if(pointVerificationMode == 4){
				var urlFires = _verificationURL + "DBWebProxy.ashx?Type=GetMarkedFireDotInfo&hotspot_id="+nextHotspotId;
			}else{ // In training, supervised, and going back to previous mode, use specific hotspot id.
				var urlFires = _hotspotRequestURL + "DBWebProxy.ashx?Type=GetSpecificFireDot&hotspot_id="+nextHotspotId;
			}
			
			sendCrossDomainJSONRequest(urlFires, function(data){
				latestRandomHotspotData = data;
				
				//Once recieved response, modify fire controller to show that dot.
				if (data.Result != 'Ok')
				{
					alert("ERROR getting next hotspot!");
					return;
				}
				
				//var dateInt = .valueOf();
				var dateBegin = $.datepicker.parseDate('yy.mm.dd', data.Response[0][3]);
				
				dateBegin.setHours(dateBegin.getHours()+1);
				
				mapCalendar.setDateBegin(dateBegin);
				mapCalendar.setDateEnd(dateBegin);
				
				var pointX = data.Response[0][1];
				var pointY = data.Response[0][0];
				
				var selectedHotSpotId = data.Response[0][7];
				_currentImageName = data.Response[0][8];
				
				window.globalFlashMap.moveTo(pointX,pointY,12);
				
				slController = fireControl.dataControllers["spotlandsat"];
				
				slController.provider.getData( null, null, null, 
						function( data )
						{
							slController.renderer.bindData(data);
							slController.renderer.setVisible(true);
						},
						function( type){}
					);
				
				if(pointVerificationMode == 0){ //This happens in training mode
					_this.showNormalScreen(pointVerificationMode,selectedHotSpotId,pointX,pointY,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,trueHotspotTerrain,trueHotspotSize,trainingComments);
				}else if(pointVerificationMode == 1 && pointVerificationMode == 4){  //This happens for supervised mode and user marked dot verification
					_this.showNormalScreen(pointVerificationMode,selectedHotSpotId,pointX,pointY,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,trueHotspotTerrain,trueHotspotSize,'');
				}else{ // This happens for random hotspot mode and going back to previous hotspot
					// Ask the verification service if any info is already known about the dot or the user
					var urlFires = _verificationURL + "DBWebProxy.ashx?Type=GetTrueVerificationParameters&param_userid="+_verifiedUserId+"&hotspot_id="+selectedHotSpotId;
					
					sendCrossDomainJSONRequest(urlFires, function(verifData){
						if (verifData.Result != 'Ok'){
							_this.showNormalScreen(2,selectedHotSpotId,pointX,pointY,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,'','','');
						}else{
							var pointVerificationMode = verifData.Response[0][0];
							var trueHotspotTerrain = verifData.Response[0][1];
							var trueHotspotSize = verifData.Response[0][2];
							
							_this.showNormalScreen(pointVerificationMode,selectedHotSpotId,pointX,pointY,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,trueHotspotTerrain,trueHotspotSize,'');
						}
					});
				}
			});
		},
		renderAdminTab: function(spotLandsatList)
		{
			var _this = this;

			_currentMode = 4;
			
			_parentDiv.empty();
			showTabbedMenu();
			
			_parentDiv.append($("<b>"+_gtxt("validationControl.ADMIN_SelectCaption")+":<br></b>"));
			
			var dropDownList = $("<select id='highresImgSelection'></select>");
			
			for(var i = 0;i < spotLandsatList.length;i++)
			{
				dropDownList.append($("<option value='"+spotLandsatList[i][0]+"'>" + spotLandsatList[i][0] + "</option>"));
			
			}
			_parentDiv.append(dropDownList);
			
			var showImageBtn = $('<button>'+_gtxt("validationControl.ADMIN_ShowButton")+'</button>').click(function()
			{
				_validationControl.nextFireSearchImage($('#highresImgSelection').val());
			});
			
			var showHintsBtn = $('<button>'+_gtxt("validationControl.ShowHints")+'</button>').click(function()
			{
				_validationControl.processShowHints();
			});
			
			_parentDiv.append(showImageBtn);
			_parentDiv.append(showHintsBtn);
		},
		renderAchievementsTab: function(achievementList)
		{
			var _this = this;
			
			var achievementTitle = [_gtxt("validationControl.Achievment1"),
									_gtxt("validationControl.Achievment2"),
									_gtxt("validationControl.Achievment3"),
									_gtxt("validationControl.Achievment4"),
									_gtxt("validationControl.Achievment5"),
									_gtxt("validationControl.Achievment6")];
			
			_currentMode = 3;
			
			_parentDiv.empty();
			showTabbedMenu(achievementList[0][0]);
			var achievementCount = 0;
			for(var i=1;i < achievementList.length;i++){
				if(achievementList[i][0] == 1){
					_parentDiv.append($('<b>'+achievementTitle[i-1]+'</b>'));
					achievementCount++;
				}else{
					_parentDiv.append(achievementTitle[i-1]);
				}
				_parentDiv.append('<br>');
				
			}
			if(achievementCount > 1){
				var tableStr = "<table width=100%><tr><td align=center>";
				if(achievementCount > 1){
					tableStr += "<img src='"+pluginPath + "img/VerificationGame/medal_bronze.png'>";
				}
				if(achievementCount > 3){
					tableStr += "<img src='"+pluginPath + "img/VerificationGame/medal_silver.png'>";
				}
				if(achievementCount > 5){
					tableStr += "<img src='"+pluginPath + "img/VerificationGame/medal_gold.png'>";
				}
				tableStr += "</td></tr></table>"
			}
			_parentDiv.append($(tableStr));
			//(data.Response[0]);
		
		},
		showNormalImageScreen: function(verificationMode,imageName,x,y,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,trueFireLocations,trainingComments)
		{
			var _this = this;
			_currentMode = 2;
			
			// No need to save previous comment.
			var prevComment = "";//_txtComment ? $(_txtComment).val() : "";
			
			// Show training comments in training mode.
			if(verificationMode == 0){
				prevComment = trainingComments;
			}
			
			_txtComment = $('<textarea></textarea>').css({width: '100%', height: '120px', margin: "3px"});
			$(_txtComment).val(prevComment);
			
			
			// Take out unneccessary fires
			_trueFireLocations = sparseFireLocations(trueFireLocations);
			
			// Set addressed flag to false for all locations
			for(var i=0;i< _trueFireLocations.length;i++){
				_trueFireLocations[i].push(0);
			}
			
			 _brigadesAvailable = _trueFireLocations.length + Math.max(2,Math.round(trueFireLocations.length*0.3));
			_currentScore = currentScore;
			if(_currentScore == 0) {
				_currentAccuracy = 1;
			}else{
				_currentAccuracy = currentAccuracy;
			}
			_lastHintScore = lastHintScore;
			_nFiresFound = 0;
			_comboBonus = 0;
			_hintCount = nHints;
			_currentImageName = imageName;
			
			
			showSkipButton();
			
			_parentDiv.empty();
			showTabbedMenu(currentScore);
			showScore(nPointsVerified,nImagesMarked,currentAccuracy,currentScore);
			showImageMarkingResources(_trueFireLocations.length, _brigadesAvailable,0,_hintCount);
			_parentDiv.append(_txtComment);
			
		},
		showNormalScreen: function(verificationMode,hotspotId,x,y,nPointsVerified,nImagesMarked,currentAccuracy,currentScore,lastHintScore,nHints,trueTerrain,trueSize,trainingComments)
		{
			var _this = this;
			_currentMode = 1;
			
			
			_currentHotspotId = hotspotId;
			
			
			// No need to save previous comment.sendHotSpotToSkipedList(hotspotId);
			var prevComment = "";//_txtComment ? $(_txtComment).val() : "";
			
			// Show training comments in training mode.
			if(verificationMode == 0){
				prevComment = trainingComments;
			}
			
			_parentDiv.empty();
			_lastHotspotMode = verificationMode;
			_trueTerrain = trueTerrain;
			_trueSize = trueSize;
			
			if(_currentScore == 0) {
				_currentAccuracy = 1;
			}else{
				_currentAccuracy = currentAccuracy;
			}
			
			_currentScore= currentScore;
			_lastHintScore = lastHintScore;
			_hintCount = nHints;
			
			showTabbedMenu(currentScore);
			
			_txtComment = $('<textarea></textarea>').css({width: '100%', height: '120px', margin: "3px"});
			$(_txtComment).val(prevComment);
			
			if(_lastHotspotId == null)
			{
				hideUndoButton();
			}else{
				showUndoButton();
			}
			
			var skipHotSpotBtn = $('<button>'+_gtxt("validationControl.SKIP_HOTSPOT")+'</button>').click(function()
			{
				if(verificationMode == 0){
					alert(_gtxt("validationControl.TUT_ALRT_SKIP"));
				}else{
					_this.sendHotSpotToSkipedList(hotspotId);
				}
			});
			
			showScore(nPointsVerified,nImagesMarked,currentAccuracy,currentScore);
						
			var td1 = $("<td></td>").append(_txtComment).attr("colspan", 2);
			td1.append(skipHotSpotBtn);
			var tr3 = $("<tr></tr>").append(td1);
						
			_parentDiv.append($("<div></div>").append("<b>"+_gtxt("validationControl.HOTSPOT")+":</b> " + hotspotId + "<br><br>"));
			_parentDiv.append($("<table width=100%></table>").append(tr3));
			
			_parentDiv.append($("<div id='inspection' style='display:none;margin:0px;padding:0px' title='Инспекция МЧС'><table width=100% border=1><tr><td><img height=90px src='"+pluginPath+"img/VerificationGame/shoigu_alert.jpg'></td><td><div id='inspection-msg'></div></td></table></div>"));
		    $( "#inspection" ).dialog({ autoOpen: false });
			
			_parentDiv.append($("<div id='instructions' style='display:none' title='Школа Добровольцев'><table width=100% border=1><tr><td><img height=90px src='"+pluginPath+"img/VerificationGame/shoigu_training.jpg'></td><td><div id='instructions-msg'></div></td></table></div>"));
		    $( "#instructions" ).dialog({ autoOpen: false });


			if (_highlightMarker) 
				_highlightMarker.remove();
				
			_highlightMarker = window.globalFlashMap.addObject();
			_highlightMarker.setPoint(x, y);
			_highlightMarker.setStyle({marker: {image: "img/frame_tool_a.png", center: true}});
		}
	}
					
					
		
	/** Провайдер покрытия снимками Spot/Landsat
	* @memberOf cover
	* @class 
	* @param {Object} params Параметры класса: <br/>
	* <i> {String} host </i> Сервер, с которого берутся данные покрытии. Default: http://sender.kosmosnimki.ru/ <br/>
	* <i> {String} modisImagesHost </i> Путь, с которого будут загружаться тайлы. Default: http://images.kosmosnimki.ru/MODIS/
	*/
	var SpotLandsatImagesProvider = function( params )
	{
			
		var _params = $.extend({host: 'http://sender.kosmosnimki.ru/v3/',
								spotLandsatImagesHost: 'http://images.kosmosnimki.ru/'
							   }, params);
		
		this.getDescription = function() { return _gtxt("firesWidget.DialyCoverage.Description"); }
		this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
		{
			////запрашиваем только за первый день периода
			//var modisUrl = _params.host + "DBWebProxy.ashx?Type=GetModisV2&Date=" + _formatDateForServer(dateEnd);
			var spotLandsatImageName = '';
			
			if(_validationControl != null){
				spotLandsatImageName = _validationControl.getSpotLandsatName();
			}
			
			var prefix = "Landsat5/";
			if(spotLandsatImageName.substring(0,1) == "S"){
				prefix = "Spot4/"
			}
			
			var modisUrl = _params.host  + "DBWebProxy.ashx?Type=GetSpotHotSpots&Name=" + spotLandsatImageName;
			
			fireModule.IDataProvider.sendCachedCrossDomainJSONRequest(modisUrl, function(data)
			{
				if (data.Result != 'Ok')
				{
					onError( data.Result == 'TooMuch' ? fireModule.IDataProvider.ERROR_TOO_MUCH_DATA : fireModule.IDataProvider.SERVER_ERROR );
					return;
				}
				
				var resArr = [];
				for ( var d = 0; d < data.Response.length; d++ )
				{
					var curImage = data.Response[d];
					resArr.push({ geometry: from_merc_geometry(curImage[9]),
								  dirName: _params.spotLandsatImagesHost + prefix + curImage[8].split("\\").join("/"),
								  date: curImage[4]
								});
					
				}
				onSucceess( resArr );
			});
		}
	}
	
	/** Рисует на карте картинки Spot/Landsat
	* @memberOf cover
	* @class 
	*/
	var SpotLandsatImagesRenderer = function( params )
	{
		var _params = $.extend( {}, params );
		
		var _imagesObj = null;
		this.bindData = function(data,clickHandler)
		{
			if (_imagesObj) _imagesObj.remove();
			_imagesObj = globalFlashMap.addObject();
			
			if ( typeof _params.depth !== 'undefined' )
				_imagesObj.bringToDepth( _params.depth );
			
			_imagesObj.setZoomBounds(1, 17);
			_imagesObj.setVisible(true);
			
			_imagesObj.setHandler  ('onClick', function(o){try{_validationControl.flashMapClicked(null,globalFlashMap.getMouseX(),globalFlashMap.getMouseY());}catch(e){alert(e);}} );
			
			for (var i = 0; i < data.length; i++) (function(imgData)
			{
				if (!imgData) return;
				
				var img = _imagesObj.addObject(imgData.geometry);
				
				img.setTiles(function(i, j, z)
				{
					return imgData.dirName + "/" + z + "/" + i + "/" + z + "_" + i + "_" + j + ".jpg";
				});
					
			})(data[i]);
		}
		
		this.setVisible = function(flag)
		{
			if (_imagesObj) _imagesObj.setVisible(flag);
		}
	}

	fireControl.addDataProvider( "spotlandsat",
					  new SpotLandsatImagesProvider({}),
					  new SpotLandsatImagesRenderer({}),
					  {} );
	return _validationControl;
};

var publicInterface = {
	afterViewer:
		function()
		{
			
			var table = $(_queryMapLayers.workCanvas).children("table")[0],
				div = _div(),
				verificationDiv = _div(null, [['attr', 'id', 'firesVerificationDiv'],['attr','style','margin:20px']]);
			
			$(verificationDiv).css('margin','20px');
			$(table).css('display','none');
						$(div).css('display','none');

			$(table).after(verificationDiv);
			$(table).after(div);
			
			gmxCore.loadModule('DateTimePeriodControl', 'DateTimePeriodControl.js');
			gmxCore.loadModule('FireMapplet',           'plugins/FireMapplet.js'  );
			
			gmxCore.addModulesCallback(['DateTimePeriodControl', 'FireMapplet'], function()
			{
				var datetime = gmxCore.getModule('DateTimePeriodControl');
				var fire = gmxCore.getModule('FireMapplet');
								
				
				var calendar = nsGmx.widgets.getCommonCalendar();
				calendar.setShowTime(true);
				
				
//				if (!flashDiv.setFilter){};				
				
				
				var fireOptions = {
					resourceHost: 'http://maps.kosmosnimki.ru/api/',
										imagesInit: false,
										fires:      false,
										firesInit:  false,
										images:     false,
										imagesInit:false,
										burnt:      false,
										burntInit:  false,
										minHotspotZoom: 9
				}
				
				console.log(fire);
				console.log(fire.FireControl);
				var fireControl = new fire.FireControl(globalFlashMap);
				
				
				/* OPTIONS: 
						randomfires:true,  
						firesInit: true,

						spotLandsat: true,
						spotLandsatInit: true,
				*/
				
				$(div).append(calendar.canvas);
				fireControl.add(div, fireOptions, calendar);
			
				var verificationControl = new VerificationControl('firesVerificationDiv',fireControl);
				verificationControl.showLoginScreen();
			
			});
			
			
			var bindClicks = function()
			{

				var verificationClickFunction = function()
				{
					verificationControl.flashMapClicked( null, globalFlashMap.getMouseX(), globalFlashMap.getMouseY() );
				}
				
				var verificationMouseDownFunction = function() {
					verificaitonControl.flashMapMouseDown(null,globalFlashMap.getMouseX(), globalFlashMap.getMouseY() );
				}
				
				// globalFlashMap.setHandler('onClick', verificationClickFunction);
				// globalFlashMap.setHandler('onMouseDown', verificationMouseDownFunction);

				for (var i = 0; i < globalFlashMap.layers.length; i++)
				{
					globalFlashMap.layers[i].setHandler('onClick', verificationClickFunction);
					//globalFlashMap.layers[i].setHandler('onMouseDown', verificationMouseDownFunction);
				}
			}
			//bindClicks();
			//$(_queryExternalMaps).bind('map_loaded', bindClicks);
			globalFlashMap.setMode(KOSMOSNIMKI_LOCALIZED("Снимки", "Satellite"));
			$("box").attr('checked','false');
		
		}
	}

if ( typeof gmxCore !== 'undefined' )
{
	gmxCore.addModule('VerificationGame', publicInterface, 
	{ init: function(module, path)
		{
			var doLoadCss = function()
			{
				path = path || window.gmxJSHost || "";
				$.getCSS(path + "game_menu_tabs.css");
			}
			
			if ('getCSS' in $)
				doLoadCss();
			else
				$.getScript(path + "../jquery/jquery.getCSS.js", doLoadCss);
			pluginPath = path;
		}
	});
}

})(jQuery);