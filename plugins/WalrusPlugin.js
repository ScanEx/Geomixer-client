(function ($, map){

var g_tagMetaInfo = null;

_translationsHash.addtext("rus", {
    'walrusPlugin.menuTitle': 'Добавить новый снимок',
    'walrusPlugin.labelExistLayer': 'Выбрать существующий',
    'walrusPlugin.labelNewLayer': 'Добавить новый',
    'walrusPlugin.alreadyExistWarn': 'Такой слой уже есть',
    'walrusPlugin.dialogTitle': 'Добавление снимка'
});

_translationsHash.addtext("eng", {
    'walrusPlugin.menuTitle': 'Add new image',
    'walrusPlugin.labelExistLayer': 'Select from list',
    'walrusPlugin.labelNewLayer': 'Add new',
    'walrusPlugin.alreadyExistWarn': 'This layer is already added',
    'walrusPlugin.dialogTitle': 'Add image'
});

var getObjectsFromServer = function(layerName)
{
    var deferred = $.Deferred();
        
    sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&geometry=true&layer=" + layerName, function(response)
    {
        if (!parseResponse(response))
        {
            deferred.fail();
            return;
        }
        
        var objArray = [];
        
        var fields = response.Result.fields;
        for (var iI = 0; iI < response.Result.values.length; iI++)
        {
            var propHash = {};
            var curValues = response.Result.values[iI];
            for (var iP = 0; iP < fields.length; iP++)
            {
                propHash[fields[iP]] = curValues[iP];
            }
            
            objArray.push(propHash)
        }
        
        deferred.resolve(objArray);
    })
    
    return deferred.promise();
}

var removeObject = function(map, layerName, walrus)
{
    var objects = JSON.stringify([{action: 'delete', id: walrus.ogc_fid}]);
    
    sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", 
        {
            WrapStyle: 'window', 
            LayerName: layerName,
            objects: objects
        }, 
        function(response)
        {
            map.layers[layerName].chkLayerVersion();
        }
    )
}

// events: add, remove
var WalrusCollection = function(map, walrusLayerName)
{
    var walruses = {};
    var walrusesArray = [];
    var _this = this;
    
    this.add = function(walrus) {
        walruses[walrus.sceneid] = walrus;
        $(this).trigger('add', walrus);
    };
    
    this.remove = function(sceneid) {
        if (!(sceneid in walruses))
            return;
        
        var walrusToRemove = walruses[sceneid];
        delete walruses[sceneid];
        $(this).trigger('remove', walrusToRemove);
    };
    
    this.initFromServer = function()
    {
        var deferred = $.Deferred();
        getObjectsFromServer(walrusLayerName).then(
            function(objs)
            {
                walruses = {};
                walrusesArray = [];
                for (var iI = 0; iI < objs.length; iI++)
                {
                    walruses[objs[iI].sceneid] = objs[iI];
                    walrusesArray.push(objs[iI]);
                }
                deferred.resolve();
                
                $(_this).change();
                
            }, 
            function ()
            {
                deferred.reject();
            }
        )
        
        return deferred.promise();
    }
    
    this.getLayerName = function() { return walrusLayerName; }
    
    this.getAsArray = function() { return walrusesArray; }
    
    map.layers[walrusLayerName].addListener('onChangeLayerVersion', function()
    {
        _this.initFromServer();
    })
}


//events: change
var WalrusImage = function(image, map, layerName)
{
    var _image = image;
    this.get = function(attrName) { return _image[attrName]; };
    this.set = function(attrName, attrValue)
    {
        _image[attrName] = attrValue;
        var properties = {};
        properties[attrName] = attrValue;
        
        var obj = {
            action: 'update',
            id: _image.ogc_fid,
            properties: properties
        };
        
        var objects = JSON.stringify([obj]);
        
        sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", 
            {
                WrapStyle: 'window', 
                LayerName: layerName,
                objects: objects
            }, 
            function(response)
            {
                map.layers[layerName].chkLayerVersion();
            }
        )
        
        $(this).trigger('change', _image);
    }
    this.get = function(attrName) { return _image[attrName]; };
    this.getOrig = function() {return _image;};
}

