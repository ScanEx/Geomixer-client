
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

    this.workCanvas.appendChild(_div([this.inputControl, this.progress], [['css','padding','10px 0px 5px 20px']]));
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
    var lmap = nsGmx.leafletMap,
        gmxDrawing = lmap.gmxDrawing,
        latLngBounds = L.latLngBounds([]);
    for (var i = 0; i < objs.length; i++) {
        var it = objs[i],
            geoJSON = L.gmxUtil.geometryToGeoJSON(it.geometry),
            b = gmxDrawing.addGeoJSON(geoJSON, {fill: false, properties: it.properties})[0].getBounds();

        latLngBounds.extend(b);
    }
    if (latLngBounds.isValid()) {
        lmap.fitBounds(latLngBounds);
    }
}

//files - массив File или WebForms
queryLoadShp.prototype.loadAndShowFiles = function(files) {
    nsGmx.widgets.notifications.startAction('uploadShp');
    
    var def = $.when.apply($, [].slice.call(files).map(function(file) {
        return nsGmx.Utils.parseShpFile(file);
    }));
    
    def.then(function() {
        this._showObjectsOnMap(_.flatten([].slice.call(arguments)));
        nsGmx.widgets.notifications.stopAction('uploadShp', 'success', _gtxt('loadShape.loadDone'));
    }.bind(this), function() {
        nsGmx.widgets.notifications.stopAction('uploadShp', 'failure', _gtxt('loadShape.loadFail'));
    });
    
    return def;
}


//Загружает файлы из поля "file"
queryLoadShp.prototype.upload = function()
{
	hide(this.inputControl);
	show(this.progress);

    this.loadAndShowFiles([this.postForm]).always(function() {
        this.inputControl.removeChild(this.postForm);
        this._regenerateControl();
    }.bind(this));
}

var _queryLoadShp = new queryLoadShp();


drawingObjects.loadShp.load = function() {
    if ('File' in window) {
        $('<input type="file" multiple>').change(function(e) {
            _queryLoadShp.loadAndShowFiles(e.target.files);
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