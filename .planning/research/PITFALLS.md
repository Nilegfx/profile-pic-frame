# Domain Pitfalls: React + Canvas Image Compositing

**Domain:** Client-side image overlay/compositing with HTML5 Canvas
**Researched:** 2026-04-10

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Tainted Canvas from Uploaded Images
**What goes wrong:** After uploading and drawing a user's image to canvas, calling `toDataURL()` or `toBlob()` throws a `SecurityError: "The operation is insecure"`. The download button silently fails or crashes.

**Why it happens:** When you create an `Image` object from a `FileReader.readAsDataURL()` result (a data URL), browsers treat it as a cross-origin resource unless explicitly marked. Even though the file came from the user's device, the browser's same-origin policy taints the canvas the moment you call `drawImage()` with it.

**Consequences:** User uploads photo, adjusts it, clicks download — nothing happens or error appears. Complete feature failure.

**Prevention:**
- **DO NOT set `crossOrigin` on images loaded from `FileReader`** — data URLs from FileReader are same-origin, adding `crossOrigin="anonymous"` causes the browser to treat them as cross-origin
- **Only set `crossOrigin="anonymous"` on externally hosted images** (e.g., static frame PNGs served from a CDN or different domain)
- For static frame PNGs served from the same origin (your Vite dev server or deployed site), omit `crossOrigin` entirely
- Test the download flow immediately after implementing file upload — this will surface tainted canvas issues early

**Detection:** 
- Error message: `SecurityError: The operation is insecure` or `Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported`
- Happens when calling `toDataURL()` or `toBlob()` after drawing user-uploaded image

**Phase-specific:** Phase 1 (MVP) — Test download with uploaded image before marking upload feature complete

---

### Pitfall 2: Blurry Canvas on Retina/High-DPI Displays
**What goes wrong:** Canvas looks crisp on standard displays but appears blurry/pixelated on MacBook Retina, iPhone, or other high-DPI screens. User uploads high-quality photo, result looks low-res.

**Why it happens:** By default, canvas dimensions are set in CSS pixels, not physical pixels. On a Retina display with `devicePixelRatio = 2`, a 500×500 canvas element is rendered using only 500×500 physical pixels, then scaled up to 1000×1000, causing blur.

**Consequences:** App works but output quality is poor on modern devices (most users). Defeats the purpose of a profile picture tool if results look pixelated.

**Prevention:**
```javascript
// Get the device pixel ratio
const dpr = window.devicePixelRatio || 1;

// Set CSS size (what user sees)
canvas.style.width = `${desiredWidth}px`;
canvas.style.height = `${desiredHeight}px`;

// Set actual canvas size in memory (scaled up for high DPI)
canvas.width = desiredWidth * dpr;
canvas.height = desiredHeight * dpr;

// Scale canvas context to normalize coordinate system
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

// Now draw using CSS pixel coordinates as normal
ctx.drawImage(image, 0, 0, desiredWidth, desiredHeight);
```

**Detection:**
- Compare output on standard laptop vs MacBook/iPad
- Canvas element looks sharp in DOM inspector but exported image is blurry
- `devicePixelRatio` > 1 but canvas width/height don't account for it

**Phase-specific:** Phase 1 (MVP) — Implement DPI scaling before any user testing; retrofitting later is painful

---

### Pitfall 3: Memory Leaks from Object URLs and Image Event Handlers
**What goes wrong:** App starts fast but slows down after multiple upload/crop/download cycles. Browser tab memory usage grows continuously. On mobile, app crashes after 3-4 iterations.

**Why it happens:** Three common sources:
1. `URL.createObjectURL(blob)` creates a persistent memory reference that isn't freed until page unload unless explicitly revoked
2. Image `onload`/`onerror` handlers remain attached even after image is no longer used
3. React effects that create canvas contexts or image objects without cleanup

**Consequences:** Unusable after a few cycles. Mobile users especially impacted. Degraded UX makes app feel broken.

**Prevention:**