//events: change, activeChange
var WalrusImageCollection = function(map, imageLayerName, walrusCollection)
{
    var imagesBySceneId = {};
    var imagesArray = [];
    var activeImage = null;
    var _this = this;
    
    var modifyWalrusesCount = function(sceneid, delta)
    {
        if (!(sceneid in imagesBySceneId))
            return;
            
        var curWalrusesInImage = imagesBySceneId[sceneid].walruses;
        
        imagesBySceneId[sceneid].set('walruses', curWalrusesInImage + delta);
    }
    
    this.initFromServer = function()
    {
        var deferred = $.Deferred();
        getObjectsFromServer(imageLayerName).then(
            function(objs)
            {
                imagesArray = [];
                imagesBySceneId = {};
                for (var iI = 0; iI < objs.length; iI++)
                {
                    var image = new WalrusImage(objs[iI], map, imageLayerName);
                    
                    imagesBySceneId[objs[iI].sceneid] = image;
                    imagesArray.push(image);
                }
                deferred.resolve();
                
                $(_this).change();
                
            }, 
            function ()
            {
                deferred.reject();
            }
        )
        
        return deferred.promise();
    }
    
    this.getAsArray = function() { return imagesArray; };
    
    this.getBySceneId = function(sceneId) { return imagesBySceneId[sceneId]; };
    
    this.getActive = function() {return activeImage; }
    this.setActive = function(sceneid) 
    {
        activeImage = imagesBySceneId[sceneid] || null;
        $(this).trigger('activeChange');
    }
    
    this.getLayerName = function() { return imageLayerName; }
    
    map.layers[imageLayerName].addListener('onChangeLayerVersion', function()
    {
        _this.initFromServer();
    });
    
    $(walrusCollection).bind('add',    function(walrus) { modifyWalrusesCount(walrus.sceneid,  1) })
    $(walrusCollection).bind('remove', function(walrus) { modifyWalrusesCount(walrus.sceneid, -1) })
}

var Filters = function()
{    
    var tags = {};
    this.each = function(callback)
    {
        for (var t in tags)
            callback(t, tags[t].isActive);
    }
    
    this.setState = function(name, state)
    {
        tags[name] = {isActive: state};
        $(this).change();
    }
    
    this.getState = function(name)
    {
        return tags[name].isActive;
    }
    
    this.toggleState = function(name)
    {
        if (!(name in tags)) return;
        tags[name].isActive = !tags[name].isActive;
        $(this).change();
    }
}

var FiltersView = function(container, filters)
{
    var draw = function()
    {
        $(container).empty();
        filters.each(function(name, state)
        {
            var div = $('<div/>').addClass('walrus-filter-button').text(name).click(function()
            {
                filters.toggleState(name);
            });
            
            if (state)
                div.addClass('walrus-filter-on');
                
            $(container).append(div);
        });
        
        $(container).append($('<div/>').css('clear', 'both'));
    }
    
    $(filters).change(draw);
    draw();
}

