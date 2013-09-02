﻿//Создание интерфейса редактирования стилей слоя
!(function() {

var FillStyleControl = function(initStyle, params)
{
    var _params = $.extend({showSelectors: true}, params);
    var _fillStyle = $.extend(true, {fill: 
        {color: 0xFFFFFF, 
         opacity: 50, 
         image: "", 
         pattern: {
            width: 8, 
            step: 0, 
            colors: [0x000000,0xFFFFFF], 
            style: 'diagonal1'
        }}}, initStyle).fill;
    
	var _this = this;
	var selectorDiv = $("<div/>", {'class': "fillStyleSelectorDiv"});
    
    var colorContainer = $("<div/>");
    var patternContainer = $("<div/>");
    var imagePatternContainer = $("<div/>");
	
	var colorIcon      = $("<img/>", {src: 'img/styles/color.png',   title: _gtxt("Заливка цветом")}).data('type', 'color');
	var patternIcon    = $("<img/>", {src: 'img/styles/pattern.png', title: _gtxt("Заливка штриховкой")}).data('type', 'pattern');
	var patternURLIcon = $("<img/>", {src: 'img/styles/globe.gif',   title: _gtxt("Заливка рисунком")}).data('type', 'bitmapPattern');
    
    var controls = {
		"color":         {icon: colorIcon,      control: colorContainer},
		"pattern":       {icon: patternIcon,    control: patternContainer},
		"bitmapPattern": {icon: patternURLIcon, control: imagePatternContainer}
	};
    
    var initFillStyle = initStyle.fill || {};
    
    var activeFillType = null;
    if ('image' in initFillStyle)
        activeFillType = 'bitmapPattern';
    else if ('pattern' in initFillStyle)
        activeFillType = 'pattern';
    else //if ('color' in initFillStyle)
        activeFillType = 'color';
        
    for (var c in controls)
        if (c == activeFillType)
            controls[c].icon.addClass('selectedType');
        else
            controls[c].control.hide();
	
    var selectorIconsDiv = $('<div/>')
        .append(colorIcon)
        .append(patternIcon)
        .append(patternURLIcon);
        
	selectorDiv.append($("<span/>").text(_gtxt("Заливка"))).append($("<br/>"));
    
    if (_params.showSelectors)
        selectorDiv.append(selectorIconsDiv);
    
	$("img", selectorDiv).click(function()
	{
		activeFillType = $(this).data('type');
		for (var k in controls)
			if (k === activeFillType)
				$(controls[k].control).show(500);
			else
				$(controls[k].control).hide(500);
		
		$("img", selectorDiv).removeClass('selectedType');
		$(this).addClass('selectedType');
        $(_this).change();
	});
    
    var fillColor = _fillStyle.color;
	var fillOpacity = _fillStyle.opacity;
    
	//выбор цвета
	var fillColorPicker = nsGmx.Controls.createColorPicker(fillColor,
		function (colpkr){
			$(colpkr).fadeIn(500);
			return false;
		},
		function (colpkr){
			$(colpkr).fadeOut(500);
            $(_this).change();
			return false;
		},
		function (hsb, hex, rgb) {
			fillColorPicker.style.backgroundColor = '#' + hex;
            fillColor = parseInt("0x" + hex);
            $(_this).change();
		}),
	fillOpacitySlider = nsGmx.Controls.createSlider(fillOpacity,
		function(event, ui)
		{
            fillOpacity = ui.value;
            $(_this).change();
		});
		
	colorContainer.append($("<table/>").append($("<tr/>")
		.append($("<td/>").append(fillColorPicker))
		.append($("<td/>", {'class': 'fillColorOpacity'}).append(fillOpacitySlider))
	));
    
    var patternURL = new mapHelper.ImageInputControl(_fillStyle.image);
    $(patternURL).change(function()
    {
        $(_this).change();
    });
    imagePatternContainer.append(patternURL.getControl());
	
	//выбор втроенных паттернов
    var patternTypeIcons = [
        ['horizontal', 'img/styles/horisontal.png'],
        ['vertical',   'img/styles/vertical.png'  ],
        ['diagonal1',  'img/styles/diagonal1.png' ],
        ['diagonal2',  'img/styles/diagonal2.png' ],
        ['circle',     'img/styles/circle.png'    ],
        ['cross',      'img/styles/cross.png'     ]
    ];
    
    var patternStyleSelector = $("<div/>", {id: "patternStyleSelector"});
    for (var i = 0; i < patternTypeIcons.length; i++)
    {
        var icon = $('<img/>', {src: patternTypeIcons[i][1]}).data("style", patternTypeIcons[i][0]);
        patternStyleSelector.append(icon);
        if (patternTypeIcons[i][0] === _fillStyle.pattern.style)
            icon.addClass('activePatternType');
    }
        
    $("img", patternStyleSelector).click(function()
    {
        $("img", patternStyleSelector).removeClass('activePatternType');
        $(this).addClass('activePatternType');
        _fillStyle.pattern.style = $(this).data("style");
        $(_this).change();
    });
    
    var patternOpacity = _fillStyle.opacity;
	var patternOpacitySlider = nsGmx.Controls.createSlider( _fillStyle.opacity, function(event, ui)
    {
        patternOpacity = ui.value;
        $(_this).change();
    });
	$(patternOpacitySlider).attr({id: "patternOpacitySlider"});
    
    var patternOpacityContainer = $('<div/>', {'class': 'patternOpacityContainer'})
        .append($('<table/>').append($('<tr/>')
            .append($('<td/>').append($('<img/>', {src:'img/styles/pattern-opacity.PNG', 'class': 'opacityIcon'})))
            .append($('<td/>').append(patternOpacitySlider))
        ));
		
	var widthIcon = $("<img/>", {src: 'img/styles/pattern-width.PNG'});
	var stepIcon = $("<img/>", {src: 'img/styles/pattern-step.PNG', 'class': 'stepIcon'});
	
    var widthInput = $("<input/>", {'class': 'widthInput', title: _gtxt("Ширина паттерна")}).val(_fillStyle.pattern.width).change(function()
    {
        $(_this).change();
    });
    
    var stepInput = $("<input/>", {title: _gtxt("Ширина отступа")}).val(_fillStyle.pattern.step).change(function()
    {
        $(_this).change();
    });
    
	var widthStepInputs = $("<table/>", {'class': "widthStepTable"}).append($("<tr/>")
		.append($("<td/>").append(widthIcon).append(widthInput))
		.append($("<td/>").append(stepIcon).append(stepInput))
	);
	
	var PatternColorControl = function(parentDiv, initColors)
	{
		var _parentDiv = $(parentDiv);
		var _colors = initColors;
        var _this = this;
		var _redraw = function()
		{
			_parentDiv.empty();
			var table = $('<table/>', {'class': 'patternColorControl'});
			for (var k = 0; k < _colors.length; k++)
			(function(k){
				
				if (_colors[k] === null) return;
				
				var colorPicker = nsGmx.Controls.createColorPicker(_colors[k],
					function (colpkr){
						$(colpkr).fadeIn(500);
						return false;
					},
					function (colpkr){
						$(colpkr).fadeOut(500);
                        $(_this).change();
						return false;
					},
					function (hsb, hex, rgb) {
						colorPicker.style.backgroundColor = '#' + hex;
						_colors[k] = parseInt('0x' + hex);
                        $(_this).change();
					});
				colorPicker.style.width = '100%';
				
				var deleteIcon = makeImageButton('img/close.png', 'img/close_orange.png');
					deleteIcon.onclick = function()
					{
						_colors[k] = null;
						_redraw();
                        $(_this).change();
					}
			
				table.append($("<tr/>")
					.append($("<td/>", {'class': 'patternColorPicker'}).append(colorPicker))
					.append($("<td/>", {'class': 'patternColorDelete'}).append(deleteIcon))
				);
				
			})(k);
			
			var addIcon = makeImageButton('img/zoom_plus.png', 'img/zoom_plus_a.png');
			addIcon.onclick = function()
			{
				var initColor = 0x00FF00;
				for (var c = 0; c < _colors.length; c++)
					if (_colors[c] !== null) 
						initColor = _colors[c];
						
				_colors.push(initColor);
				_redraw();
                $(_this).change();
			};
			
			table.append($("<tr/>")
				.append($("<td/>", {'class': 'patternColorPicker'}))
				.append($("<td/>").append(addIcon))
			);
			
			_parentDiv.append(table);
		}
		
		_redraw();
        
        this.getColors = function()
        {
            var res = [];
            for (var c = 0; c < _colors.length; c++)
                if (_colors[c] !== null )
                    res.push(_colors[c]);
            return res; 
        }
	}
	
	var patternColorSelector = $("<div/>");
	var patternColorControl = new PatternColorControl(patternColorSelector, _fillStyle.pattern.colors);
    $(patternColorControl).change(function()
    {
        $(_this).change();
    });
	
	patternContainer.append(patternStyleSelector).append(patternOpacityContainer).append(widthStepInputs).append(patternColorSelector);
		
	var fillControlsDiv = $("<div/>", {'class': 'fillStyleControls'}).append(colorContainer).append(imagePatternContainer).append(patternContainer);
	
    //public interface
	this.getSelector = function()
	{
		return selectorDiv;
	}
	
	this.getControls = function()
	{
		return fillControlsDiv;
	}
    
    this.getFillStyle = function()
    {
        var fillStyle = {};
        if (activeFillType === 'color')
        {
            fillStyle.color = fillColor;
            fillStyle.opacity = fillOpacity;
        }
        else if (activeFillType === 'bitmapPattern')
        {
            fillStyle.image = patternURL.value();
        } 
        else if (activeFillType === 'pattern')
        {
            fillStyle.pattern = { 
                style: _fillStyle.pattern.style,
                width: parseInt(widthInput.val()),
                step: parseInt(stepInput.val()),
                colors: patternColorControl.getColors()
            };
            fillStyle.opacity = patternOpacity;
        }
        
        return fillStyle;
    }
    
    this.setVisibleSelectors = function(isVisible)
    {
        if (isVisible)
            selectorIconsDiv.show();
        else
            selectorIconsDiv.hide();
    }
}

var createFilterEditorInner = function(filter, attrs, elemCanvas)
{
	var filterText = _textarea(null, [['dir','className','inputStyle'],['css','overflow','auto'],['css','width','250px'],['css','height','50px']]),
		setFilter = function()
		{
			var filterNum = getOwnChildNumber(filterText.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode),
				filter = globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters[filterNum];
			
			if (filterText.value != '')
			{
				var parsed = filter.setFilter(filterText.value);
				
				if (!parsed)
					$(filterText).addClass("error");
				else
					$(filterText).removeClass("error");
			}
			else
			{
				filter.setFilter();
					
				$(filterText).removeClass("error");
			}
		}

	filterText.value = filter;
	
	filterText.onkeyup = function()
	{
		setFilter();
		
		return true;
	}
	
	var mapName = elemCanvas.parentNode.gmxProperties.content.properties.mapName,
		layerName = elemCanvas.parentNode.gmxProperties.content.properties.name,
		attrsSuggest = _mapHelper.createSuggestCanvas(attrs ? attrs : [], filterText, "\"suggest\"", setFilter, _mapHelper.attrValues[mapName][layerName], true),
		valuesSuggest = _mapHelper.createSuggestCanvas(attrs ? attrs : [], filterText, "\"suggest\"", setFilter, _mapHelper.attrValues[mapName][layerName]),
		opsSuggest = _mapHelper.createSuggestCanvas(['=','>','<','>=','<=','<>','AND','OR','NOT','IN','LIKE','()'], filterText, " suggest ", setFilter);
	
	opsSuggest.style.width = '80px';
	$(opsSuggest).children().css('width','60px');
	
	var divAttr = _div([_t(_gtxt("Атрибут >")), attrsSuggest], [['dir','className','attrsHelperCanvas']]),
		divValue = _div([_t(_gtxt("Значение >")), valuesSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
		divOp = _div([_t(_gtxt("Операция >")), opsSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
		clickFunc = function(div)
		{
			if (document.selection)
			{
				filterText.focus();
				var sel = document.selection.createRange();
				div.sel = sel;
				filterText.blur();
			}
			
			$(divAttr.parentNode.parentNode.parentNode).find(".attrsHelperCanvas").children("[arr]").fadeOut(300, function()
			{
				$(this).remove();
			})
		};

	divAttr.onclick = function()
	{
		clickFunc(attrsSuggest);
		
		$(attrsSuggest).fadeIn(300);
		$(valuesSuggest).fadeOut(300);
		$(opsSuggest).fadeOut(300);
		
		return true;
	}
	
	divValue.onclick = function()
	{
		clickFunc(valuesSuggest);
		
		$(valuesSuggest).fadeIn(300);
		$(attrsSuggest).fadeOut(300);
		$(opsSuggest).fadeOut(300);
		
		return true;
	}
	
	divOp.onclick = function()
	{
		clickFunc(opsSuggest);
		
		$(opsSuggest).fadeIn(300);
		$(attrsSuggest).fadeOut(300);
		$(valuesSuggest).fadeOut(300);
		
		return true;
	}
	
	filterText.onclick = function()
	{
		$(attrsSuggest).fadeOut(300);
		$(valuesSuggest).fadeOut(300);
		$(opsSuggest).fadeOut(300);
		
		if (divAttr.childNodes.length > 2)
			divAttr.lastChild.removeNode(true);
		if (divValue.childNodes.length > 2)
			divValue.lastChild.removeNode(true);
		
		return true;
	}
	
	var suggestCanvas = _table([_tbody([_tr([_td([_div([divAttr],[['css','position','relative']])]),
											 _td([_div([divValue],[['css','position','relative']])]),
											 _td([_div([divOp],[['css','position','relative']])])])])],[['css','margin','0px 3px']]),
		div = _div([filterText, suggestCanvas],[['attr','filterTable',true]])
	
	div.getFilter = function()
	{
		return filterText.value;
	};
	div.setFilter = function()
	{
		setFilter();
	};
	
	return div;
}

var createFilterEditor = function(filterParam, attrs, elemCanvas)
{
	var filter = (typeof filterParam == 'undefined') ? '' : filterParam;
	
	if (!_mapHelper.attrValues[elemCanvas.parentNode.gmxProperties.content.properties.mapName][elemCanvas.parentNode.gmxProperties.content.properties.name])
	{
		var div = _div([_t(_gtxt("Авторизуйтесь для редактирования фильтров"))],[['css','padding','5px 0px 5px 5px'],['css','color','red']]);
		
		div.getFilter = function()
		{
			return filter;
		};
		div.setFilter = function(){};
		
		div.setAttribute('filterTable', true);
		
		return div;
	}
	else
		return createFilterEditorInner(filter, attrs, elemCanvas);
}

var _balloonEditorId = 0;

//identityField - будем исключать из списка аттрибутов, показываемых в балуне, так как это внутренняя техническая информация
var createBalloonEditor = function(balloonParams, attrs, elemCanvas, identityField)
{
	var layerName = elemCanvas.parentNode.gmxProperties.content.properties.name,
        textareaID = 'ballooneditor' + layerName + (_balloonEditorId++),
        balloonText = _textarea(null, [
            ['dir','className','inputStyle balloonEditor'],
            ['css','overflow','auto'],
            ['css','width','251px'],
            ['css','height','80px'],
            ['dir','id', textareaID]
        ]),
		setBalloon = function()
		{
			var filterNum = getOwnChildNumber(balloonText.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode),
				filter = globalFlashMap.layers[layerName].filters[filterNum];
			globalFlashMap.balloonClassObject.setBalloonFromParams(filter, div.getBalloonState());
		},
		defaultBalloonText = function()
		{
			var sortAttrs = attrs.slice(0).sort(),
				text = "";
			
			for (var i = 0; i < sortAttrs.length; ++i)
			{
				var key = sortAttrs[i];
				
				if (key !== identityField)
					text += "<b>" + key + ":</b> [" + key + "]<br />" + br;
			}
			
			text += "<br />" + br + "[SUMMARY]";
			
			return text;
		},
		boxClick = _checkbox(!balloonParams.DisableBalloonOnClick && balloonParams.BalloonEnable, 'checkbox'),
		boxMove = _checkbox(!balloonParams.DisableBalloonOnMouseMove && balloonParams.BalloonEnable, 'checkbox'),
		br = $.browser.msie ? "\n\r" : "\n";
        
        
    gmxCore.loadModule('TinyMCELoader', function() {
        tinyMCE.onAddEditor.add(function(mgr,ed) {
            if (ed.id === textareaID) {
                ed.onKeyUp.add(setBalloon);
                ed.onChange.add(setBalloon);
                ed.onClick.add(function() {
                    $(atrsSuggest).fadeOut(300);
                });
                
            }
        });
    })
    
    
	boxClick.className = 'box';
	
	boxClick.onclick = function()
	{
		setBalloon();
	}
	
	boxMove.className = 'box';
	
	boxMove.onclick = function()
	{
		setBalloon();
	}	
	
	balloonText.value = (balloonParams.Balloon) ? balloonParams.Balloon : defaultBalloonText();
	
	var atrsSuggest = _mapHelper.createSuggestCanvas(attrs ? attrs : [], balloonText, '[suggest]', setBalloon);
	
	var divAttr = _div([_t(_gtxt("Атрибут >")), atrsSuggest], [['dir','className','attrsHelperCanvas']]);
	
	divAttr.onclick = function()
	{
		if (atrsSuggest.style.display == 'none')
			$(atrsSuggest).fadeIn(300);
		
		return true;
	}
	
	var suggestCanvas = _table([_tbody([_tr([_td([_div([divAttr],[['css','position','relative']])])])])],[['css','margin','0px 3px']]);

	var div = _div([_div([boxClick, _span([_t(_gtxt("Показывать при клике"))],[['css','marginLeft','5px']])],[['css','margin','2px 0px 4px 3px']]), 
					_div([boxMove, _span([_t(_gtxt("Показывать при наведении"))],[['css','marginLeft','5px']])],[['css','margin','2px 0px 4px 3px']]), 
	                balloonText, suggestCanvas],[['attr','balloonTable',true]]);
	
	div.getBalloon = function()
	{
        var value = tinyMCE && tinyMCE.get(textareaID) ? tinyMCE.get(textareaID).getContent() : balloonText.value;
        return value == defaultBalloonText() ? '' : value;
	};
	
	div.getBalloonEnable = function()
	{
		return boxClick.checked || boxMove.checked;
	};
	
	div.getBalloonDisableOnClick = function()
	{
		return boxClick.checked;
	};
	
	div.getDisableBalloonOnMouseMove = function()
	{
		return boxMove.checked;
	};
	
	div.getBalloonState = function()
	{
		var state = {
			BalloonEnable: boxClick.checked || boxMove.checked,
			DisableBalloonOnClick: !boxClick.checked,
			DisableBalloonOnMouseMove: !boxMove.checked
		}
		
        var value = tinyMCE && tinyMCE.get(textareaID) ? tinyMCE.get(textareaID).getContent() : balloonText.value;
		if (value !== defaultBalloonText())
			state.Balloon = value;
		
		return state;
	}
	
	return div;
}

var createFilter = function(parentObject, parentStyle, geometryType, attrs, elemCanvas, ulParent, treeviewFlag)
{
	var templateStyle = {};
	
	$.extend(true, templateStyle, _mapHelper.makeStyle(parentStyle));
	
    var zoomPropertiesControl = new nsGmx.ZoomPropertiesControl(parentStyle.MinZoom, parentStyle.MaxZoom);
    
	var filterInput = _textarea([_t(parentStyle.Filter || '')], [['dir','className','inputStyle'],['css','overflow','auto'],['css','margin','1px 0px'],['css','width','260px'],['css','height','40px']]),
        liMinZoom = zoomPropertiesControl.getMinLi(),
		liMaxZoom = zoomPropertiesControl.getMaxLi(),
		ulfilterExpr = _ul([_li([_div()],[['css','paddingLeft','0px'],['css','background','none']])]),
		liLabel = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulLabel = _ul([liLabel]),
		liBalloon = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulBalloon = _ul([liBalloon]),
		liStyle = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulStyle = _ul([liStyle]),
        liClusters = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulClusters = _ul([liClusters]),
        clusterCheckbox,
        clusterControl;
        
    if (geometryType == 'point')
    {
        clusterControl = new nsGmx.ClusterParamsControl(liClusters, parentStyle.clusters);
        $(clusterControl).change(function()
        {
            var filterNum = getOwnChildNumber(ulParent.parentNode.parentNode.parentNode),
                    filter = globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters[filterNum];
                    
            if (clusterControl.isApplyCluster())
            {
                filter.setClusters(clusterControl.getClusterStyle());
            }
            else
            {
                filter.delClusters();
            }
        })
        
        clusterCheckbox = _checkbox(clusterControl.isApplyCluster(), 'checkbox');
        clusterCheckbox.style.marginTop = '2px';
        clusterCheckbox.onchange = function()
        {
            clusterControl.applyClusters(this.checked);
        }
        
        if (!clusterControl.isApplyCluster())
        {
            ulClusters.style.display = 'none';
            ulClusters.className = 'hiddenTree';
        }
    }
        
	// zoom
	$(zoomPropertiesControl).change(function()
    {
        var filterNum = getOwnChildNumber(ulParent.parentNode.parentNode.parentNode),
				filter = globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters[filterNum];
			
        if (!globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].objectId)
            _click(elemCanvas.parentNode.firstChild)
            
        filter.setZoomBounds(this.getMinZoom(), this.getMaxZoom());
    })
	
	// label
	
	var labelAttrSel = nsGmx.Utils._select([_option([_t('')],[['attr','value','']])],[['dir','className','selectStyle'],['css','width','142px']]),
		fontSizeInput = _input(null, [['dir','className','inputStyle'],['attr','labelParamName','FontSize'],['css','width','30px'],['attr','value', templateStyle.label && templateStyle.label.size || '']]),
		checkedLabelColor = (typeof templateStyle.label != 'undefined' && typeof templateStyle.label.color != 'undefined') ? templateStyle.label.color : 0x000000,
		checkedLabelHaloColor = (typeof templateStyle.label != 'undefined' && typeof templateStyle.label.haloColor != 'undefined') ? templateStyle.label.haloColor : 0x000000,
		labelColor = nsGmx.Controls.createColorPicker(checkedLabelColor,
			function (colpkr){
				$(colpkr).fadeIn(500);
				return false;
			},
			function (colpkr){
				$(colpkr).fadeOut(500);
				return false;
			},
			function (hsb, hex, rgb) {
				labelColor.style.backgroundColor = '#' + hex;
				
				if (typeof templateStyle.label == 'undefined')
					return;
				
				templateStyle.label.color = labelColor.hex = parseInt('0x' + hex);
				
				nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
			}),
		labelHaloColor = nsGmx.Controls.createColorPicker(checkedLabelHaloColor,
			function (colpkr){
				$(colpkr).fadeIn(500);
				return false;
			},
			function (colpkr){
				$(colpkr).fadeOut(500);
				return false;
			},
			function (hsb, hex, rgb) {
				labelHaloColor.style.backgroundColor = '#' + hex;
				
				if (typeof templateStyle.label == 'undefined')
					return;
				
				templateStyle.label.haloColor = labelHaloColor.hex = parseInt('0x' + hex);
				
				nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
			});
	
	_title(labelColor, _gtxt("Цвет заливки"));
	_title(labelHaloColor, _gtxt("Цвет обводки"));
	_title(fontSizeInput, _gtxt("Размер шрифта"));
	_title(labelAttrSel, _gtxt("Имя атрибута"));
	
	if (attrs)
	{
		for (var i = 0; i < attrs.length; i++)
			_(labelAttrSel, [_option([_t(attrs[i])],[['attr','value',attrs[i]]])]);
		
		labelAttrSel = switchSelect(labelAttrSel, (templateStyle.label && templateStyle.label.field) ? templateStyle.label.field : '')
	}
	
	labelAttrSel.onchange = function()
	{		
		if (this.value != '')
		{
			if (typeof templateStyle.label == 'undefined')
			{
				templateStyle.label = {};
				templateStyle.label.field = this.value;
				templateStyle.label.color = $(liLabel).find(".colorSelector")[0].hex;
				templateStyle.label.size = Number(fontSizeInput.value);
			}
			else
				templateStyle.label.field = this.value;
		}
		else
			delete templateStyle.label;

		nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
	}
	
	fontSizeInput.onkeyup = function()
	{
		if (typeof templateStyle.label == 'undefined')
			return;
		
		templateStyle.label.size = Number(this.value);
		
		nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
	}
	
	_(liLabel.lastChild, [_table([_tbody([_tr([_td([labelColor]),_td([labelHaloColor]),_td([labelAttrSel]),_td([fontSizeInput])])])])])	
	
	if (typeof templateStyle.label == 'undefined')
	{
		ulLabel.style.display = 'none';
		ulLabel.className = 'hiddenTree';
	}
	
	// filter
	
	var filterEditor = createFilterEditor(parentStyle.Filter, attrs, elemCanvas);
	
	_(ulfilterExpr.lastChild.lastChild, [filterEditor]);

	if (typeof parentStyle.Filter == 'undefined' || filterEditor.childNodes.length == 1)
	{
		ulfilterExpr.style.display = 'none';
		ulfilterExpr.className = 'hiddenTree';
	}
	
	// balloon
	parentStyle = globalFlashMap.balloonClassObject.applyBalloonDefaultStyle(parentStyle);
	
	var balloonEditor = createBalloonEditor(parentStyle, attrs, elemCanvas, elemCanvas.parentNode.gmxProperties.content.properties.identityField);
	
	_(liBalloon.lastChild, [balloonEditor]);
	
	if (typeof parentStyle.Balloon == 'undefined')
	{
		ulBalloon.style.display = 'none';
		ulBalloon.className = 'hiddenTree';
	}
	
	// common
    
	_(ulParent, [
        liMinZoom, liMaxZoom, 
        _li([_div([_span([_t(_gtxt("Фильтр"))],[['css','fontSize','12px']])]), ulfilterExpr]),
        _li([_div([_span([_t(_gtxt("Подпись"))],[['css','fontSize','12px']])]), ulLabel]), 
        _li([_div([_span([_t(_gtxt("Балун"))],[['css','fontSize','12px']])]), ulBalloon]),
        _li([_div([_span([_t(_gtxt("Символика"))],[['css','fontSize','12px']])]), ulStyle])
    ]);
    
    if (geometryType == 'point')
    {
        _(ulParent, [_li([
            _div([clusterCheckbox, 
            _span([_t(_gtxt("Кластеризация"))],[['css','fontSize','12px'], ['css', 'marginLeft', '4px']])]), 
            ulClusters
        ])])
    }
	
	if (treeviewFlag)
		$(ulParent).treeview();
        
	// styles
	
    var isWindLayer = typeof elemCanvas.parentNode.gmxProperties != 'undefined' &&
				elemCanvas.parentNode.gmxProperties.content.properties.description &&
				String(elemCanvas.parentNode.gmxProperties.content.properties.description).toLowerCase().indexOf('карта ветра') == 0;
	var resObject = createStyleEditor(liStyle.lastChild, templateStyle, geometryType, isWindLayer);
    
    $(resObject).change(function()
    {
        nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
    })
	
	ulParent.parentNode.parentNode.parentNode.getStyle = function()
	{
		return templateStyle;
	}
    
    ulParent.parentNode.parentNode.parentNode.getClusterStyle = function()
	{
		return clusterControl && clusterControl.isApplyCluster() ? clusterControl.getClusterStyle() : null;
	}
	
	ulParent.parentNode.parentNode.parentNode.removeColorPickers = function()
	{
		$(liStyle.lastChild).find(".colorSelector").each(function()
		{
			if ($$($(this).data("colorpickerId")))
				$$($(this).data("colorpickerId")).removeNode(true);
		})
		
        if ($$($(labelColor).data("colorpickerId")))
            $$($(labelColor).data("colorpickerId")).removeNode(true);
	}
}

var updateFilterMoveButtons = function(filter)
{
	var num = getOwnChildNumber(filter),
		upButton = $(filter).find("[filterMoveButton='up']")[0],
		downButton = $(filter).find("[filterMoveButton='down']")[0],
		removeButton = $(filter).find("[filterMoveButton='remove']")[0];
	
	if (num == 0 || filter.parentNode.childNodes.length == 1)
		upButton.style.visibility = 'hidden';
	else
		upButton.style.visibility = 'visible';
		
	if (num == filter.parentNode.childNodes.length - 1)
		downButton.style.visibility = 'hidden';
	else
		downButton.style.visibility = 'visible';
	
	if (num == 0)
		removeButton.style.visibility = 'hidden';
	else
		removeButton.style.visibility = 'visible';
}

var attachLoadingFilterEvent = function(filterCanvas, parentObject, parentStyle, geometryType, attrs, elemCanvas)
{
	var _this = this;
	
	$(filterCanvas.firstChild.firstChild.firstChild).bind('click', function()
	{
		var ulFilterParams = _abstractTree.getChildsUl(filterCanvas.firstChild.firstChild);
		
		if (!ulFilterParams.loaded)
		{
			ulFilterParams.loaded = true;
			
			createFilter(parentObject, parentStyle, geometryType, attrs, elemCanvas, ulFilterParams, true);
            
            _mapHelper.updateTinyMCE(filterCanvas);
		}
	})
}

var createFilterHeader = function(filtersCanvas, elem, elemCanvas)
{
	var _this = this;
	
	var addButton =  makeLinkButton(_gtxt('Добавить стиль'));
	addButton.onclick = function()
	{
		if (!_layersTree.getLayerVisibility(elemCanvas.parentNode.firstChild)) {
			//_layersTree.setVisibility(elemCanvas.parentNode.firstChild, true);
            _layersTree.setNodeVisible(elemCanvas.parentNode.gmxProperties, true);
        }
		
		var lastStyle = elemCanvas.parentNode.gmxProperties.content.properties.styles[elemCanvas.parentNode.gmxProperties.content.properties.styles.length - 1],
			newStyle = {},
			newFilter = globalFlashMap.layers[elem.name].addObject();
		
		newFilter.setFilter();
		
		//копируем состояние балунов с последнего стиля
		newStyle.Balloon = lastStyle.Balloon;
		newStyle.BalloonEnable = lastStyle.BalloonEnable;
		newStyle.DisableBalloonOnClick = lastStyle.DisableBalloonOnClick;
		newStyle.DisableBalloonOnMouseMove = lastStyle.DisableBalloonOnMouseMove;
		globalFlashMap.balloonClassObject.setBalloonFromParams(newFilter, newStyle);
		
		// if (lastStyle.Balloon)
		// {
			// newStyle.Balloon = lastStyle.Balloon;
			// _this.setBalloon(newFilter, newStyle.Balloon);
		// }
		
		newStyle.MinZoom = lastStyle.MinZoom;
		newStyle.MaxZoom = lastStyle.MaxZoom;
		newFilter.setZoomBounds(Number(newStyle.MinZoom), Number(newStyle.MaxZoom));
		
		newStyle.RenderStyle = lastStyle.RenderStyle;
		newFilter.setStyle(newStyle.RenderStyle);
		
		globalFlashMap.layers[elem.name].filters.push(newFilter);
		
		var filter = _this.createLoadingFilter(newFilter, newStyle, elem.GeometryType.toLowerCase(), elem.attributes, elemCanvas, false);
			
		_(filtersCanvas, [filter]);
		
		_this.updateFilterMoveButtons(filter)
		_this.updateFilterMoveButtons(filtersCanvas.childNodes[filtersCanvas.childNodes.length - 2])
		
		$(filter.firstChild).treeview();
		
		attachLoadingFilterEvent(filter, newFilter, newStyle, elem.GeometryType.toLowerCase(), elem.attributes, elemCanvas, false)
	}
	
	addButton.style.marginLeft = '10px';
	
	return _div([addButton],[['css','height','20px'],['css','padding','5px']]);
}

var swapFilters = function(div, firstNum, filterCanvas)
{
	var filters = globalFlashMap.layers[div.gmxProperties.content.properties.name].filters,
		newFilters = [];
	
	for (var i = 0; i < filters.length; i++)
	{
		if (i < firstNum || i > firstNum + 1)
			newFilters.push(filters[i])
		else if (i == firstNum)
			newFilters.push(filters[i + 1])
		else if (i == firstNum + 1)
			newFilters.push(filters[i - 1])
	}
	
	globalFlashMap.layers[div.gmxProperties.content.properties.name].filters = newFilters;
	
	if (!div.firstChild.checked)
		_click(div.firstChild)
	
	globalFlashMap.layers[div.gmxProperties.content.properties.name].filters[firstNum].bringToDepth(firstNum + 1);
	
	$(filterCanvas.childNodes[firstNum]).before(filterCanvas.childNodes[firstNum + 1]);
	
	updateFilterMoveButtons(filterCanvas.childNodes[firstNum]);
	updateFilterMoveButtons(filterCanvas.childNodes[firstNum + 1]);
}

var createLoadingFilter = function(parentObject, parentStyle, geometryType, attrs, elemCanvas, openedFlag)
{
	var templateStyle = {},
		nameInput = _input(null, [['dir','className','inputStyle'],['attr','paramName','Name'],['css','width','210px'],['attr','value', parentStyle.Name || '']]),
		ulFilterParams = _ul(),
		liFilter = _li([_div([nameInput]), ulFilterParams]),
		ulFilter = _ul([liFilter]),
		filterCanvas = _div([ulFilter],[['dir','className','filterCanvas']]);
		
	$.extend(true, templateStyle, _mapHelper.makeStyle(parentStyle));
	
	_title(nameInput, _gtxt("Имя фильтра"));
	
	filterCanvas.getStyle = function()
	{
		return templateStyle;
	}
    
    filterCanvas.getClusterStyle = function()
	{
		return parentStyle.clusters;
	}
	
	filterCanvas.getFilter = function()
	{
		return parentStyle.Filter;
	}
	
	filterCanvas.getBalloon = function()
	{
		return parentStyle.Balloon;
	}
	
	filterCanvas.getBalloonEnable = function()
	{
		return (typeof parentStyle.BalloonEnable != 'undefined' ? parentStyle.BalloonEnable : true);
	};
	
	filterCanvas.getBalloonDisableOnClick = function()
	{
		return parentStyle.DisableBalloonOnClick;
	};
	
	filterCanvas.getDisableBalloonOnMouseMove = function()
	{
		return parentStyle.DisableBalloonOnMouseMove;
	};
	
	filterCanvas.getBalloonState = function()
	{
		var state = {
			BalloonEnable: !parentStyle.DisableBalloonOnMouseMove || !parentStyle.DisableBalloonOnClick,
			DisableBalloonOnClick: parentStyle.DisableBalloonOnClick,
			DisableBalloonOnMouseMove: parentStyle.DisableBalloonOnMouseMove,
			Balloon: parentStyle.Balloon
		}
		
		return state;
	}
	
	filterCanvas.addFilterParams = function(filterParams)
	{
		filterParams.Name = nameInput.value;
		filterParams.MinZoom = parentStyle.MinZoom;
		filterParams.MaxZoom = parentStyle.MaxZoom;
	}
	
	filterCanvas.removeColorPickers = function(){}
	
	if (!openedFlag)
	{
		ulFilterParams.loaded = false;

		ulFilterParams.style.display = 'none';
		ulFilterParams.className = 'hiddenTree';
	}
	else
	{
		ulFilterParams.loaded = true;
		
		createFilter(parentObject, parentStyle, geometryType, attrs, elemCanvas, ulFilterParams, false);
	}
	
	var moveUp = makeImageButton('img/up.png', 'img/up_a.png'),
		moveDown = makeImageButton('img/down.png', 'img/down_a.png');
	
	moveUp.onclick = function()
	{
		this.src = 'img/up.png';
		
		var firstNum = getOwnChildNumber(this.parentNode.parentNode.parentNode.parentNode) - 1;
		
		swapFilters(elemCanvas.parentNode, firstNum, this.parentNode.parentNode.parentNode.parentNode.parentNode);
	}
	
	moveDown.onclick = function()
	{
		this.src = 'img/down.png';
		
		var firstNum = getOwnChildNumber(this.parentNode.parentNode.parentNode.parentNode);
		
		swapFilters(elemCanvas.parentNode, firstNum, this.parentNode.parentNode.parentNode.parentNode.parentNode);
	}
	
    moveUp.style.margin = '0px 1px -3px 2px';
    moveDown.style.margin = '0px 1px -3px 2px';
	
	moveUp.setAttribute('filterMoveButton','up');
	moveDown.setAttribute('filterMoveButton','down');
	
	_title(moveUp, _gtxt("Переместить фильтр вверх"));
	_title(moveDown, _gtxt("Переместить фильтр вниз"));
	
	_(liFilter.firstChild, [moveDown, moveUp])

	var remove = makeImageButton('img/closemin.png', 'img/close_orange.png')
	remove.onclick = function()
	{
		var num = getOwnChildNumber(filterCanvas),
			filters = globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters,
			newFilters = [];
		
		for (var i = 0; i < filters.length; i++)
			if (i != num)
				newFilters.push(filters[i])
		
		globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters = newFilters;
		
		var filtersParent = filterCanvas.parentNode;
		
		filterCanvas.removeNode(true);

		updateFilterMoveButtons(filtersParent.childNodes[num - 1])
		
		parentObject.remove();
	}
	
	remove.setAttribute('filterMoveButton','remove');
	
	remove.style.width = '16px';
	remove.style.height = '16px';
	
    remove.style.margin = '0px 1px -3px 2px';
		
	_title(remove, _gtxt("Удалить фильтр"))
	
	_(liFilter.firstChild, [remove])
	
	return filterCanvas;
}

var showStyle = function(elem)
{
	var div = $(elem).find("[fade]")[0];
	
	$(div).fadeIn(300);
}

var hideStyle = function(elem)
{
	var div = $(elem).find("[fade]")[0];
	
	$(div).fadeOut(300);
}

var updateStyles = function(filterCanvas)
{
	var styles = [];
	
	for (var i = 0; i < filterCanvas.childNodes.length; i++)
	{
		var filter = filterCanvas.childNodes[i],
			newFilterStyle = {};
		
		if (!_abstractTree.getChildsUl(filter.firstChild.firstChild).childNodes.length)
			filter.addFilterParams(newFilterStyle);
		else
		{
			$(filter).find("[paramName]").each(function()
			{
				newFilterStyle[this.getAttribute('paramName')] = this.value;
			})
		}
		
		var filterValueElem = $(filter).find("[filterTable]").length > 0 ? $(filter).find("[filterTable]")[0] : filter,
			filterValue = filterValueElem.getFilter();
		if (filterValue != '' && filterValue != null)
			newFilterStyle.Filter = filterValue;
		
		var balloonValueElem = $(filter).find("[balloonTable]").length > 0 ? $(filter).find("[balloonTable]")[0] : filter,
			balloonValue = balloonValueElem.getBalloon();
			
		$.extend(newFilterStyle, balloonValueElem.getBalloonState());
		
		if (newFilterStyle.Filter == '')
			delete newFilterStyle.Filter;
		if (newFilterStyle.Name == '')
			delete newFilterStyle.Name;
		
		newFilterStyle.MinZoom = Number(newFilterStyle.MinZoom);
		newFilterStyle.MaxZoom = Number(newFilterStyle.MaxZoom);
		
		if (isNaN(newFilterStyle.MinZoom))
			newFilterStyle.MinZoom = 1;
		if (isNaN(newFilterStyle.MinZoom))
			newFilterStyle.MinZoom = 21;
		
		newFilterStyle.RenderStyle = filter.getStyle();
        
        var clusterStyle = filter.getClusterStyle();
        if (clusterStyle)
            newFilterStyle.clusters = clusterStyle;
		
		styles.push(newFilterStyle);
	}
	
	return styles;
}

createStyleEditor = function(parent, templateStyle, geometryType, isWindLayer)
{
	var markerSizeParent = _tr(),
        outlineParent = _tr(),
		fillParent = _tr(),
		iconParent = _tr(),
		outlineTitleTds = [],
		fillTitleTds = [],
		iconTitleTds = [],
		outlineTds = [],
		fillTds = [],
		iconTds = [],
		inputUrl,
		fillToggle,
		outlineToggle,
		iconToggle,
		showIcon,
		showMarker,
		hideIcon,
		angle,
		scale,
        resObject = {};
	
	// _(parent, [_table([_tbody([outlineParent, markerSizeParent, fillParent, iconParent])],[['css','marginLeft','-20px']])]);
	_(parent, [_table([_tbody([outlineParent, markerSizeParent, fillParent, iconParent])])]);
	
	var fillStyleControl = new FillStyleControl(templateStyle, {showSelectors: geometryType !== 'point'});
    fillStyleControl.setVisibleSelectors(typeof templateStyle.fill != 'undefined');
    $(fillStyleControl).change(function()
    {
        var fillStyle = fillStyleControl.getFillStyle();
        templateStyle.fill = fillStyle;
        $(resObject).change();
    });
	
	showIcon = function()
	{
		hideStyle(outlineParent);
		hideStyle(fillParent);
        fillStyleControl.setVisibleSelectors(false);
        fillParent.style.display = 'none';
		showStyle(iconParent);
		
		templateStyle.marker = {};
		templateStyle.marker.image = inputUrl.value();
		templateStyle.marker.center = true;
		
		delete templateStyle.outline;
		delete templateStyle.fill;

		if (geometryType == "point")
		{
            if ( isWindLayer )
			{
				if (angle.value != '')
					templateStyle.marker.angle = angle.value;
				
				if (scale.value != '')
					templateStyle.marker.scale = scale.value;
				
				templateStyle.marker.color = $(iconParent).find(".colorSelector")[0].hex;				
			}
            hideStyle(markerSizeParent);
            markerSizeParent.style.display = 'none';
		}
		
		if (geometryType != "linestring")
        {
			fillToggle.disabled = true;
        }
			
		$(resObject).change();
	}
	
	showMarker = function()
	{
		showStyle(outlineParent);
        showStyle(markerSizeParent);
        markerSizeParent.style.display = '';
		hideStyle(iconParent);
		
		if (geometryType != "linestring")
		{
            fillParent.style.display = '';
			if (fillToggle.checked)
            {
				showStyle(fillParent);
                fillStyleControl.setVisibleSelectors(true);
            }
			
			if (geometryType == "point")
			{
				templateStyle.marker = {};
				templateStyle.marker.size = Number($(markerSizeParent).find(".inputStyle").val());
			}
			
            templateStyle.fill = fillStyleControl.getFillStyle();			
			fillToggle.disabled = false;
		}
		
		if (geometryType != "point" && typeof templateStyle.marker != 'undefined')
			delete templateStyle.marker;
		
		templateStyle.outline = {};
		templateStyle.outline.thickness = Number($(outlineParent).find(".inputStyle")[0].value);
		templateStyle.outline.color = $(outlineParent).find(".colorSelector")[0].hex;
		templateStyle.outline.opacity = $($(outlineParent).find(".ui-slider")[0]).slider('option', 'value');

		$(resObject).change();
	}
	
	outlineToggle = _checkbox(geometryType == "point" && typeof templateStyle.marker != 'undefined' && typeof templateStyle.marker.image == 'undefined' || geometryType != "point" && (typeof templateStyle.marker == 'undefined' || typeof templateStyle.marker != 'undefined' && typeof templateStyle.marker.image == 'undefined'),'radio');
	outlineToggle.onclick = function()
	{
		showMarker();
		
		iconToggle.checked = false;
		this.checked = true;
	}
	
	outlineTitleTds.push(_td([outlineToggle],[['css','width','20px'],['css','height','24px']]));
	outlineTitleTds.push(_td([_t(_gtxt("Граница"))],[['css','width','70px']]));
	
	var outlineColor = nsGmx.Controls.createColorPicker((templateStyle.outline && typeof templateStyle.outline.color != 'undefined') ? templateStyle.outline.color : 0x0000FF,
		function (colpkr){
			$(colpkr).fadeIn(500);
			return false;
		},
		function (colpkr){
			$(colpkr).fadeOut(500);
			return false;
		},
		function (hsb, hex, rgb) {
			outlineColor.style.backgroundColor = '#' + hex;
			
			templateStyle.outline.color = outlineColor.hex = parseInt('0x' + hex);
			
			$(resObject).change();
		})
	
	if (templateStyle.outline && typeof templateStyle.outline.color != 'undefined')
		outlineColor.hex = templateStyle.outline.color;
	else
		outlineColor.hex = 0x0000FF;

	outlineTds.push(_td([outlineColor],[['css','width','40px']]));
		
	var divSlider = nsGmx.Controls.createSlider((templateStyle.outline && typeof templateStyle.outline.opacity != 'undefined') ? templateStyle.outline.opacity : 100,
			function(event, ui)
			{
				templateStyle.outline.opacity = ui.value;
				
				$(resObject).change();
			})

	outlineTds.push(_td([divSlider],[['css','width','100px'],['css','padding','4px 5px 3px 5px']]));
	
	var outlineThick = nsGmx.Controls.createInput((templateStyle.outline && typeof templateStyle.outline.thickness != 'undefined') ? templateStyle.outline.thickness : 2,
			function()
			{
				templateStyle.outline.thickness = Number(this.value);
				
				$(resObject).change();
				
				return true;
			});

	_title(outlineThick, _gtxt("Толщина линии"));
	
	outlineTds.push(_td([outlineThick],[['css','width','30px']]));
	
	var dashInput = _input(null, [['attr', 'value', templateStyle.outline && typeof templateStyle.outline.dashes != 'undefined' ? templateStyle.outline.dashes : ''],['dir','className','inputStyle'],['css','width','140px']]),
		dashSelect = nsGmx.Utils._select(null, [['dir','className','selectStyle'],['css','width','50px'],['css','fontSize','12px'],['css','fontWeight','bold']]),
		borderValues = {
				"1" : "",
				"2" : "4,4",
				"3" : "2,2",
				"4" : "6,3,2,3",
				"5" : "6,3,2,3,2,3",
				"6" : "2,4",
				"7" : "6,6",
				"8" : "7,6,2,6",
				"9" : "8,4,8,4,2,4"
			},
		dashSelector = _div(null,[['dir','className','colorSelector']]),
		dashTable = _table(null, [['css','position','absolute'],['css','left','-1px'],['css','top','-57px'],['css','zIndex',2]]),
		dashedTds = [],
		dashFunc = function()
		{
			var arr = dashInput.value.split(","),
				correct = true;
			
			if (arr.length % 2 == 0)
			{
				for (var i = 0; i < arr.length; i++)
				{
					arr[i] = Number(arr[i]);
					
					if (isNaN(arr[i]) || arr[i] <= 0)
					{
						correct = false;
						
						break;
					}
				}
			}
			else
				correct = false;
			
			if (correct)
				templateStyle.outline.dashes = arr;
			else
			{
				if (templateStyle.outline.dashes)
					delete templateStyle.outline.dashes;
			}
			
			$(resObject).change();
		};
	
	if (geometryType != "point" && gmxAPI.proxyType !== 'leaflet')
	{
		var dashTrs = []
		for (var i = 1; i <= 7; i+=3)
		{
			var dashTds = [];
			for (var j = i; j <= i + 2; j++)
			{
				var dashTd = _td([_img(null,[['attr','src','img/dash' + j + '.png']])],[['css','border','1px solid #000000'],['css','cursor','pointer']]);
				
				(function(j){
					dashTd.onclick = function(e)
					{
						dashSelector.style.backgroundImage = 'url(img/dash' + j + '.png)';
						
						dashInput.value = borderValues[String(j)];
						dashFunc();
						
						$(dashTable).fadeOut(500);
						
						stopEvent(e);
					}
				})(j)
				
				dashTds.push(dashTd)
			}
			
			dashTrs.push(_tr(dashTds))
		}
		
		_(dashTable, [_tbody(dashTrs)]);
		
		_(dashSelector, [dashTable]);
		
		dashSelector.onclick = function()
		{
			$(dashTable).fadeIn(500);
		}
		
		dashInput.onfocus = dashSelector.onblur = function()
		{
			$(dashTable).fadeOut(500);
		}
		
		dashTable.style.display = 'none';
		
		dashedTds.push(_td([dashSelector]));
		dashedTds.push(_td([dashInput],[['attr','colSpan',2]]));

		for (var borderValue in borderValues)
		{
			if (borderValues[borderValue] == dashInput.value)
			{
				dashSelector.style.backgroundImage = 'url(img/dash' + borderValue + '.png)';
				
				break;
			}
		}
		
		dashSelect.style.marginLeft = '2px';
		
		dashInput.onkeyup = function()
		{
			dashFunc();
			
			return true;
		}
	}
	else
		dashedTds = [_td(),_td(),_td()]
	
	if (geometryType != "linestring")
	{
		fillToggle = _checkbox(typeof templateStyle.fill != 'undefined','checkbox');
		fillToggle.onclick = function()
		{
            fillStyleControl.setVisibleSelectors(this.checked);
			if (this.checked)
			{
                 templateStyle.fill = fillStyleControl.getFillStyle();
				showStyle(fillParent);

				$(resObject).change();
			}
			else
			{
				hideStyle(fillParent);
				
				delete templateStyle.fill;
				
				// if (elemCanvas.nodeName == 'DIV')
					// $(elemCanvas).find(".fillIcon")[0].style.backgroundColor = "#FFFFFF";
				
				$(resObject).change();
			}
		}
		
		fillTitleTds.push(_td([fillToggle],[['css','width','20px'],['css','height','24px']]));
		//fillTitleTds.push(_td([_t(_gtxt("Заливка"))],[['css','width','70px']]));
		fillTitleTds.push(_td([fillStyleControl.getSelector()[0]],[['css','width','70px']]));
		
		var checkedFillColor = (typeof templateStyle.fill != 'undefined' && typeof templateStyle.fill.color != 'undefined') ? templateStyle.fill.color : 0xFFFFFF,
			checkedFillOpacity = (typeof templateStyle.fill != 'undefined' && typeof templateStyle.fill.opacity != 'undefined') ? templateStyle.fill.opacity : 0,
			fillColor = nsGmx.Controls.createColorPicker(checkedFillColor,
				function (colpkr){
					$(colpkr).fadeIn(500);
					return false;
				},
				function (colpkr){
					$(colpkr).fadeOut(500);
					return false;
				},
				function (hsb, hex, rgb) {
					fillColor.style.backgroundColor = '#' + hex;
					
					templateStyle.fill.color = fillColor.hex = parseInt('0x' + hex);
					
					// if (elemCanvas.nodeName == 'DIV')
						// $(elemCanvas).find(".fillIcon")[0].style.backgroundColor = '#' + hex;
					
					$(resObject).change();
				}),
			fillSlider = nsGmx.Controls.createSlider(checkedFillOpacity,
				function(event, ui)
				{
					templateStyle.fill.opacity = ui.value;
					
					$(resObject).change();
				});
		
		fillColor.hex = checkedFillColor;
		
		fillTds.push(_td([fillColor],[['css','width','40px']]));
		fillTds.push(_td([fillSlider],[['css','width','100px'],['css','padding','4px 5px 3px 5px']]));
	}

	iconToggle = _checkbox(templateStyle.marker && typeof templateStyle.marker.image != 'undefined','radio');
	iconToggle.onclick = function()
	{
		showIcon();
		
		outlineToggle.checked = false;
		this.checked = true;
	}
	
	iconTitleTds.push(_td([iconToggle],[['css','width','20px'],['css','height','24px'],['attr','vAlign','top'],['css','paddingTop','5px']]));
	iconTitleTds.push(_td([_t(_gtxt("Маркер URL"))],[['css','width','70px'],['attr','vAlign','top'],['css','paddingTop','5px']]));

    var inputUrl = new mapHelper.ImageInputControl((typeof templateStyle.marker != 'undefined' && templateStyle.marker.image) ? templateStyle.marker.image : '');
    $(inputUrl).change(function()
    {
        if (inputUrl.value() != '')
		{
			showIcon();
			
			outlineToggle.checked = false;
			iconToggle.checked = true;
		}
		
		if (typeof templateStyle.marker == 'undefined')
			templateStyle.marker = {};
			
		templateStyle.marker.image = inputUrl.value();
		
		$(resObject).change();
    });
    
	//inputUrl = _input(null, [['dir','className','inputStyle'],['attr','value', (typeof templateStyle.marker != 'undefined' && templateStyle.marker.image) ? templateStyle.marker.image : ''],['css','width','180px']]);	
	// inputUrl.onkeyup = function()
	// {
		// if (this.value != '')
		// {
			// showIcon();
			
			// outlineToggle.checked = false;
			// iconToggle.checked = true;
		// }
		
		// if (typeof templateStyle.marker == 'undefined')
			// templateStyle.marker = {};
			
		// templateStyle.marker.image = this.value;
		
		// $(templateStyle).change();
	// }
	
	//_title(inputUrl, _gtxt("Url изображения"));
	
	if (geometryType == "point")
	{        
        var markerSizeInput = nsGmx.Controls.createInput(templateStyle.marker && templateStyle.marker.size || 3,
			function()
			{
				templateStyle.marker.size = Number(this.value);
				
				$(resObject).change();
				
				return true;
			})
		
        _title(markerSizeInput, _gtxt("Размер точек"));
		
        var markerSizeTds = [_td(), _td([_t(_gtxt("Размер"))]), _td([markerSizeInput], [['attr','fade',true]])];
        _(markerSizeParent, markerSizeTds, [['attr','fade',true]]);
		
		
		// if (typeof elemCanvas.parentNode.gmxProperties != 'undefined' &&
			// elemCanvas.parentNode.gmxProperties.content.properties.description &&
			// String(elemCanvas.parentNode.gmxProperties.content.properties.description).toLowerCase().indexOf('карта ветра') == 0)
        if ( isWindLayer )
		{
			var markerColor = nsGmx.Controls.createColorPicker((templateStyle.marker && typeof templateStyle.marker.color != 'undefined') ? templateStyle.marker.color : 0xFF00FF,
				function (colpkr){
					$(colpkr).fadeIn(500);
					return false;
				},
				function (colpkr){
					$(colpkr).fadeOut(500);
					return false;
				},
				function (hsb, hex, rgb) {
					markerColor.style.backgroundColor = '#' + hex;
					
					templateStyle.marker.color = markerColor.hex = parseInt('0x' + hex);
					
					$(resObject).change();
				})
			
			if (templateStyle.marker && typeof templateStyle.marker.color != 'undefined')
				markerColor.hex = templateStyle.marker.color;
			else
				markerColor.hex = 0xFF00FF;
		
			scale = _input(null, [['dir','className','inputStyle'],['attr','value', (templateStyle.marker && templateStyle.marker.scale) ? templateStyle.marker.scale : ''],['css','width','68px']]);
			
			scale.onkeyup = function()
			{
				if (this.value != '')
					templateStyle.marker.scale = this.value;
				else
					delete templateStyle.marker.scale;
				
				$(resObject).change();
			}
			
			_title(scale, _gtxt("Масштаб"))
			
			angle = _input(null, [['dir','className','inputStyle'],['attr','value', (templateStyle.marker && templateStyle.marker.angle) ? templateStyle.marker.angle : ''],['css','width','68px']]);
			
			angle.onkeyup = function()
			{
				if (this.value != '')
					templateStyle.marker.angle = this.value;
				else
					delete templateStyle.marker.angle;
				
				$(resObject).change();
			}
			
			_title(angle, _gtxt("Угол поворота"))
			
			iconTds.push(_td([_table([_tbody([_tr([_td([inputUrl.getControl()], [['attr','colSpan',3]])]),
												_tr([_td([markerColor], [['css','paddingLeft','1px']]), _td([angle]), _td([scale], [['css','paddingRight','3px']])])])])]));
		}
		else
			iconTds.push(_td([inputUrl.getControl()]));
	}
	else if (geometryType == "polygon" || geometryType == "linestring")
	{
	//	hide(iconParent);
	
		iconTds.push(_td([inputUrl.getControl()]));
		
		if (geometryType == "linestring")
			hide(fillParent);
	}
	
	_(outlineParent, outlineTitleTds.concat(_td([_div([_table([_tbody([_tr(outlineTds), _tr(dashedTds)])])],[['attr','fade',true]])])));
    
	//_(fillParent, fillTitleTds.concat(_td([_div([_table([_tbody([_tr(fillTds)])])],[['attr','fade',true]])])));
    var topPadding = geometryType === "point" ? "0px" : "10px";
	 fillTitleTds = fillTitleTds.concat(_td([fillStyleControl.getControls()[0]], [['attr','fade',true], ['css', 'paddingTop', topPadding]]));
	 _(fillParent, fillTitleTds);
	
	_(iconParent, iconTitleTds.concat(_td([_div([_table([_tbody([_tr(iconTds)])])],[['attr','fade',true]])])));
	
//	if (geometryType == "point")
//	{
		if (templateStyle.marker && typeof templateStyle.marker.image != 'undefined')
		{
			$(outlineParent).find("[fade]")[0].style.display = 'none';
			$(fillParent).find("[fade]")[0].style.display = 'none';
			$(iconParent).find("[fade]")[0].style.display = '';
		}
		else
		{
			$(outlineParent).find("[fade]")[0].lastChild.style.display = '';
			$(fillParent).find("[fade]")[0].style.display = '';
			$(iconParent).find("[fade]")[0].style.display = 'none';
		}
//	}
	
	if (geometryType != "linestring" && typeof templateStyle.fill == 'undefined')
		$(fillParent).find("[fade]")[0].style.display = 'none';
        
    return resObject;
}

var LayerStylesEditor = function(div, divStyles, openedStyleIndex) {
    var elemProperties = div.gmxProperties.content.properties,
        parentIcon = $(div).children("[styleType]")[0],
        filtersCanvas = _div(),
        filterHeader = createFilterHeader(filtersCanvas, elemProperties, parentIcon),
        filters = globalFlashMap.layers[elemProperties.name].filters;
    
    for (var i = 0; i < filters.length; i++)
    {
        var filter = createLoadingFilter(filters[i], elemProperties.styles[i], elemProperties.GeometryType, elemProperties.attributes, parentIcon, (i == openedStyleIndex));

        _(filtersCanvas, [filter]);
        
        $(filter.firstChild).treeview();
        
        attachLoadingFilterEvent(filter, filters[i], elemProperties.styles[i], elemProperties.GeometryType, elemProperties.attributes, parentIcon)
    }
    
    for (var i = 0; i < filtersCanvas.childNodes.length; i++)
        updateFilterMoveButtons(filtersCanvas.childNodes[i])

    _(divStyles, [filterHeader, filtersCanvas]);
    
    this.getUpdatedStyles = function() {
        return updateStyles(filtersCanvas);
    }
    
    this.removeColorPickers = function() {
        for (var i = 0; i < filtersCanvas.childNodes.length; i++)
            filtersCanvas.childNodes[i].removeColorPickers();
    }
    
    this.getStyleCount = function() {
        return filtersCanvas.childNodes.length;
    }
    
    this.setAllFilters = function() {
        $(filtersCanvas).find("[filterTable]").each(function()
        {
            this.setFilter();
        })
    }
}

gmxCore.addModule('LayerStylesEditor', {
        LayerStylesEditor: LayerStylesEditor,
        createStyleEditor: createStyleEditor
    }
)

})();