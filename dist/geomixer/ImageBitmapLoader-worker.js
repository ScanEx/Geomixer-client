'use strict';

var log = self.console.log.bind(self.console),
	str = self.location.origin || '',
	syncParams = {},
	_protocol = str.substring(0, str.indexOf('/')),
	fetchOptions = {
		// method: 'post',
		// headers: {'Content-type': 'application/x-www-form-urlencoded'},
		mode: 'cors',
		redirect: 'follow',
		credentials: 'include'
	};

var utils = {
	extend: function (dest) {
		var i, j, len, src;

		for (j = 1, len = arguments.length; j < len; j++) {
			src = arguments[j];
			for (i in src) {
				dest[i] = src[i];
			}
		}
		return dest;
	},
	chkProtocol: function(url) {
		return url.substr(0, _protocol.length) === _protocol ? url : _protocol + url;
	},
	getFormBody: function(par) {
		return Object.keys(par).map(function(key) { return encodeURIComponent(key) + '=' + encodeURIComponent(par[key]); }).join('&');
	},
	chkResponse: function(resp, type) {
		if (resp.status < 200 || resp.status >= 300) {						// error
			return Promise.reject(resp);
		} else {
			var contentType = resp.headers.get('Content-Type');
			if (type === 'bitmap') {												// get blob
				return resp.blob();
			} else if (contentType.indexOf('application/json') > -1) {				// application/json; charset=utf-8
				return resp.json();
			} else if (contentType.indexOf('text/javascript') > -1) {	 			// text/javascript; charset=utf-8
				return resp.text();
			// } else if (contentType.indexOf('application/json') > -1) {	 		// application/json; charset=utf-8
				// ret = resp.text();
			// } else if (contentType.indexOf('application/json') > -1) {	 		// application/json; charset=utf-8
				// ret = resp.formData();
			// } else if (contentType.indexOf('application/json') > -1) {	 		// application/json; charset=utf-8
				// ret = resp.arrayBuffer();
			// } else {
			}
		}
		return resp.text();
	},
	// getJson: function(url, params, options) {
	getJson: function(queue) {
// log('getJson', _protocol, queue, Date.now())
		var par = utils.extend({}, queue.params, syncParams),
			options = queue.options || {},
			opt = utils.extend({
				method: 'post',
				headers: {'Content-type': 'application/x-www-form-urlencoded'}
				// mode: 'cors',
				// redirect: 'follow',
				// credentials: 'include'
			}, fetchOptions, options, {
				body: utils.getFormBody(par)
			});
		return fetch(utils.chkProtocol(queue.url), opt)
		.then(function(res) {
			return utils.chkResponse(res, options.type);
		})
		.then(function(res) {
			var out = {url: queue.url, queue: queue, load: true, res: res};
			if (queue.send) {
				handler.workerContext.postMessage(out);
			} else {
				return out;
			}
		})
		.catch(function(err) {
			var out = {url: queue.url, queue: queue, load: false, error: err.toString()};
			handler.workerContext.postMessage(out);
		});
    },

    getTileAttributes: function(prop) {
        var tileAttributeIndexes = {},
            tileAttributeTypes = {};
        if (prop.attributes) {
            var attrs = prop.attributes,
                attrTypes = prop.attrTypes || null;
            if (prop.identityField) { tileAttributeIndexes[prop.identityField] = 0; }
            for (var a = 0; a < attrs.length; a++) {
                var key = attrs[a];
                tileAttributeIndexes[key] = a + 1;
                tileAttributeTypes[key] = attrTypes ? attrTypes[a] : 'string';
            }
        }
        return {
            tileAttributeTypes: tileAttributeTypes,
            tileAttributeIndexes: tileAttributeIndexes
        };
    }
};

