UI для задания прозрачности растровых слоёв. Имеет слайдер и иконку для быстрого переключения. Реализует интерфейс IControl.

Проксирует следующие события из jQueryUI Slider:
  - slidechange 
  - slide
  
Пример использования:

```
var widget = new nsGmx.TransparencySliderWidget(container);

$(widget).on('slidechange', function(event, ui) {
    setOpacity(ui.value*100);
});
```