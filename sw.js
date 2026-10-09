// İnternetsiz çalışma: ilk açılıştan sonra oyun (kod, 3D kütüphanesi, gömülü sesler) cihazda saklanır.
// Dosya eklenirse CORE listesine ekle; önemli değişiklikte CACHE sürümünü artır.
const CACHE = 'feza-aytug-hala-v1';
const SRC = ['00_i18n', '00_core', '01_textures', '02_audio', '03_fx', '04_feza', '04_bilbo', '04_bilbo_follow', '04_hala', '05_enemies', '05a_huysuz_kayit',
  '05h_huysuzlar', '05b_bosslar', '06a_bolum_kayit', '06z_oturma', '06z_mutfak', '06z_buzdolabi', '06z_pasta', '06_level', '07_game', '08_skills', '10_story', '09_ui'];
const CORE = ['./', './index.html', './vendor/three.js', './sesler.js', './bilbo-ses.js', './assets/audio/bilbo-hav-hav.mp3', './manifest.webmanifest', './src/ui.css',
  ...SRC.map(n => './src/' + n + '.js')];
const ICONS = ['./icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];   // optional: a missing icon must not stop the install
const FRESH = /(\/|index\.html)$/;   // sayfa önce ağ, diğer dosyalar önce önbellek

self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await c.addAll(CORE);
  for (const u of ICONS) { try { await c.add(u); } catch (e) {} }
  self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  // SADECE bu oyunun eski sürümleri: diğer Feza oyunları aynı sitede (goktugkarpat.github.io) kendi önbellekleriyle durur.
  const OWN = k => k.startsWith('feza-aytug-hala-');
  for (const k of await caches.keys()) if (OWN(k) && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const fresh = req.mode === 'navigate' || FRESH.test(url.pathname);
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? './index.html' : req;
    if (fresh) {
      try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok) c.put(key, r.clone()); return r; }
      catch (err) { return (await c.match(key, { ignoreSearch: true })) || (await c.match('./index.html')) || Response.error(); }
    }
    const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit;
    const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r;
  })());
});
