(function()
{
    var LayerTags = function(initTags)
    {
        var uniqueID = 0;
        var tags = {};
        
        var DEFAULT_TYPE = 'String';
        var types = [
            {title: 'Number', key: 'Number'},
            {title: 'String',  key: 'String'},
            {title: 'Date',  key: 'Date'},
            {title: 'Date time',  key: 'DateTime'},
            {title: 'Time',  key: 'Time'}
        ];
        
        var verificationFunctions = {
            'Number': function(value)
            {
                return !isNaN(Number(value));
            },
            'String': function(value)
            {
                return true; 
            }
        }
                
        var _isValidTypeValue = function(type, value)
        {
            return !(type in verificationFunctions) || verificationFunctions[type](value);
        }
        
        this.updateTag = function(id, tag, value, type)
        {
            if ( !(id in tags) ) return false;
            
            if (tags[id].tag !== tag || tags[id].value !== value || tags[id].type !== type )
            {
                tags[id] = {tag: tag, value: value, type: type};
                $(this).change();
            }
            
            return true;
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
        
        this.eachValid = function(callback)
        {
            for (var tagId in tags)
                if (this.isValidTagname(tags[tagId].tag) && this.isValidValue(tagId) && !this.isEmptyTag(tagId))
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
            return tagId in tags && tags[tagId].tag === '' && tags[tagId].value === '';
        }
        
        this.isValidValue = function(tagId)
        {
            return tagId in tags && _isValidTypeValue(tags[tagId].type, tags[tagId].value);
        }
        
        this.isValidTagname = function(tagname)
        {
            return tagname !== '';
        }
        
        for (var tag in initTags)
            this.addNewTag(tag, initTags[tag].Value, initTags[tag].Type);
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
        
        var updateInput = function(valueInput, type)
        {
            if ( type == 'Date' )
            {
                $(valueInput).timepicker('destroy');
                $(valueInput).datetimepicker('destroy');
                
                $(valueInput).datepicker(
                {
                    changeMonth: true,
                    changeYear: true,
                    dateFormat: "dd.mm.yy"
                });
                
            }
            else if ( type == 'DateTime' )
            {
                $(valueInput).timepicker('destroy');
                $(valueInput).datepicker('destroy');
                
                $(valueInput).datetimepicker(
                {
                    changeMonth: true,
                    changeYear: true,
                    //buttonImage: "img/calendar.png",
                    dateFormat: "dd.mm.yy",
                    timeOnly: false
                }).addClass('layertags-datetimeinput');
            }
            else if ( type == "Time" )
            {
                
                $(valueInput).datepicker('destroy');
                $(valueInput).datetimepicker('destroy');
                
                $(valueInput).timepicker({timeOnly: true});
            }
            else
            {
                $(valueInput).timepicker('destroy');
                $(valueInput).datetimepicker('destroy');
                $(valueInput).datepicker('destroy');
            }
        }
        
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
            updateInput(valueInput, type);
                
            var updateModel = function()
            {
                var type = $('option:selected', typeSelect).val();
                
                layerTags.updateTag(tagId, tagInput.val(), valueInput.val(), type);
            }
            
            tagInput.bind('keyup', updateModel);
            valueInput.bind('keyup change', updateModel);
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
            
            rows[tagId] = {tr: tr, tag: tagInput, value: valueInput, type: typeSelect, valueType: type};
        }
        
        var convertFunctions = {
            'Number': function(id, value)
            {
                return Number(value);
            },
            'Date': function(id, value)
            {
                return rows[id].value.datepicker('getDate').valueOf()/1000;
            },
            'DateTime': function(id, value)
            {
                return rows[id].value.datetimepicker('getDate').valueOf()/1000;
            },
            'Time': function(id, value)
            {
                var date = $(rows[id].value).datetimepicker('getDate');
                return date.getHours()*3600 + date.getMinutes()*60 + date.getSeconds();
            }
        }
        
        this.convertTagValue = function(id, type, value)
        {
            return type in convertFunctions ? convertFunctions[type](id, value) : value;
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
                    
                    if (rows[tagId].valueType !== type)
                    {
                        rows[tagId].valueType = type;
                        $('option', rows[tagId].type).each(function()
                        {
                            if ($(this).val() == type)
                                $(this).attr('selected', 'selected');
                            else
                                $(this).removeAttr('selected');
                        });
                        
                        updateInput(rows[tagId].value, type);
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
    
    LayerTagSearchControl.convertFromServer = function(type, value)
    {
        if (type === 'DateTime')
        {
            var tempInput = $('<input/>').datetimepicker({timeOnly: false});
            $(tempInput).datetimepicker('setDate', new Date(value*1000));
            return $(tempInput).val();
        }
        else if (type === 'Time')
        {
            var tempInput = $('<input/>').timepicker({timeOnly: true});
            $(tempInput).timepicker('setTime', new Date(value*1000));
            return $(tempInput).val();
        }
        else if (type === 'Date')
        {
            return $.datepicker.formatDate('dd.mm.yy', new Date(value*1000));
        }
        else
            return value;
    }
    
    nsGmx.LayerTagSearchControl = LayerTagSearchControl;
    nsGmx.LayerTags = LayerTags;
})();