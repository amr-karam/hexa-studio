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
- **Hosting:** GitHub Pages (Primary), Render (Blueprint configured)

## 📁 Project Structure
- `index.html`: Main entry point.
- `scene.js`: Defines the 3D scene, camera stops, and architectural rooms.
- `staging.js`: Manages PBR materials, textures, and environmental lighting.
- `gate.js`: Handles WebGL2 compatibility and video fallbacks.
- `assets/`: PBR textures, skyboxes, and environmental maps.
- `CLIPS/`: High-resolution MP4 visualization clips.
- `shared/`: Shared UI components and effects.

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
