/** @type {import('next').NextConfig} */

// En-têtes de sécurité de l'app d'administration (jamais affichée dans une
// autre page, jamais indexée, aucun accès caméra / micro / position).
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Connexion Google en fenêtre : la fenêtre ouverte doit pouvoir répondre
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
]

module.exports = {
  reactStrictMode: true,
  // Pas d'en-tête « X-Powered-By: Next.js » (moins d'indices pour un attaquant)
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
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
