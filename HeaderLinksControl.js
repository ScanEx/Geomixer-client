/**
    Возвращает массив ссылок в верхнее левое мета-меню в формате HeaderWidget из CommonComponents.
    Считывает информацию из window.gmxViewerUI.headerLinkItems в формате [{icon: iconPath, title: TITLE, href: HREF}, ...] (формат ГеоМиксера)
    Если переменной нет, подставляет значения по умолчению ("Карта пожаров", "Поиск снимков", "Платформа Геомиксер")
    @memberOf nsGmx
*/
nsGmx.addHeaderLinks = function()
{
    var isHeaderLinks = false;
    if ( typeof window.headerLinks === 'boolean' ) isHeaderLinks = window.headerLinks; //совместимость с предыдущими версиями
    if ( typeof window.gmxViewerUI !== 'undefined' && typeof window.gmxViewerUI.headerLinks !== 'undefined' )
        isHeaderLinks = window.gmxViewerUI.headerLinks;

    if (!isHeaderLinks) {
        return [];
    }

    var items = (window.gmxViewerUI && window.gmxViewerUI.headerLinkItems) ||
        [
            {title: _gtxt("Карта пожаров"), href: _gtxt("http://fires.ru"), newWindow: true},
            {title: _gtxt("Поиск снимков"), href: _gtxt("https://search.kosmosnimki.ru"), newWindow: true},
            {title: _gtxt("Платформа Геомиксер"), newWindow: true, id: 'HeaderLinkGeoMixer'}
        ];

    return $.extend(true, [], items).map(function(item, index, array) {
        item.link = item.href;
        return {
            id: 'headerLinksItem' + index,
            title: item.title,
            func: function(){
                if (item.link) {
                    window.open(item.link, '_blank');
                }
            }.bind(item)
        }
    })
}
