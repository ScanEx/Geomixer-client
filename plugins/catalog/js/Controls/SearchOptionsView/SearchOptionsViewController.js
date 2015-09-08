SearchOptionsViewController = function(view, path) {
    this._view = $(view);
    this._path = path;

    this._currentSearchCriteria = null;

    this._currentRegional = $.datepicker.regional['ru'];
    this._dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    this._startDate = null;
    this._endDate = null;
    this._yearly = null;
    this._cloudCover = null;
    this._cloudCoverNames = [
        { name:'Безоблачно', img:'cld1.png' },
        { name:'Малооблачно', img:'cld2.png' },
        { name:'Средняя облачность', img:'cld3.png' },
        { name:'Сильная облачность', img:'cld4.png' },
        { name:'Сплошная облачность', img:'cld5.png'}
    ];

    // this._resolutions = null;
    // this._resolutionValues = [0.41, 0.5, 2, 6, 50];

    this._btnSearch = null;
    this._onSearchClick = null;

    this._toggler = null;
    this._contentContainer = null;

	this._popovers = {};

    this._initialize();
}

SearchOptionsViewController.prototype = {
    _initialize: function() {
        this._view.append($('<div class="search-options">\
            <div class="images-search-section-header">\
                <span style="float:left;padding-top:2px;">Параметры поиска</span><div id="searchOptionsToggler" class="collapse-toggler expanded"></div><div class="clear"></div>\
            </div>\
            <div class="search-options-content">\
                <div class="search-options-block">\
			        <h3>Период</h3>\
			        <div class="period-box">\
				        <table cellpadding="0" cellspacing="0">\
				            <tr>\
					            <td class="la">с </td>\
					            <td class="date-box invalid-value"><input type="text" id="searchStartDate" class="date" maxlength="10" /></td>\
					            <td class="ca">по </td>\
					            <td class="date-box"><input type="text" id="searchEndDate" class="date" maxlength="10" /></td>\
				            </tr>\
				            <tr>\
					            <td class="la">&nbsp;</td>\
					            <td class="annually" colspan="3">\
						            <input id="checkboxYearly" type="checkbox" />\
						            <label for="checkboxYearly">ежегодно</label>\
					            </td>\
				            </tr>\
				        </table>\
			        </div>\
		        </div>\
                \
		        <div class="search-options-block">\
			        <h3>Допустимая облачность</h3>\
			        <div class="slider-container">\
				        <div id="sliderCloudCover"></div>\
			        </div>\
		        </div>\
                \
		        <!-- div class="search-options-block">\
			        <h3>Пространственное разрешение</h3>\
			        <div class="digital-values">\
					    от <input id="txtMinResolution" type="text" readonly="true" />\
					    до <input id="txtMaxResolution" type="text" readonly="true" />\
					    метров\
				    </div>\
			        <div class="slider-container">\
				        <div id="sliderResolution"></div>\
			        </div>\
		        </div -->\
		        <div class="search-options-block-short">\
			        <h3>Каталоги</h3>\
			        <div id="satellitesList"></div>\
			        <div class="clear"></div>\
		        </div>\
		        <input type="button" id="btnSearch" value="Поиск"/>\
		        <div class="clear"></div>\
            </div>\
        </div>'));

        this._toggler = this._view.find('#searchOptionsToggler').click(this._toggleCollapsed.bind(this));
        this._contentContainer = this._view.find('.search-options-content');

        this._startDate = this._view.find('#searchStartDate');
        this._initializeDatePicker(this._startDate);

        var today = new Date();
        this._endDate = this._view.find('#searchEndDate');
        this._endDate.val(this._addLeadingZero(today.getDate()) + '.' + this._addLeadingZero(today.getMonth()+1) + '.' + today.getFullYear());
        this._initializeDatePicker(this._endDate);

        this._yearly = this._view.find('#checkboxYearly');

        this._cloudCover = this._view.find('#sliderCloudCover');
        this._createCloudSlider(this._cloudCover);

        // this._resolutions = this._view.find('#sliderResolution');
        // this._minResolution = this._view.find('#txtMinResolution');
        // this._maxResolution = this._view.find('#txtMaxResolution');
        // this._createResolutionSlider(this._resolutions);

        this._satellitesList = this._view.find('#satellitesList');
        this._createSatellitesList(this._satellitesList);

        // // Update resolution and satellites state
        // this._handleResolutionsSliderMove(this._resolutions.slider('option', 'values'), true);

        this._btnSearch = this._view.find('#btnSearch').click(this._searchClick.bind(this));
    },

    _addLeadingZero: function(value) {
        var withPadding = '0' + value;
        return withPadding.substring(withPadding.length-2);
    },

    _toggleCollapsed: function() {
        if (this._toggler.hasClass('collapsed')) {
            this._toggler.toggleClass('collapsed', false);
            this._toggler.toggleClass('expanded', true);
            this._contentContainer.show();
        } else {
            this._toggler.toggleClass('collapsed', true);
            this._toggler.toggleClass('expanded', false);
            this._contentContainer.hide();
        }
    },

    set_onSearchClick: function(handler) {
        this._onSearchClick = handler;
    },

    _searchClick: function() {
        if (this._onSearchClick)
            this._onSearchClick();
    },

    _initializeDatePicker: function(target) {
        target = $(target);
        target.datepicker({
                    changeMonth: true,
                    changeYear: true,
                    maxDate: 0,

                    showOn: 'button',
	                buttonImage: this._path + 'img/cal.png',
	                buttonImageOnly: true,
	                onSelect: function() { target.parent().removeClass('invalid-value'); },
                    beforeShow: function(input, datepicker) { setTimeout(function() { $(datepicker.dpDiv).css('zIndex', 100); }, 10); }
                })
            .mask('99.99.9999', { placeholder: '_' })
            .focus(function() { target.parent().removeClass('invalid-value'); })
            .blur(function() { if (!this._tryParseDate(target.val())) target.parent().addClass('invalid-value'); }.bind(this));
    },

    _createSatellitesList: function(target) {
        var createColumn = function() {
            return $.create('div', { 'class':'satellites-column' }).appendTo(target);
        };
        var currentColumn;
        for (var index = 0; index < ScanexCatalogHelper.satellites.length; ++index) {
            if (index % 11 == 0) currentColumn = createColumn();
            currentColumn.append(this._createSatelliteItem(index));
        }
    },

	_hideOtherPopovers: function(index){
		for (var id in this._popovers){
			var p = this._popovers[id];
			if(id != index){
				p.popover('hide');
			}
		}
	},

    _createSatelliteItem: function(index) {
        var that = this;
		var source = ScanexCatalogHelper.satellites[index];
        var box = $.create('input', {
                        'type':'checkbox',
                        'value':index+'',
                        'id':'chkSatellite'+index});

        var label = $.create('label', { 'for':'chkSatellite'+index }, source.name);
        box[0].label = label;
		if(source.options){
			var btn = $.create('img', {src: gmxCore.getModulePath('Catalog') + 'img/preferences.png'});
			btn.prop('disabled', true);
			btn.css({marginLeft: 5, cursor: 'pointer', width: 12, height: 12});

			if(source.options.items) {
				var opts = [];
				for (var id in source.options.items){
					var opt = source.options.items[id];
					opts.push('<li style="margin:2px"><input id="platform_' + id + '" type="checkbox" value="' + id + '"><label for="platform_' + id + '" style="margin-left:2px">' + opt.name + '</label></li>');
				}
				var tsid = 'search-options-satellites_' + index.toString();
				var html = '<div><input id="' + tsid + '" type="checkbox" /><label for="' + tsid + '">Все спутники</label><ul>' + opts.join('') + '</ul></div>';
				btn.popover({
					title: source.options.title,
					content: html,
					html: true
				}).on('shown.bs.popover',function(e){
					that._hideOtherPopovers(index);
					var parent = $(e.target).parent();
					var container = parent.find('.popover-content');
					container.find('ul input[type="checkbox"]')
						.each(function(){
							var target = $(this);
							target.prop('checked', source.options.items[target.val()].checked);
						})
						.off()
						.click(function(){
							var target = $(this);
							source.options.items[target.val()].checked = target.prop('checked');
						});
					container.find('#' + tsid).tristate(container, 'ul input[type="checkbox"]');
				});
			}
			else if (source.options.range && source.options.initial){
				var values = [];
				var year = new Date().getFullYear();
				var cols = Math.floor(Math.sqrt(year - source.options.initial + 1));
				values.push('<div>');
				for (var i = source.options.initial, col = 1; i <= year; i++){
					values.push('<span class="scanex-range-value">' + i + '</span>');
					if(col++ % cols == 0){
						values.push('</div><div>');
					}
				}
				values.push('</div>');
				var html = '<div>' + values.join('') + '</div>';
				var update = function(root){
					if(source.options.range && source.options.range.length){
						var min = Math.min.apply(null, source.options.range),
							max = Math.max.apply(null, source.options.range);
						root.find('.scanex-range-value').each(function(){
							var t = $(this);
							var v = parseInt(t.text(), 10);
							if(min <= v && v <= max){
								t.addClass('scanex-range-value-selected');
							}
							else{
								t.removeClass('scanex-range-value-selected');
							}
						});
					}
					else{
						root.find('.scanex-range-value').each(function(){
							var t = $(this);
							t.removeClass('scanex-range-value-selected');
						});
					}
				};
				btn.popover({
					title: source.options.title,
					content: html,
					html: true
				}).on('shown.bs.popover',function(e){
					that._hideOtherPopovers(index);
					var root = $(e.target).parent().find('.popover-content');
					update(root);
					root.find('.scanex-range-value')
						.off()
						.click(function(){
							var t = $(this);
							var v = parseInt(t.text(), 10);
							switch(source.options.range.length){
								case 0:
									source.options.range = [v];
									update(root);
									break;
								case 1:
									source.options.range = source.options.range.concat(v);
									update(root);
									break;
								case 2:
									source.options.range = [];
									update(root);
									break;
								default:
									break;
							}
						});
				});
			}
			this._popovers[index] = btn;
			// box.click(function() {
				// btn.prop('disabled', false);
				// that._updateResolutionsSlider();
			// });
		}
		else{
			// box.click(function() {
				// that._updateResolutionsSlider();
			// });
		}
        return $.create('div')
			.append(box)
			.append(label)
			.append(btn);
    },

    _createCloudSlider: function(target) {
        $(target).slider({
            range: "min",
	        min: 1,
	        max: this._cloudCoverNames.length,
	        value: Math.ceil(this._cloudCoverNames.length / 2)
        });
        // ticks
        var width = 100 / (this._cloudCoverNames.length - 1);
        var left = 0;
        for (var index = 0; index < this._cloudCoverNames.length; ++index) {
            var style = 'left:'+left +'%;width:'+width+'%';
            $.create('div', { 'class':'ui-slider-tick', 'style':style })
                .appendTo(target);
            $.create('div', { 'class':'ui-slider-tick-text cloud-image', 'style':style },
                    $.create('img', { 'src':  this._path + 'img/clouds/' + this._cloudCoverNames[index].img, 'alt':this._cloudCoverNames[index].name, 'title':this._cloudCoverNames[index].name }))
                .appendTo(target);
            left += width;
        }
    },

    // _createResolutionSlider: function(target) {
        // target = $(target);
        // target.slider({
            // range: true,
	        // min: 0,
	        // max: this._resolutionValues.length-1,
	        // values: [0, 0],
	        // slide: function (event, ui) {
	                    // this._handleResolutionsSliderMove(ui.values, true);
	                // }.bind(this)
        // });
        // target.find('.ui-slider-handle:first').removeClass('ui-slider-handle').addClass('ui-slider-handle-left');
        // // ticks
        // var width = 100 / (this._resolutionValues.length - 1);
        // var left = 0;
        // var that = this;
        // for (var index = 0; index < this._resolutionValues.length; ++index) {
            // var style = 'left:'+left+'%;width:'+width+'%';
            // if (index < this._resolutionValues.length-1)
                // $.create('div', { 'class':'ui-slider-selectable-region', 'style':style })
                    // .appendTo(target)
                    // .mousedown(
                        // (function(i) { return function(e) {
                            // that._setSliderValues([i, i+1], true);
                            // e.stopPropagation();
                        // }; })(index)
                    // );
            // $.create('div', { 'class':'ui-slider-tick', 'style':'left:'+left+'%;' })
                // .appendTo(target);
            // $.create('div', { 'class':'ui-slider-tick-text', 'style':style })
                // .html(''+this._resolutionValues[index])
                // .appendTo(target);
            // left += width;
        // }
    // },

    // _handleResolutionsSliderMove: function(values, updateSatellitesSelection) {
        // var min = this._resolutionValues[values[0]];
        // var max = this._resolutionValues[values[1]];
        // this._minResolution.val(min);
	    // this._maxResolution.val(max);
	    // this._updateSatellitesList(min, max, updateSatellitesSelection);
    // },

    // _updateSatellitesList: function(min, max, updateSatellitesSelection) {
        // var boxes = $('#satellitesList :checkbox');
        // boxes.each(function() {
            // var resolution = ScanexCatalogHelper.satellites[this.value].resolution;
			// if(resolution) {
				// var isInRange = resolution >= min && resolution <= max;
				// this.label.toggleClass('disabled', !isInRange);
				// if (updateSatellitesSelection) this.checked = isInRange;
			// }
        // });
    // },

    // _updateResolutionsSlider: function() {
        // var boxes = $('#satellitesList :checkbox:checked');
        // if (boxes.length == 0) return;
        // var sliderValues = this._resolutions.slider('option', 'values');
        // var requiredResolution = [
			// this._resolutionValues[this._resolutionValues.length-1],
			// this._resolutionValues[0]
        // ];
        // boxes.each(function() {
            // var satResolution = ScanexCatalogHelper.satellites[this.value].resolution;
			// if(satResolution) {
				// requiredResolution[0] = Math.min(requiredResolution[0], satResolution);
				// requiredResolution[1] = Math.max(requiredResolution[1], satResolution);
			// }
        // });
        // var index = 0;
        // for (; index < this._resolutionValues.length; ++index) {
            // if (this._resolutionValues[index] >= requiredResolution[0]) {
                // sliderValues[0] = index - (this._resolutionValues[index] > requiredResolution[0]);
                // break;
            // }
        // }
        // for (; index < this._resolutionValues.length; ++index) {
            // if (this._resolutionValues[index] >= requiredResolution[1]) {
                // sliderValues[1] = index;
                // break;
            // }
        // }
        // this._setSliderValues(sliderValues, false);
    // },

    // _setSliderValues: function(values, updateSatellitesSelection) {
        // this._resolutions.slider('option', 'values', values);
        // this._handleResolutionsSliderMove(values, updateSatellitesSelection);
    // },

    get_searchCriteria: function() {
        var scanexSatellites = null,
			rlSheets = null,
			rlImages = null,
			useDate = false;
        this._satellitesList.find(':enabled:checked').each(function() {
            var satellite = ScanexCatalogHelper.satellites[$(this).val()-0];
            // if (satellite.source == 'catalog') catalogSatellites.push(satellite.id);
            // if (satellite.source == 'search') searchSatellites.push(satellite.id);
			if (satellite.source == 'scanex') scanexSatellites = satellite.source;
			if (satellite.source == 'rl_sheets') rlSheets = satellite.source;
			if (satellite.source == 'rl_images') rlImages = satellite.source;
			useDate = !!satellite.useDate;
        });
        var searchCriteria = {
            queryType: 'box',
            dateStart: this._tryParseDate(this._startDate.val()),
            dateEnd: this._tryParseDate(this._endDate.val()),
            isYearly: this._yearly[0].checked,
            cloudCover: this._cloudCover.slider('value'),
            scanexSatellites: scanexSatellites,
			rlSheets: rlSheets,
			rlImages: rlImages,
			useDate: useDate
        };
        return searchCriteria;
    },

	set_searchCriteria: function(data){
		var searchCriteria = data.searchCriteria;
		if(searchCriteria.dateStart) {
			$(this._startDate).datepicker('setDate',new Date(searchCriteria.dateStart));
		}
		if(searchCriteria.dateEnd) {
			$(this._endDate).datepicker('setDate',new Date(searchCriteria.dateEnd));
		}
		this._yearly.prop('checked', searchCriteria.isYearly);
		$(this._cloudCover).slider('value',searchCriteria.cloudCover);
		var source = null;
		var sources = $('.satellites-column input[type="checkbox"]');
		if(searchCriteria.scanexSatellites && data.searchSatellites){
			$(sources.get(0)).prop('checked', true);
			source = ScanexCatalogHelper.findSatelliteById(searchCriteria.scanexSatellites);
			for (var id in source.options.items){
				var sat = source.options.items[id];
				if(sat.id == 'SPOT 5'){
					sat.checked = (data.searchSatellites.indexOf(sat.id) >= 0) && (searchCriteria.spot5products.indexOf(sat.product.toString()) >= 0);
				}
				else {
					sat.checked = data.searchSatellites.indexOf(sat.id) >= 0;
				}
			}
		}
		if(searchCriteria.rlImages && data.rlImages){
			$(sources.get(1)).prop('checked', true);
			source = ScanexCatalogHelper.findSatelliteById(searchCriteria.rlImages);
			for (var id in source.options.items){
				var sat = source.options.items[id];
				sat.checked = data.rlImages.indexOf(sat.id) >= 0;
			}
		}
		if(searchCriteria.rlSheets && data.rlSheets){
			$(sources.get(2)).prop('checked', true);
			source = ScanexCatalogHelper.findSatelliteById(searchCriteria.rlSheets);
			source.options.range = data.rlSheets;
		}
	},

    _tryParseDate: function(value) {
        if (!this._dateRegex.test(value)) return null;
        try {
            return $.datepicker.parseDate(this._currentRegional.dateFormat, value);
        } catch (exception) {
            return null;
        }
    }
}
