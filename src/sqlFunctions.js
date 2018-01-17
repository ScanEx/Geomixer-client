nsGmx.sqlFunctions = {
    string: [
        "length", "lower", "upper", "trim", "lTrim", "rTrim", "left", "position",
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
}
