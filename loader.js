(function(){

var gmxJSHost = window.gmxJSHost || "";

//подставляет к локальному имени файла хост (window.gmxJSHost) и, опционально, рандомное поле для сброса кэша (window.gmxDropBrowserCache)
var _getFileName = function( localName )
{
	return gmxJSHost + localName + ( window.gmxDropBrowserCache ? "?" + Math.random() : "");
}

//последовательно загружает все файлы js и вызывает после этого callback
var loadJS = function(callback)
{
    var fileList = [/*#buildinclude<load_js.txt>*/];
    
    var LABInstance = $LAB;
		
    if (fileList.length)
    {
        for (var f = 0; f < fileList.length-1; f++)
            LABInstance = LABInstance.script(_getFileName(fileList[f])).wait();
            
        LABInstance.script(_getFileName(fileList[fileList.length-1])).wait(callback);
    }
    else
        callback();
}

$LAB.
	script(_getFileName("jquery/jquery-1.5.1.min.js")).wait().
	script(_getFileName("jquery/jquery.getCSS.js")).wait(function()
	{
		$.getCSS(_getFileName("common.css"));
		$.getCSS(_getFileName("jquery/jquery-ui-1.7.2.custom.css"));
		$.getCSS(_getFileName("colorpicker/css/colorpicker.css"));
		$.getCSS(_getFileName("menu.css"));
		$.getCSS(_getFileName("table.css"));
		$.getCSS(_getFileName("buttons.css"));
		$.getCSS(_getFileName("treeview.css"));
		$.getCSS(_getFileName("search.css"));
	}).
	script(_getFileName("jquery/jquery-ui-1.8.10.custom.min.js")).wait().
	script(_getFileName("jquery/ui.datepicker-ru.js")).wait().
	script(_getFileName("jquery/jquery.treeview.js")).wait().
	
	script(_getFileName("colorpicker/js/colorpicker.js")).wait().
	script(_getFileName("colorpicker/js/eye.js")).wait().
	script(_getFileName("colorpicker/js/utils.js")).wait(function(){
	
loadJS(function()
{
    nsGmx.initGeoMixer();
});

}); //$LAB

})();