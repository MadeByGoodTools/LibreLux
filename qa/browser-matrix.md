# LibreLux release browser matrix

Automated for every release:

| Surface | Engine | Coverage |
| --- | --- | --- |
| Chrome / Edge on Windows, Linux, and ChromeOS | Chromium | launch, local catalog recovery, live optics preview, keyboard, accessibility |
| Safari on macOS and iPadOS | WebKit | launch, local catalog recovery, keyboard, accessibility |
| Firefox on Windows, macOS, and Linux | Gecko | launch, local catalog recovery, keyboard, accessibility |
| Tablet browser | WebKit and touch Chromium profiles | responsive shell, dialogs, sliders, photo canvas |

Hardware-dependent WebGPU features always have a WebAssembly fallback. Folder picking is capability-detected; ordinary browser downloads remain available when a browser does not expose a writable directory handle.
