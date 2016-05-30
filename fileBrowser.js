!(function(_){

/** 
* @class Веб браузер для выбора и загрузки файлов на сервер
*/
var fileBrowser = function()
{
    var _this = this;
	this.parentCanvas = null;
	
	this._homeDir = '';
    
    this._status = {
        _state: false,
        start: function() {
            this._state = true;
            var me = this;
            setTimeout(function() {
                if (me._state) {
                    $(_this.statusContainer).show();
                }
            }, 100);
        },
        stop: function() {
            $(_this.statusContainer).hide();
            this._state = false;
        }
    }
    
    this._path = (function()
    {
        var path;
        var alternativePath;
        return {
            set: function(newPath, newAlternativePath)
            {
                path = newPath + (newPath.charAt(newPath.length-1) === _this.slash ? '' : _this.slash);
                if (newAlternativePath) {
                    alternativePath = newAlternativePath + (newAlternativePath.charAt(newAlternativePath.length-1) === _this.slash ? '' : _this.slash);
                } else {
                    alternativePath = undefined;
                }
                $(this).change();
            },
            get: function()
            {
                return path;
            },
            getAlternative: function()
            {
                return alternativePath;
            },
            isRoot: function()
            {
                return path && path.indexOf(_this.slash) === path.length-1;
            },
            isInited: function()
            {
                return typeof path !== 'undefined';
            },
            isInHome: function()
            {
                return path && path.indexOf(_this._homeDir) === 0;
            },
            getRoot: function()
            {
                var index = String(path).indexOf(_this.slash);
                return newPath = String(path).substr(0, index+1);
            },
            getParentFolder: function()
            {
                var index = String(path).lastIndexOf(_this.slash, path.length-2);
                return String(path).substr(0, index+1);
            }
        }
    })();
	
	this.currentFiles = [];
	
	this.slash = "\\";
	
	this.fileCanvas = null;
	this.fileHeader = null;
	this.fileUpload = null;
	
	this.sortFuncs = 
	{
		name:[
			function(_a,_b){var a = String(_a.Name).toLowerCase(), b = String(_b.Name).toLowerCase(); if (a > b) return 1; else if (a < b) return -1; else return 0},
			function(_a,_b){var a = String(_a.Name).toLowerCase(), b = String(_b.Name).toLowerCase(); if (a < b) return 1; else if (a > b) return -1; else return 0}
		],
		ext:[
			function(_a,_b)
			{
				var a = String(_a.Name).toLowerCase(),
					b = String(_b.Name).toLowerCase(),
					index1 = a.lastIndexOf('.'),
					ext1 = a.substr(index1 + 1, a.length),
					index2 = b.lastIndexOf('.'),
					ext2 = b.substr(index2 + 1, b.length);
				
				if (ext1 > ext2) return 1; else if (ext1 < ext2) return -1; else return 0;
			},
			function(_a,_b)
			{
				var a = String(_a.Name).toLowerCase(),
					b = String(_b.Name).toLowerCase(),
					index1 = a.lastIndexOf('.'),
					ext1 = a.substr(index1 + 1, a.length),
					index2 = b.lastIndexOf('.'),
					ext2 = b.substr(index2 + 1, b.length);
				
				if (ext1 < ext2) return 1; else if (ext1 > ext2) return -1; else return 0;
			}
		],
		size:[
			function(a,b){return a.Size - b.Size},
			function(a,b){return b.Size - a.Size}
		],
		date:[
			function(a,b){return a.Date - b.Date},
			function(a,b){return b.Date - a.Date}
		]
	};
	
	this.currentSortType = 'name';
	this.currentSortIndex = 
	{
		name: 0,
		ext: 0,
		size: 0,
		date: 0
	};
		
	this.shownPathScroll = false;

	this.returnMask = ['noname'];
	
	this._discs = null;
     
    this._params = null;
	
	this.ext7z = ['7Z', 'ZIP', 'GZIP', 'BZIP2', 'TAR', 'ARJ', 'CAB', 'CHM', 'CPIO', 'DEB', 'DMG', 'HFS', 'ISO', 'LZH', 'LZMA', 'MSI', 'NSIS', 'RAR', 'RPM', 'UDF', 'WIM', 'XAR', 'Z'];
}

fileBrowser.MAX_UPLOAD_SIZE = 500*1024*1024;

/**
 Показать браузер пользователю. Если браузер уже показывается, он будет закрыт и открыт новый
 @param {String} title Заголовок окна браузера
 @param {String[]} mask Массив допустимых для выбора разрешений файлов. Если массив пустой, то выбираются директории, а не отдельные файлы
 @param {function(path)} closeFunc Функция, которая будет вызвана при выборе файла/директории (если браузер просто закрыли, не вызовется)
 @param {Object} params Параметры браузера
 @param {String} params.restrictDir Ограничивающая директория (поддерево). Нельзя посмотреть файлы вне этой директории (даже для админов)
 @param {String} params.startDir Начальная директория. Если нет, то будет открыто в том же месте, где и закрыт в прошлый раз.
*/
fileBrowser.prototype.createBrowser = function(title, mask, closeFunc, params)
{
    this._params = $.extend({restrictDir: null, startDir: null}, params);
    
    if (this._params.startDir !== null)
        this._path.set(this._params.startDir);
    
	if ($('#fileBrowserDialog').length)
	{
		$('#fileBrowserDialog').parent().dialog("destroy");
		$('#fileBrowserDialog').parent().remove();
	}
	
	var canvas = _div(null, [['attr','id','fileBrowserDialog']]);
    
	var oDialog = showDialog(title, canvas, 800, 400, false, false, this.resize);
	
	this.returnMask = mask;
	this.parentCanvas = canvas;
	this.closeFunc = closeFunc;
    this._homeDir = nsGmx.AuthManager.getUserFolder();
	
	if (this._discs === null )// && nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_FILE_STRUCTURE )
		this.loadInfo();
	else
		this.loadInfoHandler()
		
	return oDialog;
}

fileBrowser.prototype.resize = function()
{
	if (!$("#fileBrowserDialog").find(".fileCanvas").length)
		return;
    
    var container = $('#fileBrowserDialog')[0];
	
	var titleHeight = container.parentNode.parentNode.firstChild.offsetHeight;
    
	
	container.childNodes[1].lastChild.style.height = container.parentNode.parentNode.offsetHeight - titleHeight - 6 - container.lastChild.offsetHeight - container.firstChild.offsetHeight - container.childNodes[1].firstChild.offsetHeight - 20 + 'px';
}

fileBrowser.prototype.close = function(path)
{
	this.closeFunc(path);
	
	var canvas = $('#fileBrowserDialog')[0];
	
	$(canvas.parentNode).dialog("destroy");
	
	canvas.parentNode.removeNode(true);
}

fileBrowser.prototype.loadInfo = function()
{
	var _this = this;
	sendCrossDomainJSONRequest(serverBase + "FileBrowser/GetDrives.ashx?WrapStyle=func", function(response)
	{
		if (!parseResponse(response))
			return;
		
        _this._discs = response.Result;
		_this.loadInfoHandler()
	})
}

fileBrowser.prototype._showWarningDialog = function() {
    var canvas = _div([_t(_gtxt("FileBrowser.ExceedLimitMessage"))], [['dir', 'className', 'CustomErrorText']]);
    showDialog(_gtxt("Ошибка!"), canvas, 220, 100);
}

fileBrowser.prototype._uploadFilesAjax = function(formData) {
    var _this = this;
    this.progressBar.progressbar('option', 'value', 0);
    this.progressBar.show();
    
    formData.append('WrapStyle', 'None');
    
    var xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener("progress", function(e) {
        _this.progressBar.progressbar('option', 'value', e.loaded / e.total * 100);
    }, false);
    
    xhr.open('POST', serverBase + 'FileBrowser/Upload.ashx');
    xhr.withCredentials = true;
    xhr.onload = function () {
        _this.progressBar.hide();
        if (xhr.status === 200) {
            response = JSON.parse(xhr.responseText);
            
            if (!parseResponse(response))
                return;
                
            if (typeof response.Result == 'string') {
                var indexSlash = String(response.Result).lastIndexOf(_this.slash),
                    fileName = String(response.Result).substring(indexSlash + 1, response.Result.length);
                
                _this.shownPath = fileName;
            }
            
            _this.getFiles();
        }
    };
    
    xhr.send(formData);    
}

fileBrowser.prototype.loadInfoHandler = function()
{
    var _this = this;
	if (!this._path.isInited())
	{
        var mapFolder = _layersTree.treeModel.getMapProperties().LayersDir;
        if (mapFolder) {
            this._path.set(_layersTree.treeModel.getMapProperties().LayersDir, nsGmx.AuthManager.getUserFolder());
        } else {
            this._path.set(nsGmx.AuthManager.getUserFolder());
        }
	}
	
	this.currentSortFunc = this.sortFuncs['name'][0];
	
	this.fileUpload = _div(null, [['dir','className','fileUpload']]);
	this.fileHeader = _div(null, [['css','height','24px']]);
	this.fileCanvas = _div(null, [['dir','className','fileCanvas']]);
    
    $(this.parentCanvas).bind('dragover', function()
    {
        return false;
    });
    
    $(this.parentCanvas).bind('drop', function(e)
    {
        if (!window.FormData) return false;
        
        var files = e.originalEvent.dataTransfer.files;
        var formData = new FormData();
        
        var totalSize = 0;
        for (var f = 0; f < files.length; f++) {
            totalSize += files[f].size;
        }
        
        if (totalSize > fileBrowser.MAX_UPLOAD_SIZE) {
            _this._showWarningDialog();
            return false;
        }
        
        for (var f = 0; f < files.length; f++) {
            formData.append('rawdata', files[f]);
        }
        
        formData.append('ParentDir', _this._path.get());
        
        _this._uploadFilesAjax(formData);
        
        return false;
    })
	
	_(this.parentCanvas, [this.fileHeader, this.fileCanvas, this.fileUpload]);
	
	this.createHeader();
	this.createUpload();
	
	this._updateUploadVisibility();
	
	this.getFiles();
}

fileBrowser.prototype._updateUploadVisibility = function()
{
    $([this.fileUpload, this.tdAddFolder]).toggle(nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN) || this._path.isInHome())
}

fileBrowser.prototype.createHeader = function()
{
	var reloadButton = makeImageButton("img/reload.png"),
		homeButton = makeImageButton("img/home.png"),
		discButtonTds = [],
		_this = this;
	
	reloadButton.style.margin = '0px 5px 0px 10px';
	homeButton.style.margin = '0px 10px 0px 5px';
	
	reloadButton.style.width = '14px';
	reloadButton.style.height = '15px';
	homeButton.style.width = '15px';
	homeButton.style.height = '15px';
	
	_title(reloadButton, _gtxt("Обновить"));
	_title(homeButton, _gtxt("Домашняя директория"));
	
	reloadButton.onclick = function()
	{
		_this.getFiles();
	}
	
	homeButton.onclick = function()
	{
        _this._path.set(_layersTree.treeModel.getMapProperties().LayersDir, _this._homeDir);
		_this.getFiles(_layersTree.treeModel.getMapProperties().LayersDir);
	}
	
	//if ( nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_FILE_STRUCTURE ) )
	//{
		for (var i = 0; i < this._discs.length; i++)
		{
			var discButtons = makeButton(this._discs[i]);
			
			(function(i)
			{
				discButtons.onclick = function()
				{
					_this.getFiles(_this._discs[i])
				}
			})(i)
			
			discButtonTds.push(_td([discButtons]))
		}
	//}
	
	discButtonTds.push(_td([reloadButton], [['attr','vAlign','top']]));
	discButtonTds.push(_td([homeButton], [['attr','vAlign','top']]));
	
	var newFolderName = _input(null, [['dir','className','inputStyle'], ['css','width','150px']]),
		showFolderButton = makeImageButton("img/newfolder.png"),
		newFolderButton = makeButton(_gtxt("Создать")),
		createFolder = function()
		{
            _this._status.start();
			sendCrossDomainJSONRequest(serverBase + 'FileBrowser/CreateFolder.ashx?WrapStyle=func&FullName=' + encodeURIComponent(_this._path.get() + newFolderName.value), function(response)
			{
                _this._status.stop();
				if (!parseResponse(response))
					return;
				
				_this.shownPath = newFolderName.value;
				
				newFolderName.value = '';
				
				_this.getFiles();
			})
		};
		
	showFolderButton.style.width = '16px';
	showFolderButton.style.height = '13px';
	
	newFolderName.style.margin = '0px 3px';
	
	_title(showFolderButton, _gtxt("Новая папка"))
	
	showFolderButton.style.marginRight = '10px';
	
	showFolderButton.onclick = function()
	{
        $(newFolderName).toggle().focus();
        $(newFolderButton).toggle();
	}
	
	newFolderName.style.display = 'none';
	newFolderButton.style.display = 'none';
		
	$(newFolderName).on('keydown', function(e)
	{
		if (e.keyCode === 13)
	  	{
	  		if (newFolderName.value != '')
				createFolder();
			else
				inputError(newFolderName);
	  		
	  		return false;
	  	}
	});
	
	newFolderButton.onclick = function()
	{
		if (newFolderName.value != '')
			createFolder();
		else
			inputError(newFolderName);
	}
	
	this.tdAddFolder = _td([_table([_tbody([_tr([
            _td([showFolderButton], [['attr','vAlign','top']]),
            _td([newFolderName]),
            _td([newFolderButton])]
        )])])], [['attr','vAlign','top'], ['css','height','20px']]);
        
	discButtonTds.push(this.tdAddFolder);
	
	_(this.fileHeader, [_table([_tbody([_tr(discButtonTds)])])]);
}

fileBrowser.prototype.createUpload = function()
{
	var div = _div(null, [['css','height','30px']]),
		_this = this;
	
	var formFile = _form(null,[['attr','enctype','multipart/form-data'],['dir','method','post'],['dir','action', serverBase + 'FileBrowser/Upload.ashx?WrapStyle=message'],['attr','target','fileBrowserUpload_iframe']]);

	var attach = _input(null,[['attr','type','file'],['dir','name','rawdata'],['css','width','200px'], ['attr','multiple','multiple']]);
	_(formFile, [attach]);
    
    attach.onchange = function()
	{
        if (attach.files && attach.files[0] && attach.files[0].size > fileBrowser.MAX_UPLOAD_SIZE) {
            _this._showWarningDialog();
            return;
        }
        
        //если можем послать через AJAX, посылаем - будет работать прогресс-бар
        if (window.FormData) {
            var formData = new FormData(formFile);
            formData.append('ParentDir', _this._path.get());
            _this._uploadFilesAjax(formData);
            return;
        }
        
        sendCrossDomainPostRequest(serverBase + 'FileBrowser/Upload.ashx', 
            {
                WrapStyle: 'message',
                ParentDir: _this._path.get()
            },
            function(response) {
                if (!parseResponse(response))
                    return;
                
                var indexSlash = String(response.Result).lastIndexOf(_this.slash),
                    fileName = String(response.Result).substring(indexSlash + 1, response.Result.length);
                
                _this.shownPath = fileName;
                
                _this.getFiles();
            }, 
            formFile
        );
	}
    
    var dropInfoDiv = window.FormData ? _div([_t(_gtxt('FileBrowser.DropInfo'))], [['dir', 'className', 'fileBrowser-dragFileMessage']]) : _div();
	
	_(div, [
        dropInfoDiv,
        _table([_tbody([_tr([
            _td([formFile], [['css', 'paddingTop', '18px']])
        ])])])
    ]);
    
    this.progressBar = $('<div/>').addClass('fileBrowser-progressBar').progressbar({value: 100}).hide();
    
    _(this.fileUpload, [this.progressBar[0], div]);
}

fileBrowser.prototype.getFiles = function(path)
{
	var path = (typeof path != 'undefined') ? path : this._path.get();
    var alternativePath = this._path.getAlternative();
	var _this = this;
    
    if (this._isRestrictedPath(path)) 
        return;
        
    var doProcessResponce = function(response) {
        _this._status.stop();
        
		if (!parseResponse(response))
			return;
		
		_this.getFilesHandler(response.Result, path);
    }

    this._status.start();
	sendCrossDomainJSONRequest(serverBase + "FileBrowser/GetDirectoryContent.ashx?WrapStyle=func&root=" + encodeURIComponent(path), function(response)
	{
        if (response.Status !== 'ok' && alternativePath) {
            path = alternativePath;
            _this._path.set(alternativePath);
            sendCrossDomainJSONRequest(serverBase + "FileBrowser/GetDirectoryContent.ashx?WrapStyle=func&root=" + encodeURIComponent(alternativePath), doProcessResponce);
        } else {
            doProcessResponce(response);
        }
	})
}

fileBrowser.prototype.getFilesHandler = function(files, path)
{
	this._path.set(path);
	this.currentFiles = files;

	this._updateUploadVisibility();

	this.reloadFiles();
}

fileBrowser.prototype.pathWidget = function()
{
    var shortPath = this._path.get();
    var _this = this;
    
    var parent = $('<span/>', {'class': 'fileBrowser-pathWidget'});
    var pathElements = [];
    
    var highlightPath = function(index)
    {
        for (var e = 0; e < pathElements.length; e++)
            if (e <= index)
                pathElements[e].addClass('fileBrowser-activePathElem');
            else
                pathElements[e].removeClass('fileBrowser-activePathElem');
    }
    
    var appendElem = function(text, path){
        var elemIndex = pathElements.length;
        var newElem = $('<span/>', {'class': 'fileBrowser-pathElem'}).text(text + _this.slash)
        .click(function()
        {
            _this.getFiles(path[path.legnth - 1] === _this.slash ? path : path  + _this.slash);
        })
        .hover(function(){highlightPath(elemIndex)}, function(){highlightPath(-1)});
        
        pathElements.push(newElem);
        parent.append(newElem);//.append( $('<span/>').text(_this.slash) );
    }
    
    var curFolder = '';
    while (shortPath.length)
    {
        var index = shortPath.indexOf(this.slash);
        if (index == 0) break;
            
        if (index < 0)
        {
            appendElem(shortPath, curFolder + shortPath);
            break;
        }
        var curText = shortPath.substr(0, index);
        curFolder += curText + this.slash;
        shortPath = shortPath.substr(index+1);
        
        appendElem(curText, curFolder.substr(0, curFolder.length-1));
    }
    
    return parent[0];
}

fileBrowser.prototype.quickSearch = function()
{
	var input = _input(null, [['dir','className','inputStyle'],['css','width','200px']]),
		_this = this;
	
	input.onkeyup = function()
	{
		if (this.value != "")
		{
			var scroll = _this.findContent(this.value);
			
			if (scroll >= 0)
				_this.fileCanvas.lastChild.scrollTop = scroll;
		}
	}
	
	return input;
}

fileBrowser.prototype.findContent = function(value)
{
	var tbody = this.fileCanvas.lastChild.firstChild.lastChild;
	
	for (var i = 0; i < tbody.childNodes.length; ++i)
	{
		var text = tbody.childNodes[i].textContent.toLowerCase();
		
		if (text != "[..]" && text.indexOf(value.toLowerCase()) == 0)
			return tbody.childNodes[i].offsetTop;
	}
	
	return -1;
}

fileBrowser.prototype.reloadFiles = function()
{
    $(this.fileCanvas).empty();
    
    this.statusContainer = _div(null, [['dir', 'className', 'fileBrowser-progress'], ['css', 'display', 'none']]);
	
	_(this.fileCanvas, [_div([this.pathWidget(), _br(), _t(_gtxt("Фильтр")), this.quickSearch(), this.statusContainer], [['dir','className','currentDir'],['css','color','#153069'],['css','fontSize','12px']])]);
	
	_(this.fileCanvas, [this.draw(this.currentFiles)]);
	
	this.resize();
	
	if (this.shownPathScroll)
	{
		this.fileCanvas.lastChild.scrollTop = this.shownPathScroll.offsetTop;
		
		this.shownPathScroll = false;
	}
}

fileBrowser.prototype._getParentFolder = function(path)
{
    var index = String(path).lastIndexOf(this.slash),
        newPath = String(path).substr(0, index);
    
    if (new RegExp(/^[a-z]:$/i).test(newPath))
        newPath += this.slash;
        
    return newPath;
}

fileBrowser.prototype._isRestrictedPath = function(path)
{
    return this._params.restrictDir !== null && path.indexOf(this._params.restrictDir) != 0;
}

fileBrowser.prototype.draw = function(files)
{
	var nameSort = makeLinkButton(_gtxt("Имя")),
		extSort = makeLinkButton(_gtxt("Тип")),
		sizeSort = makeLinkButton(_gtxt("Размер")),
		dateSort = makeLinkButton(_gtxt("Дата")),
		_this = this;
	
	nameSort.sortType = 'name';
	extSort.sortType = 'ext';
	sizeSort.sortType = 'size';
	dateSort.sortType = 'date';
	
	nameSort.onclick = extSort.onclick = sizeSort.onclick = dateSort.onclick = function()
	{
		_this.currentSortType = this.sortType;
		_this.currentSortIndex[_this.currentSortType] = 1 - _this.currentSortIndex[_this.currentSortType];
		
		_this.reloadFiles();
	}
	
	var tdRoot = _td(null, [['css','width','20px']]);
	
	if ( nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_FILE_STRUCTURE ) )
	{
		var rootButton = makeButton(this.slash);
		
		_(tdRoot, [rootButton]);
		
		rootButton.onclick = function()
		{
			_this.getFiles(_this._path.getRoot());
		}
	}
	
	var tableHeaderTr = _tr([tdRoot, _td([nameSort],[['css','textAlign','left']]), _td([extSort], [['css','width','10%'],['css','textAlign','center']]), _td([sizeSort], [['css','width','15%'],['css','textAlign','center']]), _td([dateSort], [['css','width','25%'],['css','textAlign','center']])]),
		prevDirTr = _tr([_td(), _td([_t("[..]")]), _td(), _td(), _td()]),
		tableFilesTrs = [];
	
    var parentFolder = _this._path.getParentFolder();
	if (parentFolder && !this._isRestrictedPath(parentFolder))
	{
        tableFilesTrs.push(prevDirTr)
	
		attachEffects(prevDirTr, 'hover')

		prevDirTr.onclick = function()
		{
			_this.getFiles(parentFolder);
		}
	}
	
	tableFilesTrs = tableFilesTrs.concat(this.drawFolders(files));
	tableFilesTrs = tableFilesTrs.concat(this.drawFiles(files));
	
	return _div([_table([_thead([tableHeaderTr]), _tbody(tableFilesTrs)], [['css','width','100%']])], [['css','overflowY','scroll']]);
}

