(function () {
    'use strict';
    var pluginName = 'AISSearch2',
        serverPrefix = window.serverBase || 'http://maps.kosmosnimki.ru/',
        serverScript = serverPrefix + 'VectorLayer/Search.ashx',  
        infodialogs = [],  
        allinfodialogs = [],
        myFleetLayers = [],
        publicInterface = {
            pluginName: pluginName,
            afterViewer: function (params, map) {                     
                var _params = L.extend({
                        regularImage: 'ship.png',
                        activeImage: 'active.png'
                    }, params),
                path = gmxCore.getModulePath(pluginName);              
                for (var k in params) {
                    if (k=="myfleet"){
                        myFleetLayers = params[k].split(",").map(function(id){
                           return  id.replace(/\s/, "");
                        });
                    }
                    if (nsGmx.gmxMap.layersByID[params[k]])
                    nsGmx.gmxMap.layersByID[params[k]].addEventListener('click', function(e){
                        //console.log(e.gmx.properties)
                        publicInterface.showInfo(e.gmx.properties)
                    })
                }
                var lmap = map;
//console.log(lmap.options.svgSprite)

                //========================
                // MY FLEET
                //========================
				var iconOpt_mf = {
                    id: pluginName,
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
            },

            showInfo: function(vessel){

                //var vessel = JSON.parse(info.attr('vessel'));
                allinfodialogs.forEach(function(d){$(d.dialog).parent().css('z-index', 10000)});
//console.log(infodialogs);
                // if (info.attr('displaying'))
                var ind = allinfodialogs.findIndex(function(d){return d.vessel.imo==vessel.imo && d.vessel.mmsi==vessel.mmsi});
                if (ind>=0){
                    $(allinfodialogs[ind].dialog).parent().css('z-index', 11000);
                    return;
                }
                // info.attr('displaying', 'true');

                var canvas = $('<div class="ais_myfleet_dialog"/>'),
                    menu = $('<div class="column1 menu"></div>').appendTo(canvas),
                    photo = $('<div class="photo"/>').appendTo(menu),
                    content = Handlebars.compile(
                    '<div class="column2 content">'+
                    //'<div class="vessel_prop">{{i "AISSearch2.mmsi"}}: {{mmsi}}</div>'+
                    //'<div class="vessel_prop">{{i "AISSearch2.imo"}}: {{imo}}</div>'+
                    '</div>') (vessel);
                canvas.append(content)
                var _this = this;

                var dialog = showDialog(vessel.vessel_name, canvas[0], {width: 500, height: 340, 
                        closeFunc: function(event){
                            //info.removeAttr('displaying');
                            var ind = infodialogs.findIndex(function(d){return d.id==dialog.id});
                            if (ind>=0)
                                infodialogs.splice(ind, 1);
                            ind = allinfodialogs.findIndex(function(d){return d.dialog.id==dialog.id});
                            if (ind>=0)
                                allinfodialogs.splice(ind, 1);
                        }
                });  
            
                if (infodialogs.length>0){
                    var pos  = $(infodialogs[infodialogs.length-1]).parent().position();
                    $(dialog).dialog("option", "position", [pos.left+10, pos.top+10]);   
                }

                infodialogs.push(dialog);
                allinfodialogs.push({vessel:vessel, dialog:dialog});
                $(dialog).on( "dialogdragstop", function( event, ui ) {
                    var ind = infodialogs.findIndex(function(d){return d.id==dialog.id});
                    if (ind>=0)
                        infodialogs.splice(ind, 1);
                });

                var addUnit = function(v, u){
                    return v!=null && v!="" ? v+u : ""; 
                }
                var moreInfo = function(v){
                        $('.content', canvas).append(Handlebars.compile(
                        '<div class="vessel_prop">{{vessel_type}}</div>'+
                        '<div class="vessel_prop">{{flag_country}}</div>'+
                        '<div class="vessel_prop">IMO: {{imo}}</div>'+
                        '<div class="vessel_prop">MMSI: {{mmsi}}</div>'+
                        '<div class="vessel_prop">COG: {{cog}}</div>'+
                        '<div class="vessel_prop">SOG: {{sog}}</div>'+
                        '<div class="vessel_prop">HDG: {{heading}}</div>'+
                        '<div class="vessel_prop">ROT: {{rot}}</div>'+
                        '<div class="vessel_prop">{{i "AISSearch2.draught"}}: {{draught}}</div>'+
                        '<div class="vessel_prop">{{i "AISSearch2.destination"}}: {{destination}}</div>'+
                        '<div class="vessel_prop">{{i "AISSearch2.nav_status"}}: {{nav_status}}</div>'+
                        '<div class="vessel_prop">{{i "AISSearch2.last_sig"}}: {{ts_pos_utc}}</div>'+
                        '<div class="vessel_prop summary">{{latitude}}, {{longitude}}</div>'
                        )(v));
                }
                aisLayerSearcher.searchNames([{mmsi:vessel.mmsi,imo:vessel.imo}], function(response){
//console.log(response)
                    if (parseResponse(response)){                    
                        var vessel2 = {
                        "flag_country":response.Result.values[0][6],
                        "vessel_type":response.Result.values[0][7],
                        "mmsi":response.Result.values[0][1],
                        "imo":response.Result.values[0][2],
                        "ts_pos_utc":aisLayerSearcher.formatDate(new Date(parseInt(response.Result.values[0][3])*1000)),
                        "longitude":response.Result.values[0][4],
                        "latitude":response.Result.values[0][5],
                        "cog":addUnit(response.Result.values[0][8], "°"),
                        "sog":addUnit(response.Result.values[0][9], " уз"),
                        "rot":addUnit(response.Result.values[0][10], "°/мин"),
                        "heading":addUnit(response.Result.values[0][11], "°"),
                        "destination":response.Result.values[0][12],
                        "nav_status":response.Result.values[0][13],
                        "draught":addUnit(response.Result.values[0][14], " м")
                        };
                        moreInfo(vessel2);
                    }
    //else
    //console.log(response)
                })
                $('<img src="http://photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi='+vessel.mmsi+'">').load(function() {
                    $(this).appendTo(photo);
                });  

                if (myFleetMembersModel && myFleetMembersModel.data){
                    var add = myFleetMembersModel.data.vessels.findIndex(function(v){
                        return v.mmsi==vessel.mmsi && v.imo==vessel.imo;
                    })<0;
                    var addremove = $('<div class="addremove"></div>')
                    //.text(vessel.mf_member&&vessel.mf_member.search(/inline/)<0?'добавить в мой флот':'удалить из моего флота')
                    .text(add?'добавить в мой флот':'удалить из моего флота')
                    .appendTo(menu);
                    if (myFleetMembersModel.filterUpdating)
                        addremove.addClass('disabled');
                    addremove.on('click', function(){
                        if (addremove.is('.disabled'))
                            return;
                        
                        $('.addremove').addClass('disabled');
                        addremove.append('<i class="icon-refresh animate-spin"></i>')
                        myFleetMembersModel.changeFilter(vessel).then(function(){  
                            add = myFleetMembersModel.data.vessels.findIndex(function(v){
                                return v.mmsi==vessel.mmsi && v.imo==vessel.imo;
                            })<0;
                            var info = $('.icon-ship[vessel="' + vessel.mmsi + ' ' + vessel.imo + '"]');
                            info.css('display', !add?'inline':'none');                            
                            //info.attr('vessel', JSON.stringify(vessel));
                            //info.parents('table').find('.icon-ship').css('display', vessel.mf_member.replace(/display:/,''))
                            
                            addremove.text(add?'добавить в мой флот':'удалить из моего флота')                
                            $('.addremove').removeClass('disabled')
                            if (aisPluginPanel.getActiveView()==myFleetMembersView)
                                myFleetMembersView.show();
                        });
                    }); 
                }
                var showtrack = $('<div class="showtrack">трек за сутки</div>')
                .appendTo(menu)                   
                .on('click', function(){
                });
                var showpos = $('<div class="showpos">показать положение</div>')
                .appendTo(menu)                   
                .on('click', function(){
                });
                var openpage = $('<div class="openpage">информация о судне</div>')
                .appendTo(menu)                   
                .on('click', function(){
    console.log(myFleetMembersModel.data)
                });
            }
        };

    //************************************
    //  AIS PANEL
    //************************************
    var aisPluginPanel = {
        _canvas: _div(null),
        _leftMenuBlock: null,
        _activeView: aisSearchView,
        getActiveView: function(){
            return this._activeView;
        },
        show: function(icon){
            if (!this._leftMenuBlock)
                this._leftMenuBlock = new leftMenu();
            if (!this._leftMenuBlock.createWorkCanvas("aispanel", function(){ icon._iconClick() },
            { path:[_gtxt('AISSearch2.caption')] })) {

                var tabsTemplate = '<table class="ais_tabs" border=0><tr>' +
                    '<td class="ais_tab search_tab">' +
                        '{{i "AISSearch2.title"}}' +
                    '</td><td class="ais_tab myfleet_tab active">' + // ACTIVE
                        '{{i "AISSearch2.myFleetDialog"}}' +
                    '</td>' +
                '</tr></table>'+
                '<div class="ais_view search_view">'+
                    '<table border=0 class="instruments"><tr>'+
                    '<td><div><i class="icon-down-dir"><select><option value="0">{{i "AISSearch2.screen"}}</option><option value="1">{{i "AISSearch2.database"}}</option></select></i></div></td>'+
                    '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div><i class="icon-refresh"></i></div></td>'+
                    '<td><span class="count"></span></td></tr>'+
                    '<tr><td colspan="3"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/><i class="icon-search clicable"></div></td></tr></table>'+
                    
                    '<div class="ais_vessels"><div class="ais_vessel">'+
                    '<table><tr><td>NO VESSELS FOUND</td>'+
                    '<td><div class="info">'+
                    '<i class="clicable icon-info"></i>'+
                    '</div></td></tr></table>'+
                    '</div></div>'+
                '</div>'+
                '<div class="ais_view myfleet_view">'+                    
                    '<table border=0 class="instruments"><tr>'+
                    '<td><div class="refresh"><div><i class="icon-refresh"></i></div></td><td></td><td></td>'+
                    '</tr></table>'+
                    
                    '<div class="ais_vessels"><div class="ais_vessel">NO VESSELS SELECTED</div></div>'+
                '</div>';
                $(this._canvas).append(Handlebars.compile(tabsTemplate));
                $(this._leftMenuBlock.workCanvas).append(this._canvas);

                var tabs = $('.ais_tab', this._canvas),
                    views = [aisSearchView, myFleetMembersView];
                var _this = this;
                tabs.on('click', function(){
                    if (!$(this).is('.active')){
                        var target = this;
                        tabs.each(function(i, tab){ 
                            if(!$(tab).is('.active') && target==tab){
                                $(tab).addClass('active');                                
                                views[i].show();
                                _this._activeView = views[i];
                            }
                            else{
                                $(tab).removeClass('active');                                
                                views[i].hide();
                            }
                        });
                    }
                });
                
                aisSearchView.create({
                    _frame: $('.search_view', this._canvas),
                    _container: $('.search_view .ais_vessels', this._canvas),
                    _refresh: $('.search_view .refresh div', this._canvas),
                    _search: $('.filter', this._canvas),
                    _count: $('.count', this._canvas)
                }); 
                myFleetMembersView.create({
                    _frame: $('.myfleet_view', this._canvas),
                    _container: $('.myfleet_view .ais_vessels', this._canvas),
                    _refresh: $('.myfleet_view .refresh div', this._canvas)
                });

                var needUpdate = function(){
                    aisScreenSearchModel.setDirty();
                    if (this._activeView===aisSearchView){
                        aisSearchView.show();
                    }
                }; 
                nsGmx.leafletMap.on('moveend', needUpdate.bind(this));
                nsGmx.widgets.commonCalendar.getDateInterval().on('change', needUpdate.bind(this));

            }
            $(this._leftMenuBlock.parentWorkCanvas)
            .attr('class', 'left_aispanel')
            .insertAfter('.layers-before');
            var blockItem = this._leftMenuBlock.leftPanelItem,
                blockTitle = $('.leftmenu-path', blockItem.panelCanvas);
            var toggleTitle = function(){
                if(blockItem.isCollapsed())
                    blockTitle.show();
                else
                    blockTitle.hide();
            }
            $(blockItem).on('changeVisibility', toggleTitle);
            toggleTitle();

            // Show the first tab
            $('.ais_tab', this._canvas).eq(0).removeClass('active').click();
            aisSearchView.drawBackground();
            myFleetMembersView.drawBackground();
        },
        hide: function(){
            $(this._leftMenuBlock.parentWorkCanvas).hide()
        }
    };

    //************************************
    //  BASE AIS VIEW
    //************************************
    var aisView = {
        _calcHeight: function(){return ($('.ais_vessel', this._container).height() + 12) * 5 + 4 * 5},
        drawBackground: function(){
            this._clean();
        },
        _clean: function(){
            $('.info', this._container).off('click');
            $('.position', this._container).off('click');
            if ($('.mCSB_container', this._container)[0])
                $('.mCSB_container', this._container).empty();
            else
                $(this._container).empty();
            if (this._doClean)
                this._doClean();
        },
        create: function(controls){
            $.extend(this, controls);
            $(this._container).height(this._calcHeight())
            if (this._bindControlEvents)
                this._bindControlEvents();

            if ($('.icon-down-dir', this._frame)[0] && $('.icon-down-dir', this._frame).height()==34)
                $('.icon-down-dir', this._frame).css({position:'relative', top:'2px'})
        },
        _waitTime: 1000,
        show: function(){
            this._start = new Date().getTime();
            
            //if(clean) this._clean();
            $(this._frame).show();

                var _this = this;
                clearTimeout(this._wait);
                var rest = new Date().getTime()-this._lastUpdate;
//console.log(rest) 
            //this._refresh.parent().removeClass('clicable');
            //this._refresh.parent().attr('title', ''); 
                this._refresh.addClass('animate-spin');

                if (!this._lastUpdate || rest>=this._waitTime){
                    this._lastUpdate = new Date().getTime();  
                    this._model.update();
                }
                else{
                    this._wait = setTimeout(function(){  
                        _this._lastUpdate = new Date().getTime();  
                        _this._model.update();
                    }, this._waitTime-rest);
                }
        },
        hide: function(){            
            $(this._frame).hide();
        },
        _positionMap(vessel){
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
        showPosition: function(item){
            var vessel = JSON.parse(item.parent().parent().find('.info').attr('vessel'));
            if (vessel.maxid && vessel.xmax!=vessel.xmin && vessel.ymax!=vessel.ymin){
                var _this = this;
                // search latest position in group 
                aisLayerSearcher.searchById([vessel.maxid], function(response){
                    if (response.Status.toLowerCase()=="ok"){
                        vessel.ymin = response.Result.values[0][5]; vessel.xmin = response.Result.values[0][4];
    					vessel.ymax = response.Result.values[0][5]; vessel.xmax = response.Result.values[0][4];
                        item.parent().parent().find('.info').attr('vessel', JSON.stringify(vessel));
                        _this._positionMap(vessel);
                    }
                    else{
                        console.log(response);
                    }
                });
            }
            else
				this._positionMap(vessel);
        },  
        repaint: function(){

            if (!$(this._container).is(':visible'))
                return;

//console.log("REPAINT "+(new Date().getTime()-this._start)+"ms")

            this._refresh.removeClass('animate-spin');
            this._refresh.parent().addClass('clicable');
            this._refresh.parent().attr('title', _gtxt('AISSearch2.refresh'));

            this._clean();

//console.log(this._model.data);
            var scrollCont = $(this._container).find('.mCSB_container');
            var content = $(Handlebars.compile(this._tableTemplate)(this._model.data));
//console.log(content);
            if (!scrollCont[0]){
                $(this._container).append(content)    
                .mCustomScrollbar(); 
            }
            else{
                $(scrollCont).append(content);
            } 
            var _this = this;           
            $('.info', this._container).on('click', function(){
                publicInterface.showInfo(JSON.parse($(this).attr('vessel')))
            });          
            $('.position', this._container).on('click', function(){
                _this.showPosition($(this))
            });
            if (this._repaintControls)
                this._repaintControls();         
        }
    };

    //************************************
    // MY FLEET MODEL
    //************************************
    var myFleetMembersModel = {
        _isDirty: true,
        getDirty: function(){return this._isDirty},
        setDirty: function(){this._isDirty = true},
        _parseFilter: function(filter){
            var vessels = [];
            var attributes = filter.toLowerCase().replace(/and \[ts_pos_utc\].+$/, "").split("or");
//console.log(attributes);
            var myRe = /\[*([^\[\]=]+)\]*=([^ \)]+)\)? *\)?( |$)/ig;
            var myArray;
            for (var i=0; i<attributes.length; ++i){
                var vessel = null;
                while ((myArray = myRe.exec(attributes[i])) !== null) {
                    if (!vessel) vessel = {};
                    vessel[myArray[1]] = myArray[2];
                }
                if (vessel)
                    vessels.push(vessel);
            }  
//console.log(vessels);   
            return vessels;  
        },
        getCount: function(){
            return this.data ? this.data.vessels.length : 0;
        },
        layers: [],
        load: function(){
            var _this = this;
            var layerId = myFleetLayers//;[];
//             for (var l in nsGmx.gmxMap.layersByTitle){
//                 if (l.search(/(мой флот|my fleet)/i)!=-1) { 
////console.log(l);
//                     layerId.push(nsGmx.gmxMap.layersByTitle[l].options.layerID);
//                     //break;
//                 }
//             }
            if (layerId.length==0)
                this.data = {msg:[{txt:_gtxt("AISSearch2.nomyfleet")}]};

            if (layerId.length==0 || !this._isDirty)
                return Promise.resolve();

            this.layers = [];
            var errors = [],
                promises = layerId.map(function(lid){return new Promise(function(resolve, reject) {
                        sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?NeedAttrValues=false&LayerName=" +
                        lid, function(response){   
//console.log(response);                         
                            if (response.Status.toLowerCase()=="ok")
                                _this.layers.push({layerId:lid, parentLayerId:response.Result.ParentLayer, filter:response.Result.Filter});
                            else
                                errors.push(response);
                            resolve(response); 
                        }); 
                    })})
                
            return Promise.all(promises)
            .then(function() { 
//console.log(_this.layers)                                    
                            if (_this.layers.length>0){
                                var layer = _this.layers.find(function(l){return l.parentLayerId!='13E2051DFEE04EEF997DC5733BD69A15' && l.filter!="(1=0)";})// NOT TRACKS
//console.log(layer)      
                                if (!layer)
                                    return Promise.resolve({Status:"ok", Result:{values:[]}});
//console.log(layer.filter)                                    
                                var vessels = _this._parseFilter(layer.filter);
                                return new Promise(function(resolve, reject) {
                                    aisLayerSearcher.searchNames(
                                        vessels,
                                        //vessels.map(function(v){return v.mmsi}), 
                                        //vessels.map(function(v){return v.imo}),
                                        function(response){ 
                                            resolve(response);
                                        });
                                });
                            }
                            else{
                                return Promise.resolve({Status:"error", ErrorInfo:errors});
                            }
                        }
            )
            .then(function(response) {  
//console.log(response)  
//console.log("LOAD MY FLEET FINISH")               
                        if (response.Status.toLowerCase()=="ok"){                          
                            _this.data = {vessels:response.Result.values.reduce(function(p,c){
                                if (!p.some(function(v){return v.mmsi==c[1]})) {
                                    var d = new Date(c[3]*1000);
                                    p.push({vessel_name:c[0], mmsi:c[1], imo:c[2], ts_pos_utc: aisLayerSearcher.formatDate(d),
                                    xmin:c[4], xmax:c[4], ymin:c[5], ymax:c[5]}); 
                                }
                                return p;
                            }, [])};  
                            _this._isDirty = false;                         
                            return Promise.resolve(); 
                        }
                        else{                                           
                            return Promise.reject(response); 
                        }
                    });
        },
        update: function(){
            var _this = this;
            this._actualUpdate = new Date();
            var actualUpdate = this._actualUpdate;
            this.load().then(function(){
//console.log(_this.layers)
                if (_this._actualUpdate==actualUpdate)
                    myFleetMembersView.repaint();
            }, function(response){
                _this.data = null;
                if (response.Status.toLowerCase()=="auth" || 
                    (response.ErrorInfo && response.ErrorInfo.some && response.ErrorInfo.some(function(r){return r.Status.toLowerCase()=="auth"})))
                    _this.data = {msg:[{txt:_gtxt("AISSearch2.auth")}], vessels:[]};
                else{
                    console.log(response);
                }
                myFleetMembersView.repaint();              
            });
        },
        markMembers:function(vessels){
            if (this.data)
            this.data.vessels.forEach(function(v){
                var member = vessels.find(function(vv){return v.mmsi==vv.mmsi && v.imo==v.imo});
                if (member)
                    member.mf_member = "display:inline";
            });
        },
        // Layer filter example "(([mmsi]=273452320 and [imo]=8971059) or ([mmsi]=273349220 and [imo]=8811015)) and [ts_pos_utc]>=2017-07-08"
        changeFilter: function(vessel){
//console.log(this.data);
            var add = true, temp = {vessels:[]}, vessels = this.data.vessels;
            for (var i=0; i< this.data.vessels.length; ++i){
                if ( this.data.vessels[i].imo==vessel.imo &&  this.data.vessels[i].mmsi==vessel.mmsi)
                    add = false;
                else
                    temp.vessels.push(this.data.vessels[i]);
            }
            if (add)
                    temp.vessels.push(vessel);
            this.data = temp;
            var _this = this;
            this.layers.forEach(function(layer){
                layer.filter = _this.data.vessels.length==0?
                "(1=0)":
                _this.data.vessels.map(function(v){
                    return layer.parentLayerId!='13E2051DFEE04EEF997DC5733BD69A15'? // IS TRACKS
                    "([mmsi]="+v.mmsi+" and [imo]="+v.imo+")":
                    "([mmsi]="+v.mmsi+")";
                }).join(" or ");

                /*
                        var editFilter = layer.parentLayerId!='13E2051DFEE04EEF997DC5733BD69A15'? // IS TRACKS
                        "([mmsi]="+vessel.mmsi+" and [imo]="+vessel.imo+")":
                        "([mmsi]="+vessel.mmsi+")";
                        if(layer.filter.search(/(mmsi|imo)/i)!=-1){

                            var conditions = layer.filter.replace(/\( *(\(.+\)) *\).*$/, "$1").split(" or "),
                            pos = conditions.indexOf(editFilter);
//console.log(conditions)
                            if (pos!=-1)
                                conditions.splice(pos, 1);
                            else
                                conditions.push(editFilter);
                            if (conditions.length>0)
                                layer.filter = conditions.join(" or ");
                            else
                                layer.filter = "(1=0)";
                        }
                        else{
                            layer.filter = editFilter;
                        }
                */
                var today = new Date(new Date()-3600*24*7*1000);
                today = today.getFullYear()+"-"+("0"+(today.getMonth()+1)).slice(-2)+"-"+("0"+today.getDate()).slice(-2);
                if (layer.parentLayerId!='13E2051DFEE04EEF997DC5733BD69A15')
                    layer.filter = "("+layer.filter+") and [ts_pos_utc]>='"+ today +"'";
                else
                    layer.filter = "("+layer.filter+") and [Date]>='"+ today +"'";
//console.log(layer.filter)
            });
            return Promise.all(this.layers.map(function(l){
                return new Promise(function(resolve){
                    var t = setTimeout(function(){
                        resolve();
                    }, 1000);
                });
                /*
                        return new Promise(function(resolve, reject) {
                        sendCrossDomainJSONRequest(serverBase + 
                        "VectorLayer/Update.ashx?VectorLayerID="+l.layerId+"&filter=" +
                        l.filter, function(response){
                            if (response.Status.toLowerCase() == "ok") 
                                setTimeout(function run() {

                                    sendCrossDomainJSONRequest(serverBase + 
                                    "AsyncTask.ashx?TaskID="+response.Result.TaskID, function(response){
                                        if (response.Status.toLowerCase() == "ok") 
                                            if (!response.Result.Completed)
                                                setTimeout(run, 1000);
                                            else{
                                                if(response.Result.ErorInfo){
                                                    console.log(response)
                                                    reject();
                                                }
                                                else
                                                    resolve();
                                        }
                                        else{
                                            console.log(response)
                                            reject();
                                        }

                                    });
                                }, 1000);
                            else{
                                console.log(response);
                                reject();
                            }
                        }); 
                        });
                */
                    })
            ).then(
            //return Promise.resolve().then(
            function(){
                this._isDirty = true;
//console.log(this.data);
                L.gmx.layersVersion.chkVersion();
                return Promise.resolve();
            }.bind(this),
            function(){
                return Promise.reject();
            });
        }
    };    

    //************************************
    // AIS SCREEN SEARCH MODEL
    //************************************
    var aisScreenSearchModel = {
        _isDirty: true,
        getDirty: function(){return this._isDirty},
        setDirty: function(){this._isDirty = true},
        getCount: function(){
            return this.data ? this.data.vessels.length : 0;
        },
        load: function(actualUpdate){
            var _this = this;
            if (!this._isDirty){
                return Promise.resolve();
            }
            return Promise.all([new Promise(function(resolve, reject){
                aisLayerSearcher.searchScreen({
                    dateInterval: nsGmx.widgets.commonCalendar.getDateInterval(),
                    border: true,
                    group:true
                }, function (json) {
//console.log(json)
                    if (json.Status.toLowerCase()=="ok")
                    {
                        _this.dataSrc = {vessels: json.Result.values.map(function(v){
                            return {vessel_name:v[0], mmsi:v[1], imo:v[2], mf_member:'display:none', 
                        xmin:v[4], xmax:v[5], ymin:v[6], ymax:v[7], maxid:v[3]}
                        })};
                        if (_this._actualUpdate==actualUpdate){
//console.log("ALL CLEAN")
//console.log("1>"+new Date(_this._actualUpdate))
//console.log("2>"+new Date(actualUpdate))
                            _this._isDirty = false;
                        }
                        resolve();
                    }
                    else{
                        reject(json);
                    }
//console.log("LOAD SCREEN SEARCH DONE")
                    //return resolve();
                });
            })
            ,myFleetMembersModel.load()
            ]);
        },
        _actualUpdate: new Date().getTime(),
        filterString: "",
        update: function(){
            var _this = this;
            this._actualUpdate = new Date().getTime();
            var actualUpdate = this._actualUpdate;  
//this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
//this.filterString&&console.log(this.filterString.replace(/^\s+/, "").replace(/\s+\r*$/, "")!="")

            this.load(actualUpdate).then(function(){
//console.log("LOADED "+(new Date().getTime()-_this._actualUpdate)+"ms")
//console.log("3>"+new Date(_this._actualUpdate))
//console.log("4>"+new Date(actualUpdate))
                if (_this._actualUpdate==actualUpdate){
                    _this.filterString = _this.filterString.replace(/\r+$/, "");
                    if (_this.dataSrc)
                        if(_this.filterString!=""){
                            _this.data = {vessels:_this.dataSrc.vessels.filter(function(v){
                                return v.vessel_name.search(new RegExp("\\b"+_this.filterString, "ig"))!=-1;
                            })}; 
                        }
                        else{
                            _this.data = {vessels:_this.dataSrc.vessels.map(function(v){return v;})};
                        }
                    
                    if (_this.data)
                        myFleetMembersModel.markMembers(_this.data.vessels);
                    aisSearchView.repaint();
                }
            }, function(json){
                _this.dataSrc = null;
console.log(json)
                if (json.Status.toLowerCase()=="auth" || 
                    (json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function(r){return r.Status.toLowerCase()=="auth"})))
                    _this.data = {msg:[{txt:_gtxt("AISSearch2.auth")}], vessels:[]};
                else{
                    //_this.data = {msg:[{txt:"!!!"}], vessels:[]};
                    console.log(json);
                }
                aisSearchView.repaint();
            });
        }
    }

    //************************************
    // AIS DB SEARCH MODEL
    //************************************
    var aisDbSearchModel = {
        getCount: function(){
            return this.data ? this.data.vessels.length : 0;
        },
        filterString: "",
        _searchString: "",
        update: function(){
            var _this = this;
            this._actualUpdate = new Date().getTime();
            var actualUpdate = this._actualUpdate; 
            
//this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
//this.filterString&&console.log(this._searchString+" "+this._searchString.search(/\r$/))
            this.filterString = this.filterString.replace(/\r+$/, "");
 
            new Promise(function(resolve, reject){
                if (_this.filterString.length>0 && _this.filterString!=_this._searchString)
                {
                    _this._searchString = _this.filterString;
                    aisLayerSearcher.searchString(_this._searchString, true, function(response){
                        if (response.Status.toLowerCase()=="ok")
                        {
                            _this.data = {vessels: response.Result.values.map(function(v){
                                return {vessel_name:v[0], mmsi:v[1], imo:v[2], mf_member:'display:none', ts_pos_utc: aisLayerSearcher.formatDate(new Date(v[3]*1000)),
                            xmin:v[4], xmax:v[4], ymin:v[5], ymax:v[5]}
                            })};
                            resolve();
                        }
                        else{
                            reject(response);
                        }
                    })
                }
                else if(_this.filterString.length==0){
                    _this.data = null;
                    resolve();
                }
                else
                    resolve();
            })
            .then(function(){
//console.log("LOADED "+(new Date().getTime()-_this._actualUpdate)+"ms")
                if (_this._actualUpdate==actualUpdate){
                    if (_this.data)
                        myFleetMembersModel.markMembers(_this.data.vessels);
                    aisSearchView.repaint();
                }
            },
            function(response){
                //showErrorMessage(json.ErrorInfo.ErrorMessage);                
                if (response.Status.toLowerCase()=="auth" || 
                (response.ErrorInfo && response.ErrorInfo.ErrorMessage.search(/can not access/i)!=-1))
                    _this.data = {msg:[{txt:_gtxt("AISSearch2.auth")}], vessels:[]};
                else
                    console.log(response);
                _this.dataSrc = null;
                aisSearchView.repaint();
            });
        }
    };

    //************************************
    // AIS LAYERS SEARCHER
    //************************************
    var aisLayerSearcher = {
        _lastPointLayerID: '303F8834DEE2449DAF1DA9CD64B748FE',
        _layerID: '802BD01EDE4D45A6BD6FAAD25A1F2CBD',//LastPosition ForAnyDate//'8EE2C7996800458AAF70BABB43321FA4' //All,//'4F8B3FC69D3B455A96C8505E8287AD52',//LastPoint ForAnyVessel 
        _serverScript: (window.serverBase || 'http://maps.kosmosnimki.ru/') + 'VectorLayer/Search.ashx',
        getBorder :function () {
            var lmap = nsGmx.leafletMap;
            var dFeatures = lmap.gmxDrawing.getFeatures();
            if (dFeatures.length) { return dFeatures[dFeatures.length - 1].toGeoJSON(); }
            var latLngBounds = lmap.getBounds(),
                sw = latLngBounds.getSouthWest(),
                ne = latLngBounds.getNorthEast(),
                min = { x: sw.lng, y: sw.lat },
                max = { x: ne.lng, y: ne.lat },
                minX = min.x,
                maxX = max.x,
                geo = { type: 'Polygon', coordinates: [[[minX, min.y], [minX, max.y], [maxX, max.y], [maxX, min.y], [minX, min.y]]] },
                w = (maxX - minX) / 2;

            if (w >= 180) {
                    geo = { type: 'Polygon', coordinates: [[[-180, min.y], [-180, max.y], [180, max.y], [180, min.y], [-180, min.y]]] };
            } 
            else if (maxX > 180 || minX < -180) {
                var center = ((maxX + minX) / 2) % 360;
                if (center > 180) { center -= 360; }
                else if (center < -180) { center += 360; }
                minX = center - w; maxX = center + w;
                if (minX < -180) {
                    geo = { type: 'MultiPolygon', coordinates: [
                                    [[[-180, min.y], [-180, max.y], [maxX, max.y], [maxX, min.y], [-180, min.y]]],
                                    [[[minX + 360, min.y], [minX + 360, max.y], [180, max.y], [180, min.y], [minX + 360, min.y]]]
                                ]
                    };
                } else if (maxX > 180) {
                    geo = { type: 'MultiPolygon', coordinates: [
                                    [[[minX, min.y], [minX, max.y], [180, max.y], [180, min.y], [minX, min.y]]],
                                    [[[-180, min.y], [-180, max.y], [maxX - 360, max.y], [maxX - 360, min.y], [-180, min.y]]]
                                ]
                    };
                }
            }
            return geo;
        },   
        formatDate: function(d){
            var dd = ("0"+d.getUTCDate()).slice(-2),
                m = ("0"+(d.getUTCMonth()+1)).slice(-2),
                y = d.getUTCFullYear(),
                h = ("0"+d.getUTCHours()).slice(-2),
                mm = ("0"+d.getUTCMinutes()).slice(-2);
            return dd+"."+m+"."+y+" "+h+":"+mm;
        }, 
        searchById: function(aid, callback){
            var request =  {
                            WrapStyle: 'window',
                            layer: this._layerID,
                            columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"}]',
                            query: "([id] IN (" + aid.join(',') + "))"
            };
            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
        },
        searchString: function(searchString, isfuzzy, callback){
            var query = ""; 
            if (searchString) {
                searchString = searchString.toUpperCase();
                    if (searchString.search(/[^\d, ]/) === -1) {
                            var arr = searchString.replace(/ /g, '').split(/,/);
                            query = "([mmsi] IN (" + arr.join(',') + "))"+
                            "OR ([imo] IN (" + arr.join(',') + "))"
                    } else {
                        if (isfuzzy)
                            query = '([vessel_name] startswith \'' + searchString + '\') OR ([vessel_name] contains \' ' + searchString + '\')';
                        else
                            query = '([vessel_name] startswith \'' + searchString + '\') OR ([vessel_name] contains \' ' + searchString + '\')';
                    }
            }
            var request =  {
                            WrapStyle: 'window',
                            layer: this._lastPointLayerID,
                            columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"}]',
                            orderdirection: 'desc',
                            orderby: 'ts_pos_utc',
                            query: query
            };
            if (isfuzzy)
                request.pagesize = 1000;
            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
        },      
        searchNames: function(avessels, callback){
            var request =  {
                            WrapStyle: 'window',
                            layer: this._lastPointLayerID,
                            columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"}'+
                            ',{"Value":"flag_country"},{"Value":"vessel_type"}'+
                            ',{"Value":"cog"},{"Value":"sog"}'+
                            ',{"Value":"rot"},{"Value":"heading"}'+
                            ',{"Value":"destination"},{"Value":"nav_status"}'+
                            ',{"Value":"draught"}'+
                            ']',
                            orderdirection: 'desc',
                            orderby: 'ts_pos_utc',
                            query: avessels.map(function(v){return "([mmsi]="+v.mmsi+(v.imo && v.imo!=""?(" and [imo]="+v.imo):"")+")"}).join(" or ")
                            //([mmsi] IN (" + ammsi.join(',') + "))"+
                            //"and ([imo] IN (" + aimo.join(',') + "))"
            };
//console.log(request)
            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
        },
        searchScreen0:  function(options, callback) {
            // var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval();
            // var dt1 = mapDateInterval.get('dateBegin'),
            //     dt2 = mapDateInterval.get('dateEnd');
            var aisLayer = nsGmx.gmxMap.layersByID[this._layerID],
                prop = aisLayer ? (aisLayer._gmx ? aisLayer._gmx : aisLayer).properties : {},
                TemporalColumnName = prop.TemporalColumnName || 'ts_pos_utc',
                query = '(',
                columns = '{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"}';

            if (options.dateInterval){
                var dt1 = options.dateInterval.get('dateBegin'),
                    dt2 = options.dateInterval.get('dateEnd');
                query += '([' + TemporalColumnName + '] >= \'' + dt1.toJSON() + '\')';
                query += ' and ([' + TemporalColumnName + '] < \'' + dt2.toJSON() + '\')';
            }
            if (options.str) {
                        if (options.str.search(/[^\d, ]/) === -1) {
                            var arr = options.str.replace(/ /g, '').split(/,/);
                            query += ' and ([mmsi] IN (' + arr.join(',') + '))';
                        } else {
                            query += ' and ([vessel_name] contains \'' + options.str + '\')';
                        }
            }
            query += ')';
            var request =  {
                            WrapStyle: 'window',
                            //border: JSON.stringify(searchBorder),
                            /* eslint-disable camelcase */
                            //border_cs: 'EPSG:4326',
                            /* eslint-enable */
                            // out_cs: 'EPSG:3395',
                            // pagesize: 100,
                            // orderdirection: 'desc',
                            orderby: 'vessel_name',
                            layer: this._layerID,
                            columns: '[' + columns + ']',
                            //groupby: '[{"Value":"imo"},{"Value":"mmsi"},{"Value":"vessel_name"}]',
                            query: query
            };
            if (options.border){
                var searchBorder = this.getBorder();
                $.extend(request, {border: JSON.stringify(searchBorder), border_cs: 'EPSG:4326'});
            }
            if (options.group)
            {
                columns += ',{"Value":"max(id)", "Alias":"maxid"}';
                columns += ',{"Value":"min(STEnvelopeMinX([GeomixerGeoJson]))", "Alias":"xmin"}';
                columns += ',{"Value":"max(STEnvelopeMaxX([GeomixerGeoJson]))", "Alias":"xmax"}';
                columns += ',{"Value":"min(STEnvelopeMinY([GeomixerGeoJson]))", "Alias":"ymin"}';
                columns += ',{"Value":"max(STEnvelopeMaxY([GeomixerGeoJson]))", "Alias":"ymax"}';
                $.extend(request, {columns: '[' + columns + ']', groupby: '[{"Value":"imo"},{"Value":"mmsi"},{"Value":"vessel_name"}]'})
            }
            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
        },
        searchScreen:  function(options, callback) {
            var lmap = nsGmx.leafletMap;
            var dt1 = options.dateInterval.get('dateBegin'),
                dt2 = options.dateInterval.get('dateEnd');
                //query += '([' + TemporalColumnName + '] >= \'' + dt1.toJSON() + '\')';
                //query += ' and ([' + TemporalColumnName + '] < \'' + dt2.toJSON() + '\')';
            var latLngBounds = lmap.getBounds(),
                sw = latLngBounds.getSouthWest(),
                ne = latLngBounds.getNorthEast(),
                min = { x: sw.lng, y: sw.lat },
                max = { x: ne.lng, y: ne.lat };
//console.log(min);
//console.log(max);
            var searchServiceUrl = (window.serverBase || 'http://maps.kosmosnimki.ru/') //"http://localhost/GM/"//
            + "Plugins/AIS/SearchScreen.ashx";
            L.gmxUtil.sendCrossDomainPostRequest(searchServiceUrl, 
            {WrapStyle: 'window',s:dt1.toJSON(),e:dt2.toJSON(),minx:min.x,miny:min.y,maxx:max.x,maxy:max.y}, 
            callback);
        }
    };  

    Handlebars.registerHelper('aisinfoid', function(context) {
        return context.mmsi+" "+context.imo;
    });

    Handlebars.registerHelper('aisjson', function(context) {
        return JSON.stringify(context);
    });

    //************************************
    // AIS SEARCH VIEW
    //************************************
    var aisSearchView = $.extend({
        _tableTemplate: '{{#each vessels}}' +
        '<div class="ais_vessel">' +
        '<table border=0><tr><td><span class="position">{{vessel_name}}</span>'+
        '{{#if ts_pos_utc}} <span class="date">({{ts_pos_utc}})</span>{{/if}}'+
        '</td><td><i class="icon-ship" vessel="{{aisinfoid this}}" style="{{mf_member}}" title="{{i "AISSearch2.myFleetMember"}}"></i></td>'+
        '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">'+
        //'<i class="clicable icon-info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}"></i>'+
        '<div></td></tr></table>' +
        '</div>' +
        '{{/each}}'+
        '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}',
        _model: aisScreenSearchModel,
        _repaintControls: function(){
            $(this._count).text(_gtxt('AISSearch2.found')+this._model.getCount());
        },
        _doClean: function(){
            $(this._count).text(_gtxt('AISSearch2.found')+0);
        },
        _bindControlEvents: function(){
                var _this = this;
                $('select', this._canvas).change(function(e){
                    var models = [aisScreenSearchModel, aisDbSearchModel]; 
                    _this._model = models[(e.target.selectedOptions[0].value)];
                    $('input', _this._search).val(_this._model.filterString);
                    _this.show();
                });
                this._refresh.parent().click(function(){
                    //console.log(_this._refresh)
                    _this.show();
                })
                $('i', this._search).click(function(e){
                    _this._model.filterString = $(this).siblings('input').val()+'\r';
                    _this.show();
                })
                this._search.keyup(function(e){
                    var input = $('input', this).val() || "";
                    input = input.replace(/^\s+/, "").replace(/\s+$/, "");
                    if (input==_this._model.filterString && e.keyCode!=13)
                        return;
                    _this._model.filterString = input; 
                    if (e.keyCode==13)
                        _this._model.filterString += '\r' 
                    _this.show();
                })
        }
    }, aisView);

    //************************************
    // MY FLEET VIEW
    //************************************
    var myFleetMembersView = $.extend({
        _tableTemplate: '{{#each vessels}}' +
        '<div class="ais_vessel">' +
        '<table border=0><tr><td><span class="position">{{vessel_name}}</span> <span class="date">({{ts_pos_utc}})</span></td>'+
        '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">'+
        //'<i class="clicable icon-info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}"></i>'+
        '</div></td></tr></table>' +
        '</div>' +
        '{{/each}}'+
        '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}',
        _model: myFleetMembersModel
    }, aisView);

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
        'AISSearch2.last_sig': 'Последний сигнал UTC'
        
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
        'AISSearch2.last_sig': 'Last signal UTC'
    });

    gmxCore.addModule(pluginName, publicInterface, {
        css: pluginName + '.css'
    });
})();
