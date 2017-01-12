
(function(window) {

	'use strict';

	// Helper vars and functions.
	function extend(a, b) {
		for(var key in b) {
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	function createDOMEl(type, className, content) {
		var el = document.createElement(type);
		el.className = className || '';
		el.innerHTML = content || '';
		return el;
	}

	/**
	 * RevealFx obj.
	 */
	function RevealFx(el, options) {
		this.el = el;
		this.options = extend({}, this.options);
		extend(this.options, options);
		this._init();
	}

	/**
	 * RevealFx options.
	 */
	RevealFx.prototype.options = {
		// If true, then the content will be hidden until it´s "revealed".
		isContentHidden: true,
		// The animation/reveal settings. This can be set initially or passed when calling the reveal method.
		revealSettings: {
			// Animation direction: left right (lr) || right left (rl) || top bottom (tb) || bottom top (bt).
			direction: 'lr',
			// Revealer´s background color.
			bgcolor: '#f0f0f0',
			// Animation speed. This is the speed to "cover" and also "uncover" the element (seperately, not the total time).
			duration: 500,
			// Animation easing. This is the easing to "cover" and also "uncover" the element.
			easing: 'easeInOutQuint',
			// percentage-based value representing how much of the area should be left covered.
			coverArea: 0,
			// Callback for when the revealer is covering the element (halfway through of the whole animation).
			onCover: function(contentEl, revealerEl) { return false; },
			// Callback for when the animation starts (animation start).
			onStart: function(contentEl, revealerEl) { return false; },
			// Callback for when the revealer has completed uncovering (animation end).
			onComplete: function(contentEl, revealerEl) { return false; }
		}
	};

	/**
	 * Init.
	 */
	RevealFx.prototype._init = function() {
		this._layout();
	};

	/**
	 * Build the necessary structure.
	 */
	RevealFx.prototype._layout = function() {
		var position = getComputedStyle(this.el).position;
		if( position !== 'fixed' && position !== 'absolute' && position !== 'relative' ) {
			this.el.style.position = 'relative';
		}
		// Content element.
		this.content = createDOMEl('div', 'block-revealer__content', this.el.innerHTML);
		if( this.options.isContentHidden) {
			this.content.style.opacity = 0;
		}
		// Revealer element (the one that animates)
		this.revealer = createDOMEl('div', 'block-revealer__element');
		this.el.classList.add('block-revealer');
		this.el.innerHTML = '';
		this.el.appendChild(this.content);
		this.el.appendChild(this.revealer);
	};

	/**
	 * Gets the revealer element´s transform and transform origin.
	 */
	RevealFx.prototype._getTransformSettings = function(direction) {
		var val, origin, origin_2;

		switch (direction) {
			case 'lr' :
				val = 'scale3d(0,1,1)';
				origin = '0 50%';
				origin_2 = '100% 50%';
				break;
			case 'rl' :
				val = 'scale3d(0,1,1)';
				origin = '100% 50%';
				origin_2 = '0 50%';
				break;
			case 'tb' :
				val = 'scale3d(1,0,1)';
				origin = '50% 0';
				origin_2 = '50% 100%';
				break;
			case 'bt' :
				val = 'scale3d(1,0,1)';
				origin = '50% 100%';
				origin_2 = '50% 0';
				break;
			default :
				val = 'scale3d(0,1,1)';
				origin = '0 50%';
				origin_2 = '100% 50%';
				break;
		};

		return {
			// transform value.
			val: val,
			// initial and halfway/final transform origin.
			origin: {initial: origin, halfway: origin_2},
		};
	};

	/**
	 * Reveal animation. If revealSettings is passed, then it will overwrite the options.revealSettings.
	 */
	RevealFx.prototype.reveal = function(revealSettings) {
		// Do nothing if currently animating.
		if( this.isAnimating ) {
			return false;
		}
		this.isAnimating = true;

		// Set the revealer element´s transform and transform origin.
		var defaults = { // In case revealSettings is incomplete, its properties deafault to:
				duration: 500,
				easing: 'easeInOutQuint',
				delay: 0,
				bgcolor: '#f0f0f0',
				direction: 'lr',
				coverArea: 0
			},
			revealSettings = revealSettings || this.options.revealSettings,
			direction = revealSettings.direction || defaults.direction,
			transformSettings = this._getTransformSettings(direction);

		this.revealer.style.WebkitTransform = this.revealer.style.transform =  transformSettings.val;
		this.revealer.style.WebkitTransformOrigin = this.revealer.style.transformOrigin =  transformSettings.origin.initial;

		// Set the Revealer´s background color.
		this.revealer.style.backgroundColor = revealSettings.bgcolor || defaults.bgcolor;

		// Show it. By default the revealer element has opacity = 0 (CSS).
		this.revealer.style.opacity = 1;

		// Animate it.
		var self = this,
			// Second animation step.
			animationSettings_2 = {
				complete: function() {
					self.isAnimating = false;
					if( typeof revealSettings.onComplete === 'function' ) {
						revealSettings.onComplete(self.content, self.revealer);
					}
				}
			},
			// First animation step.
			animationSettings = {
				delay: revealSettings.delay || defaults.delay,
				complete: function() {
					self.revealer.style.WebkitTransformOrigin = self.revealer.style.transformOrigin = transformSettings.origin.halfway;
					if( typeof revealSettings.onCover === 'function' ) {
						revealSettings.onCover(self.content, self.revealer);
					}
					anime(animationSettings_2);
				}
			};

		animationSettings.targets = animationSettings_2.targets = this.revealer;
		animationSettings.duration = animationSettings_2.duration = revealSettings.duration || defaults.duration;
		animationSettings.easing = animationSettings_2.easing = revealSettings.easing || defaults.easing;

		var coverArea = revealSettings.coverArea || defaults.coverArea;
		if( direction === 'lr' || direction === 'rl' ) {
			animationSettings.scaleX = [0,1];
			animationSettings_2.scaleX = [1,coverArea/100];
		}
		else {
			animationSettings.scaleY = [0,1];
			animationSettings_2.scaleY = [1,coverArea/100];
		}

		if( typeof revealSettings.onStart === 'function' ) {
			revealSettings.onStart(self.content, self.revealer);
		}
		anime(animationSettings);
	};

	window.RevealFx = RevealFx;

})(window);

var c = document.getElementById("second-slide");
var ctx = c.getContext("2d");
var cH;
var cW;
var bgColor = "#FF6138";
var animations = [];
var circles = [];

var colorPicker = (function() {
  var colors = ["#FF6138", "#FFBE53", "#2980B9", "#282741"];
  var index = 0;
  function next() {
    index = index++ < colors.length-1 ? index : 0;
    return colors[index];
  }
  function current() {
    return colors[index]
  }
  return {
    next: next,
    current: current
  }
})();

function removeAnimation(animation) {
  var index = animations.indexOf(animation);
  if (index > -1) animations.splice(index, 1);
}

function calcPageFillRadius(x, y) {
  var l = Math.max(x - 0, cW - x);
  var h = Math.max(y - 0, cH - y);
  return Math.sqrt(Math.pow(l, 2) + Math.pow(h, 2));
}

function addClickListeners() {
  document.addEventListener("touchstart", handleEvent);
  document.addEventListener("mousedown", handleEvent);
};

function handleEvent(e) {
    if (e.touches) {
      e.preventDefault();
      e = e.touches[0];
    }
    var currentColor = colorPicker.current();
    var nextColor = colorPicker.next();
    var targetR = calcPageFillRadius(e.pageX, e.pageY);
    var rippleSize = Math.min(200, (cW * .4));
    var minCoverDuration = 750;

    var pageFill = new Circle({
      x: e.pageX,
      y: e.pageY - document.getElementById('first__item').clientHeight,
      r: 0,
      fill: nextColor
    });
    var fillAnimation = anime({
      targets: pageFill,
      r: targetR,
      duration:  Math.max(targetR / 2 , minCoverDuration ),
      easing: "easeOutQuart",
      complete: function(){
        bgColor = pageFill.fill;
        removeAnimation(fillAnimation);
      }
    });

    var ripple = new Circle({
      x: e.pageX,
      y: e.pageY - document.getElementById('first__item').clientHeight,
      r: 0,
      fill: currentColor,
      stroke: {
        width: 3,
        color: currentColor
      },
      opacity: 1
    });
    var rippleAnimation = anime({
      targets: ripple,
      r: rippleSize,
      opacity: 0,
      easing: "easeOutExpo",
      duration: 900,
      complete: removeAnimation
    });

    var particles = [];
    for (var i=0; i<32; i++) {
      var particle = new Circle({
        x: e.pageX,
        y: e.pageY - document.getElementById('first__item').clientHeight,
        fill: currentColor,
        r: anime.random(24, 48)
      })
      particles.push(particle);
    }
    var particlesAnimation = anime({
      targets: particles,
      x: function(particle){
        return particle.x + anime.random(rippleSize, -rippleSize);
      },
      y: function(particle){
        return particle.y + anime.random(rippleSize * 1.15, -rippleSize * 1.15);
      },
      r: 0,
      easing: "easeOutExpo",
      duration: anime.random(1000,1300),
      complete: removeAnimation
    });
    animations.push(fillAnimation, rippleAnimation, particlesAnimation);
}

function extend(a, b){
  for(var key in b) {
    if(b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }
  return a;
}

var Circle = function(opts) {
  extend(this, opts);
}

Circle.prototype.draw = function() {
  ctx.globalAlpha = this.opacity || 1;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
  if (this.stroke) {
    ctx.strokeStyle = this.stroke.color;
    ctx.lineWidth = this.stroke.width;
    ctx.stroke();
  }
  if (this.fill) {
    ctx.fillStyle = this.fill;
    ctx.fill();
  }
  ctx.closePath();
  ctx.globalAlpha = 1;
}

var animate = anime({
  duration: Infinity,
  update: function() {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cW, cH);
    animations.forEach(function(anim) {
      anim.animatables.forEach(function(animatable) {
        animatable.target.draw();
      });
    });
  }
});

var resizeCanvas = function() {
  cW = window.innerWidth;
  cH = window.innerHeight;
  c.width = cW * devicePixelRatio;
  c.height = cH * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
};

(function init() {
  resizeCanvas();
  if (window.CP) {
    // CodePen's loop detection was causin' problems
    // and I have no idea why, so...
    window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 6000;
  }
  window.addEventListener("resize", resizeCanvas);
  addClickListeners();
  if (!!window.location.pathname.match(/fullcpgrid/)) {
    startFauxClicking();
  }
  handleInactiveUser();
})();

function handleInactiveUser() {
  var inactive = setTimeout(function(){
    fauxClick(cW/2, cH/2);
  }, 2000);

  function clearInactiveTimeout() {
    clearTimeout(inactive);
    document.removeEventListener("mousedown", clearInactiveTimeout);
    document.removeEventListener("touchstart", clearInactiveTimeout);
  }

  document.addEventListener("mousedown", clearInactiveTimeout);
  document.addEventListener("touchstart", clearInactiveTimeout);
}

function startFauxClicking() {
  setTimeout(function(){
    fauxClick(anime.random( cW * .2, cW * .8), anime.random(cH * .2, cH * .8));
    startFauxClicking();
  }, anime.random(200, 900));
}

function fauxClick(x, y) {
  var fauxClick = new Event("mousedown");
  fauxClick.pageX = x;
  fauxClick.pageY = y;
  document.dispatchEvent(fauxClick);
}
