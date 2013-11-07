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
                    backgroundImage: 'url("img/iconeControls.png")',
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
                    backgroundImage: 'url("img/iconeControls.png")',
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
                    ,onclick: function(e) { zoomControl.setRulersPos(e.layerY - zoomControl.rulerHeight); }
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
                    backgroundImage: 'url("img/iconeControls.png")',
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
                    backgroundImage: 'url("img/iconeControls.png")',
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
                    backgroundImage: 'url("img/band.png")',
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
            var minZ = gmxAPI.map.zoomControl.getMinZoom();
            var maxZ = gmxAPI.map.zoomControl.getMaxZoom();
            zoomControl.rHeight = zoomControl.rulerHeight * (maxZ - minZ + 1);
            zoomControl.Ruler.style.height = zoomControl.rHeight + 'px';
            zoomControl.RulersBG.style.height = (zoomControl.rHeight + 13) + 'px';
        }
        ,
        'getRulersZoom': function(y) {
            var minZ = gmxAPI.map.zoomControl.getMinZoom();
            var maxZ = gmxAPI.map.zoomControl.getMaxZoom();
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
            var minZ = gmxAPI.map.zoomControl.getMinZoom();
            var maxZ = gmxAPI.map.zoomControl.getMaxZoom();
            var currZoom = zoomControl.currZoom = z;
            if(currZoom < minZ) currZoom = minZ;
            else if(currZoom > maxZ) currZoom = maxZ;
            var py = Math.floor((currZoom - minZ) * zoomControl.rulerHeight) + 13;
            zoomControl.pointerCurrent.style.bottom = py + 'px';
            zoomControl.zoomVal.innerHTML = currZoom;
        }
        ,
        repaint: function()
        {
/*
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
*/
        }
        ,onChangeBackgroundColorID: null
        ,onMoveEndID: null
        ,'mapZoomControl': {
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
                if(!this.isMinimized) zoomControl.repaint();
            },
            setMinMaxZoom: function(z1, z2)
            {
                zoomControl.minZoom = z1;
                zoomControl.maxZoom = z2;
                zoomControl.setRulerSize();
                //this.repaint();
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
            if(!copyrightAndLocationContainer.parentNode) cont.parentNode.appendChild(copyrightAndLocationContainer);
            copyrightControl.parentNode = copyrightAndLocationContainer;
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
                    color: 'black',
                    fontSize: "9pt",
                    fontFamily: "Tahoma",
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
                    //copyrightControl.setColor(htmlColor);
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
        ,node: null
        ,locationTitleDiv: null
        ,scaleBar: null
        ,currentText: ''
        ,coordFormat: 0
        ,prevCoordinates: ''
        ,
        init: function(cont) {        // инициализация
            if(!copyrightAndLocationContainer.parentNode) cont.parentNode.appendChild(copyrightAndLocationContainer);
            locationControl.parentNode = copyrightAndLocationContainer;
            if(!locationControl.node) locationControl.node = locationControl.createNode(locationControl.parentNode);
            if(!locationControl.node.parentNode) locationControl.setVisible(true);
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
            var node = gmxAPI.newElement(
                "div",
                {
                    className: "gmx_locationControl"
                },
                {
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
        setVisible: function(flag) {        // инициализация
			if(!flag) {
                if(locationControl.node.parentNode) locationControl.parentNode.removeChild(locationControl.node);
			} else {
                if(!locationControl.node.parentNode) locationControl.parentNode.appendChild(locationControl.node);
            }
        }
        ,
        'setColor': function(color, flag) {
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
				gmxAPI.size(locationControl.scaleBar, locationControl.scaleBarWidth, 4);
				locationControl.scaleBarTxt.innerHTML = locationControl.scaleBarText;
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
				return '' + Math.round(gmxAPI.merc_x(x)) + ', ' + Math.round(gmxAPI.merc_y(y));
		}
        ,
        'clearCoordinates': function() {
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
        setActive: function(flag) {            // Добавление прослушивателей событий
            if(flag) {
                gmxAPI.map.scaleBar = { setVisible: function(flag) { gmxAPI.setVisible(locationControl.scaleBar, flag); } };
                
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
    }

    //Контролы слоев (аля Leaflet)
	var layersControl = {
        parentNode: null
        ,node: null
        ,
        init: function(cont) {        // инициализация
            layersControl.parentNode = cont;
            if(!layersControl.node) layersControl.node = layersControl.createNode(cont);
            if(!layersControl.node.parentNode) layersControl.setVisible(true);
            layersControl.setActive(true);
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
                    ,right: '5px'
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
        ,mapInitListenerID: null
        ,listeners: {}
        ,map: null
        ,
        setActive: function(flag) {            // Добавление прослушивателей событий
            if(flag) {
                gmxAPI._listeners.addListener({'level': 9999, 'eventName': 'mapInit', 'func': function(map) {
                    layersControl.map = map;
//console.log('mapInit ', gmxAPI.BaseLayersManager.getItems());

                    var key = 'onAddBaseLayer';
                    layersControl.listeners[key] = layersControl.map.addListener(key, function(ph) {
//console.log('onAddBaseLayer------ ', name, gmxAPI.BaseLayersManager.getItems());
                        layersControl.addBaseLayerTool(ph['id'], ph['attr']);

                        //tool.select();
                    });

                    key = 'baseLayerSelected';
                    layersControl.listeners[key] = layersControl.map.addListener(key, function(name) {
//console.log('setActive------ ', name, gmxAPI.BaseLayersManager.getItems());
                        var tool = layersControl.getTool(name);
                        tool.select();
                    });
                }});
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
        'addTool': function (tn, attr) {
//console.log('addTool ', tn, gmxAPI.BaseLayersManager.getItems());
            if(!layersControl.overlaysLayersHash) {
                layersControl.overlaysLayersHash = {};
                layersControl.overlaysNodeSeparator.style.display = 
                    layersControl.overlaysNode.style.display = 'block';
            }
            if(!attr) return false;
            var id = attr['alias'] || tn;
            if (layersControl.overlaysLayersHash[id]) return false;
            else {
                var item = gmxAPI.newElement(
                    "label",
                    {
                        className: "gmx_layersControlOverlayLabel"
                    },
                    {
                        display: 'block'
                    }
                );
                var checkbox = gmxAPI.newElement(
                    "input",
                    {
                        className: "gmx_layersControlOverlayRadio"
                        ,value: id
                        ,type: "checkbox"
                        ,name: id
                        ,onchange: function (ev) {
                            var currentItem = layersControl.overlaysLayersHash[this.value];
                            if(!currentItem) return;
                            if(this.checked) {
                                if('onClick' in currentItem['attr']) currentItem['attr']['onClick']();
                            } else {
                                if('onCancel' in currentItem['attr']) currentItem['attr']['onCancel']();
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
                var span = gmxAPI.newElement(
                    "span",
                    {
                        className: "gmx_layersControlOverlaySpan"
                        ,innerHTML: attr['hint'] || tn
                    },
                    {
                        position: 'relative'
                        ,top: '-2px'
                    }
                );
                item.appendChild(span);
                layersControl.overlaysNode.appendChild(item);
                layersControl.overlaysLayersHash[id] = {
                    'id': id
                    ,'cont': item
                    ,'checkbox': checkbox
                    ,'span': span
                    ,'attr': attr
                    ,'select': function() {
                        checkbox.checked = true;
                    }
                };
                //layersControl.aliasNames[tn] = id;
            }
            //node.appendChild(layersControl.overlaysNodeSeparator);
            //layersControl.overlaysNode = gmxAPI.newElement(
        }
        ,
        'addBaseLayerTool': function (tn, attr) {
            if(!attr) attr = {
                    'onClick': function() { gmxAPI.map.setBaseLayer(tn); },
                    'onCancel': function() { gmxAPI.map.unSetBaseLayer(); },
                    'hint': tn
                };
            var id = attr['alias'] || tn;

//console.log('chkBaseLayerTool', id, tn, attr);
            if (layersControl.baseLayersHash[id]) return false;
            else {
                var item = gmxAPI.newElement(
                    "label",
                    {
                        className: "gmx_layersControlBaseLabel"
                    },
                    {
                        display: 'block'
                    }
                );
                var radio = gmxAPI.newElement(
                    "input",
                    {
                        className: "gmx_layersControlBaseRadio"
                        ,value: id
                        ,type: "radio"
                        ,name: "currentBaseLayer"
                        ,onchange: null
                        ,onclick: function (ev) {
                            var currentItem = layersControl.baseLayersHash[layersControl.currentBaseID];
                            if(currentItem) {
                                if('onCancel' in currentItem['attr']) currentItem['attr']['onCancel']();
                                currentItem.radio.checked = false;
                            }
                            layersControl.currentBaseID = null;
                            
                            if(this.checked) {
                                layersControl.currentBaseID = this.value;
                                currentItem = layersControl.baseLayersHash[layersControl.currentBaseID];
                                if('onClick' in currentItem['attr']) currentItem['attr']['onClick']();
                            }
                        }
                    },
                    {
                        position: 'relative'
                        ,margin: '2px'
                    }
                );
                item.appendChild(radio);
                var span = gmxAPI.newElement(
                    "span",
                    {
                        className: "gmx_layersControlBaseSpan"
                        ,innerHTML: attr['hint'] || tn
                    },
                    {
                        position: 'relative'
                        ,top: '-2px'
                    }
                );
                item.appendChild(span);
                layersControl.baseNode.appendChild(item);
                layersControl.baseLayersHash[id] = {
                    'id': id
                    ,'cont': item
                    ,'radio': radio
                    ,'span': span
                    ,'attr': attr
                    ,'select': function() {
                        radio.checked = true;
                        layersControl.currentBaseID = radio.value;
                    }
                };
                layersControl.aliasNames[tn] = id;
            }
        }
        ,
        'getAlias': function(tn) {
            return layersControl.aliasNames[tn] || tn;
        }
        ,
        'getAliasByName': function(tn) {
            for (var key in layersControl.baseLayersHash) {
                var tool = layersControl.baseLayersHash[key];
                var alias = tool['attr']['alias'] || key;
                if(alias === tn) return alias;
                else if(tool['attr']['lang']) {
                    for (var lang in tool['attr']['lang']) {
                        if(tool['attr']['lang'][lang] === tn) return alias;
                    }
                }
            }
            return null;
        }
        ,
        'getTool': function(tn) {
            tn = layersControl.getAlias(tn);
            if(layersControl.baseLayersHash[tn]) return layersControl.baseLayersHash[tn];
            /*for (var key in layersControl.baseLayersHash) {
                var tool = layersControl.baseLayersHash[key];
                var alias = tool['attr']['alias'] || key;
                if(alias === tn) return tool;
            }*/
            return null;
        }
    }
	gmxAPI.LayersTools = gmxAPI.baseLayersTools = layersControl;

    //Контролы иконок
    var setDOMStyle = function(node, style) {
        for(var key in style) node.style[key] = style[key];
    }
	var iconsControl = {
        parentNode: null
        ,node: null
        ,hideNode: null
        ,items: []
        ,
        init: function(cont) {        // инициализация
            iconsControl.parentNode = cont;
            //if(!iconsControl.hideNode) iconsControl.hideNode = iconsControl.createNode(cont);
            if(!iconsControl.node) iconsControl.node = iconsControl.createNode(cont);
            if(!iconsControl.node.parentNode) iconsControl.setVisible(true);
            iconsControl.setActive(true);
//console.log('iconsControl', iconsControl.node);
        }
        ,
        setVisible: function(flag) {
			if(!flag) {
                if(iconsControl.node.parentNode) iconsControl.parentNode.removeChild(iconsControl.node);
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
                attr['className'] = 'gmx_' + id;
            }
            var events = pt.events || {};
            var style = pt.style || {};
            var hoverStyle = pt.hoverStyle || {};
            if(pt['regularImageUrl']) {
                delete style['backgroundImage'];
                style['position'] = 'relative';
                style['backgroundColor'] = '#9A9A9A';
                hoverStyle['backgroundColor'] = "#9A9A9A";
                delete hoverStyle['backgroundImage'];
            }
            
            for(var key in events) {
                if(key === 'onmouseover' || key === 'onmouseout') continue;
                attr[key] = function(e) {
                    //events[key].call(iconsControl, { gmxItemID: id, originalEvent: e });
                    var handler = events[key];
                    pt['isActive'] = !pt['isActive'];
                    if(key === 'onclick' && 'onCancel' in pt && !pt['isActive']) {
                        handler = pt['onCancel'];
                    }
                    if(handler) handler.call(this, e);
                }
            }
            attr['onmouseover'] = function(e) {
                if(pt['activeImageUrl']) {
                    this.childNodes[0].src = pt['activeImageUrl'];
                } else {
                    setDOMStyle(this, hoverStyle);
                }
                if('onmouseover' in events) {
                    events['onmouseover'].call(iconsControl, e);
                }
            }
            attr['onmouseout'] = function(e) {
                var selectedFlag = ((groupID && id === iconsControl.groupTools[groupID].currentID)
                    || pt['isActive']
                    ? true : false);
                if(!selectedFlag) {
                    if(pt['regularImageUrl']) {
                        this.childNodes[0].src = pt['regularImageUrl'];
                    } else {
                        setDOMStyle(this, style);
                    }
                }
                if('onmouseout' in events) {
                    events['onmouseout'].call(iconsControl, e);
                }
            }
            
            var itemNode = gmxAPI.newElement("div", attr, style);
            if(pt['regularImageUrl']) {
                itemNode.appendChild(gmxAPI.newElement("img", {
                    'src': pt['regularImageUrl']
                }, {
                    'position': 'absolute'
                    ,'margin': 'auto'
                    ,'bottom': '0px'
                    ,'top': '0px'
                    ,'left': '0px'
                    ,'right': '0px'
                }));
            }
            itemNode['_gmxItem'] = pt;
            return itemNode;
        }
        ,
        styleIcon: {        // стиль ноды иконок по умолчанию
            backgroundImage: "url('../../api/img/iconeControls.png')"
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
            backgroundImage: "url('../../api/img/iconeControls.png')"
            ,cursor: 'pointer'
            ,width: '30px'
            ,height: '30px'
            ,marginLeft: '6px'
        }
        ,
        createHideNode: function(cont) {    // создание hideNode
            iconsControl.hideNode = iconsControl.addItemNode({
                type: 'hideItem'
                ,
                attr: {
                    title: 'Показать/Скрыть'
                }
                ,
                events: {
                    onclick: function(e) {
                        gmxAPI.ControlsManager.setVisible();
                        //var isHide = (iconsControl.itemsNode.style.display === 'block' ? true : false);
                        //iconsControl.hideItems(isHide);
                    }
                }
                ,
                style: gmxAPI.extend({
                        backgroundPosition: '-113px -33px'
                    }, iconsControl.styleIcon)
                ,
                hoverStyle: {
                    backgroundPosition: '-113px -2px'
                }
            });
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
                        gmxAPI.ControlsManager.setVisible();
                        //var isHide = (iconsControl.itemsNode.style.display === 'block' ? true : false);
                        //iconsControl.hideItems(isHide);
                    }
                }
                ,
                style: gmxAPI.extend({
                        position: "absolute"
                        ,top: '10px'
                        ,left: '5px'
                        ,backgroundPosition: '-113px -33px'
                    }, iconsControl.styleIcon)
                ,
                hoverStyle: {
                    backgroundPosition: '-113px -2px'
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
        setActive: function(flag) {            // Добавление прослушивателей событий
            if(flag) {
                /*iconsControl.baseLayerSelectedListenerID = gmxAPI.map.addListener('baseLayerSelected', function(name)	{
                    var tool = iconsControl.getTool(name);
                    tool.select();
                });*/
            } else {
                /*if(iconsControl.baseLayerSelectedListenerID) {
                    gmxAPI.map.removeListener('baseLayerSelected', iconsControl.baseLayerSelectedListenerID);
                    iconsControl.baseLayerSelectedListenerID = null;
                }*/
            }
        }
        ,groupTools: {}
        ,
        addTool: function(key, pt) {                 // Добавление иконки
			var ph = gmxAPI.extend({
                id: key || pt['id']
                ,
                isActive: false
                ,
                attr: {
                    title: pt['title'] || pt['hint']
                }
                ,
                events: {}
                ,
                style: gmxAPI.extend(pt['style'], iconsControl.styleIcon, true)
                ,
                hoverStyle: pt['hoverStyle']
            }, pt);
/*
            if(pt['regularImageUrl']) {
                if(!pt['style']) pt['style'] = {};
                pt['style']['backgroundImage'] = "url('"+pt['regularImageUrl']+"')";
                pt['style']['backgroundColor'] = "#9A9A9A";
            }
            if(pt['activeImageUrl']) {
                if(!pt['hoverStyle']) pt['hoverStyle'] = {};
                pt['hoverStyle']['backgroundImage'] = "url('"+pt['activeImageUrl']+"')";
            }
*/
            if(pt['onClick']) ph['events']['onclick'] = pt['onClick'];
            //if(pt['onCancel']) ph['events']['onCancel'] = pt['onCancel'];
			var item = iconsControl.addItemNode(ph);
            iconsControl.itemsNode.appendChild(item);
            var tool = {
                'id': ph['id']
                ,'node': item
            }
            if(pt.type !== 'hideItem') {
                iconsControl.items.push(tool);
                iconsControl.items[ph['id']] = tool;
            }
            return item;
        }
        ,
        'forEach': function(callback) {
			for (var i = 0, len = iconsControl.items.length; i < len; i++) {
				if(callback(this.items[i], i) === false) return;
            }
        }
        ,
        removeTool: function(id) {        // Удалить tool
            iconsControl.forEach(function(item, i) {
                if(id === item['id']) {
                    iconsControl.items.splice(i, 1);
                    delete iconsControl.items[id];
                    item.node.parentNode.removeChild(item.node);
                    return false;   // Уже есть такой
                }
            });
//console.log('removeTool', id, item);
        }
        ,currentID: null
        ,
        selectTool: function(id) {        // Удалить tool
            var item = iconsControl.items[iconsControl['currentID']];
            if(item && 'onmouseout' in item.node) item.node['onmouseout']();
            item = iconsControl.items[id];
            if(item && 'onmouseover' in item) item.node['onmouseover']();
            iconsControl['currentID'] = id;
console.log('selectTool', id, item);
        }
        
        ,
        getToolByName: function(name) {        // Получить tool по name
            var item = iconsControl.items[name];
console.log('getToolByName', name, item);
            return (item ? item : null);
            //for(var id in iconsControl.items) this.style[key] = hoverStyle[key];
        }
        ,
        addGroupTool: function(pt) {            // Добавление раскрывающегося массива иконок
			var groupID = pt['id'];
			var arr = pt['items'];
            var onmouseover = function(e) {
//console.log('onmouseover', this.childNodes.length);
                for(var i=0, len=cont.childNodes.length; i<len; i++) {
                    var it = cont.childNodes[i];
                    it.style.display = 'block';
                }
            }
            var onmouseout = function() {
//console.log('onmouseout', this.childNodes.length);
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
/*
                        var prevItem = groupItems['items'][groupItems['currentID']];
                    if(prevItem && 'onmouseout' in prevItem['_gmxItem']) prevItem['_gmxItem']['onmouseout']();

                    //groupItems['currentID'] = id;
                    var target = groupItems['items'][id];
                    if(target) {
                        groupItems.setCurrent(id);
                        if('onmouseover' in target) target['_gmxItem']['onmouseover']();
                        if('onClick' in target['_gmxItem']) target['_gmxItem']['onClick']();
                    }
*/
console.log('selectTool', id);
                }
                ,setCurrent: function(id) {
                    if(groupItems['currentID']) {
                        var prevItem = groupItems['items'][groupItems['currentID']];
                        if(prevItem) {
                            if('onmouseout' in prevItem['_gmxItem']) prevItem['_gmxItem']['onmouseout']();
                            if('onCancel' in prevItem['_gmxItem']) prevItem['_gmxItem']['onCancel']();
                            prevItem['_gmxItem']['isActive'] = false;
                        }
                    }
                    var target = null;
                    if(id && groupItems['items'][id] && groupItems['currentID'] !== id) {
                        target = groupItems['items'][id];
                        target.parentNode.insertBefore(target, target.parentNode.firstChild);
                        if('onmouseover' in target['_gmxItem']) target['_gmxItem']['onmouseover']();
                        if('onClick' in target['_gmxItem']) target['_gmxItem']['onClick']();
                        target['_gmxItem']['isActive'] = true;
                    } else {
                        id = null;
                    }
                    groupItems['currentID'] = (groupItems['items'][id] ? id : null);
console.log('setCurrent', id, groupItems['currentID']);
                    onmouseout();
                }
            };
            for(var i=0, len=arr.length; i<len; i++) {
                var ph = arr[i];
                (function(){
                    var style = ph['style'];
                    var hoverStyle = ph['hoverStyle'];
                    //style['display'] = (i === 0 ? 'block' : 'none');
                    var onClick = ph['onClick'];
                    var onCancel = ph['onCancel'];
                    var id = ph['key'];
                    var item = iconsControl.addItemNode({
                        id: id
                        ,
                        isActive: false
                        ,
                        'groupID': groupID
                        ,'onClick': ph['onClick']
                        ,'onCancel': ph['onCancel']
                        ,'onmouseout': function(e) {
                            setDOMStyle(item, style);
                        }
                        ,'onmouseover': function(e) {
                            setDOMStyle(item, hoverStyle);
                        }
                        ,
                        attr: {
                            title: ph['hint']
                        }
                        ,
                        events: {
                            onclick: function(e) {
                                //var target = e['target'];
console.log('onclick', id, item.id, e);
                    groupItems.setCurrent(id);
/*                                var target = item;
                                var _gmxItem = target['_gmxItem'];
                                
                                if(groupItems['currentID'] === _gmxItem.id) {
                                    groupItems['currentID'] = null;
                                    _gmxItem.onmouseout(e);
                                    if('onCancel' in _gmxItem) _gmxItem['onCancel'](e);
                                    return;
                                }
                                target.parentNode.insertBefore(target, target.parentNode.firstChild);
                                onmouseout(e);
                                if(groupItems['currentID']) {
                                    var oldItem = groupItems['items'][groupItems['currentID']];//['_gmxItem'];
                                    if(oldItem && 'onCancel' in oldItem) oldItem['onCancel'](e);
                                }
                                groupItems['currentID'] = _gmxItem.id;
                                if('onClick' in _gmxItem) _gmxItem['onClick'](e);
                                //console.log(arguments);*/
                            }
                        }
                        ,
                        style: gmxAPI.extend(style, iconsControl.styleArrIcon)
                        ,
                        hoverStyle: hoverStyle
                    });
                    //if(i === 0) item['first'] = true;
                    cont.appendChild(item);
                    groupItems['items'][id] = item;
                })();
            }
            onmouseout();
            iconsControl.itemsNode.appendChild(cont);
            var tool = {
                'id': groupID
                ,'node': cont
                ,'group': groupItems
            }
            iconsControl.items.push(tool);
            iconsControl.items[groupID] = tool;
            iconsControl.groupTools[groupID] = groupItems;
            return groupItems;
        }
    }

	var Control = {
        'id': 'controlsBaseIcons'
        ,'isVisible': true
        ,'isActive': false
        ,
        'items': [iconsControl, layersControl, copyrightControl, locationControl, zoomControl]
        ,
        'init': function(parent) {        // инициализация
//console.log('controlsBaseIcons', parent);
            this.forEach(function(item, i) {
                ('init' in item ? item.init : item)(parent);
            });
        }
        ,
        'setVisible': function(flag) {
            if(!arguments.length) flag = !this.isVisible;
            this.forEach(function(item, i) {
                item.setVisible(flag);
            });
            copyrightAndLocationContainer.style.display = (flag ? 'block' : 'none');
            this.isVisible = flag;
        }
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
        gmxAPI.IconsControl = iconsControl;
        gmxAPI._tools = {};
        gmxAPI._tools.standart = iconsControl;
        gmxAPI.ControlsManager.addControl(Control);
        gmxAPI._listeners.addListener({'level': 10000, 'eventName': 'mapInit', 'func': function(map) {
//console.log('ControlsManager', iconsControl);
             iconsControl.setActive(true);
             copyrightControl.setActive(true);
             locationControl.setActive(true);
             zoomControl.setActive(true);
             Control.isActive = true;
        }});
    }
})();