function ImageHandler(workerContext) {
    this.maxCount = 48;
    this.loading = 0;
    this.queue = [];
	this.inProgress = {};

    this.workerContext = workerContext;
}
ImageHandler.prototype = {
	enqueue: function(evt) {
		var toEnqueue = evt.data;
		if (this.queue.indexOf(toEnqueue) < 0) {
			this.queue.push(toEnqueue);
			this.processQueue();
		}
	},

	_resolveRequest: function(out) {
		this.loading--;
		// arr = arr || null;
		var url = out.src || out.url;
		this.workerContext.postMessage(out); // TODO: need send with , arr attribute
		if (this.inProgress[url]) {
			this.inProgress[url].requests.forEach(function() {
				this.workerContext.postMessage(out);
			}.bind(this));
			delete this.inProgress[url];
		}
	},

	processQueue: function() {
		if (this.queue.length > 0 && this.loading < this.maxCount) {
			var it = this.queue.shift(),
				url = it.src;

			if (url in this.inProgress) {
				// log('processQueue', this.queue.length, this.loading, this.maxCount, it);
				this.inProgress[url].requests.push(it);
			} else {
				this.loading++;
				this.inProgress[url] = {requests: [it]};

				var options = it.options || {},
					type = options.type || 'bitmap',
					out = {url: it.src, type: type, load: false, loading: this.loading, queueLength: this.queue.length};

				var promise = fetch(utils.chkProtocol(out.url), utils.extend({}, fetchOptions, options)).then(function(resp) {
						return utils.chkResponse(resp, type);
					});

				if (type === 'bitmap') {
					promise = promise.then(createImageBitmap);				// Turn it into an ImageBitmap.
				}
				return promise
					.then(function(res) {									// Post it back to main thread.
						out.load = true;
						var arr = [];
						if (type === 'bitmap') {
							arr = [res];
							out.imageBitmap = res;
						} else {
							out.res = res;
						}
						// log('imageBitmap __', this.queue.length, this.loading, out);
						this._resolveRequest(out, arr);
						this.processQueue();
					}.bind(this))
					.catch(function(err) {
						out.error = err.toString();
						this._resolveRequest(out);
						this.processQueue();
					}.bind(this));
			}
		}
	}
};

