# Architecture Patterns: Profile Pic Frame

**Domain:** Client-side image compositing tool
**Researched:** 2026-04-10
**Confidence:** HIGH

## Executive Summary

A React + Vite client-side image overlay app has a simple architecture: upload handler → crop/position UI → canvas compositor → download trigger. The key architectural decision is **when to composite** — for this app, composite only on download (not on every state change) to avoid performance overhead. Use react-easy-crop for the interactive layer, useState for state (no Zustand needed), useRef for canvas access, and imported assets for frames (not public/ folder).

**Component count:** 4-5 components max
**State management:** useState lifted to App component
**Canvas strategy:** Composite on-demand during download only
**Asset strategy:** Import frame PNGs as ESM imports

## Recommended Architecture

```
┌─────────────────────────────────────────────────┐
│                    App.tsx                       │
│  Owns: uploadedImage, selectedFrame, crop, zoom │
│  Orchestrates: Upload → Edit → Download flow    │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ImageUploader│  │FramePicker  │  │ImageEditor  │
│             │  │             │  │             │
│Props:       │  │Props:       │  │Props:       │
│- onUpload   │  │- frames[]   │  │- image      │
│             │  │- selected   │  │- crop       │
│Emits:       │  │- onSelect   │  │- zoom       │
│- File obj   │  │             │  │- onCropChange│
└─────────────┘  │Emits:       │  │- onZoomChange│
                 │- frameId    │  │             │
                 └─────────────┘  │Uses:        │
                                  │- react-easy-│
                                  │  crop       │
                                  └─────────────┘
                                          │
                                          ▼
                                  ┌─────────────┐
                                  │DownloadBtn  │
                                  │             │
                                  │Props:       │
                                  │- image      │
                                  │- frame      │
                                  │- crop       │
                                  │- zoom       │
                                  │             │
                                  │On Click:    │
                                  │1. Create    │
                                  │   canvas    │
                                  │2. Composite │
                                  │3. toBlob()  │
                                  │4. Download  │
                                  └─────────────┘
```

### Component Boundaries

| Component | Responsibility | Owns State | Receives Props | Emits |
|-----------|---------------|------------|----------------|-------|
| **App** | Application shell, state orchestration | uploadedImage, selectedFrame, crop, zoom | None | N/A |
| **ImageUploader** | File input, validation | None (stateless) | onUpload callback | File object |
| **FramePicker** | Frame selection UI | None (stateless) | frames[], selectedFrame, onSelect | Selected frame ID |
| **ImageEditor** | Interactive crop/resize/position | None (controlled) | image, crop, zoom, onCropChange, onZoomChange | Crop area, zoom level |
| **DownloadButton** | Canvas compositing, image export | None (stateless) | image, frame, crop, zoom | N/A (triggers download) |

## Data Flow

**One-way data flow (React standard):**

```
1. Upload Phase
   User selects file
   → ImageUploader validates + reads
   → Calls onUpload(file)
   → App stores in uploadedImage state
   → ImageEditor receives image prop

2. Selection Phase
   User clicks frame thumbnail
   → FramePicker calls onSelect(frameId)
   → App stores in selectedFrame state
   → DownloadButton receives frame prop

3. Editing Phase
   User drags/zooms in react-easy-crop
   → ImageEditor calls onCropChange(cropArea)
   → App stores in crop state
   → DownloadButton receives updated crop prop

4. Download Phase
   User clicks download
   → DownloadButton receives all props
   → Creates hidden canvas element
   → Draws cropped user image
   → Draws frame PNG on top (source-over)
   → Calls canvas.toBlob()
   → Triggers browser download
   → Cleans up canvas
```

**State lives in App component:**
```typescript
// App.tsx
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
const [selectedFrame, setSelectedFrame] = useState<string>('frame1');
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
```

**Props flow down, callbacks flow up.**

## Patterns to Follow

### Pattern 1: Controlled Image Editor
**What:** ImageEditor component is fully controlled by parent state (no internal state for crop/zoom).

**When:** User drags or zooms in react-easy-crop.

**Why:** Single source of truth for crop/zoom. DownloadButton needs these values to composite correctly.

**Example:**
```typescript
// App.tsx
<ImageEditor
  image={uploadedImage}
  crop={crop}
  zoom={zoom}
  onCropChange={(newCrop) => setCrop(newCrop)}
  onZoomChange={(newZoom) => setZoom(newZoom)}
/>
```

### Pattern 2: Lazy Canvas Compositing
**What:** Canvas element created and composited only when user clicks download. Not rendered during editing.

**When:** User clicks download button.

