!(function () {

nsGmx.SuggestWidget = function(attrNames, textarea, textTemplate, func, valuesArr, addValueFlag, attrType) {
    var _this = this;
    this.textArea = textarea;
    this.func = func;
    this.currentTextArea = textarea[0] || textarea;

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

            $(canvas).append(div);
        } else {
            var div = nsGmx.Utils._div([nsGmx.Utils._t(String(name))], [['dir', 'className', 'suggest-helper-elem']]);

            div.onmouseover = function() {
                var _curDiv = this,
                    attrType;

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

                attrType = valuesArr.getAttributeType(name);

                if (!$(canvas.parentNode).children('[arr=\'' + name + '\']').length) {
                    this.timer = setTimeout(function() {
                        valuesArr.getValuesForAttribute(name, function(attrValues) {
                            if (!attrValues || !$(_curDiv).hasClass('suggest-helper-hover')) { return; }

                            var arrSuggestCanvas = new nsGmx.SuggestWidget(attrValues, [_this.currentTextArea], 'suggest', function()
                            {
                                _this.func && _this.func();

                                $(canvasArr.parentNode.childNodes[2]).fadeOut(100);

                                canvasArr.removeNode(true);
                            }, false, addValueFlag, attrType);

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
                if (this.parentNode.getAttribute('arr') != null) {
                    var isNumber = attrType === 'float' || attrType === 'integer';

                    if (isNumber) {
                        val = val.replace(/,/g, '.')
                    } else {
                        val = '\'' + val + '\'';
                    }

                    if (addValueFlag) {
                        val = '"' + this.parentNode.getAttribute('arr') + '" = ' + val;
                    }
                }

                insertAtCursor(_this.currentTextArea, val, this.parentNode.sel);

                $(canvas).fadeOut(100);

                if (this.timer) {
                    clearTimeout(this.timer);
                }

                $(canvas.parentNode).children('[arr]').fadeOut(100, function()
                {
                    $(this).remove();
                });

                _this.func && _this.func();

                stopEvent(e);
            };

            window._title(div, nsGmx.sqlTemplates[name] || name);

            $(canvas).append(div);
        }

    });
};

nsGmx.SuggestWidget.prototype.setActiveTextArea = function (textArea) {

    for (var i = 0; i < this.textArea.length; i++) {
        if (this.textArea[i] === textArea) {
            this.currentTextArea = this.textArea[i];
            break;
        }
    }
};

nsGmx.SuggestWidget.prototype.setCallback = function (func) {
    this.func = func;
}


/**
 * @param {domElement} targetTextarea textArea to append
 * @param {array} attrNames
 * @param {object} attrValuesProvider
 * @param {function} changeCallback
 * @param {array} selectors array of sub-widgets (attrs, operators, functions)
 */

nsGmx.AttrSuggestWidget = function(targetTextarea, attrNames, attrValuesProvider, changeCallback, selectors) {
    this.changeCallback = changeCallback;
    this.targetTextarea = targetTextarea;

    var template = Handlebars.compile('<div class="suggest-container">' +
        '<table><tbody><tr>' +
            '{{#if attrs}}<td><div class="suggest-link-container selectStyle suggest-attr">{{i "Колонки"}}<span class="ui-icon ui-icon-triangle-1-s"></span></div></td>{{/if}}' +
            '{{#if operators}}<td><div class="suggest-link-container selectStyle suggest-op">{{i "Операторы"}}<span class="ui-icon ui-icon-triangle-1-s"></span></div></td>{{/if}}' +
            '{{#if functions}}<td><div class="suggest-link-container selectStyle suggest-func">{{i "Функции"}}<span class="ui-icon ui-icon-triangle-1-s"></span></div></td>{{/if}}' +
        '</tr></tbody></table>' +
    '</div>');

    var ui = this.el = $(template({
        attrs: selectors.indexOf('attrs') !== -1,
        functions: selectors.indexOf('functions') !== -1,
        operators: selectors.indexOf('operators') !== -1
    }));

    this.attrsSuggest = selectors.indexOf('attrs') !== -1 ? new nsGmx.SuggestWidget(attrNames, targetTextarea, '"suggest"', changeCallback, attrValuesProvider, true) : null;
    this.functionsSuggest = selectors.indexOf('functions') !== -1 ? new nsGmx.SuggestWidget(transformHash(nsGmx.sqlFunctions), targetTextarea, 'suggest()', this.changeCallback) : null;
    this.operatorsSuggest = selectors.indexOf('operators') !== -1 ? new nsGmx.SuggestWidget(['=', '>', '<', '>=', '<=', '<>', 'AND', 'OR', 'NOT', 'IN', 'CONTAINS', 'CONTAINSIGNORECASE', 'BETWEEN', 'STARTSWITH', 'ENDSWITH'], targetTextarea, 'suggest', this.changeCallback) : null;

    this.attrsSuggest && ui.find('.suggest-attr').append(this.attrsSuggest.el);
    this.functionsSuggest && ui.find('.suggest-func').append(this.functionsSuggest.el);
    this.operatorsSuggest && ui.find('.suggest-op').append(this.operatorsSuggest.el);

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

nsGmx.AttrSuggestWidget.prototype.setActiveTextArea = function (textArea) {
    this.attrsSuggest && this.attrsSuggest.setActiveTextArea(textArea);
    this.functionsSuggest && this.functionsSuggest.setActiveTextArea(textArea);
    this.operatorsSuggest && this.operatorsSuggest.setActiveTextArea(textArea);
}

nsGmx.AttrSuggestWidget.prototype.setCallback = function (callback) {
    this.attrsSuggest && this.attrsSuggest.setCallback(callback);
    this.functionsSuggest && this.functionsSuggest.setCallback(callback);
    this.operatorsSuggest && this.operatorsSuggest.setCallback(callback);
}

})();
