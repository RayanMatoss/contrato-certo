/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Otimizar carregamento de chunks no cliente
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Separar providers em chunk próprio
            providers: {
              name: 'providers',
              test: /[\\/]node_modules[\\/](@tanstack|react-query)[\\/]/,
              priority: 20,
            },
            // Separar UI components
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]ui[\\/]/,
              priority: 10,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;

