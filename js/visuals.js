/* Quiet generative visuals. These respond to narrative progress, not to fabricated "historical data". */
(() => {
  const canvas = document.getElementById("visualCanvas");
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1, progress = 0, raf = 0, seed = 27;
  const particles = [];
  function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles.length = 0; seed = 27;
    const count = Math.min(190, Math.floor(w * h / 7500));
    for (let i = 0; i < count; i++) particles.push({
      x: rand() * w, y: rand() * h, r: .3 + rand() * 1.1,
      phase: rand() * Math.PI * 2, speed: .08 + rand() * .35
    });
  }
  function setProgress(v) { progress = Math.max(0, Math.min(1, v)); }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const alive = Math.max(0, 1 - Math.max(0, progress - .45) / .52);
    const base = 0.12 + (Math.sin(t * .00012) + 1) * .025;
    for (const p of particles) {
      const flicker = .3 + .7 * Math.abs(Math.sin(t * .00025 * p.speed + p.phase));
      const alpha = Math.max(0, base * flicker * alive);
      ctx.beginPath();
      ctx.fillStyle = `rgba(198,167,122,${alpha})`;
      ctx.arc(p.x + Math.sin(t * .00008 + p.phase) * 4, p.y + Math.cos(t * .00007 + p.phase) * 3, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Faint architectural lines fade as the environment disappears.
    const lineAlpha = Math.max(0, .09 * (1 - progress * 1.25));
    ctx.strokeStyle = `rgba(205,199,185,${lineAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * .12, h * .72); ctx.lineTo(w * .88, h * .72);
    ctx.moveTo(w * .2, h * .72); ctx.lineTo(w * .2, h * .42);
    ctx.lineTo(w * .36, h * .42); ctx.lineTo(w * .36, h * .72);
    ctx.moveTo(w * .64, h * .72); ctx.lineTo(w * .64, h * .48);
    ctx.lineTo(w * .8, h * .48); ctx.lineTo(w * .8, h * .72);
    ctx.stroke();
    raf = requestAnimationFrame(draw);
  }
  window.addEventListener("resize", resize);
  resize(); raf = requestAnimationFrame(draw);
  window.BhopalVisuals = { setProgress };
})();