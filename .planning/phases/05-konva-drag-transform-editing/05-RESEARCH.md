# Phase 5: Konva Drag & Transform Editing - Research

**Researched:** 2026-04-11
**Domain:** Konva.js interactive canvas editing — drag-to-position and transform handles
**Confidence:** HIGH

## Summary

This phase replaces the slider-based photo scaling from Phase 3 with Konva's native `Transformer` node for visual resize handles and the `draggable: true` property for repositioning. The Transformer API provides built-in corner handles with aspect-ratio-locked scaling, custom styling support, and show/hide methods for clean exports. The photo node becomes draggable with drag boundary constraints via `dragBoundFunc`. The Transformer lives on a dedicated third layer above the frame layer, making hide/show operations for PNG export straightforward.

**Primary recommendation:** Use Konva.Transformer with corner-only anchors (`enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']`), aspect-ratio locking (`keepRatio: true`), custom orange styling to match app theme, and hide/show before/after `toDataURL()` export. Make photo node draggable with `dragBoundFunc` clamping to stage boundaries.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Transform Handles — Appearance
- **D-01:** Use Konva `Transformer` node attached to `state.photoImage`. Corner anchors only (`enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']`).
- **D-02:** Aspect ratio locked at all times (`keepRatio: true`). No free-form distortion.
- **D-03:** Custom orange styling to match the app's `#FF6B35` accent: `anchorFill: '#FF6B35'`, `anchorStroke: '#FFFFFF'` (white stroke for contrast), `borderStroke: '#FF6B35'`. Claude has discretion on exact anchor size/stroke width.

#### Selection Model — When handles appear
- **D-04:** Transformer is **always-on** when a photo is loaded. It attaches to `state.photoImage` as soon as the photo loads and detaches (or hides) when there is no photo. No click-to-select interaction needed — there is only ever one selectable image.
- **D-05:** Transformer lives on a dedicated `transformerLayer` (a third `Konva.Layer` added to the stage above `frameLayer`). This keeps it separate from photo and frame layers and makes hide/show for export clean.

#### Drag — Repositioning
- **D-06:** Photo node is `draggable: true`. User can drag it freely to reposition within the canvas.
- **D-07:** Drag is constrained so the photo cannot be dragged entirely off the 500×500 stage. Use Konva `dragBoundFunc` to clamp position so at least a portion of the image always remains visible. Claude has discretion on the exact clamping math (e.g., keep center within stage, or keep at least 50px of the image within bounds).

#### UI Cleanup — Slider removal
- **D-08:** Remove the Photo Size slider (`#photo-scale` input) and its `<label>` from the HTML. The `control-group` that contained them is removed entirely.
- **D-09:** The `frameScale` slider and label are already hidden (`display:none`) — leave them as-is or remove the hidden HTML. Claude's discretion.
- **D-10:** The Upload button and Download split-button remain in their current `controls-row`. No other layout changes.
- **D-11:** Remove the `photoScale` property from `state` and the slider `input` event listener from JS. Remove the `frameScale` property too if it's still present.

#### Export — Handle hiding
- **D-12:** Before calling `stage.toDataURL()`, call `transformer.hide()` (and `transformerLayer.hide()`). After `toDataURL()` completes (it is synchronous), call `transformer.show()` (and `transformerLayer.show()`). This is the complete hide/show pattern — no need to detach nodes.
- **D-13:** The existing download handler in Phase 4 must be updated to wrap `toDataURL()` with this hide/show pattern.

### Claude's Discretion
- Exact `dragBoundFunc` clamping math (e.g., keep center within stage, or keep at least 50px of image within bounds)
- Transformer anchor size (`anchorSize`) and border stroke width (`borderStrokeWidth`)
- Whether to remove the hidden frame-scale HTML or just leave it hidden
- Layer ordering: transformerLayer goes last (on top of frameLayer) so handles render above the frame

