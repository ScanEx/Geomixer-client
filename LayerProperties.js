!function($){

/** Объект, описывающий один атрибут слоя. Формат для передачи на сервер
 * @typedef {Object} nsGmx.LayerProperties.Column
 * @property {String} Name Имя атрибута
 * @property {String} OldName Исходное имя атрибута. Используется для переименования атрибутов. Для новых атрибутов это поле должно отсутствовать.
 * @property {String}  ColumnSimpleType Тип атрибута
 * @property {Boolean} IsPrimary
 * @property {Boolean} IsIdentity
 * @property {Boolean} IsComputed
*/

var LatLngColumnsModel = Backbone.Model.extend({
    defaults: {
        XCol: null,
        YCol: null
    }
});

/** Расширенный набор свойства слоя. Используется для редактирования свойств. Умеет сохранять себя на сервере
 * @class
 * @memberOf nsGmx
 * @extends Backbone.Model
 * @property {String} Type Тип слоя. Vector/Raster/MultiLayer/Virtual
 * @property {Number} LayerID Серверный ID слоя
 * @property {String} Name Уникальный неитерируемый ID слоя
 * @property {String} Title Заголовок слоя
 * @property {String} Copyright Копирайт слоя
 * @property {String} Description Описание слоя
 * @property {Object} MetaProperties Метаданные слоя
 * @property {Object} ShapePath Имеет атрибут Path. Для векторных слоёв из файла - источник слоя. Для растровых - файл с границей растра
 * @property {Object} Geometry Граница растрового слоя

 * @property {String} Legend Легенда слоя. Только для растровых слоёв

 * @property {String} NameObject Шаблон названий объектов. Только для векторных слоёв
 * @property {String} GeometryType Тип геометрии слоя. Только для векторных слоёв (point/linestring/polygon)
 * @property {nsGmx.QuicklookParams} Quicklook Параметры квиклуков. Только для векторных слоёв
 * @property {Object} TilePath Имеет атрибут Path. Путь к файлу с тайлами. Только для векторных слоёв
 * @property {String} EncodeSource Кодировка источника данных слоя. Только для векторных слоёв
 * @property {nsGmx.LayerProperties.Column[]} Columns Описание типов и названий атрибутов слоя. Только для векторных слоёв
 * @property {String} TableName Название таблицы, если источник был таблицей. Только для векторных слоёв
 * @property {String} TableCS Система координат выбранной таблицы ("EPSG:4326"/"EPSG:3395"). Только для векторных слоёв
 * @property {String} SourceType Тип источника данных для слоя (file/table/manual)
 * @property {String[]} Attributes Список имён атрибутов векторного слоя (не сохраняется)
 * @property {String[]} AttrTypes Список типов атрибутов векторного слоя (не сохраняется)
 * @property {nsGmx.LayerRCProperties} RC Параметры каталога растров. Только для векторных слоёв
 * @property {nsGmx.TemporalLayerParams} Temporal Параметры мультивременного слоя. Только для векторных слоёв
 * @property {LatLngColumnsModel} GeometryColumnsLatLng Описание выбранных в таблице колонок с геометрией
 * @property {String} ZIndexField Название поля для сортировки объектов внутри векторного слоя
*/
var LayerProperties = Backbone.Model.extend(
    /** @lends nsGmx.LayerProperties.prototype */
{
    initialize: function(attrs) {
        this.attributes = _.clone(attrs || {});
    },

    initFromViewer: function(type, divProperties, layerProperties) {

        this.set({
            Type:           type || (divProperties && divProperties.type) || (layerProperties && layerProperties.type),
            Title:          divProperties ? (divProperties.title || '') : (layerProperties.Title || ''),
            Copyright:      divProperties ? (divProperties.Copyright || '') : (layerProperties.Copyright || ''),
            Legend:         divProperties ? (divProperties.Legend || '') : (layerProperties.Legend || ''),
            Description:    divProperties ? (divProperties.description || '') : (layerProperties.Description || ''),
            NameObject:     divProperties ? (divProperties.NameObject || '') : (layerProperties.NameObject || ''),
            GeometryType:   divProperties ? divProperties.GeometryType : layerProperties.GeometryType,
            LayerID:        divProperties ? divProperties.LayerID : layerProperties.LayerID,
            ZIndexField:    divProperties ? divProperties.ZIndexField : layerProperties.ZIndexField,
            ContentID:      divProperties ? divProperties.ContentID : layerProperties.ContentID,
            ShapePath:      layerProperties.ShapePath || {},
            TilePath:       layerProperties.TilePath || {},
            Name:           layerProperties.name,
            EncodeSource:   layerProperties.EncodeSource,
            Columns:        layerProperties.Columns,
            TableName:      layerProperties.TableName,
            TableCS:        layerProperties.TableCS,
            SourceType:     layerProperties.SourceType || 'file',
            Geometry:       layerProperties.Geometry,

            Attributes:     divProperties ? divProperties.attributes : [],
            AttrTypes:      divProperties ? divProperties.attrTypes : []
        })

        var metaProperties = layerProperties.MetaProperties;
        var convertedTagValues = {};
        for (var mp in metaProperties)
        {
            var tagtype = metaProperties[mp].Type;
            convertedTagValues[mp] = {Type: tagtype, Value: nsGmx.Utils.convertFromServer(tagtype, metaProperties[mp].Value)};
        }
        this.set('MetaProperties', new nsGmx.LayerTags(convertedTagValues));

        this.set('RC', new nsGmx.LayerRCProperties({
            IsRasterCatalog:      layerProperties.IsRasterCatalog,
            RCMinZoomForRasters:  layerProperties.RCMinZoomForRasters,
            RCMaskForRasterTitle: layerProperties.RCMaskForRasterTitle,
            RCMaskForRasterPath:  layerProperties.RCMaskForRasterPath,
            ColumnTagLinks:       layerProperties.ColumnTagLinks
        }));

        divProperties = divProperties || {};

        var tempPeriods = divProperties.TemporalPeriods;
        this.set('Temporal', new nsGmx.TemporalLayerParams({
            isTemporal: !!divProperties.Temporal,
            minPeriod: tempPeriods && tempPeriods[0],
            maxPeriod: tempPeriods && tempPeriods[tempPeriods.length-1],
            maxShownPeriod: divProperties.maxShownPeriod || 0,
            columnName: divProperties.TemporalColumnName
        }));

        this.set('GeometryColumnsLatLng', new LatLngColumnsModel({
            XCol: layerProperties.GeometryXCol,
            YCol: layerProperties.GeometryYCol
        }));

        if (layerProperties.Name) {
            this.set("Name", layerProperties.Name);
        }

        var quicklookString = divProperties.Quicklook || layerProperties.Quicklook,
            quicklookParams = new nsGmx.QuicklookParams();

        quicklookParams.fromServerString(quicklookString);
        this.set('Quicklook', quicklookParams);
    },

    /** Инициализирует класс, используя информацию о слое с сервера.
     * @param {String} layerName ID слоя, информацию о котором нужно получить
     * @return {jQuery.Deferred} Deferred, который будет заполнен после инициализации класса
     */
    initFromServer: function(layerName) {
        var def = $.Deferred(),
            _this = this;

        sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?NeedAttrValues=false&LayerName=" + encodeURIComponent(layerName), function(response) {
            if (!parseResponse(response)) {
                def.reject(response);
                return;
            }

            _this.initFromViewer(null, null, response.Result);

            def.resolve();
        });

        return def.promise();
    },

    /** Сохраняет изменения в слое или создаёт новый слой на сервере
     * @param {Boolean} geometryChanged Нужно ли передавать на сервер геометрию растрового слоя
     * @param {Function} [callback] Будет вызван после получения ответа от сервера
     * @return {jQuery.Deferred} Deferred, который будет заполнен после сохранения всей информации на сервере
     */
    save: function(geometryChanged, callback, params) {
        var attrs = this.attributes,
            name = attrs.Name,
            stype = attrs.SourceType,
            def;

        var reqParams = {
            WrapStyle: "window",
            Title: attrs.Title,
            Description: attrs.Description,
            Copyright: attrs.Copyright
        };

        if (attrs.MetaProperties) {
            var metaProperties = {};
            attrs.MetaProperties.eachValid(function(id, tag, value, type)
            {
                //для неизвестных тегов присваиваем тип String
                var type = type || 'String';
                var value = nsGmx.Utils.convertToServer(type, value);
                if (value !== null) {
                    metaProperties[tag] = {Value: value, Type: type};
                }
            }, true)

            reqParams.MetaProperties = JSON.stringify(metaProperties);
        }

        if (attrs.Type === 'Vector') {
            if (attrs.EncodeSource) reqParams.EncodeSource = attrs.EncodeSource;
            reqParams.NameObject = attrs.NameObject || '';
            if (stype === 'table') reqParams.TableCS = attrs.TableCS;

            var rcProps = attrs.RC;
            reqParams.IsRasterCatalog = !!(rcProps && rcProps.get('IsRasterCatalog'));
            if (reqParams.IsRasterCatalog)
            {
                reqParams.RCMinZoomForRasters = rcProps.get('RCMinZoomForRasters');
                reqParams.RCMaskForRasterPath = rcProps.get('RCMaskForRasterPath');
                reqParams.RCMaskForRasterTitle = rcProps.get('RCMaskForRasterTitle');
                reqParams.ColumnTagLinks = JSON.stringify(rcProps.get('ColumnTagLinks'));
            }

            var tempProperties = attrs.Temporal;

            reqParams.TemporalLayer = !!(tempProperties && tempProperties.get('isTemporal') && tempProperties.get('columnName'));

            if ( reqParams.TemporalLayer ) {
                reqParams.TemporalColumnName = tempProperties.get('columnName');
                reqParams.TemporalPeriods = tempProperties.getPeriodString();
                reqParams.maxShownPeriod = tempProperties.get('maxShownPeriod');
            }

            /* отсылать на сервер колонки нужно только если это:
             * - уже созданный слой или тип слоя "Вручную",
             * - копия слоя
            */
            if (attrs.Columns && (name || stype === 'manual') || (params && params.copy)) {
                reqParams.Columns = JSON.stringify(attrs.Columns);
            }

            if (attrs.LayerID) reqParams.VectorLayerID = attrs.LayerID;

            if (attrs.Quicklook) {
                reqParams.Quicklook = attrs.Quicklook.toServerString();
                /*JSON.stringify({
                    minZoom: attrs.MinZoomQuicklooks,
                    template: attrs.Quicklook
                });*/
            } else {
                attrs.Quicklook = '';
            }

            reqParams.ZIndexField = attrs.ZIndexField || '';

            if (!name && stype === 'manual' && !(params && params.copy)) {
                reqParams.UserBorder = attrs.UserBorder ? JSON.stringify(attrs.UserBorder) : null;
                reqParams.geometrytype = attrs.GeometryType;

                def = nsGmx.asyncTaskManager.sendGmxPostRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx", reqParams);
            } else if (!name && (params && params.copy)) {
                var copyParams = {},
                    columnsList = [{Value:"[geomixergeojson]",Alias:"gmx_geometry"}];

                for (var i = 0; i < attrs.Columns.length; i++) {
                    var col = attrs.Columns[i];

                    columnsList.push({
                        Value: col.Name,
                        Alias: col.Name
                    });
                }
                reqParams.WrapStyle = "message",
                reqParams.layer = params.sourceLayerName;
                reqParams.query = params.query;
                reqParams.Columns = JSON.stringify(columnsList);
                reqParams.Title = attrs.Title;

                 def = nsGmx.asyncTaskManager.sendGmxPostRequest(serverBase + "VectorLayer/copy", reqParams);
            } else {
                //Если нет колонки с геометрией, то нужно передавать выбранные пользователем колонки
                var parsedColumns = nsGmx.LayerProperties.parseColumns(attrs.Columns);
                var geomColumns = attrs.GeometryColumnsLatLng;
                if (parsedColumns.geomCount === 0 && geomColumns && geomColumns.get('XCol') && geomColumns.get('YCol')) {
                    reqParams.ColX = geomColumns.get('XCol');
                    reqParams.ColY = geomColumns.get('YCol');
                }

                if (stype !== 'manual') {
                    reqParams.GeometryDataSource = stype === 'file' ? attrs.ShapePath.Path : attrs.TableName;
                }

                def = nsGmx.asyncTaskManager.sendGmxPostRequest(serverBase + "VectorLayer/" + (name ? "Update.ashx" : "Insert.ashx"), reqParams);
            }
        } else if (attrs.Type === 'Raster') {
            var curBorder = _mapHelper.drawingBorders.get(name);

            reqParams.Legend = attrs.Legend;
            if (attrs.TilePath.Path) reqParams.TilePath = attrs.TilePath.Path;
            reqParams.GeometryChanged = geometryChanged;

            if (geometryChanged) {
                if (typeof curBorder === 'undefined') {
                    if (attrs.ShapePath.Path) {
                        reqParams.BorderFile = attrs.ShapePath.Path;
                    } else if (typeof attrs.Geometry !== 'undefined') {
                        //может быть как null (удалили), так и undefined (не поменялась)
                        reqParams.BorderGeometry = JSON.stringify(attrs.Geometry);
                    }
                } else {
                    reqParams.BorderGeometry = JSON.stringify(L.gmxUtil.geoJSONtoGeometry(curBorder.toGeoJSON(), true));
                }
            }

            if (attrs.LayerID) reqParams.RasterLayerID = attrs.LayerID;

            def = nsGmx.asyncTaskManager.sendGmxPostRequest(serverBase + "RasterLayer/" + (name ? "Update.ashx" : "Insert.ashx"), reqParams);
        } else if (attrs.Type === 'MultiLayer') {
            var multiLayerInfo = {
                LayersChanged: false, //изменение состава слоёв пока не поддерживается
                Properties: {
                    Title: attrs.Title,
                    Description: attrs.Description
                }
            };

            if ('MetaProperties' in reqParams) {
                multiLayerInfo.Properties.MetaProperties = JSON.parse(reqParams.MetaProperties);
            }

            if (attrs.LayerID) {
                multiLayerInfo.Properties.MultiLayerID = attrs.LayerID;
            }

            var multiReqParams = {
                WrapStyle: "window",
                MultiLayerInfo: JSON.stringify(multiLayerInfo)
            }

            def = nsGmx.asyncTaskManager.sendGmxPostRequest(serverBase + "MultiLayer/" + (name ? "Update.ashx" : "Insert.ashx"), multiReqParams);
        } else if (attrs.Type === 'Virtual') {
            if (name) {
                reqParams.VectorLayerID = name;
            } else {
                reqParams.SourceType = 'Virtual';
            }

            if (attrs.ContentID) {
                reqParams.ContentID = attrs.ContentID;
            }

            reqParams.Legend = attrs.Legend || '';

            def = nsGmx.asyncTaskManager.sendGmxPostRequest(serverBase + "VectorLayer/" + (name ? "Update.ashx" : "Insert.ashx"), reqParams);
        }

        callback && def.done(callback);
        return def.promise();
    }
})

LayerProperties.parseColumns = function(columns) {
    var geomCount = 0;     //кол-во колонок с типом Геометрия
    var coordColumns = []; //колонки, которые могут быть использованы для выбора координат
    var dateColumns = [];  //колонки, которые могут быть использованы для выбора временнОго параметра

    columns = columns || [];

    for (var f = 0; f < columns.length; f++)
    {
        var type = columns[f].ColumnSimpleType.toLowerCase();
        if ( type === 'geometry')
            geomCount++;

        if ((type === 'string' || type === 'integer' || type === 'float') && !columns[f].IsIdentity && !columns[f].IsPrimary)
            coordColumns.push(columns[f].Name);

        if (type === 'date' || type === 'datetime')
            dateColumns.push(columns[f].Name);
    }

    return { geomCount: geomCount, coordColumns: coordColumns, dateColumns: dateColumns };
}

nsGmx.LayerProperties = LayerProperties;
nsGmx.LatLngColumnsModel = LatLngColumnsModel;
gmxCore.addModule('LayerProperties', {
    LayerProperties: LayerProperties,
    LatLngColumnsModel: LatLngColumnsModel
})

}(jQuery);
