var nsGmx = nsGmx || {};

/** Результат поиска ноды в дереве слоёв
 * @typedef nsGmx.LayersTree~SearchResult
 * @property {Node} elem Найденный элемент
 * @property {Node[]} parents Массив родителей. Самый последний элемент массива - сама карта
 * @property {Number} index Индекс найденного элемента в своей группе
*/

/** Класс для работы с деревом слоёв
 * @class
 * @param {Object} tree Дерево слоёв в формате сервера
*/
nsGmx.LayersTree = function( tree )
{
    /** Изменилась видимость ноды. Если изменения касаются нескольких нод, событие будет генерироваться для каждой ноды по отдельности.
     * @event nsGmx.LayersTree#nodeVisibilityChange
     * @param {Object} elem Нода, видимость которой изменилась
     */
    var _tree = tree;
    var _this = this;
    
    var _findElem = function(elem, attrName, name, parents)
    {
        var childs = typeof elem.children != 'undefined' ? elem.children : elem.content.children;
        
        for (var i = 0; i < childs.length; i++)
        {
            if (childs[i].content.properties[attrName] == name)
                return {elem:childs[i], parents: [elem].concat(parents || []), index: i};
            
            if (typeof childs[i].content.children != 'undefined')
            {
                var res = _findElem(childs[i], attrName, name, [elem].concat(parents || []));
                
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
    
    /** Поиск ноды дерева по значению одного из атрибутов. Ищет как папки, так и слои. Возвращает первый найденный результат
     * @param {String} attrName Имя атрибута
     * @param {String} attrValue Значение атрибута
     * @return {nsGmx.LayersTree~SearchResult} Результат поиска. undefined если ничего не найденно
    */
    this.findElem = function(attrName, name)
    {
        return _findElem(_tree, attrName, name);
    }
    
    this.findElemByGmxProperties = function(gmxProperties)
    {
        if (gmxProperties.type == 'group') //группа
            return this.findElem("GroupID", gmxProperties.content.properties.GroupID);
        else if (typeof gmxProperties.content.properties.LayerID !== 'undefined') //слой
            return this.findElem("LayerID", gmxProperties.content.properties.LayerID);
        else if (typeof gmxProperties.content.properties.MultiLayerID !== 'undefined') //мультислой
            return this.findElem("MultiLayerID", gmxProperties.content.properties.MultiLayerID);
    }
    
    /** Итерирование по всем слоям группы дерева
     * @param {nsGmx.LayersTree~LayerVisitor} callback Будет вызвана для каждого слоя внутри группы.
     * @param {Node} [groupNode] Группа, внутри которой проводить поиск. Если не указана, будет проводиться поиск по всему дереву.
     */
    this.forEachLayer = function(callback, groupNode)
    {
        gmxAPI.forEachLayer(groupNode ? groupNode.content : _tree, callback);
    }
    
    /** Visitor при обходе слоёв дерева
     * @callback nsGmx.LayersTree~LayerVisitor
     * @param {Object} elem Свойства слоя
     * @param {Boolean} isVisible Видимость слоя с учётом видимости всех родителей
     * @param {Number} nodeDepth Глубина слоя в дереве (начинается с 0)
    */
    
    /** Итерирование по всем нодам группы дерева
     * @param {nsGmx.LayersTree~NodeVisitor} callback Будет вызвана для каждого слоя внутри группы. Первый аргумент - свойства слоя, второй - видимость слоя
     * @param {Node} [groupNode] Группа, внутри которой проводить поиск. Если не указана, будет проводиться поиск по всему дереву.
     */
    this.forEachNode = function(callback, groupNode)
    {
        gmxAPI.forEachNode(groupNode ? groupNode.content : _tree, callback);
    }
    
    /** Visitor при обходе узлов дерева слоёв
     * @callback nsGmx.LayersTree~NodeVisitor
     * @param {Object} elem Свойства узла
     * @param {Object} type Тип узла (layer или group)
     * @param {Boolean} isVisible Видимость узла с учётом видимости всех родителей
     * @param {Number} nodeDepth Глубина узла в дереве (начинается с 0)
    */
    
    /** Клонирование дерева с возможностью его модификации
     * @param {function(node):Node|null} filterFunc - ф-ция, которая может модифицировать узлы дерева. 
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
            
            if (elem.content.children) {
                for (var c = 0; c < elem.content.children.length; c++) {
                    var vis = isVisible && (!props.list || c == 0); //когда делаем видимой группу-список, виден только первый элемент группы
                    setSubtreeVisibility(elem.content.children[c], vis);
                }
            }
        }
    }    
    
    /** Устанавливает видимость elem и всех родительских элементов elem в зависимости от видимости его прямых потомков. elem должен быть группой. 
     * При этом разруливаются конфликты с несколькими видимыми узлами в radio-группах.
     * @param {Node} elem Нода дерева, видимость которой нужно обновить
     * @param {Node} triggerSubnode один их прямых потомков elem, состояние которого должно остаться неизменным (важно для разруливания конфликтов в radio-групп)
     * @param {Node[]} [parents] массив всех родителей, опционально
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
            
            if (!parents) {
                parents = this.findElemByGmxProperties(elem).parents;
                parents.pop(); //последний элемент - карта; нас не интересует
            }
            var parent = parents.shift();
            parent && this.updateNodeVisibility(parent, elem, parents);
        }
    }
    
    /** Задать видимость ноды. Будут сделаны все нужные изменения видимости как выше, 
     * так и ниже по дереву относительно этой ноды.
     * @param {Node} elem Нода, которой мы хотим задать видимость
     * @param {Boolean} isVisible Видимость ноды (true - видна)
     */
    this.setNodeVisible = function(elem, isVisible) {
        //устанавливаем видимость поддерева, которое начинается с этого элемента
        setSubtreeVisibility(elem, isVisible);
        
        //идём вверх по дереву до корня и меняем видимость родителей
        var parentElem = _this.findElemByGmxProperties(elem).parents[0];
        parentElem && parentElem.content && this.updateNodeVisibility(parentElem, elem); 
    }
}