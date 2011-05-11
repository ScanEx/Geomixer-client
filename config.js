var defaultMapID = 'DefaultMap';
//var mapHostName = 'maps.kosmosnimki.ru';
var mapHostName = false;
var apiKey = '33959EF7AFB4FB92EEC2E7B73AE8458B';
var serverBase = 'http://maps.kosmosnimki.ru/';
var copyright = false;
var pageTitle = false;
var useCatalog = true;

//var mapsSite = true;
//var apikeySendHosts = false;
//var apikeyRequestHost = false;

var baseMap = {
	hostName: false,
	id: false,
	mapLayerID: false,
	satelliteLayerID: false
}

var headerLinks = false; //устарело: используйте gmxViewerUI.headerLinks
var gmxViewerUI = {
	hideLogin    : false, // скрыть информацию о пользователе (вход/выход, имя пользователя)
	hideLanguages: false, // скрыть переключалку языков
	headerLinks  : false,  // показать ссылки в шапке
	hideLogo     : false // не показывать лого в шапке
	//logoImage  : "img/geomixer_transpar.png" //какую картинку показывать в качестве лого
}