var shared = {};

shared.NEAREST = 100;
shared.LINEAR = 101;

shared.cnvCache = {};

shared.zoomTile = function (sourceImage, srcX, srcY, srcZ, dstX, dstY, dstZ, destinationCanvas, pixelCallback, mode) {

    mode = mode || shared.NEAREST;

    var dZ = dstZ - srcZ;
    var dZ2 = Math.pow(2, dZ);
    var currSize = 256 / dZ2;

    var offsetX = (dstX - srcX * dZ2) * currSize,
        offsetY = (dZ2 - 1 - (dstY - srcY * dZ2)) * currSize;

    var currPix = shared.getPixelsFromImage(sourceImage);

    var pix = [];

    if (mode == shared.NEAREST) {
        for (var i = 0; i < 256; i++) {
            for (var j = 0; j < 256; j++) {

                var currInd = ((Math.floor(i / dZ2) + offsetY) * 256 + Math.floor(j / dZ2) + offsetX) * 4;

                var k = i * 256 + j;
                var ind = k * 4;

                pix[ind] = currPix[currInd];
                pix[ind + 1] = currPix[currInd + 1];
                pix[ind + 2] = currPix[currInd + 2];
                pix[ind + 3] = currPix[currInd + 3];

                if (pixelCallback) {
                    var res = pixelCallback(pix[ind], pix[ind + 1], pix[ind + 2], pix[ind + 3]);
                    pix[ind] = res[0];
                    pix[ind + 1] = res[1];
                    pix[ind + 2] = res[2];
                    pix[ind + 3] = res[3];
                }
            }
        }
        shared.putPixelsToCanvas(destinationCanvas, pix);
    } else if (mode == shared.LINEAR) {
        var count = 256 / currSize;
        var tempCanvas = null;

        var cacheStr = sourceImage.src + count.toString();

        if (shared.cnvCache[cacheStr]) {
            tempCanvas = shared.cnvCache[cacheStr];
        } else {
            tempCanvas = document.createElement("canvas");
            tempCanvas.width = 256 * count;
            tempCanvas.height = 256 * count;
            var ctx = tempCanvas.getContext('2d');
            ctx.drawImage(sourceImage, 0, 0, tempCanvas.width, tempCanvas.height);
            if (count > 1) {
                shared.cnvCache[cacheStr] = tempCanvas;
            }
        }

        var tempCanvas2 = document.createElement("canvas");
        var dctx2 = destinationCanvas.getContext('2d');
        dctx2.drawImage(tempCanvas, offsetX * count, offsetY * count, 256, 256, 0, 0, 256, 256);

        var imgd = dctx2.getImageData(0, 0, 256, 256);
        var currPix = imgd.data;

        for (var i = 0; i < 256; i++) {
            for (var j = 0; j < 256; j++) {
                var k = i * 256 + j;
                var ind = k * 4;

                pix[ind] = currPix[ind];
                pix[ind + 1] = currPix[ind + 1];
                pix[ind + 2] = currPix[ind + 2];
                pix[ind + 3] = currPix[ind + 3];

                if (pixelCallback) {
                    var res = pixelCallback(pix[ind], pix[ind + 1], pix[ind + 2], pix[ind + 3]);
                    pix[ind] = res[0];
                    pix[ind + 1] = res[1];
                    pix[ind + 2] = res[2];
                    pix[ind + 3] = res[3];
                }
            }
        }

        shared.putPixelsToCanvas(destinationCanvas, pix);
    }
};

shared.isTablet = function () {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
    }
    return false;
};

shared.getPixelsFromImage = function (img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var imgd = ctx.getImageData(0, 0, img.width, img.height);
    var pix = imgd.data;
    return pix;
};

if (window.CanvasPixelArray) {
    CanvasPixelArray.prototype.set = function (arr) {
        var l = this.length, i = 0;

        for (; i < l; i++) {
            this[i] = arr[i];
        }
    };
}

shared.putPixelsToCanvas = function (canvas, data) {
    var context = canvas.getContext('2d');
    var imageData = context.createImageData(canvas.width, canvas.height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);
};