var WalrusImagesView = function(map, container, imageCollection)
{
    var walrusImagesDataProvider = new scrollTable.StaticDataProvider();
    var imagesTable = new scrollTable();
    
    walrusImagesDataProvider.setOriginalItems(imageCollection.getAsArray());
    imagesTable.setDataProvider(walrusImagesDataProvider);
    
    var genFunction = scrollTable.StaticDataProvider.genAttrSort;
    var sortFunctions = {
        'Спутник':   genFunction(function(a) {return a.get('platform');}),
        'Дата':      genFunction(function(a) {return a.get('acdate');  }),
        'Моржи':     genFunction(function(a) {return a.get('walruses');}),
        'Просмотры': genFunction(function(a) {return a.get('views');   })
    };
    
    walrusImagesDataProvider.setSortFunctions(sortFunctions);
    
    $(imageCollection).change(function()
    {
        walrusImagesDataProvider.setOriginalItems(imageCollection.getAsArray());
    })
    
    $(imageCollection).bind('activeChange', function()
    {
        if ( imageCollection.getActive() )
            map.layers[imageCollection.getLayerName()].setVisibilityFilter('"sceneid"=\'' + imageCollection.getActive().get('sceneid') + '\'');
        else
            map.layers[imageCollection.getLayerName()].setVisibilityFilter();
            
        imagesTable.repaint();
    })
    
    var drawWalrusImages = function(image)
    {
        var imageProps = image.getOrig();
        var sceneId = imageProps.sceneid;
        
        var editButton = makeImageButton('img/edit.png');
        editButton.onclick = function(e)
        {
            new nsGmx.EditObjectControl(imageCollection.getLayerName(), imageProps.ogc_fid, {
                fields: [
                    {name: 'LayerName', constant: true},
                    {name: 'acdate',    constant: true},
                    {name: 'platform',  constant: true},
                    {name: 'sceneid',   constant: true},
                    {name: 'title',     constant: true}
                ]
            });
            
            stopEvent(e);
        }
        
        var tr = $('<tr/>', {'class': 'walrus-images-row'})
            .append($('<td/>').text(imageProps.platform))
            .append($('<td/>').text(nsGmx.Utils.convertFromServer('date', imageProps.acdate)))
            .append($('<td/>').text(imageProps.walruses))
            .append($('<td/>').text(imageProps.views))
            .click(function()
            {
                if (imageCollection.getActive() && sceneId === imageCollection.getActive().get('sceneid'))
                {
                    imageCollection.setActive(null);
                }
                else
                {
                    imageCollection.setActive(sceneId);
                
                    var merc_geom = imageProps.geomixergeojson;
                    var bounds = gmxAPI.getBounds(gmxAPI.from_merc_geometry(merc_geom).coordinates);
                    map.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
                }
            })[0];
            
        if (nsGmx.AuthManager.isLogin() && _queryMapLayers.layerRights(imageCollection.getLayerName()) == 'edit')
            $(tr).append($('<td/>').append($(editButton).addClass('walrus-edit-icon')))
        else
            $(tr).append($('<td/>'));
            
        if (imageCollection.getActive() && imageProps.ogc_fid === imageCollection.getActive().get('ogc_fid'))
            $(tr).addClass('walrus-active-image');
            
        for (var i = 0; i < tr.childNodes.length; i++)
            tr.childNodes[i].style.width = this._fields[i].width;
            
        return tr;
    }
    
    this.getDataProvider = function() {return walrusImagesDataProvider; };
    
    imagesTable.createTable({
        parent: container,
        name: 'walrusImages',
        fields: ['Спутник', 'Дата', 'Моржи', 'Просмотры', ''],
        fieldsWidths: ['25%', '50px', '50px', '50px', '5px'],
        drawFunc: drawWalrusImages,
        sortableFields: sortFunctions
    });
}

