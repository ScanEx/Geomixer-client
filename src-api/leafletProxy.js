//Поддержка leaflet
(function()
{
    //"use strict";
	var nextId = 0;							// следующий ID mapNode
	var LMap = null;						// leafLet карта
	var imagesSize = {};					// Размеры загруженных Images
	var mapNodes = {						// Хэш нод обьектов карты - аналог MapNodes.hx
		//	Ключ - id ноды
		//		'type': String - тип ноды ('mapObject')
		//		'parentId': String - id родительской ноды
		//		'properties': Hash - свойства ноды
		//		'geometry': Hash - геометрия ноды
		//		'leaflet': ссылка на leaflet обьект
		//		'zIndex': текущий zIndex ноды
	};
    // Группы zIndexOffset:
    // -100000  - группа слоев входящих в базовые подложки
    // 0        - группа растровых слоев
    // 50000    - группа overlay слоев
    // 100000   - группа векторных слоев
	var regProps = [			// массив регулярных выражений атрибутов обьекта  свойств 
		/\[([^\]]+)\]/i,
		/\"([^\"]+)\"/i,
		/\b([^\b]+)\b/i
	];
	var skipToolNames = {					// Хэш наименований tools при которых не проверяем события векторных слоев
		'POINT': true
		,'LINESTRING': true
		,'POLYGON': true
		,'FRAME': true
	};
	var patternDefaults = {					// настройки для pattern стилей
		'min_width': 1
		,'max_width': 1000
		,'min_step': 0
		,'max_step': 1000
	};

	var moveToTimer = null;
	var utils = {							// Утилиты leafletProxy
		'DEFAULT_REPLACEMENT_COLOR': 0xff00ff		// marker.color который не приводит к замене цветов иконки
        ,
        getTransformStyleName: gmxAPI.memoize(function()	{		// получить ключ стиля transform
            var testStyle = document.createElement("div").style;
            var stylePrefix =
                "webkitTransform" in testStyle ? "webkit" :
                "MozTransform" in testStyle ? "Moz" :
                "msTransform" in testStyle ? "ms" :
                "";
            return stylePrefix + (stylePrefix.length>0?"Transform":"transform");
        })
		,
        getMatrix3d: function(width, height, points) {		// получить matrix3d по 4 точкам привязки снимка [topLeft, topRight, bottomLeft, bottomRight]
            var aM = [
                    [0, 0, 1, 0, 0, 0, 0, 0],
                    [0, 0, 1, 0, 0, 0, 0, 0],
                    [0, 0, 1, 0, 0, 0, 0, 0],
                    [0, 0, 1, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 1, 0, 0],
                    [0, 0, 0, 0, 0, 1, 0, 0],
                    [0, 0, 0, 0, 0, 1, 0, 0],
                    [0, 0, 0, 0, 0, 1, 0, 0]
                ],
                bM = [0, 0, 0, 0, 0, 0, 0, 0],
                arr = [0, 1, 2, 3, 4, 5, 6, 7];
            for(var i = 0; i < 4; i++) {
                aM[i][0] = aM[i+4][3] = i & 1 ? width : 0;
                aM[i][1] = aM[i+4][4] = (i > 1 ? height : 0);
                aM[i][6] = (i & 1 ? -width : 0) * points[i][0];
                aM[i][7] = (i > 1 ? -height : 0) * points[i][0];
                aM[i+4][6] = (i & 1 ? -width : 0) * points[i][1];
                aM[i+4][7] = (i > 1 ? -height : 0) * points[i][1];
                bM[i] = points[i][0];
                bM[i + 4] = points[i][1];
                aM[i][2] = aM[i+4][5] = 1;
                aM[i][3] = aM[i][4] = aM[i][5] = aM[i+4][0] = aM[i+4][1] = aM[i+4][2] = 0;
            }
            var kmax, sum,
                row,
                col = [],
                i, j, k, tmp;
            for(j = 0; j < 8; j++) {
                for(var i = 0; i < 8; i++)  col[i] = aM[i][j];
                for(i = 0; i < 8; i++) {
                    row = aM[i];
                    kmax = i<j?i:j;
                    sum = 0.0;
                    for(k = 0; k < kmax; k++) sum += row[k] * col[k];
                    row[j] = col[i] -= sum;
                }
                var p = j;
                for(i = j + 1; i < 8; i++) {
                    if(Math.abs(col[i]) > Math.abs(col[p])) p = i;
                }
                if(p != j) {
                    for(k = 0; k < 8; k++) {
                        tmp = aM[p][k];
                        aM[p][k] = aM[j][k];
                        aM[j][k] = tmp;
                    }
                    tmp = arr[p];
                    arr[p] = arr[j];
                    arr[j] = tmp;
                }
                if(aM[j][j] != 0.0) for(i = j + 1; i < 8; i++) aM[i][j] /= aM[j][j];
            }
            for(i = 0; i < 8; i++) arr[i] = bM[arr[i]];
            for(k = 0; k < 8; k++) {
                for(i = k + 1; i < 8; i++) arr[i] -= arr[k] * aM[i][k];
            }
            for(k = 7; k > -1; k--) {
                arr[k] /= aM[k][k];
                for(i = 0; i < k; i++) arr[i] -= arr[k] * aM[i][k];
            }
            return arr;
		}
		,
        transformPoint: function(arr, x, y) {   // Получение преобразованных координат
            var w = arr[6]*x + arr[7]*y + 1;
            return {
                x: (arr[0]*x + arr[1]*y + arr[2])/w,
                y: (arr[3]*x + arr[4]*y + arr[5])/w
            }
        }
        ,
        m4_inverse: function(arr) {       // Получение обратной матрицы 4х4
            var m4_submat = function(mat, i, j) {
                var ti, tj, idst, jdst, res = [];

                for ( ti = 0; ti < 4; ti++ ) {
                    if ( ti < i ) idst = ti;
                    else if ( ti > i ) idst = ti - 1;

                    for ( tj = 0; tj < 4; tj++ ) {
                      if ( tj < j ) jdst = tj;
                      else if ( tj > j ) jdst = tj-1;

                      if ( ti != i && tj != j )
                        res[idst*3 + jdst] = mat[ti*4 + tj ];
                    }
                }
                return res;
            }
            var m3_det = function(mat) {
                return mat[0] * ( mat[4]*mat[8] - mat[7]*mat[5] )
                  - mat[1] * ( mat[3]*mat[8] - mat[6]*mat[5] )
                  + mat[2] * ( mat[3]*mat[7] - mat[6]*mat[4] );
            }
            var m4_det = function(arr) {             // Получение определителя матрицы 4х4
                var det, msub3, result = 0, i = 1;
                for (var n = 0; n < 4; n++, i *= -1 ) {
                    var msub3 = m4_submat( arr, 0, n );
                    det     = m3_det( msub3 );
                    result += arr[n] * det * i;
                }
                return result;
            }
            var mdet = m4_det( arr );
            if( Math.abs( mdet ) < 0.0005 ) return null;
            var i, j, sign, mtemp, mr = [];

            for ( i = 0; i < 4; i++ ) {
                for ( j = 0; j < 4; j++ ) {
                    sign = 1 - ( (i +j) % 2 ) * 2;
                    var mtemp = m4_submat( arr, i, j );
                    mr[i+j*4] = ( m3_det( mtemp ) * sign ) / mdet;
                }
            }
            return [
                mr[0],  mr[4],  mr[12], mr[1],
                mr[5],  mr[13], mr[3],  mr[7]
            ];
        }
		,
        getMatrix3dCSS: function(arr)	{		// получить CSS атрибут matrix3d
            var str = 'matrix3d(';
            str += arr[0].toFixed(9) + "," + arr[3].toFixed(9) + ", 0," + arr[6].toFixed(9);
            str += "," + arr[1].toFixed(9) + "," + arr[4].toFixed(9) + ", 0," + arr[7].toFixed(9);
            str += ",0, 0, 1, 0";
            str += "," + arr[2].toFixed(9) + "," + arr[5].toFixed(9) + ", 0, 1)";

            return str;
		}
		,
        getQuicklookPoints: function(coord)	{		// получить 4 точки привязки снимка
            var d1 = Number.MAX_VALUE;
            var d2 = Number.MAX_VALUE;
            var d3 = Number.MAX_VALUE;
            var d4 = Number.MAX_VALUE;
            var x1, y1, x2, y2, x3, y3, x4, y4;
            gmxAPI.forEachPoint(coord, function(p)
            {
                var x = p[0];
                var y = p[1];
                if ((x - y) < d1)
                {
                    d1 = x - y;
                    x1 = p[0];
                    y1 = p[1];
                }
                if ((-x - y) < d2)
                {
                    d2 = -x - y;
                    x2 = p[0];
                    y2 = p[1];
                }
                if ((-x + y) < d3)
                {
                    d3 = -x + y;
                    x3 = p[0];
                    y3 = p[1];
                }
                if ((x + y) < d4)
                {
                    d4 = x + y;
                    x4 = p[0];
                    y4 = p[1];
                }
            });
            return {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2, 'x3': x3, 'y3': y3, 'x4': x4, 'y4': y4};
        }
		,
		'getEquidistancePolygon': function(points, d) {		// получить обрамление линии
			var out = [];
			if(points.length) {
				var p = points[0];
				for (var i = 1, len = points.length; i < len; i++) {
					var p1 = points[i];
					var dx = p1.x - p.x;
					var dy = p1.y - p.y;
					var d2 = dx*dx + dy*dy;
					if(d2 > 0) {
						var dp = d / Math.sqrt(d2);
						var x0 = p1.x + dp * dx,		y0 = p1.y + dp * dy;
						var x3 = p1.x - dx - dp * dx,	y3 = p1.y - dy - dp * dy;
						var y01 = y0 - p1.y,	x01 = p1.x - x0;
						var y30 = y3 - p.y,		x30 = p.x - x3;
						out.push([
							[x0 + y01, y0 + x01]	// поворот на 90 град. точки p1 вокруг точки (x0,y0)
							,[x0 - y01, y0 - x01]	// поворот на -90 град. точки p1 вокруг точки (x0,y0)
							,[x3 + y30, y3 + x30]	// поворот на 90 град. точки p вокруг точки (x3,y3)
							,[x3 - y30, y3 - x30]	// поворот на -90 град. точки p вокруг точки (x3,y3)
						]);
					}
					p = p1;
				}
			}
			return out;
		}
		,
		'prepareLabelStyle': function(style) {		// подготовка Label стиля
			var size = style['label']['size'] || 12;
			var fillStyle = style['label']['color'] || 0;
			var haloColor = style['label']['haloColor'] || 0;
			var out = {
				'size': size
				,'align': style['label']['align'] || 'left'
				,'font': size + 'px "Arial"'
				,'strokeStyle': gmxAPI._leaflet['utils'].dec2rgba(haloColor, 1)
				,'fillStyle': gmxAPI._leaflet['utils'].dec2rgba(fillStyle, 1)
			};
			if(style['iconSize']) out['iconSize'] = style['iconSize'];
			return out;
		}
		,
		'chkIdle': function(flag, from)	{			// Проверка закончены или нет все команды отрисовки карты
			var out = false;
			//if(gmxAPI._leaflet['moveInProgress']) return out;
			for (var id in gmxAPI._leaflet['renderingObjects']) {
				return out;
			}
			
			if(gmxAPI._leaflet['lastDrawTime']) return out;
			var cnt = gmxAPI._leaflet['imageLoader'].getCounts();	// колич.выполняющихся запросов загрузки img
			if(cnt <= 0) {
				out = true;
				for (var i = 0, to = gmxAPI.map.layers.length; i < to; i++)
				{
					var child = gmxAPI.map.layers[i];
					if(!child.isVisible) continue;
					var mapNode = mapNodes[child.objectId];
					if(mapNode['lastDrawTime']) {	// слой находится в процессе отрисовки
						out = false;
						break;
					}
				}
				//out = {'out':out, 'from':from};
				if(flag && out) {
					gmxAPI._listeners.dispatchEvent('mapDrawDone', gmxAPI.map, out);	// map отрисована
				}
			}
			return out;
		}
		,
		'chkKeys': function(out, ev)	{		// Проверка нажатия спец.символов
			if(ev.buttons || ev.button) out.buttons = out.button = ev.buttons || ev.button;
			if(ev.ctrlKey)	out.ctrlKey = ev.ctrlKey;
			if(ev.altKey)	out.altKey = ev.altKey;
			if(ev.shiftKey)	out.shiftKey = ev.shiftKey;
			if(ev.metaKey)	out.metaKey = ev.metaKey;
		}
		,
		'getCurrentBounds': function(zoom)	{		// Вычисление размеров тайла по zoom
			if(!zoom) zoom = LMap.getZoom();
			var vBounds = LMap.getBounds();
			var vpNorthWest = vBounds.getNorthWest();
			var vpSouthEast = vBounds.getSouthEast();
			var vp1 = LMap.project(vpNorthWest, zoom);
			var vp2 = LMap.project(vpSouthEast, zoom);
			var vPixelBounds = new L.Bounds();
			vPixelBounds.extend(vp1);
			vPixelBounds.extend(vp2);
			var vBoundsMerc = new L.Bounds();
			if(vpSouthEast.lng - vpNorthWest.lng > 360) {
				vBoundsMerc.extend(new L.Point(-gmxAPI.worldWidthMerc, gmxAPI.worldWidthMerc));
				vBoundsMerc.extend(new L.Point(gmxAPI.worldWidthMerc, -gmxAPI.worldWidthMerc));
			} else {
				vBoundsMerc.extend(new L.Point(gmxAPI.merc_x(vpNorthWest.lng), gmxAPI.merc_y(vpNorthWest.lat)));
				vBoundsMerc.extend(new L.Point(gmxAPI.merc_x(vpSouthEast.lng), gmxAPI.merc_y(vpSouthEast.lat)));
			}
			
			return {
				'vPixelBounds': vPixelBounds
				,'vBounds': vBounds
				,'vBoundsMerc': vBoundsMerc
			};
		}
		,
		'chkZoomCurrent': function(zoom)	{		// Вычисление размеров тайла по zoom
			if(!zoom) zoom = LMap.getZoom();
			var pz = Math.pow(2, zoom);
			var mInPixel =  pz/156543.033928041;
			gmxAPI._leaflet.mInPixel = mInPixel;
			gmxAPI._leaflet.zoomCurrent = {
				zoom: zoom
				,pz: pz
				,tileSize: 256 / mInPixel
				,mInPixel: mInPixel
				,gmxTileBounds: {}
			};
		}
		,
		'getXmlHttp': function() {			// Получить XMLHttpRequest
		  var xmlhttp;
		  if (typeof XMLHttpRequest != 'undefined') {
			xmlhttp = new XMLHttpRequest();
		  } else {
			  try {
				xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
			  } catch (e) {
				try {
				  xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (E) {
				  xmlhttp = false;
				}
			  }
		  }
		  return xmlhttp;
		},
        chkMapObjectsView: function() { // Проверка zoomBounds на mapObjects
            var zoom = LMap.getZoom();
            for (var id in mapNodes) {
                var node = mapNodes[id];
                if(node.type !== 'mapObject' || (!node.minZ && !node.maxZ)) continue;
                //var flag = (utils.chkVisibleObject(node.id) && utils.chkVisibilityByZoom(node.id) ? true : false);
                var flag = (node.isVisible !== false && utils.chkVisibilityByZoom(node.id) ? true : false);
                if(!node.leaflet) gmxAPI._leaflet.drawManager.add(id);
                utils.setVisibleNode({obj: node, attr: flag});
                //gmxAPI._leaflet.LabelsManager.onChangeVisible(id, (!utils.chkVisibleObject(node.id) ? false : flag));
            }
        }
		,
		'rotatePoints': function(arr, angle, scale, center) {			// rotate - массива точек
			var out = [];
			angle *= Math.PI / 180.0
            var sin = Math.sin(angle),
                cos = Math.cos(angle),
                cx = scale * center.x,
                cy = scale * center.y;
            for (var i = 0, len = arr.length; i < len; i++) {
                var x = scale * arr[i].x - cx,
                    y = scale * arr[i].y - cy;
                
				out.push({
                    x: cos * x - sin * y
                    ,y: sin * x + cos * y
				});
			}
			return out;
		}
		, 
        rotateScalePolygonsPoints: function(curStyle, sx, sy) {
            var arr = [];
            if (curStyle.polygons) {
                var polygons = curStyle.polygons,
                    center = {x: curStyle.imageWidth/2, y: curStyle.imageHeight/2},
                    scale = curStyle.scale || 1,
                    rotate = curStyle.rotate;

                for (var i = 0, len = polygons.length; i < len; i++) {
                    var p = polygons[i];
                    arr.push(gmxAPI._leaflet.utils.rotatePoints(p.points, rotate, scale, center));
                }
            }
            return arr;
        }
        , 
		'getPatternIcon': function(item, style) {			// получить bitmap стиля pattern
			if(!style['pattern']) return null;
			var pattern = style['pattern'];
			var prop = (item ? item['properties'] : {});

			var notFunc = true;
			var step = (pattern.step > 0 ? pattern.step : 0);		// шаг между линиями
			if (pattern.patternStepFunction != null && prop != null) {
				step = pattern.patternStepFunction(prop);
				notFunc = false;
			}
			if (step > patternDefaults['max_step']) step = patternDefaults['max_step'];
			else if (step < patternDefaults['min_step']) step = patternDefaults['min_step'];
			
			var size = (pattern.width > 0 ? pattern.width : 8);		// толщина линий
			if (pattern.patternWidthFunction != null && prop != null) {
				size = pattern.patternWidthFunction(prop);
				notFunc = false;
			}
			if (size > patternDefaults['max_width']) size = patternDefaults['max_width'];
			else if (size < patternDefaults['min_width']) size = patternDefaults['min_width'];

			var op = style['fillOpacity'];
			if (style['opacityFunction'] != null && prop != null) {
				op = style['opacityFunction'](prop) / 100;
				notFunc = false;
			}
			
			var arr = (pattern.colors != null ? pattern.colors : []);
			var count = arr.length;
			var resColors = []
			var rgb = [0xff0000, 0x00ff00, 0x0000ff];
			for (var i = 0; i < arr.length; i++) {
				var col = arr[i];
				if(pattern['patternColorsFunction'][i] != null) {
					col =  (prop != null ? pattern['patternColorsFunction'][i](prop): rgb[i%3]);
					notFunc = false;
				}
				resColors.push(col);
			}

			var delta = size + step;
			var allSize = delta * count;
			var center = 0,	radius = 0,	rad = 0; 

			var hh = allSize;				// высота битмапа
			var ww = allSize;				// ширина битмапа
			var type = pattern.style; 
			var flagRotate = false; 
			if (type == 'diagonal1' || type == 'diagonal2' || type == 'cross' || type == 'cross1') {
				flagRotate = true;
			} else if (type == 'circle') {
				ww = hh = 2 * delta;
				center = Math.floor(ww / 2);	// центр круга
				radius = Math.floor(size / 2);	// радиус
				rad = 2 * Math.PI / count;		// угол в рад.
			}
			if (ww * hh > patternDefaults['max_width']) {
				//gmxAPI.addDebugWarnings({'func': 'getPatternIcon', 'Error': 'MAX_PATTERN_SIZE', 'alert': 'Bitmap from pattern is too big'});
				//return null;
			}

			var canvas = document.createElement('canvas');
			canvas.width = ww; canvas.height = hh;
			var ptx = canvas.getContext('2d');
			ptx.clearRect(0, 0, canvas.width , canvas.height);
			if (type === 'diagonal2' || type === 'vertical') {
				ptx.translate(ww, 0);
				ptx.rotate(Math.PI/2);
			}

			for (var i = 0; i < count; i++) {
				ptx.beginPath();
				var col = resColors[i];
				var fillStyle = gmxAPI._leaflet['utils'].dec2rgba(col, 1);
				fillStyle = fillStyle.replace(/1\)/, op + ')');
				ptx.fillStyle = fillStyle;

				if (flagRotate) {
					var x1 = i * delta; var xx1 = x1 + size;
					ptx.moveTo(x1, 0); ptx.lineTo(xx1, 0); ptx.lineTo(0, xx1); ptx.lineTo(0, x1); ptx.lineTo(x1, 0);

					x1 += allSize; xx1 = x1 + size;
					ptx.moveTo(x1, 0); ptx.lineTo(xx1, 0); ptx.lineTo(0, xx1); ptx.lineTo(0, x1); ptx.lineTo(x1, 0);
					if (type === 'cross' || type === 'cross1') {
						x1 = i * delta; xx1 = x1 + size;
						ptx.moveTo(ww, x1); ptx.lineTo(ww, xx1); ptx.lineTo(ww - xx1, 0); ptx.lineTo(ww - x1, 0); ptx.lineTo(ww, x1);

						x1 += allSize; xx1 = x1 + size;
						ptx.moveTo(ww, x1); ptx.lineTo(ww, xx1); ptx.lineTo(ww - xx1, 0); ptx.lineTo(ww - x1, 0); ptx.lineTo(ww, x1);
					}
				} else if (type == 'circle') {
					ptx.arc(center, center, size, i*rad, (i+1)*rad);
					ptx.lineTo(center, center);
				} else {
					ptx.fillRect(0, i * delta, ww, size);
				}
				ptx.closePath();
				ptx.fill();
			}
			var imgData = ptx.getImageData(0, 0, ww, hh);
			var canvas1 = document.createElement('canvas');
			canvas1.width = ww
			canvas1.height = hh;
			var ptx1 = canvas1.getContext('2d');
			ptx1.drawImage(canvas, 0, 0, ww, hh);
			return { 'notFunc': notFunc, 'canvas': canvas1 };
		}
		,
		'replaceColorAndRotate': function(img, style, size) {		// заменить цвет пикселов в иконке + rotate - результат canvas
			var canvas = document.createElement('canvas'),
                ww = style.imageWidth,
                hh = style.imageHeight;
			if(style.rotateRes) {
				ww = size || style.maxWeight || Math.ceil(Math.sqrt(ww*ww + hh*hh));
				hh = ww;
			}
			canvas.width = ww;
			canvas.height = hh;
			var ptx = canvas.getContext('2d');
			ptx.clearRect(0, 0, ww , hh);
			//ptx.fillRect(0, 0, ww , hh);
			var tx = 0,
                ty = 0;
			if(style.rotateRes) {
				tx = style.imageWidth/2;
				ty = style.imageHeight/2;
				ptx.translate(ww/2, hh/2);
				ptx.rotate(Math.PI * style.rotateRes/180);
			}
			ptx.drawImage(img, -tx, -ty);
			if('color' in style) {
				var color = style.color;
				if(typeof(color) == 'string') color = parseInt('0x' + color.replace(/#/, ''));
				if (color != gmxAPI._leaflet.utils.DEFAULT_REPLACEMENT_COLOR) {
					var r = (color >> 16) & 255,
                        g = (color >> 8) & 255,
                        b = color & 255,
                        flag = false;

					var imageData = ptx.getImageData(0, 0, ww, hh),
                        data = imageData.data;
					for (var i = 0, len = data.length; i < len; i+=4) {
						if (data[i] === 0xff
							&& data[i+1] === 0
							&& data[i+2] === 0xff
							) {
							data[i] = r;
							data[i+1] = g;
							data[i+2] = b;
							flag = true;
						}
					}
					if(flag) ptx.putImageData(imageData, 0, 0);
				}
			}
			return canvas;
		}
		,
		'getMapImage': function(attr)	{			//получить PNG карты
		}
		,
		'startDrag': function(node)	{			// Начать Drag
			if(!node || !node.dragging) return;
			var layer = node.leaflet;
			if(!layer && node.type != 'map') return;
			var chkDrag = function(eType, e) {
				if(!node.dragging) return;
				var gmxNode = gmxAPI.mapNodes[node.id];		// Нода gmxAPI
				var latlng = (layer && layer._latlng ? layer._latlng : e.latlng || gmxAPI._leaflet.mousePos);
				var ph = {
					'obj':gmxNode
					,'attr': {
						'id': e.target.options && e.target.options.from ? e.target.options.from : node.id
						,'x': latlng.lng
						,'y': latlng.lat
						,'e': e
					}
				};
				gmxAPI._listeners.dispatchEvent(eType, gmxNode, ph);
			};
			// todo drag без лефлета
			if(layer && layer.dragging) {
				layer.on('dragstart', function(e){
					if(!node.dragging) return;
					node.onDrag = true;
					chkDrag('dragstart', e);
				});	// dragstart на обьекте
				layer.on('drag', function(e){
					if(!node.dragging) return;
					chkDrag('drag', e);
				});			// Drag на обьекте
				layer.on('dragend', function(e){		// dragend на обьекте
					//if(!node['dragging']) return;
					node.onDrag = false;
					chkDrag('dragend', e);
					//layer.off('drag');
					//layer.off('dragstart');
					//layer.off('dragend');
				});
				layer.dragging.enable();
				layer.options._isHandlers = true;
				layer.options.dragging = true;
				layer.update();
			}
			else
			{
				if(!layer) layer = LMap;
				layer.on('mouseover', function(e) {
					commands.freeze();
				});
				layer.on('mouseout', function(e) {
					if(!gmxAPI._leaflet.mousePressed) commands.unfreeze();
				});
				node['dragMe'] = function(e) {		// dragstart на обьекте
					chkDrag('dragstart', e);
					commands.freeze();
					//L.DomEvent.stop(e.originalEvent);
					if(!node._dragInitOn) {
						LMap.on('mousemove', function(e) {		// drag на обьекте
							if(gmxAPI._leaflet.curDragState) {
								chkDrag('drag', e);
							}
						});
						LMap.on('mouseup', function(e) {			// dragend на обьекте
							commands.unfreeze();
							chkDrag('dragend', e);
							node._dragInitOn = false;
						});
					}
					node._dragInitOn = true;		// drag инициализирован
				};
                layer.on('mousedown', node.dragMe);
			}
		}
		,
		'chkClassName': function(node, className, stopNode)	{			//проверить есть заданный className по ветке родителей до ноды
			if(!node || node == stopNode) return false;
			try {
				var pName = node['className'] || '';
				if(typeof(pName) == 'string' && pName.indexOf(className) != -1) return true;
				if(node.parentNode) return utils.chkClassName(node.parentNode, className, stopNode);
			} catch(e) {
				return true;
			}
            return false;
		}
		,
		'getScaleImage': function(img, sx, sy)	{			//получить img отскалированный в Canvas
			var canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			var ctx = canvas.getContext('2d');
			if(!sy) sy = sx;
			ctx.scale(sx * img.width, sy * img.height);
			var divOut = gmxAPI._div;
			ctx.drawImage(img, 0, 0);
			return canvas;
		}
        ,
        'prpLayerBounds': function(geom)	{			// Подготовка атрибута границ слоя
            var bounds = new L.Bounds(),
                out = {
                    bounds: bounds						// Bounds слоя
                };
            if(geom && geom.coordinates) {						// Формируем MULTIPOLYGON
                var arr = null,
                    type = geom.type;
                out.type = type;
                if(type == 'POLYGON' || type == 'Polygon') {
                    arr = [geom.coordinates];
                } else if(type == 'MULTIPOLYGON' || type == 'MultiPolygon') {
                    arr = geom.coordinates;
                }
                if(arr) {
                    var pointsArr = [];
                    for (var i = 0; i < arr.length; i++)
                    {
                        for (var j = 0; j < arr[i].length; j++)
                        {
                            var pArr = [];
                            var pol = arr[i][j];
                            for (var j1 = 0; j1 < pol.length; j1++)
                            {
                                var p = (typeof(pol[j1]) === 'object' ? new L.Point( pol[j1][0], pol[j1][1] ) : new L.Point( pol[j1++], pol[j1] ));
                                pArr.push(p);
                                bounds.extend(p);
                            }
                            pointsArr.push(pArr);
                        }
                    }
                    out.geom = pointsArr;						// Массив Point границ слоя
                }
            }
            return out;
        }
        ,
        prpLayerAttr: function(layer, node)	{				// Подготовка атрибутов слоя
            var out = {};
            if(layer) {
                if(layer.properties) {
                    var prop = layer.properties;
                    if(node.type == 'RasterLayer') {			// растровый слой
                        out.minZoom = (prop.MinZoom ? prop.MinZoom : 1);
                        out.maxZoom = (prop.MaxZoom ? prop.MaxZoom : 20);
                        if(prop.type == 'Overlay') out.isOverlay = true;
                    }
                    else if(node.type == 'VectorLayer') {	// векторный слой
                        out.identityField = (prop.identityField ? prop.identityField : 'ogc_fid');
                        out.ZIndexField = prop.ZIndexField || out.identityField;
                        
                        out.typeGeo = (prop.GeometryType ? prop.GeometryType : 'Polygon');
                        out.TemporalColumnName = (prop.TemporalColumnName ? prop.TemporalColumnName : '');
                        
                        out.minZoom = 22;
                        out.maxZoom = 1;
                        for (var i = 0; i < prop.styles.length; i++)
                        {
                            var style = prop.styles[i];
                            out.minZoom = Math.min(out.minZoom, style.MinZoom);
                            out.maxZoom = Math.max(out.maxZoom, style.MaxZoom);
                            //if(style['clusters']) out['clustersFlag'] = true;	// Признак кластеризации на слое
                        }
                    }
                }
                var pt = utils.prpLayerBounds(layer.geometry);
                if(pt.bounds) out.bounds = pt.bounds;				// Bounds слоя
                if(layer.geometry) {
                    if(pt.geom) out.geom = pt.geom;					// Массив Point границ слоя
                    if(layer.mercGeometry) {
                        var pt = utils.prpLayerBounds(layer.mercGeometry);
                        if(pt.geom) {
                            out.mercGeom = pt.geom;				// Массив Point границ слоя в merc
                            //out['mercGeom'] = [L.LineUtil.simplify(pt['geom'][0], 120)];
                        }
                    }
                }
            }
            return out;
        }
        ,
        'getLabelSize': function(txt, style)	{			// Получить размер Label
            var out = {'x': 0, 'y': 0};
            if(style) {
                var ptx = gmxAPI._leaflet['labelCanvas'].getContext('2d');
                ptx.clearRect(0, 0, 512, 512);
                ptx.font = style['font'];
                ptx.fillStyle = style['fillStyle'];
                ptx.fillText(txt, 0, 0);
                
                var sizeLabel = style['size'] || 12;
                out.x = ptx.measureText(txt).width;
                out.y = sizeLabel + 2;
            }
            return out;
        }
        ,
        'chkPointWithDelta': function(chkBounds, point, attr)	{			// Проверка точки(с учетом размеров) на принадлежность Bounds
            var mInPixel = gmxAPI._leaflet.mInPixel;
            return (
                (chkBounds.min.x - point.x)*mInPixel > attr.sx + (attr.sxLabelLeft || 0)
                || (point.x - chkBounds.max.x)*mInPixel > attr.sx + (attr.sxLabelRight || 0)
                || (chkBounds.min.y - point.y)*mInPixel > attr.sy + (attr.syLabelBottom || 0)
                || (point.y - chkBounds.max.y)*mInPixel > attr.sy + (attr.syLabelTop || 0)
                ? false : true);
        },
        _sqDistanceToSegmentArr: function (p, p1, p2) { // return distance to point
            var x = p1[0], y = p1[1],
                dx = p2[0] - x, dy = p2[1] - y,
                dot = dx * dx + dy * dy,
                t;

            if (dot > 0) {
                t = ((p[0] - x) * dx + (p[1] - y) * dy) / dot;

                if (t > 1) {
                    x = p2[0];
                    y = p2[1];
                } else if (t > 0) {
                    x += dx * t;
                    y += dy * t;
                }
            }

            dx = p[0] - x;
            dy = p[1] - y;

            return dx * dx + dy * dy;
        }
        ,
        'chkPointInPolyLineArr': function(chkPoint, lineHeight, coords) {	// Проверка точки(с учетом размеров) на принадлежность линии
            var mInPixel = gmxAPI._leaflet.mInPixel;
            var chkLineHeight = lineHeight / mInPixel;
            chkLineHeight *= chkLineHeight;
            
            var p1 = coords[0];
            for (var i = 1, len = coords.length; i < len; i++) {
                var p2 = coords[i],
                    sqDist = utils._sqDistanceToSegmentArr(chkPoint, p1, p2);
                if(sqDist < chkLineHeight) return true;
                p1 = p2;
            }
            return false;
        }
        ,
        'chkPointInPolyLine': function(chkPoint, lineHeight, coords) {	// Проверка точки(с учетом размеров) на принадлежность линии
            var mInPixel = gmxAPI._leaflet['mInPixel'];
            var chkLineHeight = lineHeight / mInPixel;
            chkLineHeight *= chkLineHeight;
            
            var p1 = coords[0];
            for (var i = 1, len = coords.length; i < len; i++) {
                var p2 = coords[i],
                    sqDist = L.LineUtil._sqClosestPointOnSegment(chkPoint, p1, p2, true);
                if(sqDist < chkLineHeight) return true;
                p1 = p2;
            }
            return false;
        }
        ,
        'isPointInPolygon': function(chkPoint, poly)	{			// Проверка точки на принадлежность полигону
            var isIn = false;
            var p1 = poly[0];
            for (var i = 1, len = poly.length; i < len; i++) {
                var p2 = poly[i];
                if (chkPoint.x > Math.min(p1.x, p2.x)) 
                {
                    if (chkPoint.x <= Math.max(p1.x, p2.x)) 
                    {
                        if (chkPoint.y <= Math.max(p1.y, p2.y)) 
                        {
                            if (p1.x != p2.x) 
                            {
                                var xinters = (chkPoint.x - p1.x)*(p2.y - p1.y)/(p2.x - p1.x) + p1.y;
                                if (p1.y == p2.y || chkPoint.y <= xinters) isIn = !isIn;
                            }
                        }
                    }
                }
                p1 = p2;
            }
            return isIn;
        }
        ,
        'isPointInPolygonArr': function(chkPoint, poly)	{			// Проверка точки на принадлежность полигону в виде массива
            var isIn = false,
                x = chkPoint[0],
                y = chkPoint[1],
                p1 = poly[0];
            for (var i = 1, len = poly.length; i < len; i++) {
                var p2 = poly[i],
                    xmin = Math.min(p1[0], p2[0]),
                    xmax = Math.max(p1[0], p2[0]),
                    ymax = Math.max(p1[1], p2[1]);
                if (x > xmin && x <= xmax && y <= ymax && p1[0] != p2[0]) {
                    var xinters = (x - p1[0])*(p2[1] - p1[1])/(p2[0] - p1[0]) + p1[1];
                    if (p1[1] == p2[1] || y <= xinters) isIn = !isIn;
                }
                p1 = p2;
            }
            return isIn;
        }
        ,
        'getMapPosition': function()	{			// Получить позицию карты
            var zoom = LMap.getZoom();
            if(!zoom) {
                return null;
            }
            var pos = LMap.getCenter(),
                size = LMap.getSize(),
                vbounds = LMap.getBounds(),
                se = vbounds.getSouthEast(),
                nw = vbounds.getNorthWest(),
                all = (se.lng - nw.lng >= 360 ? true : false),
                cnt = - parseInt(nw.lng / 360),
                lng = nw.lng % 360;
            cnt += (lng < -180 ? 1 : (lng > 180 ? -1 : 0));
            var dx = cnt * 360;
            var ext = {
                minX: all ? -180 : nw.lng + dx
                ,minY: (se.lat > -gmxAPI.MAX_LATITUDE ? se.lat : -gmxAPI.MAX_LATITUDE)
                ,maxX: all ? 180 : se.lng + dx
                ,maxY: (nw.lat < gmxAPI.MAX_LATITUDE ? nw.lat : gmxAPI.MAX_LATITUDE)
            };
            var currPosition = {
                z: zoom
                ,stageHeight: size.y
                ,x: gmxAPI.merc_x(pos.lng)
                ,y: gmxAPI.merc_y(pos.lat)
                ,latlng: {
                    x: pos.lng
                    ,y: pos.lat
                    ,mouseX: utils.getMouseX()
                    ,mouseY: utils.getMouseY()
                    ,extent: ext
                }
            };
            currPosition.mouseX = gmxAPI.merc_x(currPosition.latlng.mouseX);
            currPosition.mouseY = gmxAPI.merc_x(currPosition.latlng.mouseY);
            currPosition.extent = {
                minX: gmxAPI.merc_x(ext.minX),
                minY: gmxAPI.merc_y(ext.minY),
                maxX: gmxAPI.merc_x(ext.maxX),
                maxY: gmxAPI.merc_y(ext.maxY)
            };
            return currPosition;
        }
        ,
        'runMoveTo': function(attr, zd)	{				//позиционирует карту по координатам
            if(moveToTimer) clearTimeout(moveToTimer);
            if(!zd) zd = 200;
            if (attr && attr.z) gmxAPI.needZoom = attr.z;
            moveToTimer = setTimeout(function() {
                if(!attr && !gmxAPI.map.needMove) return;
                var flagInit = (gmxAPI.map.needMove ? true : false),
                    px = (attr ? attr.x : (flagInit ? gmxAPI.map.needMove.x : 0)),
                    py = (attr ? attr.y : (flagInit ? gmxAPI.map.needMove.y : 0)),
                    z = (attr ? attr.z : (flagInit ? gmxAPI.map.needMove.z : 1));
                if (px > 180 || px < -180) {
                    px %= 360;
                    if (px < -180) px += 360;
                    else if (px > 180) px -= 360;
                }
                var pos = new L.LatLng(py, px),
                    opt = gmxAPI._leaflet.zoomstart || {};
                gmxAPI.needZoom = null;
                gmxAPI.map.needMove = null;
                LMap.setView(pos, z, opt);
            }, zd);
        }
        ,
        'getPixelMap': function()	{				// Получение текущий размер карты в pixels
            var vBounds = LMap.getBounds();
            var vpNorthWest = vBounds.getNorthWest();
            var vpSouthEast = vBounds.getSouthEast();
            var vp1 = LMap.project(vpNorthWest);
            var vp2 = LMap.project(vpSouthEast);
            return new L.Point(vp2.x - vp1.x, vp2.y - vp1.y);
        }
        ,
        'chkBoundsVisible': function(b)	{					// проверить видимость Bounds с учетом сдвигов по X
            var vbounds = LMap.getBounds();
            var nw = vbounds.getNorthWest();
            var se = vbounds.getSouthEast();
            var vb = new L.Bounds(new L.Point(nw['lng'], nw['lat']), new L.Point(se['lng'], se['lat']));
            if(vb.intersects(b)) return true;
            var tb = new L.Bounds(new L.Point(b.min.x + 360, b.min.y), new L.Point(b.max.x + 360, b.max.y));
            if(vb.intersects(tb)) return true;
            tb = new L.Bounds(new L.Point(b.min.x - 360, b.min.y), new L.Point(b.max.x - 360, b.max.y));
            if(vb.intersects(tb)) return true;
            return false;
        }
        ,
        'getOSMShift': function()	{				// Получение сдвига OSM
            var pos = LMap.getCenter();
            var z = LMap.getZoom();
            var point = LMap.project(pos);
            var p1 = LMap.project(new L.LatLng(gmxAPI.from_merc_y(utils.y_ex(pos.lat)), pos.lng), z);
            return point.y - p1.y;
        }
        ,
        getSortLayers: function(name) { // получить отсортированный по zIndex массив видимых слоев имеющих заданный метод
            var arr = [];
            for (var i = 0, len = gmxAPI.map.layers.length; i < len; i++) {
                var child = gmxAPI.map.layers[i];
                if(!child || !child.isVisible) continue;
                var mapNode = mapNodes[child.objectId];
                if(name in mapNode) {
                    var index = (mapNode.zIndexOffset || 0) + (mapNode.zIndex || 0);
                    arr.push({zIndex: index, id: child.objectId});
                }
            }
            arr = arr.sort(function(a, b) { return b.zIndex - a.zIndex; });
            return arr;
        }
        ,
        chkGlobalEvent: function(attr)	{					// проверка Click на перекрытых нодах
            if(!attr || !attr.evName) return false;
            var evName = attr.evName;

            if(!gmxAPI._drawing || (!gmxAPI._drawing.activeState && gmxAPI._drawing.type !== 'POINT')) {
                var arr = utils.getSortLayers('eventsCheck');
                
                for (var i = 0, len = arr.length; i < len; i++) {
                    var it = arr[i];
                    var mapNode = mapNodes[it.id];
                    if(mapNode.eventsCheck(evName, attr)) {
                        return true;
                    }
                }
            }
            if(attr.tID) {
                var gmxNode = null;
                if(attr.tID.indexOf('_drawing') > 0) {
                    gmxNode = gmxAPI.map.drawing.getHoverItem(attr);
                }
                if(gmxNode && gmxNode.stateListeners[evName]) {
                    if(gmxAPI._listeners.dispatchEvent(evName, gmxNode, {attr:attr})) return true;
                }
            }
            if(attr.node && attr.hNode && attr.hNode.handlers[evName]) {
                if(attr.hNode.handlers[evName](attr.node.id, attr.node.geometry.properties, {ev:attr.ev})) return true;
            }

            var mapID = gmxAPI.map.objectId;
            var node = mapNodes[mapID];
            if(node.handlers[evName]) {
                if(node.handlers[evName](mapID, gmxAPI.map.properties, attr)) return true;
            } else if(gmxAPI.map.stateListeners[evName] && gmxAPI.map.stateListeners[evName].length) {
                if(gmxAPI._listeners.dispatchEvent(evName, gmxAPI.map, {attr:attr})) return true;
            }
            return false;
        }
        ,
        'chkVisibilityByZoom': function(id)	{				// проверка видимости обьекта - по minZ maxZ
            var node = mapNodes[id];
            if(!node || node.type === 'map') return true;
            var pNode = mapNodes[node.parentId],
                zoom = LMap.getZoom(),
                z1 = node.minZ || 1,
                z2 = node.maxZ || 100;
            var flag = (zoom < z1 || zoom > z2 ? false 
                : (pNode ? utils.chkVisibilityByZoom(pNode.id) : true));
            return flag;
        }
        ,
        'chkVisibleObject': function(id)	{				// проверка видимости обьекта - по isVisible
            var node = mapNodes[id];
            if(!node || node['type'] === 'map') return true;
            if(node.isVisible === false) return false;
            return utils.chkVisibleObject(node['parentId']);
        }
        ,
        getTileListByExtent: function(ext) { // получить список тайлов по extent на определенном zoom
            if(!gmxAPI._leaflet.zoomCurrent) utils.chkZoomCurrent();
            var res = {},
                z = gmxAPI._leaflet.zoomCurrent.zoom,
                tileSize = gmxAPI._leaflet.zoomCurrent.tileSize,
                minx = Math.floor(ext.minX / tileSize),
                miny = Math.floor(ext.minY / tileSize),
                maxx = Math.ceil(ext.maxX / tileSize),
                maxy = Math.ceil(ext.maxY / tileSize);
            for (var x = minx; x < maxx; x++) {
                for (var y = miny; y < maxy; y++) {
                    res[z + '_' + x + '_' + y] = true;
                }
            }
            return res;
        }
        ,
		'getImageSize': function(pt, flag, id)	{				// определение размеров image
			var url = pt.iconUrl;
			if(imagesSize[url]) {
				pt.imageWidth = imagesSize[url].imageWidth;
				pt.imageHeight = imagesSize[url].imageHeight;
				pt.maxWeight = Math.ceil(Math.sqrt(pt.imageWidth*pt.imageWidth + pt.imageHeight*pt.imageHeight));
				if(flag) {
					pt.image = imagesSize[url].image;
				}
				if(pt.waitStyle) {
					pt.waitStyle(id);
				}
				delete pt.waitStyle;
				return;
			}
			var ph = {
				'src': url
				,'callback': function(it, svgFlag) {
					pt.imageWidth = it.width;
					pt.imageHeight = it.height;
					pt.maxWeight = Math.ceil(Math.sqrt(pt.imageWidth*pt.imageWidth + pt.imageHeight*pt.imageHeight));
					if(svgFlag) {
						pt.polygons = it.polygons;
					} else {
                        if(flag) pt.image = it;
					}
					imagesSize[url] = pt;
					if(pt.waitStyle) {
						pt.waitStyle(id);
					}
					delete pt.waitStyle;
					gmxAPI._listeners.dispatchEvent('onIconLoaded', null, id);		// image загружен
				}
				,'onerror': function(){
					pt.imageWidth = 1;
					pt.imageHeight = 0;
					pt.image = null;
					imagesSize[url] = pt;
					gmxAPI.addDebugWarnings({'url': url, 'func': 'getImageSize', 'Error': 'image not found'});
				}
			};
			if(('color' in pt && pt.color != utils.DEFAULT_REPLACEMENT_COLOR)
				|| 'rotate' in pt
			) ph.crossOrigin = 'anonymous';
			gmxAPI._leaflet.imageLoader.unshift(ph);
		}
		,'getMouseX':	function()	{ return (gmxAPI._leaflet['mousePos'] ? gmxAPI._leaflet['mousePos'].lng : 0); }			// Позиция мыши X
		,'getMouseY':	function()	{ return (gmxAPI._leaflet['mousePos'] ? gmxAPI._leaflet['mousePos'].lat : 0);	}		// Позиция мыши Y
		,
		'parseStyle': function(st, id, callback)	{			// перевод Style Scanex->leaflet
			var pt =  {
			};
			if(!st) return null;
			
			pt.label = false;
			if(typeof(st.label) === 'object') {											//	Есть стиль label
				var ph = st.label,
                    names = ['color', 'haloColor', 'size', 'spacing', 'align', 'dx', 'dy', 'field'],
                    res = {};
                for (var i = 0, len = names.length; i < len; i++) {
                    var key = names[i];
                    if(key in ph) res[key] = ph[key];
				}
				pt.label = res;
			}
			pt.marker = false;
			var isMarker = (typeof(st.marker) === 'object' ? true : false);
			
			if(isMarker) {				//	Есть стиль marker
				var ph = st.marker,
                    names = ['size', 'circle', 'center', 'scale'];
                for (var i = 0, len = names.length; i < len; i++) {
                    var key = names[i];
                    if(key in ph) pt[key] = ph[key];
				}
			}
			if(isMarker && 'image' in st.marker) {				//	Есть image у стиля marker
				pt.marker = true;
				var ph = st.marker,
                    names = ['color', 'size', 'center', 'scale', 'minScale', 'maxScale', 'dx', 'dy'];
                for (var i = 0, len = names.length; i < len; i++) {
                    var key = names[i];
                    if(key in ph) pt[key] = ph[key];
				}
				pt.opacity = ('opacity' in ph ? ph.opacity : 100);
				if('angle' in ph) pt.rotate = ph.angle;
				if('image' in ph) {
					pt.iconUrl = ph.image;
					try {
                        if(typeof(callback) === 'function') pt.waitStyle = callback;
						utils.getImageSize(pt, true, id);
					} catch(ev) {
						gmxAPI.addDebugWarnings({'url': pt.iconUrl, 'func': 'getImageSize', 'alert': 'getImageSize error ' + pt.iconUrl});
					}
				}
			} else {
				pt.fill = false;
				if(typeof(st.fill) === 'object') {					//	Есть стиль заполнения
					pt.fill = true;
					var ph = st.fill;
					if('color' in ph) pt.fillColor = ph.color;
                    pt.fillOpacity = ('opacity' in ph ? ph.opacity : 100);
					if('pattern' in ph) {
						var pattern = ph.pattern;
						delete pattern._res;
						pt.pattern = pattern;
						if('step' in pattern && typeof(pattern.step) === 'string') {
							pattern.patternStepFunction = gmxAPI.Parsers.parseExpression(pattern.step);
						}
						if('width' in pattern && typeof(pattern.width) === 'string') {
							pattern.patternWidthFunction = gmxAPI.Parsers.parseExpression(pattern.width);
						}
						if('colors' in pattern) {
							var arr = [];
							for (var i = 0, len = pattern.colors.length; i < len; i++) {
								var rt = pattern.colors[i];
								arr.push(typeof(rt) === 'string' ? gmxAPI.Parsers.parseExpression(rt) : null);
							}
							pattern.patternColorsFunction = arr;
						}
					} else if(typeof(ph.radialGradient) === 'object') {
						pt.radialGradient = ph.radialGradient;
						//	x1,y1,r1 — координаты центра и радиус первой окружности;
						//	x2,y2,r2 — координаты центра и радиус второй окружности.
						//	addColorStop - стоп цвета объекта градиента [[position, color]...]
						//		position — положение цвета в градиенте. Значение должно быть в диапазоне 0.0 (начало) до 1.0 (конец);
						//		color — код цвета или формула.
						//		opacity — прозрачность
						var arr = ['r1', 'x1', 'y1', 'r2', 'x2', 'y2'];
						for (var i = 0, len = arr.length; i < len; i++) {
							var it = arr[i];
							pt.radialGradient[it] = (it in ph.radialGradient ? ph.radialGradient[it] : 0);
							if(typeof(pt.radialGradient[it]) === 'string') {
								pt.radialGradient[it+'Function'] = gmxAPI.Parsers.parseExpression(pt.radialGradient[it]);
							}
						}
						
						pt.radialGradient.addColorStop = ph.radialGradient.addColorStop || [[0, 0xFF0000], [1, 0xFFFFFF]];
						pt.radialGradient.addColorStopFunctions = [];
						for (var i = 0, len = pt.radialGradient.addColorStop.length; i < len; i++) {
							var arr = pt.radialGradient.addColorStop[i];
							pt.radialGradient.addColorStopFunctions.push([
								(typeof(arr[0]) === 'string' ? gmxAPI.Parsers.parseExpression(arr[0]) : null)
								,(typeof(arr[1]) === 'string' ? gmxAPI.Parsers.parseExpression(arr[1]) : null)
								,(typeof(arr[2]) === 'string' ? gmxAPI.Parsers.parseExpression(arr[2]) : null)
							]);
						}
					} else if(typeof(ph.linearGradient) === 'object') {
						pt.linearGradient = ph.linearGradient;
						//	x1,y1 — координаты начальной точки
						//	x2,y2 — координаты конечной точки
						//	addColorStop - стоп цвета объекта градиента [[position, color]...]
						//		position — положение цвета в градиенте. Значение должно быть в диапазоне 0.0 (начало) до 1.0 (конец);
						//		color — код цвета или формула.
						//		opacity — прозрачность
						var arr = ['x1', 'y1', 'x2', 'y2'];
						for (var i = 0, len = arr.length; i < len; i++) {
							var it = arr[i];
							pt.linearGradient[it] = (it in ph.linearGradient ? ph.linearGradient[it] : 0);
							if(typeof(pt.linearGradient[it]) === 'string') {
								pt.linearGradient[it+'Function'] = gmxAPI.Parsers.parseExpression(pt.linearGradient[it]);
							}
						}
						
						pt.linearGradient.addColorStop = ph.linearGradient.addColorStop || [[0, 0xFF0000], [1, 0xFFFFFF]];
						pt.linearGradient.addColorStopFunctions = [];
						for (var i = 0, len = pt.linearGradient.addColorStop.length; i < len; i++) {
							var arr = pt.linearGradient.addColorStop[i];
							pt.linearGradient.addColorStopFunctions.push([
								(typeof(arr[0]) === 'string' ? gmxAPI.Parsers.parseExpression(arr[0]) : null)
								,(typeof(arr[1]) === 'string' ? gmxAPI.Parsers.parseExpression(arr[1]) : null)
								,(typeof(arr[2]) === 'string' ? gmxAPI.Parsers.parseExpression(arr[2]) : null)
							]);
						}
					}
				}
				pt.stroke = false;
				if(typeof(st.outline) === 'object') {   //	Есть стиль контура
					pt.stroke = true;
					var ph = st.outline;
					if('color' in ph) pt.color = ph.color;
					pt.opacity = ('opacity' in ph ? ph.opacity : 100);
					if('thickness' in ph) pt.weight = ph.thickness;
					if('dashes' in ph) pt.dashes = ph.dashes;
				}
			}
			if('rotate' in pt && typeof(pt.rotate) === 'string') {
				pt.rotateFunction = gmxAPI.Parsers.parseExpression(pt.rotate);
			}
			if('scale' in pt && typeof(pt.scale) === 'string') {
				pt.scaleFunction = gmxAPI.Parsers.parseExpression(pt.scale);
			}
			if('color' in pt && typeof(pt.color) === 'string') {
                var zn = pt.color;
                if(zn.substr(0,1) === '#') pt.color = parseInt('0x' + zn.replace(/#/, ''));
				else pt.colorFunction = gmxAPI.Parsers.parseExpression(pt.color);
			}
			if('fillColor' in pt && typeof(pt.fillColor) === 'string') {
                var zn = pt.fillColor;
                if(zn.substr(0,1) === '#') pt.fillColor = parseInt('0x' + zn.replace(/#/, ''));
				else pt.fillColorFunction = gmxAPI.Parsers.parseExpression(pt.fillColor);
			}

			return pt;
		}
		,
		'isPropsInString': function(st)	{				// парсинг значений свойств в строке
            if(typeof(st) === 'string') {
				for(var i in regProps) {
					var matches = regProps[i].exec(st);
					if(matches && matches.length > 0) return true;
				}
			}
			return false;
		}
		,
		'isPropsInStyle': function(style)	{				// парсинг значений свойств в строке
			for(var key in style) {
				if(utils.isPropsInString(style[key])) return true;
			}
			return false;
		}
		,
		'chkPropsInString': function(str, prop, type)	{				// парсинг значений свойств в строке
			var zn = str;
			if(typeof(zn) === 'string') {
				if(zn.length === 0) return true;
				var zn1 = zn.replace(/\'([^\']+)\'/g, '');
				var reg = /\b([^\b]+?)\b/gm;
				var arr = zn.match(reg);
				var reg = /\[([^\]]+)\]/i;
				if(type == 1) reg = /\"([^\"]+)\"/i;
				else if(type == 2) reg = /\b([^\b]+)\b/i;
				
				var matches = reg.exec(zn);
				while(matches && matches.length > 0) {
					zn = zn.replace(matches[0], prop[matches[1]]);
					matches = reg.exec(zn);
				}
				if(type !== 3) zn = eval(zn);
			}
			return zn
		}
        ,
        'evalStyle': function(style, prop)	{								// парсинг стиля лефлета
            var out = { };
            for(var key in style) {
                var zn = style[key];
                if(key + 'Function' in style && typeof(zn) === 'string') {
                    zn = (style[key + 'Function'] ? style[key + 'Function'](prop) : 1);
                }
                if (!style.ready) {
                    if(key === 'fillColor' || key === 'color') {
                        out[key + '_dec'] = zn;
                        //out[key + '_rgba'] = utils.dec2rgba(zn, 1);
                        zn = utils.dec2hex(zn);
                        if(zn.substr(0,1) != '#') zn = '#' + zn;
                    } else if(key === 'scale') {
                        if(typeof(zn) === 'string') zn = 1;
                    } else if(key === 'fillOpacity' || key === 'opacity') {
                        if(zn >= 0) zn = zn / 100;
                    }
                }
                out[key] = zn;
            }
            if ('color_dec' in out) out.color_rgba = utils.dec2rgba(out.color_dec,  'opacity' in out ? out.opacity : 1);
            if ('fillColor_dec' in out) out.fillColor_rgba = utils.dec2rgba(out.fillColor_dec,  'fillOpacity' in out ? out.fillOpacity : 1);

            out.ready = true;
            return out;
        }
		,
		'getNodeProp': function(node, type, recursion)	{					// получить свойство ноды - рекурсивно
			if(!node) return null;
			if(type in node) return node[type];
			if(recursion) return (node.parentId in mapNodes ? utils.getNodeProp(mapNodes[node.parentId], type, recursion) : null);
		}
		,
		'removeLeafletNode': function(node)	{								// Удалить Leaflet ноду - рекурсивно
			if(!node['parentId']) return;
			var pNode = mapNodes[node['parentId']];
			var pGroup = (pNode ? pNode['group'] : LMap);
			if(node['group']) {
				if(node['marker']) {
					if(node['group']['_layers'][node['marker']['_leaflet_id']]) node['group'].removeLayer(node['marker']);
				}
				pGroup.removeLayer(node['group']);
			}
			if(node['leaflet'] && pGroup['_layers'][node['leaflet']['_leaflet_id']]) pGroup.removeLayer(node['leaflet']);
		}
		,
		'addCanvasIcon': function(node, regularStyle)	{				// создать Canvas иконку 
			if(!node.propHiden || !node.propHiden['getPos'] || !node.propHiden['drawMe']) return null;
			var point = node.propHiden['getPos']();
			var canvasIcon = L.canvasIcon({
				className: 'my-canvas-icon'
				,'node': node
				,'drawMe': node.propHiden['drawMe']
				//,iconAnchor: new L.Point(12, 12) // also can be set through CSS
			});
			return L.marker([point['y'], point['x']], {icon: canvasIcon, clickable: false});
		}
		,
		'setVisibleNode': setVisibleNode									// Рекурсивное изменение видимости
		,
		'repaintNode': function(node, recursion, type) { // перерисовать ноду - рекурсивно
			if(!node) {
				return;
			}
			if(!type) type = 'regularStyle';
			var regularStyle = utils.getNodeProp(node, type, true);
			if(regularStyle) {				// Стиль определен
				var pNode = mapNodes[node['parentId']];
				if(node['type'] == 'filter') {				// отрисовка фильтра
					//utils.drawFilter(node);
					//node.leaflet = utils.drawNode(node, regularStyle);
					pNode.refreshFilter(node.id);
				} else if(node['isSetImage']) {
					if('refreshMe' in node) node['refreshMe'](); // свой отрисовщик
				} else if(node.geometry && node.geometry.type) {
					utils.removeLeafletNode(node);

					if(!utils.chkVisibleObject(node.id) || !utils.chkVisibilityByZoom(node.id)) {		// если обьект невидим пропускаем
						utils.setVisibleNode({'obj': node, 'attr': false});
						return;
					}

					node.geometry.id = node.id;
					if(regularStyle['iconUrl'] && !regularStyle['imageWidth']) {		// нарисовать после загрузки onIconLoaded
						gmxAPI._leaflet['drawManager'].add(node.id);					// добавим в менеджер отрисовки
						return;
					} else {
						if(node['subType'] === 'drawingFrame') {
							node.leaflet = new L.FeatureGroup([]);
							if(node['leaflet']) {
								utils.setVisibleNode({'obj': node, 'attr': true});
							}
						} else if(node['refreshMe']) { 
							node['refreshMe']();
							return;
						} else {
							node.leaflet = utils.drawNode(node, regularStyle);
							//node['leaflet']._isVisible = false;
							if(node['leaflet']) {
								utils.setVisibleNode({'obj': node, 'attr': true});
								setNodeHandlers(node.id);
								if(node['dragging']) {	// todo drag без лефлета
									//if(node['geometry']&& node['geometry']['type'] == 'Point') {
										//node['leaflet']['options']['_isHandlers'] = true;
									//}
									utils.startDrag(node);
								}
							}
						}
					}
				}
			}
			if(recursion) {
				for (var i = 0; i < node['children'].length; i++)
				{
					var child = mapNodes[node['children'][i]];
					utils.repaintNode(child, recursion, type);
				}
			}
		}
		,
		'drawPoint': function(node, style)	{			// отрисовка POINT геометрии
			var out = null;
			var styleType = (style['iconUrl'] ? 'marker' : (style['stroke'] || style['fill'] ? 'rectangle' : ''));
			if(style['circle']) styleType = 'circle';
			var geo = node.geometry;
			var pos = geo.coordinates;
			var prop = geo.properties;
			if(styleType === 'circle') {							// стиль окружность
				if('size' in style) style['radius'] = style['size'];
				if(!('weight' in style)) style['weight'] = 0;
				out = new L.CircleMarker(new L.LatLng(pos[1], pos[0]), style);
			} else if(styleType === 'marker') {						// стиль маркер
				var opt = {
					iconUrl: style['iconUrl']
					//,clickable: false
					//,shadowUrl: null
					,'from': node.id
					,iconAnchor: new L.Point(0, 0)
					//,'zIndexOffset': -1000
				};
				if(!style['scale']) style['scale'] = 1;
				var scale = style['scale'];
				if(typeof(scale) == 'string') {
					scale = (style['scaleFunction'] ? style['scaleFunction'](prop) : 1);
				}
				var ww = Math.floor(style['imageWidth'] * scale);
				var hh = Math.floor(style['imageHeight'] * scale);
				opt['iconSize'] = new L.Point(ww, hh);
				style['iconSize'] = opt['iconSize'];
				if(style['center']) opt['iconAnchor'] = new L.Point(ww/2, hh/2);
				else {
					if(style['dx']) opt['iconAnchor'].x -= style['dx'];
					if(style['dy']) opt['iconAnchor'].y -= style['dy'];
				}
				if(style['rotate']) {
					opt['rotate'] = style['rotate'];
					if(typeof(opt['rotate']) == 'string') {
						opt['rotate'] = (style['rotateFunction'] ? style['rotateFunction'](prop) : 0);
					}
				}
				style['iconAnchor'] = opt['iconAnchor'];
				
				var nIcon = L.Icon.extend({
					'options': opt
				});
				var optMarker = {
					icon: new nIcon()
					,'from': node.id
					,'rotate': opt['rotate']
					,'toPaneName': 'overlayPane'
				};
				if(node['subType'] === 'drawing') {
					optMarker['draggable'] = true;
					//optMarker['zIndexOffset'] = 10000;
				}
				
				out = new L.GMXMarker(new L.LatLng(pos[1], pos[0]), optMarker);
			} else if(styleType === 'rectangle') {					// стиль rectangle
				// create rectangle from a LatLngBounds
				var size = style['size'] || 0;
				var point = new L.LatLng(pos[1], pos[0]);
				style['skipSimplifyPoint'] = true;
				style['skipLastPoint'] = true;
				style['pointSize'] = size;
				style['shiftWeight'] = true;
				out = new L.GMXPointsMarkers([point, point], style);
			}
			if(style['label'] && node['label']) {
				setLabel(node.id, null);
			}
			
			if(out && node['subType'] === 'drawing') {
				var chkDrag = function(e) {		// Drag на drawing обьекте
					var eType = e.type;
					var gmxNode = gmxAPI.mapNodes[node.id];		// Нода gmxAPI
					var ph = {
						'obj':gmxNode
						,'attr': {
							'id': e.target.options.from
							,'x': e.target._latlng.lng
							,'y': e.target._latlng.lat
							,'e': e
						}
					};
					gmxAPI._listeners.dispatchEvent(eType, gmxNode, ph);		// tile загружен
				};
				out.on('drag', chkDrag);		// Drag на drawing обьекте
				//out.on('dragstart', chkDrag);
				out.on('dragend', chkDrag);
			}
			return out;
		}
		,
		'drawMultiPoint': function(node, style)	{			// отрисовка Polygon геометрии
			var out = null;
			var geo = node.geometry;
			var prop = geo.properties || {};
            var arr = geo.coordinates;
			var points = [];
            for(var i=0, len = arr.length; i<len; i++) {
				var pos = new L.LatLng(arr[i][1], arr[i][0]);
				points.push(pos);
			}
			var styleType = (style['iconUrl'] ? 'marker' : (style['stroke'] || style['fill'] ? 'rectangle' : ''));
			if(style['circle']) styleType = 'circle';
			if(styleType === 'circle') {							// стиль окружность
				if('size' in style) style['radius'] = style['size'];
				if(!('weight' in style)) style['weight'] = 0;
                style['noClip'] = 
                style['clearFillRule'] = true;
				out = new L.GMXPointsMarkers(points, style);
			} else if(styleType === 'marker') {						// стиль маркер
				if('scale' in style && typeof(style['scale']) === 'string') {
					style['scale'] = (style['scaleFunction'] ? style['scaleFunction'](prop) : 1);
                }
				if('rotate' in style && typeof(style['rotate']) === 'string') {
					style['rotate'] = (style['rotateFunction'] ? style['rotateFunction'](prop) : 1);
                }
				//out = new L.GMXMultiPoint(points, style);
			} else if(styleType === 'rectangle') {					// стиль rectangle
				style['pointSize'] = style['size'] || 0;
				style['skipSimplifyPoint'] = 
                    style['noClip'] = 
                    style['shiftWeight'] = 
                    style['clearFillRule'] = true;
                //    style['skipLastPoint'] = 
				out = new L.GMXPointsMarkers(points, style);
			}
			if(style['label'] && node['label']) {
				setLabel(node.id, null);
			}
			return out;
		}
		,
		'drawPolygon': function(node, style)	{			// отрисовка Polygon геометрии
			var prop = node.properties || {};
			var geojsonFeature = {
				"type": "Feature",
				"properties": prop,
				"geometry": node.geometry
			};
			var opt = {
				style: ('ready' in style ? style : utils.evalStyle(style, prop))
			};
			var out = L.geoJson(geojsonFeature, opt);
			return out;
		}
		,
		'drawMultiPolygon': function(node, style)	{			// отрисовка Polygon геометрии
			var prop = node.properties || {};
			var geojsonFeature = {
				"type": "Feature",
				"properties": prop,
				"geometry": node.geometry
			};
			var out = L.geoJson(geojsonFeature, {
				style: ('ready' in style ? style : utils.evalStyle(style, prop))
			});
			return out;
		}
		,
		'drawNode': function(node, style)	{			// отрисовка геометрии node
			if(!node.geometry || !node.geometry.type) return null;
			var geo = node.geometry;
			var type = geo.type;
			var prop = geo.properties;
			var geom = {'type': type, 'coordinates': geo.coordinates};
			var pt = {};
			//if(type === 'MULTIPOLYGON') 			pt['type'] = 'MultiPolygon';
			if(type === 'Point') 					return utils.drawPoint(node, style);
			else if(type === 'Polygon')				return utils.drawPolygon(node, style);
			else if(type === 'Polyline')			return utils.drawPolygon({'geometry': {'type': 'LineString', 'coordinates': geo.coordinates}, 'properties': prop}, style);
			else if(type === 'MultiPolyline')		return utils.drawPolygon({'geometry': {'type': 'MultiLineString', 'coordinates': geo.coordinates}, 'properties': prop}, style);
			else if(type === 'MultiPolygon')		return utils.drawMultiPolygon(node, style);
			else if(type === 'MultiPoint')			return utils.drawMultiPoint(node, style);
			else if(type === 'GeometryCollection')	pt['type'] = 'GeometryCollection';
			return null;
		}
		,
		'chkPolygon': function(geo)	{			// перевод геометрии Scanex->leaflet
			if(geo.type === 'Polygon') {
				for (var i = 0; i < geo['coordinates'].length; i++)
				{
					var coords = geo['coordinates'][i];
					var len = coords.length - 1;
					if(coords[0][0] != coords[len][0] || coords[0][1] != coords[len][1]) coords.push(coords[0]);
				}
			}
		}
        ,
        'fromLeafletTypeGeo': function(type)	{			// перевод геометрии type leaflet->Scanex
            if(type === 'MultiPolygon') 			type = 'MULTIPOLYGON';
            else if(type === 'Polygon')				type = 'POLYGON';
            else if(type === 'Point')				type = 'POINT';
            else if(type === 'MultiPolyline')		type = 'MULTILINESTRING';
            else if(type === 'Polyline')			type = 'LINESTRING';
            return type;
        }
        ,
        'fromScanexTypeGeo': function(type)	{			// перевод геометрии type Scanex->leaflet
            if(type === 'MULTIPOLYGON') 			type = 'MultiPolygon';
            else if(type === 'POLYGON')				type = 'Polygon';
            else if(type === 'MULTIPOINT')			type = 'MultiPoint';
            else if(type === 'POINT')				type = 'Point';
            else if(type === 'MULTILINESTRING')		type = 'MultiPolyline';
            else if(type === 'LINESTRING')			type = 'Polyline';
            else if(type === 'GeometryCollection')	type = 'GeometryCollection';
            return type;
        },
        parseGeometry: function(geo) {      // перевод геометрии Scanex->leaflet
            var geom = gmxAPI.clone(geo),
                nullFunc = function(it){return it;};
            
            var pt = gmxAPI.transformGeometry(geom, nullFunc, nullFunc);
            pt.type = utils.fromScanexTypeGeo(pt.type);
            var b = gmxAPI.getBounds(geom.coordinates);
            pt.bounds = new L.Bounds(new L.Point(b.minX, b.minY), new L.Point(b.maxX, b.maxY));
            return pt;
        },
        transformPolygon: function(geom)        // получить Scanex Polygon
        {
            var coords = [];
            for (var i = 0, len = geom.coordinates.length; i < len; i++) {
                var coords1 = [];
                for (var j = 0, len1 = geom.coordinates[i].length; j < len1; j++) {
                    var point = geom.coordinates[i][j];
                    //coords1.push([point.x, point.y]);
                    coords1.push([gmxAPI.from_merc_x(point.x), gmxAPI.from_merc_y(point.y)]);
                }
                coords.push(coords1);
            }
            return {
                type: 'POLYGON'
                ,coordinates: coords
            };
        }
        ,
        transformGeometry: function(geom)			// трансформация геометрии leaflet->Scanex
        {
            if(!geom) return geom;
            if(geom.type === 'Polygon')	return utils.transformPolygon(geom);
        }
        ,
		fromTileGeometry: function(geom, tileBounds)				// преобразование геометрий из тайлов
		{
			var out = null;
			if(geom) {
                var type = geom.type,
                    ut = gmxAPI._leaflet;
				if(type === 'POINT') {
					out = ut.PointGeometry(geom, tileBounds);
				} else if(type === 'MULTILINESTRING') {
					out = ut.MultiPolyline(geom, tileBounds);
				} else if(type === 'LINESTRING') {
					out = ut.LineGeometry(geom, tileBounds);
				} else if(type === 'POLYGON') {
					out = ut.PolygonGeometry(geom, tileBounds);
				} else if(type === 'MULTIPOLYGON') {
					out = ut.MultiPolygonGeometry(geom, tileBounds);
				}
			}
			return out;
		}
		,
		'unionGeometry': function(bounds, geo, geo1)	{		// Обьединение 2 геометрий по границам тайла	need TODO
			if(geo.type === 'Polygon')
			{
				var multi = gmxAPI._leaflet['MultiPolygonGeometry'](null, geo['tileBounds']);
				multi.addMember(geo);
				geo = multi;
			}
			var res = geo;
			var type = geo.type;

			if(type === 'Point') 					{}
			else if(type === 'MultiPolygon')
			{
				if(geo1.type === 'Polygon')
				{
					geo.addMember(geo1);
				}
				else if(geo1.type === 'MultiPolygon')
				{
					geo.addMembers(geo1);
				}
			}
			return res;
		}
		,
		'drawGeometry': function(geo, featureparse)	{			// отрисовка GeoJSON геометрии
/*			
			var geojsonFeature = {
				"type": "Feature",
				"properties": geo.properties,
				"geometry": geo.geometry
			};
			var geojson = L.geoJson(myLines, {
				//style: myStyle
			});
*/
			var geojson = new L.GeoJSON();
			if(featureparse) {
				geojson.on('featureparse', featureparse);
			}
			geojson.addGeoJSON(geo);
			return geojson;
		}
		,'getTileUrl': function(obj, tilePoint, zoom)	{			// Получение URL тайла
			var res = '';
			if(!('tileFunc' in obj.options)) return res;
			if(zoom < obj.options.minZoom || zoom > obj.options.maxZoom) return res;

			var pz = Math.round(Math.pow(2, zoom - 1));
			var pz1 = Math.pow(2, zoom);
			res = obj.options.tileFunc(
				tilePoint.x%pz1 - pz
				,-tilePoint.y - 1 + pz
				,zoom + obj.options.zoomOffset
			);
			return res;
		}
		,'getTileUrlVector': function(obj, tilePoint, zoom)	{			// Получение URL тайла
			var res = '';
			if(!('tileFunc' in obj.options)) return res;

			res = obj.options.tileFunc(
				tilePoint.x
				,tilePoint.y
				,zoom
			);
			return res;
		}
		,'r_major': 6378137.000	
		,'y_ex': function(lat)	{				// Вычисление y_ex 
			if (lat > 89.5)		lat = 89.5;
			if (lat < -89.5) 	lat = -89.5;
			var phi = gmxAPI.deg_rad(lat);
			var ts = Math.tan(0.5*((Math.PI*0.5) - phi));
			var y = -utils.r_major * Math.log(ts);
			return y;
		}
		,'bringToDepth': function(obj, zIndex)	{				// Перемещение ноды на глубину zIndex
			if(!obj) return;
			if('setZIndex' in obj) obj.setZIndex(zIndex);
            else {
                if(!obj.leaflet) return;
                var lObj = obj.leaflet;
                zIndex += obj.zIndexOffset;
                if(lObj._container && lObj._container.style.zIndex != zIndex) lObj._container.style.zIndex = zIndex;
                else if(lObj._icon && lObj._icon.style.zIndex != zIndex) lObj._icon.style.zIndex = zIndex;
            }
		}
		,
		'getLastIndex': function(pNode)	{			// Получить следующий zIndex в mapNode
			var n = 1;
			if(pNode) {
				n = pNode.children.length + 1;
			}
			return n;
		}
		,
		'getIndexLayer': function(sid)
		{ 
			var myIdx = gmxAPI.map.layers.length;
			var n = 0;
			for (var i = 0; i < myIdx; i++)
			{
				var l = gmxAPI.map.layers[i];
				//if (l.objectId && (l.properties.type != "Overlay")) {
					if (l.objectId == sid) break;
					n += 1;
				//}
			}
			return n;
		}
		,'dec2hex': function(i)	{					// convert decimal to hex
			return (i+0x1000000).toString(16).substr(-6).toUpperCase();
		}
		,'dec2rgba': function(i, a)	{				// convert decimal to rgb
			var r = (i >> 16) & 255;
			var g = (i >> 8) & 255;
			var b = i & 255;
			return 'rgba('+r+', '+g+', '+b+', '+a+')';
		}
		,
		'maxBounds': function()	{					// Получение сдвига OSM
			var bounds = new L.Bounds(new L.Point(-1e9, -1e9), new L.Point(1e9, 1e9));
			return bounds;
		}
		,'getTileBounds': function(tilePoint, zoom)	{			// получить Bounds тайла
			var tileX = 256 * tilePoint.x;						// позиция тайла в stage
			var tileY = 256 * tilePoint.y;

			var p1 = new L.Point(tileX, tileY);
			var pp1 = LMap.unproject(p1, zoom);					// Перевод экранных координат тайла в latlng
			//pp1 = new L.LatLng(pp1.lat, pp1.lng);
			p1.x = pp1.lng; p1.y = pp1.lat;
			var	p2 = new L.Point(tileX + 256, tileY + 256);
			var pp2 = LMap.unproject(p2, zoom);
			//pp2 = new L.LatLng(pp2.lat, pp2.lng);
			p2.x = pp2.lng; p2.y = pp2.lat;
			var bounds = new L.Bounds(p1, p2);
			//bounds.min.x %= 360;
			if(bounds.max.x > 180) {
				var cnt = Math.floor(bounds.max.x / 360);
				if(cnt == 0) cnt = 1;
				bounds.max.x -= cnt*360;
				bounds.min.x -= cnt*360
			}
			else if(bounds.min.x < -180) {
				var cnt = Math.floor(bounds.min.x / 360);
				if(cnt == 0) cnt = 1;
				bounds.max.x -= cnt*360; bounds.min.x -= cnt*360
			}
			return bounds;
		}
		,
		'freeze': function()	{					// Режим рисования
			gmxAPI._leaflet.curDragState = true;
			LMap.dragging.disable();
            L.DomUtil.disableImageDrag();
			LMap.touchZoom.addHooks();
			return true;
		}
		,'unfreeze': function()	{						// Отмена режима рисования
			gmxAPI._leaflet.curDragState = false;
            L.DomUtil.enableImageDrag();
			LMap.dragging.enable();
			LMap.touchZoom.removeHooks();
			return true;
		}
	};
	// setLabel для mapObject
	function setLabel(id, iconAnchor)	{
		var node = mapNodes[id];
		if(!node) return;
		//gmxAPI._leaflet.LabelsManager.add(id);			// добавим в менеджер отрисовки
	}

	// setStyle для mapObject
	function setStyle(id, attr)	{
		var node = mapNodes[id];
		if(!node || !attr) return;

		if(node.type === 'VectorLayer') {   // Установка стиля векторного слоя
			node.setStyle && node.setStyle(attr);
            return;
		} else if(node.type == 'filter') {
			var pNode = mapNodes[node.parentId];
			pNode.setStyleFilter(id, attr);
            return;
		} else if(node.type == 'RasterLayer') {
			node.setStyle && node.setStyle(attr);
            return;
		}

		if(attr.regularStyle) {
			node._regularStyle = gmxAPI.clone(attr.regularStyle);
		}
		if(attr.hoveredStyle) {
			node._hoveredStyle = gmxAPI.clone(attr.hoveredStyle);
		}
		if(!node.leaflet || !node.leaflet._map) return;

		var chkStyle = function() {
			if(node._regularStyle) {
				node.regularStyle = utils.parseStyle(node._regularStyle, id);
				node.regularStyleIsAttr = utils.isPropsInStyle(node.regularStyle);
				if(!node.regularStyleIsAttr) node.regularStyle = utils.evalStyle(node.regularStyle)
				if(!attr.hoveredStyle) attr.hoveredStyle = gmxAPI.clone(attr.regularStyle);
			}
			if(node._hoveredStyle) {
				node.hoveredStyle = utils.parseStyle(node._hoveredStyle, id);
				node.hoveredStyleIsAttr = utils.isPropsInStyle(node.hoveredStyle);
				if(!node.hoveredStyleIsAttr) node.hoveredStyle = utils.evalStyle(node.hoveredStyle)
			}
		}
/*
		if(node.type === 'VectorLayer') {   // Установка стиля векторного слоя
			node.setStyle && node.setStyle(id, attr);
		} else if(node.type == 'RasterLayer') {
			node.setStyle && node.setStyle(id, attr);
		} else if(node.type == 'filter') {
			var pNode = mapNodes[node.parentId];
			pNode.setStyleFilter(id, attr);
		} else if(node.subType === 'tilesParent') {		// стиль заполнения обьектов векторного слоя
			chkStyle();
			var pNode = mapNodes[node.parentId];
			pNode.chkTilesParentStyle();
		} else 
*/
        if(node.subType !== 'drawingFrame') {
			chkStyle();
			if(node.isVisible != false) {
				if(node.leaflet && node.leaflet.setStyle) node.leaflet.setStyle(node.regularStyle);
				else gmxAPI._leaflet.drawManager.add(id);			// добавим в менеджер отрисовки
			}
		} else {
			chkStyle();
		}
	}

	// Найти Handler ноды рекусивно
	var getNodeHandler = function(id, evName)	{
		var node = mapNodes[id];
		if(!node) return null;
		if(evName in node.handlers) return node;
		return getNodeHandler(node.parentId, evName);
	}
	utils.getNodeHandler = getNodeHandler;

	// добавить Handlers для leaflet нод
	function setNodeHandlers(id)	{
		var node = mapNodes[id];
		if(!node || !node.handlers) return;
		node.isHandlers = false;
		for (var evName in scanexEventNames) {
			setHandlerObject(id, evName);
		}
	}
	utils.setNodeHandlers = setNodeHandlers;

	var scanexEventNames = {
		'onClick': 'click'
		,'onMouseDown': 'mousedown'
		,'onMouseOver': 'mouseover'
		,'onMouseOut': 'mouseout'
		,'onMouseMove': 'mousemove'
	};
	// добавить Handler для mapObject
	function setHandlerObject(id, evName)	{
		var node = mapNodes[id];
		if(!node) return false;
		if(node.leaflet) {
			node.leaflet.options.resID = id;
			var hNode = getNodeHandler(id, evName);
			if(hNode && hNode.type == 'map') return false;
			if(!hNode) {
				if(scanexEventNames[evName]) {
					node.leaflet.off(scanexEventNames[evName]);
					if(node.marker) node.marker.off(scanexEventNames[evName]);
				}
				return false;
			}

			var func = function(e) {
				if(gmxAPI._drawing.activeState && evName == 'onClick') {
					gmxAPI._leaflet.chkClick(e);
					return;
				}
				if(node.hoveredStyle && 'setStyle' in node.leaflet) {
					if(evName == 'onMouseOver') {
						node.leaflet.setStyle(node.hoveredStyle);
					} else if(evName == 'onMouseOut') {
						node.leaflet.setStyle(node.regularStyle);
					}
				}
				var out = {'ev':e};
				utils.chkKeys(out, e.originalEvent);
				gmxAPI._leaflet.activeObject = (evName == 'onMouseOut' ? null : id);
				if(hNode.handlers[evName]) hNode.handlers[evName](node.id, node.geometry.properties, out);
			};
			if(scanexEventNames[evName]) {
				node.leaflet.on(scanexEventNames[evName], func);
				if(node.marker) node.marker.on(scanexEventNames[evName], func);
			}
			node.isHandlers = node.leaflet.options._isHandlers = true;
			
			if('update' in node.leaflet) node.leaflet.update();
			return true;
		}
	}
	function removeNodeRecursive(key, parentFlag)	{		// Удалить ноду	- рекурсивно
		var node = mapNodes[key];
		if(!node) return;
		for (var i = 0, len = node.children.length; i < len; i++) {
			removeNodeRecursive(node.children[i], true);
		}
		if(!parentFlag) {
			//var pGroup = LMap;
			if(node.parentId && mapNodes[node.parentId]) {
				var pNode = mapNodes[node.parentId];
				for (var i = 0, len = pNode.children.length; i < len; i++) {
					if(pNode.children[i] == node.id) {
						pNode.children.splice(i, 1);
						break;
					}
				}
			}
		}
		utils.removeLeafletNode(node);
		delete mapNodes[key];
	}
	// Удалить mapObject
	function removeNode(key)	{				// Удалить ноду	children
		removeNodeRecursive(key);
	}

    // добавить mapObject
    function addObject(ph)	{
        nextId++;
        var id = 'id' + nextId;
        var pt = {
            type: 'mapObject'
            ,handlers: {}
            ,propHiden: {}
            ,children: []
            ,id: id
            ,zIndexOffset: 0
            ,parentId: ph.obj.objectId
            //,'eventsCheck': 
            //subType
        };
        //if(ph.attr['hidenAttr']) pt['hidenAttr'] = ph.attr['hidenAttr'];

        var pNode = mapNodes[pt.parentId];
        if(!pNode) {
            pNode = {type: 'map', children:[], group: LMap};
        }
        pNode.children.push(id);

        pt.group = new L.LayerGroup();
        pNode.group.addLayer(pt.group);
        
        if(ph.attr) {
            pt.propHiden = ph.attr.propHiden || {};
            if(pt.propHiden.nodeType) pt.type = pt.propHiden.nodeType;
            var geo = {};
            if(ph.attr.geometry) {
                if(pt.propHiden.isLayer) {
                    geo.coordinates = ph.attr.geometry.coordinates;
                    geo.type = utils.fromScanexTypeGeo(ph.attr.geometry.type);
                } else {
                    geo = utils.parseGeometry(ph.attr.geometry);
                }
                if(ph.attr.geometry.properties) geo.properties = ph.attr.geometry.properties;
            }
            if(ph.attr.properties) geo.properties = ph.attr.properties;
            pt.geometry = geo;
            if(pt.propHiden.subType) pt.subType = pt.propHiden.subType;
            if(pt.propHiden.refreshMe) pt.refreshMe = pt.propHiden.refreshMe;
            if(pt.propHiden.layersParent) pt.zIndexOffset = 0;
            if(pt.propHiden.overlaysParent) pt.zIndexOffset = 50000;
        }
        mapNodes[id] = pt;
        if(pt.geometry.type) {
            if (!pt.propHiden.isLayer) gmxAPI._leaflet.drawManager.add(id); // добавим в менеджер отрисовки
            if(pt.leaflet) {
                setHandlerObject(id);							// добавить Handler для mapObject
            }
        }
        pt.zIndex = ('zIndex' in pt.propHiden ? pt.propHiden.zIndex : utils.getLastIndex(pNode));
        return id;
    }
	// Добавление набора статических объектов на карту
	function addObjects(parentId, attr) {
		var out = [];
		var sql = attr.sql || null;
		var data = attr.arr;
		var fmt = (attr.format ? attr.format : 'LatLng');
		for (var i=0, len = data.length; i<len; i++)	// Подготовка массива обьектов
		{
			var ph = data[i];
			var prop = ph.properties || null;
			if(ph.geometry && ph.geometry.properties) prop = ph.geometry.properties;
			if(sql) {
				var flag = utils.chkPropsInString(sql, prop, 1);
				if(!flag) continue;
			}
			var tmp = {
				obj: {
					objectId: parentId
				}
				,
				attr: {
					geometry: (fmt == 'LatLng' ? ph.geometry : gmxAPI.from_merc_geometry(ph.geometry))
					,properties: prop
				}
			};
			var id = addObject(tmp);
			if(ph.setLabel) {
				mapNodes[id].label = ph.setLabel;
			}
			if(ph.setZoomBounds) {	// формат {'minZ':1, 'maxZ':21}
				tmp.attr = ph.setZoomBounds;
				commands.setZoomBounds(tmp);
			}
			if(ph.setFilter) {
				tmp.attr = {sql: ph.setFilter};
				commands.setFilter(tmp);
			}
			if(ph.setHandlers) {
				for(var key in ph.setHandlers) {
					var item = ph.setHandlers[key];
					commands.setHandler(item);
				}
			}
			setStyle(id, ph.setStyle);

			var aObj = new gmxAPI._FMO(id, prop, gmxAPI.mapNodes[parentId]);	// обычный MapObject
			aObj.isVisible = true;
			out.push(aObj);
			// пополнение mapNodes
			var currID = (aObj.objectId ? aObj.objectId : gmxAPI.newFlashMapId() + '_gen1');
			gmxAPI.mapNodes[currID] = aObj;
			if(aObj.parent) aObj.parent.childsID[currID] = true; 
			if(ph.enableHoverBalloon) {
				aObj.enableHoverBalloon(ph.enableHoverBalloon);
			}
		}
		return out;
	}
    // Изменение видимости
    function setVisibleNode(ph) {
        var id = ph.obj.objectId || ph.obj.id,
            node = mapNodes[id];
        if(node) {							// нода имеется
            if(node.type === 'map') {							// нода map ничего не делаем
                return;
            } else if(node.setVisible) {
                node.setVisible(ph.attr);
                return;
            }
            //node.isVisible = ph.attr;
            var pNode = mapNodes[node.parentId] || null,
                pGroup = (pNode ? pNode.group : LMap);
            if(node.type === 'filter') {							// нода filter
                if(pNode) pNode.refreshFilter(id);
                return;
            } else {							// нода имеет вид в leaflet
                if(ph.attr) {
                    var flag = utils.chkVisibilityByZoom(id);
                    if(!flag) return;
                    if(node.leaflet && node.leaflet._map) return;
                    if(node.type === 'RasterLayer') {
                        gmxAPI._leaflet.renderingObjects[node.id] = 1;					
                        if(node.leaflet) {
                            LMap.addLayer(node.leaflet);
                            utils.bringToDepth(node, node.zIndex);
                        } else if('nodeInit' in node) {
                            node.nodeInit();
                        }
                    }
                    else
                    {
                        var isOnScene = ('isOnScene' in node ? node.isOnScene : true);
                        if(node.parentId) {
                            if(isOnScene) pGroup.addLayer(node.group);
                        }
                        
                        if(node.leaflet) {
                            if(isOnScene) {
                                if(node.subType !== 'drawingFrame' && node.leaflet.setStyle && node.regularStyle) node.leaflet.setStyle(node.regularStyle);
                                pGroup.addLayer(node.leaflet);
                            }
                        } else if(node.geometry.type) {
                            gmxAPI._leaflet.drawManager.add(id);				// добавим в менеджер отрисовки
                        }
                        if(node.type === 'VectorLayer') {					// нода VectorLayer
                            node.checkFilters(0);
                        }
                    }
                }
                else
                {
                    if(node.type === 'RasterLayer') {
                        delete gmxAPI._leaflet.renderingObjects[node.id];
                        if(node.leaflet) {
                            LMap.removeLayer(node.leaflet);
                        }
                    }
                    else {
                        if(node.parentId) {
                            pGroup.removeLayer(node.group);
                        }
                        if(node.leaflet) {
                            if(pGroup._layers[node.leaflet._leaflet_id]) pGroup.removeLayer(node.leaflet);
                        }
                        if(node.mask) {
                            if(pGroup._layers[node.mask._leaflet_id]) pGroup.removeLayer(node.mask);
                        }
                    }
                }
            }
            for (var i = 0, len = node.children.length; i < len; i++) {
                setVisibleRecursive(mapNodes[node.children[i]], ph.attr);
            }
        }
    }

    // Рекурсивное изменение видимости
    function setVisibleRecursive(pNode, flag) {
        if(!pNode) return;
        if(pNode.isVisible !== false && pNode.geometry.type) {
            utils.setVisibleNode({'obj': pNode, 'attr': flag});
        } else {
            for (var i = 0, len = pNode.children.length; i < len; i++) {
                var key = pNode.children[i],
                    node = mapNodes[key];
                utils.setVisibleNode({'obj': node, 'attr': flag});
                //setVisibleRecursive(node, flag);
            }
        }
    }

	// Рекурсивное изменение видимости
	function setVisibilityFilterRecursive(pNode, sqlFunc) {
		var prop = ('getPropItem' in pNode ? pNode.getPropItem(pNode) : (pNode.geometry && pNode.geometry.properties ? pNode.geometry.properties : null));
		if(pNode['leaflet'] && prop) {
			var flag = sqlFunc(prop);
			utils.setVisibleNode({'obj': pNode, 'attr': flag});
			//gmxAPI._leaflet.LabelsManager.onChangeVisible(pNode.id, flag);
		} else {
			for (var i = 0; i < pNode['children'].length; i++) {
				var key = pNode['children'][i];
				var gmxNode = mapNodes[key];
				setVisibilityFilterRecursive(gmxNode, sqlFunc);
			}
		}
	}
	// Изменение видимости ноды
	function setVisibilityFilter(ph) {
		var obj = ph.obj;
		var id = obj.objectId;
		var node = mapNodes[id];
		node._sqlVisibility = ph.attr.sql.replace(/[\[\]]/g, '"');
		node._sqlFuncVisibility = gmxAPI.Parsers.parseSQL(node._sqlVisibility);
		if(node.type === 'VectorLayer') node.setVisibilityFilter();
		else setVisibilityFilterRecursive(node, node._sqlFuncVisibility);
		return ( node._sqlFuncVisibility ? true : false);
	}

	// Проверка видимости mapObjects
	function chkVisibilityObjects() {
		var zoom = LMap.getZoom();
		for(var id in mapNodes) {
			var node = mapNodes[id];
			var flag = ((node['minZ'] && zoom < node['minZ']) || (node['maxZ'] && zoom > node['maxZ']) ? false : true);
			setVisibleRecursive(node, flag);
		}
	}

	// Проверка отрисовки карты с задержкой
	var chkIdleTimer = null;								// Таймер
	function waitChkIdle(zd, st) {
		if(chkIdleTimer) clearTimeout(chkIdleTimer);
		if(arguments.length == 0) zd = 100;
		chkIdleTimer = setTimeout(function()
		{
			utils.chkIdle(true, st || 'waitChkIdle');					// Проверка отрисовки карты
		}, zd);
		return false;
	}
	utils['waitChkIdle'] = waitChkIdle;

    var grid = {
        gridPlugin: null,
        setOneDegree: function (flag) {
            if (grid.gridPlugin) grid.gridPlugin.setOneDegree(flag);
        },
        setGridVisible: function(flag) {			// Установка видимости grid
            if(flag) {
                if (!grid.gridPlugin) {
                    grid.gridPlugin = new L.GmxGrid({}).addTo(LMap);
                    grid.gridPlugin.setColor(gmxAPI.getHtmlColor());
                    gmxAPI.map.LMap.gmxBaseLayersManager.on('baselayerchange', function() {
                        grid.gridPlugin.setColor(gmxAPI.getHtmlColor());
                    });
                } else {
                    if (!grid.gridPlugin._map) grid.gridPlugin.addTo(LMap);
                    grid.gridPlugin.setColor(gmxAPI.getHtmlColor());
                }
                return true;
            } else {
                if (grid.gridPlugin) LMap.removeLayer(grid.gridPlugin);
                return false;
            }
        },
        getGridVisibility: function() {			// Получить видимость grid
            return grid.gridPlugin && grid.gridPlugin._map ? true : false;
        }
    };

	// Команды в leaflet
	var commands = {				// Тип команды
		'setVisibilityFilter': setVisibilityFilter			// добавить фильтр видимости
		,
		'getPatternIcon':	function(hash)	{				// получить иконку pattern
			var style = utils.parseStyle(hash['attr']['style']);
			var pt = utils.getPatternIcon(null, style);
			var canv = (pt ? pt['canvas'] : null);
			if(canv) {
				var size = hash['attr']['size'];
				var canvas1 = document.createElement('canvas');
				canvas1.width = canvas1.height = size;
				var ptx1 = canvas1.getContext('2d');
				ptx1.drawImage(canv, 0, 0, size, size);
				canv = canvas1.toDataURL();
				canv = canv.replace(/^data:image\/png;base64,/, '');
			}
			return canv;
		}
		,
		'setBackgroundTiles': gmxAPI._leaflet.setBackgroundTiles            // добавить растровый тайловый слой
        ,
        
		'setGridVisible':	function(hash)	{							// Изменить видимость сетки
			return grid.setGridVisible(hash['attr']);
		}
		,
		'setOneDegree':	function(hash)	{								// Установить шаги grid
			return grid.setOneDegree(hash['attr']);
		}
		,
		'getGridVisibility':	function(hash)	{						// получить видимость сетки
			return grid.getGridVisibility();
		}
		,
		'addObjects':	function(attr)	{					// Добавление набора статических объектов на карту
			var out = addObjects(attr.obj['objectId'], attr['attr']);
			return out;
		}
		,
		'addObject': addObject								// добавить mapObject
		,
		'freeze': function()	{					// Режим рисования
			utils.freeze();
			return true;
		}
		,
		'unfreeze': function()	{						// Отмена режима рисования
			utils.unfreeze();
			return true;
		}
		,
		'startDrawing': function(ph)	{					// Режим рисования
			return commands.freeze();
		}
		,
		'stopDrawing': function(ph)	{						// Отмена режима рисования
			return commands.unfreeze();
		}
		,
		'enableDragging': function(ph)	{					// Разрешить Drag
			var gmxNode = ph.obj;                           // Нода gmxAPI
			var id = gmxNode.objectId;
			var node = mapNodes[id];
			if(!node || !gmxNode) return;						// Нода не определена
			if(node && 'enableDragging' in node) node.enableDragging(ph);	// У ноды есть свой enableDragging
            else if(ph.attr && ph.attr['drag'] && ph.attr['dragend']) {
				node['dragging'] = true;
				utils.startDrag(node);
				node['dragendListenerID'] = gmxNode.addListener('dragend', function(ev) // dragend на обьекте
				{
					var attr = ev.attr;
					//ph.attr['dragend'](gmxNode, attr);
					ph.attr['dragend'](attr.x, attr.y, gmxNode, attr);
				});
				node['dragListenerID'] = gmxNode.addListener('drag', function(ev)		// Drag на обьекте
				{
					var attr = ev.attr;
					ph.attr['drag'](attr.x, attr.y, gmxNode, attr);
				});
				node['dragstartListenerID'] = gmxNode.addListener('dragstart', function(ev)	// dragstart на обьекте
				{
					var attr = ev.attr;
					ph.attr['dragstart'](attr.x, attr.y, gmxNode, attr);
				});
			}
		}
		,
		'disableDragging': function(ph)	{					// Запретить Drag
			var gmxNode = ph.obj;                           // Нода gmxAPI
			var id = gmxNode.objectId;
			var node = mapNodes[id];
			if(!node || !gmxNode) return;						// Нода не определена
			if(node && 'disableDragging' in node) {
                node.disableDragging(ph);	// У ноды есть свой disableDragging
                return;
            }
			var layer = node['leaflet'];
			if(!layer && node['type'] != 'map') return;
            if(layer && layer.dragging) {
				layer.dragging.disable();
                node['dragging'] = false;
			}

            if(node['dragMe']) {
				if(!layer) layer = LMap;
                layer.off('mousedown', node['dragMe']);
                delete node['dragMe'];
            }
			if(node['dragendListenerID']) gmxNode.removeListener('dragend', node['dragendListenerID']);
			if(node['dragListenerID']) gmxNode.removeListener('drag', node['dragListenerID']);
			if(node['dragstartListenerID']) gmxNode.removeListener('dragstart', node['dragstartListenerID']);
			if(node['leaflet']) node['leaflet'].off('mousedown');
			commands.unfreeze();
		}
		,
		'isDragging': function()	{						// Текущий режим Drag
			return gmxAPI._leaflet['curDragState'];
		}
		,
		'isKeyDown': function(ph)	{						// Проверка нажатых клавиш
			var flag = false;
			if(ph.attr && ph.attr.code) {
				var code = ph.attr.code;
				var clickAttr = gmxAPI._leaflet['clickAttr'];
				if(clickAttr) {
					if(code === 16 && clickAttr['shiftKey']) flag = true;
				}
			}
			return flag;
		}
		,
		'setGeometry': function(ph)	{						// установка geometry
			var layer = ph.obj;
			var id = layer.objectId;
			var node = mapNodes[id];
			if(!node) return;						// Нода не определена
			if(ph.attr) {
				var geo = utils.parseGeometry(ph.attr);
				if(!geo.properties) geo.properties = (node['geometry'].properties ? node['geometry'].properties : (layer.properties ? layer.properties : {}));
				node['geometry'] = geo;
				if('setGeometry' in node) {
                    if(node.type === 'RasterLayer') node.setGeometry();
                    if(node.isSetImage) node.setGeometry();
				}
                if(node['geometry']['type']) {
					if(node['onDrag'] && node['leaflet'] && node['leaflet'].dragging) {
						// dragging лефлетовский
						return;
					}
					gmxAPI._leaflet['drawManager'].add(id);			// добавим в менеджер отрисовки
					if(node.leaflet) {
                        setHandlerObject(id);
                        if(node.type === 'mapObject') {
                            var latlngs = L.GeoJSON.coordsToLatLngs(geo.coordinates);
                            for (var key in node.leaflet._layers) {
                                var _layer = node.leaflet._layers[key];
                                if ('setLatLngs' in _layer) _layer.setLatLngs(latlngs);
                            }
                        }
                    }
				}
			}
		}
		,
		'bringToTop': function(ph)	{						// установка zIndex - вверх
			var id = ph.obj.objectId,
                node = mapNodes[id],
                zIndex = 1;
			if('getMaxzIndex' in node) zIndex = node.getMaxzIndex();
			else if (node.parent) zIndex = utils.getLastIndex(node.parent);
			node.zIndex = zIndex;
			utils.bringToDepth(node, zIndex);
			if(!gmxAPI.map.needMove) {
				if('bringToFront' in node) node.bringToFront();
				else if(node.leaflet && node.leaflet._map && 'bringToFront' in node.leaflet) node.leaflet.bringToFront();
				//gmxAPI.map.drawing.chkZindex(id);
			}
			return zIndex;
		}
		,
		'bringToBottom': function(ph)	{					// установка zIndex - вниз
			var obj = ph.obj;
			var id = obj.objectId;
			var node = mapNodes[id];
			node.zIndex = ('getMinzIndex' in node ? node.getMinzIndex() : 0);
			utils.bringToDepth(node, node.zIndex);
			if(!gmxAPI.map.needMove && node.type !== 'VectorLayer') {
				if('bringToBack' in node) node.bringToBack();
				else if(node.leaflet && node.leaflet._map && 'bringToBack' in node.leaflet) node.leaflet.bringToBack();
				gmxAPI.map.drawing.chkZindex(id);
			}
			return 0;
		}
		,
		'bringToDepth': function(ph)	{					// установка z-index
			var id = ph.obj.objectId;
			var zIndex = ph.attr.zIndex;
			var node = mapNodes[id];
			if(node) {
				node.zIndex = zIndex;
				utils.bringToDepth(node, zIndex);
			}
			return zIndex;
		}
		,
		'getVisibility': function(ph)	{					// получить видимость mapObject
			return ph.obj.isVisible;
		},
        setVisible: function(ph) {              // установить видимость mapObject
            if(!ph || !ph.obj) return false;
            var obj = ph.obj,
                id = obj.objectId,
                node = mapNodes[id];
            //console.log('setVisible ', id, ph.attr);
            if(!node) return false;
            //if(L.Browser.gecko3d && 'isOnScene' in node) node.isOnScene = true;
            if(ph.attr) node.isOnScene = true;
            node.notView = ph.notView || false;
            if(obj.isVisible === node.isVisible && node.isVisible === ph.attr) return true;
            node.isVisible = ph.attr;
            //gmxAPI._leaflet.LabelsManager.onChangeVisible(id, ph.attr);
            return utils.setVisibleNode(ph);
        }
        ,
		'setExtent':	function(ph)	{		//Задать географический extent - за пределы которого нельзя выйти. - todo
			var attr = ph.attr;
			if(!attr) {
				LMap.options.maxBounds = null;
			} else {
				var southWest = new L.LatLng(attr.y2, attr.x2),
					northEast = new L.LatLng(attr.y1, attr.x1),
					bounds = new L.LatLngBounds(southWest, northEast);			
				LMap.setMaxBounds(bounds);		// После установки надо сбрасывать
			}
		}
		,getMinZoom: function(ph) {				// получить minZoom карты
            return LMap.getMinZoom();
		}
		,getMaxZoom: function(ph) {				// получить maxZoom карты
            return LMap.getMaxZoom();
		}
		,
		'setMinMaxZoom':	function(ph)	{				// установка minZoom maxZoom карты
			if(LMap.options.minZoom == ph.attr.z1 && LMap.options.maxZoom == ph.attr.z2) return;
			LMap.options.minZoom = ph.attr.z1;
			LMap.options.maxZoom = ph.attr.z2;
			var currZ = (gmxAPI.map.needMove ? gmxAPI.map.needMove.z : LMap.getZoom() || 4);
			var minz = LMap.getMinZoom();
			var maxz = LMap.getMaxZoom();
			if(currZ > maxz) currZ = maxz;
			else if(currZ < minz) currZ = minz;
			var centr = LMap.getCenter();
			var px = centr.lng;
			var py = centr.lat;
			if(gmxAPI.map.needMove) {
				gmxAPI.map.needMove.z = currZ;
			} else {
				utils.runMoveTo({'x': px, 'y': py, 'z': currZ})
			}
			gmxAPI._listeners.dispatchEvent('onMinMaxZoom', gmxAPI.map, {obj: gmxAPI.map, attr: {minZoom: minz, maxZoom: maxz, currZ: currZ} });
            LMap.fire('zoomlevelschange');
		}
		,
		'checkMapSize':	function()	{				// Проверка изменения размеров карты
			if(LMap) {
				LMap._onResize();
				return true;
			}
			return false;
		}
        ,addClipPolygon: function(ph) {     // Установка геометрии обрезки слоя
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(!node) return;
            if('addClipPolygon' in node) node.addClipPolygon(ph.attr);
        }
        ,removeClipPolygon: function(ph) {  // Удаление геометрии обрезки слоя
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(!node) return;
            if('removeClipPolygon' in node) node.removeClipPolygon(ph.attr);
        }
        ,setImageProcessingHook: function(ph) {     // Установка предобработчика растров слоя
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(!node) return;
            var geometry = node.geometry;
            var properties = geometry.properties;
            var layerID = properties.LayerID;
            var layer = gmxAPI.map.layersByID[layerID];
            if(!layer) return;
            layer.setImageProcessingHook(ph.attr.func);

            // node.imageProcessingHook = ph.attr.func;
            // node.imageProcessingCrossOrigin = ph.attr.crossOrigin;
            // if('redrawLayer' in node) node.redrawLayer();
        }
        ,removeImageProcessingHook: function(ph) {  // Удаление предобработчика растрового тайла
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(!node) return;
            delete node.imageProcessingHook;
            delete node.imageProcessingCrossOrigin;
        }
        ,
		'zoomBy':	function(ph)	{				// установка Zoom карты
			var toz = Math.abs(ph.attr.dz);
			if(ph.attr.dz > 0) LMap.zoomOut(toz);
			else LMap.zoomIn(toz);
		}
		,
		'moveTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			var zoom = ph.attr.z || (gmxAPI.map.needMove ? gmxAPI.map.needMove.z : LMap.getZoom() || 4);
			if(zoom > LMap.getMaxZoom() || zoom < LMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr.y, ph.attr.x);
			utils.runMoveTo({'x': pos.lng, 'y': pos.lat, 'z': zoom});
		}
		,
		'slideTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			if(ph.attr['z'] > LMap.getMaxZoom() || ph.attr['z'] < LMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr['y'], ph.attr['x']);
			utils.runMoveTo({'x': pos.lng, 'y': pos.lat, 'z': ph.attr['z']})
		}
		,
		'setLabel':	function(ph)	{				// Установка содержимого label
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			node['label'] = ph['attr']['label'];
			gmxAPI._leaflet['drawManager'].add(id);
			if(node['type'] === 'mapObject') setLabel(id);
		}
		,
		'getStyle':	function(ph)	{				// Установка стилей обьекта
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;     // Нода не была создана через addObject
			var out = {	};
			if(node._regularStyle) out.regular = node._regularStyle;
			if(node._hoveredStyle) out.hovered = node._hoveredStyle;
			return out;
		}
		,
		'setStyle':	function(ph)	{				// Установка стилей обьекта
			var id = ph.obj.objectId;
			setStyle(id, ph.attr);
		}
		,
		'remove':	function(ph)	{				// Удаление ноды
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;						// Нода не была создана через addObject
			//commands.disableDragging(ph);
			//gmxAPI._leaflet.LabelsManager.remove(id);
			if('remove' in node) {							// Имеется свой remove
				node.remove(id);
				removeNode(id);
			} else if(node['type'] === 'filter') {			// Удаление фильтра векторного слоя
				var pNode = mapNodes[node['parentId']];
				pNode.removeFilter(id);
			} else if(node['type'] === 'mapObject') {	// Удаление mapObject
				removeNode(id);
			}
			delete mapNodes[id];
		}
		,
		'setVectorTiles': gmxAPI._leaflet['setVectorTiles']			// Установка векторный тайловый слой
		,
		'setWatcher':	function(ph)	{			// Установка подглядывателя обьекта под Hover обьектом
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;
			if('setWatcher' in node) node['setWatcher'](ph.attr);
		}
		,
		'removeWatcher': function(ph)	{				// Удалить подглядыватель
			var id = ph.obj.objectId,
                node = mapNodes[id];
			if(!node) return;
			if('removeWatcher' in node) node['removeWatcher']();
		}
		,
		'setFilter':	function(ph)	{			// Установка фильтра
			var id = ph.obj.objectId,
                node = mapNodes[id];
			if(!node) return null;					// Нода не была создана через addObject
			node.type = 'filter';
			if(node.sql === ph.attr.sql) return true;	// sql не изменился
			var pNode = mapNodes[node.parentId],
                falseFn = function() { return false; };
			node.sql = ph.attr.sql;
			node.sqlFunction = (node.sql ? gmxAPI.Parsers.parseSQL(ph.attr.sql) || falseFn : null);

			//pNode.addFilter(id);
			pNode.setFilter(id);
			
			return (!node.sql || (node.sqlFunction && node.sqlFunction != falseFn) ? true : false);
		}
		,
		'startLoadTiles':	function(ph)	{		// Перезагрузка тайлов векторного слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !'startLoadTiles' in node) return;						// Нода не была создана через addObject
			node.startLoadTiles(ph.attr);
			//node.temporal = ph.attr;
			//var attr = ph.attr; toFilters
		}
		,
		'setDateInterval':	function(ph)	{		// Установка временного интервала
			var id = ph.obj.objectId;
		}
		,
		'removeHandler':	function(ph)	{			// Установка Handler
			var id = ph.obj.objectId;
			var attr = ph.attr;
			var node = mapNodes[id];
			if(!attr || !node || !'handlers' in node) return;						// Нода не была создана через addObject
			delete node['handlers'][attr.eventName];
			if(node['type'] == 'mapObject' && scanexEventNames[attr.eventName]) {
				if(node['leaflet']) node['leaflet'].off(scanexEventNames[attr.eventName]);
				if(node['marker']) node['marker'].off(scanexEventNames[attr.eventName]);
			}
		}
		,
		'setHandler':	function(ph)	{			// Установка Handler
			var id = ph.obj.objectId;
			var attr = ph.attr;
			var node = mapNodes[id];
			if(!attr || !node || !'handlers' in node) return;						// Нода не была создана через addObject
			node['handlers'][attr.eventName] = attr.callbackName;
			setHandlerObject(id, attr.eventName);
		}
		,
		getItems:	function(ph)	{			//	Получить загруженные объекты векторного слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.getItems) return null;					// Нода не была создана через addObject
			return node.getItems(ph.attr);
		}
		,
		'getItem':	function(ph)	{			//	Получить описание объекта векторного слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.getItem) return null;					// Нода не была создана через addObject
			return node.getItem(ph.attr);
		}
		,
		'getGeometry':	function(ph)	{			//	Получить геометрию обьекта
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) {						// Нода не была создана через addObject
				if(ph.obj.parent && mapNodes[ph.obj.parent.objectId]) {
					node = mapNodes[ph.obj.parent.objectId];
					if(node) {
						if(node['type'] == 'filter') node = mapNodes[node.parentId];
						if(node && 'getItemGeometry' in node) return node.getItemGeometry(id);
					}
				}
				return null;
			}
			//if(!node || !'resIDLast' in node) return null;						// Нода не была создана через addObject
			//var rnode = mapNodes[node['resIDLast']];

			var geo = gmxAPI.clone(node.geometry);
			var type = geo.type;
			if(type === 'MultiPolygon') 			geo['type'] = 'MULTIPOLYGON';
			else if(type === 'Polygon')				geo['type'] = 'POLYGON';
			else if(type === 'MultiPoint')			geo['type'] = 'MultiPoint';
			else if(type === 'Point')				geo['type'] = 'POINT';
			else if(type === 'MultiLineString')		geo['type'] = 'MULTILINESTRING';
			else if(type === 'Polyline')			geo['type'] = 'LINESTRING';
			else if(type === 'MultiPolyline')		geo['type'] = 'MULTILINESTRING';
			else if(type === 'GeometryCollection')	geo['type'] = 'GeometryCollection';
			return geo;
		}
		,
		'getGeometryType':	function(ph)	{		// Получить тип геометрии
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) {						// Нода не была создана через addObject
				if(ph.obj.parent && mapNodes[ph.obj.parent.objectId]) {
					node = mapNodes[ph.obj.parent.objectId];
					if(node && node['type'] == 'filter') {
						node = mapNodes[node.parentId];
						if(node && 'getGeometryType' in node) return node.getGeometryType(id);
					}
				}
			}
			var geo = commands.getGeometry(ph);
			return (!geo ? null : geo.type);
		}
		,
		'getCenter': function(ph)	{			//	Получить центр Geometry mapObject
			var geo = commands.getGeometry(ph);
			return gmxAPI.geoCenter(geo);
		}
		,
		'getLength': function(ph)	{			//	Получить площадь обьекта
			var geo = commands.getGeometry(ph);
			var len = gmxAPI.geoLength(geo);
			return (!len ? null : len);
		}
		,
		'getArea':	function(ph)	{			//	Получить площадь обьекта
			var geo = commands.getGeometry(ph);
			var area = gmxAPI.geoArea(geo);
			return (!area ? null : area);
		}
		,
		'getFeatureById':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(node) {						
				var attr = ph['attr'];
				if('getFeatureById' in node) node.getFeatureById(attr);
			}
		}
		,
		'getFeatures': function(ph) {					// получить данные векторного слоя по bounds геометрии
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(node) {						
				var attr = ph['attr'];
				if(attr['center']) {
					var pos = LMap.getCenter()
					attr['geom'] = { type: "POINT", coordinates: [pos['lng'], pos['lat']] };
				}
				if('getFeatures' in node) node.getFeatures(attr);
			}
		}
		,
		'setCursor': function(ph)	{						// изменить курсор
			var attr = ph['attr'];
			if(attr['url']) {
				var st = "url('"+attr['url']+"')";
				var dx = String('dx' in attr ? -attr['dx'] : 0);
				var dy = String('dy' in attr ? -attr['dy'] : 0);
				st += ' ' + dx + ' ' + dy;
				st += ', auto';
				var dom = document.getElementsByTagName("body")[0];
				dom.style.cursor = st;
			}
		}
		,
		'clearCursor': function()	{						// убрать url курсор
			var dom = document.getElementsByTagName("body")[0];
			dom.style.cursor = '';
		}
		,
		'getPosition': function()	{						// получить текущее положение map
			var res = utils.getMapPosition();
			return res;
		}
		,'getX':	function()	{ var pos = LMap.getCenter(); return pos['lng']; }	// получить X карты
		,'getY':	function()	{ var pos = LMap.getCenter(); return pos['lat']; }	// получить Y карты
		,'getZ':	function()	{ return LMap.getZoom(); }							// получить Zoom карты
		,'getMouseX':	function()	{ return utils.getMouseX(); }		// Позиция мыши X
		,'getMouseY':	function()	{ return utils.getMouseY();	}		// Позиция мыши Y
        ,
        setFreezeLoading: function(ph) {
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(node && 'setFreezeLoading' in node) {
                node.setFreezeLoading(ph.attr);
                return true;
            }
            return false;
        },
        isLoadingFreezed: function(ph) {
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(node && 'isLoadingFreezed' in node) {
                return node.isLoadingFreezed(ph.attr);
            }
            return false;
        }
        ,getStatus: function(ph) {
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(node && 'getStatus' in node) {
                return node.getStatus(ph.attr);
            }
            return false;
        },
        redrawItem: function(ph) {
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(node && 'redrawItem' in node) {
                return node.redrawItem(ph.attr);
            }
            return false;
        }
        ,repaintLayer: function(ph) {       // Перерисовка текущих тайлов слоя
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(!node) return;
            if('repaintTilesList' in node) node.repaintTilesList();
            else if('redraw' in node) node.redraw();
        }
        ,
        setStyleHook: function(ph) {
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(node && 'setStyleHook' in node) {
                node.setStyleHook(ph.attr.data);
                return true;
            }
            return false;
        }
        ,
        removeStyleHook: function(ph) {
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(node && 'removeStyleHook' in node) {
                node.removeStyleHook(ph.attr.data);
                return true;
            }
            return false;
        }
        ,
        'setSortItems':	function(ph) {
            var id = ph.obj.objectId;
            var node = mapNodes[id];
            if(node && 'setSortItems' in node) {
                node.setSortItems(ph.attr.data);
                return true;
            }
            return false;
        }
		,
		'setFlipItems':	function(ph) {
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(node && 'setFlipItems' in node) {
				return node.setFlipItems(ph.attr.arr, ph.attr.clear);
			}
			return false;
		}
		,
		'getFlipItems':	function(ph) {
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(node && 'getFlipItems' in node) {
				return node.getFlipItems(ph.attr.data);
			}
			return [];
		}
		,
		'flip':	function(ph)	{					// Пролистывание в квиклуках
			var id = ph.obj.objectId;
			if(typeof(id) == 'string') id = id.replace(/id_/, '');
			var lObj = ph.obj.parent.parent;
			if(lObj) {
				var node = mapNodes[lObj.objectId];
				if(node && node.setFlip) node.setFlip(id);
			}
			return id;
		}
		,
		'setRasterViewItems':	function(ph)	{				// Добавить обьект к массиву Flips обьектов
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !('setRasterViewItems' in node)) return false;
			return node['setRasterViewItems'](ph.attr['arr']);
		}
		,
		'addFlip':	function(ph)	{				// Добавить обьект к массиву Flips обьектов
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !ph.attr.fid) return false;
			if(node.addFlip) return node.addFlip(ph.attr.fid);
			return false;
		}
		,
		'enableFlip':	function(ph)	{			// Установить ротацию обьектов слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			node['flipEnabled'] = true;
			return true;
		}
		,
		'disableFlip':	function(ph)	{			// Отменить ротацию обьектов слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			node['flipEnabled'] = false;
			return true;
		}
		,
		getZoomBounds: function(ph)	{		// Установка границ по zoom
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return null;
			var out = {
				MinZoom: node.minZ
				,MaxZoom: node.maxZ
			}
			if(node.type === 'map') {
                out = {
                    MinZoom: LMap.getMinZoom()
                    ,MaxZoom: LMap.getMaxZoom()
                }
            }
			return out;
		}
		,
		'setZoomBounds':	function(ph)	{		// Установка границ по zoom
			var id = ph.obj.objectId,
                node = mapNodes[id];
			if(!node) return false;
			node.minZ = ph.attr.minZ || gmxAPI.defaultMinZoom;
			node.maxZ = ph.attr.maxZ || gmxAPI.defaultMaxZoom;
			var pnode = mapNodes[node.parentId],
                propHiden = node.propHiden;
			if(propHiden && propHiden.subType == 'tilesParent') {			//ограничение по zoom квиклуков
				if(pnode && pnode.setZoomBoundsQuicklook) pnode.setZoomBoundsQuicklook(node.minZ, node.maxZ);
			} else if(node.type == 'map') {			//ограничение по zoom map
				commands.setMinMaxZoom({ attr:{ z1: node.minZ, z2: node.maxZ } })
			} else if('onZoomend' in node) {					// есть проверка по Zoom
				node.onZoomend();
			} else if(pnode && pnode.type == 'VectorLayer') {	// изменения для одного из фильтров
				if('chkZoomBoundsFilters' in pnode) {
					pnode.chkZoomBoundsFilters();
				}
			}
			return true;
		}
		,
		'observeVectorLayer':	function(ph)	{		// Установка получателя видимых обьектов векторного слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			var layerId = ph.attr.layerId;
			var nodeLayer = mapNodes[layerId];
			if(!nodeLayer) return false;
			nodeLayer.setObserver(ph);
			//node['observeVectorLayer'] = ph.attr.func;
			return true;
		}
        ,
		'removeObserver':	function(ph)	{		// Удаление получателя видимых обьектов векторного слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			if ('removeObserver' in node) node.removeObserver(ph);
			return true;
		}
        ,
		setImagePoints:	function(ph)	{				// Изменение точек привязки изображения
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;
            var fName = (L.Browser.gecko3d || L.Browser.webkit3d ? 'ImageMatrixTransform' : 'setImageMapObject');
            ph.setImagePoints = true;
            gmxAPI._leaflet[fName](node, ph);
		}
		,
        'setImage':	function(ph)	{					// Установка изображения
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			setTimeout(function() {
                var fName = (L.Browser.gecko3d || L.Browser.webkit3d ? 'ImageMatrixTransform' : 'setImageMapObject');
                gmxAPI._leaflet[fName](node, ph);
			},2);
			return true;
		}
		,
		'setImageExtent':	function(ph)	{			// Установка изображения без трансформации
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			ph['setImageExtent'] = true;
			setTimeout(function() {
                gmxAPI._leaflet.setImageMapObject(node, ph);
            },2);
			return true;
		}
		,
		'addItems':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.addItems) return false;
			var arr = [];
			for (var i=0; i<ph.attr.data.length; i++)	// Подготовка массива обьектов
			{
				var item = ph.attr.data[i];
				var pt = {
					id: item.id
					,properties: item.properties
					,propHiden: item.propHiden || {}
					,geometry: item.isMerc ? item.geometry : gmxAPI.merc_geometry(item.geometry)
				};
				arr.push(pt);
			}
			node.addItems(arr);
			return true;
		}
		,
		'removeItems':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.removeItems) return false;
			node.removeItems(ph.attr.data, true);
			return true;
		}
		,		
		'setAPIProperties':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			if(!node['propHiden']) node['propHiden'] = {};
			for(var key in ph['attr']) {
				node['propHiden'][key] = ph['attr'][key];
			}
			if(node['type'] === 'VectorLayer') node.setAPIProperties();
			return true;
		}
		,
		'delClusters':	function(ph) {
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			if(node['type'] == 'filter') {					// для фильтра id
				var pGmxNode = ph.obj.parent;
				var pid = pGmxNode.objectId;
				node = mapNodes[pid];
				node.delClusters();
				return true;
			} else if(node['type'] == 'VectorLayer') {	// для всех фильтров
				node.delClusters();
				return true;
			}
			return false;
		}
		,
		'setClusters':	function(ph) {
console.log('setClusters', arguments);
			// setTimeout(function()
			// {
				// var id = ph.obj.objectId;
				// var node = mapNodes[id];
				// if(!node) return false;
				// if(node['type'] == 'filter') {					// для фильтра id
					// var pGmxNode = ph.obj.parent;
					// var pid = pGmxNode.objectId;
					// node = mapNodes[pid];
					// node.setClusters(ph.attr, id);
					// return true;
				// } else if(node['type'] == 'VectorLayer') {	// для всех фильтров
					// node.setClusters(ph.attr, id);
					// return true;
				// }
				// return false;
			// }, 0);
		}
		,
		'getChildren':	function(ph)	{								// Получить потомков обьекта
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			var out = [];
			for (var i = 0; i < node.children.length; i++)
			{
				var itemId = node.children[i];
				var item = mapNodes[itemId];
				if(item) {
					var prop = ('getPropItem' in item ? item.getPropItem(item) : (item.geometry && item.geometry.properties ? item.geometry.properties : null));
					out.push({
						id: item.id,
						properties: prop
					});
				}
			}
			return out;
		}
		,
		'setEditObjects':	function(ph)	{							// Установка редактируемых обьектов слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.setEditObjects) return false;
			node.setEditObjects(ph.attr);
			return true;
		}
		,
		setPositionOffset:	function(ph)	{	// Установить смещение слоя в метрах Меркатора
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.setPositionOffset) return false;
			node.setPositionOffset(ph.attr);
			return true;
		}
        ,getPositionOffset: function(ph) {	// Получить смещение слоя в метрах Меркатора
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.getPositionOffset) return false;
            return node.getPositionOffset();
        }
		// ,
		// 'setBackgroundColor':	function(hash)	{						// Установка BackgroundColor
		// }
		// ,
		// 'sendPNG':	function(hash)	{									// Сохранение изображения карты на сервер
			// var miniMapFlag = gmxAPI.miniMapAvailable;
			// var attr = hash['attr'];
			// var flag = (attr.miniMapSetVisible ? true : false);
			// if(miniMapFlag != flag) gmxAPI.map.miniMap.setVisible(flag);
			// if(attr.func) attr.func = gmxAPI.uniqueGlobalName(attr.func);
			// var ret = {'base64': utils.getMapImage(attr)};
			// if(miniMapFlag) gmxAPI.map.miniMap.setVisible(miniMapFlag);
			// return ret;
		// }
	}

	// Передача команды в leaflet
	function leafletCMD(cmd, hash)
	{
		if(!LMap) LMap = gmxAPI._leaflet['LMap'];				// Внешняя ссылка на карту
		
		var ret = {};
		if(!hash) hash = {};
		var obj = hash['obj'] || null;	// Целевой обьект команды
		var attr = hash['attr'] || '';
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
		if(!commands[cmd]) gmxAPI.addDebugWarnings({'func': 'leafletCMD', 'cmd': cmd, 'hash': hash});
		//waitChkIdle();
//console.log(cmd + ' : ' , hash , ' : ' , ret);
		return ret;
	}

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['cmdProxy'] = leafletCMD;				// посылка команд отрисовщику
	gmxAPI._leaflet['utils'] = utils;						// утилиты для leaflet
	gmxAPI._leaflet['mapNodes'] = mapNodes;					// Хэш нод обьектов карты - аналог MapNodes.hx
 })();

 ////////////////////////////

