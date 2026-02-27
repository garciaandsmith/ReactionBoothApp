/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Vercel's nft only traces JS require() calls — raw ELF binaries are
    // never auto-included. This explicitly adds the ffmpeg-static binary to
    // the Lambda package for all API routes.
    outputFileTracingIncludes: {
      "/api/**": ["./node_modules/ffmpeg-static/**/*"],
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
