---
phase: 02-upload-frame-selection
plan: 01
subsystem: photo-upload
tags: [upload, file-api, konva, image-loading]
dependency_graph:
  requires: [01-01-foundation-ui-shell]
  provides: [photo-upload-flow, photo-layer-management]
  affects: [state.photoImage, photoLayer]
tech_stack:
  added: [FileReader API, Konva.Image.fromURL]
  patterns: [Data URL pipeline, node replacement, centering with offset]
key_files:
  created: []
  modified: [index.html]
decisions:
  - Photo loads at natural pixel size, centered on 500×500 stage
  - Old photo removed before new photo added (replacement behavior)
  - Empty state hidden after first upload
  - Silent MIME validation (no error messages)
  - Frame persistence on photo re-upload (handler doesn't touch frameLayer)
metrics:
  duration: 60
  tasks_completed: 1
  files_modified: 1
  completed_date: "2026-04-10"
requirements:
  - UPL-01
  - UPL-02
  - UPL-03
---

# Phase 02 Plan 01: Photo Upload with FileReader Summary

**One-liner:** Client-side photo upload via FileReader → Data URL → Konva.Image, centered at natural size with empty state removal.

## What Was Built

Implemented the photo upload flow that reads a user-selected JPEG or PNG file client-side using FileReader, converts it to a Data URL, loads it as a Konva.Image node, centers it on the 500×500 stage at natural pixel size, and hides the empty state placeholder.

**Core functionality:**
- File input change event listener wired to FileReader.readAsDataURL()
- Data URL passed to Konva.Image.fromURL() for canvas rendering
- Photo centered using position (250, 250) with offset (width/2, height/2)
- Old photo node removed before new one added (replacement behavior)
- Empty state (gray background + placeholder text) hidden on first upload
- Silent MIME validation (non-JPEG/PNG files ignored with no error message)
- Frame layer untouched by photo upload (frame persists on re-upload)

**Technical implementation:**
- Single change event listener added after line 323 in index.html
- FileReader onload callback chains to Konva.Image.fromURL callback
- State management: `state.photoImage` updated to reference new node
- Layer rendering: explicit `photoLayer.draw()` call for immediate feedback

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria met, no bugs discovered, no missing critical functionality, no architectural changes needed.

## Verification Results

**Automated verification (grep patterns):**
- ✓ All 13 acceptance criteria patterns found in index.html
- ✓ change event listener exists
- ✓ FileReader instantiation present
- ✓ readAsDataURL call present
- ✓ Konva.Image.fromURL call present
- ✓ Position centering at (250, 250)
- ✓ Offset centering with width/height
- ✓ Old photo removal before new add
- ✓ photoLayer.add(imageNode)
- ✓ state.photoImage assignment
- ✓ background.visible(false)
- ✓ placeholderText.visible(false)
- ✓ photoLayer.draw()
- ✓ MIME validation (both JPEG and PNG checked)

**Manual verification recommended:**
1. Serve index.html via HTTP server or open directly in browser
2. Click "Upload Photo" button
3. Select JPEG or PNG file
4. Verify photo appears centered on canvas at natural size
5. Verify empty state (gray background + placeholder text) disappears
6. Upload different photo
7. Verify new photo replaces old one (only one visible)
8. Try uploading non-image file (if possible via drag-drop)
9. Verify canvas unchanged (silent ignore)
10. Check browser console for no errors

## Integration Notes

**For Plan 02 (Frame Selection):**
- `state.photoImage` is now populated after photo upload - frame loading can reference this
- `photoLayer` contains the photo node - frame should be added to `frameLayer` (separate layer)
- Photo upload handler does NOT modify `frameLayer` or `state.frameImage` - frame selection is independent

**For Plan 03 (Interactive Editing):**
- Photo scale slider can target `state.photoImage.scale()` once scaling is implemented
- Photo is currently at natural size (scale 1.0) - no transforms applied yet
- Drag behavior not implemented - photo is static at stage center

**State contracts established:**
- `state.photoImage` is null before first upload, then references the current Konva.Image node
- `background` and `placeholderText` are visible before first upload, hidden after
- `photoLayer` is redrawn after every photo upload (explicit draw() call)

## Known Issues

None identified during implementation or verification.

## Self-Check: PASSED

**Created files verification:**
- No files created (only index.html modified)

**Modified files verification:**
- ✓ index.html modified at lines 326-374 (photo upload handler added)

**Commits verification:**
- ✓ Commit 8c99af1 exists: "feat(02-01): implement photo upload with FileReader and Konva.Image loading"

**Functionality verification:**
- ✓ All acceptance criteria patterns present in code
- ✓ No frameLayer references in photo upload handler (D-09 frame persistence verified)
- ✓ MIME validation present (D-07 silent ignore)
- ✓ Node replacement logic present (D-08)
- ✓ Empty state hiding present (D-10)
- ✓ Centering with offset present (D-01)

All claims verified. Implementation complete and ready for Plan 02 (Frame Selection).
