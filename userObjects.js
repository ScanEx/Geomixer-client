/** Менеджер дополнительных данных карты
 @class userObjects
 Данные собираются и используются набором сборщиков данных, каждый из которых имеет свой уникальных id.
*/
var userObjects = function()
{
	var _data = {};
    var _collectors = {};
    
    /**
     Устанавливает данные, которые потом могут быть использованы поставщиками данных
	 @method
    */
    this.setData = function(data)
    {
        _data = data;
    }
    
    /**
     Возвращает собранные данные
	 @method
    */
    this.getData = function()
    {
        return _data;
    }
    
	/**
	 Собирает данные со всех сборщиков данных. Собранные данные доступны через метод getData
	 @method
	*/
    this.collect = function()
    {
        _data = {};
        for (var id in _collectors)
            if ('collect' in _collectors[id])
            {
                var data = _collectors[id].collect()
                if (data !== null)
                    _data[id] = data;
            }
    }
    
    /**
	 Вызывает метод load() у всех поставщиков данных, для которых есть данные.
     После вызова метода данные для данного загрузчика будут удалены (чтобы предотвратить множественную загрузку)
	 @method
	*/
    this.load = function(dataCollectorNames)
    {
        var collectors = {};
        
        if (dataCollectorNames)
        {
            if (typeof dataCollectorNames === 'string')
                dataCollectorNames = [dataCollectorNames];

            for (var dc = 0; dc < dataCollectorNames.length; dc++)
            {
                var name = dataCollectorNames[dc];
                if (name in _collectors)
                    collectors[name] = _collectors[name];
            }
        }
        else
            collectors = _collectors;
        
        for (var id in collectors)
            if (id in _data && 'load' in collectors[id])
            {
                collectors[id].load(_data[id]);
                delete _data[id];
            }
    }
    
    /**
	 Добавляет новый сборщик данных. Если в момент добавления есть какие-нибудь данные для загрузчика, они будут ему сразу же переданы
	 @method
     @param collectorId {String} - уникальный идентификатор сборщика данных
     @param collector {Object} - сборщик данных. Должен иметь следующие методы:<br/>
         collect()->Object - возвращает собранные данные. Если данных нет, нужно вернуть null
         load(data)->void - передаёт существующие данные загрузчику
	*/
    this.addDataCollector = function( collectorId, collector )
    {
        _collectors[collectorId] = collector;
        if (collectorId in _data && 'load' in collector)
        {
            collector.load(_data[collectorId])
            delete _data[collectorId];
        }
    }
}

var _userObjects = new userObjects();