**Why:** Canvas compositing is CPU-intensive. No visual preview needed (react-easy-crop shows live preview). Avoids re-compositing on every crop/zoom change.

**Example:**
```typescript
// DownloadButton.tsx
const handleDownload = async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 1. Load user image
  const userImg = await loadImage(image);
  
  // 2. Calculate crop dimensions from react-easy-crop crop area
  const croppedCanvas = getCroppedImg(userImg, crop, zoom);
  
  // 3. Set final dimensions
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  
  // 4. Draw cropped user image
  ctx.drawImage(croppedCanvas, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  
  // 5. Load and draw frame on top
  const frameImg = await loadImage(frame);
  ctx.globalCompositeOperation = 'source-over'; // Default, frame on top
  ctx.drawImage(frameImg, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  
  // 6. Export as blob
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profile-pic-with-frame.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};
```

### Pattern 3: Import Frames as Static Assets
**What:** Frame PNGs imported as ESM imports, not loaded from public/ folder.

**When:** At build time.

**Why:** Vite hashes imported assets for cache-busting, bundles them efficiently, and provides type safety. public/ folder is for assets referenced by URL at runtime (not needed here).

**Example:**
```typescript
// frames.ts
import frame1 from './assets/frame1.png';
import frame2 from './assets/frame2.png';

export const FRAMES = [
  { id: 'frame1', url: frame1, name: 'Campaign Frame 1' },
  { id: 'frame2', url: frame2, name: 'Campaign Frame 2' },
];
```

### Pattern 4: File Upload via FileReader
**What:** Use FileReader to convert uploaded File to data URL for react-easy-crop.

**When:** User selects file in ImageUploader.

**Why:** react-easy-crop needs a string URL. FileReader creates data URL without needing object URLs (no cleanup needed).

**Example:**
```typescript
// ImageUploader.tsx
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    return;
  }
  
  // Validate file size (e.g., 10MB max)
  if (file.size > 10 * 1024 * 1024) {
    alert('Image too large (max 10MB)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = () => {
    onUpload(reader.result as string);
  };
  reader.readAsDataURL(file);
};
```

### Pattern 5: useRef for Canvas Access
**What:** Use useRef to store canvas element reference, not state.

**When:** Creating canvas in DownloadButton.

**Why:** Canvas is not part of React render tree (created imperatively). Ref avoids triggering re-renders.

