UI ��� ������� ������������ ��������� ����. ����� ������� � ������ ��� �������� ������������. ��������� ��������� IControl.

���������� ��������� ������� �� jQueryUI Slider:
  - slidechange 
  - slide
  
������ �������������:

```
var widget = new nsGmx.TransparencySliderWidget(container);

$(widget).on('slidechange', function(event, ui) {
    setOpacity(ui.value*100);
});
```