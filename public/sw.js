// Service Worker: بيخلي المتجر يشتغل كتطبيق ويفتح حتى لو النت ضعيف
const V = 'market-v1';
const SHELL = ['/', '/style.css', '/common.js', '/app.js', '/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الأول النت (عشان التحديثات تظهر فورًا)، ولو مفيش نت نعرض آخر نسخة محفوظة
async function networkFirst(req, fallbackUrl) {
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const c = await caches.open(V);
      c.put(req, res.clone());
    }
    return res;
  } catch (err) {
    const hit = (await caches.match(req)) || (fallbackUrl && (await caches.match(fallbackUrl)));
    if (hit) return hit;
    throw err;
  }
}

// الصور ما بتتغيرش (اسمها فريد)، فنعرضها من المحفوظ لو موجودة
async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) {
    const c = await caches.open(V);
    c.put(req, res.clone());
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // لوحة التحكم وبياناتها عمرها ما بتتخزن
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) return;

  if (url.pathname.startsWith('/uploads/')) {
    e.respondWith(cacheFirst(req));
  } else if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, '/'));
  } else {
    e.respondWith(networkFirst(req));
  }
});