var AddImageControl = function(map, layerName)
{
    var doAddLayerWithProperties = function(layerInfo)
    {
        var metaProps = layerInfo.properties.MetaProperties;
        
        nsGmx.EditObjectControl(layerName, null, 
            {
                drawingObject: map.drawing.addObject(gmxAPI.from_merc_geometry(layerInfo.geometry)), 
                fields: [
                    {name: 'LayerName', value: layerInfo.properties.name,  constant: true},
                    {name: 'title',     value: layerInfo.properties.title, constant: true},
                    {name: 'acdate',    value: metaProps.acdate.Value,     constant: true},
                    {name: 'platform',  value: metaProps.platform.Value,   constant: true},
                    {name: 'sceneid',   value: metaProps.sceneid.Value,    constant: true},
                    {name: 'views',     value: 0, constant: true},
                    {name: 'walruses',  value: 0, constant: true}
                ]
            });
    }

    var doAddLayer = function(newLayer)
    {
        var newLayerName = newLayer.name;
        var testQuery = 'LayerName="' + newLayerName + '"'
        sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&count=true" + "&layer=" + layerName + "&query=" + encodeURIComponent(testQuery), function(response)
        {
            if (!parseResponse(response))
                return;
                
            if (response.Result > 0)
            {
                alert(_gtxt('walrusPlugin.alreadyExistWarn'));
                return;
            }
            
            sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=" + newLayerName, function(response)
            {
                if (!parseResponse(response))
                    return;
                    
                doAddLayerWithProperties(response.Result);
            })
        })
    }

    var createAddImageDialog = function()
    {
        var layerManagerCanvas = _div();
        var newLayerCanvas = _div(null, [['css', 'marginTop', '10px']]);
        var suggestLayersControl = new nsGmx.LayerManagerControl(layerManagerCanvas, 'addimage', {
            fixType: 'raster', 
            enableDragging: false,
            onclick: function(clickContext) { doAddLayer(clickContext.elem);}
        });
        
        var newLayerRadio = $('<input/>', {'class': 'walrus-radio', type: 'radio', id: 'addNewLayer', name: 'newLayer'}).click(function()
        {
            $(layerManagerCanvas).hide();
            $(newLayerCanvas).show();
        });
        
        var existLayerRadio = $('<input/>', {'class': 'walrus-radio', type: 'radio', id: 'addExistingLayer', name: 'newLayer', checked: 'checked'}).click(function()
        {
            $(layerManagerCanvas).show();
            $(newLayerCanvas).hide();
        });
        
        $(newLayerCanvas).hide();
        
        var properties = {Title:'', Description: '', Date: '', TilePath: {Path:''}, ShapePath: {Path:''}};
        
        var initNewLayerCanvas = function()
        {
            $(newLayerCanvas).empty();
            _mapHelper.createLayerEditorProperties(false, 'Raster', newLayerCanvas, properties, 
                {
                    addToMap: false, 
                    doneCallback: function(task)
                    {
                        initNewLayerCanvas();
                        task.deferred.done(function(taskInfo)
                        {
                            doAddLayerWithProperties(layerName, taskInfo.Result);
                        })
                    }
                }
            );
        }
        initNewLayerCanvas();
        
        var canvas = $('<div/>').
            append($('<form/>'))
                .append($('<table/>', {'class': 'walrus-switchcontainer'}).append($('<tr/>')
                    .append($('<td/>').append(existLayerRadio))
                    .append($('<td/>').append($('<label/>', {'class': 'walrus-label', type: 'radio', 'for': 'addExistingLayer'}).text(_gtxt('walrusPlugin.labelExistLayer'))))
                    .append($('<td/>').append(newLayerRadio))
                    .append($('<td/>').append($('<label/>', {'class': 'walrus-label', type: 'radio', 'for': 'addNewLayer'}).text(_gtxt('walrusPlugin.labelNewLayer'))))
                ))
            .append(layerManagerCanvas)
            .append(newLayerCanvas);
        
        showDialog(_gtxt('walrusPlugin.dialogTitle'), canvas[0], {width: 600, height: 600});
        
        existLayerRadio[0].checked = true;    
    }
    
    createAddImageDialog();
}

