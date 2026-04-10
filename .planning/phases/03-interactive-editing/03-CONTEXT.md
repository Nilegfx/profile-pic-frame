# Phase 3: Interactive Editing - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the Photo Size slider so users can scale their uploaded photo in real-time while it stays centered on the 500×500 canvas. The frame is **fixed** — it always fills 500×500 and is not user-scalable. The Frame Size slider already in the HTML must be hidden or removed. Download exports at exactly 500×500 (1× pixel ratio).

</domain>

<decisions>
## Implementation Decisions

### Frame behavior (scope change from original plan)
- **D-01:** The frame is **fixed at 500×500** — it cannot be scaled by the user. EDT-02 (frame slider) is descoped. The frame PNG always fills the full canvas at position(0,0).
- **D-02:** The Frame Size slider (`#frame-scale`) in the HTML must be **hidden or removed** from the UI. It should not be visible or interactive.

### Photo scaling
- **D-03:** Only the **Photo Size slider** (`#photo-scale`) is active. It scales `state.photoImage` on the canvas.
- **D-04:** Photo stays **centered** at all times. The centering approach matches Phase 2's existing pattern: `position(250, 250)` + `offset(naturalWidth * scale / 2, naturalHeight * scale / 2)`. Recalculate offset on every slider event.
- **D-05:** Scale is uniform — `scaleX` = `scaleY` = slider value. Aspect ratio is always preserved (EDT-01).
- **D-06:** Update `state.photoScale` on each slider event to keep state in sync.

### Slider range (already in HTML — locked)
- **D-07:** Photo slider range: `min="0.5" max="2" step="0.1" value="1"` — already set in the Phase 1 shell. Do not change.

### Slider reset on new upload
- **D-08:** When the user uploads a new photo, the Photo Size slider **resets to 1.0** (both the DOM input value and `state.photoScale`). The new photo always starts at default scale.

### Real-time preview
- **D-09:** Use the `input` event (not `change`) on the Photo Size slider so the canvas updates live as the user drags. Satisfies PRV-01 real-time preview requirement.
- **D-10:** Use `photoLayer.batchDraw()` (not `draw()`) for performant real-time redraws during slider drag.

### Export resolution
- **D-11:** Export at exactly 500×500 using `stage.toDataURL()` at default pixel ratio (1×). This is Phase 4's concern — noted here for planning consistency.

### Claude's Discretion
- Whether to use `scaleX`/`scaleY` properties or Konva's `scale({x, y})` shorthand
- Whether to call `batchDraw()` on `photoLayer` only or on the full `stage`
- How to hide the frame slider — `display: none` via inline style, CSS class, or DOM removal

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project constraints
- `CLAUDE.md` — Stack constraints: native Konva.js + single `index.html`, no React, no build step
- `.planning/REQUIREMENTS.md` — EDT-01, EDT-02 (descoped), EDT-03, PRV-01 (Phase 3 requirements)
- `.planning/ROADMAP.md` — Phase 3 success criteria and suggested plan breakdown

### Prior phase context (locked decisions)
- `.planning/phases/01-foundation-ui-shell/01-CONTEXT.md` — D-13: state object shape (`photoScale`, `frameScale`); D-14: layer architecture
- `.planning/phases/02-upload-frame-selection/02-CONTEXT.md` — D-01/D-02: photo centering pattern (position 250,250 + offset); D-05: frame at (0,0) 500×500

### Live code (must read before implementing)
- `index.html` — Current slider HTML (`#photo-scale`, `#frame-scale`), existing photo upload handler (centering logic to extend), `state` object, `photoLayer`/`frameLayer` references

</canonical_refs>

<specifics>
## Specific Ideas

- The photo upload handler in Phase 2 already does `imageNode.offset({x: w/2, y: h/2})` + `imageNode.position({x: 250, y: 250})`. The slider handler should follow the exact same centering formula, just multiplied by the scale factor.
- Hiding the frame slider: simplest approach is adding `style="display:none"` to the `#frame-scale` control group, or removing the HTML element entirely since it serves no function.
- Resetting the slider on upload: `document.getElementById('photo-scale').value = 1` + `state.photoScale = 1` in the photo upload handler (alongside the existing node replacement logic).

</specifics>

<deferred>
## Deferred Ideas

- **Frame scaling (EDT-02)** — User decided the frame is fixed. If needed later, it would require re-centering frame from (0,0) to (250,250) with offset(250,250).
- **Retina export** — User chose 1× export for simplicity. If higher quality is needed, `pixelRatio: window.devicePixelRatio` or `pixelRatio: 2` can be passed to `stage.toDataURL()`.
- **Drag to reposition photo** — Out of scope for Phase 3. Would require enabling draggable on the photo node.

</deferred>

---

*Phase: 03-interactive-editing*
*Context gathered: 2026-04-10*