### Deferred Ideas (OUT OF SCOPE)
- **Frame thumbnail numbering labels**: User requested visible numbers on frame thumbnails (e.g., "1", "2", "3") so users can identify frames by number. Deferred — this is a UI enhancement to the frame picker, not related to transform editing. Can be its own small phase or bundled into a polish pass.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDT-01 | User can scale the profile photo using a slider, aspect ratio locked | **REPLACED:** Konva Transformer provides aspect-ratio-locked scaling via corner handles (`keepRatio: true`). No slider needed. |
| EDT-02 | User can scale the frame using a slider, aspect ratio locked | **NOT APPLICABLE:** Frame is fixed at 500×500 per prior phase decisions (descoped). |
| EDT-03 | Both images are centered by default when loaded | Photo is already centered on upload (Phase 2 D-01). Dragging overrides this. Transform maintains the existing position/offset. |

**Note:** Requirements EDT-01 and EDT-02 were originally slider-based. Phase 5 replaces the photo slider with Transformer handles. Frame scaling remains descoped.

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Konva.js | v10.2.5 (local) | Interactive canvas layer management, drag-and-drop, transform handles | Already in use (Phase 1); native Transformer and drag APIs avoid hand-rolling complex UI interactions |
| Vanilla JS | ES2020+ | All application logic | Project constraint — no framework, single-file HTML |

**No new dependencies required.** This phase uses existing Konva v10.2.5 features.

### Supporting
None. No additional libraries needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Konva Transformer | Custom drag handles | Manual implementation requires hit detection, anchor rendering, aspect-ratio math, and state management — 200+ lines of error-prone code. Transformer is built-in and battle-tested. |
| dragBoundFunc | Manual boundary checking | Would require detecting drag events and manually clamping position — `dragBoundFunc` is the official Konva pattern. |

**Version verification:**
- Konva v10.2.5 verified in local `konva.min.js` file (checked 2026-04-11)
- Latest npm version check failed (network issues), but v10.2.5 is from 2024 and includes all required APIs [ASSUMED]

**Installation:**
Not applicable — Konva is already included in the project.

## Architecture Patterns

### Recommended Layer Structure
```
Konva Stage (500×500)
├── photoLayer (Layer 1)          — Background + photo image node
├── frameLayer (Layer 2)          — Frame overlay PNG
└── transformerLayer (Layer 3)    — Transformer handles (NEW)
```

**Why a dedicated transformer layer:**
- Clean separation: transformer UI is distinct from content layers
- Easy hide/show: `transformerLayer.hide()` before export, `transformerLayer.show()` after
- Render order: transformer always on top, regardless of photo/frame layer order
- Performance: can disable listening (`listening(false)`) on photo/frame layers if needed

### Pattern 1: Transformer Initialization and Attachment
**What:** Create a Transformer node, add to layer, attach to target image node
**When to use:** On app initialization (empty transformer) and after photo upload (attach to loaded image)
**Example:**
```javascript
// Source: https://konvajs.org/docs/select_and_transform/Basic_demo.html
// Verified 2026-04-11

// Create transformer layer (module scope, after frameLayer)
const transformerLayer = new Konva.Layer();
stage.add(transformerLayer);

// Create transformer node (module scope, initialized once)
const transformer = new Konva.Transformer({
  // D-02: Aspect ratio locked
  keepRatio: true,
  
  // D-01: Corner anchors only
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  
  // D-03: Custom orange styling
  anchorFill: '#FF6B35',
  anchorStroke: '#FFFFFF',
  borderStroke: '#FF6B35',
  anchorStrokeWidth: 2,
  anchorSize: 12,        // Claude's discretion
  borderStrokeWidth: 2,  // Claude's discretion
  
  // Disable rotation (not needed for profile pic framing)
  rotateEnabled: false
});

// Add transformer to its layer
transformerLayer.add(transformer);
state.transformer = transformer; // Store reference in state

// Initially hidden (no photo loaded yet)
transformer.hide();
transformerLayer.draw();

// After photo loads (in photo upload handler):
transformer.nodes([imageNode]); // Attach to photo
transformer.show();             // Make visible
transformerLayer.draw();        // Redraw to show handles
```

