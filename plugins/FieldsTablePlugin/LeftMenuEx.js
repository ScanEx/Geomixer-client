var LeftMenuEx = function () {
    this.bottomArea = null;
    this.innerCanvas = null;
    var that = this;
    this.panel = new nsGmx.LeftPanelItem("leftMenuExID", {
        //path: ["Агросервис", "Список полей", ""‏],
        closeFunc: function () {
            that._closeFunc && that._closeFunc.call(that);
            LeftMenuEx.clearContainerPanel();
        }
    });
    $(this.panel).on("changeVisibility", function () {
        resizeAll();
    });

    //указатель на панельку
    this.workCanvas = this.panel.workCanvas;
    this._closeFunc = null;

    LeftMenuEx.repPanel_bug();

    var fieldsDiv = document.createElement("div");
    fieldsDiv.classList.add("leftPanel");
    fieldsDiv.id = "leftPanelFields";
    $("#leftPanelHeader").append(fieldsDiv);
};

//бага со смещением когда включена панель отчета
LeftMenuEx.repPanel_bug = function () {
    if (window.repPanel)
        repPanel.fieldsPanel && repPanel.fieldsPanel.refreshPadding();
};

LeftMenuEx.prototype.setOnClose = function (callback) {
    this._closeFunc = function () {
        callback();

        //бага со смещением когда включена панель отчета
        //document.getElementById("repPanel") && (document.getElementById("repPanel").style.paddingBottom = "0px");
        LeftMenuEx.repPanel_bug();

        //удаляем из дома
        var el = document.getElementById("leftPanelFields");
        el.parentNode.removeChild(el);

        resizeAll();
    }
};

LeftMenuEx.createContainerPanel = function () {
    var fieldsPanel = document.createElement('div');
    fieldsPanel.id = "fieldsPanel";
    //fieldsPanel.style["max-height"] = "460px";
    fieldsPanel.style.overflowY = "hidden";
    return document.getElementById("leftPanelFields").appendChild(fieldsPanel);
};

LeftMenuEx.clearContainerPanel = function () {
    document.getElementById("leftPanelFields") && (document.getElementById("leftPanelFields").innerHTML = "");
    resizeAll();
};

LeftMenuEx.prototype.createPanel = function () {

    var container = document.getElementById("leftPanelFields");
    container.innerHTML = "";
    container.appendChild(this.panel.panelCanvas);

    resizeAll();

    ////создание панели для списка полей
    var fieldsPanel = LeftMenuEx.createContainerPanel();

    this.innerCanvas = _div(null, [['css', 'overflow', 'hidden'], ['dir', 'className', 'attrsTableBody']]);
    this.workCanvas.appendChild(this.innerCanvas);

    this.bottomArea = _div(null, [['dir', 'id', 'bottomArea'], ['css', 'float', 'right'], ['css', 'font-size', '12px'], ['css', 'padding-right', '7px']]);
    this.bottomArea.style["text-align"] = "right";
    this.bottomArea.style["width"] = "100%";
    this.bottomArea.style["padding-top"] = "5px !important";
    //this.bottomArea.style["border-top"] = "rgb(139, 118, 118) 1px solid";
    //this.bottomArea.innerHTML = "Площадь га:";
    this.workCanvas.appendChild(this.bottomArea);

    document.getElementById("leftPanelFields").style.top = "auto";
};

LeftMenuEx.prototype.setCaption = function (caption) {
    this.panel.setTitle([caption]);
    //$(this.panel.panelCanvas).find(".leftmenu-path-item.menuNavigateCurrent")[0].innerHTML = caption;
};