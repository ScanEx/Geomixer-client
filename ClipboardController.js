var nsGmx = nsGmx || {};

/** 
* Контроллёр глобального буфера обмена
* @memberOf nsGmx
* @class Синглетон. Позволяет хранить массивы объектов разного типа. Тип объектов - строка. В рамках одного типа объекты упорядочены.
*/
nsGmx.ClipboardController = (function()
{
    var _clipboard = {};
    return {
        addItem: function(type, item)
        {
            _clipboard[type] = _clipboard[type] || [];
            _clipboard[type].push(item);
        },
        
        popItem: function(type)
        {
            if (typeof _clipboard[type] === 'undefined' || _clipboard[type].length == 0) return null;
            return _clipboard[type].pop();
        },
        
        //количество объектов данного типа
        getCount: function(type)
        {
            if ( typeof _clipboard[type] === 'undefined' ) 
                return 0;
            
            return _clipboard[type].length;
        },
        
        //получить объект типа type с индексом index. Если index < 0, то индексация с конца (-1 - последний элемент)
        get: function(type, index)
        {
            if ( typeof _clipboard[type] === 'undefined' ) return null;
            
            if (index < 0) index += _clipboard[type].length;
            
            if (index < 0 || _clipboard[type].length <= index )
                return null;
                
            return _clipboard[type][index];
        }
    }
})();