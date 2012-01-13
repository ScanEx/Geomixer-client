/** Менеджер дополнительных данных карты
 @class userObjects
 Данные собираются и используются набором сборщиков данных, каждый из которых имеет свой уникальных id.
*/
var userObjects = function()
{
	var _data = {};
    var _collectors = {};
    
    /**
	 @method
     Устанавливает данные, которые потом могут быть использованы поставщиками данных
    */
    this.setData = function(data)
    {
        _data = data;
    }
    
    /**
	 @method
     Возвращает собранные данные
    */
    this.getData = function()
    {
        return _data;
    }
    
	/**
	 @method
	 Собирает данные со всех сборщиков данных. Собранные данные доступны через метод getData
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
	 @method
	 Вызывает метод load() у всех поставщиков данных, для которых есть данные.
	*/
    this.load = function()
    {
        for (var id in _collectors)
            if (id in _data && 'load' in _collectors[id])
                _collectors[id].load(_data[id]);
    }
    
    /**
	 @method
	 Добавляет новый сборщик данных. Если в момент добавления есть какие-нибудь данные для загрузчика, они будут ему сразу же переданы
     @param collectorId {String} - уникальный идентификатор сборщика данных
     @param collector {Object} - сборщик данных. Должен иметь следующие методы:<br/>
         collect()->Object - возвращает собранные данные. Если данных нет, нужно вернуть null
         load(data)->void - передаёт существующие данные загрузчику
	*/
    this.addDataCollector = function( collectorId, collector )
    {
        _collectors[collectorId] = collector;
        if (collectorId in _data)
            collector.load()
    }
}

var _userObjects = new userObjects();