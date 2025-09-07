/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        unoptimized: true,
        domains: ['media.graphassets.com', 'lh3.googleusercontent.com', 'res.cloudinary.com']
    },
    experimental: {
        // Enable for server components compatibility
        serverComponentsExternalPackages: ['mongoose', 'mongodb']
    },
    // Add headers to prevent caching of API routes in production
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate, max-age=0'
                    },
                    {
                        key: 'Pragma',
                        value: 'no-cache'
                    },
                    {
                        key: 'Expires',
                        value: '0'
                    }
                ]
            }
        ]
    },
    webpack: (config, { isServer }) => {
        // Fix for socket.io client in SSR
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                net: false,
                dns: false,
                tls: false,
                fs: false,
            }
        }
        return config
    }
};

export default nextConfig;
