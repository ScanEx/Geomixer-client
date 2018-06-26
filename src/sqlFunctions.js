nsGmx.sqlFunctions = {
    string: [
        "length", "lower", "upper", "trim", "lTrim", "rTrim", "left", "position", "replace",
        "substring", "right"
    ],

    date: [
        "addDays", "addHours", "addMinutes", "addSeconds", "day", "month", "year",
        "now", "strToDateTime", "strToTime", "toString"
    ],

    math: [
        "round"
    ],

    agregate: [
        "avg", "count", "max", "min", "sum", "unionAggregate"
    ],

    transform: [
        "cast"
    ],

    geometry: [
        "STArea", "geometryFromVectorLayer", "geometryToWkbHex", "geometryFromWkbHex",
        "geometryFromWKT", "geometryFromGeoJson", "buffer", "makeValid", "STEnvelopeMinX",
        "STEnvelopeMaxX", "STEnvelopeMaxY", "STEnvelopeMinY", "STContains", "STIntersects",
        "STIntersection", "STDifference", "STUnion", "geomIsEmpty", "STCentroid", "STAsText"
    ],

    special: [
        "geometryFromVectorLayer", "geometryFromVectorLayerUnion", "geometryFromRasterLayer"
    ]
}

nsGmx.sqlTemplates = {
    "length": "length(string)",
    "lower": "lower(string)",
    "upper": "upper(string)",
    "trim": "trim(string)",
    "lTrim": "lTrim(string)",
    "rTrim": "rTrim(string)",
    "left": "left(string, [number_of_characters])",
    "position": "position(substring, string)",
    "substring": "substring(string, fist_character_index, characters_count)",
    "right": "right(string, [number_of_characters])",
    "contains": "string contains string",
    "contiansIgnoreCase": "string contiansIgnoreCase string",
    "startsWith": "string startsWith string",
    "endsWith": "string endsWith string",
    "between and": "expression between expression and expression",
    "addDays": "addDays(datetime|date,double)",
    "addHours": "addHours(datetime|time, double)",
    "addMinutes": "addMinutes(datetime|time, double)",
    "addSeconds": "addSeconds(datetime|time, double)",
    "day": "day(date)",
    "month": "month(date)",
    "year": "year(date)",
    "now": "now()",
    "strToDateTime": "strToDateTime(string)",
    "strToTime": "strToTime(string)",
    "toString": "toString(expression)",
    "avg": "avg()",
    "count": "count()",
    "max": "max()",
    "min": "min()",
    "sum": "sum()",
    "unionAggregate": "unionAggregate()",
    "cast": "cast(expression as <type>)",
    "STArea": "STArea(geometry)",
    "geometryFromVectorLayer": "geometryFromVectorLayer(layerID, countID)",
    "geometryToWkbHex": "geometryToWkbHex(geometry)",
    "geometryFromWkbHex": "geometryFromWkbHex(geometry, EPSG code)",
    "geometryFromWKT": "geometryFromWKT(string, EPSG code)",
    "geometryFromGeoJson": "geometryFromGeoJson(string, EPSG code)",
    "buffer": "buffer(geometry, buffer size)",
    "makeValid": "makeValid(geometry)",
    "STEnvelopeMinX": "STEnvelopeMinX(geometry)",
    "STEnvelopeMaxX": "STEnvelopeMaxX(geometry)",
    "STEnvelopeMaxY": "STEnvelopeMaxY(geometry)",
    "STEnvelopeMinY": "STEnvelopeMinY(geometry)",
    "STContains": "STContains(geometry, geometry)",
    "STIntersects": "STIntersects(geometry, geometry)",
    "STIntersection": "STIntersection(geometry, geometry)",
    "STDifference": "STDifference(geometry, geometry)",
    "STUnion": "STUnion(geometry, geometry)",
    "geomIsEmpty": "geomIsEmpty(geometry)",
    "STCentroid": "STCentroid(geometry)",
    "STAsText": "STAsText(geometry)",
    "geometryFromVectorLayer": "geometryFromVectorLayer(layerID, countID)",
    "geometryFromVectorLayerUnion": "geometryFromVectorLayerUnion(layerID)",
    "geometryFromRasterLayer": "geometryFromRasterLayer(layerID)"
};

