	let NOSIDEBAR = false,
		PRODUCTION = false,
		SIDEBAR2 = false;
	if (has('NOSIDEBAR'))
		NOSIDEBAR = true;
	if (has('SIDEBAR2'))
		SIDEBAR2 = true;
	if (has('PRODUCTION'))
		PRODUCTION = true;
	
	require("./all.css")
	require("./locale.js")
	const {polyFind, polyFindIndex} = require("./polyfill.js"),	
		BaseView = require('./Views/BaseView.js'),
		Searcher = require('./Search/Searcher.js'), 
		MyFleetModel = require('./Models/MyFleetModel.js'),	
		ScreenSearchModel = require('./Models/ScreenSearchModel.js'),
		DbSearchModel = require('./Models/DbSearchModel.js'),
		HistoryModel = require('./Models/HistoryModel.js'),
		SearchView = require('./Views/SearchView.js'),	
		MyFleetView = require('./Views/MyFleetView.js'),	
		VesselInfoView  = require('./Views/VesselInfoView.js'),	
		HistoryView  = require('./Views/HistoryView.js'),
		createInfoDialog = require('./infodialog.js')
	
	let showTrack = function (mmsiArr, bbox) { 
                var lmap = nsGmx.leafletMap;                 
                var filterFunc = function (args) {
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
		
	Handlebars.registerHelper('aisinfoid', function(context) {
		return context.mmsi+" "+context.imo;
	});

	Handlebars.registerHelper('aisjson', function(context) {
		return JSON.stringify(context);
	});

	let pluginName = 'AISSearch2',
		cssTable = pluginName
	if (!PRODUCTION)
		pluginName += 'Test'
		
	
    let toolbarIconId = 'AISSearch2',
        modulePath = gmxCore.getModulePath(pluginName),
        scheme = document.location.href.replace(/^(https?:).+/, "$1"),
        baseUrl = window.serverBase || scheme + '//maps.kosmosnimki.ru/',
        aisServiceUrl = baseUrl + "Plugins/AIS/",
		
        myFleetLayers = [],
        tracksLayerID,
        aisLayer,
        tracksLayer,
		historyLayer,
        displaingTrack,
		defaultSearch,
		
        infoDialogCascade = [],  
        allIinfoDialogs = [],
		
		highlight = L.marker([0, 0], {icon:L.icon({className:"ais_highlight-icon", iconAnchor:[12, 12], iconSize:[25,25], iconUrl:'plugins/ais/aissearch/highlight.png'}), zIndexOffset:1000}),


        publicInterface = {
            pluginName: pluginName,
            afterViewer: function (params, map) {				
                let _params = L.extend({
                        // regularImage: 'ship.png',
                        // activeImage: 'active.png'
                    }, params),
                path = gmxCore.getModulePath(pluginName),
                layersByID = nsGmx.gmxMap.layersByID,
                lmap = map; 

                aisLayer = params.aisLayerID && layersByID[params.aisLayerID]; // for track markers
				
                aisLayerSearcher.aisLayerID = params.searchLayer || '8EE2C7996800458AAF70BABB43321FA4';	// searchById			
				aisLayerSearcher.screenSearchLayer = params.searchLayer || '8EE2C7996800458AAF70BABB43321FA4'; // screen search				
                aisLayerSearcher.aisLastPoint = params.aisLastPoint || '303F8834DEE2449DAF1DA9CD64B748FE'; // db search
				
				historyLayer = params.historyLayer;
				aisLayerSearcher.historyLayer = historyLayer;
	
                tracksLayerID = params.tracksLayerID || '13E2051DFEE04EEF997DC5733BD69A15';
                tracksLayer = layersByID[tracksLayerID];
				
				defaultSearch = params.defaultSearch || 'screen';
				toolbarIconId = params.toolbarIconId;
				
                let setLocaleDate = function(layer){
                    if (layer)
                    layer.bindPopup('').on('popupopen',function(e){
//console.log(e);

                        var result, re = /\[([^\[\]]+)\]/g, lastIndex = 0, template = "", 
                        str = e.gmx.templateBalloon, props = e.gmx.properties;
                        while ((result = re.exec(str)) !== null) {
                            template += str.substring(lastIndex, result.index);
                            if (props.hasOwnProperty(result[1]))
                                if (result[1].search(/^ts_pos_utc/i)!=-1){
                                    template += aisLayerSearcher.formatDate(new Date(props[result[1]]*1000))
								}
                                else if (result[1].search(/^Date/i)!=-1){
                                    template += aisLayerSearcher.formatDate(new Date(props[result[1]]*1000)).replace(/ .+/, "")
								}
                                else
                                    template += props[result[1]]
							if (result[1].search(/summary/i)!=-1){
                                    template += e.gmx.summary
							}								
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
//console.log(key + ' ' +params[key])
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
					
				aisPluginPanel.views = {aisSearchView:aisSearchView, myFleetMembersView:myFleetMembersView, historyView:historyView}
				aisPluginPanel.activeView = aisSearchView

				if (NOSIDEBAR){
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
					
				}
				else{
					let sidebar = SIDEBAR2 ? window.sidebarWidget : window.sidebarControl,
						sidebarTab = sidebar.setPane(
						"AISSearch", {
							createTab: window.createTabFunction({
								icon: "AISSearch",
								active: "ais_sidebar-icon-active",
								inactive: "ais_sidebar-icon",
								hint: _gtxt('AISSearch2.caption')
							})
						}
					)

					sidebar.on('opened', function (e) {
						if (e.id=='AISSearch')
							aisPluginPanel.show(sidebarTab);
					})
				}				
							
				if (location.search.search(/x=[^y=]+y=/i)!=-1){
					var a = location.search.toLowerCase().substr(1).split('&'),
					x = a.filter(function(c){return !c.indexOf("x=")})[0].substr(2),
					y = a.filter(function(c){return !c.indexOf("y=")})[0].substr(2)
					highlight.vessel = null;
					highlight.setLatLng([y, x]).addTo(nsGmx.leafletMap);
				}
            },
            showHistory: function(vessel){
				historyView.vessel = vessel
				historyView.drawBackground()
				$('.ais_tab', _canvas).removeClass('active').eq(2).click();
			},
            showInfo: function(vessel, getmore){
                var ind = polyFindIndex(allIinfoDialogs, function(d){return d.vessel.imo==vessel.imo && d.vessel.mmsi==vessel.mmsi});
                if (ind>=0){
                    $(allIinfoDialogs[ind].dialog).parent().insertAfter($('.ui-dialog').eq($('.ui-dialog').length-1));
                    return;
                }

                var dialog = createInfoDialog({
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
					aisLayerSearcher:aisLayerSearcher, //publicInterface:publicInterface,
					scheme:scheme, aisServiceUrl:aisServiceUrl, 
					aisView:aisView, myFleetMembersView:myFleetMembersView, 
					modulePath:modulePath,
					aisPluginPanel:aisPluginPanel
				},
				{ 
					openVesselInfoView: vesselInfoView.open,
					showTrack: showTrack					
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
        },

		gifLoader = '<img src="img/progress.gif">',

		vesselInfoView  = new VesselInfoView({modulePath:modulePath, aisServiceUrl:aisServiceUrl, scheme:scheme}),
		aisLayerSearcher = new Searcher({baseUrl:baseUrl, aisServiceUrl: aisServiceUrl}),

		myFleetMembersModel = new MyFleetModel({baseUrl:baseUrl, aisLayerSearcher:aisLayerSearcher, polyFind:polyFind, polyFindIndex:polyFindIndex, myFleetLayers:myFleetLayers}),	
		aisScreenSearchModel = new ScreenSearchModel({myFleetMembersModel:myFleetMembersModel, aisLayerSearcher:aisLayerSearcher}),
		aisDbSearchModel = new DbSearchModel({myFleetMembersModel:myFleetMembersModel, aisLayerSearcher:aisLayerSearcher}),
		historyModel = new HistoryModel({baseUrl:baseUrl, aisLayerSearcher:aisLayerSearcher, polyFind:polyFind, polyFindIndex:polyFindIndex}),	

		aisView = new BaseView({publicInterface:publicInterface, highlight:highlight}),					
		aisSearchView = new SearchView({aisView:aisView, aisScreenSearchModel:aisScreenSearchModel, aisDbSearchModel:aisDbSearchModel, highlight:highlight}),				
		myFleetMembersView = new MyFleetView({aisView:aisView, myFleetMembersModel:myFleetMembersModel}),
		historyView  = new HistoryView({aisView, historyModel, gifLoader})

    //************************************
    //  AIS PANEL
    //************************************
	let _leftMenuBlock = null,
		_canvas = _div(null),
        _activeView,
		_views,
		_aisSearchView,
		_myFleetMembersView,
		_historyView,
		aisPluginPanel = {
		set activeView(value){_activeView = value},
		set views(value){
			let {aisSearchView, myFleetMembersView, historyView} = value
			_aisSearchView = aisSearchView
			_myFleetMembersView = myFleetMembersView
			_historyView = historyView
			_views = [aisSearchView, myFleetMembersView, historyView]
		},
        get activeView(){
            return _activeView;
        },
        show: function(sidebarTab){
		
            if (NOSIDEBAR && !_leftMenuBlock)
                _leftMenuBlock = new leftMenu();
            if (NOSIDEBAR && (!_leftMenuBlock.createWorkCanvas("aispanel", function(){ icon._iconClick() },
				{ path:[_gtxt('AISSearch2.caption')] })) ||
				(!this.ready)) // SIDEBAR
			{ 
                var tabsTemplate = '<table class="ais_tabs" border=0><tr>' +
                    '<td class="ais_tab search_tab">' +
                        '{{i "AISSearch2.title"}}' +
                    '</td><td class="ais_tab myfleet_tab">' + // ACTIVE
                        '{{i "AISSearch2.myFleetDialog"}}' +
                    '</td>'

				if  (historyLayer)
					tabsTemplate += '</td><td class="ais_tab history_tab">' +
                        '{{i "AISSearch2.historyTab"}}' +
                    '</td>'	
					
				tabsTemplate +=
                '</tr></table>' +
                '<div class="ais_view search_view">'+
					//SEARCH FORM
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
					//MY FLEET FORM                 
                    '<table border=0 class="instruments"><tr>'+
                    '<td><div class="refresh"><div>'+gifLoader+'</div></div></td><td></td><td></td>'+
                    '</tr></table>'+
                    
                    '<div class="ais_vessels"><div class="ais_vessel">NO VESSELS SELECTED</div></div>'+
                '</div>'
				if  (historyLayer)
					tabsTemplate += _historyView.template
				
                $(_canvas).append(Handlebars.compile(tabsTemplate));
				
				if (NOSIDEBAR)
					$(_leftMenuBlock.workCanvas).append(_canvas);
				else
					$(sidebarTab).append(_canvas);

                var tabs = $('.ais_tab', _canvas),
					_this = this;
                tabs.on('click', function(){
                    if (!$(this).is('.active')){
                        var target = this;
                        tabs.each(function(i, tab){ 
                            if(!$(tab).is('.active') && target==tab){
                                $(tab).addClass('active');                                
                                _views[i].show();
                                _activeView = _views[i];
                            }
                            else{
                                $(tab).removeClass('active');                                
                                _views[i].hide();
                            }
                        });
                    }
                });
                
                _aisSearchView.create({
                    _frame: $('.search_view', _canvas),
                    _container: $('.search_view .ais_vessels', _canvas),
                    _refresh: $('.search_view .refresh div', _canvas),
                    _search: $('.filter', _canvas),
                    _count: $('.count', _canvas)
                });
				_aisSearchView.setModel(defaultSearch);

                _myFleetMembersView.create({
                    _frame: $('.myfleet_view', _canvas),
                    _container: $('.myfleet_view .ais_vessels', _canvas),
                    _refresh: $('.myfleet_view .refresh div', _canvas)
                });
				
                _historyView.create({ canvas: _canvas });
				
                var needUpdate = function(){
                    _aisSearchView.setDirty();
                    if (_activeView===_aisSearchView){
                        _aisSearchView.show();
                    }
                }; 
                nsGmx.leafletMap.on('moveend', needUpdate.bind(this));
                nsGmx.widgets.commonCalendar.getDateInterval().on('change', needUpdate.bind(this));
				this.ready = true
            }
	
			if (NOSIDEBAR){
				$(_leftMenuBlock.parentWorkCanvas)
				.attr('class', 'left_aispanel')
				.insertAfter('.layers-before');
				var blockItem = _leftMenuBlock.leftPanelItem,
					blockTitle = $('.leftmenu-path', blockItem.panelCanvas);
				var toggleTitle = function(){
					if(blockItem.isCollapsed())
						blockTitle.show();
					else
						blockTitle.hide();
				}
				$(blockItem).on('changeVisibility', toggleTitle);
				toggleTitle();
			}
			
            // Show the first tab
            $('.ais_tab', _canvas).eq(0).removeClass('active').click();
            _aisSearchView.drawBackground();
            _myFleetMembersView.drawBackground();
            _historyView.drawBackground();
			
        }
    };
	
	if (NOSIDEBAR){
        aisPluginPanel.hide = function(){
            $(_leftMenuBlock.parentWorkCanvas).hide()
			nsGmx.leafletMap.removeLayer(highlight)
        }		
	}

    gmxCore.addModule(pluginName, publicInterface, {
        css: cssTable + '.css'
    });
	