/** загрузчик описаний карт
*/
var gmxMapManager = {
    //serverHost should be host only string like 'maps.kosmosnimki.ru' without any slashes or 'http://' prefixes
    getMap: function(serverHost, apiKey, mapName, skipTiles, srs) {
		return gmxMapManager.loadMapProperties({
			srs: srs,
			hostName: serverHost,
			apiKey: apiKey,
			mapName: mapName,
			skipTiles: skipTiles
		});
    },

	loadMapProperties: function(options) {
        var maps = this._maps,
			serverHost = options.hostName || options.serverHost,
			mapName = options.MapName;
log('loadMapProperties', mapName)
        if (!maps[serverHost] || !maps[serverHost][mapName]) {
			var promise = new Promise(function(resolve, reject) {
			var opt = {
				WrapStyle: 'None',
				skipTiles: options.skipTiles || 'All', // All, NotVisible, None
				MapName: mapName,
				srs: options.srs || 3857,
				ftc: options.ftc || 'osm',
				ModeKey: 'map'
			};
			if (options.visibleItemOnly) { opt.visibleItemOnly = true; }
				gmxMapManager.requestSessionKey(serverHost, options.apiKey).then(function(sessionKey) {
					opt.key = sessionKey;
					utils.getJson({
						url: '//' + serverHost + '/TileSender.ashx',
						params: opt
					})
					.then(function(json) {
						var res = typeof json.res === 'string' ? JSON.parse(json.res) : json.res;
						if (res.Status === 'ok' && res.Result) {
							var mapInfo = res.Result,
								mapProps = mapInfo.properties;

							mapProps.hostName = serverHost;
							mapProps.sessionKey = sessionKey;
							var dataSources = {};
							gmxMapManager.iterateLayers(mapInfo, function(layerInfo) {
								var props = layerInfo.properties,
									// type = props.ContentID || props.type,
									meta = props.MetaProperties || {},
									options = {
										mapID: mapProps.MapID,
										sessionKey: mapProps.sessionKey,
										skipTiles: opt.skipTiles,
										srs: opt.srs,
										ftc: opt.ftc,
										id: props.name,
										dataSource: props.name
									};
								if (props.dataSource) {					// изменен источник
									options.dataSource = props.dataSource;
								} else if ('parentLayer' in meta) {		// изменен источник
									options.dataSource = meta.parentLayer.Value || '';
								}

								props.hostName = mapProps.hostName;
								dataSources[options.id] = {
									info: layerInfo,
									options: options
								};
							});
							var mapHash = {
								properties: mapProps,
								dataSources: dataSources,
								_rawTree: res.Result,
								_nodes: {}
							};

							gmx._maps[serverHost] = gmx._maps[serverHost] || {};
							gmx._maps[serverHost][mapName] = mapHash;
							resolve(res.Result);
						} else {
							reject(json);
						}
					}.bind(this))
					.catch(reject);
				}, reject);
			});
            maps[serverHost] = maps[serverHost] || {};
            maps[serverHost][mapName] = {promise: promise};
        }
        return maps[serverHost][mapName].promise;
    },

    // установка дополнительных параметров для серверных запросов
	// syncParams: {},
    // setSyncParams: function(hash) {
		// this.syncParams = hash;
    // },
    // getSyncParams: function(stringFlag) {
		// var res = this.syncParams;
		// if (stringFlag) {
			// var arr = [];
			// for (var key in res) {
				// arr.push(key + '=' + res[key]);
			// }
			// res = arr.join('&');
		// }
		// return res;
    // },

    //we will (lazy) create index by layer name to speed up multiple function calls
    findLayerInfo: function(serverHost, mapID, layerID) {
		var hostMaps = L.gmx._maps[serverHost],
			layerInfo = null;

		if (hostMaps && hostMaps[mapID]) {
			var mapInfo = hostMaps[mapID];
			if (!mapInfo._nodes[layerID]) {
				gmxMapManager.iterateNode(mapInfo._rawTree, function(it) {
					mapInfo._nodes[it.content.properties.name] = it;
				});
			}
			layerInfo = mapInfo._nodes[layerID];
		}
		return layerInfo ? layerInfo.content : null;
    },
    iterateLayers: function(treeInfo, callback) {
        var iterate = function(arr) {
            for (var i = 0, len = arr.length; i < len; i++) {
                var layer = arr[i];

                if (layer.type === 'group') {
                    iterate(layer.content.children);
                } else if (layer.type === 'layer') {
                    callback(layer.content);
                }
            }
        };

        treeInfo && iterate(treeInfo.children);
    },
    iterateNode: function(treeInfo, callback) {
        var iterate = function(node) {
			var arr = node.children;
            for (var i = 0, len = arr.length; i < len; i++) {
                var layer = arr[i];

				callback(layer);
                if (layer.type === 'group') {
                    iterate(layer.content);
                }
            }
        };

        treeInfo && iterate(treeInfo);
    },
    requestSessionKey: function(serverHost, apiKey) {
        var keys = this._sessionKeys;
        if (!(serverHost in keys)) {
            keys[serverHost] = new Promise(function(resolve, reject) {
				if (apiKey) {
					utils.getJson({
						url: '//' + serverHost + '/ApiKey.ashx',
						params: {WrapStyle: 'None', Key: apiKey}
					})
						.then(function(json) {
							var res = json.res;
							if (res.Status === 'ok' && res.Result) {
								resolve(res.Result.Key !== 'null' ? '' : res.Result.Key);
							} else {
								reject(json);
							}
						}.bind(this))
						.catch(function() {
							resolve('');
						}.bind(this));
				} else {
					resolve('');
				}
			});
        }
        return keys[serverHost];
    },

    //get already received session key
    getSessionKey: function(serverHost) {
		return this._sessionKeys[serverHost];
    },
    _sessionKeys: {},		//Promise session for each host
    _maps: {}				//Promise for each map. Structure: maps[serverHost][mapID]: {promise:, layers:}
};

