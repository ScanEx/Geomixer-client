var gmxCore = function() 
{
    var _callbacks = [];
    var _modules = {};
    var _globalNamespace = this;
	var _modulesDefaultHost = "";
	var _modulePathes = {/*#buildinclude<modules_path.txt>*/};
    
    var invokeCallbacks = function()
    {
        for (var k = 0; k < _callbacks.length; k++)
        {
            var isAllModules = true;
            var curModules = _callbacks[k].modules;
			var modules = [];
            for (var m = 0; m < curModules.length; m++)
			{
                if ( !(curModules[m] in _modules) )
                {
                    isAllModules = false;
                    break;
                }
				modules.push(_modules[curModules[m]]);
			}
                
            if (isAllModules)
            {
                var curCallback = _callbacks[k].callback;
                
                //first delete, than callback!
                _callbacks.splice(k, 1);
                k = k - 1;
                curCallback.apply(null, modules);
            }
        }
    }
    
    //public methods
    return {
        //Add module directly
        //addModule( moduleName, moduleObj, options? )
        // * moduleName - {String} nonempty
        // * moduleObj - {Object} object, which represents module.
        // * options - {Object}. Following options are possible:
        //    * require - {Array of string}. What modules should be loaded before this one
        //    * init - {Function} function to initialize module. Signature: function moduleInit(moduleObj, modulePath)
        addModule: function(moduleName, moduleObj, options)
        {
            var requiredModules = (options && 'require' in options) ? options.require : [];
            
            for (var r = 0; r < requiredModules.length; r++)
                this.loadModule( requiredModules[r] );
                
            this.addModulesCallback( requiredModules, function()
            {
                if (options && 'init' in options)
				{
                    if (typeof moduleObj === 'function')
                        moduleObj = moduleObj( _modulePathes[moduleName] );
                    options.init(moduleObj, _modulePathes[moduleName]);
				}
                
                _modules[moduleName] = moduleObj;
                invokeCallbacks();
            });
        },
        //Load module from file. If not defined moduleSource, filename is constructed as (moduleName + '.js')
        loadModule: function(moduleName, moduleSource)
        {
            if ( ! (moduleName in _modules) )
            {
                var headElem = document.getElementsByTagName("head")[0];
                var newScript = document.createElement('script');
				var path = (typeof moduleSource != 'undefined') ? moduleSource : _modulesDefaultHost + moduleName + '.js';
				
                newScript.type = 'text/javascript';
                newScript.src = path + (window.gmxDropBrowserCache ? "?" + Math.random() : "");
                newScript.charset = "utf-8";
                headElem.appendChild(newScript);
				
				var pathRegexp = /(.*)\/[^\/]+/;
                
                if ( typeof _modulePathes[moduleName] === 'undefined' )
                    _modulePathes[moduleName] = pathRegexp.test(path) ? path.match(pathRegexp)[1] + "/" : "";
            }
        },
		
		loadModules: function(moduleNames, callback)
		{
			this.addModulesCallback(moduleNames, callback);
			for (var m = 0; m < moduleNames.length ; m++)
				this.loadModule(moduleNames[m]);
		},
        
        //Add callback, which will be called when all the modules are loaded. 
        //If modules are already loaded or moduleNames is empty string, callback will be executed immediately
        // * moduleNames - {Array of Strings} names of modules, that should be loaded to execute callback.
        // * callback - {Function} callback to execute
        addModulesCallback: function( moduleNames, callback )
        {
            _callbacks.push({modules: moduleNames, callback: callback});
            invokeCallbacks();
        },
        
        //Get module object. Returns null if module is not loaded
        getModule: function(moduleName)
        {
            return moduleName in _modules ? _modules[moduleName] :  null;
        },
		
		setDefaultModulesHost: function( defaultHost )
		{
			_modulesDefaultHost = defaultHost;
		},
		
        pushModule2GlobalNamespace: function(moduleName)
        {
            if ( ! (moduleName in _modules) ) return;
            var module = _modules[moduleName];
            
            for (var p in module)
                _globalNamespace[p] = module[p];
        },
		
		getModulePath: function(moduleName)
		{
			return _modulePathes[moduleName];
		}
    }
}();