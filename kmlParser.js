var KML = {
	KML: {}
}

var queryKML = function()
{
	this.parentCanvas = null;
    this._loadedKML = [];
    this._uniqueID = 0;
}

queryKML.prototype = new leftMenu();

queryKML.prototype.newID = function()
{
    var newID = "id" + this._uniqueID;
    this._uniqueID++;
    return newID;
}

queryKML.prototype.load = function()
{
	var inputField = _input(null, [['dir','className','inputStyle'],['css','width','200px']]),
		_this = this;
	
	this.parentCanvas = _div(null, [['dir','className','drawingObjectsCanvas']]);
	
	var goButton = makeButton(_gtxt("Загрузить")),
		_this = this;
	
	goButton.onclick = function()
	{
		if (inputField.value != '')
		{
			if (!nsGmx.AuthManager.isLogin())
			{
				nsGmx.widgets.authWidget.showLoginDialog();
				
				return;
			}
            
			var kmlURL = strip(inputField.value);
			gmxAPI._kmlParser.get(kmlURL, function(resp)
			{
				var info = gmxAPI._kmlParser.draw(resp.vals, globalFlashMap.addObject());
				
                var kmlInfo = {
                    id: _this.newID(), 
                    url: kmlURL, 
                    name: resp.name,
                    isVisible: true
                };
                _this._loadedKML.push(kmlInfo);
                
				_this.addFile(info, resp.name, kmlInfo.id);
			})
				
			inputField.value = '';
		}
		else
			inputError(inputField);
	}
	
	inputField.onkeydown = function(e)
	{
		var evt = e || window.event;
	  	if (getkey(evt) == 13)
	  	{	
			if (inputField.value != '')
			{
				if (!nsGmx.AuthManager.isLogin())
				{
					nsGmx.widgets.authWidget.showLoginDialog();
					
					return;
				}
				
                var kmlURL = strip(inputField.value);
				gmxAPI._kmlParser.get(kmlURL, function(resp)
				{
					var info = gmxAPI._kmlParser.draw(resp.vals, globalFlashMap.addObject());
				
                    var kmlInfo = {
                        id: _this.newID(), 
                        url: kmlURL, 
                        name: resp.name,
                        isVisible: true
                    };
                    _this._loadedKML.push(kmlInfo);
					_this.addFile(info, resp.name, kmlInfo.id);
				})
					
				inputField.value = '';
			}
			else
				inputError(inputField);
	  		
	  		return false;
	  	}
	}
	
	var canvas = _div([_div([_span([_t(_gtxt("URL файла"))])], [['css','marginBottom','3px']]),_table([_tbody([_tr([_td([inputField],[['css','width','220px']]),_td([goButton])])])], [['css','marginBottom','5px']])],[['css','margin','3px 0px 0px 10px']])

	var formFile = ($.browser.msie) ? document.createElement('<form enctype="multipart/form-data" method="post" action="' + serverBase + 'ApiSave.ashx?WrapStyle=window" id="form" target="kml_iframe">') : _form(null,[['attr','enctype','multipart/form-data'],['dir','method','post'],['dir','action', serverBase + 'ApiSave.ashx?WrapStyle=window'],['attr','target','kml_iframe']]);
	formFile.style.width = '200px';
	formFile.style.marginLeft = '3px';

	var attach = ($.browser.msie) ? document.createElement('<input type="file" name="rawdata" width="220px">') : _input(null,[['attr','type','file'],['dir','name','rawdata'],['css','width','220px']]);
	_(formFile, [attach]);
	
	var loadButton = makeButton(_gtxt("Загрузить"));
	loadButton.onclick = function()
	{
		if (!nsGmx.AuthManager.isLogin())
		{
			nsGmx.widgets.authWidget.showLoginDialog();
			return;
		}
		
		var iframe = createPostIframe("kml_iframe", function(response)
		{
			if (!parseResponse(response))
				return;
			
			var resp = gmxAPI._kmlParser.parse(response.Result);

			var info = gmxAPI._kmlParser.draw(resp.vals, globalFlashMap.addObject());
			
			_this.addFile(info, resp.name)
		});
		
		_(document.body, [iframe]);
		
		formFile.submit();
	}
	
	_(this.workCanvas, [canvas, _table([_tbody([_tr([_td([formFile],[['css','width','220px']]), _td([loadButton])])])],[['css','margin','5px 0px 10px 10px']]), this.parentCanvas])
}

