# Phase 4: Canvas Export - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the Download button to export the composited Konva canvas (photo + frame overlay) as a PNG file. The button becomes a split-button with an inline resolution picker (1× or 2×). The button is disabled until a photo is uploaded. No server communication — all compositing is client-side via `stage.toDataURL()`.

</domain>

<decisions>
## Implementation Decisions

### Export resolution
- **D-01:** The Download button is a **split button** — it has an inline dropdown picker for resolution. User picks before downloading.
- **D-02:** Resolution options: **1× (500px)** and **2× (1000px)**. No 3× option.
- **D-03:** 1× uses `stage.toDataURL()` (default pixelRatio). 2× uses `stage.toDataURL({ pixelRatio: 2 })`.
- **D-04:** The split-button dropdown sits **inline on the Download button itself** — clicking the arrow portion opens the picker, clicking the main button area triggers the download at the selected resolution.
- **D-05:** Default resolution is **1× (500px)** — picker starts at 1× and user can change to 2× before downloading.

### Download filename
- **D-06:** Filename is always **`profile.png`** — static, no date suffix, no frame name.

### Button guard (empty canvas)
- **D-07:** The Download button (and its split-button dropdown) is **disabled** when `state.photoImage` is null (no photo uploaded). It becomes enabled when a photo loads. This prevents downloading a blank/frame-only canvas.
- **D-08:** Implement via a helper `updateDownloadState()` called from the photo upload handler — it checks `state.photoImage` and toggles `disabled` attribute on the button.

### Button feedback
- **D-09:** No visual feedback on click — `toDataURL()` is synchronous, download triggers instantly. No spinner or label change needed.

### Layer order (pre-verified)
- **D-10:** Layer order is already correct in existing code — `photoLayer` added to stage first (renders below), `frameLayer` added second (renders above). No change needed.

### Security / tainted canvas
- **D-11:** No SecurityError risk — photos load via FileReader (data URIs, same-origin), frame PNGs served from same origin as the page. No CORS issues to handle.

### Claude's Discretion
- Exact HTML/CSS for the split-button (inline dropdown vs custom CSS vs native `<select>` alongside button)
- Where exactly in the download row to place the resolution picker control
- Whether to store selected resolution in `state` or read it directly from the picker element at download time

</decisions>

<specifics>
## Specific Ideas

- Split button pattern: the resolution picker is **inline on the download button itself**, not a separate dropdown elsewhere in the UI. User sees one cohesive "Download ▾" control.
- The existing Download button HTML (`<button id="download-btn">Download</button>`) will need to be replaced or wrapped to become a split button. Implementation approach is Claude's discretion.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in decisions above.

### Live code (must read before implementing)
- `index.html` — Current Download button HTML (line 208), stage/layer setup (lines 235-245), photo upload handler (where `updateDownloadState()` must be called), `state` object shape, existing event handler patterns (lines 359+)
- `.planning/phases/03-interactive-editing/03-CONTEXT.md` — D-11: export resolution context (superseded by D-01–D-05 above); D-04/D-05: centering pattern (not relevant to export but shows handler style)
- `.planning/phases/02-upload-frame-selection/02-CONTEXT.md` — Photo upload handler pattern (where disable/enable hook must be added)

### Requirements
- `.planning/REQUIREMENTS.md` §DWN-01, DWN-02, DWN-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `state.photoImage` — Konva.Image node; null check drives button disabled state (D-07)
- `photoLayer`, `frameLayer`, `stage` — all in scope as module-level variables, accessible from new event handler

### Established Patterns
- Event listeners wired inline in the `<script>` block after DOM initialization (see lines 359+)
- Guard pattern: `if (!state.photoImage) return;` already used in photo slider handler — reuse for download handler
- Button disable: `document.getElementById('photo-upload')` style DOM manipulation already used — same approach for download button

### Integration Points
- Photo upload handler (`FileReader` onload → `Konva.Image.fromURL`) must call `updateDownloadState()` after `state.photoImage = imageNode` is set
- Download handler reads from stage directly — no new state properties needed beyond the resolution picker value

</code_context>

<deferred>
## Deferred Ideas

- **3× / device pixel ratio export** — User only wants 1× and 2×. `window.devicePixelRatio` option not needed.
- **Custom filename** — Fixed `profile.png` only. Date suffix or frame-named files deferred.
- **Download success toast** — No feedback on click was chosen. If needed post-campaign, trivial to add.
- **Drag to reposition photo** — Out of scope (noted in Phase 3 deferred, remains deferred).

</deferred>

---

*Phase: 04-canvas-export*
*Context gathered: 2026-04-10*
