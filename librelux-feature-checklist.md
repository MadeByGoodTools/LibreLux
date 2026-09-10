# LibreLux master feature checklist

This list combines the modern Lightroom, Lightroom Classic, and DxO-style professional photo workflows into one cohesive web app. It describes product capabilities, not proprietary code or branded algorithms.

Status key: **Done** = implemented and verified; **In progress** = current build batch; **Planned** = sequenced later.

## Batch 1 — Foundation and local workflow

- [ ] In progress — Multi-photo browser import
- [ ] In progress — Device-local photo library using IndexedDB
- [ ] In progress — Restore the last library and selected photo after reopening
- [ ] In progress — Grid view, detail view, and persistent filmstrip
- [ ] In progress — Library, Develop, Enhance, and Export workspaces
- [ ] In progress — Non-destructive per-photo edit instructions
- [ ] In progress — Undo, redo, reset, and original/edited comparison
- [ ] In progress — Full-resolution JPEG export
- [ ] In progress — Responsive desktop and compact layouts
- [ ] In progress — Keyboard routes for modules, ratings, undo, and compare

## Library, catalog, and culling

- [ ] Planned — File, folder, and memory-card import
- [ ] Planned — Copy, move, add-in-place, and duplicate import choices
- [ ] Planned — Import presets and destination organization
- [ ] Planned — Grid, loupe, compare, survey, and people views
- [ ] Planned — Filmstrip in every workspace
- [ ] Planned — Star ratings, pick/reject flags, and custom color labels
- [ ] Planned — Filename, caption, title, copyright, and creator metadata
- [ ] Planned — EXIF, IPTC, and XMP metadata reading and writing
- [ ] Planned — Keywords, keyword hierarchy, suggestions, and synonyms
- [ ] Planned — Albums, collection sets, quick collections, and target collections
- [ ] Planned — Rule-based smart albums
- [ ] Planned — Stacks, auto-stack by capture time, and burst grouping
- [ ] Planned — Sort by capture time, edit time, rating, filename, and custom order
- [ ] Planned — Filters for text, attributes, metadata, camera, lens, location, and edits
- [ ] Planned — Duplicate and near-duplicate detection
- [ ] Planned — Assisted culling by focus, eyes, exposure, and similarity
- [ ] Planned — Face detection and local people clustering
- [ ] Planned — Map and GPS view
- [ ] Planned — Folder tree, watched folders, and automatic import
- [ ] Planned — Tethered capture
- [ ] Planned — Virtual copies
- [ ] Planned — Missing-file detection and relinking
- [ ] Planned — Catalog backup, verify, optimize, and recovery
- [ ] Planned — Delete-from-library versus delete-from-device safeguards

## Develop — light and tone

- [ ] In progress — Exposure, contrast, highlights, shadows, whites, and blacks
- [ ] In progress — Parametric tone controls with stable sliders
- [ ] Planned — Parametric tone curve
- [ ] Planned — Point curve with draggable points
- [ ] Planned — Independent red, green, and blue channel curves
- [ ] Planned — Histogram clipping indicators
- [ ] Planned — Direct histogram tonal adjustments
- [ ] Planned — Auto tone with per-image analysis
- [ ] Planned — HDR photo editing and gain maps
- [ ] Planned — Scene-referred wide-gamut processing
- [ ] Planned — Soft proofing and gamut warnings
- [ ] Planned — Before/after split, side-by-side, and reference views

## Develop — white balance and color grading

- [ ] In progress — Temperature, tint, vibrance, and saturation
- [ ] Planned — White-balance eyedropper and sampled neutral calculation
- [ ] Planned — HSL color mixer for eight color ranges
- [ ] Planned — Point Color sampler with hue, saturation, luminance, variance, and range
- [ ] Planned — Three-way color grading for shadows, midtones, and highlights
- [ ] Planned — Global grading wheel, blending, and balance
- [ ] Planned — Camera matching and creative profiles
- [ ] Planned — Profile amount control
- [ ] Planned — Color calibration and camera-primary controls
- [ ] Planned — Black-and-white conversion and channel mixer
- [ ] Planned — LUT import and creative profile generation
- [ ] Planned — Color-managed display and export transforms

## Develop — presence, detail, and effects

- [ ] In progress — Texture, clarity, and dehaze
- [ ] In progress — Post-crop vignette and grain
- [ ] Planned — Sharpening amount, radius, detail, and masking
- [ ] Planned — Luminance noise reduction with detail and contrast
- [ ] Planned — Color noise reduction with detail and smoothness
- [ ] Planned — Grain size and roughness
- [ ] Planned — Vignette midpoint, roundness, feather, and highlight protection
- [ ] Planned — Process versions and backwards-compatible rendering

