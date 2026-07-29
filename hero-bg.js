/* =========================================================================
   SPRINGBOLT STUDIO — SHARED ANIMATED CHECKERBOARD HERO BACKGROUND
   Originally supplied as a standalone snippet (checkerboard-flag-background-
   black.html); lifted out into this shared file so every hero on the site
   uses the exact same animation instead of copy-pasting the script per page.

   USAGE — on any page:
     <section class="hero" style="position:relative; overflow:hidden;">
       <div class="hero-bg" aria-hidden="true">
         <canvas data-flag-bg></canvas>
         <div class="fade"></div>
       </div>
       <div class="container" style="position:relative; z-index:1;">
         ...real content...
       </div>
     </section>
     <script src="hero-bg.js"></script>

   .hero-bg / .hero-bg canvas / .hero-bg .fade styling lives in styles.css.
   Multiple canvases with [data-flag-bg] on one page each get their own
   independent animation loop.
   ========================================================================= */
(function(){
  var COLOR_A = [0, 0, 0];        // base (black)
  var COLOR_B = [0, 214, 190];    // brand light accent, #00d6be

  var ROWS = 26;
  var DEPTH_POW = 1.4;
  var MIN_SCALE = 0.1;
  var WIDTH_BASE = 1.3;
  var WIDTH_GAIN = 0.9;
  var MARGIN_MULT = 1.6;

  var WAVE_FREQ = 1.6;
  var WAVE_SPEED = 0.35;
  var AMP_FRAC = 0.09;

  var PULSE_FLOOR = 0.12;
  var NUM_BLOBS = 6;

  function hash(seed){
    var s = Math.sin(seed * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  }

  function initCanvas(canvas){
    var ctx = canvas.getContext('2d');
    var container = canvas.parentElement;
    var W, H, DPR, CELL;

    function resize(){
      DPR = window.devicePixelRatio || 1;
      W = container.clientWidth;
      H = container.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      CELL = (W * 1.75 / 2) / 4;
    }
    resize();
    window.addEventListener('resize', resize);

    function scaleAt(v){
      var depthT = Math.pow(v, DEPTH_POW);
      return MIN_SCALE + (1 - MIN_SCALE) * depthT;
    }

    function projectWorld(wx, v, t){
      var depthT = Math.pow(v, DEPTH_POW);
      var scale = MIN_SCALE + (1 - MIN_SCALE) * depthT;

      var nearX = W * 1.1, nearY = H * 1.1;
      var farX = -W * 0.1, farY = -H * 0.1;
      var cx = farX + (nearX - farX) * depthT;
      var cy = farY + (nearY - farY) * depthT;

      var dx = nearX - farX, dy = nearY - farY;
      var dl = Math.sqrt(dx * dx + dy * dy); dx /= dl; dy /= dl;
      var px = -dy, py = dx;

      var phase = v * WAVE_FREQ * Math.PI * 2 + t * WAVE_SPEED;
      var amp = W * AMP_FRAC * scale;
      var wave = Math.sin(phase) * amp;

      var perp = wx * scale + wave;
      return { x: cx + px * perp, y: cy + py * perp };
    }

    var blobs = [];
    for (var k = 0; k < NUM_BLOBS; k++){
      blobs.push({
        baseX: hash(k * 3.1 + 1), baseY: hash(k * 5.7 + 2),
        driftAmpX: 0.18 + hash(k * 2.3 + 3) * 0.15,
        driftAmpY: 0.18 + hash(k * 4.1 + 4) * 0.15,
        driftSpeedX: 0.02 + hash(k * 6.6 + 5) * 0.025,
        driftSpeedY: 0.02 + hash(k * 8.2 + 6) * 0.025,
        driftPhaseX: hash(k * 1.7 + 7) * Math.PI * 2,
        driftPhaseY: hash(k * 9.4 + 8) * Math.PI * 2,
        radius: 0.18 + hash(k * 3.9 + 9) * 0.16,
        pulsePeriod: 7 + hash(k * 7.1 + 10) * 10,
        pulsePhase: hash(k * 2.9 + 11) * Math.PI * 2
      });
    }

    function fieldAt(sx, sy, t){
      var total = 0;
      for (var k = 0; k < blobs.length; k++){
        var b = blobs[k];
        var bx = b.baseX + b.driftAmpX * Math.sin(t * b.driftSpeedX * Math.PI * 2 + b.driftPhaseX);
        var by = b.baseY + b.driftAmpY * Math.sin(t * b.driftSpeedY * Math.PI * 2 + b.driftPhaseY);
        var pulse = 0.5 + 0.5 * Math.sin((t / b.pulsePeriod) * Math.PI * 2 + b.pulsePhase);
        var dx = (sx - bx) * (W / Math.min(W, H));
        var dy = (sy - by) * (H / Math.min(W, H));
        var dist = Math.sqrt(dx * dx + dy * dy);
        var falloff = Math.exp(-(dist * dist) / (2 * b.radius * b.radius));
        total += falloff * pulse;
      }
      return Math.min(1, total);
    }

    function draw(t){
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < ROWS; i++){
        var v0 = i / ROWS, v1 = (i + 1) / ROWS;
        var vmid = (v0 + v1) / 2;
        var scaleMid = scaleAt(vmid);
        var width = W * (WIDTH_BASE + WIDTH_GAIN * scaleMid);
        var halfWidthWorld = (width / 2) / scaleMid * MARGIN_MULT;
        var jmin = Math.floor(-halfWidthWorld / CELL) - 2;
        var jmax = Math.ceil(halfWidthWorld / CELL) + 2;

        for (var j = jmin; j < jmax; j++){
          var wx0 = j * CELL, wx1 = (j + 1) * CELL;
          var p00 = projectWorld(wx0, v0, t), p10 = projectWorld(wx1, v0, t);
          var p11 = projectWorld(wx1, v1, t), p01 = projectWorld(wx0, v1, t);
          var parity = ((i + j) % 2 + 2) % 2;

          var r, g, b;
          if (parity === 0){
            var cxScreen = (p00.x + p10.x + p11.x + p01.x) / 4;
            var cyScreen = (p00.y + p10.y + p11.y + p01.y) / 4;
            var field = fieldAt(cxScreen / W, cyScreen / H, t);
            var brightness = PULSE_FLOOR + (1 - PULSE_FLOOR) * field;
            r = COLOR_B[0] * brightness; g = COLOR_B[1] * brightness; b = COLOR_B[2] * brightness;
          } else {
            r = COLOR_A[0]; g = COLOR_A[1]; b = COLOR_A[2];
          }

          ctx.fillStyle = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    var start = null;
    function loop(ts){
      if (!start) start = ts;
      draw((ts - start) / 1000);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  document.addEventListener('DOMContentLoaded', function(){
    var canvases = document.querySelectorAll('canvas[data-flag-bg]');
    canvases.forEach(initCanvas);
  });
})();
