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

- [x] Done — File, folder, and mounted memory-card import
- [x] Done — Copy, move, add-in-place, and duplicate import choices
- [x] Done — Import presets and destination organization
- [x] Done — Grid, loupe, compare, survey, and people views
- [x] Done — Filmstrip in every workspace
- [x] Done — Star ratings, pick/reject flags, and custom color labels
- [x] Done — Filename, caption, title, copyright, and creator metadata
- [x] Done — EXIF, IPTC, and XMP metadata reading and writing
- [x] Done — Keywords, keyword hierarchy, suggestions, and synonyms
- [x] Done — Albums, collection sets, quick collections, and target collections
- [x] Done — Rule-based smart albums
- [x] Done — Stacks, auto-stack by capture time, and burst grouping
- [x] Done — Sort by capture time, edit time, rating, and filename
- [x] Done — Filters for text, attributes, metadata, camera, lens, location, and edits
- [x] Done — Duplicate and near-duplicate detection
- [x] Done — Assisted culling by focus, eyes, exposure, and similarity
- [x] Done — Face detection and local people clustering
- [x] Done — Map and GPS view
- [x] Done — Folder tree, watched folders, and automatic import
- [x] Done — Tethered capture
- [x] Done — Virtual copies
- [x] Done — Missing-file detection and relinking
- [x] Done — Catalog backup, verify, optimize, and recovery
- [x] Done — Delete-from-library versus delete-from-device safeguards

## Develop — light and tone

- [x] Done — Exposure, contrast, highlights, shadows, whites, and blacks
- [x] Done — Parametric tone controls with stable sliders
- [x] Done — Parametric tone curve
- [x] Done — Point curve with draggable points
- [x] Done — Independent red, green, and blue channel curves
- [x] Done — Histogram clipping indicators with sampled shadow and highlight counts
- [x] Done — Direct histogram tonal adjustments
- [x] Done — Auto tone with per-image luminance and percentile analysis
- [x] Done — HDR photo editing and gain maps
- [x] Done — Scene-referred wide-gamut processing
- [x] Done — Soft proofing and gamut warnings
- [x] Done — Before/after original, split, side-by-side, and reference views

## Develop — white balance and color grading

- [x] Done — Temperature, tint, vibrance, and saturation
- [x] Done — White-balance eyedropper and sampled neutral calculation
- [x] Done — HSL color mixer for eight color ranges
- [x] Done — Point Color sampler with hue, saturation, luminance, variance, and range
- [x] Done — Three-way color grading for shadows, midtones, and highlights
- [x] Done — Global grading wheel, blending, and balance
- [x] Done — Camera matching and creative profiles
- [x] Done — Profile amount control
- [x] Done — Color calibration and camera-primary controls
- [x] Done — Black-and-white conversion and channel mixer
- [x] Done — LUT import and creative profile generation
- [x] Done — Color-managed display and export transforms

## Develop — presence, detail, and effects

- [x] Done — Texture, clarity, and dehaze
- [x] Done — Post-crop vignette and grain
- [x] Done — Sharpening amount, radius, detail, and masking
- [x] Done — Luminance noise reduction with detail and contrast
- [x] Done — Color noise reduction with detail and smoothness
- [x] Done — Grain size and roughness
- [x] Done — Vignette midpoint, roundness, feather, and highlight protection
- [x] Done — Process versions and backwards-compatible rendering

## Crop, geometry, and transforms

- [x] Done — Rotate left, rotate right, and free rotation
- [x] Done — Crop overlay and draggable handles
- [x] Done — Original, custom, print, screen, and social aspect presets
- [x] Done — Straighten tool and auto level
- [x] Done — Flip horizontal and vertical
- [x] Done — Rule-of-thirds, diagonal, golden ratio, spiral, and grid overlays
- [x] Done — Auto, level, vertical, and full perspective correction
- [x] Done — Guided upright lines
- [x] Done — Vertical, horizontal, rotate, aspect, scale, and offset controls
- [x] Done — Constrain crop and content-aware boundary fill
- [x] Done — Volume deformation for faces and corners
- [x] Done — Anamorphosis correction

## Local masking and selective editing

- [x] Done — Brush mask with size, feather, flow, density, and auto-mask
- [x] Done — Linear gradient mask
- [x] Done — Radial gradient mask
- [x] Done — Luminance range mask
- [x] Done — Color range mask
- [x] Done — Depth range mask when source data exists
- [x] Done — Subject, sky, background, and object selection
- [x] Done — People selection and facial-feature refinement
- [x] Done — Add, subtract, intersect, invert, duplicate, and rename masks
- [x] Done — Mask overlay colors, opacity, pins, and visibility
- [x] Done — Per-mask light, color, detail, effects, and curve controls
- [x] Done — Mask feather and edge refinement
- [x] Done — Mask presets and batch adaptation

