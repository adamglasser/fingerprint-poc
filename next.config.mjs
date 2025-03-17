/** @type {import('next').NextConfig} */
const nextConfig = {
    // Base configuration both platforms will use
    reactStrictMode: true,
  
    // Conditionally apply the standalone output setting only during Cloudflare builds
    ...(process.env.CF_PAGES === "1" ? { output: 'standalone' } : {}),
  
    // Configure image handling
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'www.fpmetricslogger.us',
        },
      ],
      // Do not unoptimize in development as it can cause issues
      unoptimized: false,
    },
  };
  
  export default nextConfig;