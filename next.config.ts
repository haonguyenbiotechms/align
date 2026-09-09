import type { NextConfig } from 'next'

// Static build for GitHub Pages (project site at /<repo>).
// The localhost version lives on the `main` branch and does NOT use this config.
const repo = 'align'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
