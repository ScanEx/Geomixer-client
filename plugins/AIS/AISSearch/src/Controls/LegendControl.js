const LegendControl = function (tools, aisLastPointLaier, lastPointLayerAlt) {
    const _layersByID = nsGmx.gmxMap.layersByID,
        _layers = [_layersByID[aisLastPointLaier], _layersByID[lastPointLayerAlt]],
        _getIcons = function () {
            _layers[0] && _layers[0]._gmx.properties.gmxStyles.styles.forEach(s => {
                let icon = {
                    "filter": s.Filter, 
                    "url": s.RenderStyle.iconUrl.replace(/^https?:/, "")
                        .replace(/^\/\/kosmosnimki.ru/, "//www.kosmosnimki.ru"), "name": s.Name,
                    "img": new Image()
                };
                _icons.push(icon);
                _iconsDict[icon.filter] = {url:icon.url, name:icon.name, img: icon.img};
            });
            _layers[1] && _layers[1]._gmx.properties.gmxStyles.styles.forEach(s => {
                let icon = {
                    "filter": s.Filter.replace(/([^<>=])=([^=])/g, "$1==$2")
                        .replace(/ *not ((.(?!( and | or |$)))+.)/ig, " !($1)")
                        .replace(/ or /ig, " || ").replace(/ and /ig, " && "), 
                    "url": s.RenderStyle.iconUrl.replace(/^https?:/, "")
                        .replace(/^\/\/kosmosnimki.ru/, "//www.kosmosnimki.ru"), "name": s.Name,
                    "img": new Image()
                };
                _iconsAlt.push(icon);
                _iconsAltDict[icon.filter] = {url:icon.url, name:icon.name, img: icon.img};
            });
// console.log(_icons);
// console.log(_iconsAlt);
        },
        _getSvgPromise = ic => {
            return new Promise(resolve => {
                let httpRequest = new XMLHttpRequest();
                httpRequest.onreadystatechange = function () {
                    if (httpRequest.readyState === 4) {
                        ic["svg"] = httpRequest.responseText;
                        let a = /\.cls-1{fill:(#[^};]+)/.exec(ic.svg);
                        ic.color = '#888';
                        if (a && a.length)
                            ic.color = a[1];
 
                        let svg = httpRequest.responseText;
                        let svg64 = btoa(unescape(encodeURIComponent(svg)));
                        let b64Start = 'data:image/svg+xml;base64,';
                        let image64 = b64Start + svg64;                       
                        //let img = new Image(); 
                        //img.src = image64;                              
                        //ic.img = img;                              
                        ic.img.src = image64; 
                        resolve();
                    }
                }
                httpRequest.open("GET", document.location.protocol + ic.url.replace(/^https?:/, ""));
                httpRequest.send();
            })
        };

    let _icons = [], _iconsAlt = [], _iconsDict = {}, _iconsAltDict = {};
    _getIcons();

    const _svgLoader = Promise.all(_icons.map(_getSvgPromise)),
        _svgAltLoader = Promise.all(_iconsAlt.map(_getSvgPromise)),
        _createSwitch = function (container) {
            let div = document.createElement('div');
            div.innerHTML = '<table class="ais_legend_switch">' +
                '<tr><td class="legend" colspan="2"><span class="label">' + _gtxt("AISSearch2.legend_switch") + ':</span>' +
                '<span class="type unselectable on" unselectable="on">' + _gtxt("AISSearch2.legend_type") + '</span>' +
                '<span class="speed unselectable" unselectable="on">' + _gtxt("AISSearch2.legend_speed") + '</span></td>' +
                '<td class="show_info">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><g><circle style="fill:white" cx="12" cy="12" r="8"></circle><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z" style="fill:#48aff1"></path></g></svg>' +
                '</td></tr>' +
                '</table>';
            container.footer = div;
            let lswitchClick = e => {
                let cl = e.target.classList;
                if (!cl.contains('on')) {
                    tools.switchLegend(cl.contains('.speed'));
                    container.footer.querySelector('span.on').classList.remove('on');
                    cl.add('on');
                    if (legendDiv) {
                        legendDiv.remove();
                        legendDiv = null;
                        container.footer.querySelector('td.show_info').click();
                    }                    
                }
            }
            container.footer.querySelector('span.speed').addEventListener('click', lswitchClick);
            container.footer.querySelector('span.type').addEventListener('click', lswitchClick);
            let legendDiv;
            container.footer.querySelector('td.show_info').addEventListener('click', () => {
                if (legendDiv) {
                    legendDiv.remove();
                    legendDiv = null;
                    return;
                }
                legendDiv = document.createElement('div');
                legendDiv.className = 'ais_legend_info';

                let loader = !tools.needAltLegend ? _svgLoader : _svgAltLoader,
                    iconCollection = !tools.needAltLegend ? _icons : _iconsAlt;
                loader.then(r => {
//console.log(r);
                    let template = !tools.needAltLegend ? '<table class="colors">' : '<table class="movement_colors">';
                    iconCollection.forEach((ic, i) => {
                        if (ic.name.search(/\S/) != -1) {
                            // let a = /\.cls-1{fill:(#[^};]+)/.exec(ic.svg);
                            // ic.color = '#fff';
                            // if (a && a.length)
                            //     ic.color = a[1];
                            if (!tools.needAltLegend)
                                template += '<tr><td class="color"><div style="width:10px; height:10px; background-color:' + ic.color + '"></div></td><td>' + ic.name + '</td></tr>';
                            else{
                                let svg = i==iconCollection.length-1 ? '<div style="padding-top:2px">' + _getAtAnchorIcon(0, ic.color, '#fff') + '</div>'
                                : _getUnderWayIcon(0, ic.color, '#fff')
                                template += '<tr><td class="color">'+ svg + '</td><td>' + ic.name + '</td></tr>';
                            }
                        }
                    });
                    if (!tools.needAltLegend) {
                        template += '<tr><td colspan="2" style="padding: 8px 10px 0;"><div style="border-bottom: solid 1px #e1e8ed;width: 100%;"></div></td></tr>'
                        template += '</table><table class="movement"><tr><td>' + _getUnderWayIcon(0, '#888', '#fff') + '</td><td>' + _gtxt("AISSearch2.moving") + '</td>' +
                            '<td style="padding-top:10px">' + _getAtAnchorIcon(0, '#888', '#fff') + '</td><td>' + _gtxt("AISSearch2.standing") + '</td></tr></table>';
                    }
//console.log(template)
                    legendDiv.innerHTML = template;
                    document.body.append(legendDiv);
                    let rc = legendDiv.getClientRects()[0];
                    legendDiv.style.left = (window.innerWidth - rc.width - 20) + 'px';
                    legendDiv.style.top = (window.innerHeight - rc.height - 40) + 'px';
                });
            });
            if (tools.needAltLegend)
                container.footer.querySelector('span.speed').click();

        };

    const _getUnderWayIcon = function (cog, type_color, group_style) {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><path style="fill:' + type_color + ';" d="M13.8,20.07a1,1,0,0,1-.69-0.28l-1.79-1.72a0.72,0.72,0,0,0-1,0L8.52,19.79a1,1,0,0,1-.69.28,1,1,0,0,1-1-1V8.65c0-1.52,1.55-7.59,4-7.59s4,6.07,4,7.59V19a1,1,0,0,1-1,1h0Z"/><path style="fill:' + group_style + ';" d="M10.82,1.57c1.93,0,3.5,5.57,3.5,7.09V19a0.52,0.52,0,0,1-.51.53,0.49,0.49,0,0,1-.34-0.14l-1.79-1.72a1.22,1.22,0,0,0-1.71,0L8.17,19.42a0.49,0.49,0,0,1-.34.14A0.52,0.52,0,0,1,7.32,19V8.65c0-1.51,1.57-7.09,3.5-7.09h0m0-1c-3,0-4.5,6.72-4.5,8.09V19a1.52,1.52,0,0,0,1.51,1.53,1.49,1.49,0,0,0,1-.42l1.79-1.72a0.22,0.22,0,0,1,.32,0l1.79,1.72a1.49,1.49,0,0,0,1,.42A1.52,1.52,0,0,0,15.32,19V8.65c0-1.37-1.51-8.09-4.5-8.09h0Z"/><ellipse style="fill:#fff;" cx="10.82" cy="10.54" rx="1.31" ry="1.35"/><path style="fill:#fff;" d="M10.73,3.34h0.12a0.35,0.35,0,0,1,.35.35v6.85a0,0,0,0,1,0,0H10.38a0,0,0,0,1,0,0V3.69A0.35,0.35,0,0,1,10.73,3.34Z"/></svg>';
    },
        _getAtAnchorIcon = function (cog, type_color, group_style) {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><rect style="fill:' + type_color + ';stroke:' + group_style + ';stroke-miterlimit:10;" x="5.9" y="5.6" width="9.19" height="9.19" rx="2" ry="2" transform="translate(-4.13 10.41) rotate(-45)"/><circle style="fill:#fff;" cx="10.5" cy="10.19" r="1.5"/></svg>';
        };
    return {
        getUnderWayIcon: _getUnderWayIcon,
        getAtAnchorIcon: _getAtAnchorIcon,
        createSwitch: _createSwitch,
        get icons(){return _icons;},
        get iconsAlt(){return _iconsAlt;},
        //get iconsDict(){return _iconsDict;},
        //get iconsAltDict(){return _iconsAltDict;},
        getIconAlt: function(vessel_name, sog){           
            // speed icon
            for(let f in _iconsAltDict){
                let cond = f.replace(/"sog"/ig,  sog);
                if (vessel_name)
                    cond = cond.replace(/"vessel_name"/ig,  
                    "'" + vessel_name.replace(/'/g, "\\\'").replace(/\\[^']/g, "\\\\") + "'");
//console.log(cond + " " + "eval(cond)")
                if(eval(cond))
                    return _iconsAltDict[f];
            }
        },
        getIcon: function(vessel_type, sog){ 
            for(let f in _iconsDict){
                let re1 = new RegExp("'"+vessel_type+"'"),
                re2 = new RegExp(sog != 0 ? ">0" : "=0");
//console.log(vessel_type+" "+sog+" "+f+" "+f.search(re1)+" "+f.search(re2))
                if(f.search(re1)!=-1 && f.search(re2)!=-1){
//console.log( _iconsDict[f])
                    return _iconsDict[f];
                }
            }
        },
        getIconAltUrl: function(vessel_name, sog){ 
            let icon = this.getIconAlt(vessel_name, sog)
            return icon && icon.url; 
        },
        getIconUrl: function(vessel_type, sog){ 
            let icon = this.getIcon(vessel_type, sog)
            return icon && icon.url; 
        }
    }
}

module.exports = LegendControl;