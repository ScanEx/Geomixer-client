var nsCatalog = nsCatalog || {};
nsCatalog.Controls = nsCatalog.Controls || {};

(function($, _){

  var ﻿ShapeFileController = function(mapController) {
    this._mapController = mapController;
    this._search = {
      form: null,
      fieldIds: null,
      fieldWkt: null,
      fieldName: null
    };

    this._catalog = {
      form: null,
      fieldName: null
    }

    this._rlImages = {
      form: null,
      fieldIds: null,
      fieldWkt: null,
      fieldName: null
    };

    this._rlSheets = {
      form: null,
      fieldIds: null,
      fieldWkt: null,
      fieldName: null
    };

    this._vectors = {
      form: null,
      ArchiveName: null,
      Files: null
    };

    this._initialize();
  };

  ShapeFileController.prototype._initialize = function() {
    this._search.form = $('<form style="display: none" id="download_search_shapefile_form" method="POST" action="http://search.kosmosnimki.ru/QuicklooksShape.ashx"><input type="hidden" id="download_search_shapefile_form_name" name="ShapeFileName" /><input type="hidden" id="download_search_shapefile_form_wkt" name="wkt" /><input type="hidden" id="download_search_shapefile_form_id" name="id" /></form>').appendTo('body');
    this._search.fieldIds = this._search.form.find('#download_search_shapefile_form_id');
    this._search.fieldWkt = this._search.form.find('#download_search_shapefile_form_wkt');
    this._search.fieldName = this._search.form.find('#download_search_shapefile_form_name');

    this._catalog.form = $('<form style="display: none" id="download_catalog_shapefile_form" method="POST" action="http://catalog.scanex.ru/dewb/geomixer_get_shp.pl"><input type="hidden" id="download_catalog_shapefile_form_name" name="file" /><div id="download_catalog_shapefile_form_content"></div></form>').appendTo('body');
    this._catalog.fieldName = this._catalog.form.find('#download_catalog_shapefile_form_name');
    this._catalog.content = this._catalog.form.find('#download_catalog_shapefile_form_content');

    this._rlImages.form = $('<form style="display: none" id="download_rli_shapefile_form" method="POST" action="http://maps.kosmosnimki.ru/DownloadLayer.ashx"><input type="hidden" id="download_rli_shapefile_form_name" name="name" /><input type="hidden" id="download_rli_shapefile_form_wkt" name="wkt" /><input type="hidden" id="download_rli_shapefile_form_id" name="id" /></form>').appendTo('body');
    this._rlImages.fieldIds = this._rlImages.form.find('#download_rli_shapefile_form_id');
    this._rlImages.fieldWkt = this._rlImages.form.find('#download_rli_shapefile_form_wkt');
    this._rlImages.fieldName = this._rlImages.form.find('#download_rli_shapefile_form_name');

    this._vectors.form = $('<form style="display: none" id="download_vector_shapefile_form" method="POST" action="http://maps.kosmosnimki.ru/VectorFileMaker.ashx"><input type="hidden" id="download_vector_shapefile_form_archive_name" name="ArchiveName" /><input type="hidden" id="download_vector_shapefile_form_files" name="Files" /></form>').appendTo('body');

    this._vectors.ArchiveName = this._vectors.form.find('#download_vector_shapefile_form_archive_name');
    this._vectors.Files = this._vectors.form.find('#download_vector_shapefile_form_files');
  };

  ShapeFileController.prototype.downloadVectorsShapeFile = function(shapes){
    var area = getOffsetRect($$('leftMenu'));
    var canvas = _div(), filename = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','value','my']]), that = this;
    var downloadButton = makeButton(_gtxt("Скачать"));
    downloadButton.onclick = function() {
      if (filename.value == '')
      {
        $(filename).addClass("error")
        setTimeout(function(){if (filename) $(filename).removeClass("error")}, 2000);
        return;
      }

      var files = [];
      for (var id in shapes){
        var shape = shapes[id];
        files.push(shape);
      }

      var translitName = filename.value.translit();
      this._vectors.ArchiveName.val(translitName);
      this._vectors.Files.val(JSON.stringify(files));
      this._vectors.form.submit();

      $(canvas.parentNode).dialog("destroy")
      canvas.parentNode.removeNode(true);
    }.bind(this);

    _(canvas, [_div([_t(_gtxt("Введите имя файла для скачивания")), filename],[['css','textAlign','center']]), _div([downloadButton],[['css','textAlign','center']])]);

    showDialog(_gtxt("Скачать shp-файл"), canvas, 240, 115, area.left + 150, area.top);
  };

  ShapeFileController.prototype.downloadShapeFile = function(fileName, images) {
    // Search images
    this._search.fieldIds.val(images.searchIds.join(','));

    // Catalog images
    this._catalog.content.empty();
    for (var satName in images.catalogIds.data) {
      var newHidden = $('<input type="hidden" name="' + satName + '" />').appendTo(this._catalog.content);
      newHidden.val(images.catalogIds.data[satName].join(','));
    }

    // Search images
    this._rlImages.fieldIds.val(images.rlImagesIds.join(','));

    var objects = [];
    this._mapController.drawing.forEachObject(function(o) {
      //if (o.geometry.type == "POLYGON")
      objects.push(o);
    });
    if (objects.length > 0) {
      this._search.fieldWkt.val(this._getSearchWKT(objects));
      this._search.fieldWkt.attr('name', 'wkt');
    } else this._search.fieldWkt.attr('name', 'dummy');

    if (images.searchIds.length || !images.catalogIds.empty || images.rlImagesIds.length) {
      var area = getOffsetRect($$('leftMenu'));
      var canvas = _div(),
      filename = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','value','my']]),
      that = this;

      var downloadButton = makeButton(_gtxt("Скачать"));
      downloadButton.onclick = function() {
        if (filename.value == '')
        {
          $(filename).addClass("error")
          setTimeout(function(){if (filename) $(filename).removeClass("error")}, 2000);
          return;
        }

        var translitName = filename.value.translit();
        that._search.fieldName.val(translitName + '_search');
        that._catalog.fieldName.val(translitName + '_catalog');
        that._rlImages.fieldName.val(translitName + '_rli');
        var catalogSubmitFunc = images.catalogIds.empty
        ? function() {}
        : function() { that._catalog.form.submit(); };
        if (images.searchIds.length) {
          that._search.form.submit();
          setTimeout(catalogSubmitFunc, 500);
        } else catalogSubmitFunc();

        if (images.rlImagesIds.length) {
          that._rlImages.form.submit();
          setTimeout(catalogSubmitFunc, 500);
        } else catalogSubmitFunc();

        $(canvas.parentNode).dialog("destroy")
        canvas.parentNode.removeNode(true);
      };

      _(canvas, [_div([_t(_gtxt("Введите имя файла для скачивания")), filename],[['css','textAlign','center']]), _div([downloadButton],[['css','textAlign','center']])]);

      showDialog(_gtxt("Скачать shp-файл"), canvas, 240, 100, area.left + 150, area.top);
    }

    return false;
  };

  ShapeFileController.prototype._getPointWKT = function(p) {
    return (p[0] + '').substring(0, 8) + ' ' + (p[1] + '').substring(0, 8);
  };

  ShapeFileController.prototype._getSearchWKT = function(objects) {
    var wkts = [];
    for (var i = 0; i < objects.length; i++) {
      var geom = objects[i].geometry;
      var coords = geom.coordinates;
      if (geom.type == 'POINT')
      wkts.push('POINT(' + this._getPointWKT(coords) + ')');
      else if (geom.type == 'LINESTRING')
      wkts.push('LINESTRING(' + forEachPoint(coords, this._getPointWKT).join(',') + ')');
      else
      wkts.push('POLYGON((' + forEachPoint(coords[0], this._getPointWKT).join(',') + '))');
    }
    return wkts.join(';');
  };

  nsCatalog.Controls.ShapeFileController = ShapeFileController;

}(jQuery, nsGmx.Utils._));