queryKML.prototype.addFile = function(info, name, isVisible, kmlID)
{
	var canvas = _div(null, [['dir','className','canvas']]),
		title = makeLinkButton(name.length > 45 ? name.substr(0, 45) + '...' : name),
		remove = makeImageButton('img/closemin.png','img/close_orange.png'),
		box = _checkbox(isVisible, 'checkbox'),
		_this = this;
	
	_title(title, name);
    info.parent.setVisible(isVisible);
	
	box.onclick = function()
	{
		info.parent.setVisible(this.checked);
        
        for (var k = 0; k < _this._loadedKML.length; k++)
            if (_this._loadedKML[k].id == kmlID)
            {
                _this._loadedKML[k].isVisible = this.checked;
                break;
            }
	}
	
	title.onclick = function()
	{
		info.parent.setVisible(true);
		
		globalFlashMap.zoomToExtent(info.bounds.minX, info.bounds.minY, info.bounds.maxX, info.bounds.maxY);
		
		box.checked = true;
	}
	
	title.style.marginLeft = '5px';
	
	remove.onclick = function()
	{
		info.parent.remove();
        
        if (typeof kmlID !== 'undefined')
        {
            for (var k = 0; k < _this._loadedKML.length; k++)
                if (_this._loadedKML[k].id == kmlID)
                {
                    _this._loadedKML.splice(k, 1);
                    break;
                }
        }
		
		canvas.removeNode(true);
	}
	
	remove.className = 'remove';
	
	_(canvas, [_div([box, title], [['dir','className','item']]), remove])
	
	_(this.parentCanvas, [canvas]);
}

var _queryKML = new queryKML();

KML.KML.load = function()
{
	var alreadyLoaded = _queryKML.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryKML.load()
}

KML.KML.unload = function()
{
}

_userObjects.addDataCollector('kml', {
    collect: function()
    {
        if (_queryKML.parentCanvas == null || _queryKML._loadedKML.length == 0)
            return null;
            
        var res = [];
        for (var k = 0; k < _queryKML._loadedKML.length; k++)
            res.push({url: _queryKML._loadedKML[k].url, isVisible: _queryKML._loadedKML[k].isVisible});
            
        return res;
    },
    
    load: function(data)
    {
        if (!data)
            return;
        
        KML.KML.load();
        
        _queryKML._loadedKML = [];
        var loadedCount = 0;
        var allInfo = [];
        
        var showKML = function()
        {
            for (var k = 0; k < _queryKML._loadedKML.length; k++)
                _queryKML.addFile(allInfo[k], _queryKML._loadedKML[k].name, _queryKML._loadedKML[k].isVisible, _queryKML._loadedKML[k].id);
        }
        
        for (var k = 0; k < data.length; k++)
        (function(curKMLData, index)
        {
            gmxAPI._kmlParser.get(curKMLData.url, function(resp)
			{
				var info = gmxAPI._kmlParser.draw(resp.vals, globalFlashMap.addObject());
				
                _queryKML._loadedKML[index] = {id: _queryKML.newID(), url: curKMLData.url, name: resp.name, isVisible: curKMLData.isVisible};
                allInfo[index] = info;
                
                loadedCount++;
                
                //когда всё загрузили, можно показать пользователям
                if (loadedCount == data.length)
                    showKML();
			})
        })(data[k], k)
    }
});