var WalrusView = function(map, container, walrusCollection, imageCollection)
{
    var drawWalrus = function(walrus)
    {
        var sceneId = walrus.sceneid;
        
        var image = imageCollection.getBySceneId(sceneId);
        var imgProps = image ? imageCollection.getBySceneId(sceneId).getOrig() : null;
        
        var recycleButton = makeImageButton('img/recycle.png', 'img/recycle_a.png');
        recycleButton.onclick = function(e)
        {
            removeObject(map, walrusCollection.getLayerName(), walrus);
            
            if (imgProps)
                image.set( 'walruses', imgProps.walruses - 1 );
                
            stopEvent(e);
        }
        
        var editButton = makeImageButton('img/edit.png');
        editButton.onclick = function(e)
        {
            new nsGmx.EditObjectControl(walrusCollection.getLayerName(), walrus.ogc_fid, {
                fields: [
                    {name: 'sceneid', constant: true},
                    {name: 'adddate', constant: true},
                    {name: 'sourcedate', constant: true},
                    {name: 'comment'}
                ]
            });
            
            stopEvent(e);
        }
        
        var imgDate = imgProps ? nsGmx.Utils.convertFromServer('date', imgProps.acdate) : ""
            
        var tr = $('<tr/>', {'class': 'walrus-row'})
            .append($('<td/>').text(imgDate))
            .append($('<td/>').text(imgProps ? imgProps.sea : ""))
            .append($('<td/>').text(nsGmx.Utils.convertFromServer('date',  walrus.adddate)))
            .append($('<td/>').text(walrus.comment))
            .click(function() {
                var merc_geom = walrus.geomixergeojson;
                var bounds = gmxAPI.getBounds(gmxAPI.from_merc_geometry(merc_geom).coordinates);
                map.moveTo( (bounds.minX + bounds.maxX)/2, (bounds.maxY + bounds.minY)/2, 16 );
                
                if (!imageCollection.getActive() && imgProps)
                {
                    imageCollection.setActive(walrus.sceneid);
                }
                
            })[0];
            
        if (nsGmx.AuthManager.isLogin() && _queryMapLayers.layerRights(imageCollection.getLayerName()) == 'edit')
            $(tr).append($('<td/>').append(recycleButton))
                .append($('<td/>').append($(editButton).addClass('walrus-edit-icon')))
            
        for (var i = 0; i < tr.childNodes.length; i++)
            tr.childNodes[i].style.width = this._fields[i].width;
            
        return tr;
    }
    
    var walrusDataProvider = new scrollTable.StaticDataProvider();
    var walrusTable = new scrollTable();
    
    walrusDataProvider.addFilter('sceneid', function(name, value, items)
    {
        if (value === null) return items;
        
        var filteredVals = [];
        for (var iI = 0; iI < items.length; iI++)
            if (items[iI].sceneid === value)
                filteredVals.push(items[iI]);
        return filteredVals;
    })
    
    var genFunction = scrollTable.StaticDataProvider.genAttrSort;
    var sortFunctions = {
        'Дата снимка':  genFunction(function(a){ var img = imageCollection.getBySceneId(a.sceneid); return img ? img.get('acdate') : 0; }),
        'Море':         genFunction(function(a){ var img = imageCollection.getBySceneId(a.sceneid); return img ? img.get('sea'   ) : 0; }),
        'Дата отметки': genFunction('adddate'),
        'Комментарии':  genFunction('comment')
    };
    
    walrusDataProvider.setSortFunctions(sortFunctions);
    
    walrusDataProvider.setOriginalItems(walrusCollection.getAsArray());
    walrusTable.setDataProvider(walrusDataProvider);
    
    $(walrusCollection).change(function()
    {
        walrusDataProvider.setOriginalItems(walrusCollection.getAsArray());
    })
    
    $(imageCollection).bind('activeChange', function()
    {
        if (!imageCollection.getActive())
        {
            walrusDataProvider.setFilterValue('sceneid', null);
            return;
        }
        
        var sceneId = imageCollection.getActive().getOrig().sceneid;
        walrusDataProvider.setFilterValue('sceneid', sceneId);
        
        if (sceneId in viewedIDs)
            doneInspectButton.attr('disabled', 'disabled')
        else
            doneInspectButton.removeAttr('disabled', 'disabled')
    })
        
    var viewedIDs = {};
        
    var doneInspectButton = $('<button/>').text('Просмотрено').css({'float': 'right'}).click(function()
    {
        if (!imageCollection.getActive()) return;
        
        $(this).attr('disabled', 'disabled');
        var imageProps = imageCollection.getActive().getOrig();
        viewedIDs[imageProps.sceneid] = true;
        
        var newViewCount = imageProps.views + 1;
      
        imageCollection.getActive().set( 'views', imageProps.views + 1 );
    })
    
    var addWalrusButton = $('<button/>').text('Добавить моржа').click(function()
    {
        if (!imageCollection.getActive()) return;
        var listenerId = map.drawing.addListener('onFinish', function(newObj)
        {
            map.drawing.removeListener('onFinish', listenerId);
            
            var imageProps = imageCollection.getActive().getOrig();
            
            var editControl = new nsGmx.EditObjectControl(walrusCollection.getLayerName(), null, {drawingObject: newObj, fields: [
                    {name: 'sceneid', value: imageProps.sceneid, constant: true},
                    {name: 'adddate', value: (new Date()).valueOf()/1000, constant: true},
                    {name: 'sourcedate', value: imageProps.acdate, constant: true}
                ]
            });
            
            $(editControl).bind('modify', function()
            {
                imageCollection.getActive().set( 'walruses', imageProps.walruses + 1 );
            })
        })
            
        map.toolsAll.standartTools.selectTool('POLYGON');
    });
    
    var tableContainer = $('<div/>');
    
    if (nsGmx.AuthManager.isLogin() && _queryMapLayers.layerRights(imageCollection.getLayerName()) == 'edit')
        $(container).append(doneInspectButton).append(addWalrusButton);
    
    $(container).append(tableContainer);

    walrusTable.createTable({
        parent: tableContainer[0],
        name: 'walrus',
        fields: ['Дата снимка', 'Море', 'Дата отметки', 'Комментарии', '', ''],
        fieldsWidths: ['50px', '50%', '50px', '50%', '15px', '15px'],
        drawFunc: drawWalrus,
        sortableFields: sortFunctions
    });
}

