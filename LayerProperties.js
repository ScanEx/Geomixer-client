!function($){

var LatLngColumnsModel = Backbone.Model.extend({
    defaults: {
        XCol: null,
        YCol: null
    }
});

// Расширенный набор свойства слоя. 
// Используется для редактирования свойств. Умеет сохранять себя на сервере
var LayerProperties = Backbone.Model.extend({
    initialize: function(attrs) {
        this.attributes = nsGmx._.clone(attrs || {});
    },
    
    initFromViewer: function(type, divProperties, layerProperties) {
            
        this.set({
            Type:           type,
            Title:          divProperties ? (divProperties.title || '') : (layerProperties.Title || ''),
            Copyright:      divProperties ? (divProperties.Copyright || '') : (layerProperties.Copyright || ''),
            Legend:         divProperties ? (divProperties.Legend || '') : (layerProperties.Legend || ''),
            Description:    divProperties ? (divProperties.description || '') : (layerProperties.Description || ''),
            NameObject:     divProperties ? (divProperties.NameObject || '') : (layerProperties.NameObject || ''),
            AllowSearch:    divProperties ? (divProperties.AllowSearch || false) : (layerProperties.AllowSearch || false),
            GeometryType:   divProperties ? divProperties.GeometryType : layerProperties.GeometryType,
            LayerID:        divProperties ? divProperties.LayerID : layerProperties.LayerID,
            Quicklook:      divProperties ? divProperties.Quicklook : layerProperties.Quicklook,
            MetaProperties: layerProperties.MetaProperties || {},
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
            AttrTypes:      divProperties ? divProperties.attrTypes : [],
            
            
            MetaPropertiesEditing: null
        })
        
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
    },
    
    initFromServer: function(layerName) {
        var def = $.Deferred(),
            _this = this;
        
        sendCrossDomainPostRequest(serverBase + "Layer/GetLayerInfo.ashx?WrapStyle=func&NeedAttrValues=false&LayerName=" + layerName, function(response) {
            if (!parseResponse(response)) {
                def.reject(response);
                return;
            }
            
            _this.initFromViewer('Vector', null, response.Result);
            
            ref.resolve();
        });
        
        return def.promise();
    },
    
    save: function(geometryChanged, callback) {
        var attrs = this.attributes,
            name = attrs.Name,
            stype = attrs.SourceType;
        
        var reqParams = {
            WrapStyle: "window",
            Title: attrs.Title,
            Description: attrs.Description,
            Copyright: attrs.Copyright
        };
        
        var metaProperties = {};
        var layerTags = attrs.MetaPropertiesEditing;
        if (layerTags) {
            layerTags.eachValid(function(id, tag, value)
            {
                var type = layerTags.getTagMetaInfo().getTagType(tag);
                var value = nsGmx.Utils.convertToServer(type, value);
                if (value !== null)
                    metaProperties[tag] = {Value: value, Type: type};
            })
        }
            
        reqParams.MetaProperties = JSON.stringify(metaProperties);
                
        if (attrs.Type === 'Vector') {
            if (attrs.EncodeSource) reqParams.EncodeSource = attrs.EncodeSource;
            reqParams.NameObject = attrs.NameObject || null;
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

            
            var parsedColumns = nsGmx.LayerProperties.parseColumns(attrs.Columns);
            
            //отсылать на сервер колонки нужно только если это уже созданный слой или тип слоя "Вручную"
            if (attrs.Columns && (name || stype === 'manual')) {
                reqParams.Columns = JSON.stringify(attrs.Columns);
            }
            
            if (attrs.LayerID) reqParams.VectorLayerID = attrs.LayerID;
            reqParams.Quicklook = attrs.Quicklook || null;
            
            if (!name && stype === 'manual')
            {
                reqParams.UserBorder = attrs.UserBorder ? JSON.stringify(attrs.UserBorder) : null;
                reqParams.geometrytype = attrs.GeometryType;
                        
                sendCrossDomainPostRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx", reqParams,
                    function(response)
                    {
                        if (!parseResponse(response))
                            return;
                        
                        callback && callback(response);
                    }
                )
            }
            else
            {
                //Если нет колонки с геометрией, то нужно передавать выбранные пользователем колонки
                var geomColumns = attrs.GeometryColumnsLatLng;
                if (parsedColumns.geomCount === 0 && geomColumns && geomColumns.get('XCol') && geomColumns.get('YCol')) {
                    reqParams.ColX = geomColumns.get('XCol');
                    reqParams.ColY = geomColumns.get('YCol');
                }
            
                if (stype !== 'manual') {
                    reqParams.GeometryDataSource = stype === 'file' ? attrs.ShapePath.Path : attrs.TableName;
                }
                        
                sendCrossDomainPostRequest(serverBase + "VectorLayer/" + (name ? "Update.ashx" : "Insert.ashx"), reqParams,
                    function(response)
                    {
                        if (!parseResponse(response))
                            return;
                                
                        callback && callback(response);
                    }
                )
            }
        } else {
            var curBorder = _mapHelper.drawingBorders.get(name);
            
            reqParams.Legend = attrs.Legend;
            if (attrs.TilePath.Path) reqParams.TilePath = attrs.TilePath.Path;
            reqParams.GeometryChanged = geometryChanged;
            
            if (typeof curBorder === 'undefined') {
                reqParams.BorderFile = attrs.ShapePath.Path || '';
            } else {
                reqParams.BorderGeometry = JSON.stringify(merc_geometry(curBorder.geometry));
            }
            
            if (attrs.LayerID) reqParams.RasterLayerID = attrs.LayerID;
            
            sendCrossDomainPostRequest(serverBase + "RasterLayer/" + (name ? "Update.ashx" : "Insert.ashx"), reqParams, function(response)
                {
                    if (!parseResponse(response))
                        return;
                
                    callback && callback(response);
                }
            )
        }
    }
})

LayerProperties.parseColumns = function(columns) {
    var geomCount = 0; //кол-во колонок с типом Геометрия
    var coordColumns = []; //колонки, которые могут быть использованы для выбора координат
    var dateColumns = []; //колонки, которые могут быть использованы для выбора временнОго параметра
        
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
gmxCore.addModule('LayerProperties', {
    LayerProperties: LayerProperties,
    LatLngColumnsModel: LatLngColumnsModel
})

}();