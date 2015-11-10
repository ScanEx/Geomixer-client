
(function ($) {

    var ppback = $("div.profilePanel");
    var ppparts = ppback.nextAll('[class^="profilePanel"]');

    var showProfile = function () {
        if (!ppback.length) {
            ppback = $('<div class="profilePanel"></div>').appendTo('#all');
            var ppcontent = $('<div class="profilePanel-content">' +
                '<div id="page1">' +
                    '<div>Электронная почта: <span id="Email"></span></div>' +
                    '<div style="float:right;" class="newpass-request" onclick="if($(\'.newpass-form\').is(\':visible\')) $(\'.newpass-form\').hide(); else $(\'.newpass-form\').show();">изменить пароль?</div>' +
                    '<div style="width:35%">Пароль: <span id="Password">сохранён</span></div>' +

                    '<div class="newpass-form">' +
                        'Старый пароль: <input type="password" id="OldPassword" value=""><br/>' +
                        'Новый пароль: <input type="password" id="NewPassword" value=""><br/>' +
                        'Повтор пароля: <input type="password" id="PasswordRepeat" value=""><br/>' +
                        '<div><input type="button" id="ChangePassword" value="Изменить"></div>' +
                    '</div>' +

                    '<div>Псевдоним: <input type="text" id="Login" value=""></div>' +
                    '<div>Полное имя: <input type="text" id="FullName" value=""></div>' +
                    '<div>Телефон: <input type="text" id="Phone" value=""></div>' +
                    '<div>Название организации:<br/><input type="text" id="Company" value=""></div>' +
                    '<div>Вид деятельности организации:<br/><input type="text" id="CompanyProfile" value=""></div>' +
                    '<div>Должность: <input type="text" id="CompanyPosition" value=""></div>' +
                    '<table>' +
                        '<tr><td><input type="checkbox" id="IsCompany"></td><td>Я выступаю от имени организации</td></tr>' +
                        '<tr><td><input type="checkbox" id="Subscribe"></td><td>Я согласен получать сообщения по почте</td></tr>' +
                    '</table>' +
                    '<input type="button" id="SaveChanges" value="Сохранить">' +
                '</div>' +
                '<div id="page2">' +
            //'<div>Пользователь: <span>456</span></div>' +
                    '<div>Хранилище файлов используется: <span id="FileStorageUsed"></span></div>' +
                    '<div>Хранилище файлов осталось: <span id="FileStorageRemain"></span></div>' +
                    '<div>Хранилище векторных слоев используется: <span id="VectorLayerStorageUsed"></span><span>, слоев </span><span id="VectorLayers">0</span><span>, объектов </span><span id="VectorLayerObjects">0</span></div>' +
                    '<div>Хранилище векторных слоев осталось: <span id="VectorLayerStorageRemain"></span></div>' +

                    '<div>Подписок (Live Alerts) имеется: <span id="SubscriptionUsed"></span></div>' +
                    '<div>Подписок (Live Alerts) осталось: <span id="SubscriptionRemain"></span></div>' +
                    '<div>Sms (Live Alerts) доступны: <span id="SmsAvailable"></span></div>' +
                '</div>' +
                '<div id="page3">' +
                    '<div class="form-caption">Регистрация клиента</div>' +
                    '<div>Название приложения: <input type="text" id="AppName" value=""></div>' +
                    '<div>ID клиента (client_id): <span id="ClientID"></span></div>' +
                    '<div>oAuth ключ клиента (client_secret): <span id="ClientSecret"></span></div>' +
                    '<div>URI скрипта абратного вызова (redirect_uri): <input type="text" id="RedirectUri" value=""></div>' +
                    '<input type="button" id="SaveChanges" value="Получить новый">' +
                '</div>' +
            '</div>').appendTo('#all');
            var pppages = ppcontent.find('div[id^="page"]').hide();
            pppages.first().show();
            var ppmenu = $('<div class="profilePanel-menu">' +
                '<div class="selected">Профиль</div>' +
                '<div>Биллинг</div>' +
                '<div>Разработчикам</div>' +
            '</div>').appendTo('#all');
            var ppmenuentries = ppmenu.find('div');
            ppmenuentries.mouseover(function (e) { if (e.target.className != 'selected') e.target.className = 'targeted' });
            ppmenuentries.mouseout(function (e) { if (e.target.className != 'selected') e.target.className = '' });
            ppmenuentries.each(function (entryindex) {
                $(this).click(function (e) {
                    ppmenuentries.attr({ 'class': '' });
                    pppages.hide();
                    pppages.is(function (pageindex, page) { if (pageindex == entryindex) $(page).show(); })
                    e.target.className = 'selected';
                });
            });

            ppparts = ppback.nextAll('[class^="profilePanel"]');
            ppparts.mouseout(function (e) {
                if (!ppparts.is($(e.relatedTarget)) && !ppparts.find($(e.relatedTarget)).length) {
                    ppback.hide();
                    ppparts.hide();
                }
            });
            $(window).resize(resizePanel);
        }
        else {
            ppback.show();
            ppparts.show();
        }
        fillProfile();
        resizePanel();
    };

    var fillProfile = function () {
        sendCrossDomainJSONRequest("http://my.kosmosnimki.ru/currentuser.ashx", function (response) {
            if (parseResponse(response) && response.Result) {
                var content = $('.profilePanel-content');
                content.find('#Email').text(response.Result[0].Email);
                content.find('#Login').val(response.Result[0].Login);
                content.find('#FullName').val(response.Result[0].FullName);
                content.find('#Phone').val(response.Result[0].Phone);
                content.find('#Company').val(response.Result[0].Company);
                content.find('#CompanyProfile').val(response.Result[0].CompanyProfile);
                content.find('#CompanyPosition').val(response.Result[0].CompanyPosition);
                content.find('#Subscribe').prop('checked', response.Result[0].Subscribe);
                content.find('#IsCompany').prop('checked', response.Result[0].IsCompany);
                fillBillingPage(content, response);
                fillDeveloperPage(content, response);
            }
        });
    }

    var fillBillingPage = function (content, response) {
        content.find('#FileStorageUsed').text((response.Result[0].FileStorageUsed / 1000000).toFixed(2) + 'мб');
        content.find('#FileStorageRemain').text(response.Result[0].FileStorageAvailable == null ? '' : ((response.Result[0].FileStorageAvailable - response.Result[0].FileStorageUsed) / 1000000).toFixed(2) + 'мб');
        content.find('#VectorLayerStorageUsed').text((response.Result[0].VectorLayerStorageUsed / 1000000).toFixed(2) + 'мб');
        content.find('#VectorLayerStorageRemain').text(response.Result[0].VectorLayerStorageAvailable == null ? '' : ((response.Result[0].VectorLayerStorageAvailable - response.Result[0].VectorLayerStorageUsed) / 1000000).toFixed(2) + 'мб');
        content.find('#VectorLayers').text(response.Result[0].VectorLayers);
        content.find('#VectorLayerObjects').text(response.Result[0].VectorLayerObjects);

        content.find('#SmsAvailable').text(response.Result[0].SmsAvailable == null || response.Result[0].SmsAvailable > 0 ? 'да' : 'нет');
        content.find('#SubscriptionUsed').text(response.Result[0].SubscriptionUsed != null ? response.Result[0].SubscriptionUsed : '');
        content.find('#SubscriptionRemain').text(response.Result[0].SubscriptionRemain != null ? response.Result[0].SubscriptionRemain : '');
    }

    var fillDeveloperPage = function (content, response) {
        content.find('#AppName').val(response.Result[0].AppName);
        content.find('#ClientID').text(response.Result[0].ID);
        content.find('#ClientSecret').text(response.Result[0].ClientSecret);
        content.find('#RedirectUri').val(response.Result[0].RedirectUri);
    }

    var resizePanel = function () {
        var t = $('#leftMenu').css('top');
        var h = $('#leftMenu').css('height')
        var w = ppback.width();
        var l = (getWindowWidth() - w);
        resize(ppback, l + 'px', t, h, w + 'px');
        var next = ppback.next('div');
        w = next.width();
        resize(next, l + 'px', t, h, w + 'px');
        resize(next.next('div'), (l + w) + 'px', t, h, next.width() + 'px');
    }

    var resize = function (object, left, top, height, width) {
        object.css({ 'left': left });
        object.css({ 'top': top });
        object.height(height);
        //object.width(width);
        object.css({ 'position': 'absolute' });
    }

    gmxCore.addModule('ProfilePlugin', {
        pluginName: 'ProfilePlugin',
        showProfile: showProfile,
        afterViewer: function () {
            var checkExist = setInterval(function () {
                var a = $('a:contains("' + nsGmx.Translations.getText('auth.myAccount') + '")')
                if (a.length) {
                    a.attr({ 'class': 'dropdownMenuWidget-dropdownItemAnchor' });
                    a.siblings('div').remove();
                    a.attr('href', 'javascript:void(0)');
                    a.removeAttr('target');
                    a.click(function (event) {
                        showProfile();
                        event.stopPropagation();
                    });
                    //a.click();
                    clearInterval(checkExist);
                }
            }, 100);
        }
    }
    , { css: 'ProfilePlugin.css' }
    );
})(jQuery)

