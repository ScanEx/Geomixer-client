(function(){

var tasks = {};
var tasksByName = {};

var UPDATE_INTERVAL = 2000;

var AsyncTask = function(serverResponse)
{
    var status = 'processing';
    var serverResult = null;
    var taskID = null;
    var _this = this;
    
    this.deferred = $.Deferred();
    
    this.getCurrentStatus = function()
    {
        return status;
    }
    
    this.getCurrentResult = function()
    {
        return serverResult;
    }
    
    var processServerInfo = function(taskInfo)
    {
        serverResult = taskInfo;
        if (taskInfo.ErrorInfo)
        {
            status = 'error';
            clearInterval(interval);
            _this.deferred.reject(taskInfo);
        }
        else if (taskInfo.Completed)
        {
            status = 'completed';
            clearInterval(interval);
            _this.deferred.resolve(taskInfo);
        }
        else
        {
            status = 'processing';
            $(_this).triggerHandler('update', taskInfo);
        }
    }
    
    processServerInfo(serverResponse);
    
    var interval = null;
    if (status == 'processing')
    {
        interval = setInterval(function()
        {
            taskID = serverResponse.TaskID;
            sendCrossDomainJSONRequest(serverBase + "AsyncTask.ashx?WrapStyle=func&TaskID=" + taskID, function(response)
            {
                if (!parseResponse(response))
                    return;
                
                processServerInfo(response.Result);
            });
        }, UPDATE_INTERVAL);
    }
}

nsGmx.asyncTaskManager = {
    addTask: function(serverResponse, name)
    {
        var newTask = new AsyncTask(serverResponse);
        tasks[serverResponse.TaskID] = newTask;
        if (name) tasksByName[name] = newTask;
        
        return newTask;
    },
    getTaskByName: function(taskID)
    {
        return tasksByName[taskID];
    }
}

})()