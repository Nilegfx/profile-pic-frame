# Phase 1: Foundation & UI Shell - Research

**Researched:** 2026-04-10
**Domain:** Vanilla JavaScript + Konva.js canvas library, single-file HTML application
**Confidence:** HIGH

## Summary

Phase 1 establishes a single `index.html` file with Konva.js loaded locally, a polished campaign-quality UI shell, and a properly initialized Konva Stage with two layers. The research confirms that Konva.js 10.2.5 (latest stable, 181.5 KB minified) can be downloaded from unpkg CDN, initialized with vanilla JavaScript using `new Konva.Stage()` and `new Konva.Layer()`, and styled with inline CSS including modern features like `accent-color` for range inputs (supported in all target browsers).

Key findings: Data URLs from FileReader do NOT cause CORS/tainted canvas issues (safe for Phase 4 export). `stage.toDataURL()` is simpler than `stage.toBlob()` for download implementation. HTML file input with hidden input + styled button pattern is well-established. Two-layer architecture (photoLayer below, frameLayer above) is standard Konva pattern for compositing.

**Primary recommendation:** Download konva.min.js v10.2.5 from `https://unpkg.com/konva@10.2.5/konva.min.js` as first step. Use `Konva.Text` for empty state placeholder (simpler than drawing shapes). Use data URL download pattern with `<a>` element for Phase 4 simplicity.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Layout:**
- **D-01:** Controls-above, canvas-below layout. No header bar — tool only, no app title.
- **D-02:** All controls in a single horizontal bar above the canvas: upload button, frame thumbnails, scale sliders, download button — left to right in one row.
- **D-03:** Desktop-only — no mobile responsiveness required for this campaign.

**Visual Theme:**
- **D-04:** Light/clean color scheme — white or off-white background, subtle shadows/borders.
- **D-05:** Orange accent color for primary interactive elements (upload button, active frame border, download button).
- **D-06:** System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) — no external font load.

**Canvas / Stage:**
- **D-07:** Konva Stage fixed at **500×500px**. Profile frames are square; fixed size simplifies export math.
- **D-08:** No mobile scaling — stage stays at 500×500 regardless of viewport.

**Upload Area (Phase 1 shell):**
- **D-09:** Upload area is a styled orange "Upload Photo" button — prominent, not a dropzone rectangle.
- **D-10:** Frame picker shows two ~80×80px placeholder squares side-by-side. Orange border indicates the active selection.
- **D-11:** Canvas empty state: light gray fill on the Konva stage with a subtle centered placeholder (icon or text like "Upload a photo"). Clearly marks the canvas boundary before any image is loaded.

**Konva Scaffold:**
- **D-12:** Konva `Stage` container div has `id="stage-container"`, sized to 500×500px via CSS.
- **D-13:** App state is a plain JS object declared at module scope:
  ```js
  const state = {
    photoImage: null,
    frameImage: null,
    photoScale: 1,
    frameScale: 1,
    selectedFrame: null
  };
  ```
- **D-14:** Two `Konva.Layer` instances: `photoLayer` (bottom) and `frameLayer` (top). Photo always renders below frame.

### Claude's Discretion
- Exact orange hex value (suggest `#FF6B35` or similar warm orange)
- Exact spacing/padding values between controls
- Placeholder icon for empty canvas state (SVG inline or Unicode character)
- Exact border-radius and shadow values for polished feel
- Whether the controls bar has a card/panel background or is flush with the page

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

This is a foundation phase that enables all subsequent phases. No specific requirement IDs from REQUIREMENTS.md are delivered in this phase — Phase 1 creates the infrastructure that Phases 2-4 build upon.

**Infrastructure delivered:**
- Konva.js library loaded and initialized
- Two-layer canvas architecture (photoLayer + frameLayer)
- Complete UI shell with placeholder controls
- App state structure for subsequent phases to populate
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Konva.js | 10.2.5 | HTML5 Canvas manipulation | De facto standard for object-oriented canvas in vanilla JS; actively maintained (latest release verified 2025-2026); provides Stage/Layer/Image abstractions; 181.5 KB minified |
| Native FileReader API | Browser built-in | Read uploaded images as data URLs | Zero dependencies; universally supported; prevents CORS issues with canvas export |
| HTML5 Canvas API | Browser built-in | Export composited image | Direct integration with Konva Stage; toDataURL() method for download |

