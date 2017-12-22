require("./infodialog.css")

let addUnit = function(v, u){
        return v!=null && v!="" ? v+u : ""; 
    },
	formatDate,
    formatVessel = function(vessel){
                    vessel.ts_pos_utc = formatDate(new Date(vessel.ts_pos_utc*1000));
                    vessel.ts_eta = formatDate(new Date(vessel.ts_eta*1000));
                    vessel.cog = addUnit(vessel.cog, "°");
                    vessel.sog = addUnit(vessel.sog, " уз");
                    vessel.rot = addUnit(vessel.rot, "°/мин");
                    vessel.heading = addUnit(vessel.heading, "°");
                    vessel.draught = addUnit(vessel.draught, " м");
                    vessel.length = addUnit(vessel.length, " м");
                    vessel.width = addUnit(vessel.width, " м");
					vessel.source = vessel.source=='T-AIS'?_gtxt('AISSearch2.tais'):_gtxt('AISSearch2.sais');
                    return vessel;
    },
	ddToDms = function(D, lng){
		let dms = {
			dir : D<0?lng?'W':'S':lng?'E':'N',
			deg : 0|(D<0?D=-D:D),
			min : 0|D%1*60,
			sec :(0|D*60%1*6000)/100
		};
		return dms.deg+"°"+dms.min+"'"+dms.sec+"\" "+dms.dir
	}