## Crop, geometry, and transforms

- [ ] In progress — Rotate left, rotate right, and free rotation
- [ ] Planned — Crop overlay and draggable handles
- [ ] Planned — Original, custom, print, screen, and social aspect presets
- [ ] Planned — Straighten tool and auto level
- [ ] Planned — Flip horizontal and vertical
- [ ] Planned — Rule-of-thirds, diagonal, golden ratio, spiral, and grid overlays
- [ ] Planned — Auto, level, vertical, and full perspective correction
- [ ] Planned — Guided upright lines
- [ ] Planned — Vertical, horizontal, rotate, aspect, scale, and offset controls
- [ ] Planned — Constrain crop and content-aware boundary fill
- [ ] Planned — Volume deformation for faces and corners
- [ ] Planned — Anamorphosis correction

## Local masking and selective editing

- [ ] Planned — Brush mask with size, feather, flow, density, and auto-mask
- [ ] Planned — Linear gradient mask
- [ ] Planned — Radial gradient mask
- [ ] Planned — Luminance range mask
- [ ] Planned — Color range mask
- [ ] Planned — Depth range mask when source data exists
- [ ] Planned — Subject, sky, background, and object selection
- [ ] Planned — People selection and facial-feature refinement
- [ ] Planned — Add, subtract, intersect, invert, duplicate, and rename masks
- [ ] Planned — Mask overlay colors, opacity, pins, and visibility
- [ ] Planned — Per-mask light, color, detail, effects, and curve controls
- [ ] Planned — Mask feather and edge refinement
- [ ] Planned — Mask presets and batch adaptation

## Retouching and generative assistance

- [ ] Planned — Heal, clone, and content-aware remove modes
- [ ] Planned — Brush visualization and source-point control
- [ ] Planned — Dust-spot visualization and automatic sensor-dust removal
- [ ] Planned — Red-eye and pet-eye correction
- [ ] Planned — Portrait quick actions for skin, teeth, eyes, hair, and clothing
- [ ] Planned — Blemish and unwanted-person removal
- [ ] Planned — Reflection and window-glare reduction
- [ ] Planned — Generative remove with an optional free/local model path
- [ ] Planned — Generative expand with an optional free/local model path
- [ ] Planned — AI edit history, disclosure, and content credentials

## Libre Optics — camera and lens correction

- [ ] In progress — Integrated Optics & Enhance workspace
- [ ] In progress — One-click analyze-and-enhance starting point
- [ ] In progress — Manual distortion, vignetting, chromatic aberration, and sharpness controls
- [ ] Planned — EXIF-based camera and lens identification
- [ ] Planned — Community-owned camera and lens profile database
- [ ] Planned — Profile download, caching, versioning, and offline reuse
- [ ] Planned — Focal-length, focus-distance, and aperture-aware correction
- [ ] Planned — Barrel, pincushion, moustache, and fisheye distortion correction
- [ ] Planned — Lateral chromatic aberration and purple/green defringe
- [ ] Planned — Lens vignetting and transmission correction
- [ ] Planned — Lens softness field map and corner-aware sharpening
- [ ] Planned — Perspective, keystoning, and geometric distortion correction
- [ ] Planned — Horizon and architectural line detection

## Libre Enhance — RAW and computational imaging

- [ ] In progress — Luminance and color-noise controls
- [ ] In progress — Detail recovery and lens-sharpness controls
- [ ] Planned — Browser-worker image pipeline using OffscreenCanvas
- [ ] Planned — WebGPU acceleration with CPU and WebAssembly fallbacks
- [ ] Planned — Bayer and X-Trans demosaicing
- [ ] Planned — Camera-specific black level, white level, and color matrices
- [ ] Planned — Highlight reconstruction
- [ ] Planned — Hot-pixel, dead-pixel, and moire correction
- [ ] Planned — Local neural denoise model with adjustable strength
- [ ] Planned — Joint demosaic and denoise path
- [ ] Planned — Optical blur and deconvolution sharpening
- [ ] Planned — Fine, medium, and coarse local-contrast equalizer
- [ ] Planned — Atmospheric haze correction
- [ ] Planned — Super-resolution and AI sharpening
- [ ] Planned — Lens blur with subject-aware depth estimation
- [ ] Planned — Quality preview crops and full-resolution processing queue
- [ ] Planned — Side-by-side standard versus enhanced comparison

## Presets, profiles, and film rendering