var gmx = self.gmx || {};
gmx._maps = {};			// свойства слоев по картам
gmx._clientLayers = {};	// свойства слоев без карт (клиентские слои)

/** загрузчик источников данных
*/
var vectorTiles = {
    _maxCount: 48,
    _loading: 0,
	_queue: [],
    _parseTile: function(req) {
		var txt = req.res,
			pref = 'gmxAPI._vectorTileReceiver(';
		if (txt.substr(0, pref.length) === pref) {
			txt = txt.replace(pref, '');
			var data = JSON.parse(txt.substr(0, txt.length -1));
			var queue = req.queue,
				layerID = queue.params.LayerName,
				hostName = queue.hostName,
				ds = gmx._maps[hostName][queue.mapID].dataSources[layerID],
				vTiles = ds.vTiles;

			if (data.LayerName !== layerID) {
				log('error', data.LayerName, layerID);
			} else {
				vectorTiles._flatTile(ds, data);
				vTiles[queue.key].res = data;
			}
		}
    },
    _flatTile: function() {
			/*
    _flatTile: function(ds, data) {
		var props = ds.info.properties,
			attr = utils.getTileAttributes(props),
			items = [],
			stat = [],
			out = { type: '', props: [], points: [], lines: [], interval: [], vert: []},
			i, len, j, len1;

		data.values.forEach(function(it) {
			var len = it.length - 1,
				vec = new Uint32Array(len);
			vec[0] = it[0];
			for (var i = 1; i < len; i++) {
				if (!items[i]) { items[i] = {}; }
				var tp = items[i],
					zn = it[i];
				if (!(zn in tp)) { tp[zn] = stat.length; stat.push(zn); }
				vec[i] = tp[zn];
			}
			out.props.push(vec);
			var geo = it[len],
				type = geo.type.toLowerCase(),
				coords = geo.coordinates;

			if (type.indexOf('multi') === -1) {
				coords = [coords];
			}
			if (type.indexOf('linestring') !== -1) {
				for (i = 0, len = coords.length; i < len; i++) {
					out.interval.push(out.vert.length);
					var pt = vectorTiles.flattenRing(coords[i]);
					out.vert = out.vert.concat(pt);
					out.interval.push(out.vert.length);
				}
			} else {
				log('______ ', type)
			}
			out.type = type;
			//var flat = vectorTiles.geoFlatten(it[len]);
			//out.type = flat.type;
			// out.interval = out.interval.concat(flat.interval);
			// out.vert = out.vert.concat(flat.vert);
		});
		out.stat = stat;
		out.values = data.values;
log('_flatTile', attr, out)
			*/
    },

    geoFlatten: function() {  // get flatten geometry
        /*
		var type = geo.type.toLowerCase(),
            coords = geo.coordinates,
			out = {type: type, vert: [], rings: [], holes: []},
			i, len, j, len1. pt;

        if (type.indexOf('multi') === -1) {
            coords = [coords];
		}
        //if (type.indexOf('point') !== -1) {
        } else if (type.indexOf('linestring') !== -1) {
            for (i = 0, len = coords.length; i < len; i++) {
				out.interval.push(out.vert.length);
				pt = vectorTiles.flattenRing(coords[i]);
				out.vert = out.vert.concat(pt);
				out.interval.push(out.vert.length);
            }
        } else if (type.indexOf('polygon') !== -1) {
            for (i = 0, len = coords.length; i < len; i++) {
                for (j = 0, len1 = coords[i].length; j < len1; j++) {
                    pt = vectorTiles.flattenRing(coords[i][j]);
                }
            }
        }
		return out;
		*/
    },

    flattenRing: function(arr) {
        var len = arr.length,
            cnt = 0,
            res = new Array(2 * len);

        for (var i = 0; i < len; i++) {
            res[cnt++] = arr[i][0];
            res[cnt++] = arr[i][1];
        }
        return res;
    },
	addTilesToLoad: function(ds, inp) {
		// options = options || {}; tilesOrder
		if (!ds.vTiles) { ds.vTiles = {}; }
		var info = ds.info,
			hostName = info.properties.hostName,
			tilesOrder = inp.tilesOrder,
			size = tilesOrder.length,
			tiles = inp.tiles,
            params = {
                ModeKey: 'tile', srs: 3857, ftc: 'osm', r: 'j', sw: 1, LayerName: inp.name
            };

		for (var i = 0, len = tiles.length; i < len; i += size) {
			var arr = tiles.slice(i, i + size),
				vKey = arr.join(':'),
				opt = arr.reduce(function(p, c, nm) { p[tilesOrder[nm]] = c; return p; }, {}),
				par = {
					key: vKey,
					params: utils.extend({}, params, opt),
					hostName: hostName,
					mapID: ds.options.mapID,
					url: '//' + hostName + '/TileSender.ashx'
				};
			ds.vTiles[vKey] = par;
			this.enqueue(par);
		}
	},
	enqueue: function(toEnqueue) {
		if (this._queue.indexOf(toEnqueue) < 0) {
			this._queue.push(toEnqueue);
			this.processQueue();
		}
	},
	processQueue: function() {
		if (this._queue.length > 0 && this._loading < this._maxCount) {
			this._loading++;
			utils.getJson(this._queue.shift())
				.then(function(res) { this._parseTile(res); }.bind(this))
				.catch(function(err) {
					log('catch', err);
					this._loading--;
					this.processQueue();
				}.bind(this));
		}
	}
};
/** версионность источников данных
*/
var layersVersion = {
	_delay: 20000,
	_intervalID: null,
	_timeoutID: null,
	_lastParams: {},
	_hosts: {},
	_layers: {},

    _getSourceParams: function(ds, options) {
		options = options || {};
		var info = ds.info,
			prop = info.properties,
			tilesKey = prop.Temporal ? 'TemporalTiles' : 'tiles',
			pt = {
				Name: options.layerID || prop.name,
				Version: tilesKey in prop || info.tiles ? prop.LayerVersion : -1
			};
		if (options.dInterval) {
			ds.dateBegin = options.dInterval[0];
			ds.dateEnd = options.dInterval[1];
		}
		if (ds.dateBegin) {
			pt.dateBegin = ds.dateBegin;
			pt.dateEnd = ds.dateEnd
		}
		return pt;
    },
    _parseResponse: function(arr, maps) {
// log('_______ _parseResponse', arr, maps);
		var hash = arr.reduce(function(p, c) {
			p[c.name] = c;
			return p;
		}, {});
        for (var mapID in maps) {
			var map = maps[mapID],
				dataSources = map.dataSources;

			for (var layerID in hash) {
				var ds = dataSources[layerID];
				if (ds) {
					var inp = hash[layerID],
						info = ds.info;
					utils.extend(info.properties, inp.properties);
					utils.extend(info.geometry, inp.geometry);
					info.tiles = inp.tiles;
					info.tilesOrder = inp.tilesOrder = inp.tilesOrder.map(function(it) {return it.toLowerCase();});
					this._update(ds);
					vectorTiles.addTilesToLoad(ds, inp);
				}
			}
		}
    },
	chkVersion: function() {
// log('chkVersion', gmx._zoom, gmx._bbox, this, this._hosts, layersVersion._intervalID, Date.now())
        for (var hostName in this._hosts) {
			var hosts = this._hosts[hostName],
				opt = {
					WrapStyle: 'None',
					layers: JSON.stringify(Object.keys(hosts).map(function(key) {return hosts[key];})),
					bbox: JSON.stringify(gmx._bbox),
					zoom: gmx._zoom,
					srs: 3857,
					ftc: 'osm'
				},
				body = utils.getFormBody(opt);
			if (this._lastParams[hostName] !== body) {
				utils.getJson({
					url: '//' + hostName + '/Layer/CheckVersion.ashx',
					params: opt
				})
				.then(function(json) {
					this._lastParams[hostName] = body;
					var res = typeof json.res === 'string' ? JSON.parse(json.res) : json.res;
					if (res.Status === 'ok' && res.Result) {
						this._parseResponse(res.Result, gmx._maps[hostName]);
					}
				}.bind(this)).catch(log);
			}
        }
    },

    _update: function(ds, options) {
		options = options || {};
		var prop = ds.info.properties,
			layerID = prop.name,
			hostName = options.hostName || prop.hostName;

		if (!this._hosts[hostName]) { this._hosts[hostName] = {}; }
		this._hosts[hostName][layerID] = this._getSourceParams(ds, options);
   },

    add: function(options) {
		var hostName = options.hostName,
			maps = gmx._maps[hostName];
        if (!maps || !maps[options.mapID] || !maps[options.mapID].dataSources[options.layerID]) { return; }
		var ds = maps[options.mapID].dataSources[options.layerID];
		this._update(ds, options);
		this.start();
		this.now();
// log('add', options, ds, this._hosts, Date.now())
    },

    remove: function(options) {
		var hostName = options.hostName;
        if (this._hosts[hostName] && this._hosts[hostName][options.layerID]) {
			delete this._hosts[hostName][options.layerID];
		}
// log('remove', options, this._hosts, Date.now())
    },

    now: function() {
		if (this._timeoutID) { clearTimeout(this._timeoutID); }
		this._timeoutID = setTimeout(this.chkVersion.bind(this), 0);
    },

    stop: function() {
        if (this._intervalID) { clearInterval(this._intervalID); }
        this._intervalID = null;
    },

    start: function(msec) {
        if (msec) {this. _delay = msec; }
        layersVersion.stop();
        this._intervalID = setInterval(this.chkVersion.bind(this), this._delay);
    }
};

