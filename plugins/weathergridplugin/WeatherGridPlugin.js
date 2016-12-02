//Фильтрация слоя ветра по часам
//Параметры: layerName - ID слоя ветра (можно задавать несколько раз)
(function (){

var uiTemplate = Handlebars.compile(
    '<span data-hours="0" class="wind-hour">00</span>' +
    '<span data-hours="6" class="wind-hour">06</span>' +
    '<span data-hours="12" class="wind-hour">12</span>' +
    '<span data-hours="18" class="wind-hour">18</span>'
);

var DEFAULT_LAYERNAME = '10riUTvti2NTfC5I',
	layersTree = window._layersTree,
	nativeDrawNode = layersTree.drawNode;

var WindFilterView = Backbone.View.extend({
    tagName: 'span',
    className: 'wind-container',
    template: uiTemplate,
    events: {
        'click .wind-hour': function(event) {
            this.model.set({activeHour: Number($(event.target).data('hours'))});
        }
    },

    initialize: function() {
        this.model.on('change:activeHour', this.render.bind(this));
        this.render();
    },

    render: function() {
        this.$el.html(this.template());
        this.$el.find('[data-hours="' + this.model.get('activeHour') + '"]').addClass('wind-hour wind-active-hour');
    }
});

var WindFilterModel = Backbone.Model.extend({
    defaults: {
        activeHour: 0
    }
});

		var getLayers = function (it, arr) {
			var type = it.type,
				content = it.content || {};

			arr = arr || [];
			if (type === 'group') {
				var children = content.children ? content.children : [];
				arr.concat(children.map(function(elem) {
					getLayers(elem, arr);
				}));
			} else if (type === 'layer') {
				var props = content.properties ? content.properties : {};
				arr.push(nsGmx.gmxMap.layersByID[props.LayerID || props.MultiLayerID || props.GroupID || props.name]);
			}
			return arr;
		};

		var getView = function (elem) {
			var model = new WindFilterModel(),
				arr = getLayers(elem);

            if (elem.content.properties.permalinkParams) {
                model.set('activeHour', elem.content.properties.permalinkParams.activeHour);
            }

			var setFilters = function () {
				var active = model.get('activeHour');
				arr.map(function(layer) {
					var dateIndex = layer.getTileAttributeIndexes()['DateTime'];
					var getHourFilter = function(activeHour) {
						return function(item) {
							var date = item.properties[dateIndex],
								hours = Math.floor(date % (3600 * 24) / 3600);
							return hours === activeHour;
						}
					}
					layer.setFilter(getHourFilter(active));

                    // save active hour in permalink
                    if (elem.content.properties.permalinkParams) {
                        elem.content.properties.permalinkParams.activeHour = active;
                    } else {
                        elem.content.properties.permalinkParams = {activeHour: active}
                    }
				});
			};
			model.on('change:activeHour', function() {
				setFilters();
			});
			setFilters();
            return new WindFilterView({model: model});
        };

var publicInterface = {
    pluginName: 'Weather Grid Plugin',
    beforeViewer: function(params, map) {
        var views = {},
			layerNames = params.layerName || DEFAULT_LAYERNAME;

		if (layerNames.indexOf(',') > 0) {
			layerNames = layerNames.split(',');
		} else if (!L.Util.isArray(layerNames)) {
			layerNames = [layerNames];
		}
		layerNames.map(function(id) { views[id.trim()] = 'pending'; });

		layersTree.drawNode = function(elem, parentParams, layerManagerFlag) {
            var div = nativeDrawNode.apply(layersTree, arguments),
				it = elem || {},
				type = it.type,
				props = it.content && it.content.properties ? it.content.properties : {},
				id = props.LayerID || props.MultiLayerID || props.GroupID || props.name;

            if (!layerManagerFlag && id in views) {
				var className = type === 'group' ? 'groupLayer' : 'layerDescription',
					beforeNode = div.getElementsByClassName(className),
					view = getView(elem);

				views[id] = view.el;
                div.insertBefore(views[id], beforeNode[0].nextSibling);
            }
            return div;
        }
    }
}

gmxCore.addModule("WeatherGridPlugin", publicInterface, {
    css: 'WeatherGridPlugin.css'
});

})()
