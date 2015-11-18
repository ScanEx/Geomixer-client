var nsCatalog = nsCatalog || {};
nsCatalog.Controls = nsCatalog.Controls || {};

(function($){
  var SearchOptionsView = function(view, path, userInfo, dataSources) {
    this._view = $(view);
    this._path = path;
    this._userInfo = userInfo;
    this._dataSources = dataSources;
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
  };

  SearchOptionsView.prototype = {
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
      <div class="search-options-block">\
      <h3>Допустимая облачность</h3>\
      <div class="slider-container">\
      <div id="sliderCloudCover"></div>\
      </div>\
      </div>\
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

    _searchClick: function() {
      $(this).trigger('search');
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

    updateDataSources: function (){
      var ds = Object.keys(this._dataSources).reduce(function(a, k) {
        var d = this._dataSources[k];
        a[d.id] = d;
        return a;
      }.bind(this), {});
      this._view.find('.satellites-column input[type="checkbox"]').each(function(i, x){
        var $x = $(x);
        $x.prop('checked', ds[$x.val()].checked);
      });
    },

    _createSatellitesList: function(target) {
      var createColumn = function() {
        return $.create('div', { 'class':'satellites-column' }).appendTo(target);
      };
      var currentColumn = createColumn();
      for (var id in this._dataSources) {
        var dataSource = this._dataSources[id];
        currentColumn.append(this._createSatelliteItem(dataSource, id));
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

    _createSatelliteItem: function(dataSource) {
      var that = this;
      var box = $.create('input', {
        'type':'checkbox',
        'value': dataSource.id,
        'id': 'chkSatellite' + '_' + dataSource.id});

        box.prop('checked', dataSource.checked);
        box.on('click', function(e) { dataSource.checked = $(e.target).prop('checked'); });

        var label = $.create('label', { 'for':'chkSatellite' + '_' + dataSource.id }, dataSource.title);
        box[0].label = label;
        var btn = $.create('img', {src: gmxCore.getModulePath('Catalog') + 'img/preferences.png'});
        btn.prop('disabled', true);
        btn.css({marginLeft: 5, cursor: 'pointer', width: 12, height: 12});

        if(dataSource.satellites) {
          var opts = [];
          for (var id in dataSource.satellites){
            var opt = dataSource.satellites[id];
            opts.push('<li style="margin:2px"><input id="platform_' + id + '" type="checkbox" value="' + id + '"><label for="platform_' + id + '" style="margin-left:2px">' + opt.name + '</label></li>');
          }
          var tsid = 'search-options-satellites_' + dataSource.id;
          var html = '<div><input id="' + tsid + '" type="checkbox" /><label for="' + tsid + '">Все спутники</label><ul>' + opts.join('') + '</ul></div>';
          btn.popover({
            title: dataSource.title,
            content: html,
            html: true
          }).on('shown.bs.popover',function(e){
            that._hideOtherPopovers(dataSource.id);
            var parent = $(e.target).parent();
            var container = parent.find('.popover-content');
            container.find('ul input[type="checkbox"]')
            .each(function(){
              var target = $(this);
              target.prop('checked', dataSource.satellites[target.val()].checked);
            })
            .off()
            .click(function(){
              var target = $(this);
              dataSource.satellites[target.val()].checked = target.prop('checked');
            });
            container.find('#' + tsid).tristate(container, 'ul input[type="checkbox"]');
          });
        }
        else if (dataSource.range && dataSource.initial){
          var values = [];
          var year = new Date().getFullYear();
          var cols = Math.floor(Math.sqrt(year - dataSource.initial + 1));
          values.push('<div>');
          for (var i = dataSource.initial, col = 1; i <= year; i++){
            values.push('<span class="scanex-range-value">' + i + '</span>');
            if(col++ % cols == 0){
              values.push('</div><div>');
            }
          }
          values.push('</div>');
          var html = '<div>' + values.join('') + '</div>';
          var update = function(root){
            if(dataSource.range && dataSource.range.length){
              var min = Math.min.apply(null, dataSource.range),
              max = Math.max.apply(null, dataSource.range);
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
            title: dataSource.title,
            content: html,
            html: true
          }).on('shown.bs.popover',function(e){
            that._hideOtherPopovers(dataSource.id);
            var root = $(e.target).parent().find('.popover-content');
            update(root);
            root.find('.scanex-range-value')
            .off()
            .click(function(){
              var t = $(this);
              var v = parseInt(t.text(), 10);
              switch(dataSource.range.length){
                case 0:
                  dataSource.range = [v];
                  update(root);
                  break;
                case 1:
                  dataSource.range = dataSource.range.concat(v);
                  update(root);
                  break;
                case 2:
                  dataSource.range = [];
                  update(root);
                  break;
                default:
                  break;
              }
            });
          });
        }
        this._popovers[dataSource.id] = btn;
        // box.click(function() {
        // btn.prop('disabled', false);
        // that._updateResolutionsSlider();
        // });

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

      getSearchOptions: function() {
        return {
          queryType: 'box',
          dateStart: this._tryParseDate(this._startDate.val()),
          dateEnd: this._tryParseDate(this._endDate.val()),
          isYearly: this._yearly[0].checked,
          cloudCover: this._cloudCover.slider('value')
        };
      },

      setSearchOptions: function(data){
        var searchCriteria = data.searchCriteria;
        if(searchCriteria.dateStart) {
          $(this._startDate).datepicker('setDate', new Date(searchCriteria.dateStart));
        }
        if(searchCriteria.dateEnd) {
          $(this._endDate).datepicker('setDate', new Date(searchCriteria.dateEnd));
        }
        this._yearly.prop('checked', searchCriteria.isYearly);
        $(this._cloudCover).slider('value',searchCriteria.cloudCover);
        var source = null;
        var sources = $('.satellites-column input[type="checkbox"]');

        var ds = data.dataSources;
        Object.keys(this._dataSources).forEach(function(s){
          var d = this._dataSources[s];
          d.checked = ds.hasOwnProperty(s);
          if(d.checked){
            Object.keys(d.satellites).forEach(function(k){
              d.satellites[k].checked = ds[s].indexOf(k) >= 0;
            });
          }
        }.bind(this));

        this.updateDataSources();        
      },

      _tryParseDate: function(value) {
        if (!this._dateRegex.test(value)) return null;
        try {
          return $.datepicker.parseDate(this._currentRegional.dateFormat, value);
        } catch (exception) {
          return null;
        }
      }
    };

    nsCatalog.Controls.SearchOptionsView = SearchOptionsView;

  }(jQuery));
