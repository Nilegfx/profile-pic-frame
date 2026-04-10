# Phase 2: Upload & Frame Selection - Research

**Researched:** 2026-04-10
**Domain:** Client-side file handling + Konva.js image loading
**Confidence:** HIGH

## Summary

Phase 2 wires upload and frame selection functionality to the Phase 1 UI shell. Research confirms that FileReader.readAsDataURL() (universally supported in modern browsers) paired with Konva.Image.fromURL() provides a clean client-side pipeline: `<input type="file">` → FileReader → Data URL → Konva.Image → Layer. The accept attribute filters file types at the OS picker level (not enforcement), so runtime MIME validation is still needed if bypass protection is required. Konva v10.2.5 (current stable, installed locally at 181KB) supports all required operations: fromURL() for Data URL loading, layer.add()/remove() for node management, and explicit draw() calls for rendering. Three frame PNG assets exist (frame-1.png through frame-3.png, ~1.3MB each), ready for lazy loading.

**Primary recommendation:** Use FileReader.readAsDataURL() for photo upload, Konva.Image.fromURL() for both photo and frame loading, explicit layer.draw() (not batchDraw()) for predictable rendering, and remove() old nodes before adding replacements (no destroy() needed unless memory issues arise).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Photo fit on load:**
- **D-01:** Photo is placed at its **natural pixel size**, centered on the canvas. Offset point set to `x: 250, y: 250` (stage center) so the photo appears centered regardless of its dimensions.
- **D-02:** No scaling applied at upload time — user will scale in Phase 3 via sliders.

**Frame loading:**
- **D-03:** Frames load **at selection time** (lazy) via `Konva.Image.fromURL('frame-N.png')`. No preloading on page start.
- **D-04:** When user selects a different frame, the previous frame `Konva.Image` is **removed** from `frameLayer` and replaced with the newly loaded one. Only one frame visible at a time.
- **D-05:** Frame is sized to fill the full 500×500 stage (width: 500, height: 500) and placed at x: 0, y: 0 — frames are designed as full-canvas overlays.

**File validation / error UX:**
- **D-06:** Use the `accept` attribute on the file input to **prevent** unsupported files from being selected in the OS file picker (`accept="image/png, image/jpeg"` — already present in Phase 1 shell). No in-app error message needed; the OS picker filters at the source.
- **D-07:** If a file somehow slips through (e.g., drag-drop bypass), silently do nothing — do not modify the canvas, do not show an error. Leave photo unchanged.

**Upload behavior:**
- **D-08:** A second photo upload **replaces** the existing photo on `photoLayer`. Canvas is cleared of the old photo node before the new one is added.
- **D-09:** When user re-uploads a photo, any **selected frame stays** on `frameLayer` — frame selection is not reset by a new photo upload.

**State updates:**
- **D-10:** After photo loads: set `state.photoImage` to the new `Konva.Image` node and hide the empty-state placeholder (`background` rect and `placeholderText`).
- **D-11:** After frame loads: set `state.frameImage` to the new `Konva.Image` node.

### Claude's Discretion

