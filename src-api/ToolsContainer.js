//Управление tools контейнерами
(function()
{
    //Управление tools контейнерами
	/** Класс управления tools контейнерами
	* @function
	* @memberOf api
	* @param {name} ID контейнера
	* @param {attr} Hash дополнительных атрибутов
	*		ключи:
	*			contType: Int - тип контейнера (по умолчанию 0)
	*					0 - стандартный пользовательский тип контейнера 
	*					1 - тип для drawing вкладки
	*					2 - тип для вкладки базовых подложек
	*           notSticky: 0 - по умолчанию, инструмент выключается только после повторного нажатия или выбора другого инструмента.
						   1 - автоматически выключать инструмент полсе активации
	*			properties: Hash - properties DIV контейнера (по умолчанию { 'className': 'tools_' + name })
	*			style: Hash - стили DIV контейнера (по умолчанию { 'position': "absolute", 'top': 40 })
	*			regularStyle: Hash - регулярного стиля DIV элементов в контейнере (по умолчанию { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold",	textAlign: "center", cursor: "pointer", opacity: 1, color: "wheat" })
	*			activeStyle: Hash - активного стиля DIV элементов в контейнере (по умолчанию { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold",	textAlign: "center", cursor: "pointer", opacity: 1, color: "orange" })
	*/
	function ToolsContainer(name, attr)
	{
        //console.log('ToolsContainer', name, attr);
		if(!attr) attr = {};
		var aliasNames = {},		// Hash алиасов основных подложек для map.setMode
            toolNames = [],
            toolHash = {},
            itemsContainer = null,
            activeToolName = '',
            notSticky = (attr['notSticky'] ? attr['notSticky'] : 0),
            contType = (attr['contType'] ? attr['contType'] : 0),
            independentFlag = (contType == 0 ? true : false),
            notSelectedFlag = (contType != 1 ? true : false),
            currentlyDrawnObject = false,
            createContainerNode = attr['createContainerNode'] || null,
            createItemNode = attr['createItemNode'] || null;

		if(!name) name = 'testTool';

		var properties = (attr['properties'] ? attr['properties'] : {});
		if(!properties['className']) {			// className по умолчанию tools_ИмяВкладки
			properties['className'] = 'tools_' + name;
		}

		var style = { "display": 'block', 'marginTop': '40px', 'marginLeft': '4px', 'padding': '4px 0' };
        if(window.gmxControls === 'controlsBaseIcons') delete style['marginTop'];
		// Установка backgroundColor c alpha
		if(gmxAPI.isIE && document['documentMode'] < 10) {
			style['filter'] = "progid:DXImageTransform.Microsoft.gradient(startColorstr=#7F016A8A,endColorstr=#7F016A8A)";
			style['styleFloat'] = 'left';
		}
		else 
		{
			style['backgroundColor'] = "rgba(1, 106, 138, 0.5)";
			style['cssFloat'] = 'left';
		}

		if(attr['style']) {
			for(key in attr['style']) style[key] = attr['style'][key];
		}
		// стили добавляемых юзером элементов tool
		var regularStyle = { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "wheat"	};
		if(attr['regularStyle']) {		// дополнение и переопределение стилей
			for(var key in attr['regularStyle']) regularStyle[key] = attr['regularStyle'][key];
		}
		var activeStyle = { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "orange"	};
		if(attr['activeStyle']) {
			for(key in attr['activeStyle']) activeStyle[key] = attr['activeStyle'][key];
		}

		var my = this;
        gmxAPI.extend(this, {
            'activeToolName': ''
            ,'currentlyDrawnObject': null
            ,'isVisible': true
            ,'setActiveTool': function(toolName) {
                for (var id in toolHash) {
                    var tool = toolHash[id];
                    if (tool)  {
                        tool.isActive = (id == toolName ? true : false);
                    }
                }
                this.activeToolName = toolName;
                this.repaint();			
            }
            ,
            'selectTool': function(toolName) {
                if (name == 'standart') {	// только для колонки 'standart'
                    if (toolName == my.activeToolName) toolName = (toolNames.length > 0 ? toolNames[0] : '');	// если toolName совпадает с активным tool переключаем на 1 tool

                    // При draw обьектов
                    if (my.currentlyDrawnObject && 'stopDrawing' in my.currentlyDrawnObject) {
                        my.currentlyDrawnObject.stopDrawing();
                    }
                    my.currentlyDrawnObject = null;
                }

                var oldToolName = my.activeToolName;
                var tool = toolHash[oldToolName];

                if (tool && contType != 0) {
                    if ('onCancel' in tool) tool.onCancel();
                    tool.repaint();
                }

                my.activeToolName = (notSelectedFlag && toolName == oldToolName ? '' : toolName);

                tool = toolHash[toolName];
                if(tool) {
                    if (contType == 0) {								// для добавляемых юзером меню
                        if (tool.isActive) {
                            if ('onCancel' in tool) tool.onCancel();
                        } else {
                            if ('onClick' in tool) tool.onClick();
                        }
                        tool.repaint();
                    } else if (contType == 1) {							// тип для drawing
                        if ('onClick' in tool) {
                            my.currentlyDrawnObject = tool.onClick();
                            tool.repaint();
                        } else {
                            my.currentlyDrawnObject = null;
                        }
                    } else if (contType == 2) {							// тип для подложек
                        if ('onClick' in tool && toolName != oldToolName) {
                            tool.onClick();
                            tool.repaint();
                        }
                    }
                    
                    if (notSticky == 1){
                        // Если интструмент включен, сразу же выключите его.
                        if (tool.isActive) {
                            if ('onCancel' in tool) tool.onCancel();
                            tool.isActive = false;
                        }
                    }
                }
                gmxAPI._listeners.dispatchEvent('onActiveChanged', gmxAPI._tools[name]);	// Изменились активные tool в контейнере
            }
            ,
            'stateListeners': {}
            ,
            'addListener': function(eventName, func) {
                return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func});
            }
            ,
            'removeListener': function(eventName, id) {
                return gmxAPI._listeners.removeListener(this, eventName, id);
            }
            ,
            'forEach': function(callback) {
                for (var id in toolHash)
                    callback(toolHash[id]);
            }
            ,
            'getToolByName': function(tn) {
                if(!toolHash[tn]) return false;
                return toolHash[tn];
            }
            ,
            'getTool': function(tn) {
                if(toolHash[tn]) return toolHash[tn];
                for (var key in toolHash) {
                    var tool = toolHash[key];
                    var alias = tool['alias'] || key;
                    if(alias === tn) return tool;
                }
                return null;
            }
            ,
            'getAlias': function(tn) {
                return aliasNames[tn] || tn;
            }
            ,
            'getAliasByName': function(tn) {
                for (var key in toolHash) {
                    var tool = toolHash[key];
                    var alias = tool['alias'] || key;
                    if(alias === tn) return alias;
                    else if(tool['lang']) {
                        for (var lang in tool['lang']) {
                            if(tool['lang'][lang] === tn) return alias;
                        }
                    }
                }
                return null;
            }
            ,
            'getToolIndex': function (tn) {
                for (var i = 0; i<toolNames.length; i++)
                {
                    if(tn === toolNames[i]) return i;
                }
                return -1;
            }
            ,
            'setToolIndex': function (tn, ind) {
                var num = my.getToolIndex(tn);
                if(num === -1 || !toolHash[tn]) return false;
                toolNames.splice(num, 1);

                var hash = toolHash[tn];
                var tBody = my.itemsContainer;
                var obj = tBody.removeChild(hash['row']);

                var len = tBody.children.length;
                if(ind >= len) ind = len - 1;
                
                toolHash[tn]['row'] = tBody.insertBefore(obj, tBody.children[ind]);
                toolNames.splice(i, 0, tn);
                return true;
            }
            ,
            'setVisible': function(flag) {
                gmxAPI.setVisible(gmxTools, flag);
                this.isVisible = flag;
            }
            ,
            'repaint': function() {
                for (var id in toolHash) {
                    var tool = toolHash[id];
                    if (tool)  {
                        tool.repaint();
                    }
                }
            }
            ,
            'updateVisibility': function() {
            }
            ,
            'remove': function() {
                gmxAPI._allToolsDIV.removeChild(gmxTools);
            }
            ,
            'chkBaseLayerTool': function (tn, attr) {
                if (toolHash[tn]) return false;
                else {
                    if(!attr)  {
                        attr = {
                            'onClick': function() { gmxAPI.map.setBaseLayer(tn); },
                            'onCancel': function() { gmxAPI.map.unSetBaseLayer(); },
                            'onmouseover': function() { this.style.color = "orange"; },
                            'onmouseout': function() { this.style.color = "white"; },
                            'hint': tn
                        };
                    }
                    return this.addTool(tn, attr);
                }

            }
            ,
            'addTool': function (tn, attr) {
//console.log('tool addTool', tn, attr);

                if(!my.itemsContainer) my.itemsContainer = (createContainerNode ? createContainerNode() : my.createContainerNode('div', properties, style));

                if(!attr) attr = {};
                if(!attr['alias']) attr['alias'] = tn
                aliasNames[attr['alias']] = tn;

                var elType = 'img';
                var elAttr = {
                    title: attr['hint'],
                    onclick: function() { my.selectTool(tn); }
                };

                if(!('onClick' in attr)) attr['onClick'] = function() { gmxAPI.map.setMode(tn); };
                if(!('onCancel' in attr)) attr['onCancel'] = function() { gmxAPI.map.unSetBaseLayer(); };
            
                var setStyle = function(elem, style) {
                    for (var key in style)
                    {
                        var value = style[key];
                        elem.style[key] = value;
                        if (key == "opacity") elem.style.filter = "alpha(opacity=" + Math.round(value*100) + ")";
                    }
                }

                var myActiveStyle = (attr.activeStyle ? attr.activeStyle : activeStyle);
                var myRegularStyle = (attr.regularStyle ? attr.regularStyle : regularStyle);
                var repaintFunc = null;
                if('regularImageUrl' in attr) {
                    elAttr['onmouseover'] = function()	{ this.src = attr['activeImageUrl']; };
                    repaintFunc = function(obj) { obj.src = (tn == my.activeToolName) ? attr['activeImageUrl'] : attr['regularImageUrl'];	};
                    elAttr['src'] = attr['regularImageUrl'];
                } else {
                    elType = 'div';
                    repaintFunc = function(obj) {
                        setStyle(obj, (toolHash[tn].isActive ? myActiveStyle : myRegularStyle));
                    };
                    elAttr['onmouseover'] = function()	{
                        setStyle(this, (toolHash[tn].isActive ? myActiveStyle : myRegularStyle));
                    };
                    elAttr['innerHTML'] = attr['hint'];
                }
                elAttr['onmouseout'] = function()	{
                    repaintFunc(this);
                };
               
                var pt = (createItemNode ? createItemNode(my.itemsContainer) : function (parent) {
                    var tr = gmxAPI.newElement("tr", {	"className": 'tools_tr_' + name + '_' + tn	});
                    var td = gmxAPI.newElement("td", null, { padding: "4px", cursor: "pointer" });		// { padding: "4px", textAlign: "center" }
                    tr.appendChild(td);
                    var control = gmxAPI.newElement( elType, elAttr, myRegularStyle);
                    td.appendChild(control);
                    parent.appendChild(tr);
                    return {
                        'control': control	// нода для отображения выбранного tool элемента 
                        ,'row': tr	        // нода контейнера tool элемента (по умолчанию без контейнера)
                    };
                }(my.itemsContainer));
                var itemContainer = pt['control'];
                var row = pt['row'] || itemContainer;

                toolHash[tn] = {
                    id: tn,
                    key: tn,
                    alias: attr['alias'] || null,
                    lang: attr['lang'] || null,
                    backgroundColor: attr['backgroundColor'],
                    isActive: false,
                    isVisible: true,
                    control: itemContainer,
                    row: row,
                    setVisible: function(flag) {
                        this.isVisible = flag;
                        var st = 'visible';
                        if(flag) {
                            row.style.display = '';
                            row.style.visibility = 'visible';
                        } else {
                            row.style.display = 'none';
                            row.style.visibility = 'hidden';
                        }
                    },
                    setToolImage: function(a1, a2) {},
                    repaint: function()	{
                        repaintFunc(itemContainer);
                    },
                    onClick: function()	{
                        this.isActive = true;
                        my.activeToolName = tn;
                        return attr['onClick'].call();
                    },
                    onCancel: function()	{
                        this.isActive = false;
                        my.activeToolName = '';
                        attr['onCancel'].call();
                    }
                    ,
                    select: function() { my.selectTool(tn); }
                    ,
                    setActive: function() { my.selectTool(tn); }
                }
                toolHash[tn]['line'] = row;      // для обратной совместимости

                var pos = (attr['pos'] > 0 ? attr['pos'] : toolNames.length);
                toolNames.splice(pos, 0, tn);
                //positionTools();
                if(!gmxAPI._drawing.tools[tn]) gmxAPI._drawing.tools[tn] = toolHash[tn];
                return toolHash[tn];
            }
            ,
            'removeTool': function (tn) {
                var num = my.getToolIndex(tn);
                if(num === -1 || !toolHash[tn]) return false;
                toolNames.splice(num, 1);
                my.itemsContainer.removeChild(toolHash[tn]['row']);
                delete toolHash[tn];
                if(gmxAPI._drawing.tools[tn]) delete gmxAPI._drawing.tools[tn];
                return true;
            }
            ,
            'createContainerNode': function (nodeType, properties, style) {
                var node = gmxAPI.newElement(nodeType || 'div', properties, style);
//gmxAPI._allToolsDIV.insertBefore(node, gmxAPI._allToolsDIV.childNodes[0]);
                if(gmxAPI.IconsControl) {
                    gmxAPI.IconsControl.node.appendChild(node);
                } else {
                    gmxAPI._allToolsDIV.appendChild(node);
                }
                //gmxAPI._allToolsDIV.appendChild(node);
                gmxAPI._toolsContHash[name] = node;
                
                var table = gmxAPI.newElement("table", {}, {'borderCollapse': 'collapse'});
                node.appendChild(table);
                my.itemsContainer = gmxAPI.newElement("tbody", {}, {});
                table.appendChild(this.itemsContainer);
                return node;
            }
        });
		//this = gmxAPI._toolsContHash;
/*
		var toolsContHash = gmxAPI._toolsContHash;

		var gmxTools = gmxAPI.newElement('div', properties, style);
		gmxAPI._allToolsDIV.appendChild(gmxTools);
		toolsContHash[name] = gmxTools;
*/
/*
		var toolsContainer = gmxAPI.newElement("table", {}, {'borderCollapse': 'collapse'});
		gmxTools.appendChild(toolsContainer);
		var tBody = gmxAPI.newElement("tbody", {}, {});
		toolsContainer.appendChild(tBody);
*/


		if(!gmxAPI._tools) gmxAPI._tools = {};
		gmxAPI._tools[name] = this;
	}
	//расширяем namespace
    gmxAPI._ToolsContainer = ToolsContainer;
})();
