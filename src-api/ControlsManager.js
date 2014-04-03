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
        ,_controls: null
        ,currentID: null
        //,currentControls: {}
        //,controls: []
        ,parentNode: null
        ,allToolsNode: null
        ,toolsAll: null
        ,addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); }
        ,removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
        ,stateListeners: {}
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
/*                    ,
                    setVisible: function() {},
                    minimize: function() {},
                    maximize: function() {}
*/
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
        }
        ,initControls: function() {
            if(!this._controls) return false;
            this._controls.initControls();
            return true;
        }
        ,setCurrent: function(id) {
            if(this._controls) this._controls.remove();
			this._controls = gmxAPI._controls[id];
        }
        ,getCurrent: function() {
            return this._controls || null;
        }
        ,getControl: function(id) {
            if(!this._controls) return null;
            return ('getControl' in this._controls ? this._controls.getControl(id) : null);
        }
        ,
        select: function(controlObj) {
			if(this.curent && 'remove' in this.curent) this.curent.remove();
			this.curent = controlObj;
            if('init' in controlObj) controlObj.init();
        }
        ,
        setVisible: function(flag) {
            if(!arguments.length) flag = !this.isVisible;
            for (var key in ControlsManager._controls.controlsHash) {
                var control = ControlsManager._controls.controlsHash[key];
                if('setVisible' in control) control.setVisible(flag, chkOld);
            }
            this.isVisible = flag;
            gmxAPI._listeners.dispatchEvent('onToolsMinimized', gmxAPI.map, !ControlsManager.isVisible);
        }
        // ,
        // addControls: function(controlObj, selectFlag) {
			// if(selectFlag) this.select(controlObj);
			// if(this.currentID === controlObj.id) controlObj.init();
            
            // for (var i = 0, len = this.controls.length; i < len; i++) {
				// if(controlObj === this.controls[i]) {
                    // return;
                // }
            // }
            // this.controls.push(controlObj);
            // this.controls[controlObj.id] = controlObj;
        // }
        // ,
        // removeById: function(id) {
            // if(id && this.controls[id]) {
                // this.remove(this.controls[id]);
            // }
            // for(var key in gmxAPI._tools) {
                // var item = gmxAPI._tools[key];
                // item.remove();
                // delete gmxAPI._tools[key];
            // }
            // var tt = gmxAPI._tools;
        // }
        // ,
        // remove: function(controlObj) {
            // this.forEach(function(item, i) {
                // if(controlObj === item) {
                    // this.controls.splice(i, 1);
                    // if(controlObj === this.curent) this.curent = null;
                    // delete this.controls[controlObj.id];
                    // if('remove' in controlObj) controlObj.remove();
                    // return false;   // stop iteration
                // }
            // });
        // }
        // ,
        // forEach: function(callback) {
			// for (var i = 0, len = this.controls.length; i < len; i++) {
				// if(callback.call(this, this.controls[i], i) === false) return;
            // }
        // }
        ,
        addGroupTool: function(pt) {
            return gmxAPI.IconsControl.addGroupTool(pt);
        }
	}
    /**
     * Описание класса Controls.
     * @typedef {Object} Controls1
     * @ignore
     * @property {String} id - Идентификатор типа контролов.
     * @property {Function} init - Ф-ция для инициализации.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {Array} [Control] items - Массив контролов данного типа контролов.
     * @property {Function} [boolean=] setVisible - Установка видимости(по умолчанию false).
     * @property {Function} remove - Удаление набора контролов.
    */
    /**
     * Менеджер контролов.
     * @constructor ControlsManager
     * @ignore
     * @param {Object} map - карта.
     * @param {Object=} div - нода для размещения контролов.
     */
	gmxAPI.ControlsManager = function(map, div) {
        ControlsManager.init(div || gmxAPI._div, map);
        return {
            // add: function(controls) {
                // ControlsManager.addControls(controls);
            // }
            // ,
            remove: function(id) {
                ControlsManager.removeById(id);
            }
            ,
            /** Получить идентификатор текущего набора контролов
            * @memberof ControlsManager#
            * @returns {String|null} возвращает идентификатор текущего набора контролов или null если контролы не устанавлены.
            */
            getCurrentID: function() {
                return ControlsManager.currentID;
            }
            ,
            /** Получить текущий набор контролов
            * @memberof ControlsManager#
            * @returns {Controls|null} возвращает оъект текущего набора контролов или null если текущий набор контролов не устанавлен.
            */
            getCurrent: function() {
                return ControlsManager.getCurrent() || null;
            }
            /** Установить текущий набор контролов
            * @memberof ControlsManager#
            * @param {String} id идентификатор набора контролов.
            * @returns {Controls|null} возвращает оъект текущего набора контролов или null если текущий набор контролов не устанавлен.
            */
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
            ,initControls: function() {
                var controls = ControlsManager.getCurrent();
                if(controls && 'initControls' in controls) {
                   //ControlsManager.currentControls = 
                   controls.initControls();
                   return true;
                }
                return false;
            }
            ,addListener: ControlsManager.addListener
            ,removeListener: ControlsManager.removeListener
            ,stateListeners: ControlsManager.stateListeners
        }
    };
})();
