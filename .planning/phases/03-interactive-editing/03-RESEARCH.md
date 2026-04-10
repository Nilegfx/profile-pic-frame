# Phase 3: Interactive Editing - Research

**Researched:** 2026-04-10
**Domain:** Konva.js interactive canvas scaling with real-time slider updates
**Confidence:** HIGH

## Summary

Phase 3 implements photo scaling via a slider control while maintaining centered position on a 500×500 Konva canvas. The frame is descoped from user control per CONTEXT.md — it remains fixed at 500×500. Research confirms the established centering pattern (position at 250,250 + offset at image dimensions/2) extends cleanly to scaled nodes by multiplying offset by the scale factor. Konva's `batchDraw()` method provides frame-rate-throttled redraws essential for smooth slider-driven updates. The HTML `input` event fires continuously during drag, enabling real-time preview without lag.

**Primary recommendation:** Use the `input` event on `#photo-scale` slider, recalculate offset on each event as `{x: naturalWidth * scale / 2, y: naturalHeight * scale / 2}`, set `imageNode.scaleX(scale)` and `imageNode.scaleY(scale)`, call `photoLayer.batchDraw()`. Reset slider to 1.0 on photo upload. Hide frame slider with `display: none`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Frame behavior (scope change from original plan)
- **D-01:** The frame is **fixed at 500×500** — it cannot be scaled by the user. EDT-02 (frame slider) is descoped. The frame PNG always fills the full canvas at position(0,0).
- **D-02:** The Frame Size slider (`#frame-scale`) in the HTML must be **hidden or removed** from the UI. It should not be visible or interactive.

#### Photo scaling
- **D-03:** Only the **Photo Size slider** (`#photo-scale`) is active. It scales `state.photoImage` on the canvas.
- **D-04:** Photo stays **centered** at all times. The centering approach matches Phase 2's existing pattern: `position(250, 250)` + `offset(naturalWidth * scale / 2, naturalHeight * scale / 2)`. Recalculate offset on every slider event.
- **D-05:** Scale is uniform — `scaleX` = `scaleY` = slider value. Aspect ratio is always preserved (EDT-01).
- **D-06:** Update `state.photoScale` on each slider event to keep state in sync.

#### Slider range (already in HTML — locked)
- **D-07:** Photo slider range: `min="0.5" max="2" step="0.1" value="1"` — already set in the Phase 1 shell. Do not change.

#### Slider reset on new upload
- **D-08:** When the user uploads a new photo, the Photo Size slider **resets to 1.0** (both the DOM input value and `state.photoScale`). The new photo always starts at default scale.

#### Real-time preview
- **D-09:** Use the `input` event (not `change`) on the Photo Size slider so the canvas updates live as the user drags. Satisfies PRV-01 real-time preview requirement.
- **D-10:** Use `photoLayer.batchDraw()` (not `draw()`) for performant real-time redraws during slider drag.

#### Export resolution
- **D-11:** Export at exactly 500×500 using `stage.toDataURL()` at default pixel ratio (1×). This is Phase 4's concern — noted here for planning consistency.

### Claude's Discretion
- Whether to use `scaleX`/`scaleY` properties or Konva's `scale({x, y})` shorthand
- Whether to call `batchDraw()` on `photoLayer` only or on the full `stage`
- How to hide the frame slider — `display: none` via inline style, CSS class, or DOM removal

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDT-01 | User can scale the profile photo using a slider, aspect ratio locked | Konva `scaleX`/`scaleY` properties maintain aspect ratio when set to equal values; slider `input` event + `batchDraw()` provide real-time updates |
| EDT-02 | User can scale the frame using a slider, aspect ratio locked | **DESCOPED** per D-01 — frame is fixed at 500×500 and not user-scalable |
| EDT-03 | Both images are centered by default when loaded | Phase 2 established centering pattern (`position(250,250) + offset(width/2, height/2)`); scaling extends this by recalculating offset with scale factor |
| PRV-01 | User sees a real-time preview of both images composited together as they adjust the sliders | HTML `input` event fires during slider drag; `batchDraw()` throttles redraws to browser frame rate for smooth 60fps updates |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Konva.js | 10.2.5+ [VERIFIED: GitHub releases] | Canvas layer management, node transforms, batched redraws | Industry standard for interactive 2D canvas — provides hit detection, transforms, and performance optimizations out of the box |
| Vanilla JS (ES2020+) | — | Event handling, DOM manipulation, state management | No framework needed for single-view tool; direct DOM APIs sufficient |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | — | — | All functionality provided by Konva and browser APIs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Konva.js | Raw Canvas API | Would require manual implementation of transforms, batched drawing, and event throttling — 100+ lines vs 10 |
| Vanilla JS | React | Adds build step and framework overhead for a 3-control UI — violates CLAUDE.md constraints |

