var app = new PIXI.Application(window.innerWidth, window.innerHeight, {
  transparent: true
});

var resizeDelayId = 0;
window.onresize = function() {
  if (resizeDelayId) {
    clearTimeout(resizeDelayId);
  }
  resizeDelayId = setTimeout(function() {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    resizeDelayId = 0;
  }, 300);
}

var lastMousePos = [150, 200];
var currentMousePos = [150, 200];

document.getElementById('background').appendChild(app.view);
document.getElementById('background').addEventListener('mousemove', function(e) {
  currentMousePos = [e.x, e.y];
})

function easing(k) {
  return k * k;
}

/**
 * 不是我不想用原型继承，而是我发现经过 Babel 转换的 ES6 Class 虽然是 ES5 原型继承的形式
 * 但 Babel 给它多加了一层 Constructor 检查，导致子类构造器中调用 PIXI.Sprite.apply 会报错……
 */
var spriteConstructor = PIXI.Sprite.prototype.constructor;
PIXI.Sprite.prototype.constructor = function() {
  spriteConstructor.apply(this, arguments);
  this.startTime = 0;
  this.started = false;
}
PIXI.Sprite.prototype.start = function(speed) {
  this.startTime = Date.now();
  this.started = true;
  this.speed = speed;
}
PIXI.Sprite.prototype.reset = function() {
  this.alpha = 1;
  this.startTime = 0;
  this.started = false;
}
var spriteUpdateTransform = PIXI.Sprite.prototype.updateTransform;
PIXI.Sprite.prototype.updateTransform = function() {
  spriteUpdateTransform.apply(this, arguments);

  if (this.started) {
    var progress = ((Date.now() - this.startTime) || 0) / Math.max(1500, (this.speed * 2.8));

    this.alpha = Math.max(0, 1 - easing(progress));
    // console.log(delta)
    if (this.alpha <= 0) {
      pushWaitingPaws([this]);
    }
  }
}


var pawWaitingPool = [];
var pawCountInScreen = 0;

function popWaitingPaws(num) {
  var paws = [];

  if (pawWaitingPool.length >= num) {
    paws = pawWaitingPool.splice(0, num);
  } else {
    paws = pawWaitingPool.splice(0, pawWaitingPool.length);

    for (var i = num - pawWaitingPool; i > 0; i--) {
      var paw = new PIXI.Sprite.from('image/pawprint.svg');
      paw.anchor.x = 0.5;
      paw.anchor.y = 0.5;
      paws.push(paw);
    }
  }

  return paws;
}

function pushWaitingPaws(paws) {
  setTimeout(function() {
    paws.map(function(paw) {
      paw.reset();
      app.stage.removeChild(paw);  // thought it is anti-pattern...
    })
  }, 4);
  Array.prototype.push.apply(pawWaitingPool, paws);
}


function generateNum() {
  // 生成 2-7 个
  return 3 + Math.floor(Math.random() * 5);
}

function generateAngle() {
  return 2 * Math.PI * Math.random();
}

function generatePosition() {
  var distance = Math.sqrt(Math.pow(currentMousePos[0] - lastMousePos[0], 2) + Math.pow(currentMousePos[1] - lastMousePos[1], 2));
  if (distance < 400) {
    var pos = [this.innerWidth * Math.random(), this.innerHeight * Math.random()];
    return pos;
  } else {
    lastMousePos = currentMousePos;
    var angle = generateAngle();
    return [currentMousePos[0] + 60 * Math.sin(angle), currentMousePos[1] - 60 * Math.cos(angle)];
  }
}

function genderateColor() {
  var h = 0.02 + 0.88 * Math.random();
  var s = 0.2 + 0.4 * Math.random();
  var l = 0.4 + 0.35 * Math.random();

  return hslToRgb(h, s, l);
}


var lastTime = 0;
app.ticker.add(function() {

  if (Date.now() - lastTime < 600 || pawCountInScreen > 2) {
    return;
  }

  var num = generateNum();
  var angle = generateAngle();
  var position = generatePosition();
  var color = genderateColor();
  var scale = 0.6 + 0.4 * Math.random();
  var speed = 300 * (1 + 4 * Math.random());

  pawCountInScreen += 1;

  var i = 1;
  var paws = popWaitingPaws(num);
  var paw = paws[0];
  paw.x = position[0];
  paw.y = position[1];
  paw.rotation = angle;
  paw.scale.x = scale;
  paw.scale.y = scale;
  paw.tint = color;
  
  app.stage.addChild(paw);
  paw.start(speed);

  var pawLength = 55 * scale;
  var pawWidth = 50 * scale;

  setTimeout(function() {
    var id = setInterval(function() {
      if (i < paws.length) {
        var paw = paws[i++];
        paw.x = position[0] + pawLength * Math.sin(angle) * (i - 1) - pawWidth * Math.cos(angle) * ((i - 1) % 2);
        paw.y = position[1] - pawLength * Math.cos(angle) * (i - 1) - pawWidth * Math.sin(angle) * ((i - 1) % 2);
        paw.rotation = angle;
        paw.scale.x = scale;
        paw.scale.y = scale;
        paw.tint = color;

        app.stage.addChild(paw);
        paw.start(speed);
      } else {
        pawCountInScreen -= 1;
        clearInterval(id);
      }
    }, speed);
  }, 300 * Math.random());


  lastTime = Date.now();
});

// var angle = Math.PI / 4 * 7
// var texture = PIXI.Texture.from('image/pawprint.svg')
// var paw = new PIXI.Sprite(texture);
// paw.anchor.x = 0.5;
// paw.anchor.y = 0.5;
// paw.x = 100
// paw.y = 100
// paw.rotation = angle;
// app.stage.addChild(paw)


/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 * 
 * @link http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    // return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    return Math.round(r * 255) * 65536 + Math.round(g * 255) * 256 + Math.round(b * 255);
}