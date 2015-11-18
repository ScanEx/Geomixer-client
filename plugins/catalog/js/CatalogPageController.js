var nsCatalog = nsCatalog || {};
nsCatalog.Controls = nsCatalog.Controls || {};

(function($){

	var CatalogPage = function(view, map, mapHelper, treeHelper, shapeFileController, resultList, dataSources, userInfo, path, waitingDialog) {
		this._view = view;
		this._currentScript = 0;
		this._path = path;
		this._tabsController = null;
		this._shapeFileController = shapeFileController;
		this._map = map;
		this._mapHelper = mapHelper;
		this._treeHelper = treeHelper;
		this._userInfo = userInfo;
		this._dataSources = dataSources;
		this._resultList = resultList;
		this._waitingDialog = waitingDialog;
		this._initialize();
	};

	CatalogPage.prototype._initialize = function() {
		var divs = $('<div id="catalogSearchOptions"></div><div id="catalogSelectedImages"></div><div id="catalogSearchResults"></div>');
		$(this._view).append(divs);

		$(this._resultList)
		.on('clear', this._clearSearchResults.bind(this))
		.on('searchNonCovered', function(e, geometries){
			this._performSearch(geometries);
		}.bind(this));

		this._map.addControl(this._resultList);

		this._treeView = this._resultList.treeView;
		$(this._treeView)
		.on('click', this._nodeClick.bind(this))
		.on('dblclick', this._nodeDblClick.bind(this))
		.on('checked', this._nodeCheckedChanged.bind(this))
		.on('mouseover', this._nodeMouseOver.bind(this))
		.on('mouseout', this._nodeMouseOut.bind(this));

		// for (var id in this._dataSources) {
		// 	$(this._dataSources[id]).on('result', function(e, nodes){
		// 		nodes.map(function(node){
		// 			this._mapHelper.createPolygon(node, this._polygonClicked.bind(this));
		// 		}.bind(this));
		// 	}.bind(this));
		// }

		// this._dataProvider = new UrlDataProvider();
		// this._dataProvider.set_onLoadFailed(this._dataLoadFailed.bind(this));
		//
		// this._urlProviders['catalog'] = new CatalogUrlProvider();
		// this._dataAdapters['catalog'] = new CatalogDataAdapter();
		// this._urlProviders['search'] = new SearchUrlProvider();
		// this._dataAdapters['search'] = new SearchDataAdapter();
		// this._urlProviders['rl_sheets'] = new RLSheetsUrlProvider();
		// this._dataAdapters['rl_sheets'] = new RLSheetsDataAdapter();
		// this._urlProviders['rl_images'] = new RLImagesUrlProvider();
		// this._dataAdapters['rl_images'] = new RLImagesDataAdapter();

		nsCatalog.SearchOptionsView = new nsCatalog.Controls.SearchOptionsView(
			divs.filter('#catalogSearchOptions'), this._path, this._userInfo, this._dataSources);
		this._searchOptionsView = nsCatalog.SearchOptionsView;
		$(this._searchOptionsView)
		.on('search', this._performSearch.bind(this));

		this.searchOptionsView = nsCatalog.SearchOptionsView;

		nsCatalog.SelectedImagesView = new nsCatalog.Controls.SelectedImagesView(
			divs.filter('#catalogSelectedImages'), this._map, this._mapHelper,
			this, this._shapeFileController, this._resultList);

		this.selectedImagesView = nsCatalog.SelectedImagesView;
	};

	CatalogPage.prototype.removeControls = function(){
		this._map.removeControl(this._resultList);
	};

	CatalogPage.prototype._clearSearchResults = function() {
		this.selectedImagesView.enableAll();
	};

	CatalogPage.prototype._performSearch = function(geometries) {

		var def = new $.Deferred();

		var tasks = new nsCatalog.DelegatesChain();

		var validationErrors = [];
		var dsCount = 0;
		var searchOptions = this._searchOptionsView.getSearchOptions();
		var ts = Object.keys(this._dataSources).map(function(k){
			return this._dataSources[k];
		}.bind(this))
		.filter(function(ds){
			return ds.checked && ds.validateSearchOptions(searchOptions, validationErrors);
		})
		.map(function(ds){
			++dsCount;
			return function(){
				ds.search(searchOptions)
					.done(function(response){
						switch (response.status) {
							case 'exceeds':
								alert(ds.title + ':\r\nСлишком много снимков.\r\nПожалуйста, измените настройки поиска.');
								break;
							case 'nothing':
								alert(ds.title + ':\r\nНичего не найдено.\r\nПожалуйста, измените настройки поиска.');
								break;
							default:
								break;
						}
						if(--dsCount == 0){
							this._waitingDialog.close();
							def.resolve();
						}
					}.bind(this));
			}.bind(this);
		}.bind(this));

		if(ts.length > 0){
			ts.forEach(function(t){
				tasks.add(t);
			});
			this._waitingDialog.open();
			tasks.execute();
		}
		else if(validationErrors.length > 0){
			alert(validationErrors.join('\r\n'));
			def.reject();
		}

		// for (var id in this._dataSources) {
		// 	var ds = nsCatalog.DataSources[id];
		// 	if(ds.checked) {
		//
		// 		if(ds.validateSearchOptions(searchOptions, validationErrors)) {
		// 			++dsCount;
		// 			var f = function(dataSource){
		// 				return function () {
		// 					dataSource.search(searchOptions).done(function(response){
		// 						switch (response.status) {
		// 							case 'exceeds':
		// 								alert(dataSource.title + ':\r\nСлишком много снимков.\r\nПожалуйста, измените настройки поиска.');
		// 								break;
		// 							case 'nothing':
		// 								alert(dataSource.title + ':\r\nНичего не найдено.\r\nПожалуйста, измените настройки поиска.');
		// 								break;
		// 							default:
		// 								break;
		// 						}
		// 						if(--dsCount == 0){
		// 							this._waitingDialog.close();
		// 							def.resolve();
		// 						}
		// 					}.bind(this));
		// 				}.bind(this);
		// 			}.bind(this);
		// 			tasks.add(f(ds));
		// 		}
		// 	}
		// }

		// this._resultList.set_CatalogResults([]);
		// this._resultList.set_SearchResults([]);
		// this._resultList.set_RLImagesResults([]);
		// this._resultList.set_RLSheetsResults([]);
		//
		// this._currentSearchCriteria = this._searchOptionsView.get_searchCriteria();
		// if (!this._validateSearchCriteria(this._currentSearchCriteria)) {
		// 	return false;
		// }
		// if (geometries != null && geometries.length > 0) {
		// 	this._currentSearchCriteria.searchGeometry = geometries;
		// }
		// else {
		// 	this._updateSearchGeometry(this._currentSearchCriteria);
		// }
		//
		// this._waitingDialog.open('Подождите', 'Удаление объектов карты...');
		// var root = this._treeView.get_rootNode();
		// var jobChain = new nsCatalog.DelegatesChain();
		// var that = this;
		// for (var nodeKey in root.children) {
		// 	jobChain.add((function(node) {
		// 		return function() { that._removeMapObjects(node); };
		// 	})(root.children[nodeKey]));
		// }
		// jobChain.add(function() { this._treeView.empty(); }.bind(this));
		// jobChain.add(function() { this._waitingDialog.open('Подождите', 'Загрузка данных...'); }.bind(this));
		// jobChain.add(function() { this._requestCatalogData(this._currentSearchCriteria); }.bind(this));
		// jobChain.execute();

		return def;
	};

	// CatalogPage.prototype._validateSearchCriteria = function(searchCriteria) {
	// 	if (searchCriteria.useDate && !searchCriteria.dateStart) {
	// 		alert('Начальная дата поиска задана неверно.');
	// 		return false;
	// 	}
	// 	if (searchCriteria.useDate && !searchCriteria.dateEnd) {
	// 		alert('Конечная дата поиска задана неверно.');
	// 		return false;
	// 	}
	// 	if (!searchCriteria.queryType || (searchCriteria.useDate && searchCriteria.dateStart.valueOf() > searchCriteria.dateEnd.valueOf())) {
	// 		alert('Параметры поиска заданы неверно.');
	// 		return false;
	// 	}
	// 	return true;
	// };

	// CatalogPage.prototype._requestCatalogData = function(searchCriteria) {
	// 	if (searchCriteria.scanexSatellites && this._urlProviders['catalog'].getSatellitesIDs(searchCriteria).length) {
	// 		var box =
	// 		this._map.getZ() <= 4 && !searchCriteria.searchGeometry.length ? null : searchCriteria.searchBox;
	// 		this._dataProvider.loadDataJSONP(
	// 			box ? this._urlProviders['catalog'].getBoxSourceUrl(searchCriteria) : this._urlProviders['catalog'].getPeriodSourceUrl(searchCriteria),
	// 			function(data) {
	// 				var jobChain = new DelegatesChain();
	// 				jobChain.add(function() {
	// 					this._waitingDialog.setMessage('Обработка данных...');
	// 				}.bind(this));
	//
	// 				jobChain.add(function() {
	// 					if (data.Status == 'ok' && data.Result == 'exceeds') {
	// 						this._tooMuchData('Catalog');
	// 						this._requestSearchData(searchCriteria);
	// 						return;
	// 					}
	// 					this._dataAdapters['catalog'].adaptTreeData(
	// 						data.Result,
	// 						this._treeView.root,
	// 						box,
	// 						function() { this._requestSearchData(searchCriteria); }.bind(this)
	// 					);
	// 					this._resultList.set_CatalogResults(data.Result);
	// 				}.bind(this));
	//
	// 				jobChain.execute();
	// 			}.bind(this));
	// 		}
	// 		else if(searchCriteria.scanexSatellites && this._urlProviders['search'].getSatellitesIDs(searchCriteria).length){
	// 			this._requestSearchData(searchCriteria);
	// 		}
	// 		else if(searchCriteria.rlImages){
	// 			this._requestRLImagesData(searchCriteria);
	// 		}
	// 		else if(searchCriteria.rlSheets){
	// 			this._requestRLSheetsData(searchCriteria);
	// 		}
	// 		else {
	// 			this._parsingFinished(this._treeView.root);
	// 		}
	// 	};

	// CatalogPage.prototype._moveToView = function(objects){
	// 	if(objects && objects.length) {
	// 		var centerX = this._map.getCenter().lng;
	// 		for (var i = 0, len = objects.length; i < len; i++){
	// 			var obj = objects[i];
	// 			var g = obj.geometry;
	// 			switch(g.type.toUpperCase()){
	// 				case 'POLYGON':
	// 					this._movePolygonToView(g.coordinates[0], centerX);
	// 					obj.x1 += this._moveLonToView(obj.x1, centerX);
	// 					obj.x2 += this._moveLonToView(obj.x2, centerX);
	// 					obj.x3 += this._moveLonToView(obj.x3, centerX);
	// 					obj.x4 += this._moveLonToView(obj.x4, centerX);
	// 					break;
	// 				default:
	// 					throw 'Unsupported geometry type';
	// 			}
	// 		}
	// 	}
	// };
	//
	// CatalogPage.prototype._movePolygonToView = function(coordinates, viewX){
	// 	for(var i = 0; i < coordinates.length; i++){
	// 		coordinates[i][0] += this._moveLonToView(coordinates[i][0], viewX);
	// 	}
	// };
	//
	// CatalogPage.prototype._moveLonToView = function(x, viewX){
	// 	var min = Math.abs(viewX - x);
	// 	var diff = 0;
	// 	var d = Math.abs(viewX - (x + 360));
	// 	if(d < min){
	// 		diff = 360;
	// 		min = d;
	// 	}
	// 	if(Math.abs(viewX - (x - 360)) < min){
	// 		diff = -360;
	// 	}
	// 	return diff;
	// };

// CatalogPage.prototype._requestSearchData = function(searchCriteria) {
// 	if (searchCriteria.scanexSatellites && this._urlProviders['search'].getSatellitesIDs(searchCriteria).length) {
// 		var callback = function(data) {
// 			var jobChain = new DelegatesChain();
//
// 			jobChain.add(function() {
// 				this._waitingDialog.setMessage('Обработка данных...');
// 			}.bind(this));
//
// 			jobChain.add(function() {
// 				if (data.Status == 'ok' && data.Result == 'exceeds') {
// 					this._tooMuchData('Search');
// 					this._requestRLImagesData(searchCriteria);
// 					return;
// 				}
// 				this._moveToView(data.Result);
// 				this._dataAdapters['search'].adaptTreeData(
// 					data.Result,
// 					this._treeView.rootNode,
// 					!searchCriteria.searchGeometry.length ? searchCriteria.searchBox : null,
// 					function() { this._requestRLImagesData(searchCriteria); }.bind(this)
// 				);
// 				this._resultList.set_SearchResults(data.Result);
// 			}.bind(this));
//
// 			jobChain.execute();
// 		}.bind(this)
// 		//this._dataProvider.loadDataJSONP(
// 		sendCrossDomainPostRequest(
// 			// this._urlProviders['search'].getPeriodSourceUrl(searchCriteria),
// 			this._urlProviders['search']._serviceUrl,
// 			this._urlProviders['search'].getPostParams(searchCriteria),
// 			callback);
// 		}
// 		else if(searchCriteria.rlImages){
// 			this._requestRLImagesData(searchCriteria);
// 		}
// 		else if(searchCriteria.rlSheets){
// 			this._requestRLSheetsData(searchCriteria);
// 		}
// 		else {
// 			this._parsingFinished(this._treeView.root);
// 		}
// 	};

	// CatalogPage.prototype._requestRLImagesData = function(searchCriteria) {
	// 	if (searchCriteria.rlImages) {
	// 		var callback = function(objects, satelliteId) {
	// 			var jobChain = new DelegatesChain();
	// 			jobChain.add(function() {
	// 				this._waitingDialog.setMessage('Обработка данных...');
	// 			}.bind(this));
	//
	// 			jobChain.add(function() {
	//
	// 				// if (data.Status == 'ok' && data.Result == 'exceeds') {
	// 				// this._tooMuchData('Rli');
	// 				// this._parsingFinished(this._treeView.get_rootNode());
	// 				// return;
	// 				// }
	//
	// 				console.log('_moveToView: Add support for multipolygons');
	// 				// this._moveToView(objects);
	//
	// 				this._dataAdapters['rl_images'].adaptTreeData(
	// 					{objects: objects, satelliteId: satelliteId},
	// 					this._treeView.root,
	// 					!searchCriteria.searchGeometry.length ? searchCriteria.searchBox : null,
	// 					function() { this._requestRLSheetsData(searchCriteria); }.bind(this)
	// 				);
	// 				this._resultList.set_RLImagesResults(objects);
	// 			}.bind(this));
	// 			jobChain.execute();
	// 		}.bind(this)
	//
	// 		var options = this._urlProviders['rl_images'].getRequestOptions(searchCriteria);
	// 		_mapHelper.searchObjectLayer(options.layerName, options)
	// 		.then(function(objects){
	// 			callback(objects, options.satelliteId);
	// 		});
	// 	}
	// 	else if(searchCriteria.rlSheets){
	// 		this._requestRLSheetsData(searchCriteria);
	// 	}
	// 	else {
	// 		this._parsingFinished(this._treeView.root);
	// 	}
	// };
	//
	// CatalogPage.prototype._requestRLSheetsData = function(searchCriteria) {
	// 	if (searchCriteria.rlSheets) {
	// 		var callback = function(objects, satelliteId) {
	//
	// 			var jobChain = new DelegatesChain();
	// 			jobChain.add(function() {
	// 				this._waitingDialog.setMessage('Обработка данных...');
	// 			}.bind(this));
	//
	// 			jobChain.add(function() {
	// 				// if (data.Status == 'ok' && data.Result == 'exceeds') {
	// 				// this._tooMuchData('Rli');
	// 				// this._parsingFinished(this._treeView.get_rootNode());
	// 				// return;
	// 				// }
	//
	// 				console.log('_moveToView: Add support for multipolygons');
	// 				// this._moveToView(objects);
	//
	// 				this._dataAdapters['rl_sheets'].adaptTreeData(
	// 					{objects: objects, satelliteId: satelliteId},
	// 					this._treeView.root,
	// 					!searchCriteria.searchGeometry.length ? searchCriteria.searchBox : null,
	// 					this._parsingFinished.bind(this)
	// 				);
	// 				this._resultList.set_RLSheetsResults(objects);
	// 			}.bind(this));
	// 			jobChain.execute();
	// 		}.bind(this)
	//
	// 		var options = this._urlProviders['rl_sheets'].getRequestOptions(searchCriteria);
	// 		_mapHelper.searchObjectLayer(options.layerName, options)
	// 		.then(function(objects){
	// 			callback(objects, options.satelliteId);
	// 		});
	// 	} else {
	// 		this._parsingFinished(this._treeView.root);
	// 	}
	// };

	CatalogPage.prototype._onOptionsButtonClicked = function() {
		this._searchOptionsView.open();
	};

	// CatalogPage.prototype._removeMapObjects = function(node) {
	// 	node.parent = null;
	// 	if (node.type == 'GroundOverlay') {
	// 		var mapObjects = node.data.mapObjects;
	// 		if (!node.data.isSelected){
	// 			if (mapObjects.polygon) {
	// 				this._map.removeLayer(mapObjects.polygon);
	// 			}
	// 			if (mapObjects.overlay) {
	// 				this._map.removeLayer(mapObjects.overlay);
	// 			}
	// 			if (mapObjects.infoIcon) {
	// 				this._map.removeLayer(mapObjects.infoIcon);
	// 			}
	// 			if (mapObjects.infoBalloon) {
	// 				this._map.removeLayer(mapObjects.infoBalloon);
	// 			}
	// 		} else {
	// 			if (mapObjects.polygon) {
	// 				this._map.addLayer(mapObjects.polygon);
	// 			}
	// 		}
	// 	}
	// 	for (var childKey in node.children) {
	// 		this._removeMapObjects(node.children[childKey]);
	// 	}
	// };

	// CatalogPage.prototype._dataLoadFailed = function() {
	// 	this._waitingDialog.close();
	// 	alert('Error loading data!');
	// };
	//
	// CatalogPage.prototype._parsingFinished = function(node) {
	//
	// 	var jobChain = new DelegatesChain();
	// 	jobChain.add(function() {
	// 		this._waitingDialog.setMessage('Добавление объектов карты...');
	// 	}.bind(this));
	//
	// 	jobChain.add(function() {
	// 		this._treeView.updateNode(node, function(chain) {
	// 			if (chain.batchList) {
	// 				var _this = this;
	// 				chain.batchList.nodes.map(function(node, index) {
	// 					_this._mapHelper.createPolygon(node, _this._polygonClicked.bind(_this));
	// 				});
	// 				this._waitingDialog.close();
	// 			}
	// 			else{
	// 				this._waitingDialog.close();
	// 				alert('Ничего не найдено.\nПожалуйста, измените настройки поиска.');
	// 			}
	// 		}.bind(this));
	// 		this.selectedImagesView.enableAll();
	// 		this.selectedImagesView.mergeNodesList(node.children);
	// 	}.bind(this));
	// 	jobChain.execute();
	// };

	CatalogPage.prototype._nodeClick = function(e, node) {
		if (node.type != 'GroundOverlay') {
			var hitarea = this._treeHelper.ensureHitArea(node);
			hitarea.click();
		}
	};

	CatalogPage.prototype._nodeDblClick = function(e, node) {
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
		this._map.fitBounds(bounds);
		this._map.invalidateSize();
	};

	CatalogPage.prototype._nodeMouseOver = function (e, node) {
		// if(node.type == 'GroundOverlay' && node.data.mapObjects.polygon) {
		// 	node.data.mapObjects.polygon.setStyle({color: '#ff0000'});
		// }
	},
	CatalogPage.prototype._nodeMouseOut = function (e, node) {
		// if(node.type == 'GroundOverlay' && node.data.mapObjects.polygon) {
		// 	node.data.mapObjects.polygon.resetStyle();
		// }
	},

	CatalogPage.prototype._nodeCheckedChanged = function(e, node) {
		if (node.type == 'GroundOverlay') {
			if (node.isChecked) {
				if (!node.data.mapObjects.polygon) {
					this._mapHelper.createPolygon(node, this._polygonClicked.bind(this));
				}
			}
			else if(node.data.mapObjects.polygon) {
				this._map.removeLayer(node.data.mapObjects.polygon);
				node.data.mapObjects.polygon = null;
			}
			this._updateOverlayVisibility(node, node.data.isOverlayVisible);
		}
	};

	CatalogPage.prototype._polygonClicked = function(node) {
		this.toggleOverlayVisibility(node);
		if (node.parent) {
			if (node.data.isOverlayVisible) {
				// Add to selected list
				this.selectedImagesView.addNode(node);
			} else {
				// Remove from selected list
				this.selectedImagesView.removeNode(node.data.info.id);
			}
		} else {
			node.selectedUi.checkbox.prop('checked', node.data.isOverlayVisible);
		}
	};

	CatalogPage.prototype._updateOverlayVisibility = function(node, isVisible){
		if (isVisible && !node.data.mapObjects.overlay) {
			this._mapHelper.createGroundOverlay(node, this._polygonClicked.bind(this));
			this._mapHelper.createInfoIcon(node);
			if(node.data.mapObjects.polygon){
				node.data.mapObjects.polygon.bringToFront();
			}
		}
		else {
			if(node.data.mapObjects.overlay) {
				this._map.removeLayer(node.data.mapObjects.overlay);
				node.data.mapObjects.overlay = null;
				this._map.removeLayer(node.data.mapObjects.infoIcon);
				node.data.mapObjects.infoIcon = null;

			}
			if(node.data.mapObjects.polygon){
				node.data.mapObjects.polygon.bringToBack();
			}
		}
	};

	CatalogPage.prototype.toggleOverlayVisibility = function(node) {
		node.data.isOverlayVisible = !node.data.isOverlayVisible;
		this._updateOverlayVisibility(node, node.data.isOverlayVisible);
	};

	CatalogPage.prototype._ensureOverlaysVisibility = function(node, isVisible, tasksChain) {
		if (node.type == 'GroundOverlay') {
			var that = this;
			var task = (function(params) {
				return function() {
					if (params.isVisible && params.node.isChecked) {
						if (!params.node.data.mapObjects.overlay) {
							this._mapHelper.createGroundOverlay(params.node);
							this._mapHelper.createInfoIcon(params.node);
						}
						else {
							this._map.addLayer(node.data.mapObjects.overlay);
							this._map.addLayer(node.data.mapObjects.infoIcon);
						}
					} else {
						if (params.node.data.mapObjects.overlay) {
							this._map.removeLayer(node.data.mapObjects.overlay);
						}
						if(params.node.data.mapObjects.infoIcon) {
							this._map.removeLayer(node.data.mapObjects.infoIcon);
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
	};

	// CatalogPage.prototype._tooMuchData = function(source) {
	// 	alert(source + ':\nСлишком много снимков.\nПожалуйста, измените настройки поиска.');
	// };

	// CatalogPage.prototype._updateSearchGeometry = function(searchCriteria) {
	//
	// 	var searchBox,
	// 	sg = {},
	// 	searchGeometries = [];
	//
	// 	var lmap = nsGmx.leafletMap,
	// 	features = lmap.gmxDrawing.getFeatures();
	// 	if (features.length) {
	// 		var feature = features[features.length - 1];
	// 		var geojson = feature.toGeoJSON(),
	// 		g = geojson.geometry,
	// 		bbox = L.gmxUtil.getGeometryBounds(g);
	// 		searchBox = [bbox.min.x, bbox.min.y, bbox.max.x, bbox.max.y];
	// 		searchGeometries.push(g);
	// 		sg[feature._leaflet_id] = g;
	// 	} else {
	// 		searchBox = lmap.getBounds().toBBoxString().split(',');
	// 	}
	//
	// 	this._resultList.setSearchGeometries(sg);
	//
	// 	searchCriteria.searchBox = searchBox;
	// 	searchCriteria.searchGeometry = searchGeometries;
	//
	// };

	nsCatalog.Controls.CatalogPage = CatalogPage;

}(jQuery));
