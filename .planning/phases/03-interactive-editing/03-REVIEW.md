---
phase: 03-interactive-editing
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - index.html
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-04-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `index.html` for Phase 3 interactive editing implementation. The code successfully implements photo upload, frame selection, and photo scaling using Konva.js. However, several issues were identified:

- **2 Critical issues:** Incorrect offset calculation in scaling logic and missing user feedback on file load errors
- **3 Warnings:** Missing error handling in image loading, potential race condition in photo replacement, and no bounds checking for future drag implementation
- **2 Info items:** Dead code (hidden frame scale slider) and production console.log statement

The most pressing issue is the offset calculation bug (CR-01), which causes photos to shift position incorrectly during scaling. This directly impacts the core user experience.

## Critical Issues

### CR-01: Incorrect offset calculation during photo scaling

**File:** `index.html:429-430`

**Issue:** The offset calculation multiplies `naturalWidth * scale / 2`, but this is mathematically incorrect for Konva's transform model. The `offset()` method defines the registration point (pivot point) for transformations, which should be based on the **natural (unscaled)** dimensions of the image, not the scaled dimensions. 

When you set `scaleX(scale)` and `scaleY(scale)`, Konva applies scaling relative to the offset point. By recalculating the offset with `* scale`, the code is effectively double-applying the scale factor, causing the image to shift position as the slider moves.

**Current behavior:** As the user drags the scale slider, the photo shifts position because the offset is being recalculated with scaled dimensions.

**Expected behavior:** The photo should scale uniformly around its center point without any position shift.

**Fix:**
```javascript
// Remove the scale multiplication — offset should use natural dimensions
imageNode.offset({
  x: naturalWidth / 2,
  y: naturalHeight / 2
});
```

**Root cause:** The offset defines where the "anchor point" is within the image coordinate space. Once set to the center (width/2, height/2), it should remain constant. Scaling then happens around that anchor point automatically.

---

### CR-02: FileReader error handler logs but doesn't notify user

**File:** `index.html:401-405`

**Issue:** When `FileReader.readAsDataURL()` fails (due to corrupted file, I/O error, or permissions issue), the error handler logs to console and resets the file input, but provides no user-facing feedback. From the user's perspective, they selected a file and nothing happened — no error message, no photo loaded, no indication of what went wrong.

This creates a confusing user experience, especially for non-technical users who won't check the browser console.

**Fix:**
```javascript
reader.onerror = function(e) {
  alert('Failed to load image. Please try another file.');
  console.error('FileReader error:', e);
  event.target.value = '';
};
```

**Alternative fix (better UX):** Replace `alert()` with an inline error message in the UI:
```javascript
reader.onerror = function(e) {
  // Assuming you add an error message element to the HTML
  const errorMsg = document.getElementById('upload-error');
  errorMsg.textContent = 'Failed to load image. Please try another file.';
  errorMsg.style.display = 'block';
  setTimeout(() => { errorMsg.style.display = 'none'; }, 5000);
  
  console.error('FileReader error:', e);
  event.target.value = '';
};
```

---

## Warnings

### WR-01: Missing error handling in Konva.Image.fromURL callbacks

**File:** `index.html:275` (frame loading) and `index.html:367` (photo loading)

**Issue:** Both calls to `Konva.Image.fromURL()` assume the callback will always receive a valid image node, but this is not guaranteed. If the image fails to decode (invalid data URL, corrupted image data, unsupported format), the callback receives `null` or `undefined`, and subsequent property access (`.destroy()`, `.position()`, `.width()`) will throw uncaught exceptions.

This is especially problematic for the frame loading path: if a frame PNG is corrupt or invalid, clicking that frame thumbnail will crash the canvas rendering.

**Fix for frame loading (line 275):**
```javascript
Konva.Image.fromURL(src, function(frameNode) {
  if (!frameNode) {
    console.error('Failed to load frame:', frameId);
    // Optionally: show error indicator on thumbnail
    return;
  }
  
  // Remove old frame if exists
  if (state.frameImage) {
    state.frameImage.destroy();
  }
  
  // ... rest of existing code
});
```

**Fix for photo loading (line 367):**
```javascript
Konva.Image.fromURL(dataURL, function(imageNode) {
  if (!imageNode) {
    alert('Failed to load image. Please try another file.');
    console.error('Image decode failed');
    event.target.value = '';
    return;
  }
  
  // ... rest of existing code
});
```

---

### WR-02: Race condition in rapid photo upload

**File:** `index.html:368-371`

**Issue:** If a user rapidly clicks "Upload Photo" and selects two files in quick succession, the following sequence can occur:

1. First file selected → `FileReader.readAsDataURL()` starts
2. Second file selected → `FileReader.readAsDataURL()` starts (before first completes)
3. First reader completes → `Konva.Image.fromURL()` starts async load
4. Second reader completes → `Konva.Image.fromURL()` starts async load
5. First image loads → sets `state.photoImage`, calls `destroy()` on null
6. Second image loads → calls `destroy()` on first image before it's fully rendered

