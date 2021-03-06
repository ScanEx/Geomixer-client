const _serverBase = window.serverBase.replace(/^https?:/, document.location.protocol),
    _sendRequest = function(url, method, params){
        return new Promise((resolve, reject) => {
            const callback = function(response) {
                if (!response.Status || response.Status.toLowerCase() != 'ok' || !response.Result) {
                    reject(response);
                }
                else
                    resolve(response.Result);
            };
            if (!method || method == 'GET')
                sendCrossDomainJSONRequest(url, callback);
            if (method == 'POST') {
                params.WrapStyle='message';
                sendCrossDomainPostRequest(url, params, callback);
            }
        });
    },
    _getQueryString = function(params){
        let qs = '';
        for (let p in params) {
            if (qs != '')
            qs += '&';
        qs += p + '=' + (typeof params[p]=='object' ? JSON.stringify(params[p]) : params[p]);
        }
        return qs;
    }
    _searchRequest = function(params){
        const url = `${_serverBase}VectorLayer/Search.ashx?${_getQueryString(params)}`;
        return _sendRequest(url);
    },
    _modifyRequest = function(params){
        const url = `${_serverBase}VectorLayer/ModifyVectorObjects.ashx?${_getQueryString(params)}`;
        return _sendRequest(url, "POST", params);
    },
    _checkVersion = function(layer, ms){
        setTimeout(()=>{
            L.gmx.layersVersion.chkVersion(layer);
//console.log('ChV')                   
            setTimeout(()=>{
                L.gmx.layersVersion.chkVersion(layer);
//console.log('ChV')                   
                setTimeout(()=>{
                    L.gmx.layersVersion.chkVersion(layer); 
//console.log('ChV')                   
                }, ms);
            }, ms);                                            
        }, ms);
    };
module.exports = {
    searchRequest : _searchRequest, 
    modifyRequest: _modifyRequest,
    checkVersion: _checkVersion
};