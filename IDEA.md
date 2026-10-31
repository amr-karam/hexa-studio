# HEXA Studio — Project Idea

## Concept

A scroll-driven architectural visualization landing page for HEXA Studio. The page opens on a flat floor plan — black ink on paper, room names, dimensions, nothing 3D. As the visitor scrolls, walls rise out of the drawing, the camera descends to the front door and walks through the rooms one by one at eye height. Each room stays a line drawing until the camera reaches it, then real materials sweep across it.

## What makes it different

- The floor plan is **not a picture**. It is the real 3D model, cut at ~1.2 m and viewed from straight above through a long lens. The drawing and the building are the same thing.
- The camera travels **deep into the space**, room after room. It does not orbit the building from outside.
- It should feel like a house that costs millions: big rooms, real furniture, late afternoon light.

## Building layout (from scene.js)

| Room | Role | Notes |
|------|------|-------|
| Media | Entry zone | First stop |
| Kitchen and dining | Living area | Skylights |
| Wine | Small room | |
| Study | | |
| Library | | subSize .42 |
| Guest suite ×2 | | |
| Garage | | conc floor |
| Living | | h 4.5, clerestory |
| Hall | small | rot -90° |
| Entrance | | h 4.8, concrete walls, clerestory |
| WC | small | rot -90° |
| Patio | Outdoor | |
| Glass gallery | | rot -90°, trav floor |
| Master bedroom | | larch walls |
| Dressing | | |
| Bath | | trav floor |
| Private garden | | |

## Tech stack

- three.js (v0.160.1 via CDN)
- GSAP + ScrollTrigger (v3.13.0 via CDN)
- Lenis (v1.1.14 via CDN) — smooth scrolling
- Plain files, no build step
- CC0 textures from Poly Haven
- WebGL2 required; video fallback via `gate.js`

## Inspiration

Adapted from the [Casa Serra](https://sam1983aing.github.io/casa-serra/) concept by Sam Aing. The starter prompt that generated this project is documented in `starter-prompt.md`.

## Contacts

- Email: info@hexastudio.net
- Website: https://hexastudio.net
- Location: Cairo, Egypt (30.04° N, 31.23° E)

## Status

Work in progress. Best on a laptop.
