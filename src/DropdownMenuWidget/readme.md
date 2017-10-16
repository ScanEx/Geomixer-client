# DropdownMenuWidget

Виджет меню с одноуровневым выпадающим списком.

## Интерфейс вызова

Конструктор принимает хеш с настройками, который имеет следующие ключи:
- `<Array[Object]> items` - массив пунктов меню
- `<Number> mouseTimeout` - *необязательный*. задержка показа выпадающего меню по наведению курсора

Каждый элемент массива `items` может иметь следующие поля, ни одно из которых не является обязательным:
- `<String> title` - название ссылки
- `<String> link` - url ссылки
- `<String> icon` - url иконки (будет отображаться слева от `title`)
- `<String> fonticon` - css-класс векторной иконки
- `<String> id` - id, который будет назначен элементу ссылки (полезно, если хотим назначить какое-то нестандартное действие, например открытие диалогового окна)
- `<Boolean> newWindow` - открывать ли ссылку в новом окне 
- `<String> className` - класс, который будет назначен элементу меню

Ссылки верхнего уровня также могут содержать поле `dropdown`, которое представляет из себя тот же массив ссылок, отображающихся в выпадающем меню.

## Методы

- `appendTo(<DOMNode|jQueryObject placeholder>)` - добавить виджет в DOM-дерево

## Пример использования

```javascript
var menuWidget = new nsGmx.DropdownMenuWidget({
    mouseTimeout: 200,
    items: [{
        title: 'Карта пожаров',
        className: 'menu-dot',
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
        link: 'http://search.kosmosnimki.ru',
        icon: 'search.png'
    }, {
        title: 'Веб-ГИС Геомиксер',
        link: 'http://geomixer.ru',
        icon: 'gmx.png',
    }]
})

menuWidget.appendTo($('.menuContainer'));
```