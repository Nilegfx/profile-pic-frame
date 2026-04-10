# Phase 2: Upload & Frame Selection - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the upload button and frame thumbnails so they actually work: user selects a photo → it loads as a `Konva.Image` on `photoLayer`; user clicks a frame thumbnail → the frame PNG loads as a `Konva.Image` on `frameLayer`. Both images are visible composited on the 500×500 Konva stage. No scaling or repositioning yet — that's Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Photo fit on load
- **D-01:** Photo is placed at its **natural pixel size**, centered on the canvas. Offset point set to `x: 250, y: 250` (stage center) so the photo appears centered regardless of its dimensions.
- **D-02:** No scaling applied at upload time — user will scale in Phase 3 via sliders.

### Frame loading
- **D-03:** Frames load **at selection time** (lazy) via `Konva.Image.fromURL('frame-N.png')`. No preloading on page start.
- **D-04:** When user selects a different frame, the previous frame `Konva.Image` is **removed** from `frameLayer` and replaced with the newly loaded one. Only one frame visible at a time.
- **D-05:** Frame is sized to fill the full 500×500 stage (width: 500, height: 500) and placed at x: 0, y: 0 — frames are designed as full-canvas overlays.

### File validation / error UX
- **D-06:** Use the `accept` attribute on the file input to **prevent** unsupported files from being selected in the OS file picker (`accept="image/png, image/jpeg"` — already present in Phase 1 shell). No in-app error message needed; the OS picker filters at the source.
- **D-07:** If a file somehow slips through (e.g., drag-drop bypass), silently do nothing — do not modify the canvas, do not show an error. Leave photo unchanged.

### Upload behavior
- **D-08:** A second photo upload **replaces** the existing photo on `photoLayer`. Canvas is cleared of the old photo node before the new one is added.
- **D-09:** When user re-uploads a photo, any **selected frame stays** on `frameLayer` — frame selection is not reset by a new photo upload.

### State updates
- **D-10:** After photo loads: set `state.photoImage` to the new `Konva.Image` node and hide the empty-state placeholder (`background` rect and `placeholderText`).
- **D-11:** After frame loads: set `state.frameImage` to the new `Konva.Image` node.

### Claude's Discretion
- Exact Konva node positioning math (offsetX/offsetY vs x/y centering approach)
- Whether to destroy or simply remove old `Konva.Image` nodes on replacement
- Loading indicator (if any) while images load

</decisions>

<specifics>
## Specific Ideas

- File validation is handled at the OS level via `accept` attribute — the user explicitly said to prevent uploads of unsupported extensions, not to show error messages after the fact.
- Frame thumbnails in the UI already show the actual PNG previews (from `discoverFrames()` in Phase 1) — clicking them should feel instant even with lazy loading, since the images are local files.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project constraints
- `CLAUDE.md` — Stack constraints: native Konva.js + single `index.html`, no React, no build step, no CDN
- `.planning/REQUIREMENTS.md` — UPL-01, UPL-02, UPL-03, FRM-01, FRM-02, FRM-03 (Phase 2 requirements)
- `.planning/ROADMAP.md` — Phase 2 success criteria and suggested plan breakdown

### Phase 1 output (what this phase wires up)
- `.planning/phases/01-foundation-ui-shell/01-CONTEXT.md` — D-12 through D-14: stage container ID, app state object shape, layer architecture (photoLayer bottom, frameLayer top)
- `index.html` — Live code: existing HTML element IDs (`#photo-upload`, `#upload-btn`, `#frame-picker`, `#stage-container`), existing JS (`state`, `stage`, `photoLayer`, `frameLayer`, `discoverFrames()`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `discoverFrames()` in `index.html` — already probes for `frame-N.png` files and builds thumbnails with click handlers that set `state.selectedFrame = frameId`. Phase 2 should **extend** these click handlers (or replace them) to also trigger the actual `Konva.Image.fromURL` load.
- `state` object — `photoImage`, `frameImage`, `selectedFrame`, `photoScale`, `frameScale` all declared and ready to populate.
- `photoLayer`, `frameLayer` — initialized and added to stage. Phase 2 adds `Konva.Image` nodes to these layers.
- `background` (Konva.Rect, fill `#F5F5F5`) and `placeholderText` (Konva.Text) — the empty state elements on `photoLayer`. Should be hidden/removed once a photo is loaded.

### Established Patterns
- Vanilla JS event listeners with `document.getElementById()` — established in Phase 1 (upload button click). Phase 2 follows same pattern.
- `state` object as the single source of truth for app state — set fields, don't create new globals.
- `photoLayer.draw()` / `frameLayer.draw()` — explicit redraw pattern; must be called after adding/modifying nodes.

### Integration Points
- `#photo-upload` change event → `FileReader` → `Konva.Image.fromURL` → `photoLayer`
- `.frame-thumbnail` click handler (currently in `discoverFrames()`) → `Konva.Image.fromURL(frameId + '.png')` → `frameLayer`
- Phase 3 will read `state.photoImage` and `state.frameImage` to apply scale transforms

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-upload-frame-selection*
*Context gathered: 2026-04-10*
