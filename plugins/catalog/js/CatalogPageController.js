CatalogPageController = function(inits) {
	this._view = inits.View;
	this._currentScript = 0;
	this._path = inits.Path
	this._permalinkController = inits.PermalinkController
	this._scripts = [
		this._path + 'js/jquery/jquery.domec.min.js',
		this._path + 'js/jquery/jquery.maskedinput.min.js',
		this._path + 'js/AppCode/DelegatesChain.js',
		this._path + 'js/AppCode/Helpers/ScanexCatalogHelper.js',
		this._path + 'js/AppCode/UrlDataProvider.js',
		this._path + 'js/AppCode/DataAdapters/BaseDataAdapter.js',
		this._path + 'js/AppCode/DataAdapters/CatalogDataAdapter.js',
		this._path + 'js/AppCode/DataAdapters/SearchDataAdapter.js',
		this._path + 'js/AppCode/DataAdapters/RLImagesDataAdapter.js',
		this._path + 'js/AppCode/DataAdapters/RLSheetsDataAdapter.js',
		this._path + 'js/Controls/TreeView/TreeNode.js',
		this._path + 'js/Controls/TreeView/TreeViewController.js',
		this._path + 'js/Controls/SearchOptionsView/SearchOptionsViewController.js',
		this._path + 'js/Controls/SelectedImagesList/SelectedImagesListController.js',
		this._path + 'js/Controls/SearchResultsView/SearchResultList.js',
		// this._path + 'js/Controls/SearchResultsView/SearchResultsViewController.js',
		this._path + 'js/AppCode/Helpers/TreeHelper.js',
		this._path + 'js/AppCode/UrlProviders/CatalogUrlProvider.js',
		this._path + 'js/AppCode/UrlProviders/SearchUrlProvider.js',
		this._path + 'js/AppCode/UrlProviders/RLImagesUrlProvider.js',
		this._path + 'js/AppCode/UrlProviders/RLSheetsUrlProvider.js',
		this._path + 'js/AppCode/Helpers/MapObjectsHelper.js',
		this._path + 'js/AppCode/ShapeFileController.js',
		this._path + 'js/AppCode/Popover/popover.js',
		this._path + 'js/Controls/RangeControl/RangeControl.js',
		this._path + 'js/jsts/javascript.util.js',
		this._path + 'js/jsts/jsts.js',
		this._path + 'js/tristate/tristate.js'
	];
	this._waitingDialog = null;
	this._searchOptionsController = null;
	this._selectedImagesController = null;
	this._dataProvider = null;
	this._urlProviders = []
	this._dataAdapters = [];
	this._treeView = inits.TreeView;
	this._tabsController = null;
	this._currentSearchCriteria = null;
	this._shapeFileController = null;
	this._mapController = inits.Map;
	this._callback = inits.callback;
	this._initialize();
}