/**
 * example:
 * var list = [
 *    {name: "1", lastname: "foo1", age: "16"},
 *    {name: "2", lastname: "foo", age: "13"},
 *    {name: "3", lastname: "foo1", age: "11"},
 *    {name: "4", lastname: "foo", age: "11"},
 *    {name: "5", lastname: "foo1", age: "16"},
 *    {name: "6", lastname: "foo", age: "16"},
 *    {name: "7", lastname: "foo1", age: "13"},
 *    {name: "8", lastname: "foo1", age: "16"},
 *    {name: "9", lastname: "foo", age: "13"},
 *    {name: "0", lastname: "foo", age: "16"}
 * ];
 * var result = __groupBy(list, function (item) {
 *     return [item.lastname, item.age];
 * });
 */
__groupBy = function (array, f) {
    var groups = {};
    array.forEach(function (o) {
        var group = JSON.stringify(f(o));
        groups[group] = groups[group] || [];
        groups[group].push(o);
    });
    return Object.keys(groups).map(function (group) {
        return groups[group];
    })
};


shared.getRandomColor = function () {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

shared.hexToR = function (h) { return parseInt((shared.cutHex(h)).substring(0, 2), 16) };
shared.hexToG = function (h) { return parseInt((shared.cutHex(h)).substring(2, 4), 16) };
shared.hexToB = function (h) { return parseInt((shared.cutHex(h)).substring(4, 6), 16) };
shared.cutHex = function (h) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h };

shared.RGB2HEX = function (red, green, blue) {
    return blue + 256 * green + 65536 * red;
};

shared.DEC2RGB = function (color) {
    var r = (color & 0xff0000) >> 16,
        g = (color & 0x00ff00) >> 8,
        b = (color & 0x0000ff);
    return "rgb(" + r + "," + g + "," + b + ")";
};

shared.DEC2RGBA = function (color, opacity) {
    var r = (color & 0xff0000) >> 16,
        g = (color & 0x00ff00) >> 8,
        b = (color & 0x0000ff);
    return "rgba(" + r + "," + g + "," + b + "," + (opacity != undefined ? opacity : 1.0) + ")";
};

shared.dateToString = function (date, inv) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString();
    var dd = (date.getDate()).toString();
    if (inv) {
        return (dd[1] ? dd : "0" + dd[0]) + "." + (mm[1] ? mm : "0" + mm[0]) + "." + yyyy;
    }
    return yyyy + "." + (mm[1] ? mm : "0" + mm[0]) + "." + (dd[1] ? dd : "0" + dd[0]);
};

shared.formatDate = function (d, m, y, sep) {
    return shared.strpad(d.toString(), 2) + (sep || '.') +
        shared.strpad(m.toString(), 2) + (sep || '.') +
        shared.strpad(y.toString(), 4);
}

shared.strpad = function (str, len) {
    if (typeof (len) == "undefined") { var len = 0; }
    if (len + 1 >= str.length) {
        str = Array(len + 1 - str.length).join("0") + str;
    }
    return str;
};

shared.formatDateToString = function (date) {
    return (('0' + date.getDate()).slice(-2) + "." + ('0' + (date.getMonth() + 1)).slice(-2) + "." + date.getFullYear());
};

shared.addDaysToDate = function (date, days) {
    var result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
};

//Создает палитру для ndvi средних вручную
shared.createPaletteHR = function (palette) {

    var min_i, max_i;
    var interp = false;
    //min_i = 101, max_i = 201;
    min_i = -1, max_i = palette.length - 1;

    for (var i = 0; i < palette.length; i++) {
        if (min_i == -1 && palette[i]) {
            min_i = i;
        }
        if (min_i != -1 && !palette[i]) {
            interp = true;
            break;
        }
    }

    if (interp) {
        var vArr = [];
        for (var i = min_i; i <= max_i; i++) {
            if (palette[i]) {
                vArr.push(i);
            }
        }

        function lerp(t, h1, h0) {
            return h0 + t * (h1 - h0);
        };

        var counter = 0;
        for (var i = min_i; i <= max_i; i++) {
            if (!palette[i]) {

                var c0, c1, t;

                var i0 = vArr[counter - 1],
                    i1 = vArr[counter];
                c0 = palette[i0];
                c1 = palette[i1];
                t = (i - i0) / (i1 - i0);

                //136 - 224 240 112

                var r = Math.round(lerp(t, c1.partRed, c0.partRed));
                var g = Math.round(lerp(t, c1.partGreen, c0.partGreen));
                var b = Math.round(lerp(t, c1.partBlue, c0.partBlue));

                palette[i] = { "partRed": r, "partGreen": g, "partBlue": b };
            } else {
                counter++;
            }
        }
    } else {
        palette[0] = { 'partRed': 0, 'partGreen': 0, 'partBlue': 0 };
    }
};

