(function() {
var utils = nsGmx.Utils;
_translationsHash.addtext('rus', {ManualAttrView: {
    headerName: 'Название',
    headerType: 'Тип'
}});

_translationsHash.addtext('eng', {ManualAttrView: {
    headerName: 'Name',
    headerType: 'Type'
}});


var selectorTemplate = Handlebars.compile('<select class="selectStyle customAttr-typesselect">' +
        '{{#each types}}' +
            '<option value="{{server}}" id="{{server}}"{{#if @root.isSelected}} selected{{/if}}>{{user}}</option>' +
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
    var isAddingNew = false;

    var createTypeSelector = function(selectedType)
    {
        return $(selectorTemplate({
            types: nsGmx.ManualAttrModel.TYPES,
            isSelected: function() {
                return this.server === selectedType;
            }
        }));
    };

    var createRow = function(attr, i) {
        var typeSelector = createTypeSelector(attr.type.server)[0];
        $(typeSelector).data('idx', i);

        $(typeSelector).change(function() {
            var serverType = $('option:selected', this).val(),
                attrType = window._.findWhere(nsGmx.ManualAttrModel.TYPES, {server: serverType});

            _model.changeType($(this).data('idx'), attrType);
        });

        var nameSelector = utils._input(null, [['attr', 'class', 'customAttrNameInput inputStyle'], ['css', 'width', '120px']]);

        $(nameSelector).data('idx', i).val(attr.name);

        var deleteIcon = utils.makeImageButton('img/recycle.png', 'img/recycle_a.png');
        var tr = utils._tr([utils._td([nameSelector]), utils._td([typeSelector]), utils._td([deleteIcon])]);
        $(nameSelector).on('keyup', function()
        {
            var idx = $(this).data('idx');
            var name = $(this).val();

            if (idx >= 0) {
                _model.changeName(idx, name);
            } else if (name) {
                isAddingNew = true;
                $(tr).find('td:gt(0)').show();
                $(tr).removeClass('customAttributes-new');
                var newIdx = _model.addAttribute(nsGmx.ManualAttrModel.TYPES.STRING, name);
                $([nameSelector, typeSelector, deleteIcon]).data('idx', newIdx);
                isAddingNew = false;
            }
        });

        $(deleteIcon).addClass('removeIcon').data('idx', i);
        deleteIcon.onclick = function()
        {
            _model.deleteAttribute($(this).data('idx'));
        };

        return tr;
    };

    var redraw = function()
    {
        if (!_model || isAddingNew) { return; }

        $(_parent).empty();
        _trs = [];

        _model.each(function(attr, i) {
            _trs.push(createRow(attr, i));
        });

        var newAttr = createRow({name: '', type: nsGmx.ManualAttrModel.TYPES.STRING}, -1);
        $(newAttr).find('td:gt(0)').hide();
        $(newAttr).addClass('customAttributes-new');

        _trs.push(newAttr);

        var tbody = nsGmx.Utils._tbody(_trs);
        var theader = $(Handlebars.compile('<thead><tr><th>{{i "ManualAttrView.headerName"}}</th><th>{{i "ManualAttrView.headerType"}}</th></tr></thead>')());

        $(_parent).append($('<fieldset/>').css('border', 'none').append(nsGmx.Utils._table([theader[0], tbody], [['dir', 'className', 'customAttributes']])));
        _this.setActive(_isActive);
    };

    this.setActive = function(isActive) {
        _isActive = isActive;
        var fieldset = $(_parent).children('fieldset');
        if (isActive) {
            fieldset.removeAttr('disabled');
        } else {
            fieldset.attr('disabled', 'disabled');
        }
        $('.removeIcon, .customAttributes-new', fieldset).toggle(isActive);
    };

    this.init = function(parent, model)
    {
        _parent = parent;
        _model = model;
        $(_model).on('newAttribute delAttribute moveAttribute', redraw);

        $(_model).on('newAttribute', function() {
            if (!$(_parent).find('.customAttributes-new').length) {
                var newAttr = createRow({name: '', type: nsGmx.ManualAttrModel.TYPES.STRING}, -1);
                $(newAttr).find('td:gt(0)').hide();
                $(newAttr).addClass('customAttributes-new');
                $(_parent).find('tbody').append(newAttr);
            }
        });
        redraw();
    };
};

})();