## Retouching and generative assistance

- [x] Done — Heal, clone, and local source-aware remove modes
- [x] Done — Brush visualization and source-point control
- [x] Done — Dust-spot visualization and automatic sensor-dust removal
- [x] Done — Red-eye and pet-eye correction
- [x] Done — Portrait quick actions for skin, teeth, eyes, hair, and clothing
- [x] Done — Blemish and unwanted-person removal
- [x] Done — Reflection and window-glare reduction
- [x] Done — Generative remove with an optional free/local model path
- [x] Done — Generative expand with an optional free/local model path
- [x] Done — AI edit history, disclosure, and content credentials

## Libre Optics — camera and lens correction

- [x] Done — Integrated Optics & Enhance workspace
- [x] Done — One-click analyze-and-enhance starting point
- [x] Done — Manual distortion, vignetting, chromatic aberration, and sharpness controls
- [x] Done — EXIF-based camera and lens identification
- [x] Done — Community-owned camera and lens profile database
- [x] Done — Profile download, caching, versioning, and offline reuse
- [x] Done — Focal-length, focus-distance, and aperture-aware correction
- [x] Done — Barrel, pincushion, moustache, and fisheye distortion correction
- [x] Done — Lateral chromatic aberration and purple/green defringe
- [x] Done — Lens vignetting correction
- [x] Done — Lens softness field map and corner-aware sharpening
- [x] Done — Perspective, keystoning, and geometric distortion correction
- [x] Done — Horizon and architectural line detection

## Libre Enhance — RAW and computational imaging

- [x] Done — Luminance and color-noise controls
- [x] Done — Detail recovery and lens-sharpness controls
- [x] Done — Browser-worker image pipeline using OffscreenCanvas
- [x] Done — WebGPU acceleration with CPU and WebAssembly fallbacks
- [x] Done — Bayer and X-Trans demosaicing
- [x] Done — Camera-specific black level, white level, and color matrices
- [x] Done — Highlight reconstruction
- [x] Done — Hot-pixel, dead-pixel, and moire correction
- [ ] Planned — Local neural denoise model with adjustable strength
- [x] Done — Joint demosaic and denoise path
- [x] Done — Optical blur and deconvolution sharpening
- [x] Done — Fine, medium, and coarse local-contrast equalizer
- [x] Done — Atmospheric haze correction
- [ ] Planned — Super-resolution and AI sharpening
- [x] Done — Lens blur with subject-aware depth estimation
- [x] Done — Quality preview crops and full-resolution processing queue
- [x] Done — Side-by-side standard versus enhanced comparison

## Presets, profiles, and film rendering

- [x] Done — Built-in creative preset gallery
- [x] Done — Preset amount slider
- [x] Done — Create, rename, update, delete, import, and export presets
- [x] Done — Partial-compatible preset detection
- [x] Done — Batch preset application
- [x] Done — Adaptive subject, sky, and portrait presets
- [x] Done — User profile and preset organization
- [x] Done — Film stock color response, tone curves, and grain structure
- [x] Done — Black-and-white films and channel response
- [x] Done — Slide, negative, instant, and cinematic looks
- [x] Done — Film age, halation, bloom, and paper response
- [x] Done — Preset preview thumbnails

## Merge, enhance, and multi-image tools

- [x] Done — Panorama merge with boundary warp and edge fill
- [x] Done — HDR merge with deghosting
- [x] Done — HDR panorama merge
- [x] Done — Focus stacking
- [x] Done — Pixel-shift and multi-frame noise reduction
- [x] Done — Time-lapse preparation and synchronized edits
- [x] Done — Batch rename, metadata, develop, enhance, and export

## Export and output

- [x] Done — Full-resolution JPEG export
- [x] Done — JPEG quality control and safe derivative naming
- [x] Done — PNG, WebP, AVIF, TIFF, and DNG export where supported
- [x] Done — Original plus settings package export
- [x] Done — Resize by dimensions, long edge, short edge, megapixels, and percentage
- [x] Done — Resolution and pixel-density controls
- [x] Done — Output sharpening for screen, matte paper, and glossy paper
- [ ] Planned — sRGB, Display P3, Adobe RGB, ProPhoto RGB, and embedded profiles
- [x] Done — Copyright and metadata inclusion controls
- [x] Done — Watermark designer with image and text marks
- [x] Done — Export naming templates
- [x] Done — Export location memory and persistent folder handles
- [x] Done — Export presets
- [x] Done — Batch export queue with progress, cancellation, and retry
- [x] Done — Contact sheets and print layouts
- [x] Done — Slideshows, web galleries, and photo-book layouts
- [x] Done — Publish-service adapter API

