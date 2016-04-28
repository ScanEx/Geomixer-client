(function () {
    'use strict';

    var publicInterface = {
            pluginName: 'fieldsFilter',
            afterViewer: function (params) {
                if ('layerId' in params) { layerId = params.layerId; }
                new RepTable();
                
            }
        },
        serverPrefix = window.serverBase || 'http://maps.kosmosnimki.ru/',
        serverScript = serverPrefix + 'VectorLayer/Search.ashx',
        layerId = '7C8E51CA3E30414482A3CF6AB22789B6',
        titleToField = {
            'Поле': 'name',
            'Регион': 'region',
            'Хозяйство': 'farm'
        },
        panelTitle = ['Список полей'],
        bboxColumns = '[{"Value":"name"},\
            {"Value":"STEnvelopeMinX([GeomixerGeoJson])", "Alias":"xmin"},\
            {"Value":"STEnvelopeMaxX([GeomixerGeoJson])", "Alias":"xmax"},\
            {"Value":"STEnvelopeMinY([GeomixerGeoJson])", "Alias":"ymin"},\
            {"Value":"STEnvelopeMaxY([GeomixerGeoJson])", "Alias":"ymax"}]',
        fieldsWidths = ['25%', '25%', '50%'],
        currentFilters = {},
        useLayerFilter = false,
        recOptions = {
            WrapStyle: 'func',
            layer: layerId
        };

    var RepTable = function (menuObj) {
        this.items = [];

        var panel = new nsGmx.LeftPanelItem(publicInterface.pluginName + 'PanelMenu', {
            showCloseButton: false
        });
        panel.setTitle(panelTitle);

        var repDiv = L.DomUtil.create('div', 'leftPanel', L.DomUtil.get('leftPanelHeader'));
        repDiv.appendChild(panel.panelCanvas);

        var filterDiv = L.DomUtil.create('div', 'filterTableBody', panel.workCanvas),
            filterPanel = new nsGmx.LeftPanelItem(publicInterface.pluginName + 'PanelFilter', {
            showCloseButton: false
        });
        filterPanel.setTitle(['Фильтр']);
        filterDiv.appendChild(filterPanel.panelCanvas);
        this.filterCanvas = filterPanel.workCanvas;

        this.innerCanvas = L.DomUtil.create('div', 'attrsTableBody', panel.workCanvas);

        this.createRepTable();
        filterPanel.hide();
        panel.hide();

        this.resize();
        $(panel).on('changeVisibility', this.resize);
        $(filterPanel).on('changeVisibility', this.resize);
    };

    RepTable.prototype = {
        resize: function () {
            window.resizeAll();
        },

        filterFunc: function (it) {
            for (var key in currentFilters) {
                var val = currentFilters[key];
                if (val && it[key].toLowerCase().indexOf(val) !== 0) { return false; }
            }
            return true;
        },

        createTableBody: function () {
            var attrNames = Object.keys(titleToField),
                lastIndex = attrNames.length - 1,
                sortedAliaces = {},
                sortFuncs = {};

            var sortStrFun = function (_a, _b, key, dir) {
                var a = String(_a[key]).toLowerCase(), b = String(_b[key]).toLowerCase(),
                    out = a < b ? 1 : a > b ? -1 : 0;
                return dir === 1 ? out : -out;
            };
            attrNames.forEach(function (it, i) {
                sortedAliaces[it] = true;
                var fname = titleToField[it];
                sortFuncs[it] = [
                    function (_a, _b) { return sortStrFun(_a, _b, fname, 1); },
                    function (_a, _b) { return sortStrFun(_a, _b, fname, -1); }
                ];
                var inp = L.DomUtil.create('input', '', this.filterCanvas);
                if (i < lastIndex) { inp.style.width = fieldsWidths[i]; }
                L.DomEvent.on(inp, 'keyup', function (ev) {
                    currentFilters[fname] = ev.target.value.toLowerCase();
                    if (!currentFilters[fname]) { delete currentFilters[fname]; }
                    staticDataProvider.setOriginalItems(this.items);
                    staticDataProvider.filterOriginalItems(this.filterFunc);
                    if (useLayerFilter) { layer.repaint(); }
                }, this);
            }, this);

            var _this = this,
                layer = nsGmx.gmxMap.layersByID[layerId],
                layerFilterFunc = function (it) {
                    return _this.filterFunc(layer.getItemProperties(it.properties));
                };

            var div = L.DomUtil.create('div', 'chkBoxDiv', this.filterCanvas),
                chkBox = L.DomUtil.create('input', '', div),
                span = L.DomUtil.create('span', '', div);

            span.innerHTML = 'фильтрация объектов на карте';
            chkBox.type = 'checkbox';
            L.DomEvent.on(chkBox, 'change', function (ev) {
                useLayerFilter = ev.target.checked;
                if (useLayerFilter) { layer.setFilter(layerFilterFunc); }
                else { layer.removeFilter(); }
            }, this);

            var staticDataProvider = new nsGmx.ScrollTable.StaticDataProvider();
            staticDataProvider.setSortFunctions(sortFuncs);
            staticDataProvider.setOriginalItems(this.items);
            staticDataProvider.filterOriginalItems(this.filterFunc);

            var _scrollTable = new nsGmx.ScrollTable({ showFooter: true, pagesCount: 1, limit: 100 });
            _scrollTable.setDataProvider(staticDataProvider);
            _scrollTable.createTable({
                parent: this.innerCanvas,
                name: publicInterface.pluginName,
                fieldsWidths: fieldsWidths,
                fields: attrNames,
                drawFunc: function (elem, curIndex, activeHeaders) {
                    return _this._createTableRow.apply(_this, [elem, curIndex, activeHeaders]);
                },
                sortableFields: sortedAliaces,
                isWidthScroll: false
            });
            this.resize();
        },

        createRepTable: function () {
            if ('AuthManager' in nsGmx && nsGmx.AuthManager.isLogin()) {
                var _this = this;
                L.gmxUtil.requestJSONP(serverScript, L.extend({count: true}, recOptions)).then(function(response) {
                    if (response && response.Status === 'ok') {
                        var pagesize = response.Result;
                        L.gmxUtil.requestJSONP(serverScript, L.extend({pagesize: pagesize}, recOptions)).then(function(response) {
                            if (response && response.Status === 'ok') {
                                _this.items = response.Result.values.map(function (it) {
                                    return {id: it[3], name: it[0], farm: it[2], region: it[1]};
                                });
                                _this.createTableBody();
                            }
                        });
                    } else {
                        console.log('Слой <b>' + layerId + '</b> не найден');
                    }
                });
            }
        },

        _createTableRow: function (elem, curIndex, activeHeaders) {     //рисует строку scrollTable
            var _this = this,
                tr = L.DomUtil.create('tr', '');

            activeHeaders.forEach(function (it, i) {
                var td = L.DomUtil.create('td', '', tr);
                td.style.width = fieldsWidths[i];
                td.appendChild(document.createTextNode(String(elem[titleToField[it]])));
            });

            L.DomEvent.on(tr, 'click', function () {
                if (nsGmx.leafletMap.hasLayer(nsGmx.gmxMap.layersByID[layerId])) {
                    if (_this._lastCurrentField) { L.DomUtil.removeClass(_this._lastCurrentField, 'currentField'); }
                    _this._lastCurrentField = this;
                    L.DomUtil.addClass(this, 'currentField');

                    var name = this.childNodes[0].innerText;
                    L.gmxUtil.requestJSONP(serverScript, L.extend({columns: bboxColumns, query : '[name]=\'' + name + '\''}, recOptions)).then(function(response) {
                        if (response && response.Status === 'ok' && response.Result.values.length) {
                            var arr = response.Result.values[0];
                            nsGmx.leafletMap.fitBounds(new L.LatLngBounds(
                                L.Projection.Mercator.unproject({y: arr[3], x: arr[1]}),
                                L.Projection.Mercator.unproject({y: arr[4], x: arr[2]})
                            ));
                        }
                    });
                }
            }, tr);

            return tr;
        }
    };

    window.gmxCore && window.gmxCore.addModule('fieldsFilter', publicInterface, {
        css: 'style.css'
    });
})();
