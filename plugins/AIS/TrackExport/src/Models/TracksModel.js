const Request = require('../../../Common/Request');

module.exports = function (options) {
    const _data = {tracks:[]};        
    const _layerName = options.layer;

    return {
        isDirty: false,
        get data() { return _data },
        set data(value) { _data = value; },
        update: function () {
            const thisModel = this;
            return Promise.resolve().then(()=>{
                if (thisModel.isDirty)
                {
                    thisModel.view.inProgress(true);                    
                    Request.searchRequest({
                        layer: thisModel.view.trackLayer.id,
                        orderdirection: 'desc',
                        orderby: thisModel.view.trackLayer.sort,
                        columns: thisModel.view.trackLayer.columns,
                        query: thisModel.view.trackLayer.query
                    }, 'POST').then(console.log);
                    // return new Promise(resolve=>{ // Load
                    //     setTimeout(()=>{
                    //         _data.msg = [{txt:'HELLO'}];
                    //         resolve();
                    //     }, 2000);
                    // }).catch(console.log);
                } // if (thisModel.isDirty)
            }).then(()=>{               
                    thisModel.view.repaint();
                    thisModel.isDirty = false;
            });

        } // this.update
    };
}