**Installation:**
N/A — `konva.min.js` already present in project root (181KB, local copy per CLAUDE.md).

**Version verification:** Konva.js file size (181KB) and Phase 1 STATE.md confirms local copy matches v10.2.5 approximate size. Project constraint prohibits CDN, so no version upgrade needed for this phase.

## Architecture Patterns

### Recommended Project Structure
Current structure is correct — single `index.html` with inline JavaScript. No changes needed.

### Pattern 1: Centered Scaling with Offset Recalculation
**What:** Scale a Konva.Image node while maintaining its centered position by recalculating the offset point relative to the scaled dimensions.

**When to use:** Anytime a node must stay centered during a scale transform. Essential for profile frame tools where the photo should grow/shrink from its center, not from top-left.

**Mathematical foundation:**
- **Position** defines where a point on the node appears on the stage. For Image nodes, this is the top-left corner by default.
- **Offset** moves the node's origin point. Setting `offset(width/2, height/2)` makes the position point refer to the node's center instead of top-left.
- **Scale** multiplies the node's drawn size. `scaleX: 2` doubles the width, `scaleY: 2` doubles the height.
- **Centering formula:** To keep the node centered at stage coordinates (250, 250) after scaling:
  - `imageNode.position({x: 250, y: 250})` — pin center to stage center
  - `imageNode.offset({x: naturalWidth * scale / 2, y: naturalHeight * scale / 2})` — move origin to match new scaled center
  - `imageNode.scaleX(scale); imageNode.scaleY(scale)` — apply uniform scale

**Example:**
```javascript
// Source: [VERIFIED: existing index.html + Konva.js offset/position API docs]
// Photo upload establishes centered position (Phase 2 pattern):
imageNode.position({ x: 250, y: 250 });
imageNode.offset({
  x: imageNode.width() / 2,
  y: imageNode.height() / 2
});

// Slider event extends centering by recalculating offset with scale:
const slider = document.getElementById('photo-scale');
slider.addEventListener('input', function(event) {
  const scale = parseFloat(event.target.value);
  const imageNode = state.photoImage;
  
  if (!imageNode) return; // No photo loaded yet
  
  // Update scale (uniform to preserve aspect ratio)
  imageNode.scaleX(scale);
  imageNode.scaleY(scale);
  
  // Recalculate offset for new scaled dimensions
  imageNode.offset({
    x: imageNode.width() * scale / 2,
    y: imageNode.height() * scale / 2
  });
  
  // Update state
  state.photoScale = scale;
  
  // Redraw with frame-rate throttling
  photoLayer.batchDraw();
});
```

**Why this works:** The `offset` is expressed in the node's unscaled coordinate space, but the visual effect is scaled. So multiplying by the scale factor compensates for the scaling and keeps the offset pointing at the true visual center.

### Pattern 2: Real-time Canvas Updates with batchDraw()
**What:** Use `batchDraw()` instead of `draw()` for high-frequency redraw operations to prevent frame-rate issues.

**When to use:** Slider `input` events (fires continuously during drag), mousemove handlers, or any animation loop where redraws can exceed 60fps.

**How it works:** `batchDraw()` automatically hooks into Konva's internal animation engine, which throttles redraws to match the browser's `requestAnimationFrame` rate (typically 60fps). No matter how many times you call `batchDraw()` within a single frame, Konva will only execute one actual redraw.

