(function() {
    window._translationsHash.addtext("rus", {
        gridPlugin: {
            gridSettings : "Настройка координатной сетки",
            gridColorSettings : "Цвет сетки",
            gridStepSettings : "Шаг сетки",
            set : "установить",
            reset : "сбросить",
            unitsKm : "км"
        }
    });
    window._translationsHash.addtext("eng", {
        gridPlugin: {
            gridSettings : "Coordinate grid settings",
            gridColorSettings : "Grid color",
            gridStepSettings : "Grid step",
            set : "set",
            reset : "reset",
            unitsKm : "km"
        }
    });

    // создает левое меню с параметрами координатной сетки
    var ConfigureGridMenu = function (manager, control) {
        var tempStyle = {
                outline: {
                    color: control.options.color
                }
            },
            lm = new leftMenu();

        // заполняем левое меню
        function createGridLeftMenu() {
            var gridConfigLeftMenu = _div(null, [['dir','className','gridConfigLeftMenu']]);
            createGridConfig(gridConfigLeftMenu);

            return gridConfigLeftMenu;
        }

        // создание элементов отображения настроек сетки
        function createGridConfig(menu) {
            var gridConfigCanvas = _div(null, [['dir','className','gridSettings']]),
                gridConfigTitle = _span(null, [['dir','className','gridSettingsTitle']]),
                gridConfigIcon = CreateGridConfigIcon(tempStyle, 'linestring');

            $(gridConfigTitle).append(_gtxt('gridPlugin.gridSettings'));
            $(gridConfigCanvas).append(gridConfigIcon, gridConfigTitle);
            $(menu).append(gridConfigCanvas);

            gridConfigIcon.onclick = function () {
                createConfigDialog(this);
            };
        }

        // диалоговое окно для редактирования координатной сетки
        function createConfigDialog(elem) {
            var gridConfigEditor = _div(null, [['dir','className','gridConfigEditor']]);

            // редактирование цвета сетки - колорпикер
            var fcp = nsGmx.Controls.createColorPicker(tempStyle.outline.color,
                function (colpkr) {
                    $(colpkr).fadeIn(500);
                    return false;
                },
                function (colpkr) {
                    $(colpkr).fadeOut(500);
                    $(this).change();
                    return false;
                },
                function (hsb, hex, rgb) {
                    tempStyle.outline.color = '#' + hex;
                    fcp.style.backgroundColor = tempStyle.outline.color;
                    control.setColor(tempStyle.outline.color);
          				  $(elem).find(".borderIcon")[0].style.borderColor = tempStyle.outline.color;
                    manager.saveOptions();
                    $(this).ColorPickerSetColor(tempStyle.outline.color);
                    $(this).change();
                }
            );

            $(fcp).ColorPickerSetColor(tempStyle.outline.color);
            $(fcp).css('background-color', tempStyle.outline.color);

            // редактирования шага сетки
            var gridStepConfig = _span(null, [['dir','className','gridStepConfig']]),
                gridStepInput = _input(null, [['dir','className','gridStepInput']]),
                gridStepMeasureUnit = _span([_t(_gtxt('gridPlugin.unitsKm'))], [['dir','className','gridStepUnits']]),
                gridSetStepButton = _button([_t(_gtxt('gridPlugin.set'))], [['dir', 'className', 'gridStepButton']]),
                gridResetStepButton = _button([_t(_gtxt('gridPlugin.reset'))], [['dir', 'className', 'gridStepButton']]);

            gridStepInput.value = control.options.customGridStep;

            gridSetStepButton.onclick = function () {
                control.setStep(gridStepInput.value);
            }

            gridResetStepButton.onclick = function () {
                control.clearStep();
                gridStepInput.value = '';
                gridStepInput.focus();
            }

            $(gridStepConfig).append(gridStepInput, gridStepMeasureUnit, gridSetStepButton, gridResetStepButton);

            $(gridConfigEditor).append(_table([
                _tbody([
                    _tr([
                        _td([_t(_gtxt('gridPlugin.gridColorSettings'))], [['css','width','70px']]),
                        _td([fcp])
                    ]),
                    _tr([
                      _td([_t(_gtxt('gridPlugin.gridStepSettings'))], [['css','width','70px']]),
                      _td([gridStepConfig])
                    ])
                ])
            ]));

            var pos = nsGmx.Utils.getDialogPos(elem, false, 0);

            var closeFunc = function () {
                $(gridConfigEditor).find(".colorSelector").each(function() {
                    $('#' + $(this).data("colorpickerId")).remove();
                });
            };

            var params = {
                width: 280,
                height: 100,
                posX: pos.left,
                posY: pos.top,
                resizeFunc: false,
                closeFunc: closeFunc
            };

            showDialog(_gtxt('gridPlugin.gridSettings'), gridConfigEditor, params);
        }

        // создание иконки редактирования стиля
        function CreateGridConfigIcon(style, type) {
      	     var icon = nsGmx.Controls.createGeometryIcon(style, type);
             _title(icon, _gtxt('gridPlugin.gridSettings'));
             return icon;
        }

      	this.Load = function () {
      		  if (lm != null){
      			    var alreadyLoaded = lm.createWorkCanvas("mapGrid", this.Unload);
      			    if (!alreadyLoaded)  {
                      $(lm.workCanvas).append(createGridLeftMenu());
                      control.setColor(tempStyle.outline.color);
                      manager.saveOptions();
                }
      		  }
      	}
        this.Unload = function () {};
    }

    var publicInterface = {
        pluginName: 'GridPlugin',
        ConfigureGridMenu: ConfigureGridMenu
    };

    gmxCore.addModule('GridPlugin',
        publicInterface,
        {css: 'src/GridPlugin/GridPlugin.css'}
    );
})();
