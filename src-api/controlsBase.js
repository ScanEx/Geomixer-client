// Стандартные контролы
(function()
{
    "use strict";

    var initControls = function() {
        var outControls = {};
        var mbl = gmxAPI.map.baseLayersManager;

        (function() {
            // function ToolsAll(cont)
            // {
                // this.toolsAllCont = gmxAPI._allToolsDIV;
                // gmxAPI._toolsContHash = {};
            // }
            // gmxAPI._ToolsAll = ToolsAll;
            // new gmxAPI._ToolsAll(container);
            gmxAPI._toolsContHash = {};

            /** Класс управления tools контейнерами
            * @function
            * @ignore
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
            function ToolsContainer(name, attr) {
                //console.log('ToolsContainer', name, attr);
                if(!attr) attr = {};
                var aliasNames = {},		// Hash алиасов основных подложек для map.setMode
                    toolNames = [],
                    toolHash = {},
                    itemsContainer = null,
                    activeToolName = '',
                    notSticky = (attr.notSticky ? attr.notSticky : 0),
                    contType = (attr.contType ? attr.contType : 0),
                    independentFlag = (contType == 0 ? true : false),
                    notSelectedFlag = (contType != 1 ? true : false),
                    currentlyDrawnObject = false,
                    createContainerNode = attr.createContainerNode || null,
                    createItemNode = attr.createItemNode || null;

                if(!name) name = 'testTool';

                var properties = (attr.properties ? attr.properties : {});
                if(!properties.className) {			// className по умолчанию tools_ИмяВкладки
                    properties.className = 'tools_' + name;
                }

                // стили контейнера
                var style = { display: 'block', styleFloat: 'left', cssFloat: 'left', marginTop: '40px', marginLeft: '4px', padding: '0px;' };
                // стили добавляемых юзером элементов tool
                var regularStyle = { paddingTop: "0px", paddingBottom: "0px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "white"	};
                var activeStyle = { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "orange"	};

                // Установка backgroundColor c alpha
                if(gmxAPI.isIE && document.documentMode < 10) {
                    style.filter = "progid:DXImageTransform.Microsoft.gradient(startColorstr=#7F016A8A,endColorstr=#7F016A8A)";
                    style.styleFloat = 'left';
                }
                else 
                {
                    style.backgroundColor = "rgba(1, 106, 138, 0.5)";
                    style.cssFloat = 'left';
                }
                regularStyle = { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "wheat"	};
                activeStyle = { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "orange"	};

                if(attr.style) {
                    for(key in attr.style) style[key] = attr.style[key];
                }
                if(attr.regularStyle) {		// дополнение и переопределение стилей
                    for(var key in attr.regularStyle) regularStyle[key] = attr.regularStyle[key];
                }
                if(attr.activeStyle) {
                    for(key in attr.activeStyle) activeStyle[key] = attr.activeStyle[key];
                }

                var my = this;
                gmxAPI.extend(this, {
                    activeToolName: ''
                    ,node: null
                    ,currentlyDrawnObject: null
                    ,isVisible: true
                    ,setActiveTool: function(toolName) {
                        for (var id in toolHash) {
                            var tool = toolHash[id];
                            if (tool)  {
                                tool.isActive = (id == toolName ? true : false);
                            }
                        }
                        this.activeToolName = toolName;
                        this.repaint();			
                    }
                    ,selectTool: function(toolName) {
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
                    ,stateListeners: {}
                    ,addListener: function(eventName, func) {
                        return gmxAPI._listeners.addListener({obj: this, eventName: eventName, func: func});
                    }
                    ,removeListener: function(eventName, id) {
                        return gmxAPI._listeners.removeListener(this, eventName, id);
                    }
                    ,forEach: function(callback) {
                        for (var id in toolHash)
                            callback(toolHash[id]);
                    }
                    ,getToolByName: function(tn) {
                        if(!toolHash[tn]) return false;
                        return toolHash[tn];
                    }
                    ,getTool: function(tn) {
                        if(toolHash[tn]) return toolHash[tn];
                        for (var key in toolHash) {
                            var tool = toolHash[key];
                            var alias = tool.alias || key;
                            if(alias === tn) return tool;
                        }
                        return null;
                    }
                    ,getAlias: function(tn) {
                        return aliasNames[tn] || tn;
                    }
                    ,getAliasByName: function(tn) {
                        for (var key in toolHash) {
                            var tool = toolHash[key];
                            var alias = tool.alias || key;
                            if(alias === tn) return alias;
                            else if(tool.lang) {
                                for (var lang in tool.lang) {
                                    if(tool.lang[lang] === tn) return alias;
                                }
                            }
                        }
                        return null;
                    }
                    ,getToolIndex: function (tn) {
                        for (var i = 0; i<toolNames.length; i++)
                        {
                            if(tn === toolNames[i]) return i;
                        }
                        return -1;
                    }
                    ,setToolIndex: function (tn, ind) {
                        var num = my.getToolIndex(tn);
                        if(num === -1 || !toolHash[tn]) return false;

                        var hash = toolHash[tn];
                        var tBody = my.itemsContainer;
                        //var obj = tBody.removeChild(hash.row);

                        var len = tBody.children.length;
                        if(ind >= len) ind = len - 1;
                        
                        toolNames.splice(num, 1);
                        toolNames.splice(ind, 0, tn);
                        toolHash[tn].row = tBody.insertBefore(hash.row, tBody.children[ind]);
                        //toolHash[tn].row = tBody.insertBefore(obj, tBody.children[ind]);
                        return true;
                    }
                    ,setVisible: function(flag) {
                        gmxAPI.setVisible(my.node, flag);
                        this.isVisible = flag;
                    }
                    ,chkVisible: function() {
                        var flag = false;
                        for (var key in toolHash) {
                            var tool = toolHash[key];
                            if(tool.isVisible) {
                                flag = true;
                            }
                        }
                        gmxAPI.setVisible(my.node, flag);
                        this.isVisible = flag;
                    }
                    ,repaint: function() {
                        for (var id in toolHash) {
                            var tool = toolHash[id];
                            if (tool)  {
                                tool.repaint();
                            }
                        }
                    }
                    ,updateVisibility: function() {
                    }
                    ,remove: function() {
                        for(var key in this.stateListeners) {
                            var item = this.stateListeners[key];
                            this.removeListener(key, item.id);
                        }
                        this.stateListeners = {};

                        delete gmxAPI._toolsContHash[name];
                        if(this.node.parentNode) this.node.parentNode.removeChild(this.node);
                    }
                    ,chkBaseLayerTool: function (tn, attr) {
                        if (toolHash[tn]) return false;
                        else {
                            if(!attr)  {
                                attr = {
                                    onClick: function() { gmxAPI.map.setBaseLayer(tn); },
                                    onCancel: function() { gmxAPI.map.unSetBaseLayer(); },
                                    onmouseover: function() { this.style.color = "orange"; },
                                    onmouseout: function() { this.style.color = "white"; },
                                    hint: tn
                                };
                            }
                            return this.addTool(tn, attr);
                        }

                    }
                    ,addTool: function (tn, attr) {
        //console.log('tool addTool', tn, attr); // wheat
                        if(!attr) attr = {};
                        if(attr.overlay && gmxAPI._leaflet.gmxLayers) {
                            attr.id = tn;
                            if(!attr.rus) attr.rus = attr.hint || attr.id;
                            if(!attr.eng) attr.eng = attr.hint || attr.id;
                            
                            var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                            if(layersControl) layersControl.addOverlay(tn, attr);
        //                    return;
                        } else {
                            var controls = gmxAPI.map.controlsManager.getCurrent();
                            if(controls && 'addControl' in controls) {
                                ret = controls.addControl(tn, attr);
                            }
                        }
    //    return;

        //                if(!my.itemsContainer) my.itemsContainer = (createContainerNode ? createContainerNode() : my.createContainerNode('div', properties, style));
                        if(!my.itemsContainer) {
                            if(createContainerNode) createContainerNode();
                            else my.createContainerNode('div', properties, style);
                        }

                        if(!attr.alias) attr.alias = tn
                        aliasNames[attr.alias] = tn;

                        var elType = 'img';
                        var elAttr = {
                            title: attr.hint,
                            onclick: function() { my.selectTool(tn); }
                        };

                        if(!('onClick' in attr)) attr.onClick = function() { gmxAPI.map.setMode(tn); };
                        if(!('onCancel' in attr)) attr.onCancel = function() { gmxAPI.map.unSetBaseLayer(); };
                    
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
                            elAttr.onmouseover = function()	{ this.src = attr.activeImageUrl; };
                            repaintFunc = function(obj) { obj.src = (tn == my.activeToolName) ? attr.activeImageUrl : attr.regularImageUrl;	};
                            elAttr.src = attr.regularImageUrl;
                        } else {
                            elType = 'div';
                            repaintFunc = function(obj, flag) {
                                if(toolHash[tn].isActive) flag = true;
                                var resStyle = (flag ? myActiveStyle : myRegularStyle);
                                setStyle(obj, resStyle);
                            };
                            elAttr.onmouseover = function()	{
                                repaintFunc(this, true);
                            };
                            elAttr.innerHTML = attr.hint;
                        }
                        elAttr.onmouseout = function()	{
                            repaintFunc(this, false);
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
                        var itemContainer = pt.control;
                        var row = pt.row || itemContainer;

                        toolHash[tn] = {
                            id: tn,
                            key: tn,
                            alias: attr.alias || null,
                            lang: attr.lang || null,
                            backgroundColor: attr.backgroundColor,
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
                                my.chkVisible();
                            },
                            setToolImage: function(a1, a2) {},
                            repaint: function()	{
                                repaintFunc(itemContainer);
                            },
                            onClick: function()	{
                                this.isActive = true;
                                my.activeToolName = tn;
                                return attr.onClick.call();
                            },
                            onCancel: function()	{
                                this.isActive = false;
                                my.activeToolName = '';
                                attr.onCancel.call();
                            }
                            ,
                            select: function() { my.selectTool(tn); }
                            ,
                            setActive: function() { my.selectTool(tn); }
                        }
                        toolHash[tn].line = row;      // для обратной совместимости

                        var pos = (attr.pos > 0 ? attr.pos : toolNames.length);
                        toolNames.splice(pos, 0, tn);
                        //positionTools();
                        if(!gmxAPI._drawing.tools[tn]) gmxAPI._drawing.tools[tn] = toolHash[tn];
                        my.chkVisible();
if(gmxAPI._drawing.toolInitFlags[tn]) { // обратная совместимость
    toolHash[tn].setVisible(gmxAPI._drawing.toolInitFlags[tn].visible);
}
                        return toolHash[tn];
                    }
                    ,removeTool: function (tn) {
                        var num = my.getToolIndex(tn);
                        if(num === -1 || !toolHash[tn]) return false;
                        toolNames.splice(num, 1);
                        my.itemsContainer.removeChild(toolHash[tn].row);
                        delete toolHash[tn];
                        if(gmxAPI._drawing.tools[tn]) delete gmxAPI._drawing.tools[tn];
                        if(tn === my.activeToolName) my.activeToolName = '';
                        my.chkVisible();
                        return true;
                    }
                    ,createContainerNode: function (nodeType, properties, style) {
                        var node = gmxAPI.newElement(nodeType || 'div', properties, style);
                        if(gmxAPI.IconsControl) {
                            gmxAPI.IconsControl.node.appendChild(node);
                        } else {
                            gmxAPI._allToolsDIV.appendChild(node);
                        }
                        //gmxAPI._allToolsDIV.appendChild(node);
                        this.node = node
                        gmxAPI._toolsContHash[name] = node;
                        
                        var table = gmxAPI.newElement("table", {}, {
                            borderCollapse: 'collapse'
                            ,margin: '0px'
                            ,width: 'auto'
                            ,backgroundColor: 'rgba(1, 106, 138, 0)'
                        });
                        node.appendChild(table);
                        my.itemsContainer = gmxAPI.newElement("tbody", {}, {});
                        table.appendChild(this.itemsContainer);
                        return node;
                    }
                });
                my.createContainerNode('div', properties, style);

                if(!gmxAPI._tools) gmxAPI._tools = {};
                gmxAPI._tools[name] = this;
                return this;
            }
            //расширяем namespace
            gmxAPI._ToolsContainer = ToolsContainer;    
        })();

        gmxAPI._tools = Controls.controlsHash;

        //Поддержка zoomControl
        var zoomControl = {
            id: 'zoomControl'
            ,parentNode: null
            ,node: null
            ,listeners: {}
            ,
            init: function(cont) {        // инициализация
                zoomControl.parentNode = cont;
                if(!zoomControl.node) zoomControl.node = zoomControl.createNode(cont);
                if(!zoomControl.node.parentNode) zoomControl.setVisible(true);
                zoomControl.toggleHandlers(true);
                var zoomBounds = gmxAPI.map.getZoomBounds();
                if(zoomBounds) {
                    zoomControl.minZoom = zoomBounds.MinZoom;
                    zoomControl.maxZoom = zoomBounds.MaxZoom;
                    zoomControl.setZoom(gmxAPI.map.getZ());
                }
            }
            ,
            setVisible: function(flag) {        // инициализация
                var node = zoomControl.node;
                if(!flag) {
                    if(node.parentNode) node.parentNode.removeChild(node);
                } else {
                    if(!node.parentNode) zoomControl.parentNode.appendChild(node);
                    zoomControl.repaint();
                }
            }
            ,
            toggleHandlers: function(flag) {    // Добавление/Удаление прослушивателей событий
                if(flag) {
                    if(!gmxAPI.map.zoomControl) gmxAPI.map.zoomControl = zoomControl.mapZoomControl;
                    //var cz = (gmxAPI.map.needMove ? gmxAPI.map.needMove.z || 1 : 4);
                    //gmxAPI.map.zoomControl.setZoom(cz);
                    // Добавление прослушивателей событий
                    var key = 'onMinMaxZoom';
                    zoomControl.listeners[key] = gmxAPI.map.addListener(key, function(ph) {
                        var attr = ph.attr;
                        zoomControl.minZoom = attr.minZoom;
                        zoomControl.maxZoom = attr.maxZoom;
                        zoomControl.setZoom(attr.currZ);
                        zoomControl.repaint();
                    });

                    key = 'positionChanged';
                    zoomControl.listeners[key] = gmxAPI.map.addListener(key, function(ph) {
                        zoomControl.setZoom(ph.currZ);
                    });
                } else {
                    for(var key in zoomControl.listeners) gmxAPI.map.removeListener(key, zoomControl.listeners[key]);
                    zoomControl.listeners = {};
                    gmxAPI.map.zoomControl = {};
                }
            }
            ,
            remove: function() {      // удаление
                zoomControl.toggleHandlers(false);
                zoomControl.setVisible(false);
            }
            ,
            createNode: function(cont) {        // инициализация
                var apiBase = gmxAPI.getAPIFolderRoot();
                var node = zoomControl.zoomParent = gmxAPI.newElement(
                    "div",
                    {
                        className: "gmx_zoomParent1"
                    },
                    {
                        position: "absolute",
                        left: "40px",
                        top: "5px"
                    }
                );

                zoomControl.zoomPlaque = gmxAPI.newElement(
                    "div",
                    {
                        className: "gmx_zoomPlaque1"
                    },
                    {
                        backgroundColor: "#016a8a",
                        opacity: 0.5,
                        position: "absolute",
                        left: 0,
                        top: 0
                    }
                );
                node.appendChild(zoomControl.zoomPlaque);

                zoomControl.zoomMinus = gmxAPI.newElement(
                    "img",
                    {
                        className: "gmx_zoomMinus1",
                        src: apiBase + "img/zoom_minus.png",
                        onclick: function()
                        {
                            gmxAPI.map.zoomBy(-1);
                        },
                        onmouseover: function()
                        {
                            this.src = apiBase + "img/zoom_minus_a.png";
                        },
                        onmouseout: function()
                        {
                            this.src = apiBase + "img/zoom_minus.png"
                        }
                    },
                    {
                        position: "absolute",
                        left: "5px",
                        top: "7px",
                        cursor: "pointer"
                    }
                );
                node.appendChild(zoomControl.zoomMinus);

                for (var i = 0, len = zoomControl.maxZoom; i < len; i++) 
                    zoomControl.addZoomItem(i);

                zoomControl.zoomPlus = gmxAPI.newElement(
                    "img",
                    {
                        className: "gmx_zoomPlus1",
                        src: apiBase + "img/zoom_plus.png",
                        onclick: function()
                        {
                            gmxAPI.map.zoomBy(1);
                        },
                        onmouseover: function()
                        {
                            this.src = apiBase + "img/zoom_plus_a.png";
                        },
                        onmouseout: function()
                        {
                            this.src = apiBase + "img/zoom_plus.png"
                        }
                    },
                    {
                        position: "absolute",
                        cursor: "pointer"
                    }
                );
                node.appendChild(zoomControl.zoomPlus);
                return node;
            }
            ,minZoom: 1
            ,maxZoom: 30
            ,zoomArr: []
            ,zoomObj: null
            ,
            addZoomItem: function(i) {        // добавить zoom элемент
                var apiBase = gmxAPI.getAPIFolderRoot();
                var node = gmxAPI.newElement(
                    "img",
                    {
                        src: apiBase + "img/zoom_raw.png",
                        title: "" + (i + 1),
                        onclick: function()
                        {
                            gmxAPI.map.zoomBy(i + zoomControl.minZoom - gmxAPI.map.getZ());
                        },
                        onmouseover: function()
                        {
                            this.src = apiBase + "img/zoom_active.png";
                            this.title = "" + (i + zoomControl.minZoom);
                        },
                        onmouseout: function()
                        {
                            this.src = (this == zoomControl.zoomObj) ? (apiBase + "img/zoom_active.png") : (apiBase + "img/zoom_raw.png");
                        }
                    },
                    {
                        position: "absolute",
                        left: (22 + 12*i) + "px",
                        top: "12px",
                        width: "12px",
                        height: "8px",
                        border: 0,
                        cursor: "pointer"
                    }
                );
                zoomControl.zoomParent.appendChild(node);
                zoomControl.zoomArr.push(node);
            }
            ,
            repaint: function()
            {
                var dz = zoomControl.maxZoom - zoomControl.minZoom + 1;
                var gap = 12*dz;
                gmxAPI.position(zoomControl.zoomPlus, 20 + gap, 7);
                gmxAPI.size(zoomControl.zoomPlaque, 43 + gap, 32);
                //gmxAPI.map.zoomControl.width = 43 + gap;
                for (var i = 0; i < dz; i++) {
                    if(i == zoomControl.zoomArr.length) zoomControl.addZoomItem(i);
                    gmxAPI.setVisible(zoomControl.zoomArr[i], (i < dz));
                }
                if(dz < zoomControl.zoomArr.length) for (var i = dz; i < zoomControl.zoomArr.length; i++) gmxAPI.setVisible(zoomControl.zoomArr[i], false);
            }
            ,onChangeBackgroundColorID: null
            ,onMoveEndID: null
            ,setZoom: function(z) {
                var newZoomObj = zoomControl.zoomArr[Math.round(z) - zoomControl.minZoom];
                if (newZoomObj != zoomControl.zoomObj)
                {
                    var apiBase = gmxAPI.getAPIFolderRoot();
                    if (zoomControl.zoomObj) zoomControl.zoomObj.src = apiBase + "img/zoom_raw.png";
                    zoomControl.zoomObj = newZoomObj;
                    if (zoomControl.zoomObj) zoomControl.zoomObj.src = apiBase + "img/zoom_active.png";
                }
            },
            mapZoomControl: {
                isVisible: true,
                isMinimized: false,
                setVisible: function(flag)
                {
                    gmxAPI.setVisible(zoomControl.zoomParent, flag);
                    this.isVisible = flag;
                },
                setZoom: function(z)
                {
                    zoomControl.setZoom(z);
                },
                repaint: function()
                {
                    if(!this.isMinimized) zoomControl.repaint();
                },
                setMinMaxZoom: function(z1, z2)
                {
                    zoomControl.minZoom = z1;
                    zoomControl.maxZoom = z2;
                    this.repaint();
                },
                getMinZoom: function()
                {
                    return zoomControl.minZoom;
                },
                getMaxZoom: function()
                {
                    return zoomControl.maxZoom;
                },
                minimize: function()
                {
                    this.isMinimized = true;
                    this.repaint();
                },
                maximize: function()
                {
                    this.isMinimized = false;
                    this.repaint();
                }
            }
            ,getInterface: function() {
                return {
                    setVisible: zoomControl.setVisible
                };
            }
        }

        //Поддержка geomixerLink
        var geomixerLink = {
            id: 'geomixerLink'
            ,parentNode: null
            ,node: null
            ,init: function(cont) {        // инициализация
                geomixerLink.parentNode = cont.parentNode;
                if(!geomixerLink.node) geomixerLink.node = geomixerLink.createNode(geomixerLink.parentNode);
                if(!geomixerLink.node.parentNode) geomixerLink.parentNode.appendChild(geomixerLink.node);
            }
            ,
            remove: function() {      // удаление
                if(geomixerLink.node.parentNode) geomixerLink.parentNode.removeChild(geomixerLink.node);
            }
            ,
            createNode: function(cont) {        // инициализация
                var apiBase = gmxAPI.getAPIFolderRoot();
                var node = gmxAPI.newElement(
                    "a",
                    {
                        href: "http://geomixer.ru",
                        target: "_blank",
                        className: "gmx_geomixerLink"
                    },
                    {
                        position: "absolute",
                        left: "8px",
                        bottom: "8px"
                    }
                );
                node.appendChild(gmxAPI.newElement(
                    "img",
                    {
                        src: apiBase + "img/geomixer_logo_api.png",
                        title: gmxAPI.KOSMOSNIMKI_LOCALIZED("© 2007-2011 ИТЦ «СканЭкс»", "(c) 2007-2011 RDC ScanEx"),
                        width: 130,
                        height: 34
                    },
                    {
                        border: 0
                    }
                ));
                return node;
            }
            ,getInterface: function() {
                return {
                    remove: geomixerLink.remove
                };
            }
        }

        //Поддержка minimizeTools
        var minimizeTools = {
            id: 'minimize'
            ,parentNode: null
            ,node: null
            ,
            init: function(cont) {        // инициализация
                minimizeTools.parentNode = cont.parentNode;
                if(!minimizeTools.node) minimizeTools.node = minimizeTools.createNode(minimizeTools.parentNode);
                if(!minimizeTools.node.parentNode) minimizeTools.setVisible(true);
                
                var apiBase = gmxAPI.getAPIFolderRoot();
                gmxAPI.map.isToolsMinimized = function()
                {
                    return minimizeTools.toolsMinimized;
                }
                gmxAPI.map.minimizeTools = function()
                {
                    minimizeTools.toolsMinimized = true;
                    minimizeTools.node.src = apiBase + "img/tools_off.png";
                    minimizeTools.node.title = gmxAPI.KOSMOSNIMKI_LOCALIZED("Показать инструменты", "Show tools");
                    gmxAPI.setVisible(gmxAPI._allToolsDIV, false);
                    gmxAPI._listeners.dispatchEvent('onToolsMinimized', gmxAPI.map, minimizeTools.toolsMinimized);
                }
                gmxAPI.map.maximizeTools = function()
                {
                    minimizeTools.toolsMinimized = false;
                    minimizeTools.node.src = apiBase + "img/tools_on.png";
                    minimizeTools.node.title = gmxAPI.KOSMOSNIMKI_LOCALIZED("Скрыть инструменты", "Hide tools");
                    gmxAPI.setVisible(gmxAPI._allToolsDIV, true);
                    gmxAPI._listeners.dispatchEvent('onToolsMinimized', gmxAPI.map, minimizeTools.toolsMinimized);
                }
                gmxAPI.map.maximizeTools();

                gmxAPI.extend(gmxAPI.map.allControls, {
                    setVisible: function(flag)
                    {
                        gmxAPI.setVisible(minimizeTools.plaqueNode, flag);
                        gmxAPI.setVisible(minimizeTools.node, flag);
                        gmxAPI.setVisible(gmxAPI._allToolsDIV, flag);
                    },
                    minimize: gmxAPI.map.minimizeTools,
                    maximize: gmxAPI.map.maximizeTools
                });
            }
            ,
            remove: function() {      // удаление
                minimizeTools.setVisible(false);
            }
            ,
            setVisible: function(flag) {        // инициализация
                var node = minimizeTools.node;
                if(!flag) {
                    if(node.parentNode) node.parentNode.removeChild(node);
                    if(minimizeTools.plaqueNode.parentNode) minimizeTools.plaqueNode.parentNode.removeChild(minimizeTools.plaqueNode);
                } else {
                    if(!minimizeTools.plaqueNode.parentNode) minimizeTools.parentNode.appendChild(minimizeTools.plaqueNode);
                    if(!node.parentNode) minimizeTools.parentNode.appendChild(node);
                }
            }
            ,
            createNode: function(cont) {        // инициализация
                minimizeTools.plaqueNode = gmxAPI.newStyledDiv({
                    position: "absolute",
                    left: "4px",
                    top: "5px",
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#016a8a",
                    opacity: 0.5
                });

                minimizeTools.toolsMinimized = false;
                var apiBase = gmxAPI.getAPIFolderRoot();
                var node = gmxAPI.newElement(
                    "img",
                    {
                        onclick: function()
                        {
                            if (minimizeTools.toolsMinimized)
                                gmxAPI.map.maximizeTools();
                            else
                                gmxAPI.map.minimizeTools();
                        },
                        onmouseover: function()
                        {
                            if (minimizeTools.toolsMinimized)
                                this.src = apiBase + "img/tools_off_a.png";
                            else
                                this.src = apiBase + "img/tools_on_a.png";
                        },
                        onmouseout: function()
                        {
                            if (minimizeTools.toolsMinimized)
                                this.src = apiBase + "img/tools_off.png";
                            else
                                this.src = apiBase + "img/tools_on.png";
                        }
                    },
                    {
                        position: "absolute",
                        left: "8px",
                        top: "8px",
                        cursor: "pointer"
                    }
                );
                return node;
            }
            ,getInterface: function() {
                return {
                    remove: minimizeTools.remove
                    ,setVisible: minimizeTools.setVisible
                };
            }
        }

        //Поддержка copyright
        var copyrightControl = {
            id: 'copyrights'
            ,parentNode: null
            ,node: null
            ,items: []
            ,currentText: ''
            ,addItem: function(obj, copyright, z1, z2, geo) {
                this.removeItem(obj, copyright);
                var bounds = null;
                if (geo) {
                    bounds = gmxAPI.getBounds(geo.coordinates);
                } else if (obj.geometry) {
                    bounds = obj.bounds || gmxAPI.getBounds(obj.geometry.coordinates);
                }
                if (!z1) z1 = 0;
                if (!z2) z2 = 100;
                this.items.push([obj, copyright, z1, z2, bounds]);
                this.redraw();
                return true;
            }
            ,
            removeItem: function(obj, copyright) {
                var arr = [];
                this.items.forEach(function(item, i) {
                    if((copyright && copyright !== item[1])
                        || obj !== item[0]) {
                        arr.push(item);
                    }
                });
                copyrightControl.items = arr;
            }
            ,
            setColor: function(color) {
                copyrightControl.node.style.color = color;
            }
            ,
            init: function(cont) {        // инициализация
                copyrightControl.parentNode = cont.parentNode;
                if(!copyrightControl.node) copyrightControl.node = copyrightControl.createNode(copyrightControl.parentNode);
                if(!copyrightControl.node.parentNode) copyrightControl.setVisible(true);
                copyrightControl.toggleHandlers(true);
                copyrightControl.setColor(gmxAPI.getHtmlColor());
                copyrightControl.redraw();
            }
            ,
            createNode: function(cont) {        // инициализация
                var node = gmxAPI.newElement(
                    "span",
                    {
                        className: "gmx_copyright"
                    },
                    {
                        fontSize: "11px",
                        position: "absolute",
                        right: '26px',
                        bottom: '7px'
                    }
                );
                return node;
            }
            ,
            remove: function() {      // удаление
                copyrightControl.toggleHandlers(false);
                copyrightControl.setVisible(false);
            }
            ,
            setVisible: function(flag) {        // инициализация
                if(!flag) {
                    if(copyrightControl.node.parentNode) copyrightControl.node.parentNode.removeChild(copyrightControl.node);
                } else {
                    copyrightControl.parentNode.appendChild(copyrightControl.node);
                }
            }
            ,onChangeBackgroundColorID: null
            ,onMoveEndID: null
            ,
            toggleHandlers: function(flag) {            // Добавление прослушивателей событий
                var map = gmxAPI.map;
                if(flag) {
                    map.addCopyrightedObject = function(obj, copyright, z1, z2, geo) {
                        copyrightControl.addItem(obj, copyright, z1, z2, geo);
                    }
                    map.removeCopyrightedObject = function(obj) { copyrightControl.removeItem(obj); }
                    map.setCopyrightVisibility = function(obj) { copyrightControl.setVisible(obj); } 
                    map.updateCopyright = function() { copyrightControl.redraw(); } 
                    // Изменить позицию контейнера копирайтов
                    map.setCopyrightAlign = function(attr) {
                        if(attr.align) copyrightControl.copyrightAlign = attr.align;
                        copyrightControl.setPosition();
                    }
                    
                    copyrightControl.onChangeBackgroundColorID = map.addListener('onChangeBackgroundColor', function(htmlColor) {
                        copyrightControl.setColor(htmlColor);
                        copyrightControl.redraw();
                    });
                    var updateListenerID = null;
                    var evName = (gmxAPI.proxyType === 'flash' ? 'positionChanged' : 'onMoveEnd');
                    copyrightControl.onMoveEndID = map.addListener(evName, function()
                        {
                            if (updateListenerID) return;
                            updateListenerID = setTimeout(function()
                            {
                                copyrightControl.redraw();
                                clearTimeout(updateListenerID);
                                updateListenerID = null;
                            }, 250);
                        }
                    );
                } else {
                    map.addCopyrightedObject = 
                    map.removeCopyrightedObject = 
                    map.setCopyrightVisibility = 
                    map.setCopyrightAlign = 
                    map.updateCopyright = function() {};
                    
                    if(copyrightControl.onChangeBackgroundColorID) {
                        map.removeListener('onChangeBackgroundColor', copyrightControl.onChangeBackgroundColorID);
                        copyrightControl.onChangeBackgroundColorID = null;
                    }
                    if(copyrightControl.onMoveEndID) {
                        var evName = (gmxAPI.proxyType === 'flash' ? 'positionChanged' : 'onMoveEnd');
                        map.removeListener(evName, copyrightControl.onMoveEndID);
                        copyrightControl.onMoveEndID = null;
                    }
                }
            }
            ,
            forEach: function(callback) {
                for (var i = 0, len = this.items.length; i < len; i++) {
                    if(callback(this.items[i], i) === false) return;
                }
            }
            ,
            redraw: function() {                // перерисовать с задержкой 
                if(this.redrawTimer) clearTimeout(this.redrawTimer);
                this.redrawTimer = setTimeout(function() {
                    copyrightControl.redrawTimer = null;
                    copyrightControl.redrawItems();
                }, 100);
            }
            ,
            redrawItems: function() {            // перерисовать
                var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
                if(!currPos.latlng || !currPos.latlng.extent) return;
                var chkExists = {};
                var texts = [
                    //первым всегда будет располагаться копирайт СканЭкс. 
                    "<a target='_blank' style='color: inherit;' href='http://maps.kosmosnimki.ru/Apikey/License.html'>&copy; 2007-2014 " + gmxAPI.KOSMOSNIMKI_LOCALIZED("&laquo;СканЭкс&raquo;", "RDC ScanEx") + "</a>"
                ];
                this.forEach(function(item, i) {
                    var obj = item[0];
                    var copyright = item[1];
                    if (!copyright || !obj.objectId || !obj.getVisibility()) return;  // обьекта нет на экране или без копирайта
                    if (chkExists[copyright]) return;  // дубли копирайтов
                    var z1 = item[2],
                        z2 = item[3],
                        bounds = item[4],
                        zoom = currPos.z;

                    if (zoom < z1 || zoom > z2) return;
                    if (bounds && !gmxAPI.extIntersect(currPos.latlng.extent, bounds)) return;
                    chkExists[copyright] = true;
                    texts.push(copyright.split("<a").join("<a target='_blank' style='color: inherit;'"));
                });
                if(gmxAPI.proxyType == 'leaflet') texts.push("<a target='_blank' style='color: inherit;' href='http://leafletjs.com'>&copy; Leaflet</a>");

                var text = texts.join(' ');

                if(this.currentText != text) {
                    this.currentText = text;
                    copyrightControl.node.innerHTML = text;
                    gmxAPI._listeners.dispatchEvent('copyrightRepainted', gmxAPI.map, text);
                }
                if(copyrightControl.copyrightAlign) copyrightControl.setPosition();
            }
            ,copyrightAlign: ''
            ,copyrightLastAlign: ''
            ,
            setPosition: function() {            // Изменить координаты HTML элемента
                var node = copyrightControl.node;
                var center = (copyrightControl.parentNode.clientWidth - node.clientWidth) / 2;
                if(copyrightControl.copyrightLastAlign != copyrightControl.copyrightAlign) {
                    copyrightControl.copyrightLastAlign = copyrightControl.copyrightAlign;
                    if(copyrightControl.copyrightAlign === 'bc') {				// Позиция bc(BottomCenter)
                        gmxAPI.setPositionStyle(node, { 'top': '', 'bottom': copyrightAttr.y, 'right': '', 'left': center + 'px' });
                    } else if(copyrightControl.copyrightAlign === 'br') {		// Позиция br(BottomRight)
                        gmxAPI.setPositionStyle(node, { 'top': '', 'bottom': copyrightAttr.y, 'right': copyrightAttr.x, 'left': '' });
                    } else if(copyrightControl.copyrightAlign === 'bl') {		// Позиция bl(BottomLeft)
                        gmxAPI.setPositionStyle(node, { 'top': '', 'bottom': copyrightAttr.y, 'right': '', 'left': copyrightAttr.x });
                    } else if(copyrightControl.copyrightAlign === 'tc') {		// Позиция tc(TopCenter)
                        gmxAPI.setPositionStyle(node, { 'top': '0px', 'bottom': '', 'right': '', 'left': center + 'px' });
                    } else if(copyrightControl.copyrightAlign === 'tr') {		// Позиция tr(TopRight)
                        gmxAPI.setPositionStyle(node, { 'top': '0px', 'bottom': '', 'right': copyrightAttr.x, 'left': '' });
                    } else if(copyrightControl.copyrightAlign === 'tl') {		// Позиция tl(TopLeft)
                        gmxAPI.setPositionStyle(node, { 'top': '0px', 'bottom': '', 'right': '', 'left': copyrightAttr.x });
                    }
                }
            }
            ,getInterface: function() {
                return {
                    remove: copyrightControl.remove
                    ,setVisible: copyrightControl.setVisible
                    ,add: copyrightControl.addItem
                    ,removeItem: copyrightControl.removeItem
                };
            }
        }
        
        //Поддержка - отображения строки текущего положения карты
        var locationControl = {
            id: 'location'
            ,parentNode: null
            ,nodes: null
            ,locationTitleDiv: null
            ,scaleBar: null
            ,items: []
            ,currentText: ''
            ,
            init: function(cont) {        // инициализация
                locationControl.parentNode = cont.parentNode;
                if(!locationControl.nodes) locationControl.nodes = locationControl.createNode(locationControl.parentNode);
                if(!locationControl.nodes[0].parentNode) locationControl.setVisible(true);
                locationControl.toggleHandlers(true);
                locationControl.chkExists();
            }
            ,
            chkExists: function() {     // Проверка уже установленных данных
                locationControl.setColor(gmxAPI.getHtmlColor(), true);
                locationControl.prpPosition();
            }
            ,
            remove: function() {      // удаление
                locationControl.toggleHandlers(false);
                locationControl.setVisible(false);
            }
            ,
            setVisible: function(flag) {        // инициализация
                if(!flag) {
                    for (var i = 0, len = this.nodes.length; i < len; i++) {
                        var node = this.nodes[i];
                        if(node.parentNode) node.parentNode.removeChild(node);
                    }
                } else {
                    for (var i = 0, len = this.nodes.length; i < len; i++) {
                        var node = this.nodes[i];
                        if(!node.parentNode) locationControl.parentNode.appendChild(node);
                    }
                }
            }
            ,onChangeBackgroundColorID: null
            ,onMoveEndID: null
            ,positionChangedID: null
            ,onResizeMapID: null
            ,
            toggleHandlers: function(flag) {            // Добавление прослушивателей событий
                if(flag) {
                    gmxAPI.map.scaleBar = { setVisible: function(flag) { gmxAPI.setVisible(locationControl.scaleBar, flag); } };
                    
                    gmxAPI.map.coordinates = {
                        setVisible: function(flag) { 
                            gmxAPI.setVisible(locationControl.coordinates, flag); 
                            gmxAPI.setVisible(locationControl.changeCoords, flag); 
                        }
                        ,
                        addCoordinatesFormat: function(func) { 
                            locationControl.coordFormatCallbacks.push(func);
                            return locationControl.coordFormatCallbacks.length - 1;
                        }
                        ,
                        removeCoordinatesFormat: function(num) { 
                            locationControl.coordFormatCallbacks.splice(num, 1);
                            return locationControl.coordFormatCallbacks.length - 1;
                        }
                        ,
                        setFormat: locationControl.setCoordinatesFormat
                    }

                    locationControl.positionChangedID = gmxAPI.map.addListener('positionChanged', locationControl.prpPosition);
                    if(gmxAPI.proxyType === 'flash') {
                        locationControl.onResizeMapID = gmxAPI.map.addListener('onResizeMap', locationControl.prpPosition);
                    } else {
                        locationControl.onMoveEndID = gmxAPI.map.addListener('onMoveEnd', locationControl.checkPositionChanged);
                    }
                    locationControl.onChangeBackgroundColorID = gmxAPI.map.addListener('onChangeBackgroundColor', function(htmlColor) {
                        locationControl.setColor(htmlColor);
                    });
                } else {
                    gmxAPI.map.coordinates = 
                    gmxAPI.map.scaleBar = function() {};
                    
                    if(locationControl.onChangeBackgroundColorID) {
                        gmxAPI.map.removeListener('onChangeBackgroundColor', locationControl.onChangeBackgroundColorID);
                        locationControl.onChangeBackgroundColorID = null;
                    }
                    if(locationControl.positionChangedID) {
                        gmxAPI.map.removeListener('positionChanged', locationControl.positionChangedID);
                        locationControl.positionChangedID = null;
                    }
                    if(locationControl.onMoveEndID) {
                        gmxAPI.map.removeListener('onMoveEnd', locationControl.onMoveEndID);
                        locationControl.onMoveEndID = null;
                    }
                    if(locationControl.onResizeMapID) {
                        gmxAPI.map.removeListener('onResizeMap', locationControl.onResizeMapID);
                        locationControl.onResizeMapID = null;
                    }
                }
            }
            ,
            showCoordinates: function() {        //окошко с координатами
                if (locationControl.coordFormat > 2) return; //выдаем окошко с координатами только для стандартных форматов.
                var oldText = locationControl.getCoordinatesText();
                var text = window.prompt(gmxAPI.KOSMOSNIMKI_LOCALIZED("Текущие координаты центра карты:", "Current center coordinates:"), oldText);
                if (text && (text != oldText))
                    gmxAPI.map.moveToCoordinates(text);
            }
            ,
            nextCoordinatesFormat: function() {
                locationControl.coordFormat += 1;
                locationControl.setCoordinatesFormat(locationControl.coordFormat);
            }
            ,
            createNode: function(cont) {        // инициализация
                var nodes = [
                    gmxAPI.newElement(
                        "div",
                        {
                        },
                        {
                        }
                    )
                    ,
                    gmxAPI.newElement(
                        "div",
                        {
                            className: "gmx_scaleBar1"
                        },
                        {
                            position: "absolute",
                            border: '1px solid #000000',
                            color: 'black',
                            pointerEvents: "none",
                            right: '27px',
                            bottom: '47px',
                            textAlign: "center"
                        }
                    )
                    ,
                    gmxAPI.newElement(
                        "div",
                        {
                            className: "gmx_coordinates",
                            onclick: locationControl.showCoordinates
                        },
                        {
                            position: "absolute",
                            fontSize: "14px",
                            color: 'black',
                            right: '27px',
                            bottom: '25px',
                            cursor: "pointer"
                        }
                    )
                    ,
                    gmxAPI.newElement(
                        "div", 
                        { 
                            className: "gmx_changeCoords",
                            title: gmxAPI.KOSMOSNIMKI_LOCALIZED("Сменить формат координат", "Toggle coordinates format"),
                            onclick: locationControl.nextCoordinatesFormat
                        },
                        {
                            position: "absolute",
                            backgroundImage: 'url("'+gmxAPI.getAPIFolderRoot() + 'img/coord_reload.png")',
                            width: '19px',
                            height: '19px',
                            right: '5px',
                            bottom: '25px',
                            cursor: "pointer"
                        }
                    )
                ];
                gmxAPI._locationTitleDiv = locationControl.locationTitleDiv = nodes[0];
                locationControl.scaleBar = nodes[1];
                locationControl.coordinates = nodes[2];
                locationControl.changeCoords = nodes[3];
                
                return nodes;
            }
            ,
            forEach: function(callback) {
                for (var i = 0, len = this.items.length; i < len; i++) {
                    if(callback(this.items[i], i) === false) return;
                }
            }
            ,
            setColor: function(color, flag) {
                gmxAPI.setStyleHTML(locationControl.coordinates, {
                    'fontSize': "14px",
                    'color': color
                });
                gmxAPI.setStyleHTML(locationControl.scaleBar, {
                    'border': "1px solid " + color,
                    'fontSize': "11px",
                    'color': color
                });
                var url = gmxAPI.getAPIFolderRoot() + 'img/coord_reload' + (color === 'white' ? '_orange':'') + '.png';
                gmxAPI.setStyleHTML(locationControl.changeCoords, {
                    'backgroundImage': 'url("'+url+'")'
                });

                if(flag) {
                    locationControl.checkPositionChanged();
                }
            }
            ,
            repaintScaleBar: function() {
                if (locationControl.scaleBarText) {
                    gmxAPI.size(locationControl.scaleBar, locationControl.scaleBarWidth, 16);
                    locationControl.scaleBar.innerHTML = locationControl.scaleBarText;
                }
            }
            ,
            checkPositionChanged: function() {
                var attr = gmxAPI.getScaleBarDistance();
                if (!attr || (attr.txt === locationControl.scaleBarText && attr.width === locationControl.scaleBarWidth)) return;
                locationControl.scaleBarText = attr.txt;
                locationControl.scaleBarWidth = attr.width;
                locationControl.repaintScaleBar();
            }
            ,coordFormat: 0
            ,prevCoordinates: ''
            ,
            getCoordinatesText: function(currPos) {
                return gmxAPI.getCoordinatesText(currPos, locationControl.coordFormat);
            }
            ,
            clearCoordinates: function() {
                var node = locationControl.coordinates;
                for (var i = node.childNodes.length - 1; i >= 0; i--)
                    node.removeChild(node.childNodes[i]);
            }
            ,
            coordFormatCallbacks: [		// методы формирования форматов координат
                function() { return locationControl.getCoordinatesText(); },
                function() { return locationControl.getCoordinatesText(); },
                function() { return locationControl.getCoordinatesText(); }
            ]
            ,
            setCoordinatesFormat: function(num, screenGeometry) {
                if(!num) num = locationControl.coordFormat;
                if(num < 0) num = locationControl.coordFormatCallbacks.length - 1;
                else if(num >= locationControl.coordFormatCallbacks.length) num = 0;
                locationControl.coordFormat = num;
                if(!screenGeometry) screenGeometry = gmxAPI.map.getScreenGeometry();
                var attr = {'screenGeometry': screenGeometry, 'properties': gmxAPI.map.properties };
                var res = locationControl.coordFormatCallbacks[num](locationControl.coordinates, attr);		// если есть res значит запомним ответ
                if(res && locationControl.prevCoordinates != res) locationControl.coordinates.innerHTML = res;
                locationControl.prevCoordinates = res;
                gmxAPI._listeners.dispatchEvent('onSetCoordinatesFormat', gmxAPI.map, num);
            }
            ,setCoordinatesFormatTimeout: null
            ,prpPosition: function() {
                if (locationControl.setCoordinatesFormatTimeout) return;
                locationControl.setCoordinatesFormatTimeout = setTimeout(function()
                {
                    clearTimeout(locationControl.setCoordinatesFormatTimeout);
                    locationControl.setCoordinatesFormatTimeout = null;
                    if(gmxAPI.proxyType === 'flash') locationControl.checkPositionChanged();
                    locationControl.setCoordinatesFormat();
                }, 150);
            }
            ,getInterface: function() {
                return {
                    remove: locationControl.remove
                    ,setVisible: locationControl.setVisible
                };
            }
        }

        //Контролы слоев
        var layersControl = {
            id: 'layers'
            ,parentNode: null
            ,node: null
            ,itemsContainer: null
            ,mapInitListenerID: null
            ,listeners: {}
            ,map: null
            ,
            init: function(cont) {        // инициализация
                layersControl.parentNode = cont;
                var regularStyle = {
                    paddingTop: "4px", 
                    paddingBottom: "4px", 
                    paddingLeft: "10px", 
                    paddingRight: "10px", 
                    fontSize: "12px",
                    fontFamily: "sans-serif",
                    fontWeight: "bold",
                    textAlign: "center",
                    cursor: "pointer", 
                    opacity: 1, 
                    color: "white"
                };
                var activeStyle = {
                    paddingTop: "4px", 
                    paddingBottom: "4px", 
                    paddingLeft: "10px", 
                    paddingRight: "10px", 
                    fontSize: "12px",
                    fontFamily: "sans-serif",
                    fontWeight: "bold",
                    textAlign: "center",
                    cursor: "pointer", 
                    opacity: 1, 
                    color: 'orange'
                };
                var attr = {
                    'properties': { 'className': 'gmxTools' }
                    ,
                    'style': { }
                    ,
                    'regularStyle': regularStyle
                    ,
                    'activeStyle': activeStyle
                    ,
                    'contType': 2	// режим отключения выбора item
                };

                var baseLayersTools = new gmxAPI._ToolsContainer('baseLayers', attr);
                gmxAPI.baseLayersTools = baseLayersTools;

                gmxAPI.map.baseLayersTools = baseLayersTools;
                
                layersControl.toggleHandlers(true);
                layersControl._chkActiveChanged();
                gmxAPI.map.baseLayerControl.setVisible = baseLayersTools.setVisible; // обратная совместимость
            }
            ,
            remove: function() {      // удаление
                layersControl.toggleHandlers(false);
                gmxAPI.baseLayersTools.remove();
            }
            ,
            _addBaseLayerTool: function(ph) {
                var id = ph.id;
                var attr = {
                    onClick: function() { gmxAPI.map.setBaseLayer(id); },
                    onCancel: function() { gmxAPI.map.unSetBaseLayer(); },
                    hint: gmxAPI.KOSMOSNIMKI_LOCALIZED(ph.rus, ph.eng) || id
                };
                var tool = layersControl.map.baseLayersTools.chkBaseLayerTool(id, attr);
                if(tool) tool.setVisible(false);
                return tool;
            }
            ,
            _chkActiveChanged: function() {
                var activeIDs = mbl.getActiveIDs();
                //console.log('onActiveChanged', activeIDs);
                var tools = layersControl.map.baseLayersTools;
                var pt = {};
                for (var i = 0, len = activeIDs.length; i < len; i++) {
                    var id = activeIDs[i];
                    var tool = tools.getTool(id);
                    var baseLayer = mbl.get(id);
                    if(baseLayer) {
                        if(!tool) tool = layersControl._addBaseLayerTool(baseLayer);
                        tool.setVisible(true);
                        tools.setToolIndex(id, i);
                        pt[id] = true;
                    } else {
                        if(tool) tool.setVisible(false);
                    }
                }
                tools.forEach(function(item, i) {
                    var id = item.id;
                    if(!pt[id]) {
                        tools.removeTool(id);
                    }
                });
                var id = mbl.getCurrentID();
                if(id) tools.setActiveTool(id);

            }
            ,
            toggleHandlers: function(flag) {            // Добавление прослушивателей событий
                if(flag) {
                    layersControl.map = gmxAPI.map;

                    var key = 'onAdd';
                    layersControl.listeners[key] = mbl.addListener(key, layersControl._chkActiveChanged);
                    
                    key = 'onActiveChanged';
                    layersControl.listeners[key] = mbl.addListener(key, layersControl._chkActiveChanged);

                    key = 'onSetCurrent';
                    layersControl.listeners[key] = mbl.addListener(key, function(bl) {
                        layersControl.map.baseLayersTools.setActiveTool((bl ? bl.id : ''));
                    });
                    key = 'onRemove';
                    layersControl.listeners[key] = layersControl.map.addListener(key, function(bl) {
                        layersControl.map.baseLayersTools.removeTool((bl ? bl.id : ''));
                    });
                } else {
                    for(var key in layersControl.listeners) layersControl.map.removeListener(key, layersControl.listeners[key]);
                    layersControl.listeners = {};
                }
            }
            ,getInterface: function() {
                return gmxAPI.baseLayersTools;
            }
        }

        var drawingControl = {
            id: 'drawing'
            ,parentNode: null
            ,node: null
            ,hideNode: null
            ,items: []
            ,
            init: function(cont) {        // инициализация
                // Установка drawing контролов
                    var attr = {
                        properties: { className: 'gmxTools' }
                        ,
                        style: {
                            marginTop: '40px'
                        }
                        ,
                        regularStyle: {
                            paddingTop: "0px", 
                            paddingBottom: "0px", 
                            paddingLeft: "0px", 
                            paddingRight: "0px", 
                            fontSize: "12px",
                            fontFamily: "sans-serif",
                            fontWeight: "bold",
                            textAlign: "center",
                            cursor: "pointer", 
                            opacity: 1, 
                            color: "wheat"
                        }
                        ,
                        activeStyle: {
                            paddingTop: "0px", 
                            paddingBottom: "0px", 
                            paddingLeft: "0px", 
                            paddingRight: "0px", 
                            fontSize: "12px",
                            fontFamily: "sans-serif",
                            fontWeight: "bold",
                            textAlign: "center",
                            cursor: "pointer", 
                            opacity: 1, 
                            color: 'orange'
                        }
                        ,
                        contType: 1	// режим для drawing tools
                    };
                    var standartTools = new gmxAPI._ToolsContainer('standart', attr);
                    var apiBase = gmxAPI.getAPIFolderRoot();
                    var arr = [
                        {
                            key: "move",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/move_tool.png",
                            activeImageUrl: apiBase + "img/move_tool_a.png",
                            onClick: gmxAPI._drawFunctions.move,
                            onCancel: function() {},
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Перемещение", "Move")
                        }
                        ,
                        {
                            key: "zoom",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/select_tool.png",
                            activeImageUrl: apiBase + "img/select_tool_a.png",
                            onClick: gmxAPI._drawFunctions.zoom,
                            onCancel: function() {},
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Увеличение", "Zoom")
                        }
                        ,
                        {
                            key: "POINT",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/marker_tool.png",
                            activeImageUrl: apiBase + "img/marker_tool_a.png",
                            onClick: gmxAPI._drawFunctions.POINT,
                            onCancel: gmxAPI._drawing.endDrawing,
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Маркер", "Marker")
                        }
                        ,
                        {
                            key: "LINESTRING",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/line_tool.png",
                            activeImageUrl: apiBase + "img/line_tool_a.png",
                            onClick: gmxAPI._drawFunctions.LINESTRING,
                            onCancel: gmxAPI._drawing.endDrawing,
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Линия", "Line")
                        }
                        ,
                        {
                            key: "POLYGON",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/polygon_tool.png",
                            activeImageUrl: apiBase + "img/polygon_tool_a.png",
                            onClick: gmxAPI._drawFunctions.POLYGON,
                            onCancel: gmxAPI._drawing.endDrawing,
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Полигон", "Polygon")
                        }
                        ,
                        {
                            key: "FRAME",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/frame_tool.png",
                            activeImageUrl: apiBase + "img/frame_tool_a.png",
                            onClick: gmxAPI._drawFunctions.FRAME,
                            onCancel: gmxAPI._drawing.endDrawing,
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Рамка", "Rectangle")
                        }
                    ];
                    for(var i=0; i<arr.length; i++) {
                        standartTools.addTool(arr[i].key, arr[i]);
                    }
                    standartTools.selectTool("move");

                    gmxAPI._drawing.control = gmxAPI.map.standartTools = standartTools;
                    gmxAPI._listeners.addListener({level: -10, eventName: 'mapCreated', func: function(map) {
                        gmxAPI.map.drawing.addListener('onFinish', function() {
                            gmxAPI.map.standartTools.selectTool("move");
                        });
                    }});
            }
            ,getInterface: function() {
                return gmxAPI.map.standartTools;
            }
        }

        outControls = {
            zoomControl: zoomControl
            ,minimizeTools: minimizeTools
            ,geomixerLink: geomixerLink
            ,copyrightControl: copyrightControl
            ,locationControl: locationControl
            ,drawingControl: drawingControl
            ,layersControl: layersControl
        }
        gmxAPI.extend(Controls.controlsHash, outControls);

        for(var key in outControls) {
            var item = outControls[key];
            if('init' in item) item.init(gmxAPI._allToolsDIV);
        }

        return outControls;
	}

    var Controls = {
        id: 'controlsBase'
        ,isActive: false
        ,controlsHash: {}
        ,initControls: initControls
        ,remove: function() {      // удаление
            for(var key in controlsHash) {
                var item = controlsHash[key];
                if('remove' in item) item.remove();
            }
            controlsHash = {};
        }
        ,setControl: function(id, control) {
            if(Controls.controlsHash[id]) return false;
            Controls.controlsHash[id] = control;
            return true;
        }
        ,getControl: function(id) {
            var control = this.controlsHash[id] || null;
            return (control && 'getInterface' in control ? control.getInterface() : control);
        }
    }

    if(!gmxAPI._controls) gmxAPI._controls = {};
    gmxAPI._controls[Controls.id] = Controls;
})();
