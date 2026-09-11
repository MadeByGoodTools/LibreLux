# LibreLux Optics Studio — complete capability matrix

This matrix translates the major current capabilities of DxO PureRAW, Nik Collection, and FilmPack into original LibreLux web-app equivalents. Names, presets, profiles, and processing are LibreLux originals. “Built” means the control changes the preview, persists non-destructively with the photo, participates in undo/copy-paste, and is included in export where the browser supports it. “Engine” means the feature needs a dedicated RAW, computer-vision, HDR, or camera-profile engine before it can honestly be called complete.

## LibrePure — clean input and optical preprocessing

- [x] Built — Dedicated Pure mode inside Optics Studio
- [x] Built — Non-destructive local preprocessing settings
- [x] Built — One-click Process photo workflow
- [x] Built — HQ natural-cleanup recipe
- [x] Built — Deep high-ISO cleanup recipe
- [x] Built — Detail+ fine-texture recipe
- [x] Built — Luminance and color noise reduction
- [x] Built — Detail recovery and output sharpening
- [x] Built — Lens sharpness and vignetting correction
- [x] Built — Geometric distortion correction
- [x] Built — Chromatic aberration and defringe controls
- [x] Built — Manual perspective correction and leveling
- [x] Built — Vertical, horizontal, aspect, scale, and offset geometry
- [x] Built — Local-device processing and persistence
- [x] Built — Before/after inspection
- [x] Built — JPEG, PNG, and WebP finished output
- [ ] Engine — Native Bayer/X-Trans RAW decoding
- [ ] Engine — Joint demosaicing and denoising
- [ ] Engine — Neural high-ISO denoising model
- [ ] Engine — Camera-body calibration profiles
- [ ] Engine — Measured camera/lens module database
- [ ] Engine — Lens-specific edge sharpness maps
- [ ] Engine — Optical softening compensation by aperture
- [ ] Engine — Moiré, false-color, dead-pixel, and hot-pixel repair
- [ ] Engine — Sensor dust mapping
- [ ] Engine — Linear DNG and 16-bit TIFF generation
- [ ] Engine — Batch queue with background workers
- [ ] Engine — GPU/WebGPU tiled RAW processing
- [ ] Engine — EXIF-driven camera/lens auto selection

## LibreFX — creative collection

- [x] Built — Dedicated Creative mode inside Optics Studio
- [x] Built — Stackable, non-destructive creative settings
- [x] Built — Recipe browser with color-coded families
- [x] Built — Color Lift, Silver Study, Soft Focus, HDR Drama, Vintage Lens, and Night Detail recipes
- [x] Built — Balanced creative auto edit
- [x] Built — Color intensity, tonal contrast, structure, and atmosphere controls
- [x] Built — Soft bloom and halation
- [x] Built — Chromatic channel shift and glass distortion
- [x] Built — Paper texture and light leaks
- [x] Built — Highlight/shadow recovery action
- [x] Built — Portrait detail and landscape depth actions
- [x] Built — Color-to-monochrome conversion
- [x] Built — Split-tone color grading
- [x] Built — Grain, vignette, clarity, and texture stacking
- [x] Built — Creative effects included in browser export
- [ ] Engine — Click-to-select semantic AI masks
- [ ] Engine — Subject, sky, people, object, and depth masks
- [ ] Engine — Luminosity-range and color-range masks
- [ ] Engine — Elliptical and polygonal control-point masks
- [ ] Engine — Mask feathering and visual overlay editor
- [ ] Engine — Per-effect editable mask stack
- [ ] Engine — True multi-exposure 32-bit HDR merge
- [ ] Engine — Ghost removal and HDR alignment
- [ ] Engine — Selective denoise profiles
- [ ] Engine — Capture pre-sharpening and output-sharpening stages
- [ ] Engine — Paper/glass texture asset library
- [ ] Engine — User recipe folders, favorites, search, and import/export
- [ ] Engine — Hover-preview thumbnails generated from the active photo
- [ ] Engine — Blend modes and reorderable effect stack
- [ ] Engine — Snapshot comparison of multiple variations

## LibreFilm — analog rendering and photographic history

- [x] Built — Dedicated Film mode inside Optics Studio
- [x] Built — Original color and monochrome rendering browser
- [x] Built — Era labels for browsing
- [x] Built — Eight original film looks: Daylight 64, Chrome 100, Portrait 160, Press 400, Cinema 500, Instant Warm, Noir 3200, and Modern Neutral
- [x] Built — Adjustable film intensity
- [x] Built — Film-response contrast and saturation blending
- [x] Built — Grain amount, size, and roughness
- [x] Built — Fade, age, and halation controls
- [x] Built — Paper texture, light leak, and print vignette controls
- [x] Built — Classic monochrome, split toning, aged print, and light-struck actions
- [x] Built — Preview overlays for grain, halation, aging, glass, and texture
- [x] Built — Film effects included in browser export
- [ ] Engine — Spectrally measured historical film response profiles
- [ ] Engine — Camera-profile-to-film color transforms
- [ ] Engine — Per-stock scanned grain samples and output-resolution scaling
- [ ] Engine — Scanned-film optimization and negative inversion
- [ ] Engine — Monochrome channel mixer and darkroom filter colors
- [ ] Engine — Paper-grade simulation
- [ ] Engine — Film history timeline with licensed reference photography
- [ ] Engine — Interactive era/time-travel browser
- [ ] Engine — High-resolution frame, scratch, dust, and texture library
- [ ] Engine — User-created film profiles and look export

## Shared workflow

- [x] Built — One Optics tab with Pure, Creative, and Film sub-tabs
- [x] Built — Shift+1, Shift+2, Shift+3 mode shortcuts
- [x] Built — Per-photo settings saved locally in IndexedDB
- [x] Built — Undo/redo and copy/paste complete settings
- [x] Built — Before/after comparison and filmstrip navigation
- [x] Built — Export keeps the original untouched
- [x] Built — Agent-accessible workspace and mode switching
- [ ] Engine — Named processing queue with pause/resume/cancel
- [ ] Engine — Side-by-side multi-variation compare
- [ ] Engine — GPU memory budgeting for very large RAW files
- [ ] Engine — Installable offline model/profile packs

## Reference baseline

Capability coverage was mapped against the official DxO product pages and user guides for Nik Collection 9, PureRAW 6, and FilmPack 8 as viewed on September 10, 2026. LibreLux does not use DxO names for presets, copy proprietary profiles, or claim laboratory-calibrated equivalence.

