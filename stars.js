/* Canvas skies for the generated themes.
 *
 * The parallax field is the one running on the David Deutsch anthology: depth
 * is z squared, so far stars barely move while near ones swing; scroll and
 * pointer are both eased rather than tracked, which is what stops the field
 * feeling nailed to the cursor.
 */
(() => {
  const canvas = document.getElementById("cosmic");
  if (!canvas || !canvas.getContext) return;

  const context = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const PALETTE = ["152,173,231", "183,163,221", "205,156,213", "173,170,210"];
  const SUNS = ["255,214,170", "255,190,150", "230,205,255"];
  const MODE_FOR = { deepfield: "parallax", orbits: "orbits" };

  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const scroll = { y: scrollY, ty: scrollY };
  let width = 0;
  let height = 0;
  let mode = null;
  let running = 0;
  let stars = [];
  let systems = [];

  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const makeStar = () => ({
    x: Math.random(),
    y: Math.random(),
    z: 0.15 + Math.random() * 0.85,
    phase: Math.random() * Math.PI * 2,
    color: pick(PALETTE),
  });

  // Systems get their own depth, so a small far one drifts behind a large near one.
  const makeSystem = () => {
    const z = rand(0.2, 1);
    const radius = rand(26, 84) * (0.6 + z * 0.6);
    const planets = Math.round(rand(3, 6));
    const margin = radius / Math.max(width, 1);
    return {
      x: rand(margin, 1 - margin),
      y: Math.random(),
      z,
      radius,
      sun: pick(SUNS),
      spin: rand(0.00006, 0.00028) * (Math.random() < 0.35 ? -1 : 1),
      planets: Array.from({ length: planets }, (_, i) => {
        const orbit = radius * (0.32 + (0.68 * (i + 1)) / planets);
        return {
          orbit,
          // Inner planets run faster, the way a real system does.
          rate: Math.pow(radius / orbit, 1.5),
          phase: Math.random() * Math.PI * 2,
          size: rand(0.9, 2.1),
          color: pick(PALETTE),
        };
      }),
    };
  };

  function resize() {
    const scale = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    stars = Array.from(
      { length: Math.min(420, Math.floor((width * height) / 3200)) },
      makeStar,
    );
    systems = Array.from(
      { length: Math.max(3, Math.min(10, Math.round((width * height) / 220000))) },
      () => makeSystem(),
    );
  }

  const wrap = (v, max) => ((v % max) + max) % max;

  function drawStars(time, depthScale = 1, alphaScale = 1) {
    stars.forEach((star) => {
      const layer = star.z ** 2;
      const twinkle = still.matches ? 0 : Math.sin(time / 2400 + star.phase) * 0.07;
      const x = star.x * width + (pointer.x - 0.5) * 105 * layer * depthScale;
      const y = wrap(
        star.y * height +
          (pointer.y - 0.5) * 68 * layer * depthScale -
          scroll.y * 0.075 * layer * depthScale,
        height,
      );
      context.fillStyle = `rgba(${star.color},${(0.14 + star.z * 0.4 + twinkle) * alphaScale})`;
      context.beginPath();
      context.arc(x, y, star.z * (1.25 + 0.7 * layer), 0, Math.PI * 2);
      context.fill();
    });
  }

  function drawSystems(time) {
    systems.forEach((sys) => {
      const layer = sys.z ** 2;
      const cx = sys.x * width + (pointer.x - 0.5) * 130 * layer;
      const cy = wrap(
        sys.y * height + (pointer.y - 0.5) * 84 * layer - scroll.y * 0.11 * layer,
        height + sys.radius * 2,
      ) - sys.radius;
      const spin = still.matches ? 0 : time * sys.spin;
      const alpha = 0.3 + sys.z * 0.6;

      // A wide soft gradient alone reads as a smudge, so the halo stays tight
      // and a near-white core does the work of looking like a star.
      const sunSize = 1.4 + sys.z * 1.9;
      const glow = context.createRadialGradient(cx, cy, 0, cx, cy, sunSize * 3.4);
      glow.addColorStop(0, `rgba(${sys.sun},${alpha * 0.5})`);
      glow.addColorStop(0.45, `rgba(${sys.sun},${alpha * 0.16})`);
      glow.addColorStop(1, `rgba(${sys.sun},0)`);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(cx, cy, sunSize * 3.4, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = `rgba(255,247,236,${Math.min(1, alpha * 1.15)})`;
      context.beginPath();
      context.arc(cx, cy, sunSize * 0.75, 0, Math.PI * 2);
      context.fill();

      sys.planets.forEach((p) => {
        const a = spin * p.rate + p.phase;
        const px = cx + Math.cos(a) * p.orbit;
        const py = cy + Math.sin(a) * p.orbit * 0.45;
        context.fillStyle = `rgba(${p.color},${alpha})`;
        context.beginPath();
        context.arc(px, py, p.size * (0.85 + sys.z * 0.9), 0, Math.PI * 2);
        context.fill();
      });
    });
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    if (mode === "parallax") {
      drawStars(time);
    } else if (mode === "orbits") {
      drawStars(time, 0.7, 0.8);
      drawSystems(time);
    }
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
    const next = MODE_FOR[theme] || null;
    if (next === mode) return;
    mode = next;
    if (!mode) return stop();
    resize();
    start();
  }

  addEventListener("resize", () => {
    if (!mode) return;
    resize();
    if (still.matches) draw(0);
  });
  addEventListener("pointermove", (e) => {
    pointer.tx = e.clientX / width;
    pointer.ty = e.clientY / height;
  });
  addEventListener("scroll", () => {
    scroll.ty = scrollY;
    if (mode && still.matches) draw(0);
  }, { passive: true });
  still.addEventListener("change", () => { if (mode) { stop(); start(); } });
  addEventListener("cc:theme", (e) => setTheme(e.detail));

  resize();
  setTheme(document.documentElement.dataset.theme);
})();
