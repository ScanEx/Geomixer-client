
_translationsHash.addtext("rus", {
							"loadShape.Errors.FileTooBigException" : "Файл слишком большой. Ограничение на размер файла 1000 Кб.",
							"loadShape.Errors.ErrorUploadExeption" : "Произошла ошибка при попытке загрузить файл.",
							"loadShape.Errors.NoGeometryFile"      : "Загруженный файл не содержит геометрических данных.",
							"loadShape.Errors.ErrorUploadNoDependentFiles" : "Не найдено необходимых зависимых файлов. Запакуйте все файлы в ZIP архив и повторите загрузку.",
							"loadShape.inputTitle"                 : "Добавить shp-файл (в zip)"
						 });
						 
_translationsHash.addtext("eng", {
							"loadShape.Errors.FileTooBigException" : "Too big file. File size limit is 1000 Kb.",
							"loadShape.Errors.ErrorUploadExeption" : "Error during file uploading.",
							"loadShape.Errors.NoGeometryFile"      : "There are no geometry in uploaded file.",
							"loadShape.Errors.ErrorUploadNoDependentFiles" : "Not found the necessary dependent files. Add all files in a ZIP archive and upload it again.",
							"loadShape.inputTitle"                 : "Add shp-file (zipped)"
						 });

var drawingObjects = 
{
	loadShp: {}
}

var queryLoadShp = function()
{
	this.builded = false;
	
	this.uploader = null;
}

queryLoadShp.prototype = new leftMenu();

//просто удаляет все контролы и создаёт все их заново...
queryLoadShp.prototype._regenerateControl = function()
{
	var _this = this;
	$(this.workCanvas).empty();
	
	var fileInput = _input(null, [['attr', 'type', 'file'], ['attr', 'name', 'file'], ['attr', 'id', 'upload_shapefile']]);
	fileInput.onchange = function()
	{
		if (this.value != "")
			_this.upload();
	}
	
	//задаём одновременно и enctype и encoding для корректной работы в IE
	this.postForm = _form([fileInput], [['attr', 'method', 'POST'], ['attr', 'encoding', 'multipart/form-data'], ['attr', 'enctype', 'multipart/form-data'], ['attr', 'id', 'upload_shapefile_form']]);
	
	this.progress = _img(null,[['attr','src','img/progress.gif'],['css','display','none']])
	
	this.inputControl = _div([_span([_t(_gtxt("loadShape.inputTitle") + ":")]), this.postForm]);
	
	_(this.workCanvas, [_div([this.inputControl, this.progress], [['css','padding','10px 0px 5px 20px']])])	
}

queryLoadShp.prototype.load = function()
{
	if (!this.builded)
	{
		this._regenerateControl();
		this.builded = true;
	}
}

queryLoadShp.prototype.upload = function()
{
	hide(this.inputControl);
	show(this.progress);
	
	var _this = this;
		
	sendCrossDomainPostRequest(serverBase + "ShapeLoader.ashx", {WrapStyle: "window"}, function(response)
	{
		var errorMessages = {
				"CommonUtil.FileTooBigException" : _gtxt("loadShape.Errors.FileTooBigException"),
				"CommonUtil.ErrorUploadExeption" : _gtxt("loadShape.Errors.ErrorUploadExeption"),
				"CommonUtil.NoGeometryFile"      : _gtxt("loadShape.Errors.NoGeometryFile"),
				"CommonUtil.ErrorUploadNoDependentFiles": _gtxt("loadShape.Errors.ErrorUploadNoDependentFiles")
		};
		
		if (parseResponse(response, errorMessages))
		{
			var obj = response.Result;
			
			if (obj.length == 0)
			{
				showErrorMessage(_gtxt("Загруженный shp-файл пуст"), true);
				return;
			}
			
			var b = getBounds();
			for (var i = 0; i < obj.length; i++)
			{
				var o = obj[i];
				globalFlashMap.drawing.addObject(o.geometry, o.properties);
				b.update(o.geometry.coordinates);
			}
			globalFlashMap.zoomToExtent(b.minX, b.minY, b.maxX, b.maxY);
		}
		
        _this.inputControl.removeChild(_this.postForm);
		_this._regenerateControl();
	}, this.postForm);
}

var _queryLoadShp = new queryLoadShp();


drawingObjects.loadShp.load = function()
{
	var alreadyLoaded = _queryLoadShp.createWorkCanvas(arguments[0] || "shp");
	
	if (!alreadyLoaded)
		_queryLoadShp.load()
}

drawingObjects.loadShp.unload = function()
{
}