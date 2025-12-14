import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Configurações para melhor compatibilidade com Vercel
  typescript: {
    // Ignorar erros de TypeScript durante o build (descomente se necessário)
    // ignoreBuildErrors: false,
  },
  // Configuração para otimização de imagens
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
