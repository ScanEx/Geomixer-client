// TODO: Надо расширить кнопками таблицу
// получать названия столбцов и передавать их в таблицу
// сделать интерактивность

﻿var FieldsTableEx = function (menuObj, aliases, identityField, layerAttributes, size) {
    this.identityField = identityField;
    this.fieldsMenu = menuObj;
    this._scrollTable = new scrollTable({ showFooter: false, pagesCount: 1, limit: 2000 });
    this._loadingSpinner = _div([_img(null, [['attr', 'src', 'img/progress.gif'], ['css', 'marginRight', '10px']]), _t(_gtxt('загрузка...'))], [['css', 'margin', '3px 0px 3px 20px']]);
    this.sumFieldResult = 0;
    this.size = size || ["10%", "18%", "38%", "17%", "17%"];

    //событие на конец загрузки странички
    var that = this;
    $(this._scrollTable).on("redraw", function () {
        that._loadingSpinner.removeNode(true);
        document.getElementById("agroFieldsTableParent").hidden = false;
        that.fieldsMenu.bottomArea.style.display = "none";
        var el = that.cropListContainer.childNodes[that.cropListContainer.childNodes.length - 1];

        //удаляем последнюю запятую из списка культур
        if (el && el.textContent == ", ") {
            el.parentNode && el.parentNode.removeChild(el);
        }

        var h = (document.getElementById("agroFieldsTableBody").clientHeight + 45) + "px";
        $("#agroFieldsTableParent.scrollTable").css("max-height", h);

        //бага с расстояниями
        document.getElementById("leftPanelFields").style.marginBottom = "5px";

        if ($("#agroFieldsTableBody").height() > $("#agroFieldsTableParent .tableBody").height()) {
            $("#agroFieldsTableHeader tr td:last").css("width", "7px");
        } else {
            $("#agroFieldsTableHeader tr td:last").css("width", "1px");
        }

        //$("#agroFieldsTableParent div.tableBody").css("height", parseInt($("#agroFieldsTableParent div.tableBody").css("height")) - 15);
        resizeAll();
        //gmxAPI.map.moveTo(gmxAPI.map.getCenter()[0] + 0.0001, gmxAPI.map.getCenter()[1] + 0.0001, gmxAPI.map.getZ());
    });

    this._attrNames = [];
    this._titleToField = {};
    this._sortedAliaces = {};
    this._serverDataProvider = null;

    this.setAliases(aliases);

    this.getAttrFields(aliases);

    this._serverDataProvider = new nsGmx.AttrTable.ServerDataProvider({ titleToParams: this._titleToField });
    this._scrollTable.setDataProvider(this._serverDataProvider);

    //здесь хранятся существующие колонки
    this._existentFields = [];
    this._ready = false;

    //текущий выбранный слой
    this._layer = null;
    this._layerName = "";

    this._selectedRows = [];
    this._selectedRowsObj = {};
    this._rowsArr = [];

    //идентификатор суммы площадей
    this.areaSum = _div(null, [['dir', 'id', 'areaSum'], ['css', 'float', 'left']]);

    //надпись Выюрано полей или Всего полей
    this.selectedFields = _div(null, [['dir', 'id', 'selectedFields'], ['css', 'float', 'left']]);

    this.cropListContainer = _div(null, [['dir', 'id', 'cropList'], []]);
    this.cropList = {};

    this.fieldsCache = {};

    this._onClickListenerID;


    this._tdId = null;
};

FieldsTableEx.SelectedFieldStyle = {
    strokeStyle: "#FF9B18",
    lineWidth: 3,
    opacity: 1.0
};


FieldsTableEx.prototype.clearCache = function () {
    this.fieldsCache = {};
};

FieldsTableEx.prototype.setAliases = function (aliases) {
    if (this.identityField == "ogc_fid") {
        var inner_aliases = { "ogc_fid": "_inner_ogc_fid" };
    } else if (this.identityField == "gmx_id") {
        var inner_aliases = { "gmx_id": "gmx_id" };
    }
    for (var a in aliases) {
        inner_aliases[a] = aliases[a];
    }

    this.aliasesToParams(inner_aliases);

    //???this._scrollTable.repaint();
};

FieldsTableEx.prototype.getAttrFields = function (fields) {
    for (var i = 0; i < fields.length; i++) {
        this._attrNames.push(fields[i]);
    }
};

FieldsTableEx.prototype.outerSizeProvider = function () {
    return {
        width: this.fieldsMenu.workCanvas.parentNode.parentNode.offsetWidth,
        height: this.fieldsMenu.workCanvas.parentNode.offsetHeight
    }
};

