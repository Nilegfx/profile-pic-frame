---
phase: 01-foundation-ui-shell
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - index.html
  - konva.min.js
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-04-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 2 (index.html [project source], konva.min.js [third-party library])
**Status:** issues_found

## Summary

Reviewed the foundation UI shell implementation consisting of a single-file HTML app with Konva.js canvas integration. The code is clean, well-structured, and follows the project's zero-build vanilla JS architecture. Phase 1 establishes the UI skeleton with placeholder functionality.

**Key findings:**
- 2 Warnings related to missing error handling for future file upload implementation
- 4 Info-level items for code quality improvements (debug logging, magic numbers, accessibility)
- No Critical security issues detected
- Third-party konva.min.js library not reviewed in detail (standard practice for minified dependencies)

The foundation is solid. Warnings are preparatory — flagging areas that will need attention in Phase 2 when file upload and image handling logic is implemented.

## Warnings

### WR-01: Missing File Upload Handler and Validation

**File:** `index.html:237-239`
**Issue:** Upload button is wired to trigger the file input, but no change event listener is attached to `#photo-upload` to handle the selected file. When this handler is implemented in Phase 2, it must include:
- Check that `files[0]` exists before accessing
- Validate file type from FileReader result (not just `accept` attribute, which is client-side only)
- Handle FileReader errors (file read failures, invalid image formats)
- Validate image dimensions after loading
- Handle memory constraints for very large images

**Fix:**
```javascript
// Add after line 239:
document.getElementById('photo-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) {
    console.warn('No file selected');
    return;
  }

  // Validate file type from actual content, not just extension
  if (!file.type.match(/^image\/(png|jpeg)$/)) {
    alert('Please upload a PNG or JPEG image');
    return;
  }

  // Validate file size (e.g., 10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    alert('Image too large. Please upload an image under 10MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      // Proceed with Konva image creation
    };
    img.onerror = function() {
      alert('Failed to load image. Please try a different file.');
    };
    img.src = event.target.result;
  };
  reader.onerror = function() {
    alert('Failed to read file');
  };
  reader.readAsDataURL(file);
});
```

### WR-02: State Null References Need Guarding in Future Code

**File:** `index.html:188-192`
**Issue:** State object initializes `photoImage`, `frameImage`, and `selectedFrame` to `null`. When Phase 2+ adds code that accesses these values (e.g., applying transforms, exporting canvas), each access point must check for null/undefined to prevent runtime errors.

**Fix:**
Ensure all future code that accesses state properties includes null guards:
```javascript
// Good - null guard before property access
if (state.photoImage) {
  state.photoImage.scale({ x: state.photoScale, y: state.photoScale });
}

// Bad - will throw TypeError if photoImage is null
state.photoImage.scale({ x: state.photoScale, y: state.photoScale });

// Good - guard download action
document.getElementById('download-btn').addEventListener('click', function() {
  if (!state.photoImage) {
    alert('Please upload a photo first');
    return;
  }
  // Proceed with download
});
```

## Info

### IN-01: Debug Logging in Production Code

**File:** `index.html:242-248`
**Issue:** Console.log statement logs initialization details on every page load. This is helpful during development but should be removed or gated behind a debug flag for production deployment.

**Fix:**
Remove the console.log block, or wrap it in a debug flag:
```javascript
// Option 1: Remove entirely
// console.log('Konva Stage initialized:', ...);

// Option 2: Add debug flag at top of script
const DEBUG = false;  // Set to false for production

if (DEBUG) {
  console.log('Konva Stage initialized:', {
    width: stage.width(),
    height: stage.height(),
    layers: stage.children.length,
    photoLayerNodes: photoLayer.children.length,
    frameLayerNodes: frameLayer.children.length
  });
}
```

### IN-02: Magic Numbers Should Be Constants

**File:** `index.html:196-200, 210-216, 225-226`
**Issue:** Canvas dimensions (500x500) and positioning values are hardcoded throughout the code. Extracting to named constants improves maintainability and makes dimension changes easier.

**Fix:**
```javascript
// Add at top of script block (after line 185):
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

// Then use throughout:
const stage = new Konva.Stage({
  container: 'stage-container',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
});

const background = new Konva.Rect({
  x: 0,
  y: 0,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  fill: '#F5F5F5',
});

const placeholderText = new Konva.Text({
  text: 'Upload a photo to get started',
  fontSize: 14,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fill: '#9CA3AF',
  width: CANVAS_WIDTH,
  align: 'center',
  x: 0,
  y: CANVAS_HEIGHT / 2 - 7,  // Center vertically
});
```

### IN-03: Missing Accessibility Attributes

**File:** `index.html:142-174`
**Issue:** Interactive controls lack ARIA labels and attributes for screen reader accessibility. File input, buttons, range sliders, and frame picker thumbnails should have descriptive labels.

**Fix:**
```html
<!-- Upload button -->
<button id="upload-btn" aria-label="Upload your profile photo">Upload Photo</button>
<input type="file" id="photo-upload" accept="image/png, image/jpeg" aria-label="Photo file selector">

<!-- Frame thumbnails -->
<div id="frame-1-thumb" class="frame-thumbnail" role="button" tabindex="0" aria-label="Select frame 1">Frame 1</div>
<div id="frame-2-thumb" class="frame-thumbnail" role="button" tabindex="0" aria-label="Select frame 2">Frame 2</div>

<!-- Range sliders -->
<label for="photo-scale">Photo Size</label>
<input type="range" id="photo-scale" min="0.5" max="2" step="0.1" value="1" aria-label="Adjust photo size from 50% to 200%">

<label for="frame-scale">Frame Size</label>
<input type="range" id="frame-scale" min="0.5" max="2" step="0.1" value="1" aria-label="Adjust frame size from 50% to 200%">

<!-- Download button -->
<button id="download-btn" aria-label="Download your framed profile picture">Download</button>
```

### IN-04: Range Input Event Handlers Not Yet Implemented

**File:** `index.html:159, 165`
**Issue:** Photo scale and frame scale range inputs (`#photo-scale`, `#frame-scale`) are present in the UI but have no event listeners. This is expected for Phase 1 (UI shell only), but should be implemented in Phase 2 when image manipulation logic is added.

**Fix:**
Add event listeners in future phase:
```javascript
// Add when image manipulation is implemented:
document.getElementById('photo-scale').addEventListener('input', function(e) {
  const scale = parseFloat(e.target.value);
  if (state.photoImage && !isNaN(scale) && scale > 0) {
    state.photoScale = scale;
    state.photoImage.scale({ x: scale, y: scale });
    photoLayer.draw();
  }
});

document.getElementById('frame-scale').addEventListener('input', function(e) {
  const scale = parseFloat(e.target.value);
  if (state.frameImage && !isNaN(scale) && scale > 0) {
    state.frameScale = scale;
    state.frameImage.scale({ x: scale, y: scale });
    frameLayer.draw();
  }
});
```

---

_Reviewed: 2026-04-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
