# Roadmap: Profile Pic Frame

**Created:** 2026-04-10
**Updated:** 2026-04-10 — Phase 3 planning complete
**Granularity:** Coarse (3-5 phases, 1-3 plans each)
**Mode:** YOLO

## Phases

- [x] **Phase 1: Foundation & UI Shell** - Single index.html with Konva stage, polished layout, and placeholder sections ✓
- [x] **Phase 2: Upload & Frame Selection** - File upload with validation, frame picker, and basic layered preview on Konva stage ✓
- [ ] **Phase 3: Interactive Editing** - Photo scale slider with centered aspect-ratio-locked image on Konva stage (frame fixed at 500×500)
- [ ] **Phase 4: Canvas Export** - Download composited PNG via Konva's toDataURL with retina sharpness

## Phase Details

### Phase 1: Foundation & UI Shell
**Goal**: Single `index.html` with Konva stage wired up, polished campaign UI shell, ready for feature implementation
**Depends on**: Nothing (first phase)
**Requirements**: Foundation work (enables all subsequent phases)
**Success Criteria** (what must be TRUE):
  1. `index.html` opens in a browser with no console errors (served via `python3 -m http.server` or equivalent)
  2. `konva.min.js` is present locally and loaded via `<script src="konva.min.js">`
  3. A Konva `Stage` and at least one `Layer` are initialized in the inline `<script>` block
  4. Polished campaign-quality layout is visible: header, canvas preview area, controls panel, download button — styled with inline CSS
  5. App state object (`{ photoImage, frameImage, photoScale, frameScale, selectedFrame }`) is declared as a plain JS object
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md — Complete HTML/CSS/JS scaffold with Konva initialization (download konva.min.js + create polished index.html) ✓

**UI hint**: yes

### Phase 2: Upload & Frame Selection
**Goal**: Users can upload their photo and select between campaign frames, seeing both composited on the Konva stage
**Depends on**: Phase 1
**Requirements**: UPL-01, UPL-02, UPL-03, FRM-01, FRM-02, FRM-03
**Success Criteria** (what must be TRUE):
  1. Clicking the upload area opens a file picker; selecting a JPEG or PNG displays the photo on the Konva stage
  2. Non-JPEG/PNG files are silently ignored (no error message per user decision D-07)
  3. Frame thumbnails are dynamically discovered; clicking one highlights it and loads the frame PNG onto the stage
  4. Frame PNG is rendered as a `Konva.Image` node on top of the photo node
  5. All image loading uses `FileReader` + `Konva.Image.fromURL` — no server requests
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Wire photo upload: file input → FileReader → Konva.Image → photoLayer (UPL-01, UPL-02, UPL-03) ✓
- [x] 02-02-PLAN.md — Wire frame selection: extend discoverFrames() → load frame PNG → frameLayer (FRM-01, FRM-02, FRM-03) ✓

**UI hint**: yes

### Phase 3: Interactive Editing
**Goal**: Users can scale the photo using a slider while it stays centered and aspect-ratio locked. Frame is fixed at 500×500 (not user-scalable).
**Depends on**: Phase 2
**Requirements**: EDT-01, EDT-03, PRV-01
**Success Criteria** (what must be TRUE):
  1. Moving the photo slider scales the `Konva.Image` photo node while keeping it centered in the stage
  2. Aspect ratio is preserved (uniform scale via `scaleX` = `scaleY`)
  3. Stage redraws in real-time on every slider `input` event (no lag, smooth 60fps updates)
  4. Slider resets to 1.0 when new photo is uploaded
  5. Frame Size slider is hidden from UI (frame is fixed at 500×500)
**Plans**: 1 plan

Plans:
- [ ] 03-01-PLAN.md — Wire photo slider for real-time scaling, reset on upload, hide frame slider (EDT-01, EDT-03, PRV-01)

**UI hint**: yes

**Note:** EDT-02 (frame scaling) was descoped per user decision - frame is now fixed at 500×500 and not user-scalable.

### Phase 4: Canvas Export
**Goal**: Users can download a high-quality PNG with photo and frame composited at full resolution
**Depends on**: Phase 3
**Requirements**: DWN-01, DWN-02, DWN-03
**Success Criteria** (what must be TRUE):
  1. Clicking Download triggers `stage.toDataURL({ pixelRatio: window.devicePixelRatio })` and downloads a `.png` file
  2. Downloaded PNG is sharp on retina displays (pixelRatio applied)
  3. Frame transparency is preserved (PNG alpha channel intact, no white fill)
  4. Photo layer is below frame layer in the Konva layer/node order
  5. No `SecurityError` (tainted canvas) — all images loaded from same origin or data URIs
**Plans**: TBD
**UI hint**: yes

**Suggested plan breakdown (1-3 plans for coarse):**
  - Plan 4.1: Download button handler calls `stage.toDataURL(...)`, creates an `<a>` with `download="profile.png"`, clicks it; verify layer order (photo below frame) and retina output

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & UI Shell | 1/1 | ✓ Complete | 2026-04-10 |
| 2. Upload & Frame Selection | 2/2 | ✓ Complete | 2026-04-10 |
| 3. Interactive Editing | 0/1 | Planned | - |
| 4. Canvas Export | 0/1 | Not started | - |

---
*Roadmap created: 2026-04-10*
*Last updated: 2026-04-10 — Phase 3 planning complete (1 plan created)*
