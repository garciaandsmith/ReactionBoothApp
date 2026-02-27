/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent webpack from bundling ffmpeg-static so that __dirname inside the
  // package resolves to its real node_modules location (not the bundle output
  // directory), and Vercel's output-file-tracing can find the binary.
  serverExternalPackages: ["ffmpeg-static"],
  experimental: {
    // Explicitly include the ffmpeg binary in the Vercel Lambda for the
    // compose route — nft only traces JS require() calls, not raw binaries.
    outputFileTracingIncludes: {
      "/api/reactions/[id]/compose": ["./node_modules/ffmpeg-static/**/*"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        // Vercel Blob Storage — for uploaded thumbnails and assets
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
