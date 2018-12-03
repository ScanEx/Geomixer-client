require("./PripView.css")
const BaseView = require('./BaseView.js');
const PripView = function (model){
    BaseView.call(this, model);
    this.topOffset = 80;
    this.frame = $(Handlebars.compile('<div class="prip_view">' +
    '<div class="prips_all">'+
    '<table class="prips_year" border=0><tr>' +
    '<td><div class="open_positions ui-helper-noselect icon-right-open" title="TITLE"></div></td>' +
    '<td><span class="date">YEAR</span></td>' +
    '</tr></table>' +
    '<div><table class="prip_content"><tr><td>COSTAL WARNING</td></tr></table></div>' +     
    '</div>' +
    '</div>')());
    this.container = this.frame.find('.prips_all'); 

    this.tableTemplate = '{{#if msg}}<div class="message">{{msg}}</div>{{/if}}' +
        '{{#each years}}' +
        '<table class="prips_year" border=0 title="{{i "Prip.close"}}"><tr>' +
        '<td><div class="open_positions ui-helper-noselect icon-down-open"></div></td>' +
        '<td><span class="date">20{{{year}}}</span></td>' +
        '</tr></table>' +
  
        '<div>'+
        
        '<table class="prip_content">' +
        '{{#each prips}}' +
        '<tr class="prip{{n}}_{{year}}">' +
        '<td><div class="open_positions ui-helper-noselect icon-right-open" title="{{i "Prip.open"}}"></div></td>' +
        '<td>{{title}}</td>' +
        '</tr>' +
        '<tr><td colspan="2" class="more"><hr><div class="vi_more">' +
        '{{#each lines}}' +
        '<div>{{{this}}}</div>' +
        '{{/each}}' +
        '</div></td></tr>' +
        '{{/each}}' +
        '</table>' +
        
        '</div>' +
        '{{/each}}';
};

let _markerIcon = L.icon({
    className:"prip_highlight-icon", 
    iconAnchor:[6, 12], 
    iconSize:[12,12], 
    //iconUrl:'//maps.kosmosnimki.ru/api/plugins/ais/aissearch/highlight.png'});
    iconUrl:'data:image/svg+xml, %3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20height=%2212%22%20width=%2212%22%3E%3Cpolyline%20points=%226,0%200,12%2012,12%206,0%22%20style=%22fill:none;stroke:%23f00;stroke-width:1%22/%3E%3C/svg%3E'}),
    _markers = {};

PripView.prototype = Object.create(BaseView.prototype);

PripView.prototype.inProgress = function (state) {
    if (state){
        this.frame.css('background', 'url(\'img/progress.gif\') center no-repeat')
    }
    else{
        this.frame.css('background-image', 'none')
    }
};

let _clean = function(){  
    let scrollCont = this.container.find('.mCSB_container')
    if (scrollCont[0])
        scrollCont.empty();
    else
        this.container.empty();
};

