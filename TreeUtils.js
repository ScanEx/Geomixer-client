var nsGmx = nsGmx || {};

/**
    @namespace Утилиты работы с деревьями слоёв, не привязанные к конкретному дереву
*/
nsGmx.TreeUtils = 
{
    /**
        @function
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

gmxCore.addModule('TreeUtils', nsGmx.TreeUtils);