# Reverse Engineering Report: composites.archi

## Overview

**URL:** https://www.composites.archi/
**Title:** Composite materials | Architecture of new possibilities
**Type:** Scroll-driven interactive experience / marketing site
**Framework:** Nuxt.js 3 (Vue-based SPA) with SSR

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt.js 3 (Vue SPA, SSR) |
| 3D Engine | Three.js (WebGL) |
| Smooth Scroll | Lenis |
| Animations | GSAP (ScrollTrigger, possibly Flip/SplitText) |
| 3D Assets | GLB models (shape, tunnel, feather, wireframes), matcap textures, displacement maps |
| Fonts | "tasa-orbiter" (custom web font, not Google Fonts) |
| API | api.composites.archi (REST, JSON) |
| Analytics | Matomo (stats.sparkk.fr) |
| Styling | CSS-in-JS / scoped Vue styles (no global CSS framework) |

## Design System

### Colors
- **Background:** `rgb(15, 15, 15)` (near-black)
- **Text:** `rgb(15, 15, 15)` on dark bg (likely with overlays)
- **Accent:** `rgb(241, 128, 16)` (orange)
- **Canvas:** Full-viewport fixed WebGL canvas behind content

### Typography
- **Primary font:** `tasa-orbiter` (custom, sans-serif fallback)
- **Weight:** 600 for headings
- **Letter spacing:** ~0.14px (tight)

### Layout
- Full-viewport canvas wrapper (`position: fixed`, `100vh`)
- Scroll-driven sections with sticky containers
- Lenis smooth scrolling

## Page Structure

### Sections (in scroll order)
1. **Hero / Scrollytelling** (`#scrollytelling`) — "THE POWER OF COMPOSITES", "MAKE IT A PARADOX", scroll to explore
2. **Architecture** (`#projects-transition__container`) — "Architecture inspired by Nature, ambitious and innovative"
3. **Ideal Fusion** (`#scrollytelling__second`) — "Ideal fusion of the power of composites"
4. **Protection & Beauty** — "Protection and beauty merge in performance"
5. **Projects** (`#projects`) — Residential, Commercial, Public Building case studies
6. **Renovation** — "FROM FRAGILITY TO STRENGTH. FROM AGEING TO REVIVAL"
7. **Standards** (`#standards__container`) — Building codes & standards by continent
8. **History** (`#history__container`) — "An architectural revolution embraced by pioneers since 1950's"
9. **Contact** (`#contact`) — "we are happy to answer any request"

### Navigation
- Top menu: Introduction, Cases, Construction, Renovation, Standards, History, Contact
- "Why Composites" link → /materials
- Material detail pages at /materials/{slug}
- Construction cases → /construction
- Renovation cases → /renovation

### Key Content Blocks
- **Hero:** "Make it a paradox" — scroll-triggered 3D reveal
- **Benefit cards:** benefit-card, benefit-infos components
- **Standard cards:** standard-card with icons
- **Project cards:** project__card, project-category-card with visual containers
- **History timeline:** history__mobile-item with year/title/image
- **Contact form:** contact__form-double, contact__form-item, contact__form-line

## 3D Assets (prefetched)
- `shape.BcJDqfMP.glb` — 3D shape model
- `shape-wireframe.DN40jolb.glb` — wireframe version
- `tunnel.BoV1xo96.glb` — tunnel model
- `tunnel-wireframe.CsX84w2k.glb` — tunnel wireframe
- `feather.SM4_F_rW.glb` — feather model
- `feather-full.BDh8RPlB.glb` — full feather
- `feather-full-animated.Clj3pK7i.glb` — animated feather
- Matcaps: `matcapblack`, `matcapWhite`
- Displacement textures: `displacement-4`, `displacement-7`
- Feather textures: `feather-alpha`, `feather-base`, `feather-base-white`
- Spiral texture: `spiral-texture.rc1pTt73.jpg`

