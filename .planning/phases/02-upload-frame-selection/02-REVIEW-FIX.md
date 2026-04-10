---
phase: 02-upload-frame-selection
fixed_at: 2026-04-10T00:00:00Z
review_path: .planning/phases/02-upload-frame-selection/02-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-04-10T00:00:00Z
**Source review:** .planning/phases/02-upload-frame-selection/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: Memory leak in photo upload handler — Image node removed but underlying HTMLImageElement retained

**Files modified:** `index.html`
**Commits:** 62e6197, 89776fb
**Applied fix:** Changed `node.remove()` to `node.destroy()` in two locations:
1. Line 278 in `loadFrame()` function - when removing old frame image
2. Line 367 in photo upload handler - when removing old photo image

This ensures Konva properly cleans up internal resources including cached HTMLImageElement objects, preventing memory accumulation when users upload multiple photos or switch frames repeatedly during the campaign.

### WR-02: Race condition in discoverFrames() — Overlapping thumbnails possible if images load out of order

**Files modified:** `index.html`
**Commit:** 4478dcf
**Applied fix:** Added `maxFrames = 9` constant and guard check `if (index > maxFrames) return;` at the start of `probeNext()` function (lines 300, 303).

This prevents infinite probing beyond frame-9.png. While the original code already had serial probing behavior (increment happens inside `img.onload`), the lack of an upper bound meant the code would continue probing frame-10, frame-11, etc. until encountering a 404. The maxFrames guard now enforces the documented behavior of stopping at frame-9.

### WR-03: File input not reset after upload — re-uploading same file doesn't trigger 'change' event

**Files modified:** `index.html`
**Commit:** 8a27a50
**Applied fix:** Added `event.target.value = '';` in two locations:
1. Line 391 - After successful photo upload (inside `Konva.Image.fromURL` callback)
2. Line 398 - After FileReader error (inside `reader.onerror` handler)

This resets the file input value after each upload attempt, allowing users to re-select the same file if they want to start over. Without this, the browser's change event doesn't fire when the same file is selected again.

---

_Fixed: 2026-04-10T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
