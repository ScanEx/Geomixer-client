(function ($){

_translationsHash.addtext("rus", {
    "Моделирование сликов" : "Моделирование сликов"
 });
                     
_translationsHash.addtext("eng", {
    "Моделирование сликов" : "Slick modeling"
 });
 
// var ModelingParams = function()
// {
    // var startDatetime = new Date();
    // var modelingPeriod = 12;
    // var lat = 48.8456;
    // var lon = 44.2836;
    // var modelingStep = 1;
    // var windCoeff = 0.03;
    // var turbulencyCoeff = 0.1;
    // var name = '';
    // var reverseModeling = true;
    // var useDrift = true;
    // var useGeostrophicDrift = true;
// }

var showModelingDialog = function()
{
    var canvas = $('<div/>', {'class': 'slick-canvas'});
    var elems = [];
    
    var nameInput = $('<input/>').val('Test');
    var latInput = $('<input/>', {'class': 'slick-coords'});
    var lonInput = $('<input/>', {'class': 'slick-coords'});
    var datetimePicker = $('<input/>').datetimepicker();
    var periodInput = $('<input/>').val(12);
    var stepInput = $('<input/>').val(1);
    var windInput = $('<input/>').val(0.03);
    var turbInput = $('<input/>').val(0.1);
    
    datetimePicker.datetimepicker('setDate', new Date());
    
    var ckbReverse = $(_checkbox(true, 'checkbox')).attr('id', 'reverse');
    var ckbUseDrift = $(_checkbox(true, 'checkbox')).attr('id', 'drift');
    var ckbUseGeostrophic = $(_checkbox(true, 'checkbox')).attr('id', 'geostrofic');
    var ckbConstantSource = $(_checkbox(false, 'checkbox')).attr('id', 'source');
    
    elems.push({title: 'Название эксперимента', elem: nameInput});
    elems.push({title: 'Начальная точка (lat, lon)', elem: $('<div/>').append(latInput).append(lonInput)});
    elems.push({title: 'Начальная дата расчёта', elem: datetimePicker});
    elems.push({title: 'Время расчёта (в часах)', elem: periodInput});
    elems.push({title: 'Шаг расчётов по времени (в часах)', elem: stepInput});
    elems.push({title: 'Коэффициент ветрового дрейфа', elem: windInput});
    elems.push({title: 'Коэффициент турбулентного обмена', elem: turbInput});
    
    var table = $('<table/>', {'class': 'slick-table'}).appendTo(canvas);
    
    for (var iE = 0; iE < elems.length; iE++)
    {
        table.append($('<tr/>')
            .append($('<td/>').text(elems[iE].title))
            .append($('<td/>').append(elems[iE].elem))
        )
    }
    
    canvas.append($('<div/>').append(ckbReverse).append($('<label/>', {'for': 'reverse'}).text('Обратный расчёт')));
    canvas.append($('<div/>').append(ckbUseDrift).append($('<label/>', {'for': 'drift'}).text('Учитывать дрейфовые течения')));
    canvas.append($('<div/>').append(ckbUseGeostrophic).append($('<label/>', {'for': 'drift'}).text('Учитывать геострофические течения')));
    canvas.append($('<div/>').append(ckbConstantSource).append($('<label/>', {'for': 'drift'}).text('Постоянный источник')));
    
    var regions = 'BiscayBay.bsn GulfStream_usa.bsn GulfStream.bsn Ohotsk.bsn Kaspii.bsn BlackSea.bsn StLawrence.bsn Levantine.bsn Kuroshio_jap.bsn Kuroshio_all.bsn MexicanGulf.bsn Aguhlas.bsn Barents.bsn Baltic.bsn Japan.bsn'.split(' ');
    var regionSelect = $('<select/>', {'class': 'selectStyle'}).appendTo(canvas);
    canvas.append($('<div/>', {'class': 'slick-region'}).append($('<span/>').text('Выбор региона: ')).append(regionSelect));
    for (var r = 0; r < regions.length; r++)
        regionSelect.append($('<option/>').val(regions[r]).text(regions[r]));
    
    var startButton = $('<button/>').text('Начать моделирование').appendTo(canvas).click(function()
    {
        var data = {
            startDate: datetimePicker.val(),
            lat: latInput.val(),
            lon: lonInput.val(),
            period: periodInput.val(),
            step: stepInput.val(),
            wind: windInput.val(),
            turb: turbInput.val(),
            reverse: !!ckbReverse[0].checked,
            drift: !!ckbUseDrift[0].checked,
            geostrophic: !!ckbUseGeostrophic[0].checked,
            constantSource: !!ckbConstantSource[0].checked,
            region: $(':selected', regionSelect).val(),
            map: window.globalMapName,
            name: nameInput.val()
        }
        
        var toParams = function(data)
        {
            var str = ""
            for (var p in data)
                str += '&' + p + '=' + encodeURIComponent(data[p]);
                
            return str.substring(1);
        }
        
        sendCrossDomainJSONRequest(serverBase + 'SlickModeling.ashx?' + toParams(data), function(response)
        {
            if (!parseResponse(response))
                return;
                
            alert('Моделирование удачно запущено!');
        })
    })
    
    showDialog(_gtxt('Моделирование сликов'), canvas[0], 500, 400);
}
 
var publicInterface = {
	afterViewer: function()
    {
        _menuUp.addChildItem({id:'slickModeling', title: _gtxt('Моделирование сликов'), func: showModelingDialog}, "servicesMenu");
        $.getCSS(gmxCore.getModulePath('SlickModelingPlugin') + 'SlickModelingPlugin.css');
    }
}

gmxCore.addModule('SlickModelingPlugin', publicInterface);

})(jQuery);