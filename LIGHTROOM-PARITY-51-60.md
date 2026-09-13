# LibreLux open ecosystem pass: 51–60

These ten items extend the completed Lightroom-depth pass with portable, inspectable workflows. “Ready” means the workflow is implemented locally and covered by release QA. “Web-safe” identifies an honest browser capability boundary.

| # | Capability | Status | Acceptance evidence |
|---:|---|---|---|
| 51 | Encrypted device-to-device catalog sync | Ready | PBKDF2-derived AES-256-GCM transfer, authenticated import, newer-edit merge, no cloud account |
| 52 | Signed open profile marketplace | Ready | P-256 signature verification before camera, lens, effect, or metadata packages are persisted |
| 53 | Reproducible edit recipes | Ready | Process version, adjustments, masks, effects, and SHA-256 integrity digest export and verified import |
| 54 | Visual edit-difference maps | Ready | Latest version-to-current numeric deltas ranked and visualized by magnitude and direction |
| 55 | LibreLayer round trips | Ready | Layered PSD plus companion manifest retains RAW information, process version, adjustments, and masks |
| 56 | Downloadable offline models | Web-safe | Restore and semantic-mask packs install to browser storage and run locally through WebGPU/WASM |
| 57 | WebGPU diagnostics and quality tuning | Ready | GPU, memory, and CPU signals produce bounded preview, worker, and tile plans that persist locally |
| 58 | Open plug-in API | Ready | Permission-scoped manifests validate and apply non-destructive RAW, effect, and metadata hooks |
| 59 | Portable external-drive catalogs | Web-safe | Persistent directory handle writes a complete catalog plus portable manifest; Chrome/Edge provide folder access |
| 60 | Automated catalog health reports | Ready | Missing originals, previews, stale mask data, and overdue backups are reported and exportable |

## Privacy and browser boundaries

Sync files are encrypted before leaving LibreLux and contain edits, metadata, masks, and albums—not original image pixels. External-drive access is always user-chosen and revocable. Offline models stay local after download. Safari and Firefox do not currently expose the same writable-folder API as Chrome and Edge, so LibreLux presents a clear compatibility message instead of pretending the write succeeded.
