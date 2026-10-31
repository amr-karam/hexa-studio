# HEXA Studio · Architectural Visualization

A scroll-driven interactive experience showcasing HEXA Studio's architectural visualization work. The floor plan unfolds into a cinematic walkthrough as you scroll.

**Live demo:** Coming soon (https://hexastudio.net)

## About HEXA Studio

HEXA Studio is a specialized architectural visualization studio dedicated to transforming architectural concepts into compelling visual experiences. We collaborate with real estate developers, architects, and marketing teams to present projects with the highest level of realism and visual storytelling.

**Contact:** info@hexastudio.net  
**Website:** https://hexastudio.net  
**Location:** Cairo, Egypt (30.04° N, 31.23° E)

## Concept

The page opens on a flat floor plan — black ink on paper, room names, dimensions. Nothing looks 3D. When the visitor scrolls, the walls rise out of the drawing, the camera comes down to the front door and walks through each room at eye height. Each room stays a line drawing until the camera gets there, then real materials sweep across it.

The floor plan is not a picture. It is the real 3D model, cut at about 1.2 m and seen from straight above through a very long lens. The drawing and the building are the same thing.

Inspired by the [Casa Serra](https://sam1983aing.github.io/casa-serra/) concept by Sam Aing.

## Tech stack

- three.js, GSAP ScrollTrigger and Lenis
- Plain files, no build step
- Everything is geometry made in code
- Textures from [Poly Haven](https://polyhaven.com) (CC0)
- WebGL2 required; video fallback via `gate.js`

## Project structure

```
hexa-studio/
├── index.html          # Main page (floor plan → 3D house)
├── scene.js            # Main Three.js scene + room definitions (~90 KB)
├── staging.js          # Materials and textures staging (~43 KB)
├── gate.js             # WebGL2 gate + video fallback
├── hero-options.js     # Typography theme presets
├── light-options.js    # Lighting presets
├── theme.css           # Light theme CSS variables & styles
├── publish.css         # Fallback overlay styles
├── starter-prompt.md   # The starter prompt used to generate the concept
├── IDEA.md             # Project idea / vision
├── assets/tex-1k/      # 1K PBR texture sets (15 materials × arm/diff/nor)
├── assets/tex/         # Full-resolution PBR texture sets (15 materials)
├── assets/sky/         # HDR sky dome
├── CLIPS/              # Fallback video clips (1.mp4 → 27.mp4, missing 12 & 24)
├── media/              # walk.mp4, still.jpg, share.jpg, casa-larga images
├── prompt/             # Starter prompt sub-page
├── shared/             # Shared JS (fx-core, fx-post, fx-paint, fx-experience) + fx-ui.css
└── README.md           # This file
```

## Rooms

media → kitchen → wine → study → library → guest1 → guest2 → garage → living → hall → entrance → wc → patio → gallery → bedroom → dressing → bath → garden

## Deployment

This is a static site with no build step. Deploy by serving the folder contents directly (e.g., Render static site, Vercel, Netlify, or any static host). No `package.json` or bundler is required — all JS/CSS dependencies are loaded via CDN.

## Notes

- `CLIPS/` contains fallback video clips used when WebGL2 is unavailable. Clips 12 and 24 are missing from the set.
- `IDEA.md` contains the full project vision.
- `starter-prompt.md` contains the prompt that generated this project.

## License

Materials are CC0 (Poly Haven). Code is project-specific to HEXA Studio.