## JS Chunks (Nuxt auto-split)
| Chunk | Size | Purpose |
|-------|------|---------|
| entry.DR0gphu3.js | 62KB | Nuxt entry/runtime |
| initLoader.CdbAgeWv.js | 164KB | Loading screen + 3D init |
| anims.27K8fT71.js | 73KB | GSAP animations |
| index.DsnAiU_j.js | 18KB | Home page component |
| Material.C-naQqDa.js | 14KB | Material detail page |
| Materials.BA9xjSUr.js | 1.4KB | Materials listing |
| Project.8TYaXpIe.js | 3.9KB | Project detail page |
| default.C7Ai50oM.js | 6.1KB | Default layout |
| menu_arrow.CxeQk73C.js | 3.5KB | Menu arrow component |
| initMaterials.D-WsUIo5.js | 1KB | Material init |
| nl2br.DYYNZbRe.js | 458B | nl2br utility |
| seo.u47eUUVL.js | 871B | SEO meta |

## API Endpoints (inferred)
- `api.composites.archi` — REST API for content (projects, materials, standards)
- `/materials` — materials listing
- `/materials/{slug}` — individual material
- `/construction` — construction cases
- `/renovation` — renovation cases

## CSS Architecture
- No CSS framework (no Tailwind, no Bootstrap)
- Scoped Vue SFC styles with `data-v-*` attributes
- Minimal global CSS (683 bytes in index.css)
- All styling is component-scoped

## Accessibility Observations
- Canvas has `aria-hidden="true"` (correct — decorative 3D)
- Semantic headings (h1, h2, h3) present
- Navigation links have text content
- Skip link ("SKIP") present in hero
- Form inputs have labels

## Performance Notes
- Heavy 3D assets (GLB models, textures) prefetched
- Lenis smooth scroll may impact scroll performance on lower-end devices
- Large initLoader chunk (164KB) blocks initial render
- Images use lazy loading (transferSize: 0 for below-fold images)

## Deep Dive: 3D WebGL Architecture

### Scene Manager (`y0` class)
The main WebGL scene manager orchestrates **4-7 3D scenes** that transition between each other based on scroll position:

| Scene | Class | Purpose |
|-------|-------|---------|
| sceneA | `m0` | Primary scene |
| sceneB | `g0` | Secondary scene |
| sceneC | `_0` | Tertiary scene |
| sceneD | `v0` | Quaternary scene |
| sceneE | `x0` | (conditional, if `hn()` is false) |
| sceneF | `M0` | (conditional) |
| sceneG | `S0` | (conditional) |

### Renderer Setup (`p0` / setupWebglScene)
- **Camera:** Orthographic (`xs` = OrthographicCamera) with bounds based on viewport
- **Renderer:** `Yn` = WebGLRenderer, `antialias: false` (performance)
- **Pixel ratio:** Capped at 2x (`devicePixelRatio > 1 ? 2 : 1`)
- **DRACO decoder:** `/draco/` path for compressed GLB models
- **Model loader:** `L_` = GLTFLoader with DRACO support
- **Texture loader:** `Cc` = TextureLoader with crossOrigin enabled
- **Clock:** `ur` = THREE.Clock for delta time
- **ResizeObserver:** Handles responsive canvas resizing

### Scene Transitions (Displacement Shaders)
Custom GLSL fragment shaders create displacement-based transitions between scenes:

1. **Radial displacement** — Circular wipe from center, using parabola easing
2. **Left wipe** — Horizontal displacement sweep
3. **Top wipe** — Vertical displacement sweep
4. **Top reverse** — Reverse vertical wipe

All shaders use:
- Displacement texture (noise-based)
- Progress uniform (0→1 driven by scroll)
- Time uniform (animated noise offset)
- `mirrored()` UV function for seamless tiling
- `parabola()` easing function

