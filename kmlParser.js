var KML = {
	KML: {}
}

var queryKML = function()
{
	this.parentCanvas = null;
}

queryKML.prototype = new leftMenu();

queryKML.prototype.load = function()
{
	var inputField = _input(null, [['dir','className','inputStyle'],['css','width','200px']]),
		inputError = function()
		{
			$(inputField).addClass('error');
			
			setTimeout(function()
			{
				if (inputField)
					$(inputField).removeClass('error');
			}, 1000)
		},
		_this = this;;
	
	this.parentCanvas = _div(null, [['dir','className','drawingObjectsCanvas']]);
	
	var goButton = makeButton(_gtxt("Загрузить")),
		_this = this;
	
	goButton.onclick = function()
	{
		if (inputField.value != '')
		{
			if (!userInfo().Login)
			{
				login();
				
				return;
			}
			
			_kmlParser.get(strip(inputField.value), function(resp)
			{
				var info = _kmlParser.draw(resp.vals, globalFlashMap.addObject());
				
				_this.addFile(info, resp.name)
			})
				
			inputField.value = '';
		}
		else
			inputError();
	}
	
	inputField.onkeydown = function(e)
	{
		var evt = e || window.event;
	  	if (getkey(evt) == 13) 
	  	{	
			if (inputField.value != '')
			{
				if (!userInfo().Login)
				{
					login();
					
					return;
				}
				
				_kmlParser.get(strip(inputField.value), function(resp)
				{
					var info = _kmlParser.draw(resp.vals, globalFlashMap.addObject());
				
					_this.addFile(info, resp.name)
				})
					
				inputField.value = '';
			}
			else
				inputError();
	  		
	  		return false;
	  	}
	}
	
	var canvas = _div([_div([_span([_t(_gtxt("URL файла"))])], [['css','marginBottom','3px']]),_table([_tbody([_tr([_td([inputField],[['css','width','220px']]),_td([goButton])])])], [['css','marginBottom','5px']])],[['css','margin','3px 0px 0px 10px']])

	var formFile = ($.browser.msie) ? document.createElement('<form enctype="multipart/form-data" method="post" action="' + getAPIHostRoot() + 'ApiSave.ashx?WrapStyle=window" id="form" target="kml_iframe">') : _form(null,[['attr','enctype','multipart/form-data'],['dir','method','post'],['dir','action', getAPIHostRoot() + 'ApiSave.ashx?WrapStyle=window'],['attr','target','kml_iframe']]);
	formFile.style.width = '200px';
	formFile.style.marginLeft = '3px';

	var attach = ($.browser.msie) ? document.createElement('<input type="file" name="rawdata" width="220px">') : _input(null,[['attr','type','file'],['dir','name','rawdata'],['css','width','220px']]);
	_(formFile, [attach]);
	
	var loadButton = makeButton(_gtxt("Загрузить"));
	loadButton.onclick = function()
	{
		if (!userInfo().Login)
		{
			login();
			
			return;
		}
		
		var iframe = createPostIframe("kml_iframe", function(response)
		{
			if (!parseResponse(response))
				return;
			
			var resp = _kmlParser.parse(response.Result);

			var info = _kmlParser.draw(resp.vals, globalFlashMap.addObject());
			
			_this.addFile(info, resp.name)
		});
		
		_(document.body, [iframe]);
		
		formFile.submit();
	}
	
	_(this.workCanvas, [canvas, _table([_tbody([_tr([_td([formFile],[['css','width','220px']]), _td([loadButton])])])],[['css','margin','5px 0px 10px 10px']]), this.parentCanvas])
}

queryKML.prototype.addFile = function(info, name)
{
	var canvas = _div(null, [['dir','className','canvas']]),
		title = makeLinkButton(name.length > 45 ? name.substr(0, 45) + '...' : name),
		remove = makeImageButton('img/closemin.png','img/close_orange.png'),
		box = _checkbox(true, 'checkbox'),
		_this = this;
	
	_title(title, name);
	
	box.onclick = function()
	{
		info.parent.setVisible(this.checked);
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
