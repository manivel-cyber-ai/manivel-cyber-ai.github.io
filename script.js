const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The opening sequence needs a user action before sound can play in modern browsers.
const introScreen = document.querySelector(".intro-screen");
const enterWithSound = document.querySelector(".intro-enter");
const enterSilently = document.querySelector(".intro-skip");
const soundToggle = document.querySelector(".sound-toggle");
let soundEnabled = false;
let audioContext;
let introTrackSource;
let introTrackGain;
let introTrackFilter;

const stopIntroAudio = () => {
  if (introTrackSource) {
    try { introTrackSource.stop(); } catch (error) { /* already stopped */ }
    introTrackSource.disconnect();
    introTrackSource = undefined;
  }
  if (introTrackFilter) {
    introTrackFilter.disconnect();
    introTrackFilter = undefined;
  }
  if (introTrackGain) {
    introTrackGain.disconnect();
    introTrackGain = undefined;
  }
};

const buildIntroBuffer = (context) => {
  const duration = 12;
  const sampleRate = context.sampleRate;
  const frameCount = Math.floor(sampleRate * duration);
  const buffer = context.createBuffer(2, frameCount, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const chords = [[220, 277.18, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [196, 233.08, 293.66]];

  for (let index = 0; index < frameCount; index += 1) {
    const time = index / sampleRate;
    const segment = Math.floor(time / 3) % chords.length;
    const localTime = time % 3;
    const attack = Math.min(localTime / .34, 1);
    const release = Math.min((3 - localTime) / .42, 1);
    const loopFade = Math.min(time / .45, (duration - time) / .45, 1);
    const envelope = attack * release * loopFade;
    const chord = chords[segment];
    const pulse = .82 + .18 * Math.sin((Math.PI * 2 * time) / 1.5);
    const shimmer = Math.sin(Math.PI * 2 * (chord[2] * 2) * time + .4) * .035;
    const drone = Math.sin(Math.PI * 2 * 110 * time) * .1;
    const voice = chord.reduce((sum, frequency, voiceIndex) => sum + Math.sin(Math.PI * 2 * frequency * time + voiceIndex * .45) * [.32, .24, .18][voiceIndex], 0);
    const sample = (voice + drone + shimmer) * envelope * pulse * .16;
    left[index] = sample;
    right[index] = sample * .93 + Math.sin(Math.PI * 2 * .28 * time) * .004;
  }

  return buffer;
};

const startIntroAudio = async () => {
  if (!soundEnabled) return;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;
  audioContext ||= new AudioEngine();
  if (audioContext.state === "suspended") await audioContext.resume();
  stopIntroAudio();

  introTrackFilter = audioContext.createBiquadFilter();
  introTrackFilter.type = "lowpass";
  introTrackFilter.frequency.value = 1300;
  introTrackFilter.Q.value = .9;

  introTrackGain = audioContext.createGain();
  introTrackGain.gain.value = .22;

  introTrackSource = audioContext.createBufferSource();
  introTrackSource.buffer = buildIntroBuffer(audioContext);
  introTrackSource.loop = true;
  introTrackSource.connect(introTrackFilter).connect(introTrackGain).connect(audioContext.destination);
  introTrackSource.start();
};

const playSignal = async () => {
  if (!soundEnabled) return;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;
  audioContext ||= new AudioEngine();
  if (audioContext.state === "suspended") await audioContext.resume();
  const now = audioContext.currentTime;
  [220, 330, 494].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, now + index * .12);
    gain.gain.exponentialRampToValueAtTime(.13, now + index * .12 + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, now + index * .12 + .28);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + index * .12);
    oscillator.stop(now + index * .12 + .3);
  });
};

const welcomeVoice = () => {
  if (!soundEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const greeting = new SpeechSynthesisUtterance("Welcome. I am Manivel R. Explore my cybersecurity portfolio.");
  greeting.rate = .9;
  greeting.pitch = .95;
  greeting.volume = .55;
  window.speechSynthesis.speak(greeting);
};

const finishIntro = (withSound) => {
  soundEnabled = withSound;
  document.body.classList.remove("intro-active");
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  if (withSound) { startIntroAudio(); playSignal(); window.setTimeout(welcomeVoice, 420); }
  else stopIntroAudio();
  introScreen.classList.add("is-leaving");
  window.setTimeout(() => introScreen.remove(), 950);
};

if (!reducedMotion) {
  document.body.classList.add("intro-active");
  enterWithSound.addEventListener("click", () => finishIntro(true));
  enterSilently.addEventListener("click", () => finishIntro(false));
} else {
  introScreen.remove();
}

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) {
    startIntroAudio();
    playSignal();
  } else {
    stopIntroAudio();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
});

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
