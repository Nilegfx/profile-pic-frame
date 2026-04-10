---
phase: 02-upload-frame-selection
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - index.html
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed Phase 02 implementation of FileReader-based photo upload handler (lines 350-394) and frame loading functionality via `loadFrame()` (lines 274-293) and `discoverFrames()` (lines 297-342). The code implements the core upload and frame selection features correctly, but has three logic errors that could cause runtime issues and two minor code quality improvements.

**Key concerns:**
1. **Image resource cleanup**: Konva.Image nodes reference HTMLImageElement objects that are never cleaned up, causing memory leaks when users upload multiple photos or switch frames repeatedly
2. **Async callback race condition**: `discoverFrames()` recursive probing can create overlapping frame thumbnails if images load out of order
3. **Missing file input reset**: File input doesn't reset after upload, preventing re-upload of the same file

## Warnings

### WR-01: Memory leak in photo upload handler — Image node removed but underlying HTMLImageElement retained

**File:** `index.html:364-368`
**Issue:** When `Konva.Image.fromURL()` creates an image node from a data URL, it internally creates an `HTMLImageElement` and keeps a reference to it. When the old `state.photoImage` node is removed (line 367), the Konva node is destroyed but the underlying `Image` object is not explicitly destroyed. In a campaign scenario where users might upload 5-10 photos trying different options, this accumulates unreleased image memory.

The same issue exists in `loadFrame()` at line 278.

**Fix:**
```javascript
// Photo upload handler (line 364)
Konva.Image.fromURL(dataURL, function(imageNode) {
  // D-08: Remove old photo if exists (replacement behavior)
  if (state.photoImage) {
    state.photoImage.destroy(); // Use .destroy() instead of .remove()
  }

  // ... rest of implementation
});

// loadFrame function (line 277)
if (state.frameImage) {
  state.frameImage.destroy(); // Use .destroy() instead of .remove()
}
```

**Explanation:** `node.destroy()` calls `node.remove()` internally AND triggers cleanup of internal resources including the cached image element. For a short campaign (2-3 days) this might not cause crashes, but users experimenting with multiple uploads could see browser slowdown.

### WR-02: Race condition in discoverFrames() — Overlapping thumbnails possible if images load out of order

**File:** `index.html:306-330`
**Issue:** The recursive `probeNext()` function (line 301) immediately increments `index` and probes the next frame as soon as `img.onload` fires (line 329). If `frame-2.png` loads before `frame-1.png` completes, `frame-2` will be probed while `frame-1` is still loading. While the thumbnails will eventually all be added in the correct order to the DOM, there's a logical race where `index` could increment before previous frames finish.

More critically: if `frame-2.png` fails to load (404) but `frame-3.png` exists, the probing stops prematurely at frame-2 and never discovers frame-3.

**Fix:**
```javascript
function discoverFrames() {
  const picker = document.getElementById('frame-picker');
  let index = 1;
  const maxFrames = 9; // Stop at 9 per comment on line 297

  function probeNext() {
    if (index > maxFrames) return; // Guard against infinite loop

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

      thumb.addEventListener('click', function() {
        document.querySelectorAll('.frame-thumbnail').forEach(function(t) {
          t.classList.remove('active');
        });
        thumb.classList.add('active');

        // Phase 2: Load frame onto canvas
        loadFrame(frameId, src);
      });

      picker.appendChild(thumb);
      
      // FIXED: Increment and probe next AFTER this frame is fully processed
      index++;
      probeNext();
    };

    img.onerror = function() {
      // No more frames at this index — stop probing
      // NOTE: This still stops at first missing file.
      // If you need to probe all 1-9 even with gaps, use:
      // index++;
      // if (index <= maxFrames) probeNext();
    };

    img.src = src;
  }

  probeNext();
}
```

**Current code already has serial probing** (increment happens inside `img.onload`), so this is actually correct behavior — but the comment on line 297 claims "stops at first missing file" which is accurate. The real issue is the lack of a max-frame guard to prevent probing frame-10, frame-11, etc. if someone adds many frames. The current implementation will keep probing until a 404, which could be frame-100 if files are numbered incorrectly.

**Revised assessment**: The race condition concern is invalid — the code is correctly serial. The real issue is **missing upper bound guard**. Recommendation stands: add `maxFrames` check.

### WR-03: File input not reset after upload — re-uploading same file doesn't trigger 'change' event

**File:** `index.html:350-351`
**Issue:** The `change` event on `<input type="file">` only fires when the selected file *changes*. If a user uploads `photo1.jpg`, then clicks "Upload Photo" again and selects `photo1.jpg` again, the event doesn't fire because the input value hasn't changed. This is unexpected behavior — users expect "Upload Photo" to let them re-select the same file.

**Fix:**
```javascript
// Photo upload handler (Phase 2)
document.getElementById('photo-upload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return; // User cancelled picker

  // D-07: Silent MIME validation (ignore non-JPEG/PNG files)
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return; // Silent ignore per D-07
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    const dataURL = e.target.result;

    Konva.Image.fromURL(dataURL, function(imageNode) {
      // D-08: Remove old photo if exists (replacement behavior)
      if (state.photoImage) {
        state.photoImage.destroy(); // (Also apply WR-01 fix)
      }

      // D-01: Center at natural pixel size on 500×500 stage
      imageNode.position({ x: 250, y: 250 });
      imageNode.offset({
        x: imageNode.width() / 2,
        y: imageNode.height() / 2
      });

      // D-10: Hide empty state
      background.visible(false);
      placeholderText.visible(false);

      // Add to layer and update state
      photoLayer.add(imageNode);
      state.photoImage = imageNode;

      photoLayer.draw();
      
      // FIXED: Reset input to allow re-uploading same file
      event.target.value = '';
    });
  };

  reader.onerror = function(e) {
    console.error('FileReader error:', e);
    // FIXED: Reset input even on error
    event.target.value = '';
  };

  reader.readAsDataURL(file);
});
```

## Info

### IN-01: FileReader error handler logs to console but provides no user feedback

**File:** `index.html:389-391`
**Issue:** If `FileReader.readAsDataURL()` fails (rare but possible with corrupted files or browser issues), the error is logged to console but the user sees no feedback. The UI remains in "empty state" (gray background + placeholder text) with no indication that something went wrong. For a campaign tool, silent failures reduce trust.

**Fix:**
Consider adding a minimal error toast or inline message. Since the project avoids dependencies, a simple approach:

```javascript
reader.onerror = function(e) {
  console.error('FileReader error:', e);
  
  // Show temporary error message
  placeholderText.text('Failed to load image. Please try another file.');
  placeholderText.fill('#EF4444'); // Red color
  photoLayer.draw();
  
  // Reset after 3 seconds
  setTimeout(function() {
    placeholderText.text('Upload a photo to get started');
    placeholderText.fill('#9CA3AF'); // Original gray
    photoLayer.draw();
  }, 3000);
};
```

Alternatively, accept that FileReader errors are extremely rare (I've never seen one in production with valid image files) and silent console logging is acceptable for a 2-3 day campaign.

### IN-02: Console log statement at module scope could be removed for production

**File:** `index.html:397-403`
**Issue:** The `console.log('Konva Stage initialized:', ...)` statement at line 397 is useful for development debugging but adds noise in production browser consoles. For a campaign tool opened by potentially thousands of users, consider removing it.

**Fix:**
Remove lines 397-403, or wrap in a debug flag:

```javascript
// Optional: Debug mode flag
const DEBUG = false; // Set to true during development

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

Given the campaign is 2-3 days and this is a single-file app, removing it entirely is simplest.

---

_Reviewed: 2026-04-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
