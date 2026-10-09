/* ── Bölüm 2: Mutfak (yer tutucu) ──
   Bölüm ajanı bu dosyayı serbestçe yeniden yazar. Biçim: src/SPEC.md › "Dev Ev API" › Bölüm kaydı. */
BOLUM.define('mutfak', {
  ad: 'Mutfak',
  taban: 'bathroom',
  size: 90, side: 2,
  areas: BOLUM.UC_ALAN('Tezgâh Tepeleri', 'Lavabo Gölü', 'Un Dağları'),   // 3 alt alan (her biri 2 oda) + boss arenası
  muzik: 'kefir',
  malzeme: 'yumurta', kayipEsya: 'anahtar',
  isik: { fog: [0xf4e6d4, 36, 88], hemiSky: 0xfff8ee, hemiGround: 0xb89a7a, sunColor: 0xfff2dc, env: [0xfff0dc, 0xffe8d0, 0xa88a6a, 0.9] },
  zemin: { tA: 0xfff4e0, tB: 0xf6e2c4, tC: 0xffffff, out: 0xc89a6a, outAmt: 0.6, macro: 0xfff8ec },
  minimap: { zemin: '#efd9b4' },
  harita: { ad: 'Mutfak', detay: 'Tezgâh tepeleri ve un dağları', renk: '#f3d49b', x: 50, y: 30, simge: '🍳' },
  kur(L, api) { BOLUM.yerTutucu(L, api, { kutu: [0xf2e2c4, 0xd9b48a, 0xfff6e8, 0xc89a6a], kapi: 0xfff4e4 }); },
});
