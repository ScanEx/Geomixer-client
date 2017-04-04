(function()
{
    var getZoomValue = function(zoomControl)
    {
        var isNotValid = zoomControl.value == '' ||
                    isNaN(Number(zoomControl.value)) ||
                    Number(zoomControl.value) != Math.floor(Number(zoomControl.value)) ||
                    Number(zoomControl.value) < 1;

        if (isNotValid)
        {
            $(zoomControl).addClass("error");
            return null;
        }
        else
        {
            $(zoomControl).removeClass("error");
            return Number(zoomControl.value);
        }
    }

    var checkZoom = function(minZoomInput, maxZoomInput)
    {
        var minVal = getZoomValue(minZoomInput);
        var maxVal = getZoomValue(maxZoomInput);

        if (minVal && maxVal && minVal > maxVal)
        {
            $(minZoomInput).addClass("error");
            $(maxZoomInput).addClass("error");
            return false;
        }

        return !!(minVal && maxVal);
    }

    /**
     Контрол для задания максимального и минимального зумов слоя/стиля.
     Выдаёт два 'li' элемента, которые клиент сам помещает куда-нибудь.
     Генерит событие "change", когда изменились валидные значения зумов
     @memberOf nsGmx
     @class
     @param minZoom {int} Начальный минимальный зум
     @param maxZoom {int} Начальный максимальный зум
    */
    var ZoomPropertiesControl = function(minZoom, maxZoom)
    {
        var _this = this;
        var minZoomInput = _input(null, [['dir','className','inputStyle'],['attr','paramName','MinZoom'],['css','width','30px'],['attr','value', minZoom || 1]]);
        var maxZoomInput = _input(null, [['dir','className','inputStyle'],['attr','paramName','MaxZoom'],['css','width','30px'],['attr','value', maxZoom || 17]]);
        checkZoom(minZoomInput, maxZoomInput);

        var liMinZoom = _li([_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Мин. зум"))],[['css','fontSize','12px']])],[['css','width','60px']]),_td([minZoomInput])])])])])]);
		var liMaxZoom = _li([_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Макс. зум"))],[['css','fontSize','12px']])],[['css','width','60px']]),_td([maxZoomInput])])])])])]);

        minZoomInput.onkeyup = maxZoomInput.onkeyup = function()
        {
            if (checkZoom(minZoomInput, maxZoomInput))
                $(_this).change();

            return true;
        }

        this.getMinLi = function() { return liMinZoom; };

        this.getMaxLi = function() { return liMaxZoom; };

        /** Получить минимальный зум
        */
        this.getMinZoom = function() { return Number(minZoomInput.value) };

        /** Получить максимальный зум
        */
        this.getMaxZoom = function() { return Number(maxZoomInput.value) };
    }

    nsGmx.ZoomPropertiesControl = ZoomPropertiesControl;
})();
