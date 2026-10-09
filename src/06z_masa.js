/* ── Merkez: Aytuğ Hala'nın Mutfak Masası (yer tutucu) ──
   Oyun buradan başlar (bölge 0). Masanın üstünde: odalara giden kapılar, ortada büyüyen pasta (CAKE), Gardırop, Bilbo'nun Köşesi,
   Çıkartma Albümü, Mini Oyun Köşesi. Etkileşim noktaları L.stations'a yazılır; Feza içine girince GAME 'station' yayar,
   UI kapılarda bölüme götürür, diğerlerinde HUB.open(id, station) çağırır.
   Genel adlar: CAKE, HUB. Merkez ajanı bu dosyayı serbestçe yeniden yazar (kancalar: src/SPEC.md › "Dev Ev API" › Merkez). */
const CAKE = (() => {
  'use strict';
  const S = { g: null, layers: [], deco: null, stage: 0, spot: null };
  const COL = [0xfff4e4, 0xf6e0b8, 0xffffff, 0xf4a0b8, 0xfff0f6];   // tabak, un/kek, yumurta/krema, çilek, krema
  // kur: LEVEL.build sırasında (masa bölümünün kur()'undan). spot: {x, z}
  function build(api, spot) {
    S.spot = spot; S.layers = [];
    const g = S.g = new THREE.Group(); g.name = 'pasta'; g.position.set(spot.x, 0, spot.z);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.3, 0.2, 40), new THREE.MeshStandardMaterial({ color: COL[0], roughness: 0.3 }));
    plate.position.y = 0.1; g.add(plate);
    for (let i = 0; i < 4; i++) {   // aşama başına bir kat
      const r = 1.8 - i * 0.35, h = 0.7;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), new THREE.MeshStandardMaterial({ color: COL[i + 1], roughness: 0.55 }));
      m.position.y = 0.2 + h / 2 + i * h; m.castShadow = true; m.receiveShadow = true; m.visible = false; g.add(m); S.layers.push(m);
    }
    S.deco = new THREE.Group(); g.add(S.deco);
    api.add(g);   // (bölüm değişince LEVEL.dispose → disposeTree temizler; çarpışma dairesi yerlesim()'de)
    const P = typeof GAME !== 'undefined' && GAME.P;
    setStage(P && GAME.cakeStage ? GAME.cakeStage() : 0);
    if (P && P.pastaSusleri) for (const d of P.pastaSusleri) decorate(d.id, d);
  }
  // n = 0..4: kaç malzeme geldi (kat sayısı)
  function setStage(n) { S.stage = Math.max(0, Math.min(4, n | 0)); S.layers.forEach((m, i) => { m.visible = i < Math.max(1, S.stage); m.scale.y = i < S.stage ? 1 : 0.35; }); }
  // süs: pos = { a: açı (rad), h: 0..1 yükseklik }
  function decorate(itemId, pos = {}) {
    if (!S.deco) return;
    const top = S.layers.filter(m => m.visible).pop(), r = top ? top.geometry.parameters.radiusTop : 1.8;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshStandardMaterial({ color: 0xff5a7a, roughness: 0.3 }));
    const a = pos.a || 0, y = top ? top.position.y + 0.35 * (pos.h ?? 1) : 0.5;
    s.position.set(Math.sin(a) * r * 0.85, y, Math.cos(a) * r * 0.85); s.name = 'sus-' + itemId; S.deco.add(s);
  }
  return { build, setStage, decorate, get stage() { return S.stage; }, _S: S };
})();

const HUB = (() => {
  'use strict';
  const AD = { gardirop: 'Gardırop', bilbo: 'Bilbo’nun Köşesi', album: 'Çıkartma Albümü', mini: 'Mini Oyun Köşesi', pasta: 'Pasta', surpriz: 'Günün Sürprizi' };
  const toast = text => { if (typeof GAME !== 'undefined' && GAME.emit) GAME.emit('toast', { text }); };
  // UI çağırır (Feza bir istasyona girince). Merkez ajanı her biri için kendi ekranını açar.
  function open(id, st) {
    if (id === 'mini' && typeof MINIGAME !== 'undefined') { const ids = MINIGAME.list(); if (ids.length) { MINIGAME.start(ids[0], { from: 'hub' }); return; } }
    if (id === 'surpriz' && typeof GAME !== 'undefined' && GAME.dailySurprise) { toast(GAME.dailySurprise() ? 'Sürpriz kutu açıldı! 🎁' : 'Yarın yeni bir sürpriz var!'); if (st) st._used = true; return; }
    toast((AD[id] || id) + ' (yakında)');
  }
  return { open, AD };
})();

