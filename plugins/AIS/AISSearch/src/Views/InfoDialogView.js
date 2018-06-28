const createInfoDialog = require('./infodialog.js'),
      Polyfill = require('../Polyfill'),
      VesselInfoScreen = require('./VesselInfoScreen');

let infoDialogCascade = [],
    allIinfoDialogs = [],
    vesselInfoScreen;

module.exports = function ({
    tools,
    aisLayerSearcher: aisLayerSearcher,
    modulePath: modulePath,
    aisView: aisView, myFleetMembersView: myFleetMembersView }) {

    vesselInfoScreen  = new VesselInfoScreen({modulePath: modulePath, aisServices: aisLayerSearcher.aisServices});
    const _showPosition = function(vessel){   
        aisView.vessel = vessel;
        if (aisView.tab)
        if (aisView.tab.is('.active'))
            aisView.show();
        else
            aisView.tab.click();  
        if (!vessel.lastPosition)             
            aisView.positionMap(vessel);    
    };
    return {
        showPosition: function(vessel){   
            _showPosition(vessel);
            aisView.showTrack(vessel);
        },
        show: function (vessel, getmore) {
            var ind = Polyfill.findIndex(allIinfoDialogs, function (d) { 
                return d.vessel.imo == vessel.imo && d.vessel.mmsi == vessel.mmsi 
            });
            if (ind >= 0) {
                $(allIinfoDialogs[ind].dialog).parent().insertAfter($('.ui-dialog').eq($('.ui-dialog').length - 1));
                return;
            }

            var dialog = createInfoDialog({
                vessel: vessel,
                getmore: getmore,
                displaingTrack: tools.displaingTrack,
                closeFunc: function (event) {
                    var ind = Polyfill.findIndex(infoDialogCascade, function (d) { return d.id == dialog.id });
                    if (ind >= 0)
                        infoDialogCascade.splice(ind, 1);
                    ind = Polyfill.findIndex(allIinfoDialogs, function (d) { return d.dialog.id == dialog.id });
                    if (ind >= 0)
                        allIinfoDialogs.splice(ind, 1);
                },
                aisLayerSearcher: aisLayerSearcher,
                modulePath:modulePath, 
                aisView: aisView,
                myFleetMembersView: myFleetMembersView
            },
                {
                    openVesselInfoScreen: vesselInfoScreen.open,
                    showTrack: tools.showTrack,
                    showPosition: _showPosition
                })

            if (infoDialogCascade.length > 0) {
                var pos = $(infoDialogCascade[infoDialogCascade.length - 1]).parent().position();
                $(dialog).dialog("option", "position", [pos.left + 10, pos.top + 10]);
            }

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