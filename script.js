const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Audio: silent by default. No looping "music" or synthesized speech —
// just an optional, very quiet two-tone confirmation chime on entry, and an
// optional soft ambient bed the visitor can turn on/off from the nav.
// To swap in your own voice-over later, drop an audio file (e.g. voice-intro.mp3)
// next to this script and play it inside playEntryChime() using an <audio> element.
const introScreen = document.querySelector(".intro-screen");
const enterButton = document.querySelector(".intro-enter");
const soundToggle = document.querySelector(".sound-toggle");

let soundEnabled = false;
let audioContext;
let ambientSource;
let ambientGain;
let ambientFilter;

const getAudioContext = async () => {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return null;
  audioContext ||= new AudioEngine();
  if (audioContext.state === "suspended") await audioContext.resume();
  return audioContext;
};

// A short, clean "access granted" confirmation — two soft sine tones, ~0.4s total.
// Plays once on entry regardless of the ambient toggle below (it's brief enough not to need one).
const playEntryChime = async () => {
  const context = await getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  [392, 587.33].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.14 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.14 + 0.4);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + index * 0.14);
    oscillator.stop(now + index * 0.14 + 0.42);
  });
};

// A near-inaudible ambient bed — a single filtered low drone, well under
// typical "background music" loudness, meant to sit behind reading, not compete with it.
const buildAmbientBuffer = (context) => {
  const duration = 20;
  const sampleRate = context.sampleRate;
  const frameCount = Math.floor(sampleRate * duration);
  const buffer = context.createBuffer(2, frameCount, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  for (let index = 0; index < frameCount; index += 1) {
    const time = index / sampleRate;
    const fade = Math.min(time / 1.5, (duration - time) / 1.5, 1);
    const drift = Math.sin(Math.PI * 2 * 0.05 * time) * 3;
    const drone = Math.sin(Math.PI * 2 * (98 + drift) * time) * 0.5 + Math.sin(Math.PI * 2 * (147 + drift) * time) * 0.28;
    const sample = drone * fade * 0.05;
    left[index] = sample;
    right[index] = sample * 0.96;
  }
  return buffer;
};

const stopAmbient = () => {
  if (ambientSource) {
    try { ambientSource.stop(); } catch (error) { /* already stopped */ }
    ambientSource.disconnect();
    ambientSource = undefined;
  }
  if (ambientFilter) { ambientFilter.disconnect(); ambientFilter = undefined; }
  if (ambientGain) { ambientGain.disconnect(); ambientGain = undefined; }
};

const startAmbient = async () => {
  if (!soundEnabled) return;
  const context = await getAudioContext();
  if (!context) return;
  stopAmbient();
  ambientFilter = context.createBiquadFilter();
  ambientFilter.type = "lowpass";
  ambientFilter.frequency.value = 420;
  ambientGain = context.createGain();
  ambientGain.gain.value = 0.5;
  ambientSource = context.createBufferSource();
  ambientSource.buffer = buildAmbientBuffer(context);
  ambientSource.loop = true;
  ambientSource.connect(ambientFilter).connect(ambientGain).connect(context.destination);
  ambientSource.start();
};

const setSoundEnabled = (value) => {
  soundEnabled = value;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute("aria-label", soundEnabled ? "Turn ambient sound off" : "Turn ambient sound on");
  if (soundEnabled) startAmbient();
  else stopAmbient();
};

soundToggle.addEventListener("click", () => setSoundEnabled(!soundEnabled));

const finishIntro = () => {
  playEntryChime();
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
