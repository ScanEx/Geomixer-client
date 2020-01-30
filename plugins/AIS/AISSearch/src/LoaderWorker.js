onmessage = function(e) {

    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === 4) {
            var response = JSON.parse(httpRequest.responseText),
            result = response.Result,
            status = response.Status;
            if (status && status.toLowerCase()=='ok'){
                let data = { mmsi: e.data.mmsi, imo:e.data.imo, positions: [], count: 0 },
                fields = result.fields;
                result.values.forEach(c => {
                    let obj = {};
                    for (var j = 0; j < fields.length; ++j) {
                        obj[fields[j]] = c[j];
                        if (fields[j]=='longitude')
                            obj.xmax = c[j];
                        if (fields[j]=='latitude')
                            obj.ymax = c[j];
                    }
                    data.positions.push(obj);
                    data.count = data.count + 1;
                });
                postMessage(data);
            }
            else
                throw new Error(httpRequest.responseText)
        }
    }
//console.log(e.data)
    httpRequest.withCredentials = true;
    httpRequest.open("GET", e.data.url);
    httpRequest.send();


}