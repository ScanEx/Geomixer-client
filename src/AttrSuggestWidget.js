!(function () {

nsGmx.SuggestWidget = function(attrNames, textarea, textTemplate, func, valuesArr, addValueFlag) {

    if (valuesArr && !(valuesArr instanceof nsGmx.ILazyAttributeValuesProvider)) {
        valuesArr = new nsGmx.LazyAttributeValuesProviderFromArray(valuesArr);
    }

    var canvas = this.el = nsGmx.Utils._div(null, [['dir', 'className', 'suggest-helper']]);
    canvas.style.display = 'none';

    canvas.onmouseout = function(e) {
        var evt = e || window.event,
            target = evt.srcElement || evt.target,
            relTarget = evt.relatedTarget || evt.toElement;

        if (canvas.getAttribute('arr')) {
            try {
                while (relTarget && !$(relTarget).hasClass('suggest-helper-elem-group')) {
                    if (relTarget === canvas) { return; }
                    relTarget = relTarget.parentNode;
                }
                $(canvas).fadeOut(100, function() {$(this).remove();});
            } catch (ev) {
                if (target === canvas) {
                    $(canvas).fadeOut(100, function() {$(this).remove();});
				}
            }
        }
    };

    attrNames.forEach(function(name) {
        if (typeof name === 'object') {
            name = name.groupTag;
            var div = nsGmx.Utils._div([nsGmx.Utils._t(String(name))], [['dir', 'className', 'suggest-helper-elem'], ['dir', 'className', 'suggest-helper-elem-group']]);
            $(div).css('margin-top', '3px')
            window._title(div, name);

            $(canvas).append(div);
        } else {
            var div = nsGmx.Utils._div([nsGmx.Utils._t(String(name))], [['dir', 'className', 'suggest-helper-elem']]);

            div.onmouseover = function() {
                var _curDiv = this;
                $(this.parentNode).children('.suggest-helper-hover').removeClass('suggest-helper-hover');
                $(this).addClass('suggest-helper-hover');

                if (!valuesArr) { return; }

                $(canvas.parentNode).children('[arr]').each(function() {
                    if (this.getAttribute('arr') !== name) {
                        $(this).fadeOut(100, function() {
                            $(this).remove();
                        });
                    }
                });

                if (!valuesArr.isAttributeExists(name)) { return; }

                if (!$(canvas.parentNode).children('[arr=\'' + name + '\']').length) {
                    this.timer = setTimeout(function() {
                        valuesArr.getValuesForAttribute(name, function(attrValues) {

                            if (!attrValues || !$(_curDiv).hasClass('suggest-helper-hover')) { return; }

                            var arrSuggestCanvas = new nsGmx.SuggestWidget(attrValues, textarea, 'suggest', function()
                            {
                                func && func();

                                $(canvasArr.parentNode.childNodes[2]).fadeOut(100);

                                canvasArr.removeNode(true);
                            }, false, addValueFlag);

                            var canvasArr = arrSuggestCanvas.el;

                            canvasArr.style.left = '86px';
                            canvasArr.style.height = '220px';
                            canvasArr.style.width = '100px';

                            $(canvasArr).children().css('width', '80px');

                            canvasArr.setAttribute('arr', name);

                            $(canvas.parentNode).append(canvasArr);

                            $(canvasArr).fadeIn(100);
                        });

                    }, 300);
                }
            };

            div.onmouseout = function(e) {
                var evt = e || window.event,
                target = evt.srcElement || evt.target,
                relTarget = evt.relatedTarget || evt.toElement;

                if ($(target).hasClass('suggest-helper-hover') && relTarget === this.parentNode) {
                    $(this).removeClass('suggest-helper-hover');
                }

                if (this.timer) {
                    clearTimeout(this.timer);
                }
            };

            div.onclick = function(e) {
                var val = textTemplate.replace(/suggest/g, name);
                if (this.parentNode.getAttribute('arr') != null)
                {
                    if (isNaN(Number(val))) {
                        val = '\'' + val + '\'';
                    }

                    if (addValueFlag) {
                        val = '"' + this.parentNode.getAttribute('arr') + '" = ' + val;
                    }
                }

                insertAtCursor(textarea, val, this.parentNode.sel);

                $(canvas).fadeOut(100);

                if (this.timer) {
                    clearTimeout(this.timer);
                }

                $(canvas.parentNode).children('[arr]').fadeOut(100, function()
                {
                    $(this).remove();
                });

                func && func();

                stopEvent(e);
            };

            window._title(div, name);

            $(canvas).append(div);
        }

    });
};

var template = Handlebars.compile('<div class="suggest-container">' +
    '<table><tbody><tr>' +
        '<td><div class="suggest-link-container selectStyle suggest-attr">{{i "Колонки"}}<span class="ui-icon ui-icon-triangle-1-s"></span></div></td>' +
        '<td><div class="suggest-link-container selectStyle suggest-op">{{i "Операторы"}}<span class="ui-icon ui-icon-triangle-1-s"></span></div></td>' +
        '<td><div class="suggest-link-container selectStyle suggest-func">{{i "Функции"}}<span class="ui-icon ui-icon-triangle-1-s"></span></div></td>' +
    '</tr></tbody></table>' +
'</div>');

nsGmx.AttrSuggestWidget = function(targetTextarea, attrNames, attrValuesProvider, changeCallback) {
    var ui = this.el = $(template());

    var attrsSuggest = new nsGmx.SuggestWidget(attrNames, targetTextarea, '"suggest"', changeCallback, attrValuesProvider, true),
        functionsSuggest = new nsGmx.SuggestWidget(transformHash(nsGmx.sqlFunctions), targetTextarea, 'suggest(*)', changeCallback),
        opsSuggest = new nsGmx.SuggestWidget(['=', '>', '<', '>=', '<=', '<>', 'AND', 'OR', 'NOT', 'IN'], targetTextarea, 'suggest', changeCallback);

    ui.find('.suggest-attr').append(attrsSuggest.el);
    ui.find('.suggest-func').append(functionsSuggest.el);
    ui.find('.suggest-op').append(opsSuggest.el);

    var clickFunc = function(div) {
        if (document.selection) {
            targetTextarea.focus();
            var sel = document.selection.createRange();
            div.sel = sel;
            targetTextarea.blur();
        }

        ui.find('.attrsHelperCanvas').children('[arr]').fadeOut(100, function() {
            $(this).remove();
        });
    };

    ui.find('.suggest-link-container').click(function(e) {
        var evt = e || window.event,
            target = evt.srcElement || evt.target,
            relTarget = evt.relatedTarget || evt.toElement;

        if (!$(target).hasClass('suggest-helper-elem-group')) {
            var placeholder = $(this).children('.suggest-helper');
            clickFunc(placeholder[0]);

            ui.find('.suggest-helper').fadeOut(100);
            placeholder.fadeIn(100);
        }
    });

    $(targetTextarea).click(function() {
        ui.find('.suggest-helper').fadeOut(100);
        return true;
    });

    /**
     * SQLHASH TRANSFORM HELPER
     */
     function transformHash(hash) {
        var arr = [],
            res = [];

        for (var key in hash) {
            if (hash.hasOwnProperty(key)) {
                res.push({groupTag: key});

                arr = hash[key];
                for (var i = 0; i < arr.length; i++) {
                    res.push(arr[i]);
                }
            }
        }

        return res;
     }
};

})();
