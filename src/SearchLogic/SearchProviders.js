var nsGmx = nsGmx || {};

nsGmx.searchProviders = {};

nsGmx.searchProviders.Osm2DataProvider = function(options){
    nsGmx.OsmDataProvider.call(this, options);
};

nsGmx.searchProviders.Osm2DataProvider.prototype = Object.create(nsGmx.OsmDataProvider.prototype);
nsGmx.searchProviders.Osm2DataProvider.prototype.constructor = nsGmx.Osm2DataProvider;

nsGmx.searchProviders.Osm2DataProvider.prototype.fetch = function (obj) {
    var _this = this;

    var query = 'WrapStyle=None&RequestType=ID&ID=' + obj.ObjCode + '&TypeCode=' + obj.TypeCode + '&UseOSM=1';
    var req = new Request(this._serverBase + '/SearchObject/SearchAddress.ashx?' + query + this._key);
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    var init = {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        cache: 'default'
    };

    return new Promise(function (resolve, reject) {
        fetch(req, init).then(function (response) {
            return response.json();
        }).then(function (json) {
            if (json.Status === 'ok') {
                if (typeof _this._onFetch === 'function') {
                    _this._onFetch(json.Result);
                }
                resolve(json.Result);
            } else {
                reject(json.Result);
            }
        }).catch(function (response) {
            return reject(response);
        });
    });
};

nsGmx.searchProviders.Osm2DataProvider.prototype.find = function (value, limit, strong, retrieveGeometry) {
    var result;
    var _this2 = this;
    _this2.searchString = value;
    var _strong = Boolean(strong) ? 1 : 0;
    var _withoutGeometry = Boolean(retrieveGeometry) ? 0 : 1;
    var query = 'WrapStyle=None&RequestType=SearchObject&IsStrongSearch=' + _strong + '&WithoutGeometry=' + _withoutGeometry + '&UseOSM=1&Limit=' + limit + '&SearchString=' + encodeURIComponent(value);
    var req = new Request(this._serverBase + '/SearchObject/SearchAddress.ashx?' + query + this._key);
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    var init = {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        cache: 'default'
    };
    return new Promise(function (resolve, reject) {
        var initPromise;

        if (!window.useInternalSearch) {
            initPromise = fetch(req, init).then(function (response) {
                return response.json();
            });
        } else {
            initPromise = Promise.resolve({
                Status: 'ok',
                Result: []
            });
        }

        initPromise.then(function (json) {
            if (json.Status === 'ok') {
                json.Result.searchString = _this2.searchString;
                result = json;
                return json;
            } else {
                reject(json.Result);
            }
        }).then(function (json1) {
            return window.searchLogic && window.searchLogic.layersSearch(json1);
        }).then(function (json2) {
            var arr = [];

            for (var i = 0; i < result.Result.length; i++) {
                arr.push(result.Result[i]);
            }

            for (var i = 0; i < json2.length; i++) {
                if (json2[i] && json2[i].length) {
                    for (var j = 0; j < json2[i].length; j++) {
                        arr.push(json2[i][j]);
                    }
                }
            }

            arr.searchString = result.Result.searchString;

            return {
                Status: result.Status,
                Result: arr
            }
        }).then(function (json3) {
            if (json3.Status === 'ok') {
                var rs = json3.Result.reduce(function (a, x) {
                    return a.concat(x.SearchResult);
                }, []).map(function (x) {
                    if (retrieveGeometry && x.Geometry) {
                        var g = _this2._convertGeometry(x.Geometry);
                        var props = Object.keys(x).filter(function (k) {
                            return k !== 'Geometry';
                        }).reduce(function (a, k) {
                            a[k] = x[k];
                            return a;
                        }, {});
                        return {
                            name: x.ObjNameShort,
                            feature: {
                                type: 'Feature',
                                geometry: g,
                                properties: props
                            },
                            properties: props,
                            provider: _this2,
                            query: value
                        };
                    } else {
                        return {
                            name: x.ObjNameShort,
                            properties: x,
                            provider: _this2,
                            query: value
                        };
                    }
                });
                if (strong && retrieveGeometry) {
                    var event = document.createEvent('Event');
                    event.initEvent('fetch', false, false);
                    event.detail = json3.Result;
                    _this2.dispatchEvent(event);
                }
                resolve(rs);
            } else {
                reject(json3);
            }
        });
    });
}
