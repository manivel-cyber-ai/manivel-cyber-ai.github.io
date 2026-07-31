const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const introScreen = document.querySelector(".intro-screen");
const enterButton = document.querySelector(".intro-enter");

const finishIntro = () => {
  document.body.classList.remove("intro-active");
  introScreen.classList.add("is-leaving");
  window.setTimeout(() => introScreen.remove(), 950);
};

if (!reducedMotion) {
  document.body.classList.add("intro-active");
  enterButton.addEventListener("click", finishIntro);
  // Let keyboard users continue instantly without reaching for the mouse.
  window.requestAnimationFrame(() => enterButton.focus({ preventScroll: true }));
  const handleIntroKey = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    finishIntro();
    window.removeEventListener("keydown", handleIntroKey);
  };
  window.addEventListener("keydown", handleIntroKey);
} else {
  introScreen.remove();
}

let scrollProgressTicking = false;
const updateScrollProgress = () => {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  document.documentElement.style.setProperty("--scroll", `${available ? (window.scrollY / available) * 100 : 0}%`);
  scrollProgressTicking = false;
};
window.addEventListener("scroll", () => {
  if (scrollProgressTicking) return;
  scrollProgressTicking = true;
  window.requestAnimationFrame(updateScrollProgress);
}, { passive: true });
updateScrollProgress();

// Reveal cards once, keeping their final layout stable.
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: "0px 0px -45px" });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

// Navigation state follows visible sections.
const navigationLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const sections = [...navigationLinks].map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
if ("IntersectionObserver" in window) {
  const navigationObserver = new IntersectionObserver((entries) => {
    const active = entries.find((entry) => entry.isIntersecting);
    if (!active) return;
    navigationLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${active.target.id}`));
  }, { rootMargin: "-22% 0px -65%", threshold: 0 });
  sections.forEach((section) => navigationObserver.observe(section));
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    const offset = 82;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: reducedMotion ? "auto" : "smooth" });
  });
});

if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  // Smoothed cursor glow: the target updates instantly, the rendered position eases
  // toward it every frame, which reads as fluid rather than input-locked.
  const glow = document.querySelector(".cursor-glow");
  const glowTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const glowCurrent = { ...glowTarget };
  window.addEventListener("pointermove", (event) => {
    glowTarget.x = event.clientX;
    glowTarget.y = event.clientY;
    glow.classList.add("active");
  }, { passive: true });

  const renderGlow = () => {
    glowCurrent.x += (glowTarget.x - glowCurrent.x) * 0.16;
    glowCurrent.y += (glowTarget.y - glowCurrent.y) * 0.16;
    glow.style.transform = `translate3d(${glowCurrent.x}px, ${glowCurrent.y}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(renderGlow);
  };
  requestAnimationFrame(renderGlow);

  // Card tilt: same easing approach so the surface glides to rest instead of snapping.
  document.querySelectorAll(".card, .skill-card, .project-card").forEach((card) => {
    const state = { tx: 0, ty: 0, active: false, raf: null };
    const settle = () => {
      state.tx += (0 - state.tx) * 0.22;
      state.ty += (0 - state.ty) * 0.22;
      card.style.transform = `perspective(900px) rotateX(${state.ty}deg) rotateY(${state.tx}deg) translateY(${state.active ? -6 : 0}px)`;
      if (!state.active && Math.abs(state.tx) < 0.02 && Math.abs(state.ty) < 0.02) {
        card.style.transform = "";
        state.raf = null;
        return;
      }
      state.raf = requestAnimationFrame(settle);
    };
    const ensureLoop = () => { if (!state.raf) state.raf = requestAnimationFrame(settle); };

    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      state.tx = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
      state.ty = ((event.clientY - bounds.top) / bounds.height - .5) * -2;
      state.active = true;
      ensureLoop();
    });
    card.addEventListener("pointerleave", () => { state.active = false; ensureLoop(); });
  });

  // Magnetic buttons: a light pull toward the cursor within the button's own bounds.
  document.querySelectorAll(".button, .nav-resume, .intro-enter").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * 0.18;
      const y = (event.clientY - bounds.top - bounds.height / 2) * 0.28;
      button.style.setProperty("--magnet-x", `${x}px`);
      button.style.setProperty("--magnet-y", `${y}px`);
    });
    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--magnet-x", "0px");
      button.style.setProperty("--magnet-y", "0px");
    });
    // A soft ripple on click reinforces that the press registered.
    button.addEventListener("pointerdown", (event) => {
      const bounds = button.getBoundingClientRect();
      const ripple = document.createElement("i");
      ripple.className = "btn-ripple";
      ripple.style.left = `${event.clientX - bounds.left}px`;
      ripple.style.top = `${event.clientY - bounds.top}px`;
      button.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });
}

// Lightweight animated connection field. It stops completely when reduced motion is requested.
if (!reducedMotion) {
  const canvas = document.querySelector(".network-canvas");
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let nodes = [];
  let animationFrame;

  const configure = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const quantity = Math.min(64, Math.max(26, Math.floor((width * height) / 24000)));
    nodes = Array.from({ length: quantity }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, size: Math.random() + .35 }));
  };
  const render = () => {
    context.clearRect(0, 0, width, height);
    nodes.forEach((node) => {
      node.x += node.vx; node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
    });
    nodes.forEach((node, index) => {
      for (let otherIndex = index + 1; otherIndex < nodes.length; otherIndex += 1) {
        const other = nodes[otherIndex];
        const distance = Math.hypot(node.x - other.x, node.y - other.y);
        if (distance < 135) {
          context.strokeStyle = `rgba(230, 35, 50, ${.13 * (1 - distance / 135)})`;
          context.lineWidth = .55;
          context.beginPath(); context.moveTo(node.x, node.y); context.lineTo(other.x, other.y); context.stroke();
        }
      }
      context.fillStyle = "rgba(230, 35, 50, .38)";
      context.beginPath(); context.arc(node.x, node.y, node.size, 0, Math.PI * 2); context.fill();
    });
    animationFrame = requestAnimationFrame(render);
  };
  configure(); render();
  window.addEventListener("resize", () => { cancelAnimationFrame(animationFrame); configure(); render(); }, { passive: true });
}
