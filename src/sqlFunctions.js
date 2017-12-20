nsGmx.sqlFunctions = {

    //строки
    string: [
        "length", "lower", "upper", "trim", "lTrim", "rTrim", "left", "position",
        "substring", "right", "contains", "contiansIgnoreCase", "startsWith", "endsWith", "between"
    ],

    date: [
        "addDays", "addHours", "addMinutes", "addSeconds", "day", "month", "year",
        "now", "strToDateTime", "strToTime", "toString"
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
