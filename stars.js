/* The Deep Field sky.
 *
 * This is the field running on the David Deutsch anthology: depth is z
 * squared, so far stars barely move while near ones swing; scroll and pointer
 * are both eased rather than tracked, which is what stops the field feeling
 * nailed to the cursor.
 */
(() => {
  const canvas = document.getElementById("cosmic");
  if (!canvas || !canvas.getContext) return;

  const context = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const PALETTE = ["152,173,231", "183,163,221", "205,156,213", "173,170,210"];
  const THEME = "deepfield";

  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const scroll = { y: scrollY, ty: scrollY };
  let width = 0;
  let height = 0;
  let live = false;
  let running = 0;
  let stars = [];

  // Fixed seed: a random field changes on every reload, so no two screenshots
  // are comparable and there is no way to tell a tweak from the shuffle.
  const SEED = 20260901;
  const mulberry32 = (a) => () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const random = mulberry32(SEED);

  const STAR_POOL = Array.from({ length: 900 }, () => ({
    x: random(),
    y: random(),
    z: 0.15 + random() * 0.85,
    phase: random() * Math.PI * 2,
    color: PALETTE[Math.floor(random() * PALETTE.length)],
  }));

  function resize() {
    const scale = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    // Slicing a fixed pool keeps the sky steady across a resize.
    stars = STAR_POOL.slice(
      0,
      Math.min(STAR_POOL.length, Math.round((width * height) / 1500)),
    );
  }

  const wrap = (v, max) => ((v % max) + max) % max;

  function draw(time) {
    context.clearRect(0, 0, width, height);
    stars.forEach((star) => {
      const layer = star.z ** 2;
      const twinkle = still.matches ? 0 : Math.sin(time / 2400 + star.phase) * 0.07;
      const x = star.x * width + (pointer.x - 0.5) * 105 * layer;
      const y = wrap(
        star.y * height + (pointer.y - 0.5) * 68 * layer - scroll.y * 0.075 * layer,
        height,
      );
      context.fillStyle = `rgba(${star.color},${0.14 + star.z * 0.4 + twinkle})`;
      context.beginPath();
      context.arc(x, y, star.z * (1.25 + 0.7 * layer), 0, Math.PI * 2);
      context.fill();
    });
  }

  function frame(time) {
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;
    scroll.y += (scroll.ty - scroll.y) * 0.08;
    draw(time);
    running = requestAnimationFrame(frame);
  }

  function stop() {
    if (running) cancelAnimationFrame(running);
    running = 0;
    context.clearRect(0, 0, width, height);
  }

  function start() {
    if (still.matches) {
      scroll.y = scroll.ty;
      draw(0);
      return;
    }
    if (!running) running = requestAnimationFrame(frame);
  }

  function setTheme(theme) {
    const next = theme === THEME;
    if (next === live) return;
    live = next;
    if (!live) return stop();
    resize();
    start();
  }

  addEventListener("resize", () => {
    if (!live) return;
    resize();
    if (still.matches) draw(0);
  });
  addEventListener("pointermove", (e) => {
    pointer.tx = e.clientX / width;
    pointer.ty = e.clientY / height;
  });
  addEventListener("scroll", () => {
    scroll.ty = scrollY;
    if (live && still.matches) draw(0);
  }, { passive: true });
  still.addEventListener("change", () => { if (live) { stop(); start(); } });
  addEventListener("cc:theme", (e) => setTheme(e.detail));

  resize();
  setTheme(document.documentElement.dataset.theme);
})();
