(function()
{
    _translationsHash.addtext("rus", {
							"clusterControl.applyClusters" : "Кластеризовать"
						 });
						 
    _translationsHash.addtext("eng", {
							"clusterControl.applyClusters" : "Apply clustering"
						 });
                         
    var ClusterParamsControl = function(container)
    {
        $(container).append($('<input/>', {type: 'checkbox'})).append($('<span/>').text(_gtxt("clusterControl.applyClusters")));
        
    }
    
    nsGmx.ClusterParamsControl = ClusterParamsControl;
})();