## File formats and interoperability

- [x] Done — JPEG, PNG, WebP, and browser-decodable images
- [x] Done — HEIC and HEIF capability detection and decoder fallback
- [x] Done — TIFF including 16-bit sources
- [x] Done — DNG decoding
- [x] Done — Common Canon, Nikon, Sony, Fujifilm, Olympus, Panasonic, and Leica RAW formats
- [x] Done — Embedded preview and sidecar handling
- [x] Done — XMP sidecar read, write, import, and export
- [x] Done — PSD handoff to LibreLayer
- [x] Done — Send-to-LibreLayer and return-with-edits workflow
- [x] Done — External editor handoff through browser file APIs
- [x] Done — Camera Raw-compatible preset and profile import where legally interoperable

## Performance, large files, and reliability

- [x] Done — Local-first editing with no required account
- [x] Done — Originals remain on the user’s device
- [x] Done — Tiled rendering for very large images
- [x] Done — Smart previews and proxies
- [x] Done — Worker pools for decode, render, analyze, and export
- [x] Done — Memory-budget monitoring and graceful quality fallback
- [x] Done — Progressive previews and cancellable rendering
- [x] Done — Background import, indexing, and export queues
- [x] Done — Crash-safe edit journals
- [x] Done — Library backup, restore, and integrity verification
- [x] Done — File System Access permission reconnect flow
- [x] Done — Persistent, changeable default locations including external drives
- [x] Done — Offline-capable PWA shell while remaining URL-first
- [ ] Planned — Windows, macOS, Linux, ChromeOS, and tablet browser QA

## Video, presentation, and sharing

- [x] Done — Video trim, rotate, light, color, effects, and presets
- [x] Done — Still-frame capture and poster frame
- [x] Done — Video export with browser-supported codecs
- [x] Done — Private local review galleries
- [x] Done — Shareable web galleries with explicit opt-in upload
- [ ] Planned — Comments, likes, and collaborator review when profiles are added

## Accessibility and workflow polish

- [x] Done — Familiar panels, filmstrip, histogram, terminology, and shortcuts
- [x] Done — Stable touch and pointer sliders
- [x] Done — Accessible names and tooltips for icon buttons
- [x] Done — Command palette and editable shortcut map
- [x] Done — Screen-reader workflow for library and editor
- [ ] Planned — 200% text, high-contrast, reduced-motion, and keyboard-only audits
- [x] Done — Custom panel order, solo mode, panel visibility, and workspace presets
- [x] Done — Progress center with pause and cancellation
- [x] Done — In-app learning overlays that can be disabled
- [ ] Planned — Full release checklist, browser matrix, and regression suite

## Batch 4 — 100 completed precision, preset, save-location, and Optics additions

