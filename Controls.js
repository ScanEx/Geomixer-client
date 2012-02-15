/**
    @namespace Разнообразные вспомогательные контролы (базовые элементы GUI)
*/
nsGmx.Controls = {

	/** Создаёт контрол выбора цвета */
	createColorPicker: function(color, showFunc, hideFunc, changeFunc){
		var colorPicker = _div(null, [['dir','className','colorSelector'], ['css','backgroundColor',nsGmx.Utils.convertColor(color)]]);
		
		$(colorPicker).ColorPicker({
			color: nsGmx.Utils.convertColor(color),
			onShow: showFunc,
			onHide: hideFunc,
			onChange: changeFunc
		});
		
		_title(colorPicker, _gtxt("Цвет"));
				
		return colorPicker;
	},
	
	/** */
	createGeometryIcon: function(parentStyle, type){
		var icon = _div(null, [['css','display',($.browser.msie) ? 'inline' : 'inline-block'],['dir','className','colorIcon'],['attr','styleType','color'],['css','backgroundColor','#FFFFFF']]);
		
		if (type.indexOf('linestring') < 0)
		{
            if (parentStyle.fill && parentStyle.fill.pattern)
            {
                var opaqueStyle = $.extend(true, {}, parentStyle, {fill: {opacity: 100}});
                icon = _img(null, [['attr','src', 'data:image/png;base64,' + gmxAPI.getPatternIcon(opaqueStyle, 13)],['dir','className','icon'],['attr','styleType','icon']]);
            }
            else
            {
                var fill = _div(null, [['dir','className','fillIcon'],['css','backgroundColor',(parentStyle.fill && typeof parentStyle.fill.color != 'undefined') ? nsGmx.Utils.convertColor(parentStyle.fill.color) : "#FFFFFF"]]),
                    border = _div(null, [['dir','className','borderIcon'],['attr','styleType','color'],['css','borderColor',(parentStyle.outline && typeof parentStyle.outline.color != 'undefined') ? nsGmx.Utils.convertColor(parentStyle.outline.color) : "#0000FF"]]),
                    fillOpacity = (parentStyle.fill && typeof parentStyle.fill.opacity != 'undefined') ? parentStyle.fill.opacity : 100,
                    borderOpacity = (parentStyle.outline && typeof parentStyle.outline.opacity != 'undefined') ? parentStyle.outline.opacity : 100;
                
                if ($.browser.msie)
                {
                    fill.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=" + fillOpacity + ")";
                    border.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=" + borderOpacity + ")";
                    
                    border.style.width = '9px';
                    border.style.height = '13px';
                }
                else
                {
                    fill.style.opacity = fillOpacity / 100;
                    border.style.opacity = borderOpacity / 100;
                }
                
                if (type.indexOf('point') > -1)
                {
                    if ($.browser.msie)
                    {
                        border.style.height = '7px';
                        fill.style.height = '5px';
                        border.style.width = '7px';
                        fill.style.width = '5px';
                    }
                    else
                    {
                        border.style.height = '5px';
                        fill.style.height = '5px';
                        border.style.width = '5px';
                        fill.style.width = '5px';
                    }
                    
                    border.style.top = '3px';
                    fill.style.top = '4px';
                    border.style.left = '1px';
                    fill.style.left = '2px';
                }
                
                _(icon, [border, fill]);
            }
		}
		else
		{
			var border = _div(null, [['dir','className','borderIcon'],['attr','styleType','color'],['css','borderColor',(parentStyle.outline && typeof parentStyle.outline.color != 'undefined') ? nsGmx.Utils.convertColor(parentStyle.outline.color) : "#0000FF"]]),
				borderOpacity = (parentStyle.outline && typeof parentStyle.outline.opacity != 'undefined') ? parentStyle.outline.opacity : 100;

			if ($.browser.msie)
			{
				border.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=" + borderOpacity + ")";
				
				border.style.width = '5px';
				border.style.height = '13px';
			}
			else
			{
				border.style.opacity = borderOpacity / 100;
				
				border.style.width = '4px';
				border.style.height = '13px';
			}
			
			border.style.borderTop = 'none';
			border.style.borderBottom = 'none';
			border.style.borderLeft = 'none';
			
			_(icon, [border]);
		}
		
		icon.oncontextmenu = function(e)
		{
			return false;
		}
		
		return icon;
	},
	
	/** */
	createSlider: function(opacity, changeFunc)	{
		var divSlider = _div(null, [['css','width','86px'],['css','height','8px'],['css','border','1px solid #cdcdcd']]);
		
		$(divSlider).slider(
			{
				min:0,
				max:100,
				step:1,
				value: opacity,
				slide: function(event, ui)
				{
					changeFunc(event, ui);
					
					_title(divSlider.firstChild, ui.value)
				}
			});
		
		divSlider.firstChild.style.zIndex = 1;
		
		if ($.browser.msie)
		{
			divSlider.firstChild.style.fontSize = '5px';
			divSlider.firstChild.style.width = '12px';
			divSlider.firstChild.style.height = '14px';
			divSlider.firstChild.style.marginTop = '-2px';
		}
		
		divSlider.style.width = '100px';
		divSlider.style.border = 'none';
		divSlider.style.backgroundImage = 'url(' + gmxAPI.getAPIFolderRoot() + 'img/slider.png)';
		
		divSlider.firstChild.style.border = 'none';
		divSlider.firstChild.style.width = '12px';
		divSlider.firstChild.style.height = '14px';
		divSlider.firstChild.style.marginLeft = '-6px';
		
		if ($.browser.msie)
			divSlider.firstChild.style.top = '-1px';
		else
			divSlider.firstChild.style.top = '-3px';

		divSlider.firstChild.style.background = 'transparent url(' + gmxAPI.getAPIFolderRoot() + 'img/sliderIcon.png) no-repeat';
		
		divSlider.firstChild.onmouseover = function()
		{
			divSlider.firstChild.style.backgroundImage = 'url(' + gmxAPI.getAPIFolderRoot() + 'img/sliderIcon_a.png)';
		}
		divSlider.firstChild.onmouseout = function()
		{
			divSlider.firstChild.style.backgroundImage = 'url(' + gmxAPI.getAPIFolderRoot() + 'img/sliderIcon.png)';
		}
		
		_title(divSlider.firstChild, opacity)
		_title(divSlider, _gtxt("Прозрачность"));
		
		return divSlider;
	},

	/** */
	createInput: function(value, changeFunc){
		var input = _input(null, [['dir','className','inputStyle'],['css','width','30px'],['attr','value',value]]);
		input.onkeyup = changeFunc;
		return input;
	},
	
	/** Создаёт элемент ввода типа данных, зависящих от параметров
	@param fieldInfo Информация о поле
	@param fieldValue Значение поля*/
	createInputRow: function(fieldInfo, fieldValue){
		var input = null;
		if (fieldInfo.TypeID == 1){ //Decimal
			input = _input(null, [['css', 'width', '100%']]);
			if (fieldValue.DecimalValue != null){
				input.value = fieldValue.DecimalValue;
			}
			input.onchange = function(){
				if (/^-?\d*\.?\d*$/.test(input.value)){
					fieldValue.DecimalValue = input.value;
				}
				else {
					input.value = fieldValue.DecimalValue;
				}
			}
		}
		else if(fieldInfo.TypeID == 2){ //Date
			input = _input(null, [['css', 'width', '100%']]);
			$(input).datepicker({
				onSelect: function(dateText, inst){
					fieldValue.DecimalValue = $(input).datepicker("getDate").valueOf();
				},
				showAnim: 'fadeIn',
				changeMonth: true,
				changeYear: true
			});
			if (fieldValue.DecimalValue) $(input).datepicker("setDate", new Date(fieldValue.DecimalValue));
		}
		else if(fieldInfo.TypeID == 3) { //String
			input = _textarea(null, [['css', 'width', '100%']]);
			if (fieldValue.StringValue != null){
				input.value = fieldValue.StringValue;
			}
			input.onchange = function(){
				fieldValue.StringValue = input.value;
			}
		}
		return input;
	},
	
	/** Создаёт форму ввода с настраиваемым набором полей 
	@param fieldInfoList Хэш информации о типе полей
	@param fieldValues Хэш значений */
	createInputForm: function(fieldInfoList, fieldValues){
		var container = _div(null, [['dir','className','message-input-form']]);
		var tbody = _tbody(null, [['css', 'width', '100%']]);
		_(container, [_table([tbody], [['css', 'width', '100%']])]);
		for (var iFieldIndex=0; iFieldIndex<fieldInfoList.length; iFieldIndex++){
			var oFieldInfo = fieldInfoList[iFieldIndex];
			if (!fieldValues[oFieldInfo.MessageAttributeID]) fieldValues[oFieldInfo.MessageAttributeID] = {};
			var td = _td([_t(oFieldInfo.Name), _br()]);
			_(tbody, [_tr([td])]);
			_(td, [this.createInputRow(oFieldInfo, fieldValues[oFieldInfo.MessageAttributeID])]);
		}
		
		return container;
	}
}

gmxCore.addModule('Controls', nsGmx.Controls);