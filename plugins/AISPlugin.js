(function wiki($, map){

var pluginPath = null;

_translationsHash.addtext("rus", {
	"Фильтровать AIS треки" : "Фильтровать AIS треки"
});
_translationsHash.addtext("eng", {
	"Фильтровать AIS треки" : "Filter AIS tracks"
});

var datetimeRegexp = /(\d\d)\.(\d\d)\.(\d\d\d\d) (\d\d):(\d\d):(\d\d)/;
var timeOffset = (new Date()).getTimezoneOffset()*60*1000;
var timeRadius = 3*3600*1000;

var afterViewer = function(params){
    var _calendar = nsGmx.widgets.commonCalendar.get();
    if (_calendar)
    {
        _calendar.setShowTime(true);
        _calendar.setTimeBegin(0, 0, 0);
    }
    
    nsGmx.ContextMenuController.addContextMenuElem({
		title: _gtxt("Фильтровать AIS треки"),
		isVisible: function(context)
		{
            return _calendar && context.elem.type === 'Raster' && datetimeRegexp.test(context.elem.title);
		},
		isSeparatorBefore: function(layerManagerFlag, elem)
		{
			return true;
		},
		clickCallback: function(context)
		{
            if (!_calendar) return;
            var re = context.elem.title.match(datetimeRegexp);
            var dateLocal = new Date(parseInt(re[3], 10), parseInt(re[2], 10)-1, parseInt(re[1], 10), parseInt(re[4], 10), parseInt(re[5], 10), parseInt(re[6], 10), 0);
            var date = new Date(dateLocal.valueOf() - timeOffset);
			_calendar.setDateBegin(new Date(date.valueOf() - timeRadius));
			_calendar.setDateEnd(new Date(date.valueOf() + timeRadius));
            
            var calendarModeController = _calendar.getModeController();
            calendarModeController.setMode( calendarModeController.ADVANCED_MODE );
		}
	}, ['Layer']);
}
 
var publicInterface = {
	afterViewer: afterViewer
}

gmxCore.addModule("AISPlugin", publicInterface);

})(jQuery, globalFlashMap)