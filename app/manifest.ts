import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LibreLux",
    short_name: "LibreLux",
    description: "Local-first photo workflow by Good Tools",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d0c",
    theme_color: "#35c5ad",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
