require("./VesselInfoScreen.css")

module.exports = function ({modulePath, aisServices}){
        var _ais,  
        _galery, 
        _register, 
        _regcap,    
        _leftPanel,  
        _minh,
        _lloyds,
        resize,
        menuAction,       
	    scheme = document.location.href.replace(/^(https?:).+/, "$1"),
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
                                '<div class="ais cell menu-item active"><img src="'+modulePath+'svg/info_gen.svg" class="icon">Основные сведения</div>' +
                                '<div class="register cell menu-item"><img src="'+modulePath+'svg/info.svg" class="icon">Регистр</div>' +
                                '<div class="galery cell menu-item"><img src="'+modulePath+'svg/photogallery.svg" class="icon">Фотогалерея <div class="counter">0</div></div>' +
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
            '<div class="caption">' +
                '<span style="display: inline-block;height: 100%;vertical-align: middle;width: 40px;"></span>' +
                '<img src="img/progress.gif" style="vertical-align: middle">' +
            '</div>' +
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
'<form action="' + aisServices + 'Upload.ashx" class="uploadFile" method="post" enctype="multipart/form-data" target="upload_target" style="display:none" >' +
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

        '<div class="ais panel">' +
            '<div class="placeholder"></div>' +
        '</div>' +
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
                var preview = $("<div class='photo preview' id='"+data.id+"' style='background-image: url("+aisServices+"getphoto.ashx?id="+data.id+")'/>");
                $('.vessel-info-page .uploader').replaceWith(preview);
                preview.click(showPicture);
//console.log(preview)
            }
            else {//uploadError:            
                $('.vessel-info-page .uploader').remove();
                console.log(data.errmsg)
            }  
        }, false);

        $('<img src="' + scheme + window.serverBase.replace(/^https?:/, "")+'plugins/ais/getphoto.ashx?mmsi=' + vessel.mmsi + '">')
        .load(function () {	
            if (this)
                $('.column1 .photo img.no-image').replaceWith(this);	
        }).error(function(){			
            $('<img src="' + scheme + '//photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi=' + vessel.mmsi + '">').load(function () {
                    if (this)
                        $('.column1 .photo img.no-image').replaceWith(this);
            });
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

        _ais = document.querySelector('.vessel-info-page .column2 .ais') 
        _galery = document.querySelector('.vessel-info-page .column2 .galery')
        _register = document.querySelector('.vessel-info-page .column2 .register .content')
        _regcap = document.querySelector('.vessel-info-page .column2 .register .caption')    
        _leftPanel = document.querySelector('.vessel-info-page .column1 table')      
        _minh = 420
        resize = function(){
            var h = Math.floor(window.innerHeight*0.8);
            if (h>_minh){
                _leftPanel.style.height = _ais.style.height = _galery.style.height = h + "px";
                _register.style.height = h - _regcap.offsetHeight + "px";
            }
            else{
                _leftPanel.style.height = _ais.style.height = _galery.style.height = _minh + "px";
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
        $(_ais).mCustomScrollbar({theme:"vessel-info-theme"});
        $(_galery).mCustomScrollbar({theme:"vessel-info-theme"});
        $(_register).mCustomScrollbar({theme:"vessel-info-theme"});
        document.querySelector('.vessel-info-page .container').style.display = "table";  
    },
    showPicture = function(){
//console.log($(this))
            $('.vessel-info-page .picture').remove();
            var div = $('<div class="picture" style="display:none;position:absolute;"></div>')
            .insertAfter('.vessel-info-page.container').click(function(){this.remove()});
            $('<img src="'+aisServices+'getphoto.ashx?id='+this.id+'">').load(function() {
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
            galcontent.append("<div class='photo preview' id='"+gallery[i]+"' style='background-image: url("+aisServices+"getphoto.ashx?id="+gallery[i]+")'/>" )             
        $('.photo.preview').click(showPicture)
        resize();     
    },
    drawAis = function(ledokol){
    var aiscontent = document.querySelector(".vessel-info-page .ais .placeholder")
    aiscontent.innerHTML = "" +                
    "<div class='caption'><div>ИНФОРМАЦИЯ О СУДНЕ</div></div>" +
    "<table>" +
        "<tr><td>Название судна</td><td><b>"+ledokol.vessel_name+(ledokol.registry_name?" ("+ledokol.registry_name+")":"")+"</b></td></tr>" +
        "<tr><td>IMO</td><td>"+ledokol.imo+"</td></tr>" +
        "<tr><td>MMSI</td><td>"+ledokol.mmsi+"</td></tr>" +
        "<tr><td>Тип</td><td>"+ledokol.vessel_type+"</td></tr>" +
        "<tr><td>Флаг</td><td>"+ledokol.flag_country+"</td></tr>" +
        "<tr><td>Позывной</td><td>"+ledokol.callsign+"</td></tr>" +
        "<tr><td>Длина</td><td>"+ledokol.length+"</td></tr>" +
        "<tr><td>Ширина</td><td>"+ledokol.width+"</td></tr>" +
    "</table>" +
    "<div class='caption'><div>СВЕДЕНИЯ О ДВИЖЕНИИ</div></div>" +
    "<table>" +
        "<tr><td>Навигационный статус</td><td>"+ledokol.nav_status+"</td></tr>" +
        "<tr><td>COG</td><td>"+ledokol.cog+"</td></tr>" +
        "<tr><td>SOG</td><td>"+ledokol.sog+"</td></tr>" +
        "<tr><td>HDG</td><td>"+ledokol.heading+"</td></tr>" +
        "<tr><td>ROT</td><td>"+ledokol.rot+"</td></tr>" +
        "<tr><td>Осадка</td><td>"+ledokol.draught+"</td></tr>" +
        "<tr><td>Назначение</td><td>"+ledokol.destination+"</td></tr>" +
        "<tr><td>Расчетное время прибытия</td><td>"+ledokol.ts_eta+"</td></tr>" +
    "</table>";     
        resize();        
    },
    drawRegister = function(ledokol){
        let regcontent = _register.querySelector(".placeholder"),
        drawTable = function(groups, article, display){
            let s = "<div class='panel "+article+" article' style='display:"+display+"'>";
            for(let i=0; i<groups.length; ++i){
                if (!groups[i])
                    continue;
                s += "<div class='group'>"+groups[i].name+"</div><table>"
                for(let j=0; j<groups[i].properties.length; ++j){
                    let pn = groups[i].properties[j].name,
                    desc = groups[i].properties[j].description, 
                    pv = groups[i].properties[j].value
                    s+= "<tr><td>"+pn+
                    (desc ? "<div class='description'>" + desc + "</div>" : "")+ 
                    "</td><td>"+(pn=="Название судна"||pn=="Латинское название"?"<b>"+pv+"</b>":pv)+"</td></tr>"
                }
                s += "</table>"
            }
            s += "</div>"
            return s;
        }	

        _regcap.innerHTML = "<table class='register-title'>"+
        "<tr><td><span class='switch active'>РМРС</span> <span class='switch'>Lloyd's register</span></td></tr>"+
        "<tr><td><span class='update'></span></td></tr>"+
        "</table>";

        let drawRMR = function(){
            if (ledokol) {
                regcontent.innerHTML =
                    drawTable([ledokol.data[0], ledokol.data[1], ledokol.data[9]], "general", "block") +
                    drawTable([ledokol.data[2]], "build", "none") +
                    drawTable([ledokol.data[3]], "dimensions", "none") +
                    drawTable([ledokol.data[4], ledokol.data[5], ledokol.data[6], ledokol.data[7], ledokol.data[8]], "gears", "none");
                _regcap.querySelector('.update').innerText = "Обновление базы данных " + ledokol.version.replace(/ \S+$/g, '');
            }
            else{
                regcontent.innerHTML = "";
                _regcap.querySelector('.update').innerHTML = "&nbsp;"; 
            }
        },
        drawLloyds = function(){
            regcontent.innerHTML =
                drawTable([_lloyds.data[1], _lloyds.data[2], _lloyds.data[0]], "general", "block") +
                drawTable([_lloyds.data[9]], "build", "none") +
                drawTable([_lloyds.data[8]], "dimensions", "none") +
                drawTable([_lloyds.data[3], _lloyds.data[4], _lloyds.data[5], _lloyds.data[6], _lloyds.data[7]], "gears", "none");
            _regcap.querySelector('.update').innerText = "Обновление базы данных " + _lloyds.version.replace(/ \S+$/g, '');   
        },
        regSwitches = _regcap.querySelectorAll(".switch");
        regSwitches.forEach((item, i)=>item.addEventListener('click', e => {
            let cl = e.currentTarget.classList;
            if (!cl.contains('active')) {
                _regcap.querySelector(".switch.active").classList.remove('active');
                cl.add('active');
                switch (i){
                    case 0:
                        drawRMR();
                        break;
                    case 1:
                        if (_lloyds)
                            drawLloyds();
                        else
                            regcontent.innerHTML = "";                        
                        break;
                }           
                resize();   
                mia[0].click();
            }
        }));
        var mia = document.querySelectorAll('.column2 .menu-item');
        for (var i=0; i<mia.length; ++i){
            mia[i].addEventListener('click', menuAction)
        }
        drawRMR();             
        resize(); 
        if (!ledokol)        
            regSwitches[1].click();         
    }
	
	let open = function(vessel, vessel2){
                    show(vessel2);
                    var onFail = function(error){
                        if (error!='register_no_data')
                            console.log(error)
                        _regcap.innerHTML = "";
                    } 
                    new Promise(function(resolve, reject){
                        (function wait(){
                            if(!vessel2)
                                setTimeout(wait, 100);
                        })();
                        resolve(vessel2)
                    })
                    .then(function(ship){
//console.log(ship)
                        drawAis(ship)
                    }, 
                    onFail);
                    var registerServerUrl = scheme + "//kosmosnimki.ru/demo/register/api/v1/",
                        lloydsServerUrl = scheme + "//kosmosnimki.ru/demo/lloyds/api/v1/",
                        rmr;
                    if(vessel.imo && vessel.imo!=0 && vessel.imo!=-1){
                        fetch(registerServerUrl+"Ship/Search/"+vessel.imo+"/ru")
                        .then(function(response){
                            return response.json();
                        })  
                        .then(function(ship) {
                            if (ship.length>0)
                                return fetch(registerServerUrl+"Ship/Get/"+ship[0].RS+"/ru")
                            else
                                return Promise.resolve({json:()=>null});
                            //else
                            //    return Promise.reject('register_no_data');
                        })
                        .then(function(response){
                            return response.json();
                        })  
                        .then(function(ship) {
                            //console.log(ship)
                            rmr = ship;
                            if (rmr)
                                drawRegister(rmr);
                            return fetch(lloydsServerUrl+"Ship/Search/"+vessel.imo+"/ru");
                        })                        
                        .then(function(response){
                            return response.json();
                        })  
                        .then(function(ship) {
                            if (ship.length>0)
                                return fetch(lloydsServerUrl+"Ship/Get/"+ship[0].RS+"/ru")
                            else
                                return Promise.reject('register_no_data');
                        })
                        .then(function(response){
                            return response.json();
                        })  
                        .then(function(ship) {
                            _lloyds = ship;
                            if (!rmr)
                                drawRegister(rmr);
                        })
                        .catch( onFail );
                    }
                    else                    
                        _regcap.innerHTML = "";

                    new Promise(function(resolve, reject){
                        sendCrossDomainJSONRequest(aisServices + 
                            "gallery.ashx?mmsi="+vessel.mmsi+"&imo="+vessel.imo, function(response){
                            if (response.Status=="ok") 
                                resolve(response.Result);
                            else
                                reject(response)
                        });
                    })
                    .then(function(gallery){
                        drawGallery(gallery)
                    }, 
                    onFail);
                }
        
    return {
		open:open,
            show: show,
            drawRegister: drawRegister,
            drawAis: drawAis,
            drawGallery:drawGallery
    }
}