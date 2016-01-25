//Фильтрация слоя ветра по часам
//Параметры: layerName - ID слоя ветра
(function (){
    
var uiTemplate = Handlebars.compile(
    '<span data-hours="0" class="wind-hour">00</span>' +
    '<span data-hours="6" class="wind-hour">06</span>' +
    '<span data-hours="12" class="wind-hour">12</span>' +
    '<span data-hours="18" class="wind-hour">18</span>'
);

var nativeDrawNode = _layersTree.drawNode;

var DEFAULT_LAYERNAME = '7CB878E2BE274837B291E592B2530C39';

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
})

var publicInterface = {
    pluginName: 'Wind plugin',
    beforeViewer: function(params, map) {
        var layerName = params.layerName || DEFAULT_LAYERNAME,
            layer = nsGmx.gmxMap.layersByID[layerName];
            
        if (!layer) {
            return;
        }
        
        var dateIndex = layer.getTileAttributeIndexes()['DateTime'];

        var getHourFilter = function(activeHour) {
            return function(item) {
                var date = item.properties[dateIndex],
                    hours = Math.floor(date % (3600 * 24) / 3600);

                return hours === activeHour;
            }
        }
        
        var model = new WindFilterModel();
        var view = new WindFilterView({model: model});
        
        model.on('change:activeHour', function() {
            layer.setFilter(getHourFilter(model.get('activeHour')));
        });
        layer.setFilter(getHourFilter(model.get('activeHour')));

        _layersTree.drawNode = function(elem, parentParams, layerManagerFlag) {
            var div = nativeDrawNode.apply(_layersTree, arguments);

            if (!layerManagerFlag && elem.type === 'layer' && elem.content.properties.name === layerName) {
                $(div).find('.layerDescription').after(view.el);
            }
            
            return div;
        }
    }
}

gmxCore.addModule("WindPlugin", publicInterface, {
    css: 'WindPlugin.css'
});

})()