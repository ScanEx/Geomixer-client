(function($){
	var pluginPath;

	_translationsHash.addtext("rus", {
		"Поиск снимков": "Поиск снимков"
	});
	_translationsHash.addtext("eng", {
		"Поиск снимков": "Search imagery"
	});

	var bLoaded = false;
	var oPageController;
	var oLeftMenu = new leftMenu();
	var sCadastreHost = false;

	var unloadMenu = function(){	}

	var loadPlugin = function(oPermalinkController){
		var def = new $.Deferred();
		var alreadyLoaded = oLeftMenu.createWorkCanvas("catalog", unloadMenu);
		if (!alreadyLoaded){
			$LAB.script(pluginPath + 'js/L.ImageTransform.js');
			$LAB.script(pluginPath + 'js/CatalogPageController.js').wait(function(){
				oPageController = new CatalogPageController({
					View: oLeftMenu.workCanvas,
					Map: nsGmx.leafletMap,
					TreeView: null,
					Path: pluginPath,
					PermalinkController: oPermalinkController
				});
				def.resolve();
			});
		}
		else{
			def.resolve();
		}
		bLoaded = true;
		return def;
	}

	var publicInterface = {
		pluginName: 'ScanEx catalog',
		afterViewer: function(map, params) {
			gmxCore.loadScript(pluginPath + 'js/AppCode/PermalinkController.js')
				.done(function(){
					var oPermalinkController = new PermalinkController();
					_mapHelper.customParamsManager.addProvider({
						name: 'Catalog',
						loadState: function(state) {
							if(state || state.nodes || state.searchOptions) {
								loadPlugin(oPermalinkController).done(function(){
									oPermalinkController.fromPermalink(state);
								});
							}
						},
						saveState: function() {
							return oPermalinkController.toPermalink();
						}
					});
					loadPlugin(oPermalinkController);
				})
				.fail(console.log.bind(console));
		},
		unload: function() {
			if(oPageController) {
				oPageController.removeControls();
				oPageController._clearSearchResults();
			}
			oLeftMenu && $(oLeftMenu.parentWorkCanvas).remove();
			_mapHelper.customParamsManager.removeProvider('Catalog');
		}
	};

	gmxCore.addModule("Catalog", publicInterface, {
		'init': function(module, path){
			pluginPath = path;
		}
	});
})(jQuery)
