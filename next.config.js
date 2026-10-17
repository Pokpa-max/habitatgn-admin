/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Racine du projet (évite que Next remonte à un package-lock.json parent)
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'img.freepik.com' },
    ],
  },
}