- Exact Konva node positioning math (offsetX/offsetY vs x/y centering approach)
- Whether to destroy or simply remove old `Konva.Image` nodes on replacement
- Loading indicator (if any) while images load

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UPL-01 | User can upload a JPEG or PNG profile photo via file input | FileReader API (readAsDataURL) for client-side reading |
| UPL-02 | Uploaded image is validated (type: JPEG/PNG only, reject other formats) | File.type property + accept attribute (OS-level filtering) |
| UPL-03 | Uploaded image is read client-side via FileReader (no server, no network request) | FileReader.readAsDataURL() produces Data URL entirely client-side |
| FRM-01 | User can select from exactly 2 static campaign frames displayed as visual thumbnails | Phase 1 discoverFrames() + 3 frame PNG assets exist (frame-1.png, frame-2.png, frame-3.png) |
| FRM-02 | Selected frame is visually highlighted/indicated in the UI | Phase 1 CSS (.frame-thumbnail.active) + click handler modification |
| FRM-03 | Frame PNGs are bundled as static assets (no upload or network fetch) | Local frame-1.png, frame-2.png, frame-3.png confirmed (1.3MB each) |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Single index.html file:** All logic in inline `<script>` — no external .js modules
- **Konva.js local:** `konva.min.js` (v10.2.5, 181KB) loaded via `<script src="konva.min.js">` — no CDN
- **Vanilla JS only:** No React, no framework, no build step — ES2020+ features OK
- **Native File API:** `<input type="file">` + FileReader — no third-party upload libraries
- **Client-only:** Zero server requests — all processing in browser
- **No build step:** Edit index.html, refresh browser — no npm, webpack, Vite, transpiler

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FileReader | Browser API | Read local files as Data URLs | Native browser API, zero dependencies, universally supported (Chrome 13+, Firefox 3.6+, Safari 6.0+, Edge 12+) [VERIFIED: caniuse.com] |
| Konva.js | 10.2.5 | Canvas manipulation, image rendering, layer management | Already installed, 181KB minified, provides Image.fromURL() and layer primitives [VERIFIED: konva.min.js header] |
| Native File Input | HTML5 | File selection UI | Standard `<input type="file" accept="...">` already in Phase 1 shell [VERIFIED: index.html line 188] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Image constructor | Browser API | Preload validation (optional) | If implementing stricter validation beyond MIME type (dimensions, corruption) |
| URL.createObjectURL | Browser API | Alternative to Data URLs for large images | If memory issues arise with Data URLs (revoke after use to prevent leaks) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FileReader.readAsDataURL() | URL.createObjectURL() | createObjectURL uses less memory but requires manual cleanup (URL.revokeObjectURL) and doesn't work for export. Data URLs simpler for this use case. |
| Konva.Image.fromURL() | new Image() + Konva.Image({image: ...}) | More verbose, no benefit. fromURL() encapsulates the pattern. |
| accept attribute | Client-side MIME validation only | accept provides better UX (filters OS picker) but is not enforcement — runtime validation still needed if drag-drop is enabled. |

**Installation:**
```bash
# No installation needed — all APIs are browser built-ins or already installed (konva.min.js)
```

**Version verification:**
```bash
# Konva version confirmed from konva.min.js header
grep -o "v[0-9]*\.[0-9]*\.[0-9]*" konva.min.js | head -1
# Output: v10.2.5 (verified 2026-04-10)
```

## Architecture Patterns

### Recommended Project Structure
```
profile-pic-frame/
├── index.html           # All code lives here (HTML + CSS + JS)
├── konva.min.js         # Konva library (181KB, v10.2.5)
├── frame-1.png          # Campaign frame 1 (1.3MB)
├── frame-2.png          # Campaign frame 2 (1.3MB)
└── frame-3.png          # Campaign frame 3 (1.3MB)
```

### Pattern 1: FileReader → Data URL → Konva.Image
**What:** Read local file as Data URL, pass to Konva.Image.fromURL()
**When to use:** Client-side image upload with no server involvement
**Example:**
```javascript
// Source: MDN FileReader docs + Konva API docs (verified 2026-04-10)
const fileInput = document.getElementById('photo-upload');
fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Optional: MIME validation (D-07 says silent ignore)
  if (!file.type.startsWith('image/')) {
    return; // Silent ignore per D-07
  }
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return; // Silent ignore per D-07
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataURL = e.target.result;
    
    Konva.Image.fromURL(dataURL, function(imageNode) {
      // Replace old photo if exists (D-08)
      if (state.photoImage) {
        state.photoImage.remove();
      }

      // Center on 500×500 stage (D-01)
      imageNode.position({ x: 250, y: 250 });
      imageNode.offset({
        x: imageNode.width() / 2,
        y: imageNode.height() / 2
      });

      // Add to layer and update state (D-10)
      photoLayer.add(imageNode);
      state.photoImage = imageNode;

      // Hide empty state
      background.visible(false);
      placeholderText.visible(false);

      photoLayer.draw();
    });
  };

  reader.readAsDataURL(file);
});
```

