/* ── Hikâye (yer tutucu) ──
   Aytuğ Hala'nın sürpriz pastası: Bilbo hapşırır, şekerler uçar, herkes minicik olur; her bölümden bir pasta malzemesi.
   Hikâye ajanı bu dosyayı serbestçe yeniden yazar (ses: AUD.LINES anahtarları + gen_voice.py). 07_game / 06_level / 09_ui
   şu kancaları çağırır (src/SPEC.md › "Dev Ev API" › STORY). Genel ad: STORY. 09_ui'den önce yüklenir. */
const STORY = (() => {
  'use strict';
  const MALZEME = { un: 'Un', yumurta: 'Yumurta', cilek: 'Çilek', krema: 'Krema' };
  const KAYIP = { gozluk: 'Gözlük', anahtar: 'Anahtar', toka: 'Toka' };
  const toast = text => { if (typeof GAME !== 'undefined' && GAME.emit) GAME.emit('toast', { text }); };
  // Ses kaydı varsa onu söyle (altyazı AUD'dan gelir), yoksa yazıyı kısa bir bildirim olarak göster.
  function line(key, text, prio = 3) {
    if (typeof AUD !== 'undefined' && AUD.LINES && AUD.LINES[key] && AUD.say) return AUD.say(key, { prio }) || 0;
    if (text) toast(text);
    return 0;
  }
  return {
    MALZEME, KAYIP,
    // Yeni oyun başlarken (07 newGame). Dönen sayı: anlatım kaç s sürecek (ilk yetenek cümlesi bekler).
    intro(o) { return line('hala_giris', 'Aytuğ Hala: Eyvah, minicik olduk! Hadi Feza, pastanın malzemelerini bulalım!'); },
    // Bir bölüme girince (07 enterZoneStory)
    zone(o) {},
    // Bölüm bossu neşelenince malzeme alındı (07 bossCheered → 2.5 s sonra). id: 'un' | 'yumurta' | 'cilek' | 'krema'
    ingredient(id) { return line('malzeme_' + id, (MALZEME[id] || id) + ' bulundu! Pastaya bir adım daha!'); },
    // Bilbo Aytuğ Hala'nın kayıp eşyasını bulunca (GAME.foundLostItem)
    lostItem(o) { return line('kayip_' + (o && o.id), 'Bilbo ' + ((KAYIP[o && o.id] || 'kayıp eşyayı').toLocaleLowerCase('tr')) + ' buldu!'); },
    // Kilitli Pasta Krallığı seçilince (UI haritası / GAME.travelTo)
    locked(o) { return line('pasta_kilitli', 'Önce üç malzemeyi bulalım!', 2); },
    // Final: Koca Huysuz Pasta neşelendi, kristale dokunuldu (07 victory). true dönerse eski 'son' cümlesi söylenmez.
    ending(o) { line('hala_son', 'Pasta hazır! Mumları üfle Feza!'); return true; },
    // Başlık ekranı sahnesi: tanımlanırsa LEVEL.build(L._title) bölümün kur()'u yerine bunu çağırır: buildTitle(L, api)
    buildTitle: null,
  };
})();
