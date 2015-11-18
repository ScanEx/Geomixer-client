var nsCatalog = nsCatalog || {};

(function($){

	_translationsHash.addtext("rus", {
		"Поиск снимков": "Поиск снимков"
	});
	_translationsHash.addtext("eng", {
		"Поиск снимков": "Search imagery"
	});

	nsCatalog.SEARCH_LIMIT = 1000;

	var bLoaded = false;
	var oLeftMenu = new leftMenu();
	var sCadastreHost = false;
	var pluginPath = '';

	var unloadMenu = function(){	}

	var getUserInfo = function (){
		var def = new $.Deferred();
		var userInfo = {};
		sendCrossDomainPostRequest(
			serverBase + 'Layer/GetLayerInfo.ashx',
			{layerId: '9077D16CFE374967A8C57C78095F34EA', WrapStyle: 'message'},
			function(response){
				if (response.Status == 'ok') {
					userInfo.Role = 'scanex';
				}
				def.resolve(userInfo);
			});
			return def;
	};

	var scripts = [
		'js/AppCode/Extensions.js',
		'js/AppCode/DelegatesChain.js',
		'js/DataSources/BaseDataSource.js',
		'js/DataSources/InternalDataSource.js',
		'js/DataSources/ExternalDataSource.js',
		'js/DataSources/RLImagesDataSource.js',
		'js/DataSources/RLSheetsDataSource.js',
		'js/AppCode/Helpers/MapObjectsHelper.js',
		'js/AppCode/ShapeFileController.js',
		'js/AppCode/Popover/popover.js',
		'js/AppCode/PermalinkController.js',
		'js/Controls/LoaderDialog/LoaderDialogController.js',
		'js/Controls/TreeView/TreeNode.js',
		'js/Controls/TreeView/TreeViewController.js',
		'js/Controls/TreeView/TreeHelper.js',
		'js/Controls/SearchOptionsView/SearchOptionsViewController.js',
		'js/Controls/SelectedImagesList/SelectedImagesListController.js',
		'js/Controls/SearchResultsView/SearchResultList.js',
		'js/Controls/RangeControl/RangeControl.js',
		'js/jquery/jquery.domec.min.js',
		'js/jquery/jquery.maskedinput.min.js',
		'js/jsts/javascript.util.js',
		'js/jsts/jsts.js',
		'js/tristate/tristate.js',
		'js/L.ImageTransform.js',
		'js/CatalogPageController.js'
	];

	var styles = [
		'catalog.css',
		'js/Controls/PeriodSelector/PeriodSelector.css',
		'js/Controls/LoaderDialog/LoaderDialog.css',
		'js/Controls/SearchOptionsView/SearchOptionsView.css',
		'js/Controls/SelectedImagesList/SelectedImagesList.css',
		'js/Controls/SearchResultsView/SearchResultsView.css',
		'js/Controls/TreeView/TreeView.css',
		'js/AppCode/Popover/popover.css',
		'js/Controls/RangeControl/RangeControl.css'
	];

	getUserInfo().done(function(userInfo){

		var loadPlugin = function(){
			var alreadyLoaded = oLeftMenu.createWorkCanvas("catalog", unloadMenu);
			if (!alreadyLoaded){

				nsCatalog.ShapeFileControl = new nsCatalog.Controls.ShapeFileController(nsGmx.leafletMap);
				nsCatalog.LoaderDialog = new nsCatalog.Controls.LoaderDialog();

				nsCatalog.MapHelper = new nsCatalog.Helpers.MapHelper(nsGmx.leafletMap, nsCatalog.TreeHelper);
				nsCatalog.ResultList = new nsCatalog.Controls.SearchResultList(
					nsCatalog.MapHelper, nsCatalog.ShapeFileControl, nsCatalog.LoaderDialog,
					{position: 'left', insertBefore: false, addBefore: 'hide'});

				nsCatalog.DataSources = {};

				if(userInfo.Role == 'scanex'){
					nsCatalog.DataSources.InternalDataSource = new nsCatalog.InternalDataSource(nsCatalog.MapHelper, nsCatalog.ResultList);
					nsCatalog.DataSources.RLImagesDataSource = new nsCatalog.RLImagesDataSource(nsCatalog.MapHelper, nsCatalog.ResultList);
					nsCatalog.DataSources.RLSheetsDataSource = new nsCatalog.RLSheetsDataSource(nsCatalog.MapHelper, nsCatalog.ResultList);
				}
				nsCatalog.DataSources.ExternalDataSource = new nsCatalog.ExternalDataSource(nsCatalog.MapHelper, nsCatalog.ResultList);

				nsCatalog.CatalogPage = new nsCatalog.Controls.CatalogPage(
					oLeftMenu.workCanvas, nsGmx.leafletMap, nsCatalog.MapHelper, nsCatalog.TreeHelper,
					nsCatalog.ShapeFileControl, nsCatalog.ResultList, nsCatalog.DataSources, userInfo, pluginPath, nsCatalog.LoaderDialog);

				nsCatalog.Permalink = new nsCatalog.Helpers.Permalink(
					nsCatalog.CatalogPage, nsCatalog.MapHelper, nsCatalog.DataSources);
			}
			bLoaded = true;
		};

		var publicInterface = {
			pluginName: 'ScanEx catalog',
			afterViewer: function(map, params) {
				// var waitingDialog = new nsCatalog.Controls.LoaderDialogController();
				// waitingDialog.open('Загрузка', 'Загрузка скриптов...');
				// waitingDialog.setMessage('Почти готово...');
				styles.map(function(path){
					gmxCore.loadCSS(pluginPath + path);
				});
				scripts
				.map(function(path){
					return gmxCore.loadScript(pluginPath + path);
				})
				.reduce(function(prev, next){
					return prev.then(function () {
						return next;
					});
				})
				.done(function(){
					_mapHelper.customParamsManager.addProvider({
						name: 'Catalog',
						loadState: function(state) {
							if(state || state.nodes || state.searchOptions) {
								loadPlugin();
								nsCatalog.Permalink.fromPermalink(state);
							}
						},
						saveState: function() {
							return nsCatalog.Permalink.toPermalink();
						}
					});
					loadPlugin();
				});
			},
			unload: function() {
				if(nsCatalog.CatalogPage) {
					nsCatalog.CatalogPage.removeControls();
					nsCatalog.CatalogPage._clearSearchResults();
				}
				oLeftMenu && $(oLeftMenu.parentWorkCanvas).remove();
				_mapHelper.customParamsManager.removeProvider('Catalog');
			}
		};
		gmxCore.addModule("Catalog", publicInterface, {'init': function(module, path){ pluginPath = path; }});
	});

})(jQuery)
