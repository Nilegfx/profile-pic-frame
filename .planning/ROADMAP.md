# Roadmap: Profile Pic Frame

**Created:** 2026-04-10
**Granularity:** Coarse (3-5 phases, 1-3 plans each)
**Mode:** YOLO

## Phases

- [ ] **Phase 1: Foundation & UI Shell** - Scaffold React + Vite project with component structure
- [ ] **Phase 2: Upload & Frame Selection** - Enable image upload and frame picker with preview
- [ ] **Phase 3: Interactive Editing** - Integrate react-image-crop for drag/zoom/reset controls
- [ ] **Phase 4: Canvas Export** - Composite layers and export final PNG

## Phase Details

### Phase 1: Foundation & UI Shell
**Goal**: Project scaffold with all components wired, ready for feature implementation
**Depends on**: Nothing (first phase)
**Requirements**: Foundation work (enables all subsequent phases)
**Success Criteria** (what must be TRUE):
  1. Running Vite + React app with dev server at localhost
  2. All 5 components exist (App, ImageUploader, FramePicker, ImageEditor, DownloadButton) with placeholder UI
  3. Component prop interfaces defined and callbacks wired (data flows App → children, events bubble up)
  4. State structure in App component matches architecture (uploadedImage, selectedFrame, crop, zoom)
**Plans**: TBD
**UI hint**: yes

**Suggested plan breakdown (1-3 plans for coarse):**
  - Plan 1.1: Vite setup + install react-konva/konva/use-image + App scaffold with state structure
  - Plan 1.2: Component shells (ImageUploader, FramePicker, KonvaEditor, DownloadButton) with prop interfaces

### Phase 2: Upload & Frame Selection
**Goal**: Users can upload their photo and select between two campaign frames, seeing a basic preview
**Depends on**: Phase 1
**Requirements**: UPL-01, UPL-02, UPL-03, FRM-01, FRM-02, FRM-03
**Success Criteria** (what must be TRUE):
  1. User can click file input, select JPEG or PNG, and see their photo displayed in the preview area
  2. Non-JPEG/PNG uploads are rejected with clear error message (file type validation)
  3. User can click between two frame thumbnails and see visual indication of which is selected
  4. Selected frame PNG is visible overlaying the uploaded photo in preview (no cropping yet)
  5. All processing is client-side with no network requests (verified in DevTools network tab)
**Plans**: TBD
**UI hint**: yes

**Suggested plan breakdown (1-3 plans for coarse):**
  - Plan 2.1: FileReader integration with JPEG/PNG validation in ImageUploader
  - Plan 2.2: Frame asset imports, FramePicker component with selection state and visual indicator
  - Plan 2.3: Basic layered preview (uploaded image + selected frame overlay, static positioning)

### Phase 3: Interactive Editing
**Goal**: Users can drag, zoom, and reset their photo to fit perfectly within the frame circular area
**Depends on**: Phase 2
**Requirements**: EDT-01, EDT-02, EDT-03, EDT-04, PRV-01
**Success Criteria** (what must be TRUE):
  1. User can drag the photo with mouse (desktop) or touch (mobile) to reposition it within the frame
  2. User can zoom the photo with a slider control, with aspect ratio staying locked
  3. When an image is uploaded, it auto-fits to roughly fill the frame circular area (smart default)
  4. User can click a reset button to restore photo to the auto-fit position and zoom
  5. Preview updates in real-time as user drags or zooms (no lag, smooth interaction)
**Plans**: TBD
**UI hint**: yes

**Suggested plan breakdown (1-3 plans for coarse):**
  - Plan 3.1: Konva Stage + draggable photo Image node + zoom slider controlling scale state
  - Plan 3.2: Auto-fit logic on upload + reset button functionality

### Phase 4: Canvas Export
**Goal**: Users can download a high-quality PNG with their photo perfectly composited inside the selected frame
**Depends on**: Phase 3
**Requirements**: DWN-01, DWN-02, DWN-03
**Success Criteria** (what must be TRUE):
  1. User can click download button and receive a PNG file matching their adjusted crop and zoom
  2. Downloaded image is sharp on retina displays (not blurry or pixelated)
  3. Frame transparency is preserved correctly (transparent areas remain transparent, not white)
  4. Downloaded dimensions match user's adjusted state (proportions preserved)
  5. No SecurityError or tainted canvas errors during download (client-side only confirmed)
**Plans**: TBD
**UI hint**: yes

**Suggested plan breakdown (1-3 plans for coarse):**
  - Plan 4.1: Wire stageRef to DownloadButton + call stage.toDataURL({ pixelRatio: devicePixelRatio }) + trigger download
  - Plan 4.2: Verify transparency, layer order (photo below frame), and retina sharpness; add loading state

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & UI Shell | 0/2 | Not started | - |
| 2. Upload & Frame Selection | 0/3 | Not started | - |
| 3. Interactive Editing | 0/2 | Not started | - |
| 4. Canvas Export | 0/2 | Not started | - |

---
*Roadmap created: 2026-04-10*
*Last updated: 2026-04-10 after initial creation*
