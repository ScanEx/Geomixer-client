/**
    @namespace Разнообразные вспомогательные контролы (базовые элементы GUI)
*/
nsGmx.Controls = {

	/** Создаёт контрол выбора цвета
	*/
	createColorPicker: function(color, showFunc, hideFunc, changeFunc)
		{
			var colorPicker = _div(null, [['dir','className','colorSelector'], ['css','backgroundColor',nsGmx.Utils.convertColor(color)]]);
			
			$(colorPicker).ColorPicker({
				color: nsGmx.Utils.convertColor(color),
				onShow: showFunc,
				onHide: hideFunc,
				onChange: changeFunc
			});
			
			_title(colorPicker, _gtxt("Цвет"));
					
			return colorPicker;
		}    
}

gmxCore.addModule('Controls', nsGmx.Controls);