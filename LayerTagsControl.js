(function()
{
    var LayerTags = function(initTags)
    {
        var uniqueID = 0;
        var tags = {};
        
        var DEFAULT_TYPE = 'string';
        var types = [
            {title: 'Number', key: 'number'},
            {title: 'String',  key: 'string'},
            {title: 'Date',  key: 'date'},
            {title: 'Date time',  key: 'datetime'},
            {title: 'Time',  key: 'time'}
        ];
        
        var verificationFunctions = {
            'number': function(value)
            {
                return !isNaN(Number(value));
            },
            'string': function(value)
            {
                return true; 
            },
            'date': function(value) {return true; },
            'datetime': function(value) {return true; },
            'time': function(value) {return true; }
        }
        
        this.updateTag = function(id, tag, value, type)
        {
            if ( !(id in tags) ) return;
            
            if (tags[id].tag !== tag || tags[id].value !== value || tags[id].type !== type )
            {
                tags[id] = {tag: tag, value: value, type: type};
                $(this).change();
            }
        }
        
        this.deleteTag = function(id)
        {
            if ( !(id in tags) ) return;
            
            delete tags[id];
            $(this).change();
        }
        
        this.each = function(callback)
        {
            for (var tagId in tags)
                callback(tagId, tags[tagId].tag, tags[tagId].value, tags[tagId].type);
        }
        
        this.addNewTag = function(tag, value, type)
        {
            var newId = 'id' + (++uniqueID);
            tags[newId] = { tag: tag || '', value: value || '',  type: type || DEFAULT_TYPE };
            $(this).change();
            return newId;
        }
        
        this.isTag = function(tagId)
        {
            return tagId in tags;
        }
        
        this.getTypes = function()
        {
            return types;
        }
        
        this.isEmptyTag = function(tagId)
        {
            return tagId in tags && tags[tagId].tag === '' && tags[tagId].value === ''
        }
        
        this.isValidValue = function(tagId)
        {
            if (!(tagId in tags)) return false;
            if (!(tags[tagId].type in verificationFunctions)) return true;
            
            return verificationFunctions[tags[tagId].type](tags[tagId].value);
        }
        
        this.isValidTagname = function(tagname)
        {
            return tagname !== '';
        }
        
        for (var tag in initTags)
            this.addNewTag(tag, initTags[tag].value, initTags[tag].type);
    }

    var LayerTagSearchControl = function(layerTags, container)
    {
        var mainTable = $('<table/>', {'class': 'layertags-table'}).appendTo(container);
        mainTable.append($('<tr/>')
            .append($('<th/>').text('Тег'))
            .append($('<th/>').text('Значение'))
            .append($('<th/>').text('Тип'))
            .append($('<th/>'))
        );
        
        var rows = {}; //ссылки на контролы для каждого элемента
        
        var addNewRow = function(tagId, tag, value, type)
        {
            var tagInput = $('<input/>').val(tag);
            var valueInput = $('<input/>').val(value);
            
            var typeSelect = $('<select/>', {'class': 'layertags-type selectStyle'});
            var types = layerTags.getTypes();
            for (var t = 0; t < types.length; t++)
            {
                var opt = $('<option/>').val(types[t].key).text(types[t].title);
                if (type == types[t].key) opt.attr('selected', 'selected');
                    
                typeSelect.append(opt);
            }
                
            var updateModel = function()
            {
                layerTags.updateTag(tagId, tagInput.val(), valueInput.val(), $('option:selected', typeSelect).val());
            }
            
            tagInput.bind('keyup', updateModel);
            valueInput.bind('keyup', updateModel);
            typeSelect.change(updateModel);
            
            var deleteButton = makeImageButton('img/recycle.png', 'img/recycle_a.png');
            deleteButton.onclick = function()
            {
                layerTags.deleteTag(tagId);
            }
            
            var tr = $('<tr/>')
                .append($('<td/>').append(tagInput))
                .append($('<td/>').append(valueInput))
                .append($('<td/>').append(typeSelect))
                .append($('<td/>').append(deleteButton));
            mainTable.append(tr);
            
            rows[tagId] = {tr: tr, tag: tagInput, value: valueInput, type: typeSelect};
        }
        
        $(layerTags).change(function()
        {
            var isAnyEmpty = false;
            layerTags.each(function(tagId, tag, value, type)
            {
                if (tag == '' && value == '')
                    isAnyEmpty = true;
                
                if (!(tagId in rows))
                    addNewRow(tagId, tag, value, type);
                else 
                {
                    if (rows[tagId].tag.val() !== tag)
                        rows[tagId].tag.val(tag)
                        
                    if (rows[tagId].value.val() !== value)
                        rows[tagId].value.val(value)
                    
                    if ($('option:selected', rows[tagId].type).val() !== type)
                    {
                        $('option', rows[tagId].type).each(function()
                        {
                            if ($(this).val() == type)
                                $(this).attr('selected', 'selected');
                            else
                                $(this).removeAttr('selected');
                        });
                    }
                    
                    if ( !layerTags.isEmptyTag(tagId) && !layerTags.isValidTagname(tag) )
                        rows[tagId].tag.addClass('error');
                    else
                        rows[tagId].tag.removeClass('error');
                        
                    if (!layerTags.isEmptyTag(tagId) && !layerTags.isValidValue(tagId) )
                        rows[tagId].value.addClass('error');
                    else
                        rows[tagId].value.removeClass('error');
                }
            });
            
            for (var tagId in rows)
                if (!(layerTags.isTag(tagId)))
                {
                    rows[tagId].tr.remove();
                    delete rows[tagId];
                }
            
            if (!isAnyEmpty)
                layerTags.addNewTag();
        });
        
        layerTags.addNewTag();
    }

    nsGmx.LayerTagSearchControl = LayerTagSearchControl;
    nsGmx.LayerTags = LayerTags;
})();