---
phase: 05-konva-drag-transform-editing
plan: 01
subsystem: interactive-editing
tags: [konva, transformer, drag, resize, ui-polish]

dependency_graph:
  requires: [phase-04-canvas-export]
  provides: [interactive-photo-editing, transformer-handles, drag-to-position]
  affects: [photo-layer, export-handler, ui-controls]

tech_stack:
  added: [Konva.Transformer, dragBoundFunc]
  patterns: [hide-before-export, boundary-clamping, corner-only-anchors]

key_files:
  created: []
  modified:
    - path: index.html
      lines_changed: 112
      description: "Added transformerLayer with Transformer node, enabled photo drag with boundary constraints, removed photo slider UI/JS"

decisions:
  - id: D-01
    summary: "Corner-only anchors (no edge/rotation anchors)"
    rationale: "Profile pics need resize but not rotation or aspect-ratio-breaking edge handles"
  - id: D-02
    summary: "keepRatio: true (aspect-ratio locked)"
    rationale: "Prevents photo distortion, matches user expectation from Canva/Figma"
  - id: D-03
    summary: "Orange styling (#FF6B35) for transformer handles"
    rationale: "Matches app's existing accent color from buttons and frame picker"
  - id: D-07
    summary: "50px minimum visibility constraint for drag"
    rationale: "Ensures user can always grab and reposition photo even if dragged near edge"
  - id: D-12
    summary: "Hide transformer and transformerLayer before export"
    rationale: "Prevents orange handles from appearing in downloaded PNG"

metrics:
  duration_seconds: 141
  tasks_completed: 4
  files_modified: 1
  commits: 4
  lines_added: 62
  lines_removed: 50
  completed_at: "2026-04-11T02:20:59Z"
---

# Phase 05 Plan 01: Konva Drag & Transform Editing Summary

**One-liner:** Replaced photo scale slider with Konva Transformer node providing interactive corner-handle resize and drag-to-position with boundary constraints.

## What Was Built

Replaced the abstract Photo Size slider with direct manipulation controls:

1. **Transformer layer and node** — Added a third Konva layer (`transformerLayer`) above the frame layer with a `Transformer` node styled with orange corner handles (#FF6B35), white strokes, and aspect-ratio locking (`keepRatio: true`). Transformer is hidden initially and shown after photo upload.

2. **Draggable photo with boundary constraints** — Enabled `draggable: true` on photo nodes and added `dragBoundFunc` to clamp position so at least 50px of the image remains visible within the 500×500 stage. Prevents photo from being dragged completely off-canvas.

3. **Transformer attachment on upload** — After photo upload completes, `transformer.nodes([imageNode])` attaches the transformer to the photo node and `transformer.show()` makes handles visible immediately.

4. **Hide/show pattern in export** — Wrapped the `stage.toDataURL()` call in the download handler with `transformer.hide()` + `transformerLayer.hide()` before export and `transformer.show()` + `transformerLayer.show()` after. Ensures downloaded PNG has no visible handles or transformer UI.

5. **Photo slider removal** — Removed the Photo Size slider HTML (`<label>` + `<input type="range">`), its event listener, and all related state properties (`photoScale`, `frameScale`) and reset logic. Also removed the hidden frame-scale slider (dead code cleanup). UI now shows only Upload button and Download split-button in the controls row.

## Verification Results

**Automated checks (all passed):**
- ✓ `transformerLayer` created and added to stage
- ✓ `transformer` node created with `keepRatio: true`, corner-only `enabledAnchors`, orange styling
- ✓ `state.transformer` reference stored
- ✓ `imageNode.draggable(true)` in upload handler
- ✓ `dragBoundFunc` with 50px `minVisible` constraint
- ✓ `transformer.nodes([imageNode])` and `transformer.show()` in upload handler
- ✓ `transformer.hide()` + `transformerLayer.hide()` before `toDataURL()`
- ✓ `transformer.show()` + `transformerLayer.show()` after `toDataURL()`
- ✓ No `photo-scale` HTML or JS references remain
- ✓ No `photoScale` or `frameScale` in state object

**Manual UAT (recommended):**
1. Open `index.html` in browser (Chrome 90+, Firefox 88+, Safari 14.1+)
2. Upload a JPEG/PNG photo → verify orange corner handles appear
3. Click and drag photo → verify smooth movement
4. Drag photo to edge → verify at least 50px remains visible
5. Drag corner handle → verify photo scales with aspect ratio locked
6. Download at 1× resolution → verify PNG has no orange handles
7. Download at 2× resolution → verify PNG has no handles, correct size (1000×1000)

## Deviations from Plan

None — plan executed exactly as written. All 4 tasks completed without requiring Rule 1-3 auto-fixes or Rule 4 architectural decisions.

## Known Stubs

None found. Photo and frame layers are fully wired for interactive editing and export.

## Threat Flags

None. No new network requests, API endpoints, or auth paths introduced. All operations are local canvas transformations.

## Files Modified

| File | Changes | Description |
|------|---------|-------------|
| index.html | +62 / -50 lines | Added transformerLayer + Transformer node, enabled photo drag with boundary constraints, removed photo slider UI/JS |

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 40d93dc | feat | Add transformer layer with orange corner handles |
| 47a99ed | feat | Enable photo drag with boundary constraints |
| 7a32eec | feat | Attach transformer to photo and hide from export |
| 4dfe65c | refactor | Remove photo slider UI and JS |

## Self-Check

**Status:** PASSED

**Created files:** None (modification-only plan)

**Modified files:**
```bash
FOUND: /Users/amahmoud/Documents/development/personal/playgrounds/profile-pic-frame/index.html
```

**Commits:**
```bash
FOUND: 40d93dc
FOUND: 47a99ed
FOUND: 7a32eec
FOUND: 4dfe65c
```

All claims verified.
