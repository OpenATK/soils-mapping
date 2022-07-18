import Promise from 'bluebird'
import Color from 'color'

export default {

    drawFeature: async function (ctx, feature, layer) {
        var typeChanged = type !== feature.type,
            type = feature.type;
        ctx.beginPath();

        let col;
        if (layer && layer[feature.id]) {
          col = layer[feature.id].color
        } else {
          col = getRandomColor();
          layer[feature.id] = {
            value: feature.id,
            color: col
          }
        }
        let style = {
          fillColor: col,
          color: col,
          opacity: 0.25,
          weight: 1,
          fillOpacity:0.25
        }
        //if (this.options.style) this.setStyle(ctx, this.options.style);
        this.setStyle(ctx, style)
        if (type === 2 || type === 3) {
            for (var j = 0; j < feature.geometry.length; j++) {
                var ring = feature.geometry[j];
                for (var k = 0; k < ring.length; k++) {
                    var p = ring[k];
                    if (k) ctx.lineTo(p[0] / 16.0, p[1] / 16.0);
                    else ctx.moveTo(p[0] / 16.0, p[1] / 16.0);
                }
            }
        } else if (type === 1) {
            for (var j = 0; j < feature.geometry.length; j++) {
                var p = feature.geometry[j];
                ctx.arc(p[0] / 16.0, p[1] / 16.0, 2, 0, Math.PI * 2, true);
            }
        }
        if (type === 3) ctx.fill('nonzero');
//        if (type === 3) ctx.fill(style.fillRule);

        ctx.stroke();
    },

    setStyle: function (ctx, style) {
        var stroke = style.stroke || true;
        if (stroke) {
            ctx.lineWidth = style.weight || 5;
            var color = this.setOpacity(style.color, style.opacity);
            ctx.strokeStyle = color;

        } else {
            ctx.lineWidth = 0;
            ctx.strokeStyle = {};
        }
        var fill = style.fill || true;
        if (fill) {
            ctx.fillStyle = style.fillColor || '#03f';
            var color = this.setOpacity(style.fillColor, style.fillOpacity);
            ctx.fillStyle = color;
        } else {
            ctx.fillStyle = {};
        }
    },

    setOpacity: function (color, opacity) {
        if (opacity) {
            var color = color || '#03f';
            if (color.iscolorHex()) {
                var colorRgb = color.colorRgb();
                return "rgba(" + colorRgb[0] + "," + colorRgb[1] + "," + colorRgb[2] + "," + opacity + ")";
            } else {
                return color;
            }
        } else {
            return color;
        }

    }
}

String.prototype.colorRgb = function () {
    var sColor = this.toLowerCase();
    if (sColor.length === 4) {
        var sColorNew = "#";
        for (var i = 1; i < 4; i += 1) {
            sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
    }
    //处理六位的颜色值  
    var sColorChange = [];
    for (var i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
    }
    return sColorChange;
};

String.prototype.iscolorHex = function () {
    var sColor = this.toLowerCase();
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    return reg.test(sColor);
}

function getRandomColor() { 
  var letters = '0123456789ABCDEF'; 
  var color = '#'; 
  for (var i = 0; i < 6; i++) { 
    color += letters[Math.floor(Math.random() * 16)]; 
  } 
  return color; 
}