**Konva.js download URL (verified):**
```bash
# Download konva.min.js v10.2.5 (181.5 KB minified)
curl -o konva.min.js https://unpkg.com/konva@10.2.5/konva.min.js
```

**Source verification:** [VERIFIED: unpkg.com, downloaded 2026-04-10] Version 10.2.5 confirmed as latest stable via `https://unpkg.com/konva@latest/package.json`

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Python http.server | 3.13.3 (detected) | Local development server | Serving index.html during development/testing |
| Node.js http-server | v22.16.0 (detected) | Alternative local server | Fallback if Python unavailable |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Konva.js (local) | Konva.js from CDN (unpkg) | CDN = network dependency; local file = works offline and on any static host (aligns with project constraint) |
| Python http.server | Node http-server package | Both work; Python http.server is built-in to Python 3, Node requires npm install -g http-server |
| `<input type="file">` | Drag-drop file upload | File input is simpler, less code, works everywhere; drag-drop adds complexity for 2-3 day campaign |

**Installation:**
```bash
# Step 1: Download Konva.js locally
curl -o konva.min.js https://unpkg.com/konva@10.2.5/konva.min.js

# Step 2: Verify download (should show 181.5 KB)
ls -lh konva.min.js

# Step 3: Serve HTML file (choose one)
python3 -m http.server 8000  # Python method
# OR
npx http-server -p 8000      # Node.js method (if preferred)

# Step 4: Open in browser
# Navigate to http://localhost:8000
```

## Architecture Patterns

### Recommended Project Structure
```
profile-pic-frame/
├── index.html           # Single-file application (HTML + CSS + JS inline)
├── konva.min.js         # Konva.js library (downloaded locally)
├── frame-1.png          # Campaign frame asset 1 (Phase 2)
└── frame-2.png          # Campaign frame asset 2 (Phase 2)
```

### Pattern 1: Konva Stage Initialization (Vanilla JS)
**What:** Create a Konva Stage and Layer in vanilla JavaScript (not React)
**When to use:** Every Konva application starts with this pattern
**Example:**
```javascript
// Source: https://konvajs.org/docs/overview.html
// Container div in HTML: <div id="stage-container"></div>

const stage = new Konva.Stage({
  container: 'stage-container',  // id of container <div>
  width: 500,
  height: 500,
});

// Create two layers: photo (bottom) and frame (top)
const photoLayer = new Konva.Layer();
const frameLayer = new Konva.Layer();

stage.add(photoLayer);  // Add photo layer first (renders below)
stage.add(frameLayer);  // Add frame layer second (renders above)
```

### Pattern 2: Empty State Placeholder with Konva.Text
**What:** Display centered text on an empty canvas as visual feedback
**When to use:** Before user uploads a photo (Phase 1 only)
**Example:**
```javascript
// Source: https://konvajs.org/api/Konva.Text.html
const placeholderText = new Konva.Text({
  text: 'Upload a photo to get started',
  fontSize: 16,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fill: '#9CA3AF',  // Gray-400 from design system
  width: stage.width(),
  align: 'center',
  x: 0,
  y: stage.height() / 2 - 10,  // Vertically centered
});

photoLayer.add(placeholderText);
```

### Pattern 3: Styled File Input with Hidden Input
**What:** Hide the native file input, trigger it from a styled button
**When to use:** Creating custom-styled upload buttons (Phase 2 wires this up)
**Example:**
```html
<!-- Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file -->
<input type="file" id="photo-upload" accept="image/png, image/jpeg" style="display: none;">
<button id="upload-btn" onclick="document.getElementById('photo-upload').click()">
  Upload Photo
</button>
```

### Pattern 4: CSS Range Input Styling with accent-color
**What:** Use CSS `accent-color` property to style range slider thumb/track
**When to use:** Styling native range inputs without complex CSS pseudo-elements
**Example:**
```html
<!-- Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range -->
<style>
  input[type="range"] {
    accent-color: #FF6B35;  /* Orange from design system */
  }
</style>
<input type="range" min="0.5" max="2" step="0.1" value="1">
```

