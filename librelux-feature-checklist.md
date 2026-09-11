# LibreLux master feature checklist

See `librelux-optics-suite-checklist.md` for the full LibrePure, LibreFX, and LibreFilm capability matrix.

This list combines the modern Lightroom, Lightroom Classic, and DxO-style professional photo workflows into one cohesive web app. It describes product capabilities, not proprietary code or branded algorithms.

Status key: **Done** = implemented and verified; **In progress** = current build batch; **Planned** = sequenced later.

## Batch 1 — Foundation and local workflow

- [x] Done — Multi-photo browser import
- [x] Done — Device-local photo library using IndexedDB
- [x] Done — Restore the last library and selected photo after reopening
- [x] Done — Grid view, detail view, and persistent filmstrip
- [x] Done — Library, Develop, Optics, and Export workspaces
- [x] Done — Non-destructive per-photo edit instructions
- [x] Done — Undo, redo, reset, and original/edited comparison
- [x] Done — Full-resolution JPEG export
- [x] Done — Responsive desktop and compact layouts
- [x] Done — Keyboard routes for modules, ratings, undo, and compare

## Batch 2 — 50 completed additions

- [x] Done — Remember the active photo between browser sessions
- [x] Done — Edited-photo catalog view with live counts
- [x] Done — Rejected-photo catalog view with live counts
- [x] Done — Sort library by most recent
- [x] Done — Sort library alphabetically by filename
- [x] Done — Sort library by star rating
- [x] Done — Sort library by file size
- [x] Done — Reject flag button and X keyboard shortcut
- [x] Done — Pick flag button and P keyboard shortcut
- [x] Done — Clear flag state with U keyboard shortcut
- [x] Done — Persistent photo title field
- [x] Done — Persistent photo caption field
- [x] Done — Persistent creator field
- [x] Done — Persistent copyright field
- [x] Done — Add persistent keywords
- [x] Done — Remove persistent keywords
- [x] Done — Copy edit settings button and shortcut
- [x] Done — Paste edit settings button and shortcut
- [x] Done — One-click black-and-white conversion
- [x] Done — Global hue rotation control
- [x] Done — Shadow color-grading hue
- [x] Done — Shadow color-grading saturation
- [x] Done — Midtone color-grading hue
- [x] Done — Midtone color-grading saturation
- [x] Done — Highlight color-grading hue
- [x] Done — Highlight color-grading saturation
- [x] Done — Color-grading balance control
- [x] Done — Sharpening amount control
- [x] Done — Sharpening radius control
- [x] Done — Sharpening detail control
- [x] Done — Sharpening masking control
- [x] Done — Vignette midpoint control
- [x] Done — Vignette feather control
- [x] Done — Grain size control
- [x] Done — Grain roughness control
- [x] Done — Lens-vignetting correction control
- [x] Done — Defringe strength control
- [x] Done — Geometry aspect control
- [x] Done — Geometry scale control
- [x] Done — Geometry horizontal offset
- [x] Done — Geometry vertical offset
- [x] Done — Horizontal image flip
- [x] Done — Vertical image flip
- [x] Done — Crop mode with rule-of-thirds overlay
- [x] Done — Original-ratio and 1:1 crop presets
- [x] Done — 4:5, 3:2, and 16:9 crop presets
- [x] Done — PNG export
- [x] Done — WebP export
- [x] Done — 25%, 50%, and 100% export sizing
- [x] Done — Format-aware export filenames and controls

## Batch 3 — 100 completed professional workflow additions

