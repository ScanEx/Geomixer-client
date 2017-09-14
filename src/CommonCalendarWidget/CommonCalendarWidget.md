#### API виджета общего календаря

метод | синтаксис | возвращает | описание
-- | -- | -- | --
show | `show()` | `this` | показывает календарь в левой панели
hide | `hide()` | `this` | скрывает календарь
setDateInterval |`setDateInterval`(`<Date> dateBegin`, `<Date> dateEnd`, `<ILayer> layer?`) | | устанавливает `dateInterval` календарю и всем мультивременным слоям в карте. Если указан layer, то он становится текущим, и  `dateInterval` применяется к нему.
getDateInterval | `getDateInterval()` | `<Object> dateInterval` | возвращает `dateInterval` календаря  
setCurrentLayer | `setCurrentLayer`(`<ILayer> layer`) | | устанавливает текущий слой календаря
bindLayer | `bindLayer`(`<String> layerName`) | | привязывает слой к календарю.
unbindLayer | `unbindLayer`(`<String> layerName`) | | отвязывает слой от календаря. `dateInterval` слоя и календаря обновляют себя независимо.
setDailyFilter| `setDailyFilter`(`<Boolean> active`) | | устанавливает режим "посуточно"