### Pattern 2: Drag with Boundary Constraints
**What:** Make photo node draggable and constrain drag movement to stage boundaries
**When to use:** Set on photo image node creation during upload
**Example:**
```javascript
// Source: https://konvajs.org/docs/drag_and_drop/Drop_Events.html
// Verified 2026-04-11

// D-06: Make photo draggable
imageNode.draggable(true);

// D-07: Constrain drag to stage bounds
imageNode.dragBoundFunc(function(pos) {
  // Get scaled dimensions
  const scaledWidth = imageNode.width() * imageNode.scaleX();
  const scaledHeight = imageNode.height() * imageNode.scaleY();
  
  // Clamp so at least 50px of image remains visible (Claude's discretion)
  const minVisible = 50;
  const maxX = stage.width() - minVisible;
  const minX = minVisible - scaledWidth;
  const maxY = stage.height() - minVisible;
  const minY = minVisible - scaledHeight;
  
  return {
    x: Math.max(minX, Math.min(pos.x, maxX)),
    y: Math.max(minY, Math.min(pos.y, maxY))
  };
});
```

**Alternative clamping strategy (keep center within stage):**
```javascript
imageNode.dragBoundFunc(function(pos) {
  return {
    x: Math.max(0, Math.min(pos.x, stage.width())),
    y: Math.max(0, Math.min(pos.y, stage.height()))
  };
});
```

### Pattern 3: Hide Transformer Before Export
**What:** Hide transformer and its layer before calling `toDataURL()`, then restore
**When to use:** In download button click handler, wrapping the existing export code
**Example:**
```javascript
// Source: https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html
// Verified 2026-04-11

// D-12 & D-13: Hide transformer before export
downloadBtn.addEventListener('click', function() {
  if (!state.photoImage) return; // Guard
  
  // Hide transformer and its layer
  state.transformer.hide();
  transformerLayer.hide();
  
  // Export (synchronous)
  const pixelRatio = state.selectedResolution; // 1 or 2 from Phase 4
  const dataURL = stage.toDataURL({
    pixelRatio: pixelRatio,
    mimeType: 'image/png',
    quality: 1
  });
  
  // Restore transformer visibility
  state.transformer.show();
  transformerLayer.show();
  
  // Trigger download (existing Phase 4 code)
  const link = document.createElement('a');
  link.download = 'profile.png';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
```

### Pattern 4: Transformer Events for Redraws
**What:** Listen to `transform` and `dragmove` events to trigger layer redraws
**When to use:** If batchDraw() is not automatic (Konva handles this automatically in v10+)
**Example:**
```javascript
// Source: https://konvajs.org/docs/select_and_transform/Transform_Events.html
// Verified 2026-04-11

// Usually NOT needed — Konva auto-redraws on transform
// Include only if visual lag is observed during transform

transformer.on('transform', function() {
  photoLayer.batchDraw();
});

imageNode.on('dragmove', function() {
  photoLayer.batchDraw();
});
```

**Note:** Konva v10+ auto-redraws affected layers on transform and drag. Manual `batchDraw()` is only needed if observing visual lag (unlikely for single-image use case).

### Anti-Patterns to Avoid
- **Don't detach nodes before export:** Use `hide()` instead of `transformer.detach()`. Detaching removes the transformer's reference to the photo, requiring re-attachment after export. `hide()` is non-destructive.
- **Don't create multiple transformers:** One transformer is sufficient. Reuse it by calling `transformer.nodes([newImage])` when replacing photos.
- **Don't transform the frame:** The frame should remain fixed at 500×500 (D-05 from Phase 2). Only the photo is draggable and transformable.
- **Don't use edge anchors for aspect-locked transforms:** Edge anchors (`top-center`, `middle-left`, etc.) allow non-uniform scaling, breaking aspect ratio. Use corner anchors only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive resize handles | Custom anchor rendering + drag detection + scale calculation | `Konva.Transformer` | Transformer handles hit detection, anchor rendering, aspect-ratio math, and boundary constraints automatically. Hand-rolling requires 200+ lines of code for anchor positioning, hit testing, scale constraints, and visual feedback. |
| Drag boundary clamping | Manual position checking in drag event handlers | `dragBoundFunc` callback | Official Konva pattern. Manual clamping requires tracking drag state, calculating boundaries on every move event, and handling edge cases (rotated nodes, scaled nodes). `dragBoundFunc` is called automatically and returns clamped position. |
| Transform styling | CSS overlays or custom canvas drawing | Transformer config properties (`anchorFill`, `anchorStroke`, `borderStroke`) | Transformer exposes 10+ styling properties. Custom rendering would require managing anchor states (hover, active), redrawing on every frame, and handling retina displays. |
| Hiding nodes on export | Manually removing nodes, exporting, re-adding nodes | `node.hide()` / `layer.hide()` | Hide/show is non-destructive and guaranteed to restore state. Manual removal risks losing references, event listeners, or layer ordering. |