FieldsTableEx.prototype.showFieldsTable = function (layer) {

    this.cropListContainer.innerHTML = "<b>Культуры:</b> ";
    this.cropListContainer.style.display = "block";
    for (var c in this.cropList) {
        this.cropList[c] = null;
    }
    this.cropList = {};


    this._ready = false;
    this._layer = layer;
    this._layerName = layer.name;

    this._serverDataProvider.setRequests(
        serverBase + 'VectorLayer/Search.ashx', { layer: layer.name, query: "", count: true },
        serverBase + 'VectorLayer/Search.ashx', { layer: layer.name, query: "" }
    );

    var that = this;

    this.fieldsMenu.createPanel();
    this.fieldsMenu.setCaption(layer.title);
    this.fieldsMenu.setOnClose(function () {
        that.clear();
        that.removeAllSelection();
    });

    this._scrollTable.createTable({
        "parent": this.fieldsMenu.innerCanvas,
        "name": 'agroFields',
        "fieldsWidths": this.size,
        "fields": this._attrNames,
        "drawFunc": function (elem, curIndex, activeHeaders) {
            that._getExistentFields(elem.fields);
            return that._createTableRow.apply(that, [elem, curIndex, activeHeaders]);
        },
        "sortableFields": this._sortedAliaces,
        isWidthScroll: false
    });

    resizeAll();

    this.fieldsMenu.workCanvas.appendChild(this._loadingSpinner);
    document.getElementById("agroFieldsTableParent").hidden = true;

    var that = this;
    ($("#agroFieldsTableHeader").find("span.buttonLink")).click(function (e) {
        that._rowsArr.length = 0;
        that.sumFieldResult = 0;
    });


    // this.fieldsMenu.bottomArea.appendChild(this.cropListContainer);

    // this.fieldsMenu.bottomArea.appendChild(this.selectedFields);

    this._removeBlocked = false;
    this.fieldsMenu.bottomArea.onclick = function () {
        if (!that._removeBlocked) {
            that.removeAllSelection();
        }
    };

    this.fieldsMenu.bottomArea.style.display = "none";
    // this.fieldsMenu.bottomArea.appendChild(this.areaSum);

    //Добавляем кнопки для скачивания
    // var downloadCsv = this.createDownloadButton("csv", layer, "csv"),
    //     downloadXls = this.createDownloadButton("еxcel", layer, "excel");

    //var ck = _div(null, [['css', 'float', 'right'], ['css', 'padding-left', '10px'], ['css', 'font-size', '12px']]);
    //ck.innerHTML = "Скачать:";
    //ck.classList.add("floatRight_FFbug");
    //var comma = _div(null, [['css', 'float', 'right'], ['css', 'padding-left', '0px'], ['css', 'font-size', '12px']]);
    //comma.innerHTML = ",";
    //comma.classList.add("floatRight_FFbug");
    //_(this.fieldsMenu.bottomArea, [ck, downloadCsv, comma, downloadXls]);
    // this.fieldsMenu.bottomArea.appendChild(downloadCsv, downloadXls);

    var that = this;
    this._stylesData = [];
    //var l = gmxAPI.map.layers[this._layer.name]
    var l = nsGmx.gmxMap.layersByID[this._layer.name];

    styleHookManager.addStyleHook(l, "qwerty", function (data) {
        if (that._selectedRows.indexOf(data.id) != -1) {
            return FieldsTableEx.SelectedFieldStyle;
        }
    }, 200);

    this._onClickListenerID = function (feature) {
        if (feature.originalEvent.ctrlKey) {
            var fRow;
            var rows = that._rowsArr;
            var i = rows.length;
            while (i--) {
                if (rows[i][that.identityField] == feature.gmx.id) {
                    fRow = rows[i];
                    break;
                }
            }
            that._singleSelection(fRow);
            that.refreshSelectedAreaSum();
            that.refreshSelection();
        }
    };
    l.on("click", this._onClickListenerID);

    $("#agroFieldsTableParent .tableBody").mCustomScrollbar();
    $("#agroFieldsTableParent .tableBody table").css("table-layout", "fixed");
    $("#agroFieldsTableHeader table").css("table-layout", "fixed");

    $("#agroFieldsTableHeader table tr td:first").css("border-left", "none");
    $(".attrsTableBody .tableBody").css("overflow", "hidden");

    //заголовки белым
    $("#agroFieldsTableHeader td").css("background", "white");

    //$(".leftTitle").css("background", "white");
    $("#leftPanelFields .leftTitle").css("background", "white");

    //сдвинем таблицу, чтобы убрать серый сдвиг справа
    $("#agroFieldsTableParent").find(".mCSB_container")[0].style.left = "-1px";
    $("#agroFieldsTableParent").parent().css("background-color", "white");

    setTimeout(function () {
        var b = l.getBounds();
        nsGmx.leafletMap.fitBounds(b);
        l.repaint();
    }, 100);

    $("#agroFieldsTableParent.scrollTable").css("max-height", "");

    //подгоним размер скролинга под размер окна, чтобы все строчки таблицы помещались
    $("#agroFieldsTableParent div.tableBody").css("height", parseInt($("div.tableBody").css("height")) - 5);

    resizeAll();
};