**Example:**
```typescript
// If canvas needs to persist across renders (not recommended for this app):
const canvasRef = useRef<HTMLCanvasElement>(null);

// But for this app, just create canvas imperatively in download handler:
const canvas = document.createElement('canvas'); // No ref needed
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Real-time Canvas Compositing
**What:** Compositing user image + frame on every crop/zoom change.

**Why bad:** Canvas compositing is expensive (image decoding, pixel manipulation, drawing). Would cause lag during interactive editing. react-easy-crop already provides visual preview.

**Instead:** Use react-easy-crop's built-in preview during editing. Only composite when user clicks download.

### Anti-Pattern 2: Using Zustand for State Management
**What:** Adding Zustand store for uploadedImage, crop, zoom, selectedFrame.

**Why bad:** Over-engineering for 4 pieces of state. useState lifted to App component is sufficient. Zustand adds dependency, complexity, and no meaningful benefit for this scale.

**Instead:** Use useState in App component. If state management becomes complex later (unlikely for this app), migrate to useReducer before considering external library.

### Anti-Pattern 3: Storing Frames in public/ Folder
**What:** Placing frame1.png, frame2.png in public/ and loading via fetch('/frame1.png').

**Why bad:** 
- No cache-busting (same filename = browser cache issues after frame updates)
- No Vite optimization (not bundled, not minified)
- Runtime loading = slower, more complex error handling
- No TypeScript type checking for asset paths

**Instead:** Import frames as ESM imports. Vite handles hashing, bundling, and optimization.

### Anti-Pattern 4: Duplicating Crop State
**What:** Storing crop in both App state and ImageEditor local state.

**Why bad:** State duplication → sync bugs. Which is source of truth? DownloadButton needs App state, but ImageEditor might have different local state.

**Instead:** Single source of truth in App. ImageEditor is controlled component (receives crop, calls onCropChange).

### Anti-Pattern 5: Using State for Canvas Element
**What:** `const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)`

**Why bad:** Canvas element is not rendered by React. Storing in state triggers unnecessary re-renders when canvas is created/destroyed.

**Instead:** Use useRef or create canvas imperatively in download handler (preferred for this app since canvas only needed momentarily).

### Anti-Pattern 6: Global CSS for Component-Specific Styles
**What:** Putting all component styles in global App.css.

**Why bad:** Specificity wars, naming conflicts, hard to track which styles apply to which component.

**Instead:** Use CSS Modules or scoped styles. For a tiny app like this, even inline styles or Tailwind are acceptable.

## State Management Decision: useState vs useReducer vs Zustand

### Recommendation: useState in App Component

**Why:**
- Only 4 pieces of state (uploadedImage, selectedFrame, crop, zoom)
- No complex interdependencies
- Updates are simple and independent
- React docs: "start with useState and consider migrating to useReducer when state management becomes too complex"

**When to Reconsider:**
- If adding undo/redo → useReducer
- If adding multi-step wizard with validation → useReducer
- If sharing state across 5+ sibling components → Context + useState
- If state exceeds 10+ pieces with complex updates → Zustand or useReducer

**For this app:** useState is correct choice. Over-engineering state management would add complexity without benefit.

## Canvas Compositing Strategy

### Recommendation: Composite on Download Only

**Options Considered:**

| Strategy | When | Pros | Cons | Verdict |
|----------|------|------|------|---------|
| **On every crop/zoom change** | User drags/zooms | Real-time composite preview | Expensive, causes lag, unnecessary (react-easy-crop shows preview) | ❌ Avoid |
| **On frame selection** | User clicks frame | Early validation of frame+image | Still expensive, user might change frame multiple times | ❌ Avoid |
| **On download only** | User clicks download | No performance overhead during editing, compositing once | No composite preview (but react-easy-crop provides preview) | ✅ Recommended |
| **Background worker** | After upload, in worker | Non-blocking | Over-engineered for 2-3 day campaign, added complexity | ❌ Over-engineering |

**Decision Rationale:**
1. react-easy-crop provides live preview of crop/zoom (no need for canvas preview)
2. Compositing is one-time operation (download once, not iterative)
3. Simplicity beats performance optimization for this scale
4. Frame overlay is visually simple (no need for pre-visualization)

**Implementation:**
```typescript
// DownloadButton.tsx
const handleDownload = async () => {
  // Step 1: Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH; // e.g., 1000px
  canvas.height = TARGET_HEIGHT; // e.g., 1000px
  const ctx = canvas.getContext('2d')!;
  
  // Step 2: Draw cropped user image
  const userImage = await loadImage(image);
  const croppedCanvas = getCroppedImg(userImage, crop, zoom);
  ctx.drawImage(croppedCanvas, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  
  // Step 3: Draw frame on top
  const frameImage = await loadImage(frame);
  ctx.drawImage(frameImage, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  
  // Step 4: Export
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob!);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-with-${selectedFrame}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};
```

## Asset Handling: Import vs public/ Folder

### Recommendation: Import Frame PNGs

**Vite Asset Handling:**

| Approach | Use Case | Benefits | Drawbacks |
|----------|----------|----------|-----------|
| **Import as ESM** | Known assets at build time | Cache-busting (hashed filenames), bundling, tree-shaking, TypeScript safety | Assets must exist at build time |
| **public/ folder** | Assets referenced by URL at runtime, dynamic paths | Keeps exact filename, accessible via absolute path | No cache-busting, no bundling, no optimization |

**For this app:**
- Frames are known at build time (2 static PNGs)
- Frame PNGs don't change at runtime
- Want cache-busting (user might update frame PNGs between deployments)

**Implementation:**
```typescript
// src/frames.ts
import frame1 from './assets/frames/frame1.png';
import frame2 from './assets/frames/frame2.png';

export const FRAMES = [
  { id: 'frame1', url: frame1, name: 'Frame 1' },
  { id: 'frame2', url: frame2, name: 'Frame 2' },
] as const;
```

**Directory structure:**
```
src/
  assets/
    frames/
      frame1.png
      frame2.png
  frames.ts
  App.tsx
```

**When to use public/:**
- If user needs to drop frame PNGs into deployed app without rebuild (not required per PROJECT.md)
- If frame URLs are dynamic (e.g., loaded from config file at runtime)

## Build Order Implications

**Phase structure recommendation for roadmap:**

### Phase 1: Static UI Shell (No interactivity)
**Build order:**
1. Vite + React setup
2. App component with placeholder state
3. ImageUploader component (UI only, no file handling)
4. FramePicker component (static thumbnails)
5. ImageEditor placeholder (just a div)
6. DownloadButton (disabled)

**Why first:** Establishes component boundaries and prop interfaces without complex logic.

### Phase 2: Upload + Frame Selection (No editing)
**Build order:**
1. Implement FileReader in ImageUploader
2. Wire up onUpload callback
3. Display uploaded image (no crop, just <img>)
4. Implement frame selection in FramePicker
5. Wire up onSelect callback
6. Show selected frame indicator

**Why second:** Validates state flow (callbacks up, props down) before adding complex editing.

### Phase 3: Image Editing (react-easy-crop integration)
**Build order:**
1. Install react-easy-crop
2. Replace <img> with Cropper component
3. Wire up crop/zoom state
4. Add zoom controls (slider or buttons)
5. Test crop area calculations

**Why third:** Most complex component. Requires working upload + frame selection to test properly.

### Phase 4: Canvas Compositing + Download
**Build order:**
1. Implement canvas creation in DownloadButton
2. Implement getCroppedImg utility (extracts crop from react-easy-crop)
3. Draw user image on canvas
4. Draw frame overlay
5. Implement toBlob + download trigger
6. Test with various image sizes/formats

**Why last:** Depends on all other components working. Easiest to debug when input data (crop, zoom, frame) is correct.

### Dependencies:
```
Phase 1 (UI shell) → Phase 2 (upload/select) → Phase 3 (editing) → Phase 4 (download)
```

**No parallelization possible:** Each phase depends on previous phase's state flow.

## Component Communication

### Parent → Child (Props)
```typescript
// App.tsx → ImageEditor
<ImageEditor
  image={uploadedImage}        // String (data URL)
  crop={crop}                   // { x: number, y: number }
  zoom={zoom}                   // number
  onCropChange={setCrop}        // (crop) => void
  onZoomChange={setZoom}        // (zoom) => void
/>
```

### Child → Parent (Callbacks)
```typescript
// ImageUploader → App
const ImageUploader = ({ onUpload }: { onUpload: (image: string) => void }) => {
  // When file selected:
  onUpload(dataUrl);
};
```

### Sibling → Sibling (Via Parent)
```typescript
// FramePicker affects DownloadButton (both siblings)
// FramePicker → App → DownloadButton

// FramePicker emits:
onSelect('frame2');

// App updates state:
setSelectedFrame('frame2');

// DownloadButton receives:
<DownloadButton frame={selectedFrame} ... />
```

## Error Handling

### Upload Errors
- File too large → Alert + clear input
- Invalid file type → Alert + clear input
- FileReader error → Alert + log to console

### Compositing Errors
- Image load failure → Disable download button + show error
- Canvas error → Alert + log to console
- toBlob failure → Alert + log to console

**No retry logic needed:** Single-use app, user can refresh and re-upload.

## Performance Considerations

| Concern | At Launch | If Needed Later |
|---------|-----------|-----------------|
| Large image uploads | Validate max file size (10MB) | Add client-side resize before crop |
| Canvas compositing lag | Composite only on download | Use OffscreenCanvas (not needed for this app) |
| Frame PNG size | Optimize PNGs (TinyPNG, ImageOptim) | Lazy-load frames (not needed for 2 frames) |
| Initial bundle size | react-easy-crop is only dependency (~30KB) | Code-split (overkill for this app) |

**For 2-3 day campaign:** No performance optimization needed beyond lazy canvas compositing.

## Technology Stack Integration

**Framework:** React 18+ (Vite template)
**State:** useState (lifted to App)
**Refs:** useRef for canvas (if needed)
**Styling:** CSS Modules or Tailwind (either fine)
**Image editing:** react-easy-crop (controlled component pattern)
**Canvas:** HTML5 Canvas API (vanilla, no library)

**No additional dependencies needed** beyond react-easy-crop.

## Sources

**HIGH Confidence (Official Documentation):**
- [Vite Asset Handling](https://vite.dev/guide/assets.html) - Import vs public/ folder
- [React State Management](https://react.dev/learn/sharing-state-between-components) - Lifting state up
- [React State Structure](https://react.dev/learn/choosing-the-state-structure) - Grouping related state
- [React useReducer](https://react.dev/learn/extracting-state-logic-into-a-reducer) - useState vs useReducer
- [React Refs](https://react.dev/learn/referencing-values-with-refs) - useRef for canvas access
- [React Component Hierarchy](https://react.dev/learn/thinking-in-react) - Component boundaries
- [Canvas Compositing](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing) - Canvas API patterns
- [Canvas toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) - Export to blob

**MEDIUM Confidence (Library Documentation):**
- [react-easy-crop GitHub](https://github.com/ValentinH/react-easy-crop) - Controlled component pattern
- [Zustand GitHub](https://github.com/pmndrs/zustand) - When to use external state management
