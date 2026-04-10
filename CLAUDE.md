<!-- GSD:project-start source:PROJECT.md -->
## Project

**Profile Pic Frame**

A single-file (`index.html`) web app that lets users upload their profile picture, choose one of two campaign frames (PNG overlays), resize both layers to fit, and download the composited result. Everything runs client-side — no server, no uploads, no tracking, no build step. Built for a single short-lived campaign.

**Core Value:** User uploads photo, picks frame, adjusts fit, downloads result — in under a minute, entirely in the browser.

### Constraints

- **Tech stack**: Native Konva.js + vanilla JS — single `index.html` file, no framework, no build tool
- **Konva delivery**: `konva.min.js` downloaded locally and referenced via `<script src="konva.min.js">` — no CDN dependency at runtime
- **Timeline**: 2-3 day campaign window — ship fast, iterate if needed
- **Client-only**: Zero server requirements — open `index.html` directly in a browser or serve as a static file
- **No build step**: No npm, no bundler, no TypeScript — edit and refresh
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

### Chosen Stack
| Technology | Purpose | Notes |
|------------|---------|-------|
| **Konva.js** (local `konva.min.js`) | Interactive canvas — drag, scale, layer management | Downloaded locally, referenced via `<script src="konva.min.js">` |
| **Vanilla JS** (ES2020+) | All application logic | No framework, no transpiler |
| **Single `index.html`** | Entire app lives here | HTML + inline `<style>` + inline `<script>` |
| **Native File API** | Photo upload | `<input type="file" accept="image/*">` + `FileReader` |
| **Konva `stage.toDataURL()`** | Export composited PNG | Built into Konva, handles pixel ratio |

### Why Konva.js over raw Canvas API
Konva provides drag-and-drop, hit detection, and per-node transforms (scale, position) out of the box. For a two-layer interactive editor this saves significant imperative canvas bookkeeping. The raw Canvas API would require re-implementing all of that manually.

### Why single HTML file
- Zero tooling — open in browser, edit, refresh
- Trivially deployable anywhere (email a link, drop on any static host)
- Campaign is short-lived; build pipeline would outlive its usefulness

### Styling approach
Inline `<style>` block in `index.html`. Polished campaign-quality UI using CSS custom properties for theming. No CSS framework.

### Rejected alternatives
| Approach | Why NOT |
|----------|---------|
| React + Vite | Build step overhead unnecessary for a single-view campaign tool |
| react-konva | React wrapper around Konva — adds React for no benefit here |
| Fabric.js | 200KB+, designed for interactive editors, not profile frame tools |
| CDN Konva | Runtime CDN dependency; local copy avoids network failures |

### Development workflow
```
# No install step needed — just open index.html in a browser
# Or serve locally for file:// CORS-free image loading:
python3 -m http.server 8080
# Then open http://localhost:8080
```

### Browser compatibility
- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+

### Anti-patterns to avoid
1. Don't add a build step (no webpack, Vite, esbuild)
2. Don't pull in React or any component framework
3. Don't use CDN script tags — keep `konva.min.js` local
4. Don't do server-side image processing
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
