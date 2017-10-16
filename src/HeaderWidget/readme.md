#HeaderWidget

Общая шапка для всех проектов

##Зависимости

- jQuery
- Handlebars

## Интерфейс вызова

Конструктор принимает объект с настройками, а котором могут быть следующие свойства:
- `<String>logo` - url изображения логотипа высотой 60px
- `<Array>leftLinks` - список ссылок слева (см. `DropdownMenuWidget`)
- `<Array>rightLinks` - список ссылок справа (см. `DropdownMenuWidget`)
- `<Object>socials` - хеш {социальная_сеть: url}. Подерживаются `vk`, `facebook` и `twitter`

У экземпляра класса HeaderWidget есть 4 метода для получения контейнеров, предназначеных для других виджетов: `getAuthPlaceholder()`, `getMenuPlaceholder()`, `getSearchPlaceholder()`, `getLanguagePlacehodler()`. Каджый из них возвращает `jQueryObject`.

Шапка имеет Thorax-подобный интерфейс, по-этому для её отображения необходимо вызвать метод `appendTo()`

## Методы

- `appendTo(<DOMNode|jQueryObject> placehodler)` - добавить виджет в DOM-дерево
- `<jQueryObject> getAuthPlaceholder()` - получить контейнер виджета авторизации
- `<jQueryObject> getMenuPlaceholder()` - получить контейнер виджета меню
- `<jQueryObject> getSearchPlaceholder()` - получить контейнер виджета поиска
- `<jQueryObject> getLanguagePlaceholder()` - получить контейнер виджета переключения языка

##Пример использования

```javascript
var headerWidget = new nsGmx.Controls.HeaderWidget({
    logo: 'images/fires.png',
    leftLinks: [{
        title: 'Карта пожаров',
        link: '#',
        dropdown: [{
            title: 'О проекте',
            link: '#',
            id: 'headerLink_about'
        }, {
            title: 'Справка',
            newWindow: true,
            link: 'help.html'
        }, {
            title: 'Блог',
            newWindow: true,
            link: 'http://blog.kosmosnimki.ru/category/%D0%BF%D0%BE%D0%B6%D0%B0%D1%80%D1%8B-2'
        }, {
            title: 'Контакты',
            link: '#',
            id: 'headerLink_contacts'
        }]
    }, {
        title: 'linkSearch',
        link: 'http://search.kosmosnimki.ru'
    }, {
        title: 'Веб-ГИС Геомиксер',
        link: 'http://geomixer.ru',
        iconClass: 'topBarLink-icon_geomixer',
    }],
    rightLinks: [],
    socials: {
        facebook: 'https://www.facebook.com/firesmap',
        //vk: '...',
        twitter: 'https://twitter.com/firesmap'
    }
});

headerWidget.appendTo($('.headerContainer'));

//получить контейнер компонента авторизации
var $authPlaceholder = headerWidget.getAuthPlaceholder();

//получить контейнер меню
var $menuPlaceholder = headerWidget.getMenuPlaceholder();

//получить контейнер строки поиска
var $searchPlaceholder = headerWidget.getSearchPlaceholder();

//получить контейнер смены языков
var $languagePlaceholder = headerWidget.getLanguagePlaceholder();
```