fileBrowser.prototype.getCurrentSortFunc = function()
{
	return this.sortFuncs[this.currentSortType][this.currentSortIndex[this.currentSortType]];
}

fileBrowser.prototype.formatDate = function(sec)
{
	var sysDate = new Date(sec * 1000),
		date = [];

	date[0] = sysDate.getDate(),
	date[1] = sysDate.getMonth() + 1,
	date[2] = sysDate.getFullYear(),
	date[3] = sysDate.getHours(),
	date[4] = sysDate.getMinutes(),
	date[5] = sysDate.getSeconds();

	for (var i = 0; i < 6; i++)
		if (date[i] < 10)
			date[i] = '0' + date[i];

	return date[0] + '.' + date[1] + '.' + date[2] + ' ' + date[3] + ':' + date[4] + ':' + date[5];
}

fileBrowser.prototype.drawFolders = function(arr)
{
	var folders = [],
		trs = [],
		_this = this;;
	
	for (var i = 0; i < arr.length; i++)
		if (arr[i].Directory)
			folders.push(arr[i]);
	
	if (this.currentSortType == 'name' || this.currentSortType == 'date')
		folders = folders.sort(this.getCurrentSortFunc());
	
	for (var i = 0; i < folders.length; i++)
	{
		var tdReturn = _td();
		
		if (!this.returnMask.length)
		{
			var returnButton = makeImageButton("img/choose.png", "img/choose_a.png");
			returnButton.style.cursor = 'pointer';
			returnButton.style.marginLeft = '5px';
			
			_title(returnButton, _gtxt("Выбрать"));
			
			(function(i){
				returnButton.onclick = function(e)
				{
					_this.close(_this._path.get() + folders[i].Name + _this.slash);
				}
			})(i);
			
			_(tdReturn, [returnButton])
		}
		
		var tr = _tr([
            tdReturn, 
            _td([_div(null, [['dir','className','fileCanvas-folder-icon']]), this.createFolderActions(folders[i].Name)]), 
            _td(), 
            _td([_t(_gtxt("Папка"))],[['css','textAlign','center'],['dir','className','invisible']]), 
            _td([_t(this.formatDate(folders[i].Date))],[['css','textAlign','center'],['dir','className','invisible']])
        ]);
		
		(function(i){
			tr.onclick = function()
			{
				_this.getFiles(_this._path.get() + folders[i].Name);
			}
		})(i);
		
		attachEffects(tr, 'hover');
		
		if (this.shownPath && folders[i].Name == this.shownPath)
		{
			$(tr).children("td").css('backgroundColor', '#CEEECE');
			
			this.shownPath = null;
			
			this.shownPathScroll = tr;
		}
		
		trs.push(tr)
	}
	
	return trs;
}

