require("./infodialog.css")
const SpecialFloatView = require('./SpecialFloatView.js');

let addUnit = function (v, u) {
	return v != null && v != "" ? v + u : "";
},
	formatDate,
	formatDateTime,
	round = function (d, p) {
		let isNeg = d < 0,
			power = Math.pow(10, p)
		return d ? ((isNeg ? -1 : 1) * (Math.round((isNeg ? d = -d : d) * power) / power)) : d
	},
	formatVessel = function (vessel) {
		let d = new Date(vessel.ts_pos_utc * 1000);
		vessel.ts_pos_org = vessel.ts_pos_utc;
		vessel.dt_pos_utc = formatDate(d);
		vessel.ts_pos_utc = formatDateTime(d);
		vessel.ts_pos_loc = "<br><span class='local'>" + formatDateTime(d, true) + "</span>";
		vessel.ts_eta = vessel.ts_eta ? formatDateTime(new Date(vessel.ts_eta * 1000)) : "";
		vessel.cog = !isNaN(vessel.cog)?addUnit(round(vessel.cog, 5), "°"):vessel.cog;
		vessel.sog = !isNaN(vessel.sog)?addUnit(round(vessel.sog, 5), nsGmx.Translations.getLanguage()=="rus"?" уз":" kn"):vessel.sog;
		vessel.rot = !isNaN(vessel.rot)?addUnit(round(vessel.rot, 5), nsGmx.Translations.getLanguage()=="rus"?"°/мин":"°/min"):vessel.rot;
		vessel.heading = !isNaN(vessel.heading)?addUnit(round(vessel.heading, 5), "°"):vessel.heading;
		vessel.draught = !isNaN(vessel.draught)?addUnit(round(vessel.draught, 5), nsGmx.Translations.getLanguage()=="rus"?" м":" m"):vessel.draught;
		vessel.length = !isNaN(vessel.length)?addUnit(vessel.length, nsGmx.Translations.getLanguage()=="rus"?" м":" m"):vessel.length;
		vessel.width = !isNaN(vessel.width)?addUnit(vessel.width, nsGmx.Translations.getLanguage()=="rus"?" м":" m"):vessel.width;
		vessel.source = vessel.source == 'T-AIS' ? _gtxt('AISSearch2.tais') : _gtxt('AISSearch2.sais');
		return vessel;
	},
	toDd = function (D, lng) {
		let dir = D < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
			deg = Math.round((D < 0 ? D = -D : D) * 1000000) / 1000000
		return deg + "°" + dir
	},
	ddToDms = function (D, lng) {
		let dms = {
			dir: D < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
			deg: 0 | (D < 0 ? D = -D : D),
			min: 0 | D % 1 * 60,
			sec: (0 | D * 60 % 1 * 6000) / 100
		};
		return dms.deg + "°" + dms.min + "'" + dms.sec + "\" " + dms.dir
	},
	shipCams = {};

