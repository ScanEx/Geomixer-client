const ScreenSearchView = require('./Views/ScreenSearchView'),
    ScreenSearchModel = require('./Models/ScreenSearchModel'),
    MyFleetView = require('./Views/MyFleetView'),
    MyFleetModel = require('./Models/MyFleetModel'),
    DbSearchView = require('./Views/DbSearchView'),
    DbSearchModel = require('./Models/DbSearchModel'),
    InfoDialogView = require('./Views/InfoDialogView'),
    Searcher = require('./Search/Searcher');

module.exports = function (options) {

    const _tools = options.tools;

    const calendar1 = $('<div id="aisViewCalendar1"></div>'),
          calendar2 = $('<div id="aisViewCalendar2"></div>'),
          daysLimit = 14;

    // walkaround with focus at first input in ui-dialog
    calendar1.append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');
    calendar2.append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');

    const mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
          dateInterval = new nsGmx.DateInterval();

    dateInterval
        .set('dateBegin', mapDateInterval.get('dateBegin'))
        .set('dateEnd', mapDateInterval.get('dateEnd'))
        .on('change', function (e) { 
//console.log('CHANGE ' + dateInterval.get('dateBegin').toUTCString() + ' ' + dateInterval.get('dateEnd').toUTCString()) 
            let d = new Date(e.attributes.dateEnd.getTime() - msd*daysLimit);            
            _viewCalendar1._dateInputs.datepicker('option', 'minDate', d);
            _viewCalendar1.onChange({ dateBegin: dateInterval.get('dateBegin'), dateEnd: dateInterval.get('dateEnd') });
            _viewCalendar2._dateInputs.datepicker('option', 'minDate', d);
            _viewCalendar2.onChange({ dateBegin: dateInterval.get('dateBegin'), dateEnd: dateInterval.get('dateEnd') });
  
            nsGmx.widgets.commonCalendar.setDateInterval(dateInterval.get("dateBegin"), dateInterval.get("dateEnd")); 

        }.bind(this));
    _tools.historyInterval = dateInterval;
    const msd = 24*3600000,
    _viewCalendar1 = new nsGmx.CalendarWidget({
        dateInterval: dateInterval,
        name: 'searchInterval',
        container: calendar1,
        //dateMin: new Date(0, 0, 0),        
        dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - msd*(daysLimit-1)),
        dateMax: new Date(3015, 1, 1),
        dateFormat: 'dd.mm.yy',
        minimized: false,
        showSwitcher: false,
        dateBegin: new Date(),
        dateEnd: new Date(2000, 10, 10),
        //buttonImage: 'img/calendar.png'
    }),
    _viewCalendar2 = new nsGmx.CalendarWidget({
        dateInterval: dateInterval,
        name: 'searchInterval',
        container: calendar2,
        //dateMin: new Date(0, 0, 0),        
        dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - msd*(daysLimit-1)),
        dateMax: new Date(3015, 1, 1),
        dateFormat: 'dd.mm.yy',
        minimized: false,
        showSwitcher: false,
        dateBegin: new Date(),
        dateEnd: new Date(2000, 10, 10),
        //buttonImage: 'img/calendar.png'
    })

    let td = calendar1.find('tr:nth-of-type(1) td');
    td.eq(1).after('<td style="font-weight:bold">&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</td>');
    td.eq(td.length - 1).after('<td>&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="'+_gtxt('AISSearch2.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg"></td>');
    calendar1.find('.default_date').on('click', () => {
        let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
        _viewCalendar1.getDateInterval().set('dateBegin', db.dateBegin);
        _viewCalendar1.getDateInterval().set('dateEnd', db.dateEnd);
        _viewCalendar2.getDateInterval().set('dateBegin', db.dateBegin);
        _viewCalendar2.getDateInterval().set('dateEnd', db.dateEnd);
        nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
    });
    
    td = calendar2.find('tr:nth-of-type(1) td');
    td.eq(1).after('<td style="font-weight:bold">&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</td>');
    td.eq(td.length - 1).after('<td>&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="'+_gtxt('AISSearch2.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg"></td>');
    calendar2.find('.default_date').on('click', () => {
        let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
        _viewCalendar1.getDateInterval().set('dateBegin', db.dateBegin);
        _viewCalendar1.getDateInterval().set('dateEnd', db.dateEnd);
        _viewCalendar2.getDateInterval().set('dateBegin', db.dateBegin);
        _viewCalendar2.getDateInterval().set('dateEnd', db.dateEnd);
        nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
    });

    ///////////////////////////////////////////////
    
    const _modulePath = options.modulePath,
        _searcher = new Searcher(options),
        _mfm = new MyFleetModel({aisLayerSearcher:_searcher, toolbox:_tools, modulePath: _modulePath}),
        _ssm = new ScreenSearchModel({ aisLayerSearcher: _searcher, myFleetModel: _mfm, vesselLegend: options.vesselLegend }),
        _dbsm = new DbSearchModel(_searcher),
        _dbsv = new DbSearchView(_dbsm, options, _tools, _viewCalendar1),
        _ssv = new ScreenSearchView(_ssm, _tools),
        _mfv = new MyFleetView(_mfm, _tools, _viewCalendar2),
        _idv = new InfoDialogView({
            tools:_tools,
            aisLayerSearcher: _searcher, 
            modulePath: _modulePath,
            aisView: _dbsv, 
            myFleetView: _mfv,
            menuId: options.menuId
        });
        _ssv.infoDialogView = _idv;
        _mfv.infoDialogView = _idv;
        _dbsv.infoDialogView = _idv;
    return {
        // get tools(){
        //     return _tools;
        // },
        get infoDialogView(){
            return _idv;
        },
        create: function () {
            return [ _mfv, _dbsv, _ssv ];
        }
    };
}