fileBrowser.prototype.drawFiles = function(arr)
{
	var files = [],
		trs = [],
		_this = this;
	
	for (var i = 0; i < arr.length; i++)
		if (!arr[i].Directory)
			files.push(arr[i]);
	
	files = files.sort(this.getCurrentSortFunc());
	
	for (var i = 0; i < files.length; i++)
	{
		var index = String(files[i].Name).lastIndexOf('.'),
			name = String(files[i].Name).substr(0, index),
			ext = String(files[i].Name).substr(index + 1, files[i].Name.length),
			tdReturn = _td()
			tdSize = _td([_t(this.makeSize(files[i].Size))], [['attr','size',files[i].Size],['css','textAlign','right'],['dir','className','invisible']]);
		
		if (this.returnMask.length && valueInArray(this.returnMask, ext.toLowerCase()))
		{
			var returnButton = makeImageButton("img/choose.png", "img/choose_a.png");
			returnButton.style.cursor = 'pointer';
			returnButton.style.marginLeft = '5px';
			
			_title(returnButton, _gtxt("Выбрать"));
			
			(function(i){
				returnButton.onclick = function(e)
				{
					_this.close(_this._path.get() + files[i].Name);
				}
			})(i);
			
			_(tdReturn, [returnButton])
		}
		
		var	tr = _tr([tdReturn, _td([this.createFileActions(name, ext)]), _td([_t(ext)],[['css','textAlign','right'],['css','fontSize','12px']]), tdSize, _td([_t(this.formatDate(files[i].Date))],[['css','textAlign','center'],['dir','className','invisible']])]);
		
		attachEffects(tr, 'hover');
		
		if (this.shownPath && files[i].Name == this.shownPath)
		{
			$(tr).children("td").css('backgroundColor', '#CEEECE');
			
			this.shownPath = null;
			
			this.shownPathScroll = tr;
		}

		trs.push(tr)
	}
	
	return trs;
}

