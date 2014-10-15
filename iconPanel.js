var iconPanel = function()
{
	var _this = this;
	this.parent = null;
    var _data = [];
	
	var _createIcon = function(url, urlHover)
	{
		var div = _div(null, [['dir','className', 'toolbarIcon']]);
		
		div.style.backgroundImage = "url(" + url + ")";
		
		div.onmouseover = function()
		{
			div.style.backgroundImage = "url(" + urlHover + ")";
		}

		div.onmouseout = function()
		{
			div.style.backgroundImage = "url(" + url + ")";
		}
		
		return div;
	}

	this.create = function(parentCanvas)
	{
		this.parent = _tr();
		
		var div = _div([_table([_tbody([this.parent])],[['dir','className','iconsParent']])],[['css','padding','0px 10px']]);
		
        parentCanvas.style.height = '34px';
		
		_(parentCanvas, [div]);
	}
	
	this.add = function(iconId, name, url, urlHover, callback, visFunc, hiddenFlag)
	{
		var div = _createIcon(url, urlHover),
			elem = _td([div],[['css','width','38px'],['attr','vAlign','top'], ['attr', 'id', iconId]]);
        _data.push({name: name, callback: callback, visFunc: visFunc, elem: elem, delimiter: false});
		
		elem.onclick = function()
		{
			callback.apply(elem, arguments);
		}
		
		if ((visFunc && !visFunc()) || hiddenFlag)
			elem.style.display = 'none';
		
		elem.style.cursor = 'pointer';
		
		_title(elem, name);
		
		_(this.parent, [elem]);
	}
    
    this.updateVisibility = function()
    {
        var isAlreadyIcons = false;
        for (var i=0; i < _data.length; i++)
        {
            if (_data[i].delimiter)
            {
                _data[i].elem.style.display = isAlreadyIcons ? '' : 'none';
            }
            else
            {
                if (!_data[i].visFunc || _data[i].visFunc())
                {
                    _data[i].elem.style.display = '';
                    isAlreadyIcons = true;
                }
                else
                {
                    _data[i].elem.style.display = 'none';
                }
            }
        }
    }
	
	//меняет callback, возвращает старый 
	this.changeCallcack = function(iconId, newCallback)
	{
		var elem = $('#'+iconId, this.parent)[0];
		var prevCallback = elem.onclick;
		elem.onclick = newCallback;
		return prevCallback;
	}
	
	this.addDelimiter = function(delimiterId, floatRight, hiddenFlag)
	{
		var img = _img(null, [['attr','src','img/toolbar/toolbarDelimeter.png']]),
			elem = _td([img], [['css','width','10px'], ['attr', 'id', delimiterId]]);
            
        _data.push({elem: elem, delimiter: true});
		
		img.style.left = '0px';
		img.style.top = '0px';
		
		img.style.width = '10px';
		img.style.height = '33px';
		
		if ((typeof floatRight != 'undefined') && (floatRight == true))
			elem.className = 'iconRight';
		
		if (hiddenFlag)
			elem.style.display = 'none';
		
		_(this.parent, [elem])
	}
	
	this.setVisible = function(iconId, isVisible)
	{
		var displayValue = isVisible ? '' : 'none';
		$('#'+iconId, this.parent).css({display: displayValue});
	}

	//TODO: вынести из класса
	this.addUserActions = function()
	{
		
		if (!this.parent)
			return;
			
		var ids = ['saveMap', 'createVectorLayer', 'createRasterLayer', 'userDelimiter'];
		
		for (var i = 0; i < ids.length; i++)
			this.setVisible(ids[i], true);
	}

	//TODO: вынести из класса
	this.removeUserActions = function()
	{
		if (!this.parent)
			return;
			
		var ids = ['saveMap', 'createVectorLayer', 'createRasterLayer', 'userDelimiter'];
		
		for (var i = 0; i < ids.length; i++)
			this.setVisible(ids[i], false);
	}
}

var _iconPanel = new iconPanel();
var _leftIconPanel = new iconPanel();