const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The site is fully silent — no Web Audio, no speech synthesis, no sound toggle.
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
} else {
  introScreen.remove();
}

const updateScrollProgress = () => {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  document.documentElement.style.setProperty("--scroll", `${available ? (window.scrollY / available) * 100 : 0}%`);
};
window.addEventListener("scroll", updateScrollProgress, { passive: true });
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
  const glow = document.querySelector(".cursor-glow");
  window.addEventListener("pointermove", (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
    glow.classList.add("active");
  }, { passive: true });

  document.querySelectorAll(".card, .skill-card, .project-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - .5) * -2;
      card.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) translateY(-6px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
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