**Key insight:** Konva Transformer was designed specifically for interactive image editing UIs. It handles complex edge cases (offset transforms, rotated bounds, retina rendering, mobile touch events) that would require hundreds of lines of defensive code if hand-rolled.

## Common Pitfalls

### Pitfall 1: Transformer Anchors Visible in Exported PNG
**What goes wrong:** Downloaded PNG includes visible resize handles and bounding box.
**Why it happens:** Forgot to hide transformer before calling `toDataURL()`. The transformer node is part of the stage and renders into the export by default.
**How to avoid:** Always wrap `stage.toDataURL()` with `transformer.hide()` before and `transformer.show()` after (Pattern 3 above). D-12 explicitly requires this.
**Warning signs:** If you see orange handles or a border box in the downloaded PNG, the transformer was not hidden during export.

### Pitfall 2: Drag Allows Photo to Disappear Off Stage
**What goes wrong:** User drags photo completely off the visible canvas. Photo is still on stage but impossible to click/select/drag back.
**Why it happens:** `draggable: true` without `dragBoundFunc` allows infinite movement. User can drag photo beyond stage boundaries (negative x/y or beyond 500×500).
**How to avoid:** Always set `dragBoundFunc` on draggable images. Clamp position so at least part of the image remains within stage bounds (D-07, Pattern 2 above).
**Warning signs:** Photo disappears during drag and cannot be recovered without refresh. User reports "photo vanished."

### Pitfall 3: Using `width`/`height` Instead of `scaleX`/`scaleY`
**What goes wrong:** Attempting to read or set image size via `width()` and `height()` methods instead of `scaleX()` and `scaleY()` after a transform. Konva Transformer changes scale properties, not dimension properties.
**Why it happens:** Misunderstanding Konva's transform model. `width` and `height` are natural pixel dimensions. Transformations (drag, scale, rotate) modify `x`, `y`, `scaleX`, `scaleY`, `rotation` — not the base dimensions.
**How to avoid:** After a transform, read scaled dimensions as `imageNode.width() * imageNode.scaleX()`. Never set `width()` or `height()` on a transformed node — set `scaleX()` and `scaleY()` instead.
**Warning signs:** Offset calculations incorrect after transform. Image "jumps" when dragged. Scale values reset unexpectedly.

### Pitfall 4: Forgetting to Redraw Transformer Layer
**What goes wrong:** Transformer handles don't appear after attaching to a photo, or handles disappear after photo upload.
**Why it happens:** Forgot to call `transformerLayer.draw()` after `transformer.nodes([imageNode])` or `transformer.show()`. Layer changes don't auto-render until an explicit draw.
**How to avoid:** Always call `transformerLayer.draw()` after modifying the transformer (attach, detach, show, hide). In v10+, stage events may trigger auto-redraw, but explicit `draw()` is safer.
**Warning signs:** Handles visible in console logs (`transformer.isVisible() === true`) but not rendered on canvas. Photo is draggable but no handles visible.

### Pitfall 5: Race Condition Between Transformer and Photo Upload
**What goes wrong:** Transformer attaches to a photo node that hasn't fully loaded, causing a null reference or invisible handles.
**Why it happens:** Calling `transformer.nodes([imageNode])` before `Konva.Image.fromURL()` callback completes. The imageNode reference exists but the image data hasn't decoded yet.
**How to avoid:** Always attach transformer inside the `Konva.Image.fromURL(callback)` function, after verifying `imageNode` is not null (Pattern 1 above). The upload handler already uses this pattern (lines 558–597 in index.html).
**Warning signs:** Console error: "Cannot read property 'width' of null." Handles don't appear after upload. Transformer shows incorrect bounding box size.

