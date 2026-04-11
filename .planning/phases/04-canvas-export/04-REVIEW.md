---
phase: 04-canvas-export
reviewed: 2026-04-11T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - index.html
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-04-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed the complete single-file web application (`index.html`) containing HTML, CSS, and JavaScript for a profile picture frame editor built with Konva.js. The application allows users to upload photos, select frames, adjust sizing, and export composited images at multiple resolutions.

**Key concerns:**
- Missing error handling for edge cases in image operations
- Potential race conditions in concurrent image loading scenarios
- Offset calculation logic has a correctness issue that could cause misalignment
- Several code quality issues including magic numbers and missing cleanup

The application has no critical security vulnerabilities but has several logic issues that could cause bugs under edge cases or repeated use.

## Warnings

### WR-01: Incorrect Offset Recalculation After Scaling

**File:** `index.html:618-622`
**Issue:** The offset recalculation during photo scaling uses `naturalWidth * scale / 2` and `naturalHeight * scale / 2`, but the offset should be based on the original dimensions (without scale), not the scaled dimensions. The current logic incorrectly applies scale to the offset calculation, which will cause the image to drift off-center as users adjust the slider.

The offset in Konva represents the "pivot point" in the node's own coordinate system (before transforms are applied), so it should always be `width / 2` and `height / 2` without multiplying by scale.

**Fix:**
```javascript
// Lines 618-622 — remove scale multiplication from offset
imageNode.offset({
  x: naturalWidth / 2,   // Do NOT multiply by scale
  y: naturalHeight / 2   // Do NOT multiply by scale
});
```

### WR-02: FileReader Error Handler Doesn't Prevent State Corruption

**File:** `index.html:590-596`
**Issue:** When `reader.onerror` fires, the error handler resets `state.isLoadingPhoto` and shows an alert, but it doesn't check whether `Konva.Image.fromURL` already executed (if the error occurs late). This could leave a partially loaded or corrupted image in `state.photoImage`.

Additionally, if the user uploads a new photo while a previous upload is processing and then the first upload's `reader.onload` completes, it could overwrite the second photo unexpectedly.

**Fix:**
```javascript
reader.onerror = function(e) {
  state.isLoadingPhoto = false;
  
  // Clear any partially loaded image
  if (state.photoImage) {
    state.photoImage.destroy();
    state.photoImage = null;
  }
  
  // Restore empty state UI
  background.visible(true);
  placeholderText.visible(true);
  photoLayer.draw();
  
  alert('Failed to load image. Please try another file.');
  console.error('FileReader error:', e);
  event.target.value = '';
};
```

### WR-03: Frame Discovery Infinite Loop Protection Is Insufficient

**File:** `index.html:466-512`
**Issue:** The `discoverFrames()` function has a `maxFrames = 9` guard (line 469) and checks `if (index > maxFrames) return;` (line 472), but if the `img.onload` callback is invoked after this check passes (e.g., due to caching), the function could still probe beyond index 9.

More critically, if `img.onerror` never fires (e.g., network timeout without error), the recursive `probeNext()` could stall and never terminate. There's no timeout protection.

**Fix:**
```javascript
function discoverFrames() {
  const picker = document.getElementById('frame-picker');
  let index = 1;
  const maxFrames = 9;
  const timeoutMs = 3000; // 3 second timeout per probe

  function probeNext() {
    if (index > maxFrames) return;

    const frameId = 'frame-' + index;
    const src = frameId + '.png';
    const img = new Image();
    
    let timedOut = false;
    const timeoutId = setTimeout(function() {
      timedOut = true;
      console.warn('Frame probe timeout:', frameId);
      // Stop probing on timeout
    }, timeoutMs);

    img.onload = function() {
      if (timedOut) return; // Don't process if timed out
      clearTimeout(timeoutId);
      
      // Guard: check again in case multiple loads race
      if (index > maxFrames) return;
      
      const thumb = document.createElement('div');
      thumb.id = frameId + '-thumb';
      thumb.className = 'frame-thumbnail';
      thumb.dataset.frame = frameId;

      const imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.alt = 'Frame ' + index;
      thumb.appendChild(imgEl);

      thumb.addEventListener('click', function() {
        document.querySelectorAll('.frame-thumbnail').forEach(function(t) {
          t.classList.remove('active');
        });
        thumb.classList.add('active');
        loadFrame(frameId, src);
      });

      picker.appendChild(thumb);
      index++;
      probeNext();
    };

    img.onerror = function() {
      if (timedOut) return; // Already handled
      clearTimeout(timeoutId);
      // Stop probing on error
    };

    img.src = src;
  }

  probeNext();
}
```