- [x] Done — Browser capability detection for editable export destinations
- [x] Done — Choose-save-location control in Export
- [x] Done — Change-save-location control after a folder is connected
- [x] Done — Reset-save-location control back to browser Downloads
- [x] Done — Local or external-drive folders through the browser folder picker
- [x] Done — Export folder handles stored in IndexedDB
- [x] Done — Saved folder handles restored after reopening LibreLux
- [x] Done — Connected destination name shown before export
- [x] Done — Connected-and-remembered destination state
- [x] Done — Permission-needed destination state
- [x] Done — Unsupported-browser destination state
- [x] Done — Write permission requested only when necessary
- [x] Done — Finished image written directly to the chosen folder
- [x] Done — Denied folder permission falls back safely to Downloads
- [x] Done — All save-location preferences remain browser-local
- [x] Done — Preset selection no longer changes the image immediately
- [x] Done — Selected Develop presets receive a persistent outline
- [x] Done — Clicking a selected preset again deselects it
- [x] Done — Pending preset name appears in the confirmation bar
- [x] Done — Pending preset shows a Ready to apply state
- [x] Done — Explicit Apply button for every pending preset
- [x] Done — Apply removes the selected-preset outline
- [x] Done — Cancel removes the selected-preset outline without editing
- [x] Done — Preset application creates an undo point
- [x] Done — Preset application clears an invalid redo branch
- [x] Done — Clean Light staged preset workflow
- [x] Done — Quiet Film staged preset workflow
- [x] Done — Deep Chrome staged preset workflow
- [x] Done — Warm Portrait staged preset workflow
- [x] Done — Silver staged preset workflow
- [x] Done — Night Air staged preset workflow
- [x] Done — HQ processing-quality staged workflow
- [x] Done — Deep processing-quality staged workflow
- [x] Done — Detail+ processing-quality staged workflow
- [x] Done — Color Lift creative-look staged workflow
- [x] Done — Silver Study creative-look staged workflow
- [x] Done — Soft Focus creative-look staged workflow
- [x] Done — HDR Drama creative-look staged workflow
- [x] Done — Vintage Lens creative-look staged workflow
- [x] Done — Night Detail creative-look staged workflow
- [x] Done — Daylight 64 film-look staged workflow
- [x] Done — Chrome 100 film-look staged workflow
- [x] Done — Portrait 160 film-look staged workflow
- [x] Done — Press 400 film-look staged workflow
- [x] Done — One clear pending preset shared across preset families
- [x] Done — Magic Point connected-region selection mode
- [x] Done — Hair-labelled precision selection mode
- [x] Done — Skin-labelled precision selection mode
- [x] Done — Clothes-labelled precision selection mode
- [x] Done — Sky-labelled precision selection mode
- [x] Done — Crosshair pointer while sampling an image region
- [x] Done — On-image click instruction while selection is active
- [x] Done — Cancel-selection control
- [x] Done — Normalized click coordinates across preview sizes
- [x] Done — Bounded 512-pixel local analysis for responsive large-photo selection
- [x] Done — Exact seed-pixel RGB sampling
- [x] Done — Connected-region flood-fill selection
- [x] Done — Four-direction continuity that avoids disconnected matching colors
- [x] Done — Adjustable color-tolerance control
- [x] Done — Tolerance translated into RGB-distance thresholding
- [x] Done — Transparent pixels excluded from selection
- [x] Done — Adjustable edge-feather control
- [x] Done — Feathered alpha-mask generation
- [x] Done — Compact PNG mask storage
- [x] Done — Unique identity for every local mask
- [x] Done — Automatic target-aware mask names
- [x] Done — Masks persisted with the photo in IndexedDB
- [x] Done — Backward-compatible normalization for older saved photos
- [x] Done — Mask preservation in virtual copies
- [x] Done — Independent IDs for masks copied into virtual copies
- [x] Done — Live mask-count badge
- [x] Done — Saved-mask list in the Develop panel
- [x] Done — Selected-mask outline in the mask list
- [x] Done — Target-colored mask chips
- [x] Done — Click-to-select saved masks
- [x] Done — Animated magic-highlight overlay
- [x] Done — Highlight overlay clipped to the selected region
- [x] Done — Per-mask visibility toggle
- [x] Done — Hidden masks excluded from the live adjustment layer
- [x] Done — Per-mask invert control
- [x] Done — Editable mask names
- [x] Done — Duplicate-mask action with independent adjustments
- [x] Done — Delete-mask action
- [x] Done — Local exposure adjustment
- [x] Done — Local contrast adjustment
- [x] Done — Local saturation adjustment
- [x] Done — Local temperature adjustment
- [x] Done — Local clarity adjustment
- [x] Done — Multiple simultaneous local masks
- [x] Done — Local adjustments clipped to mask alpha during preview
- [x] Done — Vertical perspective included in finished exports
- [x] Done — Horizontal perspective included in finished exports
- [x] Done — Optical scale included in finished exports
- [x] Done — Distortion correction scale included in finished exports
- [x] Done — Horizontal offset included in finished exports
- [x] Done — Vertical offset included in finished exports
- [x] Done — Rotation included in finished exports
- [x] Done — Horizontal and vertical flips included in finished exports
- [x] Done — Local mask adjustments included in finished exports
- [x] Done — Hidden masks excluded from finished exports

## Batch 5 — 100 completed organization, recipe, command, and workspace additions

