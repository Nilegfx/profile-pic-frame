---
phase: 03-interactive-editing
plan: 01
subsystem: interactive-canvas
tags: [konva, slider, real-time-scaling, user-input]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [photo-scaling-control, aspect-ratio-lock, centered-scaling]
  affects: [canvas-rendering, photo-layer]
tech_stack:
  added: []
  patterns: [event-driven-scaling, offset-recalculation, frame-rate-throttling]
key_files:
  created: []
  modified: [index.html]
decisions:
  - Use batchDraw() instead of draw() for frame-rate throttled rendering during slider drag
  - Recalculate offset on every scale event to maintain visual center at (250, 250)
  - Reset slider to 1.0 on new photo upload to ensure consistent starting state
  - Hide Frame Size slider via inline style display:none (frame fixed at 500×500)
metrics:
  duration_seconds: 108
  tasks_completed: 3
  files_modified: 1
  commits: 3
  completed_at: "2026-04-10T20:22:42Z"
---

# Phase 03 Plan 01: Interactive Photo Scaling Summary

**One-liner:** Real-time photo scaling with aspect ratio lock, centered positioning via offset recalculation, and slider reset on upload

## What Was Built

Wired the Photo Size slider to scale the uploaded photo in real-time while maintaining aspect ratio and centered position at (250, 250) on the canvas. Implemented slider reset behavior to ensure new photo uploads always start at 1.0 scale. Hidden the Frame Size slider from UI per scope decision (frame is fixed at 500×500).

### Key Functionality

**Photo Size Slider (Task 1):**
- Added `input` event listener on `#photo-scale` slider for continuous real-time feedback during drag
- Applied uniform scaling via `scaleX(scale)` and `scaleY(scale)` to preserve aspect ratio
- Recalculated offset on every slider event as `{x: naturalWidth * scale / 2, y: naturalHeight * scale / 2}` to maintain visual center
- Position remains fixed at (250, 250) — only offset changes with scale
- Used `photoLayer.batchDraw()` for frame-rate throttled rendering (prevents excessive redraws during drag)
- Guard condition prevents errors when no photo is loaded

**Slider Reset on Upload (Task 2):**
- Extended photo upload handler to reset three values when new photo loads:
  - DOM slider value: `document.getElementById('photo-scale').value = 1`
  - App state: `state.photoScale = 1`
  - Konva node scale: `imageNode.scaleX(1)` and `imageNode.scaleY(1)`
- Ensures new photos always appear at default scale regardless of previous slider position

**Frame Slider Hidden (Task 3):**
- Added `style="display:none"` to Frame Size control group
- Frame remains fixed at 500×500 and is not user-scalable per scope decision
- HTML element retained in DOM for potential future reversion

## Technical Implementation

### Centering Formula

The centering pattern established in Phase 2:
```javascript
imageNode.position({ x: 250, y: 250 });
imageNode.offset({ x: width / 2, y: height / 2 });
```

When scaling, the offset must be recalculated because offset is in local (unscaled) coordinate space:
```javascript
// Without scale: offset = naturalWidth / 2
// With scale: offset = naturalWidth * scale / 2
imageNode.offset({
  x: naturalWidth * scale / 2,
  y: naturalHeight * scale / 2
});
```

This compensates for the scaling transform and maintains the visual center at stage coordinates (250, 250).

### Performance Optimization

Used `photoLayer.batchDraw()` instead of `draw()` for frame-rate throttled rendering. Konva's `batchDraw()` batches multiple rapid updates and renders at most once per animation frame, preventing excessive redraws during slider drag.

### Event Pattern

Chose `input` event over `change` event:
- `input`: Fires continuously during drag (real-time feedback)
- `change`: Only fires on mouseup (delayed feedback)

Per requirement PRV-01 (real-time preview), `input` provides immediate visual feedback as the user adjusts the slider.

## Deviations from Plan

None — plan executed exactly as written. All three tasks implemented according to specification with no blocking issues or architectural changes required.

## Requirements Satisfied

- **EDT-01** (Photo scaling with aspect ratio lock): Uniform scaleX/scaleY application preserves aspect ratio
- **EDT-03** (Centered images): Offset recalculation maintains visual center during scaling
- **PRV-01** (Real-time preview): `input` event + `batchDraw()` provides smooth real-time feedback

## Files Modified

| File | Lines Changed | Purpose |
|------|--------------|---------|
| index.html | +37 / -1 | Added photo slider event handler (30 lines), slider reset logic (4 lines), hidden frame slider (1 line modified) |

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | fcb73ae | feat(03-01): wire Photo Size slider for real-time scaling |
| 2 | ad0f5dc | feat(03-01): reset Photo Size slider on new upload |
| 3 | fd99a88 | feat(03-01): hide Frame Size slider from UI |

## Verification Status

All automated tests passed:
- Photo slider input event handler exists
- Uniform scale applied (scaleX and scaleY)
- Offset recalculation with scale factor implemented
- State photoScale updated on slider events
- batchDraw() called for optimized rendering
- Guard for no photo loaded scenario
- Slider reset in upload handler (DOM value, state, node scale)
- Frame slider hidden from UI (display:none)
- Frame slider HTML retained in DOM

## Known Issues

None.

## Next Steps

Phase 4 (Canvas Export) ready to begin:
- Implement Download button to export composited canvas as PNG
- Use Konva's `stage.toDataURL()` for high-quality export
- Handle pixel ratio for retina displays
- Wire download trigger to save file locally

## Self-Check: PASSED

**Created files verified:**
- No new files created (all changes in existing index.html)

**Commits verified:**
```
fcb73ae feat(03-01): wire Photo Size slider for real-time scaling
ad0f5dc feat(03-01): reset Photo Size slider on new upload
fd99a88 feat(03-01): hide Frame Size slider from UI
```

**Modified files verified:**
- index.html exists and contains all three task implementations

All claims verified successfully.