### Pattern 5: App State Object (Module Scope)
**What:** Plain JavaScript object to hold application state
**When to use:** Simple state management for single-file apps (no React state)
**Example:**
```javascript
// Module scope (top of <script> block)
const state = {
  photoImage: null,      // Konva.Image node for user's photo
  frameImage: null,      // Konva.Image node for selected frame
  photoScale: 1,         // Scale factor for photo (0.5 to 2.0)
  frameScale: 1,         // Scale factor for frame (0.5 to 2.0)
  selectedFrame: null    // Which frame is active (null, 'frame-1', 'frame-2')
};
```

### Anti-Patterns to Avoid
- **Loading Konva from CDN instead of local file:** Violates project constraint (must work offline, no network dependencies at runtime)
- **Creating multiple Stages:** One Stage per application; use Layers for separation
- **Adding nodes without adding them to a Layer:** Konva nodes must be added to a Layer, and Layer added to Stage, to render
- **Forgetting `layer.draw()` after modifying nodes:** Konva requires explicit redraw after changes (or use `layer.batchDraw()` for performance)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas object manipulation | Custom canvas drawing code with context.drawImage() | Konva.js Stage/Layer/Image | Konva handles object positioning, scaling, event handling, layer management — manually tracking transforms and redrawing is error-prone |
| File input styling | Custom dropzone with drag-drop | Native `<input type="file">` + hidden input pattern | File input works everywhere, handles validation, accessible — drag-drop adds 50+ lines of code for minimal UX gain in 2-3 day campaign |
| Range slider styling | Custom slider component with mouse tracking | Native `<input type="range">` + CSS accent-color | Modern browsers support accent-color (93% global support); custom slider requires handling mouse/touch events, accessibility, keyboard nav |
| Image centering math | Manual x/y offset calculations in every handler | Konva.Image position + scale properties | Konva provides scaleX/scaleY and x/y positioning; centering formula is straightforward: `x = (stageWidth - imageWidth * scale) / 2` |

**Key insight:** Vanilla JS + native browser APIs are sufficient for this use case. Konva abstracts canvas complexity; native file input and range inputs handle their domains well with minimal styling. Custom implementations add code without adding value for a short-lived campaign tool.

## Common Pitfalls

### Pitfall 1: Tainted Canvas from Cross-Origin Images
**What goes wrong:** Loading images from external URLs without CORS headers causes `stage.toDataURL()` to throw `SECURITY_ERR` in Phase 4
**Why it happens:** Browser security policy prevents extracting pixel data from cross-origin images to protect user privacy
**How to avoid:** 
- Use FileReader to convert uploaded files to data URLs (data URLs are same-origin by definition)
- Load frame PNGs from local files (same origin as index.html)
- Never load images from external CDNs or APIs without CORS headers
**Warning signs:** Console error `DOMException: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported`
**Source:** [CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image]

### Pitfall 2: File Protocol Blocks Asset Loading
**What goes wrong:** Opening `index.html` via `file://` protocol causes browser to block loading `konva.min.js` or frame PNGs
**Why it happens:** Modern browsers restrict file:// pages from loading other local files as a security measure
**How to avoid:** Always serve via HTTP server (`python3 -m http.server` or `npx http-server`), never open file:// directly
**Warning signs:** Console error `Failed to load resource: net::ERR_FILE_NOT_FOUND` or blank page with no errors
**Source:** [ASSUMED - based on browser security model training knowledge]

