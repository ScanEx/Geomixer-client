(function(){

//Интерфейс для провайдеров значений параметров
nsGmx.ILazyAttributeValuesProvider = function()
{
	this.isAttributeExists = function( attrName ){};
	this.getValuesForAttribute = function( attrName, callback ){};
};

//Простая обёртка над массивами для обратной совместимости
nsGmx.LazyAttributeValuesProviderFromArray = function( attributes )
{
	var _attrs = attributes;

	this.isAttributeExists = function( attrName )
	{
		return attrName in _attrs; 
	};
	
	this.getValuesForAttribute = function( attrName, callback )
	{
		if ( attrName in _attrs )
			callback(_attrs[attrName]);
		else
			callback();
	};
};
nsGmx.LazyAttributeValuesProviderFromArray.prototype = new nsGmx.ILazyAttributeValuesProvider();

/** При необходимости этот провайдер будет запрашивать значения аттрибутов у сервера
 * @class
 * @memberOf nsGmx
 * @param {Object} attributes Хеш имён атрибутов, значения которых хочется иметь
 * @param {String} layerName ID слоя
*/
nsGmx.LazyAttributeValuesProviderFromServer = function(attributes, layerName)
{
	var _attrs = attributes;
	var _isInited = false;
	var _isProcessing = false;
	
	//в процессе ожидания ответа от сервера мы можем получать запросы на разные аттрибуты
	//важно все их правильно сохранить и выхвать при получении данных
	var _callbacks = {};

    /** Проверить, есть ли такой атрибут
        @param {String} attrName Имя атрибута
        @return {Boolean} Есть ли такой атрибут среди атрибутов
    */
	this.isAttributeExists = function( attrName )
	{
		return attrName in _attrs; 
	};
	
    /** Получить доступные значения атрибута
        @param {String} attrName Имя атрибута
        @param {Function} callback Ф-ция, которая будет вызвана со списком атрибутов, когда он станет доступным
    */
	this.getValuesForAttribute = function( attrName, callback )
	{
		if ( !(attrName in _attrs) ) //вообще нет такого имени
			callback();
		else if ( _attrs[attrName].length ) //есть вектор значений!
			callback( _attrs[attrName] ); 
		else if (_isInited) //вектора значений всё ещё нет и уже ходили на сервер - второй раз пробовать не будем...
			callback(); 
		else
		{
			if ( !(attrName in _callbacks) )
				_callbacks[attrName] = [];
			
			_callbacks[attrName].push(callback);
			
			if (_isProcessing) return;
			//идём на сервер и запрашиваем значения аттрибутов!
			
			_isProcessing = true;
			sendCrossDomainJSONRequest(serverBase + "VectorLayer/GetVectorAttrValues.ashx?WrapStyle=func&LayerName=" + layerName, function(response)
			{
				_isInited = true;
				_isProcessing = false;
				if (!parseResponse(response))
				{
					for (var n in _callbacks)
						for (var k = 0; k < _callbacks[n].length; k++)
							_callbacks[n][k]();
					return;
				}
				
				_attrs = response.Result;
				for (var n in _callbacks)
					for (var k = 0; k < _callbacks[n].length; k++)
						_callbacks[n][k](_attrs[n]);
			});
		}
	};
}
nsGmx.LazyAttributeValuesProviderFromServer.prototype = new nsGmx.ILazyAttributeValuesProvider();

})();