fileBrowser.prototype.createFolderActions = function(name)
{
	var span = _span([_t(name)],[['css','fontSize','12px']]),
		spanParent = _div([span],[['css','display', 'inline-block'],['css','position','relative']]),
		_this = this;
	
	nsGmx.ContextMenuController.bindMenuToElem(spanParent, 'FileBrowserFolder', 
		function()
		{
			return _this._path.isInHome() || nsGmx.AuthManager.canDoAction( nsGmx.ACTION_SEE_FILE_STRUCTURE );
		}, 
		{
			fullPath: this._path.get() + name + this.slash,
			fileBrowser: this,
			enableZip: true
		}
	);

	return spanParent;
}

fileBrowser.prototype.createFileActions = function(name, ext)
{
	var span = _span([_t(name)],[['css','fontSize','12px']]),
		spanParent = _div([span],[['css','display','inline-block'],['css','position','relative']]),
		_this = this;

	nsGmx.ContextMenuController.bindMenuToElem(spanParent, 'FileBrowserFile', 
		function()
		{
			return _this._path.isInHome() || nsGmx.AuthManager.canDoAction( nsGmx.ACTION_SEE_FILE_STRUCTURE );
		}, 
		{
			fullPath: this._path.get() + name + '.' + ext,
			fileBrowser: this,
			enableUnzip: valueInArray(_this.ext7z, ext.toUpperCase())
		}
	);
	
	return spanParent;
}