**For Object URLs:**
```javascript
// When using createObjectURL for upload preview
const objectUrl = URL.createObjectURL(file);
imageElement.src = objectUrl;

// Clean up in useEffect return
return () => {
  URL.revokeObjectURL(objectUrl);
};
```

**For Image objects in React:**
```javascript
useEffect(() => {
  const img = new Image();
  
  const handleLoad = () => {
    // Draw to canvas
    ctx.drawImage(img, 0, 0);
  };
  
  img.addEventListener('load', handleLoad);
  img.src = imageSrc;
  
  // Cleanup: remove listener and clear src
  return () => {
    img.removeEventListener('load', handleLoad);
    img.src = ''; // Abort any pending loads
  };
}, [imageSrc]);
```

**For FileReader:**
```javascript
// Prefer FileReader over createObjectURL for uploads
const reader = new FileReader();
reader.onload = (e) => {
  setImageData(e.target.result); // data URL, no cleanup needed
};
reader.readAsDataURL(file);
```

**Detection:**
- Chrome DevTools Memory Profiler shows increasing heap size
- Detached DOM nodes accumulating
- Object URLs in Memory tab that weren't revoked
- Image count in Detached Elements grows

**Phase-specific:** Phase 1 (MVP) — Add cleanup functions to all useEffects that create images/URLs; test by uploading 5-10 times in succession

---

### Pitfall 4: Wrong `globalCompositeOperation` for PNG Transparency
**What goes wrong:** Frame completely hides the profile photo, or profile photo overwrites the frame instead of sitting behind it. Transparency isn't composited correctly — frame's transparent region shows white/black instead of the photo underneath.

**Why it happens:** Default `globalCompositeOperation` is `'source-over'` (new content drawn on top). If you draw the frame first, then the photo, the photo covers the frame. If you draw the photo first with default settings, you need to use `'destination-over'` for the frame to go on top, or draw in the correct order.

**Consequences:** Wrong layering — photo appears on top of frame or frame blocks photo entirely. Transparency not composited properly.

**Prevention:**

**Correct approach for profile photo + frame overlay:**
```javascript
// Clear canvas
ctx.clearRect(0, 0, canvas.width, canvas.height);

// 1. Draw the profile photo first (bottom layer)
ctx.drawImage(profileImage, x, y, width, height);

// 2. Draw the frame on top (default source-over is correct)
ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
```

**Alternative: use destination-over if drawing frame first:**
```javascript
// 1. Draw frame first
ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

// 2. Set composite mode to draw photo behind frame
ctx.globalCompositeOperation = 'destination-over';
ctx.drawImage(profileImage, x, y, width, height);

// 3. Reset to default for future operations
ctx.globalCompositeOperation = 'source-over';
```

**Always reset `globalCompositeOperation` after use** — it persists and affects all subsequent draws.

**Detection:**
- Visual: frame and photo in wrong stacking order
- Transparent regions of frame show as solid color
- Frame PNG transparency not working as expected

**Phase-specific:** Phase 1 (MVP) — Test immediately after implementing compositing; very obvious visually

---

## Moderate Pitfalls

### Pitfall 5: `toDataURL()` Performance Issues and Memory Overhead
**What goes wrong:** Download takes 3-5 seconds for large images. Browser freezes during export. On mobile, causes "Page Unresponsive" warnings. Very large images (4K+) can exceed browser URL length limits and fail silently.

**Why it happens:** `toDataURL()` is synchronous and encodes the entire canvas into an in-memory base64 string. For a 2000×2000 canvas, this creates a multi-megabyte string that blocks the main thread.

**Prevention:** Use `toBlob()` instead — it's asynchronous and more memory-efficient:

```javascript
// ❌ BAD: Synchronous, blocks main thread
const dataUrl = canvas.toDataURL('image/png');
const link = document.createElement('a');
link.href = dataUrl;
link.download = 'profile-pic.png';
link.click();

// ✅ GOOD: Async, non-blocking
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'profile-pic.png';
  link.click();
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}, 'image/png');
```

