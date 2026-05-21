/**
 * SunuPermis Service Worker — Phase 1: App Shell
 *
 * Caching strategy:
 *   - Pre-cache: /offline page only
 *   - Static assets (/_next/static/*): cache-first, runtime caching
 *   - Navigation to authenticated routes: network-only (never cached)
 *   - Supabase API / storage URLs: network-only (never cached)
 *   - Everything else: network-first, fallback to /offline on failure
 *
 * What is intentionally NOT cached:
 *   - /student/*, /dashboard/*, /admin/* — authenticated pages
 *   - /api/* — server actions and API routes
 *   - /auth/* — login, logout, OAuth callbacks
 *   - *.supabase.co — database and storage API calls
 *   - Medical documents and personal data (storage bucket URLs)
 *
 * Phase 2 (future): add offline question packs for /student/learning
 */

const CACHE_VERSION = 'v1'
const SHELL_CACHE   = `sunupermis-shell-${CACHE_VERSION}`
const STATIC_CACHE  = `sunupermis-static-${CACHE_VERSION}`
const OFFLINE_URL   = '/offline'

// Routes that must never be intercepted — pass straight to network
const BYPASS_PREFIXES = [
  '/api/',
  '/auth/',
  '/student/',
  '/dashboard/',
  '/admin/',
]

// External origins that must never be intercepted
const BYPASS_ORIGINS = [
  'supabase.co',
  'supabase.in',
]

// ── Install: pre-cache the offline fallback page ──────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.add(OFFLINE_URL))
  )
  // Activate immediately without waiting for old clients to close
  self.skipWaiting()
})

// ── Activate: remove stale caches ────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: routing logic ──────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Pass through non-same-origin requests except for static assets on CDN
  const isSameOrigin = url.origin === self.location.origin
  if (!isSameOrigin) {
    // Never intercept third-party origins (Supabase, analytics, etc.)
    const isBlockedOrigin = BYPASS_ORIGINS.some((o) => url.hostname.includes(o))
    if (isBlockedOrigin) return
    // Unknown external origin — pass through
    return
  }

  // Never intercept authenticated/sensitive same-origin routes
  const isBypassed = BYPASS_PREFIXES.some((p) => url.pathname.startsWith(p))
  if (isBypassed) return

  // Cache Next.js static assets (hashed bundles, fonts, images)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staticAssetStrategy(request))
    return
  }

  // Navigation requests (HTML pages) — network first, fallback to /offline
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request))
    return
  }

  // Public static files in /public (icons, favicons, manifest)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(staticAssetStrategy(request))
    return
  }

  // Everything else — pass through, no caching
})

// ── Strategies ────────────────────────────────────────────────────────────────

async function staticAssetStrategy(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Static asset unavailable offline — return empty response (browser handles it)
    return new Response('', { status: 503 })
  }
}

async function navigationStrategy(request) {
  try {
    return await fetch(request)
  } catch {
    // Network failed — serve the offline fallback
    const offlinePage = await caches.match(OFFLINE_URL)
    return offlinePage ?? new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}
