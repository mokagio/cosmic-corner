(() => {
  const KEY = "cc-theme";
  const DEFAULT = "nebula";

  // `veil` is only the swatch preview — the real veil lives in styles.css.
  const GROUPS = [
    {
      label: "Readable",
      themes: [
        { id: "ink",      name: "Ink",      note: "Highest contrast. Plate only in the margins.", veil: "rgba(5,5,9,0.95)" },
        { id: "daylight", name: "Daylight", note: "Light sheet, dark type.",                      veil: "rgba(247,245,239,0.96)" },
        { id: "slate",    name: "Slate",    note: "Larger type, shorter measure.",                veil: "rgba(18,22,30,0.9)" },
      ],
    },
    {
      label: "Cosmic",
      themes: [
        { id: "nebula", name: "Nebula", note: "Indigo veil. The balanced default.",   veil: "rgba(12,8,26,0.62)" },
        { id: "aurora", name: "Aurora", note: "Cool cast, medium veil.",              veil: "rgba(5,20,22,0.66)" },
        { id: "ember",  name: "Ember",  note: "Warm cast, from the red giants.",      veil: "rgba(22,11,6,0.66)" },
        { id: "void",   name: "Void",   note: "Deep blur, faint glow on the type.",   veil: "rgba(2,2,6,0.78)" },
      ],
    },
    {
      label: "Plate-forward",
      themes: [
        { id: "window",    name: "Window",    note: "Inset column. Stars frame it at any width.", veil: "rgba(8,7,16,0.5)" },
        { id: "porthole",  name: "Porthole",  note: "Thin veil, rounded. More plate.",            veil: "rgba(8,7,16,0.36)" },
        { id: "frameless", name: "Frameless", note: "No sheet. Most plate, least legible.",       veil: "rgba(8,7,16,0.1)" },
      ],
    },
  ];

  const picker = document.querySelector(".picker");
  if (!picker) return;

  const button = picker.querySelector(".picker__btn");
  const panel = picker.querySelector(".picker__panel");
  const list = picker.querySelector(".picker__list");

  const store = {
    get() {
      try { return localStorage.getItem(KEY); } catch { return null; }
    },
    set(v) {
      try { localStorage.setItem(KEY, v); } catch { /* private mode, blocked storage */ }
    },
  };

  let current = store.get() || DEFAULT;

  // The plate's own URL, so a swatch works from any directory depth.
  const plate = getComputedStyle(document.querySelector(".sky")).backgroundImage.match(/url\((["']?)(.*?)\1\)/);
  const plateUrl = plate ? plate[2] : "";

  const apply = (id) => {
    current = id;
    document.documentElement.dataset.theme = id;
    store.set(id);
    list.querySelectorAll(".picker__opt").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.themeId === id));
    });
  };

  GROUPS.forEach((group) => {
    const head = document.createElement("li");
    head.className = "picker__group";
    head.textContent = group.label;
    list.append(head);

    group.themes.forEach((theme) => {
      const item = document.createElement("li");
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "picker__opt";
      opt.dataset.themeId = theme.id;
      opt.setAttribute("aria-pressed", String(theme.id === current));
      opt.innerHTML =
        `<span class="picker__swatch"></span>` +
        `<span><span class="picker__name"></span><span class="picker__note"></span></span>`;
      opt.querySelector(".picker__name").textContent = theme.name;
      opt.querySelector(".picker__note").textContent = theme.note;
      opt.querySelector(".picker__swatch").style.backgroundImage =
        `linear-gradient(${theme.veil}, ${theme.veil}), url("${plateUrl}")`;
      opt.addEventListener("click", () => apply(theme.id));
      item.append(opt);
      list.append(item);
    });
  });

  const open = (yes) => {
    panel.hidden = !yes;
    button.setAttribute("aria-expanded", String(yes));
  };

  button.addEventListener("click", () => open(panel.hidden));

  document.addEventListener("click", (e) => {
    if (!panel.hidden && !picker.contains(e.target)) open(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      open(false);
      button.focus();
    }
  });

  apply(current);
  picker.dataset.ready = "";
})();
