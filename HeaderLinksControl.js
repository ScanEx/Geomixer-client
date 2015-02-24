/**
    Возвращает массив ссылок в верхнее левое мета-меню в формате HeaderWidget из CommonComponents.
    Считывает информацию из window.gmxViewerUI.headerLinkItems в формате [{icon: iconPath, title: TITLE, href: HREF}, ...] (формат ГеоМиксера)
    Если переменной нет, подставляет значения по умолчению ("Карта пожаров", "Поиск снимков", "Платформа Геомиксер")
    @memberOf nsGmx
*/
nsGmx.addHeaderLinks = function()
{
    var isHeaderLinks = true;
    if ( typeof window.headerLinks === 'boolean' ) isHeaderLinks = window.headerLinks; //совместимость с предыдущими версиями
    if ( typeof window.gmxViewerUI !== 'undefined' && typeof window.gmxViewerUI.headerLinks !== 'undefined' )
        isHeaderLinks = window.gmxViewerUI.headerLinks;

    if (!isHeaderLinks) {
        return [];
    }

    var items = (window.gmxViewerUI && window.gmxViewerUI.headerLinkItems) || 
        [
            {title: _gtxt("Карта пожаров"), href: "http://fires.kosmosnimki.ru"},
            {title: _gtxt("Поиск снимков"), href: "http://search.kosmosnimki.ru"},
            {title: _gtxt("Платформа Геомиксер"), active: true}
        ];
        
    return $.extend(true, [], items).map(function(item) {
        item.link = item.href;
        return item;
    })
}