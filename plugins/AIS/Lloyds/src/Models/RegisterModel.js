let _actualUpdate;
module.exports = function (searcher) {
    let returnInstance = {
        data:{vessels:[]},
        isDirty: false,
        loadMeta : ()=>beforeLoad,
        tasks: [],
        load: function () {
            let inst = this;
            return beforeLoad.then(res => {
                return Promise.all(inst.tasks)
                .then(r=>Promise.all(r.map(z=>z.json())))
                .then(r=>{
                    let rr=[]
                    r.forEach((v, i)=>{
                        rr.push({RS:parseInt(v.RS, 10), version:v.version}) 
                        v.data.forEach(ds=>ds.properties.forEach(p=>{rr[i][p.name]=p.value}))
                    })
                    inst.data.vessels = inst.data.vessels.concat(rr);
//console.log(inst.data.vessels)
                }) 
            })
        },
        update: function () {
            if (!this.isDirty){   
                let inst = this;   
                setTimeout(function wait() {
                    if (inst.view.repaint()){
                        console.log("wait")
                        setTimeout(wait, 10);
                    }
                  }, 10);
                return;
            }
            _actualUpdate = new Date().getTime();
            let inst = this,
                actualUpdate = _actualUpdate;
            this.view.inProgress(true);
            this.load().then(function (res) {
                if (_actualUpdate == actualUpdate) {
                    inst.isDirty = false;
                    inst.view.inProgress(false);            
                    inst.view.repaint();
                }
            }, function (json) {
                inst.data = null;
                //console.log(json)
                if ((json.Status && json.Status.toLowerCase() == "auth") ||
                    (json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) { return r.Status.toLowerCase() == "auth" })))
                    inst.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], vessels: [] };
                else {
                    //inst.data = {msg:[{txt:"!!!"}], vessels:[]};
                    console.log(json);
                }
                inst.view.inProgress(false);
                inst.view.repaint();
            });
        }
    },
    beforeLoad = new Promise((resolve, reject) => {
        let columnsJson = JSON.parse(localStorage.getItem("lloyds_columns"));
//columnsJson && console.log((new Date().getTime()-columnsJson.timestamp)/60000)
        //if (!columnsJson || ((new Date().getTime()-columnsJson.timestamp)/60000>24*60))
            fetch("http://kosmosnimki.ru/demo/lloyds/api/v1/Ship/Meta")
            .then(r=>r.json())
            .then(r=>{   
                let checked = [], convert = a=>a.map(p=>{return {id:p.id, name: p.name1, trans: p.name3, caption: p.name2, nodes:null, checked: checked.indexOf(p.id)!=-1};})
                if (columnsJson){
                    columnsJson.nodes.forEach((e0, i0)=>{e0.nodes.forEach((e1, i1)=>{e1.nodes.forEach((e2, i2)=>{if (e2.checked) checked.push(e2.id)})})})
                    // checked = [columnsJson.a, columnsJson.b, columnsJson.c]
                    // console.log(checked)
                }
                returnInstance.data.columnsTs = new Date().getTime();
                returnInstance.data.columns = [
                    {name: "general", caption: "Основные сведения", nodes:[
                        {name: "identification", caption: r[0].name, nodes:convert(r[0].attributes)},
                        {name: "type", caption: r[1].name, nodes:convert(r[1].attributes)},
                        {name: "safety", caption: r[4].name, nodes:convert(r[4].attributes)},
                        {name: "codes", caption: r[15].name, nodes:convert(r[15].attributes)},
                    ]},
                    {name: "subjects", caption: "Организации", nodes:[
                        {name: "owners", caption: r[2].name, nodes:convert(r[2].attributes)},
                        {name: "builders", caption: r[3].name, nodes:convert(r[3].attributes)}
                    ]},
                    {name: "history", caption: "Постройка и эксплуатация", nodes:[
                        {name: "history", caption: r[5].name, nodes:convert(r[5].attributes)},

                    ]},
                    {name: "techical_data", caption: "Технические данные", nodes:[
                        {name: "features", caption: r[6].name, nodes:convert(r[6].attributes)},
                        {name: "dimensions", caption: r[7].name, nodes:convert(r[7].attributes)},
                        {name: "hull", caption: r[8].name, nodes:convert(r[8].attributes)},
                        {name: "tanks", caption: r[9].name, nodes:convert(r[9].attributes)},
                        {name: "fuel", caption: r[12].name, nodes:convert(r[12].attributes)}
                    ]},
                    {name: "equipment", caption: "Оборудование", nodes:[
                        {name: "cargo_structures", caption: r[10].name, nodes:convert(r[10].attributes)},
                        {name: "engines", caption: r[11].name, nodes:convert(r[11].attributes)},
                        {name: "energy_facilities", caption: r[13].name, nodes:convert(r[13].attributes)},
                        {name: "thrusters", caption: r[14].name, nodes:convert(r[14].attributes)}
                    ]},
                ];
                if (columnsJson){
                    returnInstance.data.columns.forEach(c=>{
                        c.nodes.forEach(n=>{
                            n.checked = n.nodes.every(nn=>nn.checked)
                        });
                        c.checked = c.nodes.every(n=>n.checked);
                    })
                }
                else{                   
                    returnInstance.data.columns[0].nodes[0].nodes.forEach(n=>n.checked=true)
                    returnInstance.data.columns[0].nodes[0].checked = true;                 
                    returnInstance.data.columns[0].nodes[1].nodes.forEach(n=>n.checked=true)
                    returnInstance.data.columns[0].nodes[1].checked = true;
                }
                resolve();
            })
            .catch(e=>{console.log(e); reject(e)})
        // else{           
        //     returnInstance.data.columnsTs = columnsJson.timestamp; 
        //     returnInstance.data.columns = columnsJson.nodes;            
        //     resolve();
        // }
    });
    return returnInstance;
}