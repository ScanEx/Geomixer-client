const _serverBase = window.serverBase.replace(/^https?:/, document.location.protocol),
    _fetchRequest = function(url, request, method){
        if (url[0]=='/')
            url = _serverBase + url.replace(/^\//, '');
        if (method=='POST')
            return fetch(url, {                
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                method: 'POST', // *GET, POST, PUT, DELETE, etc.
                mode: 'cors', // no-cors, cors, *same-origin);
                body: encodeURI(request)
            });
    },
    _sendRequest = function(url, request, method){
        return new Promise((resolve, reject) => {
            const callback = response => {
                if (!response.Status || response.Status.toLowerCase() != 'ok' || !response.Result) {
                    reject(response);
                }
                else
                    resolve(response.Result);
            };
            if (url[0]=='/')
                url = _serverBase + url.replace(/^\//, '');
            if (!method || method == 'GET')
                window.sendCrossDomainJSONRequest(url, callback);
            if (method == 'POST')
                window.sendCrossDomainPostRequest(url, request, callback);
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
    fetchRequest: _fetchRequest,
    sendRequest: _sendRequest,
    searchRequest : _searchRequest, 
    modifyRequest: _modifyRequest,
    checkVersion: _checkVersion
};