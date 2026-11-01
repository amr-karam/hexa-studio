# Changelog

All notable changes to HEXA Studio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-11-01

### Added
- Initial project release
- Scroll-driven 3D architectural visualization (three.js + GSAP + Lenis)
- Floor plan to 3D walkthrough experience
- 27 fallback video clips for WebGL2-unavailable browsers
- 15 PBR material sets (1K and full resolution)
- HDR sky dome
- Dual theme system (light/dark)
- Typography and lighting presets
- Render Blueprint for static site deployment
- Dev server (`dev-server.js`) — zero-dependency local server
- Smoke test suite (`tests/smoke.test.js`)
- Asset validation script (`scripts/validate-assets.js`)
- ESLint flat config (`eslint.config.js`)
- Prettier config (`.prettierrc`)
- EditorConfig (`.editorconfig`)
- Git attributes (`.gitattributes`)
- robots.txt and sitemap.xml for SEO
- 404 page
- SVG favicon
- Contributing guide
- MIT License
- CI/CD pipeline (GitHub Actions)
- CLIPS documentation (missing clips 12 and 24 noted)

### Known Issues
- CLIPS 12 and 24 are missing (binary MP4 files, cannot be generated)
- No build step (intentional — CDN dependencies)
- Best viewed on laptop/desktop
