# Feature Landscape

**Domain:** Profile Picture Frame / Overlay Tools
**Researched:** 2026-04-10
**Confidence:** MEDIUM (based on training data of common tools like Twibbon, Canva frames, Facebook campaign generators)

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Image Upload** | Core interaction — no upload = no tool | Low | File input accepting common formats (JPEG, PNG, WebP). Need validation for file size/type. |
| **Frame Selection** | Purpose of the tool — users need choices | Low | Display frame thumbnails/previews. For 2 frames: simple selection UI (radio/cards). |
| **Position Adjustment** | Photos rarely align perfectly with frame | Medium | Drag interaction to pan photo within canvas. Coordinate translation on touch/mouse events. |
| **Zoom/Scale Adjustment** | Photos vary in size/composition | Medium | Pinch-to-zoom (mobile) or slider/mouse wheel (desktop). Maintain aspect ratio during scale. |
| **Download Final Image** | Output is the entire point | Medium | Canvas → blob → download trigger. Must composite layers correctly with proper alpha blending. |
| **Preview While Editing** | Users need to see result before download | Low | Real-time canvas render of photo + frame overlay. Update on every adjustment. |
| **Mobile Responsiveness** | Profile pics = mobile use case | Medium | Touch events for drag/pinch. Canvas sizing for small screens. Large touch targets. |
| **Transparent Frame Overlay** | Frames must show through to photo | Low | PNG with alpha channel. Canvas drawImage with proper layering order. |

## Differentiators

Features that set product apart or improve UX. Not expected, but valued.

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| **Rotation** | Helps with photos taken at wrong angle | Medium | Transform rotation on photo layer. UI: rotation slider or gesture. Complicates bounding calculations. |
| **Flip/Mirror** | Fix selfie mirroring or composition | Low | CSS transform or canvas scale(-1, 1). Simple toggle button. |
| **Multiple Output Sizes** | Different platforms need different dimensions | Medium | Export presets (e.g., 400×400, 800×800, 1200×1200). Re-render canvas at target size. |
| **Undo/Redo** | Confidence to experiment with adjustments | Medium | State history stack. Track position/scale/rotation changes. Memory consideration for large images. |
| **Reset to Default** | Quick way to start over without re-upload | Low | Store initial state, restore on button click. |
| **Keyboard Shortcuts** | Power users can position precisely | Low | Arrow keys for nudging, +/- for zoom, R for reset. Accessibility bonus. |
| **Grid/Guides** | Help center face in circular frame | Low | Canvas overlay with crosshairs or centering guides. Toggle on/off. |
| **Auto-Center** | Smart default positioning | Low | Detect face (browser APIs) or use geometric center. One-click feature. |
| **Auto-Fit** | Scale photo to fill frame optimally | Low | Calculate scale to fit smallest dimension. Pairs with auto-center. |
| **Frame Preview Gallery** | See all frames before selecting | Low | Thumbnail gallery with hover preview. For 2 frames: minimal value. |
| **Dark Mode** | Aesthetic preference | Low | CSS variables + toggle. Doesn't affect output image. |
| **Share Direct to Social** | Skip download step for some users | High | Platform APIs (Facebook, Twitter, Instagram). Auth + API integration. Breaks "client-only" constraint. |
| **Batch Processing** | Multiple photos with same frame | High | Queue system, ZIP download. Significantly more complex state management. |

## Anti-Features

Features to explicitly NOT build for a 2-3 day campaign tool.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **User Accounts / Login** | Campaign is 2-3 days, no need for persistence. Adds complexity, privacy concerns, server requirement. | Single-session use. All state in browser memory. |
| **Frame Upload by Users** | Campaign has 2 specific frames. User-uploaded frames = moderation burden, dilutes campaign brand. | Hardcode 2 campaign frames. Developer swaps PNGs if needed. |
| **Custom Text/Stickers** | Scope creep into full editor territory. Campaign frame already has text/design. | Frames include all campaign text/graphics. No customization needed. |
| **Filters/Effects** | Not the tool's purpose. Users can pre-edit photo elsewhere. Adds image processing complexity. | Keep tool focused: upload → frame → download. |
| **Save Draft / Cloud Storage** | Requires backend, accounts, storage costs. Campaign is short-lived. | Session-only. User can re-upload if they leave. |
| **Multi-Layer Frames** | Campaign has 2 simple PNG overlays. Multi-layer = unnecessary complexity. | Single frame PNG per option. Transparency handles layering. |
| **Video/GIF Support** | Social platforms often downscale to static for profile pics anyway. Adds encoding complexity. | Static images only (JPEG/PNG input and output). |
| **Advanced Crop Tools** | Crop changes aspect ratio, creates inconsistent outputs. Positioning + zoom is sufficient. | Scale + pan only. Aspect ratio locked. |
| **Social Media Auto-Post** | Breaks "no server" requirement. Needs OAuth, API keys, platform approval. Privacy concerns. | Download button. User uploads manually (takes 10 seconds). |
| **Analytics/Tracking** | Privacy concern. Campaign owner can track via URL parameters elsewhere. Adds scripts/network calls. | Zero tracking. Fully client-side = privacy selling point. |
| **Email Collection** | Scope creep into lead gen. Campaign focus should be participation, not data harvesting. | No forms. Pure utility tool. |
| **Progressive Web App** | For 2-3 day campaign, installation UX is overkill. Most users visit once. | Standard web app. Works on mobile browsers without install. |

