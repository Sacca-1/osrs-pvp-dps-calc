/** @type {import('next').NextConfig} */
const {execSync} = require("node:child_process");

let gitSha = undefined,
  gitShaShort = "unknown",
  gitDirty = "false";
try {
  gitSha = execSync("git rev-parse HEAD", { windowsHide: true }).toString().trim();
  gitShaShort = execSync("git rev-parse --short HEAD", { windowsHide: true }).toString().trim();
  gitDirty = execSync("git status --untracked-files=no --porcelain", { windowsHide: true }).toString().trim();
  if (gitDirty !== "") {
    gitDirty = "true";
  }
} catch (e) {
  console.warn(`No git data available, building without`);
}

const shouldAnalyse = process.env.ANALYSE === 'true';

const isProd = process.env.NODE_ENV === 'production';

let nextConfig = {
  ...(isProd && process.env.NEXT_PUBLIC_BASE_PATH ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH } : {}),
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['runescape.wiki', 'oldschool.runescape.wiki'],
  },
  transpilePackages: [
    'd3',
    'd3-array',
    'internmap'
  ],
  env: {
    GIT_SHA: gitSha,
    GIT_SHA_SHORT: gitShaShort,
    GIT_DIRTY: gitDirty,
  },
  async redirects() {
    if (isProd && process.env.NEXT_PUBLIC_BASE_PATH) {
      return [
        {
          source: '/',
          destination: process.env.NEXT_PUBLIC_BASE_PATH,
          basePath: false,
          permanent: true
        }
      ]
    } else {
      return [];
    }
  },
  eslint: {
    // Skip lint errors during builds so the prototype can deploy even while polishing code
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type errors during builds for smoother prototyping
    ignoreBuildErrors: true,
  },
}

if (shouldAnalyse) {
  const withNextBundleAnalyzer = require('@next/bundle-analyzer')();
  nextConfig = withNextBundleAnalyzer(nextConfig);
}

module.exports = nextConfig
