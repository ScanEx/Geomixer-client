var nsGmx = nsGmx || {};

/** Узел дерева слоёв
 * @typedef nsGmx.LayersTree~Node
 * @property {String} type тип узла (`layer` или `group`)
 * @property {Object} content содержимое узла
 * @property {Object} [content.properties] свойства узла
 * @property {Object} [content.children] потомки узла
*/

/** Результат поиска узла в дереве слоёв
 * @typedef nsGmx.LayersTree~SearchResult
 * @property {nsGmx.LayersTree~Node} elem Найденный элемент
 * @property {nsGmx.LayersTree~Node[]} parents Массив родителей. Самый последний элемент массива - сама карта
 * @property {Number} index Индекс найденного элемента в своей группе
*/

/** Visitor при обходе слоёв дерева
 * @callback nsGmx.LayersTree~LayerVisitor
 * @param {Object} layerContent Содержимое узла слоя
 * @param {Boolean} isVisible Видимость слоя с учётом видимости всех родителей
 * @param {Number} nodeDepth Глубина слоя в дереве (начинается с 0)
*/

/** Visitor при обходе узлов дерева слоёв
 * @callback nsGmx.LayersTree~NodeVisitor
 * @param {nsGmx.LayersTree~Node} node Свойства узла
 * @param {Boolean} isVisible Видимость узла с учётом видимости всех родителей
 * @param {Number} nodeDepth Глубина узла в дереве (начинается с 0)
*/

