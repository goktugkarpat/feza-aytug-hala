/* ── Bölüm 1: Oturma Odası (yer tutucu) ──
   Bölüm ajanı bu dosyayı serbestçe yeniden yazar. Biçim: src/SPEC.md › "Dev Ev API" › Bölüm kaydı. */
BOLUM.define('oturma', {
  ad: 'Oturma Odası',
  taban: 'bathroom',          // eski zemin/ışık teması (yer tutucu); kendi zeminini kurarsan api.floor.visible = false
  size: 90, rooms: 6, side: 2,
  muzik: 'orman',
  malzeme: 'un', kayipEsya: 'gozluk',
  isik: { fog: [0xc9d3dc, 34, 84], hemiSky: 0xf4f6ff, hemiGround: 0x8a8f9a, sunColor: 0xfff0dc, env: [0xd8e2ee, 0xf2e8dc, 0x8a8f9a, 0.9] },
  zemin: { tA: 0xe6d2b4, tB: 0xd8c09c, tC: 0xf0e2c8, out: 0x7d8796, outAmt: 0.7, macro: 0xfff4e4 },   // meşe parke tonu; dışarısı gri-mavi
  minimap: { zemin: '#c9b48e' },
  harita: { ad: 'Oturma Odası', detay: 'Dev halı ormanı ve kitap kuleleri', renk: '#9fb4cf', x: 22, y: 34, simge: '🛋️' },
  kur(L, api) { BOLUM.yerTutucu(L, api, { kutu: [0x8fa3b8, 0xd8c9b0, 0x6f7f90, 0xe9e0cf], kapi: 0xf4efe6 }); },
});
