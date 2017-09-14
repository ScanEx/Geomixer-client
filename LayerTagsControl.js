(function()
{
    /**
    Хранит информацию о тегах: типы и описание
    @memberOf nsGmx
    @class
    @param {Object} initTagsInfo - описание тегов вида tagName: {Type: , Description: }
    */
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
        var def;

        /** Загружает данные о доступных тегах с сервера
        * @memberOf nsGmx.TagMetaInfo
        * @name loadFromServer
        * @function
        * @param {function(tagInfo)} [callback] Ф-ция, которая будет вызвана после загрузки информации о типах.
        * @return {jQuery.Deferred} Будет заресолвен после получения информации о типах
        */
        TagMetaInfo.loadFromServer = function(callback)
        {
            if (!def)
            {
                def = $.Deferred();
                sendCrossDomainJSONRequest(serverBase + 'Layer/MetaKeys.ashx', function(response)
                {
                    if (!parseResponse(response))
                    {
                        def.resolve();
                        return;
                    }
                    def.resolve(new TagMetaInfo(response.Result));
                })
            }
            callback && def.done(callback);
            return def;
        }
    })();

    var extendClass = function(base, sub) {
        function ctor() {}

        ctor.prototype = base.prototype;
        sub.prototype = new ctor();
        sub.prototype.constructor = sub;
    }

    var LayerTags = function(initTags)
    {
        /** Вызывается при изменении набора тегов слоя
            @name nsGmx.LayerTags.change
            @event
        */

        this._uniqueID = 1;
        this._tags = {};

        for (var tag in initTags) {
            var values = initTags[tag].Value;
            if (!$.isArray(values)) {
                values = [values];
            }

            for (var i = 0; i < values.length; i++) {
                this.addNewTag(tag, values[i]);
            }
        }
    }

    LayerTags.prototype = {
        _verificationFunctions: {
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
        },

        _isValidTypeValue: function(type, value)
        {
            return !(type in this._verificationFunctions) || this._verificationFunctions[type](value);
        },

        updateTag: function(id, tag, value, type)
        {
            var tags = this._tags;
            if ( !(id in tags) ) return false;
            if ( tags[id].tag !== tag || tags[id].value !== value || tags[id].type !== type)
            {
                tags[id] = {tag: tag, value: value, type: type};
                $(this).change();
            }

            return true;
        },

        deleteTag: function(id)
        {
            if ( !(id in this._tags) ) return;

            delete this._tags[id];
            $(this).change();
        },

        each: function(callback)
        {
            var tags = this._tags;
            for (var tagId in tags)
                callback(tagId, tags[tagId].tag, tags[tagId].value, tags[tagId].type);
        },

        eachValid: function(callback, allowUnknownTags)
        {
            var tags = this._tags;
            for (var tagId in tags)
                if ((allowUnknownTags || this.isValidValue(tagId)) && !this.isEmptyTag(tagId))
                    callback(tagId, tags[tagId].tag, tags[tagId].value, tags[tagId].type);
        },

        addNewTag: function(tag, value, type)
        {
            if (typeof value === 'undefined' || value === null) {
                value = '';
            };

            var newId = 'id' + (++this._uniqueID);
            this._tags[newId] = {tag: tag || '', value: value, type: type};
            $(this).change();
            return newId;
        },

        isTag: function(tagId)
        {
            return tagId in this._tags;
        },

        isEmptyTag: function(tagId)
        {
            var tags = this._tags;
            return tagId in tags && tags[tagId].tag === '' && tags[tagId].value === '';
        },

        isValidValue: function(tagId)
        {
            var tags = this._tags;
            return tagId in tags && this._isValidTypeValue(tags[tagId].type, tags[tagId].value);
        },

        getTag: function(tagId)
        {
            return this._tags[tagId];
        },

        getTagByName: function(tagName)
        {
            var tags = this._tags;
            for (var tagId in tags)
                if (tags[tagId].tag == tagName)
                    return tags[tagId];
        },

        getTagIdByName: function(tagName)
        {
            var tags = this._tags;
            for (var tagId in tags)
                if (tags[tagId].tag == tagName)
                    return tagId;
        }
    }

    /**
        Набор тегов (метаданных) слоя из определённого набора тегов
        @memberOf nsGmx
        @class
        @param {nsGmx.TagMetaInfo} tagMetaInfo описание типов тегов
        @param {Object} initTags теги для инициализации. Формат: {tagName: {Value: tagValue}, ...}. tagValue может быть массивом
    */
    var LayerTagsWithInfo = function(tagMetaInfo, initTags) {

        // чтобы можно было расширять существующий объект LayerTags
        if (this instanceof LayerTagsWithInfo) {
            LayerTags.call(this, initTags);
        }

        this.getTagMetaInfo = function()
        {
            return tagMetaInfo;
        }

        this.isKnownTagname = function(tagname)
        {
            return tagMetaInfo.isTag(tagname);
        }

        this.addNewTag = function(tag, value, type)
        {
            type = type || tagMetaInfo.getTagType(tag) || '';
            LayerTags.prototype.addNewTag.call(this, tag, value, type);
        }

        this.updateTag = function(id, tag, value) {
            var type = tagMetaInfo.getTagType(tag);
            LayerTags.prototype.updateTag.call(this, id, tag, value, type);
        }
    }

    extendClass(LayerTags, LayerTagsWithInfo);

    /**
        Контрол для задания набора тегов (например, для слоя)
        @memberOf nsGmx
        @class
    */
    var LayerTagSearchControl = function(layerTags, container, params)
    {
        var _params = $.extend({
            inputWidth: 130,
            tagHeader: _gtxt('Параметр'),
            valueHeader: _gtxt('Значение')
        }, params )
        var mainTable = $('<table/>', {'class': 'layertags-table'}).appendTo(container);
        mainTable.append($('<tr/>')
            .append($('<th/>').text(_params.tagHeader))
            .append($('<th/>').text(_params.valueHeader))
            .append($('<th/>'))
        );

        //добавляем к body элемент с id чтобы добавить к нему jQuery autocomplete и задать стили
        //к текущему виджету добавить нельзя, так как он ещё не добавлен в общее дерево, а виджет ac требует глобального селектора
        if ($('#layertagstable').length == 0)
            $('body').append($('<div id="layertagstable"></div>'));

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
                    onSelect: function(dateText, inst) {
                        $(this).change();
                    },
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
                    timeFormat: "HH:mm:ss",
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
                    timeFormat: "HH:mm:ss",
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
            if ( !layerTags.isEmptyTag(row.id) && !layerTags.isKnownTagname(row.tag.val()) )
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
                    tagInput.val(ui.item.name);
                    updateModel(ui.item.name, valueInput.val().trim());
                    return false;
                }
            }).bind('click', function(){
                $(tagInput).autocomplete("search", "");
            });

            tagInput.data( "ui-autocomplete" )._renderItem = function( ul, item )
            {
                return $( "<li/>")
                    .append($("<a/>", {title: item.desc}).text(item.name))
                    .appendTo( ul );
            }

            var valueInput = $('<input/>', {'class': 'inputStyle'}).val(value).css('width', _params.inputWidth);

            var type = layerTags.getTagMetaInfo().getTagType(tag);
            updateInput(valueInput, type);


            var updateModel = function()
            {
                layerTags.updateTag(tagId, tagInput.val().trim(), valueInput.val().trim());
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
    nsGmx.LayerTagsWithInfo = LayerTagsWithInfo;
    nsGmx.TagMetaInfo = TagMetaInfo;
})();
