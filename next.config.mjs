/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizations for Mini Apps
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Optimize bundle splitting for Mini Apps
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Group OnchainKit components
        onchainkit: {
          name: 'onchainkit',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]@coinbase[\\/]onchainkit[\\/]/,
          priority: 20,
        },
        // Group other vendor libraries
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
        }
      }
    };
    
    return config;
  },
  
  // Optimize package imports for Mini Apps
  experimental: {
    optimizePackageImports: ['@coinbase/onchainkit'],
    // Improve hydration performance
    optimizeCss: true,
  },
  
  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Improve performance for Mini Apps
  poweredByHeader: false,
  generateEtags: false,
  
  // Optimize for mobile and Mini Apps
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
