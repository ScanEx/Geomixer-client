require("./all.css")
require("./locale.js")
const {polyFind, polyFindIndex} = require("./polyfill.js")
const createDialog = require('./infodialog.js')
	
    Handlebars.registerHelper('aisinfoid', function(context) {
        return context.mmsi+" "+context.imo;
    });

    Handlebars.registerHelper('aisjson', function(context) {
        return JSON.stringify(context);
    });

    var pluginName = 'AISSearch2',
        toolbarIconId = 'AISSearch2',
        modulePath = gmxCore.getModulePath(pluginName),
        scheme = document.location.href.replace(/^(https?:).+/, "$1"),
        baseUrl = window.serverBase || scheme + '//maps.kosmosnimki.ru/',
        //aisServiceUrl = scheme + "//localhost/GM/Plugins/AIS/",
        aisServiceUrl = baseUrl + "Plugins/AIS/",
        infoDialogCascade = [],  
        allIinfoDialogs = [],
        myFleetLayers = [],
        layersWithBaloons = [],
        //aisLayerID,
        //aisLastPoint,
        tracksLayerID,
        aisLayer,
		//screenSearchLayer,
        tracksLayer,
        displaingTrack,
		defaultSearch,
		highlight = L.marker([0, 0], {icon:L.icon({className:"ais_highlight-icon", iconAnchor:[12, 12], iconSize:[25,25], iconUrl:'plugins/ais/aissearch/highlight.png'}), zIndexOffset:1000}),
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
                aisLayerSearcher.aisLayerID = params.aisLayer || '8EE2C7996800458AAF70BABB43321FA4';				
                aisLayerSearcher.aisLastPoint = params.aisLastPoint || '303F8834DEE2449DAF1DA9CD64B748FE';
                aisLayer = layersByID[aisLayerSearcher.aisLayerID];
				aisLayerSearcher.screenSearchLayer = params.searchLayer || '8EE2C7996800458AAF70BABB43321FA4';
                tracksLayerID = params.tracksLayerID || '13E2051DFEE04EEF997DC5733BD69A15';
                tracksLayer = layersByID[tracksLayerID];
				defaultSearch = params.defaultSearch || 'screen';
				toolbarIconId = params.toolbarIconId;
                var setLocaleDate = function(layer){
                    if (layer)
                    layer.bindPopup('').on('popupopen',function(e){
                        //console.log(e.gmx.properties);
                        var result, re = /\[([^\[\]]+)\]/g, lastIndex = 0, template = "", 
                        str = e.gmx.templateBalloon, props = e.gmx.properties;
                        while ((result = re.exec(str)) !== null) {
                            template += str.substring(lastIndex, result.index);
                            if (props.hasOwnProperty(result[1]))
                                if (result[1].search(/^ts_/)!=-1)
                                    template += aisLayerSearcher.formatDate(new Date(props[result[1]]*1000))
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
                        if (e.gmx && e.gmx.properties.hasOwnProperty("imo"))
                        publicInterface.showInfo(e.gmx.properties)
                        })           
                },
                forLayers = function(layer){
                    if (layer){
                            setLocaleDate(layer)                 
                            setLayerClickHandler(layer)
                    }        
                }
                for (var key in params) {
                    if (key=="myfleet"){
                        myFleetLayers = params[key].split(",").map(function(id){
                           return  id.replace(/\s/, "");
                        });
                        for (var i=0; i<myFleetLayers.length; ++i) { 
                            forLayers(layersByID[myFleetLayers[i]])
                        }
                    }
                    else{ 
                        forLayers(layersByID[params[key]] )
                    }
                }
				myFleetMembersModel.mapLayers = myFleetLayers
				highlight.addEventListener('click', function(e){e.target.vessel && publicInterface.showInfo(e.target.vessel, true)});
				var iconOpt_mf = {
                    //id: toolbarIconId,
					className: "VesselSearchTool",
                    togglable: true,
                    title: _gtxt('AISSearch2.caption')
                };	
				if (toolbarIconId)
					iconOpt_mf.id = toolbarIconId;
				else
					iconOpt_mf.text = _gtxt('AISSearch2.capShort');
			
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
				if (location.search.search(/x=[^y=]+y=/i)!=-1){
					var a = location.search.toLowerCase().substr(1).split('&'),
					x = a.filter(function(c){return !c.indexOf("x=")})[0].substr(2),
					y = a.filter(function(c){return !c.indexOf("y=")})[0].substr(2)
					highlight.vessel = null;
					highlight.setLatLng([y, x]).addTo(nsGmx.leafletMap);
				}
            },
            showInfo: function(vessel, getmore){
                var ind = polyFindIndex(allIinfoDialogs, function(d){return d.vessel.imo==vessel.imo && d.vessel.mmsi==vessel.mmsi});
                if (ind>=0){
                    $(allIinfoDialogs[ind].dialog).parent().insertAfter($('.ui-dialog').eq($('.ui-dialog').length-1));
                    return;
                }

                var dialog = createDialog({
					vessel:vessel, 
					getmore:getmore, displaingTrack:displaingTrack,
					closeFunc:function(event){
                            var ind = polyFindIndex(infoDialogCascade, function(d){return d.id==dialog.id});
                            if (ind>=0)
                                infoDialogCascade.splice(ind, 1);
                            ind = polyFindIndex(allIinfoDialogs, function(d){return d.dialog.id==dialog.id});
                            if (ind>=0)
                                allIinfoDialogs.splice(ind, 1);
                        },
					aisLayerSearcher:aisLayerSearcher, publicInterface:publicInterface,
					scheme:scheme, aisServiceUrl:aisServiceUrl, 
					aisView:aisView, myFleetMembersView:myFleetMembersView,
					modulePath:modulePath,
					gifLoader:gifLoader,
					aisPluginPanel:aisPluginPanel
				},
				{ 	// COMMANDS
					openVesselInfoView: vesselInfoView.open,
					showTrack: function (mmsiArr, bbox) { 
						let lmap = nsGmx.leafletMap,                 
							filterFunc = function (args) {
								var mmsi = args.properties[1],
									i, len;
								for (i = 0, len = mmsiArr.length; i < len; i++) {
									if (mmsi === mmsiArr[i]) { return true; }
								}
								return false;
							};
						if (bbox) { lmap.fitBounds(bbox, { maxZoom: 11 }); }
						if (aisLayer) {
								if (mmsiArr.length) {
									displaingTrack = mmsiArr[0];
									aisLayer.setFilter(filterFunc);
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
									tracksLayer.setFilter(filterFunc);
									if (!tracksLayer._map) {
										lmap.addLayer(tracksLayer);
									}
								} else {
									tracksLayer.removeFilter();
									lmap.removeLayer(tracksLayer);
								}
						}
					}					
				})				
            
                if (infoDialogCascade.length>0){
                    var pos  = $(infoDialogCascade[infoDialogCascade.length-1]).parent().position();
                    $(dialog).dialog("option", "position", [pos.left+10, pos.top+10]);   
                }

                infoDialogCascade.push(dialog);
                allIinfoDialogs.push({vessel:vessel, dialog:dialog});
                $(dialog).on( "dialogdragstop", function( event, ui ) {
                    var ind = polyFindIndex(infoDialogCascade, function(d){return d.id==dialog.id});
                    if (ind>=0)
                        infoDialogCascade.splice(ind, 1);
                });
             
            }
        };


    var svgLoader = '<div class="loader">'+
  '<svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="22px" height="22px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">'+
  '<path opacity="0.2" fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"/>'+
    '<g transform="rotate(180 25 25)">'+
  '<path opacity="0.2" fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"/>'+
    '</g>'+    
  '<path fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">'+
    '<animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/>'+
    '</path>'+
  '</svg>'+