### WR-04: Download Button State Not Reset on Photo Upload Failure

**File:** `index.html:544-587`
**Issue:** If `Konva.Image.fromURL` fails (line 547-552), the error handler shows an alert but doesn't call `updateDownloadState()`. If a user previously uploaded a valid photo (enabling the download button), then uploads a corrupt file, the download button will remain enabled even though `state.photoImage` is now null (destroyed at line 556).

This creates a state inconsistency where clicking "Download" would trigger the guard at line 731-734 and log a warning, but the button should never be enabled in this state.

**Fix:**
```javascript
// Line 547-552 — add updateDownloadState() call after destroying image
if (!imageNode) {
  state.photoImage = null; // Explicitly null the state
  updateDownloadState();   // Disable download button
  alert('Failed to load image. Please try another file.');
  console.error('Image decode failed');
  event.target.value = '';
  return;
}
```

## Info

### IN-01: Magic Numbers Should Be Constants

**File:** `index.html:397-435`
**Issue:** The canvas dimensions (500×500) and other magic numbers (250 for centering, 242 for text position) are hardcoded throughout the file (lines 399, 400, 414-415, 426, 429, 451-453, 560, etc.). This makes it difficult to change the canvas size if needed during the campaign.

**Fix:** Define constants at the top of the `<script>` block:
```javascript
// Configuration constants
const STAGE_WIDTH = 500;
const STAGE_HEIGHT = 500;
const STAGE_CENTER_X = STAGE_WIDTH / 2;
const STAGE_CENTER_Y = STAGE_HEIGHT / 2;

// Then use throughout:
const stage = new Konva.Stage({
  container: 'stage-container',
  width: STAGE_WIDTH,
  height: STAGE_HEIGHT,
});
```

### IN-02: Missing Null Check Before DOM Manipulation in discoverFrames

**File:** `index.html:467`
**Issue:** `document.getElementById('frame-picker')` could return `null` if the DOM element is missing, but the function doesn't check before calling `picker.appendChild(thumb)` at line 499. This would throw an error if the HTML structure is modified.

**Fix:**
```javascript
function discoverFrames() {
  const picker = document.getElementById('frame-picker');
  if (!picker) {
    console.error('Frame picker element not found');
    return;
  }
  // ... rest of function
}
```

### IN-03: Event Handler Memory Leak Risk

**File:** `index.html:489-497`
**Issue:** Each frame thumbnail gets a click event listener (line 489), but these listeners are never removed. For a short-lived campaign tool with static frame discovery this is low-risk, but if frames were dynamically re-discovered (e.g., after adding frames), old listeners would accumulate.

**Fix:** If dynamic frame updates are ever needed, use event delegation:
```javascript
// Instead of per-thumbnail listeners, use one delegated listener on the picker:
document.getElementById('frame-picker').addEventListener('click', function(event) {
  const thumb = event.target.closest('.frame-thumbnail');
  if (!thumb) return;
  
  document.querySelectorAll('.frame-thumbnail').forEach(function(t) {
    t.classList.remove('active');
  });
  thumb.classList.add('active');
  
  const frameId = thumb.dataset.frame;
  const src = frameId + '.png';
  loadFrame(frameId, src);
});
```

### IN-04: ParseFloat Without Validation in Slider Handler

**File:** `index.html:605`
**Issue:** `parseFloat(event.target.value)` is called without validating the result. While HTML5 `<input type="range">` guarantees numeric output, if the DOM is manipulated or the event is spoofed, this could produce `NaN` and cause silent rendering bugs.

**Fix:**
```javascript
const scale = parseFloat(event.target.value);
if (isNaN(scale) || scale < 0.5 || scale > 2) {
  console.error('Invalid scale value:', event.target.value);
  return;
}
```

### IN-05: Console.warn on Concurrent Upload Is Insufficient

**File:** `index.html:527-531`
**Issue:** When a concurrent upload is detected, the code logs a warning and resets the file input, but doesn't provide user feedback. Since this is a race condition that could happen with fast double-clicks on the upload button, the user might be confused why nothing happened.

**Fix:**
```javascript
if (state.isLoadingPhoto) {
  alert('Please wait for the current photo to finish loading.');
  console.warn('Photo upload already in progress');
  event.target.value = '';
  return;
}
```

---

_Reviewed: 2026-04-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