- [x] Done — Persistent album record model
- [x] Done — Unique ID for every album
- [x] Done — Creation timestamp for every album
- [x] Done — Album storage in the local catalog database
- [x] Done — Automatic album restoration after reopening
- [x] Done — New-album name field
- [x] Done — Enter-key album creation
- [x] Done — Dedicated Create album button
- [x] Done — Blank album names safely ignored
- [x] Done — New albums become the active collection
- [x] Done — Album list in the Library rail
- [x] Done — Live photo count for every album
- [x] Done — Clear active-album highlight
- [x] Done — Active-album library filtering
- [x] Done — One-click return to All photos
- [x] Done — Add the selected photo to an album
- [x] Done — Remove the selected photo from an album
- [x] Done — Add a multi-photo selection to an album
- [x] Done — Remove a multi-photo selection when every item is already included
- [x] Done — Duplicate album membership prevention
- [x] Done — Single-photo fallback when no multi-selection exists
- [x] Done — Dedicated delete control for each album
- [x] Done — Album deletion without deleting photos
- [x] Done — Automatic return to All photos when deleting the active album
- [x] Done — Album organization without moving original files
- [x] Done — Albums retained in creation order
- [x] Done — Album changes saved immediately
- [x] Done — Album filters combined with text search
- [x] Done — Album filters combined with rating and label filters
- [x] Done — Album filters combined with the selected library sort
- [x] Done — Preset amount control in the confirmation bar
- [x] Done — Zero-to-100 preset-strength range
- [x] Done — Live preset-strength percentage
- [x] Done — Numeric preset settings interpolated from the current edit
- [x] Done — Full preset result at 100 percent
- [x] Done — Non-destructive preview choice at zero percent
- [x] Done — One strength control shared across Develop and Optics presets
- [x] Done — Preset outline retained while adjusting strength
- [x] Done — Apply uses the currently displayed preset amount
- [x] Done — Responsive preset-strength controls on small screens
- [x] Done — Reusable export-recipe data model
- [x] Done — Built-in Web 2048-pixel export recipe
- [x] Done — Built-in full-resolution Print export recipe
- [x] Done — Built-in lossless PNG Archive recipe
- [x] Done — Export recipe browser inside the Export window
- [x] Done — Selected export recipe highlight
- [x] Done — Web recipe restores JPEG format and web quality
- [x] Done — Print recipe restores maximum JPEG quality
- [x] Done — Archive recipe restores PNG format
- [x] Done — Recipe application restores file format
- [x] Done — Recipe application restores quality
- [x] Done — Recipe application restores percentage scale
- [x] Done — Recipe application restores long-edge sizing
- [x] Done — Recipe application restores resolution
- [x] Done — Recipe application restores output sharpening
- [x] Done — Recipe application restores filename suffix
- [x] Done — Recipe application restores watermark text
- [x] Done — Save Current Settings action
- [x] Done — Unique ID for every custom export recipe
- [x] Done — Sequential names for custom export recipes
- [x] Done — Custom export recipes stored locally
- [x] Done — Custom export recipes restored after reopening
- [x] Done — Built-in and custom recipes merged safely
- [x] Done — Delete control for custom recipes
- [x] Done — Built-in recipes protected from deletion
- [x] Done — Commands button in the main toolbar
- [x] Done — Command or Control K opens Commands
- [x] Done — Dedicated command-center dialog
- [x] Done — Dismissible command center
- [x] Done — Open Library command
- [x] Done — Open Develop command
- [x] Done — Open Optics command
- [x] Done — Open Optics Pure command
- [x] Done — Open Optics Creative command
- [x] Done — Open Optics Film command
- [x] Done — Import Photos command
- [x] Done — Export Photo command
- [x] Done — Toggle Before and After command
- [x] Done — Toggle Left Panel command
- [x] Done — Toggle Right Panel command
- [x] Done — Keyboard Shortcuts command
- [x] Done — Workspace Preferences command
- [x] Done — Keyboard hints beside commands
- [x] Done — Question-mark shortcut for help
- [x] Done — Command center closes after executing a command
- [x] Done — Preferences button in the main toolbar
- [x] Done — Workspace Preferences dialog
- [x] Done — Clear per-computer preference explanation
- [x] Done — Preferences stored in the local catalog database
- [x] Done — Preferences restored after reopening
- [x] Done — High-contrast workspace mode
- [x] Done — Pressed-state accessibility for preference toggles
- [x] Done — Reduced-motion workspace mode
- [x] Done — Animations and transitions disabled in reduced-motion mode
- [x] Done — Compact panel workspace mode
- [x] Done — Remembered filmstrip visibility toggle
- [x] Done — Adjustable library thumbnail size
- [x] Done — 110-to-260-pixel thumbnail-size range
- [x] Done — Bulk Sync Edits across the current selection
- [x] Done — Bulk Reset Edits across the current selection