nsGmx.sqlTemplates = {
    left: {
        interface: "left(text, number_of_characters)",
        descRus: "Возвращает подстроку указанной длины от начала строки",
        descEng: "Returns a substring from the beginning of a specified string"
    },
    length: {
        interface: "length(text)",
        descRus: "Возвращает длину строки",
        descEng: "Returns the length of a string"
      },

    lower: {
        interface: "lower(text)",
        descRus: "Возвращает строку в нижнем регистре",
        descEng: "Converts a specified string to the lowercase"
    },

    lTrim: {
        interface: "lTrim(text)",
        descRus: "Удаляет символы пробела в начале строки",
        descEng: "Removes leading spaces in a specified string"
    },

    position: {
        interface: "position(search_for, text_to_search)",
        descRus: "Возвращает позицию первого вхождения строки в тексте",
        descEng: "Returns the position at which a string is first found within text"
    },

    right: {
        interface: "right(text, number_of_characters)",
        descRus: "Возвращает подстроку заданной длины от конца строки",
        descEng: "Returns a substring from the end of a specified string"
    },

    rTrim: {
        interface: "rTrim(text)",
        descRus: "Удаляет символы пробела в конце строки",
        descEng: "Removes trailing spaces in a specified string"
    },

    replace: {
        interface: "replace(string, string, string)",
        descRus: "Заменяет все вхождения указанного строкового значения другим строковым значением.",
        descEng: "Replaces all occurrences of a specified string value to another string value."
    },

    substring: {
        interface: "substring(text, fist_character_index, characters_count)",
        descRus: "Возвращает подстроку заданной длины от указанной позиции в строке",
        descEng: "Returns a substring of the specified length from the specified position in the text"
    },

    trim: {
        interface: "trim(text)",
        descRus: "Удаляет символ пробела в начале и в конце строки",
        descEng: "Removes leading and trailing spaces in a specified string"
    },

    upper: {
        interface: "upper(text)",
        descRus: "Возвращает строку в верхнем регистре",
        descEng: "Converts the string to the upper case"
    },

    addDays: {
        interface: "addDays(datetime|date,num_of_days)",
        descRus: "Прибавляет к указанной дате заданное количество дней",
        descEng: "Add a specified number of days to a date"
    },

    addHours: {
        interface: "addHours(datetime|time, num_of_hours)",
        descRus: "Прибавляет к указанной дате или метке времени заданное количество часов",
        descEng: "Add a specified number of hours to a date or a time"
    },

    addMinutes: {
        interface: "addMinutes(datetime|time, num_of_minutes)",
        descRus: "Прибавляет к указанной дате или метке времени заданное количество минут",
        descEng: "Add a specified number of minutes to a date or a time"
    },

    addSeconds: {
        interface: "addSeconds(datetime|time, num_of_seconds)",
        descRus: "Прибавляет к указанной дате или метке времени заданное количество секунд",
        descEng: "Add a specified number of seconds to a date or a time"
    },

    day: {
        interface: "day(date)",
        descRus: "Возвращает номер дня в месяце для указанной даты",
        descEng: "Returns the day of month of a specified date"
    },

    month: {
        interface: "month(date)",
        descRus: "Возвращает номер месяца в году для указанной даты",
        descEng: "Returns the month of year of a specified date"
    },

    year: {
        interface: "year(date)",
        descRus: "Возвращает год как число для указанной даты",
        descEng: "Returns the year by a given date"
    },

    now: {
        interface: "now()",
        descRus: "Возвращает текущие дату и время",
        descEng: "Returns current datetime"
    },

    strToDateTime: {
        interface: "strToDateTime(string)",
        descRus: "Строка преобразуется к типу datetime",
        descEng: "Converts a string to datetime format"
    },

    strToTime: {
        interface: "strToTime(string)",
        descRus: "Строка преобразуется к типу time",
        descEng: "Converts a string to time format"
    },

    toString: {
        interface: "toString(expression)",
        descRus: "Преобразует выражение к строковому типу",
        descEng: "Converts input expression to string format"
    },

    STArea: {
        interface: "STArea(geometry)",
        descRus: "Вычисляет площадь в кв.м (на эллипсоиде)",
        descEng: "Calculates the area of geometry (m^2, ellipsoidal)"
    },

    buffer: {
        interface: "buffer(geometry, buffer_size_meters)",
        descRus: "Создает полигон по буферной зоне заданного размера в метрах",
        descEng: "Creates the specified size buffer polygon for input geometry"
    },

    round: {
        interface: "round(value, places)",
        descRus: "Округляет число до заданного количества десятичных знаков",
        descEng: "Rounds a number to a certain number of decimal places according to standard rules"
    },

    avg: {
        interface: "avg()",
        descRus: "Среднее значение",
        descEng: "Average value"
    },

    count: {
        interface: "count()",
        descRus: "Количество записей",
        descEng: "Number of records"
    },

    max: {
        interface: "max()",
        descRus: "Максимальное значение",
        descEng: "The maximum value"
    },

    min: {
        interface: "min()",
        descRus: "Минимальное значение",
        descEng: "The minimum value"
    },

    sum: {
        interface: "sum()",
        descRus: "Сумма",
        descEng: "Sum"
    },

    unionAggregate: {
        interface: "unionAggregate()",
        descRus: "Возвращает объединённую геометрию состоящую из всех геометрий таблицы.",
        descEng: "Returns the combined geometry of all table geometries."
    },

    cast: {
        interface: "cast(expression)",
        descRus: "Преобразует выражение к указанному типу.",
        descEng: "Converts an expression to a specified type."
    },

    geometryFromVectorLayer: {
        interface: "geometryFromVectorLayer(layerID, countID)",
        descRus: "Возвращает геометрию из объекта другого векторного слоя.",
        descEng: "Returns the geometry from the object of another vector layer."
    },

    geometryToWkbHex: {
        interface: "geometryToWkbHex(geometry)",
        descRus: "Преобразование геометрии в строку в виде WKB, закодированной в шестнадцатиричной форме (Hex).",
        descEng: "Convert geometry to a string in the form of WKB encoded in Hex"
    },

    geometryFromWkbHex: {
        interface: "geometryFromWkbHex(geometry, ESPG code)",
        descRus: "Создание объекта геометрии из шестнадцатиричной строки WKB и кода проекции.",
        descEng: "Creating a geometry object from the hexadecimal WKB string and the projection code."
    },

    geometryFromWkt: {
        interface: "geometryFromWkt(string, ESPG code)",
        descRus: "Возвращает геометрию по WKT.",
        descEng: "Returns the geometry by WKT."
    },

    geometryFromGeoJson: {
        interface: "geometryFromGeoJson(string, ESPG code)",
        descRus: "Возвращает геометрию по GeoJson",
        descEng: "Returns the geometry by GeoJSon"
    },

    makeValid: {
        interface: "makeValid(geometry)",
        descRus: "Возвращает валидную геометрию",
        descEng: "Returns the valid geometry"
    },

    STEnvelopeMinX: {
        interface: "STEnvelopeMinX(geometry)",
        descRus: "Возвращает соответствующую часть BBOX’a геометрии",
        descEng: "Returns the relevant part of BBOX's geometry"
    },

    STEnvelopeMaxX: {
        interface: "STEnvelopeMaxX(geometry)",
        descRus: "Возвращает соответствующую часть BBOX’a геометрии",
        descEng: "Returns the relevant part of BBOX's geometry"
    },

    STEnvelopeMinY: {
        interface: "STEnvelopeMinY(geometry)",
        descRus: "Возвращает соответствующую часть BBOX’a геометрии",
        descEng: "Returns the relevant part of BBOX's geometry"
    },

    STEnvelopeMaxY: {
        interface: "STEnvelopeMaxY(geometry)",
        descRus: "Возвращает соответствующую часть BBOX’a геометрии",
        descEng: "Returns the relevant part of BBOX's geometry"
    },

    STContains: {
        interface: "STContains(geometry, geometry)",
        descRus: "Возвращает значение true, если первый экземпляр геометрии полностью содержит второй экземпляр. В противном случае возвращается значение false.",
        descEng: "Returns the relevant part of BBOX's geometry"
    },

    STIntersects: {
        interface: "STIntersects(geometry, geometry)",
        descRus: "Возвращает значение true, если экземпляр geometry пересекается с другим экземпляром geometry. В противном случае возвращается значение false.",
        descEng: "Returns true if the geometry intersects with another geometry instance, otherwise false is returned."
    },

    STIntersection: {
        interface: "STIntersection(geometry, geometry)",
        descRus: "Возвращает геометрию, представляющую пересечение указанных в аргументах двух геометрий.",
        descEng: "Returns a geometry representing the intersection of the two geometries specified in the arguments."
    },

    STDifference: {
        interface: "STDifference(geometry, geometry)",
        descRus: "Возвращает геометрию, представляющую разницу первой геометрии относительно второй.",
        descEng: "Returns a geometry representing the difference of the first geometry with respect to the second geometry."
    },

    STUnion: {
        interface: "STUnion(geometry, geometry)",
        descRus: "Возвращает новую геометрию из объединения двух геометрий из аргументов",
        descEng: "Returns a new geometry from the union of two geometries from the arguments"
    },

    geomIsEmpty: {
        interface: "geomIsEmpty(geometry)",
        descRus: "Возвращает новую геометрию из объединения двух геометрий из аргументов",
        descEng: "Returns a new geometry from the union of two geometries from the arguments"
    },

    STCentroid: {
        interface: "STCentroid(geometry)",
        descRus: "Вычисляет геометрический центр экземпляра geometry. Возвращает геометрию типа Point.",
        descEng: "Computes the geometric center of the geometry instance. Returns a geometry of type Point."
    },

    STAsText: {
        interface: "STAsText(geometry)",
        descRus: "Геометрия в формате WKT",
        descEng: "Geometry in WKT format"
    },

    geometryFromVectorLayerUnion: {
        interface: "geometryFromVectorLayerUnion(layerID, countID)",
        descRus: "Возвращает объединённую геометрию из всех геометрий векторного слоя.",
        descEng: "Returns the combined geometry from all geometry of the vector layer."
    },

    geometryFromRasterLayer: {
        interface: "geometryFromRasterLayer(layerID)",
        descRus: "Возвращает геометрию границу растрового слоя.",
        descEng: "Returns the geometry of the boundary of the raster layer"
    }
}
