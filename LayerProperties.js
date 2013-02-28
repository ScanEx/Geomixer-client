!function($){

var ColumnsModel = Backbone.Model.extend({
    defaults: {
        XCol: null,
        YCol: null
    }
});

var LayerProperties = Backbone.Model.extend({
    initialize: function(type, divProperties, layerProperties) {
        if (!divProperties && !layerProperties) {
            this.attributes = nsGmx._.clone(type);
            return;
        }
            
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
            TableName:      layerProperties.TableName,
            TableCS:        layerProperties.TableCS,
            SourceType:     layerProperties.SourceType || 'file',
            Geometry:       layerProperties.Geometry,
            
            Attributes:     divProperties.attributes,
            AttrTypes:      divProperties.attrTypes,
            
            UserAttr:              null,
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
            columnName: divProperties.TemporalColumnName
        }));
        
        this.set('SelectedColumns', new ColumnsModel({
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
        //var _params = $.extend({addToMap: true, doneCallback: null}, params);
        var layerProperties = this;
        var mapProperties = _layersTree.treeModel.getMapProperties();
        var metaProperties = {};
        var layerTags = layerProperties.get('MetaPropertiesEditing');
            layerTags.eachValid(function(id, tag, value)
            {
                var type = layerTags.getTagMetaInfo().getTagType(tag);
                var value = nsGmx.Utils.convertToServer(type, value);
                if (value !== null)
                    metaProperties[tag] = {Value: value, Type: type};
            })
            
        var metadataString = '&MetaProperties=' + encodeURIComponent(JSON.stringify(metaProperties));
                
        if (layerProperties.get('Type') === 'Vector') {
            var cols = '',
                updateParams = '',
                encoding = layerProperties.get('EncodeSource') ? '&EncodeSource=' + encodeURIComponent(layerProperties.get('EncodeSource')) : '',
                layerTitle = layerProperties.get('Title'),
                        temporalParams = '',
                tableCSParam = layerProperties.get('SourceType') === 'table' ? '&TableCS=' + encodeURIComponent(layerProperties.get('TableCS')) : '',
                        RCParams = '',
                nameObjectParams = layerProperties.get('NameObject') ? '&NameObject=' + encodeURIComponent(layerProperties.get('NameObject')) : '';
                    
            rcProps = layerProperties.get('RC');
                        
            if (rcProps.get('IsRasterCatalog'))
            {
                RCParams = '&IsRasterCatalog=true';
                RCParams += '&RCMinZoomForRasters=' + encodeURIComponent(rcProps.get('RCMinZoomForRasters'));
                RCParams += '&RCMaskForRasterPath=' + encodeURIComponent(rcProps.get('RCMaskForRasterPath'));
                RCParams += '&RCMaskForRasterTitle=' + encodeURIComponent(rcProps.get('RCMaskForRasterTitle'));
                RCParams += '&ColumnTagLinks=' + encodeURIComponent(JSON.stringify(rcProps.get('ColumnTagLinks')));
            }
            else
            {
                RCParams = '&IsRasterCatalog=false';
            }
                    
            var tempProperties = layerProperties.get('Temporal');
            if ( tempProperties.get('isTemporal') && tempProperties.get('columnName') ) {
                temporalParams = '&TemporalLayer=true'
                      + '&TemporalColumnName=' + encodeURIComponent(tempProperties.get('columnName'))
                      + '&TemporalPeriods=' + encodeURIComponent(tempProperties.getPeriodString());
            } else {
                temporalParams = '&TemporalLayer=false';
            }
                    
            var selectedColumns = layerProperties.get('SelectedColumns');
            if (selectedColumns.get('XCol') && selectedColumns.get('YCol')) {
                cols = '&ColY=' + encodeURIComponent(selectedColumns.get('YCol')) 
                     + '&ColX=' + encodeURIComponent(selectedColumns.get('XCol'));
            }
                    
            if (layerProperties.get('LayerID'))
            {
                updateParams = '&VectorLayerID=' + layerProperties.get('LayerID');
            }
                    
            if (!layerProperties.get('Name') && layerProperties.get('SourceType') === 'manual')
            {
                var sourceColumns = layerProperties.get('SourceColumns');
                columnsString = "&Columns=" + encodeURIComponent(JSON.stringify(sourceColumns));

                var geomType = layerProperties.get('GeometryType');
                        
                sendCrossDomainJSONRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx?WrapStyle=func" + 
                    "&Title=" + encodeURIComponent(layerProperties.get('Title')) + 
                    "&Copyright=" + encodeURIComponent(layerProperties.get('Copyright')) + 
                    "&Description=" + encodeURIComponent(layerProperties.get('Description')) + 
                    "&MapName=" + encodeURIComponent(mapProperties.name) + 
                    columnsString + temporalParams +
                    "&geometrytype=" + geomType +
                    metadataString +
                    RCParams + nameObjectParams, 
                    function(response)
                    {
                        if (!parseResponse(response))
                            return;
                        
                        callback && callback(response);
                    }
                );
            }
            else
            {
                var dataSource = layerProperties.get('SourceType') === 'file' ? layerProperties.get('ShapePath').Path :  layerProperties.get('TableName');
                var geometryDataSource = "&GeometryDataSource=" + encodeURIComponent(dataSource);
                        
                sendCrossDomainJSONRequest(serverBase + "VectorLayer/" + (layerProperties.get('Name') ? "Update.ashx" : "Insert.ashx") + "?WrapStyle=func" + 
                    "&Title=" + encodeURIComponent(layerProperties.get('Title')) + 
                    "&Copyright=" + encodeURIComponent(layerProperties.get('Copyright')) + 
                    "&Description=" + encodeURIComponent(layerProperties.get('Description')) + 
                    geometryDataSource + 
                    "&MapName=" + encodeURIComponent(mapProperties.name) + 
                    cols + updateParams + encoding + temporalParams + metadataString + tableCSParam + RCParams + nameObjectParams, 
                    function(response)
                    {
                        if (!parseResponse(response))
                            return;
                                
                        callback && callback(response);
                    }
                )
            }
        } else {
            var name = layerProperties.get('Name');
            var curBorder = _mapHelper.drawingBorders.get(name);
            var params = {
                    WrapStyle: "window",
                    Title: layerProperties.get('Title'),
                    Copyright: layerProperties.get('Copyright'),
                    Legend: layerProperties.get('Legend'),
                    Description: layerProperties.get('Description'),
                    TilePath: layerProperties.get('TilePath').Path,
                    BorderFile:     typeof curBorder == 'undefined' ? (layerProperties.get('ShapePath').Path || '') : '',
                    BorderGeometry: typeof curBorder == 'undefined' ? '' : JSON.stringify(merc_geometry(curBorder.geometry)),
                    MapName: mapProperties.name,
                    MetaProperties: JSON.stringify(metaProperties)
                },
                needRetiling = false
            
            if (name)
            {
                params["RasterLayerID"] = layerProperties.get('LayerID');
                
                
            }
            
            params["GeometryChanged"] = geometryChanged;
            
            sendCrossDomainPostRequest(serverBase + "RasterLayer/" + (name ? "Update.ashx" : "Insert.ashx"), params, function(response)
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
    ColumnsModel: ColumnsModel
})

}();