!(function() {

/** Провайдер данных для {@link nsGmx.ScrollTable}. Получает данные от сервера в формате ГеоМиксера
* @alias nsGmx.AttrTable.ServerDataProvider
* @class
* @extends nsGmx.ScrollTable.IDataProvider
*/
var ServerDataProvider = function(params)
{
    var _params = $.extend({
            defaultSortParam: 'ogc_fid',
            titleToParams: {}
        }, params);
    var _countURL = null,
        _dataURL = null,
        _countParams = null,
        _dataParams = null;

    var _lastCountResult;

    //IDataProvider interface
    this.getCount = function(callback)
    {
        if (!_countURL)
        {
            callback();
            return;
        }

        sendCrossDomainPostRequest(_countURL, _countParams, function(response)
        {
            if (!window.parseResponse(response))
            {
                callback();
                return;
            }
            _lastCountResult = response.Result;
            callback(response.Result);
        });
    };

    this.getItems = function(page, pageSize, sortParam, sortDec, callback)
    {
        if (!_dataURL)
        {
            callback();
            return;
        }

        var explicitSortParam = (sortParam || sortParam === '') ? (_params.titleToParams[sortParam] || sortParam) : _params.defaultSortParam;

        var params = $.extend({
            page: page,
            pagesize: pageSize,
            orderby: explicitSortParam,
            orderdirection: sortDec ? 'DESC' : 'ASC'
        }, _dataParams);

        sendCrossDomainPostRequest(_dataURL, params, function(response)
        {
            if (!window.parseResponse(response))
            {
                callback();
                return;
            }

            var fieldsSet = {};

            if (response.Result.fields)
            {
                for (var f = 0; f < response.Result.fields.length; f++) {
                    fieldsSet[response.Result.fields[f]] = {index: f, type: response.Result.types[f]};
				}
            }

            var res = [];
            for (var i = 0; i < response.Result.values.length; i++) {
                res.push({
                    fields: fieldsSet,
                    values: response.Result.values[i]
                });
			}

            callback(res);
        });
    };

    /** Задать endpoint для получения от сервера данных об объекта и их количестве
     * @param {String} countURL URL скрипта для запроса общего количества объектов
     * @param {Object} countParams Параметры запроса для количеством объектов
     * @param {String} dataURL URL скрипта для запроса самих объектов
     * @param {Object} dataParams Параметры запроса самих объектов. К этим параметрам будут добавлены параметры для текущей страницы в формате запросов ГеоМиксера
    */
    this.setRequests = function(countURL, countParams, dataURL, dataParams)
    {
        _countURL = countURL;
        _countParams = countParams || {};
        _countParams.WrapStyle = 'message';

        _dataURL = dataURL;
        _dataParams = dataParams || {};
        _dataParams.WrapStyle = 'message';

        $(this).change();
    };

    this.serverChanged = function()
    {
        $(this).change();
    };

    this.getLastCountResult = function() {
        return _lastCountResult;
    };
};

window.nsGmx.AttrTable.ServerDataProvider = ServerDataProvider;

})();