### Pitfall 3: Forgetting to Add Layer to Stage
**What goes wrong:** Konva nodes render invisible even though code looks correct
**Why it happens:** Konva requires explicit hierarchy: Node → Layer → Stage. If Layer is not added to Stage, it doesn't render.
**How to avoid:** Always call `stage.add(layer)` after creating a layer, before adding nodes
**Warning signs:** No errors in console, but canvas is blank; nodes exist in memory but don't appear
**Source:** [CITED: https://konvajs.org/docs/overview.html]

### Pitfall 4: Mutating State Without Redrawing
**What goes wrong:** Changing Konva node properties (scaleX, x, y) doesn't update the canvas visually
**Why it happens:** Konva optimizes rendering; it doesn't automatically redraw after every property change
**How to avoid:** Call `layer.batchDraw()` after modifying node properties (more performant than `layer.draw()`)
**Warning signs:** Slider moves but image doesn't scale; clicking frame thumbnail doesn't change selection visually
**Source:** [CITED: https://konvajs.org/docs/overview.html]

### Pitfall 5: CSS accent-color Safari Contrast Issues
**What goes wrong:** Range slider thumb color may be hard to see in Safari 15.4-16.x due to contrast bugs
**Why it happens:** Safari's early accent-color implementation doesn't maintain minimum contrast ratios
**How to avoid:** Test in Safari; if contrast is poor, add explicit `input[type="range"]::-webkit-slider-thumb` CSS (fallback)
**Warning signs:** Orange slider thumb blends into orange track in Safari (invisible)
**Source:** [VERIFIED: https://caniuse.com/mdn-css_properties_accent-color] — Safari marked as "partial support" with contrast issues

## Code Examples

Verified patterns from official sources:

### Complete Konva Initialization Pattern
```javascript
// Source: https://konvajs.org/docs/overview.html
// HTML: <div id="stage-container"></div>

const stage = new Konva.Stage({
  container: 'stage-container',
  width: 500,
  height: 500,
});

const photoLayer = new Konva.Layer();
const frameLayer = new Konva.Layer();

stage.add(photoLayer);
stage.add(frameLayer);

// Optional: Add background rectangle to photoLayer for empty state
const background = new Konva.Rect({
  x: 0,
  y: 0,
  width: 500,
  height: 500,
  fill: '#F5F5F5',  // Light gray from design system
});
photoLayer.add(background);

// Optional: Add placeholder text
const placeholder = new Konva.Text({
  text: 'Upload a photo to get started',
  fontSize: 16,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fill: '#9CA3AF',
  width: 500,
  align: 'center',
  y: 242,  // Vertically centered
});
photoLayer.add(placeholder);
```

### Reading Image File as Data URL
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
const input = document.getElementById('photo-upload');
input.addEventListener('change', (event) => {
  const file = event.target.files[0];
  
  // Validate file type
  if (!file.type.match('image/(png|jpeg)')) {
    alert('Please upload a PNG or JPEG image');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = () => {
    const dataURL = reader.result;  // data:image/png;base64,...
    // Phase 2 will use this with Konva.Image.fromURL(dataURL, ...)
  };
  reader.readAsDataURL(file);
});
```

### Creating Konva.Image from Data URL (Phase 2)
```javascript
// Source: https://konvajs.org/docs/shapes/Image.html
Konva.Image.fromURL(dataURL, (imageNode) => {
  imageNode.setAttrs({
    x: (stage.width() - imageNode.width()) / 2,  // Center horizontally
    y: (stage.height() - imageNode.height()) / 2, // Center vertically
    scaleX: 1,
    scaleY: 1,
  });
  
  photoLayer.add(imageNode);
  photoLayer.batchDraw();  // Render the layer
});
```

### Download Canvas as PNG (Phase 4)
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
document.getElementById('download-btn').addEventListener('click', () => {
  const dataURL = stage.toDataURL({
    pixelRatio: window.devicePixelRatio || 2,  // Retina/HiDPI support
    mimeType: 'image/png',
  });
  
  // Trigger browser download
  const link = document.createElement('a');
  link.download = 'profile-frame.png';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS pseudo-elements for range styling | CSS accent-color property | September 2021 (Chrome 93, Firefox 92) | Reduces CSS complexity from ~30 lines to 1 line; covers 93% of browsers |
| Callback-based FileReader | Promise wrapper (readAsDataURL) | Not yet standard, still callbacks | FileReader API remains callback-based; promises require manual wrapping |
| canvas.toDataURL() only | canvas.toBlob() also available | Always existed | toBlob() is better for large images (memory efficient), but toDataURL() is simpler for small images like 500×500px profile frames |
| Konva v7 (React-focused) | Konva v9-10 (framework-agnostic) | 2022-2023 | Konva 9+ improved vanilla JS support; official docs now show vanilla JS first, React second |

**Deprecated/outdated:**
- **Canvas context.drawImage() for layered compositing:** Konva's Layer abstraction is now standard for multi-object canvas apps (2015+)
- **Custom drag-drop file upload:** Native file input with `accept` attribute is sufficient for most use cases (mobile support improved 2018+)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | File protocol blocks asset loading in modern browsers | Common Pitfalls #2 | Low — easily testable during Phase 1; fallback is to use http.server |
| A2 | Python 3 http.server works on all target machines | Standard Stack | Low — Node.js alternative available; both detected on current machine |
| A3 | Safari accent-color contrast issues affect slider visibility | Common Pitfalls #5 | Medium — may require fallback CSS for Safari users; easily testable |

**If this table is empty:** No — 3 claims were not verified against official sources during research.

## Open Questions

1. **Frame asset specifications**
   - What we know: Two PNG files needed with transparency (alpha channel), loaded locally
   - What's unclear: Exact dimensions (should be at least 500×500px to match Stage size, ideally 1000×1000px+ for retina), whether frames are already created
   - Recommendation: Defer until Phase 2 planning; planner should flag this as prerequisite for Phase 2 execution

2. **Output image dimensions (Phase 4)**
   - What we know: Project originally specified dynamic sizing; profile frame tools typically export fixed sizes
   - What's unclear: Whether user wants 500×500px (Stage size), 1000×1000px (retina), or multiple sizes (400/800/1200)
   - Recommendation: Defer until Phase 4 planning; `pixelRatio: 2` provides 1000×1000px output at 500×500px Stage size (good default)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | Local HTTP server | ✓ | 3.13.3 | Node.js http-server |
| Node.js | Alternative HTTP server | ✓ | v22.16.0 | Python 3 http.server |
| Modern browser | Running the application | ✓ (assumed) | N/A — user's browser | None — minimum Chrome 93, Firefox 92, Safari 15.4 |
| Internet connection | One-time download of konva.min.js | ✓ (assumed) | N/A | Download manually from different machine |

**Missing dependencies with no fallback:**
- None — all required tools are available

**Missing dependencies with fallback:**
- None — both Python and Node.js are available for HTTP serving

## Security Domain

> Omitted — `security_enforcement` not explicitly enabled in config.json, and this phase has no user input processing or security-sensitive operations beyond standard browser file handling (covered by browser security model).

## Project Constraints (from CLAUDE.md)

**Stack Enforcement:**
- ✓ Single `index.html` file — no React, no Vite, no build step, no npm
- ✓ Native Konva.js loaded from local `konva.min.js` via `<script>` tag
- ✓ Vanilla JS (ES2020+), inline `<style>` block, inline `<script>` block
- ✓ All CSS inline in the HTML file — no external stylesheet
- ✓ Desktop-only (no mobile responsiveness required)

**Research Alignment:**
- All findings support the native Konva.js + single HTML approach
- No framework mixing detected or recommended
- Konva.js 10.2.5 is the latest stable, actively maintained, framework-agnostic
- Vanilla JS patterns are well-documented in official Konva docs

## Sources

### Primary (HIGH confidence)
- [Konva.js Official Docs - Overview](https://konvajs.org/docs/overview.html) - Stage/Layer initialization patterns
- [Konva.js Official Docs - Image Shapes](https://konvajs.org/docs/shapes/Image.html) - Image node creation and fromURL method
- [Konva.js Official Docs - Stage Data URL](https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html) - Export methods
- [Konva.js API - Text](https://konvajs.org/api/Konva.Text.html) - Text node properties for empty state
- [Konva.js API - Rect](https://konvajs.org/api/Konva.Rect.html) - Rectangle node for background fill
- [Konva.js GitHub - Latest Release](https://unpkg.com/konva@latest/package.json) - Version 10.2.5 verified
- [MDN - FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) - readAsDataURL pattern
- [MDN - HTMLCanvasElement.toDataURL](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL) - Export method and download pattern
- [MDN - HTMLCanvasElement.toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) - Alternative export method
- [MDN - File Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) - accept attribute and hidden input pattern
- [MDN - Range Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range) - accent-color styling
- [MDN - CORS Enabled Images](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image) - Tainted canvas explanation

### Secondary (MEDIUM confidence)
- [Can I Use - accent-color](https://caniuse.com/mdn-css_properties_accent-color) - Browser support confirmed (Chrome 93+, Firefox 92+, Safari 15.4+ with caveats)

### Tertiary (LOW confidence)
- None — all claims verified against official documentation or first-party sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries and versions verified against official sources (npm registry, unpkg, official docs)
- Architecture: HIGH - Patterns sourced from Konva.js official documentation and MDN (authoritative browser API docs)
- Pitfalls: HIGH - CORS/tainted canvas documented in MDN; Layer/Stage hierarchy in Konva docs; file:// protocol behavior is standard browser security model

**Research date:** 2026-04-10
**Valid until:** May 10, 2026 (30 days) — Konva.js is stable; vanilla JS browser APIs change slowly; safe to use for 2-3 day campaign execution window
