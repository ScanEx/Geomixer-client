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
                while (relTarget) {
                    if (relTarget === canvas) { return; }
                    relTarget = relTarget.parentNode;
                }
                $(canvas).fadeOut(300, function() {$(this).remove();});
            } catch (ev) {
                if (target === canvas) {
                    $(canvas).fadeOut(300, function() {$(this).remove();});
				}
            }
        }
    };

    attrNames.forEach(function(name) {
        var div = nsGmx.Utils._div([nsGmx.Utils._t(String(name))], [['dir', 'className', 'suggest-helper-elem']]);

        div.onmouseover = function() {
            var _curDiv = this;
            $(this.parentNode).children('.suggest-helper-hover').removeClass('suggest-helper-hover');
            $(this).addClass('suggest-helper-hover');

            if (!valuesArr) { return; }

            $(canvas.parentNode).children('[arr]').each(function() {
                if (this.getAttribute('arr') !== name) {
                    $(this).fadeOut(300, function() {
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

                                $(canvasArr.parentNode.childNodes[1]).fadeOut(300);

                                canvasArr.removeNode(true);
                            }, false, addValueFlag);

                        var canvasArr = arrSuggestCanvas.el;

                        canvasArr.style.left = '105px';
                        canvasArr.style.height = '70px';
                        canvasArr.style.width = '100px';

                        $(canvasArr).children().css('width', '80px');

                        canvasArr.setAttribute('arr', name);

                        $(canvas.parentNode).append(canvasArr);

                        $(canvasArr).fadeIn(300);
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

            $(canvas).fadeOut(300);

            if (this.timer) {
                clearTimeout(this.timer);
			}

            $(canvas.parentNode).children('[arr]').fadeOut(300, function()
            {
                $(this).remove();
            });

            func && func();

            stopEvent(e);
        };

        window._title(div, name);

        $(canvas).append(div);
    });
};

var template = Handlebars.compile('<div class="suggest-container">' +
    '<table><tbody><tr>' +
        '<td><div class="suggest-link-container suggest-attr">{{i "Атрибут >"}}</div></td>' +
        '<td><div class="suggest-link-container suggest-value">{{i "Значение >"}}</div></td>' +
        '<td><div class="suggest-link-container suggest-op">{{i "Операция >"}}</div></td>' +
    '</tr></tbody></table>' +
'</div>');

nsGmx.AttrSuggestWidget = function(targetTextarea, attrNames, attrValuesProvider, changeCallback) {
    var ui = this.el = $(template());

    var attrsSuggest = new nsGmx.SuggestWidget(attrNames, targetTextarea, '"suggest"', changeCallback, attrValuesProvider, true),
        valuesSuggest = new nsGmx.SuggestWidget(attrNames, targetTextarea, '"suggest"', changeCallback, attrValuesProvider),
        opsSuggest = new nsGmx.SuggestWidget(['=', '>', '<', '>=', '<=', '<>', 'AND', 'OR', 'NOT', 'IN', 'LIKE', '()'], targetTextarea, ' suggest ', changeCallback);

    ui.find('.suggest-attr').append(attrsSuggest.el);
    ui.find('.suggest-value').append(valuesSuggest.el);
    ui.find('.suggest-op').append(opsSuggest.el);

    var clickFunc = function(div) {
        if (document.selection) {
            targetTextarea.focus();
            var sel = document.selection.createRange();
            div.sel = sel;
            targetTextarea.blur();
        }

        ui.find('.attrsHelperCanvas').children('[arr]').fadeOut(300, function() {
            $(this).remove();
        });
    };

    ui.find('.suggest-link-container').click(function() {
        var placeholder = $(this).children('.suggest-helper');
        clickFunc(placeholder[0]);

        ui.find('.suggest-helper').fadeOut(300);
        placeholder.fadeIn(300);
    });

    $(targetTextarea).click(function() {
        ui.find('.suggest-helper').fadeOut(300);
        return true;
    });
};

})();
