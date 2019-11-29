const Request = require('../../../Common/Request');

module.exports = function (options) {
    const _data = {regions:[]};        
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
                    return new Promise(resolve=>{ // Load
                        setTimeout(()=>{
                            _data.msg = [{txt:'HELLO'}];
                            resolve();
                        }, 2000);
                    }).catch(console.log);
                } // if (thisModel.isDirty)
            }).then(()=>{               
                    thisModel.view.repaint();
                    thisModel.isDirty = false;
            });

        } // this.update
    };
}