shared.loadPaletteSync = function (url, callback, paletteArr) {
    var def = new $.Deferred();
    $.ajax({
        url: url,
        type: 'GET',
        dataType: "xml"
    }).then(function (xml) {
        var palette = paletteArr || [];
        $(xml).find("ENTRY").each(function () {
            var code = $(this).find('Code').text(),
            partRed = $(this).find('Color > Part_Red').text(),
            partGreen = $(this).find('Color > Part_Green').text(),
            partBlue = $(this).find('Color > Part_Blue').text();
            palette[parseInt(code)] = { 'partRed': parseInt(partRed), 'partGreen': parseInt(partGreen), 'partBlue': parseInt(partBlue) };
        });
        shared.createPaletteHR(palette);
        if (callback) {
            callback(palette);
        }
        def.resolve(palette);
    });
    return def;
};

//Кеш загруженной геометрии
shared.GeometryCache = {};
shared.GeometryBounds = {};
shared.MAX_FEATURES = 250;

shared.getFeatures = function (layerId, sender, callback, errorCallback) {
    if (shared.GeometryCache[layerId] && shared.GeometryBounds[layerId].equals(nsGmx.gmxMap.layersByID[layerId].getBounds())) {
        callback(shared.GeometryCache[layerId]);
    } else {
        var that = this;
        function _success(response) {
            if (nsGmx && nsGmx.gmxMap) {
                shared.GeometryBounds[layerId] = nsGmx.gmxMap.layersByID[layerId].getBounds();
            }

            var res = response.Result;
            if (res.values.length < shared.MAX_FEATURES) {
                if (!response.Result.values.length) {
                    errorCallback && errorCallback({ "err": "There's no fields" });
                    return;
                }
                shared.GeometryCache[layerId] = res;
                if (callback)
                    callback.call(sender, res);
            } else {
                errorCallback && errorCallback({ "err": "Too much fields" });
                return;
            }
        };

        var url = "/VectorLayer/Search.ashx?WrapStyle=func" +
                  "&layer=" + layerId +
                  "&geometry=true";
        if (nsGmx.Auth && nsGmx.Auth.getResourceServer) {
            nsGmx.Auth.getResourceServer('geomixer').sendGetRequest(url).then(function (response) {
                _success(response);
            });
        } else {
            sendCrossDomainJSONRequest(window.serverBase + url, function (response) {
                _success(response);
            });
        }
    }
};

shared.VERYBIGNUMBER = 10000000000;