## Feature Dependencies

```
Image Upload → Position Adjustment (needs image to position)
Image Upload → Zoom/Scale Adjustment (needs image to scale)
Frame Selection → Preview While Editing (needs frame to composite)
Position + Zoom + Frame → Download Final Image (needs all inputs for output)

Rotation → Position Adjustment (rotation affects drag behavior)
Undo/Redo → All Adjustment Features (needs state tracking)
```

## MVP Recommendation

### Must Have (Table Stakes)
1. **Image Upload** — JPEG/PNG, client-side validation
2. **Frame Selection** — Toggle between 2 frames, visual preview
3. **Position Adjustment** — Drag photo with mouse/touch
4. **Zoom/Scale Adjustment** — Slider or mouse wheel, maintain aspect ratio
5. **Download Final Image** — Canvas composite → PNG download
6. **Preview While Editing** — Real-time canvas render
7. **Mobile Responsiveness** — Touch events, responsive canvas sizing

### Nice to Have (Ship if time permits)
1. **Reset to Default** — Low complexity, high UX value
2. **Auto-Fit** — Smart default, reduces user effort
3. **Multiple Output Sizes** — Export at 400×400, 800×800, 1200×1200

### Defer (Post-campaign if needed)
- **Rotation** — Most phones auto-orient photos now
- **Flip/Mirror** — Edge case, users can pre-edit
- **Undo/Redo** — Nice but not critical for simple adjustments
- **Keyboard Shortcuts** — Power user feature, low campaign impact

### Explicitly Exclude
- User accounts, frame upload, text/stickers, filters, cloud storage, analytics, auto-posting

## User Flow Analysis

### Primary Flow (must be seamless)
1. Land on page → See clear "Upload Photo" CTA
2. Upload photo → Photo appears in first frame (default)
3. Photo too big/small/off-center → Drag and zoom to fit
4. Want different frame → Click frame 2, photo position persists
5. Looks good → Click "Download" → Image saves to device
6. Share on social media → Manual upload (not in tool)

**Time target:** Under 60 seconds from upload to download

### Edge Cases to Handle
- Upload very large image (>10MB) → Show loading state, resize on canvas
- Upload wrong file type → Validation message, reject upload
- Photo doesn't fit frame well → Auto-fit button as escape hatch
- Accidental adjustment → Reset button to restart
- Mobile keyboard blocking canvas → Scroll/zoom handling

## Implementation Complexity Map

| Complexity | Features | Estimated Effort |
|------------|----------|------------------|
| **Low** (< 1 hour each) | Upload, Frame Selection, Flip, Reset, Dark Mode, Grid | ~6 hours total |
| **Medium** (2-4 hours each) | Position, Zoom, Download, Mobile Touch, Rotation, Undo, Output Sizes | ~20 hours total |
| **High** (8+ hours each) | Social Share APIs, Batch Processing, Face Detection | Out of scope |

## Platform-Specific Considerations

### Desktop
- Mouse wheel for zoom (intuitive)
- Hover states for frame selection
- Larger canvas area = easier precision
- Download triggers browser download dialog

### Mobile
- Touch drag for positioning (primary interaction)
- Pinch-to-zoom (expected mobile gesture)
- Smaller screen = ensure frame preview is visible
- iOS Safari: Download may trigger preview instead of save
- Android: Download goes to Downloads folder automatically

## Accessibility Considerations

| Feature | Accessibility Impact | Implementation |
|---------|---------------------|----------------|
| Frame Selection | Keyboard navigation | Focusable buttons with arrow key support |
| Zoom Controls | Screen reader labels | Slider with aria-label, value announcements |
| Download | Clear action | Button with descriptive text, not icon-only |
| Preview Canvas | Alt text | Describe current state for screen readers |

## Output Quality Considerations

| Aspect | Standard | Implementation |
|--------|----------|----------------|
| **Output Format** | PNG (preserves frame transparency) | canvas.toBlob('image/png') |
| **Output Resolution** | Match input or fixed size (800×800 typical) | Scale canvas before composite |
| **Compression** | Lossless for PNG, quality 0.95 for JPEG fallback | toBlob quality parameter |
| **Color Space** | sRGB (web standard) | Default canvas color space |

## Gotchas for 2-3 Day Campaign

1. **No time for A/B testing** — Pick one UX pattern, ship it
2. **Mobile-first design critical** — Most users on phones for profile pic use
3. **Download UX varies by browser** — Test on iOS Safari, Chrome Android, desktop browsers
4. **Large files slow down canvas** — Resize uploaded images to max 2000×2000 before processing
5. **Frame PNGs must be high-res** — 2000×2000 minimum to avoid pixelation on zoom

## Sources

**Confidence Note:** Research based on training data knowledge of common profile frame tools (Twibbon, Canva profile frames, Facebook campaign frame generators, generic overlay tools). Web search APIs unavailable during research. Recommendations prioritized for stated constraints: React + Vite, client-only, 2-3 day campaign, 2 static frames.

**Verification Status:** LOW confidence on current feature trends (2026). MEDIUM confidence on core feature expectations (upload/frame/adjust/download pattern is stable). HIGH confidence on implementation complexity estimates (based on Canvas API, React patterns).

**Recommended Validation:** If time permits, quick manual check of 2-3 current tools (Twibbon, Canva frames, or similar) to confirm table stakes haven't shifted. Core flow unlikely to have changed significantly.
