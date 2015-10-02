/** Менеджер дополнительных данных карты. Данные собираются и используются набором сборщиков данных, каждый из которых имеет свой уникальный id.
 @class userObjectsManager
 @memberOf nsGmx 
*/
nsGmx.userObjectsManager = {
    _data: {},
    _collectors: {},
    
    /**
     Устанавливает данные, которые потом могут быть использованы поставщиками данных
	 @method
    */
    setData: function(data) {
        this._data = data;
    },
    
    /**
     Возвращает собранные данные
	 @method
    */
    getData: function() {
        return this._data;
    },
    
	/**
	 Собирает данные со всех сборщиков данных. Собранные данные доступны через метод getData
	 @method
	*/
    collect: function() {
        for (var id in this._collectors) {
            if ('collect' in this._collectors[id]) {
                var data = this._collectors[id].collect();
                if (data !== null) {
                    this._data[id] = data;
                }
            }
        }
    },
    
    /**
	 Вызывает метод load() у всех поставщиков данных, для которых есть данные.
     После вызова метода данные для данного загрузчика будут удалены (чтобы предотвратить множественную загрузку)
	 @method
	*/
    load: function(dataCollectorNames) {
        var collectors = {};
        
        if (dataCollectorNames)
        {
            if (typeof dataCollectorNames === 'string')
                dataCollectorNames = [dataCollectorNames];

            for (var dc = 0; dc < dataCollectorNames.length; dc++)
            {
                var name = dataCollectorNames[dc];
                if (name in this._collectors)
                    collectors[name] = this._collectors[name];
            }
        }
        else
            collectors = this._collectors;
        
        for (var id in collectors) {
            if (id in this._data && 'load' in collectors[id])
            {
                collectors[id].load(this._data[id]);
                delete this._data[id];
            }
        }
    },
    
    /**
	 Добавляет новый сборщик данных. Если в момент добавления есть какие-нибудь данные для загрузчика, они будут ему сразу же переданы
	 @method
     @param collectorId {String} - уникальный идентификатор сборщика данных
     @param collector {Object} - сборщик данных. Должен иметь следующие методы:<br/>
         collect()->Object - возвращает собранные данные. Если данных нет, нужно вернуть null
         load(data)->void - передаёт существующие данные загрузчику
	*/
    addDataCollector: function( collectorId, collector ) {
        this._collectors[collectorId] = collector;
        if (collectorId in this._data && 'load' in collector)
        {
            collector.load(this._data[collectorId])
            delete this._data[collectorId];
        }
    }
}