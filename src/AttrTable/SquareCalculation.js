!(function() {

var template = Handlebars.compile('<div class="attrs-table-square-popover">' +
    '<div class="attrs-table-square-toomuch">Слишком много объектов</div>' +
    '<div class="attrs-table-square-process">Подсчитываем...</div>' +
    '<div class="attrs-table-square-result">Площадь: ' +
        '<span class="attrs-table-square"></span>' +
    '</div>' +
'</div>');

nsGmx.AttrTable.SquareCalc = function(container, layerName, dataProvider, searchParamsManager) {
    var popoverUI = $(template());

    popoverUI.find('.attrs-table-square-toomuch').hide();
    popoverUI.find('.attrs-table-square-result').hide();

    $(container).popover({
        content: popoverUI[0],
        placement: 'left',
        html: true
    });

    $(container).on('shown.bs.popover', function() {
        if (dataProvider.getLastCountResult() > 10000) {
            popoverUI.find('.attrs-table-square-toomuch').show();
            popoverUI.find('.attrs-table-square-process').hide();
            popoverUI.find('.attrs-table-square-result').hide();
            return;
        } else {
            popoverUI.find('.attrs-table-square-toomuch').hide();
            popoverUI.find('.attrs-table-square-process').show();
            popoverUI.find('.attrs-table-square-result').hide();
        }

        sendCrossDomainPostRequest(window.serverBase + 'VectorLayer/Search.ashx', {
            layer: layerName,
            query: searchParamsManager.getQuery(),
            columns: '[{value: "[GeomixerGeoJson]"}]',
            WrapStyle: 'message'
        }, function(response) {
            if (!window.parseResponse(response)) {
                return;
            }

            popoverUI.find('.attrs-table-square-process').hide();
            popoverUI.find('.attrs-table-square-result').show();

            var items = response.Result.values;
            var totalSquare = 0;
            for (var g = 0; g < items.length; g++) {
                totalSquare += L.gmxUtil.geoArea(items[g][0]);
            }

            popoverUI.find('.attrs-table-square').text(L.gmxUtil.prettifyArea(totalSquare));
        });
    });
};

})();
