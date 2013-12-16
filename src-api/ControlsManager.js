/** Управление наборами контролов карты

Позволяет устанавливать пользовательские наборы контролов карты. 

Набор контролов - список контролов карты.

@global

*/
(function()
{
    "use strict";
	var ControlsManager = {
        isVisible: true
        ,currentID: null
        ,currentControls: {}
        ,controls: []
        ,parentNode: null
        ,allToolsNode: null
        ,toolsAll: null
        ,
        init: function(parent, map) {
			if(parent) this.parentNode = parent;
            
            var allToolsNode = this.allToolsNode = gmxAPI._allToolsDIV = gmxAPI.newStyledDiv({
                position: "absolute"
                ,top: '0px'
                ,left: 0
                ,height: '1px'
                ,width: '100%'
                // ,marginLeft: '15px'
                // ,marginTop: '15px'
            });
            this.parentNode.appendChild(allToolsNode);
            
            gmxAPI.extend(map, {
                allControls: {
                    div: allToolsNode
                },
                isToolsMinimized: function() {
                    return !ControlsManager.isVisible;
                },
                minimizeTools: function() {
                    ControlsManager.setVisible();
                },
                maximizeTools: function() {
                    ControlsManager.setVisible(true);
                }
            });

            // if('_ToolsAll' in gmxAPI) {
                // this.toolsAll = map.toolsAll = new gmxAPI._ToolsAll(parent);
            // }
            if(gmxAPI._controls) {
                for (var i = 0, len = gmxAPI._controls.length; i < len; i++) {
                    this.addControls(gmxAPI._controls[i]);
                }
            }
        }
        ,setCurrent: function(id) {
			this.currentID = (this.controls[id] ? id : (this.controls.length ? this.controls[0].id : null));
            if(this.currentID) this.controls[this.currentID].init(this.allToolsNode);
        }
        ,getCurrent: function() {
            return (this.currentID ? this.controls[this.currentID] : null);
        }
        ,
        select: function(controlObj) {
			if(this.curent && 'remove' in this.curent) this.curent.remove();
			this.curent = controlObj;
            if('init' in controlObj) controlObj.init();
        }
        ,
        addControls: function(controlObj, selectFlag) {
			if(selectFlag) this.select(controlObj);
			if(this.currentID === controlObj.id) controlObj.init();
            
            for (var i = 0, len = this.controls.length; i < len; i++) {
				if(controlObj === this.controls[i]) {
                    return;
                }
            }
            this.controls.push(controlObj);
            this.controls[controlObj.id] = controlObj;
        }
        ,
        removeById: function(id) {
            if(id && this.controls[id]) {
                this.remove(this.controls[id]);
            }
            for(var key in gmxAPI._tools) {
                var item = gmxAPI._tools[key];
                item.remove();
                delete gmxAPI._tools[key];
            }
            var tt = gmxAPI._tools;
        }
        ,
        remove: function(controlObj) {
            this.forEach(function(item, i) {
                if(controlObj === item) {
                    this.controls.splice(i, 1);
                    if(controlObj === this.curent) this.curent = null;
                    delete this.controls[controlObj.id];
                    if('remove' in controlObj) controlObj.remove();
                    return false;   // stop iteration
                }
            });
        }
        ,
        setVisible: function(flag) {
            if(!arguments.length) flag = !this.isVisible;
            this.forEach(function(item, i) {
                if(ControlsManager.currentID === item.id && 'setVisible' in item) item.setVisible(flag);
            });
            this.isVisible = flag;
            gmxAPI._listeners.dispatchEvent('onToolsMinimized', gmxAPI.map, !ControlsManager.isVisible);
        }
        ,
        forEach: function(callback) {
			for (var i = 0, len = this.controls.length; i < len; i++) {
				if(callback.call(this, this.controls[i], i) === false) return;
            }
        }
        ,
        addGroupTool: function(pt) {
            return gmxAPI.IconsControl.addGroupTool(pt);
        }
	}
    /**
     * Описание класса Controls.
     * @typedef {Object} Controls
     * @property {String} id - Идентификатор типа контролов.
     * @property {Function} init - Ф-ция для инициализации.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {Array} [Control] items - Массив контролов данного типа контролов.
     * @property {Function} [boolean=] setVisible - Установка видимости(по умолчанию false).
     * @property {Function} remove - Удаление набора контролов.
    */
    /**
     * Менеджер типов контролов.
     * @constructor Controls
     * @param {Object} map - карта.
     * @param {Object=} div - нода для размещения контролов.
     */
	gmxAPI.ControlsManager = function(map, div) {
        ControlsManager.init(div || gmxAPI._div, map);
        return {
            /** Добавить новый тип контролов
            * @memberOf Controls#
            * @param {...Controls} Набор контролов {@link Controls}.
            */
            add: function(controls) {
                ControlsManager.addControls(controls);
            }
            ,remove: function(id) {
                ControlsManager.removeById(id);
            }
            ,
            /** Получить идентификатор текущего типа контролов
            * @memberof Controls#
            */
            getCurrentID: function() {
                return ControlsManager.currentID;
            }
            ,
            /** Получить текущий набор контролов
            * @memberof Controls#
            */
            getCurrent: function() {
                return ControlsManager.getCurrent() || null;
            }
            ,setCurrent: function(id) {
                return ControlsManager.setCurrent(id);
            }
            ,setVisible: function(flag) {
                ControlsManager.setVisible(flag);
            }
            ,toggleVisible: function() {
                ControlsManager.setVisible(!ControlsManager.isVisible);
            }
            ,addGroupTool: function(hash) {
                return ControlsManager.addGroupTool(hash);
            }
            ,getControl: function(id) {
                var controls = ControlsManager.getCurrent();
                return (controls && 'getControl' in controls ? controls.getControl(id) : null);
            }
            ,initControls: function(id) {
                var controls = ControlsManager.getCurrent();
                if(controls && 'initControls' in controls) {
                   ControlsManager.currentControls = controls.initControls();
                   return true;
                }
                return false;
            }
        }
    };
})();
