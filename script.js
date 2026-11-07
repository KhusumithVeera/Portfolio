const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Mobile menu
const toggle = document.querySelector(".menu-toggle");
const menu = document.getElementById("mobile-menu");
function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu.classList.toggle("open", open);
  document.body.style.overflow = open ? "hidden" : "";
}
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

// Split headings into masked words
document.querySelectorAll(".split").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach((w, i) => {
    const outer = document.createElement("span");
    outer.className = "w";
    outer.style.setProperty("--i", i);
    const inner = document.createElement("span");
    inner.textContent = w;
    outer.appendChild(inner);
    el.appendChild(outer);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
});

// Reveals, once
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("in"); revealObserver.unobserve(entry.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal, .split, .section-head").forEach((el) => revealObserver.observe(el));

// Counters
function runCounter(el) {
  const target = parseFloat(el.dataset.count);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
  const fmt = (v) => prefix + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  if (reduced) { el.textContent = fmt(target); return; }
  const start = performance.now();
  const dur = 1800;
  const tick = (now) => {
    const t = Math.min((now - start) / dur, 1);
    el.textContent = fmt(target * (1 - Math.pow(1 - t, 4)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { runCounter(entry.target); counterObserver.unobserve(entry.target); }
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

// Tagline word by word, with highlighted words
const tagline = document.querySelector(".tagline-text");
if (tagline) {
  const html = tagline.innerHTML;
  const temp = document.createElement("div");
  temp.innerHTML = html;
  tagline.textContent = "";
  const addWord = (text, hl) => {
    const span = document.createElement("span");
    span.className = "word" + (hl ? " hl" : "");
    span.textContent = text;
    tagline.appendChild(span);
    tagline.appendChild(document.createTextNode(" "));
  };
  temp.childNodes.forEach((node) => {
    const hl = node.nodeType === 1 && node.tagName === "MARK";
    node.textContent.trim().split(/\s+/).filter(Boolean).forEach((w) => addWord(w, hl));
  });
  const wordObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("on"); wordObserver.unobserve(entry.target); }
    });
  }, { rootMargin: "0px 0px -35% 0px", threshold: 0 });
  tagline.querySelectorAll(".word").forEach((w) => { if (reduced) w.classList.add("on"); else wordObserver.observe(w); });
}

// Rotating hero word
const words = document.querySelectorAll(".rot-word");
if (words.length) {
  words[0].classList.add("current");
  if (!reduced) {
    let idx = 0;
    setInterval(() => {
      const prev = words[idx];
      idx = (idx + 1) % words.length;
      const next = words[idx];
      prev.classList.remove("current");
      prev.classList.add("leaving");
      next.classList.add("current");
      setTimeout(() => {
        prev.style.transition = "none";
        prev.classList.remove("leaving");
        void prev.offsetWidth;
        prev.style.transition = "";
      }, 850);
    }, 2400);
  }
}

// Scroll progress and hero grid parallax, throttled through rAF
const bar = document.querySelector(".progress");
const grid = document.querySelector(".grid-bg");
let ticking = false;
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
  if (grid && window.scrollY < window.innerHeight * 1.5) grid.style.transform = "translateY(" + window.scrollY * 0.25 + "px)";
  ticking = false;
}
if (!reduced) {
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
}

// Current section in nav
const links = document.querySelectorAll(".nav-links a");
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) links.forEach((l) => l.setAttribute("aria-current", String(l.getAttribute("href") === "#" + entry.target.id)));
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

// Pointer effects (mouse only)
if (fine && !reduced) {
  const wrap = document.querySelector(".portrait-wrap");
  const portrait = document.querySelector(".portrait");
  if (wrap) {
    wrap.addEventListener("pointermove", (e) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      portrait.style.transform = "rotateY(" + x * 10 + "deg) rotateX(" + -y * 10 + "deg)";
    });
    wrap.addEventListener("pointerleave", () => { portrait.style.transform = ""; });
  }
  document.querySelectorAll(".card-wrap").forEach((w) => {
    const card = w.querySelector(".card");
    w.addEventListener("pointermove", (e) => {
      const r = w.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = "rotateY(" + x * 8 + "deg) rotateX(" + -y * 8 + "deg) translateY(-4px)";
    });
    w.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
  document.querySelectorAll(".btn-primary").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = "translate(" + (e.clientX - (r.left + r.width / 2)) * 0.2 + "px," + (e.clientY - (r.top + r.height / 2)) * 0.3 + "px)";
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  // Cursor ring that eases toward the pointer
  const cursor = document.querySelector(".cursor");
  let tx = 0, ty = 0, cx = 0, cy = 0;
  window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; cursor.classList.add("on"); });
  document.addEventListener("pointerleave", () => cursor.classList.remove("on"));
  const loop = () => {
    cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
    cursor.style.transform = "translate(" + cx + "px," + cy + "px)";
    requestAnimationFrame(loop);
  };
  loop();
  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("pointerenter", () => cursor.classList.add("big"));
    el.addEventListener("pointerleave", () => cursor.classList.remove("big"));
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
