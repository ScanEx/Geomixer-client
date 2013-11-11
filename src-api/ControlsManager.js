// Управление контролами
//  Используемые методы и свойства контролов:
//      init    - метод инициализации
//      remove  - метод удаления
(function()
{
    "use strict";
	var ControlsManager = {
        'current': null
        ,'isVisible': true
        ,'currentID': null
        ,'controls': []
        ,'parentNode': null
        ,'allToolsNode': null
        ,
        'init': function(currentID, parent, map) {
			if(currentID) this.currentID = currentID;
			if(parent) this.parentNode = parent;
            
            var allToolsNode = this.allToolsNode = gmxAPI._allToolsDIV = gmxAPI.newStyledDiv({
                position: "absolute"
                ,top: '0px'
                ,left: 0
                ,height: '1px'
                ,width: '100%'
                ,marginLeft: '1px'
            });
            this.parentNode.appendChild(allToolsNode);
            map.allControls = {
                div: allToolsNode
            };

            if('_ToolsAll' in gmxAPI) {
                map.toolsAll = new gmxAPI._ToolsAll(parent);
            }

            this.forEach(function(item, i) {
                if(currentID === item.id && 'init' in item) {
                    item.init(allToolsNode);
                    return false;   // stop iteration
                }
            });
        }
        ,
        'select': function(controlObj) {
			if(this.curent && 'remove' in this.curent) this.curent.remove();
			this.curent = controlObj;
            if('init' in controlObj) controlObj.init();
        }
        ,
        'addControl': function(controlObj, selectFlag) {
			if(selectFlag) this.select(controlObj);
			if(this.currentID === controlObj.id) controlObj.init();
            
            for (var i = 0, len = this.controls.length; i < len; i++) {
				if(controlObj === this.controls[i]) {
                    return;
                }
            }
            this.controls.push(controlObj);
        }
        ,
        'remove': function(controlObj) {
            if(controlObj === this.curent) {
                if('remove' in controlObj) controlObj.remove();
                this.curent = null;
            }
            this.forEach(function(item, i) {
                if(controlObj === item) {
                    this.controls.splice(i, 1);
                    return false;   // stop iteration
                }
            });
        }
        ,
        'setVisible': function(flag) {
            if(!arguments.length) flag = !this.isVisible;
            this.forEach(function(item, i) {
                if(ControlsManager.currentID === item.id && 'setVisible' in item) item.setVisible(flag);
            });
            this.isVisible = flag;
        }
        ,
        'forEach': function(callback) {
			for (var i = 0, len = this.controls.length; i < len; i++) {
				if(callback(this.controls[i], i) === false) return;
            }
        }
        ,
        'addGroupTool': function(pt) {
            return gmxAPI.IconsControl.addGroupTool(pt);
        }
	}
	gmxAPI.ControlsManager = ControlsManager;

})();