//TODO: translate
fileBrowser.prototype.makeSize = function(size)
{
	if (size > 1024 * 1024 * 1024)
		return (size / (1024 * 1024 * 1024)).toFixed(2) + ' Гб';
	else if (size > 1024 * 1024)
		return (size / (1024 * 1024)).toFixed(2) + ' Мб';
	else if (size > 1024)
		return (size / 1024).toFixed(2) + ' Кб';
	
	return size + ' б';
}

window.fileBrowser = fileBrowser;
window._fileBrowser = new fileBrowser();

///////////////////////////////////////////////////////////////////////////////
////////////////////////// Контекстное меню браузера //////////////////////////
///////////////////////////////////////////////////////////////////////////////

//фабрика, которая может возвращать элементы меню для архивирования (isZip=true) и разархивирования (isZip=false)
var zipUnzipActionFactory = function(isZip)
{
	return {
		title:  function() { return isZip ? _gtxt("Упаковать") : _gtxt("Извлечь"); },
		clickCallback: function(context)
		{
            context.fileBrowser._status.start();
			sendCrossDomainJSONRequest(serverBase + (context.enableUnzip ? 'FileBrowser/Unzip.ashx' : 'FileBrowser/Zip.ashx') + '?WrapStyle=func&FullName=' + encodeURIComponent(context.fullPath), function(response)
			{
                context.fileBrowser._status.stop();
                
				if (!parseResponse(response))
					return;
				
				var indexSlash = String(response.Result).lastIndexOf('\\'),
					fileName = String(response.Result).substring(indexSlash + 1, response.Result.length);
				
				context.fileBrowser.shownPath = fileName;
				
				context.fileBrowser.getFiles();
			})
		},
		isVisible: function(context)
		{
			return isZip ? !context.enableUnzip : context.enableUnzip; //XOR
		}
	}
}

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Скачать"); },
	clickCallback: function(context)
	{
		var form = _form([_input(null,[['attr','name','FullName'], ['attr','value', context.fullPath]])], [['css','display','none'],['attr','method','POST'],['attr','action',serverBase + "FileBrowser/Download.ashx"]]);
		
		_(document.body, [form]);
		
		form.submit();
		
		form.removeNode(true);
	}
}, ['FileBrowserFolder', 'FileBrowserFile']);

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Удалить"); },
	clickCallback: function(context)
	{
        context.fileBrowser._status.start();
		sendCrossDomainJSONRequest(serverBase + 'FileBrowser/Delete.ashx?WrapStyle=func&FullName=' + encodeURIComponent(context.fullPath), function(response)
		{
            context.fileBrowser._status.stop();
			if (!parseResponse(response))
				return;
			
			context.fileBrowser.getFiles();
		})
	}
}, ['FileBrowserFolder', 'FileBrowserFile']);

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Очистить"); },
	clickCallback: function(context)
	{
        context.fileBrowser._status.start();
		sendCrossDomainJSONRequest(serverBase + 'FileBrowser/CleanFolder.ashx?WrapStyle=func&FullName=' + encodeURIComponent(context.fullPath), function(response)
		{
            context.fileBrowser._status.stop();
			if (!parseResponse(response))
				return;
			
			context.fileBrowser.getFiles();
		})	
	}
}, 'FileBrowserFolder');

//упаковываем и файлы и папки
nsGmx.ContextMenuController.addContextMenuElem(zipUnzipActionFactory(true), ['FileBrowserFolder', 'FileBrowserFile']);

//распаковываем только файлы
nsGmx.ContextMenuController.addContextMenuElem(zipUnzipActionFactory(false), 'FileBrowserFile');

})(nsGmx.Utils._);