// Необходимо подключить JS-библиотеки: utilities.js, gmxCore.js

/** 
* @name Cadastre
* @namespace Загружает кадастровые данные
* @description Загружает кадастровые данные
*/
(function($){

/** Конструктор
 @memberOf Cadastre
 @class Слой кадастровых данных
 @param oContainer Объект, в котором находится контрол (div) - обязательный
 @param sCadastreHost Сайт, с которого требуется брать кадастровые данные
 @param oMap Карта для отрисовки результатов
 @param oMap Контейнер карты, используется для получения размеров картинки в пикселах*/
var Cadastre = function(oContainer, sCadastreHost, oMap, oMapDiv){
	var	div = _div();
	
	var cbDivision, rbNo, rbCostLayer, rbCostByAreaLayer, rbUseType, rbCategory;
	var oDivisionLayer, oCostLayer, oCostByAreaLayer, oUseTypeLayer, oCategoryLayer;
	var oLegend;
	var arrUpdating = [];
	var arrNeedUpdate = [];

	var fnRefreshMap = function(){
		oLegend.style.display = (rbNo.checked)?('none'):('');
		var oExtend = oMap.getVisibleExtent();
		var sQuery = "&bbox="+merc_x(oExtend.minX)+"%2C"+merc_y(oExtend.minY)+"%2C"+merc_x(oExtend.maxX)+"%2C"+merc_y(oExtend.maxY)+"&bboxSR=3395&imageSR=3395&size=" + oMapDiv.clientWidth + "%2C" + oMapDiv.clientHeight + "&f=image";
		if (cbDivision.checked){
			var sUrl = sCadastreHost + "/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32" + sQuery;
			oDivisionLayer.setImage(sUrl, oExtend.minX,oExtend.maxY, oExtend.maxX,oExtend.maxY, oExtend.maxX,oExtend.minY, oExtend.minX, oExtend.minY);
		}
		if (rbCostLayer.checked){
			var sUrl = sCadastreHost + "/Zones/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A1%2C5" + sQuery;
			oCostLayer.setImage(sUrl, oExtend.minX,oExtend.maxY, oExtend.maxX,oExtend.maxY, oExtend.maxX,oExtend.minY, oExtend.minX, oExtend.minY);
			oLegend.src = getAPIHostRoot() + "/api/img/cadastre/Cost.png"; 
		} 
		if (rbCostByAreaLayer.checked){
			var sUrl = sCadastreHost + "/Zones/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A0%2C6" + sQuery;
			oCostByAreaLayer.setImage(sUrl, oExtend.minX,oExtend.maxY, oExtend.maxX,oExtend.maxY, oExtend.maxX,oExtend.minY, oExtend.minX, oExtend.minY);
			oLegend.src = getAPIHostRoot() + "/api/img/cadastre/CostByArea.png"; 
		}
		if (rbUseType.checked){
			var sUrl = sCadastreHost + "/Zones/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A2" + sQuery;
			oUseTypeLayer.setImage(sUrl, oExtend.minX,oExtend.maxY, oExtend.maxX,oExtend.maxY, oExtend.maxX,oExtend.minY, oExtend.minX, oExtend.minY);
			oLegend.src = getAPIHostRoot() + "/api/img/cadastre/UseType_vert.png"; 
		}
		if (rbCategory.checked){
			var sUrl = sCadastreHost + "/Zones/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A3%2C4" + sQuery;
			oCategoryLayer.setImage(sUrl, oExtend.minX,oExtend.maxY, oExtend.maxX,oExtend.maxY, oExtend.maxX,oExtend.minY, oExtend.minX, oExtend.minY);
			oLegend.src = getAPIHostRoot() + "/api/img/cadastre/Category.png"; 
		}

		oDivisionLayer.setVisible(cbDivision.checked);
		oCostLayer.setVisible(rbCostLayer.checked);
		oCostByAreaLayer.setVisible(rbCostByAreaLayer.checked);
		oUseTypeLayer.setVisible(rbUseType.checked);
		oCategoryLayer.setVisible(rbCategory.checked);
	}

	var trs = [];		
	cbDivision = _checkbox(false, 'checkbox');
	cbDivision.onclick = fnRefreshMap;
	trs.push(_tr([_td([cbDivision]), _td([_span([_t("Кадастровое деление")],[['css','marginLeft','3px']])])]));
	
	rbNo = _radio([['attr', 'name', 'Zones'], ['attr', 'checked', 'true']]);
	rbNo.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbNo]), _td([_span([_t("Нет тематической карты")],[['css','marginLeft','3px']])])]));
	rbCostLayer = _radio([['attr', 'name', 'Zones']]);
	rbCostLayer.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbCostLayer]), _td([_span([_t("Кадастровая стоимость")],[['css','marginLeft','3px']])])]));
	rbCostByAreaLayer = _radio([['attr', 'name', 'Zones']]);
	rbCostByAreaLayer.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbCostByAreaLayer]), _td([_span([_t("Кадастровая стоимость за метр")],[['css','marginLeft','3px']])])]));
	rbUseType = _radio([['attr', 'name', 'Zones']]);
	rbUseType.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbUseType]), _td([_span([_t("Виды разрешенного использования")],[['css','marginLeft','3px']])])]));
	rbCategory = _radio([['attr', 'name', 'Zones']]);
	rbCategory.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbCategory]), _td([_span([_t("Категории земель")],[['css','marginLeft','3px']])])]));
	
	oLegend = _img(null, null);
	trs.push(_tr([_td(), _td([oLegend])]));
	oCostLayer = oMap.addObject();
	oCostByAreaLayer = oMap.addObject();
	oUseTypeLayer = oMap.addObject();
	oCategoryLayer = oMap.addObject();
	oDivisionLayer = oMap.addObject();
	
	/** Загружает слой */
	this.load = function(){
		oDivisionLayer.setVisible(cbDivision.checked);
		oCostLayer.setVisible(rbCostLayer.checked);
		oCostByAreaLayer.setVisible(rbCostByAreaLayer.checked);
		oUseTypeLayer.setVisible(rbUseType.checked);
		oCategoryLayer.setVisible(rbCategory.checked);
		oMap.setHandler("onMove", fnRefreshMap);
		
		_(div, [_table([_tbody(trs)])]);
		$(oContainer).after(div);
		fnRefreshMap();
	}
	/** Выгружает слой */
	this.unload = function(){
		oMap.removeHandler("onMove", fnRefreshMap);
		oDivisionLayer.setVisible(false);
		oCostLayer.setVisible(false);
		oCostByAreaLayer.setVisible(false);
		oUseTypeLayer.setVisible(false);
		oCategoryLayer.setVisible(false);
		removeChilds(oContainer);
		bVisible = false;
	}
}

var oCadastre;
var oCadastreLeftMenu = new leftMenu();

var unloadCadastre = function(){
	if(oCadastre != null) oCadastre.unload();
}

var loadCadastre = function(){
	var alreadyLoaded = oCadastreLeftMenu.createWorkCanvas("cadastre", unloadCadastre);
	if (!alreadyLoaded){
		oCadastre = new Cadastre( oCadastreLeftMenu.workCanvas, "http://maps.rosreestr.ru/arcgis/rest/services/Cadastre/", globalFlashMap, document.getElementById("flash"));
	}
	oCadastre.load();
}

var addMenuItems = function(upMenu){
	return [{item: {id:'cadastre', title:_gtxt('Кадастровые данные'),onsel:loadCadastre, onunsel:unloadCadastre},
			parentID: 'loadServerData'}];
}

var publicInterface = {
	Cadastre: Cadastre,
	addMenuItems: addMenuItems
}

gmxCore.addModule("cadastre", publicInterface);

})(jQuery)