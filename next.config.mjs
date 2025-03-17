/** @type {import('next').NextConfig} */
const nextConfig = {
    // Base configuration both platforms will use
    reactStrictMode: true,
  
    // Conditionally apply the standalone output setting only during Cloudflare builds
    ...(process.env.CF_PAGES === "1" ? { output: 'standalone' } : {}),
  
    // Configure image handling
    images: {
      domains: [
        'www.fpmetricslogger.us',
        'rrpdr8h3k6yjiur0.public.blob.vercel-storage.com'
      ],
    },
  };
  
  export default nextConfig;