var publicInterface = {
    pluginName: 'Walrus',
	afterViewer: function(params, map)
    {
        // var imageLayerName = '26EE541B6E0C43DBB3B4CAA3563F94E9';
        var imageLayerName = 'A11B56BA40DD42AF8726356849A41297';
        var walrusLayerName = '62D064DA30D74A98861B2E1C50A93E3F';
        
        var walrusCollection = new WalrusCollection(map, walrusLayerName);
        var imageCollection = new WalrusImageCollection(map, imageLayerName, walrusCollection);
        
        nsGmx.widgets.commonCalendar.get().unbindLayer(imageLayerName);
        map.layers[imageLayerName].setDateInterval(new Date(2000, 1, 1), new Date(2100, 1, 1));
        map.layers[imageLayerName].setVisibilityFilter('"ogc_fid"=-1');
        
        var tagsContainer = _div();
        var imagesContainer = _div();
        var walrusContainer = _div();
        var addImageButton = $('<button/>').text('Добавить снимок').click(function()
        {
            new AddImageControl(map, imageLayerName);
        })
        
        var menuContainer = $('<div/>', {'class': 'walrus-main-container'}).append(tagsContainer)
        
        if (nsGmx.AuthManager.isLogin() && _queryMapLayers.layerRights(imageCollection.getLayerName()) == 'edit')
            menuContainer.append(addImageButton);
            
        menuContainer.append(imagesContainer).append(walrusContainer);
        
        var menu = new leftMenu();
        menu.createWorkCanvas("walrus", function(){});
        _(menu.workCanvas, [menuContainer[0]]);
                
        
        $.when(imageCollection.initFromServer(), walrusCollection.initFromServer()).done(function()
        {
            var tagFilters = new Filters();
            var images = imageCollection.getAsArray();
            for (var iI = 0; iI < images.length; iI++)
                tagFilters.setState(images[iI].get('sea'), true);
                
            var tagFiltersView = new FiltersView(tagsContainer, tagFilters);
            var imageView = new WalrusImagesView(map, imagesContainer, imageCollection);
            var walrusView = new WalrusView(map, walrusContainer, walrusCollection, imageCollection);
            
            imageView.getDataProvider().addFilter('tags', function(name, value, items)
            {
                var filteredVals = [];
                for (var iI = 0; iI < items.length; iI++)
                    if (tagFilters.getState(items[iI].get('sea')))
                        filteredVals.push(items[iI]);
                return filteredVals;
            })
            
            $(tagFilters).change(function()
            {
                imageView.getDataProvider().setFilterValue('tags', 0);
            })
        })
        
    }
}

gmxCore.addModule("WalrusPlugin", publicInterface, {css: 'WalrusPlugin.css'});

})(jQuery)