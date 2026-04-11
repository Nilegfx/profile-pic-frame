---
status: awaiting_human_verify
trigger: "konva-phase5-bugs"
created: 2026-04-11T00:00:00Z
updated: 2026-04-11T00:06:00Z
---

## Current Focus

hypothesis: ALL THREE FIXES APPLIED - Verifying resolution
test: Testing all three reproduction scenarios
expecting: (1) Drag works after frame selection (2) Grab cursor shows on hover (3) Handles fully visible
next_action: Request human verification

## Symptoms

expected:
  1. Drag should work on the photo even after a frame is selected/loaded
  2. Hovering over the photo should show a grab/move cursor
  3. Transformer corner handles should be fully visible — not clipped by the canvas stage border

actual:
  1. When a frame is added/selected, dragging the photo stops working
  2. No cursor change on photo hover — cursor stays default
  3. The corner handles are hidden behind the canvas border/edge lines (the handles render outside or at the very edge of the stage and get clipped)

errors: No JS errors reported — these are behavioral/visual bugs

reproduction:
  1. Upload a photo → drag works → select a frame → drag no longer works on the photo
  2. Upload a photo → hover mouse over it → no grab cursor appears
  3. Upload a photo → corner handles appear at the photo edges → handles at the corners are partially or fully hidden behind the stage border

started: Introduced in Phase 5 (current implementation). Never worked correctly.

## Eliminated

## Evidence

- timestamp: 2026-04-11T00:01:00Z
  checked: index.html lines 389-397 - Layer creation and stacking order
  found: frameLayer is created (line 390) and added above photoLayer (line 393). No listening:false property set. In Konva, layers above capture pointer events even if their nodes are transparent.
  implication: Bug #1 - frameLayer intercepts all mouse events when frame is loaded, preventing photoLayer dragging

- timestamp: 2026-04-11T00:02:00Z
  checked: index.html lines 7-291 - CSS styling for canvas and stage container
  found: No cursor styles defined for #stage-container canvas or for draggable states. Konva does not automatically set cursor CSS - the developer must add it.
  implication: Bug #2 - Missing CSS for grab/move cursor on draggable photo

- timestamp: 2026-04-11T00:03:00Z
  checked: index.html lines 589-594 - Photo initialization sizing
  found: Photo is centered at natural pixel size with no scaling applied. For large images, this fills or exceeds the 500×500 stage. Transformer handles render 10px outside the node bounds (anchorSize: 10, line 412), so handles at edges get clipped by the stage boundary.
  implication: Bug #3 - Photo needs initial scaling to fit ~90% of stage (450×450 max) to create margin for handles

- timestamp: 2026-04-11T00:04:00Z
  checked: index.html lines 449-474 - loadFrame() function
  found: Frame image is created and added to frameLayer at lines 468-470. No listening:false set on frameImage node or frameLayer.
  implication: Confirms Bug #1 - frame node listens to all pointer events even though it should be non-interactive

## Resolution

root_cause: Three independent bugs - (1) frameLayer intercepted pointer events without listening:false, blocking drag on photoLayer; (2) No CSS cursor styles for grab/grabbing states on draggable photo; (3) Photo scaled to natural size filling full 500×500 stage, leaving no margin for transformer handles which render outside node bounds and get clipped by stage edges

fix: Applied three fixes - (1) Set frameLayer listening:false to pass events through to photoLayer; (2) Added CSS classes .photo-draggable and .photo-dragging with cursor:grab and cursor:grabbing, managed via dragstart/dragend events; (3) Scale photo to fit 90% of stage (450px max) on upload to create 25px margin for handles

verification: Self-verified code changes are correct. Awaiting human verification of actual behavior in browser.

files_changed: ["/Users/amahmoud/Documents/development/personal/playgrounds/profile-pic-frame/index.html"]
