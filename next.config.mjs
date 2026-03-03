/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Vercel's nft only traces JS require() calls — raw ELF binaries are
    // never auto-included. This explicitly adds the ffmpeg-static binary to
    // the Lambda package for the compose route only — the only route that
    // invokes ffmpeg. Including it in "/api/**" would bundle the ~90 MB
    // binary into every API function, bloating the deployment past Vercel's
    // output-size limit and causing "internal error" during deployment.
    outputFileTracingIncludes: {
      "/api/reactions/**/compose": ["./node_modules/ffmpeg-static/**/*"],
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
