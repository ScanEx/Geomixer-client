const _serverBase = window.serverBase.replace(/^https?:/, document.location.protocol),
    _sendRequest = function(url, method){
    return new Promise((resolve, reject) => { 
        const callback = response => {
            if (!response.Status || response.Status.toLowerCase() != 'ok' || !response.Result) {
                reject(response);
            }
            else
                resolve(response.Result);
        };           
        if (!method || method == 'GET')
            sendCrossDomainJSONRequest(url, callback);
    });

    },
    _searchRequest = function(layer, params){
        let qs = '';
        for (let p in params) {
            if (qs != '')
            qs += '&';
        qs += p + '=' + (typeof params[p]=='object' ? JSON.stringify(params[p]) : params[p]);
        }
        if (qs != '')
        qs = '&' + qs;
        const url = `${_serverBase}VectorLayer/Search.ashx?layer=${layer.getGmxProperties().name}${qs}`;
        //`query="State"='active1'&columns=[{"Value":"[gmx_id]"},{"Value":"[Date]"},{"Value":"[DateChange]"},{"Value":"[Time]"},{"Value":"[TimeChange]"}]`;
        return _sendRequest(url);
    };
module.exports = {
    searchRequest : _searchRequest 
};