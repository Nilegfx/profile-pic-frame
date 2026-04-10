# Phase 1: Foundation & UI Shell - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a single `index.html` file with `konva.min.js` loaded locally. This phase produces the complete visual shell and Konva scaffold — layout, styling, stage initialization, and app state object. No image loading or real functionality yet; all controls are placeholder UI that Phase 2 wires up.

</domain>

<decisions>
## Implementation Decisions

### Layout
- **D-01:** Controls-above, canvas-below layout. No header bar — tool only, no app title.
- **D-02:** All controls in a single horizontal bar above the canvas: upload button, frame thumbnails, scale sliders, download button — left to right in one row.
- **D-03:** Desktop-only — no mobile responsiveness required for this campaign.

### Visual Theme
- **D-04:** Light/clean color scheme — white or off-white background, subtle shadows/borders.
- **D-05:** Orange accent color for primary interactive elements (upload button, active frame border, download button).
- **D-06:** System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) — no external font load.

### Canvas / Stage
- **D-07:** Konva Stage fixed at **500×500px**. Profile frames are square; fixed size simplifies export math.
- **D-08:** No mobile scaling — stage stays at 500×500 regardless of viewport.

### Upload Area (Phase 1 shell)
- **D-09:** Upload area is a styled orange "Upload Photo" button — prominent, not a dropzone rectangle.
- **D-10:** Frame picker shows two ~80×80px placeholder squares side-by-side. Orange border indicates the active selection.
- **D-11:** Canvas empty state: light gray fill on the Konva stage with a subtle centered placeholder (icon or text like "Upload a photo"). Clearly marks the canvas boundary before any image is loaded.

### Konva Scaffold
- **D-12:** Konva `Stage` container div has `id="stage-container"`, sized to 500×500px via CSS.
- **D-13:** App state is a plain JS object declared at module scope:
  ```js
  const state = {
    photoImage: null,
    frameImage: null,
    photoScale: 1,
    frameScale: 1,
    selectedFrame: null
  };
  ```
- **D-14:** Two `Konva.Layer` instances: `photoLayer` (bottom) and `frameLayer` (top). Photo always renders below frame.

### Claude's Discretion
- Exact orange hex value (suggest `#FF6B35` or similar warm orange)
- Exact spacing/padding values between controls
- Placeholder icon for empty canvas state (SVG inline or Unicode character)
- Exact border-radius and shadow values for polished feel
- Whether the controls bar has a card/panel background or is flush with the page

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/REQUIREMENTS.md` — v1 requirements (UPL, FRM, EDT, DWN IDs)
- `.planning/ROADMAP.md` — Phase 1 success criteria and suggested plan breakdown
- `CLAUDE.md` — Stack constraints (native Konva.js + single index.html, no React, no build step)

No external specs — requirements fully captured in decisions above and planning files.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — codebase is empty. Phase 1 creates everything from scratch.

### Established Patterns
- None yet. Phase 1 establishes all patterns.

### Integration Points
- Phase 2 will wire the upload button to `FileReader` + `Konva.Image.fromURL`
- Phase 2 will wire frame thumbnails to load frame PNGs onto `frameLayer`
- Phase 3 will wire sliders to `photoScale` / `frameScale` state and re-center nodes
- Phase 4 will wire download button to `stage.toDataURL()`

</code_context>

<specifics>
## Specific Ideas

- Orange accent: warm orange (not red-orange). Hex around `#FF6B35` or `#F97316` (Tailwind orange-500 range).
- Empty canvas placeholder: a subtle upload/image icon centered in the gray stage area.
- Controls bar: a clean white/light-gray strip above the canvas, with consistent spacing between groups (upload | frames | sliders | download).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-ui-shell*
*Context gathered: 2026-04-10*
