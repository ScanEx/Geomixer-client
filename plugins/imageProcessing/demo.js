!function () {
////////////////////////////////////////////////////////////////////////////////
// Filter object
////////////////////////////////////////////////////////////////////////////////

function Filter(name, func, init, update, imageFile) {
    this.name = name;
    this.func = func;
    this.update = update;
    this.imageFile = imageFile;
    this.sliders = [];
    this.nubs = [];
    init.call(this);
}

Filter.prototype.addNub = function(name, x, y) {
    this.nubs.push({ name: name, x: x, y: y });
};

Filter.prototype.addSlider = function(name, label, min, max, value, step) {
    this.sliders.push({ name: name, label: label, min: min, max: max, value: value, step: step });
};

Filter.prototype.setCode = function(code, func) {
    $('.codeWebgl').html(code);
    L.gmx.WebglFilters.code = func;
    if (L.gmx.WebglFilters.callback) L.gmx.WebglFilters.callback(code);
};

Filter.prototype.use = function() {
    // Clear all rows but the first two (which contain the filter selector and code sample)
    var tbody = $('.properties')[0].firstChild;
    for (var tr = tbody.firstChild.nextSibling.nextSibling; tr; tr = next) {
        var next = tr.nextSibling;
        tbody.removeChild(tr);
    }

    // Add a row for each slider
    for (var i = 0; i < this.sliders.length; i++) {
        var slider = this.sliders[i];
        $('<tr><th>' + slider.label.replace(/ /g, '&nbsp;') + ':</th><td><div class="slider' + i + '"></div></td></tr>').appendTo(tbody);
        var onchange = (function(this_, slider) { return function(event, ui) {
            this_[slider.name] = ui.value;
            this_.update();
        }; })(this, slider);
        $('.slider' + i).slider({
            slide: onchange,
            change: onchange,
            min: slider.min,
            max: slider.max,
            value: slider.value,
            step: slider.step
        });
        this[slider.name] = slider.value;
    }

    this.update();
};

////////////////////////////////////////////////////////////////////////////////
// Filter definitions
////////////////////////////////////////////////////////////////////////////////

var perspectiveNubs = [175, 156, 496, 55, 161, 279, 504, 330];
var filters = {
    'Adjust': [
        new Filter('Brightness / Contrast', 'brightnessContrast', function() {
            this.addSlider('brightness', 'Brightness', -1, 1, 0, 0.01);
            this.addSlider('contrast', 'Contrast', -1, 1, 0, 0.01);
        }, function() {
            var _this = this;
            this.setCode('brightnessContrast(' + this.brightness + ', ' + this.contrast + ').update();'
            ,
                function(it) {
                    return it.brightnessContrast(_this.brightness, _this.contrast);
                }
            );
        }),
        new Filter('Hue / Saturation', 'hueSaturation', function() {
            this.addSlider('hue', 'Hue', -1, 1, 0, 0.01);
            this.addSlider('saturation', 'Saturation', -1, 1, 0, 0.01);
        }, function() {
            var _this = this;
            this.setCode('hueSaturation(' + this.hue + ', ' + this.saturation + ').update();'
            ,
                function(it) {
                    return it.hueSaturation(_this.hue, _this.saturation);
                }
            );
        }),
        new Filter('Vibrance', 'vibrance', function() {
            this.addSlider('amount', 'Amount', -1, 1, 0.5, 0.01);
        }, function() {
            var _this = this;
            this.setCode('vibrance(' + this.amount + ').update();'
            ,
                function(it) {
                    return it.vibrance(_this.amount);
                }
            );
        }),
        new Filter('Denoise', 'denoise', function() {
            this.addSlider('exponent', 'Exponent', 0, 50, 20, 1);
        }, function() {
            var _this = this;
            this.setCode('denoise(' + this.exponent + ').update();'
            ,
                function(it) {
                    return it.denoise(_this.exponent);
                }
            );
        }),
        new Filter('Unsharp Mask', 'unsharpMask', function() {
            this.addSlider('radius', 'Radius', 0, 200, 20, 1);
            this.addSlider('strength', 'Strength', 0, 5, 2, 0.01);
        }, function() {
            var _this = this;
            this.setCode('unsharpMask(' + this.radius + ', ' + this.strength + ').update();'
            ,
                function(it) {
                    return it.unsharpMask(_this.radius, _this.strength);
                }
            );
        }),
        new Filter('Noise', 'noise', function() {
            this.addSlider('amount', 'Amount', 0, 1, 0.5, 0.01);
        }, function() {
            var _this = this;
            this.setCode('noise(' + this.amount + ').update();'
            ,
                function(it) {
                    return it.noise(_this.amount);
                }
            );
        }),
        new Filter('Sepia', 'sepia', function() {
            this.addSlider('amount', 'Amount', 0, 1, 1, 0.01);
        }, function() {
            var _this = this;
            this.setCode('sepia(' + this.amount + ').update();'
            ,
                function(it) {
                    return it.sepia(_this.amount);
                }
            );
        }),
        new Filter('Vignette', 'vignette', function() {
            this.addSlider('size', 'Size', 0, 1, 0.5, 0.01);
            this.addSlider('amount', 'Amount', 0, 1, 0.5, 0.01);
        }, function() {
            var _this = this;
            this.setCode('vignette(' + this.size + ', ' + this.amount + ').update();'
            ,
                function(it) {
                    return it.vignette(_this.size, _this.amount);
                }
            );
        })
    ],
    'Blur': [
        new Filter('Zoom Blur', 'zoomBlur', function() {
            this.addNub('center', 128, 128);
            this.addSlider('strength', 'Strength', 0, 1, 0.3, 0.01);
        }, function() {
            var _this = this;
            this.setCode('zoomBlur(128, 128, ' + this.strength + ').update();'
            // this.setCode('zoomBlur(' + this.center + ', ' + this.strength + ').update();'
            ,
                function(it) {
                    return it.zoomBlur(128, 128, _this.strength);
                }
            );
        }),
        new Filter('Triangle Blur', 'triangleBlur', function() {
            this.addSlider('radius', 'Radius', 0, 200, 50, 1);
        }, function() {
            var _this = this;
            this.setCode('triangleBlur(' + this.radius + ').update();'
            ,
                function(it) {
                    return it.triangleBlur(_this.radius);
                }
            );
        }),
        new Filter('Tilt Shift', 'tiltShift', function() {
			this.addNub('start', 0.15, 0.75);
            this.addNub('end', 0.75, 0.6);
            this.addSlider('blurRadius', 'Blur Radius', 0, 50, 15, 1);
            this.addSlider('gradientRadius', 'Gradient Radius', 0, 128, 128, 1);
        }, function() {
            var _this = this;
				nubs = _this.nubs;
            this.setCode('tiltShift(' + nubs[0].x + ', ' + nubs[0].y + ', ' + nubs[1].x + ', ' + nubs[1].y + ', ' + this.blurRadius + ', ' + this.gradientRadius + ').update();'
            ,
                function(it) {
                    return it.tiltShift(nubs[0].x, nubs[0].y, nubs[1].x, nubs[1].y, _this.blurRadius, _this.gradientRadius);
                }
            );
        }),
        new Filter('Lens Blur', 'lensBlur', function() {
            this.addSlider('radius', 'Radius', 0, 50, 10, 1);
            this.addSlider('brightness', 'Brightness', -1, 1, 0.75, 0.01);
            this.addSlider('angle', 'Angle', -Math.PI, Math.PI, 0, 0.01);
        }, function() {
            var _this = this;
            this.setCode('lensBlur(' + this.radius + ', ' + this.brightness + ', ' + this.angle + ').update();'
            ,
                function(it) {
                    return it.lensBlur(_this.radius, _this.brightness, _this.angle);
                }
            );
        })//, 'lighthouse.jpg')
    ],
    'Warp': [
        new Filter('Swirl', 'swirl', function() {
            this.addNub('center', 128, 128);
            this.addSlider('angle', 'Angle', -25, 25, 3, 0.1);
            this.addSlider('radius', 'Radius', 0, 128, 200, 1);
        }, function() {
            var _this = this;
				nubs = _this.nubs;
            this.setCode('swirl(' + nubs[0].x + ', ' + nubs[0].y + ', ' + this.radius + ', ' + this.angle + ').update();'
            ,
                function(it) {
                    return it.swirl(nubs[0].x, nubs[0].y, _this.radius, _this.angle);
                }
            );
        }),
        new Filter('Bulge / Pinch', 'bulgePinch', function() {
            this.addNub('center', 128, 128);
            this.addSlider('strength', 'Strength', -1, 1, 0.5, 0.01);
            this.addSlider('radius', 'Radius', 0, 128, 128, 1);
        }, function() {
            var _this = this;
				nubs = _this.nubs;
            this.setCode('bulgePinch(' + nubs[0].x + ', ' + nubs[0].y + ', ' + this.radius + ', ' + this.strength + ').update();'
            ,
                function(it) {
                    return it.bulgePinch(nubs[0].x, nubs[0].y, _this.radius, _this.strength);
                }
            );
        })
        /*,
        new Filter('Perspective', 'perspective', function() {
            var w = 640, h = 425;
            this.addNub('a', perspectiveNubs[0] / w, perspectiveNubs[1] / h);
            this.addNub('b', perspectiveNubs[2] / w, perspectiveNubs[3] / h);
            this.addNub('c', perspectiveNubs[4] / w, perspectiveNubs[5] / h);
            this.addNub('d', perspectiveNubs[6] / w, perspectiveNubs[7] / h);
        }, function() {
            var before = perspectiveNubs;
            var after = [this.a.x, this.a.y, this.b.x, this.b.y, this.c.x, this.c.y, this.d.x, this.d.y];
            this.setCode('perspective([' + before + '], [' + after + ']).update();'
            ,
                function(it) {
                    return it.perspective([before], [after]);
                }
            );
        }, 'perspective.jpg')*/
    ],
    'Fun': [
        new Filter('Ink', 'ink', function() {
            this.addSlider('strength', 'Strength', 0, 1, 0.25, 0.01);
        }, function() {
            var _this = this;
            this.setCode('ink(' + this.strength + ').update();'
            ,
                function(it) {
                    return it.ink(_this.strength);
                }
            );
        }),
        new Filter('Edge Work', 'edgeWork', function() {
            this.addSlider('radius', 'Radius', 0, 200, 10, 1);
        }, function() {
            var _this = this;
            this.setCode('edgeWork(' + this.radius + ').update();'
            ,
                function(it) {
                    return it.edgeWork(_this.radius);
                }
            );
        }),
        new Filter('Hexagonal Pixelate', 'hexagonalPixelate', function() {
            this.addNub('center', 128, 128);
            this.addSlider('scale', 'Scale', 10, 100, 20, 1);
        }, function() {
            var _this = this;
				nubs = _this.nubs;
            this.setCode('hexagonalPixelate(' + nubs[0].x + ', ' + nubs[0].y + ', ' + this.scale + ').update();'
            ,
                function(it) {
                    return it.hexagonalPixelate(nubs[0].x, nubs[0].y, _this.scale);
                }
            );
        }),
        new Filter('Dot Screen', 'dotScreen', function() {
            this.addNub('center', 128, 128);
            this.addSlider('angle', 'Angle', 0, Math.PI / 2, 1.1, 0.01);
            this.addSlider('size', 'Size', 3, 20, 3, 0.01);
        }, function() {
            var _this = this;
				nubs = _this.nubs;
            this.setCode('dotScreen(' + nubs[0].x + ', ' + nubs[0].y + ', ' + this.angle + ', ' + this.size + ').update();'
            ,
                function(it) {
                    return it.dotScreen(nubs[0].x, nubs[0].y, _this.angle, _this.size);
                }
            );
        }),
        new Filter('Color Halftone', 'colorHalftone', function() {
            this.addNub('center', 128, 128);
            this.addSlider('angle', 'Angle', 0, Math.PI / 2, 0.25, 0.01);
            this.addSlider('size', 'Size', 3, 20, 4, 0.01);
        }, function() {
            var _this = this;
				nubs = _this.nubs;
            this.setCode('colorHalftone(' + nubs[0].x + ', ' + nubs[0].y + ', ' + this.angle + ', ' + this.size + ').update();'
            ,
                function(it) {
                    return it.colorHalftone(nubs[0].x, nubs[0].y, _this.angle, _this.size);
                }
            );
        })
    ]
};

var WebglFilters = {
    getFiltersOptions: function (name) {
        var html = '';
        for (var category in filters) {
            var list = filters[category];
            html += '<option disabled="true">---- ' + category + ' -----</option>';
			for (var i = 0, len = list.length; i < len; i++) {
				var f = list[i];
                html += '<option' + (f.name === name ? ' selected' : '') + '>' + f.name + '</option>';
            }
        }
        return html;
    },

    _findFilterByName: function (name) {
		for (var category in filters) {
			var list = filters[category];
			for (var i = 0, len = list.length; i < len; i++) {
				var f = list[i];
				if (f.name === name) { return f; }
			}
		}
		return null;
    },

    setFiltersState: function (state) {
		if (state.filter) {
			var filter = WebglFilters._findFilterByName(state.filter);
			if (filter) {
				filter.sliders.forEach(function (it) {
					var name = it.name;
					if (name in state) { it.value = state[name]; }
				});
				filter.use();
			}
		}
    },

    getFiltersState: function (value) {
        var out = {};
		var filter = WebglFilters._findFilterByName(value);
		if (filter) {
			out.filter = filter.name;
			filter.sliders.forEach(function (it) {
				var name = it.name;
				out[name] = filter[name];
			});
		}
		return out;
    }
};

if (!L.gmx) L.gmx = {};
L.gmx.WebglFilters = WebglFilters;
}();

