var nsGmx = nsGmx || {};

(function($){

/**
Фильтрует слои со спутниковыми покрытиями по облачности. Поддерживает фильтрацию дополнительных карт.
* @class 
*/
var CoverControl2 = function()
{
	this.cloudsIndexes = [];
	this.currCloudsIndex = 4;
	this.commonStyles = null;
	this.cloudsCount = 0;
	this.coverLayers = [];
    this._parent = null;
    
    CoverControlInstance.addInstance(this);
}

/**
* @function
*/
CoverControl2.prototype.saveState = function()
{
	return { currCloudsIndex: this.currCloudsIndex };
}

/**
* @function
*/
CoverControl2.prototype.loadState = function( data )
{
	this.currCloudsIndex = data.currCloudsIndex;
	
	$(".ui-slider", this._parent).slider("value", data.currCloudsIndex );
	
	if (typeof this.cloudsIndexes[data.currCloudsIndex] !== 'undefined')
		_title($(".ui-slider", this._parent)[0].firstChild, this.cloudsIndexes[data.currCloudsIndex].name);
}

CoverControl2.prototype._updateStyles = function()
{
	if ( this.commonStyles || this.coverLayers.length == 0 || !(this.coverLayers[0] in globalFlashMap.layers) ) return;
	
	var commonStyles = globalFlashMap.layers[this.coverLayers[0]].properties.styles,
		cloudsCount = 0;
	
	for (var i = 0; i < this._icons.length; i++)
		this.cloudsIndexes.push({icon:this._icons[i]});
	
	for (var i = 0; i < commonStyles.length; ++i)
	{
		if (this.cloudsIndexes[i])
			this.cloudsIndexes[i].name = commonStyles[i].Name;
		
		cloudsCount++;
	}
	
	if ( typeof this._initCloudIndex !== 'undefined' )
		this.currCloudsIndex = this._initCloudIndex;
		
	this.cloudsCount = Math.round(cloudsCount / 2);
	this.commonStyles = commonStyles;
	
	if (typeof this.cloudsIndexes[this.currCloudsIndex] !== 'undefined' && $(".ui-slider", this._parent).length > 0)
		_title($(".ui-slider", this._parent)[0].firstChild, this.cloudsIndexes[this.currCloudsIndex].name);
}

CoverControl2.prototype._updateLayers = function()
{
	if (typeof _mapHelper === 'undefined') return;
    
	//проверим основную карту
	this.coverLayers = nsMapCommon.selectLayersFromTree( globalFlashMap, _layersTree._mapTree, this._coverLayersDescription ).names();

	//и все дополнительные тоже будем фильтровать
	if (typeof _queryExternalMaps.mapsCanvas != 'undefined')
	{
		for (var m = 0; m < _queryExternalMaps.mapsCanvas.childNodes.length; m++)
		{
			var mapElem = _queryExternalMaps.mapsCanvas.childNodes[m].childNodes[0];
			if (mapElem.extLayersTree)
				this.coverLayers = this.coverLayers.concat( nsMapCommon.selectLayersFromTree( globalFlashMap, mapElem.extLayersTree._mapTree, this._coverLayersDescription ).names() );
		}
	}
}

CoverControl2.prototype._addWidget = function()
{
	if (this.cloudsIndexes.length == 0 || !this._parent ) return;
	
	var	cloudsSlider = nsGmx.Controls.createSlider(this.currCloudsIndex, function(){}),
		_this = this;
	
	$(cloudsSlider).slider("option", "step", 1);
	$(cloudsSlider).slider("option", "min", 0);
	$(cloudsSlider).slider("option", "max", this.cloudsIndexes.length - 1);
	$(cloudsSlider).slider("option", "value", this.currCloudsIndex);
	$(cloudsSlider).bind("slidestop", function(event, ui)
	{
		_this.currCloudsIndex = ui.value;
		
		_this.setFilters();
		
		_title(cloudsSlider.firstChild, _this.cloudsIndexes[_this.currCloudsIndex].name);
	});
	
	cloudsSlider.style.margin = '10px 3px';
	
	// добавляем раскраску
	cloudsSlider.style.backgroundImage = '';
	var colorTds = [];
	for (var i = 1; i < this.cloudsCount; i++)
	{
		colorTds.push(_td(null,[['css','width', Math.round(100 / (this.cloudsCount - 1)) + 'px'], ['css','height','7px'], ['css','backgroundColor', nsGmx.Utils.convertColor(this.commonStyles[i].RenderStyle.fill.color)]]))
	}
	
	_(cloudsSlider, [_table([_tbody([_tr(colorTds)])],[['css','position','absolute'],['css','left','0px'],['css','top','0px'],['css','border','1px solid #999999']])])
	
	_title(cloudsSlider, _gtxt("Облачность"));
	_title(cloudsSlider.firstChild, this.cloudsIndexes[this.currCloudsIndex].name);
	
	var cloudsLabelDiv = _div(null,[['css','height','16px'],['css','position','relative']]);
	
	for (var i = 0; i < this.cloudsIndexes.length; ++i)
	{
		var img = _img(null,[['attr','src',this.cloudsIndexes[i].icon],['css','position','absolute']]);
		
		img.style.left = (25 * i - 5) + 'px';
		
		_title(img, this.cloudsIndexes[i].name)
		
		_(cloudsLabelDiv, [img])
	}
    
	var trs = [];
	
	trs.push(_tr([_td(),_td([_span([_t(_gtxt("Облачность"))],[['css','fontSize','12px'],['css','margin','0px 10px 0px 7px']])]), _td([cloudsLabelDiv,cloudsSlider],[['attr','colSpan',2]])]));
	trs.push(_tr([_td(null, [['attr','colSpan',2],['css','height','5px']])]));
	
	_(this._parent, [_table([_tbody(trs)],[['css','marginLeft','20px']])]);
}

/**
* @function
* @param {Array} coverLayersDescription Массив имён слоёв для фильтрации
* @param {String} cloudsAttribute Имя атрибута слоёв с облачностью
* @param {Array} icons Массив с именами иконок для облачности
* @param {Integer} initCloudIndex Начальная облачность
*/
CoverControl2.prototype.init = function(coverLayersDescription, cloudsAttribute, icons, initCloudIndex)
{
	this._coverLayersDescription = coverLayersDescription;
	this._initCloudIndex = initCloudIndex;
	this._icons = icons;
	
	this.cloudsAttribute = cloudsAttribute;
	
	this._updateLayers();
	
	this._updateStyles();
	
	var _this = this;
	
	if (typeof _queryExternalMaps !== 'undefined')
	{
		$(_queryExternalMaps).bind('map_loaded', function()
		{
			_this._updateLayers();
			_this._updateStyles();
			_this._addWidget();
			_this.setFilters();
		});
	}
	
	setInterval(function(){
		_this.fixLayers.apply(_this);
	}, 300);
}

CoverControl2.prototype.fixLayers = function()
{
    if (typeof _mapHelper == 'undefined') return;
    
	for (var i = 0; i < this.coverLayers.length; ++i)
	{
        if (!globalFlashMap.layers[this.coverLayers[i]])
            continue;
            
		var layerId = globalFlashMap.layers[this.coverLayers[i]].properties.LayerID,
			div = $("[LayerID='" + layerId + "']");
		
		if (!div.length)
			continue;
		
		$(div[0]).children("[multiStyle]").hide();
		
		if ($(div[0]).children("[styleType='multi']").length) 
        {
			var icon = nsGmx.Controls.createGeometryIcon(globalFlashMap.layers[this.coverLayers[i]].properties.styles[0], "polygon");
				
			// if ($.browser.msie)
			// {
				// icon.style.width = '9px';
				// icon.style.height = '13px';
				// icon.style.margin = '0px 3px -3px 1px';
			// }
			
			_title(icon, _gtxt("Редактировать стили"));
			
			icon.geometryType = "polygon";
			
            $(div[0]).children("[styleType='multi']").empty().append(icon);
		}
	}
}

CoverControl2.prototype.setFilters = function()
{
	for (var i = 0; i < this.coverLayers.length; ++i)
	{
		var name = this.coverLayers[i],
			layer = globalFlashMap.layers[name];
		
		if (!layer)
			continue;
		
		var filters = layer.filters;
        
		for (var j = 0; j < this.cloudsCount; j++)
		{
			if (j <= this.currCloudsIndex)
			{
				filters[j].setVisible(true);
				filters[j + this.cloudsCount].setVisible(true);
			}
			else
			{
				filters[j].setVisible(false);
				filters[j + this.cloudsCount].setVisible(false);
			}
		}
	}
}

/**
* Добавляет в DOM контрол фильтрации по облачности
* @function
* @param {DOMElement} parent Контейнер для добавляения контрола
*/
CoverControl2.prototype.add = function(parent)
{
	this._parent = parent;
	this._updateStyles();
	this._addWidget();
    $(this).triggerHandler('init');
}

CoverControl2.prototype.getContainer = function()
{
	return this._parent;
}

//предосталяет доступ к первому созданному инстансу CoverControl2
var CoverControlInstance = (function()
{
    var deffered = new $.Deferred();
    var theInstance = null;
    return {
        addInstance: function(coverControl)
        {
            if (theInstance) return;
            
            theInstance = coverControl;
            $(coverControl).bind('init', function()
            {
                deffered.resolve();
            });
        },
        getInstance: function()
        {
            return theInstance;
        },
        whenInited: function(callback)
        {
            deffered.done(callback);
        }
    };
})();

if ( typeof gmxCore !== 'undefined' )
{
	gmxCore.addModule('CoverControl2', {
		CoverControl2: CoverControl2,
        CoverControlInstance: CoverControlInstance
	});
}

nsGmx.CoverControl2 = CoverControl2;

})(jQuery);