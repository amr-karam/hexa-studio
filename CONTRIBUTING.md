# Contributing to HEXA Studio

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- Git >= 2.0

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/hexastudio/hexa-studio.git
   cd hexa-studio
   ```

2. Install dev dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```
   The site will be available at http://localhost:3000

### Available Scripts

| Script | Description | Runtime Prerequisites |
|--------|-------------|----------------------|
| `npm run dev` | Start local dev server (port 3000) | Node.js >= 18 |
| `npm run serve` | Serve via `serve` package | Node.js >= 18, serve installed |
| `npm run lint` | Run ESLint on JS/HTML files | Node.js >= 18, eslint installed |
| `npm run format` | Format code with Prettier | Node.js >= 18, prettier installed |
| `npm run format:check` | Check formatting without writing | Node.js >= 18, prettier installed |
| `npm test` | Run smoke tests | Node.js >= 18 |
| `npm run validate` | Validate assets (CLIPS, textures) | Node.js >= 18 |
| `npm run deploy:render` | Validate Render Blueprint | Render CLI installed |

### Code Style
- 2-space indentation
- Single quotes for strings
- Semicolons required
- LF line endings (enforced via .gitattributes)

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `style:` formatting
- `refactor:` code restructuring
- `test:` adding tests
- `chore:` maintenance

### Pull Requests
1. Create a feature branch from `master`
2. Make your changes
3. Run `npm run test:all` to ensure everything passes
4. Submit a PR with a clear description

## Missing Assets
- CLIPS 12 and 24 are missing from the video clip set. These are binary MP4 files that cannot be generated programmatically. They must be created manually or sourced from the original video production.