### Animation Loop
- Uses `_e.ticker` (GSAP ticker) for render loop
- Each scene calls `.render()` and `.loopAnimation()`
- `render3dScene()` called per frame
- Scroll state tracked via `scroll.y`, `scroll.force`, `ratioScroll`

### Scroll Integration
- `initScrollTrigger()` sets up GSAP ScrollTrigger
- Scroll position maps to scene transitions
- `scrolled` and `scrolled1` track scroll progress
- `ratioScroll` normalizes scroll across viewport sizes

### 3D Asset Loading Strategy
- **PreloadManager** (`y_`) manages all asset loading
- **managerModels** + **managerTextures** for organized loading
- Assets loaded before scene renders (loader screen during init)
- GLB models compressed with DRACO
- Matcap textures for stylized shading (black + white variants)
- Displacement maps for shader transitions
- Multiple texture variants (feather-alpha, feather-base, feather-base-white)

### Key Reusable Patterns for HEXA Studio
1. **Multi-scene transition system** with displacement shaders
2. **Orthographic camera** for 2D-like 3D (better for architectural viz)
3. **DRACO-compressed GLB** loading pipeline
4. **Matcap shading** for stylized, performant materials
5. **GSAP ticker** as render loop (syncs with animations)
6. **ResizeObserver** for responsive canvas
7. **Preload manager** pattern for asset orchestration
8. **Scroll-triggered scene transitions** with progress uniform
1. **Scroll-driven narrative** — Hero text reveals on scroll, 3D shapes transform
2. **Sticky sections** — `bloc__sticky` containers with scroll-triggered content
3. **Smooth scroll** — Lenis for inertia-based scrolling
4. **Sound toggle** — "SOUND ON/OFF" in hero
5. **Case study browsing** — Filterable project lists by category (Residential/Commercial/Public)
6. **Standards filter** — Continent-based filtering (All, North America, Europe, Asia, etc.)
7. **Material library** — Detailed material pages with technical specs

## Reusable Patterns for HEXA Studio
- Scroll-triggered storytelling with 3D canvas background
- Sticky section containers with scroll-progress indicators
- Material/project card grids with category filtering
- Smooth scroll (Lenis) integration
- GLB model loading with matcap shading
- Nuxt.js 3 for SSR + code splitting
- Custom font (tasa-orbiter) for brand identity
- Dark theme with orange accent
}

## Deep Dive: Backend & API (Strapi CMS)

### CMS
- **Strapi v5** — headless CMS at `api.composites.archi`
- REST API with Strapi query syntax (`filters`, `populate`, `fields`, `pagination`)
- Content types: `materials`, `projects`, `global` (SEO settings)

### Material Data Model
```json
{
  "id": 176,
  "documentId": "uvpwbyteuca5psw13p8tzw93",
  "title": "Carbon Fibre",
  "weight": "...",
  "cost": "...",
  "strength": "...",
  "durability": "...",
  "maintenance": "...",
  "lca": "...",
  "features": "Composites elements: ...\n\nWhy composites: ...",
  "slug": "carbon-fibre",
  "display_popup": true,
  "link": "https://www.structuralrs.com/",
  "project": { "title", "info", "location", "company", "year", "slug", "copyright" },
  "manufacturer": [{ "label", "link" }]
}
```

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api/global?field[0]=defaultSeo&populate=*` | Global SEO settings |
| `/api/materials?filters[slug]={slug}&populate=*` | Single material by slug |
| `/api/materials` | All materials (paginated) |
| `/api/projects` | Projects (inferred) |

### Content Architecture
- **Materials** linked to **Projects** (one-to-one via `project` field)
- **Manufacturer** info attached to materials
- **Display popup** flag controls UI behavior
- **Slug-based routing** (`/materials/{slug}`)

### Key Reusable Patterns
1. **Strapi v5 + Nuxt 3** headless CMS architecture
2. **Slug-based dynamic routing** with `populate=*` for full data
3. **Content-driven UI** — all text/content from API, not hardcoded
4. **Project-material relationship** for case study linking