For JPEG output (smaller file size):
```javascript
canvas.toBlob((blob) => {
  // Handle blob
}, 'image/jpeg', 0.95); // 95% quality
```

**Detection:**
- Download button causes UI freeze
- Large images fail to download
- Console warning about URL length

**Phase-specific:** Phase 1 (MVP) — Use `toBlob()` from the start; switching later requires refactoring download logic

---

### Pitfall 6: React `useEffect` Timing Issues with Canvas Refs
**What goes wrong:** Canvas operations fail silently or throw errors like `Cannot read property 'getContext' of null`. Drawing happens before canvas is ready. In React StrictMode (dev), effects run twice, causing duplicate draws or state issues.

**Why it happens:** 
1. Canvas ref is `null` on first render — DOM node doesn't exist yet
2. `useEffect` runs asynchronously after render, but you might be accessing the canvas during render
3. React StrictMode in dev calls setup → cleanup → setup to stress-test effects

**Prevention:**

```javascript
const canvasRef = useRef(null);

useEffect(() => {
  // Always check ref exists
  if (!canvasRef.current) return;
  
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  
  // Perform canvas operations
  // ...
  
  // Cleanup function
  return () => {
    // Clear canvas on unmount or before re-running
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}, [/* dependencies */]);
```

**Don't draw to canvas during render** — only in effects or event handlers:
```javascript
// ❌ BAD: Accessing canvas during render
function MyComponent() {
  const canvas = canvasRef.current;
  if (canvas) {
    canvas.getContext('2d').fillRect(0, 0, 100, 100); // Side effect during render!
  }
  return <canvas ref={canvasRef} />;
}

// ✅ GOOD: Drawing in effect
function MyComponent() {
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillRect(0, 0, 100, 100);
  }, []);
  
  return <canvas ref={canvasRef} />;
}
```

**Detection:**
- Errors about `null` or `undefined` canvas
- Canvas operations work in production but fail/duplicate in dev
- Drawing happens out of order

**Phase-specific:** Phase 1 (MVP) — Establish pattern early: all canvas operations in effects/handlers, never during render

---

### Pitfall 7: Not Scaling Down Large Uploaded Images
**What goes wrong:** User uploads 12MB 4000×6000 photo from iPhone. Canvas becomes sluggish, drawing takes seconds, app feels broken. Mobile devices may crash or refuse to draw the image.

**Why it happens:** Browser canvas has implementation-dependent size limits (typically 4096×4096 to 16384×16384). Even within limits, very large canvases consume huge amounts of memory and slow down all drawing operations. Phones have stricter limits.

**Prevention:**

**Detect and downsample large images before drawing:**
```javascript
function loadAndScaleImage(file, maxDimension = 2048) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => {
        const { width, height } = img;
        
        // Check if scaling needed
        const scale = Math.min(1, maxDimension / Math.max(width, height));
        
        if (scale < 1) {
          // Create temporary canvas to downscale
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width * scale;
          tempCanvas.height = height * scale;
          
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
          
          // Convert to blob and create new image
          tempCanvas.toBlob((blob) => {
            const scaledImg = new Image();
            scaledImg.onload = () => resolve(scaledImg);
            scaledImg.src = URL.createObjectURL(blob);
          });
        } else {
          resolve(img); // No scaling needed
        }
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**Set reasonable max dimensions:**
- For profile pictures: 2048×2048 is more than enough
- Most social media platforms resize to 800×800 or smaller anyway
- Reduces memory usage, improves performance

**Detection:**
- Slow performance with large images
- Canvas fails to draw on mobile
- Memory warnings in DevTools
- `drawImage()` silently fails (per spec, browsers can refuse very large images)

**Phase-specific:** Phase 1 (MVP) — Implement before user testing; users will upload high-res phone photos

---

### Pitfall 8: Forgetting to Handle Image Aspect Ratio and Scaling
**What goes wrong:** Canvas has fixed dimensions, but user uploads portrait photo for a landscape frame (or vice versa). Photo is stretched/squished. Or photo is drawn at wrong position after user resizes it.

**Why it happens:** `drawImage(img, x, y, width, height)` will stretch the image to fit the specified dimensions regardless of aspect ratio. If you calculate width but not height proportionally, distortion occurs.

**Prevention:**

**Calculate dimensions maintaining aspect ratio:**
```javascript
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: srcWidth * ratio,
    height: srcHeight * ratio,
    ratio
  };
}

