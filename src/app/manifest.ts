import type { MetadataRoute } from "next";

// Installed via Safari "Add to Home Screen" (iPhone) or the browser install prompt (Laptop).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pulse — Daily Tasks & Budget",
    short_name: "Pulse",
    description: "Daily task & expense tracker",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F2F2F7",
    theme_color: "#F2F2F7",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
