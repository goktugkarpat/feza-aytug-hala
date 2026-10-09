/* ── Bölüm 3: Buzdolabı (yer tutucu) ──
   Bölüm ajanı bu dosyayı serbestçe yeniden yazar. Biçim: src/SPEC.md › "Dev Ev API" › Bölüm kaydı. */
BOLUM.define('buzdolabi', {
  ad: 'Buzdolabı',
  taban: 'bathroom',
  size: 90, side: 2,
  areas: BOLUM.UC_ALAN('Dondurma Buzulu', 'Jöle Tepeleri', 'Süt Şişesi Sütunları'),   // 3 alt alan (her biri 2 oda) + boss arenası
  muzik: 'magara',
  malzeme: 'cilek', kayipEsya: 'toka',
  isik: { fog: [0xcfe6f6, 30, 80], hemiSky: 0xe8f6ff, hemiGround: 0x6a8aa8, sunColor: 0xe0f0ff, env: [0xd0ecff, 0xe8f4ff, 0x6a8aa8, 0.9], bloom: 0.5 },
  zemin: { tA: 0xeef8ff, tB: 0xd8eefc, tC: 0xffffff, out: 0x7aa6c8, outAmt: 0.6, macro: 0xf4fbff },
  minimap: { zemin: '#bfe0f4' },
  harita: { ad: 'Buzdolabı', detay: 'Dondurma buzulları ve jöle tepeleri', renk: '#9fd6ef', x: 78, y: 34, simge: '🧊' },
  kur(L, api) { BOLUM.yerTutucu(L, api, { kutu: [0xe8f6ff, 0xbfe0f4, 0xffffff, 0x9cc8e8], kapi: 0xf4fbff, isik: 0xe0f4ff }); },
});
