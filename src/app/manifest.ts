import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Myanmar Reformed Presbyterian School of Theology",
    short_name: "MRPST",
    lang: "my",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#173c55",
    icons: [
      { src: "/mrpst-app-192.png", sizes: "192x192", type: "image/png" },
      { src: "/mrpst-app-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
