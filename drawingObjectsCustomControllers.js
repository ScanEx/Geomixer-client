var nsGmx = nsGmx || {};

// Делегаты пользовательских объектов - классы, управляющие отображением и сериализацией пользовательских объектов
// Методы:
//   - isHidden(obj) -> Bool
//   - isSerializable(obj) -> Bool
nsGmx.DrawingObjectCustomControllers = (function()
{
	var _delegates = [];
	return {
		addDelegate: function(delegate)
		{
			_delegates.push(delegate);
		},
		
		isHidden: function(obj)
		{
			for (var d = 0; d < _delegates.length; d++)
				if ('isHidden' in _delegates[d] && _delegates[d].isHidden(obj))
					return true;
			return false;
		},
		
		isSerializable: function(obj)
		{
			for (var d = 0; d < _delegates.length; d++)
				if ('isSerializable' in _delegates[d] && !_delegates[d].isSerializable(obj))
					return false;
			return true;
		}
	}
})();