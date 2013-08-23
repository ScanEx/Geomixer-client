//Плагин для подсчёта площади сликов
//Ищет все слои с названием "слики", и для всех объектов этих слоёв из заданного временного интервала 
//(время на основе атрибутов) вычисляет их суммарную площадь (на основе другого атрибута)
(function ($){

var theMap = null;

_translationsHash.addtext("rus", {
    "slickSquare.menu" : "Подсчёт площади сликов"
 });
                     
_translationsHash.addtext("eng", {
    "slickSquare.menu" : "Calculate slicks square"
 });
 
var doCalculate = function(dateMin, dateMax, callback)
{
    var dateAttr = 'Date_';
    var areaAttr = 'Area';
    
    var totalSquare = 0;
    var deferreds = [];
    var toProcess = 0;
    
    for (var iL = 0; iL < theMap.layers.length; iL++)
    (function(layer)
    {
        //if (layer.properties.title !== 'слики')
        //    return;
        var parseArr = layer.properties.title.match(/слики_(\d\d)(\d\d)(\d\d\d\d)/);
        if (!parseArr) {
            return;
        }
        
        var date = new Date(parseArr[3], parseArr[2] - 1, parseArr[1]);
        if (date < dateMin || date > dateMax) {
            return;
        }
        
        var deferred = $.Deferred();
        deferreds.push(deferred);
        toProcess++;
        console.log(layer.properties.title);
        layer.getFeatures('', function(features)
        {
            var isError = false;
            for (var iF = 0; iF < features.length; iF++)
            {
                // var date;
                // try {
                    // date = $.datepicker.parseDate("dd.mm.yy", features[iF].properties[dateAttr]);
                // }
                // catch (e)
                // {
                    // isError = true;
                    // continue;
                // }
                
                // if (date < dateMin || date > dateMax) 
                    // continue;
                        
                // totalSquare += parseInt(features[iF].properties[areaAttr]);
                console.log(layer.properties.title, features[iF].geometry, theMap.getArea(features[iF].geometry));
                totalSquare += theMap.getArea(features[iF].geometry);
            }
            
            if (isError && _layersTree.treeModel)
            {
                var res = _layersTree.treeModel.findElemByGmxProperties({content:{properties:{LayerID: layer.properties.LayerID}}});
                    
                var groups = [];
                for (var iG = res.parents.length-3; iG >= 0; iG--)
                    groups.push(res.parents[iG].content.properties.title);
                
                console.log("Error in layer " + groups.join(' -> '));
            }
            
            deferred.resolve();
        })
    })(theMap.layers[iL]);
    
    $.when.apply($, deferreds).done(function()
    {
        callback(totalSquare);
    })
}

var draw = function()
{
    var canvas = $('<div/>');
    var calendar = new nsGmx.Calendar(canvas[0], {showTime: false, showSwitcher: false, minimized: false, container: canvas});
    
    var start = $('<button/>').text('Считать').appendTo(canvas).click(function()
    {
        doCalculate(calendar.getDateBegin(), calendar.getDateEnd(), function(total)
        {
            console.log('Общая прощадь: ' + total);
            alert('Общая прощадь: ' + total);
        });
    });
    
    showDialog("Настройки", canvas[0], {width: 300, height: 100});
}
 
var publicInterface = {
	afterViewer: function(params, map)
    {
        theMap = map;
        _menuUp.addChildItem({id:'slickSquare', title: _gtxt('slickSquare.menu'), func: draw}, "servicesMenu");
    }
}

gmxCore.addModule('SlickTotalSquare', publicInterface);

})(jQuery);