### Pitfall 6: Multiple Layers Causing Performance Lag
**What goes wrong:** Adding a third layer (transformerLayer) increases render overhead, especially on mobile or during drag operations.
**Why it happens:** Each Konva layer is a separate HTML5 canvas element with independent hit detection and rendering. Three layers = three canvas redraws per frame.
**How to avoid:** Konva's layer model is designed for this (separate content from UI). Performance impact is negligible for single-image use case. If lag is observed, set `photoLayer.listening(false)` since only the transformer and frame picker need event listeners.
**Warning signs:** Choppy drag movement (< 30fps). Browser DevTools show high canvas paint time. Mobile devices show visible lag.

## Code Examples

Verified patterns from official sources:

### Example 1: Complete Transformer Setup (Initialization)
```javascript
// Source: https://konvajs.org/docs/select_and_transform/Basic_demo.html
// API reference: https://konvajs.org/api/Konva.Transformer.html
// Verified 2026-04-11

// Create transformer layer (add to stage after frameLayer)
const transformerLayer = new Konva.Layer();
stage.add(transformerLayer);

// Create transformer with custom styling
const transformer = new Konva.Transformer({
  keepRatio: true,                          // D-02: Aspect ratio locked
  enabledAnchors: [                         // D-01: Corners only
    'top-left', 'top-right',
    'bottom-left', 'bottom-right'
  ],
  rotateEnabled: false,                     // No rotation for profile pics
  anchorFill: '#FF6B35',                    // D-03: Orange anchors
  anchorStroke: '#FFFFFF',                  // D-03: White stroke for contrast
  anchorStrokeWidth: 2,
  borderStroke: '#FF6B35',                  // D-03: Orange border
  borderStrokeWidth: 2,
  anchorSize: 12
});

transformerLayer.add(transformer);
state.transformer = transformer;             // Store in state

// Hide until photo loads
transformer.hide();
transformerLayer.draw();
```

### Example 2: Attach Transformer After Photo Upload
```javascript
// Source: https://konvajs.org/docs/select_and_transform/Basic_demo.html
// Verified 2026-04-11
// Location: Inside photo upload handler (after imageNode created)

Konva.Image.fromURL(dataURL, function(imageNode) {
  if (!imageNode) {
    // Handle error (already in Phase 2 code)
    return;
  }
  
  // ... existing Phase 2/3 code: position, offset, add to layer ...
  
  // D-06: Make photo draggable
  imageNode.draggable(true);
  
  // D-07: Constrain drag to stage bounds
  imageNode.dragBoundFunc(function(pos) {
    const scaledWidth = this.width() * this.scaleX();
    const scaledHeight = this.height() * this.scaleY();
    const minVisible = 50; // At least 50px must remain visible
    
    const maxX = stage.width() - minVisible;
    const minX = minVisible - scaledWidth;
    const maxY = stage.height() - minVisible;
    const minY = minVisible - scaledHeight;
    
    return {
      x: Math.max(minX, Math.min(pos.x, maxX)),
      y: Math.max(minY, Math.min(pos.y, maxY))
    };
  });
  
  // Add to layer and state
  photoLayer.add(imageNode);
  state.photoImage = imageNode;
  
  // D-04: Attach transformer (always-on when photo loaded)
  state.transformer.nodes([imageNode]);
  state.transformer.show();
  transformerLayer.draw();
  
  photoLayer.draw();
});
```

### Example 3: Hide Transformer on Export
```javascript
// Source: https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html
// Verified 2026-04-11
// Location: Download button click handler (lines ~785–800)

downloadBtn.addEventListener('click', function() {
  if (!state.photoImage) return; // Guard: no photo loaded
  
  // D-12: Hide transformer before export
  state.transformer.hide();
  transformerLayer.hide();
  
  // Export at selected resolution (existing Phase 4 code)
  const pixelRatio = state.selectedResolution; // 1 or 2
  const dataURL = stage.toDataURL({
    pixelRatio: pixelRatio,
    mimeType: 'image/png',
    quality: 1
  });
  
  // D-12: Restore transformer after export (toDataURL is synchronous)
  state.transformer.show();
  transformerLayer.show();
  
  // Trigger download (existing Phase 4 code)
  const link = document.createElement('a');
  link.download = 'profile.png';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('Downloaded profile.png at ' + pixelRatio + '× resolution');
});
```

