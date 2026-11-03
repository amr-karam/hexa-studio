# HEXA Studio

A high-end, scroll-driven architectural visualization landing page.

## 🚀 Live Demo
**[View Live Site](https://amr-karam.github.io/hexa-studio/)**

## 🏗️ Project Concept
HEXA Studio is an immersive digital experience that guides users through a virtual architectural tour. Using a "camera-stop" mechanism, the site synchronizes 3D scene transitions and high-fidelity video clips with the user's scroll position, creating a seamless flow between conceptual renders and realistic visualizations.

## 🛠️ Tech Stack
- **Core:** Three.js (r160.1), GSAP ScrollTrigger (v3.13.0), Lenis (v1.1.14)
- **Architecture:** Plain-file static site (no build step)
- **Styling:** Dual-theme CSS system (Light/Dark mode)
- **Hosting:** GitHub Pages (Primary — https://amr-karam.github.io/hexa-studio/). Render (Blocked: HTTP 402 billing). Production server `19.16.1.100` unreachable (SSH timeout).

## 📁 Project Structure
- `index.html`: Main entry point.
- `scene.js`: Defines the 3D scene, camera stops, and architectural rooms.
- `staging.js`: Manages PBR materials, textures, and environmental lighting.
- `gate.js`: Handles WebGL2 compatibility and video fallbacks.
- `assets/`: PBR textures, skyboxes, and environmental maps.
- `CLIPS/`: High-resolution MP4 visualization clips.
- `shared/`: Shared UI components and effects. `shared/fx-jit.js` is the Just-In-Time media engine (`FX.JIT`): it tracks the live camera stop delivered by `FX.experience` (`ve.m.key`) via the `frame` hook in `scene.js`, pre-buffers current + next stop, disposes everything further, and blacklists the missing binaries `clip12.mp4` / `clip24.mp4`. Register per-stop media with `FX.JIT.pool(stopKey, [{src, poster}])`; read state via `FX.JIT.stats()`.

## ⏳ Just-In-Time Media Engine
`shared/fx-jit.js` exposes `FX.JIT` — a stop-keyed media manager wired to the walk's camera stops via the `frame` hook in `scene.js`. It pre-buffers the current stop + the next one, disposes everything further away (`pause`/`src` reset for video, `.dispose()` for textures), and blacklists the two known-bad binaries `clip12.mp4` / `clip24.mp4`.

To attach media to a room stop:
```js
FX.JIT.pool(3, [{ src: 'CLIPS/3.mp4', poster: 'media/still.jpg' }]);
```
Call `FX.JIT.stats()` to inspect `{ current, held, pools }` from the console.

## 🎭 Phase 2 — Creative Expansion
- **Day/Night cycle** — `shared/fx-time.js` (`FX.Time`): post-processing time-of-day moods driven through `window.__rig.P` (exposure/tint/fadeCol), with self-installing topbar toggle and per-choice persistence. No minified files touched.
- **Spatial audio** — `shared/fx-listen.js` (`FX.Listen`): procedural WebAudio room tones seeded per camera stop (no audio assets), StereoPanner panning derived from camera yaw, master ducking while a dossier is open, replay-safe autoplay policy. No minified files touched.

## 🚀 Local Development
1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/amr-karam/hexa-studio.git
   cd hexa-studio
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open `http://localhost:3000` in your browser.

## 🧪 Quality Assurance
- **Smoke Tests:** `npm test` (Verifies critical file presence and references)
- **Asset Validation:** `npm run validate` (Checks for missing media/textures)
- **Linting:** `npm run lint`

## 📜 License
This project is UNLICENSED.
