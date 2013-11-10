// Стандартные контролы
(function()
{
    "use strict";

    //Поддержка zoomControl
	var zoomControl = {
        parentNode: null
        ,node: null
        ,
        init: function(cont) {        // инициализация
            zoomControl.parentNode = cont;
            if(!zoomControl.node) zoomControl.node = zoomControl.createNode(cont);
            if(!zoomControl.node.parentNode) zoomControl.setVisible(true);
            zoomControl.setActive(true);
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
        createNode: function(cont) {        // инициализация
            var apiBase = gmxAPI.getAPIFolderRoot();
            var node = zoomControl.zoomParent = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_zoomParent"
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
                    className: "gmx_zoomPlaque"
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
                    className: "gmx_zoomMinus",
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
                    className: "gmx_zoomPlus",
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
        ,'mapZoomControl': {
            isVisible: true,
            isMinimized: false,
            setVisible: function(flag)
            {
                gmxAPI.setVisible(zoomControl.zoomParent, flag);
                this.isVisible = flag;
            },
            setZoom: function(z)
            {
                var newZoomObj = zoomControl.zoomArr[Math.round(z) - zoomControl.minZoom];
                if (newZoomObj != zoomControl.zoomObj)
                {
                    var apiBase = gmxAPI.getAPIFolderRoot();
                    if (zoomControl.zoomObj) zoomControl.zoomObj.src = apiBase + "img/zoom_raw.png";
                    zoomControl.zoomObj = newZoomObj;
                    if (zoomControl.zoomObj) zoomControl.zoomObj.src = apiBase + "img/zoom_active.png";
                }
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
        ,
        setActive: function(flag) {            // Добавление прослушивателей событий
            if(flag) {
                if(!gmxAPI.map.zoomControl) gmxAPI.map.zoomControl = zoomControl.mapZoomControl;
                var cz = (gmxAPI.map.needMove ? gmxAPI.map.needMove.z || 1 : 4);
                gmxAPI.map.zoomControl.setZoom(cz);
                // Добавление прослушивателей событий
                zoomControl.onMoveEndID = gmxAPI.map.addListener('positionChanged', function(ph)
                    {
                        gmxAPI.map.zoomControl.setZoom(ph.currZ);
                    }
                );
            } else {
                gmxAPI.map.zoomControl = {};

                if(zoomControl.onMoveEndID) {
                    gmxAPI.map.removeListener('positionChanged', zoomControl.onMoveEndID);
                    zoomControl.onMoveEndID = null;
                }
            }
        }
	}
/*
	// Добавление прослушивателей событий
	gmxAPI._listeners.addListener({'eventName': 'mapInit', 'func': function(map) {
		map.zoomControl = {
			isVisible: true,
			isMinimized: false,
			setVisible: function(flag)
			{
				gmxAPI.setVisible(zoomControl.zoomParent, flag);
				this.isVisible = flag;
			},
			setZoom: function(z)
			{
				var newZoomObj = zoomControl.zoomArr[Math.round(z) - zoomControl.minZoom];
				if (newZoomObj != zoomControl.zoomObj)
				{
                    var apiBase = gmxAPI.getAPIFolderRoot();
					if (zoomControl.zoomObj) zoomControl.zoomObj.src = apiBase + "img/zoom_raw.png";
					zoomControl.zoomObj = newZoomObj;
					if (zoomControl.zoomObj) zoomControl.zoomObj.src = apiBase + "img/zoom_active.png";
				}
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
		var cz = (gmxAPI.map.needMove ? gmxAPI.map.needMove.z || 1 : 4);
		gmxAPI.map.zoomControl.setZoom(cz);
		// Добавление прослушивателей событий
		gmxAPI.map.addListener('positionChanged', function(ph)
			{
				gmxAPI.map.zoomControl.setZoom(ph.currZ);
			}
		);
	}});
*/

    //Поддержка geomixerLink
	var geomixerLink = {
        parentNode: null
        ,
        node: null
        ,
        init: function(cont) {        // инициализация
            geomixerLink.parentNode = cont.parentNode;
            if(!geomixerLink.node) geomixerLink.node = geomixerLink.createNode(geomixerLink.parentNode);
            if(!geomixerLink.node.parentNode) geomixerLink.parentNode.appendChild(geomixerLink.node);
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
	}

    //Поддержка minimizeTools
	var minimizeTools = {
        parentNode: null
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
                left: "5px",
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
	}

    //Поддержка copyright
	var copyrightControl = {
        parentNode: null
        ,
        node: null
        ,items: []
        ,currentText: ''
        ,x: '26px'					// отступ по горизонтали
        ,y: '7px'					// отступ по вертикали
		,
		addItem: function(obj) {
            this.forEach(function(item, i) {
                if(obj === item) {
                    return false;   // Уже есть такой
                }
            });
            this.items.push(obj);
            this.redraw();
		}
        ,
		removeItem: function(obj) {
            this.forEach(function(item, i) {
                if(obj === item) {
                    copyrightControl.items.splice(i, 1);
                    copyrightControl.redraw();
                    return false;
                }
            });
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
            copyrightControl.setActive(true);
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
                    right: copyrightControl.x,
                    bottom: copyrightControl.y
                }
            );
            return node;
        }
        ,
        setVisible: function(flag) {        // инициализация
			if(!flag) {
                if(copyrightControl.node.parentNode) copyrightControl.node.parentNode.removeChild(copyrightControl.node);
			} else {
                copyrightControl.parentNode.appendChild(copyrightControl.node);
            }
        }
        ,
        'forEach': function(callback) {
			for (var i = 0, len = this.items.length; i < len; i++) {
				if(callback(this.items[i], i) === false) return;
            }
        }
        ,
        redraw: function() {            // перерисовать
			var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
			if(!currPos['latlng']) return;
			var x = currPos['latlng']['x'];
			var y = currPos['latlng']['y'];
			var texts = [
                //первым всегда будет располагаться копирайт СканЭкс. 
                "<a target='_blank' style='color: inherit;' href='http://maps.kosmosnimki.ru/Apikey/License.html'>&copy; 2007-2013 " + gmxAPI.KOSMOSNIMKI_LOCALIZED("&laquo;СканЭкс&raquo;", "RDC ScanEx") + "</a>"
            ];
            this.forEach(function(item, i) {
				if (!item.copyright || !item.objectId || !item.getVisibility()) return;  // обьекта нет на экране или без копирайта
                if (item.geometry) {
                    var bounds = item.bounds || gmxAPI.getBounds(item.geometry.coordinates);
                    if ((x < bounds.minX) || (x > bounds.maxX) || (y < bounds.minY) || (y > bounds.maxY)) return;
                }
                texts.push(item.copyright.split("<a").join("<a target='_blank' style='color: inherit;'"));
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
					gmxAPI.setPositionStyle(node, { 'top': '', 'bottom': copyrightAttr['y'], 'right': '', 'left': center + 'px' });
				} else if(copyrightControl.copyrightAlign === 'br') {		// Позиция br(BottomRight)
					gmxAPI.setPositionStyle(node, { 'top': '', 'bottom': copyrightAttr['y'], 'right': copyrightAttr['x'], 'left': '' });
				} else if(copyrightControl.copyrightAlign === 'bl') {		// Позиция bl(BottomLeft)
					gmxAPI.setPositionStyle(node, { 'top': '', 'bottom': copyrightAttr['y'], 'right': '', 'left': copyrightAttr['x'] });
				} else if(copyrightControl.copyrightAlign === 'tc') {		// Позиция tc(TopCenter)
					gmxAPI.setPositionStyle(node, { 'top': '0px', 'bottom': '', 'right': '', 'left': center + 'px' });
				} else if(copyrightControl.copyrightAlign === 'tr') {		// Позиция tr(TopRight)
					gmxAPI.setPositionStyle(node, { 'top': '0px', 'bottom': '', 'right': copyrightAttr['x'], 'left': '' });
				} else if(copyrightControl.copyrightAlign === 'tl') {		// Позиция tl(TopLeft)
					gmxAPI.setPositionStyle(node, { 'top': '0px', 'bottom': '', 'right': '', 'left': copyrightAttr['x'] });
				}
			}
        }
        ,onChangeBackgroundColorID: null
        ,onMoveEndID: null
        ,
        setActive: function(flag) {            // Добавление прослушивателей событий
            var map = gmxAPI.map;
            if(flag) {
                map.addCopyrightedObject = function(obj) { copyrightControl.addItem(obj); }
                map.removeCopyrightedObject = function(obj) { copyrightControl.removeItem(obj); }
                map.setCopyrightVisibility = function(obj) { copyrightControl.setVisible(obj); } 
                map.updateCopyright = function() { copyrightControl.redraw(); } 
                // Изменить позицию контейнера копирайтов
                map.setCopyrightAlign = function(attr) {
                    if(attr['align']) copyrightControl.copyrightAlign = attr['align'];
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
	}
	
    //Поддержка - отображения строки текущего положения карты
	var locationControl = {
        parentNode: null
        ,nodes: null
        ,locationTitleDiv: null
        ,scaleBar: null
        ,items: []
        ,currentText: ''
        ,x: '26px'					// отступ по горизонтали
        ,y: '7px'					// отступ по вертикали
		,
		addItem: function(obj) {
            this.forEach(function(item, i) {
                if(obj === item) {
                    return false;   // Уже есть такой
                }
            });
            this.items.push(obj);
            this.redraw();
		}
        ,
		removeItem: function(obj) {
            this.forEach(function(item, i) {
                if(obj === item) {
                    this.items.splice(i, 1);
                    this.redraw();
                    return false;
                }
            });
		}
        ,
        init: function(cont) {        // инициализация
            locationControl.parentNode = cont.parentNode;
            if(!locationControl.nodes) locationControl.nodes = locationControl.createNode(locationControl.parentNode);
            if(!locationControl.nodes[0].parentNode) locationControl.setVisible(true);
            locationControl.setActive(true);
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
                        className: "gmx_scaleBar"
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
        ,
        'forEach': function(callback) {
			for (var i = 0, len = this.items.length; i < len; i++) {
				if(callback(this.items[i], i) === false) return;
            }
        }
        ,
        'setColor': function(color, flag) {
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
        'getLocalScale': function(x, y) {
			return gmxAPI.distVincenty(x, y, gmxAPI.from_merc_x(gmxAPI.merc_x(x) + 40), gmxAPI.from_merc_y(gmxAPI.merc_y(y) + 30))/50;
		}
        ,
        'repaintScaleBar': function() {
			if (locationControl.scaleBarText) {
				gmxAPI.size(locationControl.scaleBar, locationControl.scaleBarWidth, 16);
				locationControl.scaleBar.innerHTML = locationControl.scaleBarText;
			}
		}
        ,
        'checkPositionChanged': function() {
			var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
			var z = Math.round(currPos['z']);
			var x = (currPos['latlng'] ? currPos['latlng']['x'] : 0);
			var y = (currPos['latlng'] ? currPos['latlng']['y'] : 0);
			if(gmxAPI.map.needMove) {
				z = gmxAPI.map.needMove['z'];
				x = gmxAPI.map.needMove['x'];
				y = gmxAPI.map.needMove['y'];
			}

			var metersPerPixel = locationControl.getLocalScale(x, y) * gmxAPI.getScale(z);
			for (var i = 0; i < 30; i++)
			{
				var distance = [1, 2, 5][i%3]*Math.pow(10, Math.floor(i/3));
				var w = Math.floor(distance/metersPerPixel);
				if (w > 100)
				{
					var name = gmxAPI.prettifyDistance(distance);
					if (name != locationControl.scaleBarText || w != locationControl.scaleBarWidth)
					{
						locationControl.scaleBarText = name;
						locationControl.scaleBarWidth = w;
						locationControl.repaintScaleBar();
					}
					break;
				}
			}
			//setCoordinatesFormat();
		}
        ,'coordFormat': 0
        ,'prevCoordinates': ''
        ,
        'getCoordinatesText': function(currPos) {
			if(!currPos) currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
			var x = (currPos['latlng'] ? currPos['latlng']['x'] : gmxAPI.from_merc_x(currPos['x']));
			var y = (currPos['latlng'] ? currPos['latlng']['y'] : gmxAPI.from_merc_y(currPos['y']));
			if (x > 180) x -= 360;
			if (x < -180) x += 360;
			if (locationControl.coordFormat % 3 == 0)
				return gmxAPI.LatLon_formatCoordinates(x, y);
			else if (locationControl.coordFormat % 3 == 1)
				return gmxAPI.LatLon_formatCoordinates2(x, y);
			else
				return Math.round(gmxAPI.merc_x(x)) + ", " + Math.round(gmxAPI.merc_y(y));
		}
        ,
        'clearCoordinates': function() {
            var node = locationControl.coordinates;
			for (var i = node.childNodes.length - 1; i >= 0; i--)
				node.removeChild(node.childNodes[i]);
		}
        ,
        'coordFormatCallbacks': [		// методы формирования форматов координат
			function() { return locationControl.getCoordinatesText(); },
			function() { return locationControl.getCoordinatesText(); },
			function() { return locationControl.getCoordinatesText(); }
		]
        ,
		'setCoordinatesFormat': function(num, screenGeometry) {
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
		,'setCoordinatesFormatTimeout': null
		,'prpPosition': function() {
			if (locationControl.setCoordinatesFormatTimeout) return;
			locationControl.setCoordinatesFormatTimeout = setTimeout(function()
			{
				clearTimeout(locationControl.setCoordinatesFormatTimeout);
				locationControl.setCoordinatesFormatTimeout = null;
				if(gmxAPI.proxyType === 'flash') locationControl.checkPositionChanged();
				locationControl.setCoordinatesFormat();
			}, 150);
		}
        ,onChangeBackgroundColorID: null
        ,onMoveEndID: null
        ,positionChangedID: null
        ,onResizeMapID: null
        ,
        setActive: function(flag) {            // Добавление прослушивателей событий
            if(flag) {
                gmxAPI.map.scaleBar = { setVisible: function(flag) { gmxAPI.setVisible(locationControl.scaleBar, flag); } };
                
                gmxAPI.map.coordinates = {
                    setVisible: function(flag) 
                    { 
                        gmxAPI.setVisible(locationControl.coordinates, flag); 
                        gmxAPI.setVisible(locationControl.changeCoords, flag); 
                    }
                    ,
                    addCoordinatesFormat: function(func) 
                    { 
                        locationControl.coordFormatCallbacks.push(func);
                        return locationControl.coordFormatCallbacks.length - 1;
                    }
                    ,
                    removeCoordinatesFormat: function(num) 
                    { 
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
    }
/*
	// Добавление прослушивателей событий
	gmxAPI._listeners.addListener({'eventName': 'mapInit', 'func': function(map) {
		map.scaleBar = { setVisible: function(flag) { gmxAPI.setVisible(locationControl.scaleBar, flag); } };
		map.addListener('positionChanged', locationControl.prpPosition);
		if(gmxAPI.proxyType === 'flash') {
			map.addListener('onResizeMap', locationControl.prpPosition);
		} else {
			map.addListener('onMoveEnd', locationControl.checkPositionChanged);
		}
		map.addListener('onChangeBackgroundColor', function(htmlColor) {
			locationControl.setColor(htmlColor);
		});
        
		map.coordinates = {
			setVisible: function(flag) 
			{ 
				gmxAPI.setVisible(locationControl.coordinates, flag); 
				gmxAPI.setVisible(locationControl.changeCoords, flag); 
			}
			,
			addCoordinatesFormat: function(func) 
			{ 
				locationControl.coordFormatCallbacks.push(func);
				return locationControl.coordFormatCallbacks.length - 1;
			}
			,
			removeCoordinatesFormat: function(num) 
			{ 
				locationControl.coordFormatCallbacks.splice(num, 1);
				return locationControl.coordFormatCallbacks.length - 1;
			}
			,
			setFormat: locationControl.setCoordinatesFormat
		}
	}});
*/
    //Контролы слоев
	var layersControl = {
        parentNode: null
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

			//this.baseLayersTools = baseLayersTools;
			gmxAPI.map.baseLayersTools = baseLayersTools;
            
            //if(!layersControl.node) layersControl.node = layersControl.createNode(cont);
            //if(!layersControl.node.parentNode) layersControl.setVisible(true);
            layersControl.setActive(true);
        }
        ,
        setActive: function(flag) {            // Добавление прослушивателей событий
            if(flag) {
                gmxAPI._listeners.addListener({'level': 9999, 'eventName': 'mapInit', 'func': function(map) {
                    layersControl.map = map;

                    var key = 'onAddBaseLayer';
                    layersControl.listeners[key] = layersControl.map.addListener(key, function(ph) {
//console.log('onAddBaseLayer------ ', name, gmxAPI.BaseLayersManager.getItems());
                        layersControl.map.baseLayersTools.chkBaseLayerTool(ph['id'], ph['attr']);

                        //tool.select();
                    });

                    key = 'baseLayerSelected';
                    layersControl.listeners[key] = layersControl.map.addListener(key, function(name) {
                        //var tool = layersControl.map.baseLayersTools.getTool(name);
                        //var tool = layersControl.map.baseLayersTools.getTool(name);
                        //tool.select();
                        layersControl.map.baseLayersTools.setActiveTool(name);
                    });
                }});
            } else {
                for(var key in layersControl.listeners) layersControl.map.removeListener(key, layersControl.listeners[key]);
                layersControl.listeners = {};
            }
        }
    }
	//gmxAPI.LayersTools = gmxAPI.baseLayersTools = layersControl;
	//gmxAPI.LayersTools = layersControl;

	var Control = {
        'id': 'controlsBase'
        ,
        'isActive': false
        ,
        'items': [layersControl, geomixerLink, copyrightControl, locationControl, zoomControl, minimizeTools]
        ,
        'init': function(parent) {        // инициализация
            this.forEach(function(item, i) {
                ('init' in item ? item.init : item)(parent);
            });
        }
        //,'setVisible': function(flag) { }
        ,
        'remove': function() {      // удаление
        }
        ,
        'forEach': function(callback) {
			for (var i = 0, len = this.items.length; i < len; i++) {
				if(callback(this.items[i], i) === false) return;
            }
        }
	}
    if(gmxAPI.ControlsManager.currentID === Control.id) {
        gmxAPI._listeners.addListener({'eventName': 'mapInit', 'func': function(map) {
             copyrightControl.setActive(true);
             zoomControl.setActive(true);
             locationControl.setActive(true);
        }});
    }
    
	gmxAPI.ControlsManager.addControl(Control);
})();
