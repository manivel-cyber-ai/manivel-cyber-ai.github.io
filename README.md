# Manivel R — Cybersecurity Portfolio

A cinematic, responsive portfolio for Manivel R, a Computer Science (AI & ML) undergraduate focused on ethical hacking, web security, CTFs, and AI-driven defense.

**Live site:** [manivel-cyber-ai.github.io](https://manivel-cyber-ai.github.io/)

## Highlights

- Crimson red bento-card design system with custom SVG iconography
- Animated opening sequence introducing Manivel R, with an optional browser-generated sound and spoken welcome
- Interactive profile portrait with scan lines, moving highlight, labels, orbit elements, and an internship status stamp
- Motion-rich but accessible interactions: scroll reveals, animated project artwork, cursor glow, 3D card tilt, progress indicator, and a security-network canvas
- Responsive layouts for desktop, tablet, and mobile
- `prefers-reduced-motion` support disables non-essential animation and skips the opening screen
- Portfolio content covering skills, CTF achievement, internship work, certifications, projects, and contact links

## Technology

- HTML5
- CSS3 — custom properties, Grid, Flexbox, keyframe animation, responsive media queries
- Vanilla JavaScript — Web Audio API, Speech Synthesis API, `IntersectionObserver`, Canvas API

No frameworks, build step, or third-party icon library is required.

## Run locally

Open `index.html` directly in a modern browser, or serve this directory locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Sound and accessibility

Browsers do not allow websites to autoplay audio. The opening screen therefore offers **Enter with sound** and **Enter silently**. The sound option plays a generated intro track plus a browser voice introduction; no audio recording is stored in this repository.

Users with a reduced-motion preference bypass the opening sequence and all decorative motion is minimized.

## Project structure

```text
.
├── index.html                         # Main portfolio
├── styles.css                         # Visual system, layout, and animations
├── script.js                          # Opening sequence, sound, interaction, and canvas effects
├── profile_pic.jpeg                   # Profile image
├── Manivel_R_Portfolio_Resume.html    # Print-ready resume page
└── README.md
```

## GitHub Pages deployment

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Set the source to **Deploy from a branch**.
4. Choose the `main` branch and the `/ (root)` folder.
5. Save. GitHub Pages will publish the site at the live URL above.

## Contact

- Email: [mr.manivel.r@gmail.com](mailto:mr.manivel.r@gmail.com)
- GitHub: [manivel-cyber-ai](https://github.com/manivel-cyber-ai)
- LinkedIn: [mr-manivel-r](https://linkedin.com/in/mr-manivel-r)
- Location: Tiruchirappalli, Tamil Nadu