FieldsTableEx.prototype.removeListeners = function () {
    nsGmx.gmxMap.layersByID[this._layer.name].off("click", this._onClickListenerID);
};

FieldsTableEx.prototype.createDownloadButton = function (text, layer, format) {
    var div = _div(null, [['dir', 'id', 'download_' + format], ['css', 'float', 'right'], ['css', 'padding-left', '5px']]);
    var btn = _span(null);
    btn.classList.add("buttonLink");
    btn.innerHTML = text;
    btn.style.fontSize = "12px";

    var that = this;
    btn.onclick = function () {
        window.getSelection().removeAllRanges();

        //Подготавливаем алиасы!
        var columns = [];

        sendCrossDomainPostRequest(serverBase + "DownloadLayer.ashx", {
            t: layer.name,
            format: format,
            name: FieldsTableEx.normalizeName(layer.title),
            columns: JSON.stringify(columns)
        });

        that._removeBlocked = true;
        setTimeout(function () {
            that._removeBlocked = false;
        }, 100);
    };
    div.appendChild(btn);

    return div;
};

FieldsTableEx.prototype._getExistentFields = function (fields) {
    if (!this._ready) {
        this._existentFields.length = 0;
        for (var f in fields) {
            this._existentFields.push(f);
        };
        this._ready = true;
    }
};

FieldsTableEx.normalizeName = function (str) {
    var reg = new RegExp('([a-zа-я0-9]+)', 'gi');
    var arr = str.match(reg);
    var res = "";
    for (var i = 0; i < arr.length; i++) {
        res += arr[i];
        if (i != arr.length - 1) {
            res += "_";
        }
    }
    return res;
};

//содает td'шки для tr элемента таблицы(используется в _createTableRow)
FieldsTableEx.prototype._createTableTd = function (elem, activeHeaders) {

    var tds = [];

    for (var j = 0; j < activeHeaders.length; ++j) {

        var td = _td();
        td.style.width = this.size[j];

        if (activeHeaders[j] == "" /*||
            // activeHeaders[j] == FieldsTableEx.INNER_OGC_FID*/)
            continue;

        var fieldName = this._titleToField[activeHeaders[j]];

        var exact = "num";

        if (elem.fields.field_id) {
            exact = "field_id";
        } else if (!elem.fields.Num && !elem.fields.num) {
            exact = this._layer.identityField;
        }

        if (fieldName.toLowerCase() == "num" && exact == this._layer.identityField) {
            fieldName = this._layer.identityField;
        }

        if (fieldName in elem.fields) {
            var valIndex = elem.fields[fieldName].index;

            var innerTd = elem.values[valIndex];


            if (fieldName.toLowerCase() == exact) {
                var div = document.createElement('div');
                div.innerHTML = innerTd;
                div.style.color = "black";
                div.style.textDecoration = "underline";
                div.classList.add("buttonLink_important");

                var that = this;
                div.onmouseover = function () {
                    that._onZoomBtnOver = true;
                };
                div.onmouseleave = function () {
                    that._onZoomBtnOver = false;
                };
                td.appendChild(div);

                td.onclick = function () {

                    if (!that._onZoomBtnOver) {
                        if (that._selectedRows.length > 1) {
                            that.removeAllSelection();
                        }
                    }

                    that._tdId = this.parentNode.index;
                    //приблизиться к выбранному полю
                    that.zoomToTheField(elem.values[elem.fields[that._layer.identityField].index]);

                    setTimeout(function () {
                        that._tdId = null;
                    });
                };

            } else {
                td.appendChild(_t(nsGmx.Utils.convertFromServer(elem.fields[fieldName].type, innerTd)));
            }

            if (elem.fields[fieldName].type == 'integer')
                td.style.textAlign = 'right';

            td.style.overflowX = "hidden";
            td.style.textOverflow = "eclipsis";
            tds.push(td);
        }
        else {
            if (fieldName.toLowerCase() == "buttons") {
                $(td).addClass('buttons');

                var zoomToBoxButton = nsGmx.Utils.makeImageButton('../img/zoom_to_level_tool_small.png', '../img/zoom_to_level_tool_small.png');
                var recycleButton = nsGmx.Utils.makeImageButton('../img/recycle.png', '../img/recycle.png');
                var traceButton = nsGmx.Utils.makeImageButton('../img/edit.png', '../img/edit.png');

                $(zoomToBoxButton).addClass('detection-button');
                $(recycleButton).addClass('detection-button');
                $(traceButton).addClass('detection-button');

                $(zoomToBoxButton).css('margin-right', '10px');
                $(recycleButton).css('margin-right', '10px');
                $(traceButton).css('margin-right', '10px');

                nsGmx.Utils._title(zoomToBoxButton, 'zoomToBoxButton');
                nsGmx.Utils._title(recycleButton, 'recycleButton');
                nsGmx.Utils._title(traceButton, 'traceButton');

                td.appendChild(zoomToBoxButton);
                td.appendChild(recycleButton);
                td.appendChild(traceButton);

                td.onclick = function (e) {


                    if (that._selectedRows.length > 1) {
                        that.removeAllSelection();
                    }

                    that._tdButtons = this.parentNode.index;

                    // функция-обработчик
                    console.log(e);
                    console.log(e.target);

                    setTimeout(function () {
                        that._tdButtons = null;
                    });
                };
            }

            tds.push(td);
        }
    }

    return tds;
};

