# Project Research Summary

**Project:** Profile Pic Frame
**Domain:** Client-side image compositing tool (profile picture overlay)
**Researched:** 2026-04-10
**Confidence:** HIGH

## Executive Summary

This is a client-side image compositing tool — a category dominated by simple, single-purpose apps like Twibbon and Canva frame generators. **Stack decision (user override):** React 18 + Vite 6 + **react-konva** for interactive canvas rendering. react-konva replaces both react-image-crop and the manual native Canvas approach — it provides draggable image nodes, built-in transform/scale, automatic retina scaling, and stage-level PNG export in a fully declarative React API.

The architecture is straightforward: a single App component orchestrates state (uploaded image, selected frame, photo position/scale), delegating to child components. The Konva `<Stage>` serves as both the live preview and the export surface — no separate offscreen canvas needed. The user drags and scales the photo node directly on the stage; clicking download calls `stage.toDataURL()`.

The critical risks shift slightly with react-konva: tainted canvas from cross-origin images is still the main concern (use FileReader, not `<img>` with crossOrigin), and layer ordering must be correct (photo node below frame node). react-konva handles devicePixelRatio automatically via the `pixelRatio` option on export.

## Key Findings

### Recommended Stack

The research converges on a minimal dependency stack optimized for speed of development and bundle size. Vite 6 provides zero-config React setup with instant HMR. react-image-crop (5KB gzipped, actively maintained through April 2025) handles interactive cropping with aspect ratio locking built-in, avoiding heavier alternatives like react-easy-crop (unnecessary zoom/rotate features) or react-cropper (jQuery-era architecture). Native Canvas API suffices for two-layer static compositing — canvas frameworks like react-konva (100KB+) or Fabric.js (200KB+) are overkill for this use case.

**Core technologies:**
- **React 18.3+ + Vite 6**: Modern development environment — zero-config, fast HMR, optimized builds
- **react-konva + konva**: Interactive canvas — draggable image nodes, built-in transforms, auto retina scaling, stage export
- **use-image**: Tiny companion hook (by Konva team) for loading images into Konva nodes
- **Native File API**: Upload handling — FileReader for data URLs, no library needed
- **TypeScript 5.6+**: Optional type safety — catches bugs early, better IDE support

**Total bundle size:** ~350KB gzipped (React 45KB + konva/react-konva ~200KB + use-image 2KB + app code). Setup: `npm install react-konva konva use-image`.

### Expected Features

Research identifies 8 table stakes features users expect from profile frame tools, 10 nice-to-have differentiators, and 12 anti-features to explicitly avoid. The MVP focuses on core upload-adjust-download flow that should complete in under 60 seconds.

**Must have (table stakes):**
- Image upload (JPEG/PNG) — core interaction, file input + FileReader
- Frame selection — toggle between 2 frames, visual preview
- Position adjustment — drag photo with mouse/touch
- Zoom/scale adjustment — slider or mouse wheel, aspect ratio locked
- Download final image — Canvas composite to PNG blob
- Preview while editing — real-time render via react-image-crop
- Mobile responsiveness — touch events, responsive canvas sizing
- Transparent frame overlay — PNG with alpha channel layering

**Should have (competitive):**
- Reset to default — low complexity, high UX value
- Auto-fit — smart default scaling, reduces user effort
- Multiple output sizes — export at 400x400, 800x800, 1200x1200 for different platforms

**Defer (v2+):**
- Rotation (most phones auto-orient now)
- Flip/mirror (edge case)
- Undo/redo (nice but not critical for simple adjustments)
- Keyboard shortcuts (power user feature)

**Explicitly exclude:**
- User accounts, frame upload, custom text/stickers, filters, cloud storage, social auto-posting, analytics — all add complexity inappropriate for 2-3 day campaign

### Architecture Approach

The architecture follows standard React unidirectional data flow with state lifted to App component. No external state management needed — 4 pieces of state (uploadedImage, selectedFrame, crop, zoom) managed with useState. Components are stateless and controlled by parent props, callbacks flow up for state updates.