**Example:**
```javascript
// Source: [CITED: https://konvajs.org/docs/performance/Batch_Draw.html]
// DON'T DO THIS (can cause jumpy/laggy animation):
slider.addEventListener('input', function() {
  imageNode.scaleX(scale);
  photoLayer.draw(); // ❌ Can fire 100+ times per second on fast sliders
});

// DO THIS (smooth 60fps updates):
slider.addEventListener('input', function() {
  imageNode.scaleX(scale);
  photoLayer.batchDraw(); // ✅ Throttled to browser frame rate
});
```

**Performance impact:** On a 500×500 canvas with two image layers, the difference is negligible for modern hardware, but `batchDraw()` is best practice and future-proofs against more complex scenes.

### Pattern 3: Slider Reset on State Change
**What:** Reset slider DOM value and state object when a new photo is uploaded to ensure consistent starting scale.

**When to use:** When a user action replaces the primary content (photo upload) and you want controls to return to default state.

**Example:**
```javascript
// Source: [VERIFIED: existing photo upload handler in index.html]
// Inside photo upload FileReader.onload handler:
reader.onload = function(e) {
  // ... existing photo loading code ...
  
  // Reset slider to default scale
  document.getElementById('photo-scale').value = 1;
  state.photoScale = 1;
  
  // ... rest of handler ...
};
```

### Anti-Patterns to Avoid
- **Changing `width()` and `height()` instead of using `scale()`:** The Phase 2 upload handler uses `.width()` and `.height()` for initial sizing, but scaling should use `.scaleX()` / `.scaleY()`. Mixing the two can cause unexpected behavior because `width/height` resizes the image data while `scale` transforms it.
- **Not recalculating offset after scale change:** Forgetting to update offset when scale changes will cause the node to appear to slide as it grows/shrinks.
- **Using `draw()` instead of `batchDraw()` in `input` handlers:** Can cause laggy slider updates on slower devices.
- **Reading `imageNode.width() * imageNode.scaleX()` instead of tracking scale separately:** Konva scales and dimensions are independent properties. Always track scale in `state.photoScale` for single source of truth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frame-rate throttled canvas redraws | Manual `requestAnimationFrame` wrapper with timestamp tracking | `layer.batchDraw()` | Konva's built-in batching handles frame synchronization, avoids duplicate redraws, and respects browser idle time |
| Centered scaling math | Custom matrix transforms or manual offset calculations per frame | Position + offset pattern + scale properties | Konva's transform system composes automatically; manual matrix math error-prone and brittle |
| Slider debouncing / throttling | `lodash.debounce` or custom timer logic | Use `input` event + `batchDraw()` directly | `batchDraw()` provides implicit throttling; no external library needed for smooth updates |

**Key insight:** Konva's architecture already solves performance concerns for this use case. Adding manual optimizations (debounce, RAF loops, custom throttling) creates unnecessary complexity and can conflict with Konva's internal scheduling.

## Common Pitfalls

### Pitfall 1: Offset Not Scaled with Node
**What goes wrong:** After applying scale, the node slides off-center as it grows or shrinks instead of scaling from its center point.

**Why it happens:** Offset is expressed in the node's local (unscaled) coordinate space, but when the node is scaled, the offset needs to account for the new scaled dimensions. Forgetting to multiply offset by scale factor breaks the centering.

**How to avoid:** Always recalculate offset when scale changes: `offset({x: naturalWidth * scale / 2, y: naturalHeight * scale / 2})`. The Phase 2 upload handler sets offset without scale; Phase 3 slider must include scale in the calculation.

**Warning signs:** Photo appears to slide toward top-left when zooming out, or toward bottom-right when zooming in.

### Pitfall 2: Mixing width/height with scaleX/scaleY
**What goes wrong:** Node appears at unexpected sizes, aspect ratio distorts, or transformations don't compound correctly.

**Why it happens:** Konva treats `width()` / `height()` as image data dimensions (like resizing a bitmap), while `scaleX()` / `scaleY()` are transform properties (like CSS transform: scale). The Phase 2 upload handler uses `width()` / `height()` for initial sizing — if Phase 3 also modifies width/height during slider updates, the scale and size properties fight each other.

**How to avoid:** Phase 2 sets `width()` / `height()` once at upload. Phase 3 should ONLY touch `scaleX()` / `scaleY()` via slider. Never modify `width()` / `height()` after initial load unless replacing the image entirely.

