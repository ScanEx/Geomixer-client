(function () {
    'use strict';

	window.nsGmx = window.nsGmx || {};

    var pluginName = 'HelloWorld',
		homePath;

    var publicInterface = {
        pluginName: pluginName,

        afterViewer: function (params, map) {
			if (window.nsGmx) {
				var layersByID = nsGmx.gmxMap.layersByID,
                    layerID = params.layerID || '47A9D4E5E5AE497A8A1A7EA49C7FC336',
					testLayer = layersByID[layerID],
					showID = function (id) {
						var div = L.DomUtil.create('div', 'HelloWorld'),
							legendDiv = L.DomUtil.create('div', 'legendDiv', div),
							container = L.DomUtil.create('div', 'container', div);
						id = 97787;		// Закоментарить эту строку - при реальном использовании
						fetch(homePath + id + '.js')		// Запрос за JSON данными графиков
							.then(function(resp){ return resp.json(); })
							.then(function(json){
								var groups = new vis.DataSet(json.groups);
								var dataset = new vis.DataSet(json.items);
								var options = {
									dataAxis: {showMinorLabels: false},
									start: json.start,
									end: json.end
								};
								var graph2d = new vis.Graph2d(container, json.items, groups, options);
							});

						var dialog = L.control.dialog({
							anchor: [ 60, 190 ],
							size: [ 920, 490 ]
						})
						  .setContent(div)
						  .addTo(map);
					};

				if (testLayer) {
					testLayer
						.bindPopup('', { maxWidth: 560 })
						.on('popupopen', function(ev) {
							var popup = ev.popup,
								container = L.DomUtil.create('div', 'myPopup'),
								prop = L.DomUtil.create('div', 'myName', container),
								buttonDiv = L.DomUtil.create('div', 'myImage', container),
								//props = ev.gmx.properties,	// Свойства объекта
								id = ev.gmx.id;

							prop.innerHTML = '<h3>Объект: ' + id + '</h3><br>';
							buttonDiv.innerHTML = '<button>Показать график</button>';
							L.DomEvent.on(buttonDiv, 'click', L.DomEvent.stopPropagation);
							L.DomEvent.on(buttonDiv, 'click', function () {
								showID(id);		// Вызов метода для отображения графиков
							});
							popup.setContent(container);
						}, testLayer);
				}
			}
        }
    };

    if (window.gmxCore) {
		window.gmxCore.addModule(pluginName, publicInterface, {
			css: 'HelloWorld.css',
			init: function(module, path)
			{
				homePath = path;	// Папка где расположен плагин

				var def = $.Deferred();
				gmxCore.loadScriptWithCheck([
					{
						check: function(){ return window.links; },
						script: path + '../timeline/vis.js',
						css: path + '../timeline/vis.css'
					},
					{
						check: function(){ return window.L.control.dialog; },
						css: 'http://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css'
					}					
				]).done(function() {
					def.resolve();
				});

				return def;
			}
		});
	} else {
		window.nsGmx[pluginName] = publicInterface;
	}
})();
