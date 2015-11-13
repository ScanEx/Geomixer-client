var nsCatalog = nsCatalog || {};

(function($){

  var TreeHelper = function() { };

  TreeHelper.prototype = {
      updateRootFromSatellites: function(node, satellites) {
          node.children = [];
          for (var satelliteKey in satellites) {
              var satellite = satellites[satelliteKey];
              var newNode = new nsCatalog.Controls.TreeNode('satellite', satellite.name, satellite);
              newNode.data.isLoaded = false;
              newNode.ui.customHeader = $.create('div',
                      { 'class' : 'colorIcon',
                        'style' : 'display: inline-block;' })
              .append(
                  $.create('div',
                      { 'class' : 'borderIcon',
                        'style' : 'border-color:#' + L.gmxUtil.dec2hex(satellite.color) }
                  )
              );
              newNode.isClickable = true;
              node.addChild(newNode);
          }
      },

      _intToHtmlColor: function(intColor) {
          var withPadding = '000000' + intColor.toString(16);
          return withPadding.substring(withPadding.length-6);
      },

      getParentSatelliteInfo: function(node) {
          var currentNode = node;
          while (currentNode && currentNode.type != 'satellite') {
              currentNode = currentNode.parent;
          }
          return currentNode.data;
      },

      isVisible: function(node) {
          var currentNode = node;
          while (currentNode) {
              if (currentNode.isChecked != null && !currentNode.isChecked) return false;
              currentNode = currentNode.parent;
          }
          return true;
      },

      ensureHitArea: function(node) {
          if (!node.ui.hitarea)
              node.ui.hitarea = $(node.ui.container).children('div.hitarea').eq(0);
          return node.ui.hitarea;
      }
  };

  nsCatalog.TreeHelper = new TreeHelper();

}(jQuery));
