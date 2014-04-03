// ContextMenu
(function()
{
    "use strict";
    var LMap = null,        // leafLet карта
        menuItems = [],     // массив ContextMenuItems для всех обьектов карты
        marker = null,
        lastItem = null,    // Текущий объект
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
        var gmxNode = ph.obj || gmxAPI.map,
            id = gmxNode.objectId,
            attr = ph.attr || {},
            latlng = attr.latlng;
        if (!latlng) return false;
        lastLatLng = latlng;
        lastItem = attr;
        
        if(marker) LMap.removeLayer(marker);
        marker = createMenu(id, lastLatLng);
        if (marker) marker.addTo(LMap);
    }
    // Click на Item меню
    var itemClick = function(nm)	{
        if(!marker) return false;
        if(nm >= menuItems.length) return false;
        if(menuItems[nm].func) {
            menuItems[nm].func(lastLatLng.lng, lastLatLng.lat, lastItem);
            setTimeout(hideMenu, 0);
        }
    }
    function isChild(node, child) {
        if (node === child) return true;
        if (child.parent && isChild(node, child.parent)) return true;
        return false;
    }
    function sortFunc(a, b) {
        return a.index - b.index;
    }
    function createMenu(id, latlng)	{
        var gmxNode = gmxAPI.mapNodes[id],
            arr = menuItems.sort(sortFunc),
            out = '';
        for (var i=0, len = arr.length; i<len; i++) {
            var item = arr[i],
                flag = isChild(gmxAPI.mapNodes[item.objectId], gmxNode);
            if (flag) {
                out += '<li class="context-menu-item" onClick="gmxAPI._leaflet.contextMenu.itemClick('+i+'); return false;" onmouseOver="gmxAPI._leaflet.contextMenu.onmouseOver(this);" onmouseOut="gmxAPI._leaflet.contextMenu.onmouseOut(this);">';
                out += '<span>'+item.txt+'</span>';
                out += '</li>';
            }
        }
        if (!out) return null;
        
        var myIcon = new L.DivIcon({
            html: '<ul class="context-menu-list context-menu-root">' + out + '</ul>',
            iconSize: new L.Point(0, 0),
            className: ''
        });
        return new L.GMXMarker(latlng, {icon: myIcon, 'toPaneName': 'overlayPane', clickable: false, _isHandlers: true});
    }
    // Удалить в меню Item
    function removeItem(txt) {
        for (var i=0, len = menuItems.length; i<len; i++) {
            var item = menuItems[i];
            if (item.txt === txt) {
                menuItems.splice(i, 1);
                return true;
            }
        }
        return false;
    }
    // Добавить в меню Item
    function addMenuItem(ph) {
        if(!LMap) init();
        var gmxNode = ph.obj || gmxAPI.map,
            objectId = gmxNode.objectId,
            attr = ph.attr || {},
            out = {
            id: gmxAPI.newFlashMapId()
            ,objectId: objectId
            ,txt: attr.text
            ,index: attr.index || 0
            ,func: attr.func
            ,remove: function () {
                return removeItem(attr.text);
            }
        };
        menuItems.push(out);
        return out.id;
    }
    // Удалить в меню Item
    function removeMenuItem(ph) {
        if(!LMap) init();
        var attr = ph.attr || {};
        return removeItem(attr.id);
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
        ,removeMenuItem: removeMenuItem // Удалить Item ContextMenu
        ,showMenu: showMenu             // Показать ContextMenu
        ,itemClick: itemClick           // Выбор пункта меню
        ,onmouseOver: onmouseOver       // mouseOver пункта меню
        ,onmouseOut: onmouseOut         // mouseOut пункта меню
        ,isActive: false                // мышка над пунктом меню
    }
})();
