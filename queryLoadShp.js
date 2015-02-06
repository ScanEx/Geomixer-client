
_translationsHash.addtext("rus", {
							"loadShape.inputTitle": "Добавить shp-файл (в zip)",
                            "loadShape.loadDone": "Геометрия успешно загружена",
                            "loadShape.loadFail": "Ошибка загрузки геометрии"
						 });
						 
_translationsHash.addtext("eng", {
							"loadShape.inputTitle": "Add shp-file (zipped)",
                            "loadShape.loadDone": "Successfully loaded",
                            "loadShape.loadFail": "Error loading file"
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

//Старый вариант для IE9
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

queryLoadShp.prototype._showObjectsOnMap = function(objs){
    if (objs.length == 0)
    {
        showErrorMessage(_gtxt("Загруженный shp-файл пуст"), true);
        return;
    }
    
    var b = getBounds();
    for (var i = 0; i < objs.length; i++)
    {
        var o = objs[i];
        globalFlashMap.drawing.addObject(o.geometry, o.properties);
        b.update(o.geometry.coordinates);
    }
    globalFlashMap.zoomToExtent(b.minX, b.minY, b.maxX, b.maxY);
}

queryLoadShp.prototype.upload = function()
{
	hide(this.inputControl);
	show(this.progress);
	
	var _this = this;
    
    var regenerateGUI = function() {
        _this.inputControl.removeChild(_this.postForm);
        _this._regenerateControl();
    }
    
    //TODO: update jQuery and use always()
    nsGmx.Utils.parseShpFile(this.postForm)
        .then(this._showObjectsOnMap).always(regenerateGUI);
}

var _queryLoadShp = new queryLoadShp();


drawingObjects.loadShp.load = function() {
    nsGmx.widgets.notifications.startAction('uploadShp');
    if ('File' in window) {
        $('<input type="file">').change(function(e) {
            nsGmx.Utils.parseShpFile(e.target.files[0]).then(
                function(objs) {
                    _queryLoadShp._showObjectsOnMap(objs);
                    nsGmx.widgets.notifications.stopAction('uploadShp', 'success', _gtxt('loadShape.loadDone'));
                }, 
                function() {
                    nsGmx.widgets.notifications.stopAction('uploadShp', 'failure', _gtxt('loadShape.loadFail'));
                }
            );
        }).click();
    } else { //IE9
        var alreadyLoaded = _queryLoadShp.createWorkCanvas(arguments[0] || "shp");

        if (!alreadyLoaded)
            _queryLoadShp.load()
    }
}

drawingObjects.loadShp.unload = function()
{
}