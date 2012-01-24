(function (global, oDOC, handler) {

    var waitArgs = null;
    window.createFlashMap = function() {
        waitArgs = [].slice.call(arguments);
    }

    function LABjsLoaded() {
        var filesToLoad = [/*#buildinclude<api_files.txt>*/];
        
        var LABInstance = $LAB;
		
		for (var f = 0; f < filesToLoad.length-1; f++)
			LABInstance = LABInstance.script({src: filesToLoad[f] + "?" + Math.random() }).wait();
			
		LABInstance.script({src: filesToLoad[filesToLoad.length-1] + "?" + Math.random()}).wait(function()
        {
            if (waitArgs)
            {
                window.createFlashMap.call(this, waitArgs);
            }
        });
    }
    
    //Загружаем LAB.js
    if (typeof $LAB === 'undefined')
    {
        var head = oDOC.head || oDOC.getElementsByTagName("head");
        // loading code borrowed directly from LABjs itself
        setTimeout(function () {
            if ("item" in head) { // check if ref is still a live node list
                if (!head[0]) { // append_to node not yet ready
                    setTimeout(arguments.callee, 25);
                    return;
                }
                head = head[0]; // reassign from live node list ref to pure node ref -- avoids nasty IE bug where changes to DOM invalidate live node lists
            }
            var scriptElem = oDOC.createElement("script"),
                scriptdone = false;
            scriptElem.onload = scriptElem.onreadystatechange = function () {
                if ((scriptElem.readyState && scriptElem.readyState !== "complete" && scriptElem.readyState !== "loaded") || scriptdone) {
                    return false;
                }
                scriptElem.onload = scriptElem.onreadystatechange = null;
                scriptdone = true;
                LABjsLoaded();
            };
            scriptElem.src = "LAB.min.js";
            head.insertBefore(scriptElem, head.firstChild);
        }, 0);

        // required: shim for FF <= 3.5 not having document.readyState
        if (oDOC.readyState == null && oDOC.addEventListener) {
            oDOC.readyState = "loading";
            oDOC.addEventListener("DOMContentLoaded", handler = function () {
                oDOC.removeEventListener("DOMContentLoaded", handler, false);
                oDOC.readyState = "complete";
            }, false);
        }
    }
    else
        LABjsLoaded();
        
})(window, document);