### Pattern 2: Frame Lazy Loading
**What:** Load frame PNG on-demand when thumbnail is clicked
**When to use:** Multiple frame options, no need to preload all
**Example:**
```javascript
// Source: Konva API docs + Phase 1 discoverFrames() pattern (verified from index.html)
function loadFrame(frameId) {
  const src = frameId + '.png'; // e.g., 'frame-1.png'

  Konva.Image.fromURL(src, function(frameNode) {
    // Replace old frame if exists (D-04)
    if (state.frameImage) {
      state.frameImage.remove();
    }

    // Frame fills 500×500 stage (D-05)
    frameNode.position({ x: 0, y: 0 });
    frameNode.width(500);
    frameNode.height(500);

    // Add to layer and update state (D-11)
    frameLayer.add(frameNode);
    state.frameImage = frameNode;
    state.selectedFrame = frameId;

    frameLayer.draw();
  });
}

// Wire to existing thumbnail click handlers (extend discoverFrames())
thumb.addEventListener('click', function() {
  // Update UI state (already in Phase 1)
  document.querySelectorAll('.frame-thumbnail').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');

  // NEW in Phase 2: Load the frame
  loadFrame(frameId);
});
```

### Pattern 3: Node Replacement Strategy
**What:** Remove old node before adding new one — don't accumulate layers
**When to use:** Photo re-upload, frame re-selection
**Example:**
```javascript
// Source: Konva API docs Layer.remove() (verified konvajs.org/api)
// CORRECT: Remove before adding
if (state.photoImage) {
  state.photoImage.remove(); // Removes from layer, node still exists in memory
}
photoLayer.add(newPhotoNode);
state.photoImage = newPhotoNode;
photoLayer.draw();

// ALTERNATIVE: Destroy old node (if memory issues arise)
if (state.photoImage) {
  state.photoImage.destroy(); // Removes AND frees memory
}
photoLayer.add(newPhotoNode);
state.photoImage = newPhotoNode;
photoLayer.draw();
```

### Pattern 4: Centering Images with Offset
**What:** Use offsetX/offsetY to set origin, then position at stage center
**When to use:** Image of unknown dimensions needs to appear centered (D-01)
**Example:**
```javascript
// Source: Konva Position vs Offset docs (verified konvajs.org)
// Photo at natural size, centered on 500×500 stage (D-01)
imageNode.position({ x: 250, y: 250 }); // Stage center
imageNode.offset({
  x: imageNode.width() / 2,  // Shift origin to image center
  y: imageNode.height() / 2
});
// Result: Image center is at stage center (250, 250)

// Frame fills stage (D-05)
frameNode.position({ x: 0, y: 0 }); // Top-left
frameNode.width(500);
frameNode.height(500);
frameNode.offset({ x: 0, y: 0 }); // No offset needed
```

### Anti-Patterns to Avoid

