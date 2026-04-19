import type { NextConfig } from "next";

// Auf GitHub Pages läuft die App unter /FamilyPlanner
// Lokal (npm run dev) kein basePath nötig
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/FamilyPlanner" : "";

const nextConfig: NextConfig = {
  output: "export",          // Statische HTML/CSS/JS — kein Server nötig
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,       // /week → /week/index.html (GitHub Pages friendly)
  images: {
    unoptimized: true,       // Next.js Image Optimization braucht Server
  },
};

export default nextConfig;
