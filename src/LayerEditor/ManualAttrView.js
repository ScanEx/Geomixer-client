(function() {

var selectorTemplate = Handlebars.compile('<select class="selectStyle customAttr-typesselect">' +
        '{{#each types}}' +
            '<option value="{{server}}" id="{{server}}"{{#if isSelected}} selected{{/if}}>{{user}}</option>' +
        '{{/each}}' +
    '</select>'
);

nsGmx.ManualAttrView = function()
{
    var _parent = null;
    var _model = null;
    var _trs = [];
    var _isActive = true;
    var _this = this;
    
    var createTypeSelector = function(selectedType)
    {
        /*var s = nsGmx.Utils._select(null, [['css', 'width', '83px'], ['dir', 'className', 'selectStyle']]);
        for (var type in nsGmx.ManualAttrModel.TYPES) {
            $(s).append(_option([_t(nsGmx.ManualAttrModel.TYPES[type].user)], [['dir', 'attrType', nsGmx.ManualAttrModel.TYPES[type]], ['attr', 'id', nsGmx.ManualAttrModel.TYPES[type].server]]));
        }
        return s;*/
        return $(selectorTemplate({
            types: nsGmx.ManualAttrModel.TYPES, 
            isSelected: function() {
                return this.server === selectedType;
            }
        }));
    }
            
    var redraw = function()
    {
        if (!_model) return;
        
        $(_parent).empty();
        _trs = [];
        
        _model.each(function(attr, i) {
            var typeSelector = createTypeSelector(attr.type.server)[0];
            typeSelector.attrIdx = i;
            //$('#' + attr.type.server, typeSelector).attr('selected', 'selected');
            
            $(typeSelector).change(function() {
                var serverType = $('option:selected', this).val(),
                    attrType = _.findWhere(nsGmx.ManualAttrModel.TYPES, {server: serverType});
                // var attrType = $('option:selected', this)[0].attrType;
                _model.changeType(this.attrIdx, attrType);
            });
            
            var nameSelector = _input(null, [['attr', 'class', 'customAttrNameInput inputStyle'], ['css', 'width', '80px']]);
        
            $(nameSelector).attr({attrIdx: i}).val(attr.name);
            
            $(nameSelector).on('keyup', function()
            {
                var idx = $(this).attr('attrIdx');
                var name = $(this).val();
                
                _model.changeName(idx, name);
            });
            
            var deleteIcon = makeImageButton("img/close.png", "img/close_orange.png");
            $(deleteIcon).addClass('removeIcon');
            deleteIcon.attrIdx = i;
            deleteIcon.onclick = function()
            {
                _model.deleteAttribute(this.attrIdx);
            }
                
            var moveIcon = _img(null, [['attr', 'src', "img/moveIcon.gif"], ['dir', 'className', 'moveIcon'], ['css', 'cursor', 'move'], ['css', 'width', '13px']]);
                
            _trs.push(_tr([_td([nameSelector]), _td([typeSelector]), _td([deleteIcon]), _td([moveIcon])]));
        })
            
        var tbody = _tbody(_trs);
        $(tbody).sortable({
            axis: 'y', 
            handle: '.moveIcon',
            stop: function(event, ui) {
                var oldIdx = ui.item.find('input[attrIdx]').attr('attrIdx');

                var elem = ui.item.next()[0] || ui.item.prev()[0];
                var delta = ui.item.next()[0] ? 0 : 1;
                _model.moveAttribute(parseInt(oldIdx), parseInt($(elem).find('input[attrIdx]').attr('attrIdx')) + delta);
            }
        });
        $(_parent).append($('<fieldset/>').css('border', 'none').append(_table([tbody], [['dir', 'className', 'customAttributes']])));
        _this.setActive(_isActive);
    }
    
    this.setActive = function(isActive) {
        _isActive = isActive;
        var fieldset = $(_parent).children('fieldset');
        if (isActive) {
            fieldset.removeAttr('disabled');
        } else {
            fieldset.attr('disabled', 'disabled');
        }
        $('.moveIcon, .removeIcon', fieldset).toggle(isActive);
    }
    
    this.init = function(parent, model)
    {
        _parent = parent;
        _model = model;
        $(_model).bind('newAttribute delAttribute moveAttribute', redraw);
        redraw();
    }
};

})();