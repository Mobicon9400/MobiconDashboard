import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist loads its worker script via a dynamic import relative to its
  // own file on disk; bundling it breaks that lookup ("Setting up fake
  // worker failed: Cannot find module .../pdf.worker.mjs"). Keeping it
  // external makes Next.js `require` it natively from node_modules instead.
  serverExternalPackages: ["pdfjs-dist"],
  // Output file tracing only follows static imports/requires, so it doesn't
  // see pdf.mjs's runtime dynamic import of pdf.worker.mjs and leaves that
  // file out of the deployed function. Force it to be copied in.
  outputFileTracingIncludes: {
    "/api/rechnungen/upload": ["./node_modules/pdfjs-dist/legacy/build/**/*"],
  },
};

export default nextConfig;
