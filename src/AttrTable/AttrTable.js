!(function() {

'use strict';

nsGmx.AttrTable = nsGmx.AttrTable || {};

var attrsTable = function(layerName, layerTitle)
{
	this.layerName = layerName;
	this.layerTitle = layerTitle || '';

	this.filterData = null;

	this.activeColumns = null;

	this.resizeFunc = function() {};

    this._updateVersionHandler = null;

    this._isLayerOnMap = this.layerName in nsGmx.gmxMap.layersByID;

    this.tableFields = {
        fieldsAsArray: [],
        fieldsAsHash: {},
        titleToField: {},
        init: function(fieldParams, info) {
            var _this = this;
            this.fieldsAsHash = {};
            this.titleToField = {};
            this.fieldsAsArray = [];
            if (!fieldParams) {
                this.fieldsAsArray = [info.identityField].concat(info.attributes);
                this.fieldsAsArray.forEach(function(name) {
                    _this.fieldsAsHash[name] = true;
                    _this.titleToField[name] = name;
                });
            } else {
                fieldParams.forEach(function(field) {
                    _this.fieldsAsArray.push(field.title);
                    _this.fieldsAsHash[field.title] = true;
                    _this.titleToField[field.title] = field.name;
                });
            }
        }
    };
};

attrsTable.prototype.getLayerInfo = function()
{
    return this._layerInfo;
};

attrsTable.prototype.getInfo = function(origCanvas, outerSizeProvider, params)
{
	if (!origCanvas && $('#attrsTableDialog' + this.layerName).length) {
		return;
	}

    origCanvas && $(origCanvas).empty();

	var canvas = origCanvas || nsGmx.Utils._div(null, [['attr', 'id', 'attrsTableDialog' + this.layerName], ['css', 'overflow', 'hidden']]),
		loading = nsGmx.Utils._div([nsGmx.Utils._img(null, [['attr', 'src', 'img/progress.gif'], ['css', 'marginRight', '10px']]), nsGmx.Utils._t(_gtxt('загрузка...'))], [['css', 'margin', '3px 0px 3px 20px']]),
		_this = this;

	nsGmx.Utils._(canvas, [loading]);

    if (!origCanvas)
    {
        outerSizeProvider = function() {
            return {
                width: canvas.parentNode.parentNode.offsetWidth,
                height: canvas.parentNode.offsetHeight
            };
        };

        nsGmx.Utils.showDialog(_gtxt('Таблица атрибутов слоя [value0]', this.layerTitle), canvas,
            {
                width: 820,
                height: 520,
                resizeFunc: function()
                {
                    this.resizeFunc.apply(this, arguments);
                }.bind(this),
                closeFunc: function()
                {
                    if (_this._updateVersionHandler !== null && _this._isLayerOnMap) {
                        nsGmx.gmxMap.layersByID[_this.layerName].off('versionchange', _this._updateVersionHandler);
                    }
                },
                setMinSize: false
            }
        );
    }

	sendCrossDomainJSONRequest(window.serverBase + 'Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=' + this.layerName, function(response)
	{
		if (!window.parseResponse(response)) {
			return;
		}

		loading.removeNode(true);

        _this._layerInfo = response.Result.properties;

        _this._layerColumns = [
            {Value: 'GeomIsEmpty([geomixergeojson])', Alias: '__GeomIsEmpty__'},
            {Value: '[' + response.Result.properties.identityField + ']'}
        ];

        var attrs = response.Result.properties.attributes;
        for (var k = 0; k < attrs.length; k++) {
            _this._layerColumns.push({Value: '[' + attrs[k] + ']'});
        }

		_this.drawDialog(response.Result.properties, canvas, outerSizeProvider, params);
	});
};

attrsTable.prototype._updateSearchString = function(query) {
    this._serverDataProvider.setRequests(
        window.serverBase + 'VectorLayer/Search.ashx', {layer: this.layerName, query: query, count: true},
        window.serverBase + 'VectorLayer/Search.ashx', {layer: this.layerName, query: query, columns: JSON.stringify(this._layerColumns)}
    );
};

/*
* columnsList (extracted from searchParamsManager)
*/
attrsTable.prototype.createColumnsList = function(paramsManager) {
	var _this = this,
	 	info = this._layerInfo,
	 	_activeColumns_ = '_activeColumns_' + info.name,
		paramsWidth = 300,
		columnsList = nsGmx.Utils._div(null, [['dir', 'className', 'attrsColumnsList'], ['css', 'overflowY', 'auto']]);//

	var attrTitles = this.tableFields.fieldsAsArray;
	   if (!paramsManager._activeColumns) {
			paramsManager._activeColumns = {};

				for (var i = 0; i < attrTitles.length; ++i) {
				   paramsManager._activeColumns[attrTitles[i]] = true;
				}
	   }

	   var presentColumns = false;

	   for (var key in paramsManager._activeColumns) {
		   if (paramsManager._activeColumns.hasOwnProperty(key)) {
			   if (paramsManager._activeColumns[key] === true) {
				   presentColumns = true;
				   break;
			   }
		   }
	   }

	   var showColumnsTemplate =
		   '<div class="attrs-table-show-columns-header">' +
			   '<label title="{{name}}" class="attrs-table-show-columns">' +
				   '<input type="checkbox" class="box attrs-table-show-columns-checkbox" {{#active}}checked{{/active}}></input>' +
				   '{{name}}' +
			   '</label>' +
		   '</div>';

	   var selectColumnsUI = $(Handlebars.compile(showColumnsTemplate)({
		   active: presentColumns,
		   name: (window._gtxt('Колонки') + ':')
	   })).appendTo(columnsList);

	   var rowTemplate =
		   '<label title="{{name}}" class="attrs-table-active-row">' +
			   '<input type="checkbox" class="box attrs-table-active-checkbox" {{#active}}checked{{/active}}></input>' +
			   '{{name}}' +
		   '</label>';

	   attrTitles.forEach(function(columnName) {
		   var rowUI = $(Handlebars.compile(rowTemplate)({
			   active: paramsManager._activeColumns[columnName],
			   name: columnName
		   })).appendTo(columnsList);

		   $('input', rowUI).click(function() {
			   paramsManager._activeColumns[columnName] = this.checked;
			   $(paramsManager).trigger('columnsChange');
				window.localStorage.setItem(_activeColumns_, JSON.stringify(paramsManager._activeColumns));	// сохранение активных колонок
		   });
	   });

	   $('input', selectColumnsUI).click(function() {
		   var checked = this.checked;
		   for (var key in paramsManager._activeColumns) {
			   if (paramsManager._activeColumns.hasOwnProperty(key)) {
				   paramsManager._activeColumns[key] = checked;
				   $(paramsManager).trigger('columnsChange');
				   $('input', columnsList).each(function (elem) {
					   $(this).prop('checked', checked);
				   });
			   }
		   }
	   });

	   // columnsList.onmouseleave = function () {
		//    this.style.display = 'none';
	   // }
	   return columnsList;
};

attrsTable.prototype.drawDialog = function(info, canvas, outerSizeProvider, params)
{
	var _this = this;

    var _params = $.extend({
        hideDownload: false,
        hideActions: false,
        hideRowActions: false,
        hideSearchParams: false,
        onClick: null,
        searchParamsManager: new nsGmx.AttrTable.DefaultSearchParamsManager()
        /*attributes: [] */
    }, params);
	_params.searchParamsManager._activeColumns = JSON.parse(localStorage.getItem('_activeColumns_' + info.name));		// чтение активных колонок

	var paramsWidth = 300,
		tdParams = nsGmx.Utils._td(null, [['css', 'width', paramsWidth + 'px'], ['attr', 'vAlign', 'top']]),
		tdTable = nsGmx.Utils._td(null, [['attr', 'vAlign', 'top']]),
		findObjectsButton = nsGmx.Utils.makeLinkButton(_gtxt('Найти объекты')),
		updateObjectsButton = nsGmx.Utils.makeLinkButton(_gtxt('Обновить объекты')),
		addObjectButton = nsGmx.Utils.makeLinkButton(_gtxt('Добавить объекты')),
		changeFieldsListButton = nsGmx.Utils.makeLinkButton(_gtxt('Изменить колонки')),
		oldCanvasWidth = false,
		_this = this;

    var downloadSection = $(Handlebars.compile('<div>' +
        '<span class="buttonLink attrsDownloadLink" data-format="Shape">{{i "Скачать shp"}}</span>' +
        '{{#unless isPolygon}}' +
		'<span class="buttonLink attrsDownloadLink" data-format="gpx">{{i "Скачать gpx"}}</span>' +
		'{{/unless}}' +
        '<span class="buttonLink attrsDownloadLink" data-format="csv">{{i "Скачать csv"}}</span>' +
        '<span class="buttonLink attrsDownloadLink" data-format="geojson">{{i "Скачать geojson"}}</span>' +
        '<span class="buttonLink createLayerLink">{{i "Создать слой"}}</span>' +
		'<span class="buttonLink copyObjectsLink">{{i "Копировать объекты"}}</span>' +
        '{{#if isPolygon}}<span class="buttonLink attrs-table-square-link">{{i "Рассчитать площадь"}}</span>{{/if}}' +
    '</div>')({
        isPolygon: info.GeometryType === 'polygon'
    }));

	$(findObjectsButton).addClass('attr-table-find-button');
	$(updateObjectsButton).addClass('attr-table-update-button');
	/*temp*/
	// $(updateObjectsButton).addClass('gmx-disabled');
	/*temp end*/
	$(addObjectButton).addClass('attr-table-add-button');
	$(changeFieldsListButton).addClass('attr-table-list-button');

	if (info.Access !== 'edit' && info.Access !== 'editrows') {
		$(updateObjectsButton).addClass('gmx-disabled');
		$(addObjectButton).addClass('gmx-disabled');
		$(changeFieldsListButton).addClass('gmx-disabled');
	}

    downloadSection.find('.attrsDownloadLink').click(function() {
        downloadLayer($(this).data('format'));
    });

	// создание слоя из выборки (из атрибутивной таблицы)
    downloadSection.find('.createLayerLink').click(function() {
		sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?WrapStyle=func&NeedAttrValues=false&LayerName=" + info.name, function(response) {
			if (!parseResponse(response)) {
				return;
			}

			createEditorFromSelection(response.Result);

			function createEditorFromSelection(props) {
				var query = _params.searchParamsManager.getQuery(),
					activeColumns = _params.searchParamsManager.getActiveColumns(),
					filteredColumns = [];

				// get columns list from search filter
				props.Columns.forEach(function(col) {
					if (col.Name in activeColumns && activeColumns[col.Name]) {
						filteredColumns.push(col);
					}
				})

				var parent = nsGmx.Utils._div(null, [['attr','id','new' + 'Vector' + 'Layer'], ['css', 'height', '100%']]),
					properties = {
						Title:  props.Title + ' ' + _gtxt('копия'),
						Copyright: props.Copyright,
						Description: props.Description,
						Date: props.Date,
						MetaProperties: props.MetaProperties,
						TilePath: {
							Path: ''
						},
						ShapePath: props.ShapePath,
						Columns: filteredColumns,
						IsRasterCatalog: props.IsRasterCatalog,
						SourceType: "file",
						Quicklook: props.Quicklook
					},
					dialogDiv = nsGmx.Utils.showDialog(_gtxt('Создать векторный слой'), parent, 340, 340, false, false),
					params = {
						copy: true,
						sourceLayerName: info.name,
						query: query,
						doneCallback: function(res) {
							nsGmx.Utils.removeDialog(dialogDiv);
						}
					};

				nsGmx.createLayerEditor(false, 'Vector', parent, properties, params);
			}
		});
    });

	downloadSection.find('.copyObjectsLink').click(function() {
		var copyLayerParams = {layerName: info.name, query: _params.searchParamsManager.getQuery()};
		nsGmx.ClipboardController.addItem('CopyObjects', copyLayerParams);
		window.showErrorMessage(window._gtxt("Выберите правым кликом слой в левой панели и нажмите \"Вставить объекты\""), true, window._gtxt("Объекты скопированы"));
	});

    this.tableFields.init(_params.attributes, info);

    this._serverDataProvider = new nsGmx.AttrTable.ServerDataProvider({titleToParams: $.extend(this.tableFields.titleToField, {'': '__GeomIsEmpty__'})});

    var squareLink = downloadSection.find('.attrs-table-square-link');

    new nsGmx.AttrTable.SquareCalc(squareLink, this.layerName, this._serverDataProvider, _params.searchParamsManager);

    var hostName = window.serverBase.match(/^https?:\/\/(.*)\/$/)[1];

    this._updateSearchString('');

	var searchParamsManager = _params.searchParamsManager;
	$(searchParamsManager).on({
		queryChange: function() {
			_this.offset = 0;
			_this._updateSearchString(searchParamsManager.getQuery());
		},
		columnsChange: function() {
			var columns = searchParamsManager.getActiveColumns ? searchParamsManager.getActiveColumns() : _this.tableFields.fieldsAsHash;
			for (var k in columns) {
				_this.table2.activateField(k, columns[k]);
			}
		}
	});

    var downloadLayer = function(format) {
        var activeColumns = searchParamsManager.getActiveColumns ? searchParamsManager.getActiveColumns() : _this.tableFields.fieldsAsHash,
            columnsForServer = [];

        for (var c in activeColumns) {
            if (activeColumns[c]) {
                columnsForServer.push({
                    Value: '[' + _this.tableFields.titleToField[c] + ']',
                    Alias: c
                });
            }
        }

        _mapHelper.downloadVectorLayer({
            name: _this.layerName,
            host: hostName,
            format: format,
            query: _params.searchParamsManager.getQuery(),
            columns: columnsForServer
        });
    };

	findObjectsButton.onclick = function() {
		tdParams.innerHTML = '';

		oldCanvasWidth = outerSizeProvider().width;

		searchParamsManager.drawSearchUI(tdParams, _this);

		if (tdParams.style.display === 'none') {
			tdParams.style.display = '';
		} else {
			return;
		}

		resizeFunc();
	};

   findObjectsButton.style.marginRight = '10px';

   if (info.Access === 'edit' || info.Access === 'editrows') {
	   updateObjectsButton.onclick = function() {
		   if ($(findObjectsButton).hasClass('gmx-disabled')) {
			   $(findObjectsButton).removeClass('gmx-disabled');
		   }

		   tdParams.innerHTML = '';

		   oldCanvasWidth = outerSizeProvider().width;

		   searchParamsManager.drawUpdateUI(tdParams, _this);

		   if (tdParams.style.display === 'none') {
			   tdParams.style.display = '';
		   } else {
			   return;
		   }

		   resizeFunc();
	   };
	}

   updateObjectsButton.style.marginRight = '10px';

   if (info.Access === 'edit' || info.Access === 'editrows') {
	   addObjectButton.onclick = function() {
	    new nsGmx.EditObjectControl(_this.layerName);
		};
	}

	addObjectButton.style.marginRight = '10px';

    if (_params.hideActions) {
        $(addObjectButton).hide();
	}
   if (info.Access === 'edit' || info.Access === 'editrows') {
		changeFieldsListButton.onclick = function() {
			var div;
			if (info.MultiLayerID) {
				div = $(_queryMapLayers.buildedTree).find("div[MultiLayerID='" + info.MultiLayerID + "']")[0];
			} else {
				div = $(_queryMapLayers.buildedTree).find("div[LayerID='" + info.name + "']")[0];
			}
			_mapHelper.createLayerEditor(div, false, 'attrs', div.gmxProperties.content.properties.styles.length > 1 ? -1 : 0);
		};
	}

	changeFieldsListButton.style.marginRight = '10px';

	tdParams.style.display = 'none';

	var name = 'attrsTable' + info.name;

    var attrNames = this.tableFields.fieldsAsArray;
    var fielsWidth = new Array(_params.hideRowActions ? attrNames.length : attrNames.length + 1).join('0').split('0');
    var attrNamesHash = this.tableFields.fieldsAsHash;

    _params.hideDownload && downloadSection.hide();

    this.divTable2 = nsGmx.Utils._div(null, [['css', 'overflow', 'auto'], ['dir', 'className', 'attrsTableBody']]);

	var columnsList = this.createColumnsList(_params.searchParamsManager);
	columnsList.style.display = 'none';

    var selectAllItems = nsGmx.Utils._checkbox(false, 'checkbox'),
		selectedCount = nsGmx.Utils._span([], [['attr', 'class', 'selectedCount']]),
		selectedDelete = nsGmx.Utils.makeLinkButton(_gtxt('Удалить')),
		showColumnsListButton = nsGmx.Utils.makeLinkButton(_gtxt('Показывать колонки')),
		selectedCopy = nsGmx.Utils.makeLinkButton(_gtxt('Скопировать')),
		// selectedDownload = nsGmx.Utils.makeLinkButton(_gtxt('Скачать')),
		selectedCont = nsGmx.Utils._span([
			nsGmx.Utils._t('Выбрано объектов:'),
			selectedCount,
			selectedDelete,
			selectedCopy,
			// selectedDownload
		], [['attr', 'class', 'hiddenCommands']]),
		groupBox = nsGmx.Utils._div([
			selectAllItems,
			nsGmx.Utils._span([nsGmx.Utils._t('Выделить все на странице')], [['css', 'marginLeft', '5px'], ['css', 'verticalAlign', 'top']]),
			selectedCont,
			showColumnsListButton,
			columnsList
		], [
			['attr', 'class', 'attrsSelectedCont']
		]);

	canvas.onclick = function (e) {
		if ($(showColumnsListButton).hasClass('hide-columns-list-button')) {
			$(showColumnsListButton).toggleClass('hide-columns-list-button');
			$(showColumnsListButton).html(_gtxt('Показывать колонки'))
		}

		$(columnsList).hide();
	}
	columnsList.onclick = function (e) {
		e.stopPropagation();
	}

	selectAllItems.onchange = function() {
		var table2 = _this.table2;
		table2.getVisibleItems().forEach(function(it) {
			var id = it.values[1];
			if (selectAllItems.checked) { _this._selected[id] = true; }
			else  { delete _this._selected[id]; }
		});
		chkSelectedCount();
		table2.repaint();
	};
	selectedCount.innerHTML = 0;
    this._selected = {};

	selectedDelete.onclick = function() {
		var remove = nsGmx.Utils.makeButton(_gtxt('Удалить'));
		remove.onclick = function() {
            var arr = Object.keys(_this._selected).reduce(function(p, c) {
                p.push({action: 'delete', id: c});
                return p;
            }, []);
			_mapHelper.modifyObjectLayer(_this.layerName, arr).done(function() {
				nsGmx.Utils.removeDialog(jDialog);
				clearSelected();
			});
		};

		var offset = $(selectedDelete).offset();
		var jDialog = nsGmx.Utils.showDialog(_gtxt('Удалить отмеченные объекты?'), nsGmx.Utils._div([remove], [['css', 'textAlign', 'center']]), 280, 75, offset.left + 20, offset.top - 30);
	};

	selectedCopy.onclick = function() {
		var list = '(' + Object.keys(_this._selected).join(',') + ')',
			copyLayerParams = {
				layerName: info.name,
				list: list,
				query: '[gmx_id] IN ' + list
			};
			
		nsGmx.ClipboardController.addItem('CopyObjects', copyLayerParams);
		window.showErrorMessage(list, true, window._gtxt('Объекты скопированы'));
	};

	$(showColumnsListButton).addClass('show-columns-list-button');

	showColumnsListButton.onclick = function(e) {
		e.stopPropagation();
		$(this).toggleClass('hide-columns-list-button');
		if ($(this).hasClass('hide-columns-list-button')) {
			$(this).html(_gtxt('Скрыть колонки'));
			$(columnsList).show();
		} else {
			$(this).html(_gtxt('Показывать колонки'))
			$(columnsList).hide();
		}

	}

	var manageSection = nsGmx.Utils._div([findObjectsButton, updateObjectsButton, addObjectButton, changeFieldsListButton], [['css', 'margin', '0px 0px 10px 1px']]);
    var tdTable2 = nsGmx.Utils._td([manageSection, groupBox, this.divTable2, downloadSection[0]], [['attr', 'vAlign', 'top']]);
    this.table2 = new nsGmx.ScrollTable({pagesCount: 10, limit: 20});

	this.prevLimit = this.table2.limit;
    var chkSelectedCount = function() {
		var cnt = Object.keys(_this._selected).length;
		if (cnt) {
			L.DomUtil.removeClass(selectedCont, 'hiddenCommands');
		} else {
			L.DomUtil.addClass(selectedCont, 'hiddenCommands');
		}
		selectedCount.innerHTML = cnt;
    };
    var clearSelected = function() {
		_this._selected = {};
		chkSelectedCount();
		selectAllItems.checked = false;
    };

	var drawTableItem2 = function(elem, curIndex, activeHeaders)
    {
        var tds = [];

        if (this.limit !== _this.prevLimit) {
            _this.prevLimit = this.limit;
			clearSelected();
		}

		var id = elem.values[elem.fields[info.identityField].index],
			showButton = nsGmx.Utils.makeImageButton('img/enlarge-circle.svg', 'img/enlarge-circle.svg'),
            editButton = nsGmx.Utils.makeImageButton('img/pen.svg'),
            deleteItem = nsGmx.Utils._checkbox(_this._selected[id], 'checkbox'),
            tdControl;

        if (info.Access !== 'edit' && info.Access !== 'editrows') {
            tdControl = nsGmx.Utils._td([nsGmx.Utils._div([showButton], [['css', 'width', '45px']])], [['css', 'width', '45px']]);
        } else {
            tdControl = nsGmx.Utils._td([nsGmx.Utils._div([deleteItem, showButton, editButton], [['css', 'width', '47px']])], [['css', 'width', '47px']]);
        }

        editButton.style.marginLeft = showButton.style.marginLeft = '5px';
        editButton.style.width = '12px';

        deleteItem.onchange = function() {
			if (deleteItem.checked) {
				_this._selected[id] = true;
				 // console.log(_this._selected);
			 } else {
				delete _this._selected[id];
				selectAllItems.checked = false;
			}
			chkSelectedCount();
        };

        editButton.onclick = function()
        {
            var id = elem.values[elem.fields[info.identityField].index];
            new nsGmx.EditObjectControl(_this.layerName, id);
        };

        showButton.onclick = function()
        {
            var id = elem.values[elem.fields[info.identityField].index];
            sendCrossDomainJSONRequest(window.serverBase + 'VectorLayer/Search.ashx?WrapStyle=func&layer=' + _this.layerName + '&page=0&pagesize=1&geometry=true&query=' + encodeURIComponent('[' + info.identityField + ']=' + id), function(response) {
                if (!window.parseResponse(response)) {
                    return;
				}
				var layer = nsGmx.gmxMap.layersByID[_this.layerName],
					props = layer.getGmxProperties(),
					isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.getDateInterval);

                var columnNames = response.Result.fields;
                var row = response.Result.values[0];
                for (var i = 0; i < row.length; ++i)
                {
                    if (columnNames[i] === 'geomixergeojson' && row[i])
                    {

                        var fitBoundsOptions = layer ? {maxZoom: layer.options.maxZoom} : {};

                        var geom = L.gmxUtil.geometryToGeoJSON(row[i], true);
                        var bounds = L.gmxUtil.getGeometryBounds(geom);
                        nsGmx.leafletMap.fitBounds([
                            [bounds.min.y, bounds.min.x],
                            [bounds.max.y, bounds.max.x]
                        ], fitBoundsOptions);

						if (isTemporalLayer) {
							var tempColumn = props.TemporalColumnName,
								index = columnNames.indexOf(tempColumn),
								dayms = nsGmx.DateInterval.MS_IN_DAY,
								dateBegin, dateEnd,
								datems;

							if (index !== -1) {
								datems = row[index] * 1000;
								dateBegin = nsGmx.DateInterval.toMidnight(new Date(datems));
								dateEnd = nsGmx.DateInterval.toMidnight(new Date(datems + dayms));
								nsGmx.widgets.commonCalendar.setDateInterval(dateBegin, dateEnd, layer);
							}
						}
                    }
                }
            });
        };

        nsGmx.Utils._title(deleteItem, _gtxt('Удалить'));
        nsGmx.Utils._title(editButton, _gtxt('Редактировать'));
        nsGmx.Utils._title(showButton, _gtxt('Показать'));

        $(showButton).toggle(!elem.values[elem.fields['__GeomIsEmpty__'].index]);

        if (!_params.hideRowActions) {
            tds.push(tdControl);
		}

        for (var j = 0; j < activeHeaders.length; ++j)
        {
            if (activeHeaders[j] === '') {
                continue;
			}

            var fieldName = _this.tableFields.titleToField[activeHeaders[j]];

            if (fieldName in elem.fields)
            {
                var valIndex = elem.fields[fieldName].index,
                    td = nsGmx.Utils._td();

                nsGmx.Utils._(td, [nsGmx.Utils._t(nsGmx.Utils.convertFromServer(elem.fields[fieldName].type, elem.values[valIndex]))]);

                if (elem.fields[fieldName].type === 'integer') {
                    td.style.textAlign = 'right';
				}

                tds.push(td);
            }
            else
            {
                tds.push(nsGmx.Utils._td());
            }
        }

        var tr = nsGmx.Utils._tr(tds);

        if (curIndex % 2 !== 0) {
            tr.className = 'odd';
		}

        if (_params.onClick) {
            tr.onclick = function()
            {
                _params.onClick(elem);
            };
            tr.style.cursor = 'pointer';
        }

        return tr;
    };

    var tableFields = _params.hideRowActions ? attrNames : [''].concat(attrNames);

    this.table2.setDataProvider(this._serverDataProvider);
    this.table2.createTable(this.divTable2, 'attrs', 0, tableFields, fielsWidth, drawTableItem2, $.extend(attrNamesHash, {'': true}), true);

	if (_params.searchParamsManager._activeColumns) {
		var obj = _params.searchParamsManager._activeColumns;
	   for (var key in obj) {
		   this.table2.activateField(key, obj[key]);
	   }
	}

	nsGmx.Utils._(canvas, [nsGmx.Utils._table([nsGmx.Utils._tbody([nsGmx.Utils._tr([tdParams, tdTable2])])], ['css', 'width', '100%'])]);

	var tbl = $(this.divTable2).find('#attrsTableParent')[0],
		ths = $(this).find('th');

	if (L.Browser.ie || L.Browser.gecko) {
		var lastSTop = tbl.scrollTop;
		tbl.onscroll = function() {
			var stop = this.scrollTop;
			var ths = $(this).find('th');
			if (stop < lastSTop) {
				$(ths).each(function (elem) {
					$(this).css('transitionDelay', '0s');
					$(this).css('transform', "");
				})
			}
			lastSTop = stop;
			var translate = "translate(0,"+stop+"px)";

			$(ths).each(function (elem) {
				$(this).css('transitionDelay', '0.25s');
				$(this).css('transform', translate);
			})
		};
	} else {
		tbl.onscroll = function() {
			var translate = "translate(0,"+(this.scrollTop)+"px)";
			var ths = $(this).find('th');
			$(ths).each(function (elem) {
				$(this).css('transform', translate);
			})
		};
	}

	var resizeFunc = function()
	{
		var dialogWidth = oldCanvasWidth || outerSizeProvider().width;

		oldCanvasWidth = false;

		canvas.childNodes[0].style.width = dialogWidth - 21 - 10 + 'px';
		tdTable2.style.width = dialogWidth - tdParams.offsetWidth - 21 - 10 + 'px';
		_this.divTable2.style.width = dialogWidth - tdParams.offsetWidth - 21 - 10 + 'px';

        var dialogHeight = outerSizeProvider().height;
		_this.divTable2.style.height = dialogHeight -14 - 25 - 10 - 30 + 'px';

        _this.table2.updateHeight(parseInt(_this.divTable2.style.height));
        _params.searchParamsManager.resize && _params.searchParamsManager.resize({
            width: tdParams.offsetWidth,
            height: _this.divTable2.offsetHeight
        });
	};

	this.resizeFunc = resizeFunc;

	resizeFunc();

    if (this._isLayerOnMap)
    {
        this._updateVersionHandler = function() {
            _this._serverDataProvider.serverChanged();
        };

        nsGmx.gmxMap.layersByID[this.layerName].on('versionchange', this._updateVersionHandler);
    }
};

