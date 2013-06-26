gmxCore.addModule('TinyMCELoader', {}, {
    init: function(module, path) {
        var def = $.Deferred();
        gmxCore.loadScript(path + 'thirdparty/tinymce/tiny_mce.js').done(function() {
            tinyMCE.init({
                mode : "none",
                theme : "advanced",
                plugins: 'fullscreen',
                language: 'ru',
                convert_urls: false,
                theme_advanced_buttons1: 'bold,italic,underline,|,justifyleft,justifycenter,justifyright,|,link,unlink,fullscreen,code',
                theme_advanced_buttons2: '',
                theme_advanced_buttons3: '',
                theme_advanced_statusbar_location: 'none',
                theme_advanced_toolbar_location: 'bottom',
                theme_advanced_toolbar_align: 'center'
            });
            def.resolve();
        });
        
        return def.promise();
    }
});