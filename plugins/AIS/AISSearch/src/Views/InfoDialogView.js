const displayInfoDialog = require('./infodialog.js'),
      Polyfill = require('../Polyfill'),
      VesselInfoScreen = require('./VesselInfoScreen');

let infoDialogCascade = [],
    allIinfoDialogs = [],
    vesselInfoScreen;

module.exports = function ({
    tools,
    aisLayerSearcher: aisLayerSearcher,
    modulePath: modulePath,
    aisView: aisView, 
    myFleetView: myFleetView,
    menuId:menuId }) {

    vesselInfoScreen  = new VesselInfoScreen({modulePath: modulePath, aisServices: aisLayerSearcher.aisServices});
    const _showPosition = function(vessel){ 
        window.iconSidebarWidget.open(menuId);

        aisView.vessel = vessel;
        if (aisView.tab)
        if (aisView.tab.is('.active'))
            aisView.show();
        else
            aisView.tab.click();    
    }, 
    _updateView = function (displayed, vessel, getmore){
        if (displayed.vessel.ts_pos_utc!=vessel.ts_pos_utc){
            $(displayed.dialog).dialog("close")
            return true;
        }
        else
            return false;
    };
    return {
        showPosition: function(vessel){  
            _showPosition(vessel);
            aisView.showTrack(vessel);
        },
        show: function (vessel, getmore) {
            let ind = Polyfill.findIndex(allIinfoDialogs, function (d) { 
                return d.vessel.imo == vessel.imo && d.vessel.mmsi == vessel.mmsi 
            }),
            isNew = true,
            dialogOffset;
            if (ind >= 0) {
                isNew = false;
                let displayed = allIinfoDialogs[ind];
                dialogOffset = $(displayed.dialog).parent().offset();
                ind = Polyfill.findIndex(infoDialogCascade, function (d) { return d.id == displayed.dialog.id })
                if(!_updateView(displayed, vessel)){
                    $(displayed.dialog).parent().insertAfter($('.ui-dialog').eq($('.ui-dialog').length - 1));
                    return;
                }
            }

            let dialog = displayInfoDialog({
                vessel: vessel,
                getmore: getmore,
                displayedTrack: tools.displayedTrack,
                closeFunc: function (event) {
                    let ind = Polyfill.findIndex(infoDialogCascade, function (d) { return d.id == dialog.id });
                    if (ind >= 0)
                        infoDialogCascade.splice(ind, 1);
                    ind = Polyfill.findIndex(allIinfoDialogs, function (d) { return d.dialog.id == dialog.id });
                    if (ind >= 0)
                        allIinfoDialogs.splice(ind, 1);
                },
                aisLayerSearcher: aisLayerSearcher,
                modulePath:modulePath, 
                aisView: aisView,
                myFleetView: myFleetView
            },
                {
                    openVesselInfoScreen: vesselInfoScreen.open,
                    showTrack: tools.showTrack,
                    showPosition: _showPosition
                })

            if (!dialogOffset && infoDialogCascade.length > 0) {
                let pos = $(infoDialogCascade[infoDialogCascade.length - 1]).parent().position();
                dialogOffset = {left:pos.left - 10, top:pos.top + 10};
            }
            if (dialogOffset)
                $(dialog).dialog("option", "position", [dialogOffset.left, dialogOffset.top]);
            if (ind >= 0)
                infoDialogCascade.splice(ind, 0, dialog);
            else if(isNew)
                infoDialogCascade.push(dialog);

            allIinfoDialogs.push({ vessel: vessel, dialog: dialog });
            $(dialog).on("dialogdragstop", function (event, ui) {
                var ind = Polyfill.findIndex(infoDialogCascade, function (d) { return d.id == dialog.id });
                if (ind >= 0)
                    infoDialogCascade.splice(ind, 1);
            });

        }
    };
};