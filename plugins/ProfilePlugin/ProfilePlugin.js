
(function ($) {
    var mykosmosnimki = "http://my.kosmosnimki.ru"; //"http://localhost:56319";

    var initTranslations = function () {


        _translationsHash.addtext("rus", { ProfilePlugin: {

            "profile": "Профиль",
            "billing": "Биллинг",
            "developer": "Разработчикам",

            "email": "Электронная почта",
            "login": "Псевдоним",
            "fullName": "Полное имя",
            "phone": "Телефон",
            "company": "Название организации",
            "companyProfile": "Вид деятельности организации",
            "companyPosition": "Должность",
            "isCompany": "Я выступаю от имени организации",
            "subscribe": "Я согласен получать сообщения по почте",
            "saveChanges": "Сохранить",

            "fileStorageUsed": "Хранилище файлов используется",
            "fileStorageRemain": "Хранилище файлов осталось",
            "vectorLayerStorageUsed": "Хранилище векторных слоев используется",
            "vectorLayerStorageRemain": "Хранилище векторных слоев осталось",
            "subscriptionUsed": "Подписок (Live Alerts) имеется",
            "subscriptionRemain": "Подписок (Live Alerts) осталось",
            "smsAvailable": "Sms (Live Alerts) доступны",

            "clientRegistration": "Регистрация клиента",
            "appName": "Название приложения",
            "clientID": "ID клиента (client_id)",
            "clientSecret": "oAuth ключ клиента (client_secret)",
            "redirectUri": "URI скрипта абратного вызова (redirect_uri)",
            "registerClient": "Получить новый ключ",

            "password": "Пароль",
            "getNew": "изменить?",
            "passwordSaved": "сохранен",
            "passwordChanged": "изменен",
            "old": "Старый пароль",
            "newp": "Новый пароль",
            "repeat": "Подтверждение",
            "submitp": "Изменить",

            "ErrorNOT_AUTHORIZED": "Пользователь не авторизован",
            "ErrorLoginEmpty": "Требуется указать псевдоним!",
            "ErrorLoginFormat": "Неправильный псевдоним! Допустимый вариант ",
            "ErrorLoginExists": "Псевдоним уже используется!",
            "ErrorAppName": "Не указано название приложения!",
            "ErrorRedirectUri": "Требуется действительный uri обратного вызыва!",
            "ErrorOldPassword": "Текущий пароль указан неверно",
            "ErrorNewPassword": "Пароль не может быть пустым",
            "ErrorNotMatch": "Введённые пароли не совпадают"
        }
        });

        _translationsHash.addtext("eng", { ProfilePlugin: {
            "profile": "Profile",
            "billing": "Billing",
            "developer": "Developer",

            "email": "Email",
            "login": "Nickname",
            "fullName": "Full name",
            "phone": "Phone",
            "company": "Company",
            "companyProfile": "Type of company activity",
            "companyPosition": "Company position",
            "isCompany": "I am speaking on behalf of the organization",
            "subscribe": "I agree to receive updates and news by email",
            "saveChanges": "Save",

            "fileStorageUsed": "File storage consumtion",
            "fileStorageRemain": "File storage remain",
            "vectorLayerStorageUsed": "Vector storage consumption",
            "vectorLayerStorageRemain": "Vector storage remain",
            "subscriptionUsed": "Subscription consumption",
            "subscriptionRemain": "Subscription remain",
            "smsAvailable": "Sms",

            "clientRegistration": "Client Registration",
            "appName": "Client Application",
            "clientID": "Client ID (client_id)",
            "clientSecret": "Client secret key (client_secret)",
            "redirectUri": "Redirect endpoint URI",
            "registerClient": "Issue new secret key",

            "password": "Password",
            "getNew": "change?",
            "passwordSaved": "saved",
            "passwordChanged": "changed",
            "old": "Old password",
            "newp": "New password",
            "repeat": "Repeat",
            "submitp": "Change",

            "ErrorNOT_AUTHORIZED": "Authorization is required!",
            "ErrorLoginEmpty": "Nickname is required!",
            "ErrorLoginFormat": "Invalid nickname! Allowable nickname ",
            "ErrorLoginExists": "Nickname duplicates!",
            "ErrorAppName": "Application name is required!",
            "ErrorRedirectUri": "Valid redirect uri is required!",
            "ErrorOldPassword": "Password is invalid!",
            "ErrorNewPassword": "Password is required!",
            "ErrorNotMatch": "Passwords does not match!"
        }
        });
    }

    var ppBackScreen = $("div.profilePanel"),
    ppMainParts;

    var showProfile = function () {
        if (!ppBackScreen.length) {
            // Create
            ppBackScreen = $('<div class="profilePanel"><table width="100%" height="100%"><tr><td><img src="img/progress.gif"></td></tr></table></div>').hide().appendTo('#all');
            var ppFrame = $('<div class="profilePanel-content"></div>');
            var ppMenu = $('<div class="profilePanel-menu"></div>');
            var wait = $('<table width="100%" height="20%"><tr><td align="center"><img src="img/progress.gif"></td></tr></table>');

            // Pages
            var pageTemplate =
                '<div class="page">' +
                    '{{#each items}}' +
                        '{{#if form_caption}}' +
                            '<div class="form-caption">{{text}}</div>' +
                        '{{/if}}' +
                        '{{#if span}}' +
                            '<div>{{text}}: <span {{#if id}}class="{{id}}"{{/if}}></span></div>' +
                        '{{/if}}' +
                        '{{#if span_nl}}' +
                            '<div>{{text}}:<br/><span {{#if id}}class="{{id}}"{{/if}}></span></div>' +
                        '{{/if}}' +
                        '{{#if text_input}}' +
                            '<div onclick="$(this).children().focus()">{{text}}: <input {{#if id}}class="{{id}}"{{/if}} type="text" value=""></div>' +
                        '{{/if}}' +
                        '{{#if error}}' +
                            '<div class="ErrorSummary">error</div>' +
                        '{{/if}}' +
                        '{{#if button_input}}' +
                            '<input type="button" {{#if id}}class="{{id}}"{{/if}} value="{{text}}">' +
                        '{{/if}}' +
                        '{{#if checkbox_group}}' +
                            '<table>' +
                            '{{#each checkbox_group}}' +
                                '<tr><td><input type="checkbox" class="{{id}}"></td><td><label for="{{id}}">{{text}}</label></td></tr>' +
                            '{{/each}}' +
                            '</table>' +
                        '{{/if}}' +
                    '{{/each}}' +
                '</div>';
            var page1 = $(Handlebars.compile(pageTemplate)(
            { id: "page1", items: [
                { span: true, id: "Email", text: _gtxt('ProfilePlugin.email') },
                { text_input: true, id: "Login", text: _gtxt('ProfilePlugin.login') },
                { text_input: true, id: "FullName", text: _gtxt('ProfilePlugin.fullName') },
                { text_input: true, id: "Phone", text: _gtxt('ProfilePlugin.phone') },
                { text_input: true, id: "Company", text: _gtxt('ProfilePlugin.company') },
                { text_input: true, id: "CompanyProfile", text: _gtxt('ProfilePlugin.companyProfile') },
                { text_input: true, id: "CompanyPosition", text: _gtxt('ProfilePlugin.companyPosition') },
                { checkbox_group: [
                    { id: "IsCompany", text: _gtxt('ProfilePlugin.isCompany') },
                    { id: "Subscribe", text: _gtxt('ProfilePlugin.subscribe') }
                ]
                },
                { error: true },
                { button_input: true, id: "SaveChanges", text: _gtxt('ProfilePlugin.saveChanges') }
            ]
            })).appendTo(ppFrame),
            page2 = $(Handlebars.compile(pageTemplate)(
            { id: "page2", items: [
                { span: true, id: "FileStorageUsed", text: _gtxt('ProfilePlugin.fileStorageUsed') },
                { span: true, id: "FileStorageRemain", text: _gtxt('ProfilePlugin.fileStorageRemain') },
                { span: true, id: "VectorLayerStorageUsed", text: _gtxt('ProfilePlugin.vectorLayerStorageUsed') },
                { span: true, id: "VectorLayerStorageRemain", text: _gtxt('ProfilePlugin.vectorLayerStorageRemain') },
                { span: true, id: "SubscriptionUsed", text: _gtxt('ProfilePlugin.subscriptionUsed') },
                { span: true, id: "SubscriptionRemain", text: _gtxt('ProfilePlugin.subscriptionRemain') },
                { span: true, id: "SmsAvailable", text: _gtxt('ProfilePlugin.smsAvailable') }
            ]
            })).appendTo(ppFrame),
            page3 = $(Handlebars.compile(pageTemplate)(
            { id: "page3", items: [
                { form_caption: true, text: _gtxt('ProfilePlugin.clientRegistration') },
                { text_input: true, id: "AppName", text: _gtxt('ProfilePlugin.appName') },
                { span: true, id: "ClientID", text: _gtxt('ProfilePlugin.clientID') },
                { span_nl: true, id: "ClientSecret", text: _gtxt('ProfilePlugin.clientSecret') },
                { text_input: true, id: "RedirectUri", text: _gtxt('ProfilePlugin.redirectUri') },
                { error: true },
                { button_input: true, id: "RegisterClient", text: _gtxt('ProfilePlugin.registerClient') }
            ]
            })).appendTo(ppFrame);

            // Profile submit
            page1.find('.SaveChanges').click(function () {
                changePassForm.hide();
                wait.show();
                sendCrossDomainPostRequest(mykosmosnimki + "/Handler/Settings", { WrapStyle: 'message',
                    Login: page1.find('.Login').val(),
                    FullName: page1.find('.FullName').val(),
                    Phone: page1.find('.Phone').val(),
                    Company: page1.find('.Company').val(),
                    Profile: page1.find('.CompanyProfile').val(),
                    Position: page1.find('.CompanyPosition').val(),
                    IsCompany: page1.find('.IsCompany').is(":checked"),
                    Subscribe: page1.find('.Subscribe').is(":checked")
                },
                      function (response) {
                          wait.hide();
                          if (response.Status.toLowerCase() == 'ok' && response.Result) {
                              page1.children('.ErrorSummary').text('error').css('visibility', 'hidden');
                          }
                          else {
                              if (response.Result.length > 0 && response.Result[0].Key)
                                  page1.trigger('onerror', [response.Result[0].Key, response.Result[0].Value.Errors[0].ErrorMessage]);
                              else
                                  page1.trigger('onerror', response.Result.Message);
                          }
                      });
            });

            // Register client submit
            page3.find('.RegisterClient').click(function () {
                wait.show();
                sendCrossDomainPostRequest(mykosmosnimki + "/Handler/RegisterClient", { WrapStyle: 'message',
                    AppName: page3.find('.AppName').val(), RedirectUri: page3.find('.RedirectUri').val()
                },
                      function (response) {
                          wait.hide();
                          if (response.Status.toLowerCase() == 'ok' && response.Result) {
                              page3.find('.ClientSecret').text(response.Result.Key);
                              page3.children('.ErrorSummary').css('visibility', 'hidden');
                          }
                          else {
                              page3.trigger('onerror', response.Result.Message);
                          }
                      });
            });
            var ppPages = ppFrame.find('div.page').hide();

            // Change password form
            var changePassControls = $(Handlebars.compile(
            '<div style="float:right;" class="newpass-request">{{i "ProfilePlugin.getNew"}}</div>' +
            '<div style="width:35%">{{i "ProfilePlugin.password"}}: <span class="PasswordState">{{i "ProfilePlugin.passwordSaved"}}</span></div>')())
            .insertAfter(page1.find('.Email').parent());
            var changePassForm = $(Handlebars.compile(
            '<div class="newpass-form">' +
                '{{i "ProfilePlugin.old"}}: <input type="password" class="OldPassword" value=""><br/>' +
                '{{i "ProfilePlugin.newp"}}: <input type="password" class="NewPassword" value=""><br/>' +
                '{{i "ProfilePlugin.repeat"}}: <input type="password" class="PasswordRepeat" value=""><br/>' +
                '<div class="ErrorSummary">error</div>' +
                '<div><input type="button" class="ChangePassword" value="{{i "ProfilePlugin.submitp"}}"></div>' +
            '</div>')());
            changePassForm.insertAfter(changePassControls.last());
            changePassForm.find('.ChangePassword').click(function () {
                wait.show();
                sendCrossDomainPostRequest(mykosmosnimki + "/Handler/ChangePassword", { WrapStyle: 'message',
                    oldpassword: changePassForm.children('.OldPassword').val(),
                    password: changePassForm.children('.NewPassword').val(),
                    repeat: changePassForm.children('.PasswordRepeat').val()
                },
                function (response) {
                    wait.hide();
                    if (response.Status.toLowerCase() == 'ok' && response.Result)
                        changePassForm.hide().prev().find('.PasswordState').text(_gtxt('ProfilePlugin.passwordChanged'));
                    else
                        changePassForm.trigger('onerror', response.Result.Message);
                });
            });
            changePassControls.first().click(function (e) {
                changePassForm.trigger('onrender');
                if (changePassForm.is(':visible')) changePassForm.hide(); else changePassForm.show();
            });

            // Error display
            var page1Errors = page1.find('.ErrorSummary');
            changePassForm.bind('onerror', function (e, m) {
                page1Errors.text('error').css('visibility', 'hidden');
                $(this).children('.ErrorSummary').text(_gtxt('ProfilePlugin.Error' + m)).css('visibility', 'visible');
                return false;
            });
            changePassForm.bind('onrender', function () {
                $(this).children('input[type="password"]').val('');
                page1Errors.text('error').css('visibility', 'hidden');
                return false;
            });
            ppPages.bind('onerror', function (e, m1, m2) {
                var m = _gtxt('ProfilePlugin.Error' + m1);
                if (m2)
                    m += " " + m2;
                $(this).children('.ErrorSummary').text(m).css('visibility', 'visible');
                return false;
            })
            ppPages.bind('onrender', function () {
                $(this).children('.ErrorSummary').css('visibility', 'hidden');
                changePassForm.hide();
                return false;
            });

            ppPages.first().show();
            ppFrame.hide().appendTo('#all');

            // Menu
            var menuEntryTemplate = '<div>{{text}}</div>';
            var showPage = function (e, page) {
                ppMenu.children().attr({ 'class': '' });
                ppPages.hide();
                page.show();
                e.target.className = 'selected';
                page.trigger('onrender');
            };
            $(Handlebars.compile(menuEntryTemplate)({ text: _gtxt('ProfilePlugin.profile') })).appendTo(ppMenu).click(function (e) { showPage(e, page1); });
            $(Handlebars.compile(menuEntryTemplate)({ text: _gtxt('ProfilePlugin.billing') })).appendTo(ppMenu).click(function (e) { showPage(e, page2); });
            $(Handlebars.compile(menuEntryTemplate)({ text: _gtxt('ProfilePlugin.developer') })).appendTo(ppMenu).click(function (e) { showPage(e, page3); });
            wait.appendTo(ppMenu).hide();
            ppMenu.hide().appendTo('#all');
            var ppMenuEntries = ppMenu.children();
            ppMenuEntries.first().attr({ 'class': 'selected' });
            ppMenuEntries.mouseover(function (e) { if (e.target.className != 'selected') e.target.className = 'targeted' });
            ppMenuEntries.mouseout(function (e) { if (e.target.className != 'selected') e.target.className = '' });

            // All together
            ppMainParts = $([ppFrame, ppMenu]).map(function () { return this[0]; });
            ppMainParts.data('ondataload', function () {
                if (ppBackScreen.is(':visible')) {
                    ppPages.trigger('onrender');
                    ppMainParts.show();
                }
            });
            $('body>div>div').mousedown(function (e) {
                if (!ppMainParts.is($(e.target)) && !ppMainParts.find($(e.target)).length) {
                    ppBackScreen.hide();
                    ppMainParts.hide();
                }
            });
            $(window).resize(resizePanel);
        }

        // Show
        ppBackScreen.show();
        fillProfile(ppMainParts.data('ondataload'), function () { ppBackScreen.hide(); });
        resizePanel();
    };

    var fillProfile = function (onsuccess, onerror) {
        sendCrossDomainJSONRequest(mykosmosnimki + "/currentuser.ashx", function (response) {
            if (parseResponse(response) && response.Result) {
                var content = $('.profilePanel-content');
                content.find('.Email').text(response.Result[0].Email);
                content.find('.PasswordState').text(_gtxt('ProfilePlugin.passwordSaved'));
                content.find('.Login').val(response.Result[0].Login);
                content.find('.FullName').val(response.Result[0].FullName);
                content.find('.Phone').val(response.Result[0].Phone);
                content.find('.Company').val(response.Result[0].Company);
                content.find('.CompanyProfile').val(response.Result[0].CompanyProfile);
                content.find('.CompanyPosition').val(response.Result[0].CompanyPosition);
                content.find('.Subscribe').prop('checked', response.Result[0].Subscribe);
                content.find('.IsCompany').prop('checked', response.Result[0].IsCompany);
                fillBillingPage(content, response);
                fillDeveloperPage(content, response);
                onsuccess();
            }
            else {
                onerror();
            }
        });
    }

    var fillBillingPage = function (content, response) {
        content.find('.FileStorageUsed').text((response.Result[0].FileStorageUsed / 1000000).toFixed(2) + 'мб');
        content.find('.FileStorageRemain').text(response.Result[0].FileStorageAvailable == null ? '' : ((response.Result[0].FileStorageAvailable - response.Result[0].FileStorageUsed) / 1000000).toFixed(2) + 'мб');
        content.find('.VectorLayerStorageUsed').text((response.Result[0].VectorLayerStorageUsed / 1000000).toFixed(2) + 'мб');
        content.find('.VectorLayerStorageRemain').text(response.Result[0].VectorLayerStorageAvailable == null ? '' : ((response.Result[0].VectorLayerStorageAvailable - response.Result[0].VectorLayerStorageUsed) / 1000000).toFixed(2) + 'мб');
        content.find('.VectorLayers').text(response.Result[0].VectorLayers);
        content.find('.VectorLayerObjects').text(response.Result[0].VectorLayerObjects);

        content.find('.SmsAvailable').text(response.Result[0].SmsAvailable == null || response.Result[0].SmsAvailable > 0 ? 'да' : 'нет');
        content.find('.SubscriptionUsed').text(response.Result[0].SubscriptionUsed != null ? response.Result[0].SubscriptionUsed : '');
        content.find('.SubscriptionRemain').text(response.Result[0].SubscriptionRemain != null ? response.Result[0].SubscriptionRemain : '');
    }

    var fillDeveloperPage = function (content, response) {
        content.find('.AppName').val(response.Result[0].AppName);
        content.find('.ClientID').text(response.Result[0].ID);
        content.find('.ClientSecret').text(response.Result[0].ClientSecret);
        content.find('.RedirectUri').val(response.Result[0].RedirectUri);
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
    },
    {
        css: 'ProfilePlugin.css',
        init: function (module, path) {
            initTranslations();
        }
    });
})(jQuery)

