//const Request = require('../Request');

//////////////////////////


module.exports = function (options) {

    const _lmap = nsGmx.leafletMap, _data = {system:'', interval:null, polygon:null};
  
    return {
        isDirty: true,
        get data() { return _data },
        set data(value) { _data = value; },
        update: function () {
console.log('IMC UPDATE', _data, this.isDirty)
            if (!this.isDirty)
                return;

            const thisModel = this;
            return Promise.resolve().then(()=>{
                thisModel.view.repaint();  
                thisModel.isDirty = false;
            });

        } // this.update
    };
}