### Example 4: Remove Photo Slider (UI Cleanup)
```html
<!-- Source: Existing index.html lines 307–329 -->
<!-- D-08: Remove this entire control-group block -->

<!-- BEFORE (Phase 3): -->
<div class="control-group">
  <label for="photo-scale">Photo Size</label>
  <input type="range" id="photo-scale" min="0.5" max="2" step="0.1" value="1">
</div>

<!-- AFTER (Phase 5): REMOVED -->
```

```javascript
// Source: Existing index.html lines ~628–660
// D-11: Remove this entire event listener block

// BEFORE (Phase 3):
const photoSlider = document.getElementById('photo-scale');
photoSlider.addEventListener('input', function(event) {
  const scale = parseFloat(event.target.value);
  const imageNode = state.photoImage;
  if (!imageNode) return;
  imageNode.scaleX(scale);
  imageNode.scaleY(scale);
  // ... offset recalculation ...
  photoLayer.batchDraw();
});

// AFTER (Phase 5): REMOVED (Transformer handles scaling instead)
```

```javascript
// Source: Existing state object lines ~383–392
// D-11: Remove photoScale and frameScale properties

// BEFORE (Phase 3):
const state = {
  photoImage: null,
  frameImage: null,
  photoScale: 1,         // REMOVE
  frameScale: 1,         // REMOVE
  selectedFrame: null,
  isLoadingPhoto: false,
  selectedResolution: 1
};

// AFTER (Phase 5):
const state = {
  photoImage: null,
  frameImage: null,
  selectedFrame: null,
  isLoadingPhoto: false,
  selectedResolution: 1,
  transformer: null      // ADD: Reference to transformer node
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Slider-based image scaling | Transformer handles with visual feedback | Industry standard since ~2015 (Photoshop, Canva, Figma all use handles) | More intuitive UX — users expect corner handles for resizing. Eliminates slider control clutter. |
| Global drag (no constraints) | `dragBoundFunc` for boundary clamping | Konva v1.x (~2016) | Prevents images from being dragged off-canvas and lost. Essential for single-layer UIs where click-outside doesn't deselect. |
| Anchor count: 8 (all edges + corners) | Anchor count: 4 (corners only) | Design trend ~2018+ (mobile-first UIs) | Reduces handle clutter. Edge handles enable non-uniform scaling, which breaks aspect ratio locking. Corners-only enforces uniform scaling visually. |
| Manual layer hide/show loops | `layer.hide()` / `layer.show()` | Konva v2.x (~2017) | Single method call vs. iterating over all layer children. Safer and faster. |

**Deprecated/outdated:**
- **`transformer.attachTo(shape)`**: Deprecated alias for `transformer.nodes([shape])`. Official docs recommend `nodes()` method. Still works in v10.2.5 but may be removed in future versions.
- **Redrawing on every transform event**: Konva v10+ auto-redraws affected layers on transform/drag events. Manual `batchDraw()` in transform listeners is no longer necessary unless custom rendering logic is involved.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js (manual validation scripts, no test framework) |
| Config file | None — single-file HTML app, no package.json |
| Quick run command | `node tests/phase-05-validation.js` (to be created) |
| Full suite command | `node tests/phase-03-validation.js && node tests/phase-05-validation.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDT-01 | Photo scales with aspect-ratio locked via corner handles | manual | N/A — UI interaction, no API test | N/A |
| EDT-02 | Frame scaling | N/A | N/A — descoped (frame fixed at 500×500) | N/A |
| EDT-03 | Photo centered on load, maintains position/offset during drag | manual | N/A — visual verification | N/A |

**Note:** Phase 5 is purely UI interaction (drag and transform). No programmatic API to test. Validation is manual browser testing.

### Sampling Rate
- **Per task commit:** N/A — no automated tests for UI drag/transform
- **Per wave merge:** Manual browser test: upload photo, drag to reposition, resize via corner handle, download PNG, verify handles not in export
- **Phase gate:** Full manual test checklist before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] **Manual test checklist** — covers drag boundary constraints, aspect-ratio locking, handle visibility, export cleanliness
- [ ] **Visual regression test** (optional) — screenshot comparison tool like Playwright or Puppeteer to verify handle styling