// Use it:
const { width, height } = calculateAspectRatioFit(
  image.naturalWidth,
  image.naturalHeight,
  canvas.width,
  canvas.height
);

ctx.drawImage(image, x, y, width, height);
```

**For user-controlled resize (your requirement):**
- Use a scale factor, not absolute width/height
- Store original dimensions and apply scale
- Lock aspect ratio (as specified in requirements)

**Detection:**
- Visual: stretched or squished images
- Portrait photos appear wider than tall
- Proportions don't match original

**Phase-specific:** Phase 1 (MVP) — Critical since requirement specifies "aspect-ratio-locked resize"

---

## Minor Pitfalls

### Pitfall 9: Not Using `canvas.getContext('2d', { alpha: false })` When Possible
**What goes wrong:** Slightly slower rendering performance when canvas doesn't need transparency.

**Why it happens:** By default, canvas has an alpha channel. If your final output is always opaque (photo fully covered by frame with opaque background), this is wasted computation.

**Prevention:**
```javascript
// If canvas background is always opaque
const ctx = canvas.getContext('2d', { alpha: false });
```

**For this project:** Probably not applicable since you're compositing transparent PNGs, but worth noting if performance becomes an issue.

---

### Pitfall 10: Canvas State Not Reset Between Operations
**What goes wrong:** Previous `globalCompositeOperation`, `filter`, `globalAlpha`, or transform settings affect subsequent draws unexpectedly. You change a setting for one operation, forget to reset it, and next draw has wrong styling.

**Why it happens:** Canvas context is stateful — all settings persist until explicitly changed.

**Prevention:**

**Use `save()` and `restore()` for isolated operations:**
```javascript
ctx.save(); // Save current state

// Change settings for this operation
ctx.globalCompositeOperation = 'destination-over';
ctx.globalAlpha = 0.5;
ctx.drawImage(img, 0, 0);

ctx.restore(); // Restore previous state
// globalCompositeOperation and globalAlpha are back to original values
```

**Or explicitly reset after each operation:**
```javascript
ctx.globalCompositeOperation = 'multiply';
ctx.drawImage(img, 0, 0);
ctx.globalCompositeOperation = 'source-over'; // Reset to default
```

**Detection:**
- Composite operations affecting wrong draws
- Unexpected transparency or blending
- Transforms from one operation applied to another

**Phase-specific:** Phase 1 (MVP) — Use `save()`/`restore()` around each compositing operation

---

### Pitfall 11: Image Smoothing Disabled for Photo Quality
**What goes wrong:** Uploaded photos look pixelated when scaled, especially when zoomed out. Edges are jagged instead of smooth.

**Why it happens:** `imageSmoothingEnabled` defaults to `true`, which is correct for photos. But if it's accidentally set to `false` (common in pixel art tutorials), photos look terrible.

**Prevention:**
```javascript
// For photos, keep smoothing enabled (default)
ctx.imageSmoothingEnabled = true; // Usually unnecessary, but explicit is good
ctx.imageSmoothingQuality = 'high'; // Optional: 'low', 'medium', 'high'

// Only disable for pixel art or when you want crisp edges
```

**For this project:** Keep enabled for user photos, but you might consider disabling it if frame PNG has pixel-art-style hard edges.

**Detection:**
- Photos look pixelated when scaled down
- Visible stair-stepping on curved edges

---

### Pitfall 12: Using `naturalWidth`/`naturalHeight` vs `width`/`height`
**What goes wrong:** Image is drawn at wrong size, especially if image element has CSS dimensions different from intrinsic size.

**Why it happens:** `img.width` and `img.height` return the *rendered* dimensions (CSS), while `img.naturalWidth` and `img.naturalHeight` return the *actual* image dimensions.

**Prevention:**
```javascript
// ❌ WRONG: Uses CSS dimensions
ctx.drawImage(img, 0, 0, img.width, img.height);