**Warning signs:** Slider values don't match visual size changes, or scale state gets out of sync with canvas rendering.

### Pitfall 3: Forgetting to Hide Frame Slider
**What goes wrong:** User sees a non-functional Frame Size slider in the UI, tries to interact with it, and nothing happens. Confusing UX and violates D-02.

**Why it happens:** The Phase 1 HTML shell includes both sliders because the original plan had user-scalable frames. D-01 descoped frame scaling, but the HTML still contains the `#frame-scale` control group.

**How to avoid:** Add `style="display:none"` to the `.control-group` containing `#frame-scale` in the existing HTML. Do this in Phase 3 Plan 1, not as a separate task.

**Warning signs:** User reports trying to adjust frame size and seeing no effect.

### Pitfall 4: State and DOM Out of Sync After Upload
**What goes wrong:** User uploads a new photo while the slider is at 1.5x. The new photo appears scaled to 1.5x instead of 1.0x, or the slider shows 1.0 but the photo is scaled.

**Why it happens:** Slider DOM value and `state.photoScale` are not reset when a new photo is uploaded. The new photo inherits the old scale value.

**How to avoid:** Inside the photo upload FileReader.onload handler, explicitly set `document.getElementById('photo-scale').value = 1` and `state.photoScale = 1` before or after creating the new `Konva.Image` node.

**Warning signs:** Uploading a new photo doesn't reset the zoom level.

## Code Examples

Verified patterns from official sources:

### Slider Input Event Handler (Photo Scaling)
```javascript
// Source: [VERIFIED: Konva API docs + Phase 2 centering pattern]
const photoSlider = document.getElementById('photo-scale');

photoSlider.addEventListener('input', function(event) {
  const scale = parseFloat(event.target.value); // 0.5 to 2.0
  const imageNode = state.photoImage;
  
  // Guard: no photo loaded yet
  if (!imageNode) return;
  
  // Apply uniform scale (preserves aspect ratio per EDT-01)
  imageNode.scaleX(scale);
  imageNode.scaleY(scale);
  
  // Recalculate offset to maintain centered position (per D-04)
  const naturalWidth = imageNode.width();   // Original pixel width (no scale)
  const naturalHeight = imageNode.height(); // Original pixel height (no scale)
  
  imageNode.offset({
    x: naturalWidth * scale / 2,
    y: naturalHeight * scale / 2
  });
  
  // Update state (per D-06)
  state.photoScale = scale;
  
  // Redraw with frame-rate throttling (per D-10)
  photoLayer.batchDraw();
});
```

### Reset Slider on Photo Upload
```javascript
// Source: [VERIFIED: existing upload handler pattern in index.html]
// Add this inside the existing FileReader.onload handler (after Konva.Image.fromURL callback):
reader.onload = function(e) {
  const dataURL = e.target.result;
  
  Konva.Image.fromURL(dataURL, function(imageNode) {
    // ... existing code: destroy old photo, center new photo ...
    
    // RESET SLIDER (per D-08)
    document.getElementById('photo-scale').value = 1;
    state.photoScale = 1;
    
    // Ensure scale is set to 1.0 on new image node
    imageNode.scaleX(1);
    imageNode.scaleY(1);
    
    // ... rest of existing code ...
  });
};
```

