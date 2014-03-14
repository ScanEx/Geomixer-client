// ContextMenu
(function()
{
    "use strict";
    var LMap = null,        // leafLet карта
        menuItems = {},     // Хэш наборов ContextMenu по ID нод обьектов карты
        marker = null,
        currMenuID = null,  // Текущее меню
        lastLatLng = null;  // Текущее положение

    // Показать меню
    function hideMenu() {
        if(marker) LMap.removeLayer(marker);
        marker = null
        gmxAPI._leaflet.contextMenu.isActive = false;
    }

    // Показать меню
    function showMenu(ph) {
        if(!LMap) init();
        var gmxNode = ph.obj || gmxAPI.map;
        var id = gmxNode.objectId;
        if(!menuItems[id]) return false;
        currMenuID = id;
        var attr = ph.attr || {};
        var latlng = attr.latlng;
        if(!latlng) return false;
        lastLatLng = latlng;
        if(marker) LMap.removeLayer(marker);
        marker = createMenu(id, lastLatLng);
        marker.addTo(LMap);
    }
    // Click на Item меню
    var itemClick = function(nm)	{
        if(!marker || !menuItems[currMenuID]) return false;
        var items = menuItems[currMenuID].items;
        if(nm >= items.length) return false;
        if(items[nm].func) {
            items[nm].func(lastLatLng.lng, lastLatLng.lat);
            hideMenu();
        }
    }
    function createMenu(id, latlng)	{
        if(!menuItems[id]) return false;
        var out = '<ul class="context-menu-list context-menu-root">';
        var items = menuItems[id].items;
        for (var i=0, len = items.length; i<len; i++) {	// Итерации K-means
            var item = items[i];
            out += '<li class="context-menu-item" onClick="gmxAPI._leaflet.contextMenu.itemClick('+i+'); return false;" onmouseOver="gmxAPI._leaflet.contextMenu.onmouseOver(this);" onmouseOut="gmxAPI._leaflet.contextMenu.onmouseOut(this);">';
            out += '<span>'+item['txt']+'</span>';
            out += '</li>';
        }
        out += '</ul>';
        
        var myIcon = new L.DivIcon({
            html: out,
            iconSize: new L.Point(0, 0),
            className: ''
        });
        return new L.GMXMarker(latlng, {icon: myIcon, 'toPaneName': 'overlayPane', clickable: false, _isHandlers: true});
    }
    // Добавить в меню Item
    function addMenuItem(ph) {
        if(!LMap) init();
        var gmxNode = ph.obj || gmxAPI.map,
            id = gmxNode.objectId,
            attr = ph.attr || {},
            itemId = gmxAPI.newFlashMapId();
        menuItems[id] = menuItems[id] ? menuItems[id] : { items: [] };
        var items = menuItems[id].items;
        var out = {
            id: itemId
            ,txt: attr.text
            ,func: attr.func
            ,remove: function () {
                for (var i=0, len = items.length; i<len; i++) {
                    var item = items[i];
                    if(item.id === itemId) {
                        items.splice(i, 1);
                        return item;
                    }
                }
            }
        };
        items.push(out);
        return out;
    }
    // инициализация
    function init(arr) {
        LMap = gmxAPI._leaflet.LMap;
        setTimeout(function() {
            var css = document.createElement("link");
            css.setAttribute("type", "text/css");
            css.setAttribute("rel", "stylesheet");
            css.setAttribute("media", "screen");
            var apiHost = gmxAPI.getAPIFolderRoot();
            css.setAttribute("href", apiHost + "leaflet/jquery.contextMenu.css?" + gmxAPI.buildGUID);
            document.getElementsByTagName("head").item(0).appendChild(css);
        }, 1000);
        LMap.on('mousemove', function(e) {
            if(!marker) return;
            var target = gmxAPI.compatTarget(e.originalEvent);
            if(!gmxAPI.isInNode(marker._icon, target)) {
                hideMenu();
            }
        });
    }
    // onmouseOver на Item меню
    var onmouseOver = function(hNode) {
        hNode.className = 'context-menu-item hover';
        gmxAPI._leaflet.contextMenu.isActive = true;
    }
    // onmouseOut на Item меню
    var onmouseOut = function(hNode) {
        hNode.className = 'context-menu-item';
        gmxAPI._leaflet.contextMenu.isActive = false;
    }
    //расширяем namespace
    if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
    gmxAPI._leaflet.contextMenu = {     // ContextMenu
        addMenuItem: addMenuItem        // Добавить Item ContextMenu
        ,showMenu: showMenu             // Добавить Item ContextMenu
        ,itemClick: itemClick           // Выбор пункта меню
        ,onmouseOver: onmouseOver       // mouseOver пункта меню
        ,onmouseOut: onmouseOut         // mouseOut пункта меню
        ,isActive: false                // мышка над пунктом меню
    }
})();
