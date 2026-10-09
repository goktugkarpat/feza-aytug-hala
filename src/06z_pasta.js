/* ── Bölüm 4 (final): Pasta Krallığı (yer tutucu) ──
   3 malzeme (ya da 3 neşelenen boss) toplanınca açılır (BOLUM.isOpen). Bölüm ajanı bu dosyayı serbestçe yeniden yazar.
   Biçim: src/SPEC.md › "Dev Ev API" › Bölüm kaydı. */
BOLUM.define('pasta', {
  ad: 'Pasta Krallığı',
  taban: 'bathroom',
  size: 96, rooms: 6, side: 2,
  muzik: 'kale',
  final: true, malzeme: 'krema', kayipEsya: null,
  isik: { fog: [0xffe0ea, 34, 86], hemiSky: 0xfff4f8, hemiGround: 0xc88aa0, sunColor: 0xfff0e4, env: [0xffe4f0, 0xfff0e4, 0xb07a90, 0.9], bloom: 0.55 },
  zemin: { tA: 0xfff0f4, tB: 0xffe0ea, tC: 0xfff6e0, out: 0xd4849c, outAmt: 0.6, macro: 0xfff4f8 },
  minimap: { zemin: '#f6c8d8' },
  harita: { ad: 'Pasta Krallığı', detay: 'Krema nehirleri ve çilek ormanı', renk: '#f4a8c4', x: 50, y: 70, simge: '🎂' },
  kur(L, api) { BOLUM.yerTutucu(L, api, { kutu: [0xfff0f4, 0xf6b8cc, 0xffe4b8, 0xe88aa8], kapi: 0xfff4f8, isik: 0xffe0ec }); },
});
