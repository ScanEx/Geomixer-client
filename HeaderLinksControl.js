(function()
{
    /**
        Добавляет ряд ссылок с иконками и текстом. 
        Считывает информацию из window.gmxViewerUI.headerLinkItems в формате [{icon: iconPath, title: TITLE, href: HREF}, ...]
        Если переменной нет, подставляет значения по умолчению ("Поиск снимков", "Документация", "Блог")
        @memberOf nsGmx
        @param container {HTMLDOMElement} куда добавлять ссылки
    */
    var addHeaderLinks = function(container)
    {
    
        var isHeaderLinks = false;
            if ( typeof window.headerLinks === 'boolean' ) isHeaderLinks = window.headerLinks; //совместимость с предыдущими версиями
            if ( typeof window.gmxViewerUI != 'undefined' && typeof window.gmxViewerUI.headerLinks != 'undefined' )
                isHeaderLinks = window.gmxViewerUI.headerLinks;

        if (!isHeaderLinks) {
            addHeaderLinks.def.resolve();
            return;
        }

        var items = (window.gmxViewerUI && window.gmxViewerUI.headerLinkItems) || 
            [
                {icon: 'img/zoom_tool2.png', title: "Поиск снимков", href: 'http://search.kosmosnimki.ru'},
                {icon: 'img/api2.png',       title: "Документация",  href: 'http://geomixer.ru/docs'     },
                {icon: 'img/blog.png',       title: "Блог",          href: 'http://blog.kosmosnimki.ru'  }
            ];
        
        for (var i = 0; i < items.length; i++)
        {
            var elems = [];
            if (items[i].icon)
                elems.push(_img(null, [['attr','src',items[i].icon]]));
            elems.push(_t(items[i].title));
            
            _(container, [_a(elems,[['attr','href', items[i].href],['attr','target','_blank']])]);
        }
        
        addHeaderLinks.def.resolve();
    }
    
    addHeaderLinks.def = $.Deferred();
    
    nsGmx.addHeaderLinks = addHeaderLinks;
})()