/* دليل إدفو — Service Worker */
const CACHE = 'edfu-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // الطلبات لخدمات خارجية (Supabase، الخطوط، الـ CDN) تروح للشبكة مباشرة
  if (url.origin !== location.origin) return;

  // التنقل بين الصفحات: شبكة أولاً، وأوفلاين نرجّع الصفحة المخزّنة
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  // باقي الملفات المحلية: من الكاش لو موجود، وإلا الشبكة
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