var attrsTableHash = function()
{
	this.hash = {};
    this.hooks = [];
    this._hookID = 0;
};

attrsTableHash.prototype.create = function(name, canvas, outerSizeProvider, params)
{
    params = params || {};
    this.hooks.forEach(function(hookInfo) {
        params = hookInfo.hook(params, name) || params;
    });

	if (name in this.hash)
	{
        this.hash[name].getInfo(canvas, outerSizeProvider, params);
	}
	else
	{
        var title = nsGmx.gmxMap.layersByID[name] ? nsGmx.gmxMap.layersByID[name].getGmxProperties().title : '';
        var newAttrsTable = new attrsTable(name, title);
		newAttrsTable.getInfo(canvas, outerSizeProvider, params);

		this.hash[name] = newAttrsTable;
	}

    return this.hash[name];
};

attrsTableHash.prototype.addHook = function(paramsHook) {
    var id = 'id' + this._hookID++;
    this.hooks.push({id: id, hook: paramsHook});
    return id;
};

attrsTableHash.prototype.removeHook = function(hookID) {
    for (var i = 0; i < this.hooks.length; i++) {
        if (this.hooks[i].id === hookID) {
            this.hooks.splice(i, 1);
            return;
        }
    }
};

window.nsGmx = window.nsGmx || {};

