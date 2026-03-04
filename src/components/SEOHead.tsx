import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

/**
 * SEOHead — dynamically updates document <head> meta tags for each route.
 * Essential for SPA SEO since we have a single index.html.
 */
export function SEOHead({
  title = "Typesense UI — Open Source Search Engine Dashboard & Admin Panel",
  description = "A modern, open-source visual dashboard for managing Typesense search engine collections with AI-powered queries, real-time search, and beautiful dark mode.",
  keywords = "typesense, typesense ui, search dashboard, typesense admin, open source",
  canonicalPath,
  ogImage = "https://typesense.mothilal.dev/og-image.png",
  ogType = "website",
  noIndex = false,
}: SEOHeadProps) {
  const location = useLocation();
  const baseUrl = "https://typesense.mothilal.dev";
  const canonical = canonicalPath
    ? `${baseUrl}${canonicalPath}`
    : `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update title
    document.title = title;

    // Helper to set or create a meta tag
    const setMeta = (
      attr: "name" | "property",
      key: string,
      content: string
    ) => {
      let el = document.querySelector(
        `meta[${attr}="${key}"]`
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Primary meta
    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Open Graph
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:type", ogType);

    // Twitter
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);
    setMeta("name", "twitter:url", canonical);

    // Canonical link
    let link = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }, [title, description, keywords, canonical, ogImage, ogType, noIndex]);

  return null;
}