- [x] Done — Folder import from the Library rail
- [x] Done — Recursive import of nested image folders
- [x] Done — Preserve relative folder paths on import
- [x] Done — Import multiple photos in one operation
- [x] Done — Import from mounted removable media through the folder picker
- [x] Done — Record the source folder for every imported photo
- [x] Done — Exact duplicate detection by filename and byte size
- [x] Done — Dedicated Duplicates catalog view
- [x] Done — Live duplicate count in the Library rail
- [x] Done — Grid library view
- [x] Done — Loupe library view
- [x] Done — Two-photo Compare library view
- [x] Done — Multi-photo Survey library view
- [x] Done — Command/Ctrl-click additive photo selection
- [x] Done — Shift-click additive photo selection
- [x] Done — Click-to-replace photo selection
- [x] Done — Live multi-selection count
- [x] Done — Visible multi-selection outlines
- [x] Done — Bulk five-star rating
- [x] Done — Bulk Pick flagging
- [x] Done — Bulk Reject flagging
- [x] Done — Bulk red color labels
- [x] Done — Bulk yellow color labels
- [x] Done — Bulk green color labels
- [x] Done — Bulk blue color labels
- [x] Done — Bulk purple color labels
- [x] Done — Minimum one-star filtering
- [x] Done — Minimum two-star filtering
- [x] Done — Minimum three-star filtering
- [x] Done — Minimum four-star filtering
- [x] Done — Minimum five-star filtering
- [x] Done — Reset rating filter to Any
- [x] Done — Show all color labels
- [x] Done — Filter red labels
- [x] Done — Filter yellow labels
- [x] Done — Filter green labels
- [x] Done — Filter blue labels
- [x] Done — Filter purple labels
- [x] Done — Sort by capture/import time
- [x] Done — Sort by last edit time
- [x] Done — Search by filename
- [x] Done — Search by photo title
- [x] Done — Search by caption
- [x] Done — Search by creator
- [x] Done — Search by keyword
- [x] Done — Search by camera
- [x] Done — Search by lens
- [x] Done — Search by location
- [x] Done — Search by source folder
- [x] Done — Create a virtual photo copy
- [x] Done — Virtual copies reuse the original without duplicating its blob
- [x] Done — Virtual copies keep independent non-destructive adjustments
- [x] Done — Virtual-copy badges and source information
- [x] Done — Downloadable local catalog backup
- [x] Done — Catalog backup includes edit settings
- [x] Done — Catalog backup includes ratings, flags, labels, and metadata
- [x] Done — Persistent camera metadata field
- [x] Done — Persistent lens metadata field
- [x] Done — Persistent location metadata field
- [x] Done — Persistent capture date and time field
- [x] Done — Persistent ISO field
- [x] Done — Persistent aperture field
- [x] Done — Persistent shutter-speed field
- [x] Done — Persistent focal-length field
- [x] Done — Display source folder in File Info
- [x] Done — Display last-edit timestamp in File Info
- [x] Done — Red HSL hue control
- [x] Done — Red HSL saturation control
- [x] Done — Red HSL luminance control
- [x] Done — Orange HSL hue control
- [x] Done — Orange HSL saturation control
- [x] Done — Orange HSL luminance control
- [x] Done — Yellow HSL hue control
- [x] Done — Yellow HSL saturation control
- [x] Done — Yellow HSL luminance control
- [x] Done — Green HSL hue control
- [x] Done — Green HSL saturation control
- [x] Done — Green HSL luminance control
- [x] Done — Aqua HSL hue control
- [x] Done — Aqua HSL saturation control
- [x] Done — Aqua HSL luminance control
- [x] Done — Blue HSL hue control
- [x] Done — Blue HSL saturation control
- [x] Done — Blue HSL luminance control
- [x] Done — Purple HSL hue control
- [x] Done — Purple HSL saturation control
- [x] Done — Purple HSL luminance control
- [x] Done — Magenta HSL hue control
- [x] Done — Magenta HSL saturation control
- [x] Done — Magenta HSL luminance control
- [x] Done — RGB curve shadow control
- [x] Done — RGB curve midtone control
- [x] Done — RGB curve highlight control
- [x] Done — Red-channel shadow, midtone, and highlight curve controls
- [x] Done — Green-channel shadow, midtone, and highlight curve controls
- [x] Done — Blue-channel shadow, midtone, and highlight curve controls
- [x] Done — Live tone-curve preview
- [x] Done — One-click reset for every curve channel
- [x] Done — Global color-grading hue and saturation controls
- [x] Done — Color-grading blending control

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

- [x] Done — Exposure, contrast, highlights, shadows, whites, and blacks
- [x] Done — Parametric tone controls with stable sliders
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

- [x] Done — Temperature, tint, vibrance, and saturation
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

- [x] Done — Texture, clarity, and dehaze
- [x] Done — Post-crop vignette and grain
- [ ] Planned — Sharpening amount, radius, detail, and masking
- [ ] Planned — Luminance noise reduction with detail and contrast
- [ ] Planned — Color noise reduction with detail and smoothness
- [ ] Planned — Grain size and roughness
- [ ] Planned — Vignette midpoint, roundness, feather, and highlight protection
- [ ] Planned — Process versions and backwards-compatible rendering

## Crop, geometry, and transforms

- [x] Done — Rotate left, rotate right, and free rotation
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

- [x] Done — Integrated Optics & Enhance workspace
- [x] Done — One-click analyze-and-enhance starting point
- [x] Done — Manual distortion, vignetting, chromatic aberration, and sharpness controls
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

- [x] Done — Luminance and color-noise controls
- [x] Done — Detail recovery and lens-sharpness controls
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

- [x] Done — Built-in creative preset gallery
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

- [x] Done — Full-resolution JPEG export
- [x] Done — JPEG quality control and safe derivative naming
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

- [x] Done — JPEG, PNG, WebP, and browser-decodable images
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

- [x] Done — Local-first editing with no required account
- [x] Done — Originals remain on the user’s device
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

- [x] Done — Familiar panels, filmstrip, histogram, terminology, and shortcuts
- [x] Done — Stable touch and pointer sliders
- [x] Done — Accessible names and tooltips for icon buttons
- [ ] Planned — Command palette and editable shortcut map
- [ ] Planned — Screen-reader workflow for library and editor
- [ ] Planned — 200% text, high-contrast, reduced-motion, and keyboard-only audits
- [ ] Planned — Custom panel order, solo mode, panel visibility, and workspace presets
- [ ] Planned — Progress center with pause and cancellation
- [ ] Planned — In-app learning overlays that can be disabled
- [ ] Planned — Full release checklist, browser matrix, and regression suite
