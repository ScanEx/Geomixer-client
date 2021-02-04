//const Request = require('../Request');

//////////////////////////


module.exports = function (options) {

    const _lmap = nsGmx.leafletMap, _data = {system:'', interval:{}, polygon:{}};
  
    return {
        isDirty: true,
        get data() { return _data },
        set data(value) { _data = value; },
        update: function () {
console.log('IMC UPDATE', this.isDirty)
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