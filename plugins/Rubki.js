(function rubki($, rubkiLayerID, scenesLayerID){
var oMap;

_translationsHash.addtext("rus", {
	"Нарушения" : "Нарушения"
});
_translationsHash.addtext("eng", {
	"Нарушения" : "Violation"
});

var showInfo = function(obj)
{
	var trs = [];
    var typeSpans = {};
	for (var key in obj.properties)
    {
		var objValue = obj.properties[key];
		if (objValue.indexOf && objValue.indexOf('/Date(') != -1) 
			objValue = new Date(Number(objValue.replace('/Date(', '').replace(')/', ''))).toDateString();
		else if(objValue.TotalMilliseconds) 
			objValue = new Date(objValue.TotalMilliseconds).toTimeString();
        var content = _div(),
            contentText = String(objValue);
        
        if (contentText.indexOf("http://") == 0 || contentText.indexOf("www.") == 0)
            contentText = "<a href=\"" + contentText + "\" target=\"_blank\">" + contentText + "</a>";
        
        content.innerHTML = contentText;
        
        var typeSpan = _span([_t(key)]);
        
        typeSpans[key] = typeSpan;
        
        trs.push(_tr([_td([typeSpan], [['css','width','30%']]), _td([content], [['css','width','70%']])]));
    }
	
	var div = _div();
		
	_(div, [_table([_tbody(trs)], [['dir','className','vectorInfoParams']])]);
	
	showDialog('Атрибуты', div, 320, 50 + trs.length * 17 , false, false, false);
}

var infoIcon = function(callback){
	var info = _span([_t('i')], [['css','fontWeight','bold'],['css','fontStyle','italic'],['css','margin','0px 5px'],['css','cursor','pointer']]);
	info.onclick = callback;
	return info;
}

var editIcon = function(layerID, fnGetID) {
	var edit;
	if (oMap.layers[layerID].properties.Access == 'edit') {
		edit = makeImageButton('img/edit.png');
		edit.onclick = function()
        {
			fnGetID(function(id){
				if(id) new nsGmx.EditObjectControl(layerID, id);
			});
        }
		edit.style.width = '9px';
	}
	else {
		edit = _span();
	}
	return edit;
}

var cbtext = function(oContainer, sceneID, sceneDesc, callback){
	var cb = _checkbox(true, 'checkbox');
	var txt = _span([_b([_t(sceneDesc + ': ')]), _t(sceneID)]);
	var info = infoIcon(function(){
		oMap.layers[scenesLayerID].getFeatures('"SCENEID" = \'' + sceneID + '\'', function(features){
			if (features.length > 1) {
				alert('Attribute SCENEID is not unique') 
			}
			else if (features.length == 0) { 
				alert('Layer does not contains this scene') 
			}
			else { 
				showInfo(features[0]); 
			}
		});
		
	});
	
	var edit = editIcon(scenesLayerID, function(getIDCallback){
		oMap.layers[scenesLayerID].getFeatures('"SCENEID" = \'' + sceneID + '\'', function(features){
			if (features.length > 1) { 
				alert('Attribute SCENEID is not unique') 
			}
			else if (features.length == 0) { 
				alert('Layer does not contains this scene') 
			}
			else { 
				getIDCallback(features[0].properties.ogc_fid);
			}
		});
	});
	
	_(oContainer, [_div([cb, txt, info, edit], [['css', 'margin', '3px']])]);
	
	this.sceneID = sceneID;
	cb.onclick = callback;
	this.checked = function(){ 
		return cb.checked;
	}
}

var clsScenesList = function(oContainer){
	var oldSQL = [];
	var arrFilters = [];
	var bFilterApplied = false;
    var topImageDef = null;
	var oCalendar = nsGmx.widgets.getCommonCalendar();
	var Filter = function(){
		var sFilter = '';
		for (var i=0; i<arrFilters.length; i++){
			if (arrFilters[i].checked()){
				if (sFilter != '') sFilter += ' OR ';
				sFilter += '"SCENEID" = \'' + arrFilters[i].sceneID + '\'';
			}
		}
		if (sFilter == '') sFilter = '"SCENEID" = \'NOT_FOUND\'';
		for (var i=0; i<oMap.layers[scenesLayerID].filters.length; i++)	{
				 oMap.layers[scenesLayerID].filters[i].setFilter(sFilter);
			}
            
        topImageDef && topImageDef.done(function(id)
        {
            setTimeout(function()
            {
                oMap.layers[scenesLayerID].bringToTopImage(id);
            }, 1000)
        })
	}
	
	this.FilterScenes = function(oRubka){
		this.ClearFilter();
		var sceneIDs = [];
        topImageDef = null;
		// if (oRubka.obj.properties.HRSD_ID) sceneIDs.push({id: oRubka.obj.properties.HRSD_ID, desc: "HRSD_ID"});
		if (oRubka.obj.properties.MRSD_ID)
        {
            sceneIDs.push({id: oRubka.obj.properties.MRSD_ID, desc: "Базовый снимок"});
            topImageDef = $.Deferred();
            oMap.layers[scenesLayerID].getFeatures('"SCENEID" = \'' + oRubka.obj.properties.MRSD_ID + '\'', function(features){
                if (features && features.length === 1)
                    topImageDef.resolve(features[0].properties.ogc_fid)
                else
                    topImageDef.reject()
            })
        }
		if (oRubka.obj.properties.AddRSD_ID1) sceneIDs.push({id: oRubka.obj.properties.AddRSD_ID1, desc: "Проверочный снимок"});
		// if (oRubka.obj.properties.AddRSD_ID2) sceneIDs.push({id: oRubka.obj.properties.AddRSD_ID2, desc: "AddRSD_ID2"});
		if (sceneIDs.length == 0) return;
		
		var contour = makeLinkButton('Нарушение');
		contour.onclick = function(){
			var oExtent = getBounds(oRubka.obj.getGeometry().coordinates);
			oMap.zoomToExtent(oExtent.minX, oExtent.minY, oExtent.maxX, oExtent.maxY);
		}
		var info = infoIcon(function(){ 
			showInfo(oRubka.obj);
		});
		var edit = editIcon(rubkiLayerID, function(getIDCallback){
			getIDCallback(oRubka.obj.properties.ogc_fid);
		});
		_(oContainer, [_div([contour, info, edit])]);
		
		
		for (var i=0; i<sceneIDs.length; i++){
			arrFilters.push(new cbtext(oContainer, sceneIDs[i].id, sceneIDs[i].desc, function(){
				Filter();
			}));
		}
		var delAll = makeLinkButton(_gtxt("Очистить"));
		delAll.onclick = this.ClearFilter;
		_(oContainer, [delAll]);
		//alert(sFilter);
		//oMap.layers[scenesLayerID].setVisibilityFilter(sFilter);
		if (!bFilterApplied) {
			for (var i=0; i<oMap.layers[scenesLayerID].filters.length; i++)	{
				oldSQL[i] = oMap.layers[scenesLayerID].filters[i]._sql;
			}
		}
		Filter();
		bFilterApplied = true;
		oMap.layers[scenesLayerID].setDateInterval(new Date(0), new Date());
		oCalendar.unbindLayer(scenesLayerID);
	}
	
	this.ClearFilter = function(){
		$(oContainer).empty();
		arrFilters = [];
		if (bFilterApplied) {
			for (var i=0; i<oMap.layers[scenesLayerID].filters.length; i++)	{
				 oMap.layers[scenesLayerID].filters[i].setFilter(oldSQL[i]);
			}
		}
		bFilterApplied = false;
		oMap.layers[scenesLayerID].setDateInterval(oCalendar.getDateBegin(), oCalendar.getDateEnd());
		// oCalendar.bindLayer(scenesLayerID);
	}
}

var oMenu = new leftMenu();
var oScenesList;
var oRubkiDiv = _div(null, [['css', 'margin', '5px']]);
var fnUnload = function(){
	oScenesList.ClearFilter();
}
var loadMenu = function(){
	if (oMenu != null){
		var alreadyLoaded = oMenu.createWorkCanvas("rubki", fnUnload);
		if(!alreadyLoaded) _(oMenu.workCanvas, [oRubkiDiv]);
	}
}
	

var afterViewer = function(){
	oMap = globalFlashMap;
    for (var i=0; i<oMap.layers[scenesLayerID].filters.length; i++)	{
         oMap.layers[scenesLayerID].filters[i].setFilter('"SCENEID" = \'NOT_FOUND\'');
    }
    
	oScenesList = new clsScenesList(oRubkiDiv);
	oMap.layers[rubkiLayerID].addListener('onClick', function(obj){
		oScenesList.FilterScenes(obj);
		loadMenu();
	});
}

var addMenuItems = function(){
	return [{item: {id:'rubki', title:_gtxt('Нарушения'), func:loadMenu},
			parentID: 'viewMenu'}];
}
 
var publicInterface = {
	afterViewer: afterViewer,
	addMenuItems: addMenuItems
}

gmxCore.addModule("rubki", publicInterface);

})(jQuery, '59396EAE2E8E443AB04FDA90EC99E51C', 'F1D6EBB2444F4877B16FD367C6578A01');