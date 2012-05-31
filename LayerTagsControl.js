(function()
{
    var TagMetaInfo = function(initTagsInfo)
    {
        var tags = initTagsInfo || {};
        
        this.isTag = function(tag)
        {
            return tag in tags;
        }
        
        this.getTagType = function(tag)
        {
            return tag in tags ? tags[tag].Type : null;
        }
        
        this.getTagDescription = function(tag)
        {
            return tag in tags ? tags[tag].Description : null;
        }
        
        this.getTagArray = function()
        {
            var res = [];
            for (var t in tags)
                res.push(t);
            return res;
        }
        
        this.getTagArrayExt = function()
        {
            var res = [];
            for (var t in tags)
                res.push( {name: t, type: tags[t].Type, desc: tags[t].Description} );
                
            return res;
        }
    };
    
    (function()
    {
        var metaInfo = null;
        TagMetaInfo.loadFromServer = function(callback)
        {
            if (metaInfo)
            {
                callback(new TagMetaInfo(metaInfo));
                return;
            }
            
            sendCrossDomainJSONRequest(serverBase + 'Layer/MetaKeys.ashx', function(response)
            {
                if (!parseResponse(response))
                {
                    callback();
                    return;
                }
                metaInfo = response.Result;
                callback(new TagMetaInfo(metaInfo));
            })
        }
    })();
    
    var LayerTags = function(tagMetaInfo, initTags)
    {
        var uniqueID = 1;
        var tags = {};
        
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
                return value.length && !isNaN(Number(value));
            },
            'String': function(value)
            {
                return true; 
            },
            'Date': function(value)
            {
                try {
                    $.datepicker.parseDate('dd.mm.yy', value);
                    return true;
                }
                catch(err) {
                    return false;
                }
            }
        }
                
        var _isValidTypeValue = function(type, value)
        {
            return !(type in verificationFunctions) || verificationFunctions[type](value);
        }
        
        this.getTagMetaInfo = function()
        {
            return tagMetaInfo;
        }
        
        this.updateTag = function(id, tag, value)
        {
            if ( !(id in tags) ) return false;
            if ( tags[id].tag !== tag || tags[id].value !== value )
            {
                //if (!tagMetaInfo.isTag(tag)) return false;
                
                tags[id] = {tag: tag, value: value};
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
                callback(tagId, tags[tagId].tag, tags[tagId].value);
        }
        
        this.eachValid = function(callback)
        {
            for (var tagId in tags)
                if (this.isValidValue(tagId) && !this.isEmptyTag(tagId))
                    callback(tagId, tags[tagId].tag, tags[tagId].value);
        }
        
        this.addNewTag = function(tag, value)
        {
            tag = tag || '';
            value = value || '';
            //if (tag !== '' && !tagMetaInfo.isTag(tag)) return;
            var newId = 'id' + (++uniqueID);
            tags[newId] = { tag: tag || '', value: value || ''};
            $(this).change();
            return newId;
        }
        
        this.isTag = function(tagId)
        {
            return tagId in tags;
        }
        
        // this.getTypes = function()
        // {
            // return types;
        // }
        
        this.isEmptyTag = function(tagId)
        {
            return tagId in tags && tags[tagId].tag === '' && tags[tagId].value === '';
        }
        
        this.isValidValue = function(tagId)
        {
            if (!(tagId in tags)) return false;
            var type = tagMetaInfo.getTagType(tags[tagId].tag);
            return type && _isValidTypeValue(type, tags[tagId].value);
        }
        
        this.isValidTagname = function(tagname)
        {
            return tagMetaInfo.isTag(tagname);
        }
        
        this.getTag = function(tagId)
        {
            return tags[tagId];
        }
        
        this.getTagByName = function(tagName)
        {
            for (var tagId in tags)
                if (tags[tagId].tag == tagName)
                    return tags[tagId];
        }
        
        for (var tag in initTags)
            this.addNewTag(tag, initTags[tag].Value);
    }

    var LayerTagSearchControl = function(layerTags, container, params)
    {
        var _params = $.extend( {inputWidth: 130}, params )
        var mainTable = $('<table/>', {'class': 'layertags-table'}).appendTo(container);
        mainTable.append($('<tr/>')
            .append($('<th/>').text(_gtxt('Параметр')))
            .append($('<th/>').text(_gtxt('Значение')))
            .append($('<th/>'))
        );
        
        //добавляем к body элемент с id чтобы добавить к нему jQuery autocomplete и задать стили
        //к текущему виджету добавить нельзя, так как он ещё не добавлен в общее дерево, а виджет ac требует глобального селектора
        if ($('#layertagstable').length == 0)
            $('body').append("<div/>").attr('id', 'layertagstable');
        
        var rows = {}; //ссылки на контролы для каждого элемента
        var rowsVector = [];
        
        //в зависимости от типа ввода (type), прикрепляет к valueInput виджет выбора даты, время или даты/время
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
                    dateFormat: "dd.mm.yy",
                    timeFormat: "hh:mm:ss",
                    showSecond: true,
                    timeOnly: false
                }).addClass('layertags-datetimeinput');
            }
            else if ( type == "Time" )
            {
                
                $(valueInput).datepicker('destroy');
                $(valueInput).datetimepicker('destroy');
                
                $(valueInput).timepicker({
                    timeOnly: true,
                    timeFormat: "hh:mm:ss",
                    showSecond: true
                });
            }
            else
            {
                $(valueInput).timepicker('destroy');
                $(valueInput).datetimepicker('destroy');
                $(valueInput).datepicker('destroy');
            }
        }
        
        var validateRow = function(row)
        {
            if ( !layerTags.isEmptyTag(row.id) && !layerTags.isValidTagname(row.tag.val()) )
                row.tag.addClass('error');
            else
                row.tag.removeClass('error');
                
            if (!layerTags.isEmptyTag(row.id) && !layerTags.isValidValue(row.id) )
                row.value.addClass('error');
            else
                row.value.removeClass('error');
        }
        
        var addNewRow = function(tagId, tag, value)
        {
            var tagInput = $('<input/>', {'class': 'inputStyle'}).val(tag).css('width', _params.inputWidth).autocomplete({
                source: layerTags.getTagMetaInfo().getTagArrayExt(),
                minLength: 0,
                delay: 0,
                appendTo: "#layertagstable",
                select: function(event, ui)
                {
                    tagInput.val(ui.item.value);
                    updateModel(ui.item.value, valueInput.val());
                    return false;
                }
            }).bind('click', function(){
                $(tagInput).autocomplete("search", "");
            });
            
            tagInput.data( "autocomplete" )._renderItem = function( ul, item ) 
            {
                return $( "<li/>")
                    .data( "item.autocomplete", {value: item.name} )
                    .append( $("<a/>", {title: item.desc}).text(item.name) )
                    .appendTo( ul );
            }
            
            var valueInput = $('<input/>', {'class': 'inputStyle'}).val(value).css('width', _params.inputWidth);
            
            var type = layerTags.getTagMetaInfo().getTagType(tag);
            updateInput(valueInput, type);
            
                
            var updateModel = function()
            {
                layerTags.updateTag(tagId, tagInput.val(), valueInput.val());
            }
                        
            tagInput.bind('keyup change', updateModel);
            valueInput.bind('keyup change', updateModel);
            
            var deleteButton = makeImageButton('img/recycle.png', 'img/recycle_a.png');
            deleteButton.onclick = function()
            {
                layerTags.deleteTag(tagId);
            }
            
            var tr = $('<tr/>')
                .append($('<td/>').append(tagInput))
                .append($('<td/>').append(valueInput))
                .append($('<td/>', {'class': 'layertags-delete'}).append(deleteButton));
            mainTable.append(tr);
            
            rows[tagId] = {id: tagId, tr: tr, tag: tagInput, value: valueInput, type: type};
            rowsVector.push(rows[tagId]);
            validateRow(rows[tagId]);
        }
        
        var moveEmptyLayersToBottom = function()
        {
            var lastEmptyId = -1;
            for (var irow = 0; irow < rowsVector.length; irow++)
                if (layerTags.isEmptyTag(rowsVector[irow].id))
                    lastEmptyId = irow;
            
            if (lastEmptyId >= 0 && lastEmptyId < rowsVector.length)
            {
                var tr = rowsVector[lastEmptyId].tr;
                $(tr).detach();
                mainTable.append(tr);
            }
        }
        
        $(layerTags).change(function()
        {
            var isAnyEmpty = false;
            layerTags.each(function(tagId, tag, value)
            {
                if (tag == '' && value == '')
                    isAnyEmpty = true;
                
                if (!(tagId in rows))
                    addNewRow(tagId, tag, value);
                else 
                {
                    if (rows[tagId].tag.val() !== tag)
                        rows[tagId].tag.val(tag)
                        
                    if (rows[tagId].value.val() !== value)
                        rows[tagId].value.val(value)
                        
                        
                    var type = layerTags.getTagMetaInfo().getTagType(tag);
                    if (rows[tagId].type !== type)
                    {
                        rows[tagId].type = type;
                        updateInput(rows[tagId].value, type);
                    }
                    
                    validateRow(rows[tagId]);
                }
            });
            
            for (var tagId in rows)
            {
                if (!(layerTags.isTag(tagId)))
                {
                    rows[tagId].tr.remove();
                    delete rows[tagId];
                }
            }
            
            if (!isAnyEmpty)
                layerTags.addNewTag();
                
            moveEmptyLayersToBottom();
        });
        
        layerTags.addNewTag();
    }
    
    nsGmx.LayerTagSearchControl = LayerTagSearchControl;
    nsGmx.LayerTags = LayerTags;
    nsGmx.TagMetaInfo = TagMetaInfo;
})();