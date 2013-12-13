// Стандартные контролы
(function()
{
    "use strict";
    var icons = {
        backgroundImage: "url('../../api/img/iconeControls.png')"
        ,backgroundImageBand: "url('../../api/img/band.png')"
    }

    // Сообщение о Deferred методе
    var deferred = function() {
        console.log('deferred function: ', this);
    }
/*
    //Поддержка zoomControl
	var zoomControl = {
        id: 'zoomControl'
        ,parentNode: null
        ,node: null
        ,listeners: {}
        ,
        init: function(cont) {        // инициализация
            //console.log('zoomControl', gmxAPI.map.needMove);
            zoomControl.parentNode = cont;
            if(!zoomControl.node) zoomControl.node = zoomControl.createNode(cont);
            if(!zoomControl.node.parentNode) zoomControl.setVisible(true);
            zoomControl.toggleHandlers(true);
            var zoomBounds = gmxAPI.map.getZoomBounds();
            if(zoomBounds) {
                zoomControl.minZoom = zoomBounds.MinZoom;
                zoomControl.maxZoom = zoomBounds.MaxZoom;
            
                zoomControl.setZoom(gmxAPI.map.getZ());
                //zoomControl.repaint();
            }
        }
        ,
        remove: function() {      // удаление
            zoomControl.toggleHandlers(false);
            zoomControl.setVisible(false);
        }
        ,
        setVisible: function(flag) {        // инициализация
            var node = zoomControl.node;
			if(!flag) {
                if(node.parentNode) node.parentNode.removeChild(node);
			} else {
                if(!node.parentNode) zoomControl.parentNode.appendChild(node);
                //zoomControl.repaint();
            }
        }
        ,
        toggleHandlers: function(flag) {            // Добавление прослушивателей событий
            if(flag) {
                if(!gmxAPI.map.zoomControl) gmxAPI.map.zoomControl = zoomControl.mapZoomControl;
                // Добавление прослушивателей событий
                var key = 'onMinMaxZoom';
                zoomControl.listeners[key] = gmxAPI.map.addListener(key, function(ph) {
                    var attr = ph.attr;
                    zoomControl.minZoom = attr.minZoom;
                    zoomControl.maxZoom = attr.maxZoom;

                    zoomControl.setZoom(attr.currZ);
                    //zoomControl.repaint();
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
        createNode: function(cont) {        // инициализация
            var apiBase = gmxAPI.getAPIFolderRoot();
            var node = zoomControl.zoomParent = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_zoomParent"
                    ,unselectable: 'on'
                },
                {
                    position: "absolute",
                    left: "9px",
                    top: "55px"
                }
            );

            zoomControl.zoomPlaque = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_zoomPlaque"
                },
                {
                    borderRadius: '5px 5px 5px 5px',
                    backgroundColor: "white",
                    opacity: 0.3,
                    position: "absolute",
                    marginLeft: '3px',
                    marginTop: '3px',
                    width: '29px',
                    height: '60px'
                }
            );
            node.appendChild(zoomControl.zoomPlaque);

            var itemUL = gmxAPI.newElement(
                "ul",
                {
                    className: "gmx_zoomUL"
                },
                {
                    display: 'block',
                    listStyle: 'none outside none',
                    margin: 0,
                    padding: 0,
                }
            );
            node.appendChild(itemUL);

            zoomControl.zoomPlus = gmxAPI.newElement(
                "li",
                {
                    className: "gmx_zoomPlus"
                    ,onmouseover: function(e) { this.style.backgroundPosition = '-2px -7px'; }
                    ,onmouseout: function(e) {  this.style.backgroundPosition = '-2px -33px';}
                    ,onclick: function(e) {  gmxAPI.map.zoomBy(1); }
					
                },
                {
                    float: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    backgroundImage: icons.backgroundImage,
                    backgroundPosition: '-2px -33px',
                    height: '25px',
                    width: '23px',
                    marginLeft: '6px',
                    marginTop: '7px'
                }
            );
            itemUL.appendChild(zoomControl.zoomPlus);

            var liMinus = gmxAPI.newElement(
                "li",
                {
                },
                {
                }
            );
            itemUL.appendChild(liMinus);

            zoomControl.zoomMinus = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_zoomMinus"
                    ,onmouseover: function(e) { this.style.backgroundPosition = '-27px -7px'; }
                    ,onmouseout: function(e) {  this.style.backgroundPosition = '-27px -33px';}
                    ,onclick: function(e) {  gmxAPI.map.zoomBy(-1); }
                },
                {
                    float: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    backgroundImage: icons.backgroundImage,
                    backgroundPosition: '-27px -33px',
                    height: '25px',
                    width: '23px',
                    marginLeft: '6px',
                    marginTop: '3px'
                }
            );
            liMinus.appendChild(zoomControl.zoomMinus);

            itemUL = gmxAPI.newElement(
                "ul",
                {
                    className: "gmx_rulersCont"
                },
                {
                    display: 'none',
                    listStyle: 'none outside none',
                    padding: '0px',
                    position: 'absolute',
                    top: '63px',
                    left: '3px'
                }
            );
            liMinus.appendChild(itemUL);
            node.onmouseover = function(e) {
                itemUL.style.display = 'block';
                zoomControl.zoomPlaque.style.borderRadius = '5px 5px 0px 0px';
            }
            node.onmouseout = function(e) {
                if(!zoomControl.RulersClick.onmousemove) {
                    itemUL.style.display = 'none';
                    zoomControl.zoomPlaque.style.borderRadius = '5px 5px 5px 5px';
                }
            }

            var itemLI = gmxAPI.newElement(
                "li",
                {
                    className: "gmx_zoomItemLI"
                },
                {
                }
            );
            itemUL.appendChild(itemLI);

            zoomControl.RulersClick = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_zoomRulersClick"
                },
                {
                    position: "absolute",
                    cursor: 'pointer'
                }
            );
            itemLI.appendChild(zoomControl.RulersClick);

            zoomControl.RulersBG = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_zoomRulersBG"
                    ,onclick: function(e) {
                        zoomControl.setRulersPos(e.layerY - zoomControl.rulerHeight);
                    }
                },
                {
                    //pointerEvents: 'none',
                    borderRadius: '0px 0px 5px 5px',
                    backgroundColor: "white",
                    opacity: 0.3,
                    height: '97px'
                }
            );
            zoomControl.RulersClick.appendChild(zoomControl.RulersBG)

            zoomControl.pointerCurrent = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_zoomPointerCurrent"
                },
                {
                    position: "relative",
                    cursor: 'pointer',
                    backgroundImage: icons.backgroundImage,
                    backgroundPosition: '-3px -121px',
                    height: '7px',
                    width: '29px',
                    bottom: '0px',
                    left: '6px'
                }
            );
            zoomControl.RulersClick.appendChild(zoomControl.pointerCurrent);
            // drag бегунка
            zoomControl.pointerCurrent.onmousedown = function(e) {
                zoomControl.pointerCurrent.style.pointerEvents = 'none';
                zoomControl.RulersClick.onmousemove = function(e) {
                    var z = zoomControl.getRulersZoom(e.layerY);
                    var dz = zoomControl.currZoom - z;
                    if(dz == 0 || Math.abs(dz) > 2) return;
                    zoomControl.setZoom(z);
                }
                document.onmouseup = function(e) {
                    if(zoomControl.RulersClick.onmousemove) {
                        itemUL.style.display = 'none';
                        var mz = gmxAPI.map.getZ();
                        var dz = zoomControl.currZoom - gmxAPI.map.getZ();
                        if(dz != 0) gmxAPI.map.zoomBy(dz);
                    }
                    zoomControl.RulersClick.onmousemove = null;
                    zoomControl.pointerCurrent.style.pointerEvents = '';
                    document.onmouseup = zoomControl.RulersClick.onmousemove = null;
                }
            }
            
            zoomControl.zoomVal = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_zoomVal"
                },
                {
                    pointerEvents: 'none',
                    position: "absolute",
                    left: '25px',
                    top: '-5px',
                    fontFamily: 'Tahoma',
                    fontSize: '9pt',
                    fontWeight: 'bold',
                    backgroundImage: icons.backgroundImage,
                    backgroundPosition: '-33px -117px',
                    textAlign: 'center',
                    height: '17px',
                    width: '22px'
                }
            );
            zoomControl.pointerCurrent.appendChild(zoomControl.zoomVal);
            
            
            zoomControl.Ruler = gmxAPI.newElement(
                "span",
                {
                    className: "gmx_zoomRuler"
                },
                {
                    pointerEvents: 'none',
                    backgroundImage: icons.backgroundImageBand,
                    position: "absolute",
                    top: '7px',
                    left: '9px',
                    height: '84px',
                    width: '11px'
                }
            );
            zoomControl.RulersClick.appendChild(zoomControl.Ruler);
            return node;
        }
        ,minZoom: 1
        ,maxZoom: 30
        ,zoomArr: []
        ,zoomObj: null
        ,rHeight: 13
		,rulerHeight: 7
		,currZoom: -1
        ,
        'setRulerSize': function() {
            var minZ = zoomControl.minZoom;
            var maxZ = zoomControl.maxZoom;

            zoomControl.rHeight = zoomControl.rulerHeight * (maxZ - minZ + 1);
            zoomControl.Ruler.style.height = zoomControl.rHeight + 'px';
            zoomControl.RulersBG.style.height = (zoomControl.rHeight + 13) + 'px';
        }
        ,
        'getRulersZoom': function(y) {
            var minZ = zoomControl.minZoom;
            var maxZ = zoomControl.maxZoom;
            var py = zoomControl.rHeight + zoomControl.rulerHeight * minZ - y;
            var z = Math.floor(py / zoomControl.rulerHeight);
            if(minZ > z) z = minZ;
            else if(maxZ < z) z = maxZ;
            return z;
        }
        ,
        'setRulersPos': function(y) {
            var z = zoomControl.getRulersZoom(y);
            gmxAPI.map.zoomBy(z - zoomControl.currZoom);
            zoomControl.setZoom(z);
        }
        ,
        'setZoom': function(z) {
            var minZ = zoomControl.minZoom;
            var maxZ = zoomControl.maxZoom;
            var currZoom = zoomControl.currZoom = z;
            if(currZoom < minZ) currZoom = minZ;
            else if(currZoom > maxZ) currZoom = maxZ;
            var py = Math.floor((currZoom - minZ) * zoomControl.rulerHeight) + 13;
            zoomControl.pointerCurrent.style.bottom = py + 'px';
            zoomControl.zoomVal.innerHTML = currZoom;
        }
        ,onChangeBackgroundColorID: null
        ,onMoveEndID: null
        ,mapZoomControl: {
            isVisible: true,
            isMinimized: false,
            setVisible: function(flag)
            {
                zoomControl.setVisible(flag);
                this.isVisible = flag;
            },
            setZoom: function(z)
            {
                zoomControl.setZoom(z);
            },
            repaint: function()
            {
            },
            setMinMaxZoom: function(z1, z2)
            {
                zoomControl.minZoom = z1;
                zoomControl.maxZoom = z2;
                zoomControl.setRulerSize();
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
*/
    //Поддержка контейнера Copyright + Location
	var node = gmxAPI.newElement(
        "div",
        {
            className: "gmx_copyright_location"
        },
        {
            bottom: 0,
            right: 0,
            left: 0,
            position: 'absolute'
        }
    );
/*
	node.appendChild(gmxAPI.newElement(
        "div",
        {
            className: "gmx_copyright_location_bg"
        },
        {
            height: "20px",
            opacity: 0.5,
            width: '100%',
            backgroundColor: 'white'
        }
    ));

	var copyrightAndLocationContainer = node;
	var copyrightAndLocationContainerParent = null;
    
    //Поддержка copyright
	var copyrightControl = {
        id: 'copyrights'
        ,parentNode: null
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
            copyrightAndLocationContainerParent = cont.parentNode;
            if(!copyrightAndLocationContainer.parentNode) cont.parentNode.appendChild(copyrightAndLocationContainer);
            copyrightControl.parentNode = copyrightAndLocationContainer;
            if(!copyrightControl.node) copyrightControl.node = copyrightControl.createNode(copyrightControl.parentNode);
            copyrightControl.setVisible(true);
            copyrightControl.toggleHandlers(true);
            copyrightControl.redraw();
            //copyrightControl.chkWidth();
        }
        ,
        remove: function() {      // удаление
            copyrightControl.toggleHandlers(false);
            copyrightControl.setVisible(false);
        }
        ,
        createNode: function(cont) {        // инициализация
            var node = gmxAPI.newElement(
                "span",
                {
                    className: "gmx_copyright"
                },
                {
                    color: 'black',
                    fontSize: "9pt",
                    fontFamily: "Tahoma",
                    wordBreak: "break-all",
                    overflow: "hidden",
                    position: "absolute",
                    left: '18px',
                    top: '2px'
                }
            );
            return node;
        }
        ,
        setVisible: function(flag) {        // инициализация
			if(!flag) {
                if(copyrightControl.node.parentNode) copyrightControl.node.parentNode.removeChild(copyrightControl.node);
                if(copyrightAndLocationContainer.childNodes.length === 1)
                    copyrightAndLocationContainer.parentNode.removeChild(copyrightAndLocationContainer);
			} else {
                copyrightControl.parentNode.appendChild(copyrightControl.node);
                if(!copyrightAndLocationContainer.parentNode)
                    copyrightAndLocationContainerParent.appendChild(copyrightAndLocationContainer);
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
			if(!currPos.latlng) return;
			var x = currPos.latlng.x;
			var y = currPos.latlng.y;
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
        ,onChangeBackgroundColorID: null
        ,onMoveEndID: null
        ,scaleBarRepaintedID: null
        ,
        chkWidth: function(locationWidth) {
            if(!copyrightControl.node.parentNode) return;
            if(!locationWidth) locationWidth = (locationControl && locationControl.node ? locationControl.node.clientWidth : 0);
            var width = copyrightControl.node.parentNode.clientWidth - 30 - locationWidth;
            //copyrightControl.node.style.maxWidth = width + 'px';
            copyrightControl.node.style.width = (width > 0 ? width : 0) + 'px';
        }
        ,
        toggleHandlers: function(flag) {            // Добавление прослушивателей событий
            var map = gmxAPI.map;
            if(flag) {
                map.addCopyrightedObject = function(obj) { copyrightControl.addItem(obj); }
                map.removeCopyrightedObject = function(obj) { copyrightControl.removeItem(obj); }
                map.setCopyrightVisibility = function(obj) { copyrightControl.setVisible(obj); } 
                map.updateCopyright = function() { copyrightControl.redraw(); } 
                // Изменить позицию контейнера копирайтов
                map.setCopyrightAlign = function(attr) {
                    if(attr.align) copyrightControl.copyrightAlign = attr.align;
                    copyrightControl.setPosition();
                }
                
                copyrightControl.scaleBarRepaintedID = map.addListener('scaleBarRepainted', function(width) {
                    copyrightControl.chkWidth(width);
                });
                copyrightControl.onSetCoordinatesFormatID = map.addListener('onSetCoordinatesFormat', function() {
                    copyrightControl.chkWidth();
                });
                
                copyrightControl.onChangeBackgroundColorID = map.addListener('onChangeBackgroundColor', function(htmlColor) {
                    copyrightControl.redraw();
                });

                var updateListenerID = null;
                var evName = (gmxAPI.proxyType === 'flash' ? 'positionChanged' : 'onMoveEnd');
                copyrightControl.onMoveEndID = map.addListener(evName, function() {
                    if (updateListenerID) return;
                    updateListenerID = setTimeout(function()
                    {
                        copyrightControl.redraw();
                        clearTimeout(updateListenerID);
                        updateListenerID = null;
                        copyrightControl.chkWidth();
                    }, 250);
                });
            } else {
                map.addCopyrightedObject = 
                map.removeCopyrightedObject = 
                map.setCopyrightVisibility = 
                map.setCopyrightAlign = 
                map.updateCopyright = function() {};

                if(copyrightControl.scaleBarRepaintedID) {
                    map.removeListener('scaleBarRepainted', copyrightControl.scaleBarRepaintedID);
                    copyrightControl.scaleBarRepaintedID = null;
                }

                if(copyrightControl.onSetCoordinatesFormatID) {
                    map.removeListener('onSetCoordinatesFormat', copyrightControl.onSetCoordinatesFormatID);
                    copyrightControl.onSetCoordinatesFormatID = null;
                }

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
        ,node: null
        ,locationTitleDiv: null
        ,scaleBar: null
        ,currentText: ''
        ,coordFormat: 0
        ,prevCoordinates: ''
        ,
        init: function(cont) {        // инициализация
            copyrightAndLocationContainerParent = cont.parentNode;
            if(!copyrightAndLocationContainer.parentNode) cont.parentNode.appendChild(copyrightAndLocationContainer);
            locationControl.parentNode = copyrightAndLocationContainer;
            if(!locationControl.node) locationControl.node = locationControl.createNode(locationControl.parentNode);
            locationControl.setVisible(true);
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
        showCoordinates: function() {        //окошко с координатами
            if (locationControl.coordFormat > 2) return; // только для стандартных форматов.
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
            var node = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_locationControl"
                },
                {
                    fontSize: '11px',
                    position: "absolute",
                    right: '8px',
                    top: '3px'
                }
            );
            locationControl.locationTxt = gmxAPI.newElement(
                "span",
                {
                    className: "gmx_locationTxt",
                    onclick: locationControl.showCoordinates
                },
                {
                    color: 'black',
                    cursor: "pointer",
                    fontSize: "9pt",
                    fontFamily: "Tahoma",
                    marginRight: "20px"
                }
            );
            node.appendChild(locationControl.locationTxt);

            locationControl.scaleBar = gmxAPI.newElement(
                "span",
                {
                    className: "gmx_scaleBar",
                    onclick: locationControl.nextCoordinatesFormat
                },
                {
                    cursor: "pointer",
                    backgroundColor: 'white',
                    border: '1px solid black',
                    display: 'inline-block',
                    marginBottom: '1px',
                    height: '4px',
                    width: '40px'
                }
            );
            node.appendChild(locationControl.scaleBar);

            locationControl.scaleBarTxt = gmxAPI.newElement(
                "span",
                {
                    className: "gmx_scaleBarTxt",
                },
                {
                    color: 'black',
                    marginLeft: '2px',
                    fontSize: "9pt",
                    fontFamily: "Tahoma"
                }
            );
            node.appendChild(locationControl.scaleBarTxt);
            return node;
        }
        ,
        setVisible: function(flag) {        // Добавление/Удаление в DOM
            var pNode = locationControl.node.parentNode;
			if(!flag) {
                if(pNode) pNode.removeChild(locationControl.node);
                if(copyrightAndLocationContainer.childNodes.length === 1)
                    copyrightAndLocationContainer.parentNode.removeChild(copyrightAndLocationContainer);
			} else {
                if(!pNode) locationControl.parentNode.appendChild(locationControl.node);
                if(!copyrightAndLocationContainer.parentNode)
                    copyrightAndLocationContainerParent.appendChild(copyrightAndLocationContainer);
            }
        }
        ,
        'setColor': function(color, flag) {
			if(flag) {
				locationControl.checkPositionChanged();
			}
		}
        ,
        'repaintScaleBar': function() {
			if (locationControl.scaleBarText) {
				gmxAPI.size(locationControl.scaleBar, locationControl.scaleBarWidth, 4);
				locationControl.scaleBarTxt.innerHTML = locationControl.scaleBarText;
				gmxAPI._listeners.dispatchEvent('scaleBarRepainted', gmxAPI.map, locationControl.node.clientWidth);
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
        ,
        getCoordinatesText: function(currPos) {
			return gmxAPI.getCoordinatesText(currPos, locationControl.coordFormat);
		}
        ,
        clearCoordinates: function() {
            var node = locationControl.locationTxt;
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
			var res = locationControl.coordFormatCallbacks[num](locationControl.locationTxt, attr);		// если есть res значит запомним ответ
			if(res && locationControl.prevCoordinates != res) locationControl.locationTxt.innerHTML = res;
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
        toggleHandlers: function(flag) {            // Добавление прослушивателей событий
            if(flag) {
                gmxAPI.map.scaleBar = {
                    setVisible: function(flag) {
                        gmxAPI.setVisible(locationControl.scaleBar, flag);
                        gmxAPI.setVisible(locationControl.scaleBarTxt, flag);
                    }
                };
                
                gmxAPI.map.coordinates = {
                    setVisible: function(flag) 
                    { 
                        gmxAPI.setVisible(locationControl.locationTxt, flag); 
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
        ,getInterface: function() {
            return {
                remove: locationControl.remove
                ,setVisible: locationControl.setVisible
            };
        }
    }
*/
    //Контролы слоев (аля Leaflet)
	var layersControl = {
        id: 'layers'
        ,parentNode: null
        ,node: null
        ,listeners: {}
        ,mapInitListenerID: null
        ,map: null
        ,
        init: function(cont) {        // инициализация
            layersControl.parentNode = cont;
            //if(!layersControl.node) layersControl.node = layersControl.createNode(cont);
            //if(!layersControl.node.parentNode) layersControl.setVisible(true);
            layersControl.toggleHandlers(true);
            layersControl.chkExists();
			gmxAPI.map.baseLayerControl.setVisible = layersControl.setVisible; // обратная совместимость
        }
        ,
        remove: function() {      // удаление
            layersControl.toggleHandlers(false);
            layersControl.setVisible(false);
        }
        ,
        chkExists: function() {     // Получить уже установленные подложки
			var arr = gmxAPI.map.baseLayersManager.getAll();
            for(var i=0, len = arr.length; i<len; i++) {
                if(arr[i].isVisible) layersControl.addBaseLayerTool(arr[i]);
            }
			var id = gmxAPI.map.baseLayersManager.getCurrentID();
            if(layersControl.baseLayersHash[id]) layersControl.baseLayersHash[id].select();
        }
        ,
        setVisible: function(flag) {
            if(!gmxAPI._leaflet.gmxLayers) return;
			if(!flag) {
                gmxAPI._leaflet.LMap.removeLayer(gmxAPI._leaflet.gmxLayers);
                //if(layersControl.node.parentNode) layersControl.parentNode.removeChild(layersControl.node);
			} else {
                gmxAPI._leaflet.gmxLayers.addTo(gmxAPI._leaflet.LMap);
                //if(!layersControl.node.parentNode) layersControl.parentNode.appendChild(layersControl.node);
            }
        }
/*        ,
        createNode: function(cont) {        // создание нод
            var node = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_layersControl"
                },
                {
                    position: "absolute"
                    ,fontFamily: 'Tahoma'
                    ,fontSize: '10pt'
                    ,marginRight: '10px'
                    ,marginTop: '10px'
                    ,right: '34px'
                    ,background: 'rgba(255, 255, 255, 0.8)'
                    //,color: '#333333'
                    ,padding: '6px 10px 6px 6px'
                    ,borderRadius: '5px 5px 5px 5px'
                    ,boxShadow: '0 1px 7px rgba(0, 0, 0, 0.4)'
                }
            );
            layersControl.baseNode = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_layersControlBase"
                },
                {
                }
            );
            node.appendChild(layersControl.baseNode);
            layersControl.overlaysNodeSeparator = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_layersControlSeparator"
                },
                {
                    borderTop: '1px solid #DDDDDD'
                    ,height: 0
                    ,margin: '5px -10px 5px -6px'
                    ,display: 'none'
                }
            );
            node.appendChild(layersControl.overlaysNodeSeparator);
            layersControl.overlaysNode = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_layersControlOverlays"
                    //,innerHTML: "Overlay"
                },
                {
                    display: 'none'
                }
            );
            node.appendChild(layersControl.overlaysNode);
            return node;
        }*/
        ,
        toggleHandlers: function(flag) {            // Добавление прослушивателей событий
            if(flag) {
                //gmxAPI._listeners.addListener({level: 9998, eventName: 'mapInit', func: function(map) {
                    layersControl.map = gmxAPI.map;
                    var mbl = layersControl.map.baseLayersManager;
                    var key = 'onAdd';
                    layersControl.listeners[key] = mbl.addListener(key, layersControl.addBaseLayerTool);
                    key = 'onLayerChange';
                    layersControl.listeners[key] = mbl.addListener(key, layersControl.addBaseLayerTool);
                    key = 'onVisibleChange';
                    layersControl.listeners[key] = mbl.addListener(key, layersControl.onVisibleChange);
                    key = 'onIndexChange';
                    layersControl.listeners[key] = mbl.addListener(key, layersControl.onIndexChange);
                    key = 'onSetCurrent';
                    layersControl.listeners[key] = mbl.addListener(key, function(bl) {
                        if(!bl) return;
                        gmxAPI._leaflet.gmxLayers.setCurrent(bl._leaflet_id);
                        //var item = layersControl.baseLayersHash[bl.id];
                        //if(item) item.select();
                    });
                    key = 'onRemove';
                    layersControl.listeners[key] = mbl.addListener(key, function(bl) {
                        layersControl.removeBaseLayerTool(bl.id);
                    });
                //}});
            } else {
                for(var key in layersControl.listeners) layersControl.map.removeListener(key, layersControl.listeners[key]);
                layersControl.listeners = {};
            }
        }
        ,baseLayersHash: {}
        ,aliasNames: {}
        ,currentBaseID: ''
        ,overlaysLayersHash: []
        ,
        onIndexChange: function(ph) {
            var id = ph.id;
            var index = ph.getIndex();
            gmxAPI._leaflet.gmxLayers.setIndex(ph, index);
        }
        ,
        onVisibleChange: function(ph) {
            var id = ph.id;
            if(!ph.isVisible) gmxAPI._leaflet.gmxLayers.removeLayer(ph);
            else {
                var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(ph.rus, ph.eng) || id;
                if(ph.overlay) gmxAPI._leaflet.gmxLayers.addOverlay(ph, name);
                else gmxAPI._leaflet.gmxLayers.addBaseLayer(ph, name);
            }
        }
        ,
        removeOverlay: function (id) {
            if(!layersControl.overlaysLayersHash) return null;
            var overlay = layersControl.overlaysLayersHash[id];
            if (!overlay) return null;
            gmxAPI._leaflet.gmxLayers.removeLayer(overlay);
            delete layersControl.overlaysLayersHash[id];
            for(var i=0, len = layersControl.overlaysLayersHash.length; i<len; i++) {
                if(id === layersControl.overlaysLayersHash[i].id) {
                    layersControl.overlaysLayersHash.splice(i, 1);
                    break;
                }
            }
            return overlay;
        }
        ,
        addOverlay: function (ph) {
            var id = ph.id;
            if (!layersControl.overlaysLayersHash[id]) {
                layersControl.overlaysLayersHash.push(ph);
                layersControl.overlaysLayersHash[id] = ph;
            }
            var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(ph.rus, ph.eng) || id;
            var gmxLayers = gmxAPI._leaflet.gmxLayers.addOverlay(ph, name);
            Controls.controlsHash[id] = {
                setActiveTool: function (flag) {
                    gmxLayers.setVisibility(id, flag);
                }
            };
            return gmxLayers;
        }
        ,
        removeBaseLayerTool: function (id) {
            var baseLayers = layersControl.baseLayersHash[id];
            if (!baseLayers) return null;
            baseLayers.cont.parentNode.removeChild(baseLayers.cont);
            delete layersControl.baseLayersHash[id];
            return baseLayers;
        }
        ,
        addBaseLayerTool: function (ph) {
            if(!ph.isVisible) return;
            var id = ph.id;
            var index = ph.getIndex();
            if (!layersControl.baseLayersHash[id]) {
                layersControl.baseLayersHash[id] = ph;
            }
            var baseLayer = layersControl.baseLayersHash[id];
            var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(baseLayer.rus, baseLayer.eng) || id;
            var layers = baseLayer.layers || [];
            if(layers.length > 0) {
                gmxAPI._leaflet.gmxLayers.addBaseLayer(baseLayer, name);
            }
        }
        ,
        getAlias: function(tn) {
            return layersControl.aliasNames[tn] || tn;
        }
        ,
        getAliasByName: function(tn) {
            for (var key in layersControl.baseLayersHash) {
                var tool = layersControl.baseLayersHash[key];
                var alias = tool.attr.alias || key;
                if(alias === tn) return alias;
                else if(tool.attr.lang) {
                    for (var lang in tool.attr.lang) {
                        if(tool.attr.lang[lang] === tn) return alias;
                    }
                }
            }
            return null;
        }
        ,
        getTool: function(tn) {
            tn = layersControl.getAlias(tn);
            if(layersControl.baseLayersHash[tn]) return layersControl.baseLayersHash[tn];
            return null;
        }
        ,updateVisibility: deferred
        ,repaint: deferred
        ,getInterface: function() {
            return {
                remove: layersControl.remove
                ,setVisible: layersControl.setVisible
                ,addBaseLayer: function(id, ruTitle, enTitle) {
                    layersControl.addBaseLayerTool({
                        id: id
                        ,rus: ruTitle || id
                        ,eng: enTitle || id
                    });
                }
                ,removeBaseLayer: layersControl.removeBaseLayerTool
                ,addOverlay: function(id, ph) {
                    layersControl.addOverlay({
                        id: id
                        ,overlay: true
                        ,layer: ph.layer
                        ,rus: ph.rus || id
                        ,eng: ph.eng || id
                        ,onClick: ph.onClick
                        ,onCancel: ph.onCancel
                    });
                }
                ,removeOverlay: layersControl.removeOverlay
            };
        }
    }
	gmxAPI.LayersTools = gmxAPI.baseLayersTools = layersControl;

    //Контролы иконок
    var setDOMStyle = function(node, style) {
        for(var key in style) node.style[key] = style[key];
    }
	var iconsControl = {
        id: 'iconsControl'
        ,parentNode: null
        ,node: null
        //,hideNode: null
        ,items: []
        ,
        init: function(cont) {        // инициализация
            iconsControl.parentNode = cont;
            //if(!iconsControl.hideNode) iconsControl.hideNode = iconsControl.createNode(cont);
            if(!iconsControl.node) iconsControl.node = iconsControl.createNode(cont);
            iconsControl.setVisible(true);
            iconsControl.toggleHandlers(true);
            gmxAPI.IconsControl = iconsControl;
        }
        ,
        remove: function() {      // удаление
            iconsControl.toggleHandlers(false);
            iconsControl.setVisible(false);
            delete gmxAPI.IconsControl;
        }
        ,
        setVisible: function(flag) {
			if(!flag) {
                if(iconsControl.node.parentNode) iconsControl.node.parentNode.removeChild(iconsControl.node);
			} else {
                if(!iconsControl.node.parentNode) iconsControl.parentNode.appendChild(iconsControl.node);
            }
        }
        ,
        hideItems: function(flag) {
			iconsControl.itemsNode.style.display = (flag ? 'none' : 'block');
        }
        ,
        addItemNode: function(pt) {
            var attr = pt.attr || {};
            var id = pt.id || attr.title || iconsControl.items.length;// || 0;
            var groupID = pt.groupID;       // Признак группы
            if(!('className' in attr)) {
                attr.className = 'gmx_' + id;
            }
            var notSticky = (pt.notSticky ? pt.notSticky : 0);
            var events = pt.events || {};
            var style = pt.style || {};
            var hoverStyle = pt.hoverStyle || {};
            if(pt.regularImageUrl) {
                delete style.backgroundImage;
                style.position = 'relative';
                style.backgroundColor = '#9A9A9A';
                hoverStyle.backgroundColor = "#9A9A9A";
                delete hoverStyle.backgroundImage;
            }
            
            for(var key in events) {
                if(key === 'onmouseover' || key === 'onmouseout') continue;
                attr[key] = function(e) {
                    var handler = events[key];
                    pt.isActive = !pt.isActive;
                    if(key === 'onclick' && 'onCancel' in pt && !pt.isActive) {
                        if(groupID) iconsControl.groupTools[groupID].setCurrent();
                        handler = pt.onCancel;
                    }
                    if(handler) handler.call(this, e);
                    if (notSticky == 1){    // Если интструмент включен, сразу же выключите его.
                        pt.isActive = false;
                    }
                    
                }
            }
            attr.onmouseover = function(e) {
                if(pt.activeImageUrl) {
                    this.childNodes[0].src = pt.activeImageUrl;
                } else {
                    setDOMStyle(this, hoverStyle);
                }
                if('onmouseover' in events) {
                    events.onmouseover.call(iconsControl, e);
                }
            }
            attr.onmouseout = function(e) {
                var selectedFlag = ((groupID && id === iconsControl.groupTools[groupID].currentID)
                    || pt.isActive
                    ? true : false);
                if(!selectedFlag) {
                    if(pt.regularImageUrl) {
                        this.childNodes[0].src = pt.regularImageUrl;
                    } else {
                        setDOMStyle(this, style);
                    }
                }
                if('onmouseout' in events) {
                    events.onmouseout.call(iconsControl, e);
                }
            }
            
            var itemNode = gmxAPI.newElement("div", attr, style);
            if(pt.regularImageUrl) {
                itemNode.appendChild(gmxAPI.newElement("img", {
                    'src': pt.regularImageUrl
                }, {
                    position: 'absolute'
                    ,margin: 'auto'
                    ,bottom: '0px'
                    ,top: '0px'
                    ,left: '0px'
                    ,right: '0px'
                }));
            }
            itemNode._gmxItem = pt;
            return itemNode;
        }
        ,
        styleIcon: {        // стиль ноды иконок по умолчанию
            backgroundImage: icons.backgroundImage
            ,borderRadius: '4px'
            ,display: 'block'
            ,cursor: 'pointer'
            ,width: '30px'
            ,height: '30px'
            ,marginLeft: '6px'
            ,styleFloat: 'left'
            ,cssFloat: 'left'
        }
        ,
        styleArrIcon: {        // стиль ноды вертикальных иконок по умолчанию
            backgroundImage: icons.backgroundImage
            ,cursor: 'pointer'
            ,width: '30px'
            ,height: '30px'
            ,marginLeft: '6px'
        }
        ,
        createNode: function(cont) {        // создание нод
            var node = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_iconsControl"
                },
                {
                    position: "absolute"
                    ,top: '10px'
                    ,left: '300px'
                }
            );
            iconsControl.itemsNode = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_iconsControlItems"
                },
                {
                    display: 'block'
                    ,marginLeft: '6px'
                    ,styleFloat: 'left'
                    ,cssFloat: 'left'
                }
            );
            node.appendChild(iconsControl.itemsNode);
            return node;
        }
        ,
        toggleHandlers: function(flag) {            // Добавление прослушивателей событий
        }
        ,groupTools: {}
        ,
        addTool: function(key, pt) {                 // Добавление иконки
			var ph = gmxAPI.extend({
                id: key || pt.id
                ,isActive: false
                ,attr: {
                    title: pt.title || pt.hint
                }
                ,events: {}
                ,style: gmxAPI.extend(pt.style, iconsControl.styleIcon, true)
                ,hoverStyle: pt.hoverStyle
            }, pt);

            if(pt.onClick) ph.events.onclick = pt.onClick;
			var item = iconsControl.addItemNode(ph);
            iconsControl.itemsNode.appendChild(item);
            var tool = {
                id: ph.id
                ,node: item
            }
            if(pt.type !== 'hideItem') {
                iconsControl.items.push(tool);
                iconsControl.items[ph.id] = tool;
            }
            return item;
        }
        ,
        forEach: function(callback) {
			for (var i = 0, len = iconsControl.items.length; i < len; i++) {
				if(callback(this.items[i], i) === false) return;
            }
        }
        ,
        removeTool: function(id) {        // Удалить tool
            iconsControl.forEach(function(item, i) {
                if(id === item.id) {
                    iconsControl.items.splice(i, 1);
                    delete iconsControl.items[id];
                    item.node.parentNode.removeChild(item.node);
                    return false;   // Уже есть такой
                }
            });
        }
        ,currentID: null
        ,
        selectTool: function(id) {        // Удалить tool
            var item = iconsControl.items[iconsControl.currentID];
            if(item && 'onmouseout' in item.node) item.node.onmouseout();
            item = iconsControl.items[id];
            if(item && 'onmouseover' in item) item.node.onmouseover();
            iconsControl.currentID = id;
        }
        ,
        getToolByName: function(name) {        // Получить tool по name
            var item = iconsControl.items[name];
            return (item ? item : null);
        }
        ,
        addGroupTool: function(pt) {            // Добавление раскрывающегося массива иконок
			var groupID = pt.id;
			var arr = pt.items;
            var onmouseover = function(e) {
                for(var i=0, len=cont.childNodes.length; i<len; i++) {
                    var it = cont.childNodes[i];
                    it.style.display = 'block';
                }
            }
            var onmouseout = function() {
                cont.firstChild.style.display = 'block';
                for(var i=1, len=cont.childNodes.length; i<len; i++) {
                    var it = cont.childNodes[i];
                    it.style.display = 'none';
                }
            }
            var cont = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_iconsCont"
                    ,onmouseover: onmouseover
                    ,onmouseout: onmouseout
                },
                {
                    display: 'block'
                    ,marginLeft: '6px'
                    ,styleFloat: 'left'
                    ,cssFloat: 'left'
                }
            );
			var groupItems = {
                currentID: null
                ,items: {}
                ,selectTool: function(id) {
                    groupItems.setCurrent(id);
                }
                ,setCurrent: function(id) {
                    if(groupItems.currentID) {
                        var prevItem = groupItems.items[groupItems.currentID];
                        if(prevItem) {
                            var _gmxItem = prevItem._gmxItem;
                            if('onmouseout' in _gmxItem) _gmxItem.onmouseout();
                            if('onCancel' in _gmxItem) _gmxItem.onCancel();
                            _gmxItem.isActive = false;
                            if(!id || groupItems.currentID === id) {
                                groupItems.currentID = null;
                                if(_gmxItem.currObj) _gmxItem.currObj.stopDrawing();
                                _gmxItem.currObj = null;
                                return;
                            }
                        }
                    }
                    var target = null;
                    if(id && groupItems.items[id] && groupItems.currentID !== id) {
                        target = groupItems.items[id];
                        if(target != target.parentNode.firstChild) {
                            target.parentNode.insertBefore(target, target.parentNode.firstChild);
                        }
                        var _gmxItem = target._gmxItem;
                        if('onmouseover' in _gmxItem) _gmxItem.onmouseover();
                        if('onClick' in _gmxItem) _gmxItem.currObj = _gmxItem.onClick();
                        _gmxItem.isActive = true;
                    } else {
                        id = null;
                    }
                    groupItems.currentID = (groupItems.items[id] ? id : null);
                    onmouseout();
                }
            };
            for(var i=0, len=arr.length; i<len; i++) {
                var ph = arr[i];
                (function(){
                    var style = ph.style;
                    var hoverStyle = ph.hoverStyle;
                    var onClick = ph.onClick;
                    var onCancel = ph.onCancel;
                    var id = ph.key;
                    var item = iconsControl.addItemNode({
                        id: id
                        ,isActive: false
                        ,groupID: groupID
                        ,onClick: ph.onClick
                        ,onCancel: ph.onCancel
                        ,onmouseout: function(e) {
                            setDOMStyle(item, style);
                        }
                        ,onmouseover: function(e) {
                            setDOMStyle(item, hoverStyle);
                        }
                        ,
                        attr: {
                            title: ph.hint
                        }
                        ,
                        events: {
                            onclick: function(e) {
                                groupItems.setCurrent(id);
                            }
                        }
                        ,style: gmxAPI.extend(style, iconsControl.styleArrIcon)
                        ,hoverStyle: hoverStyle
                    });
                    cont.appendChild(item);
                    groupItems.items[id] = item;
                })();
            }
            onmouseout();
            iconsControl.itemsNode.appendChild(cont);
            var tool = {
                id: groupID
                ,node: cont
                ,group: groupItems
            }
            iconsControl.items.push(tool);
            iconsControl.items[groupID] = tool;
            iconsControl.groupTools[groupID] = groupItems;
            return groupItems;
        }
        ,getInterface: function() {
            return {
                remove: iconsControl.remove
                ,setVisible: iconsControl.setVisible
            };
        }
    }

	var drawingControl = {
        id: 'drawing'
        ,parentNode: null
        ,node: null
//        ,hideNode: null
        ,items: []
        ,
        init: function(cont) {        // инициализация
            // Установка drawing контролов
        }
        ,setVisible: function(flag) {
        }
        ,getInterface: function() {
            return gmxAPI._drawing.control;
        }
    }

    /**
     * Описание класса Control.
     * @typedef {Object} Control
     * @property {String} id - Идентификатор типа контролов.
     * @property {Function} init - Ф-ция для инициализации.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {Array} [Control] items - Массив контролов данного типа контролов.
     * @property {Function} setVisible [boolean=] - Установка видимости(по умолчанию false).
     * @property {Function} remove - Удаление набора контролов.
    */
	var Controls = {
        id: 'controlsBaseIcons'
        ,isVisible: true
         ,controlsHash: {}
        //,isActive: false
        ,
        //items: [iconsControl, layersControl, copyrightControl, locationControl, zoomControl, drawingControl]
        items: [iconsControl, layersControl]
        ,
        init: function(parent) {        // инициализация
            //Управление ToolsAll
            (function()
            {
                //Управление ToolsAll
                /** Класс управления ToolsAll
                * @function
                * @memberOf api
                * @param {cont} HTML контейнер для tools
                */
                function ToolsAll(cont)
                {
                    this.toolsAllCont = gmxAPI._allToolsDIV;
                    gmxAPI._toolsContHash = {};
                }
                gmxAPI._ToolsAll = ToolsAll;

                function ToolsContainer(name, attr) {
                    //console.log('ToolsContainer', name, attr);
                    if(!attr) attr = {};
                    var cont = {
                        addTool: function (tn, attr) {
            //console.log('tool addTool', tn, attr); // wheat
                            if(!attr) attr = {};
                            var ret = null;
                            if(attr.overlay && gmxAPI._leaflet.gmxLayers) {
                                attr.id = tn;
                                if(!attr.rus) attr.rus = attr.hint || attr.id;
                                if(!attr.eng) attr.eng = attr.hint || attr.id;
                                
                                var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                                if(layersControl) ret = layersControl.addOverlay(tn, attr);
                            } else {
                                var controls = gmxAPI.map.controlsManager.getCurrent();
                                if(controls && 'addControl' in controls) {
                                    ret = controls.addControl(tn, attr);
                                }
                            }
                            return ret;
                        }
                    };
                    //gmxAPI._tools[name] = cont;
                    return cont;
                }
                gmxAPI._ToolsContainer = ToolsContainer;
            })();
            
            if('_ToolsAll' in gmxAPI) {
                this.toolsAll = new gmxAPI._ToolsAll(parent);
            }
            //map.toolsAll = 
            gmxAPI._tools = Controls.controlsHash;
            //gmxAPI._tools.standart = iconsControl;
            gmxAPI._tools.standart = this;

            // gmxAPI._listeners.addListener({level: 10000, eventName: 'mapInit', func: function(map) {
                 // Control.isActive = true;
            // }});

            this.forEach(function(item, i) {
                ('init' in item ? item.init : item)(parent);
            });
        }
        ,
        setVisible: function(flag) {
            if(!arguments.length) flag = !this.isVisible;
            this.forEach(function(item, i) {
                item.setVisible(flag);
            });
            copyrightAndLocationContainer.style.display = (flag ? 'block' : 'none');
            this.isVisible = flag;
        }
        ,remove: function() {      // удаление
            if(Controls.id != gmxAPI.map.controlsManager.getCurrentID()) return;
            this.forEach(function(item, i) {
                if('remove' in item) item.remove();
            });
//            if(iconsControl.hideNode.parentNode) iconsControl.hideNode.parentNode.removeChild(iconsControl.hideNode);
        }
        ,
        forEach: function(callback) {
			for (var i = 0, len = this.items.length; i < len; i++) {
				if(callback(this.items[i], i) === false) return;
            }
        }
        ,getControl: function(id) {
            var res = null;
            this.forEach(function(item, i) {
                if(id === item.id) {
                    res = ('getInterface' in item ? item.getInterface() : {});
                    return false;
                }
            });
            return res;
        }
        ,addControl: function(key, pt) {
            var id = key || pt.id;
            if(Controls.controlsHash[id]) return null; // такой контрол уже имеется
            var title = pt.title || pt.hint;
			var attr = {
                id: id
                ,rus: pt.rus || title
                ,eng: pt.eng || title
                ,style: gmxAPI.extend(pt.style, iconsControl.styleIcon, true)
                ,hoverStyle: pt.hoverStyle
            };
            var className = 'leaflet-control-' + id;

            if(pt.regularImageUrl) {
                attr.src = pt.regularImageUrl;
                attr.style = {
                    position: 'relative'
                    ,background: 'rgba(154, 154, 154, 0.7)'

                };
            }
            if(pt.activeImageUrl) {
                attr.srcHover = pt.activeImageUrl;
                attr.hoverStyle = {
                    position: 'relative'
                    ,background: 'rgba(154, 154, 154, 1)'
                };
            }
            if(pt.onClick) attr.onClick = pt.onClick;
            if(pt.onCancel) attr.onCancel = pt.onCancel;
            //if(pt.overlay) attr.onCancel = pt.onCancel;
            if(!attr.src) {     // Текстовый контрол
                className += ' leaflet-control-Text';
                if(pt.innerHTML) attr.innerHTML = pt.innerHTML;
                else {
                    attr.innerHTML = gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng)
                }
            } else {
                className += ' leaflet-control-';
                className += (pt.width === 'auto' ? 'userIcons' : 'icons');
            }

            // Добавление пользовательского контрола
            var userControl = L.control.gmxControl({
                title: gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng)
                ,isActive: false
                ,style: {}
                ,className: className
                ,src: attr.src || null
                ,srcHover: attr.srcHover || null
                ,onFinishID: null
                ,type: id
                ,onAdd: function() {
                    //gmxAPI.setStyleHTML(this._container, attr.style);
                    var my = this;
                    var container = this._container;
                    if(attr.innerHTML) {
                        container.innerHTML = attr.innerHTML;
                        L.DomUtil.addClass(container, 'leaflet-control-Text');
                    } else if(pt.regularImageUrl) {
                        this._Image = L.DomUtil.create('img', 'leaflet-control-Image');
                        container.appendChild(this._Image);
                        L.DomUtil.addClass(container, 'leaflet-control-userIcons');
                    }
                    L.DomEvent.on(container, 'mouseover', function (e) {
                        my.setActive(true, true);
                    });
                    L.DomEvent.on(container, 'mouseout', function (e) {
                        my.setActive(false, true);
                    });
                    this.setActive(false);
                }
                ,onclick: function(e) {
                    var container = this._container;
                    if(!this.options.isActive) {
                        if(attr.onClick) attr.onClick.call(this);
                        this.setActive(true);
                    } else {
                        if(attr.onCancel) attr.onCancel.call(this);
                        this.setActive(false);
                    }
                }
            });
            userControl.addTo(gmxAPI._leaflet.LMap);
            Controls.controlsHash[id] = userControl;
            return userControl;
        }
       ,
        setControls: function() {
            var outControls = {};
            var mbl = gmxAPI.map.baseLayersManager;
            var defaultStyle = {
                //backgroundImage: 'url("../../api/img/iconeControls.png")'
                cursor: 'pointer'
                ,width: '30px'
                ,height: '30px'
                ,clear: 'none'
            }

            // gmxControl - прототип контрола из одной кнопки
            L.Control.gmxControl = L.Control.extend({
                options: {
                    isVisible: true,
                    type: '',
                    onclick: null,
                    onAdd: null,
                    position: 'topleft'
                }
                ,
                addTo: function (map) {
                    this._map = map;

                    var container = this._container = this.onAdd(map),
                        pos = this.getPosition(),
                        corner = map._controlCorners[pos] || map._controlContainer;

                    L.DomUtil.addClass(container, 'leaflet-control');

                    if (pos.indexOf('bottom') !== -1) {
                        corner.insertBefore(container, corner.firstChild);
                    } else {
                        corner.appendChild(container);
                    }

                    return this;
                }
                ,
                _createDiv: function (container, className, title, fn, context) {
                    var link = L.DomUtil.create('div', className, container);
                    if(title) link.title = title;

                    var stop = L.DomEvent.stopPropagation;

                    L.DomEvent
                        .on(link, 'click', stop)
                        .on(link, 'mousedown', stop)
                        .on(link, 'dblclick', stop)
                        .on(link, 'click', L.DomEvent.preventDefault)
                        .on(link, 'click', fn || stop, context);

                    return link;
                }
                ,
                _initLayout: function () {
                    //var className = 'leaflet-control-icons leaflet-control-' + this.options.type,
                    var className = this.options.className || 'leaflet-control-icons leaflet-control-' + this.options.type;
                    //var fn = (this.options.onclick ? this.options.onclick : stop);
                    var container = this._container = this._createDiv(null, className, this.options.title, this.options.onclick, this);
                        //container = this._container = L.DomUtil.create('div', className);
/*
                    if(this.options.title) container.title = this.options.title;

                    var stop = L.DomEvent.stopPropagation;
                    L.DomEvent
                        .on(container, 'click', stop)
                        .on(container, 'mousedown', stop)
                        .on(container, 'dblclick', stop)
                        .on(container, 'click', L.DomEvent.preventDefault)
                        .on(container, 'click', fn, this);
*/
                    return container;
                }
                ,
                onAdd: function (map) {
                    var ret = this._initLayout();
                    //gmxAPI.setStyleHTML(this._container, this.options.style || defaultStyle);
                    if(this.options.onAdd) this.options.onAdd.call(this, ret);
                    return ret;
                }
                ,setActive: function(flag, notToggle) {
                    var container = this._container,
                        opt = this.options;
                    if(flag) {
                        if(!notToggle) opt.isActive = true;
                        if(opt.srcHover) this._Image.src = opt.srcHover;
                        L.DomUtil.addClass(container, 'leaflet-control-Active');
                    } else {
                        if(!notToggle) opt.isActive = false;
                        if(opt.src) this._Image.src = opt.src;
                        L.DomUtil.removeClass(container, 'leaflet-control-Active');
                    }
                }
            });
            L.control.gmxControl = function (options) {
              return new L.Control.gmxControl(options);
            }

            // gmxZoom - контрол Zoom
            L.Control.gmxZoom = L.Control.Zoom.extend({
                options: {
                    current: ''
                    ,collapsed: false
                    ,zoomslider: true
                    ,stepY: 7
                }
                ,_y_min: 9              // min Y слайдера
                ,isDragging: false      // min Y слайдера
                ,
                onAdd: function (map) {
                    var zoomName = 'gmx_zoomParent',
                        container = L.DomUtil.create('div', zoomName);

                    this._map = map;
                    this._zoomPlaque = L.DomUtil.create('div', 'gmx_zoomPlaque', container);

                    this._zoomInButton  = this._createDiv(container, 
                            'gmx_zoomPlus',  'Zoom in',  this._zoomIn,  this);
                    this._zoomOutButton = this._createDiv(container, 
                            'gmx_zoomMinus', 'Zoom out', this._zoomOut, this);

                    map.on('zoomend zoomlevelschange', this._updateDisabled, this);
                    if(this.options.zoomslider) {
                        this._chkZoomLevelsChange(container);
                    }

                    return container;
                }
                ,
                _createDiv: function (container, className, title, fn, context) {
                    var link = L.DomUtil.create('div', className, container);
                    if(title) link.title = title;

                    var stop = L.DomEvent.stopPropagation;

                    L.DomEvent
                        .on(link, 'click', stop)
                        .on(link, 'mousedown', stop)
                        .on(link, 'dblclick', stop)
                        .on(link, 'click', L.DomEvent.preventDefault)
                        .on(link, 'click', fn || stop, context);

                    return link;
                }
                ,
                onRemove: function (map) {
                    map.off('zoomend zoomlevelschange', this._updateDisabled, this);
                }
                ,
                _setPosition: function () {
                    var my = this,
                        y = my._y_max - (my._zoom - 1) * 7;

                    my._zoomVal.innerHTML = my._zoom;
                    L.DomUtil.setPosition(my._zoomPointer, L.point(4, y));
                }
                ,
                _getZoomByY: function (y) {
                    if(y < this._y_min) y = this._y_min;
                    else if(y > this._y_max) y = this._y_max;

                    return 1 + Math.floor((this._y_max - y) / this.options.stepY);
                }
                ,
                _setSliderSize: function (delta) {
                    var my = this,
                        map = my._map,
                        MinZoom = map.getMinZoom(),
                        MaxZoom = map.getMaxZoom(),
                        delta = MaxZoom - MinZoom;
                    var height = 7 * (delta + 1);
                    my._y_max = height + 3;
                    my._zoomSliderBG.style.height = height + 'px';
                    height += 66;
                    if(my._zoomSliderCont.style.display !== 'block') height = 60;
                    my._zoomPlaque.style.height = height + 'px';
                }
                ,
                _chkZoomLevelsChange: function (container) {
                    var my = this,
                        map = my._map,
                        MinZoom = map.getMinZoom(),
                        MaxZoom = map.getMaxZoom();

                    if(MinZoom !== my._MinZoom || MaxZoom !== my._MaxZoom) {
                        var delta = MaxZoom - MinZoom;
                        if(delta > 0) {
                            if(!my._zoomSliderCont) {
                                my._zoomSliderCont  = my._createDiv(container, 'gmx_sliderCont');
                                my._zoomSliderBG  = my._createDiv(my._zoomSliderCont, 'gmx_sliderBG');
                                L.DomEvent.on(my._zoomSliderBG, 'click', function (ev) {
                                    my._zoom = my._getZoomByY(ev.layerY);
                                    my._map.setZoom(my._zoom);
                                }, my);
                                my._zoomPointer  = my._createDiv(my._zoomSliderCont, 'gmx_zoomPointer');
                                my._zoomVal  = my._createDiv(my._zoomPointer, 'gmx_zoomVal');
                                L.DomEvent.on(container, 'mouseover', function (ev) {
                                    my._zoomSliderCont.style.display = 'block';
                                    my._setSliderSize(delta);
                                });
                                var mouseout = function () {
                                    my._zoomSliderCont.style.display = 'none';
                                    my._setSliderSize(delta);
                                };
                                L.DomEvent.on(container, 'mouseout', function (ev) {
                                    if(my._draggable._moving) return;
                                    mouseout();
                                });
                                var draggable = new L.Draggable(my._zoomPointer);
                                draggable.on('drag', function (ev) {
                                    var pos = ev.target._newPos;
                                    my._zoom = my._getZoomByY(pos.y);
                                    my._setPosition();
                                });
                                draggable.on('dragend', function (ev) {
                                    my._map.setZoom(my._zoom);
                                    mouseout();
                                });
                                draggable.enable();
                                my._draggable = draggable;
                            }
                            my._setSliderSize(delta);
                        }
                        my._MinZoom = MinZoom, my._MaxZoom = MaxZoom;
                    }
                    my._zoom = map._zoom;
                    my._setPosition();
                }
                ,
                _updateDisabled: function (ev) {
                    var map = this._map,
                        className = 'leaflet-disabled';

                    L.DomUtil.removeClass(this._zoomInButton, className);
                    L.DomUtil.removeClass(this._zoomOutButton, className);

                    if (map._zoom === map.getMinZoom()) {
                        L.DomUtil.addClass(this._zoomOutButton, className);
                    }
                    if (map._zoom === map.getMaxZoom()) {
                        L.DomUtil.addClass(this._zoomInButton, className);
                    }
                    this._zoom = map._zoom;
                    if(this.options.zoomslider) {
                        if(ev.type === 'zoomlevelschange') this._chkZoomLevelsChange(this.container);
                        this._setPosition();
                    }
                }
                
            });
            L.control.gmxZoom = function (options) {
              return new L.Control.gmxZoom(options);
            }
            var gmxZoom = L.control.gmxZoom({
            });
            gmxZoom.addTo(gmxAPI._leaflet.LMap);
            outControls.gmxZoom = gmxZoom;

            // gmxLayers - контрол слоев
            L.Control.gmxLayers = L.Control.Layers.extend({
                options: {
                    current: ''
                    ,collapsed: false
                }
                ,
                _onInputClick: function (ev) {
                    var layerId = this._chkInput(ev.target);
                    if(!this._layers[layerId].overlay) {
                        if(this.current != layerId) {
                            this.current = layerId;
                            ev.target.checked = true;
                        } else {
                            this.current = null;
                            ev.target.checked = false;
                        }
                        mbl.setCurrent((this.current ? this._layers[layerId].layer.id : ''));
                    }
                }
                ,
                _update: function () {
                    L.Control.Layers.prototype._update.call(this);
                    if(this.current) this.setCurrent(this.current, true);
                }
                ,
                setIndex: function (ph, index) {
                    var layerId = ph._leaflet_id;
                    var overlay = this._layers[layerId].overlay;
                    var cont = overlay ? this._baseLayersList : this._baseLayersList;
                    if(index < 0) index = 0;
                    
                    for(var i=0, len = cont.childNodes.length; i<len; i++) {
                        var node = cont.childNodes[i];
                        var control = node.control;
                        if(layerId == control.layerId) {
                            if(index >= len) {
                                cont.appendChild(node);
                            } else {
                                var before = cont.childNodes[index];
                                cont.removeChild(node);
                                cont.insertBefore(node, before);
                            }
                            break;
                        }
                    }
                }
                ,
                setVisibility: function (id, flag) {
                    var target = this._findTargetByID(id);
                    if(target) {
                        target.checked = (flag ? true : false);
                        var item = this._layers[target.layerId];
                        if(item && item.overlay && item.layer) {
                            item.layer.isActive = target.checked;
                            return true;
                        }
                    }
                    return false;
                }
                ,
                _findTargetByID: function (id) {  // Найти input поле подложки или оверлея
                    for(var i=0, len = this._form.length; i<len; i++) {
                        var target = this._form[i];
                        var item = this._layers[target.layerId];
                        if(item && item.layer && id == item.layer.id) return target;
                    }
                    return null;
                }
                ,
                setCurrent: function (id, skipChkInput) {
                    for(var i=0, len = this._form.length; i<len; i++) {
                        var input = this._form[i];
                        if(id == input.layerId) {
                            if(!skipChkInput) this._chkInput(input);
                            this.current = id;
                            input.checked = true;
                        }
                        var item = this._layers[input.layerId];
                        if(item.overlay && item.layer.isActive) input.checked = true;
                    }
                }
                ,
                _chkInput: function (target) {
                    //var layers = this._layers;
                    var layerId = String(target.layerId);
                    var isActive = target.checked;
                    var item = this._layers[layerId].layer;
                    var overlay = this._layers[layerId].overlay;
                    if(overlay) {
                        if(isActive) {
                            if(item.onClick) item.onClick();
                        } else {
                            if(item.onCancel) item.onCancel();
                        }
                        item.isActive = isActive;
                    }
                    return layerId;
                }
            });
            L.control.gmxLayers = function (baseLayers, groupedOverlays, options) {
              return new L.Control.gmxLayers(baseLayers, groupedOverlays, options);
            }
            var gmxLayers = L.control.gmxLayers({}, {}, {});
            gmxLayers.addTo(gmxAPI._leaflet.LMap);
            outControls.gmxLayers = gmxLayers;
            gmxAPI._leaflet.gmxLayers = gmxLayers;

            // HideControls - кнопка управления видимостью всех контролов
            L.Control.hideControls = L.Control.gmxControl.extend({
                _toggleVisible: function (e) {
                    L.DomEvent.stopPropagation(e);
                    var flag = !this.options.isVisible;
                    this.options.isVisible = flag;
                    for(var key in Controls.controlsHash) {
                        var item = Controls.controlsHash[key];
                        if(item != this) {
                            if('setVisible' in item) item.setVisible(false);
                            else if(item._container) item._container.style.display = flag ? 'block' : 'none';
                            else {
                                console.warn('hideControls', item);
                            }
                        }
                    }
                }
            });
            L.control.hideControls = function (options) {
              return new L.Control.hideControls(options);
            }

            var hideControls = L.control.hideControls({
                title: 'Показать/Скрыть'
                ,type: 'hide'
                ,onclick: function(e) {
                    this._toggleVisible(e);
                }
            });

            //var hideControls = L.control.hideControls({});
            hideControls.addTo(gmxAPI._leaflet.LMap);
            outControls.hideControls = hideControls;

            // BottomBG - подвал background
            L.Control.BottomBG = L.Control.gmxControl.extend({
                onAdd: function (map) {
                    var className = 'gmx_copyright_location',
                        container = L.DomUtil.create('div', className);

                    L.DomUtil.create('div', className + '_bg', container);
                    this._map = map;

                    return container;
                }
            });
            var bottomBG = new L.Control.BottomBG({
                className: 'gmx_copyright_location_bg'
                ,position: 'bottom'
            });
            bottomBG.addTo(gmxAPI._leaflet.LMap);
            outControls.bottomBG = bottomBG;

            // LocationControls - 
            L.Control.LocationControls = L.Control.gmxControl.extend({
                onAdd: function (map) {
                    var className = 'gmx_location',
                        container = L.DomUtil.create('div', className),
                        my = this;

                    this.locationTxt = L.DomUtil.create('span', 'gmx_locationTxt', container);
                    this.coordFormatChange = L.DomUtil.create('span', 'gmx_coordFormatChange', container);
                    this.scaleBar = L.DomUtil.create('span', 'gmx_scaleBar', container);
                    this.scaleBarTxt = L.DomUtil.create('span', 'gmx_scaleBarTxt', container);
                    this._map = map;

                    var util = {
                        checkPositionChanged: function(ev) {
//console.warn('checkPositionChanged', ev);
                            var attr = gmxAPI.getScaleBarDistance();
                            if (!attr || (attr.txt === my._scaleBarText && attr.width === my._scaleBarWidth)) return;
                            my._scaleBarText = attr.txt;
                            my._scaleBarWidth = attr.width;
                            util.repaintScaleBar();
                        }
                        ,
                        repaintScaleBar: function() {
                            if (my._scaleBarText) {
                                gmxAPI.size(my.scaleBar, my._scaleBarWidth, 4);
                                my.scaleBarTxt.innerHTML = my._scaleBarText;
                                gmxAPI._listeners.dispatchEvent('scaleBarRepainted', gmxAPI.map, container.clientWidth);
                            }
                        }
                        ,coordFormat: 0
                        ,
                        setCoordinatesFormat: function(num, screenGeometry) {
                            if(!num) num = this.coordFormat;
                            if(num < 0) num = this.coordFormatCallbacks.length - 1;
                            else if(num >= this.coordFormatCallbacks.length) num = 0;
                            this.coordFormat = num;
                            if(!screenGeometry) screenGeometry = gmxAPI.map.getScreenGeometry();
                            var attr = {screenGeometry: screenGeometry, properties: gmxAPI.map.properties };
                            var res = this.coordFormatCallbacks[num](my.locationTxt, attr);		// если есть res значит запомним ответ
                            if(res && my.prevCoordinates != res) my.locationTxt.innerHTML = res;
                            my.prevCoordinates = res;
                            gmxAPI._listeners.dispatchEvent('onSetCoordinatesFormat', gmxAPI.map, num);
                        }
                        ,
                        coordFormatCallbacks: [		// методы формирования форматов координат
                            function() { return util.getCoordinatesText(); },
                            function() { return util.getCoordinatesText(); },
                            function() { return util.getCoordinatesText(); }
                        ]
                        ,
                        getCoordinatesText: function(currPos) {
                            return gmxAPI.getCoordinatesText(currPos, this.coordFormat);
                        }
                        ,
                        showCoordinates: function() {        //окошко с координатами
                            if (this.coordFormat > 2) return; // только для стандартных форматов.
                            var oldText = this.getCoordinatesText();
                            var text = window.prompt(gmxAPI.KOSMOSNIMKI_LOCALIZED("Текущие координаты центра карты:", "Current center coordinates:"), oldText);
                            if (text && (text != oldText))
                                gmxAPI.map.moveToCoordinates(text);
                        }
                        ,
                        nextCoordinatesFormat: function() {
                            this.coordFormat += 1;
                            this.setCoordinatesFormat(this.coordFormat);
                        }
                    }
                    
                    L.DomEvent.on(this.coordFormatChange, 'click', function (ev) { util.nextCoordinatesFormat(); }, this);
                    L.DomEvent.on(this.locationTxt, 'click', function (ev) { util.showCoordinates(); }, this);
                    map.on('moveend', function (ev) {
                        util.checkPositionChanged(ev);
                    }, this);
                    map.on('move', function (ev) {
                        util.setCoordinatesFormat(util.coordFormat);
                    }, this);
                    
                    gmxAPI.map.coordinates = {
                        setVisible: function(flag) 
                        { 
                            //gmxAPI.setVisible(locationControl.locationTxt, flag); 
                            //gmxAPI.setVisible(locationControl.changeCoords, flag); 
                        }
                        ,
                        addCoordinatesFormat: function(func) 
                        { 
                            util.coordFormatCallbacks.push(func);
                            return util.coordFormatCallbacks.length - 1;
                        }
                        ,
                        removeCoordinatesFormat: function(num) 
                        { 
                            util.coordFormatCallbacks.splice(num, 1);
                            return util.coordFormatCallbacks.length - 1;
                        }
                        ,
                        setFormat: util.setCoordinatesFormat
                    }
                    
                    return container;
                }
            });
            var locationControl = new L.Control.LocationControls({
                position: 'bottomright'
            });
            locationControl.addTo(gmxAPI._leaflet.LMap);
            outControls.locationControl = locationControl;

            // CopyrightControls - Copyright
/*
        
                map.addCopyrightedObject = function(obj) { copyrightControl.addItem(obj); }
                map.removeCopyrightedObject = function(obj) { copyrightControl.removeItem(obj); }
                map.setCopyrightVisibility = function(obj) { copyrightControl.setVisible(obj); } 
                map.updateCopyright = function() { copyrightControl.redraw(); } 
                // Изменить позицию контейнера копирайтов
                map.setCopyrightAlign = function(attr) {
                    if(attr.align) copyrightControl.copyrightAlign = attr.align;
                    copyrightControl.setPosition();
                }
                
                copyrightControl.scaleBarRepaintedID = map.addListener('scaleBarRepainted', function(width) {
                    copyrightControl.chkWidth(width);
                });
                copyrightControl.onSetCoordinatesFormatID = map.addListener('onSetCoordinatesFormat', function() {
                    copyrightControl.chkWidth();
                });
                
                copyrightControl.onChangeBackgroundColorID = map.addListener('onChangeBackgroundColor', function(htmlColor) {
                    copyrightControl.redraw();
                });


                copyrightControl.onMoveEndID = map.addListener(evName, function() {
                    if (updateListenerID) return;
                    updateListenerID = setTimeout(function()
                    {
                        copyrightControl.redraw();
                        clearTimeout(updateListenerID);
                        updateListenerID = null;
                        copyrightControl.chkWidth();
                    }, 250);
                });
        
*/            
            L.Control.CopyrightControls = L.Control.gmxControl.extend({
                onAdd: function (map) {
                    var className = 'gmx_copyright_location',
                        container = L.DomUtil.create('span', className);

                    //L.DomUtil.create('div', className + '_bg', container);
                    this._map = map;
                    var my = this;
                    var util = {
                        items: []
                        ,addItem: function(obj) {
                            this.items.forEach(function(item, i) {
                                if(obj === item) {
                                    return false;   // Уже есть такой
                                }
                            });
                            this.items.push(obj);
                            this.redraw();
                        }
                        ,
                        removeItem: function(obj) {
                            this.items.forEach(function(item, i) {
                                if(obj === item) {
                                    util.items.splice(i, 1);
                                    util.redraw();
                                    return false;
                                }
                            });
                        }
                        ,
                        redraw: function() {            // перерисовать
                            var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
                            if(!currPos.latlng) return;
                            var x = currPos.latlng.x;
                            var y = currPos.latlng.y;
                            var texts = [
                                //первым всегда будет располагаться копирайт СканЭкс. 
                                "<a target='_blank' style='color: inherit;' href='http://maps.kosmosnimki.ru/Apikey/License.html'>&copy; 2007-2013 " + gmxAPI.KOSMOSNIMKI_LOCALIZED("&laquo;СканЭкс&raquo;", "RDC ScanEx") + "</a>"
                            ];
                            this.items.forEach(function(item, i) {
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
                                container.innerHTML = text;
                                gmxAPI._listeners.dispatchEvent('copyrightRepainted', gmxAPI.map, text);
                            }
                            //if(copyrightControl.copyrightAlign) copyrightControl.setPosition();
                        }
                    };

                    gmxAPI.extend(gmxAPI.map, {
                        addCopyrightedObject: function(obj) {
                            util.addItem(obj);
                        }
                        ,removeCopyrightedObject: function(obj) {
                            util.removeItem(obj);
                        }
                        ,setCopyrightVisibility: function(obj) {
                            //copyrightControl.setVisible(obj);
                        } 
                        ,updateCopyright: function() {
                            //copyrightControl.redraw();
                        } 
                        ,setCopyrightAlign: function(attr) {    // Изменить позицию контейнера копирайтов
                            //if(attr.align) copyrightControl.copyrightAlign = attr.align;
                            //copyrightControl.setPosition();
                        }
                    });

                    return container;
                }
                ,
                chkWidth: function(locationWidth) {
/*
                    if(!copyrightControl.node.parentNode) return;
                    if(!locationWidth) locationWidth = (locationControl && locationControl.node ? locationControl.node.clientWidth : 0);
                    var width = copyrightControl.node.parentNode.clientWidth - 30 - locationWidth;
                    copyrightControl.node.style.width = (width > 0 ? width : 0) + 'px';
*/
                }
            });
// locationControl
            var copyrightControls = new L.Control.CopyrightControls({
                position: 'bottomleft'
            });
            copyrightControls.addTo(gmxAPI._leaflet.LMap);
            outControls.copyrightControls = copyrightControls;

            if(window.mapHelper) {
                // PrintControl - кнопка печати
                var printControl = L.control.gmxControl({
                    title: 'Печать'
                    ,type: 'print'
                    ,onclick: function(e) {
                        window.mapHelper.prototype.print();
                    }
                });
                printControl.addTo(gmxAPI._leaflet.LMap);
                outControls.printControl = printControl;

                // PermalinkControl - кнопка печати
                var permalinkControl = L.control.gmxControl({
                    title: 'Пермалинк'
                    ,type: 'permalink'
                    ,onclick: function(e) {
                        window.mapHelper.prototype.showPermalink();
                    }
                });
                permalinkControl.addTo(gmxAPI._leaflet.LMap);
                outControls.permalinkControl = permalinkControl;
            }

            // DrawingZoomControl - кнопка печати
            var drawingZoomControl = L.control.gmxControl({
                title: gmxAPI.KOSMOSNIMKI_LOCALIZED("Увеличение", "Zoom")
                ,isActive: false
                ,type: 'drawingZoom'
                ,onclick: function(e) {
                    var className = 'leaflet-control-icons leaflet-control-' + this.options.type + '-Active';
                    if(!gmxAPI._drawing.BoxZoom) {
                        gmxAPI._drawFunctions.zoom();
                        L.DomUtil.addClass(this._container, className);
                    } else {
                        gmxAPI._drawing.activeState = false;
                        gmxAPI._drawing.BoxZoom = false;
                        L.DomUtil.removeClass(this._container, className);
                    }
                }
                ,onAdd: function(cont) {
                    var my = this;
                    this._map.on('boxzoomend', function() {
                        L.DomUtil.removeClass(my._container, 'leaflet-control-' + my.options.type + '-Active');
                    });
                }

            });
            drawingZoomControl.addTo(gmxAPI._leaflet.LMap);
            outControls.drawingZoomControl = drawingZoomControl;

            // DrawingPointControl - кнопка печати
            var drawingPointControl = L.control.gmxControl({
                title: gmxAPI.KOSMOSNIMKI_LOCALIZED("Маркер", "Marker")
                ,isActive: false
                ,onFinishID: null
                ,type: 'drawingPoint'
                ,onclick: function(e) {
                    var my = this;
                    var className = 'leaflet-control-icons leaflet-control-' + this.options.type + '-Active';
                    var stop = function() {
                        L.DomUtil.removeClass(my._container, className);
                        my.options.isActive = false;
                        if(my.options.onFinishID) gmxAPI.map.drawing.removeListener('onFinish', my.options.onFinishID);
                        my.options.onFinishID = null;
                    };
                    if(!this.options.onFinishID) {
                        this.options.onFinishID = gmxAPI.map.drawing.addListener('onFinish', stop);
                    }
                    if(!this.options.isActive) {
                        gmxAPI._drawFunctions.POINT();
                        L.DomUtil.addClass(this._container, className);
                        this.options.isActive = true;
                    } else {
                        gmxAPI._drawing.endDrawing();
                        stop();
                    }
                }
            });
            drawingPointControl.addTo(gmxAPI._leaflet.LMap);
            outControls.drawingPointControl = drawingPointControl;

            L.Control.Drawing = L.Control.extend({
                options: {
                    position: 'topleft'
                },

                _createButton: function (item, container, fn, context) {
                    var className = 'leaflet-control-Drawing-' + item.key;
                    var link = L.DomUtil.create('div', className, container);
                    link.title = item.hint;

                    var stop = L.DomEvent.stopPropagation;

                    L.DomEvent
                        .on(link, 'click', stop)
                        .on(link, 'mousedown', stop)
                        .on(link, 'dblclick', stop)
                        .on(link, 'click', L.DomEvent.preventDefault)
                        .on(link, 'click', fn, context);

                    return link;
                },

                onAdd: function (map) {
                    var zoomName = 'leaflet-control-Drawing',
                        container = L.DomUtil.create('div', 'leaflet-control-Drawing');

                    L.DomEvent.on(container, 'mouseover', function (e) {
                        container.style.height = '90px';
                    });
                    L.DomEvent.on(container, 'mouseout', function (e) {
                        container.style.height = '30px';
                    });

                    this._map = map;
                    var arr = [
                    {
                        key: "LINESTRING",
                        style: {
                            backgroundPosition: '-393px -33px'
                        }
                        ,
                        hoverStyle: {
                            backgroundPosition: '-393px -2px'
                        }
                        ,onClick: gmxAPI._drawFunctions.LINESTRING
                        ,onCancel: gmxAPI._drawing.endDrawing
                        ,hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Линия", "Line")
                    }
                    ,
                    {
                        key: "POLYGON",
                        style: {
                            backgroundPosition: '-503px -33px'
                        }
                        ,
                        hoverStyle: {
                            backgroundPosition: '-503px -2px'
                        }
                        ,onClick: gmxAPI._drawFunctions.POLYGON
                        ,onCancel: gmxAPI._drawing.endDrawing
                        ,hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Полигон", "Polygon")
                    }
                    ,
                    {
                        key: "FRAME",
                        style: {
                            backgroundPosition: '-269px -33px'
                        }
                        ,
                        hoverStyle: {
                            backgroundPosition: '-269px -2px'
                        }
                        ,onClick: gmxAPI._drawFunctions.FRAME
                        ,onCancel: gmxAPI._drawing.endDrawing
                        ,hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Рамка", "Rectangle")
                    }
                    ];
                    var my = this;
                    var items = {};
                    arr.forEach(function(item) {
                        var key = item.key;
                        var fn = function() {
                            var target = items[key];
                            var className = 'leaflet-control-Drawing-' + key + '-Active';
                            var stop = function() {
                                L.DomUtil.removeClass(target, className);
                                my.options.isActive = false;
                                if(my.options.onFinishID) gmxAPI.map.drawing.removeListener('onFinish', my.options.onFinishID);
                                my.options.onFinishID = null;
                            };
                            if(!my.options.onFinishID) {
                                my.options.onFinishID = gmxAPI.map.drawing.addListener('onFinish', stop);
                            }
                            if(!my.options.isActive) {
                                gmxAPI._drawFunctions[key]();
                                if(target != target.parentNode.firstChild) {
                                    target.parentNode.insertBefore(target, target.parentNode.firstChild);
                                }
                                L.DomUtil.addClass(target, className);
                                my.options.isActive = true;
                            } else {
                                gmxAPI._drawing.endDrawing();
                                stop();
                            }
                        }
                        items[key]  = my._createButton(item,  container, fn, my);
                    });
                    this.options.items = items;
                    return container;
                },

                onRemove: function (map) {
console.log('onRemove ', this);
                    //map.off('zoomend zoomlevelschange', this._updateDisabled, this);
                }
            });
            L.control.gmxDrawing = function (options) {
              return new L.Control.Drawing(options);
            }
			// if(!gmxAPI.isMobile) {
            var gmxDrawing = L.control.gmxDrawing({});
            gmxDrawing.addTo(gmxAPI._leaflet.LMap);
            outControls.gmxDrawing = gmxDrawing;

			gmxAPI.extend(Controls.controlsHash, outControls);
            return outControls;
        }
        // остальное для обратной совместимости
        ,
        selectTool: function (id) {
            var control = this.controlsHash[id];
//            if(control && control._map && 'removeFrom' in control) control.removeFrom(control._map);
        }
        ,
        removeTool: function (id) {
            var control = this.controlsHash[id];
            if(control && control._map && 'removeFrom' in control) control.removeFrom(control._map);
            delete this.controlsHash[id];
            return control;
        }
        ,
        addTool: function (tn, attr) {
//console.log('tool addTool', tn, attr); // wheat
            if(!attr) attr = {};
            var ret = null;
            if(attr.overlay && gmxAPI._leaflet.gmxLayers) {
                attr.id = tn;
                if(!attr.rus) attr.rus = attr.hint || attr.id;
                if(!attr.eng) attr.eng = attr.hint || attr.id;
                
                var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                if(layersControl) ret = layersControl.addOverlay(tn, attr);
            } else {
                var controls = gmxAPI.map.controlsManager.getCurrent();
                if(controls && 'addControl' in controls) {
                    ret = controls.addControl(tn, attr);
                }
            }
            return ret;
        }
        ,getToolByName: function(id) {
            return this.controlsHash[id] || null;
        }
	}
    if(!gmxAPI._controls) gmxAPI._controls = [];
    gmxAPI._controls.push(Controls);


    
})();
