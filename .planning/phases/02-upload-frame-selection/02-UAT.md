---
status: complete
phase: 02-upload-frame-selection
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-04-10T00:00:00Z
updated: 2026-04-10T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Upload a Photo
expected: Open the app in a browser (served via HTTP or opened directly). Click the "Upload Photo" button. Select a JPEG or PNG image from your file system. The selected photo should appear centered on the 500×500 canvas. The gray empty-state background and placeholder text should disappear.
result: pass

### 2. Re-upload Replaces Previous Photo
expected: With a photo already on the canvas, click "Upload Photo" again and select a different image. The new photo should replace the old one — only the new photo is visible. No stacking or ghosting of the previous photo.
result: pass

### 3. Non-Image File Upload (Silent Ignore)
expected: Try uploading a non-image file (e.g. a .txt, .pdf, or other non-JPEG/PNG). The canvas should remain unchanged — the previously uploaded photo (if any) stays as-is. No error message, no crash.
result: pass

### 4. Click Frame Thumbnail to Load Frame
expected: With or without a photo uploaded, click one of the frame thumbnails in the frame picker. A frame PNG should load onto the canvas, filling the full 500×500 stage. The clicked thumbnail should show an orange active border.
result: pass

### 5. Switching Frames Replaces Previous
expected: With a frame already loaded, click a different frame thumbnail. The previous frame should disappear and only the new frame should be visible on the canvas. No stacking of frames.
result: pass

### 6. Frame Persists When Uploading a Photo
expected: First click a frame to load it. Then upload a photo. The frame should remain visible on top of the photo — the photo upload does not remove or hide the frame.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