// ✅ CORRECT: Uses actual image dimensions
ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
```

**For this project:** When drawing user-uploaded images, always use `naturalWidth`/`naturalHeight` to get true dimensions.

**Detection:**
- Image drawn at wrong size
- Mismatch between expected and actual canvas content
- Works in some browsers, not others (if CSS differs)

---

### Pitfall 13: EXIF Orientation Ignored (Older Browsers)
**What goes wrong:** User uploads photo taken on iPhone in portrait mode. Image appears rotated 90° in the canvas even though it displays correctly in OS preview.

**Why it happens:** Older browsers ignore EXIF orientation metadata. Modern browsers (2020+) respect it, but you might encounter issues on older devices.

**Prevention:** For this project (short 2-3 day campaign), likely not worth the complexity since modern browsers handle it. But if you encounter rotation issues:

```javascript
// Check if image has wrong orientation
// Use a library like 'blueimp-load-image' to read EXIF and rotate accordingly
// Or detect and manually rotate using ctx.rotate()
```

**Detection:**
- Images rotated 90°, 180°, or 270° on some devices
- iOS photos specifically affected

**Phase-specific:** Phase 1 — Monitor during testing; only fix if users report it

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: File Upload | Tainted canvas (Pitfall 1) | Test download immediately after upload implementation |
| Phase 1: Canvas Setup | Blurry on retina (Pitfall 2) | Implement DPI scaling from start |
| Phase 1: Image Display | Memory leaks (Pitfall 3) | Add cleanup to all effects |
| Phase 1: Compositing | Wrong layer order (Pitfall 4) | Test with actual transparent PNG |
| Phase 1: Download | Slow toDataURL (Pitfall 5) | Use toBlob from start |
| Phase 1: React Integration | Ref timing (Pitfall 6) | Null checks, effects only |
| Phase 1: Large Images | Performance (Pitfall 7) | Downscale on upload |
| Phase 1: Resize/Reposition | Aspect ratio (Pitfall 8) | Calculate proportionally |

---

## Testing Checklist

Before shipping Phase 1:

- [ ] Upload image → adjust → download works without errors
- [ ] Test on retina display (MacBook/iPad) — output is sharp
- [ ] Upload 5 images in a row — no slowdown or memory growth
- [ ] Frame transparency shows photo underneath correctly
- [ ] Download completes in under 1 second for typical images
- [ ] Canvas operations don't throw `null` errors in React StrictMode
- [ ] Large (4K+) images from iPhone work without crashing
- [ ] Resized image maintains aspect ratio
- [ ] All useEffects have cleanup functions
- [ ] Test on mobile device (iOS/Android) — performance acceptable

---

## Sources

All information verified from official documentation:

- [MDN: CORS-enabled images](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image) — Tainted canvas, crossOrigin usage
- [MDN: Canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — Performance, memory, DPI handling
- [MDN: globalCompositeOperation](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) — Compositing modes
- [MDN: toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) — Async export, quality settings
- [MDN: toDataURL](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL) — Performance issues
- [MDN: devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) — Retina display handling
- [React: Refs](https://react.dev/learn/manipulating-the-dom-with-refs) — Canvas ref timing
- [React: useEffect](https://react.dev/reference/react/useEffect) — Cleanup functions
- [React: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — Common mistakes
- [MDN: FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL) — File upload handling
- [MDN: createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) — Memory leak prevention
- [MDN: drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage) — Image scaling
- [MDN: save/restore](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save) — Canvas state management
- [MDN: imageSmoothingEnabled](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) — Image quality
- [MDN: getContext](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext) — Context options

**Confidence:** HIGH — All pitfalls verified against official MDN and React documentation
