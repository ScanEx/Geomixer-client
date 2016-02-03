
(function ($) {
    var mykosmosnimki = "http://my.kosmosnimki.ru"; //

    var initTranslations = function () {


        _translationsHash.addtext("rus", { ProfilePlugin: {

            profile: "Профиль",
            billing: "Биллинг",
            developer: "Разработчикам",

            email: "Электронная почта",
            login: "Псевдоним",
            fullName: "Полное имя",
            phone: "Телефон",
            company: "Название организации",
            companyProfile: "Вид деятельности организации",
            companyPosition: "Должность",
            isCompany: "Я выступаю от имени организации",
            subscribe: "Я согласен получать сообщения по почте",
            saveChanges: "Сохранить",

            used: "используется",
            remain: "осталось",
            fileStorage: "Файлы",
            fileStorageUsed: "Хранилище файлов используется",
            fileStorageRemain: "Хранилище файлов осталось",
            vectorLayerStorage: "Векторные данные",
            vectorLayerStorageUsed: "Хранилище векторных слоев используется",
            vectorLayerStorageRemain: "Хранилище векторных слоев осталось",
            subscription: "Подписок (Live Alerts)",
            subscriptionUsed: "Подписок (Live Alerts) имеется",
            subscriptionRemain: "Подписок (Live Alerts) осталось",
            smsAvailable: "Sms (Live Alerts) доступны",

            apiKeys: "API-ключи",
            apiKeyInvite: "Для получения ключей воспользуйтесь соответсвующими ссылками",
            apiKeyDomain: "API-Ключа для домена (для сайтов)",
            apiKeyDirect: "API-Ключа прямого доступа (для приложений)",
            apiKeyList: "Список API-ключей",

            directKeyPurpose1: "Ключ прямого доступа используется для подключения данных в настольных ГИС-приложениях и в иных случаях, когда использование сайта и клиентского API невозможно.",
            directKeyPurpose2: "Ключ прямого доступа не может быть использован на сайте.",
            keyDomain: "Сайт:",
            keyLicense: "Лицензия:",
            keyAgreement: "я согласен с ",
            keyConditions: "условиями использования",
            apiKeyGet: "Получить ключ",

            clientRegistration: "Регистрация oAuth клиента",
            appName: "Название приложения",
            clientID: "ID клиента (client_id)",
            clientSecret: "oAuth ключ клиента (client_secret)",
            redirectUri: "URI скрипта обратного вызова (redirect_uri)",
            registerClient: "Получить новый ключ",

            password: "Пароль",
            getNew: "изменить",
            cancelNew: "закрыть",
            passwordSaved: "сохранен",
            passwordChanged: "изменен",
            old: "Старый пароль",
            newp: "Новый пароль",
            repeat: "Повтор пароля",
            submitp: "Изменить",

            megabyte: " мБ",
            yes: "да",
            no: "нет",

            ErrorNOT_AUTHORIZED: "Пользователь не авторизован",
            ErrorLoginEmpty: "Требуется указать псевдоним!",
            ErrorLoginFormat: "Неправильный псевдоним! Допустимый вариант ",
            ErrorLoginExists: "Псевдоним уже используется!",
            ErrorAppName: "Не указано название приложения!",
            ErrorRedirectUri: "Требуется действительный uri обратного вызыва!",
            ErrorOldPassword: "Старый пароль указан неверно!",
            ErrorNewPassword: "Пароль не может быть пустым!",
            ErrorNotMatch: "Введённые пароли не совпадают!",

            ErrorCapchaRequired: "Введите число!",
            ErrorWrongCapcha: "Числа не совпадают!",
            ErrorEmailEmpty: "Требуется указать email!",
            ErrorWrongEmail: "Недопустимый адрес электронной почты!",
            ErrorEmailExists: "Такой адрес электронной почты уже зарегистрирован!",

            dataUpdateSuccess: "Изменения сохранены",

            registration: "Регистрация",
            registrationPageAnnotation: "Введите ваш адрес электронной почты, укажите желаемый пароль и число с картинки",
            capcha: "Введите число",
            register: "Зарегистрироваться",
            backOn: "Повторить",
            loginPage: "вход"

        }
        });

        _translationsHash.addtext("eng", { ProfilePlugin: {
            profile: "Profile",
            billing: "Billing",
            developer: "Developer",

            email: "Email",
            login: "Nickname",
            fullName: "Full name",
            phone: "Phone",
            company: "Company",
            companyProfile: "Type of company activity",
            companyPosition: "Company position",
            isCompany: "I am speaking on behalf of the organization",
            subscribe: "I agree to receive updates and news by email",
            saveChanges: "Save",

            used: "used",
            remain: "rest",
            fileStorage: "Files",
            fileStorageUsed: "File storage consumtion",
            fileStorageRemain: "File storage remain",
            vectorLayerStorage: "Vector data",
            vectorLayerStorageUsed: "Vector storage consumption",
            vectorLayerStorageRemain: "Vector storage remain",
            subscription: "Subscriptions",
            subscriptionUsed: "Subscription consumption",
            subscriptionRemain: "Subscription remain",
            smsAvailable: "Sms",

            apiKeys: "API-keys",
            apiKeyInvite: "To get a key use apropriate links below",
            apiKeyDomain: "Domain API-key (for sites)",
            apiKeyDirect: "Direct access API-key (for applications)",
            apiKeyList: "Issued API-keys list",

            directKeyPurpose1: "Ключ прямого доступа используется для подключения данных в настольных ГИС-приложениях и в иных случаях, когда использование сайта и клиентского API невозможно.",
            directKeyPurpose2: "Ключ прямого доступа не может быть использован на сайте.",
            keyDomain: "Site:",
            keyLicense: "License:",
            keyAgreement: "я согласен с ",
            keyConditions: "условиями использования",
            apiKeyGet: "Get the key",

            clientRegistration: "oAuth Client Registration",
            appName: "Client Application",
            clientID: "Client ID (client_id)",
            clientSecret: "Client secret key (client_secret)",
            redirectUri: "Redirect endpoint URI",
            registerClient: "Issue new secret key",

            password: "Password",
            getNew: "change",
            cancelNew: "close",
            passwordSaved: "saved",
            passwordChanged: "changed",
            old: "Old password",
            newp: "New password",
            repeat: "Repeat",
            submitp: "Change",

            megabyte: " MB",
            yes: "yes",
            no: "no",

            ErrorNOT_AUTHORIZED: "Authorization is required!",
            ErrorLoginEmpty: "Nickname is required!",
            ErrorLoginFormat: "Invalid nickname! Allowable nickname ",
            ErrorLoginExists: "Nickname duplicates!",
            ErrorAppName: "Application name is required!",
            ErrorRedirectUri: "Valid redirect uri is required!",
            ErrorOldPassword: "Password is invalid!",
            ErrorNewPassword: "Password is required!",
            ErrorNotMatch: "Passwords does not match!",

            ErrorCapchaRequired: "Input a number!",
            ErrorWrongCapcha: "Number mismatch!",
            ErrorEmailEmpty: "Email is required!",
            ErrorWrongEmail: "Invalid email!",
            ErrorEmailExists: "Email duplicates!",

            dataUpdateSuccess: "Saved successfully",

            registration: "Registration",
            registrationPageAnnotation: "Please fill all fields",
            capcha: "Input a number",
            register: "Register",
            backOn: "Back to",
            loginPage: "Login"


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
            var ppScrollableContainer = $('<div class="profilePanel-scrollable"></div>');
            var ppMenu = $('<div class="profilePanel-menu"></div>');
            var wait = $('<div class="Wait"><img src="img/progress.gif"></div>');
            var success = $('<div class="UpdateMessage"><div class="success">' + _gtxt('ProfilePlugin.dataUpdateSuccess') + '</div></div>');
            var fail = $('<div class="UpdateMessage"><div class="fail">' + 'Error' + '</div></div>');

            // Pages
            var pageTemplate =
                '<div class="page">' +
                    '{{#each items}}' +
                        '{{#if form_caption}}' +
                            '<div class="form-caption {{#if first}}first{{/if}}">{{text}}</div>' +
                        '{{/if}}' +
                        '{{#if span}}' +
                            '<div>{{text}}: <span {{#if id}}class="{{id}}"{{/if}}></span></div>' +
                        '{{/if}}' +
                        '{{#if span_nl}}' +
                            '<div>{{text}}:<br/><span {{#if id}}class="{{id}}"{{/if}}></span></div>' +
                        '{{/if}}' +
                        '{{#if block}}' +
                            '<div>' +
                                '{{#content}}' +
                                    '{{#if p}}<p>{{text}}</p>{{/if}}' +
                                    '{{#if link_button}}<div {{#if id}}class="{{id}} link_button"{{/if}}>{{text}}</div>{{/if}}' +
                                '{{/content}}' +
                            '</div>' +
                        '{{/if}}' +
                        '{{#if text_input}}' +
                            '<div onclick="$(this).children().focus()" class="editable">{{text}}: <input {{#if id}}class="{{id}}"{{/if}} type="text" value=""></div>' +
                        '{{/if}}' +
                        '{{#if text_area}}' +
                            '<div onclick="$(this).children().focus()" class="editable">{{text}}: <textarea {{#if id}}class="{{id}}"{{/if}}></textarea></div>' +
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
                                '<tr><td><input type="checkbox" class="{{id}}" id="pp{{id}}"></td><td><label for="pp{{id}}">{{text}}</label></td></tr>' +
                            '{{/each}}' +
                            '</table>' +
                        '{{/if}}' +
                        '{{#if table}}' +
                            '<table border=0 class="{{id}}">' +
                            '{{#columns}}' + '<tr><th>{{column1}}</th><th>{{column2}}</th><th>{{column3}}</th></tr>' + '{{/columns}}' +
                            '{{#rows}}' + '<tr>{{#cells}}<td class="{{id}}">{{text}}</td>{{/cells}}</tr>' + '{{/rows}}' +
                            '</table>' +
                        '{{/if}}' +
                    '{{/each}}' +
                '</div>';
            var page1 = $(Handlebars.compile(pageTemplate)(
            { id: "page1", items: [
                { span: true, id: "Email", text: _gtxt('ProfilePlugin.email') },
                { text_input: true, id: "Login LoginEmpty LoginFormat LoginExists correct", text: _gtxt('ProfilePlugin.login') },
                { text_input: true, id: "FullName correct", text: _gtxt('ProfilePlugin.fullName') },
                { text_input: true, id: "Phone correct", text: _gtxt('ProfilePlugin.phone') },
                { text_input: true, id: "Company correct", text: _gtxt('ProfilePlugin.company') },
                { text_input: true, id: "CompanyProfile correct", text: _gtxt('ProfilePlugin.companyProfile') },
                { text_input: true, id: "CompanyPosition correct", text: _gtxt('ProfilePlugin.companyPosition') },
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
                { table: true, id: "ResourceTable",
                    columns: [{ column1: "", column2: _gtxt('ProfilePlugin.used'), column3: _gtxt('ProfilePlugin.remain')}],
                    rows: [
                        { cells: [
                        { id: "FileStorage", text: _gtxt('ProfilePlugin.fileStorage') },
                        { id: "FileStorageUsed value", text: "b1" },
                        { id: "FileStorageRemain value", text: "c1"}]
                        },
                        { cells: [
                        { id: "VectorLayerStorage", text: _gtxt('ProfilePlugin.vectorLayerStorage') },
                        { id: "VectorLayerStorageUsed value", text: "b2" },
                        { id: "VectorLayerStorageRemain value", text: "c2"}]
                        },
                        { cells: [
                        { id: "Subscription", text: _gtxt('ProfilePlugin.subscription') },
                        { id: "SubscriptionUsed value", text: "b3" },
                        { id: "SubscriptionRemain value", text: "c3"}]
                        }
                    ]

                },
                { span: true, id: "SmsAvailable", text: _gtxt('ProfilePlugin.smsAvailable') }
            ]
            })).appendTo(ppFrame),
            page3 = $(Handlebars.compile(pageTemplate)(
            { id: "page3", items: [
                { form_caption: true, text: _gtxt('ProfilePlugin.apiKeys'), first: true },
                { block: true, content: [{ link_button: true, text: _gtxt('ProfilePlugin.apiKeyList'), id: "apiKeyList"}] },
                { block: true, content: [
                     { p: true, text: _gtxt('ProfilePlugin.apiKeyInvite') },
                     { link_button: true, text: _gtxt('ProfilePlugin.apiKeyDomain'), id: "apiKeyDomain" },
                     { link_button: true, text: _gtxt('ProfilePlugin.apiKeyDirect'), id: "apiKeyDirect" }
                ]
                },
                { form_caption: true, text: _gtxt('ProfilePlugin.clientRegistration') },
                { text_input: true, id: "AppName correct", text: _gtxt('ProfilePlugin.appName') },
                { span: true, id: "ClientID", text: _gtxt('ProfilePlugin.clientID') },
                { span_nl: true, id: "ClientSecret", text: _gtxt('ProfilePlugin.clientSecret') },
                { text_input: true, id: "RedirectUri correct", text: _gtxt('ProfilePlugin.redirectUri') },
                { error: true },
                { button_input: true, id: "RegisterClient", text: _gtxt('ProfilePlugin.registerClient') }
            ]
            })).appendTo(ppFrame);

            // Profile submit
            var successmess_timeout;
            page1.find('.SaveChanges').click(function () {
                changePassForm.slideUp("fast");
                changePassControls.first().text(_gtxt('ProfilePlugin.getNew'));
                success.hide();
                wait.show();
                clearTimeout(successmess_timeout);

                sendCrossDomainPostRequest(mykosmosnimki + "/Handler/Settings", { WrapStyle: 'message',
                    Login: page1.find('.Login').val().trim(),
                    FullName: page1.find('.FullName').val().trim(),
                    Phone: page1.find('.Phone').val().trim(),
                    Company: page1.find('.Company').val().trim(),
                    Profile: page1.find('.CompanyProfile').val().trim(),
                    Position: page1.find('.CompanyPosition').val().trim(),
                    IsCompany: page1.find('.IsCompany').is(":checked"),
                    Subscribe: page1.find('.Subscribe').is(":checked")
                },
                      function (response) {
                          wait.hide();
                          if (response.Status.toLowerCase() == 'ok' && response.Result) {
                              page1.children('.ErrorSummary').text('error').css('visibility', 'hidden');
                              success.show();
                              successmess_timeout = setTimeout(function () { success.hide(); }, 2000);
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
            var newsecret_timeout;
            page3.find('.RegisterClient').click(function () {

                closeApiKeyDialog();

                wait.show();
                var client_secret = page3.find('.ClientSecret').removeClass('new');
                clearTimeout(newsecret_timeout);

                sendCrossDomainPostRequest(mykosmosnimki + "/Handler/RegisterClient", { WrapStyle: 'message',
                    AppName: page3.find('.AppName').val(), RedirectUri: page3.find('.RedirectUri').val()
                },
                      function (response) {
                          wait.hide();
                          if (response.Status.toLowerCase() == 'ok' && response.Result) {
                              client_secret.addClass('new').text(response.Result.Key);
                              newsecret_timeout = setTimeout(function () { client_secret.removeClass('new'); }, 2000);
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
                '{{i "ProfilePlugin.newp"}}: <input type="password" class="NewPassword NotMatch" value=""><br/>' +
                '{{i "ProfilePlugin.repeat"}}: <input type="password" class="PasswordRepeat NotMatch" value=""><br/>' +
                '<div class="ErrorSummary">error</div>' +
                '<div><input type="button" class="ChangePassword" value="{{i "ProfilePlugin.submitp"}}"></div>' +
            '</div>')());
            changePassForm.insertAfter(changePassControls.last());
            changePassForm.find('.ChangePassword').click(function () {
                clearPageErrors($(this));
                clearPageErrors(page1);
                wait.show();
                sendCrossDomainPostRequest(mykosmosnimki + "/Handler/ChangePassword", { WrapStyle: 'message',
                    oldpassword: changePassForm.children('.OldPassword').val().trim(),
                    password: changePassForm.children('.NewPassword').val().trim(),
                    repeat: changePassForm.children('.PasswordRepeat').val().trim()
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
                if (changePassForm.is(':visible')) {
                    changePassForm.slideUp("fast");
                    $(this).text(_gtxt('ProfilePlugin.getNew'));
                } else {
                    changePassForm.slideDown("fast");
                    $(this).text(_gtxt('ProfilePlugin.cancelNew'));
                    changePassForm.trigger('onrender');
                }
            });

            // API-keys dialogs
            var closeApiKeyDialog = function () {
                if ($('.apiKeyForm').length > 0)
                    removeDialog($('.apiKeyForm').parent()[0]);
            },
            showApiKeyForm = function (key_type) {
                if ($('.apiKeyForm').length > 0)
                    return;
                clearPageErrors($('.page:visible'));
                var fordirect = key_type == 'Direct' ?
                '<tr><td colspan="2">{{i "ProfilePlugin.directKeyPurpose1"}}</td></tr>' +
                '<tr><td colspan="2">{{i "ProfilePlugin.directKeyPurpose2"}}</td></tr>'
                : '';
                var fordomain = key_type == 'Domain' ?
                '<tr><td colspan="2">{{i "ProfilePlugin.keyDomain"}}<input type="text" tabindex="2" class="Site" value="http://"></td></tr>'
                : '';
                var akForm = $(Handlebars.compile('<div class="apiKeyForm"><div class="first"><table border="0">' +
                //'<tr><td colspan="3">'+//'Пожалуйста, ознакомьтесь с <span class="showLicence">условиями использования</span>' +
                //'' +
                //'</td></tr>' +
                '<tr><td colspan="2">{{i "ProfilePlugin.keyLicense"}}</td></tr>' +
                '<tr><td style="width:1%"><input type="checkbox" tabindex="1" id="agree" class="agree"></td><td><label for="agree">{{i "ProfilePlugin.keyAgreement"}}</label><span class="showLicence">{{i "ProfilePlugin.keyConditions"}}</span></td></tr>' +
                '<tr><td colspan="2"><div class="licence"></div></td></tr>' +
                fordomain +
                fordirect +
                '<tr><td colspan="2"><div class="spacer"></div></td></tr>' +
                '<tr><td colspan="2" class="submit"><div class="ErrorSummary">error</div><input tabindex="3" type="button" value="{{i "ProfilePlugin.apiKeyGet"}}"/></td></tr>' +
                '</table></div>')());
                var licence = akForm.find('.licence').hide();
                if (key_type == 'Domain')
                    akForm.find('.spacer').height('50px');
                var initH = 320;
                akForm.find('.showLicence').click(function () {
                    if (licence.is(':visible')) {
                        //akForm.parent().dialog("option", "height", initH);
                        licence.slideUp("fast");
                    } else {
                        //if (key_type == 'Direct') akForm.parent().dialog("option", "height", 380);
                        licence.slideDown("fast");
                    }
                });
                window.showDialog(_gtxt('ProfilePlugin.apiKey' + key_type), akForm[0], 555, initH);
                akForm.parent('.ui-dialog-content').css('overflow', 'hidden');
                licence.load('plugins/profileplugin/license.html', function () { licence.mCustomScrollbar() });
                /*
                var registrationForm = $(Handlebars.compile('<table class="registrationForm" border="0">' +
                '<tr><td colspan="2" class="header">{{i "ProfilePlugin.registrationPageAnnotation"}}</td></tr>' +
                '<tr><td colspan="2">{{i "ProfilePlugin.email"}} <input type="text" tabindex="1" class="Login EmailEmpty WrongEmail EmailExists"/></td></tr>' +
                '<tr>' +
                '<td>' +
                '<table border="0"><tr><td>{{i "ProfilePlugin.password"}}</td><td align="right"><input tabindex="2" type="password" class="Password NewPassword NotMatch"/></td></tr></table>' +
                '<table border="0"><tr><td>{{i "ProfilePlugin.login"}}</td><td align="right"><input type="text" tabindex="4" class="NickName LoginEmpty LoginFormat LoginExists"/></td></tr></table>' +
                '</td>' +
                '<td>' +
                '<table border="0">' +
                '<tr><td>{{i "ProfilePlugin.repeat"}}</td><td colspan="2" align="right"><input type="password" tabindex="3" class="Repeat NotMatch"/></td></tr>' +
                '<tr><td>{{i "ProfilePlugin.capcha"}}</td><td align="left"><input type="text" tabindex="5" class="Capcha CapchaRequired WrongCapcha"/></td><td align="right"><img src="' + mykosmosnimki + '/Account/Captcha/sort?r=' + Math.round(Math.random() * Math.pow(10, 9)) + '"></td></tr>' +
                '</table>' +
                '</td>' +
                '</tr>' +
                '<tr><td colspan="2" class="submit"><div class="ErrorSummary">error</div><input tabindex="6" type="button" value="{{i "ProfilePlugin.register"}}"/></td></tr>' +
                //'<tr><td colspan="3" class="footer">{{i "ProfilePlugin.backOn"}} <span class="entrance">{{i "ProfilePlugin.loginPage"}}</span></td></tr>' +
                '</table>')()),
                regFormDialog,
                submit = registrationForm.find('input[type="button"]').click(function () {
                //wait.show();
                sendCrossDomainPostRequest(mykosmosnimki + "/Handler/Registration", { WrapStyle: 'message',
                email: registrationForm.find('.Login').val(),
                login: registrationForm.find('.NickName').val(),
                password: registrationForm.find('.Password').val(),
                repeat: registrationForm.find('.Repeat').val(),
                captcha: registrationForm.find('.Capcha').val(),
                debug: true
                },
                function (response) {
                //wait.hide();
                if (response.Status.toLowerCase() == 'ok' && response.Result) {
                removeDialog(regFormDialog);
                afterRegistration();
                }
                else {
                clearError();
                registrationForm.find(':password,:text').filter(function () { return $(this).val() == ""; }).addClass('error');
                if (response.Result.length > 0 && response.Result[0].Key) {
                registrationForm.find('.ErrorSummary').text(
                _gtxt('ProfilePlugin.Error' + response.Result[0].Key) + " " + response.Result[0].Value.Errors[0].ErrorMessage)
                .css('visibility', 'visible');
                registrationForm.find('.' + response.Result[0].Key).addClass('error');
                }
                else {
                registrationForm.find('.ErrorSummary').text(_gtxt('ProfilePlugin.Error' + response.Result.Message)).css('visibility', 'visible');
                registrationForm.find('.' + response.Result.Message).addClass('error');
                }
                registrationForm.find('img').attr("src", mykosmosnimki + '/Account/Captcha/sort?r=' + Math.round(Math.random() * Math.pow(10, 9)));
                }
                });
                });
                var clearError = function () {
                registrationForm.find('.error').removeClass('error');
                registrationForm.find('.ErrorSummary').css('visibility', 'hidden');
                registrationForm.find('.Capcha').val("");
                };
                registrationForm.find('input[type="text"], input[type="password"]')
                .keydown(function (e) {
                if (e.which == 13)
                submit.click();
                })
                .focusin(clearError);
                regFormDialog = window.showDialog(_gtxt('ProfilePlugin.registration'), registrationForm[0], 605, 300);
                return regFormDialog;
                */
            };
            page3.find('.apiKeyDomain').click(function () { showApiKeyForm('Domain'); });
            page3.find('.apiKeyDirect').click(function () { showApiKeyForm('Direct'); });

            /////////////////////////////

            ppPages.find('input[type="text"], input[type="password"]').keyup(function (e) {
                if (e.which == 13) {
                    var submit = $(this).siblings('div').children('input[type="button"]');
                    if (!submit.length)
                        submit = $(this).parent('div').siblings('input[type="button"]');
                    submit.click();
                }
                clearInputErrors($(this));
            })
            .focusin(function (e) {
                closeApiKeyDialog();
                clearInputErrors($(this));
            });

            // Error display
            var clearInputErrors = function (input) {
                if (input.val().search(/\S/) != -1) {
                    var es = input.nextAll('.ErrorSummary');
                    if (es.length == 0)
                        es = input.parent().nextAll('.ErrorSummary');
                    es.text('error').css('visibility', 'hidden');
                    if (input.is('.NotMatch')) {
                        var s = input.siblings('.NotMatch');
                        if (s.val() === input.val()) {
                            input.removeClass('error');
                            s.removeClass('error');
                        }
                    }
                    else {
                        input.removeClass('error').addClass('correct');
                    }
                }
            }
            var clearPageErrors = function (page) {
                page.find('.ErrorSummary').text('error').css('visibility', 'hidden');
                page.find('.error').removeClass('error');
            }
            changePassForm.bind('onerror', function (e, m) {
                $(this).children('.ErrorSummary').text(_gtxt('ProfilePlugin.Error' + m)).css('visibility', 'visible');
                $(this).find('.' + m).addClass('error');
                $(this).find(':password,:text').filter(function () { return $(this).val() == ""; }).addClass('error');
                return false;
            });
            changePassForm.bind('onrender', function () {
                $(this).children('input[type="password"]').val('');
                clearPageErrors($(this));
                clearPageErrors(page1);
                return false;
            });
            ppPages.bind('onerror', function (e, m1, m2) {
                var m = _gtxt('ProfilePlugin.Error' + m1);
                if (m2)
                    m += " " + m2;
                $(this).children('.ErrorSummary').text(m).css('visibility', 'visible');
                $(this).find('.' + m1).removeClass('correct').addClass('error');
                return false;
            })
            ppPages.bind('onrender', function () {
                clearPageErrors($(this));
                changePassForm.hide();
                return false;
            });

            ppPages.first().show();
            ppScrollableContainer.hide().appendTo('#all').append(ppFrame);

            // Menu
            var menuEntryTemplate = '<div class="MenuEntry">{{text}}</div>';
            var showPage = function (e, page) {

                closeApiKeyDialog();

                ppMenu.children('.MenuEntry').removeClass('selected');
                ppPages.hide();
                page.show();
                $(e.target).removeClass('targeted').addClass('selected');
                page.trigger('onrender');
            };
            $(Handlebars.compile(menuEntryTemplate)({ text: _gtxt('ProfilePlugin.profile') })).appendTo(ppMenu).click(function (e) { showPage(e, page1); });
            $(Handlebars.compile(menuEntryTemplate)({ text: _gtxt('ProfilePlugin.billing') })).appendTo(ppMenu).click(function (e) { showPage(e, page2); });
            $(Handlebars.compile(menuEntryTemplate)({ text: _gtxt('ProfilePlugin.developer') })).appendTo(ppMenu).click(function (e) { showPage(e, page3); });

            wait.appendTo(ppMenu).hide();
            success.appendTo(ppMenu).hide();
            fail.appendTo(ppMenu).hide();
            ppMenu.hide().appendTo('#all');
            var ppMenuEntries = ppMenu.children('.MenuEntry');
            ppMenuEntries.first().addClass('selected');
            ppMenuEntries.mouseover(function (e) { if (!$(e.target).is('.selected')) $(e.target).addClass('targeted') });
            ppMenuEntries.mouseout(function (e) { if (!$(e.target).is('.selected')) $(e.target).removeClass('targeted') });

            // All together
            ppMainParts = $([ppScrollableContainer, ppMenu]).map(function () { return this[0]; });
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
                    closeApiKeyDialog();
                }
            });
            ppScrollableContainer.mCustomScrollbar();
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
    };

    var fillBillingPage = function (content, response) {
        content.find('.FileStorageUsed').text((response.Result[0].FileStorageUsed / 1000000).toFixed(2) + _gtxt('ProfilePlugin.megabyte'));
        content.find('.FileStorageRemain').text(response.Result[0].FileStorageAvailable == null ? '' : ((response.Result[0].FileStorageAvailable - response.Result[0].FileStorageUsed) / 1000000).toFixed(2) + _gtxt('ProfilePlugin.megabyte'));
        content.find('.VectorLayerStorageUsed').text((response.Result[0].VectorLayerStorageUsed / 1000000).toFixed(2) + _gtxt('ProfilePlugin.megabyte'));
        content.find('.VectorLayerStorageRemain').text(response.Result[0].VectorLayerStorageAvailable == null ? '' : ((response.Result[0].VectorLayerStorageAvailable - response.Result[0].VectorLayerStorageUsed) / 1000000).toFixed(2) + _gtxt('ProfilePlugin.megabyte'));
        content.find('.VectorLayers').text(response.Result[0].VectorLayers);
        content.find('.VectorLayerObjects').text(response.Result[0].VectorLayerObjects);

        content.find('.SmsAvailable').text(response.Result[0].SmsAvailable == null || response.Result[0].SmsAvailable > 0 ? _gtxt('ProfilePlugin.yes') : _gtxt('ProfilePlugin.no'));
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

    var showRegistrationForm = function (afterRegistration) {
        var registrationForm = $(Handlebars.compile('<table class="registrationForm" border="0">' +
        '<tr><td colspan="2" class="header">{{i "ProfilePlugin.registrationPageAnnotation"}}</td></tr>' +
        '<tr><td colspan="2">{{i "ProfilePlugin.email"}} <input type="text" tabindex="1" class="Login EmailEmpty WrongEmail EmailExists"/></td></tr>' +
        '<tr>' +
            '<td>' +
                '<table border="0"><tr><td>{{i "ProfilePlugin.password"}}</td><td align="right"><input tabindex="2" type="password" class="Password NewPassword NotMatch"/></td></tr></table>' +
                '<table border="0"><tr><td>{{i "ProfilePlugin.login"}}</td><td align="right"><input type="text" tabindex="4" class="NickName LoginEmpty LoginFormat LoginExists"/></td></tr></table>' +
            '</td>' +
            '<td>' +
                '<table border="0">' +
                    '<tr><td>{{i "ProfilePlugin.repeat"}}</td><td colspan="2" align="right"><input type="password" tabindex="3" class="Repeat NotMatch"/></td></tr>' +
                    '<tr><td>{{i "ProfilePlugin.capcha"}}</td><td align="left"><input type="text" tabindex="5" class="Capcha CapchaRequired WrongCapcha"/></td><td align="right"><img src="' + mykosmosnimki + '/Account/Captcha/sort?r=' + Math.round(Math.random() * Math.pow(10, 9)) + '"></td></tr>' +
                '</table>' +
            '</td>' +
        '</tr>' +
        '<tr><td colspan="2" class="submit"><div class="ErrorSummary">error</div><input tabindex="6" type="button" value="{{i "ProfilePlugin.register"}}"/></td></tr>' +
        //'<tr><td colspan="3" class="footer">{{i "ProfilePlugin.backOn"}} <span class="entrance">{{i "ProfilePlugin.loginPage"}}</span></td></tr>' +
        '</table>')()),
        regFormDialog,
        submit = registrationForm.find('input[type="button"]').click(function () {
            //wait.show();
            sendCrossDomainPostRequest(mykosmosnimki + "/Handler/Registration", { WrapStyle: 'message',
                email: registrationForm.find('.Login').val(),
                login: registrationForm.find('.NickName').val(),
                password: registrationForm.find('.Password').val(),
                repeat: registrationForm.find('.Repeat').val(),
                captcha: registrationForm.find('.Capcha').val(),
                debug: true
            },
            function (response) {
                //wait.hide();
                if (response.Status.toLowerCase() == 'ok' && response.Result) {
                    removeDialog(regFormDialog);
                    afterRegistration();
                }
                else {
                    clearError();
                    registrationForm.find(':password,:text').filter(function () { return $(this).val() == ""; }).addClass('error');
                    if (response.Result.length > 0 && response.Result[0].Key) {
                        registrationForm.find('.ErrorSummary').text(
                        _gtxt('ProfilePlugin.Error' + response.Result[0].Key) + " " + response.Result[0].Value.Errors[0].ErrorMessage)
                        .css('visibility', 'visible');
                        registrationForm.find('.' + response.Result[0].Key).addClass('error');
                    }
                    else {
                        registrationForm.find('.ErrorSummary').text(_gtxt('ProfilePlugin.Error' + response.Result.Message)).css('visibility', 'visible');
                        registrationForm.find('.' + response.Result.Message).addClass('error');
                    }
                    registrationForm.find('img').attr("src", mykosmosnimki + '/Account/Captcha/sort?r=' + Math.round(Math.random() * Math.pow(10, 9)));
                }
            });
        });
        var clearError = function () {
            registrationForm.find('.error').removeClass('error');
            registrationForm.find('.ErrorSummary').css('visibility', 'hidden');
            registrationForm.find('.Capcha').val("");
        };
        registrationForm.find('input[type="text"], input[type="password"]')
        .keydown(function (e) {
            if (e.which == 13)
                submit.click();
        })
        .focusin(clearError);
        regFormDialog = window.showDialog(_gtxt('ProfilePlugin.registration'), registrationForm[0], 605, 300);
        return regFormDialog;
    };

    gmxCore.addModule('ProfilePlugin', {
        pluginName: 'ProfilePlugin',
        showProfile: showProfile,
        showRegistrationForm: showRegistrationForm,
        afterViewer: function () {
            checkExist = setInterval(function () {
                if (nsGmx.widgets.authWidget && nsGmx.widgets.authWidget.getUserInfo() != null) {
                    if (nsGmx.widgets.authWidget.getUserInfo().Login != null) {
                        var a = $('a:contains("' + nsGmx.Translations.getText('auth.myAccount') + '")');
                        a.attr({ 'class': 'dropdownMenuWidget-dropdownItemAnchor' });
                        a.siblings('div').remove();
                        a.attr('href', 'javascript:void(0)');
                        a.removeAttr('target');
                        a.click(function (event) {
                            showProfile();
                            event.stopPropagation();
                        });
                    }
                    else {
                        var showLoginDialog = nsGmx.widgets.authWidget._authManager.login,
                        regForm;
                        nsGmx.widgets.authWidget._authManager.login = function () {
                            if (regForm && $(regForm).is(':visible')) {
                                removeDialog(regForm);
                                regForm = false;
                            }
                            showLoginDialog();
                            var regLink = $(':ui-dialog .registration');
                            regLink.off("click").click(function () {
                                regLink.parents(':ui-dialog').dialog("close");
                                regForm = showRegistrationForm(function () {
                                    window.location.reload();
                                });
                            });
                        };
                    }
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

