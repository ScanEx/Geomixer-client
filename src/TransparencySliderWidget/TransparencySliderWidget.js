nsGmx.TransparencySliderWidget = function(container) {
    var _this = this;
    var ui = $(Handlebars.compile(
		'<div class="leaflet-gmx-iconSvg leaflet-gmx-iconSvg-transparency svgIcon leaflet-control gmx-transslider-toggle-icon" title="{{i "TransparencySliderWidget.title"}}"><svg role="img" class="svgIcon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#transparency"></use></svg></div>' +
        '<div class = "gmx-transslider-container"></div>' +
        '<div class = "leaflet-gmx-iconSvg leaflet-gmx-iconSvg-transparency-eye svgIcon leaflet-gmx-iconSvg-active leaflet-control gmx-transslider-onoff" title="{{i "TransparencySliderWidget.onOffTitle"}}"><svg role="img" class="svgIcon gmx-transslider-hide"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#transparency-eye"></use></svg><svg role="img" class="svgIcon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#transparency-eye-off"></use></svg></div>'
    )()).appendTo(container);

    var sliderContainer = container.find('.gmx-transslider-container');

    this._isCollapsed = true;

    container.find('.gmx-transslider-toggle-icon').click(function() {
        this._isCollapsed = !this._isCollapsed;
        sliderContainer.toggle(!this._isCollapsed);
        container.find('.gmx-transslider-onoff').toggle(!this._isCollapsed);
        container.find('.gmx-transslider-toggle-icon').toggleClass('leaflet-gmx-iconSvg-active', !this._isCollapsed);
    }.bind(this));

    var isOpaque = true;
    var updateOnOffIcon = function(value) {
        var isOpaqueNew = value === 1.0;
        if (isOpaqueNew !== isOpaque) {
            isOpaque = isOpaqueNew;
            var arr = container.find('.gmx-transslider-onoff')[0].childNodes;
			if (isOpaque) {
				L.DomUtil.removeClass(arr[1], 'gmx-transslider-hide');
				L.DomUtil.addClass(arr[0], 'gmx-transslider-hide');
			} else {
				L.DomUtil.removeClass(arr[0], 'gmx-transslider-hide');
				L.DomUtil.addClass(arr[1], 'gmx-transslider-hide');
			}
        }
    }

    sliderContainer.slider({
        range: 'min',
        min: 0.0,
        max: 1.0,
        step: 0.01,
        value: 1.0,
        change: function(event, ui) {
            $(_this).triggerHandler(event, ui);
            updateOnOffIcon(ui.value);
        },
        slide: function(event, ui) {
            $(_this).triggerHandler(event, ui);
            updateOnOffIcon(ui.value);
        }
    }).hide();

    // fix map moving in IE
    if (nsGmx.leafletMap) {
        var dragging = nsGmx.leafletMap.dragging;
        L.DomEvent
            .on(sliderContainer[0], 'mouseover', dragging.disable, dragging)
            .on(sliderContainer[0], 'mouseout', dragging.enable, dragging);
    }

    container.find('.gmx-transslider-onoff').click(function(){
        var curValue = sliderContainer.slider('value');
        sliderContainer.slider('value', curValue !== 1.0 ? 1.0 : 0.0);
    }).hide();

    container.on('mousedown click', function(event) {
        event.stopPropagation();
    });
}

nsGmx.TransparencySliderWidget.prototype.isCollapsed = function() {
    return this._isCollapsed;
}