window._attrsTableHash = new attrsTableHash();

/** Менеджер поискового интерфейса таблицы атрибутов.
    Используется в таблице атрибутов для задания кастомизированного интерфейса поиска объектов слоя.
    Генерирует события queryChange и columnsChange
  @typedef IAttrTableSearchManager
  @memberOf nsGmx
  @prop {function(container, attrTable)} render Ф-ция для отрисовки кастомизированного интерфейса в контейнере. Параметры: container, attrTable
  @prop {function(): String} getQuery Получить SQL запрос за данными
  @prop {function(): Object} getActiveColumns Получить хеш с описанием активности колонок (имя колонки -> true/false)
  @prop {function(dims)} resize Ф-ция для реакции на изменения размера диалога. dims - целевые размеры контейнера (width, height)
*/

/** Показать таблицу атрибутов векторного слоя
  @func createAttributesTable
  @memberOf nsGmx
  @param {String} layerName ID слоя
  @param {DOMElement} canvas Контейнер, куда поместить таблицу атрибутов. Если не указано, будет создан новый диалог
  @param {function} outerSizeProvider Ф-ция для определения текущих размеров контейнера. Должна возвращать объект с полями width и height. Применяется только если указан canvas.
  @param {Object} params Дополнительные параметры
  @param {Boolean} [params.hideDownload=false] Скрыть секцию с вариантами скачивания данных
  @param {Boolean} [params.hideActions=false] Скрыть секцию с добавлением объекта
  @param {Boolean} [params.hideRowActions=false] Скрыть столбец таблицы с действиями над отдельными объектами
  @param {Boolean} [params.hideSearchParams=false] Скрыть секцию с параметрами поиска
  @param {function} [params.onClick] Ф-ция, которая будет вызываться при клике на строчке таблицы. Первым параметром передаётся объект, по которому кликнули
  @param {Array} [params.attributes] Массив, определяющий, какие атрибуты показывать. Каждый элемент - объект с полями "name" (исходное название атрибута) и title (как отображать в таблице).
                 Если атрибута нет в массиве, он не будет показан в таблице. Если массив не указан, показываются все атрибуты
  @param {nsGmx.IAttrTableSearchManager} [params.searchParamsManager] Менеджер UI для поиска в таблице атрибутов
  @return Интерфейс для управления таблицей атрибутов
*/

window.nsGmx.createAttributesTable = window._attrsTableHash.create.bind(window._attrsTableHash);


/** Добавить хук для изменения параметров при вызове таблицы атрибутов
  @func addAttributesTableHook
  @memberOf nsGmx
  @param {function(params, layerName):Object} paramsHook Хук, который вызывается при каждом вызове диалога редактирования.
         Первый параметр - параметры диалога (можно модифицировать), второй - ID слоя).
  @return {String} ID добавленного хука
*/
window.nsGmx.addAttributesTableHook = function(paramsHook) {
    return window._attrsTableHash.addHook(paramsHook);
};

/** Удаляет хук параметров
  @func removeAttributesTableHook
  @memberOf nsGmx
  @param {String} hookID ID хука для удаления
*/
window.nsGmx.removeAttributesTableHook = function(hookID) {
    window._attrsTableHash.removeHook(hookID);
};

})();