module.exports = function({vessel, closeFunc, aisLayerSearcher, getmore, scheme, modulePath, gifLoader,
aisView, displaingTrack, myFleetMembersView, aisPluginPanel }, commands){

	formatDate = aisLayerSearcher.formatDate
	
    let canvas = $('<div class="ais_myfleet_dialog"/>'),
        menu = $('<div class="column1 menu"></div>').appendTo(canvas),
        photo = $('<div class="photo"><div></div></div>').appendTo(menu),
        moreinfo = $('<div class="moreinfo"><div></div></div>').appendTo(menu),
        content = Handlebars.compile(
                    '<div class="column2 content">'+
                    '</div>') (vessel),
		buttons = $('<div class="column3 buttons"></div>')
                    //console.log(content);
	
    canvas.append(content).append(buttons)
				
	let dialog = showDialog(vessel.vessel_name, canvas[0], {width: 610, height: 230, closeFunc: closeFunc }),     
	vessel2,
    moreInfo = function(v){
						let smallShipIcon = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px" height="14px" viewBox="0 0 14 14" style="margin-left: 10px" xml:space="preserve">'+
							'<g style="fill: #48aff1;">'+
								'<path class="st0" d="M13.4,11H0.6c-0.2,0-0.4,0.1-0.5,0.3c-0.1,0.2-0.1,0.4,0,0.6l1.2,1.8C1.4,13.9,1.6,14,1.8,14h9.9   c0.2,0,0.3-0.1,0.4-0.2l1.7-1.8c0.2-0.2,0.2-0.4,0.1-0.7C13.9,11.1,13.7,11,13.4,11z"/>'+
								'<path class="st0" d="M9.3,9.7h2.9c0.2,0,0.4-0.1,0.5-0.3c0.1-0.2,0.1-0.4,0-0.6L9.8,4.5C9.7,4.3,9.4,4.2,9.2,4.3   C8.9,4.4,8.7,4.6,8.7,4.9v4.3C8.7,9.5,9,9.7,9.3,9.7z"/>'+
								'<path class="st0" d="M1.2,9.7H7c0.3,0,0.6-0.3,0.6-0.6V0.6c0-0.3-0.2-0.5-0.4-0.6C6.9-0.1,6.7,0,6.5,0.3L0.7,8.8   C0.6,9,0.5,9.2,0.6,9.4C0.7,9.6,0.9,9.7,1.2,9.7z"/>'+
							'</g>'+
						'</svg>',
						vesselPropTempl = '<div class="vessel_prop vname"><b>{{vessel_name}}</b>'+smallShipIcon+'</div>'+
						'<div class="vessel_prop"><b>&nbsp;'+(vessel2.registry_name ? vessel2.registry_name:'')+'</b></div>'
						
                        $('.content', canvas).append(Handlebars.compile(
						'<div class="vessel_props1">'+vesselPropTempl+
                        '<div class="vessel_prop">Тип судна: <b>{{vessel_type}}</b></div>'+
                        '<div class="vessel_prop">Флаг: <b>{{flag_country}}</b></div>'+
                        '<div class="vessel_prop">IMO: <b>{{imo}}</b></div>'+
                        '<div class="vessel_prop">MMSI: <b>{{mmsi}}</b></div>'+
                        '<div class="vessel_prop">{{i "AISSearch2.source"}}: <b>{{source}}</b></div>'+
						'</div>'
                        )(v));
						
                        $('.content', canvas).append(Handlebars.compile(	
						'<div class="vessel_props2">'+vesselPropTempl+					
                        '<div class="vessel_prop">COG / SOG: <b>{{cog}} / {{sog}}</b></div>'+
                        '<div class="vessel_prop">HDG / ROT: <b>{{heading}} / {{rot}}</b></div>'+
                        '<div class="vessel_prop">{{i "AISSearch2.draught"}}: <b>{{draught}}</b></div>'+
                        '<div class="vessel_prop">{{i "AISSearch2.destination"}}: <b>{{destination}}</b></div>'+
                        '<div class="vessel_prop">{{i "AISSearch2.nav_status"}}: <b>{{nav_status}}</b></div>'+
						'</div>'
                        )(v));
						
                        $(moreinfo).append('<table><tr>'+
'<td class="ais_refresh"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" height="16" width="16"><g class="nc-icon-wrapper" fill="#444444"><polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,16 7,16 7,13 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,18 17,16 15,14 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="15,18 17,16 15,14 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 9,8 17,8 17,11 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points="9,6 7,8 9,10 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="9,6 7,8 9,10 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <rect x="2" y="1" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" width="20" height="22" stroke-linejoin="miter" style="stroke: currentColor;"/></g></svg></td>'+
						'<td><div class="vessel_prop coordinates"><span class="small">'+
						v.latitude+'° '+(v.latitude<0?'S':'N')+' '+v.longitude+'° '+(v.longitude<0?'W':'E')+
						'</small></div></td>'+
						'</tr></table>'
                        );
						
						let swap = "<span class='small'>"+ddToDms(v.latitude, false)+" "+ddToDms(v.longitude, true)+"</span>"						
						$('.ais_refresh', moreinfo).click((e)=>{
							let mi = $('.coordinates', moreinfo),
							t = mi.html()
							mi.html(swap)
							swap = t
						})
						
						$('.vessel_props2', canvas).hide()
    }              
    
	if (!getmore){
        vessel2 = $.extend({}, vessel);
        moreInfo(formatVessel(vessel2));
    }
    else
        aisLayerSearcher.searchNames([{mmsi:vessel.mmsi,imo:vessel.imo}], function(response){
                        if (parseResponse(response)){                    
                            vessel2 = {};
							for (var i=0; i<response.Result.fields.length; ++i)
								vessel2[response.Result.fields[i]] = response.Result.values[0][i];
//console.log(vessel2.registry_name)
                            moreInfo(formatVessel(vessel2));
                        }
						else
							console.log(response)
        })
	
	// IMAGE
    $('<img src="'+scheme+'//photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi='+vessel.mmsi+'">').load(function() {
        if (this)
            $('div', photo).replaceWith(this);
    });
	
	// BUTTONS
    let menubuttons = $('<div class="menubuttons"></div>').appendTo(buttons)
	
	let openpage = $('<div class="button openpage" title="информация о судне">'+
				'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">'+
					'<g class="nc-icon-wrapper" style="fill:currentColor">'+
						'<path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>'+
					'</g>'+				
				'</svg>'
				+'</div>')
                .appendTo(menubuttons)                   
                .on('click', ()=>commands.openVesselInfoView.call(null, vessel, vessel2)); 

    let showpos = $('<div class="button showpos" title="показать положение">'+
'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" width="20" height="20"><g class="nc-icon-wrapper" fill="#444444"><polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 1,7 1,1 7,1 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 17,1 23,1 23,7 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 23,17 23,23 17,23 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 7,23 1,23 1,17 " stroke-linejoin="miter"/> <rect style="stroke:currentColor" x="8" y="8" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" width="8" height="8" stroke-linejoin="miter"/></g></svg>'+
				'</div>')
                .appendTo(menubuttons)                   
                .on('click', function(){
                    var showVessel = {
                        xmin:vessel.xmin?vessel.xmin:vessel.longitude, 
                        xmax:vessel.xmax?vessel.xmax:vessel.longitude, 
                        ymin:vessel.ymin?vessel.ymin:vessel.latitude, 
                        ymax:vessel.ymax?vessel.ymax:vessel.latitude, 
                        ts_pos_utc:vessel.ts_pos_utc && !isNaN(vessel.ts_pos_utc)?aisLayerSearcher.formatDate(new Date(vessel.ts_pos_utc*1000)):vessel.ts_pos_utc
                    }			
					//nsGmx.leafletMap.removeLayer(highlight);
					//highlight.setLatLng([showVessel.ymax, showVessel.xmax]).addTo(nsGmx.leafletMap);
                    aisView.positionMap(showVessel);
                });
	//if (tracksLayer){
	let templ = '<div class="button showtrack" title="'+_gtxt('AISSearch2.show_track')+'">'+
'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" width="20" height="20"><g class="nc-icon-wrapper" fill="#444444"><path style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" d="M4,13V5 c0-2.209,1.791-4,4-4h0c2.209,0,4,1.791,4,4v14c0,2.209,1.791,4,4,4h0c2.209,0,4-1.791,4-4v-8" stroke-linejoin="miter"/> <circle style="stroke:currentColor" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" cx="20" cy="4" r="3" stroke-linejoin="miter"/> <circle style="stroke:currentColor" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" cx="4" cy="20" r="3" stroke-linejoin="miter"/></g></svg>'+					
					'</div>',
					
		showtrack = $(templ)
					.appendTo(menubuttons) 
					.on('click', function(){						
						if (showtrack.attr('title')!=_gtxt('AISSearch2.hide_track')){
							$('.showtrack').attr('title', _gtxt('AISSearch2.show_track'))
							.removeClass('active');							
							commands.showTrack.call(null, [vessel.mmsi])
							showtrack.attr('title', _gtxt('AISSearch2.hide_track'))
							.addClass('ais active');      
						}
						else{
							$('.showtrack').attr('title',_gtxt('AISSearch2.show_track'))
							.removeClass('ais active');
							commands.showTrack.call(null, [])
						}
					});
					if (!displaingTrack || displaingTrack!=vessel.mmsi){
						showtrack.attr('title', _gtxt('AISSearch2.show_track'))
					}
					else{
						showtrack.attr('title', _gtxt('AISSearch2.hide_track'))
						.addClass('ais active');      
					}
	//}
				
				
	let myFleetMembersModel = myFleetMembersView.model,
		addremoveIcon = function(add){
					return ( add ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g class="nc-icon-wrapper" fill="#444444" style="fill: currentColor;"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></g></svg>'					
:'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;fill: currentColor;" xml:space="preserve"><g><path class="st0" d="M4,6H2v14c0,1.1,0.9,2,2,2h14v-2H4V6z M20,2H8C6.9,2,6,2.9,6,4v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4    C22,2.9,21.1,2,20,2z M19,11h-4v4h-2v-4H9V9h4V5h2v4h4V11z"/></g><rect x="9" y="5" class="st0" width="10" height="4"/><rect x="9" y="11" class="st0" width="10" height="4"/></g></svg>' )
		}
        if (myFleetMembersModel && myFleetMembersModel.data && myFleetMembersModel.data.vessels){
                    let add = myFleetMembersModel.findIndex(vessel)<0,
                    addremove = $('<div class="button addremove">'+
					addremoveIcon(add) +
					'</div>')
						//.css('background-image','url('+modulePath+'svg/'+(add?'add':'rem')+'-my-fleet.svg)')
						.attr('title', add?'добавить в мой флот':'удалить из моего флота')
						.appendTo(menubuttons);
                    if (myFleetMembersModel.filterUpdating)
                        addremove.addClass('disabled');
                    addremove.on('click', function(){
                        if (addremove.is('.disabled'))
                            return;
                        
                        $('.addremove').addClass('disabled')
						addremove.hide()
                        progress.append(gifLoader)
						
                        myFleetMembersModel.changeFilter(vessel).then(function(){  
                            add = myFleetMembersModel.findIndex(vessel)<0;
                            var info = $('.icon-ship[vessel="' + vessel.mmsi + ' ' + vessel.imo + '"]');
                            info.css('display', !add?'inline':'none'); 
                            
                            addremove.attr('title', add?'добавить в мой флот':'удалить из моего флота')
							.html(addremoveIcon(add))
                            //.css('background-image','url('+modulePath+'svg/'+(add?'add':'rem')+'-my-fleet.svg)')
 
                            progress.text('');               
                            $('.addremove').removeClass('disabled').show()
							
                            if (aisPluginPanel.getActiveView()==myFleetMembersView)
                                myFleetMembersView.show();
                        });
                    }); 
        }
				
    let progress = $('<div class="progress"></div>')
    .appendTo(menubuttons); 
	
	// TITLEBAR	
	canvas.parent('div').css({'margin':'0', 'overflow':'hidden'})	
	let titlebar = $(dialog).parent().find('.ui-dialog-titlebar').css('padding','0')
		.html('<table class="ais_info_dialog_titlebar">'+
		'<tr><td><div class="date"><span>Последний сигнал:</span>'+
		Handlebars.compile('<br>{{{ts_pos_utc}}}')(vessel2)
		+'</div></td>'+
		'<td><div class="switch on">Общие сведения</div></td>'+
		'<td><div class="switch">Параметры судна</div></td>'+
		'<td id="closebut"><div class="ais_info_dialog_close-button" title="закрыть"></div></td></tr>'+
		'</table>')
		
	$('.ais_info_dialog_close-button', titlebar).on('click', ()=>$( dialog ).dialog( "close" ))	
	$('.switch', titlebar).eq(0).on('click', (e)=>{$('.switch', titlebar).removeClass('on'); $(e.currentTarget).addClass('on'); $('.vessel_props1', canvas).show(); $('.vessel_props2', canvas).hide()})
	$('.switch', titlebar).eq(1).on('click', (e)=>{$('.switch', titlebar).removeClass('on'); $(e.currentTarget).addClass('on'); $('.vessel_props2', canvas).show(); $('.vessel_props1', canvas).hide()})
		
	return dialog
}