// рисует строку scrollTable
FieldsTableEx.prototype._createTableRow = function (elem, curIndex, activeHeaders) {
    var tr = _tr(this._createTableTd(elem, activeHeaders));

    tr[this.identityField] = elem.values[elem.fields[this.identityField].index];
    tr.index = this._rowsArr.length;
    this._rowsArr.push(tr);

    if (this.sumField) {
        var ind = elem.fields[this.sumField];
        if (ind) {
            var val = elem.values[ind.index];
            tr.sumFieldValue = !isNaN(val) ? val : 0.0;
            this.sumFieldResult += tr.sumFieldValue;
        }
    }

    if (curIndex % 2 != 0)
        tr.className = 'myOddGrey';
    else
        tr.className = 'myOddWhite';

    //убираем системное выделение
    tr.classList.add("disable-select");

    if (~this._selectedRows.indexOf(tr[this.identityField])) {
        tr.classList.add("selected");
        tr.selected = true;
    } else {
        tr.selected = false;
    }

    var clickHandler = [];
    var that = this;
    tr.onclick = function (e) {

        if (that._tdId != null) {
            return;
        }

        if (that._tdButtons != null) {
            return;
        }

        if (this.index == that._tdId && this.selected) {
            return;
        }

        if (this.index == that._tdButtons && this.selected) {
            return;
        }

        var that2 = this;
        clickHandler.push(setTimeout(function () {
            that._onTableRowClick(elem, e, that2);
        }, 10));
    };

    tr.ondblclick = function (e) {
        for (var i = 0; i < clickHandler.length; i++) {
            clearTimeout(clickHandler[i]);
        }
        clickHandler.length = 0;
    };

    tr.style.cursor = 'pointer';

    return tr;
};

FieldsTableEx.prototype.zoomToTheField = function (ogc_fid) {
    var that = this;
    this.fieldGeometryRequest(ogc_fid, this._layer, function (field) {
        //var bounds = getBounds(field.geometry.coordinates);
        var bounds = L.gmxUtil.getGeometryBounds(field.geometry);
        var minll = L.Projection.Mercator.unproject(bounds.min);
        var maxll = L.Projection.Mercator.unproject(bounds.max);
        bounds = L.latLngBounds(minll, maxll);
        nsGmx.leafletMap.fitBounds(bounds);

        //globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
        setTimeout(function () {
            that.refreshSelection();
        }, 200);
    });
};

FieldsTableEx.prototype.refreshSelection = function () {
    //var l = gmxAPI.map.layers[this._layer.name];
    //l.addItems([]);
    var l = nsGmx.gmxMap.layersByID[this._layer.name];
    l.repaint();
};

FieldsTableEx.prototype.clear = function () {
    //var l = gmxAPI.map.layers[this._layer.name];
    var l = nsGmx.gmxMap.layersByID[this._layer.name];
    //l.removeStyleHook();
    styleHookManager.removeStyleHook(l, "qwerty");
    this.removeListeners();
    this._layerName = "";
};

