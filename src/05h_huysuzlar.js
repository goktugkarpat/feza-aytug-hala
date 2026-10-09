/* ── Normal huysuzlar (yer tutucu) ──
   Huysuzlar ajanı bu dosyayı serbestçe yeniden yazar: kendi model kurucusunu model(o) ile verir (EMODEL sözleşmesi:
   {root, height, radius, anim(dt, st), setMood, flash, setTint, muzzle, dispose}), base yalnız davranış ödünç alır.
   Biçim: src/SPEC.md › "Dev Ev API" › Huysuz kaydı. Şimdilik eski sevimli modeller yer tutucu. */
// ── Oturma Odası ──
HUYSUZ.type('tozTavsani', { ad: 'Toz Tavşanı', base: 'jole', variant: 'purple', saldiri: 'ziplayan', stats: { atkRange: 2.4 } });
HUYSUZ.type('kumanda', { ad: 'Haylaz Kumanda', base: 'goblin', saldiri: 'yakin' });
HUYSUZ.type('corap', { ad: 'Tek Çorap', base: 'kaymak', saldiri: 'kayan' });
HUYSUZ.zone('oturma', { enemies: { tozTavsani: 4, kumanda: 3, corap: 2 }, elites: ['tozTavsani', 'kumanda'] });
// ── Mutfak ──
HUYSUZ.type('kasik', { ad: 'Haylaz Kaşık', base: 'nobetci', saldiri: 'yakin' });
HUYSUZ.type('kopukBalonu', { ad: 'Bulaşık Köpüğü', base: 'kopuk', saldiri: 'uzak' });
HUYSUZ.type('unTorbasi', { ad: 'Un Torbacığı', base: 'yogurt', saldiri: 'ziplayan' });
HUYSUZ.zone('mutfak', { enemies: { kasik: 4, kopukBalonu: 3, unTorbasi: 3 }, elites: ['kasik', 'unTorbasi'] });
// ── Buzdolabı ──
HUYSUZ.type('buzKupu', { ad: 'Buz Küpü', base: 'jole', variant: 'blue', saldiri: 'yakin' });
HUYSUZ.type('joleTatlisi', { ad: 'Jöle Tatlısı', base: 'jole', variant: 'pink', saldiri: 'ziplayan', stats: { atkRange: 2.4 } });
HUYSUZ.type('sutDamlasi', { ad: 'Süt Damlası', base: 'cisdamlasi', saldiri: 'uzak' });
HUYSUZ.zone('buzdolabi', { enemies: { buzKupu: 4, joleTatlisi: 3, sutDamlasi: 3 }, elites: ['buzKupu', 'joleTatlisi'] });
// ── Pasta Krallığı ──
HUYSUZ.type('sekerleme', { ad: 'Şekerleme', base: 'yildizcik', saldiri: 'uzak' });
HUYSUZ.type('cilekcik', { ad: 'Çilekçik', base: 'jole', variant: 'pink', saldiri: 'yakin' });
HUYSUZ.type('kremaTopu', { ad: 'Krema Topu', base: 'kaymak', saldiri: 'kayan' });
HUYSUZ.zone('pasta', { enemies: { sekerleme: 3, cilekcik: 4, kremaTopu: 3 }, elites: ['cilekcik', 'kremaTopu'] });
