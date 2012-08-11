var gmxCore = function() 
{
    var _callbacks = [];
    var _modules = {};
    var _globalNamespace = this;
	var _modulesDefaultHost = "";
	var _modulePathes = {/*#buildinclude<modules_path.txt>*/};
	var _moduleFiles = {/*#buildinclude<module_files.txt>*/};
    
    var getScriptURL = function(scriptName)
	{
		var scripts1 = document.getElementsByTagName("script");
		for (var i = 0; i < scripts1.length; i++)
		{
			var src = scripts1[i].getAttribute("src");
			if (src && (src.indexOf(scriptName) != -1))
				return src;
		}
		return false;
	}
	var getScriptBase = function(scriptName)
	{
		var url = getScriptURL(scriptName);
		return url ? url.substring(0, url.indexOf(scriptName)) : "";
	}
    
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
                
                //first delete, then callback!
                _callbacks.splice(k, 1);
                k = k - 1;
                curCallback.apply(null, modules);
            }
        }
    }
    
    var lazyLoadLABjs = function(callback)
    {
        if ('$LAB' in window) {
            callback();
            return;
        }
        
        //load LAB.js (snippest from its website)
        (function(g,b,d){var c=b.head||b.getElementsByTagName("head"),D="readyState",E="onreadystatechange",F="DOMContentLoaded",G="addEventListener",H=setTimeout;
        H(function(){if("item"in c){if(!c[0]){H(arguments.callee,25);return}c=c[0]}var a=b.createElement("script"),e=false;a.onload=a[E]=function(){if((a[D]&&a[D]!=="complete"&&a[D]!=="loaded")||e){return false}a.onload=a[E]=null;e=true;callback()};

        a.src = ( getScriptBase('gmxcore.js') || window.gmxJSHost || "" ) + 'LAB.min.js';

        c.insertBefore(a,c.firstChild)},0);if(b[D]==null&&b[G]){b[D]="loading";b[G](F,d=function(){b.removeEventListener(F,d,false);b[D]="complete"},false)}})(this,document);
    }
    
    var cssLoader = null;
    
    //public methods
    return {
        //Add module directly
        //addModule( moduleName, moduleObj, options? )
        // * moduleName - {String} nonempty
        // * moduleObj - {Object} object, which represents module.
        // * options - {Object}. Following options are possible:
        //    * require - {Array of string}. What modules should be loaded before this one
        //    * init - {Function} function to initialize module. Signature: function moduleInit(moduleObj, modulePath). If return jQuery Deferred, loader will wait its resolving
        //    * css - {Array || String} css files to load for module. css path is relative to module's path
        addModule: function(moduleName, moduleObj, options)
        {
            var requiredModules = (options && 'require' in options) ? options.require : [];
            var initDeferred = null;
            var _this = this;
            
            for (var r = 0; r < requiredModules.length; r++)
                this.loadModule( requiredModules[r] );
                
            this.addModulesCallback( requiredModules, function()
            {
                if (typeof moduleObj === 'function')
                        moduleObj = moduleObj( _modulePathes[moduleName] );
                        
                if (options && 'init' in options)
				{
                    initDeferred = options.init(moduleObj, _modulePathes[moduleName]);
				}
                
                if (options && 'css' in options)
				{
                    var cssFiles = typeof options.css === 'string' ? [options.css] : options.css;
                    var path = _modulePathes[moduleName] || window.gmxJSHost || "";
                    
                    for (var iF = 0; iF < cssFiles.length; iF++)
                        _this.loadCSS(path + cssFiles[iF]);
				}
                
                _modules[moduleName] = moduleObj;
                
                if (initDeferred)
                    initDeferred.done(invokeCallbacks);
                else
                    invokeCallbacks();
            });
        },
        //Load module from file. If not defined moduleSource, filename is constructed as (defaultHost + moduleName + '.js')
        loadModule: function(moduleName, moduleSource, callback)
        {
            callback && this.addModulesCallback([moduleName], callback);
            
            if ( ! (moduleName in _modules) )
            {
                var headElem = document.getElementsByTagName("head")[0];
                var newScript = document.createElement('script');
                
                
                var path;
                if (typeof moduleSource != 'undefined')
                {
                    path = moduleSource.match(/^http:\/\//i) ? moduleSource : (window.gmxJSHost || "") + moduleSource;
                }
                else
                {
                    path = (moduleName in _moduleFiles) ? _moduleFiles[moduleName] : (_modulesDefaultHost || window.gmxJSHost || "") + moduleName + '.js';
                }

                var pathRegexp = /(.*)\/[^\/]+/;
                if ( typeof _modulePathes[moduleName] === 'undefined' )
                    _modulePathes[moduleName] = pathRegexp.test(path) ? path.match(pathRegexp)[1] + "/" : "";
				
                newScript.type = 'text/javascript';
                newScript.src = path + (window.gmxDropBrowserCache ? "?" + Math.random() : "");
                newScript.charset = "utf-8";
                headElem.appendChild(newScript);
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
		},
        // Returns function, which will do the following:
        //   - If module "moduleName" is not loaded, load it. 
        //   - Than just call function "functionName" from it, passing all the arguments into that function.
        // Returned from the function values are passed to optional callback "callback".
        createDeferredFunction: function(moduleName, functionName, callback)
        {
            var _this = this;
            return function()
            {
                var args = arguments;
                _this.loadModule(moduleName);
                _this.addModulesCallback([moduleName], function(module)
                {
                    var res = module[functionName].apply(this, args);
                    callback && callback(res);
                });
            }
        },
        
        //Checks several requirements and loads js and css files.
        //"filesInfo" is array of objects with the following properties:
        //  - check: function() -> Bool. If return value is true, no js and css loading will be performed
        //  - script: String. Optional. Script to load if check fails
        //  - css: String. Optional. CSS file to load if check fails
        // Return jQuery Deferred, that will be resolved when all the scripts will be loaded (css loading is not checked)
        loadScriptWithCheck: function(filesInfo)
        {
            var _this = this;
            var localFilesInfo = filesInfo.slice(0);
            var def = $.Deferred();
            
            var doLoad = function(info)
            {
                if (localFilesInfo.length > 0)
                {
                    var curInfo = localFilesInfo.shift();
                    if (curInfo.check())
                        doLoad()
                    else
                    {
                        curInfo.css && _this.loadCSS(curInfo.css);
                        
                        if (curInfo.script)
                            _this.loadScript(curInfo.script).then(doLoad);
                        else
                            doLoad();
                    }
                }
                else
                    def.resolve();
            }
            
            doLoad();
            return def.promise();
        },
        
        //Single script is loaded.
        //Params: 
        //  - fileName: String. Scripts filename.
        //  - callback: function. Optional. Will be called when script is loaded.
        //  - Returns jQuery deferred
        loadScript: function(fileName, callback)
        {
            var def = $.Deferred();
            lazyLoadLABjs(function()
            {
                $LAB.script(fileName).wait(function()
                {
                    def.resolve();
                    callback && callback();
                })
            })
            return def.promise();
        }, 
        
        
        //Single css file is loaded.
        //Params: 
        //  - cssFilename: String. CSS filename.
        loadCSS: function(cssFilename)
        {
            var doLoadCss = function()
            {
                $.getCSS(cssFilename);
            }
            
            if ('getCSS' in $)
            {
                doLoadCss()
            }
            else
            {
                if (!cssLoader)
                {
                    var path = getScriptBase('gmxcore.js') || window.gmxJSHost || "";
                    cssLoader = $.getScript(path + "jquery/jquery.getCSS.js");
                }
                
                cssLoader.done(doLoadCss);
            }
        }
    }
}();