FieldsTableEx.prototype.removeAllSelection = function () {
    for (var i = 0; i < this._rowsArr.length; i++) {
        var ri = this._rowsArr[i];
        if (ri.selected) {
            this.removeRowSelection(ri);
        }
    }
    this.refreshSelection();
};

FieldsTableEx.prototype._onTableRowClick = function (elem, e, sender) {

    if (!e.ctrlKey && !e.shiftKey && !this._selectedRows.length) {
        this._singleSelection(sender);
    } else if (e.ctrlKey && !e.shiftKey ||
        e.ctrlKey && e.shiftKey && !this._selectedRows.length) {
        this._singleSelection(sender);
    } else if (e.shiftKey) {
        this._groupSelection(sender);
    } else if (!e.ctrlKey && !e.shiftKey) {
        this._singleSelection(sender);
        if (this._selectedRows.length >= 1) {
            this.removeAllSelection();
            this._singleSelection(sender);
        }
    }

    //считаем сумму выделенных строк
    this.refreshSelectedAreaSum();

    //перерисовываем слой
    this.refreshSelection();
};

FieldsTableEx.prototype.refreshSelectedAreaSum = function () {
    if (this.sumField && this._selectedRows.length) {
        var sum = 0;
        var count = 0;
        for (var r in this._selectedRowsObj) {
            sum += this._selectedRowsObj[r].sumFieldValue;
            count++;
        }
    } else {
    }
};

FieldsTableEx.prototype._singleSelection = function (tr) {
    if (tr.classList.contains("selected")) {
        this.removeRowSelection(tr);
    } else {
        this.setRowSelected(tr);
    }
};

FieldsTableEx.prototype._groupSelection = function (tr) {

    if (tr.selected) {
        this.removeRowSelection(tr);
    } else {
        //последний выделенный
        var lastSelected_fid = this._selectedRows[this._selectedRows.length - 1];
        var i = 0;
        var first = -1, last = -1;
        do {
            var ri = this._rowsArr[i];
            if (ri[this.identityField] == lastSelected_fid) first = i;
            if (ri[this.identityField] == tr[this.identityField]) last = i;
            i++;
        } while (first == -1 || last == -1);

        if (first > last) {
            first = first ^ last;
            last = first ^ last;
            first = first ^ last;
        }

        for (var i = first; i <= last; i++) {
            var ri = this._rowsArr[i];
            if (!ri.selected) {
                this.setRowSelected(ri);
            }
        }
    }
};

FieldsTableEx.prototype.removeRowSelection = function (row) {
    row.classList.remove("selected");
    var removeId = this._selectedRows.indexOf(row[this.identityField]);
    this._selectedRows.splice(removeId, 1);
    delete this._selectedRowsObj[row[this.identityField]];
    row.selected = false;
};

FieldsTableEx.prototype.setRowSelected = function (row) {
    row.selected = true;
    this._selectedRows.push(row[this.identityField]);
    this._selectedRowsObj[row[this.identityField]] = row;
    row.classList.add("selected");
};

FieldsTableEx.prototype.aliasesToParams = function (aliases) {
    this._attrNames = [];
    this._titleToField = {};
    this._sortedAliaces = {};

    for (var a in aliases) {
        this._attrNames.push(aliases[a]);
        this._titleToField[aliases[a]] = a;
        this._sortedAliaces[aliases[a]] = true;
    }
};

FieldsTableEx.READY = 5;
FieldsTableEx.LOADING = 2;
FieldsTableEx.EMPTY = 0;

FieldsTableEx.prototype.fieldGeometryRequest = function (ogc_fid, layer, callback) {

    if (!this.fieldsCache[ogc_fid]) {
        this.fieldsCache[ogc_fid] = { "ogc_fid": ogc_fid, "geometry": null, "status": FieldsTableEx.LOADING };

        var that = this;
        sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + layer.name + "&page=0&pagesize=1&geometry=true&query=" + encodeURIComponent("[" + layer.identityField + "]=" + ogc_fid),
            function (response) {
                if (!parseResponse(response))
                    return;
                var row = response.Result.values[0];
                var i = response.Result.fields.indexOf("geomixergeojson");
                if (i != -1) {
                    var geom = row[i];//from_merc_geometry(row[i]);
                    var f = { "ogc_fid": ogc_fid, "geometry": geom, "status": FieldsTableEx.READY };
                    that.fieldsCache[ogc_fid] = f;
                    if (callback)
                        callback.call(that, f);
                }
            });
    } else if (this.fieldsCache[ogc_fid].status == FieldsTableEx.READY) {
        if (callback)
            callback.call(that, this.fieldsCache[ogc_fid]);
    }
};