shared.getLayersGeometry = function (layersArr, sender, callback, errorCallback) {

    var maxX = -shared.VERYBIGNUMBER, minX = shared.VERYBIGNUMBER,
        maxY = -shared.VERYBIGNUMBER, minY = shared.VERYBIGNUMBER;

    var new_features = [];

    var id = 1;

    var defArr = [];
    for (var j = 0 ; j < layersArr.length; j++) {

        var layerId = layersArr[j];

        (function (g) {
            var _def = new $.Deferred();
            defArr.push(_def);
            shared.getFeatures(layerId, sender, function (features) {
                var nameIndex = features.fields.indexOf("NAME");
                if (nameIndex == -1) {
                    nameIndex = features.fields.indexOf("name");
                }

                //определяем границы(extent) полей, мультиполигоны
                //перегоняем в полигоны и сохраняем здесь.
                //var features =
                var geom_index = features.fields.indexOf("geomixergeojson");
                var ogc_fid_index = features.fields.indexOf("ogc_fid");
                if (ogc_fid_index == -1) {
                    ogc_fid_index = features.fields.indexOf("gmx_id");
                }

                var f = features.values;
                new_features[g] = [];

                for (var i = 0; i < f.length; i++) {
                    var geom = f[i][geom_index];
                    var properties = { "ogc_fid": f[i][ogc_fid_index], "midndvi": -1, "name": f[i][nameIndex] };

                    if (geom.type === "POLYGON") {
                        var coords = geom.coordinates[0];
                        for (var j = 0; j < coords.length; j++) {
                            var p = coords[j];
                            if (p[0] < minX) minX = p[0];
                            if (p[0] > maxX) maxX = p[0];
                            if (p[1] < minY) minY = p[1];
                            if (p[1] > maxY) maxY = p[1];
                        }
                        new_features[g].push({ "id": id++, "properties": properties, "geometry": oldAPI.from_merc_geometry({ "type": "POLYGON", "coordinates": geom.coordinates }) });
                    } else if (geom.type === "MULTIPOLYGON") {
                        var poligons = geom.coordinates;
                        for (var j = 0; j < poligons.length; j++) {
                            //for (var l = 0; l < poligons[j].length; l++) {
                            //var coords = poligons[j][l];
                            var coords = poligons[j][0];
                            for (var k = 0; k < coords.length; k++) {
                                var p = coords[k];
                                if (p[0] < minX) minX = p[0];
                                if (p[0] > maxX) maxX = p[0];
                                if (p[1] < minY) minY = p[1];
                                if (p[1] > maxY) maxY = p[1];
                            }
                            //new_features.push({ "id": id++, "properties": properties, "geometry": gmxAPI.from_merc_geometry({ "type": "POLYGON", "coordinates": [coords] }) });
                            //}
                        }
                        new_features[g].push({ "id": id++, "properties": properties, "geometry": oldAPI.from_merc_geometry({ "type": "MULTIPOLYGON", "coordinates": poligons }) });
                    }
                }
                var extent = { "type": "POLYGON", "coordinates": [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]] };

                _def.resolve();
            }, errorCallback);
        }(j));
    }

    $.when.apply($, defArr).then(function () {
        var extent = { "type": "POLYGON", "coordinates": [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]] };
        var features = [];
        for (var i = 0; i < new_features.length; i++) {
            features.push.apply(features, new_features[i]);
        }
        if (callback)
            callback.call(sender, { "extent": extent, "features": features });
    });
};


//Эта функия есть в плагине таймлайна, ее бы надо вынести в утилиты
shared.isPointInPoly = function (poly, pt) {
    var l = poly.length;
    poly[0][0] == poly[l - 1][0] && poly[0][1] == poly[l - 1][1] && l--;
    for (var c = false, i = -1, j = l - 1; ++i < l; j = i)
        ((poly[i][1] <= pt.y && pt.y < poly[j][1]) || (poly[j][1] <= pt.y && pt.y < poly[i][1]))
        && (pt.x < (poly[j][0] - poly[i][0]) * (pt.y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
        && (c = !c);
    return c;
};


shared.isPointInGeometry = function (geometry, point) {
    if (geometry.type.toUpperCase() == "POLYGON") {
        return shared.isPointInPoly(geometry.coordinates[0], point);
    } else {
        for (var i = 0; i < geometry.coordinates.length; i++) {
            if (shared.isPointInPoly(geometry.coordinates[i][0], point)) {
                return true;
            }
        }
    }
    return false;
};


/*
* Recursively merge properties of two objects
* http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
*/
shared.mergeRecursive = function (obj1, obj2) {

    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);

            } else {
                obj1[p] = obj2[p];

            }

        } catch (e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];

        }
    }

    return obj1;
}

shared.disableHTMLSelection = function (selector) {
    $(selector).attr('unselectable', 'on')
     .css({
         '-moz-user-select': '-moz-none',
         '-moz-user-select': 'none',
         '-o-user-select': 'none',
         '-khtml-user-select': 'none',
         '-webkit-user-select': 'none',
         '-ms-user-select': 'none',
         'user-select': 'none'
     }).bind('selectstart', function () { return false; });
};

