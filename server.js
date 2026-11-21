const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------- الإعدادات ----------
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 6) {
  console.error('خطأ: لازم تضيف متغير ADMIN_PASSWORD (6 حروف أو أكتر) في إعدادات ريلواي.');
  process.exit(1);
}
const SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update('market:' + ADMIN_PASSWORD).digest('hex');

// مكان حفظ البيانات: يفضل يكون Volume في ريلواي عشان البيانات ما تضيعش
const DATA_DIR = path.resolve(
  process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data')
);
const UPLOADS = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'store.json');
fs.mkdirSync(UPLOADS, { recursive: true });

// ---------- البيانات ----------
const rid = () => 'p' + crypto.randomBytes(5).toString('hex');
const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const num = (v, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) && x >= 0 ? Math.round(x * 100) / 100 : d;
};

const DEFAULT_UNITS = ['كيلو', 'قطعة', 'لتر', 'علبة', 'كيس', 'زجاجة', 'رغيف', 'بيضة', 'حزمة', 'دستة'];
const DEFAULT_WUNITS = ['كرتونة', 'شيكارة', 'دستة', 'صندوق', 'جوال', 'طبق'];
const BADGES = ['hot', 'new', 'offer'];
function cleanList(arr, def, used) {
  const l = (Array.isArray(arr) && arr.length ? arr : def).map((x) => str(x, 14)).filter(Boolean);
  used.forEach((x) => { if (x && !l.includes(x)) l.push(x); });
  return [...new Set(l)].slice(0, 50);
}
function clean(b) {
  b = b && typeof b === 'object' ? b : {};
  const zones = (Array.isArray(b.zones) ? b.zones : [])
    .slice(0, 50)
    .map((z) => ({ n: str(z && z.n, 40), f: num(z && z.f) }))
    .filter((z) => z.n);

  const seen = new Set();
  const uniqueId = (raw) => {
    let id = str(raw, 40).replace(/[^\w-]/g, '');
    while (!id || seen.has(id)) id = rid();
    seen.add(id);
    return id;
  };
  const img = (v) => (/^[a-f0-9]{16,32}\.jpg$/.test(v || '') ? v : '');

  // كل منتج نوعه: k = 'r' (قطاعي) أو 'w' (جملة)
  const products = [];
  (Array.isArray(b.products) ? b.products : []).slice(0, 1500).forEach((p) => {
    p = p || {};
    const n = str(p.n, 120);
    if (!n) return;
    const common = { n, c: str(p.c, 40), d: str(p.d, 400), a: !!p.a, i: img(p.i), o: num(p.o), b: BADGES.includes(p.b) ? p.b : '' };
    const pp = num(p.p);
    const ww = num(p.w);
    const retail = (id) => ({ id: uniqueId(id), k: 'r', ...common, p: pp, u: str(p.u, 14) || 'قطعة', w: 0, pp: 0, wu: 'كرتونة', wm: 1 });
    const whole = (id) => ({
      id: uniqueId(id), k: 'w', ...common, p: 0, u: 'قطعة',
      w: ww, pp: num(p.pp), wu: str(p.wu, 14) || 'كرتونة', wm: 1,
    });
    if (p.k === 'w') products.push(whole(p.id));
    else if (p.k === 'r') products.push(retail(p.id));
    else if (ww > 0 && pp > 0) {
      // بيانات قديمة: المنتج كان قطاعي وجملة مع بعض، فنفصله لمنتجين
      products.push(retail(p.id));
      products.push(whole(str(p.id, 34) + '_w'));
    } else if (ww > 0) products.push(whole(p.id));
    else products.push(retail(p.id));
  });

  // أقسام المنتجات (مشروبات، عصائر، ...)
  let cats = (Array.isArray(b.cats) ? b.cats : []).map((c) => str(c, 40)).filter(Boolean);
  products.forEach((p) => {
    if (p.c && !cats.includes(p.c)) cats.push(p.c);
  });
  cats = [...new Set(cats)].slice(0, 100);

  const units = cleanList(b.units, DEFAULT_UNITS, products.filter((p) => p.k === 'r').map((p) => p.u));
  const wunits = cleanList(b.wunits, DEFAULT_WUNITS, products.filter((p) => p.k === 'w').map((p) => p.wu));

  return {
    name: str(b.name, 60) || 'الماركت',
    wa: str(b.wa, 20).replace(/\D/g, ''),
    tel: str(b.tel, 20).replace(/[^\d+]/g, ''),
    fee: num(b.fee, 10),
    free: num(b.free),
    zones: zones.length ? zones : [{ n: 'البلد', f: 10 }],
    notice: str(b.notice, 200),
    hours: str(b.hours, 80),
    theme: Math.min(5, Math.floor(num(b.theme))),
    cats,
    units,
    wunits,
    products,
  };
}

