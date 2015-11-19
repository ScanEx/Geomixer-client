
(function ($) {

    var ppBackScreen = $("div.profilePanel");
    var ppMainParts = ppBackScreen.nextAll('[class^="profilePanel"]');

    var showProfile = function () {
        if (!ppBackScreen.length) {
            ppBackScreen = $('<div class="profilePanel"></div>').appendTo('#all');
            var ppFrameTemplate = '<div class="profilePanel-content">' +
            '{{#each pages}}' +
                '<div class="page">' +
                    '{{#each items}}' +
                        '{{#if form_caption}}' +
                            '<div class="form-caption">{{text}}</div>' +
                        '{{/if}}' +
                        '{{#if password_form}}' +
                            '<div style="float:right;" class="newpass-request">{{open_form}}</div>' +
                            '<div style="width:35%">{{text}}: <span class="PasswordState"></span></div>' +
                            '<div class="newpass-form">' +
                            '{{old}}: <input type="password" class="OldPassword" value=""><br/>' +
                            '{{newp}}: <input type="password" class="NewPassword" value=""><br/>' +
                            '{{repeat}}: <input type="password" class="PasswordRepeat" value=""><br/>' +
                            '<div><input type="button" class="ChangePassword" value="{{submit}}"></div>' +
                        '</div>' +
                        '{{/if}}' +
                        '{{#if span}}' +
                            '<div>{{text}}: <span {{#if id}}class="{{id}}"{{/if}}></span></div>' +
                        '{{/if}}' +
                        '{{#if text_input}}' +
                            '<div>{{text}}: <input {{#if id}}class="{{id}}"{{/if}} type="text" value=""></div>' +
                        '{{/if}}' +
                        '{{#if button_input}}' +
                            '<input type="button" {{#if id}}class="{{id}}"{{/if}} value="{{text}}">' +
                        '{{/if}}' +
                        '{{#if checkbox_group}}' +
                            '<table>' +
                            '{{#each checkbox_group}}' +
                                '<tr><td><input type="checkbox" id="{{id}}"></td><td><label for="{{id}}">{{text}}</label></td></tr>' +
                            '{{/each}}' +
                            '</table>' +
                        '{{/if}}' +
                    '{{/each}}' +
                '</div>' +
            '{{/each}}'
            '</div>';
            var change
            var ppFrameData = { pages: [
            { id: "page1", items: [
                { span: true, id: "Email", text: "Электронная почта" },
                { password_form: true, open_form: "изменить пароль?", text: "Пароль", old: "Старый пароль", newp: "Новый пароль", repeat: "Повтор пароля", submit: "Изменить" },
                { text_input: true, id: "Login", text: "Псевдоним" },
                { text_input: true, id: "FullName", text: "Полное имя" },
                { text_input: true, id: "Phone", text: "Телефон" },
                { text_input: true, id: "Company", text: "Название организации" },
                { text_input: true, id: "CompanyProfile", text: "Вид деятельности организации" },
                { text_input: true, id: "CompanyPosition", text: "Должность" },
                { checkbox_group: [
                    { id: "IsCompany", text: "Я выступаю от имени организации" },
                    { id: "Subscribe", text: "Я согласен получать сообщения по почте" }
                ]
                },
                { button_input: true, id: "SaveChanges", text: "Сохранить" }
            ]
            },
            { id: "page2", items: [
                { span: true, id: "FileStorageUsed", text: "Хранилище файлов используется" },
                { span: true, id: "FileStorageRemain", text: "Хранилище файлов осталось" },
                { span: true, id: "VectorLayerStorageUsed", text: "Хранилище векторных слоев используется" },
                { span: true, id: "VectorLayerStorageRemain", text: "Хранилище векторных слоев осталось" },
                { span: true, id: "SubscriptionUsed", text: "Подписок (Live Alerts) имеется" },
                { span: true, id: "SubscriptionRemain", text: "Подписок (Live Alerts) осталось" },
                { span: true, id: "SmsAvailable", text: "Sms (Live Alerts) доступны"}]
            },
            { id: "page3", items: [
                { form_caption: true, text: "Регистрация клиента" },
                { text_input: true, id: "AppName", text: "Название приложения" },
                { span: true, id: "ClientID", text: "ID клиента (client_id)" },
                { span: true, id: "ClientSecret", text: "oAuth ключ клиента (client_secret)" },
                { text_input: true, id: "RedirectUri", text: "URI скрипта абратного вызова (redirect_uri)" },
                { button_input: true, id: "RegisterClient", text: "Получить новый ключ"}]
            }
            ]
            };
            var ppFrame = $(Handlebars.compile(ppFrameTemplate)(ppFrameData));
            ppFrame.appendTo('#all');
            /*
            var ppFrame = $('<div class="profilePanel-content">' +
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
            */

            var ppPages = ppFrame.find('div.page').hide();
            ppPages.first().find('.newpass-request').click(function (e) {
                var form = $(e.target).siblings('.newpass-form');
                if (form.is(':visible')) form.hide(); else form.show();
            });
            ppPages.first().show();
            var ppMenu = $('<div class="profilePanel-menu">' +
                '<div class="selected">Профиль</div>' +
                '<div>Биллинг</div>' +
                '<div>Разработчикам</div>' +
            '</div>').appendTo('#all');
            var ppMenuEntries = ppMenu.find('div');
            ppMenuEntries.mouseover(function (e) { if (e.target.className != 'selected') e.target.className = 'targeted' });
            ppMenuEntries.mouseout(function (e) { if (e.target.className != 'selected') e.target.className = '' });
            ppMenuEntries.each(function (entryindex) {
                $(this).click(function (e) {
                    ppMenuEntries.attr({ 'class': '' });
                    ppPages.hide();
                    ppPages.is(function (pageindex, page) { if (pageindex == entryindex) $(page).show(); })
                    e.target.className = 'selected';
                });
            });

            ppMainParts = ppBackScreen.nextAll('[class^="profilePanel"]');
            ppMainParts.mouseout(function (e) {
                if (!ppMainParts.is($(e.relatedTarget)) && !ppMainParts.find($(e.relatedTarget)).length) {
                    ppBackScreen.hide();
                    ppMainParts.hide();
                }
            });
            $(window).resize(resizePanel);
        }
        else {
            ppBackScreen.show();
            ppMainParts.show();
        }
        //fillProfile();
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
        var w = ppBackScreen.width();
        var l = (getWindowWidth() - w);
        resize(ppBackScreen, l + 'px', t, h, w + 'px');
        var next = ppBackScreen.next('div');
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

