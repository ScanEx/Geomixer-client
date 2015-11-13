var nsCatalog = nsCatalog || {};
nsCatalog.Controls = nsCatalog.Controls || {};

(function ($) {
  var LoaderDialog = function() {
    this._loader = $("<table style='position:absolute;width:100%;height:100%;top:0;left:0;z-index:1000;display:none'><tr><td style='vertical-align:center; text-align:center;'><img src='img/loader.gif'/></td></tr></table>").appendTo('#flash');
  };
  LoaderDialog.prototype.open = function () {
    this._loader.show();
  };  
  LoaderDialog.prototype.close = function () {
    this._loader.hide();
  };
  nsCatalog.Controls.LoaderDialog = LoaderDialog;
}(jQuery));
