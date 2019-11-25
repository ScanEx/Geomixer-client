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
        return _sendRequest(url);
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