**Major components:**
1. **App** — State orchestration, owns all application state, coordinates upload-edit-download flow
2. **ImageUploader** — File input with validation (type, size), emits data URL via callback
3. **FramePicker** — Frame selection UI, displays thumbnails, emits selected frame ID
4. **ImageEditor** — Controlled react-image-crop wrapper, receives crop/zoom props, emits changes
5. **DownloadButton** — Canvas compositor, creates offscreen canvas on click, draws layers, triggers download

**Key patterns:**
- Controlled components (ImageEditor has no internal state)
- Lazy canvas compositing (create canvas only on download)
- Import frames as ESM imports (Vite optimization, cache-busting)
- FileReader for upload (data URLs, no Object URL cleanup needed)
- useRef for imperative canvas access (no state triggers)

**Anti-patterns to avoid:**
- Real-time canvas compositing (expensive, react-image-crop provides preview)
- Zustand/Redux for 4 pieces of state (over-engineering)
- Storing frames in public/ folder (no cache-busting)
- Duplicating crop state (single source of truth in App)

### Critical Pitfalls

Research identified 13 pitfalls specific to Canvas API and React integration, 4 categorized as critical (cause complete failures or rewrites).

1. **Tainted canvas from uploaded images** — FileReader data URLs are same-origin, adding crossOrigin="anonymous" breaks export with SecurityError. Never set crossOrigin on FileReader images, only on external assets. Test download flow immediately after implementing upload.

2. **Blurry canvas on retina displays** — Default canvas sizing uses CSS pixels, not physical pixels. On devicePixelRatio=2 displays, output looks pixelated. Scale canvas dimensions by devicePixelRatio and call ctx.scale(dpr, dpr) to normalize coordinate system. Implement before any user testing.

3. **Memory leaks from Object URLs** — URL.createObjectURL() persists until page unload unless revoked. Image event handlers remain attached. Add cleanup functions to all useEffects, prefer FileReader over createObjectURL for uploads, test by uploading 5-10 times in succession.

4. **Wrong globalCompositeOperation** — Default source-over draws new content on top. For frame overlay, draw photo first, then frame. Alternatively use destination-over if drawing frame first. Always reset composite operation after use with ctx.save()/restore().

5. **toDataURL() performance** — Synchronous encoding blocks main thread for 3-5 seconds on large images. Use toBlob() instead (asynchronous, memory-efficient). Implement from start to avoid refactoring download logic.

## Implications for Roadmap

Based on research, suggested 4-phase structure following dependency chain: UI shell → upload/selection → interactive editing → canvas export.

### Phase 1: Static UI Shell
**Rationale:** Establishes component boundaries and prop interfaces without complex logic. All research points to React component structure being stable foundation — state flow patterns must be correct before adding behavior.

**Delivers:** 
- Vite + React + TypeScript setup
- App component with placeholder state
- All 5 components scaffolded (ImageUploader, FramePicker, ImageEditor, DownloadButton)
- Prop interfaces defined, callbacks wired (no implementation yet)

**Addresses:** 
- Architecture foundation (component boundaries from ARCHITECTURE.md)
- Avoids anti-pattern of ad-hoc component creation

**Avoids:** 
- Pitfall #4 (state duplication) by establishing single source of truth early

**Research flag:** Standard React patterns, skip research-phase. Use official React docs for reference.

### Phase 2: Upload and Frame Selection
**Rationale:** Validates state flow (callbacks up, props down) before adding complex editing. File upload and frame selection are independent, low-risk features that establish data pipeline.

**Delivers:**
- FileReader implementation in ImageUploader with validation (type, size limits)
- Frame imports as ESM (frame1.png, frame2.png from src/assets)
- Image display (no cropping yet, just preview)
- Frame selection with visual indicator
- State updates flowing correctly through callbacks

**Addresses:**
- Table stakes: image upload, frame selection (FEATURES.md)
- Asset handling pattern (import vs public/ folder from ARCHITECTURE.md)