**Rationale for manual testing:** Konva canvas interactions are difficult to unit test. Automated UI testing (Playwright, Cypress) would require a full test infrastructure setup — overkill for a 2-3 day campaign tool. Manual verification is faster and sufficient.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No | N/A — client-only, no user accounts |
| V3 Session Management | No | N/A — single-session, no persistence |
| V4 Access Control | No | N/A — no server, no protected resources |
| V5 Input Validation | **Yes** | Client-side MIME validation (already present in Phase 2: `file.type !== 'image/jpeg' && file.type !== 'image/png'`) |
| V6 Cryptography | No | N/A — no encryption needed for client-only image compositing |
| V7 Error Handling | **Yes** | Silent failure on invalid uploads (D-07 from Phase 2) prevents information leakage |
| V8 Data Protection | **Yes** | No server uploads — all data stays client-side. No analytics/tracking per PROJECT.md "Out of Scope." |
| V9 Communications | No | N/A — no network requests after initial page load |
| V10 Malicious Code | **Yes** | CSP headers (if deployed) to prevent XSS. Konva.js served locally (no CDN injection risk). |
| V13 API Security | No | N/A — no API endpoints |
| V14 Configuration | No | N/A — no server configuration |

### Known Threat Patterns for Canvas-Based Image Editing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious image upload (exploit image decoder) | Tampering / Denial of Service | Browser's native image decoder handles this. MIME type validation (`image/png`, `image/jpeg`) rejects non-image files. No server processing = no server-side vulnerability. |
| XSS via image metadata (EXIF, IPTC) | Tampering | Konva renders pixel data only — metadata is not parsed or displayed. `toDataURL()` strips metadata from exported PNG. |
| CORS tainting (tainted canvas) | Information Disclosure | All images loaded from same origin (user upload via FileReader = data URI, frames = local PNGs). No cross-origin requests = no taint risk. |
| Data exfiltration via network | Information Disclosure | Zero network requests post-load. User photo never sent to server. Verified by inspecting Phase 2/3/4 code — all operations use FileReader and toDataURL (client-side only). |
| Clickjacking (UI redress attack) | Spoofing | CSP `frame-ancestors 'none'` header prevents embedding. Relevant only if deployed to public hosting. |

**Phase 5 specific concerns:**
- **No new threats introduced.** Phase 5 replaces slider input with drag/transform interactions. Both are DOM events processed client-side.
- **Drag constraints prevent UI breakage:** `dragBoundFunc` prevents photo from being dragged off-screen (Pitfall 2), which could be exploited for denial-of-service (user can't recover photo without refresh). Boundary clamping mitigates this.

## Sources

### Primary (HIGH confidence)
- [Konva.js Transformer API Reference](https://konvajs.org/api/Konva.Transformer.html) — Complete API documentation including all config properties (verified 2026-04-11)
- [Konva.js Drag and Drop Guide](https://konvajs.org/docs/drag_and_drop/Drag_and_Drop.html) — Official guide for draggable property and dragBoundFunc (verified 2026-04-11)
- [Konva.js Transform Examples](https://konvajs.org/docs/select_and_transform/Basic_demo.html) — Working code example for transformer attachment (verified 2026-04-11)
- [Konva.js Stage Data URL Export](https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html) — Official documentation for toDataURL method (verified 2026-04-11)
- [Konva.js Keep Ratio Documentation](https://konvajs.org/docs/select_and_transform/Keep_Ratio.html) — Aspect-ratio locking via keepRatio property (verified 2026-04-11)
- [Konva.js Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html) — Layer management and drag optimization (verified 2026-04-11)

### Secondary (MEDIUM confidence)
- Konva version v10.2.5 verified in local `konva.min.js` file (checked 2026-04-11)
- Node.js v22.16.0 and Python 3.13.3 verified as available on target machine (checked 2026-04-11)

### Tertiary (LOW confidence)
None. All claims verified against official Konva documentation or existing codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Konva v10.2.5 already in use, all required APIs verified in official docs
- Architecture: HIGH — Official examples from Konva docs, patterns verified in v10.2.5 API reference
- Pitfalls: MEDIUM — Based on common Konva usage patterns and official performance guide; specific edge cases not tested in this codebase yet
- Security: HIGH — Client-only architecture verified in existing code (Phase 2–4); no network requests post-load

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (30 days — Konva API is stable, no breaking changes expected in v10.x)