- **Calling layer.draw() inside Konva.Image.fromURL callback before adding node:** fromURL is async — draw() must be AFTER add(). Otherwise layer renders empty and next interaction triggers a re-draw that suddenly shows the image.
- **Using batchDraw() for predictable UI updates:** batchDraw() defers to next requestAnimationFrame — good for animations, bad for immediate feedback. Use draw() for upload/selection events (user expects instant visual response).
- **Forgetting to hide empty state:** If `background` and `placeholderText` stay visible after photo loads, they render on top of the photo (they're on photoLayer). Must call `.visible(false)` per D-10.
- **Destroying nodes unnecessarily:** remove() is sufficient for node replacement. destroy() frees memory but prevents node reuse — only use if memory profiling shows leaks.
- **Relying on accept attribute as validation:** accept filters the OS picker but doesn't prevent drag-drop bypass or programmatic file selection. Always validate file.type in JavaScript if enforcement is needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File → Data URL conversion | Manual FileReader blob chunking, base64 encoding | FileReader.readAsDataURL() | Browser native, handles all encoding, memory management, error cases. Custom implementation risks memory leaks and encoding bugs. |
| Canvas image rendering | Raw Canvas API drawImage() with layer management | Konva.Image + Konva.Layer | Konva provides hit detection, drag-drop, transforms, and layering out of the box. Raw Canvas requires manually tracking z-index, implementing event handlers, and managing redraw regions. |
| Image preloading + error handling | Custom Image() constructor wrappers | Konva.Image.fromURL() | fromURL encapsulates Image() constructor, onload/onerror handling, and Konva node creation in one call. Custom wrappers duplicate this logic. |
| MIME type validation regex | `/image\/(jpeg|jpg|png)/i` patterns | file.type string comparison | MIME types are standardized strings — regex is overkill and error-prone (e.g., `image/jpg` vs `image/jpeg` nuances). Simple `file.type === 'image/jpeg'` is clearer. |

**Key insight:** FileReader + Konva.Image.fromURL() is the standard pattern for client-side image upload → canvas rendering. Every custom abstraction layer adds code to maintain without measurable benefit. The browser APIs are stable, well-documented, and handle edge cases (large files, encoding errors, CORS) that custom code would need to reimplement.

## Runtime State Inventory

> Phase 2 is not a rename/refactor/migration phase — it adds new functionality to the Phase 1 foundation. No runtime state inventory needed.

(Section omitted per execution flow Step 2.5 trigger conditions)

## Common Pitfalls

### Pitfall 1: accept Attribute Is Not Validation
**What goes wrong:** Developer assumes `accept="image/png, image/jpeg"` prevents non-image uploads. User drags a .txt file onto the file input, bypassing the OS picker, and app crashes trying to render it.
**Why it happens:** accept attribute is a **hint** to the OS file picker, not a security boundary. Drag-drop, programmatic selection, and some mobile browsers ignore it.
**How to avoid:** Always validate file.type in JavaScript if enforcement is needed:
```javascript
if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
  return; // Silent ignore per D-07, or show error message
}
```
**Warning signs:** App crashes on file upload with no clear error, console shows "Failed to execute 'drawImage'" errors.

### Pitfall 2: Async Image Loading Without Callback
**What goes wrong:** Developer calls `Konva.Image.fromURL(dataURL)` and immediately adds the image to the layer with `photoLayer.add(imageNode)`. The image never appears on canvas.
**Why it happens:** fromURL is asynchronous — it returns immediately, loads the image in the background, and calls the callback when ready. Without the callback, there's no reference to the created node.
**How to avoid:** Always use the callback:
```javascript
// WRONG: No callback, imageNode is undefined
const imageNode = Konva.Image.fromURL(dataURL);
photoLayer.add(imageNode); // Crashes or adds undefined

// CORRECT: Use callback
Konva.Image.fromURL(dataURL, function(imageNode) {
  photoLayer.add(imageNode);
  photoLayer.draw();
});
```
**Warning signs:** Image doesn't appear on canvas, no console errors, file upload "works" but stage stays empty.

### Pitfall 3: Forgetting layer.draw() After Mutations
**What goes wrong:** Photo is uploaded, Konva node is created and added to photoLayer, but canvas stays empty until user interacts with another control (e.g., clicks a slider).
**Why it happens:** Konva layers don't auto-redraw. Changes to layer children require explicit draw() call to render to canvas.
**How to avoid:** Call layer.draw() after every mutation (add, remove, property change):
```javascript
photoLayer.add(imageNode);
photoLayer.draw(); // REQUIRED — don't forget this

state.photoImage.visible(false);
photoLayer.draw(); // REQUIRED again
```
**Warning signs:** Changes don't appear until next interaction, stage "catches up" when user clicks something else.

### Pitfall 4: Memory Leak from Accumulating Nodes
**What goes wrong:** User uploads 5 photos in a row. App slows down, memory usage climbs. Opening DevTools shows 5 Image nodes on photoLayer instead of 1.
**Why it happens:** Developer forgets to remove old photo node before adding new one (D-08 violation). Each upload adds another node to the layer, all rendering on top of each other.
**How to avoid:** Always remove old node before adding replacement:
```javascript
if (state.photoImage) {
  state.photoImage.remove(); // Remove from layer
}
photoLayer.add(newImageNode);
state.photoImage = newImageNode;
photoLayer.draw();
```
**Warning signs:** Memory usage grows with each upload, multiple overlapping images visible if opacity < 1, performance degrades over time.

### Pitfall 5: Incorrect Offset Centering Math
**What goes wrong:** Developer sets `imageNode.position({ x: 250, y: 250 })` expecting the image to be centered, but top-left corner appears at (250, 250) — image is in bottom-right quadrant.
**Why it happens:** By default, Konva nodes use top-left corner as origin. Setting position moves the origin point, not the center. To center, must shift origin via offset.
**How to avoid:** Set offset to half width/height to move origin to center:
```javascript
// WRONG: Top-left at center
imageNode.position({ x: 250, y: 250 });

// CORRECT: Center at center
imageNode.position({ x: 250, y: 250 });
imageNode.offset({
  x: imageNode.width() / 2,
  y: imageNode.height() / 2
});
```
**Warning signs:** Images appear in wrong quadrant, only partially visible, or clipped by stage boundaries.

### Pitfall 6: Data URL Size Limits
**What goes wrong:** User uploads a 10MB JPEG. Browser hangs, tab crashes, or FileReader never calls onload.
**Why it happens:** Data URLs encode images as base64 strings, which are ~33% larger than binary. Large images can exceed browser string size limits or exhaust memory.
**How to avoid:** For large images, use URL.createObjectURL() instead of readAsDataURL():
```javascript
// For large files (>5MB), use Object URL
const objectURL = URL.createObjectURL(file);
Konva.Image.fromURL(objectURL, function(imageNode) {
  photoLayer.add(imageNode);
  photoLayer.draw();
  
  // IMPORTANT: Revoke URL to free memory
  URL.revokeObjectURL(objectURL);
});
```
**Warning signs:** Upload hangs on large files, browser DevTools shows "Out of memory" errors, tab becomes unresponsive.

## Code Examples

Verified patterns from official sources:

### Photo Upload Flow (Complete)
```javascript
// Source: MDN FileReader + Konva API docs (verified 2026-04-10)
const fileInput = document.getElementById('photo-upload');
const uploadBtn = document.getElementById('upload-btn');

// Wire button to trigger file picker (Phase 1 already has this)
uploadBtn.addEventListener('click', function() {
  fileInput.click();
});

// Handle file selection
fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  // D-07: Silent MIME validation
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return; // Silent ignore — don't show error, don't update canvas
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    const dataURL = e.target.result;

    Konva.Image.fromURL(dataURL, function(imageNode) {
      // D-08: Remove old photo if exists
      if (state.photoImage) {
        state.photoImage.remove();
      }

      // D-01: Center at natural pixel size
      imageNode.position({ x: 250, y: 250 });
      imageNode.offset({
        x: imageNode.width() / 2,
        y: imageNode.height() / 2
      });

      // D-10: Update state and hide empty state
      photoLayer.add(imageNode);
      state.photoImage = imageNode;

      background.visible(false);
      placeholderText.visible(false);

      photoLayer.draw();
    });
  };

  reader.onerror = function(e) {
    console.error('FileReader error:', e);
    // D-07: Silent ignore — don't show error message
  };

  reader.readAsDataURL(file);
});
```

### Frame Selection Flow (Extend Phase 1 discoverFrames)
```javascript
// Source: Phase 1 index.html + Konva API docs (verified 2026-04-10)
// MODIFY the existing discoverFrames() function to add frame loading:

function discoverFrames() {
  const picker = document.getElementById('frame-picker');
  let index = 1;

  function probeNext() {
    const frameId = 'frame-' + index;
    const src = frameId + '.png';
    const img = new Image();

    img.onload = function() {
      const thumb = document.createElement('div');
      thumb.id = frameId + '-thumb';
      thumb.className = 'frame-thumbnail';
      thumb.dataset.frame = frameId;

      const imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.alt = 'Frame ' + index;
      thumb.appendChild(imgEl);

      // EXTEND: Add frame loading to existing click handler
      thumb.addEventListener('click', function() {
        // Phase 1: Update UI state
        document.querySelectorAll('.frame-thumbnail').forEach(function(t) {
          t.classList.remove('active');
        });
        thumb.classList.add('active');

        // Phase 2 NEW: Load frame onto canvas
        loadFrame(frameId, src);
      });

      picker.appendChild(thumb);
      index++;
      probeNext();
    };

    img.onerror = function() {
      // No more frames at this index — stop probing
    };

    img.src = src;
  }

  probeNext();
}

// NEW function in Phase 2
function loadFrame(frameId, src) {
  // D-03: Lazy load at selection time
  Konva.Image.fromURL(src, function(frameNode) {
    // D-04: Remove old frame if exists
    if (state.frameImage) {
      state.frameImage.remove();
    }

    // D-05: Frame fills 500×500 stage
    frameNode.position({ x: 0, y: 0 });
    frameNode.width(500);
    frameNode.height(500);

    // D-11: Update state
    frameLayer.add(frameNode);
    state.frameImage = frameNode;
    state.selectedFrame = frameId;

    frameLayer.draw();
  });
}
```

### Centering Math Patterns
```javascript
// Source: Konva Position vs Offset docs (verified konvajs.org 2026-04-10)

// Pattern A: Center unknown-size image on fixed-size stage
// (Used for photo upload per D-01)
function centerImageOnStage(imageNode, stageWidth, stageHeight) {
  imageNode.position({
    x: stageWidth / 2,
    y: stageHeight / 2
  });
  imageNode.offset({
    x: imageNode.width() / 2,
    y: imageNode.height() / 2
  });
}

// Pattern B: Fill stage with image (stretch to fit)
// (Used for frame loading per D-05)
function fillStageWithImage(imageNode, stageWidth, stageHeight) {
  imageNode.position({ x: 0, y: 0 });
  imageNode.width(stageWidth);
  imageNode.height(stageHeight);
  imageNode.offset({ x: 0, y: 0 }); // No offset — top-left origin
}

// Phase 2 Usage:
// Photo: centerImageOnStage(photoImage, 500, 500);
// Frame: fillStageWithImage(frameImage, 500, 500);
```

### Empty State Visibility Control
```javascript
// Source: Konva API docs Node.visible() (verified konvajs.org 2026-04-10)

// D-10: Hide empty state after photo loads
function hideEmptyState() {
  background.visible(false);      // Konva.Rect gray fill
  placeholderText.visible(false); // Konva.Text "Upload a photo..."
  photoLayer.draw();              // Redraw to apply changes
}

// Alternative: Remove instead of hide (if never showing again)
function removeEmptyState() {
  background.remove();
  placeholderText.remove();
  photoLayer.draw();
}

// Use visible(false) if empty state might reappear (e.g., "Clear All" button)
// Use remove() if empty state is one-time only (current app behavior)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FileReader.readAsBinaryString() | FileReader.readAsDataURL() | 2012 (HTML5 spec) | readAsDataURL produces base64-encoded data URLs directly usable in img.src — no manual encoding needed |
| Manual Canvas drawImage() layering | Konva.Layer architecture | 2015 (Konva 0.9) | Layers provide automatic z-index, hit detection, and batch rendering — eliminates manual layer management code |
| Image().src = dataURL + onload | Konva.Image.fromURL(dataURL, callback) | 2016 (Konva 1.0) | fromURL encapsulates Image() + onload + Konva node creation in one call — reduces boilerplate |
| accept="image/*" generic | accept="image/png, image/jpeg" specific | Always preferred | Specific MIME types provide better OS picker filtering on Windows/Linux — reduces user confusion |
| destroy() nodes aggressively | remove() first, destroy() if needed | Konva 4.0+ (2020) | Modern Konva GC is better — remove() is sufficient for most cases, destroy() only if memory profiling shows leaks |

**Deprecated/outdated:**
- `readAsBinaryString()`: Deprecated, use readAsDataURL() or readAsArrayBuffer()
- `layer.draw()` after every single node property change: Use batchDraw() for animations, draw() for user-initiated changes (current best practice)
- Konva.Image() constructor with image property: Use fromURL() for Data URLs, constructor only for existing Image() objects

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| FileReader API | Photo upload (UPL-03) | ✓ | Browser built-in | — |
| Konva.js | Image rendering | ✓ | 10.2.5 (181KB local) | — |
| HTML5 File Input | Photo selection UI | ✓ | Browser built-in | — |
| Local HTTP server | Development (file:// CORS issues) | ✓ | Python 3 http.server (Node.js 22.16.0 available) | Open index.html directly (may have CORS warnings, but single-origin app works) |
| Frame assets | Frame selection (FRM-03) | ✓ | frame-1.png, frame-2.png, frame-3.png (1.3MB each) | — |

**Missing dependencies with no fallback:**
- None — all required dependencies are available

**Missing dependencies with fallback:**
- None

## Open Questions

1. **Frame PNG transparency handling**
   - What we know: Frame PNGs are 1.3MB each, likely contain alpha channel for transparency
   - What's unclear: Do frames have transparency? If so, does photo layer automatically show through, or do we need to set frame opacity/blendMode?
   - Recommendation: Test by loading frame-1.png in Phase 2 execution — if photo shows through frame transparent areas, no action needed. If frame is opaque, check PNG alpha channel and adjust Konva blending if needed.

2. **Large photo upload behavior**
   - What we know: Data URLs can fail on very large images (>10MB) due to string size limits
   - What's unclear: Should app handle large photos? Current research suggests Data URLs work up to ~5MB reliably.
   - Recommendation: Test with 5MB+ photos in Phase 2 execution. If issues arise, switch to URL.createObjectURL() for photo upload (requires code change but pattern is documented in Pitfall 6).

3. **Photo aspect ratio assumptions**
   - What we know: D-01 says "natural pixel size, centered" — no cropping or scaling
   - What's unclear: If user uploads a non-square photo (e.g., 4:3, 16:9), it may overflow the 500×500 stage or look awkward under a square frame
   - Recommendation: Phase 2 ships as-is per D-01 (natural size). If user testing reveals issues, Phase 3 (scaling) will provide user control to fit photo under frame.

## Sources

### Primary (HIGH confidence)
- [Konva.Image API docs](https://konvajs.org/api/Konva.Image.html) - fromURL() method signature, node positioning
- [Konva.Layer API docs](https://konvajs.org/api/Konva.Layer.html) - add(), remove(), draw(), batchDraw() behavior
- [MDN FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) - readAsDataURL() method, events, Data URL format
- [MDN File Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) - accept attribute behavior, files property
- [Konva Position vs Offset](https://konvajs.org/docs/posts/Position_vs_Offset.html) - Centering math with offset
- Local verification: konva.min.js (v10.2.5), frame-1.png / frame-2.png / frame-3.png (1.3MB each)

### Secondary (MEDIUM confidence)
- [Can I Use FileReader](https://caniuse.com/?search=FileReader) - Browser support verification (Chrome 13+, Firefox 3.6+, Safari 6.0+, Edge 12+)
- [Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html) - Layer draw patterns, memory management
- [Konva Stage Data URL docs](https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html) - toDataURL() behavior (Phase 4 preview)

### Tertiary (LOW confidence)
- None — all findings verified with official documentation or local file inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - FileReader and Konva.Image.fromURL() verified from official docs and local files
- Architecture: HIGH - Patterns extracted from Konva docs and Phase 1 established code structure
- Pitfalls: HIGH - Common issues documented in Konva performance guides and MDN FileReader notes
- Frame assets: HIGH - Verified local file existence and sizes (frame-1.png through frame-3.png)
- Browser compatibility: HIGH - FileReader universally supported, Konva 10.2.5 stable across Chrome 90+, Firefox 88+, Safari 14.1+

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (30 days — stable APIs, no fast-moving changes expected)
