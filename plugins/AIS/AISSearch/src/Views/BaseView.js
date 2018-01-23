//************************************
//  BASE AIS VIEW
//************************************
let NOSIDEBAR = false,
	SIDEBAR2 = false;
if (has('NOSIDEBAR'))
	NOSIDEBAR = true;
if (has('SIDEBAR2'))
	SIDEBAR2 = true;
	
module.exports = function({publicInterface, highlight}){
	const _waitTime = 1000
	return {
		get model() { return this._model },
        _calcHeight: function(){
			let h = $('.ais_vessel')[0].getBoundingClientRect().height+5
			if (NOSIDEBAR)
				return h*5-5
			else{
				//let H = $('.iconSidebarControl-content').height()-150,
				let H = $('.gmx-sidebar-pane').height()-150,
				n = Math.ceil(H/h)
//console.log(H)
				return h*n-5
			}
		},
        drawBackground: function(){
            this._clean();
        },
        _clean: function(){
            if (this.doClean)
                this.doClean();
            $('.info', this._container).off('click');
            $('.position', this._container).off('click');
            $('.history', this._container).off('click');
            if ($('.mCSB_container', this._container)[0])
                $('.mCSB_container', this._container).empty();
            else
                $(this._container).empty();
        },
        create: function(controls){
            $.extend(this, controls);
            if (this.createForm)
                this.createForm();			
            $(this._container).height(this._calcHeight())
            if (this.bindControlEvents)
                this.bindControlEvents();
			if (NOSIDEBAR){
				if ($('.icon-down-dir', this._frame)[0] && $('.icon-down-dir', this._frame).height()==34)
					$('.icon-down-dir', this._frame).css({position:'relative', top:'2px'})
			}
			else{
				if (SIDEBAR2){
					if ($('.icon-down-dir', this._frame)[0] && $('.icon-down-dir', this._frame).height()==34)
						$('.icon-down-dir', this._frame).css({position:'relative', top:'2px'})
					$('.ais_tab').css({'border-top':'none'})
				}
				else
					$('.icon-down-dir', this._frame).css({position:'relative', top:'1px'})
			}
        },
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
            //this._refresh.addClass('animate-spin');
            this._refresh.show();

            if (!this._lastUpdate || rest>=_waitTime){
                this._lastUpdate = new Date().getTime();  
                this._model.update();
            }
            else{
                this._wait = setTimeout(function(){  
                    _this._lastUpdate = new Date().getTime();  
                    _this._model.update();
                }, _waitTime-rest);
            }
        },
        hide: function(){            
            $(this._frame).hide();
        },
        positionMap: function(vessel){
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
			
			nsGmx.leafletMap.removeLayer(highlight);
			highlight.vessel = vessel;
			highlight.setLatLng([vessel.ymax, vessel.xmax]).addTo(nsGmx.leafletMap);				
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
                        _this.positionMap(vessel);
                    }
                    else{
                        console.log(response);
                    }
                });
            }
            else
				this.positionMap(vessel);	

        },  
        repaint: function(){

            if (!$(this._container).is(':visible'))
                return;

//console.log("REPAINT "+(new Date().getTime()-this._start)+"ms")

            //this._refresh.removeClass('animate-spin');
            this._refresh.hide();
            //this._refresh.parent().addClass('clicable');
            //this._refresh.parent().attr('title', _gtxt('AISSearch2.refresh'));

            this._clean();

//console.log(this._model.data.vessels[0].heading_rot);
            var scrollCont = $(this._container).find('.mCSB_container');
            var content = $(Handlebars.compile(this._tableTemplate)(this._model.data));
//console.log(content);
            if (!scrollCont[0]){
                $(this._container).append(content).mCustomScrollbar(); 
            }
            else{
                $(scrollCont).append(content);
            } 
            var _this = this;           
            $('.info', this._container).on('click', function(){
				let target = $(this),
					vessel = JSON.parse(target.attr('vessel'))
                publicInterface.showInfo(vessel, (v)=>{
//console.log(vessel)
					vessel.xmin = vessel.xmax = v.longitude
					vessel.ymin = vessel.ymax = v.latitude
					if (vessel.hasOwnProperty('ts_pos_utc')){
						vessel.ts_pos_utc = v.ts_pos_utc
						$(this).closest('tr').find('.date').html('('+v.ts_pos_utc+')')
					}
					target.attr('vessel', JSON.stringify(vessel))
				});
            });          
            $('.position', this._container).on('click', function(){
                _this.showPosition($(this))
                publicInterface.showHistory(JSON.parse($(this).closest('tr').find('.info').attr('vessel')), true);
            });
            $('.history', this._container).on('click', function(){
                publicInterface.showHistory(JSON.parse($(this).closest('tr').find('.info').attr('vessel')), true);
            }); 
            $('.show_voyage_info', this._container).on('click', function(e){
                let vi = $(e.currentTarget).closest('div').find('div.voyage_info')
				if (vi.is(':visible')) vi.hide()
				else vi.show()
            }); 			
			
            if (this._repaintControls)
                this._repaintControls();         
        }
    };
}