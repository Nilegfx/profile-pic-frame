<!-- GSD:project-start source:PROJECT.md -->
## Project

**Profile Pic Frame**

A lightweight React + Vite web app that lets users upload their profile picture, choose one of two campaign frames (PNG overlays), resize/reposition both layers to fit, and download the composited result. Everything runs client-side — no server, no uploads, no tracking. Built for a single short-lived campaign.

**Core Value:** User uploads photo, picks frame, adjusts fit, downloads result — in under a minute, entirely in the browser.

### Constraints

- **Tech stack**: React + Vite only — no framework mixing, no non-React canvas libs
- **Timeline**: 2-3 day campaign window — ship fast, iterate if needed
- **Client-only**: Zero server requirements — must run as a static file host or even `npm run dev`
- **Libraries**: Popular, well-maintained React libraries only (high npm downloads, good docs)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework & Build Tool
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | ^18.3.0 | UI library | Industry standard, hooks enable clean canvas integration via useRef/useEffect |
| Vite | ^6.0.0 | Build tool & dev server | Fastest dev experience for React SPAs, zero config, instant HMR, optimized production builds |
| TypeScript | ^5.6.0 | Type safety | Optional but recommended - catches bugs early, better IDE support (confidence: MEDIUM for specific version) |
### Image Crop/Resize UI
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-image-crop | ^11.0.0 | User photo resize/reposition | Lightest (<5KB gzip), zero deps, actively maintained (Apr 2025 release), supports aspect-ratio lock, keyboard accessible |
| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **react-image-crop** ✅ | <5KB gzip, no dependencies, aspect ratio lock built-in, fully keyboard accessible (a11y), actively maintained (April 2025 release) | Less feature-rich than competitors | **RECOMMENDED** - Perfect for simple use case, minimal bundle size |
| react-easy-crop | Smoother touch interactions, zoom/rotate support, 400+ commits | Heavier bundle, unnecessary features (zoom/rotate not in requirements), modal display bugs | Overkill for this use case |
| react-cropper | Wraps Cropper.js (jQuery heritage), feature-rich | Heavy dependency chain, jQuery-era API design, larger bundle | Avoid - too heavy for campaign tool |
### Image Compositing & Export
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **HTML5 Canvas API** | Native | Layer compositing, export | Zero dependencies, browser-native, simpler than frameworks for static overlay, direct pixel control |
| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Native Canvas API** ✅ | Zero dependencies, browser-native, direct control, simple for static overlays | Imperative (requires useRef/useEffect), manual image loading | **RECOMMENDED** - Simplest for this use case |
| react-konva | Declarative React bindings for Konva, 6.3K stars, good for complex graphics | Adds 100KB+ to bundle, overkill for two-layer composite, introduces abstraction layer | Unnecessary complexity |
| Fabric.js | Rich interactive canvas library, built-in transforms | Not React-native, imperative API, 200KB+ bundle, designed for editors not simple overlays | Too heavy, not React-first |
### File Handling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Native File API** | Browser built-in | Photo upload | Zero dependencies, `<input type="file" accept="image/*">` + FileReader API sufficient |
### State Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React useState/useReducer** | Built-in | Component state | No external state management needed for single-view campaign tool |
### Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vanilla CSS / CSS Modules** | Built-in Vite support | Component styling | Zero runtime cost, Vite supports CSS modules out-of-box, campaign doesn't need design system |
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | ^3.4.0 | Utility-first CSS | Faster prototyping, but adds build step complexity for 2-3 day campaign |
## Complete Installation
# 1. Scaffold Vite + React + TypeScript project
# 2. Install image crop library
# 3. Start dev server
## Alternatives Considered & Rejected
### Image Crop/Resize
| Library | Why NOT |
|---------|---------|
| react-easy-crop | Heavier bundle, zoom/rotate features not needed, modal display bugs reported |
| react-cropper | Wraps jQuery-era Cropper.js, heavy dependency chain, overkill |
| react-avatar-editor | Circular crops only, less flexible |
### Canvas / Compositing
| Library | Why NOT |
|---------|---------|
| react-konva | 100KB+ bundle for two-layer static composite is wasteful |
| Fabric.js | 200KB+, not React-first, designed for interactive editors |
| Konva (vanilla) | Non-React canvas library violates "pure React" project constraint |
### Build Tool
| Tool | Why NOT |
|------|---------|
| Create React App | Deprecated, slower dev server, webpack complexity |
| Next.js | SSR/SSG unnecessary for client-only tool, adds deployment complexity |
| Parcel | Less popular than Vite in 2026, slower HMR |
## Vite Configuration Considerations
### Recommended vite.config.ts
- `base: './'` - Ensures relative paths work on any static host (GitHub Pages, Netlify, etc.)
- `sourcemap: false` - Reduces build size for short-lived campaign
- `minify: 'esbuild'` - Faster builds than terser (default in Vite 6)
## Development Workflow
# Development
# Production build
# Preview production build locally
## Browser Compatibility
- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+
## Anti-Patterns to Avoid
### 1. Server-side Image Processing
### 2. Heavy Canvas Libraries
### 3. Global State Management
### 4. CSS-in-JS Runtime Libraries
### 5. Over-Engineering Export
## Migration Path (if needed)
| If you need... | Add this... | When |
|----------------|-------------|------|
| More complex canvas interactions | react-konva | Multiple layers, drag-drop, transforms |
| Persistent state across sessions | localStorage + Context API | Users want to save work in progress |
| Backend integration | tRPC + Cloudflare Workers | Analytics, saved frames, user uploads |
| Design system | Tailwind CSS or shadcn/ui | UI consistency across multiple views |
| Form validation | Zod + React Hook Form | User input beyond file upload |
## Source Verification
| Finding | Source | Confidence |
|---------|--------|------------|
| Vite setup | [Official Vite Docs](https://vite.dev/guide/) | HIGH |
| react-image-crop features | [GitHub repo](https://github.com/DominicTobias/react-image-crop) - April 2025 release verified | HIGH |
| react-easy-crop activity | [GitHub repo](https://github.com/ValentinH/react-easy-crop) - 400+ commits, 35 contributors | HIGH |
| Canvas API compositing | [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) | HIGH |
| Canvas download methods | [MDN HTMLCanvasElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement) | HIGH |
| React + Canvas integration | [React Docs - Effects](https://react.dev/learn) | HIGH |
| react-konva capabilities | [GitHub repo](https://github.com/konvajs/react-konva) - 6.3K stars | MEDIUM |
| Fabric.js features | [GitHub repo](https://github.com/fabricjs/fabric.js) | MEDIUM |
| Package versions | Training data (Jan 2025) + GitHub activity | MEDIUM |
## Summary
- **Build:** Vite 6 + React 18 + TypeScript 5.6
- **Image Crop:** react-image-crop 11.x (lightest, maintained, meets requirements)
- **Compositing:** Native HTML5 Canvas API (simplest for two-layer overlay)
- **Export:** canvas.toDataURL() or canvas.toBlob()
- **Styling:** CSS Modules (Vite built-in) or Tailwind CSS (optional)
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
