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
            GeometryType:   divProperties.GeometryType,
            LayerID:        divProperties.LayerID,
            MetaProperties: layerProperties.MetaProperties || {},
            ShapePath:      layerProperties.ShapePath || {},
            TilePath:       layerProperties.TilePath || {},
            Name:           layerProperties.name,
            EncodeSource:   layerProperties.EncodeSource,
            SourceColumns:  layerProperties.SourceColumns,
            Columns:        layerProperties.Columns,
            TableName:      layerProperties.TableName,
            TableCS:        layerProperties.TableCS,
            SourceType:     layerProperties.SourceType || 'file',
            Geometry:       layerProperties.Geometry,
            
            Attributes:     divProperties.attributes,
            AttrTypes:      divProperties.attrTypes,
            
            MetaPropertiesEditing: null
        })
        
        this.set('RC', new nsGmx.LayerRCProperties({
            IsRasterCatalog:      divProperties.IsRasterCatalog,
            RCMinZoomForRasters:  layerProperties.RCMinZoomForRasters,
            RCMaskForRasterTitle: layerProperties.RCMaskForRasterTitle,
            RCMaskForRasterPath:  layerProperties.RCMaskForRasterPath,
            ColumnTagLinks:       layerProperties.ColumnTagLinks
        }));
        
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
        
        if (type !== 'Vector') {
            this.set("Legend", divProperties ? (divProperties.Legend || '') : (layerProperties.Legend || ''));
        }
        
        if (layerProperties.Name) {
            this.set("Name", layerProperties.Name);
        }
    },
    save: function(geometryChanged, callback) {
        var attrs = this.attributes,
            name = attrs.Name,
            mapProperties = _layersTree.treeModel.getMapProperties();
        
        var reqParams = {
            WrapStyle: "window",
            Title: attrs.Title,
            Description: attrs.Description,
            Copyright: attrs.Copyright,
            MapName: mapProperties.name
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
            if (attrs.NameObject) reqParams.NameObject = attrs.NameObject;
            if (attrs.SourceType === 'table') reqParams.TableCS = attrs.TableCS;

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

            var geomColumns = attrs.GeometryColumnsLatLng;
            if (geomColumns && geomColumns.get('XCol') && geomColumns.get('YCol')) {
                reqParams.ColX = geomColumns.get('XCol');
                reqParams.ColY = geomColumns.get('YCol');
            }
            
            if (attrs.Columns) reqParams.Columns = JSON.stringify(attrs.Columns);
            if (attrs.LayerID) reqParams.VectorLayerID = attrs.LayerID;
            
            if (!name && attrs.SourceType === 'manual')
            {
                if (attrs.UserBorder) {
                    reqParams.UserBorder = JSON.stringify(attrs.UserBorder);
                }

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
                if (attrs.SourceType !== 'manual') {
                    reqParams.GeometryDataSource = attrs.SourceType === 'file' ? attrs.ShapePath.Path : attrs.TableName;
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
            reqParams.TilePath = attrs.TilePath.Path;
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

nsGmx.LayerProperties = LayerProperties;
gmxCore.addModule('LayerProperties', {
    LayerProperties: LayerProperties,
    LatLngColumnsModel: LatLngColumnsModel
})

}();