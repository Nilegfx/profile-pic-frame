# Phase 5: Konva Drag & Transform Editing - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the photo scale slider with Konva's native `Transformer` for aspect-ratio-locked resize and native `draggable` for repositioning. The Photo Size slider and its label are removed from the UI. Transform handles must be invisible in the downloaded PNG. No mobile support needed — desktop only.

</domain>

<decisions>
## Implementation Decisions

### Transform Handles — Appearance
- **D-01:** Use Konva `Transformer` node attached to `state.photoImage`. Corner anchors only (`enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']`).
- **D-02:** Aspect ratio locked at all times (`keepRatio: true`). No free-form distortion.
- **D-03:** Custom orange styling to match the app's `#FF6B35` accent: `anchorFill: '#FF6B35'`, `anchorStroke: '#FF6B35'`, `borderStroke: '#FF6B35'`. White anchor stroke for contrast: `anchorStroke: '#FFFFFF'` with `anchorFill: '#FF6B35'`. Claude has discretion on exact anchor size/stroke width.

### Selection Model — When handles appear
- **D-04:** Transformer is **always-on** when a photo is loaded. It attaches to `state.photoImage` as soon as the photo loads and detaches (or hides) when there is no photo. No click-to-select interaction needed — there is only ever one selectable image.
- **D-05:** Transformer lives on a dedicated `transformerLayer` (a third `Konva.Layer` added to the stage above `frameLayer`). This keeps it separate from photo and frame layers and makes hide/show for export clean.

### Drag — Repositioning
- **D-06:** Photo node is `draggable: true`. User can drag it freely to reposition within the canvas.
- **D-07:** Drag is constrained so the photo cannot be dragged entirely off the 500×500 stage. Use Konva `dragBoundFunc` to clamp position so at least a portion of the image always remains visible. Claude has discretion on the exact clamping math (e.g., keep center within stage, or keep at least 50px of the image within bounds).

### UI Cleanup — Slider removal
- **D-08:** Remove the Photo Size slider (`#photo-scale` input) and its `<label>` from the HTML. The `control-group` that contained them is removed entirely.
- **D-09:** The `frameScale` slider and label are already hidden (`display:none`) — leave them as-is or remove the hidden HTML. Claude's discretion.
- **D-10:** The Upload button and Download split-button remain in their current `controls-row`. No other layout changes.
- **D-11:** Remove the `photoScale` property from `state` and the slider `input` event listener from JS. Remove the `frameScale` property too if it's still present.

### Export — Handle hiding
- **D-12:** Before calling `stage.toDataURL()`, call `transformer.hide()` (and `transformerLayer.hide()`). After `toDataURL()` completes (it is synchronous), call `transformer.show()` (and `transformerLayer.show()`). This is the complete hide/show pattern — no need to detach nodes.
- **D-13:** The existing download handler in Phase 4 must be updated to wrap `toDataURL()` with this hide/show pattern.

### Claude's Discretion
- Exact `dragBoundFunc` clamping math
- Transformer anchor size (`anchorSize`) and border stroke width
- Whether to remove the hidden frame-scale HTML or just leave it hidden
- Layer ordering: transformerLayer goes last (on top of frameLayer) so handles render above the frame

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation
- `index.html` — Full app source. Key sections:
  - Lines ~383–392: `state` object (photoScale, frameScale to be removed)
  - Lines ~395–407: Stage and layer initialization (photoLayer, frameLayer — add transformerLayer here)
  - Lines ~307–329: Controls row HTML (remove photo-scale control-group)
  - Lines ~628–660: Photo slider event handler (remove entirely)
  - Lines ~785–800: Download handler (wrap toDataURL with transformer hide/show)
  - Lines ~558–597: Photo upload handler (attach Transformer after photo loads)

### Prior Phase Decisions
- `.planning/phases/02-upload-frame-selection/02-CONTEXT.md` — D-01: Photo centered at position(250,250) + offset(w/2,h/2). This centering still applies on initial load; dragging overrides position dynamically.
- `.planning/phases/03-interactive-editing/03-CONTEXT.md` — D-10: Use batchDraw() for redraws. Apply same pattern to Transformer drag events if manual redraws are needed.

### No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Konva.Layer` pattern: `photoLayer` and `frameLayer` already set up at module scope — add `transformerLayer` following the same pattern
- `state` object at module scope: add `transformer: null` property for the Transformer node reference
- Photo upload handler (lines ~558–597): already sets `state.photoImage` — add `draggable: true` and Transformer attachment here
- Download handler (lines ~785–800): already calls `stage.toDataURL()` — wrap with hide/show

### Established Patterns
- All Konva nodes added to layers, layers added to stage in order (photo → frame → transformer)
- `batchDraw()` used for redraws — Transformer handles fire `dragmove` and `transform` events, use same pattern
- `state.photoImage` is the single reference to the photo node — all operations go through this

### Integration Points
- Photo upload handler: set `draggable: true` on the new imageNode, then `transformer.nodes([imageNode])`
- Download handler: `transformer.hide()` → `toDataURL()` → `transformer.show()`
- Controls row HTML (line ~307): remove the photo-scale `control-group` block

</code_context>

<specifics>
## Specific Ideas

- Corner handles only — not all 8 anchors
- Orange handles (`#FF6B35`) to match the upload/download button color
- Always-on handles (no click-to-select) — only one photo can ever be on canvas
- Drag constrained so photo can't fully leave the 500×500 stage

</specifics>

<deferred>
## Deferred Ideas

- **Frame thumbnail numbering labels**: User requested visible numbers on frame thumbnails (e.g., "1", "2", "3") so users can identify frames by number. Deferred — this is a UI enhancement to the frame picker, not related to transform editing. Can be its own small phase or bundled into a polish pass.

</deferred>

---

*Phase: 05-konva-drag-transform-editing*
