# SunuPermis — PWA Roadmap

## Current state: Phase 1 complete

The app is installable as a standalone mobile app on Android (Chrome) and iOS (Safari Add to Home Screen). No sensitive data is cached.

---

## Phase 1 — Installable app shell ✅ (current)

**What is done:**
- `app/manifest.ts` — web app manifest with name, icons, theme color, `display: standalone`, `orientation: portrait`
- `public/icons/icon-192.png`, `icon-512.png` — placeholder solid-navy icons (replace with branded artwork before v1 launch)
- `app/layout.tsx` — `applicationName`, `appleWebApp`, `viewport`, `themeColor` metadata
- `public/sw.js` — service worker: pre-caches `/offline`, cache-first for `/_next/static/*` assets, network-only for all authenticated routes
- `components/pwa/ServiceWorkerRegistration.tsx` — registers SW in production only (does not interfere with Next.js HMR)
- `components/pwa/InstallPrompt.tsx` — install banner in student area, uses `beforeinstallprompt` API, hides when already installed or dismissed
- `app/offline/page.tsx` — offline fallback with retry CTA

**What is intentionally NOT cached (security boundaries):**
- `/student/*`, `/dashboard/*`, `/admin/*` — all authenticated pages
- `/api/*` — server actions and API routes
- `/auth/*` — login, logout, OAuth callbacks
- `*.supabase.co` — database queries, storage bucket (medical documents)
- Any student personal data

---

## Phase 2 — Offline question packs (future)

**Goal:** Students can practice mock exams without internet.

**Implementation plan:**
1. Add a "Télécharger pour hors ligne" button in `/student/learning`
2. When tapped, fetch the active question bank (`exam_questions_public` view) and store in IndexedDB via `idb-keyval` or native IndexedDB
3. Extend `sw.js` to serve cached questions when offline
4. The mock exam engine (`ExamSession.tsx`) already works with a question array — wire it to IndexedDB when offline
5. Audit log and result sync on reconnect

**Security notes for Phase 2:**
- Cache ONLY the `exam_questions_public` view columns (`id`, `question_text`, `options`, `category`, `difficulty`, `learning_tip`)
- `correct_answer` and `explanation` must NEVER be cached client-side (they are server-side only in `checkAnswer`)
- Practice mode feedback is served via server actions and must not be cached

---

## Phase 3 — Offline attempt sync (future)

**Goal:** Student can complete a practice exam offline and sync results when reconnected.

**Implementation plan:**
1. On exam submit while offline, store the attempt in IndexedDB with `status: 'pending_sync'`
2. Use the Background Sync API (`SyncManager`) to register a sync event
3. When connectivity returns, the SW reads pending attempts from IndexedDB and POSTs them to `/api/sync-exam-result`
4. Server action validates and writes to `mock_exams` and `mock_exam_answers` tables

**Complexity notes:**
- Replay attacks: include idempotency key per attempt
- Result calculation must happen server-side (correct answers never leave server)
- Conflict resolution: if the same exam was somehow submitted twice, take the first

---

## Phase 4 — Native wrapper (conditional)

**If needed:** Wrap with [Capacitor](https://capacitorjs.com/) for distribution in App Store / Play Store.

**Trigger conditions:**
- Push notifications required beyond web push (iOS restrictions)
- Biometric authentication (Face ID / fingerprint for exam integrity)
- Government digital ID integration requiring native SDK

**Steps:**
1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init SunuPermis com.sunupermis.app`
3. Build Next.js as static export (`output: 'export'` in `next.config.ts`) — requires removing server-only features or switching to a hybrid approach
4. `npx cap add ios && npx cap add android`
5. Replace Supabase auth with Capacitor's secure storage for tokens
6. Submit to stores

**Note:** Capacitor requires a static export or a separate mobile API. Evaluate before starting — the PWA install path (Phase 1) should be tried first and covers most use cases.

---

## Icon replacement checklist

The current icons are solid-navy placeholders. Before public launch:

- [ ] Design branded icon: "SP" monogram or driving/wheel motif on `#131140` background
- [ ] Export `icon-192.png` (192×192 px, PNG)
- [ ] Export `icon-512.png` (512×512 px, PNG) — ensure safe zone (center 80%) contains all content for maskable compatibility
- [ ] Optionally add `icon.svg` for browsers that support SVG favicons
- [ ] Add `apple-touch-icon.png` (180×180) for iOS precision
- [ ] Update `app/manifest.ts` if paths or sizes change
