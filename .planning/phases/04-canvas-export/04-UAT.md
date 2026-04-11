---
status: complete
phase: 04-canvas-export
source: [04-01-SUMMARY.md]
started: 2026-04-11T00:45:00Z
updated: 2026-04-11T01:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Buttons disabled before photo upload
expected: Both Download and ▾ buttons are gray with not-allowed cursor. Clicking does nothing.
result: pass

### 2. Buttons enable after photo upload
expected: After uploading a photo, both the Download (1×) button and ▾ arrow turn orange (#FF6B35). Cursor changes to pointer.
result: pass

### 3. Arrow opens dropdown
expected: Clicking ▾ opens a dropdown below the button showing "✓ 1× (500px)" with checkmark and "2× (1000px)" without checkmark.
result: pass

### 4. Resolution selection updates label
expected: Clicking "2× (1000px)" in the dropdown changes the button label to "Download (2×)", moves the checkmark to the 2× item, and closes the dropdown.
result: pass

### 5. Outside click and Escape close dropdown
expected: With dropdown open — clicking anywhere outside the button closes it. Pressing Escape also closes it.
result: pass

### 6. Download at 1× produces 500×500px PNG
expected: With resolution set to 1×, clicking Download saves a file named profile.png. Inspecting it shows 500×500 pixels.
result: pass

### 7. Download at 2× produces 1000×1000px PNG
expected: With resolution set to 2×, clicking Download saves profile.png at 1000×1000 pixels. Image is sharp, not just scaled up.
result: pass

### 8. Composited PNG shows photo under frame
expected: The downloaded PNG contains both the user's photo and the selected frame overlay layered correctly (photo below, frame on top). Frame transparent areas are transparent (no white fill).
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