- [ ] In progress — Built-in creative preset gallery
- [ ] Planned — Preset amount slider
- [ ] Planned — Create, rename, update, delete, import, and export presets
- [ ] Planned — Partial-compatible preset detection
- [ ] Planned — Batch preset application
- [ ] Planned — Adaptive subject, sky, and portrait presets
- [ ] Planned — User profile and preset organization
- [ ] Planned — Film stock color response, tone curves, and grain structure
- [ ] Planned — Black-and-white films and channel response
- [ ] Planned — Slide, negative, instant, and cinematic looks
- [ ] Planned — Film age, halation, bloom, and paper response
- [ ] Planned — Preset preview thumbnails

## Merge, enhance, and multi-image tools

- [ ] Planned — Panorama merge with boundary warp and edge fill
- [ ] Planned — HDR merge with deghosting
- [ ] Planned — HDR panorama merge
- [ ] Planned — Focus stacking
- [ ] Planned — Pixel-shift and multi-frame noise reduction
- [ ] Planned — Time-lapse preparation and synchronized edits
- [ ] Planned — Batch rename, metadata, develop, enhance, and export

## Export and output

- [ ] In progress — Full-resolution JPEG export
- [ ] In progress — JPEG quality control and safe derivative naming
- [ ] Planned — PNG, WebP, AVIF, TIFF, and DNG export where supported
- [ ] Planned — Original plus settings package export
- [ ] Planned — Resize by dimensions, long edge, short edge, megapixels, and percentage
- [ ] Planned — Resolution and pixel-density controls
- [ ] Planned — Output sharpening for screen, matte paper, and glossy paper
- [ ] Planned — sRGB, Display P3, Adobe RGB, ProPhoto RGB, and embedded profiles
- [ ] Planned — Copyright and metadata inclusion controls
- [ ] Planned — Watermark designer with image and text marks
- [ ] Planned — Export naming templates
- [ ] Planned — Export location memory and persistent folder handles
- [ ] Planned — Export presets
- [ ] Planned — Batch export queue with progress, cancellation, and retry
- [ ] Planned — Contact sheets and print layouts
- [ ] Planned — Slideshows, web galleries, and photo-book layouts
- [ ] Planned — Publish-service adapter API

## File formats and interoperability

- [ ] In progress — JPEG, PNG, WebP, and browser-decodable images
- [ ] Planned — HEIC and HEIF capability detection and decoder fallback
- [ ] Planned — TIFF including 16-bit sources
- [ ] Planned — DNG decoding
- [ ] Planned — Common Canon, Nikon, Sony, Fujifilm, Olympus, Panasonic, and Leica RAW formats
- [ ] Planned — Embedded preview and sidecar handling
- [ ] Planned — XMP read, write, import, and export
- [ ] Planned — PSD handoff to LibreLayer
- [ ] Planned — Send-to-LibreLayer and return-with-edits workflow
- [ ] Planned — External editor handoff through browser file APIs
- [ ] Planned — Camera Raw-compatible preset and profile import where legally interoperable

## Performance, large files, and reliability

- [ ] In progress — Local-first editing with no required account
- [ ] In progress — Originals remain on the user’s device
- [ ] Planned — Tiled rendering for very large images
- [ ] Planned — Smart previews and proxies
- [ ] Planned — Worker pools for decode, render, analyze, and export
- [ ] Planned — Memory-budget monitoring and graceful quality fallback
- [ ] Planned — Progressive previews and cancellable rendering
- [ ] Planned — Background import, indexing, and export queues
- [ ] Planned — Crash-safe edit journals
- [ ] Planned — Library backup, restore, and integrity verification
- [ ] Planned — File System Access permission reconnect flow
- [ ] Planned — Persistent, changeable default locations including external drives
- [ ] Planned — Offline-capable PWA shell while remaining URL-first
- [ ] Planned — Windows, macOS, Linux, ChromeOS, and tablet browser QA

## Video, presentation, and sharing

- [ ] Planned — Video trim, rotate, light, color, effects, and presets
- [ ] Planned — Still-frame capture and poster frame
- [ ] Planned — Video export with browser-supported codecs
- [ ] Planned — Private local review galleries
- [ ] Planned — Shareable web galleries with explicit opt-in upload
- [ ] Planned — Comments, likes, and collaborator review when profiles are added

## Accessibility and workflow polish

- [ ] In progress — Familiar panels, filmstrip, histogram, terminology, and shortcuts
- [ ] In progress — Stable touch and pointer sliders
- [ ] In progress — Accessible names and tooltips for icon buttons
- [ ] Planned — Command palette and editable shortcut map
- [ ] Planned — Screen-reader workflow for library and editor
- [ ] Planned — 200% text, high-contrast, reduced-motion, and keyboard-only audits
- [ ] Planned — Custom panel order, solo mode, panel visibility, and workspace presets
- [ ] Planned — Progress center with pause and cancellation
- [ ] Planned — In-app learning overlays that can be disabled
- [ ] Planned — Full release checklist, browser matrix, and regression suite