The result is unpredictable: the first image might not be properly cleaned up, or both images might briefly appear on the canvas, or the wrong image might end up in `state.photoImage`.

**Fix:** Add a loading flag to prevent concurrent uploads:
```javascript
// Add to state object at top of script:
const state = {
  photoImage: null,
  frameImage: null,
  photoScale: 1,
  frameScale: 1,
  selectedFrame: null,
  isLoadingPhoto: false  // NEW: prevent concurrent uploads
};

// Update photo upload handler:
document.getElementById('photo-upload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Prevent concurrent uploads
  if (state.isLoadingPhoto) {
    console.warn('Photo upload already in progress');
    event.target.value = '';
    return;
  }
  
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return;
  }
  
  const reader = new FileReader();
  state.isLoadingPhoto = true;  // Set flag
  
  reader.onload = function(e) {
    const dataURL = e.target.result;
    
    Konva.Image.fromURL(dataURL, function(imageNode) {
      state.isLoadingPhoto = false;  // Clear flag
      
      if (!imageNode) {
        alert('Failed to load image. Please try another file.');
        event.target.value = '';
        return;
      }
      
      // ... rest of existing code
    });
  };
  
  reader.onerror = function(e) {
    state.isLoadingPhoto = false;  // Clear flag on error too
    console.error('FileReader error:', e);
    event.target.value = '';
  };
  
  reader.readAsDataURL(file);
});
```

---

### WR-03: No bounds checking for photo positioning (drag implementation)

**File:** `index.html:374-378`

**Issue:** While drag functionality isn't implemented yet (likely planned for Phase 3 or 4), the current centering logic has no bounds checking. When `imageNode.draggable(true)` is added in a future phase, users will be able to drag photos completely off-canvas with no way to recover them except re-uploading.

This is a forward-looking warning: when drag is implemented, bounds checking must be added.

**Fix:** When implementing drag, add `dragBoundFunc`:
```javascript
// After setting position and offset, add draggable behavior:
imageNode.draggable(true);
imageNode.dragBoundFunc(function(pos) {
  // Ensure at least 50px of the image remains visible for grab handles
  const stageWidth = 500;
  const stageHeight = 500;
  const imgWidth = this.width() * this.scaleX();
  const imgHeight = this.height() * this.scaleY();
  
  // Calculate bounds
  const minX = -imgWidth + 50;
  const maxX = stageWidth - 50;
  const minY = -imgHeight + 50;
  const maxY = stageHeight - 50;
  
  return {
    x: Math.max(minX, Math.min(pos.x, maxX)),
    y: Math.max(minY, Math.min(pos.y, maxY))
  };
});
```

**Note:** If drag is not planned for the campaign timeline, this warning can be ignored. However, the Konva setup (separate layers, centered positioning) suggests drag may be a planned feature.

---

## Info

### IN-01: Frame scale slider hidden but still in DOM

**File:** `index.html:198-201`

**Issue:** The "Frame Size" slider control is set to `display:none` but remains in the DOM. Based on the project requirements (frames should fill the 500×500 stage), this control appears to be dead code. It's unclear whether:

1. Frame scaling was intentionally removed from the design
2. It's planned for a future phase
3. It's leftover from earlier prototyping

Keeping unused controls in the DOM increases complexity and could confuse future maintainers.

**Fix:** If frame scaling is not planned for the campaign, remove the control entirely:
```html
<!-- Remove lines 198-201: -->
<!-- Frame Size Slider -->
<div class="control-group" style="display:none">
  <label for="frame-scale">Frame Size</label>
  <input type="range" id="frame-scale" min="0.5" max="2" step="0.1" value="1">
</div>
```

If it's planned for a future phase, add a comment explaining why it's hidden:
```html
<!-- Frame Size Slider (hidden until Phase X when frame scaling is implemented) -->
<div class="control-group" style="display:none">
  ...
</div>
```

---

### IN-02: Console.log statement in production code

**File:** `index.html:441-447`

**Issue:** The Konva Stage initialization success log remains in the code. While useful during development, console logs should generally be removed or wrapped in a debug flag for production deployment:

1. They clutter the browser console for end users
2. They can expose internal implementation details
3. They have (minor) performance overhead

**Current code:**
```javascript
console.log('Konva Stage initialized:', {
  width: stage.width(),
  height: stage.height(),
  layers: stage.children.length,
  photoLayerNodes: photoLayer.children.length,
  frameLayerNodes: frameLayer.children.length
});
```

**Fix option 1 (remove entirely):**
```javascript
// Just delete lines 440-447
```

**Fix option 2 (debug flag):**
```javascript
// Add at top of script block:
const DEBUG = false;  // Set to true during development

// Then wrap the log:
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

**Recommendation:** Given the 2-3 day campaign timeline and single-file architecture, removing the log entirely (option 1) is the simplest approach. If debugging is needed during the campaign, it can be temporarily re-added.

---

_Reviewed: 2026-04-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
