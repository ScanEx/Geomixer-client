//************************************
//  BASE AIS VIEW
//************************************

module.exports = function({publicInterface, highlight}){
	return {
		get model() { return this._model },
        _calcHeight: function(){return ($('.ais_vessel')[0].getBoundingClientRect().height+5)*5-5},
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

            //this._refresh.addClass('animate-spin');
            this._refresh.show();

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

//console.log(this._model.data);
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
                publicInterface.showInfo(JSON.parse($(this).attr('vessel')), true);
            });          
            $('.position', this._container).on('click', function(){
                _this.showPosition($(this))
            });
            if (this._repaintControls)
                this._repaintControls();         
        }
    };
}