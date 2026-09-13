# LibreLux Lightroom-depth pass: 1–50

This is the release acceptance map for the September 2026 Lightroom parity pass. “Ready” means the workflow is implemented locally and covered by the release QA surface. “Web-safe” means the browser implementation is complete, with an explicit capability boundary where desktop software can directly control hardware or continue work after the browser is fully closed.

| # | Capability | Status | Acceptance evidence |
|---:|---|---|---|
| 1 | Fine landscape masks | Ready | Seven individually selectable landscape categories |
| 2 | Per-mask edge expansion/contraction | Ready | Non-destructive alpha morphology plus feather |
| 3 | Fine face/body masks | Ready | Facial skin, body skin, brows, sclera, lips, facial hair |
| 4 | Mask invalidation after source edits | Ready | Edit fingerprint and visible stale state |
| 5 | Update all masks | Ready | Asynchronous batch refresh from base masks |
| 6 | Crop outside opacity | Ready | Persistent adjustable overlay |
| 7 | Render to DNG | Ready | Dedicated 16-bit DNG action |
| 8 | Catalog and Camera Raw sidecars | Ready | Separate LibreLux and `crs:` XMP import/export |
| 9 | Custom color labels | Ready | Persistent names and colors used throughout the UI |
| 10 | Versions | Ready | Named, renameable, previewable, restorable variations |
| 11 | Face-by-face culling | Ready | Per-face sharpness scores when FaceDetector is available |
| 12 | Multi-factor culling | Ready | Subject, exposure, blur, duplicate, and face inputs |
| 13 | Shallow-depth-aware culling | Ready | Optional depth-of-field protection |
| 14 | Culling strictness | Ready | Independent focus and exposure controls |
| 15 | Explainable culling | Ready | Score, decision, and human-readable reasons |
| 16 | Batch culling actions | Ready | Picks and rejects applied to the active selection |
| 17 | Visual auto-stacking | Ready | Capture-time plus perceptual-hash grouping |
| 18 | Strongest stack cover | Ready | Best explainable-cull score is marked as cover |
| 19 | Calendar navigation | Ready | Local capture-month navigation |
| 20 | Catalog merge/import | Ready | Integrity-checked catalog imports merge with current work |
| 21 | Disconnected-drive recovery | Ready | Smart previews, missing-original state, relink and folder scan |
| 22 | Filename/metadata/import templates | Ready | Persistent import recipe, export naming, metadata template |
| 23 | Nested smart albums | Ready | Recursive AND/OR rule engine and nested-select collection |
| 24 | Keyword hierarchy/synonyms/sets | Ready | Hierarchical and synonym notation with reusable suggestions |
| 25 | Reflection removal quality | Ready | Local reflection separation in preview and full export |
| 26 | Reflection isolate/suppress | Ready | Continuous -100 to +100 control |
| 27 | Reviewable dust detection | Ready | Up to 24 spaced candidates become individual remove spots |
| 28 | Background-person removal | Ready | Person/object masks feed the local remove workflow |
| 29 | Removal variations/refill | Ready | Three deterministic source variations per removal |
| 30 | Panorama-aware expansion | Ready | Panorama merge plus edge synthesis control |
| 31 | Lens Blur depth/focus/bokeh | Ready | Subject depth estimate, focus plane, character, highlights |
| 32 | Highlight recovery comparison | Ready | Live before/after modes and reconstruction control |
| 33 | Dual-gain/computational RAW | Ready | RAW-only dual-gain tuned recovery recipe |
| 34 | Camera/ISO noise models | Ready | Camera metadata plus ISO-adaptive luminance/chroma cleanup |
| 35 | Local moiré/false-color brush | Ready | Moiré correction is available inside every mask |
| 36 | Camera profile provenance | Ready | Version, origin, and match confidence shown per profile |
| 37 | HDR calibration/SDR fallback | Ready | Scene-wide HDR controls, proof spaces, SDR display fallback |
| 38 | ISO-adaptive presets | Ready | One-click strength derived from capture ISO |
| 39 | Tethered live view | Web-safe | Media Capture live view and full-resolution frame capture |
| 40 | Remote camera controls | Web-safe | Exposure, WB, focus, zoom shown only when device exposes them |
| 41 | Shot/session segmentation | Ready | Time-and-similarity stacks identify sessions/bursts |
| 42 | Watched folders after reopen | Web-safe | Persisted directory handle, permission recovery, timed scans |
| 43 | Refresh-safe export queue | Web-safe | Job state survives reload and resumes on return; browsers may suspend after full close |
| 44 | Export collision/resume/verify | Ready | Collision-free naming, retry center, byte-size verification |
| 45 | Color-managed print handoff | Web-safe | Profile conversion, soft proofing, print CSS; OS owns printer calibration |
| 46 | Print workspace | Ready | Paged proof view with printer-safe CSS and Save as PDF path |
| 47 | Photo books/PDF | Ready | Paginated book layout with print-ready page rules |
| 48 | Slideshows | Ready | Captions, timed transitions, navigation, optional music, standalone export |
| 49 | Responsive web galleries | Ready | Self-contained responsive private gallery and Web Share handoff |
| 50 | Publish-service plugins | Ready | Persistent HTTPS JSON adapters, consent gate, batch publishing |

## Browser boundaries

LibreLux stays a web app. Browser security intentionally prevents universal USB/PTP camera control, silent printer/monitor calibration, and guaranteed computation after every browser window is closed. LibreLux detects these capabilities, exposes only controls that work, persists recoverable state, and hands device-owned operations to the operating system rather than pretending they succeeded.
