---
status: investigating
trigger: "download-button-not-working"
created: 2026-04-10T00:00:00Z
updated: 2026-04-10T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED — Download button has no event listener wired; Phase 4 (Canvas Export) never implemented
test: Complete — read index.html, ROADMAP.md, searched for download/toDataURL
expecting: CONFIRMED
next_action: Write root cause report

## Symptoms

expected: Browser downloads a composited PNG of the canvas (photo layered under frame overlay)
actual: Nothing happens when button is clicked — silent, no file, no error
errors: No console errors visible
reproduction: Click the Download button in the app UI
started: Never worked — Phase 4 (Canvas Export) has not been implemented yet

## Eliminated

## Evidence

- timestamp: 2026-04-10T00:01:00Z
  checked: /Users/amahmoud/Documents/development/personal/playgrounds/profile-pic-frame/index.html (full file)
  found: Button element exists at line 208: `<button id="download-btn">Download</button>`
  implication: HTML is correct — button is present in DOM

- timestamp: 2026-04-10T00:02:00Z
  checked: index.html JavaScript section (lines 222-473)
  found: Zero addEventListener calls for #download-btn. Zero references to toDataURL. Other buttons (upload-btn, frame thumbnails, photo-scale slider) all have working event listeners.
  implication: Download functionality was never implemented

- timestamp: 2026-04-10T00:03:00Z
  checked: .planning/ROADMAP.md Phase 4 section (lines 71-86)
  found: Phase 4 "Canvas Export" status = "Not started", Plans = "TBD", Success criteria defined but no plan executed
  implication: Phase 4 was planned but never built — this is expected missing functionality, not a regression

- timestamp: 2026-04-10T00:04:00Z
  checked: Case-insensitive grep for "download|toDataURL" in index.html
  found: Only matches are CSS comments and HTML button element — no JavaScript implementation
  implication: Confirms zero download logic exists in codebase

## Resolution

root_cause: Download button has no event listener attached. Phase 4 (Canvas Export) was never implemented — button exists in UI but has zero functionality. The required Konva export API (stage.toDataURL) was never called.
fix: N/A (diagnose-only mode)
verification: N/A (diagnose-only mode)
files_changed: []
