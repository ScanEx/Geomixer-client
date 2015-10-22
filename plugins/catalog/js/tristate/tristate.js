(function($){
	$.fn.tristate = function(root, selector){
		if(selector && typeof(selector) == 'string'){			
			var _root = typeof(root) == 'string' ? $(root) : root;
			var update = function (){
				var items = jQuery.makeArray(_root.find(selector));
				var len = items.length;
				if (len < 2){					
					return;
				}
				var state0 = this.prop('indeterminate');
				var checked = $(items[0]).prop('checked');
				var state = false;
				for (var i = 1; i < len; i++){
					if($(items[i]).prop('checked') != checked){
						state = true;
						break;						
					}
				}
				if(state != state0) {
					this.prop('indeterminate', state);					
				}				
				this.prop('checked', checked);				
			}.bind(this);
			this.data('_items_root', _root);
			this.on('click', function(){
				var state = this.prop('checked');
				_root.find(selector).each(function(i, item){
					if($(item).prop('checked') != state){
						item.click();
					}
				});
			}.bind(this));
			_root.delegate(selector, 'click', update);
			update();
		}
		return this;
	}
}(jQuery));