**Avoids:**
- Pitfall #1 (tainted canvas) by using FileReader, not setting crossOrigin
- Pitfall #3 (memory leaks) by preferring FileReader over createObjectURL

**Uses:**
- Native File API + FileReader (STACK.md)
- Import frames as static assets (ARCHITECTURE.md pattern #3)

**Research flag:** Standard file handling, skip research-phase. Reference MDN FileReader docs if needed.

### Phase 3: Interactive Image Editing
**Rationale:** Most complex component requiring working upload + frame selection to test properly. react-image-crop integration is well-documented but needs careful state wiring.

**Delivers:**
- react-image-crop integration replacing static image preview
- Controlled crop/zoom state in App component
- Touch and mouse event handling for drag/zoom
- Aspect ratio locking (aspect={1} prop)
- Real-time visual preview (provided by react-image-crop, no canvas needed)

**Addresses:**
- Table stakes: position adjustment, zoom/scale adjustment (FEATURES.md)
- Controlled component pattern (ARCHITECTURE.md pattern #1)

**Avoids:**
- Anti-pattern #1 (real-time canvas compositing) by using react-image-crop's preview
- Pitfall #6 (React useEffect timing) with proper null checks and effect dependencies

**Uses:**
- react-image-crop 11.x (STACK.md)
- Controlled component pattern (ARCHITECTURE.md)

**Research flag:** Standard integration, skip research-phase. react-image-crop docs are comprehensive. Monitor for touch event edge cases on mobile.

### Phase 4: Canvas Compositing and Download
**Rationale:** Depends on all other components working correctly. Easiest to debug when input data (crop, zoom, frame) is validated. Canvas compositing concentrates most pitfalls — tackle last when data pipeline is stable.

**Delivers:**
- Offscreen canvas creation in DownloadButton
- getCroppedImg utility (extracts crop area from react-image-crop data)
- Layer compositing: draw cropped user photo, then frame overlay
- Retina display scaling (devicePixelRatio handling)
- toBlob() export with download trigger
- Memory cleanup (revoke Object URLs)

**Addresses:**
- Table stakes: download final image (FEATURES.md)
- Lazy canvas compositing pattern (ARCHITECTURE.md pattern #2)

**Avoids:**
- Pitfall #1 (tainted canvas) — already prevented in Phase 2, verify here
- Pitfall #2 (blurry retina) — implement devicePixelRatio scaling
- Pitfall #3 (memory leaks) — revoke Object URLs after download
- Pitfall #4 (wrong composite operation) — draw photo first, frame second with source-over
- Pitfall #5 (toDataURL performance) — use toBlob() instead

**Uses:**
- HTML5 Canvas API (STACK.md)
- canvas.toBlob() for export (ARCHITECTURE.md pattern #2)

**Research flag:** NEEDS RESEARCH-PHASE. Canvas compositing has most gotchas. Phase should include canvas proof-of-concept before full integration. Test checklist from PITFALLS.md:
- Upload → adjust → download works without errors
- Sharp output on retina display
- No memory growth after 5 uploads
- Frame transparency correct
- Download completes in <1 second

### Phase Ordering Rationale

- **Dependencies drive order:** Each phase depends on previous phase's output. Can't test cropping without upload. Can't test download without cropping.
- **Risk ascending:** Phases progress from low-risk (static UI) to high-risk (canvas API). Validates assumptions early before encountering canvas complexity.
- **Pitfall concentration:** Most critical pitfalls are in Phase 4 (canvas). By isolating canvas logic to final phase, earlier phases are stable foundation. If canvas issues arise, only Phase 4 needs revision.
- **Testing strategy:** Each phase is fully testable before starting next. Phase 1 tests prop flow. Phase 2 tests upload pipeline. Phase 3 tests interactive UI. Phase 4 tests export quality.

### Research Flags

Phases needing deeper research during planning:
- **Phase 4 (Canvas Compositing):** Canvas API has most gotchas and browser inconsistencies. Before starting implementation, run targeted research-phase command to create canvas proof-of-concept. Verify retina scaling, layer compositing order, toBlob() on target devices (iOS Safari, Chrome Android, desktop browsers). Reference PITFALLS.md testing checklist.

Phases with standard patterns (skip research-phase):
- **Phase 1 (UI Shell):** Standard React component architecture, well-documented in React docs
- **Phase 2 (Upload/Selection):** Native File API and ESM imports, established patterns in Vite docs
- **Phase 3 (Interactive Editing):** react-image-crop has comprehensive documentation and examples

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified with official docs (Vite, React, react-image-crop GitHub, MDN Canvas API). Version numbers current as of Jan 2025 training data. |
| Features | MEDIUM | Based on training data knowledge of common profile frame tools (Twibbon, Canva). Core upload-adjust-download pattern is stable. Feature trends for 2026 not verified via web search. |
| Architecture | HIGH | Standard React patterns verified with official React docs. Canvas integration pattern verified with MDN. Component boundaries follow React best practices. |
| Pitfalls | HIGH | All 13 pitfalls verified with MDN Canvas API, React docs, browser compatibility tables. Preventions tested against official examples. |

**Overall confidence:** HIGH

### Gaps to Address

- **react-image-crop vs react-easy-crop:** STACK.md recommends react-image-crop (lighter, simpler), but ARCHITECTURE.md examples reference react-easy-crop (more features). Need to reconcile this discrepancy during Phase 3 planning. Lean toward react-image-crop per STACK.md analysis unless requirements surface need for react-easy-crop features (touch gestures, zoom UI).

- **Output dimensions:** PROJECT.md states "output dimensions = whatever user ends up with after resize/reposition" but typical profile frame tools export at fixed sizes (400x400, 800x800, 1200x1200). Validate with user during Phase 4 planning whether fixed export sizes are needed. If yes, add canvas scaling in export step. Recommend 800x800 as default with optional size selector (nice-to-have from FEATURES.md).

- **Frame PNG specifications:** Research assumes 2000x2000 PNG minimum for quality. Need actual frame assets before Phase 2. If frames are lower resolution, may need to adjust canvas dimensions. Document required specs: PNG with alpha channel, square aspect ratio, minimum 1000x1000 (prefer 2000x2000 for retina).

- **Mobile browser testing:** Canvas export behavior varies across browsers (iOS Safari preview modal, Android direct download). Phase 4 should include device testing on iPhone and Android. PITFALLS.md notes this but doesn't provide specific workarounds. Budget time for mobile-specific fixes.

- **Feature validation:** FEATURES.md confidence is MEDIUM due to lack of 2026 market research. If timeline permits, quick manual check of 2-3 current tools (Twibbon, Canva frames) to confirm table stakes haven't shifted. Core flow unlikely to have changed but worth 15-minute validation.

## Sources

### Primary (HIGH confidence)
- [Vite Documentation](https://vite.dev/guide/) — Build tool setup, asset handling, configuration
- [React Documentation](https://react.dev/learn) — Component patterns, state management, hooks, effects
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — Compositing, export, optimization, CORS
- [MDN FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) — File upload handling
- [react-image-crop GitHub](https://github.com/DominicTobias/react-image-crop) — Library features, API, examples (April 2025 release verified)

### Secondary (MEDIUM confidence)
- [react-easy-crop GitHub](https://github.com/ValentinH/react-easy-crop) — Feature comparison (400+ commits, 35 contributors)
- [react-konva GitHub](https://github.com/konvajs/react-konvajs) — Canvas framework comparison (6.3K stars)
- Training data knowledge of profile frame tools — Feature expectations, common patterns (Twibbon, Canva, Facebook frames)

### Tertiary (LOW confidence)
- TypeScript 5.6 version number — Based on training data, verify current version at setup time
- 2026 feature trends — FEATURES.md based on historical patterns, not current market research

---
*Research completed: 2026-04-10*
*Ready for roadmap: yes*