BOLUM.define('masa', {
  ad: 'Aytuğ Hala’nın Mutfak Masası',
  hub: true,                 // merkez: huysuz ve boss yok; oyun burada başlar, bölüm bitince buraya dönülür
  taban: 'bathroom',
  size: 80, rooms: 2, side: 0,
  muzik: 'tuvalet',
  huysuzlar: { tozTavsani: 1 }, elitler: [],   // (üretici bir liste ister; yerlesim() hepsini siler)
  zemin: { tA: 0xe8c79a, tB: 0xdcb886, tC: 0xf4dcb8, out: 0x9a6a44, outAmt: 0.75, macro: 0xfff0dc },   // tahta masa
  isik: { fog: [0xf6e2cc, 40, 96], hemiSky: 0xfff6ea, hemiGround: 0xb08060, sunColor: 0xfff0dc, env: [0xfff0e0, 0xffe6d0, 0xa07858, 0.9] },
  minimap: { zemin: '#e8c79a' },
  harita: { ad: 'Mutfak Masası', detay: 'Aytuğ Hala’nın pastası burada', renk: '#f6c08a', x: 22, y: 70, simge: '🍰' },
  // Etkileşim noktaları (saf veri): büyük oda (rooms[1]) masanın üstü
  yerlesim(L, api) {
    L.spawns.length = 0; L.chests.length = 0;
    const T = L.rooms[1], cx = T.x, cz = T.z;
    L.cakeSpot = { x: cx, z: cz };
    api.solid(cx, cz, 2.3, 'pasta');
    const st = L.stations = [];
    const put = (id, kind, x, z, o) => st.push(Object.assign({ id, kind, x, z, r: 1.5 }, o));
    ['oturma', 'mutfak', 'buzdolabi', 'pasta'].forEach((zid, k) => put('kapi_' + zid, 'kapi', cx - 7.5 + k * 5, cz - 7.5, { zone: zid, r: 1.3 }));
    put('gardirop', 'gardirop', cx - 8.5, cz);
    put('bilbo', 'bilbo', cx + 8.5, cz);
    put('album', 'album', cx - 5.5, cz + 6);
    put('mini', 'mini', cx + 5.5, cz + 6);
    put('surpriz', 'surpriz', cx, cz + 4.2, { r: 1.1 });
    for (const s of st) if (!api.isFloor(s.x, s.z)) { const p = api.randomFloorNear(s.x, s.z, 0, 3); if (p) { s.x = p.x; s.z = p.z; } }
  },
  kur(L, api) {
    api.dreamEdge();
    if (L.cakeSpot) CAKE.build(api, L.cakeSpot);
    const COL = { kapi: 0xffffff, gardirop: 0xb07ad0, bilbo: 0x8a5a3a, album: 0x5aa8e8, mini: 0x5ac88a, surpriz: 0xffc83a };
    const ZC = { oturma: 0x9fb4cf, mutfak: 0xf3d49b, buzdolabi: 0x9fd6ef, pasta: 0xf4a8c4 };
    for (const s of L.stations || []) {
      const c = s.kind === 'kapi' ? ZC[s.zone] || 0xffffff : COL[s.kind] || 0xffffff;
      api.cyl(s.x, 0.04, s.z, s.r, 0.08, c);                                            // yere renkli halka
      if (s.kind === 'kapi') { api.box(s.x, 1.6, s.z - 1.2, 2.2, 3.2, 0.25, c); api.ball(s.x + 0.7, 1.5, s.z - 1.05, 0.12, 0.12, 0.12, 0xf2c44a); }
      else api.box(s.x, 0.7, s.z - 1.1, 1.2, 1.4, 0.6, c);
      api.glow(s.x, s.z, 2.2, c, 0.12);
    }
  },
});
