(function () {
    'use strict';

    var pluginName = 'FMOS',
        toolbarIconId = 'AISSearch2',
        modulePath = gmxCore.getModulePath(pluginName),
        scheme = document.location.href.replace(/^(https?:).+/, "$1"),
        baseUrl = window.serverBase || scheme + '//maps.kosmosnimki.ru/',
        //aisServiceUrl = scheme + "//localhost/GM/Plugins/AIS/",
        aisServiceUrl = baseUrl + "Plugins/AIS/",
//console.log(scheme)
//console.log(aisServiceUrl)
//console.log(baseUrl)
        infoDialogCascade = [],  
        allIinfoDialogs = [],
        myFleetLayers = [],
        layersWithBaloons = [],
        aisLayerID,
        tracksLayerID,
        aisLayer,
        tracksLayer,
        displaingTrack,
        gifLoader = '<img src="img/progress.gif">',
        formatDate = function(d, utc){
            var dd,m,y,h,mm;
            if (!utc){
                dd = ("0"+d.getDate()).slice(-2);
                m = ("0"+(d.getMonth()+1)).slice(-2);
                y = d.getFullYear();
                h = ("0"+d.getHours()).slice(-2);
                mm = ("0"+d.getMinutes()).slice(-2);
            }
            else{
                dd = ("0"+d.getUTCDate()).slice(-2);
                m = ("0"+(d.getUTCMonth()+1)).slice(-2);
                y = d.getUTCFullYear();
                h = ("0"+d.getUTCHours()).slice(-2);
                mm = ("0"+d.getUTCMinutes()).slice(-2);
            }
            return dd+"."+m+"."+y+" "+h+":"+mm;
        }, 
        positionMap = function(vessel){
//console.log(vessel);
            if (vessel.ts_pos_utc){
                var d = new Date(vessel.ts_pos_utc.replace(/(\d\d).(\d\d).(\d\d\d\d).+/, "$3-$2-$1")),
                interval = nsGmx.DateInterval.getUTCDayBoundary(d);
                nsGmx.widgets.commonCalendar.setDateInterval(interval.dateBegin, interval.dateEnd);
            }

 				nsGmx.leafletMap.fitBounds([
    					[vessel.ymin, vessel.xmin],
    					[vessel.ymax, vessel.xmax]
    				], {
    					maxZoom: 9,//config.user.searchZoom,
    					animate: false
    			})           
        },      
        publicInterface = {
            pluginName: pluginName,
            afterViewer: function (params, map) {                     
                var _params = L.extend({
                        // regularImage: 'ship.png',
                        // activeImage: 'active.png'
                    }, params),
                path = gmxCore.getModulePath(pluginName),
                layersByID = nsGmx.gmxMap.layersByID,
                lmap = map;  
                layersWithBaloons = params.layersWithBaloons;
                aisLayerID = params.aisLayerID || '02CD86CC5573435C9F0FAD769BB4FF96'//'8EE2C7996800458AAF70BABB43321FA4';
                tracksLayerID = params.tracksLayerID || 'ED21DB8BFF47448B9B45C6751FFAC936'//'13E2051DFEE04EEF997DC5733BD69A15';
                aisLayer = layersByID[aisLayerID];
                tracksLayer = layersByID[tracksLayerID];  
                var setLocaleDate = function(layer){
                    if (layer)
                    layer.bindPopup('').on('popupopen',(e)=>{
                        //console.log(e.gmx.properties);
                        var result, re = /\[([^\[\]]+)\]/g, lastIndex = 0, template = "", 
                        str = e.gmx.templateBalloon, props = e.gmx.properties;
                        while ((result = re.exec(str)) !== null) {
                            template += str.substring(lastIndex, result.index);
                            if (props.hasOwnProperty(result[1]))
                                if (result[1].search(/^ts_/)!=-1)
                                    template += formatDate(new Date(props[result[1]]*1000), true)
                                else
                                    template += props[result[1]]
//console.log(lastIndex+", "+result.index+" "+str.substring(lastIndex, result.index)+" "+props[result[1]]+" "+result[1])
                            lastIndex = re.lastIndex;
                        }  
                        template += str.substring(lastIndex);                      
//console.log(lastIndex+", "+re.lastIndex+" "+str.substring(lastIndex))
                        e.popup.setContent(template);
                    })
                },
                setLayerClickHandler = function(layer){
                        layer.removeEventListener('click')
                        layer.addEventListener('click', function(e){
//console.log(e)
                            if (e.gmx 
                                //&& e.gmx.properties.hasOwnProperty("imo")
                            ){
                                e.gmx.properties.longitude = e.latlng.lng;
                                e.gmx.properties.latitude = e.latlng.lat;
                                publicInterface.showInfo(e.gmx.properties)
                            }
                        })           
                },
                forLayers = function(layer){
                    if (layer){
                            //setLocaleDate(layer)                 
                            setLayerClickHandler(layer)
                    }        
                }
                
                for (var key in params) {
                //     if (key=="myfleet"){
                //         myFleetLayers = params[key].split(",").map(function(id){
                //            return  id.replace(/\s/, "");
                //         });
                //         for (var i=0; i<myFleetLayers.length; ++i) { 
                //             forLayers(layersByID[myFleetLayers[i]])
                //         }
                //     }
                //     else{ 
                        forLayers(layersByID[params[key]] )
                    // }
                }
/*
				var iconOpt_mf = {
                    id: toolbarIconId,
                    togglable: true,
                    title: _gtxt('AISSearch2.caption')
                };		
                if (!lmap.options.svgSprite) {
                    L.extend(iconOpt, {
						regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
						activeImageUrl: _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage
                    });
				}
				var icon_mf = L.control.gmxIcon(iconOpt_mf).on('statechange', function (ev) {
                    if (ev.target.options.isActive) {
                        //console.log(icon_mf);
					    aisPluginPanel.show(icon_mf);
                    }
                    else {
                        aisPluginPanel.hide();
                    }
				});
                lmap.addControl(icon_mf);
                */
            },
            showTrack: function (mmsiArr, bbox) { 
                var lmap = nsGmx.leafletMap;      
                var filterFunc = function (args, mmsiField) {
                        var mmsi = args.properties[mmsiField],
                            i, len;
                        for (i = 0, len = mmsiArr.length; i < len; i++) {
                            if (mmsi === mmsiArr[i]) { return true; }
                        }
                        return false;
                }, 
                    filterTracks = function(args){return filterFunc(args, 4)}, 
                    filterPoints = function(args){return filterFunc(args, 7)};
                    if (bbox) { lmap.fitBounds(bbox, { maxZoom: 11 }); }
                    if (aisLayer) {
                        if (mmsiArr.length) {
                            displaingTrack = mmsiArr[0];
                            aisLayer.setFilter(filterPoints);
                            if (!aisLayer._map) {
                                lmap.addLayer(aisLayer);
                            }
                        } else {
                            displaingTrack = false;
                            aisLayer.removeFilter();
                            lmap.removeLayer(aisLayer);
                        }
                    }
                    if (tracksLayer) {
                        if (mmsiArr.length) {
                            tracksLayer.setFilter(filterTracks);
                            if (!tracksLayer._map) {
                                lmap.addLayer(tracksLayer);
                            }
                        } else {
                            tracksLayer.removeFilter();
                            lmap.removeLayer(tracksLayer);
                        }
                    }
            },
            showInfo: function(vessel, getmore){

                var ind = allIinfoDialogs.findIndex(function(d){return d.vessel.imo==vessel.imo && d.vessel.mmsi==vessel.mmsi});
                if (ind>=0){
                    $(allIinfoDialogs[ind].dialog).parent().insertAfter($('.ui-dialog').eq($('.ui-dialog').length-1));
                    return;
                }

                var canvas = $('<div class="ais_myfleet_dialog"/>'),
                    menu = $('<div class="column1 menu"></div>').appendTo(canvas),
                    photo = $('<div class="photo"><div></div></div>').appendTo(menu),
                    content = $('<div class="column2 content"></div>').appendTo(canvas),
                    footer = $(
                    '<div class="ais_myfleet_dialog_footer"><div>'+
                    '<div class="column1"><div class="caption">Остатки топлива на момент получения сигнала, т</div></div>'+
                    '<div class="column2"><div class="caption">Расход топлива за период, т</div></div>'+
                    '</div>'+
                    '<div class="display">'+
                    '</div>'+
                    '</div>'),
                    canvasWithFooter = $('<div/>');
                canvas.appendTo(canvasWithFooter);
                canvasWithFooter.append(footer);
                var _this = this;

                var dialog = showDialog(vessel.ShipName, canvasWithFooter[0], {width: 450, height: 475, 
                        closeFunc: function(event){
                            var ind = infoDialogCascade.findIndex(function(d){return d.id==dialog.id});
                            if (ind>=0)
                                infoDialogCascade.splice(ind, 1);
                            ind = allIinfoDialogs.findIndex(function(d){return d.dialog.id==dialog.id});
                            if (ind>=0)
                                allIinfoDialogs.splice(ind, 1);
                        }
                });
                dialog.style.backgroundColor = "#f4f8fb"
                dialog.parentElement.querySelector('.ui-dialog-titlebar').style.backgroundColor = "#ceeaff";
                dialog.style.margin="0"; 
            
                if (infoDialogCascade.length>0){
                    var pos  = $(infoDialogCascade[infoDialogCascade.length-1]).parent().position();
                    $(dialog).dialog("option", "position", [pos.left+10, pos.top+10]);   
                }

                infoDialogCascade.push(dialog);
                allIinfoDialogs.push({vessel:vessel, dialog:dialog});
                $(dialog).on( "dialogdragstop", function( event, ui ) {
                    var ind = infoDialogCascade.findIndex(function(d){return d.id==dialog.id});
                    if (ind>=0)
                        infoDialogCascade.splice(ind, 1);
                });
                
                var addUnit = function(v, u){
                    return v!=null && v!="" ? v+u : ""; 
                },
                formatVessel = function(vessel){
                    vessel.ts_pos_utc = formatDate(new Date(vessel.datetime*1000), true);
                    vessel.cog = addUnit(vessel.cog, "°");
                    vessel.sog = addUnit(vessel.sog, " уз");
                    return vessel;
                }
                var moreInfo = function(v){
                        content.append(Handlebars.compile(
                        '<div class="vessel_prop">{{ts_pos_utc}} UTC</div>'+
                        '<div class="vessel_prop">{{y}} {{x}}</div>'
                        )(v));
                    $('.column1', footer).append(Handlebars.compile(
                        '<div class="vessel_prop">ROB_MDO: {{rob_mdo}}</div>'+
                        '<div class="vessel_prop">ROB_MGO: {{rob_mgo}}</div>'+
                        '<div class="vessel_prop">ROB_HFO: {{rob_hfo}}</div>'
                        )(v));

                } 
                // walkaround with focus at first input in ui-dialog
                $('.column2 .caption', footer).append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>')
                var dateInterval = new nsGmx.DateInterval(),
                mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval();
                dateInterval
                    .set('dateBegin', mapDateInterval.get('dateBegin'))
                    .set('dateEnd', mapDateInterval.get('dateEnd'))
                    .on('change', function () {
//console.log(dateInterval.get('dateBegin').toUTCString() + ' ' + dateInterval.get('dateEnd').toUTCString())                        
                        progress.append(gifLoader)
                        getSource();

                });
                var calendar = new nsGmx.CalendarWidget({
                    dateInterval: dateInterval,
                    name: 'fobConsumptionInterval',
                    container: $('.column2 .caption', footer),
                    dateMin: new Date(0, 0, 0),
                    dateMax: new Date(3015, 1, 1),
                    dateFormat: 'dd.mm.yy',
                    minimized: false,
                    showSwitcher: false,
                    dateBegin: new Date(),
                    dateEnd: new Date(2000, 10, 10),
                    //buttonImage: 'img/calendar.png'
                })

                //$('.CalendarWidget-iconScrollLeft', footer).remove();
                //$('.CalendarWidget-iconScrollRight', footer).remove();
                //$('.CalendarWidget-dateBegin', footer).after('&nbsp;-&nbsp;')
                var robType = 'rob_mdo',
                getSource = function(){
                    var startOfInterval = dateInterval.get('dateBegin'),
                    endOfInterval = new Date(dateInterval.get('dateEnd')-3600*24*1000),
                    getIntervalElement = function(d, t){
                        return d.getUTCFullYear()+"-"+("0"+(d.getUTCMonth()+1)).slice(-2)+"-"+("0"+(d.getUTCDate())).slice(-2)+" "+t; 
                    },
                    startElement = getIntervalElement(startOfInterval, "00-00-00"),
                    endElement = getIntervalElement(endOfInterval, "23-59-59");
//console.log(vessel.ShipKey + ' -- ' + startElement + ' -- ' + endElement)  
                    fetch("http://kosmosnimki.ru/demo/FMOS/api/v1/Ship/Rob/"+vessel.ShipKey+"/"+robType+"/"+startElement+"/"+endElement)
                    .then(function(resp){
                        return resp.json();
                    })
                    .then(function(json){
                        progress.text('')
                        //console.log(json)
                        var consumption = Handlebars.compile(
                                        '<table>'+
                                        '{{#each this}}'+
                                            '<tr><td>{{robType}}</td><td>{{start}}</td><td>{{value}}</td></tr>'+
                                        '{{/each}}'+
                                        '</table>'
                                        )(json)
                                    if (!$('.display', footer).is('.mCustomScrollbar')){
                                        $('.display', footer).append(consumption) 
                                        dialog.querySelector('.display').style.height = dialog.querySelector('.display table tr').offsetHeight*7 + "px";                
                                        $('.display', footer).mCustomScrollbar();
                                    }
                                    else{
                                        $('.display .mCSB_container', footer).text('').append(consumption)
                                    }
                    })
                    .catch(function(error){
                        progress.text('')
                        console.log(error)
                    })
                }

                $('.column2', footer).append(
                '<div class="vessel_prop"><span>ROB_MDO<input type="hidden" value="ROB_MDO"></span>: <span class="rob_mdo"></span></div>'+
                '<div class="vessel_prop"><span>ROB_MGO<input type="hidden" value="ROB_MGO"></span>: <span class="rob_mgo"></span></div>'+
                '<div class="vessel_prop"><span>ROB_HFO<input type="hidden" value="ROB_HFO"></span>: <span class="rob_hbo"></span></div>'
                );

                $('.column2 .vessel_prop span:first-of-type', footer).click(function(e){                        
                    progress.append(gifLoader);
                    robType = $('input', this).val();
                    getSource();
                })

                var vessel2;   
                    vessel2 = $.extend({}, vessel);
                    moreInfo(formatVessel(vessel2));
                    vessel2.vessel_name = vessel.ShipName;
                    vessel2.ts_pos_utc = formatDate(new Date(vessel.datetime*1000), true);
                $('<img src="'+scheme+'//photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi='+vessel.mmsi+'">').load(function() {
                    if (this)
                    $('div', photo).replaceWith(this);
                });

                var menubuttons = $('<div class="menubuttons"></div>').appendTo(content);
                var openpage = $('<div class="button openpage" title="информация о судне"></div>')
                .appendTo(menubuttons)                   
                .on('click', function(){
                    vesselInfoView.show(vessel2);
                    var onFail = function(error){
                        if (error!='register_no_data')
                        console.log(error)
                    } 
                    new Promise(function(resolve, reject){
                        (function wait(){
                            if(!vessel2)
                                setTimeout(wait, 100);
                        })();
                        resolve(vessel2)
                    })
                    .then(function(ship){
                        vesselInfoView.drawAis(ship)
                    }, 
                    onFail);
                    
                    var registerServerUrl = scheme + "//kosmosnimki.ru/demo/register/api/v1/";
                    if(vessel.imo && vessel.imo!=0 && vessel.imo!=-1)
                        fetch(registerServerUrl+"Ship/Search/"+vessel.imo+"/ru")
                        .then(function(response){
                            return response.json();
                        })  
                        .then(function(ship) {
                            if (ship.length>0)
                                return fetch(registerServerUrl+"Ship/Get/"+ship[0].RS+"/ru")
                            else
                                return Promise.reject('register_no_data');
                        })
                        .then(function(response){
                            return response.json();
                        })  
                        .then(function(ship) {
//console.log(ship)
                            vesselInfoView.drawRegister(ship)
                        })
                        .catch( onFail );

                    new Promise(function(resolve, reject){
                        sendCrossDomainJSONRequest(aisServiceUrl + 
                            "gallery.ashx?mmsi="+vessel.mmsi+"&imo="+vessel.imo, function(response){
                            if (response.Status=="ok") 
                                resolve(response.Result);
                            else
                                reject(response)
                        });
                    })
                    .then(function(gallery){
                        vesselInfoView.drawGallery(gallery)
                    }, 
                    onFail);
                }); 

                var showpos = $('<div class="button showpos" title="показать положение"></div>')
                .appendTo(menubuttons)                   
                .on('click', function(){
                    var showVessel = {
                        xmin:vessel.x, 
                        xmax:vessel.x, 
                        ymin:vessel.y, 
                        ymax:vessel.y, 
                        ts_pos_utc:vessel.datetime && !isNaN(vessel.datetime)?formatDate(new Date(vessel.datetime*1000), true):vessel.datetime
                    }
//console.log(vessel)
//console.log(showVessel)
                    positionMap(showVessel);
                });

                var templ = !displaingTrack || displaingTrack!=vessel.mmsi?'<div class="button showtrack" title="'+_gtxt('AISSearch2.show_track')+'"></div>':
                '<div class="button showtrack active" title="'+_gtxt('AISSearch2.hide_track')+'"></div>';
                var showtrack = $(templ)
                .appendTo(menubuttons)                   
                .on('click', function(){
                    if (showtrack.attr('title')!=_gtxt('AISSearch2.hide_track')){
                        $('.showtrack').attr('title', _gtxt('AISSearch2.show_track'))
                        .removeClass('active');
                        publicInterface.showTrack([vessel.mmsi]);
                        showtrack.attr('title', _gtxt('AISSearch2.hide_track'))
                        .addClass('active');       
                    }
                    else{
                        $('.showtrack').attr('title',_gtxt('AISSearch2.show_track'))
                        .removeClass('active');
                        publicInterface.showTrack([]);
                    }
                });
                var progress = $('<div class="progress"></div>')
                .appendTo(menubuttons);  
                
                
                // CALCULATED 
                var startOfInterval = dateInterval.get('dateBegin'),
                endOfInterval = new Date(dateInterval.get('dateEnd')-3600*24*1000),
                getIntervalElement = function(d, t){
                    return d.getUTCFullYear()+"-"+("0"+(d.getUTCMonth()+1)).slice(-2)+"-"+("0"+(d.getUTCDate())).slice(-2)+" "+t; 
                },
                startElement = getIntervalElement(startOfInterval, "00-00-00"),
                endElement = getIntervalElement(endOfInterval, "23-59-59");
//console.log(vessel.ShipKey) 
//console.log(dateInterval.get('dateBegin').toUTCString()+" "+startElement)
//console.log(dateInterval.get('dateEnd').toUTCString()+ " "+endElement)                         
                progress.append(gifLoader)
                Promise.all([                        
                        fetch("http://kosmosnimki.ru/demo/FMOS/api/v1/Ship/Consumption/"+vessel.ShipKey+"/ROB_MDO/"+startElement+"/"+endElement),
                        fetch("http://kosmosnimki.ru/demo/FMOS/api/v1/Ship/Consumption/"+vessel.ShipKey+"/ROB_MGO/"+startElement+"/"+endElement),
                        fetch("http://kosmosnimki.ru/demo/FMOS/api/v1/Ship/Consumption/"+vessel.ShipKey+"/ROB_HFO/"+startElement+"/"+endElement)
                ])
                .then(function(responses){
                    Promise.all(responses.map(function(response){return response.json()}))
                    .then(function(jsons){
                        for (var i=0; i<jsons.length; ++i){
                                var json = jsons[i]
                                    // if (json && json.robType && json.value){
                                    // if (json.robType=="ROB_MDO")
                                    // $('.column2 .rob_mdo', footer).text(json.sumRob.replace(/,/, '.'));
                                    // else if (json.robType=="ROB_MGO")
                                    // $('.column2 .rob_mgo', footer).text(json.sumRob.replace(/,/, '.'));
                                    // else if (json.robType=="ROB_HFO")
                                    // $('.column2 .rob_hbo', footer).text(json.sumRob.replace(/,/, '.'));
                                    // }
                        }
                    })
                });
                getSource();
            }
        };

    //************************************
    // VESSEL INFO VIEW
    //************************************   
    var vesselInfoView  = function(){
        var _ais,  
        _galery, 
        _register, 
        _regcap,    
        _leftPanel,  
        _minh,
        resize,
        menuAction,
        show = function(vessel){
//console.log(vessel) 
            $("body").append(''+  
'<table class="vessel-info-page overlay">' +
        '<tr>' +
            '<td>' +
'<table class="vessel-info-page container">' +
    '<tr>' +
        '<td class="column1">' +
                '<table>' +
                    '<tr>' +
                        '<td>' +
                            '<div>' +
                                '<div class="title">' +
                                   '<div class="cell">'+vessel.vessel_name+'<div class="timestamp">'+vessel.ts_pos_utc+'</div></div>  ' +                  
                                '</div>' +
                                '<div class="menu">' +
                                '<div class="register cell menu-item active"><img src="'+modulePath+'svg/info.svg" class="icon">Регистр</div>' +
                                '<div class="galery cell menu-item"><img src="'+modulePath+'svg/photogallery.svg" class="icon">Фотогалерея <div class="counter">0</div></div>' +
                                //'<div class="ais cell menu-item"><img src="'+modulePath+'svg/info_gen.svg" class="icon">Основные сведения</div>' +

                               '</div>' +
                            '</div>  ' +
                        '</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td class="frame">' +
                                '<div class="photo">' +
                                    '<img src="'+modulePath+'svg/no-image.svg" class="no-image">' +
                                '</div>  ' +  
                        '</td>' +
                    '</tr>' +
                '</table>' +
    '</td>' +
    '<td class="column2">' +
        '<div class="close-button-holder">' +
            '<div class="close-button" title="закрыть"></div>' +
        '</div>' +
        '<div class="register panel">' +
            '<div class="caption"></div>' +
            '<div class="menu">' +
                '<div>' +
                    '<table>' +
                        '<tr>' +
                            '<td><div class="general menu-item active">Общие сведения</div></td>' +
                            '<td><div class="build menu-item">Сведения о постройке</div></td>' +
                            '<td><div class="dimensions menu-item">Размеры и скорость</div></td>' +
                            '<td><div class="gears menu-item">Оборудование</div></td>' +
                        '</tr>' +
                    '</table>' +
                '</div>' +
            '</div>' +
            '<div class="content">' +
                '<div class="placeholder"></div>' +
            '</div>' +
        '</div>' +

        '<div class="galery panel">' +   
'<form action="' + aisServiceUrl + 'Upload.ashx" class="uploadFile" method="post" enctype="multipart/form-data" target="upload_target" style="display:none" >' +
    '<input name="Filedata" class="chooseFile" type="file">' +    
    '<input name="imo" type="hidden" value="'+vessel.imo+'">' +    
    '<input name="mmsi" type="hidden" value="'+vessel.mmsi+'">' +
          //'<input type="submit" name="submitBtn" value="Upload" />' +
'</form>' + 
'<iframe id="upload_target" name="upload_target" src="#" style="width:0;height:0;border:0px solid #fff;"></iframe>' + 
            '<div class="placeholder">' +
                '<div class="photo" onclick="document.querySelector(\'.vessel-info-page .chooseFile\').click();"'+
                ' style="background-image: url('+modulePath+'svg/add-image.svg);background-size: 50px;"></div>' +                
            '</div>' +
        '</div>' +

        // '<div class="ais panel">' +
        //     '<div class="placeholder"></div>' +
        // '</div>' +
    '</td>' +
    '</tr>' +
'</table>' +
            '</td>' +
        '</tr>' +
    '</table>'           
            );
        window.addEventListener("message", function(e){
            if (e.data.search(/"uploaded"\:/)<0)
                return;
            var data = JSON.parse(e.data);    
            if (data.id && parseInt(data.id)) { //uploaded:
//console.log('UPLOADED '+id)
                var counter = $('.vessel-info-page .menu-item .counter'), 
                count = parseInt(counter.text())+1;
                counter.text(count).css('display', 'inline');
                var preview = $("<div class='photo preview' id='"+data.id+"' style='background-image: url("+aisServiceUrl+"getphoto.ashx?id="+data.id+")'/>");
                $('.vessel-info-page .uploader').replaceWith(preview);
                preview.click(showPicture);
//console.log(preview)
            }
            else {//uploadError:            
                $('.vessel-info-page .uploader').remove();
                console.log(data.errmsg)
            }  
        }, false);

        $('<img src="'+scheme+'//photos.marinetraffic.com/ais/showphoto.aspx?mmsi='+vessel.mmsi+'">').load(function() {
            if (this){
                $('.column1 .photo img.no-image').replaceWith(this);
            }
        });
        $('.vessel-info-page .chooseFile').change(function(){            
            $('<div class="photo uploader" style="background-image:url(img/progress.gif);background-size:20px;"></div>')
            .insertAfter($('.vessel-info-page .galery .placeholder .photo').eq(0));
            $('.vessel-info-page .uploadFile')[0].submit();
        })
        $('.vessel-info-page .close-button').click(function(){
            $('.vessel-info-page.overlay').remove();
        });
/**/
        $('.vessel-info-page .menu img[src$=".svg"]').each(function() {
            var $img = jQuery(this);
            var imgURL = $img.attr('src');
            var attributes = $img.prop("attributes");

            $.get(imgURL, function(data) {
                // Get the SVG tag, ignore the rest
                var $svg = jQuery(data).find('svg');

                // Remove any invalid XML tags
                $svg = $svg.removeAttr('xmlns:a');

                // Loop through IMG attributes and apply on SVG
                $.each(attributes, function() {
                    $svg.attr(this.name, this.value);
                });

                // Replace IMG with SVG
                $img.replaceWith($svg);
            }, 'xml');
        });

        //_ais = document.querySelector('.vessel-info-page .column2 .ais') 
        _galery = document.querySelector('.vessel-info-page .column2 .galery')
        _register = document.querySelector('.vessel-info-page .column2 .register .content')
        _regcap = document.querySelector('.vessel-info-page .column2 .register .caption')    
        _leftPanel = document.querySelector('.vessel-info-page .column1 table')      
        _minh = 420
        resize = function(){
            var h = Math.floor(window.innerHeight*0.7);
            if (h>_minh){
                _leftPanel.style.height = _galery.style.height = h + "px";
                _register.style.height = h - _regcap.offsetHeight + "px";
            }
            else{
                _leftPanel.style.height = _galery.style.height = _minh + "px";
                _register.style.height = _minh - _regcap.offsetHeight + "px";
            }      
        }
        menuAction = function(e){
            var target = e.currentTarget, p = target.parentElement, mia;
            while(!(mia = p.querySelectorAll('.menu-item')) || mia.length<2){
                p = p.parentElement;
            }
            for (var j=0; j<mia.length; ++j){
                    //console.log( mia[j])
                mia[j].className = mia[j].className.replace(/ active/, "");
                var panel = document.querySelector('.panel.' + mia[j].classList[0]);
                if (panel){
                    if (mia[j]!=target)
                    panel.style.display = "none";
                    else{
                    panel.style.display = "block";
                    }
                }
            }
            target.className += " active"
            resize(); 
        }

        window.addEventListener("resize", resize, false); 
    
        var mia = document.querySelectorAll('.column1 .menu-item');
        for (var i=0; i<mia.length; ++i){
            mia[i].addEventListener('click', menuAction)
        }
    
        resize();    
        //$(_ais).mCustomScrollbar({theme:"vessel-info-theme"});
        $(_galery).mCustomScrollbar({theme:"vessel-info-theme"});
        $(_register).mCustomScrollbar({theme:"vessel-info-theme"});
        document.querySelector('.vessel-info-page .container').style.display = "table";  
    },
    showPicture = function(){
//console.log($(this))
            $('.vessel-info-page .picture').remove();
            var div = $('<div class="picture" style="display:none;position:absolute;"></div>')
            .insertAfter('.vessel-info-page.container').click(function(){this.remove()});
            $('<img src="'+aisServiceUrl+'getphoto.ashx?id='+this.id+'">').load(function() {
                    if (this){
                        var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
                        h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                        div.append(this)
                        .css('display', 'table')
                        .offset({
                            left:(w-this.offsetWidth)/2,
                            top:(h-this.offsetHeight)/2})
//console.log($(this))
//console.log(window.screen.width+"-"+$(this)[0].offsetWidth)
//console.log((window.screen.width-$(this)[0].offsetWidth)/2)
                    }
            });
        },
    drawGallery = function(gallery){
        if (gallery.length>0)
            $('.vessel-info-page .menu-item .counter').text(gallery.length).css('display', 'inline');   
        var galcontent = $(".vessel-info-page .galery .placeholder")
        for (var i=0; i<gallery.length; ++i)
            galcontent.append("<div class='photo preview' id='"+gallery[i]+"' style='background-image: url("+aisServiceUrl+"getphoto.ashx?id="+gallery[i]+")'/>" )             
        $('.photo.preview').click(showPicture)
        resize();     
    },
    drawAis = function(ledokol){
    // var aiscontent = document.querySelector(".vessel-info-page .ais .placeholder")
    // aiscontent.innerHTML = "" +                
    // "<div class='caption'><div>ИНФОРМАЦИЯ О СУДНЕ</div></div>" +
    // "<table>" +
    //     "<tr><td>Название судна</td><td><b>"+ledokol.vessel_name+"</b></td></tr>" +
    //     "<tr><td>IMO</td><td>"+ledokol.imo+"</td></tr>" +
    //     "<tr><td>MMSI</td><td>"+ledokol.mmsi+"</td></tr>" +
    //     "<tr><td>Тип</td><td>"+ledokol.vessel_type+"</td></tr>" +
    //     "<tr><td>Флаг</td><td>"+ledokol.flag_country+"</td></tr>" +
    //     "<tr><td>Позывной</td><td>"+ledokol.callsign+"</td></tr>" +
    //     "<tr><td>Длина</td><td>"+ledokol.length+"</td></tr>" +
    //     "<tr><td>Ширина</td><td>"+ledokol.width+"</td></tr>" +
    // "</table>" +
    // "<div class='caption'><div>СВЕДЕНИЯ О ДВИЖЕНИИ</div></div>" +
    // "<table>" +
    //     "<tr><td>Навигационный статус</td><td>"+ledokol.nav_status+"</td></tr>" +
    //     "<tr><td>COG</td><td>"+ledokol.cog+"</td></tr>" +
    //     "<tr><td>SOG</td><td>"+ledokol.sog+"</td></tr>" +
    //     "<tr><td>HDG</td><td>"+ledokol.heading+"</td></tr>" +
    //     "<tr><td>ROT</td><td>"+ledokol.rot+"</td></tr>" +
    //     "<tr><td>Осадка</td><td>"+ledokol.draught+"</td></tr>" +
    //     "<tr><td>Назначение</td><td>"+ledokol.destination+"</td></tr>" +
    //     "<tr><td>Расчетное время прибытия</td><td>"+ledokol.ts_eta+"</td></tr>" +
    // "</table>";     
        resize();        
    },
    drawRegister = function(ledokol){
        var regcontent = _register.querySelector(".placeholder"),
        drawTable = function(groups, article, display){
            var s = "<div class='panel "+article+" article' style='display:"+display+"'>";
            for(var i=0; i<groups.length; ++i){
                s += "<div class='group'>"+groups[i].name+"</div><table>"
                for(var j=0; j<groups[i].properties.length; ++j){
                    var pn = groups[i].properties[j].name,
                    pv = groups[i].properties[j].value
                    s+= "<tr><td>"+pn+"</td><td>"+(pn=="Название судна"||pn=="Латинское название"?"<b>"+pv+"</b>":pv)+"</td></tr>"
                }
                s += "</table>"
            }
            s += "</div>"
            return s;
        }
        regcontent.innerHTML = 
        drawTable([ledokol.data[0], ledokol.data[1], ledokol.data[9]], "general", "block") + 
        drawTable([ledokol.data[2]], "build", "none") + 
        drawTable([ledokol.data[3]], "dimensions", "none") + 
        drawTable([ledokol.data[4], ledokol.data[5], ledokol.data[6], ledokol.data[7], ledokol.data[8]], "gears", "none");

        var mia = document.querySelectorAll('.column2 .menu-item');
        for (var i=0; i<mia.length; ++i){
            mia[i].addEventListener('click', menuAction)
        }
             
        resize();        
    }
        
        return {
            show: show,
            drawRegister: drawRegister,
            drawAis: drawAis,
            drawGallery:drawGallery
        }
    }();

    _translationsHash.addtext('rus', {
        'AISSearch2.title': 'Поиск судов',
        'AISSearch2.title1': 'Найдено судов',
        'AISSearch2.title2': '<b>Данных не найдено!</b>',
        'AISSearch2.error': '<b>Ошибка при получении данных!</b>',
        'AISSearch2.iconTitle': 'Поиск судов по экрану',
        'AISSearch2.placeholder_0': 'Поиск по адресам, координатам',
        'AISSearch2.placeholder_1': 'Поиск судна по названию / MMSI',
        // 'AISSearch2.placeholder_1': 'Поиск судна по названию / MMSI. Поиск по адресам, координатам, кадастровым номерам'
        'AISSearch2.myFleetDialog': 'Мой флот',
        'AISSearch2.vesselName': 'название',
        'AISSearch2.vesselAdd': 'добавить',
        'AISSearch2.vesselRemove': 'удалить',
        'AISSearch2.myFleetMembers': 'Состав',
        'AISSearch2.myFleetMember': 'мой флот',
        'AISSearch2.info': 'информация',
        'AISSearch2.found':'Найдено: ',
        'AISSearch2.filter':'Введите название или mmsi или imo судна',
        'AISSearch2.screen':'По экрану',
        'AISSearch2.database':'По базе данных',
        'AISSearch2.caption': 'Поиск судов и "Мой флот"',
        'AISSearch2.refresh': 'обновить',
        'AISSearch2.refreshing': 'обновляется',
        'AISSearch2.nomyfleet': 'Сервис не доступен',
        'AISSearch2.auth': 'Требуется авторизация',
        'AISSearch2.vessel_name': 'Название',
        'AISSearch2.mmsi': 'MMSI',
        'AISSearch2.imo': 'IMO',
        'AISSearch2.flag_country': 'Страна',
        'AISSearch2.vessel_type': 'Тип судна',
        'AISSearch2.draught': 'Осадка',
        'AISSearch2.destination': 'Назначение',
        'AISSearch2.nav_status': 'Статус',
        'AISSearch2.last_sig': 'Последний сигнал',
        'AISSearch2.show_track': 'трек за сутки',
        'AISSearch2.hide_track': 'скрыть трек'
    });
    _translationsHash.addtext('eng', {
        'AISSearch2.title': 'Searching vessels',
        'AISSearch2.title1': 'Vessels found',
        'AISSearch2.title2': '<b>Vessels not found!</b>',
        'AISSearch2.error': '<b>Vessels not found!</b>',
        'AISSearch2.iconTitle': 'Search vessels within the view area',
        'AISSearch2.placeholder_0': 'Search for addresses, coordinates',
        'AISSearch2.placeholder_1': 'Search by vessel name / MMSI',
        // 'AISSearch2.placeholder_1' : 'Search by vessel name / MMSI. Search by addresses, coordinates, cadastre number'
        'AISSearch2.myFleetDialog': 'My fleet',
        'AISSearch2.vesselName': 'name',
        'AISSearch2.vesselAdd': 'add',
        'AISSearch2.vesselRemove': 'remove',
        'AISSearch2.myFleetMembers': 'Members',
        'AISSearch2.myFleetMember': 'my fleet',
        'AISSearch2.info': 'info',
        'AISSearch2.found':'Found ',
        'AISSearch2.filter':'Insert vessel name or mmsi or imo',
        'AISSearch2.screen':'On screen',
        'AISSearch2.database':'In database',
        'AISSearch2.caption': 'Vessel Search & My Fleet',
        'AISSearch2.refresh': 'refresh',
        'AISSearch2.refreshing': 'refreshing',
        'AISSearch2.nomyfleet': 'Service is unavailable',
        'AISSearch2.auth': 'Authorization required',
        'AISSearch2.vessel_name': 'Name',
        'AISSearch2.mmsi': 'MMSI',
        'AISSearch2.imo': 'IMO',
        'AISSearch2.flag_country': 'Flag',
        'AISSearch2.vessel_type': 'Vessel type',
        'AISSearch2.draught': 'Draught',
        'AISSearch2.destination': 'Destination',
        'AISSearch2.nav_status': 'Navigation status',
        'AISSearch2.last_sig': 'Last signal',
        'AISSearch2.show_track': 'show track',
        'AISSearch2.hide_track': 'hide track'
    });

    gmxCore.addModule(pluginName, publicInterface, {
        css: pluginName + '.css'
    });
})();
