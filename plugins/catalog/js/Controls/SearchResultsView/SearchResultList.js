var SearchResultList = L.Control.extend({

	options:{
		position: 'topright',
		insertBefore: false,
		addBefore: 'zoom'
	},

	initialize: function(mapObjectsHelper, shapeFileController, waitingDialog, options){
		this._mapObjectsHelper = mapObjectsHelper;
		this._shapeFileController = shapeFileController;
		this._waitingDialog = waitingDialog;
		$(this._mapObjectsHelper).on('geometry:change', this._geometryChange.bind(this));
		this._searchResults = [];
		this._catalogResults = [];
		this._rlImagesResults = [];
		this._rlSheetsResults = [];
		L.Util.setOptions(this, options);
	},


	addTo: function(map){
		this._map = map;

		var container = this._container = this.onAdd(map),
		    pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		L.DomUtil.addClass(container, 'leaflet-control');

		if (this.options.insertBefore && this.options.position == 'topleft') {
			var c = map.gmxControlsManager.get(this.options.addBefore);
			corner.insertBefore(container, c ? c.getContainer() : corner.firstChild);
		} else {
			corner.appendChild(container);
		}

		$(corner).css('z-index', 0);

		return this;
	},

	onAdd: function(map){
		this.$container = $('<div></div>').addClass('search-results-section').on('mousewheel', function(e){
			e.stopPropagation();
		});

		var $header = $('<div></div>')
			.addClass('images-search-section-header')
			.appendTo(this.$container);

		$('<span></span>',{text: 'Результаты поиска'}).appendTo($header);

		this.$btnDownload = $('<button></button>')
			.attr('disabled', true)
			.addClass('results-images-download')
			.appendTo($header);

		$('<span></span>',{text: 'Скачать'})
			.click(this._downloadShapeFile.bind(this))
			.appendTo(this.$btnDownload);

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

		this.$btnOptions = $('<img />',{src: gmxCore.getModulePath('Catalog') + 'img/preferences.png', alt:'', width: '12px', height: '12px'})
			.popover({
				title: 'Параметры',
				content: html,
				html: true
			})
			.on('shown.bs.popover',function(e){
				$(e.target).parent().find('.popover-content input[type="checkbox"]')
					.each(function(){
						var target = $(this);
						var k = target.val();
						var disable = false;
						target.prop('checked', _that._downloadOptions[k].checked);
						switch (k) {
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
			});
		}).appendTo(this.$btnDownload);

		var $btnClear = $('<div></div>',{text: 'Очистить'}).addClass('search-results-clear').click(this._clearClicked.bind(this)).appendTo($header);

		this.$collapser = $('<div></div>')
			.addClass('collapse-toggler')
			.addClass('expanded')
			.click(this._toggleCollapsed.bind(this))
			.appendTo($header);

		$('<div></div>').addClass('clear').appendTo(this.$container);

		this.$contentContainer = $('<div></div>').addClass('search-results-content').appendTo(this.$container);

		var $nonCovered = $('<div></div>').addClass('non-covered').appendTo(this.$container);

		this.$nonCoveredHandle = $('<input/>',{id: 'non_covered', type: 'checkbox'})
			.click(this._refreshNonCovered.bind(this))
			.appendTo($nonCovered);

		$('<label></label>',{'for':'non_covered',text:'Непокрытая площадь'}).appendTo($nonCovered);

		$('<span></span>').appendTo($nonCovered);

		$('<img/>',{alt:'', src: gmxCore.getModulePath('Catalog') + 'img/refresh.png',title:'Обновить', width: '16px', height: '16px'})
			.addClass('non-covered-refresh')
			.click(this._refreshNonCovered.bind(this))
			.appendTo($nonCovered);

		$('<img/>',{alt:'',src: gmxCore.getModulePath('Catalog') + 'img/polygon_tool_a.png',title:'Поиск', width: '16px', height: '16px'})
			.addClass('non-covered-convert')
			.click(this._searchNonCovered.bind(this))
			.appendTo($nonCovered);

		this.$container.find('.non-covered *').attr('disabled',true);
		this._nonCoveredDrawing = null;
		this._treeView = new TreeViewController(this.$contentContainer);
		return this.$container.get(0);
	},

	_disableGeometryOperations: function(disabled){
		this.$btnDownload.attr('disabled', disabled);
		this.$container.find('.non-covered *').attr('disabled', disabled);
	},

	_clearClicked: function() {
		$(this).trigger('clear');

		this._searchResults = null;
		this._catalogResults = null;
		this._rlSheetsResults = null;
		this._rlImagesResults = null;

		if(this._nonCoveredDrawing) {
			this._mapController.removeObject (this._nonCoveredDrawing);
			this._nonCoveredDrawing = null;
		}

		this._disableGeometryOperations(true);
	},

	_toggleCollapsed: function () {
		if (this.$collapser.hasClass('collapsed')) {
			this.$collapser.removeClass('collapsed');
			this.$collapser.addClass('expanded');
			this.$contentContainer.show();
		} else {
			this.$collapser.addClass('collapsed');
			this.$collapser.removeClass('expanded');
			this.$contentContainer.hide();
		}
	},

	// _showNonCovered: function(e){
	// 	var t = $(e.target);
	// 	if(!this._nonCoveredDrawing){
	// 		this._refreshNonCovered();
	// 	}
	// 	else {
	// 		var checked = !!this.$nonCoveredHandle.prop('checked');
	// 		if(checked) {
	// 			this._mapObjectsHelper.addObject(this._nonCoveredDrawing);
	// 		}
	// 		else {
	// 			this._mapObjectsHelper.removeObject(this._nonCoveredDrawing);
	// 		}
	// 	}
	// },
	//
	// hideNonCovered: function(){
	// 	this.$nonCoveredHandle.prop('checked', false);
	// 	if(this._nonCoveredDrawing){
	// 		this._mapObjectsHelper.removeObject(this._nonCoveredDrawing);
	// 	}
	// },

	_searchNonCovered: function(){
		if(!this.$nonCoveredHandle.attr('disabled')){
			if(this._nonCoveredDrawing){
				var g = this._nonCoveredDrawing.getGeometry();
				$(this).trigger('searchNonCovered', [g]);
			}
		}
	},

	_refreshNonCovered: function(){
		if(!this.$nonCoveredHandle.attr('disabled')){
			if(this._nonCoveredDrawing){
				this._mapObjectsHelper.removeObject(this._nonCoveredDrawing);
				this._nonCoveredDrawing = null;
			}
			this._getDownloadParams(true).then(function(shapes){
				if(shapes.diff && shapes.diff.Features.length > 0){
					var g = shapes.diff.Features[0].geometry;
					this._updateNonCoveredArea((L.gmxUtil.geoArea(g, false) / 1.0E+6).toFixed(3));
					var checked = !!this.$nonCoveredHandle.prop('checked');
					if(checked){
						var	polygon = this._mapObjectsHelper.createObject(g, {color: '#ff7f50', weight: 1, opacity: 1, fillColor: '#ff7f50', fillOpacity: 0.5});
						this._nonCoveredDrawing = polygon;
					}
				}
			}.bind(this));
		}
	},

	_updateNonCoveredArea: function(text){
		this.$container.find('.non-covered > span').text(text + ' кв. км');
	},

	_downloadShapeFile: function(selected) {
		this.$btnOptions.popover('hide');
		if(this._hasResults()) {
			var dif = this._downloadOptions['diff'].checked,
			res = this._downloadOptions['results'].checked,
			sel = selected || this._downloadOptions['selected'].checked;
			this._getDownloadParams(dif, res, sel)
				.then(function(shapes){
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
							if (filename.value == '')
							{
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
									}});

							$(canvas.parentNode).dialog("destroy")
							canvas.parentNode.removeNode(true);
						}.bind(this);

						_(canvas, [_div([_t(_gtxt("Введите имя файла для скачивания")), filename],[['css','textAlign','center']]), _div([btn],[['css','textAlign','center']])]);

						showDialog(_gtxt("Скачать shp-файл"), canvas, 240, 115, area.left + 150, area.top);
					}
				}.bind(this));
		}
		return false;
	},

	setSearchGeometries: function(geometries){
		this._searchGeometries = geometries || {};
	},

	_geometryChange: function(e, geometries){
		this.setSearchGeometries(geometries);
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
		return L.gmxUtil.geometryToGeoJSON(geometry, crs == 'mercator');
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

						if (data.Status == 'ok' && data.Result) {
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

	_hasResults: function(){
		return (
			!!(this._searchResults && this._searchResults.length) ||
			!!(this._catalogResults && this._catalogResults.length) ||
			!!(this._rlImagesResults && this._rlImagesResults.length) ||
			!!(this._rlSheetsResults && this._rlSheetsResults.length));
	},

	_m: function(a, f){
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

	set_SearchResults: function(result){
		this._searchResults = result;
		var isEmpty = !this._hasResults();
		if(isEmpty){
			$(this._container).hide();
		}
		else {
			$(this._container).show();
		}
		this._disableGeometryOperations(isEmpty);
	},

	set_CatalogResults: function(result){
		this._catalogResults = result;
		var isEmpty = !this._hasResults();
		if(isEmpty){
			$(this._container).hide();
		}
		else {
			$(this._container).show();
		}
		this._disableGeometryOperations(isEmpty);
	},

	set_RLSheetsResults: function(result){
		this._rlSheetsResults = this._m(result, this._fixRLResult.bind(this));
		var isEmpty = !this._hasResults();
		if(isEmpty){
			$(this._container).hide();
		}
		else {
			$(this._container).show();
		}
		this._disableGeometryOperations(isEmpty);
	},

	set_RLImagesResults: function(result){
		this._rlImagesResults = this._m(result, this._fixRLResult.bind(this));
		var isEmpty = !this._hasResults();
		if(isEmpty){
			$(this._container).hide();
		}
		else {
			$(this._container).show();
		}
		this._disableGeometryOperations(isEmpty);
	}

});
