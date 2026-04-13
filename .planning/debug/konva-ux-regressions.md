---
status: verifying
trigger: "konva-ux-regressions - 3 regressions after quick task 260411-6gj (transformer UX enhancements)"
created: 2026-04-11T00:00:00Z
updated: 2026-04-11T00:10:00Z
---

## Current Focus

hypothesis: Fixes applied - awaiting user verification
test: User tests all three scenarios in browser
expecting: (1) Grab cursor on hover, grabbing while dragging; (2) Click outside to hide handles, click photo to show them again; (3) Corner handles are rounded
next_action: Request human verification

## Symptoms

expected:
  1. Grab cursor on photo hover, grabbing cursor while dragging, resize cursors on corner handles, crosshair on rotation handle
  2. After clicking outside (deselecting), clicking back on the photo should reattach the transformer and show handles again
  3. Corner anchor handles should be rounded (anchorCornerRadius was mentioned in the plan but may not have been applied)

actual:
  1. Cursors do not work correctly — drag cursor broken on photo, handle cursors (resize/rotation) also broken
  2. Clicking outside hides handles correctly, but there is no way to click the photo again to bring handles back — clicking on photo does nothing (transformer stays hidden)
  3. Handles are still squares, not rounded

errors: No JS errors reported — behavioral/visual bugs

reproduction:
  1. Upload photo → hover over it → wrong or no cursor
  2. Upload photo → click outside → handles hide → click on photo → handles don't come back
  3. Upload photo → look at corner handles → still squares

started: Introduced by quick task 260411-6gj. The previous implementation (before quick task) had drag/grab cursor working.

## Eliminated

## Evidence

- timestamp: 2026-04-11T00:05:00Z
  checked: CSS cursor rules lines 163-174
  found: Cursor rules apply to #stage-container div (lines 168-174), but Konva renders on a <canvas> child element. CSS on the container div won't propagate to canvas in most browsers. Lines 164-166 set canvas cursor to 'default' which overrides container styles.
  implication: Bug 1 root cause confirmed - CSS approach broken, need to use Konva's container().style.cursor API directly

- timestamp: 2026-04-11T00:06:00Z
  checked: Document click listener lines 437-448 and photo upload handler lines 578-709
  found: Document click listener deselects transformer (lines 443-446), but NO click handler is added to the photo node to re-attach transformer. Photo upload makes photo draggable (line 633) but no click event registered.
  implication: Bug 2 root cause confirmed - missing photo click handler to call transformer.nodes([imageNode]) + transformer.show()

- timestamp: 2026-04-11T00:07:00Z
  checked: Transformer init lines 413-428
  found: Transformer config has keepRatio, enabledAnchors, rotateEnabled, rotateAnchorOffset, rotateAnchorCursor, anchorFill, anchorStroke, anchorStrokeWidth, borderStroke, borderStrokeWidth, anchorSize — but NO anchorCornerRadius property
  implication: Bug 3 root cause confirmed - anchorCornerRadius was planned but never added to config

- timestamp: 2026-04-11T00:10:00Z
  checked: Applied fixes to index.html
  found: (1) Removed CSS cursor rules, added Konva event handlers for cursor management; (2) Added photo click handler with e.cancelBubble to prevent event propagation; (3) Added anchorCornerRadius: 5 to transformer config
  implication: All three bugs addressed at root cause level

## Resolution

root_cause: Three independent bugs in quick task 260411-6gj: (1) CSS cursor rules target container div, not canvas child, so cursors don't apply; (2) click-outside deselection added but no re-selection click handler on photo; (3) anchorCornerRadius config missing from transformer initialization

fix: Applied three fixes to index.html:
  1. Removed CSS cursor rules (.photo-draggable, .photo-dragging classes). Replaced with Konva event handlers (mouseenter/mouseleave/dragstart/dragend) that directly set stage.container().style.cursor to 'grab'/'grabbing'/'default'
  2. Added 'click' event handler to photo imageNode that calls e.cancelBubble = true to prevent document listener from immediately hiding, then re-attaches transformer with transformer.nodes([imageNode]) + transformer.show() + transformerLayer.draw()
  3. Added anchorCornerRadius: 5 to transformer config (line after anchorStrokeWidth: 2)

verification: 
files_changed: [index.html]