'</div>',
    gifLoader = '<img src="img/progress.gif">'
	

	const BaseView = require('./Views/BaseView.js') 
	const aisView = new BaseView({publicInterface:publicInterface, highlight:highlight})    

	const Searcher = require('./Search/Searcher.js') 
	const aisLayerSearcher = new Searcher({baseUrl:baseUrl, aisServiceUrl: aisServiceUrl})

    const MyFleetModel = require('./Models/MyFleetModel.js')
    const myFleetMembersModel = new MyFleetModel({baseUrl:baseUrl, aisLayerSearcher:aisLayerSearcher, polyFind:polyFind, polyFindIndex:polyFindIndex})	
	
    const ScreenSearchModel = require('./Models/ScreenSearchModel.js')	
    const aisScreenSearchModel = new ScreenSearchModel({myFleetMembersModel:myFleetMembersModel, aisLayerSearcher:aisLayerSearcher})

    const DbSearchModel = require('./Models/DbSearchModel.js')
    const aisDbSearchModel = new DbSearchModel({myFleetMembersModel:myFleetMembersModel, aisLayerSearcher:aisLayerSearcher})

	const SearchView = require('./Views/SearchView.js')
	const aisSearchView = new SearchView({aisView:aisView, aisScreenSearchModel:aisScreenSearchModel, aisDbSearchModel:aisDbSearchModel, highlight:highlight})
	
	const MyFleetView = require('./Views/MyFleetView.js')
    const myFleetMembersView = new MyFleetView({aisView:aisView, myFleetMembersModel:myFleetMembersModel})
	
    const VesselInfoView  = require('./Views/VesselInfoView.js')
	const vesselInfoView  = new VesselInfoView({modulePath:modulePath, aisServiceUrl:aisServiceUrl, scheme:scheme})
	

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
                    '<td><div><i class="icon-down-dir"><select>'+
					(defaultSearch=='screen'?
					'<option value="0">{{i "AISSearch2.screen"}}</option>'+'<option value="1">{{i "AISSearch2.database"}}</option>' :
					'<option value="1">{{i "AISSearch2.database"}}</option>'+'<option value="0">{{i "AISSearch2.screen"}}</option>')+
					'</select></i></div></td>'+
                    '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>'+gifLoader+'</div></div></td>'+
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
                    '<td><div class="refresh"><div>'+gifLoader+'</div></div></td><td></td><td></td>'+
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
				aisSearchView.setModel(defaultSearch);

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
			nsGmx.leafletMap.removeLayer(highlight)
        }
    };


    gmxCore.addModule(pluginName, publicInterface, {
        css: pluginName + '.css'
    });