var handler = new ImageHandler(self);

var cmdProxy = function(data) {
// log('__ cmd _______', cmd, options);
	var options = data.options,
		cmd = options.cmd,
		out = {url: data.src, inp: options, load: false};

	if (options.syncParams) {syncParams = options.syncParams;}

	if (cmd === 'mapProperties') {				// загрузка свойств карты
		// var out = {url: cmd, inp: options, load: false};
		gmxMapManager.loadMapProperties(options)
			.then(function(json) {
				out.load = true;
				out.res = json;
// log('mapProperties', out)
				handler.workerContext.postMessage(out);
				//log('__gmx_______', gmx);
			})
			.catch(function(err) {
				out.error = err.toString();
				handler.workerContext.postMessage(out);
			});
	} else if (cmd === 'onmoveend') {			// сменилось положение карты
		out.load = true;
		handler.workerContext.postMessage(out);
		gmx._zoom = options.zoom;				// текущий zoom карты
		gmx._bbox = options.bbox;				// текущий экран карты
		layersVersion.now();
	} else if (cmd === 'dateIntervalChanged') {
		out.load = true;
		layersVersion.add(options);
		handler.workerContext.postMessage(out);
	} else if (cmd === 'toggleDataSource') {	// включение/выключение контроль версионности источников
		if (options.active) {
			layersVersion.add(options);
		} else {
			layersVersion.remove(options);
		}
		out.load = true;
		handler.workerContext.postMessage(out);
	} else {
		log('warning: this is`t commad - this is request `', cmd, '`');
		return true;
	}

};

self.onmessage = function(evt) {
	var data = evt.data;
	if (data.src[0] === '_') {
		cmdProxy(data)
		//cmdProxy(data.options.cmd, data.options)
	} else if (data.options && data.options.options && data.options.options.type === 'json') {
		// utils.getJson(utils.extend({}, data.options, {
			// url: data.src,
			// options: data.options,
			// params: data.params
		// }));
		utils.getJson({
			url: data.src,
			send: true,
			options: data.options.options,
			params: data.options.params
		});
	} else {
		handler.enqueue(evt);
	}
};

// https://github.com/bendrucker/insert-styles/blob/master/index.js