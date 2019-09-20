
require('./All.css');
const SelectControl = require('./Controls/SelectControl.js');
module.exports = function (viewFactory, groups) {
    let _leftMenuBlock,
        _canvas = document.createElement('div'),
        _views = viewFactory.create(),
        _activeView = _views[0],
        _isReady = false,
        _instruments = document.createElement('div');

        _canvas.className = 'rc_panel';        
        _instruments.className = 'rc_instruments';
        _instruments.innerHTML = `<table><tr><td>${_gtxt('RasterCatalog.filter')}</td><td><div class="rc_filter"></div></td></tr></table>
        <table><tr><td style="padding-right: 55px;"><div class="calendar"></div></td>
        </tr></table>`;
        /*
        `<table><tr><td>${_gtxt('RasterCatalog.filter')}</td><td><div class="rc_filter"></div></td></tr></table>
        <table><tr><td style="padding-right: 55px;"><div class="calendar"></div></td>
        </tr> 
        <tr><td>       
        <span>${_gtxt('RasterCatalog.timeline')}</span>
        <label class="sync-switch switch"><input type="checkbox"><div class="sync-switch-slider switch-slider round"></div></label>
        </td></tr>
        </table>`;
        */
////////////////////////////////////////

    const _toggleTimeline = function(layerID, add){
        let tlc = nsGmx.timeLineControl,
            layer = nsGmx.gmxMap.layersByID[layerID];
        if (add) {
            if (!tlc._map) { nsGmx.leafletMap.addControl(tlc); }
            tlc.addLayer(layer);
        } else {
            if (tlc._map)
            tlc.removeLayer(layer);
        }    
    },  
    _addCalendar = function(){
            
        let calendar = _canvas.querySelector('.calendar');
        // walkaround with focus at first input in ui-dialog
        calendar.innerHTML = ('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');

        let mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
            dateInterval = new nsGmx.DateInterval();

        dateInterval
            .set('dateBegin', mapDateInterval.get('dateBegin'))
            .set('dateEnd', mapDateInterval.get('dateEnd'))
            .on('change', function (e) {
//console.log(dateInterval.get('dateBegin')) 
                nsGmx.widgets.commonCalendar.setDateInterval(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
            }.bind(this));

        this.calendar = new nsGmx.CalendarWidget({
            dateInterval: dateInterval,
            name: 'catalogInterval',
            container: calendar,
            dateMin: new Date(0, 0, 0),
            dateMax: new Date(3015, 1, 1),
            dateFormat: 'dd.mm.yy',
            minimized: false,
            showSwitcher: false
        })

        let tr = calendar.querySelector('tr:nth-of-type(1)');
        tr.insertCell(2).innerHTML = '&nbsp;&nbsp;–&nbsp;&nbsp;';
        tr.insertCell(5).innerHTML = 
        '&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="'+_gtxt('RasterCatalog.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg">';
    
        calendar.querySelector('.default_date').addEventListener('click', () => {
            let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
            this.calendar.getDateInterval().set('dateBegin', db.dateBegin);
            this.calendar.getDateInterval().set('dateEnd', db.dateEnd);
            nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
        });

    },  
    _create = function (sidebarPane) {
        _canvas.append(_instruments);
        this.sidebarPane.append(_canvas);

        /*
        let timelineSwitch = _instruments.querySelector('.switch input');
        timelineSwitch.addEventListener('click', e => {
            let ls = JSON.parse(localStorage.getItem('layerState'));
            let layers = _activeView.container.querySelectorAll('.rc_content li table');
            for (let i = 0; i < layers.length; ++i) {
//console.log(layers[i].id, nsGmx.gmxMap.layersByID[layers[i].id.replace(/^layer/, '')]._gmx)
                let lid = layers[i].id.replace(/^layer/, ''),
                props = nsGmx.gmxMap.layersByID[lid]._gmx && nsGmx.gmxMap.layersByID[lid]._gmx.properties;
                if (layers[i].getBoundingClientRect().width) 
                    if (nsGmx.timeLineControl && props && props.Temporal && (props.IsRasterCatalog || (props.Quicklook && props.Quicklook !== 'null')))               
                    if (timelineSwitch.checked)
                        _toggleTimeline(lid, true);
                    else
                        _toggleTimeline(lid, false);
            }
        })
        */

        let gs = localStorage.getItem('groupState'),
            activGroup = !gs ? 0 : (groups.indexOf(gs) + 1);
        const select = new SelectControl(_instruments.querySelector('.rc_filter'), [_gtxt('RasterCatalog.all')].concat(groups), activGroup, _activeView.filter.bind(_activeView));
    
        _views.forEach((v, i) => {
                    v.instruments = _instruments;
                    _canvas.append(v.frame);
                });
 
        _activeView && _activeView.show();
    }

    const _returnInstance = {
        create: function(sidebarPane){
            this.sidebarPane = sidebarPane;
            _create.call(this);
            _addCalendar.call(this);
        },
        show: function () {
            if (!_isReady) { 
                //_create.call(this);
                _views.forEach((v, i) => {
                    v.resize();
                });             
                _isReady = true;
            }
            //_activeView && _activeView.show();
        }
    };
    return _returnInstance;
}

