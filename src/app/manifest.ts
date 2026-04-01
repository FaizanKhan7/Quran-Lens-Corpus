import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quran Lens",
    short_name: "Quran Lens",
    description:
      "A modern linguistic exploration platform for the Quran — word-by-word morphology, root analysis, and syntactic treebank.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1565C0",
    categories: ["education", "reference"],
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Search",
        short_name: "Search",
        description: "Search the Quran corpus",
        url: "/search",
      },
      {
        name: "Browse Surahs",
        short_name: "Browse",
        description: "Browse all 114 surahs",
        url: "/surah",
      },
      {
        name: "Ontology",
        short_name: "Ontology",
        description: "Explore Quranic concepts",
        url: "/ontology",
      },
    ],
    screenshots: [],
  };
}
