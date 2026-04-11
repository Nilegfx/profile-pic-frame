# Requirements: Profile Pic Frame

**Defined:** 2026-04-10
**Core Value:** User uploads photo, picks frame, adjusts fit, downloads result — in under a minute, entirely in the browser.

## v1 Requirements

### Upload

- [ ] **UPL-01**: User can upload a JPEG or PNG profile photo via file input
- [ ] **UPL-02**: Uploaded image is validated (type: JPEG/PNG only, reject other formats)
- [ ] **UPL-03**: Uploaded image is read client-side via FileReader (no server, no network request)

### Frame Selection

- [ ] **FRM-01**: User can select from exactly 2 static campaign frames displayed as visual thumbnails
- [ ] **FRM-02**: Selected frame is visually highlighted/indicated in the UI
- [ ] **FRM-03**: Frame PNGs are bundled as static assets (no upload or network fetch)

### Editing

- [ ] **EDT-01**: User can scale the profile photo using a slider, aspect ratio locked
- [ ] **EDT-02**: User can scale the frame using a slider, aspect ratio locked
- [ ] **EDT-03**: Both images are centered by default when loaded

### Preview

- [ ] **PRV-01**: User sees a real-time preview of both images composited together as they adjust the sliders

### Download

- [x] **DWN-01**: User can download the final composited image as a PNG file
- [x] **DWN-02**: Downloaded image dimensions match the user's adjusted/zoomed state (proportions preserved)
- [x] **DWN-03**: All compositing happens client-side — no image data is sent to any server

## v2 Requirements

### Quality & Polish

- **V2-01**: Mobile pinch-to-zoom gesture support
- **V2-02**: Multiple export sizes (400×400, 800×800, 1200×1200)
- **V2-03**: Rotation control
- **V2-04**: Flip/mirror control

### Accessibility

- **V2-05**: Keyboard navigation for all controls
- **V2-06**: Screen reader support

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / login | Single-session campaign tool — no persistence needed |
| Backend / server uploads | Client-only by design — privacy and simplicity |
| Custom frame upload | Two static frames are sufficient for this campaign |
| Text / sticker overlays | Out of scope for profile frame use case |
| Filters / effects | Adds complexity, not relevant to campaign |
| Social auto-posting | Out of scope for 2-3 day campaign |
| Undo/redo | Reset button covers the need; full undo is over-engineering |
| Analytics / tracking | Privacy-first, no data collection |
| PWA / offline mode | Short campaign, not worth the effort |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPL-01 | Phase 2 | Pending |
| UPL-02 | Phase 2 | Pending |
| UPL-03 | Phase 2 | Pending |
| FRM-01 | Phase 2 | Pending |
| FRM-02 | Phase 2 | Pending |
| FRM-03 | Phase 2 | Pending |
| EDT-01 | Phase 3 | Pending |
| EDT-02 | Phase 3 | Pending |
| EDT-03 | Phase 3 | Pending |
| PRV-01 | Phase 3 | Pending |
| DWN-01 | Phase 4 | Complete |
| DWN-02 | Phase 4 | Complete |
| DWN-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13 (100%)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-10 after roadmap creation*