/** Класс для работы с деревом слоёв
 * @class
 * @param {Object} tree Дерево слоёв в формате сервера
*/
nsGmx.LayersTree = function( tree )
{
    /** Изменилась видимость узла дерева. Если изменения касаются нескольких узлов, событие будет 
        генерироваться для каждого узла по отдельности. Кроме того, это же событие генерируется 
        на отдельных узлах дерева.
     * @event nsGmx.LayersTree#nodeVisibilityChange
     * @param {nsGmx.LayersTree~Node} node Узел, видимость которой изменилась
     */
    var _tree = tree;
    var _this = this;
    
    var _findElem = function(elem, propName, propValue, parents)
    {
        var childs = typeof elem.children != 'undefined' ? elem.children : elem.content.children;
        
        for (var i = 0; i < childs.length; i++)
        {
            var props = childs[i].content.properties;
            if (propName in props && props[propName] === propValue) {
                return {elem:childs[i], parents: [elem].concat(parents || []), index: i};
            }
            
            if (typeof childs[i].content.children != 'undefined')
            {
                var res = _findElem(childs[i], propName, propValue, [elem].concat(parents || []));
                
                if (res)
                    return res;
            }
        }
    }
    
    /** Получить исходное дерево слоёв
    */
    this.getRawTree = function() 
    {
        return _tree;
    }
    
    /** Получить свойства карты
    */
    this.getMapProperties = function() 
    {
        return _tree.properties;
    }
    
    /** Поиск узла дерева по значению одного из атрибутов. Ищет как папки, так и слои. Возвращает первый найденный результат
     * @param {String} propName Имя атрибута
     * @param {String} propValue Значение атрибута
     * @return {nsGmx.LayersTree~SearchResult} Результат поиска. undefined если ничего не найденно
    */
    this.findElem = function(propName, propValue)
    {
        return _findElem(_tree, propName, propValue);
    }
    
    this.findElemByGmxProperties = function(gmxProperties)
    {
        if (gmxProperties.type == 'group') //группа
            return this.findElem("GroupID", gmxProperties.content.properties.GroupID);
        else
            return this.findElem("name", gmxProperties.content.properties.name);
    }
    
    /** Итерирование по всем слоям группы дерева
     * @param {nsGmx.LayersTree~LayerVisitor} callback Будет вызвана для каждого слоя внутри группы. Первый аргумент - свойства слоя, второй - видимость слоя
     * @param {nsGmx.LayersTree~Node} [groupNode] Группа, внутри которой проводить поиск. Если не указана, будет проводиться поиск по всему дереву.
     */
    this.forEachLayer = function(callback, groupNode)
    {
        this.forEachNode(function(node, isVisible, nodeDepth) {
            if (node.type === 'layer') {
                callback(node.content, isVisible, nodeDepth);
            }
        }, groupNode)
    }
    
    /** Итерирование по всем под-узлам узла дерева
     * @param {nsGmx.LayersTree~NodeVisitor} callback Будет вызвана для каждого узла внутри группы. Первый аргумент - узел, второй - видимость узла
     * @param {nsGmx.LayersTree~Node} [groupNode] Группа, внутри которой проводить поиск. Если не указана, будет проводиться поиск по всему дереву.
     */
    this.forEachNode = function(callback, groupNode)
    {
        var forEachNodeRec = function(o, isVisible, nodeDepth)
        {
            isVisible = isVisible && !!o.content.properties.visible;
            
            callback(o, isVisible, nodeDepth);
            
            if (o.type === 'group') {
                var a = o.content.children;
                for (var k = a.length - 1; k >= 0; k--)
                    forEachNodeRec(a[k], isVisible, nodeDepth + 1);
            }
        }
        
        var layers = groupNode ? groupNode.content : _tree;
        
        for (var k = layers.children.length - 1; k >= 0; k--) {
            forEachNodeRec(layers.children[k], true, 0);
        }
    }
    
    /** Клонирование дерева с возможностью его модификации
     * @param {function(node):nsGmx.LayersTree~Node|null} filterFunc - ф-ция, которая может модифицировать узлы дерева. 
                Вызывается при клонировании очередного узла. Изменения данных можно делать in-place.
                Для групп вызывается после обработки всех потомков. Если возвращает null, то узел удаляется
     */
    this.cloneRawTree = function(filterFunc) {
        filterFunc = filterFunc || function(node) {return node;};
        var res = {};
        var forEachLayerRec = function(o)
        {
            if (o.type == "layer") {
                return filterFunc($.extend(true, {}, o));
            }
            else if (o.type == "group") {
                var a = o.content.children;
                var newChildren = [];
                for (var k = 0; k < a.length; k++) {
                    var newNode = forEachLayerRec(a[k]);
                    newNode && newChildren.push(newNode);
                }
                return filterFunc({
                    type: 'group', 
                    content: {
                        children: newChildren,
                        properties: $.extend(true, {}, o.content.properties)
                    }
                })
            }
        }
        
        var newFirstLevelGroups = [];
        for (var k = 0; k < _tree.children.length; k++) {
            var newNode = forEachLayerRec(_tree.children[k]);
            newNode && newFirstLevelGroups.push(newNode);
        }
        
        return {
            properties: $.extend(true, {}, _tree.properties),
            children: newFirstLevelGroups
        }
    }
    
    //Методы управления видимостью слоёв в дереве
    
    //проходится по всему поддереву elem и устанавливает видимость isVisible всем узлам включая elem (учитывая ограничения на radio buttons)
    var setSubtreeVisibility = function(elem, isVisible) {
        var props = elem.content.properties;
        if (props.visible != isVisible) {
            props.visible = isVisible;
            $(_this).triggerHandler('nodeVisibilityChange', [elem]);
            $(elem).triggerHandler('nodeVisibilityChange', [elem]);
            
            if (elem.content.children) {
                for (var c = 0; c < elem.content.children.length; c++) {
                    var vis = isVisible && (!props.list || c == 0); //когда делаем видимой группу-список, виден только первый элемент группы
                    setSubtreeVisibility(elem.content.children[c], vis);
                }
            }
        }
    }    
    
    /** Устанавливает видимость узла дерева и всех родительских элементов данного узла в зависимости от видимости его прямых потомков. Узел должен быть группой.
     * При этом разруливаются конфликты с несколькими видимыми узлами в radio-группах.
     * @param {nsGmx.LayersTree~Node} node Узел дерева, видимость которого нужно обновить
     * @param {nsGmx.LayersTree~Node} triggerSubnode один их прямых потомков node, состояние которого должно остаться неизменным (важно для разруливания конфликтов в radio-групп)
     * @param {nsGmx.LayersTree~Node[]} [parents] массив всех родителей, опционально
     */
    this.updateNodeVisibility = function(elem, triggerSubnode, parents) {
        var props = elem.content.properties,
            isList = props.list,
            children = elem.content.children,
            triggerNodeVisible = triggerSubnode ? triggerSubnode.content.properties.visible : false,
            visibleNode = triggerNodeVisible ? triggerSubnode : null;
        
        var isVisible = false;
        for (var c = 0; c < children.length; c++) {
            var child = children[c];
            var childVisible = child.content.properties.visible;
            isVisible = isVisible || childVisible;
            
            if (childVisible && !visibleNode) {
                visibleNode = child;
            }
            
            if (isList && childVisible && child !== visibleNode) {
                setSubtreeVisibility(child, false);
            }
        }
        
        if (isVisible !== props.visible) {
            props.visible = isVisible;
            
            $(this).triggerHandler('nodeVisibilityChange', [elem]);
            $(elem).triggerHandler('nodeVisibilityChange', [elem]);
            
            if (!parents) {
                parents = this.findElemByGmxProperties(elem).parents;
                parents.pop(); //последний элемент - карта; нас не интересует
            }
            var parent = parents.shift();
            parent && this.updateNodeVisibility(parent, elem, parents);
        }
    }
    
    /** Задать видимость узла дерева. Будут сделаны все нужные изменения видимости как выше, 
     * так и ниже по дереву относительно этого узла.
     * @param {nsGmx.LayersTree~Node} node Узел дерева, которому мы хотим задать видимость
     * @param {Boolean} isVisible Видимость узла (true - виден)
     */
    this.setNodeVisibility = function(node, isVisible) {
        if (node.content.properties.visible != isVisible) {
            //устанавливаем видимость поддерева, которое начинается с этого элемента
            setSubtreeVisibility(node, isVisible);
            
            //идём вверх по дереву до корня и меняем видимость родителей
            var parentElem = _this.findElemByGmxProperties(node).parents[0];
            parentElem && parentElem.content && this.updateNodeVisibility(parentElem, node);
        }
    }
}