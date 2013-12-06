// Стандартные контролы
(function()
{
    "use strict";
    var icons = {
        backgroundImage: "url('../../api/img/iconeControls.png')"
        ,backgroundImageBand: "url('../../api/img/band.png')"
    }

    // Сообщение о Deffered методе
    var deffered = function() {
        console.log('Deffered function: ', this);
    }

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
            if(!layersControl.node) layersControl.node = layersControl.createNode(cont);
            if(!layersControl.node.parentNode) layersControl.setVisible(true);
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
			if(!flag) {
                if(layersControl.node.parentNode) layersControl.parentNode.removeChild(layersControl.node);
			} else {
                if(!layersControl.node.parentNode) layersControl.parentNode.appendChild(layersControl.node);
            }
        }
        ,
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
        }
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
                        var item = layersControl.baseLayersHash[bl.id];
                        if(item) item.select();
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
        ,overlaysLayersHash: null
        ,
        onIndexChange: function(ph) {
            var id = ph.id;
            var index = ph.getIndex();
            var cont = layersControl.baseLayersHash[id].cont;
            var arr = layersControl.baseNode.childNodes;
            if(index >= arr.length) {
                layersControl.baseNode.appendChild(cont);
                return;
            }
            if(index < 0) index = 0;
            layersControl.baseNode.removeChild(cont);
            var before = layersControl.baseNode.childNodes[index];
            layersControl.baseNode.insertBefore(cont, before);
        }
        ,
        onVisibleChange: function(ph) {
            var id = ph.id;
            layersControl.baseLayersHash[id].cont.style.display = (ph.isVisible ? 'block' : 'none');
        }
        ,
        removeOverlay: function (id) {
            if(!layersControl.overlaysLayersHash) return null;
            var overlay = layersControl.overlaysLayersHash[id];
            if (!overlay) return null;
            overlay.cont.parentNode.removeChild(overlay.cont);
            delete layersControl.overlaysLayersHash[id];
            if(layersControl.overlaysNode.childNodes.length < 1) {
                layersControl.overlaysNodeSeparator.style.display = 
                    layersControl.overlaysNode.style.display = 'none';
                layersControl.overlaysLayersHash = null;
            }
            return overlay;
        }
        ,
        addOverlay: function (ph) {
            if(!layersControl.overlaysLayersHash) {
                layersControl.overlaysLayersHash = {};
                layersControl.overlaysNodeSeparator.style.display = 
                    layersControl.overlaysNode.style.display = 'block';
            }
            var id = ph.id;
            var layer = ph.layer;
            var attr = {
                hint: gmxAPI.KOSMOSNIMKI_LOCALIZED(ph.rus, ph.eng) || id
                ,overlay: true
            };
            if(ph.onClick) attr.onClick = ph.onClick;
            if(ph.onCancel) attr.onCancel = ph.onCancel;
            if(layer) {
                attr.layer = layer;
                if(!attr.onClick) attr.onClick = function() { layer.setVisible(true); };
                if(!attr.onCancel) attr.onCancel = function() { layer.setVisible(false); };
            }
            if(ph.rus) layersControl.aliasNames[ph.rus] = id;
            if(ph.eng) layersControl.aliasNames[ph.eng] = id;

            if (layersControl.overlaysLayersHash[id]) return false;
            else {
                var item = gmxAPI.newElement("label",
                    {
                        className: "gmx_layersControlOverlayLabel"
                    },
                    {
                        display: 'block'
                    }
                );
                var checkbox = gmxAPI.newElement("input",
                    {
                        className: "gmx_layersControlOverlayRadio"
                        ,value: id
                        ,type: "checkbox"
                        ,name: id
                        ,onchange: function (ev) {
                            var currentItem = layersControl.overlaysLayersHash[this.value];
                            if(!currentItem) return;
                            if(this.checked) {
                                if('onClick' in currentItem.attr) currentItem.attr.onClick();
                            } else {
                                if('onCancel' in currentItem.attr) currentItem.attr.onCancel();
                            }
                        }
                    },
                    {
                        position: 'relative'
                        ,margin: '2px'
                        //,top: '1px'
                    }
                );
                item.appendChild(checkbox);
                var span = gmxAPI.newElement("span",
                    {
                        className: "gmx_layersControlOverlaySpan"
                        ,innerHTML: attr.hint || tn
                    },
                    {
                        position: 'relative'
                        ,top: '-2px'
                    }
                );
                item.appendChild(span);
                layersControl.overlaysNode.appendChild(item);
                layersControl.overlaysLayersHash[id] = {
                    id: id
                    ,cont: item
                    ,checkbox: checkbox
                    ,span: span
                    ,attr: attr
                    ,select: function() {
                        checkbox.checked = true;
                    }
                };
                //layersControl.aliasNames[tn] = id;
            }
            //node.appendChild(layersControl.overlaysNodeSeparator);
            //layersControl.overlaysNode = gmxAPI.newElement(
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
            var id = ph.id;
            if(!ph.isVisible) {
                layersControl.removeBaseLayerTool(id);
                return;
            }
            var attr = {
                onClick: function() { gmxAPI.map.setBaseLayer(id); },
                onCancel: function() { gmxAPI.map.unSetBaseLayer(); },
                hint: gmxAPI.KOSMOSNIMKI_LOCALIZED(ph.rus, ph.eng) || id
            };
            if(ph.rus) layersControl.aliasNames[ph.rus] = id;
            if(ph.eng) layersControl.aliasNames[ph.eng] = id;

            var index = ph.getIndex();
            if (!layersControl.baseLayersHash[id]) {
                var item = gmxAPI.newElement("label",
                    {
                        className: "gmx_layersControlBaseLabel"
                    },
                    {
                        display: 'block'
                    }
                );
                var radio = gmxAPI.newElement("input",
                    {
                        className: "gmx_layersControlBaseRadio"
                        ,value: id
                        ,type: "radio"
                        ,name: "currentBaseLayer"
                        ,onchange: null
                        ,onclick: function (ev) {
                            gmxAPI.map.setMode
                            var currentItem = layersControl.baseLayersHash[layersControl.currentBaseID];
                            if(currentItem) {
                                if('onCancel' in currentItem.attr) currentItem.attr.onCancel();
                                currentItem.radio.checked = false;
                            }
                            layersControl.currentBaseID = null;
                            
                            if(this.checked) {
                                layersControl.currentBaseID = this.value;
                                currentItem = layersControl.baseLayersHash[layersControl.currentBaseID];
                                if('onClick' in currentItem.attr) currentItem.attr.onClick();
                            }
                            gmxAPI.map.setMode(layersControl.currentBaseID);
                        }
                    },
                    {
                        position: 'relative'
                        ,margin: '2px'
                    }
                );
                item.appendChild(radio);
                var span = gmxAPI.newElement("span",
                    {
                        className: "gmx_layersControlBaseSpan"
                        ,innerHTML: attr.hint
                    },
                    {
                        position: 'relative'
                        ,top: '-2px'
                    }
                );
                item.appendChild(span);
                layersControl.baseNode.appendChild(item);
                layersControl.baseLayersHash[id] = {
                    id: id
                    ,cont: item
                    ,radio: radio
                    ,span: span
                    ,attr: attr
                    ,select: function() {
                        radio.checked = true;
                        layersControl.currentBaseID = radio.value;
                    }
                };
            }
            var before = layersControl.baseNode.childNodes[index];
            var cont = layersControl.baseLayersHash[id].cont;
            layersControl.baseNode.insertBefore(cont, before);
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
        ,updateVisibility: deffered
        ,repaint: deffered
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
        ,hideNode: null
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
                    ,left: '45px'
                }
            );
            iconsControl.hideNode = iconsControl.addItemNode({
                type: 'hideItem'
                ,
                attr: {
                    title: 'Показать/Скрыть'
                }
                ,
                events: {
                    onclick: function(e) {
                        if(this._gmxItem.isActive) {
                            gmxAPI.extend(this._gmxItem.style, {backgroundPosition: '-565px -33px'});
                            gmxAPI.extend(this._gmxItem.hoverStyle, {backgroundPosition: '-565px -2px'});
                        } else {
                            gmxAPI.extend(this._gmxItem.style, {backgroundPosition: '-596px -33px'});
                            gmxAPI.extend(this._gmxItem.hoverStyle, {backgroundPosition: '-596px -2px'});
                        }
                        gmxAPI.map.controlsManager.toggleVisible();
                        setDOMStyle(this, this._gmxItem.hoverStyle);
                    }
                }
                ,
                style: gmxAPI.extend({
                        position: "absolute"
                        ,top: '10px'
                        ,left: '5px'
                        ,backgroundPosition: '-596px -33px'
                    }, iconsControl.styleIcon)
                ,
                hoverStyle: {
                    backgroundPosition: '-596px -2px'
                }
            });
            cont.appendChild(iconsControl.hideNode);
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
            if(window.mapHelper) {
                iconsControl.itemsNode.appendChild(iconsControl.addItemNode({
                    id: 'print'
                    ,
                    attr: {
                        title: 'Печать'
                    }
                    ,notSticky: 1
                    ,
                    events: {
                        onclick: function(e) {
                            window.mapHelper.prototype.print();
                        }
                    }
                    ,
                    style: gmxAPI.extend({
                            backgroundPosition: '-52px -33px'
                        }, iconsControl.styleIcon)
                    ,
                    hoverStyle: {
                        backgroundPosition: '-52px -2px'
                    }
                }));
                iconsControl.itemsNode.appendChild(iconsControl.addItemNode({
                    id: 'PermaLink'
                    ,
                    attr: {
                        title: 'Пермалинк'
                    }
                    ,notSticky: 1
                    ,
                    events: {
                        onclick: function(e) {
                            window.mapHelper.prototype.showPermalink();
                        }
                    }
                    ,
                    style: gmxAPI.extend({
                            backgroundPosition: '-534px -33px'
                        }, iconsControl.styleIcon)
                    ,
                    hoverStyle: {
                        backgroundPosition: '-534px -2px'
                    }
                }));
            }
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
        ,hideNode: null
        ,items: []
        ,
        init: function(cont) {        // инициализация
            // Установка drawing контролов
            //gmxAPI._listeners.addListener({level: -10, eventName: 'mapInit', func: function(map) {
                var arr = [
                    {
                        key: "zoom",
                        style: {
                            backgroundPosition: '-362px -33px'
                        }
                        ,
                        hoverStyle: {
                            backgroundPosition: '-362px -2px'
                        }
                        ,activeStyle: {}
                        ,regularStyle: {}
                        ,onClick: gmxAPI._drawFunctions.zoom
                        ,onCancel: function() {
                            gmxAPI._drawing.activeState = false;
                            gmxAPI._drawing.BoxZoom = false;
                            return null;
                        }
                        ,hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Увеличение", "Zoom")
                    }
                    ,
                    {
                        key: "POINT",
                        style: {
                            backgroundPosition: '-238px -33px'
                        }
                        ,
                        hoverStyle: {
                            backgroundPosition: '-238px -2px'
                        }
                        ,onClick: gmxAPI._drawFunctions.POINT
                        ,onCancel: gmxAPI._drawing.endDrawing
                        ,hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Маркер", "Marker")
                    }
                    ,
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
                gmxAPI._drawing.control = gmxAPI.map.controlsManager.addGroupTool({
                    id: 'drawing'
                    ,items: arr
                });
                gmxAPI.map.standartTools = gmxAPI._drawing.control;     // для обратной совместимости
                
                gmxAPI._drawing.control.setCurrent();
            //}});
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
        //,isActive: false
        ,
        items: [iconsControl, layersControl, copyrightControl, locationControl, zoomControl, drawingControl]
        ,
        init: function(parent) {        // инициализация
            gmxAPI._tools = {};
            gmxAPI._tools.standart = iconsControl;
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
            if(Controls.id != gmxAPI.map.controlsManager.getCurrent()) return;
            this.forEach(function(item, i) {
                if('remove' in item) item.remove();
            });
            if(iconsControl.hideNode.parentNode) iconsControl.hideNode.parentNode.removeChild(iconsControl.hideNode);
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
	}
    if(!gmxAPI._controls) gmxAPI._controls = [];
    gmxAPI._controls.push(Controls);
})();
