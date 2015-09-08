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
	var oPermalinkController;
	var oLeftMenu = new leftMenu();
	var sCadastreHost = false;

	var unloadMenu = function(){	}

	var loadPlugin = function(callback){
		var alreadyLoaded = oLeftMenu.createWorkCanvas("catalog", unloadMenu);
		if (!alreadyLoaded){
			$LAB.script(pluginPath + 'js/L.ImageTransform.js');
			$LAB.script(pluginPath + 'js/CatalogPageController.js').wait(function(){
				oPageController = new CatalogPageController({
					View: oLeftMenu.workCanvas,
					Map: nsGmx.leafletMap,
					TreeView: null,
					Path: pluginPath,
					PermalinkController: oPermalinkController,
					callback: callback
				});
			});
		}
		else{
			if(callback) callback();
		}
		bLoaded = true;
	}

	var publicInterface = {
		pluginName: 'ScanEx catalog',
		afterViewer: function(map, params) {
			loadPlugin();
		},
		unload: function() {
			if(oPageController) {
				oPageController.removeControls();
				oPageController._clearSearchResults();
			}
			oLeftMenu && $(oLeftMenu.parentWorkCanvas).remove();
		}
	}

	gmxCore.addModule("Catalog", publicInterface, {init: function(module, path)
		{
			pluginPath = path;
			return gmxCore.loadScript(pluginPath + 'js/AppCode/PermalinkController.js').then(function(){
				oPermalinkController = new PermalinkController();
				_mapHelper.customParamsManager.addProvider({
					name: 'Catalog',
					loadState: function(state) {
						if(state || state.nodes || state.searchOptions) {
							loadPlugin(function(){
								oPermalinkController.fromPermalink(state);
							});
						}
					},
					saveState: function() {
						return oPermalinkController.toPermalink();
					}
				});
			});
		}
	});
})(jQuery)