function load() {
  try {
    return clean(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
  } catch (e) {
    const seed = clean(JSON.parse(fs.readFileSync(path.join(__dirname, 'default-store.json'), 'utf8')));
    save(seed);
    return seed;
  }
}
function save(data) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, DB_FILE); // حفظ آمن: لو السيرفر وقف في النص الملف القديم يفضل سليم
}
let store = load();

// ---------- تسجيل الدخول ----------
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const hmac = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
const DAY = 24 * 60 * 60 * 1000;

function makeToken() {
  const exp = String(Date.now() + 14 * DAY);
  return exp + '.' + hmac(exp);
}
function validToken(tok) {
  if (!tok) return false;
  const [exp, sig] = tok.split('.');
  if (!sig || !/^\d+$/.test(exp) || Date.now() > Number(exp)) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(hmac(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const getCookie = (req) => {
  const m = /(?:^|;\s*)adm=([^;]+)/.exec(req.headers.cookie || '');
  return m && m[1];
};
const requireAdmin = (req, res, next) =>
  validToken(getCookie(req)) ? next() : res.status(401).json({ error: 'unauthorized' });

// حماية من تخمين كلمة السر: 8 محاولات كل 15 دقيقة لكل جهاز
const attempts = new Map();
function tooMany(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now - a.t > 15 * 60 * 1000) {
    attempts.set(ip, { n: 0, t: now });
    return false;
  }
  return a.n >= 8;
}
setInterval(() => attempts.clear(), 60 * 60 * 1000).unref();

// ---------- السيرفر ----------
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  if (req.path.startsWith('/admin') || req.path.startsWith('/api/admin')) {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('Cache-Control', 'no-store');
  }
  next();
});

app.get('/health', (req, res) => res.send('ok'));

// بيانات المتجر (عامة)
app.get('/api/store', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(store);
});

app.post('/api/admin/login', express.json({ limit: '10kb' }), (req, res) => {
  const ip = req.ip;
  if (tooMany(ip)) return res.status(429).json({ error: 'too_many' });
  const ok = crypto.timingSafeEqual(sha((req.body && req.body.password) || ''), sha(ADMIN_PASSWORD));
  if (!ok) {
    attempts.get(ip).n++;
    return res.status(401).json({ error: 'bad_password' });
  }
  attempts.delete(ip);
  res.cookie('adm', makeToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: 14 * DAY,
    path: '/',
  });
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('adm', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true }));

app.put('/api/admin/store', requireAdmin, express.json({ limit: '1mb' }), (req, res) => {
  store = clean(req.body);
  save(store);
  res.json(store);
});

app.post(
  '/api/admin/upload',
  requireAdmin,
  express.raw({ type: 'image/*', limit: '3mb' }),
  (req, res) => {
    const b = req.body;
    const isJpeg = Buffer.isBuffer(b) && b.length > 100 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    if (!isJpeg) return res.status(400).json({ error: 'bad_image' });
    const id = crypto.randomBytes(12).toString('hex') + '.jpg';
    fs.writeFileSync(path.join(UPLOADS, id), b);
    res.json({ id });
  }
);

app.get('/api/admin/backup', requireAdmin, (req, res) => {
  res.set('Content-Disposition', 'attachment; filename="market-backup.json"');
  res.json(store);
});

// ملف تثبيت التطبيق (PWA): الاسم واللون بيتغيروا مع إعدادات المتجر
const THEME_COLORS = [
  { pr: '#0f6b5c', bg: '#f4efe4' },
  { pr: '#8a2346', bg: '#f7f0ea' },
  { pr: '#155b6e', bg: '#f2eee7' },
  { pr: '#5c6b2a', bg: '#f4efe0' },
  { pr: '#52306b', bg: '#f6f1f3' },
  { pr: '#1d3f9e', bg: '#f3f5fb' },
];
app.get('/manifest.webmanifest', (req, res) => {
  const t = THEME_COLORS[store.theme] || THEME_COLORS[0];
  res.set('Content-Type', 'application/manifest+json; charset=utf-8');
  res.set('Cache-Control', 'no-cache');
  res.json({
    id: '/',
    name: store.name,
    short_name: store.name.slice(0, 12),
    description: 'اطلب من الماركت وهنوصلك لحد البيت',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: t.bg,
    theme_color: t.bg,
    categories: ['shopping', 'food'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  });
});

app.use('/uploads', express.static(UPLOADS, { maxAge: '30d', immutable: true, index: false }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'too_large' });
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

app.listen(PORT, () => {
  console.log('الماركت شغال على البورت ' + PORT);
  console.log('مكان حفظ البيانات: ' + DATA_DIR);
});
