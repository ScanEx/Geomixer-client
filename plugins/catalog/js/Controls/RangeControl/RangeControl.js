(function($){
	$.widget('scanex.range', {
		options: {
			values: [],
			range: []
		},		
		_create: function(){
			this.element.addClass('scanex-range');
			for(var i = 0, len = this.options.values.length; i < len; i++){
				var v = this.options.values[i];
				$('<span></span>',{text: v})
				.addClass('scanex-range-value')
				.click(function(e){					
					var v = parseInt($(e.target).text());										
					switch(this.options.range.length){
						case 0:
							this._setOption	('range', [v]);
							break;
						case 1:							
							this._setOption	('range', this.options.range.concat(v));
							break;
						case 2:							
							this._setOption	('range', []);
							break;
						default:
							break;
					}					
				}.bind(this))
				.appendTo(this.element);
				this._update();
			}
		},
		_destroy: function(){
			this.element.removeClass('scanex-range');	
			this.element.empty();
		},
		_setOption: function(key, value) {
			this._super(key, value);
			if ( key === 'range' ) {
				this._update();
			}			
		},
		_update: function(){
			if(this.options.range && this.options.range.length){
				var min = Math.min.apply(null, this.options.range),
					max = Math.max.apply(null, this.options.range);
				this.element.find('.scanex-range-value').each(function(){
					var t = $(this);
					var v = parseInt(t.text());
					if(min <= v && v <= max){
						t.addClass('scanex-range-value-selected');
					}
					else{
						t.removeClass('scanex-range-value-selected');
					}
				});
			}
			else{
				this.element.find('.scanex-range-value').each(function(){
					var t = $(this);					
					t.removeClass('scanex-range-value-selected');					
				});
			}
		}
	});
})(jQuery);