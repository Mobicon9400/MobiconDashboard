import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist loads its worker script via a dynamic import relative to its
  // own file on disk; bundling it breaks that lookup ("Setting up fake
  // worker failed: Cannot find module .../pdf.worker.mjs"). Keeping it
  // external makes Next.js `require` it natively from node_modules instead.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
