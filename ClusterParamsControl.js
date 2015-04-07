!(function()
{
    _translationsHash.addtext("rus", {
							"clusterControl.maxMembers" : "Макс. объектов",
							"clusterControl.radius" : "Радиус кластеризации",
                            "clusterControl.title": "Стиль кластера"
						 });
						 
    _translationsHash.addtext("eng", {
							"clusterControl.maxMembers" : "Max. members in cluster",
							"clusterControl.radius" : "Clustering radius",
                            "clusterControl.title": "Cluster style"
						 });
                         
    var ClusterParamsControl = function(container, initStyle)
    {
        var _this = this;
        var isApplyClusters = typeof initStyle !== 'undefined';
        var clusterView = {        // Атрибуты отображения членов кластера (при отсутствии не отображать)
            'maxMembers': 10,    // максимальное колич.обьектов в кластере (по умолчанию '10')
            'radius': 40,        // максимальный радиус сдвига координат обьектов попавших в кластер (по умолчанию '50')
            'delta': 10,        // разброс сдвига координат (по умолчанию '0')
            'bgStyle': {        // Стиль подложки отображения (по умолчанию '0')
                'fill': { 'color': 0xffff00, 'opacity': 20 },
                'outline': { 'color': 0x00ff00, 'opacity': 1, 'thickness': 10 }
            },
            'lineStyle': { 'color': 0x0600ff, 'opacity': 30, 'thickness': 1 }    // Стиль линии соединяющей центр кластера с отображаемым обьектом
        };
    
        var clusterStyle = {
        }
        
        var ph = {
            radius: 50,                // радиус кластеризации в пикселах (по умолчанию 20)
            iterationCount: 1,        // количество итераций K-means (по умолчанию 1)
            clusterView: clusterView, // Атрибуты отображения членов кластера (при отсутствии не отображать)
            RenderStyle: null,      // стили кластеров
            HoverStyle: null        // стили кластеров при наведении
        };
        
        ph = $.extend(true, ph, initStyle);
                
        var clusterStyleControl = $('<div/>', {'class': 'clusterStyleControl'});
        var clusterStyleContainer = $('<div/>');
        clusterStyleControl.append($('<span/>').text(_gtxt('clusterControl.title'))).append(clusterStyleContainer);
        
        var clusterRadiusInput = $('<input/>', {'class': 'inputStyle'}).val(ph.radius).bind('keyup', function()
        {
            if (ph.radius != this.value)
            {
                ph.radius = Number(this.value);
                $(_this).change();
            }
        });
        
        var maxMembersInput = $('<input/>', {'class': 'inputStyle'}).val(ph.clusterView.maxMembers).bind('keyup', function()
        {
            if (ph.clusterView.maxMembers != this.value)
            {
                ph.clusterView.maxMembers = Number(this.value);
                $(_this).change();
            }
        });
        
        var clusterViewTable = $('<table/>')
            .append($('<tr/>')
                .append($('<td/>').append($('<span/>').text(_gtxt('clusterControl.radius'))))
                .append($('<td/>').append(clusterRadiusInput))
            ).append($('<tr/>')
                .append($('<td/>').append($('<span/>').text(_gtxt('clusterControl.maxMembers'))))
                .append($('<td/>').append(maxMembersInput))
            );
            
        var clusterViewContainer = $('<div/>', {'class': 'clusterViewContainer'}).append(clusterViewTable);
        
        $(container).append(clusterStyleControl).append(clusterViewContainer);
        
        var initRenderStyle = ph.RenderStyle || {marker:{size:3}, outline: {color: 0xff0000, opacity: 100, thickness: 2}};
        
        //предполагаем что модуль уже загружен
        //TODO: или это не так?
        var resObject = gmxCore.getModule('LayerStylesEditor').createStyleEditor(clusterStyleContainer[0], initRenderStyle, "point", true);
        
        $(resObject).change(function()
        {
            ph.RenderStyle = ph.HoverStyle = initRenderStyle;
            $(_this).change();
        });
        
        this.isApplyCluster = function()
        {
            return isApplyClusters;
        }
        
        this.getClusterStyle = function()
        {
            return ph;
        }
        
        this.applyClusters = function(isApply)
        {
            if (isApply != isApplyClusters)
            {
                ph.RenderStyle = initRenderStyle;
                isApplyClusters = isApply;
                $(_this).change();
            }
        }
    }
    
    nsGmx.ClusterParamsControl = ClusterParamsControl;
})();