
module.exports = function (sorce) {
    let _data = null;    
    return {
        isDirty: true,
        get data() { return _data; },
        load: function (actualUpdate) {
            let promise = (FormData.prototype.set) ?
            fetch(sorce) :
            new Promise((resolve, reject)=>{
                throw new Error("IE!!!!");
            })

            return promise.then(response=>{
                return response.json()
            })
            .catch(error=>{
                console.log(error);                
            }); 
        },
        update: function () {
            if (this.isDirty) {
                this.view.inProgress(true);
                this.load()
                    .then((response => {
                        if (response.Status && response.Status == "ok") {
                            _data = {
                                years: response.Result.reduce((acc, cv) => {
                                    if (!acc.length || cv.year != acc[acc.length - 1].year)
                                        acc.push({ year: cv.year, prips: [cv] })
                                    else
                                        acc[acc.length - 1].prips.push(cv)
                                    return acc;
                                }, [])
                            }
                        }
                        else
                            console.log(response);
                        this.view.inProgress(false);
                        this.view.repaint();
                        this.isDirty = false;
                    }).bind(this))
                    .catch((ex=>{
                        console.log(ex)
                        this.view.inProgress(false);
                    }).bind(this));
            }
        }
    }
}