/* دليل إدفو — Service Worker */
const CACHE = 'dalil-edfu-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

// التثبيت: خزّن ملفات التطبيق (كل ملف لوحده عشان لو ملف ناقص ميوقفش الباقي)
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(ASSETS.map((u) => c.add(u).catch(() => {})));
  })());
  self.skipWaiting();
});

// التفعيل: امسح الكاش القديم
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// الجلب
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // فتح التطبيق: جرّب الشبكة، ولو مفيش نت ارجع للصفحة المخزّنة
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  // ملفات نفس الموقع: من الكاش الأول، وإلا من الشبكة (مع تخزينها)
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => caches.match('./index.html'))
      )
    );
    return;
  }

  // ملفات خارجية (خطوط / Supabase / CDN): شبكة، وكاش احتياطي لو اتخزّن قبل كده
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});

/* ===== استقبال Push Notifications ===== */
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; }
  catch (_) { data = { title: 'دليل إدفو', body: e.data ? e.data.text() : '' }; }
  const title = data.title || 'دليل إدفو';
  const options = {
    body: data.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: data.url || './' },
    dir: 'rtl',
    lang: 'ar'
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
