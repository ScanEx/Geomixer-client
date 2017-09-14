# AuthWidget

Контрол авторизации

## Зависимости

- jQuery
- Handlebars
- CommonStyles
- nsGmx.Translations с хелпером 'i'

## API

В конструктор передаётся хеш со следующими ключами:
- `authManager`. Обязательно - менеджер авторизации
- `showAccountLink`. Показывать ли в выпадающем меню ссылку на личный кабинет (по умолчанию - true)
- `accountLink`. Собственно ссылка на личный кабинет пользователя (не обязательно)
- `showMapLink`. Показывать ли в выпадающем меню ссылку на личную карту (по умолчанию - true)
- `mapLink`. Собственно ссылка на личный карту (не обязательно)

ID пунктов выпадающего меню:
- `AuthWidgetAccountLink` - ссылка на личный кабинет
- `AuthWidgetMapLink` - ссылка на личную карту

Виджет реализует следующие методы:

- `on(<String> event, <Function> handler)` - подписаться на событие `event` и обрабатывать его коллбеком `handler`
- `appendTo(DOMNode|jQueryObject)` - добавить виджет в DOM-дерево
- `getUserInfo()` - получить информацию о пользователе, которую authManager вернул в последний раз

## Использование

```javascript
var authWidget = new nsGmx.AuthWidget({
    authManager: authManager
});

authWidget.on('ready', function() {
    //...
});

authWidget.on('logout', function() {
    //...
});

authWidget.appendTo(headerController.getAuthPlaceholder());
```