PripView.prototype.repaint = function () {
    _clean.call(this);  
    BaseView.prototype.repaint.apply(this, arguments);

    let parseCoordinate = function(coordElement){
        let a = new RegExp("([\\d\\.,]+)-([\\d\\.,]+)-?([\\d\\.,]*)\\D ([\\d\\.,]+)-([\\d\\.,]+)-?([\\d\\.,]*)(\\D)?", "ig")
        .exec(coordElement.innerText.replace(",", "."));
        if (a==null){
            console.log(e.currentTarget.innerText+" invalid!")
            return;
        }
        let x = parseFloat(a[4])+parseFloat(a[5])/60.0+parseFloat("0"+a[6])/3600.0,
            y = parseFloat(a[1])+parseFloat(a[2])/60.0+parseFloat("0"+a[3])/3600.0;
        if (a[7]=="З"||a[7]=="W")
            x=-x;
            // console.log(a)
            // console.log(y+", "+x)
        return [y, x];
    },
    showCoordinates = function(coordinates, tooltip){
        if (coordinates.length==0)
            return [];
//console.log(coordinates)
        let markers = []
        coordinates.forEach((c,i)=>{
            let m = L.marker(c, {icon:  _markerIcon})
            markers.push(m)
            m.addTo(nsGmx.leafletMap);            
            m.on('mouseover', function (e) {
                this.openPopup();
            });
            m.on('mouseout', function (e) {
                this.closePopup();
            });
            m.bindPopup(tooltip, {closeButton:false});
        })
        let init =[[coordinates[0][0], coordinates[0][1]],
            [coordinates[0][0], coordinates[0][1]]];
        coordinates = coordinates.reduce((prev, curr)=>{
            if (prev[0][0]>curr[0])
                prev[0][0] = curr[0]
            if (prev[0][1]>curr[1])
                prev[0][1] = curr[1]
            if (prev[1][0]<curr[0])
                prev[1][0] = curr[0]
            if (prev[1][1]<curr[1])
                prev[1][1] = curr[1]
            return prev;            
        }, init)
//console.log(coordinates)
        nsGmx.leafletMap.fitBounds(coordinates, {
            maxZoom: 9,
            animate: false
        });  
        return markers;
    }

    this.container.find('.coordinate').click((e) => {
        // let a = new RegExp("([\\d\\.,]+)-([\\d\\.,]+)-?([\\d\\.,]*)\\D ([\\d\\.,]+)-([\\d\\.,]+)-?([\\d\\.,]*)(\\D)?", "ig")
        // .exec(e.currentTarget.innerText.replace(",", "."));
        // if (a==null){
        //     console.log(e.currentTarget.innerText+" invalid!")
        //     return;
        // }
        // let x = parseFloat(a[4])+parseFloat(a[5])/60.0+parseFloat("0"+a[6])/3600.0,
        //     y = parseFloat(a[1])+parseFloat(a[2])/60.0+parseFloat("0"+a[3])/3600.0,
        //     z = nsGmx.leafletMap.getZoom();
        // if (a[7]=="З"||a[7]=="W")
        //     x=-x;
        let coordinate = parseCoordinate(e.currentTarget),
            z = nsGmx.leafletMap.getZoom();
        nsGmx.leafletMap.fitBounds([coordinate,coordinate], {
                maxZoom: z,//(z < 9 ? 9 : z),
                animate: false
            });
    });

    this.container.find('.prips_year').click((e) => {
        let table = $(e.currentTarget).next(),
            div = $(e.currentTarget).find('td:first-of-type div');
        if (div.is('.icon-down-open')){
            div.addClass('icon-right-open').removeClass('icon-down-open')
            $(e.currentTarget).attr('title', _gtxt("Prip.open"))
            table.hide();
        }
        else{
            div.addClass('icon-down-open').removeClass('icon-right-open')
            $(e.currentTarget).attr('title', _gtxt("Prip.close"))           
            table.show();
        }
    }).click().eq(0).click();

    this.container.find('.prip_content td[class!="more"]').click((e) => {
        let td = $(e.currentTarget),
            tr =  td.parent();
        if (td.is('.active')) {
            td.removeClass('active')
            td.siblings().removeClass('active')
            tr.next().find('td').removeClass('active')
            tr.find('.icon-down-open').addClass('icon-right-open').removeClass('icon-down-open').attr('title', _gtxt("Prip.open"));
            _markers[tr.attr('class')].forEach(m=>{
                nsGmx.leafletMap.removeLayer(m);
            })
        }
        else {
            td.addClass('active')
            td.siblings().addClass('active')
            tr.next().find('td').addClass('active')        
            tr.find('.icon-right-open').addClass('icon-down-open').removeClass('icon-right-open').attr('title', _gtxt("Prip.close"));
            let coordinates = [];
            tr.next().find('.coordinate').each((i, e)=>coordinates.push(parseCoordinate(e)));
            _markers[tr.attr('class')] = showCoordinates(coordinates, tr[0].innerText.replace(/(^\s+|\s+$)/, '')
            .replace(/(КАРТ)/, '<br>$1'));           
        }
    }); 
};

module.exports = PripView;