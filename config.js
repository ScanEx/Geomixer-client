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

var headerLinks = false; //��������: ����������� gmxViewerUI.headerLinks
var gmxViewerUI = {
	hideLogin    : false, // ������ ���������� � ������������ (����/�����, ��� ������������)
	hideLanguages: false, // ������ ������������ ������
	headerLinks  : false,  // �������� ������ � �����
	hideLogo     : false // �� ���������� ���� � �����
	//logoImage  : "img/geomixer_transpar.png" //����� �������� ���������� � �������� ����
}