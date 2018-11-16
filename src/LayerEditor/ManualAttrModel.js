(function() {
	
function capitaliseFirstLetter(str)
{
    return str.charAt(0).toUpperCase() + str.slice(1);
}

//events: newAttribute, delAttribute, updateAttribute, updateExpression, moveAttribute, change
nsGmx.ManualAttrModel = function(isRCLayer) {
    var _attributes = [];
    this.expressions = [];

    this.addAttribute = function(type, name)
    {
        _attributes.push({
            type: type,
            name: name,
            IsPrimary: false,
            IsIdentity: false,
            IsComputed: false,
            expression: '"' + name + '"'
        });

        this.expressions.push({
            name: name,
            expression: '"' + name + '"'
        })

        $(this).triggerHandler('newAttribute');
        $(this).triggerHandler('change');

        return _attributes.length - 1;
    };

    this.changeName = function(idx, newName)
    {
        _attributes[idx].name = newName;
        $(this).triggerHandler('updateAttribute');
        $(this).triggerHandler('change');
    };

    this.changeType = function(idx, newType)
    {
        _attributes[idx].type = newType;
        $(this).triggerHandler('updateAttribute');
        $(this).triggerHandler('change');
    };


    this.changeExpression = function(name, newExp)
    {
        var obj = this.expressions.find(function (obj){return obj.name === name});

        obj.expression = newExp;
        $(this).triggerHandler('updateExpression');
        $(this).triggerHandler('change');
    };

    this.deleteAttribute = function(idx)
    {
        _attributes.splice(idx, 1);
        $(this).triggerHandler('delAttribute');
        $(this).triggerHandler('change');
    };

    this.getAttribute = function(idx) { return _attributes[idx]; };
    this.getCount = function() { return _attributes.length; };
    this.each = function(callback, addInternalColumns, params) {
        for (var k = 0; k < _attributes.length; k++) {
            var column = _attributes[k];
            var isInternal = column.IsPrimary || column.IsIdentity || column.IsComputed ||
                             column.type.server === 'geometry' || (isRCLayer && column.name === 'GMX_RasterCatalogID');

            if (!isInternal || addInternalColumns) {
                callback(column, k, params);
            }
        }
    };

    this.moveAttribute = function(oldIdx, newIdx) {
        if (newIdx > oldIdx) {
            newIdx--;
        }

        if (oldIdx !== newIdx) {
            _attributes.splice(newIdx, 0, _attributes.splice(oldIdx, 1)[0]);
            $(this).triggerHandler('moveAttribute');
            $(this).triggerHandler('change');
        }
    };

    this.initFromServerFormat = function(serverColumns) {
        var _this = this;
        _attributes = [];
        $.each(serverColumns || [], function(i, column) {
            var type = window._.find(nsGmx.ManualAttrModel.TYPES, function(elem) {return elem.server === column.ColumnSimpleType.toLowerCase();});

            var obj = _this.expressions.find(function (obj){return obj.name === column.Name});

            if (!obj) {
                _this.expressions.push({
                    name: column.Name,
                    expression: '"' + column.Name + '"'
                })
            }

            _attributes.push({
                type: type || {server: column.ColumnSimpleType.toLowerCase()},
                name: column.Name,
                oldName: column.Name,
                IsPrimary: column.IsPrimary,
                IsIdentity: column.IsIdentity,
                IsComputed: column.IsComputed
            });
        });
        $(this).triggerHandler('newAttribute');
        $(this).triggerHandler('change');
    };

    this.toServerFormat = function() {
        var _this = this;
        var res = [];
        $.each(_attributes, function(i, attr) {
            var obj = _this.expressions.find(function (obj){return obj.name === attr.name});

            res.push({
                Name: attr.name,
                OldName: attr.oldName,
                ColumnSimpleType: capitaliseFirstLetter(attr.type.server),
                IsPrimary: attr.IsPrimary,
                IsIdentity: attr.IsIdentity,
                IsComputed: attr.IsComputed,
                expression: obj ? obj.expression : '"' + attr.name + '"'
            });
        });

        return res;
    };

    this.replaceString = function (string) {
        if (!string) return;
        _attributes.forEach(function (attr) {
            if (attr.name) {
                var re = new RegExp('\\"' + attr.name + '\\"',"g");

                if (!string.match(re)) {
                    string = string.replace(attr.name, '"' + attr.name + '"');
                }
            }
        });
        return string;
    };
};

nsGmx.ManualAttrModel.TYPES = {
    DOUBLE:   {user: 'Float',    server: 'float'},
    INTEGER:  {user: 'Integer',  server: 'integer'},
    STRING:   {user: 'String',   server: 'string'},
    TIME:     {user: 'Time',     server: 'time'},
    DATE:     {user: 'Date',     server: 'date'},
    DATETIME: {user: 'DateTime', server: 'datetime'},
    BOOL:     {user: 'Boolean',  server: 'boolean'}
};

})();
