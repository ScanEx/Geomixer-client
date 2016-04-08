(function(){

	_translationsHash.addtext("rus", {
        "Отсутствие объекта на карте" : "Отсутствие объекта на карте",
        "Неверное название объекта" : "Неверное название объекта",
        "Объекта не должно быть на карте" : "Объекта не должно быть на карте",
        "Неправильное расположене объекта" : "Неправильное расположене объекта",
        "Другое" : "Другое",
        "Отправить" : "Отправить",
        "$$userHelp$$_1" : "Добавить объект в точку А на карте со следующим описанием:",
        "$$userHelp$$_2" : "Исправить название объекта в точке A на следующее:",
        "$$userHelp$$_3" : "Удалить объект из точки A на карте по следующей причине:",
        "$$userHelp$$_4" : "Переместить объект из точки А в точку Б по следующей причине:",
        "Причина ошибки:" : "Причина ошибки:",
        "Как исправить ошибку?" : "Как исправить ошибку?",
        "Мое имя:" : "Мое имя:",
        "Мой e-mail:" : "Мой e-mail:",
        "Сообщить об ошибке на карте" : "Сообщить об ошибке на карте",
     });
						 
	_translationsHash.addtext("eng", {
        "Отсутствие объекта на карте" : "No object on map",
        "Неверное название объекта" : "Incorrect object name",
        "Объекта не должно быть на карте" : "Object should not be on map",
        "Неправильное расположене объекта" : "Incorrect object location",
        "Другое" : "Other",
        "Отправить" : "Send",
        "$$userHelp$$_1" : "Add object to point A at the map with the following description:",
        "$$userHelp$$_2" : "Replace object name in point A with the following:",
        "$$userHelp$$_3" : "Delete object from point A because of the following reason:",
        "$$userHelp$$_4" : "Move object from point A to point B because of the following reason:",
        "Причина ошибки:" : "Cause of error:",
        "Как исправить ошибку?" : "How to correct error?",
        "Мое имя:" : "My name:",
        "Мой e-mail:" : "My e-mail:",
        "Сообщить об ошибке на карте" : "Report map changes"
     });

	var userFeedback = function()
    {
        var feedbackMarkers = [globalFlashMap.addObject({type:'POINT', coordinates: [0, 0]}), globalFlashMap.addObject({type:'POINT', coordinates: [0, 0]})];
        
        feedbackMarkers[0].setStyle({marker: {image: "img/au.png"}},{marker: {image: "img/auh.png"}});
        feedbackMarkers[1].setStyle({marker: {image: "img/bu.png"}},{marker: {image: "img/buh.png"}});
        
        feedbackMarkers[0].setVisible(false);
        feedbackMarkers[1].setVisible(false);
        
        for (var i = 0; i < 2; i++)
        {
            (function(i)
            {
                feedbackMarkers[i].setHandler('onMouseDown', function()
                {
                    var draggedPoint = feedbackMarkers[i],
                        dx = draggedPoint.getGeometry().coordinates[0] - globalFlashMap.getMouseX(),
                        dy = draggedPoint.getGeometry().coordinates[1] - globalFlashMap.getMouseY();

                    globalFlashMap.freeze();
                    globalFlashMap.setHandler('onMouseMove', function()
                    {
                        draggedPoint.setPoint(globalFlashMap.getMouseX() + dx, globalFlashMap.getMouseY() + dy);
                    });
                });
                feedbackMarkers[i].setHandler('onMouseUp', function()
                {
                    globalFlashMap.unfreeze();
                    globalFlashMap.setHandler('onMouseMove', null);
                });
            })(i)
        }
        
        var reasonSelect = nsGmx.Utils._select([_option([_t(_gtxt("Отсутствие объекта на карте"))],[['attr','value','1']]),
                                    _option([_t(_gtxt("Неверное название объекта"))],[['attr','value','2']]),
                                    _option([_t(_gtxt("Объекта не должно быть на карте"))],[['attr','value','3']]),
                                    _option([_t(_gtxt("Неправильное расположене объекта"))],[['attr','value','4']]),
                                    _option([_t(_gtxt("Другое"))],[['attr','value','5']])], [['dir','className','selectStyle'],['css','width','250px'],['css','fontSize','13px']]),
            spanAction = _span(),
            descrField = _textarea(null, [['dir','className','inputStyle'],['css','width','250px'],['css','height','70px'],['css','fontSize','13px']]),
            nameField = _input(null, [['dir','className','inputStyle'],['css','width','250px'],['css','fontSize','13px']]),
            emailField = _input(null, [['dir','className','inputStyle'],['css','width','250px'],['css','fontSize','13px']]),
            submitButton = makeButton(_gtxt("Отправить"));
        
        reasonSelect.onchange = function()
        {
            var mapBounds = globalFlashMap.getVisibleExtent();
            feedbackMarkers[0].setGeometry({type:'POINT', coordinates: [globalFlashMap.getX(),globalFlashMap.getY()]})
            feedbackMarkers[1].setGeometry({type:'POINT', coordinates: [mapBounds.minX + 0.6 * (mapBounds.maxX - mapBounds.minX), mapBounds.minY + 0.4 * (mapBounds.maxY - mapBounds.minY)]})
            
            $(spanAction).empty();
                
            switch (this.selectedIndex)
            {
                case 0: 
                    feedbackMarkers[0].setVisible(true);
                    feedbackMarkers[1].setVisible(false);
                    
                    _(spanAction, [_t(_gtxt("$$userHelp$$_1"))])
                    
                    break;
                case 1: 
                    feedbackMarkers[0].setVisible(true);
                    feedbackMarkers[1].setVisible(false);
                    
                    _(spanAction, [_t(_gtxt("$$userHelp$$_2"))])
                    
                    break;
                case 2: 
                    feedbackMarkers[0].setVisible(true);
                    feedbackMarkers[1].setVisible(false);
                    
                    _(spanAction, [_t(_gtxt("$$userHelp$$_3"))])
                    
                    break;
                case 3: 
                    feedbackMarkers[0].setVisible(true);
                    feedbackMarkers[1].setVisible(true);
                    
                    _(spanAction, [_t(_gtxt("$$userHelp$$_4"))])
                    
                    break;
                case 4: 
                    feedbackMarkers[0].setVisible(true);
                    feedbackMarkers[1].setVisible(false);
                    
                    break;
            }
        }
        
        descrField.onkeyup = function(e)
        {
            if (this.value != '')
                submitButton.disabled = false;
            else
                submitButton.disabled = true;
        }

        submitButton.disabled = true;
        
        submitButton.onclick = function()
        {
        }
        
        var canvas = _div([_span([_t(_gtxt("Причина ошибки:"))], [['css','color','#000000'],['css','fontSize','13px']]), _br(), reasonSelect, _br(),
                           _span([_t(_gtxt("Как исправить ошибку?"))], [['css','color','#000000'],['css','fontSize','13px']]), 
                           _div([spanAction],[['css','height','35px'],['css','padding','0px 4px']]),
                           descrField, _br(),
                           _span([_t(_gtxt("Мое имя:"))], [['css','color','#000000'],['css','fontSize','13px']]), _br(), nameField, _br(),
                           _span([_t(_gtxt("Мой e-mail:"))], [['css','color','#000000'],['css','fontSize','13px']]), _br(), emailField,
                           _div([submitButton],[['css','textAlign','center'],['css','marginTop','5px']])]),
            closeFunc = function()
                {
                    feedbackMarkers[0].remove();
                    feedbackMarkers[1].remove();
                };
        
        showDialog(_gtxt("Сообщить об ошибке на карте"), canvas, 284, 310, 300, 250, null, closeFunc);
        
        canvas.parentNode.style.width = canvas.offsetWidth + 'px';

        reasonSelect.onchange();
    }

	gmxCore.addModule('UserFeedbackPlugin', {
		afterViewer: function(params)
		{
            _menuUp.addChildItem({id:'request', title:_gtxt('Сообщить об ошибке на карте'),func: userFeedback}, "servicesMenu");
            
            // TODO: нужна правильная иконка 
            //_iconPanel.add('feedback', "Сообщить об ошибке", "img/toolbar/upload.png", false, userFeedback);
		}
	});

})();