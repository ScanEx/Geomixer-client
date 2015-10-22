SearchResultsViewController = function(view, dependencies) {
    this._view = view;
    this._treeView = null;

    this._toggler = null;
    this._contentContainer = null;
    this._btnDownloadShapeFile = null;

    this._btnClear = null;
    this._onClearClicked = null;
    this._shapeFileController = dependencies.shapeFileController;
	this._mapObjectsHelper = dependencies.mapObjectsHelper;
	this._waitingDialog = dependencies.waitingDialog;

	$(this._mapObjectsHelper).on('geometry:change', this._geometryChange.bind(this));

	this._searchResults = [];
	this._catalogResults = [];
	this._rlImagesResults = [];
	this._rlSheetsResults = [];
    this._initialize();
}

SearchResultsViewController.prototype = {
  _initialize: function() {
    this._view.append($('<div class="search-results-section"><div class="images-search-section-header" style="padding:2px"><span style="float:left">Результаты поиска</span><button style="float:left;margin-left:5px"><span class="results-images-download">Скачать</span><img src="img/preferences.png" style="margin-left: 5px; cursor: pointer; width: 12px; height: 12px;" data-original-title="" title=""></button><div class="search-results-clear">Очистить</div><div id="searchResultsToggler" class="collapse-toggler expanded"></div><div class="clear"></div></div><div class="search-results-content"></div></div>'));

    this._toggler = this._view.find('#searchResultsToggler').click(this._toggleCollapsed.bind(this));
    this._contentContainer = this._view.find('.search-results-content');
    this._btnDownloadShapeFile = this._view.find('.results-images-download').click(this._downloadShapeFile.bind(this));
    this._view.find('button').attr('disabled', true);

    this._downloadOptions = {
    'results': {label: 'Результаты поиска', checked: true},
    'selected': {label: 'Выбранные снимки', checked: false},
    'diff': {label: 'Непокрытая площадь', checked: false}
    };
    var opts = [];
    for (var id in this._downloadOptions){
      var opt = this._downloadOptions[id];
      opts.push('<li style="margin:2px"><input id="opt_' + id + '" type="checkbox" value="' + id + '"><label for="opt_' + id + '" style="margin-left:2px">' + opt.label + '</label></li>');
    }
    var html = '<div><ul>' + opts.join('') + '</ul></div>';
    var _that = this;
    this._view.find('.images-search-section-header button img').popover({
      title: 'Параметры',
      content: html,
      html: true
      }).on('shown.bs.popover',function(e){
        $(e.target).parent().find('.popover-content input[type="checkbox"]')
        .each(function(){
          var target = $(this);
          var k = target.val();
          var disable = false;
          target.prop('checked', _that._downloadOptions[k].checked);
          switch	(k){
            case 'diff':
              disable = !_that._mapObjectsHelper.hasGeometries();
              target.attr('disabled', disable);
              if(disable) {
                target.prop('checked', false);
              }
              break;
            case 'selected':
              disable = !(_that._selectedItems && _that._selectedItems.length > 0);
              target.attr('disabled', disable);
              if(disable) {
                target.prop('checked', false);
              }
              break;
            default:
              break;
          }
        })
        .off()
        .click(function(){
          var target = $(this);
          _that._downloadOptions[target.val()].checked = target.prop('checked');
        });});

    this._btnClear = this._view.find(".search-results-clear").click(this._clearClicked.bind(this));
    $('<div><input id="non_covered" type="checkbox" /><label for="non_covered">Непокрытая площадь</label><img class="non-covered-refresh" style="margin-left: 3px" alt="" src="img/refresh.png" title="Обновить" width="16px" height="16px"/><span style="margin-left: 3px"></span><img class="non-covered-convert" style="margin-left: 3px" alt="" src="img/polygon_tool_a.png" title="Поиск" width="16px" height="16px"></div>')
    .addClass('non-covered').appendTo(this._view.find('.search-results-section'));
    this._view.find('.non-covered > img.non-covered-refresh').click(this._refreshNonCovered.bind(this));
    this._view.find('.non-covered > img.non-covered-convert').click(this._searchNonCovered.bind(this));
    this._nonCoveredHandle = this._view.find('.non-covered > input[type="checkbox"]').click(this._showNonCovered.bind(this));
    this._view.find('.non-covered *').attr('disabled',true);
    this._nonCoveredDrawing = null;
    this._treeView = new TreeViewController(this._contentContainer);

    var p = $('#flash').position();
    var w = $('#flash').width();
    this._view.css({position: 'fixed', zIndex: 1000, right: 10, top: p.top + 10});
  },

	setSearchGeometries: function(geometries){
		this._searchGeometries = geometries || {};
	},

	_geometryChange: function(e, geometries){
		this.setSearchGeometries(geometries);
	},

	_showNonCovered: function(e){
		var t = $(e.target);
		if(!this._nonCoveredDrawing){
			this._refreshNonCovered();
		}
		else {
			var checked = !!this._nonCoveredHandle.prop('checked');
			this._nonCoveredDrawing.setVisible(checked);
		}
	},

  _searchNonCovered: function(){
    if(!this._nonCoveredHandle.attr('disabled')){
			if(this._nonCoveredDrawing){
        var g = this._nonCoveredDrawing.getGeometry();
        $(this).trigger('searchNonCovered', [g]);
			}
		}
  },

	_refreshNonCovered: function(){
		if(!this._nonCoveredHandle.attr('disabled')){
			if(this._nonCoveredDrawing){
				this._nonCoveredDrawing.remove();
			}
			this._getDownloadParams(true)
			.then(function(shapes){
				if(shapes.diff && shapes.diff.Features.length > 0){
					var color = parseInt('ff7f50',16);
					var s = {outline: {color: color, thickness: 1, opacity: 100}, fill: {color: color, opacity: 50}};
					var g = shapes.diff.Features[0].geometry;
					this._updateNonCoveredArea((L.gmxUtil.geoArea({type: g.type.toUpperCase(), coordinates: g.coordinates}) / 1.0E+6).toFixed(3));
					var checked = !!this._nonCoveredHandle.prop('checked');
          if(checked && !this._nonCoveredDrawing){
						var	polygon = L.geoJson(g, {
							style: function (feature) {
								return {color: '#ff7f50', weight: 1, opacity: 1, fillColor: '#ff7f50', fillOpacity: 50};
							}
						});
						this._mapController.addLayer(polygon);
						this._nonCoveredDrawing = polygon;
					}
					else {
						this._mapController.removeLayer(this._nonCoveredDrawing);
						this._nonCoveredDrawing = null;
					}
				}
			}.bind(this));
		}
	},

	_updateNonCoveredArea: function(text){
		this._view.find('.non-covered > span').text(text + ' кв. км');
	},

  _toggleCollapsed: function() {
    if (this._toggler.hasClass('collapsed')) {
      this._toggler.toggleClass('collapsed', false);
      this._toggler.toggleClass('expanded', true);
      this._contentContainer.show();
    } else {
      this._toggler.toggleClass('collapsed', true);
      this._toggler.toggleClass('expanded', false);
      this._contentContainer.hide();
    }
  },

  _downloadShapeFile: function() {
    this._view.find('.images-search-section-header button img').popover('hide');
    if(this._hasResults()) {
      var dif = this._downloadOptions['diff'].checked,
      res = this._downloadOptions['results'].checked,
      sel = this._downloadOptions['selected'].checked;
      this._getDownloadParams(dif, res, sel).then(function(shapes){
        if(shapes) {
          var files = [];
          for (var id in shapes){
            files.push(shapes[id]);
          }
          var area = getOffsetRect($$('leftMenu'));
          var canvas = _div(),
          filename = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','value','my']]),
          that = this;
          var btn = makeButton(_gtxt("Скачать"));
          btn.onclick = function() {
            if (filename.value == ''){
              $(filename).addClass("error")
              setTimeout(function(){if (filename) $(filename).removeClass("error")}, 2000);
              return;
            }
            var translitName = filename.value.translit();
            var rq = JSON.stringify({ArchiveName: translitName, Files:  files});
            sendCrossDomainPostRequest('http://maps.kosmosnimki.ru/VectorFileMaker',
              {WrapStyle: 'message', Request: rq},
              function(data){
                if (data.Status == 'ok'){
                  sendCrossDomainPostRequest('http://maps.kosmosnimki.ru/DownloadFile?id=' + data.Result, {WrapStyle: 'message'});
                }
                else {
                  console.log(data.ErrorInfo);
                }
              }
            );
            $(canvas.parentNode).dialog("destroy");
            canvas.parentNode.removeNode(true);
          }.bind(this);
          _(canvas, [_div([_t(_gtxt("Введите имя файла для скачивания")), filename],[['css','textAlign','center']]), _div([btn],[['css','textAlign','center']])]);
          showDialog(_gtxt("Скачать shp-файл"), canvas, 240, 115, area.left + 150, area.top);
        }
      }.bind(this));
    }
    return false;
  },

	_geometryToGeoJSON: function(geometry){
		var t = '';
		switch(geometry.type.toUpperCase()){
				case 'POINT':
					t = 'Point';
					break;
				case 'MULTIPOINT':
					t = 'MultiPoint';
					break;
				case 'LINESTRING':
					t = 'LineString';
					break;
				case 'MULTILINESTRING':
					t = 'MultiLineString';
					break;
				case 'POLYGON':
					t = 'Polygon';
					break;
				case 'MULTIPOLYGON':
					t = 'MultiPolygon';
					break;
				default:
					throw 'Unsupported geometry type';
			}
			return {type: t, coordinates: geometry.coordinates};
	},

	_fixGeometry: function(geometry, crs){
		var g = crs == 'mercator' ? L.gmxUtil.geometryToGeoJSON(geometry, true) :  this._geometryToGeoJSON (geometry);
		return g;
	},

	_getProperties: function(obj, skip){
		var p = {};
		for (var k in obj){
			var t = typeof (obj[k]);
			if((typeof skip == 'string' && k == skip) ||
			(skip && skip.length && skip.indexOf(k) >= 0) ||
			(t != 'number' && t != 'string')){
				continue;
			}
			p[k] = obj[k];
		}
		return p;
	},

	_hasSearchGeometry: function(){
		for(var id in this._searchGeometries){
			return true;
		}
		return false;
	},

	_getDownloadParams: function(dif, res, sel){
		var getColumnType = function(value){
			var type = typeof value;
			switch(type){
				case 'number':
					return 'Float';
				default:
				case 'string':
					return 'String';
			}
		};
		var def =  new $.Deferred();
		var isVisible = function(n) { return n.type == 'GroundOverlay' && n.isChecked ? n.data : null; };
		var visible = this._treeView.map(isVisible);
		var rs = [], item = null;
		var rd = new jsts.io.GeoJSONReader();
		var shapes = {};
		if(dif || res) {
			var resultShape = {
				Filename: 'results',
				Formats: ['shape','tab'],
				Features: [],
				Columns: []
			};
			var columns = {};
			for (var i = 0; i < visible.length; i++) {
				item = visible[i];
				var g = this._fixGeometry(item.geometry, item.crs);
				rs.push(rd.read(g));
				if(res) {
					var ps = item.info || {};
					resultShape.Features.push({type: 'Feature', geometry: g, properties: ps});
					for (var p in ps){
						columns[p] = getColumnType(ps[p]);
					}
				}
			}
			if(resultShape.Features.length > 0){
				for(var c in columns){
					resultShape.Columns.push({Name: c, Type: columns[c]});
				}
				shapes.results = resultShape;
			}
		}

		if(sel && this._selectedItems && this._selectedItems.length){
			var selectedShape = {
				Filename: 'selected',
				Formats: ['shape','tab'],
				Features: [],
				Columns: []
			};
			columns = {};
			for (var i = 0; i < this._selectedItems.length; i++){
				item = this._selectedItems[i];
				var g = this._fixGeometry(item.geometry, item.crs);
				rs.push(rd.read(g));
				var ps = item.info || {};
				selectedShape.Features.push({type: 'Feature', geometry: g, properties: ps});
				for (var p in ps){
					columns[p] = getColumnType(ps[p]);
				}
			}
			if(selectedShape.Features.length > 0){
				for(var c in columns){
					selectedShape.Columns.push({Name: c, Type: columns[c]});
				}
				shapes.selected = selectedShape;
			}
		}

		if(dif && this._hasSearchGeometry()){
			var ss = [];
			var searchShape = {
				Filename: 'search',
				Formats: ['shape','tab'],
				Features: [],
				Columns: []
			};

			for (var id in this._searchGeometries){
				var g = rd.read(this._geometryToGeoJSON(this._searchGeometries[id]));
				ss.push(g);
				if(rs.length == 0){
					searchShape.Features.push({type: 'Feature', geometry: g, properties: {}});
				}
			}

			var wr = new jsts.io.GeoJSONWriter();
			var searchGeometries = "MakeValid(GeometryFromGeoJson('" + JSON.stringify(wr.write(new jsts.geom.GeometryCollection(ss))) + "', 4326))";
			if (rs.length > 0) {
				var resultGeometries = "MakeValid(GeometryFromGeoJson('" + JSON.stringify(wr.write(new jsts.geom.GeometryCollection(rs))) + "', 4326))";
				sendCrossDomainPostRequest(
					'http://maps.kosmosnimki.ru/Calculator',
					{WrapStyle: 'message', query: "(" + searchGeometries + ") - (" + resultGeometries + ")"},
					function(data){

						if (data.Status == 'ok') {

							shapes.diff = {
								Filename: 'difference',
								Formats: ['shape','tab'],
								Features: [{
									type: 'Feature',
									geometry: this._geometryToGeoJSON(data.Result),
									properties: {}
								}],
								Columns: []
							};
							def.resolve(shapes);
						}
						else {
							def.reject();
						}
					}.bind(this)
				);
			}
			else {
				shapes.diff = searchShape;
				def.resolve (shapes);
			}
		}
		else {
			def.resolve (shapes);
		}

		return def;
	},

	set_Selected: function(items){
		this._selectedItems = items;
	},

    get_TreeView: function() {
        return this._treeView;
    },

    set_onClearClicked: function(handler) {
        this._onClearClicked = handler;
    },

	_hasResults: function(){
		return (
			!!(this._searchResults && this._searchResults.length) ||
			!!(this._catalogResults && this._catalogResults.length) ||
			!!(this._rlImagesResults && this._rlImagesResults.length) ||
			!!(this._rlSheetsResults && this._rlSheetsResults.length));
	},

	_map: function(a, f){
		if(typeof f == 'function') {
			var r = [];
			for(var i = 0, len = a.length; i < len; i++){
				r.push(f(a[i]));
			}
			return r;
		}
		else {
			return a;
		}
	},

	_fixRLResult: function(data){
		data.geometry = L.gmxUtil.geometryToGeoJSON(data.geometry, true);
		data.geometry.type = data.geometry.type.toUpperCase();
		return data;
	},

	_disableGeometryOperations: function(disabled){
		this._view.find('button').attr('disabled', disabled);
		this._view.find('.non-covered *').attr('disabled', disabled);
		this._nonCoveredHandle.prop('checked', false);
	},

	set_SearchResults: function(result){
		this._searchResults = result;
		this._disableGeometryOperations(!this._hasResults());
	},

	set_CatalogResults: function(result){
		this._catalogResults = result;
		this._disableGeometryOperations(!this._hasResults());
	},

	set_RLSheetsResults: function(result){
		this._rlSheetsResults = this._map(result, this._fixRLResult.bind(this));
		this._disableGeometryOperations(!this._hasResults());
	},

	set_RLImagesResults: function(result){
		this._rlImagesResults = this._map(result, this._fixRLResult.bind(this));
		this._disableGeometryOperations(!this._hasResults());
	},

  _clearClicked: function() {
    if (this._onClearClicked) {
      this._onClearClicked();
    }
    this._searchResults = null;
    this._catalogResults = null;
    this._rlSheetsResults = null;
    this._rlImagesResults = null;

    if(this._nonCoveredDrawing){
      this._nonCoveredDrawing.remove();
      this._nonCoveredDrawing = null;
    }

    this._disableGeometryOperations(true);
  }
}