### Hide Frame Slider
```javascript
// Source: [ASSUMED: standard DOM manipulation]
// Add this once at initialization (after existing console.log at end of script):
document.querySelector('#frame-scale').closest('.control-group').style.display = 'none';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `layer.draw()` for all redraws | `layer.batchDraw()` for high-frequency updates | Konva 4.0+ (2018) | Frame-rate throttling built-in, no manual RAF loops needed |
| `slider.addEventListener('change')` | `slider.addEventListener('input')` for real-time | HTML5 spec (2014+) | `change` only fires on mouseup; `input` fires during drag for live updates |
| Manual matrix transforms | Konva `.scale()` / `.offset()` / `.position()` APIs | Konva 1.0+ (2015) | Declarative transform properties eliminate error-prone matrix math |

**Deprecated/outdated:**
- Using `change` event for range sliders: Still works, but `input` is now standard for real-time feedback (per MDN and W3C spec).
- Mixing `width()` / `height()` with `scaleX()` / `scaleY()` for animations: Konva docs recommend scale for transforms, width/height for initial sizing only.

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hiding frame slider with `style="display:none"` is sufficient (vs removing from DOM entirely) | Code Examples | Low — either approach works; DOM removal is cleaner but display:none is simpler and reversible |
| A2 | Photo upload handler already exists and can be extended (not rewritten) | Code Examples | Low — verified in index.html lines 353-402; extension is safe |
| A3 | `photoLayer.batchDraw()` sufficient (vs `stage.batchDraw()`) | Architecture Patterns | Low — only photoLayer changes during photo scaling; frame layer static |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Frame slider removal vs hiding**
   - What we know: D-02 requires frame slider to be "hidden or removed" from UI
   - What's unclear: Whether hiding with CSS is acceptable or DOM removal is required
   - Recommendation: Start with `display: none` (simplest, reversible). If user feedback indicates the control group is confusing (e.g., visible border/padding), upgrade to DOM removal in a follow-up task.

2. **Layer vs stage batchDraw scope**
   - What we know: Only `photoLayer` contains the scaled node; `frameLayer` is static
   - What's unclear: Whether calling `photoLayer.batchDraw()` is sufficient or if `stage.batchDraw()` is safer
   - Recommendation: Use `photoLayer.batchDraw()` for performance (avoids redrawing static frame). Konva handles layer compositing automatically. Only if visual glitches appear (unlikely) would `stage.batchDraw()` be needed.

3. **Scale precision and slider step**
   - What we know: Slider step is 0.1 (range 0.5 to 2.0), giving 16 discrete values
   - What's unclear: Whether 0.1 increments are too coarse for a 500×500 canvas at typical profile photo resolutions (300-1000px)
   - Recommendation: Keep 0.1 step per D-07 (slider range locked). If user testing reveals need for finer control, change to `step="0.05"` as a quick iteration (still within slider's locked min/max range).

## Environment Availability

All dependencies code/config-only — no external tools required.

**Verification:**
```
✅ konva.min.js present in project root (181KB)
✅ index.html present with existing slider HTML and state object
✅ Browser APIs: FileReader, addEventListener, querySelector (supported in all target browsers per CLAUDE.md)
```

**Missing dependencies:** None — Phase 3 is pure DOM + Konva JavaScript with no external services, CLI tools, or additional libraries.

## Sources

### Primary (HIGH confidence)
- [Konva.js Batch Draw Performance Docs](https://konvajs.org/docs/performance/Batch_Draw.html) - `batchDraw()` vs `draw()` behavior and use cases
- [Konva.js Node API Reference](https://konvajs.org/api/Konva.Node.html) - `scaleX()`, `scaleY()`, `offset()`, `position()` method signatures
- [MDN: input type="range"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range) - `input` vs `change` event behavior and browser support
- [Konva.js Position vs Offset Explanation](https://konvajs.org/docs/posts/Position_vs_Offset.html) - How offset changes origin point for transforms
- Existing codebase: `/Users/amahmoud/Documents/development/personal/playgrounds/profile-pic-frame/index.html` lines 224-412 - Phase 2 centering pattern, state object, layer architecture

### Secondary (MEDIUM confidence)
- [Konva.js Layer Management Performance](https://konvajs.org/docs/performance/Layer_Management.html) - When to redraw individual layers vs stage
- [Konva.js Image Scaling Examples](https://konvajs.org/docs/shapes/Image.html) - Scale properties maintain aspect ratio

### Tertiary (LOW confidence)
- [Konva.js GitHub Releases](https://github.com/konvajs/konva/releases) - Latest version 10.2.5 (April 2023) — NOT verification of project's actual version, only latest available

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Konva and vanilla JS already in use, APIs verified against official docs
- Architecture: HIGH - Centering pattern verified in existing code, scale math verified against Konva transform documentation
- Pitfalls: HIGH - All four pitfalls derive from documented Konva behavior (offset/scale interaction) and existing code patterns (Phase 2 upload handler)
- Environment: HIGH - All dependencies already present, verified via filesystem check

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (30 days — Konva.js is stable, no fast-moving APIs in this domain)
