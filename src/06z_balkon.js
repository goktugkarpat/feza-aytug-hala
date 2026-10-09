/* ── 5. oda: Balkon Bahçesi (isteğe bağlı ödül odası) ── */
BOLUM.define('balkon', {
  ad: 'Balkon Bahçesi',
  taban: 'forest',
  size: 90, side: 2,
  areas: BOLUM.UC_ALAN('Saksı Ormanı', 'Çiçek Tepesi', 'Kuş Yemi Bahçesi'),
  muzik: 'orman',
  malzeme: null, kayipEsya: 'telefon',
  harita: { ad: 'Balkon Bahçesi', detay: 'Güneşli çiçek bahçesi', renk: '#9be37a', x: 78, y: 30, simge: '🌻' },
  kur(L, api) { BOLUM.yerTutucu(L, api, {}); },
});