CatalogPageController.prototype = {

	_initialize: function() {
		var that = this;
		$LAB.script(this._path + 'js/AppCode/Extensions.js').wait(function() { return that._loadWaitingDialogScript.call(that); });
	},

	_loadWaitingDialogScript: function() {
		$.getCSS(this._path + 'catalog.css');
		$.getCSS(this._path + 'js/Controls/PeriodSelector/PeriodSelector.css');
		$.getCSS(this._path + 'js/Controls/LoaderDialog/LoaderDialog.css');
		$LAB.script(this._path + 'js/Controls/LoaderDialog/LoaderDialogController.js').wait(this._initializeWaitingDialog.bind(this));
	},

	_initializeWaitingDialog: function() {
		this._waitingDialog = new LoaderDialogController();
		this._waitingDialog.open('Загрузка', 'Загрузка скриптов...');
		setTimeout(this._initializeScripts.bind(this), 10);
	},

	_initializeScripts: function() {
		if (this._currentScript >= this._scripts.length) {
			this._waitingDialog.setMessage('Почти готово...');
			setTimeout(this._initializeStep1.bind(this), 10);
		} else {
			++this._currentScript;
			$LAB.script(this._scripts[this._currentScript-1]).wait(this._initializeScripts.bind(this));
		}
	},

	_initializeStep1: function() {
		$.getCSS(this._path + 'js/Controls/SearchOptionsView/SearchOptionsView.css');
		$.getCSS(this._path + 'js/Controls/SelectedImagesList/SelectedImagesList.css');
		$.getCSS(this._path + 'js/Controls/SearchResultsView/SearchResultsView.css');
		$.getCSS(this._path + 'js/AppCode/Popover/popover.css');
		$.getCSS(this._path + 'js/Controls/RangeControl/RangeControl.css');

		var divs = $('<div id="catalogSearchOptions"></div><div id="catalogSelectedImages"></div><div id="catalogSearchResults"></div>');
		$(this._view).append(divs);
		this._shapeFileController = new ShapeFileController(this._mapController);

		this._treeHelper = new TreeHelper();
		this._mapObjectsHelper = new MapObjectsHelper(this._mapController, this._treeHelper);

		//	this._resultsView = new SearchResultsViewController(
				// divs.filter('#catalogSearchResults'), { shapeFileController: this._shapeFileController, mapObjectsHelper: this._mapObjectsHelper, waitingDialog: this._waitingDialog });
		//	this._resultsView.set_onClearClicked(this._clearSearchResults.bind(this));

		this._resultList = new SearchResultList(
		this._mapObjectsHelper,
		this._shapeFileController,
		this._waitingDialog, {position: 'left', insertBefore: false, addBefore: 'hide'});

		$(this._resultList)
			.on('clear', this._clearSearchResults.bind(this))
			.on('searchNonCovered', function(e, g){
				this._performSearch([g]);
			}.bind(this));

		this._mapController.addControl(this._resultList);

		this._treeView = this._resultList.get_TreeView();
		this._treeView.set_onNodeClick(this._nodeClick.bind(this));
		this._treeView.set_onNodeDblClick(this._nodeDblClick.bind(this));
		this._treeView.set_onNodeCheckedChanged(this._nodeCheckedChanged.bind(this));

		this._dataProvider = new UrlDataProvider();
		this._dataProvider.set_onLoadFailed(this._dataLoadFailed.bind(this));

		this._urlProviders['catalog'] = new CatalogUrlProvider();
		this._dataAdapters['catalog'] = new CatalogDataAdapter();
		this._urlProviders['search'] = new SearchUrlProvider();
		this._dataAdapters['search'] = new SearchDataAdapter();
		this._urlProviders['rl_sheets'] = new RLSheetsUrlProvider();
		this._dataAdapters['rl_sheets'] = new RLSheetsDataAdapter();
		this._urlProviders['rl_images'] = new RLImagesUrlProvider();
		this._dataAdapters['rl_images'] = new RLImagesDataAdapter();

		this._searchOptionsController = new SearchOptionsViewController(divs.filter('#catalogSearchOptions'), this._path);
		this._searchOptionsController.set_onSearchClick(this._performSearch.bind(this));

		this._selectedImagesController = new SelectedImagesListController(
			divs.filter('#catalogSelectedImages'),
			{
				catalogPageController: this,
				mapController: this._mapController,
				mapObjectsHelper: this._mapObjectsHelper,
				shapeFileController: this._shapeFileController,
				searchResultViewController: this._resultList
			});

		this._permalinkController._initialize({
			PageController: this,
			MapObjectsHelper: this._mapObjectsHelper,
			SelectedImagesController: this._selectedImagesController,
			SearchOptionsController: this._searchOptionsController,
			UrlProviders: this._urlProviders
		});

		if(this._callback) {
			this._callback();
		}

		this._waitingDialog.close();
	},

	removeControls: function(){
		this._mapController.removeControl(this._resultList);
	},

	_clearSearchResults: function() {
		this._removeMapObjects(this._treeView.get_rootNode());
		this._treeView.empty();
		this._selectedImagesController.enableAll();
	},

	_performSearch: function(geometries) {
		this._resultList.set_CatalogResults([]);
		this._resultList.set_SearchResults([]);
		this._resultList.set_RLImagesResults([]);
		this._resultList.set_RLSheetsResults([]);

		this._currentSearchCriteria = this._searchOptionsController.get_searchCriteria();
		if (!this._validateSearchCriteria(this._currentSearchCriteria)) {
			return false;
		}
		if (geometries != null && geometries.length > 0) {
			this._currentSearchCriteria.searchGeometry = geometries;
		}
		else {
			this._updateSearchGeometry(this._currentSearchCriteria);
		}

		this._waitingDialog.open('Подождите', 'Удаление объектов карты...');
		var root = this._treeView.get_rootNode();
		var jobChain = new DelegatesChain();
		var that = this;
		for (var nodeKey in root.children) {
			jobChain.add((function(node) {
				return function() { that._removeMapObjects(node); };
			})(root.children[nodeKey]));
		}
		jobChain.add(function() { this._treeView.empty(); }.bind(this));
		jobChain.add(function() { this._waitingDialog.open('Подождите', 'Загрузка данных...'); }.bind(this));
		jobChain.add(function() { this._requestCatalogData(this._currentSearchCriteria); }.bind(this));
		jobChain.execute();
	},

	_validateSearchCriteria: function(searchCriteria) {
		if (searchCriteria.useDate && !searchCriteria.dateStart) {
			alert('Начальная дата поиска задана неверно.');
			return false;
		}
		if (searchCriteria.useDate && !searchCriteria.dateEnd) {
			alert('Конечная дата поиска задана неверно.');
			return false;
		}
		if (!searchCriteria.queryType || (searchCriteria.useDate && searchCriteria.dateStart.valueOf() > searchCriteria.dateEnd.valueOf())) {
			alert('Параметры поиска заданы неверно.');
			return false;
		}
		return true;
	},

	_requestCatalogData: function(searchCriteria) {
		if (searchCriteria.scanexSatellites && this._urlProviders['catalog'].getSatellitesIDs(searchCriteria).length) {
			var box =
				this._mapController.getZ() <= 4 && !searchCriteria.searchGeometry.length ? null : searchCriteria.searchBox;
			this._dataProvider.loadDataJSONP(
				box ? this._urlProviders['catalog'].getBoxSourceUrl(searchCriteria) : this._urlProviders['catalog'].getPeriodSourceUrl(searchCriteria),
				function(data) {
					var jobChain = new DelegatesChain();
					jobChain.add(function() {
						this._waitingDialog.setMessage('Обработка данных...');
					}.bind(this));

					jobChain.add(function() {
						if (data.Status == 'ok' && data.Result == 'exceeds') {
							this._tooMuchData('Catalog');
							this._requestSearchData(searchCriteria);
							return;
						}
						this._dataAdapters['catalog'].adaptTreeData(
							data.Result,
							this._treeView.get_rootNode(),
							box,
							function() { this._requestSearchData(searchCriteria); }.bind(this)
						);
						this._resultList.set_CatalogResults(data.Result);
					}.bind(this));

					jobChain.execute();
				}.bind(this));
		}
		else if(searchCriteria.scanexSatellites && this._urlProviders['search'].getSatellitesIDs(searchCriteria).length){
			this._requestSearchData(searchCriteria);
		}
		else if(searchCriteria.rlImages){
			this._requestRLImagesData(searchCriteria);
		}
		else if(searchCriteria.rlSheets){
			this._requestRLSheetsData(searchCriteria);
		}
		else {
			this._parsingFinished(this._treeView.get_rootNode());
		}
	},

	_moveToView: function(objects){
		if(objects && objects.length) {
			var centerX = this._mapController.getCenter().lng;
			for (var i = 0, len = objects.length; i < len; i++){
				var obj = objects[i];
				var g = obj.geometry;
				switch(g.type.toUpperCase()){
					case 'POLYGON':
						this._movePolygonToView(g.coordinates[0], centerX);
						obj.x1 += this._moveLonToView(obj.x1, centerX);
						obj.x2 += this._moveLonToView(obj.x2, centerX);
						obj.x3 += this._moveLonToView(obj.x3, centerX);
						obj.x4 += this._moveLonToView(obj.x4, centerX);
						break;
					default:
						throw 'Unsupported geometry type';
				}
			}
		}
	},

	_movePolygonToView: function(coordinates, viewX){
		for(var i = 0; i < coordinates.length; i++){
			coordinates[i][0] += this._moveLonToView(coordinates[i][0], viewX);
		}
	},

	_moveLonToView: function(x, viewX){
		var min = Math.abs(viewX - x);
		var diff = 0;
		var d = Math.abs(viewX - (x + 360));
		if(d < min){
			diff = 360;
			min = d;
		}
		if(Math.abs(viewX - (x - 360)) < min){
			diff = -360;
		}
		return diff;
	},

	_requestSearchData: function(searchCriteria) {
		if (searchCriteria.scanexSatellites && this._urlProviders['search'].getSatellitesIDs(searchCriteria).length) {
			var callback = function(data) {
				var jobChain = new DelegatesChain();

				jobChain.add(function() {
					this._waitingDialog.setMessage('Обработка данных...');
				}.bind(this));

				jobChain.add(function() {
					if (data.Status == 'ok' && data.Result == 'exceeds') {
						this._tooMuchData('Search');
						this._requestRLImagesData(searchCriteria);
						return;
					}
					this._moveToView(data.Result);
					this._dataAdapters['search'].adaptTreeData(
						data.Result,
						this._treeView.get_rootNode(),
						!searchCriteria.searchGeometry.length ? searchCriteria.searchBox : null,
						function() { this._requestRLImagesData(searchCriteria); }.bind(this)
					);
					this._resultList.set_SearchResults(data.Result);
				}.bind(this));

				jobChain.execute();
			}.bind(this)
			//this._dataProvider.loadDataJSONP(
			sendCrossDomainPostRequest(
				// this._urlProviders['search'].getPeriodSourceUrl(searchCriteria),
				this._urlProviders['search']._serviceUrl,
				this._urlProviders['search'].getPostParams(searchCriteria),
			callback);
		}
		else if(searchCriteria.rlImages){
			this._requestRLImagesData(searchCriteria);
		}
		else if(searchCriteria.rlSheets){
			this._requestRLSheetsData(searchCriteria);
		}
		else {
			this._parsingFinished(this._treeView.get_rootNode());
		}
	},

	_requestRLImagesData: function(searchCriteria) {
		if (searchCriteria.rlImages) {
			var callback = function(objects, satelliteId) {
				var jobChain = new DelegatesChain();
				jobChain.add(function() {
					this._waitingDialog.setMessage('Обработка данных...');
				}.bind(this));

				jobChain.add(function() {

					// if (data.Status == 'ok' && data.Result == 'exceeds') {
						// this._tooMuchData('Rli');
						// this._parsingFinished(this._treeView.get_rootNode());
						// return;
					// }

					console.log('_moveToView: Add support for multipolygons');
					// this._moveToView(objects);

					this._dataAdapters['rl_images'].adaptTreeData(
						{objects: objects, satelliteId: satelliteId},
						this._treeView.get_rootNode(),
						!searchCriteria.searchGeometry.length ? searchCriteria.searchBox : null,
						function() { this._requestRLSheetsData(searchCriteria); }.bind(this)
					);
					this._resultList.set_RLImagesResults(objects);
				}.bind(this));
				jobChain.execute();
			}.bind(this)

			var options = this._urlProviders['rl_images'].getRequestOptions(searchCriteria);
			_mapHelper.searchObjectLayer(options.layerName, options)
				.then(function(objects){
					callback(objects, options.satelliteId);
				});
		}
		else if(searchCriteria.rlSheets){
			this._requestRLSheetsData(searchCriteria);
		}
		else {
			this._parsingFinished(this._treeView.get_rootNode());
		}
	},

	_requestRLSheetsData: function(searchCriteria) {
		if (searchCriteria.rlSheets) {
			var callback = function(objects, satelliteId) {

			var jobChain = new DelegatesChain();
			jobChain.add(function() {
				this._waitingDialog.setMessage('Обработка данных...');
			}.bind(this));

			jobChain.add(function() {
				// if (data.Status == 'ok' && data.Result == 'exceeds') {
					// this._tooMuchData('Rli');
					// this._parsingFinished(this._treeView.get_rootNode());
					// return;
				// }

				console.log('_moveToView: Add support for multipolygons');
				// this._moveToView(objects);

				this._dataAdapters['rl_sheets'].adaptTreeData(
					 {objects: objects, satelliteId: satelliteId},
					this._treeView.get_rootNode(),
					!searchCriteria.searchGeometry.length ? searchCriteria.searchBox : null,
					this._parsingFinished.bind(this)
				);
				this._resultList.set_RLSheetsResults(objects);
			}.bind(this));
			jobChain.execute();
		}.bind(this)

		var options = this._urlProviders['rl_sheets'].getRequestOptions(searchCriteria);
		_mapHelper.searchObjectLayer(options.layerName, options)
			.then(function(objects){
				callback(objects, options.satelliteId);
			});
		} else {
			this._parsingFinished(this._treeView.get_rootNode());
		}
	},

	_onOptionsButtonClicked: function() {
		this._searchOptionsController.open();
	},

	_removeMapObjects: function(node) {
		node.parent = null;
		if (node.type == 'GroundOverlay') {
			var mapObjects = node.data.mapObjects;
			if (!node.data.isSelected){
				if (mapObjects.polygon) {
					this._mapController.removeLayer(mapObjects.polygon);
				}
				if (mapObjects.overlay) {
					this._mapController.removeLayer(mapObjects.overlay);
				}
				if (mapObjects.infoIcon) {
					this._mapController.removeLayer(mapObjects.infoIcon);
				}
				if (mapObjects.infoBalloon) {
					this._mapController.removeLayer(mapObjects.infoBalloon);
				}
			} else {
				if (mapObjects.polygon) {
					this._mapController.addLayer(mapObjects.polygon);
				}
			}
		}
		for (var childKey in node.children) {
			this._removeMapObjects(node.children[childKey]);
		}
	},

	_dataLoadFailed: function() {
		this._waitingDialog.close();
		alert('Error loading data!');
	},

	_parsingFinished: function(node) {

		var jobChain = new DelegatesChain();
		jobChain.add(function() {
			this._waitingDialog.setMessage('Добавление объектов карты...');
		}.bind(this));

		jobChain.add(function() {
			this._treeView.updateNode(node, function(chain) {
				if (chain.batchList) {
					var _this = this;
					chain.batchList.nodes.map(function(node, index) {
						_this._mapObjectsHelper.createPolygon(node, _this._polygonClicked.bind(_this));
					});
					this._waitingDialog.close();
				}
				else{
					this._waitingDialog.close();
					alert('Ничего не найдено.\nПожалуйста, измените настройки поиска.');
				}
			}.bind(this));
			this._selectedImagesController.enableAll();
			this._selectedImagesController.mergeNodesList(node.children);
		}.bind(this));
		jobChain.execute();
	},

	_nodeClick: function(node) {
		if (node.type != 'GroundOverlay') {
			var hitarea = this._treeHelper.ensureHitArea(node);
			hitarea.click();
		}
	},

	_nodeDblClick: function(node) {
		var rd = new jsts.io.GeoJSONReader();
		var q = node.data.latLonQuad.coordinates;
		var g = rd.read({
			type: 'Polygon',
			coordinates: [
				[
					[q[0].latitude,q[0].longitude],
					[q[1].latitude,q[1].longitude],
					[q[2].latitude,q[2].longitude],
					[q[3].latitude,q[3].longitude],
					[q[0].latitude,q[0].longitude]
				]
			]
		});
		var coords = g.getEnvelope().getCoordinates();
		var sw = L.latLng(coords[3].x, coords[3].y);
		var ne = L.latLng(coords[1].x, coords[1].y);
		var bounds = L.latLngBounds(sw, ne);
		this._mapController.fitBounds(bounds);
		this._mapController.invalidateSize();		
	},

	_nodeCheckedChanged: function(node, tasksChain) {
		if (node.type == 'GroundOverlay') {
			var that = this;
			var batchList = tasksChain == null ? null : (tasksChain.batchList || (tasksChain.batchList = { polygons: [], nodes: [] }));
			var task = (function(params) {
				return function() {
					if (params.node.isChecked) {
						if (!params.node.data.mapObjects.polygon) {
							if (batchList) {
								batchList.polygons.push(this._mapObjectsHelper.createPolygonGeometry(params.node));
								batchList.nodes.push(node);
							} else {
								this._mapObjectsHelper.createPolygon(params.node, this._polygonClicked.bind(this));
							}
						}
					}
					else {
						if(params.node.data.mapObjects.polygon) {
							this._mapController.removeLayer(params.node.data.mapObjects.polygon);
							params.node.data.mapObjects.polygon = null;
						}
					}
					this._updateOverlayVisibility(params.node, params.node.data.isOverlayVisible);
				}.bind(that);
			})({ 'node':node });
			if (tasksChain) {
				tasksChain.add(task);
			}
			else {
				task();
			}
		}
	},

	_polygonClicked: function(node) {
		this.toggleOverlayVisibility(node);
		if (node.parent) {
			if (node.data.isOverlayVisible) {
				// Add to selected list
				this._selectedImagesController.addNode(node);
			} else {
				// Remove from selected list
				this._selectedImagesController.removeNode(node.data.info.id);
			}
		} else {
			node.selectedUi.checkbox.prop('checked', node.data.isOverlayVisible);
		}
	},

	_updateOverlayVisibility: function(node, isVisible){
		if (isVisible && !node.data.mapObjects.overlay) {
			this._mapObjectsHelper.createGroundOverlay(node, this._polygonClicked.bind(this));
			this._mapObjectsHelper.createInfoIcon(node);
			if(node.data.mapObjects.polygon){
				node.data.mapObjects.polygon.bringToFront();
			}
		}
		else {
			if(node.data.mapObjects.overlay) {
				this._mapController.removeLayer(node.data.mapObjects.overlay);
				node.data.mapObjects.overlay = null;
				this._mapController.removeLayer(node.data.mapObjects.infoIcon);
				node.data.mapObjects.infoIcon = null;

			}
			if(node.data.mapObjects.polygon){
				node.data.mapObjects.polygon.bringToBack();
			}
		}
	},

	toggleOverlayVisibility: function(node) {
		node.data.isOverlayVisible = !node.data.isOverlayVisible;
		this._updateOverlayVisibility(node, node.data.isOverlayVisible);
	},

	_ensureOverlaysVisibility: function(node, isVisible, tasksChain) {
		if (node.type == 'GroundOverlay') {
			var that = this;
			var task = (function(params) {
				return function() {
					if (params.isVisible && params.node.isChecked) {
						if (!params.node.data.mapObjects.overlay) {
							this._mapObjectsHelper.createGroundOverlay(params.node);
							this._mapObjectsHelper.createInfoIcon(params.node);
						}
						else {
							this._mapController.addLayer(node.data.mapObjects.overlay);
							this._mapController.addLayer(node.data.mapObjects.infoIcon);
						}
					} else {
						if (params.node.data.mapObjects.overlay) {
							this._mapController.removeLayer(node.data.mapObjects.overlay);
						}
						if(params.node.data.mapObjects.infoIcon) {
							this._mapController.removeLayer(node.data.mapObjects.infoIcon);
						}
					}
				}.bind(that);
			})({ 'node':node, 'isVisible':isVisible });
			if (tasksChain) {
				tasksChain.add(task);
			}
			else {
				task();
			}
			return;
		}

		for (var childKey in node.children) {
			var childNode = node.children[childKey];
			this._ensureOverlaysVisibility(childNode, isVisible && childNode.isChecked, tasksChain);
		}
	},

	_tooMuchData: function(source) {
		alert(source + ':\nСлишком много снимков.\nПожалуйста, измените настройки поиска.');
	},

	_updateSearchGeometry: function(searchCriteria) {

		var searchBox,
				sg = {},
        searchGeometries = [];

    var lmap = nsGmx.leafletMap,
        features = lmap.gmxDrawing.getFeatures();
    if (features.length) {
				var feature = features[features.length - 1];
        var geojson = feature.toGeoJSON(),
            g = geojson.geometry,
            bbox = L.gmxUtil.getGeometryBounds(g);
        searchBox = [bbox.min.x, bbox.min.y, bbox.max.x, bbox.max.y];
        searchGeometries.push(g);
				sg[feature._leaflet_id] = g;
    } else {
        searchBox = lmap.getBounds().toBBoxString().split(',');
    }

		this._resultList.setSearchGeometries(sg);

		searchCriteria.searchBox = searchBox;
		searchCriteria.searchGeometry = searchGeometries;

	}
}