/*
=====================================
    старого апи функции
=====================================
*/
var oldAPI = {};

oldAPI.deg_rad = function (ang) {
    return ang * (Math.PI / 180.0);
}

oldAPI.merc_x = function (lon) {
    var r_major = 6378137.000;
    return r_major * oldAPI.deg_rad(lon);
}

oldAPI.merc_y = function (lat) {
    if (lat > 89.5)
        lat = 89.5;
    if (lat < -89.5)
        lat = -89.5;
    var r_major = 6378137.000;
    var r_minor = 6356752.3142;
    var temp = r_minor / r_major;
    var es = 1.0 - (temp * temp);
    var eccent = Math.sqrt(es);
    var phi = oldAPI.deg_rad(lat);
    var sinphi = Math.sin(phi);
    var con = eccent * sinphi;
    var com = .5 * eccent;
    con = Math.pow(((1.0 - con) / (1.0 + con)), com);
    var ts = Math.tan(.5 * ((Math.PI * 0.5) - phi)) / con;
    var y = 0 - r_major * Math.log(ts);
    return y;
}

oldAPI.deg_decimal = function (rad) {
    return (rad / Math.PI) * 180.0;
}

oldAPI.from_merc_y = function (y) {
    var r_major = 6378137.000;
    var r_minor = 6356752.3142;
    var temp = r_minor / r_major;
    var es = 1.0 - (temp * temp);
    var eccent = Math.sqrt(es);
    var ts = Math.exp(-y / r_major);
    var HALFPI = 1.5707963267948966;

    var eccnth, Phi, con, dphi;
    eccnth = 0.5 * eccent;

    Phi = HALFPI - 2.0 * Math.atan(ts);

    var N_ITER = 15;
    var TOL = 1e-7;
    var i = N_ITER;
    dphi = 0.1;
    while ((Math.abs(dphi) > TOL) && (--i > 0)) {
        con = eccent * Math.sin(Phi);
        dphi = HALFPI - 2.0 * Math.atan(ts * Math.pow((1.0 - con) / (1.0 + con), eccnth)) - Phi;
        Phi += dphi;
    }

    return oldAPI.deg_decimal(Phi);
};

oldAPI.from_merc_x = function (x) {
    var r_major = 6378137.000;
    return oldAPI.deg_decimal(x / r_major);
};

oldAPI.from_merc_geometry = function (geom) {
    return (geom ? oldAPI.transformGeometry(geom, oldAPI.from_merc_x, oldAPI.from_merc_y) : null);
};

oldAPI.transformGeometry = function (geom, callbackX, callbackY) {
    return !geom ? geom : {
        type: geom.type,
        coordinates: oldAPI.forEachPoint(geom.coordinates, function (p) {
            return [callbackX(p[0]), callbackY(p[1])];
        })
    }
};

oldAPI.forEachPoint = function (coords, callback) {
    if (!coords || coords.length == 0) return [];
    if (!coords[0].length) {
        if (coords.length == 2)
            return callback(coords);
        else {
            var ret = [];
            for (var i = 0; i < coords.length / 2; i++)
                ret.push(callback([coords[i * 2], coords[i * 2 + 1]]));
            return ret;
        }
    }
    else {
        var ret = [];
        for (var i = 0; i < coords.length; i++) {
            if (typeof (coords[i]) != 'string') ret.push(oldAPI.forEachPoint(coords[i], callback));
        }
        return ret;
    }
};

shared.clearDate = function (currentTime) {
    var millisInDay = 60 * 60 * 24 * 1000;
    var dateOnly = Math.floor(currentTime / millisInDay) * millisInDay;
    return dateOnly;
};

shared.subDates = function (d1, d0) {
    return Math.round(Math.abs((d1.getTime() - d0.getTime()) / (24 * 60 * 60 * 1000)));
};

shared.addDays = function (date, days) {
    var result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
};

shared.equalDates = function (d1, d2) {
    return d1.getDate() == d2.getDate() && d1.getMonth() == d2.getMonth() && d1.getFullYear() == d2.getFullYear();
};
