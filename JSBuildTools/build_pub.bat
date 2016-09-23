call gulp gmx-pub

set destination="..\..\Geomixer-dist"

robocopy .. %destination% .gitignore .gitmodules api.swf apif.js blank.html buttons.css common.css config.js config.js.template cover.js DateTimePeriodControl.css DateTimePeriodControl.js DateTimePeriodControl_v2.css DateTimePeriodControl_v2.js fires.css GroupEditor.js help_eng.html help_rus.html iconPanel.js ieprompt.html iframePreview.html index.html LAB.min.js LayerEditor.js LayerProperties.js LayerStylesEditor.js loader.js maplist.html menu.css multiLayerEditor.js oAuthCallback.html permalink.html print-iframe.html print-iframe_leaflet.html PrintscreenPlugin.js proxy.swf response-iframe.html search.css servicesHelp_eng.html servicesHelp_rus.html StyleLibrary.js table.css tiny-iframe.html TinyMCELoader.js treeview.css uploader.js uploader.swf upload-iframe.html upload-test.html usageHelp_eng.html usageHelp_rus.html UserGroupWidget.js

robocopy ..\colorpicker %destination%\colorpicker /S
robocopy ..\common_components\dist %destination%\common_components\dist /S
robocopy ..\css %destination%\css jquery-ui-1.7.2.custom.css styleLibrary.css UserGroupWidget.css
robocopy ..\dist %destination%\dist /S
robocopy ..\docs %destination%\docs /S
robocopy ..\img %destination%\img /S
robocopy ..\logotypes %destination%\logotypes /S
robocopy ..\plugins %destination%\plugins /S
robocopy ..\src\GridPlugin %destination%\src\GridPlugin GridPlugin.css

robocopy ..\thirdparty\tinymce %destination%\thirdparty\tinymce /S
