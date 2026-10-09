/* ── Bosslar (yer tutucu) ──
   Boss ajanı bu dosyayı serbestçe yeniden yazar. Biçim: src/SPEC.md › "Dev Ev API" › Huysuz kaydı (boss).
   base: davranışı (saldırı düzeni, arena, çağırdığı minikler) ödünç alınan eski boss; bossKit: 07_game BOSS_KIT alanları
   (add: çağırdığı huysuz tipi, at/n: can oranları/adetleri, col: renk, roar: kükreme perdesi …). lines: ses anahtarları. */
HUYSUZ.boss('uykucuSupurge', { ad: 'Uykucu Süpürge', base: 'kraljole', bossKit: { add: 'tozTavsani', at: [0.5], n: [2], col: '#9fb4cf' } });
HUYSUZ.boss('dudukluTencere', { ad: 'Düdüklü Tencere', base: 'kefirdev', bossKit: { add: 'kopukBalonu', at: [0.66, 0.33], n: [2, 2], col: '#e8eef6' } });
HUYSUZ.boss('dondurmaKrali', { ad: 'Dondurma Kralı', base: 'lavkaplumbaga', bossKit: { add: 'buzKupu', at: [0.5], n: [2], col: '#bfe0f4' } });
HUYSUZ.boss('kocaPasta', { ad: 'Koca Huysuz Pasta', base: 'ejderha', bossKit: { add: 'cilekcik', at: [0.66, 0.33], n: [3, 3], col: '#f6b8cc' } });
HUYSUZ.zone('oturma', { boss: 'uykucuSupurge' });
HUYSUZ.zone('mutfak', { boss: 'dudukluTencere' });
HUYSUZ.zone('buzdolabi', { boss: 'dondurmaKrali' });
HUYSUZ.zone('pasta', { boss: 'kocaPasta' });
