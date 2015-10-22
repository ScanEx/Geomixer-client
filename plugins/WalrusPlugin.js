(function ($){

var modulePath = '';
var ScrollTable = null;

var getServerBase = function()
{
    return window.serverBase || gmxAPI.getAPIHostRoot();
}

var appendTranslations = function()
{
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
}

var getObjectsFromServer = function(layerName)
{
    var deferred = $.Deferred();
        
    sendCrossDomainJSONRequest(getServerBase() + "VectorLayer/Search.ashx?WrapStyle=func&geometry=true&layer=" + layerName, function(response)
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
    
    sendCrossDomainPostRequest(getServerBase() + "VectorLayer/ModifyVectorObjects.ashx", 
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
        
        sendCrossDomainPostRequest(getServerBase() + "VectorLayer/ModifyVectorObjects.ashx", 
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

//просто контейнер для одного изображения, который может генерить событие change
var ImageItem = function()
{
    var _activeImage = null;
    this.get = function() { return _activeImage; };
    this.set = function(newActiveImage)
    {
        _activeImage = newActiveImage;
        $(this).change();
    }
}

var TopmostImage = function(activeImage)
{
    var _activeImage = activeImage;
    var _topmostImage = activeImage.get();
    var _this = this;
    
    $(activeImage).change(function()
    {
        _this.set(activeImage.get());
    });
    
    this.set = function(topmostImage)
    {
        _topmostImage = topmostImage;
        $(this).change();
    }
    
    this.get = function()
    {
        return _topmostImage;
    }
}

//events: change
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

var WalrusImagesView = function(map, container, imageCollection, activeImage)
{
    var _this = this;
    var walrusImagesDataProvider = new ScrollTable.StaticDataProvider( imageCollection.getAsArray() );
    var imagesTable = new ScrollTable();
    
    imagesTable.setDataProvider(walrusImagesDataProvider);
    
    var genFunction = ScrollTable.StaticDataProvider.genAttrSort;
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
    
    $(activeImage).change(function()
    {
        imagesTable.repaint();
    })
    
    var drawWalrusImages = function(image)
    {
        var imageProps = image.getOrig();
        var sceneId = imageProps.sceneid;
        
        var editButton = makeImageButton(modulePath + '../img/edit.png');
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
                if (activeImage.get() && sceneId === activeImage.get().get('sceneid'))
                {
                    activeImage.set(null);
                }
                else
                {
                    activeImage.set(imageCollection.getBySceneId(sceneId));
                
                    var merc_geom = imageProps.geomixergeojson;
                    var bounds = gmxAPI.getBounds(gmxAPI.from_merc_geometry(merc_geom).coordinates);
                    map.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
                }
            })[0];
            
            
        if ('AuthManager' in nsGmx && nsGmx.AuthManager.isLogin() && _queryMapLayers.layerRights(imageCollection.getLayerName()) == 'edit')
            $(tr).append($('<td/>').append($(editButton).addClass('walrus-edit-icon')))
        else
            $(tr).append($('<td/>'));
            
        $("td", tr).addClass('walrus-list-elem');
            
        if (activeImage.get() && imageProps.ogc_fid === activeImage.get().get('ogc_fid'))
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
                    {name: 'acdate',    value: metaProps.acqdate.Value,    constant: true},
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
        var testQuery = '[LayerName]=\'' + newLayerName + '\'';
        sendCrossDomainJSONRequest(getServerBase() + "VectorLayer/Search.ashx?WrapStyle=func&count=true" + "&layer=" + layerName + "&query=" + encodeURIComponent(testQuery), function(response)
        {
            if (!parseResponse(response))
                return;
                
            if (response.Result > 0)
            {
                alert(_gtxt('walrusPlugin.alreadyExistWarn'));
                return;
            }
            
            sendCrossDomainJSONRequest(getServerBase() + "Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=" + newLayerName, function(response)
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
            $(newLayerCanvas).hide();
            $(layerManagerCanvas).show();
        });
        
        $(newLayerCanvas).hide();
        
        var properties = {Title:'', Description: '', Date: '', TilePath: {Path:''}, ShapePath: {Path:''}};
        
        var initNewLayerCanvas = function()
        {
            $(newLayerCanvas).empty();
            nsGmx.createLayerEditor(null, 'Raster', newLayerCanvas, properties,
                {
                    addToMap: false, 
                    doneCallback: function(promise)
                    {
                        initNewLayerCanvas();
                        promise.done(function(taskInfo)
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

var WalrusView = function(map, container, walrusCollection, imageCollection, topmostImage)
{
    var drawWalrus = function(walrus)
    {
        var sceneId = walrus.sceneid;
        
        var image = imageCollection.getBySceneId(sceneId);
        var imgProps = image ? imageCollection.getBySceneId(sceneId).getOrig() : null;
        
        var recycleButton = makeImageButton(modulePath + '../img/recycle.png', modulePath + '../img/recycle_a.png');
        recycleButton.onclick = function(e)
        {
            removeObject(map, walrusCollection.getLayerName(), walrus);
            
            if (imgProps)
                image.set( 'walruses', imgProps.walruses - 1 );
                
            stopEvent(e);
        }
        
        var editButton = makeImageButton(modulePath + '../img/edit.png');
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
                
                topmostImage.set(imageCollection.getBySceneId(walrus.sceneid));
                
            })[0];
            
        if ('AuthManager' in nsGmx && nsGmx.AuthManager.isLogin() && _queryMapLayers.layerRights(imageCollection.getLayerName()) == 'edit')
            $(tr).append($('<td/>').append(recycleButton))
                .append($('<td/>').append($(editButton).addClass('walrus-edit-icon')))
            
        $("td", tr).addClass('walrus-list-elem');
            
        for (var i = 0; i < tr.childNodes.length; i++)
            tr.childNodes[i].style.width = this._fields[i].width;
            
        return tr;
    }
    
    var walrusDataProvider = new ScrollTable.StaticDataProvider( walrusCollection.getAsArray() );
    var walrusTable = new ScrollTable();
    
    walrusDataProvider.addFilter('sceneid', function(name, value, items)
    {
        if (value === null) return items;
        
        var filteredVals = [];
        for (var iI = 0; iI < items.length; iI++)
            if (items[iI].sceneid === value)
                filteredVals.push(items[iI]);
        return filteredVals;
    })
    
    var genFunction = ScrollTable.StaticDataProvider.genAttrSort;
    var sortFunctions = {
        'Дата снимка':  genFunction(function(a){ var img = imageCollection.getBySceneId(a.sceneid); return img ? img.get('acdate') : 0; }),
        'Море':         genFunction(function(a){ var img = imageCollection.getBySceneId(a.sceneid); return img ? img.get('sea'   ) : 0; }),
        'Дата отметки': genFunction('adddate'),
        'Комментарии':  genFunction('comment')
    };
    
    walrusDataProvider.setSortFunctions(sortFunctions);
    
    walrusTable.setDataProvider(walrusDataProvider);
    
    $(walrusCollection).change(function()
    {
        walrusDataProvider.setOriginalItems(walrusCollection.getAsArray());
    })

    var tableContainer = $('<div/>');
    
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

var VisibleImagesWidget = function(map, container, imageCollection, activeImage, topmostImage)
{
    var title = $('<div/>').attr('class', 'walrus-relative-title').text('Снимки для проверки');
    var tableDiv = _div();
    
    $(activeImage).change(function()
    {
        updateImageList( gmxAPI.merc_x(map.getX()), gmxAPI.merc_y(map.getY()) );
    })
        
    $(container).append(title, tableDiv);
    
    function isPointInPoly(poly, pt){
        for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i][1] <= pt.y && pt.y < poly[j][1]) || (poly[j][1] <= pt.y && pt.y < poly[i][1]))
            && (pt.x < (poly[j][0] - poly[i][0]) * (pt.y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
            && (c = !c);
        return c;
    }
    var dataProvider = new ScrollTable.StaticDataProvider();
    
    var updateImageList = function(x, y)
    {
        var imagesToShow = $.grep(imageCollection.getAsArray(), function(image){
            return activeImage.get() && activeImage.get().get('sceneid') !== image.get('sceneid') && isPointInPoly( image.get('geomixergeojson').coordinates[0], {x: x, y: y} );
        });
        
        dataProvider.setOriginalItems(imagesToShow);
    }
    
    map.addListener('positionChanged', function(params)
    {
        updateImageList( gmxAPI.merc_x(params.currX), gmxAPI.merc_y(params.currY) );
    })
    
    var activeVisibleImage = null;
    
    var drawImageRow = function(image)
    {
        var tr = $('<tr/>').attr('class', 'walrus-relative-row')
            .append($('<td/>').text(image.get('platform')))
            .append($('<td/>').text(nsGmx.Utils.convertFromServer('date', image.get('acdate'))))
            .click(function()
            {
                if (!activeVisibleImage || activeVisibleImage.get('sceneid') !== image.get('sceneid'))
                {
                    activeVisibleImage = image;
                }
                else
                {
                    activeVisibleImage = null;
                }
                topmostImage.set( activeVisibleImage || activeImage.get() );
                imagesTable.repaint();
                
            })[0];
            
        if (activeVisibleImage && activeVisibleImage.get('sceneid') === image.get('sceneid'))
            $(tr).addClass('walrus-relative-active-row');
            
        $("td", tr).addClass('walrus-list-elem');
            
        for (var i = 0; i < tr.childNodes.length; i++)
            tr.childNodes[i].style.width = this._fields[i].width;
            
        return tr;
    }
    
    var imagesTable = new ScrollTable({showFooter: false, height: '150px'});
    imagesTable.setDataProvider(dataProvider);
    
    var tableContainer = $('<div/>');
    
    
    imagesTable.createTable({
        parent: tableDiv,
        name: 'intersectedImages',
        fields: ['Спутник', 'Дата'],
        fieldsWidths: ['50%', '50%'],
        drawFunc: drawImageRow
    })
}

var SearchWalrusWidget = function(map, container, imageCollection, walrusCollection, activeImage, permalinkController)
{
    var _this = this;
    var activeVisibleImage = null;
    
    var feedbackHost = 'http://mapstest.kosmosnimki.ru/sender/';
    
    var mapObject = null;
    
    $(activeImage).change(function()
    {
        mapObject && mapObject.remove();
        if (activeImage.get())
        {
            mapObject = map.addObject(gmxAPI.from_merc_geometry(activeImage.get().get('geomixergeojson')));
            mapObject.setStyle({outline: {color: 0xff00ff, thickness: 4}});
        }
    });
        
    var doneInspectButton = $('<button/>', {'class': 'walrus-button'}).text('Просмотрено').css({'float': 'right'}).click(function()
    {
        if (typeof nsGmx.AuthManager === 'undefined' || !nsGmx.AuthManager.isLogin() || _queryMapLayers.layerRights(imageCollection.getLayerName()) != 'edit')
        {
            alert('Данный функционал находится в разработке');
            return;
        }
        
        if (!activeImage.get()) return;
        
        activeImage.get().set( 'views', activeImage.get().get('views') + 1 );
        mapObject && mapObject.remove();
        $(_this).trigger('doneInspect');
    })
    
    var addWalrusButton = $('<button/>', {'class': 'walrus-button'}).text('Добавить моржа').click(function()
    {
        if (!activeImage.get()) return;
        
        var listenerId = map.drawing.addListener('onFinish', function(newObj)
        {
            map.drawing.removeListener('onFinish', listenerId);
            
            var imageProps = activeImage.get().getOrig();
            
            var isLogin = 'AuthManager' in nsGmx && nsGmx.AuthManager.isLogin();
            
            if (isLogin && _queryMapLayers.layerRights(imageCollection.getLayerName()) === 'edit')
            {
                var editControl = new nsGmx.EditObjectControl(walrusCollection.getLayerName(), null, {drawingObject: newObj, fields: [
                        {name: 'sceneid', value: imageProps.sceneid, constant: true},
                        {name: 'adddate', value: (new Date()).valueOf()/1000, constant: true},
                        {name: 'sourcedate', value: imageProps.acdate, constant: true}
                    ]
                });
                
                $(editControl).bind('modify', function()
                {
                    activeImage.get().set( 'walruses', imageProps.walruses + 1 );
                })
            }
            else
            {
                var container = $('<div/>');
                
                if (!isLogin)
                {
                    container
                        .append($('<div/>').text('Ваш e-mail:'))
                        .append($('<input/>', {id: 'walrusFeedbackEmail', 'class': 'walrus-feedback-input inputStyle'}));
                }
                
                var sendButton = $('<button/>').text('Отослать').addClass('walrus-button').click(function()
                {
                    permalinkController.getPermalink(function(permalinkId)
                    {
                        var permalinkURL = "http://" + window.location.host + window.location.pathname + "?permalink=" + permalinkId;
                        
                        var email = isLogin ? nsGmx.AuthManager.getLogin() : $('#walrusFeedbackEmail', container).val();
                        
                        $.ajax({
                            url: feedbackHost + 'DBWebProxy.ashx', 
                            data: {
                                type: 'AddWalrus',
                                Permalink: permalinkURL,
                                Email: email,
                                Comment: $('#walrusFeedbackComment', container).val()
                            },
                            cache: true,
                            dataType: 'jsonp',
                            jsonp: 'CallbackName'
                        }).done(function(response)
                        {
                            parseResponse(response);
                            
                            $(feedbackDialog).dialog('close');
                            removeDialog(feedbackDialog);
                        })
                    })
                })
                
                container
                    .append($('<div/>').text('Комментарий:'))
                    .append($('<input/>', {id: 'walrusFeedbackComment', 'class': 'walrus-feedback-input inputStyle'}))
                    .append($('<div/>').append(sendButton).css('text-align', 'center'));
                
                var feedbackDialog = showDialog('Добавить моржа', container[0], {
                    width: 400, 
                    height: isLogin ? 120 : 170,
                    closeFunc: function()
                    {
                        newObj.remove();
                    }
                });
            }
        })
            
        //map.toolsAll.standartTools.selectTool('POLYGON');
    });
    
    var cancelSearchButton = $('<button/>', {'class': 'walrus-button'}).text('Отмена').click(function()
    {
        mapObject && mapObject.remove();
        $(_this).trigger('doneInspect');
    });
    
    if ('nsGmx' in window && nsGmx.GeomixerFramework)
    {
        $(container)
            .append($('<table/>').css('width', '100%').append($('<tr/>')
                .append($('<td/>').append(addWalrusButton).css('textAlign', 'left'))
                .append($('<td/>').append(cancelSearchButton).css('width', '10px'))
                .append($('<td/>').append(doneInspectButton).css('width', '10px'))
            ))
    }
}

var WalrusPluginStateController = function( viewContainer, searchContainer, activeImage )
{
    var _this = this;
    var curMode = 'view';
    $(activeImage).change(function()
    {
        if (activeImage.get())
            _this.setSearchMode();
        else
            _this.setViewMode();
    })
    this.setSearchMode = function(sceneId)
    {
        if (curMode === 'search') return;
        $(viewContainer).hide();
        $(searchContainer).show();
        curMode = 'search';
    }
    
    this.setViewMode = function()
    {
        if (curMode === 'view') return;
        $(searchContainer).hide();
        $(viewContainer).show();
        curMode = 'view';
    }
}

var PermalinkController = function(imageCollection, activeImage)
{
    if (typeof window._mapHelper !== 'undefined')
    {
        _mapHelper.customParamsManager.addProvider(
        {
            name: 'walrus',
            saveState: function()
            {
                return {
                    activeSceneId: activeImage ? activeImage.get('sceneid') : null
                }
            },
            loadState: function(state)
            {
                activeImage.set(imageCollection.getBySceneId(state.activeSceneId));
            }
        });
    
        this.getPermalink = function(callback)
        {
            _mapHelper.createPermalink(callback);
        }
    }
    else
    {
        this.getPermalink = function(){};
    }
}

var MapController = function(map, layerName, topmostImage)
{
    var _set = function()
    {
        if ( topmostImage.get() )
            map.layers[layerName].setVisibilityFilter('"sceneid"=\'' + topmostImage.get().get('sceneid') + '\'');
        else
            map.layers[layerName].setVisibilityFilter();
    }
    
    $(topmostImage).change(_set);
    _set();
}

var publicInterface = {
    pluginName: 'Walrus',
	afterViewer: function(params, map)
    {
        var imageLayerName = 'A11B56BA40DD42AF8726356849A41297';
        var walrusLayerName = '62D064DA30D74A98861B2E1C50A93E3F';
        
        var walrusCollection = new WalrusCollection(map, walrusLayerName);
        var imageCollection = new WalrusImageCollection(map, imageLayerName, walrusCollection);
        var activeImage = new ImageItem();
        var topmostImage = new TopmostImage(activeImage);
        
        if (window.nsGmx && window.nsGmx.widgets)
            nsGmx.widgets.commonCalendar.get().unbindLayer(imageLayerName);
        map.layers[imageLayerName].setDateInterval(new Date(2000, 1, 1), new Date(2100, 1, 1));
        
        var tagsContainer = _div();
        var imagesContainer = $('<div/>').addClass('walrus-images-container')[0];
        var walrusContainer = _div();
        var searchWalrusContainer = _div();
        var visibleImagesContainer = _div();
        var menuContainer = $('<div/>', {'class': 'walrus-main-container'}).append(tagsContainer);
        var viewModeContainer = $('<div/>').attr('class', 'walrus-view-container');
        var searchModeContainer = $('<div/>');
        
        var addImageButton = $('<button/>', {'class': 'walrus-button'}).text('Добавить снимок').click(function()
        {
            new AddImageControl(map, imageLayerName);
        })
        
        if ('AuthManager' in nsGmx && nsGmx.AuthManager.isLogin() && _queryMapLayers.layerRights(imageCollection.getLayerName()) == 'edit')
            menuContainer.append(addImageButton);
            
        menuContainer.append(imagesContainer);
            
        viewModeContainer.append(walrusContainer);
        
        searchModeContainer.append(searchWalrusContainer);
        searchModeContainer.append(visibleImagesContainer);
        
        menuContainer.append(viewModeContainer, searchModeContainer);
        
        if (window.leftMenu && (!params || typeof params.container == 'undefined') )
        {
            var menu = new leftMenu();
            menu.createWorkCanvas("walrus", function(){});
            _(menu.workCanvas, [menuContainer[0]]);
        }
        else
        {
            _(params.container, [menuContainer[0]]);
        }
        
        var mapController = new MapController(map, imageLayerName, topmostImage);
        
        var visibleImagesWidget = new VisibleImagesWidget(map, visibleImagesContainer, imageCollection, activeImage, topmostImage);
        
        $.when(imageCollection.initFromServer(), walrusCollection.initFromServer()).done(function()
        {
            var permalinkController = new PermalinkController(imageCollection, activeImage);
            var searchWalrusWidget = new SearchWalrusWidget(map, searchWalrusContainer, imageCollection, walrusCollection, activeImage, permalinkController);
            
            $(searchWalrusWidget).bind('doneInspect', function()
            {
                activeImage.set(null);
            })
            
            var stateController = new WalrusPluginStateController( viewModeContainer, searchModeContainer, activeImage);
            stateController.setViewMode();
        
            var tagFilters = new Filters();
            var images = imageCollection.getAsArray();
            for (var iI = 0; iI < images.length; iI++)
                tagFilters.setState(images[iI].get('sea'), true);
                
            var tagFiltersView = new FiltersView(tagsContainer, tagFilters);
            var imageView = new WalrusImagesView(map, imagesContainer, imageCollection, activeImage);
            var walrusView = new WalrusView(map, walrusContainer, walrusCollection, imageCollection, activeImage);
            
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
        
    },
    createControls: function(map, container)
    {
        this.afterViewer({container: container}, map);
    }
}

gmxCore.addModule("WalrusPlugin", publicInterface, 
    {
        require: ['ScrollTableControl'],
        css: 'WalrusPlugin.css',
        init: function(module, path)
        {
            path = path || '';
            modulePath = path;
            appendTranslations();
            ScrollTable = gmxCore.getModule('ScrollTableControl').ScrollTable;
            
            return gmxCore.loadScriptWithCheck([
                { 
                    check: function(){ return jQuery.ui; },
                    script: path + '../jquery/jquery-ui-1.7.2.custom.min.js',
                    css: path + '../jquery/jquery-ui-1.7.2.custom.css'
                },
                {
                    check: function(){ return jQuery.datepicker.parseDateTime; },
                    script: path + '../jquery/jquery-ui-timepicker-addon.js'
                }
            ]);
        }
    }
);

})(jQuery)