module.exports = function ({ vessel, closeFunc, aisLayerSearcher, getmore,
	modulePath,	aisView, displayedTrack,
	myFleetView, tools }, commands) {

	if (!shipCams[vessel.mmsi]){
		nsGmx.gmxMap.layers.forEach(l => {
			if (l && l._gmx && l._gmx.properties) {
				let props = l._gmx.properties,
					title = props.title,
					meta = props.MetaProperties;
				if (title && (title.search(/^shipcam[^_]*_/) != -1) &&
				meta.ships && (meta.ships.Value.search(new RegExp('"'+vessel.mmsi+'"'))!=-1)) {
					shipCams[vessel.mmsi] = { 
						layer: props.name,
						urls: meta.urls.Value
					};
				}
			}
		});
//console.log(shipCams);
	}

	formatDate = aisLayerSearcher.formatDate;
	formatDateTime = aisLayerSearcher.formatDateTime;

	// let myFleetModel = myFleetView.model,
	// 	add = myFleetModel && myFleetModel.findIndex(vessel) < 0;

	let canvas = $('<div class="ais_myfleet_dialog"/>'),
		menu = $('<div class="column1 menu"></div>').appendTo(canvas),
		photo = $('<div class="photo"><div></div></div>').appendTo(menu),
		underphoto = $('<div class="underphoto"><div></div></div>').appendTo(menu),
		content = $('<div class="column2 content"></div>'),
		buttons = $('<div class="column3 buttons"></div>'),
		gifLoader = '<img src="img/progress.gif">'
	//console.log(content);

	canvas.append(content).append(buttons)

	let searchInput = $('.leaflet-ext-search'),
		dialogW = 610, dialogH = 250,
		posX = searchInput.offset().left + searchInput.width() - dialogW,
		posY = searchInput.offset().top + searchInput.height() + 10,
		dialog = showDialog(vessel.vessel_name, canvas[0], { 
			width: dialogW, height: dialogH, posX: posX, posY:posY, 
			closeFunc: closeFunc 
		}),
		vessel2,
		moreInfo = function (v) {
			let smallShipIcon = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px" height="14px" viewBox="0 0 14 14" style="margin-left: 10px" xml:space="preserve">' +
				'<g style="fill: #48aff1;">' +
				'<path class="st0" d="M13.4,11H0.6c-0.2,0-0.4,0.1-0.5,0.3c-0.1,0.2-0.1,0.4,0,0.6l1.2,1.8C1.4,13.9,1.6,14,1.8,14h9.9   c0.2,0,0.3-0.1,0.4-0.2l1.7-1.8c0.2-0.2,0.2-0.4,0.1-0.7C13.9,11.1,13.7,11,13.4,11z"/>' +
				'<path class="st0" d="M9.3,9.7h2.9c0.2,0,0.4-0.1,0.5-0.3c0.1-0.2,0.1-0.4,0-0.6L9.8,4.5C9.7,4.3,9.4,4.2,9.2,4.3   C8.9,4.4,8.7,4.6,8.7,4.9v4.3C8.7,9.5,9,9.7,9.3,9.7z"/>' +
				'<path class="st0" d="M1.2,9.7H7c0.3,0,0.6-0.3,0.6-0.6V0.6c0-0.3-0.2-0.5-0.4-0.6C6.9-0.1,6.7,0,6.5,0.3L0.7,8.8   C0.6,9,0.5,9.2,0.6,9.4C0.7,9.6,0.9,9.7,1.2,9.7z"/>' +
				'</g>' +
				'</svg>',
				vesselPropTempl = '<div class="vessel_prop vname"><b>{{vessel_name}}</b>' + smallShipIcon + '</div>' +
					'<div class="vessel_prop altvname"><b>' + (vessel2.registry_name && vessel2.registry_name != vessel2.vessel_name ? vessel2.registry_name : '') + '&nbsp;</b></div>'

			$('.content', canvas).append(Handlebars.compile(
				'<div class="vessel_props1">' + vesselPropTempl +
				'<table>' +
				'<tr><td><div class="vessel_prop">{{i "AISSearch2.vessel_type"}}: </div></td><td><div class="vessel_prop value">{{vessel_type}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">{{i "AISSearch2.flag"}}: </div></td><td><div class="vessel_prop value">{{flag_country}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">IMO: </div></td><td><div class="vessel_prop value">{{imo}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">MMSI: </div></td><td><div class="vessel_prop value mmsi">{{mmsi}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">{{i "AISSearch2.callsign"}}: </div></td><td><div class="vessel_prop value mmsi">{{callsign}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">{{i "AISSearch2.source"}}: </div></td><td><div class="vessel_prop value">{{source}}</div></td></tr>' +
				'</table>' +
				'</div>'
			)(v));

			$('.content', canvas).append(Handlebars.compile(
				'<div class="vessel_props2">' + vesselPropTempl +
				'<table>' +
				'<tr><td><div class="vessel_prop">COG | SOG: </div></td><td><div class="vessel_prop value">{{cog}}&nbsp;&nbsp;&nbsp;{{sog}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">HDG | ROT: </div></td><td><div class="vessel_prop value">{{heading}}&nbsp;&nbsp;&nbsp;{{rot}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">{{i "AISSearch2.draught"}}: </div></td><td><div class="vessel_prop value">{{draught}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">{{i "AISSearch2.destination"}}: </div></td><td><div class="vessel_prop value">{{destination}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">{{i "AISSearch2.nav_status"}}: </div></td><td><div class="vessel_prop value">{{nav_status}}</div></td></tr>' +
				'<tr><td><div class="vessel_prop">ETA: </div></td><td><div class="vessel_prop value">{{ts_eta}}</div></td></tr>' +

				'</div>'
			)(v));

			$(underphoto).append('<table><tr>' +
				'<td class="ais_refresh"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" height="16" width="16"><g class="nc-icon-wrapper" fill="#444444"><polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,16 7,16 7,13 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,18 17,16 15,14 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="15,18 17,16 15,14 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 9,8 17,8 17,11 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points="9,6 7,8 9,10 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="9,6 7,8 9,10 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <rect x="2" y="1" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" width="20" height="22" stroke-linejoin="miter" style="stroke: currentColor;"/></g></svg></td>' +
				'<td><div class="vessel_prop coordinates"><span class="small">' +
				ddToDms(v.latitude, false) + ' ' + ddToDms(v.longitude, true) +
				'</small></div></td>' +
				'</tr></table>'
			);

			let swap = "<span class='small'>" + toDd(v.latitude, false) + " " + toDd(v.longitude, true) + "</span>"
			$('.ais_refresh', underphoto).click((e) => {
				let mi = $('.coordinates', underphoto),
					t = mi.html()
				mi.html(swap)
				swap = t
			})

			$('.vessel_props1', canvas).hide()
			$('.vessel_prop.vname svg', canvas).css('visibility', 'hidden')

		}

	$(dialog).dialog({ resizable: false });

	if (!getmore) {
		vessel2 = $.extend({}, vessel);
		moreInfo(formatVessel(vessel2));
	}
	else
		aisLayerSearcher.searchNames([{ mmsi: vessel.mmsi, imo: vessel.imo }], function (response) {
			if (parseResponse(response)) {
				vessel2 = {};
				for (var i = 0; i < response.Result.fields.length; ++i)
					vessel2[response.Result.fields[i]] = response.Result.values[0][i];
				moreInfo(formatVessel(vessel2));
				$('.date', titlebar).html('<span class="utc">' + vessel2.ts_pos_utc + ' UTC</span>' + vessel2.ts_pos_loc);
				if (typeof (getmore) == "function")
					getmore(vessel2)
			}
			else
				console.log(response)
		})

	// IMAGE	
	let scheme = document.location.href.replace(/^(https?:).+/, "$1");

	$('<img src="' + scheme + window.serverBase.replace(/^https?:/, "")+'plugins/ais/getphoto.ashx?mmsi=' + vessel.mmsi + '">')
	.load(function(){	
		if (this) $('div', photo).replaceWith(this);
	})
	.error(function(){		
		$('<img src="' + scheme + '//photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi=' + vessel.mmsi + '">')
		.load(function(){
				if (this) $('div', photo).replaceWith(this);
		})
	});	

	// BUTTONS
	let menubuttons = $('<div class="menubuttons"></div>').appendTo(buttons)

	let openpage = $('<div class="button openpage" title="' + _gtxt('AISSearch2.show_info') + '">' +
		'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
		'<g class="nc-icon-wrapper" style="fill:currentColor">' +
		'<path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>' +
		'</g>' +
		'</svg>'
		+ '</div>')
		.appendTo(menubuttons)
		.on('click', () => commands.openVesselInfoScreen.call(null, vessel, vessel2));


	let shipCam = shipCams[vessel.mmsi.toString()],
	setImages = function(shipCam, vessel){
		let moment = new Date(vessel.ts_pos_org*1000);
		moment.setMinutes(moment.getMinutes() + moment.getTimezoneOffset())
		moment = moment.getFullYear() + "-" + (moment.getMonth()+1) + "-" + moment.getDate() + " " + 
		moment.getHours() + ":" + moment.getMinutes() + ":" + moment.getSeconds();
//console.log(moment)	
		let images = [];
		shipCam.urls.split(' ').forEach((url) => {
			images.push({url: serverBase.replace(/https?:/, document.location.protocol).replace(/\/$/, "") + url.replace(/"/g, '') + 
			(url.search(/\?/)!=-1?'&':'?') +
			'layer=' + shipCam.layer +
			'&mmsi=' + vessel.mmsi +
			'&ts=' + moment});
		});
//console.log(images)	
		return images;
	}

	if (shipCam) {
		if (!shipCam.view) {
			shipCam.view = new SpecialFloatView(
				setImages(shipCam, vessel2 ? vessel2 : vessel),
				vessel.mmsi
			);
		}
		let special = shipCam.view;
		//console.log(special);
		let showCamBut = $('<div class="ais button showcam" title="' + _gtxt('AISSearch2.show_pos') + '">' +
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22"><title>camera</title><g class="nc-icon-wrapper" fill="#384b50" style="fill:currentColor"><path d="M21,4H17L15,1H9L7,4H3A3,3,0,0,0,0,7V19a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V7A3,3,0,0,0,21,4ZM12,18a5,5,0,1,1,5-5A5,5,0,0,1,12,18Z"/></g></svg>' +
			'</div>')
			.appendTo(menubuttons)
			.on('click', function (e) {
				let b = e.currentTarget
				if (b.classList.contains('active')) {
					b.classList.remove('active');
					shipCam.visible = false;
					special.close();
				}
				else {
					b.classList.add('active');
					special.show(setImages(shipCam, vessel2 ? vessel2 : vessel), () => {
						b.classList.remove('active');
						shipCam.visible = false;
					});
					shipCam.visible = true;
				}
			});
		//console.log(showCamBut)
		//console.log(shipCams[vessel.mmsi.toString()].visible)
		if (shipCam.visible) {
			showCamBut[0].classList.add('active');
			special.show(setImages(shipCam, vessel2 ? vessel2 : vessel), () => {
				showCamBut[0].classList.remove('active');
				shipCam.visible = false;
			});
		}
	}

	let progress = $('<div class="progress"></div>')
		.appendTo(menubuttons);

	// TITLEBAR	
	canvas.parent('div').css({ 'margin': '0', 'overflow': 'hidden' })
	let titlebar = $(dialog).parent().find('.ui-dialog-titlebar').css('padding', '0')
		.html('<table class="ais_info_dialog_titlebar">' +
		'<tr><td><div class="date">' +
		(!getmore ? Handlebars.compile('<span class="utc">{{{ts_pos_utc}}} UTC</span>{{{ts_pos_loc}}}')(vessel2 ? vessel2 : vessel) : '') +
		'</div></td>' +
		
		'<td><div class="choose chooser done"><span unselectable="on">'+_gtxt('AISSearch2.dialog_tab_params')+'</span></div></td>' +
		'<td><div class="choose chooser"><span unselectable="on">'+_gtxt('AISSearch2.dialog_tab_general')+'</span></div></td>' +
		
		'<td id="closebut" title="'+_gtxt('AISSearch2.close_but')+'"><div class="ais_info_dialog_close-button" title="'+_gtxt("AISSearch2.close_but")+'"></div></td></tr>' +
		'</table>'),
		onDone = function (e) { 
			e.stopPropagation(); 
			$('.choose', titlebar).removeClass('done'); 
			$(e.currentTarget).addClass('done'); 
		};

	$('#closebut', titlebar).on('click', (e) => {$(dialog).dialog("close"); })
	.on('mouseover', (e) => { 
		$('.ais_info_dialog_close-button', titlebar).css('background', 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cline x1=\'0\' y1=\'0\' x2=\'12\' y2=\'12\' style=\'stroke:%2348aff1;stroke-width:2px\'/%3E%3Cline x1=\'0\' y1=\'12\' x2=\'12\' y2=\'0\' style=\'stroke:%2348aff1;stroke-width:2px\'/%3E%3C/svg%3E") no-repeat')
	})
	.on('mouseout', (e) => { 
		$('.ais_info_dialog_close-button', titlebar).attr('style', '')
	})
	//url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='0' x2='12' y2='12' style='stroke:%2348aff1;stroke-width:2px'/%3E%3Cline x1='0' y1='12' x2='12' y2='0' style='stroke:%2348aff1;stroke-width:2px'/%3E%3C/svg%3E") no-repeat
	$('.chooser', titlebar).eq(1).on('mousedown', (e) => { onDone(e); $('.vessel_props1', canvas).show(); $('.vessel_props2', canvas).hide() })
	$('.chooser', titlebar).eq(0).on('mousedown', (e) => { onDone(e); $('.vessel_props2', canvas).show(); $('.vessel_props1', canvas).hide() })
	$('.date span', titlebar).on('mousedown', (e) => { e.stopPropagation(); })

	//$( dialog ).on( "dialogdragstart", function( e, ui ) {console.log(e);console.log(ui)} );

	return dialog
}