var defaultMapID = 'DefaultMap';
// var mapHostName = 'maps.kosmosnimki.ru';
var mapHostName = false;
var apiKey = '33959EF7AFB4FB92EEC2E7B73AE8458B';
// var serverBase = 'http://mapstest.kosmosnimki.ru/';
var serverBase = 'http://mapstest.kosmosnimki.ru/';
// var serverBase = 'http://localhost/';
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

var headerLinks = false; //��������: ����������� gmxViewerUI.headerLinks
var gmxViewerUI = {
	hideLogin    : false, // ������ ���������� � ������������ (����/�����, ��� ������������)
	hideLanguages: false, // ������ ������������ ������
	headerLinks  : false,  // �������� ������ � �����
	hideLogo     : false // �� ���������� ���� � �����
	//logoImage  : "img/geomixer_transpar.png" //����� �������� ���������� � �������� ����
}

//var gmxJSHost = 'http://maps.kosmosnimki.ru/api/';
//var gmxPlugins = { useWikiPlugin: true };
var gmxPlugins =  
{
	// TestMapplets: {file: 'TestMappletsPlugin.js', module: 'TestMappletsPlugin'}
	FiresMapplet2: {file: 'FiresMapplet2.js', module: 'FiresMapplet2'}
};