//Плагины для leaflet
(function()
{
	// Обработчик события - mapInit
	function onMapInit(ph) {
		var mapID = ph.objectId;
		mapNodes[mapID] = {
			'type': 'map'
			,'handlers': {}
			,'children': []
			,'id': mapID
			,'group': gmxAPI._leaflet.LMap
			,'parentId': false
		};
		gmxAPI._listeners.addListener({'level': -10, 'eventName': 'mapCreated', 'func': function(ph) {
			setTimeout(function() {
				if(gmxAPI.map.needMove) {
					utils.runMoveTo();
				}
			}, 10);
			if(gmxAPI.map.needSetMode) {
				gmxAPI.map.setMode(gmxAPI.map.needSetMode);
				gmxAPI.map.needSetMode = null;
			}
			// if(gmxAPI.map.standartTools && gmxAPI.isMobile) {
				// gmxAPI.map.standartTools.remove();
			// }
		}});
//        gmxAPI.map.controlsManager.initControls();
		// var controls = gmxAPI.map.controlsManager.getCurrent();
        // if(controls && 'initControls' in controls) {
            // controls.initControls();
        // }
	}
	
	var utils = null;							// Утилиты leafletProxy
	var mapNodes = null;						// Хэш нод обьектов карты - аналог MapNodes.hx
	var leafLetCont_ = null;
	var mapDivID = '';
	var initFunc = null;
	//var intervalID = 0;
	
	// Инициализация LeafLet карты
	function waitMe(e)
	{
		if('L' in window) {
			//clearInterval(intervalID);
			if(!utils) utils = gmxAPI._leaflet.utils;
			if(!mapNodes) {
				mapNodes = gmxAPI._leaflet.mapNodes;
				gmxAPI._cmdProxy = gmxAPI._leaflet.cmdProxy;			// Установка прокси для leaflet
			}

			gmxAPI.isMobile = (L.Browser.mobile ? true : false);

			var LMap = new L.Map(leafLetCont_,
				{
				    center: [55.7574, 37.5952]
					,zoom: 5
					,zoomControl: false
					//,doubleClickZoom: false
					//,doubleClickZoomGMX: true
					,attributionControl: false
					,trackResize: true
					,fadeAnimation: (window.gmxPhantom ? false : true)		// отключение fadeAnimation при запуске тестов
					,zoomAnimation: (window.gmxPhantom ? false : true)		// отключение zoomAnimation при запуске тестов
					,boxZoom: false
					//,zoomAnimation: false
					//,zoomAnimation: (gmxAPI.isChrome ? false : true)
					//,worldCopyJump: false
					
					//,inertia: false
					//,keyboard: false
					//,markerZoomAnimation: true
					//,dragging: false
					//,crs: L.CRS.EPSG3395
					//,'crs': L.CRS.EPSG3857 // L.CRS.EPSG4326 // L.CRS.EPSG3395 L.CRS.EPSG3857
				}
			);
            window.v2 = {};
            var controls = window.v2.controls = {
                gmxZoom: L.control.gmxZoom()            // default options = {zoomslider: true}
                ,gmxBottom: L.control.gmxBottom()
                ,gmxLogo: L.control.gmxLogo()
                ,gmxLocation: L.control.gmxLocation()   // default options = {position: 'bottomright'}
                ,gmxCopyright: L.control.gmxCopyright()  // default options = {position: 'bottomleft'}
                ,gmxHide: L.control.gmxHide()
                ,gmxCenter: L.control.gmxCenter({color: 'black'})// default options = {color: '#216b9c'}
                ,gmxLayers: new L.Control.gmxLayers(LMap.gmxBaseLayersManager, {collapsed: false})
                ,boxzoom: new L.Control.gmxIcon({
                    id: 'boxzoom',
                    toggle: true,
                    title: L.gmxLocale.addText({
                        'eng': {
                            'boxZoom': 'BoxZoom'
                        },
                        'rus': {
                            'boxZoom': 'Увеличение'
                        }
                    }).getText('boxZoom'),
                    onAdd: function (control) {
                        //console.log('onAdd', this, arguments);
                        var map = control._map,
                            _onMouseDown = map.boxZoom._onMouseDown;
                        map.boxZoom._onMouseDown = function (e) {
                            _onMouseDown.call(map.boxZoom, {
                                clientX: e.clientX,
                                clientY: e.clientY,
                                which: 1,
                                shiftKey: true
                            });
                        }
                        map.on('boxzoomend', function () {
                            map.dragging.enable();
                            map.boxZoom.removeHooks();
                            control.setActive(false);
                        });
                    },
                    stateChange: function (control) {
                        //console.log('boxzoom', control.options.isActive);
                        var map = control._map;
                        if (control.options.isActive) {
                            map.dragging.disable();
                            map.boxZoom.addHooks();
                        } else {
                            map.dragging.enable();
                            map.boxZoom.removeHooks();
                        }
                    }
                })
                ,gmxDrawing: new L.Control.gmxDrawing({
                    id: 'drawing',
                    stateChange: function (control, key, flag) {
                        //console.log('drawing', control.options.activeKey, key, flag);
                    }
                })
            };
            for (var key in controls) {
                LMap.addControl(controls[key]);
            }

// if ('_initBaseLayersManager' in LMap) LMap._initBaseLayersManager({
    // activeIDs: ['map', 'hybrid', 'satellite', 'osm', 'relief', 'outline', 'grey', '2GIS', 'osm_spring', 'osm_summer', 'osm_autumn', 'osm_winter', 'osm_night', 'OSMHybrid'],
    // currentID: 'map',
    // apiKey: window.apiKey || 'U92596WMIH',
    // hostName: 'maps.kosmosnimki.ru',
    // mapID: '1D30C72D02914C5FB90D1D448159CAB6'
// });

			gmxAPI._leaflet.LMap = LMap;			// Внешняя ссылка на карту
            gmxAPI._leaflet.utils.chkZoomCurrent(5);
            LMap
                .on('viewreset', function(e) {
                    this.invalidateSize();
                }, LMap)
                .on('mouseout', function(e) {
                    // var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);
                    // if(propsBalloon && propsBalloon.isVisible()) propsBalloon.setVisible(false);
                    // gmxAPI._leaflet.isMouseOut = true;			// мышь покинула карту
                }, LMap)
                .on('moveend', function(e) {
                    // if(gmxAPI.map.needMove) return;
                    // gmxAPI._listeners.dispatchEvent('onMoveEnd', gmxAPI.map, {'obj': gmxAPI.map, 'attr': gmxAPI.currPosition });
                    // utils.waitChkIdle(500, 'moveend');  // Проверка отрисовки карты
                }, LMap)
                .on('move', function(e) {
                }, LMap);

			// Обработчик события - mapInit
			gmxAPI._listeners.addListener({'level': -10, 'eventName': 'mapInit', 'func': onMapInit});


			initFunc(mapDivID, 'leaflet');
		}
	}

    // Загрузка LeafletPlugins
    function addLeafletPlugins()
    {
        var apiHost = gmxAPI.getAPIFolderRoot(),
            cssFiles = [
                apiHost + "leaflet/leaflet.css?" + gmxAPI.buildGUID
            ],
            arr = 'L' in window ? [] : [{charset: 'windows-1251', src: apiHost + "leaflet/leaflet.js" }];

        cssFiles.push(apiHost + 'leaflet/buildAPIV2/dist/css/leaflet-geomixer-all.css');
        arr.push({src: apiHost + "leaflet/buildAPIV2/dist/leaflet-geomixer-all.js", charset: 'utf8'});
        if(window.LeafletPlugins) {
            for (var i = 0, len = window.LeafletPlugins.length; i < len; i++) {
                var element = window.LeafletPlugins[i],
                    path = element.path || '',
                    prefix = (path.substring(0, 7) === 'http://' ? '' : apiHost);
                path = prefix + path;
                if(element.css) cssFiles.push(path + element.css + '?' + gmxAPI.buildGUID);
                if(element.files) {
                    for (var j = 0, len1 = element.files.length; j < len1; j++) {
                        var ph = {
                            charset: element.charset || 'utf8',
                            src: path + element.files[j] + '?' + gmxAPI.buildGUID
                        };
                        if(element.callback) ph.callback = element.callback;
                        if(element.callbackError) ph.callbackError = element.callbackError;
                        arr.push(ph);
                    }
                }
                gmxAPI.leafletPlugins[element.module || gmxAPI.newFlashMapId()] = element;
            }
        }
        cssFiles.forEach(function(item) {gmxAPI.loadCSS(item);} );
        gmxAPI.gmxAPIv2DevLoader = function(depsJS, depsCSS) {
            var gmxControlsPrefix = 'leaflet/buildAPIV2/';
            depsJS.forEach(function(item) {
                arr.push({
                    charset: 'utf8',
                    src: gmxControlsPrefix + item + '?' + gmxAPI.buildGUID
                });
            });
            depsCSS.forEach(function(item) {gmxAPI.loadCSS(gmxControlsPrefix + item + '?' + gmxAPI.buildGUID);} );
        };

        if (arr.length) {
            var count = 0,
                loadItem = function() {
                    gmxAPI.loadJS(arr.shift(), function(item) {
                        if (arr.length === 0) waitMe();
                        else loadItem();
                    });
                };
            loadItem();
        } else {
            waitMe();
        }
    }

	// Добавить leaflet в DOM
	function addLeafLetObject(apiBase, flashId, ww, hh, v, bg, loadCallback)
	{
		mapDivID = flashId;
		initFunc = loadCallback;

		leafLetCont_ = gmxAPI.newElement(
			"div",
			{
				id: mapDivID
			},
			{
				width: "100%",
				height: "100%",
				zIndex: 0,
				border: 0
			}
		);
		addLeafletPlugins();
		return leafLetCont_;
	}
	
	//расширяем namespace
	var canvas = document.createElement('canvas');
	canvas.width = canvas.height = 512;
	if('getContext' in canvas) {
		gmxAPI._leaflet['labelCanvas'] = canvas;		// для расчета размеров label
		gmxAPI._addProxyObject = addLeafLetObject;		// Добавить в DOM
	} else {
		var str = '<br>Ваш браузер не поддерживает Canvas. Обновите версию браузера или установите новый. Рекомендуемые браузеры: ';
		var href = 'http://windows.microsoft.com/ru-RU/internet-explorer/download-ie';
		str += '<a href="'+href+'" target="_blank">IE9-10</a>';
		href = 'http://www.google.com/chrome'; str += ', <a href="'+href+'" target="_blank">Chrome</a>';
		href = 'http://www.opera.com/browser/'; str += ', <a href="'+href+'" target="_blank">Opera 12.x</a>';
		href = 'http://www.mozilla.org/en-US/'; str += ', <a href="'+href+'" target="_blank">Mozilla Firefox</a>';
		href = 'http://support.apple.com/kb/DL1531'; str += ', <a href="'+href+'" target="_blank">Safari</a>';
		href = 'http://browser.yandex.ru'; str += ', <a href="'+href+'" target="_blank">Yandex</a>';
		var res = gmxAPI.newElement(
			"div",
			{
				id: 'warning'
				,innerHTML: str
			});
		
		gmxAPI._addProxyObject = function() { return res; };		// Нет поддержки canvas
	}
	
	gmxAPI.proxyType = 'leaflet';
    gmxAPI.APILoaded = true;					// Флаг возможности использования gmxAPI сторонними модулями
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['lastDrawTime'] = null;			// карта находится в процессе отрисовки
	gmxAPI._leaflet['zoomCurrent'] = null;			// параметры от текущего zoom
	gmxAPI._leaflet['lastZoom'] = -1;				// zoom нарисованный
	gmxAPI._leaflet['mInPixel'] = 0;				// текущее кол.метров в 1px
	gmxAPI._leaflet['waitSetImage'] = 0;			// текущее число загружаемых SetImage
	gmxAPI._leaflet['curDragState'] = false;		// текущий режим dragging карты
	gmxAPI._leaflet['mousePressed'] = false;		// признак нажатой мыши
	gmxAPI._leaflet['mouseMoveAttr'] = null;		// атрибуты mouseOver
	gmxAPI._leaflet.activeObject = null;			// Нода последнего mouseOver

	gmxAPI._leaflet['renderingObjects'] = {};		// Список объектов находящихся в Rendering режиме
	gmxAPI._leaflet['onRenderingStart'] = function(id)
	{
		//if(!lObj || !lObj.layer) return false;
		//var id = lObj.layer._leaflet_id;
		gmxAPI._leaflet['renderingObjects'][id] = gmxAPI._leaflet['renderingObjects'][id] || 0;
        gmxAPI._leaflet['renderingObjects'][id] += 1;
	};
	gmxAPI._leaflet['onRenderingEnd'] = function(id, flag)
	{
		//if(!lObj || !lObj.layer) return false;
		//var id = lObj.layer._leaflet_id;
        
        if (id in gmxAPI._leaflet['renderingObjects']) {
            gmxAPI._leaflet['renderingObjects'][id] -= 1;
            if (gmxAPI._leaflet['renderingObjects'][id] === 0) {
                delete gmxAPI._leaflet['renderingObjects'][id];
            }
        }
        
		if(!flag) gmxAPI._leaflet['utils'].chkIdle(true, 'onRenderingEnd: ' + id);					// Проверка отрисовки карты
	};
})();

if (gmxAPI.whenLoadedArray) {
    for (var i = 0, len = gmxAPI.whenLoadedArray.length; i < len; i++) {
        gmxAPI.whenLoadedArray[i]();
    }
    gmxAPI.whenLoadedArray = null;
}
