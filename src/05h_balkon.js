/* ── 5. oda: Balkon Bahçesi huysuzları ve bossu (HUYSUZ.type / boss / zone) ──
   Güneşli balkon bahçesinin minik canlıları: hepsi SEVİMLİ, yuvarlak, gülümseyen (en fazla yaramaz); neşelenince ^ ^ gözler,
   kocaman gülümseme, kalpler. Modeller src/05h_huysuzlar.js ile aynı teknikle (EMODEL.KIT iskelet + K.face) kurulur.
     bahceSalyangozu  Bahçe Salyangozu   kabuğuna çekilip yuvarlanır (base goblin, 'yuvarlanan')
     ugurBocegi       Uğur Böceği        uçar, minik kırmızı nokta atar (base kopuk, 'uzak')
     karinca          Minik Karınca      sırtında ekmek kırıntısı; yakından "bonk" (base goblin, 'yakin'); elit: taçlı
     tirtil           Tırtıl             kıvrılarak zıplar (base yogurt, 'ziplayan'); neşelenince KELEBEK olup uçar
     altinUgur        Altın Uğur Böceği  nadir: neşelenince "gizli" çıkartma + altın şeker
     ariKralice       Uykucu Arı Kraliçe boss (base kefirdev): pofuduk peluş arı; esner, polen üfler, bal damlası tükürür
   Biçim: src/SPEC.md › "Dev Ev API" › Huysuz kaydı. Sesler: src/02l_balkon.js. */
(() => {
  'use strict';
  const PI = Math.PI;
  const HAS = typeof EMODEL !== 'undefined' && EMODEL && EMODEL.KIT && EMODEL.addType && EMODEL.buildRaw;
  const K = HAS ? EMODEL.KIT : null, G = HAS ? K.G : null;
  const col = h => new THREE.Color(h), hdr = (h, k) => new THREE.Color(h).multiplyScalar(k);
  const mixc = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
  const hash = (a, b, c) => (K ? K.hash3(a, b, c) : 0.5);
  const sm = x => smooth01(x);
  const yuz = (o) => Object.assign({ tilt: 0.3, browT: 0.32, browRaise: 0.26 }, o);
  const bumpU = (u, a, b) => (u > a && u < b ? Math.sin(PI * (u - a) / (b - a)) : 0);
  const bump = (x, w) => (x > 0 && x < w ? Math.sin(PI * x / w) : 0);
  const breath = (s, f = 2.4) => Math.sin(s.t * f + s.ph);

  // ── ortak parçalar (05h ile aynı) ──
  function glints(r, pts, c = '#fff6c8') {
    r.fx(1, 0);
    for (const p of pts) {
      r.add(G.octa(), hdr(c, 2.2), p, [0, 0, 0], [p[3], p[3] * 1.9, p[3] * 0.5]);
      r.add(G.octa(), hdr(c, 2.2), p, [0, 0, PI / 2], [p[3], p[3] * 1.9, p[3] * 0.5]);
    }
    r.fx(0, 0);
  }
  function shoe(r, x, y, z, sx, sy, sz, c, glossy = 0.6) {
    r.fx(0, glossy).add(G.sphere(16, 10), c, [x, y, z], null, [sx, sy, sz]);
    r.fx(1, 0).add(G.sphere(8, 6), hdr('#ffffff', 1.05), [x - sx * 0.25, y + sy * 0.6, z + sz * 0.45], null, [sx * 0.22, sy * 0.15, sz * 0.18]);
    r.fx(0, 0);
  }
  // ── ortak hareket yardımcıları (05h ile aynı) ──
  function boing(s, st, dt, b, k = 1) {
    if (st.hurt > (s.hzH || 0) + 0.25) s.hzB = 0;
    s.hzH = st.hurt;
    if (s.hzB === undefined || s.hzB > 1.2) return;
    s.hzB += dt;
    const w = Math.sin(s.hzB * 30) * Math.exp(-s.hzB * 5.5) * 0.22 * k;
    b.scale.y *= 1 + w; b.scale.x *= 1 - w * 0.6; b.scale.z *= 1 - w * 0.6;
  }
  function gag(s, st, dt, D, every = 5) {
    const idle = s.mv < 0.15 && st.windup < 0 && st.attack < 0 && !(st.dying >= 0) && !(st.hurt > 0.3);
    if (s.gagT === undefined) s.gagT = frand(1.5, every);
    if (!idle) { if (s.gagU >= 0) s.gagU = -1; s.gagT = Math.max(s.gagT, 1.2); return -1; }
    if (s.gagU >= 0) { s.gagU += dt / D; if (s.gagU >= 1) { s.gagU = -1; s.gagT = frand(every * 0.7, every * 1.5); return -1; } return s.gagU; }
    s.gagT -= dt;
    if (s.gagT <= 0) { s.gagU = 0; return 0; }
    return -1;
  }
  function walkPh(s, dt, rate) { if (s.mv > 0.03) s.walk += dt * (rate + 5 * s.mv); return Math.min(1, s.mv * 1.4); }
  // zamanlayıcılı ara sıra hareket (05_enemies act ile aynı): -1 yok, 0..1 ilerleme
  function act(s, key, dt, a, b, len, on) {
    let c = s[key] ?? frand(a, b);
    if (c > 0) { s[key] = on ? c - dt : Math.max(c, 1); return -1; }
    c -= dt;
    if (-c >= len || !on) { s[key] = frand(a, b); return -1; }
    s[key] = c; return -c / len;
  }

  // ════════════════ BAHÇE SALYANGOZU ════════════════
  // Parlak pastel sarmal kabuk (nane yeşili + lila şeritler, krem oluk çizgileri, tepesinde minik papatya), yumuşak şeftali gövde,
  // uzun göz saplarının ucunda kocaman gülen gözler. Hazırlık: gözler ve başı kabuğa çekilir, kabuk kıpır kıpır;
  // saldırı: kabuk tekerlek gibi yuvarlanır. Bekleme: göz saplarını sırayla uzatıp etrafa bakar, kabuğunu silkeler.
  const SH_C = [0, 0.43, -0.12], SH_S = [0.27, 0.36, 0.37], SH_YAW = 0.55;
  function shellS(y, z) {
    const rho = Math.max(1e-3, Math.hypot(y, z)), a = Math.atan2(y, z) + 0.64;
    const phi = ((a % TAU) + TAU) % TAU;
    return { s: phi / TAU - Math.log(rho) / 0.82, rho };
  }
  function shellGeo() {
    const w = K.sN(80, 40), h = K.sN(60, 30);
    return K.gx('bkShell@' + w, () => {
      const g = new THREE.SphereGeometry(1, w, h), p = g.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const S = shellS(v.y, v.z), f = S.s - Math.floor(S.s), dd = Math.min(f, 1 - f);
        const side = sm((Math.abs(v.x) - 0.05) / 0.45) * sm((S.rho - 0.1) / 0.12);
        const groove = Math.exp(-(dd / 0.09) * (dd / 0.09)) * side;
        v.multiplyScalar((1 + 0.07 * Math.sin(PI * f) * side) * (1 - 0.1 * groove));
        p.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      return K.seamNormals(g);
    });
  }
  function daisy(r, p, s, petal = '#ffffff', mid = '#ffc93a') {
    r.push(p, null, s).fx(0, 0.3);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; r.add(G.sphere(10, 6), petal, [Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5], [0, a, 0], [0.16, 0.06, 0.36]); }
    r.fx(0, 0.6).add(G.sphere(12, 8), mid, [0, 0.05, 0], null, [0.24, 0.14, 0.24]);
    r.pop().fx(0, 0);
  }
  function buildSalyangoz(r, o) {
    const body = col('#ffd2a6'), bodyD = col('#eea77a'), bodyL = col('#ffeacc');
    const shA = col('#7fdcc0'), shB = col('#b9a4ff'), shL = col('#fff6dc'), shC = col('#ff8fbf');
    r.bone('body', 'root', [0, 0.05, 0]);
    r.bone('shell', 'root', SH_C);   // (gövdeden bağımsız: yuvarlanırken gövde kabuğun içine gizlenir)
    r.bone('head', 'body', [0, 0.26, 0.26]);
    r.bone('stalkL', 'head', [0.07, 0.55, 0.3]); r.bone('stalkR', 'head', [-0.07, 0.55, 0.3]);
    const EYE = [[0.13, 0.84, 0.34], [-0.13, 0.84, 0.34]], er = 0.088;
    r.bone('eyeL', 'stalkL', EYE[0]); r.bone('eyeR', 'stalkR', EYE[1]);
    r.bone('joy', 'head', [0, 0.8, 0.3]);
    const out = new THREE.Color();
    const fcol = (x, y) => out.copy(bodyD).lerp(body, sm((y - 0.02) / 0.14)).lerp(bodyL, sm((y - 0.3) / 0.25) * 0.5);
    // yumuşak ayak (kenarı açık, ucu sivri değil yuvarlak), boyun ve yuvarlak baş
    r.on('body').fx(0, 0.6, 0, 0).add(G.sphere(32, 18), fcol, [0, 0.09, -0.02], null, [0.24, 0.11, 0.55]);
    r.add(G.sphere(18, 10), fcol, [0, 0.06, -0.5], null, [0.12, 0.07, 0.14]);
    r.on('head').fx(0, 0.6).seg([0, 0.1, 0.22], [0, 0.36, 0.3], 0.15, fcol, 0.14, 18);
    r.add(G.sphere(32, 24), fcol, [0, 0.42, 0.32], null, [0.19, 0.18, 0.18]);
    for (let i = 0; i < 2; i++) {
      const sx = i ? -1 : 1, e = EYE[i];
      r.on(i ? 'stalkR' : 'stalkL').fx(0, 0.5).seg([0.065 * sx, 0.54, 0.3], [e[0], e[1] - 0.03, e[2] - 0.01], 0.034, body, 0.027, 10);
      r.on(i ? 'eyeR' : 'eyeL').add(G.sphere(20, 14), body, e, null, er * 0.98);
    }
    r.fx(0, 0);
    // sarmal kabuk: şeritler + her olukta krem çizgi
    // (kabuk biraz öne-yana döndürülür: sarmal önden ve yukarıdaki kameradan da okunur)
    const roll = 0.5, cr = Math.cos(roll), sr = Math.sin(roll), cy = Math.cos(SH_YAW), sy = Math.sin(SH_YAW);
    const shcol = (x0, y, z0) => {
      const ex = x0 - SH_C[0], ez = z0 - SH_C[2], x = ex * cy - ez * sy + SH_C[0], z = ex * sy + ez * cy + SH_C[2];
      const dx = x - SH_C[0], dy = y - SH_C[1];
      const lx = (dx * cr + dy * sr) / SH_S[0], ly = (-dx * sr + dy * cr) / SH_S[1], lz = (z - SH_C[2]) / SH_S[2];
      const S = shellS(ly, lz), f = S.s - Math.floor(S.s), dd = Math.min(f, 1 - f), side = sm((Math.abs(lx) - 0.05) / 0.45);
      if (S.rho < 0.13 && side > 0.5) return out.copy(shC);
      const band = (Math.floor(S.s * 2) & 1) ? shB : shA, hf = S.s * 2 - Math.floor(S.s * 2);
      out.copy(band).lerp(shL, 0.25 * Math.sin(PI * hf));
      return out.lerp(shL, sm((0.075 - dd) / 0.03) * (0.5 + 0.5 * side));
    };
    r.on('shell').push(SH_C, [0, SH_YAW, 0]).fx(0, 1).add(shellGeo(), shcol, [0, 0, 0], [0, 0, roll], SH_S);
    r.fx(1, 0).add(G.sphere(12, 8), hdr('#ffffff', 1.4), [0.12, 0.23, 0.14], [0.3, 0.2, 0.5], [0.07, 0.025, 0.012]);
    daisy(r, [-0.07, 0.36, -0.04], 0.13);
    r.pop();
    // gözler: yaramaz (açık, kaş) / çok mutlu (^ ^)
    for (let i = 0; i < 2; i++) {
      const sx = i ? -1 : 1, e = EYE[i], bn = i ? 'eyeR' : 'eyeL';
      r.on(bn).push(e, [-0.45, sx * 0.12, 0]);
      r.mood = 1;
      r.push([0, 0, er * 0.36]); K.eyeOpen(r, sx, { er, iris: '#3a6a3a', look: 0.7, lookY: 0.02, skin: body }, true); r.pop();
      const up = sx > 0 ? er * 0.35 : 0, bA = PI * 0.56;
      r.fx(0, 0.25).add(G.torus(bA, 0.42, 14), '#7a4a30', [0, er * 1.02 + up, er * 0.42], [0, 0, (PI - bA) / 2], [er * 0.7, er * (up ? 0.58 : 0.46), er * 0.42]);
      r.mood = 2;
      r.push([0, er * 0.1, er * 0.72]); K.eyeClosed(r, { er }); r.pop();
      r.mood = 0; r.fx(0, 0);
      r.pop();
    }
    const HC = [0, 0.42, 0.32], HR = 0.18;
    r.on('head').push(HC, [-0.3, 0, 0]);
    for (const s of [-1, 1]) { const [p, q] = onSphere(s * 0.115, -0.035, HR, -0.004); r.push(p, q); K.blush(r, 0.085, { blushCol: '#ff7fa6' }); r.pop(); }
    r.mood = 1; { const [p, q] = onSphere(0, -0.06, HR, 0); r.push(p, q); K.smirk(r, 0.085, {}); r.pop(); }
    r.mood = 2; { const [p, q] = onSphere(0, -0.05, HR, 0); r.push(p, q); K.smile(r, 0.125, { noTeeth: true }); r.pop(); }
    r.mood = 0;
    r.pop();
    r.on('joy').push(HC, [-0.3, 0, 0]).fx(0.5, 0.6);
    r.mood = 2;
    for (const s of [-1, 1]) r.add(K.heartGeo(), '#ff4f93', [s * 0.32, 0.36 + (s > 0 ? 0.05 : 0), 0.05], [-0.25, 0, -s * 0.38], 0.08 * (s > 0 ? 0.8 : 1));
    r.mood = 0; r.pop().fx(0, 0);
    r.on('head').mark('muzzle', [0, 0.38, 0.52]);
    return { height: 0.95, glowC: col('#9af0d0'), mat: { rough: 0.3, sss: col('#ffe2b8').multiplyScalar(0.06), rim: '#fff4e0', rimK: 0.3, rimP: 2.3, wob: 0.006, wobF: 5, wobS: 3 } };
  }
  function animSalyangoz(m, dt, st, s) {
    const B = m.B, b = B.body;
    if (s.mv > 0.03) s.walk += dt * (4 + 3 * s.mv);
    const ph = s.walk, k = Math.min(1, s.mv * 1.5), br = breath(s, 2);
    b.scale.set(1, 1 - 0.03 * Math.sin(ph) * k + 0.01 * br, 1 + 0.06 * Math.sin(ph) * k);
    B.head.rotation.x = Math.sin(ph) * 0.06 * k + Math.sin(s.t * 1.6 + s.ph) * 0.04;
    B.head.rotation.z = Math.sin(s.t * 1.1 + s.ph) * 0.06;
    let sL = -0.06 + Math.sin(s.t * 2.3 + s.ph) * 0.13, sR = 0.06 + Math.sin(s.t * 2.1 + s.ph + 1.7) * 0.13;
    let sxL = Math.sin(s.t * 1.7) * 0.08 - 0.1 * k, sxR = Math.sin(s.t * 1.5 + 1) * 0.08 - 0.1 * k, stalkK = 1;
    B.shell.rotation.z = Math.sin(ph) * 0.035 * k; B.shell.position.y += Math.abs(Math.sin(ph)) * 0.012 * k;
    let bl = 1;
    if (s.mood !== 'happy') {
      s.bt -= dt;
      if (s.bt < 0) { const u = -s.bt / 0.14; if (u >= 1) s.bt = frand(1.6, 4.5); else bl = 1 - Math.sin(u * PI) * 0.9; }
    }
    // kabuğa çekilme miktarı: hazırlıkta yavaş yavaş, yuvarlanırken tam
    let tuck = 0, rollOn = false;
    if (st.windup >= 0) {
      const w = sm(st.windup * 1.25);
      tuck = w;
      B.shell.position.x += Math.sin(s.t * 48) * 0.012 * st.windup; B.shell.rotation.z += Math.sin(s.t * 40) * 0.06 * w;
      if (s.mood !== 'happy') bl = Math.min(bl, 1 - 0.6 * sm(st.windup * 1.8));
    }
    if (st.attack >= 0) {
      if (st.attack < 1 && s.mv > 0.5) { rollOn = true; tuck = 1; }
      else {   // durunca kabuktan çıkar, başı döner (sersem ama gülümser)
        const out = sm(Math.min(1, (st.attack >= 1 ? 1 : st.attack) * 2));
        tuck = Math.max(tuck, 1 - out);
        B.head.rotation.z += Math.sin(s.t * 9) * 0.2; sL += Math.sin(s.t * 11) * 0.3; sR -= Math.sin(s.t * 11 + 1) * 0.3;
      }
    }
    if (rollOn) {
      s.roll = (s.roll || 0) + dt * 12;
      B.shell.rotation.set(s.roll, -SH_YAW, 0);   // (Euler XYZ: kabuğun yan dönüşü geri alınır, tekerlek gibi düz yuvarlanır)
      B.shell.position.y -= 0.06; B.shell.position.z += 0.12;
      b.scale.set(0.0001, 0.0001, 0.0001);   // gövde kabuğun içinde
    } else s.roll = 0;
    // hasar: kabuğa saklanıp hemen geri çıkar
    s.duck = Math.max(damp(s.duck || 0, 0, 5, dt), st.hurt > 0.5 ? 1 : 0);
    tuck = Math.max(tuck, sm(s.duck) * 0.8);
    // bekleme: önce bir göz sapı uzayıp sağa bakar, sonra öteki sola; en sonda kabuğunu silkeler
    { const u = gag(s, st, dt, 3.0, 5);
      if (u >= 0) {
        const a = bumpU(u, 0, 0.42), c = bumpU(u, 0.3, 0.72), sh = bumpU(u, 0.75, 1);
        sL -= 0.5 * a; sxL -= 0.3 * a; B.stalkL.scale.y = 1 + 0.35 * a;
        sR += 0.5 * c; sxR -= 0.3 * c; B.stalkR.scale.y = 1 + 0.35 * c;
        B.shell.rotation.y = Math.sin(u * 50) * 0.12 * sh; B.shell.position.y += 0.04 * sh;
      }
    }
    if (tuck > 0.001 && !rollOn) {
      const d = tuck;
      B.head.position.z -= 0.34 * d; B.head.position.y -= 0.1 * d; B.head.scale.multiplyScalar(1 - 0.6 * d);
      stalkK = 1 - 0.85 * d; sxL -= 0.6 * d; sxR -= 0.6 * d;
      b.scale.z *= 1 - 0.35 * d; b.scale.y *= 1 - 0.2 * d;
      B.shell.position.y -= 0.05 * d;
    }
    B.stalkL.rotation.z = sL; B.stalkR.rotation.z = sR; B.stalkL.rotation.x = sxL; B.stalkR.rotation.x = sxR;
    if (stalkK < 1) { B.stalkL.scale.multiplyScalar(stalkK); B.stalkR.scale.multiplyScalar(stalkK); }
    B.eyeL.scale.y = bl; B.eyeR.scale.y = bl;
    if (!rollOn) boing(s, st, dt, B.shell, 0.7);
  }

  // ════════════════ UĞUR BÖCEĞİ (+ nadir Altın Uğur) ════════════════
  // Yuvarlak kırmızı kubbe (iki kanat kabuğu, siyah benekler), büyük koyu başında kocaman gözler, top uçlu antenler; kabukların
  // altından şeffaf minik kanatlar vızır vızır çırpar. Havada süzülür; hazırlıkta geriye yaslanıp yanaklarını şişirir, "pıt!"
  // diye minik kırmızı bir nokta atar. Bekleme: havada takla atar.
  // (benekler: kenarlara dağılmış minik puantiyeler; tepede yan yana iki iri benek "göz" gibi okunuyordu)
  const LB_SPOTS = [[0.3, 0.9, 0.12, 0.18], [0.7, 0.55, 0.35, 0.18], [0.5, 0.62, -0.55, 0.19], [0.88, 0.3, -0.25, 0.16], [0.22, 0.55, -0.85, 0.15]];
  function halfDome(sd) {
    const w = 60, h = 36;   // (benekler köşe renginde: sık örgü gerekir, LOD'dan bağımsız)
    return K.gx('bkHalf' + sd + '@' + w, () => new THREE.SphereGeometry(1, w, h, sd > 0 ? PI / 2 : -PI / 2, PI, 0, PI * 0.62));
  }
  function buildUgur(r, o) {
    const gold = o.rare;
    const red = col(gold ? '#ffbf1f' : '#ff3b4a'), redL = col(gold ? '#ffe680' : '#ff7a72'), redD = col(gold ? '#e08a10' : '#c81a32');
    const spot = col(gold ? '#a8480c' : '#24141e'), dark = col(gold ? '#7a4a2a' : '#33263a'), out = new THREE.Color();
    const BC = [0, 0.5, -0.06], BS = [0.3, 0.27, 0.33];
    r.bone('body', 'root', [0, 0.5, 0]);
    r.bone('head', 'body', [0, 0.47, 0.22]);
    r.bone('shL', 'body', [0.02, 0.6, 0.08]); r.bone('shR', 'body', [-0.02, 0.6, 0.08]);
    r.bone('wingL', 'body', [0.1, 0.62, 0.02]); r.bone('wingR', 'body', [-0.1, 0.62, 0.02]);
    r.bone('antL', 'head', [0.07, 0.63, 0.32]); r.bone('antR', 'head', [-0.07, 0.63, 0.32]);
    r.bone('legs', 'body', [0, 0.32, 0]);
    // gövdenin altı (koyu, yumuşak) + karın
    r.on('body').fx(0, 0.4).add(G.sphere(24, 16), dark, [0, 0.47, -0.05], null, [0.27, 0.2, 0.3]);
    // kanat kabukları: iki yarım kubbe, benekli, ortada ince çizgi
    for (const sd of [-1, 1]) {
      r.on(sd > 0 ? 'shL' : 'shR').fx(0, 0.65);
      const cfun = (x, y, z) => {
        const nx = (x - sd * 0.008) / BS[0], ny = (y - BC[1]) / BS[1], nz = (z - BC[2]) / BS[2];
        out.copy(redD).lerp(red, sm((ny + 0.1) / 0.5)).lerp(redL, 0.35 * sm((ny - 0.55) / 0.4));
        let sp = 0;
        for (const p of LB_SPOTS) { const d = Math.hypot(nx - sd * p[0], ny - p[1], nz - p[2]); sp = Math.max(sp, sm((p[3] - d) / 0.025)); }
        { const d = Math.hypot(nx, ny - 0.5, nz - 0.82); sp = Math.max(sp, sm((0.16 - d) / 0.03)); }   // öndeki ortak benek
        out.lerp(spot, sp);
        return out.lerp(mixc(redD, '#000000', 0.3), sm((0.025 - Math.abs(nx)) / 0.015) * 0.8);   // orta çizgi
      };
      r.add(halfDome(sd), cfun, [sd * 0.008, BC[1], BC[2]], null, BS);
      r.fx(1, 0).add(G.sphere(10, 6), hdr('#ffffff', 1.4), [sd * 0.13, 0.72, 0.0], [0.4, sd * 0.4, 0.4], [0.06, 0.02, 0.01]);
      r.fx(0, 0);
    }
    // şeffaf minik kanatlar (kabukların altından)
    for (const sd of [-1, 1]) {
      r.on(sd > 0 ? 'wingL' : 'wingR').fx(0.35, 0.8).add(G.sphere(14, 8), K.vgrad(0.55, 0.7, [[0, '#cfe6ff'], [1, '#ffffff']]), [sd * 0.3, 0.64, -0.2], [0, sd * 0.5, 0], [0.24, 0.012, 0.11]);
      r.fx(0, 0);
    }
    // baş: koyu, yuvarlak, beyaz yanak benekleri
    const HC = [0, 0.47, 0.25], HR = 0.17;
    r.on('head').fx(0, 0.6).add(G.sphere(28, 20), K.vgrad(0.32, 0.64, [[0, dark], [1, mixc(dark, '#ffffff', 0.12)]]), HC, null, [HR, HR * 0.94, HR * 0.9]);
    r.fx(0, 0.4);
    for (const sd of [-1, 1]) r.add(G.sphere(12, 8), gold ? '#fff3c0' : '#fff6f0', [sd * 0.15, 0.55, 0.22], null, [0.03, 0.04, 0.025]);
    r.fx(0, 0);
    K.face(r, HC, HR, yuz({ bone: 'head', tilt: 0.12, ex: 0.07, ey: 0.01, er: 0.064, iris: gold ? '#7a3a0a' : '#c8202e', skin: dark, browCol: '#ffd6e0', browY: 1.36,
      mouthY: -0.085, mouthW: 0.06, mouthCol: '#ffc4d4', happyCol: '#ffffff', heartY: 1.1, heartX: 1.4, heartS: 0.36, blushCol: '#ff6f9a' }));
    // antenler (top uçlu)
    for (const sd of [-1, 1]) {
      r.on(sd > 0 ? 'antL' : 'antR').fx(0, 0.4);
      r.seg([0.07 * sd, 0.62, 0.32], [0.13 * sd, 0.76, 0.36], 0.009, dark, 0.008, 6);
      r.seg([0.13 * sd, 0.76, 0.36], [0.16 * sd, 0.84, 0.33], 0.008, dark, 0.007, 6);
      r.fx(0, 1).add(G.sphere(12, 8), gold ? '#ffd23a' : '#ff5a6a', [0.165 * sd, 0.86, 0.33], null, 0.03);
      r.fx(0, 0);
    }
    // altı minik ayak
    r.on('legs').fx(0, 0.3);
    for (const sd of [-1, 1]) for (const z of [0.12, 0, -0.12]) {
      r.seg([0.14 * sd, 0.36, z], [0.22 * sd, 0.26, z + 0.03], 0.016, dark, 0.014, 6);
      r.add(G.sphere(8, 6), dark, [0.22 * sd, 0.25, z + 0.04], null, 0.022);
    }
    r.fx(0, 0);
    if (gold) { glints(r.on('shL'), [[0.24, 0.78, 0.0, 0.035], [0.3, 0.52, -0.3, 0.025]]); glints(r.on('shR'), [[-0.2, 0.7, -0.22, 0.03]]); }
    r.on('head').mark('muzzle', [0, 0.42, 0.42]);
    return { height: 0.9, glowC: col(gold ? '#fff0a0' : '#ff7a8a'),
      mat: { rough: gold ? 0.2 : 0.25, sss: col('#ff5a6a').multiplyScalar(gold ? 0 : 0.03), rim: gold ? '#fff2b0' : '#ffe0e6', rimK: gold ? 0.45 : 0.32, rimP: 2.3 } };
  }
  function animUgur(m, dt, st, s) {
    const B = m.B, b = B.body;
    b.position.y += Math.sin(s.t * 2.2 + s.ph) * 0.05;
    b.rotation.z = Math.sin(s.t * 1.3 + s.ph) * 0.08 + Math.sin(s.t * 6) * 0.05 * s.mv;
    b.rotation.x = 0.15 * s.mv;
    let flapF = 38, flapA = 0.55, shOpen = 0.35, sc = 1 + 0.02 * breath(s, 3);
    B.antL.rotation.z = -0.1 + Math.sin(s.t * 3.1 + s.ph) * 0.15; B.antR.rotation.z = 0.1 - Math.sin(s.t * 2.9 + s.ph) * 0.15;
    B.antL.rotation.x = Math.sin(s.t * 2.3) * 0.1; B.antR.rotation.x = Math.sin(s.t * 2.5 + 1) * 0.1;
    B.legs.rotation.x = Math.sin(s.t * 4 + s.ph) * 0.12;
    if (st.windup >= 0) {   // geri yaslan, başı şişir, kanatlar daha hızlı
      const w = sm(st.windup * 1.3);
      b.rotation.x = -0.35 * w; B.head.scale.setScalar(1 + 0.16 * w); flapF = 52; shOpen += 0.2 * w;
      B.antL.rotation.x -= 0.5 * w; B.antR.rotation.x -= 0.5 * w; b.position.x += Math.sin(s.t * 55) * 0.01 * st.windup;
      b.position.y += 0.06 * w;
    }
    if (st.attack >= 0 && st.attack < 1) { const kk = Math.sin(PI * st.attack); b.rotation.x = 0.35 * kk; B.head.scale.set(1 - 0.08 * kk, 1 - 0.1 * kk, 1 + 0.12 * kk); b.position.z -= 0.08 * kk; }
    { const u = gag(s, st, dt, 1.8, 5);   // havada takla
      if (u >= 0) { b.rotation.x -= TAU * sm(u / 0.8); b.position.y += 0.18 * bumpU(u, 0, 1); flapF = 50; s.eyeK = 1 + 0.3 * bumpU(u, 0, 0.9); }
    }
    if (st.dying >= 0) { flapF = 55; shOpen = 0.6; }
    const f = Math.sin(s.t * flapF);
    B.wingL.rotation.z = 0.2 + flapA * f; B.wingR.rotation.z = -0.2 - flapA * f;
    B.wingL.rotation.y = 0.2 * f; B.wingR.rotation.y = -0.2 * f;
    B.shL.rotation.z = shOpen + 0.03 * f; B.shR.rotation.z = -shOpen - 0.03 * f;
    B.shL.rotation.x = -0.15 * shOpen; B.shR.rotation.x = -0.15 * shOpen;
    b.scale.multiplyScalar(sc);
    boing(s, st, dt, b);
  }

  // ════════════════ MİNİK KARINCA ════════════════
  // Sıcak kırmızı-kahve, parlak; kocaman yuvarlak baş, dirsekli top uçlu antenler, ince altı bacak, tombul karın; sırtında
  // kocaman bir ekmek kırıntısı taşır. Hazırlık: arka bacaklarına kalkar, ön bacaklarını sallar; saldırı: kafasıyla "bonk".
  // Bekleme: kırıntıyı düşürecek gibi olur, hop diye yakalar. Elit: taçlı, koyu çikolata.
  function buildKarinca(r, o) {
    const E = o.elite;
    const base = col(E ? '#7a3f2c' : '#c4573a'), light = col(E ? '#b06a4a' : '#ef8a62'), deep = col(E ? '#4a2216' : '#8a3020');
    r.bone('hips', 'root', [0, 0.26, 0]);
    r.bone('body', 'hips', [0, 0.3, 0]);
    r.bone('head', 'body', [0, 0.42, 0.18]);
    r.bone('abd', 'body', [0, 0.3, -0.14]);
    r.bone('crumb', 'abd', [0, 0.5, -0.24]);
    r.bone('antL', 'head', [0.08, 0.68, 0.24]); r.bone('antR', 'head', [-0.08, 0.68, 0.24]);
    const LEG = [['l1', 0.06], ['l2', -0.03], ['l3', -0.11]];
    for (const [n, z] of LEG) { r.bone(n + 'L', 'body', [0.06, 0.29, z]); r.bone(n + 'R', 'body', [-0.06, 0.29, z]); }
    const g = (y0, y1) => K.vgrad(y0, y1, [[0, deep], [0.5, base], [1, mixc(base, light, 0.6)]]);
    // göğüs (küçük) + bel + karın (tombul)
    r.on('body').fx(0, 0.9).add(G.sphere(20, 14), g(0.2, 0.42), [0, 0.31, 0.0], null, [0.1, 0.1, 0.13]);
    r.add(G.sphere(12, 8), deep, [0, 0.3, -0.12], null, [0.06, 0.06, 0.06]);
    r.on('abd').fx(0, 0.9).add(G.sphere(28, 20), g(0.14, 0.5), [0, 0.32, -0.3], [-0.25, 0, 0], [0.2, 0.18, 0.24]);
    r.fx(0, 0.5);
    for (let k = 0; k < 2; k++) r.add(G.torus(TAU, 0.08, 28), mixc(base, light, 0.4), [0, 0.32 + 0.02 * k, -0.3 - 0.08 * (k - 0.5)], [PI / 2 - 0.25, 0, 0], [0.19 - 0.02 * Math.abs(k - 0.5), 0.17, 0.2]);
    r.fx(1, 0).add(G.sphere(10, 6), hdr('#ffffff', 1.3), [-0.08, 0.46, -0.24], [0.5, -0.4, 0.4], [0.06, 0.022, 0.01]);
    r.fx(0, 0);
    // ekmek kırıntısı: altın kabuklu, yumuşak içli kocaman bir parça (sırtında)
    // (yumuşak köşeli ekmek parçası: üstü ve bir yanı altın kabuk, kesik yüzleri delikli krem içi)
    r.on('crumb').push([0, 0.6, -0.26], [0.12, 0.5, -0.08]).fx(0, 0.15, 0, 0);
    const crust = col('#c97a2e'), crustL = col('#e8a850'), crumbIn = col('#fff1cc'), out = new THREE.Color();
    const bread = (x, y, z) => {
      const lx = x, ly = y - 0.6, lz = z + 0.26;   // (yaklaşık yerel; parça küçük)
      const c = sm((ly - 0.04) / 0.03) + sm((lx - 0.1) / 0.04);
      out.copy(crumbIn).lerp(col('#f2d49a'), 0.5 * sm((K.fbm3(x * 40, y * 40, z * 40) - 0.55) / 0.08));
      return out.lerp(mixc(crust, crustL, K.fbm3(x * 25, y * 25, z * 25)), Math.min(1, c));
    };
    r.add(G.rbox(3), bread, [0, 0, 0], null, [0.3, 0.17, 0.24]);
    r.add(G.sphere(16, 10), bread, [0.04, 0.07, 0.0], null, [0.13, 0.05, 0.1]);
    r.pop().fx(0, 0);
    // bacaklar: ince, dirsekli, uçları yuvarlak
    for (const [n, z] of LEG) for (const sd of [-1, 1]) {
      r.on(n + (sd > 0 ? 'L' : 'R')).fx(0, 0.6);
      const kz = z * 1.6, knee = [0.16 * sd, 0.3, z + kz * 0.4], foot = [0.2 * sd, 0.05, z + kz];
      r.seg([0.06 * sd, 0.29, z], knee, 0.03, deep, 0.026, 8);
      r.seg(knee, foot, 0.026, deep, 0.022, 8);
      r.add(G.sphere(10, 8), base, knee, null, 0.034);
      r.fx(0, 0.5).add(G.sphere(12, 8), mixc(base, light, 0.3), [foot[0] + 0.01 * sd, 0.04, foot[2] + 0.02], null, [0.045, 0.035, 0.055]);   // yuvarlak "ayakkabı"
      r.fx(0, 0);
    }
    // kocaman yuvarlak baş + yüz
    const HC = [0, 0.48, 0.24], HR = 0.21;
    r.on('head').fx(0, 0.9).add(G.sphere(30, 22), g(0.28, 0.7), HC, null, [HR, HR * 0.96, HR * 0.94]);
    r.fx(1, 0).add(G.sphere(10, 6), hdr('#ffffff', 1.3), [-0.1, 0.62, 0.26], [0.5, -0.5, 0.4], [0.05, 0.02, 0.01]);
    r.fx(0, 0);
    K.face(r, HC, HR, yuz({ bone: 'head', tilt: 0.2, ex: 0.082, ey: 0.03, er: 0.072, iris: '#3a1a10', skin: mixc(base, light, 0.25), browCol: '#4a1a10', browY: 1.36,
      mouthY: -0.085, mouthW: 0.07, heartY: 1.05, heartX: 1.35, heartS: 0.32, blushCol: '#ff9ab8' }));
    // antenler: dirsekli, top uçlu
    for (const sd of [-1, 1]) {
      r.on(sd > 0 ? 'antL' : 'antR').fx(0, 0.5);
      const a = [0.08 * sd, 0.66, 0.24], e = [0.15 * sd, 0.82, 0.22], t = [0.2 * sd, 0.86, 0.34];
      r.seg(a, e, 0.012, deep, 0.011, 6); r.seg(e, t, 0.011, deep, 0.01, 6);
      r.add(G.sphere(8, 6), deep, e, null, 0.014);
      r.fx(0, 1).add(G.sphere(12, 8), mixc(base, light, 0.5), t, null, 0.03);
      r.fx(0, 0);
    }
    if (E) K.crown(r.on('head'), [0, 0.68, 0.2], 0.45);
    r.on('head').mark('muzzle', [0, 0.45, 0.45]);
    return { height: 0.8, glowC: col('#ff9a6a'), mat: { rough: 0.28, sss: col('#ff8a5a').multiplyScalar(0.03), rim: '#ffe0c8', rimK: 0.3, rimP: 2.3 } };
  }
  function animKarinca(m, dt, st, s) {
    const B = m.B, k = walkPh(s, dt, 12), ph = s.walk;
    // üçlü yürüyüş: L1-R2-L3 ile R1-L2-R3 sırayla
    const LEG = ['l1', 'l2', 'l3'];
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {
      const bn = B[LEG[i] + (sd > 0 ? 'L' : 'R')], p = ph + ((i + (sd > 0 ? 0 : 1)) & 1 ? PI : 0);
      bn.rotation.y = Math.sin(p) * 0.45 * k; bn.rotation.z = sd * Math.max(0, Math.cos(p)) * 0.25 * k;
    }
    B.hips.position.y += Math.abs(Math.sin(ph * 2)) * 0.015 * k + 0.005 * breath(s, 3);
    B.body.rotation.z = Math.sin(ph) * 0.04 * k;
    B.head.rotation.x = Math.sin(ph * 2) * 0.05 * k + Math.sin(s.t * 1.7 + s.ph) * 0.04;
    B.head.rotation.z = Math.sin(s.t * 1.3 + s.ph) * 0.06;
    B.abd.rotation.x = Math.sin(ph * 2) * 0.06 * k; B.abd.rotation.y = Math.sin(ph) * 0.08 * k;
    B.crumb.rotation.z = Math.sin(ph) * 0.05 * k; B.crumb.position.y += Math.abs(Math.sin(ph * 2)) * 0.01 * k;
    let aL = Math.sin(s.t * 3 + s.ph) * 0.15, aR = -Math.sin(s.t * 3.3 + s.ph + 1) * 0.15, ax = Math.sin(s.t * 2.2) * 0.1;
    if (st.windup >= 0) {   // arka bacaklarına kalkar, ön bacaklarını sallar, antenler titrer
      const w = sm(st.windup * 1.4);
      B.body.rotation.x = -0.55 * w; B.hips.position.y += 0.06 * w; B.hips.position.z -= 0.06 * w;
      B.l1L.rotation.z += 0.8 * w + Math.sin(s.t * 22) * 0.3 * w; B.l1R.rotation.z -= 0.8 * w + Math.sin(s.t * 22 + 1) * 0.3 * w;
      B.l1L.rotation.x -= 0.6 * w; B.l1R.rotation.x -= 0.6 * w;
      B.abd.rotation.x += 0.45 * w; B.head.rotation.x += 0.25 * w;
      aL += Math.sin(s.t * 40) * 0.25 * w; aR += Math.sin(s.t * 40 + 1) * 0.25 * w; ax -= 0.4 * w;
      B.hips.position.x += Math.sin(s.t * 55) * 0.008 * st.windup;
    }
    if (st.attack >= 0 && st.attack < 1) {   // "bonk!"
      const a = st.attack, hit = sm(a / 0.28), back = sm((a - 0.45) / 0.55);
      B.body.rotation.x = lerp(-0.55, 0.35, hit) * (1 - back); B.hips.position.z += 0.1 * hit * (1 - back);
      B.head.rotation.x += 0.3 * hit * (1 - back); ax += 0.4 * hit * (1 - back);
    }
    { const u = gag(s, st, dt, 2.2, 5);   // kırıntı kayar, düşecek gibi olur, hop diye yakalar
      if (u >= 0) { const sl = sm(u / 0.4) * (1 - sm((u - 0.55) / 0.1)), hop = bumpU(u, 0.5, 0.75);
        B.crumb.position.x += 0.12 * sl; B.crumb.rotation.z -= 0.6 * sl; B.crumb.position.y += 0.12 * hop;
        B.hips.position.y += 0.08 * hop; B.head.rotation.y = 0.5 * sl; s.eyeK = 1 + 0.35 * sl;
        B.l1L.rotation.z += 0.8 * sl; }
    }
    B.antL.rotation.z = aL; B.antR.rotation.z = aR; B.antL.rotation.x = ax; B.antR.rotation.x = ax;
    boing(s, st, dt, B.body);
  }

  // ════════════════ TIRTIL → KELEBEK ════════════════
  // Tombul yeşil boğumlu tırtıl: büyük gülen baş, top uçlu minik antenler, her boğumda sarı benek, altında minik ayaklar.
  // Kıvrılıp açılarak zıplar (inchworm). Hazırlık: kıvrılır; saldırı: yay gibi fırlar. Neşelenince sırtında rengârenk kelebek
  // kanatları açılır (mood 2), kanatlarını çırparak havalanıp uçar gider (st.dying 0 → 1).
  const TS = [[0, 0.22, 0.2, 0.2], [0, 0.17, 0.02, 0.165], [0, 0.16, -0.15, 0.155], [0, 0.15, -0.31, 0.145], [0, 0.13, -0.45, 0.12]];
  function bfWing(top, sd) {   // kelebek kanadı (sd: +1 sol, -1 sağ): üst kanat büyük yuvarlak, alt kanat küçük; düzlem xy, x dışa, y öne
    return () => {
      const s2 = new THREE.Shape(), P = a => a.map((v, i) => (i & 1 ? v : v * sd));
      const bz = (...a) => s2.bezierCurveTo(...P(a));
      s2.moveTo(0, 0);
      if (top) { bz(0.05, 0.22, 0.28, 0.42, 0.46, 0.36); bz(0.6, 0.3, 0.58, 0.08, 0.44, -0.02); bz(0.3, -0.08, 0.12, -0.05, 0, 0); }
      else { bz(0.14, -0.02, 0.36, -0.06, 0.38, -0.2); bz(0.4, -0.34, 0.22, -0.4, 0.12, -0.3); bz(0.04, -0.22, 0, -0.1, 0, 0); }
      return s2;
    };
  }
  function buildTirtil(r, o) {
    const gA = col('#7fd85a'), gL = col('#c8f59a'), gD = col('#3fa84a'), out = new THREE.Color();
    r.bone('body', 'root', [0, 0, 0]);
    for (let i = 0; i < 5; i++) r.bone('s' + i, 'body', [0, 0.05, TS[i][2]]);
    r.bone('head', 's0', [0, 0.22, 0.2]);
    r.bone('wings', 's2', [0, 0.3, -0.15]);
    r.bone('wingL', 'wings', [0.04, 0.3, -0.15]); r.bone('wingR', 'wings', [-0.04, 0.3, -0.15]);
    const segc = (cy) => (x, y, z) => out.copy(gD).lerp(gA, sm((y - cy + 0.14) / 0.14)).lerp(gL, 0.55 * sm((y - cy - 0.02) / 0.14));
    // boğumlar (baştan kuyruğa küçülür), yanlarda sarı benekler, altta minik ayaklar
    for (let i = 1; i < 5; i++) {
      const [x, y, z, R] = TS[i];
      r.on('s' + i).fx(0, 0.5, 0, 1).add(G.sphere(24, 16), segc(y), [x, y, z], null, [R * 1.05, R, R * 0.95]);
      r.fx(0, 0.6, 0, 1);
      for (const sd of [-1, 1]) { const [p, q] = onSphere(sd * R * 0.62, R * 0.25, R, -0.004); r.push([x, y, z]).push(p, q).add(G.sphere(10, 6), '#ffe04a', [0, 0, 0], null, [R * 0.22, R * 0.22, R * 0.08]).pop().pop(); }
      r.fx(0, 0.3, 0, 0);
      for (const sd of [-1, 1]) r.add(G.sphere(10, 6), gL, [sd * R * 0.55, 0.035, z + 0.01], null, [0.04, 0.035, 0.045]);
      r.fx(0, 0);
    }
    r.on('s4').fx(0, 0.4).add(G.sphere(12, 8), gL, [0, 0.17, -0.56], null, [0.05, 0.05, 0.06]);   // kuyruk ucu
    // baş
    const [hx, hy, hz, HR] = TS[0];
    r.on('head').fx(0, 0.5, 0, 1).add(G.sphere(32, 24), K.vgrad(0.04, 0.42, [[0, gD], [0.45, gA], [1, mixc(gA, gL, 0.35)]]), [hx, hy, hz], null, [HR, HR * 0.97, HR * 0.95]);
    r.fx(0, 0.3, 0, 0);
    for (const sd of [-1, 1]) r.add(G.sphere(10, 6), gL, [sd * 0.1, 0.035, 0.24], null, [0.045, 0.035, 0.05]);
    // minik antenler
    r.fx(0, 0.5);
    for (const sd of [-1, 1]) {
      r.seg([0.07 * sd, 0.38, 0.2], [0.11 * sd, 0.5, 0.22], 0.012, gD, 0.01, 6);
      r.fx(0, 1).add(G.sphere(12, 8), '#ffd23a', [0.115 * sd, 0.515, 0.22], null, 0.028).fx(0, 0.5);
    }
    r.fx(0, 0);
    K.face(r, [hx, hy, hz], HR, yuz({ bone: 'head', tilt: 0.15, ex: 0.078, ey: 0.035, er: 0.07, iris: '#2a4a1a', skin: mixc(gA, gL, 0.2), browCol: '#2a5a20', browY: 1.36,
      mouthY: -0.08, mouthW: 0.075, heartY: 1.2, heartX: 1.45, heartS: 0.3 }));
    // kelebek kanatları: yalnız neşeli hâlde (mood 2)
    const wc = (top) => (x, y, z) => {
      const ax = Math.abs(x), rr = Math.hypot(ax - 0.04, z + 0.15);
      out.copy(top ? col('#ffb347') : col('#ff7ac8')).lerp(top ? col('#ff6fb5') : col('#9b7bff'), sm((rr - 0.12) / 0.32));
      const dot = top ? Math.hypot(ax - 0.42, z - 0.15) : Math.hypot(ax - 0.27, z + 0.38);
      out.lerp(col('#ffffff'), sm((0.06 - dot) / 0.02));
      return out.lerp(col('#5a2a7a'), sm((rr - (top ? 0.5 : 0.36)) / 0.05) * 0.85);   // koyu kenar
    };
    r.mood = 2;
    for (const sd of [-1, 1]) {
      r.on(sd > 0 ? 'wingL' : 'wingR').fx(0.2, 0.6);
      for (const top of [true, false]) {
        const geo = K.extrude('bkBf' + (top ? 'T' : 'B') + sd, bfWing(top, sd), 0.012, 0.006, 12);
        r.add(geo, wc(top), [0.04 * sd, 0.3, -0.15], [PI / 2, 0, 0]);
      }
      r.fx(0, 0);
    }
    r.mood = 0;
    r.on('head').mark('muzzle', [0, 0.2, 0.4]);
    return { height: 0.55, glowC: col('#b8f07a'), hide: [],
      mat: { rough: 0.35, sss: col('#c8ff9a').multiplyScalar(0.06), rim: '#f4ffd8', rimK: 0.32, rimP: 2.2, wob: 0.012, wobF: 5, wobS: 5 } };
  }
  function animTirtil(m, dt, st, s) {
    const B = m.B;
    // kıvrılıp açılma: orta boğumlar kalkar (kemer), baş ve kuyruk yerde; ilerledikçe dalga
    s.hopK = damp(s.hopK || 0, st.move > 0.05 ? 1 : 0, 6, dt);
    if (s.hopK > 0.02 || (s.hop % 1) > 0.03) s.hop += dt * (1.8 + 0.8 * s.mv);
    const u = s.hop % 1, A = s.hopK;
    let arch = Math.sin(PI * u) * A * 0.12, curl = 0, lift = 0;
    const br = breath(s, 2.6);
    if (st.windup >= 0) { const w = sm(st.windup * 1.3); curl = w; B.body.position.x += Math.sin(s.t * 50) * 0.01 * st.windup; }
    if (st.attack >= 0) {
      if (st.attack < 1) { const kk = Math.sin(PI * st.attack); lift = 0.25 * kk; curl = Math.max(0, 1 - st.attack * 3); arch -= 0.04 * kk; }
      else arch += 0.02;
    }
    // her boğum: kemer yüksekliği (ortada en çok) + nefes
    const prof = [0.15, 0.7, 1, 0.7, 0.15];
    for (let i = 0; i < 5; i++) {
      const b = B['s' + i], w = prof[i];
      b.position.y += arch * w + 0.008 * Math.sin(s.t * 2.6 + i * 0.9);
      b.position.z += (i < 2 ? -1 : i > 2 ? 1 : 0) * Math.sin(PI * u) * A * 0.03 * Math.abs(i - 2);
      b.scale.setScalar(1 + 0.03 * Math.sin(s.t * 2.6 - i * 0.8) + 0.02 * br);
    }
    if (curl > 0) {   // C gibi kıvrılır: baş ve kuyruk yukarı, orta yere
      B.s0.position.y += 0.1 * curl; B.s0.position.z -= 0.06 * curl; B.s4.position.y += 0.16 * curl; B.s4.position.z += 0.1 * curl;
      B.s3.position.y += 0.07 * curl; B.s1.position.y += 0.03 * curl; B.head.rotation.x -= 0.4 * curl;
    }
    B.head.rotation.x += -0.15 * Math.sin(PI * u) * A + Math.sin(s.t * 1.8 + s.ph) * 0.05;
    B.head.rotation.z = Math.sin(s.t * 1.4 + s.ph) * 0.08;
    B.body.position.y += lift;
    { const g = gag(s, st, dt, 2.4, 5);   // bekleme: başını kaldırıp sağa sola sallanır (dans), kuyruğunu sallar
      if (g >= 0) { const d = bumpU(g, 0, 1); B.s0.position.y += 0.08 * d; B.head.rotation.x -= 0.3 * d; B.head.rotation.z += Math.sin(g * 18) * 0.25 * d;
        B.s1.position.y += 0.04 * d; B.s4.position.x += Math.sin(g * 18) * 0.05 * d; s.eyeK = 1 - 0.3 * d; }
    }
    // kelebek: neşelenince kanatlar çırpar, gövde havalanır (st.dying 0 → 1)
    if (s.mood === 'happy') {
      const d = st.dying >= 0 ? st.dying : 0, fly = sm((d - 0.08) / 0.5);
      const f = Math.sin(s.t * (st.dying >= 0 ? 16 : 6));
      B.wingL.rotation.z = 0.5 + 0.75 * f; B.wingR.rotation.z = -0.5 - 0.75 * f;
      B.wings.rotation.x = -0.15;
      B.body.position.y += fly * 1.6 + Math.sin(s.t * 8) * 0.04 * fly; B.body.position.z += 0.3 * fly;
      B.body.rotation.x = -0.35 * fly;
      for (let i = 1; i < 5; i++) B['s' + i].position.y -= 0.03 * i * fly;   // gövde sallanarak asılı
    }
    boing(s, st, dt, B.s2);
  }

  // ════════════════ BOSS: UYKUCU ARI KRALİÇE ════════════════
  // ~2,6 m peluş bombus arısı: pofuduk sarı-kahve çizgili tombul gövde, krem tüylü kraliçe yakası, yuvarlak sarı başta kocaman
  // uykulu gülen gözler, yamuk minik altın taç, top uçlu antenler, sırtta pırpır eden yuvarlak küçük kanatlar, tombul kollar,
  // sağ elinde bal kaşığı asası, arkada iğne yerine pofuduk krem bir kuyruk püskülü (sivri hiçbir şey yok).
  // Faz tepkileri (base kefirdev): roar (gerinip kocaman esner), summon (asasını sallayıp zıplar), shake (yanakları şişer),
  // geyser (polen bulutu üfler), slam (hop!), bubbles (bal damlaları tükürür), idle (ara sıra kocaman esneme; yarı candan sonra sık).
  // Feza'yı görmeden: uyur (gözler kapalı, horlar, "z z z").
  const AK = { body: [0, 0.92, 0], bodyS: [1.0, 0.9, 0.94], head: [0, 1.82, 0.12], HR: 0.7 };
  function fuzzGeo(key, amp, f) {
    const w = K.sN(56, 28), h = K.sN(40, 20);
    return K.gx('bkFuzz' + key + '@' + w, () => {
      const g = new THREE.SphereGeometry(1, w, h), p = g.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        v.multiplyScalar(1 + amp * (K.fbm3(v.x * f + 3, v.y * f, v.z * f + 7) - 0.5));
        p.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      return K.seamNormals(g);
    });
  }
  function zGeo() {
    return K.extrude('bkZ', () => { const s2 = new THREE.Shape(); s2.moveTo(-0.5, 0.5); s2.lineTo(0.5, 0.5); s2.lineTo(0.5, 0.3); s2.lineTo(-0.15, -0.3); s2.lineTo(0.5, -0.3); s2.lineTo(0.5, -0.5);
      s2.lineTo(-0.5, -0.5); s2.lineTo(-0.5, -0.3); s2.lineTo(0.15, 0.3); s2.lineTo(-0.5, 0.3); s2.lineTo(-0.5, 0.5); return s2; }, 0.18, 0.06, 2, 0.4);
  }
  function buildAri(r, o) {
    const Y = col('#ffc928'), YL = col('#ffe680'), YD = col('#f0a018'), D = col('#4a3226'), DL = col('#6e4c3a'), cream = col('#fff4dc'), out = new THREE.Color();
    const C = AK.body, S = AK.bodyS, HC = AK.head, HR = AK.HR;
    r.bone('body', 'root', [0, 0.1, 0]);
    r.bone('head', 'body', [0, 1.55, 0.05]);
    r.bone('cheekL', 'head', [0.42, 1.66, 0.62]); r.bone('cheekR', 'head', [-0.42, 1.66, 0.62]);
    r.bone('antL', 'head', [0.22, 2.38, 0.2]); r.bone('antR', 'head', [-0.22, 2.38, 0.2]);
    r.bone('crown', 'head', [0.05, 2.46, 0.06]);
    r.bone('wingL', 'body', [0.35, 1.45, -0.62]); r.bone('wingR', 'body', [-0.35, 1.45, -0.62]);
    r.bone('armL', 'body', [0.82, 1.08, 0.2]); r.bone('armR', 'body', [-0.82, 1.08, 0.2]);
    r.bone('dipper', 'armR', [-1.12, 0.84, 0.48]);
    r.bone('footL', 'root', [0.4, 0.12, 0.45]); r.bone('footR', 'root', [-0.4, 0.12, 0.45]);
    r.bone('tail', 'body', [0, 0.62, -0.88]);
    r.bone('pollen', 'head', [0, 1.6, 0.8]);
    r.bone('drop', 'head', [0, 1.55, 0.8]);
    r.bone('zz', 'head', [0.55, 2.35, 0.2]);
    r.bone('yawn', 'head', [0, 1.55, 0.78]);
    // gövde: pofuduk, yumuşak geçişli yatay şeritler (sarı - koyu kahve), tüy dokusu
    const stripes = (x, y, z) => {
      const ly = (y - C[1]) / S[1], s0 = Math.sin((ly + 0.18) * PI * 1.55);
      const dk = sm((s0 - 0.05) / 0.35) * sm((0.72 - ly) / 0.2);
      out.copy(YD).lerp(Y, sm((ly + 0.9) / 0.5)).lerp(YL, 0.3 * sm((ly - 0.4) / 0.4));
      out.lerp(mixc(D, DL, 0.3 + 0.4 * K.fbm3(x * 9, y * 9, z * 9)), dk);
      return out.lerp(col('#ffffff'), 0.08 * K.fbm3(x * 22, y * 22, z * 22));
    };
    r.on('body').fx(0, 0, 1, 0).add(fuzzGeo('B', 0.06, 7), stripes, C, null, S);
    // tüy topakları (kenar silüeti pofuduk görünsün)
    r.fx(0, 0, 1, 1);
    const N = 46, ga = PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const yy = 1 - (i + 0.5) / N * 2, rr = Math.sqrt(1 - yy * yy), a = i * ga, dx = Math.sin(a) * rr, dz = Math.cos(a) * rr;
      if (yy > 0.75 || yy < -0.7) continue;
      if (dz > 0.55 && Math.abs(dx) < 0.5 && yy > -0.2) continue;   // göğüs (yaka önü) açık kalsın
      const p = [C[0] + dx * S[0] * 0.95, C[1] + yy * S[1] * 0.95, C[2] + dz * S[2] * 0.95], rad = 0.12 + 0.05 * hash(i, 4, 2);
      r.add(G.sphere(8, 6), stripes(p[0], p[1], p[2]).clone(), p, null, [rad, rad * 0.85, rad]);
    }
    r.fx(0, 0);
    // kraliçe yakası: krem pofuduk halka
    r.fx(0, 0, 1, 1);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU, rr = 0.72;
      r.add(G.sphere(12, 8), mixc(cream, '#ffffff', 0.3 * hash(i, 1, 1)), [Math.sin(a) * rr, 1.55 + 0.03 * (i & 1), Math.cos(a) * rr * 0.92 + 0.04], null, [0.2, 0.15, 0.2]);
    }
    r.fx(0, 0);
    // pofuduk kuyruk püskülü (iğne yok)
    r.on('tail').fx(0, 0, 1, 1).add(G.sphere(16, 12), cream, [0, 0.6, -0.98], null, 0.18);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; r.add(G.sphere(10, 6), cream, [Math.sin(a) * 0.13, 0.6 + Math.cos(a) * 0.13, -0.99], null, 0.1); }
    r.fx(0, 0);
    // kanatlar: yuvarlak, açık mavi-beyaz, yarı parlak; ikişer (büyük + küçük)
    for (const sd of [-1, 1]) {
      r.on(sd > 0 ? 'wingL' : 'wingR').fx(0.3, 0.9);
      const wg = (x, y, z) => out.copy(col('#e8f6ff')).lerp(col('#b8dcff'), sm((Math.hypot(x - sd * 0.35, y - 1.45) - 0.1) / 0.5));
      r.add(G.sphere(20, 12), wg, [sd * 0.78, 1.82, -0.75], [0.35, sd * 0.3, sd * 0.7], [0.5, 0.34, 0.035]);
      r.add(G.sphere(16, 10), wg, [sd * 0.7, 1.4, -0.82], [0.2, sd * 0.3, sd * 0.25], [0.34, 0.24, 0.03]);
      r.fx(1, 0).add(G.sphere(8, 6), hdr('#ffffff', 1.3), [sd * 0.92, 1.95, -0.72], [0.35, sd * 0.3, sd * 0.7], [0.12, 0.05, 0.01]);
      r.fx(0, 0);
    }
    // kollar (tombul sarı) + koyu yuvarlak eller; sağ elde bal kaşığı
    for (const sd of [-1, 1]) {
      r.on(sd > 0 ? 'armL' : 'armR').fx(0, 0, 1, 0);
      r.seg([0.82 * sd, 1.08, 0.2], [1.08 * sd, 0.88, 0.42], 0.17, Y, 0.15, 14);
      r.fx(0, 0.4).add(G.sphere(16, 12), D, [1.12 * sd, 0.84, 0.48], null, [0.16, 0.15, 0.15]);
      r.add(G.sphere(10, 8), D, [1.03 * sd, 0.92, 0.6], null, 0.07);
      r.fx(0, 0);
    }
    // bal kaşığı (tahta sap + oluklu baş + damlayan bal)
    r.on('dipper').fx(0, 0.4);
    r.seg([-1.12, 0.62, 0.5], [-1.12, 1.55, 0.5], 0.035, col('#c88a4a'), 0.035, 8);
    r.add(G.sphere(10, 8), col('#c88a4a'), [-1.12, 0.6, 0.5], null, 0.05);
    for (let k = 0; k < 4; k++) r.add(G.cyl(1, 1, 18), k & 1 ? col('#a86a32') : col('#d89a52'), [-1.12, 1.6 + k * 0.07, 0.5], null, [0.12 - 0.012 * Math.abs(k - 1.5), 0.06, 0.12 - 0.012 * Math.abs(k - 1.5)]);
    r.add(G.sphere(12, 8), col('#d89a52'), [-1.12, 1.86, 0.5], null, [0.08, 0.05, 0.08]);
    r.fx(0.25, 1.0).add(G.sphere(14, 10), hdr('#ffb020', 1.05), [-1.12, 1.6, 0.5], null, [0.14, 0.1, 0.14]);
    r.add(G.sphere(12, 8), hdr('#ffb020', 1.05), [-1.12, 1.5, 0.52], null, [0.05, 0.08, 0.05]);
    r.fx(0, 0);
    // ayaklar
    for (const sd of [-1, 1]) { r.on(sd > 0 ? 'footL' : 'footR'); shoe(r, 0.4 * sd, 0.1, 0.5, 0.22, 0.13, 0.26, D, 0.4); }
    // baş: yuvarlak sarı, tepesinde kahve tüy perçemi; yanaklar ayrı kemikte (şişer)
    const hg = K.vgrad(HC[1] - HR, HC[1] + HR, [[0, YD], [0.45, Y], [1, YL]]);
    r.on('head').fx(0, 0, 1, 0).add(fuzzGeo('H', 0.035, 6), hg, HC, null, [HR, HR * 0.95, HR * 0.93]);
    r.fx(0, 0.2, 1, 1);
    for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.35; r.add(G.sphere(12, 8), mixc(D, DL, 0.3), [Math.sin(a) * 0.32, 2.42 - Math.abs(k - 2) * 0.04, 0.0 + Math.cos(a) * 0.1 - 0.05], null, [0.14, 0.1, 0.14]); }
    r.add(G.sphere(12, 8), DL, [0.04, 2.55, 0.08], [0, 0, -0.5], [0.06, 0.12, 0.06]);   // kıvrık perçem
    r.fx(0, 0);
    for (const sd of [-1, 1]) {
      r.on(sd > 0 ? 'cheekL' : 'cheekR').fx(0, 0, 1, 0).add(G.sphere(18, 12), mixc(Y, YL, 0.35), [0.42 * sd, 1.66, 0.6], null, [0.2, 0.16, 0.13]);
      r.fx(0.35, 0).add(G.sphere(14, 8), '#ff8fb0', [0.44 * sd, 1.67, 0.72], [0, sd * 0.35, 0], [0.13, 0.08, 0.03]);
      r.fx(0, 0);
    }
    K.face(r, HC, HR, yuz({ bone: 'head', tilt: 0.12, ex: 0.24, ey: 0.06, er: 0.17, iris: '#6a3a12', skin: mixc(Y, YL, 0.3), browCol: '#6a3a1a', browY: 1.4,
      mouthY: -0.24, mouthW: 0.17, mouthPivot: true, noBlush: true, heartY: 0.95, heartX: 1.2, heartS: 0.26, blushCol: '#ff8fb0' }));
    // uyku gözleri: huzurlu kapalı ◡ ◡ (uyurken / esnerken; açık gözler o an gizlenir) — kaşlar havada kalır, kaş çatma yok
    r.bone('sleepE', 'head', [0, HC[1] + 0.06, HC[2] + HR * 0.9]);
    r.on('sleepE').push(HC, [-0.12, 0, 0]);
    for (const sd of [-1, 1]) {
      const [p, q] = onSphere(sd * 0.24, 0.03, HR, -0.005); r.push(p, q);
      r.push([0, 0, 0], [0, 0, PI]); K.eyeClosed(r, { er: 0.15, happyCol: '#6a3a1a' }); r.pop();
      r.fx(0, 0.3).seg([sd * 0.13, -0.02, 0.01], [sd * 0.19, -0.07, 0.0], 0.012, '#6a3a1a', 0.008, 5);   // minik kirpik
      r.pop().fx(0, 0);
    }
    r.pop();
    // esneme ağzı: kocaman "O" (koyu iç, pembe dil) — yalnız esnerken görünür
    r.on('yawn').push(HC, [-0.12, 0, 0]);
    { const [p, q] = onSphere(0, -0.25, HR, 0.01); r.push(p, q);
      r.fx(0, 0.5).add(G.sphere(18, 12), '#6a1f3c', [0, 0, 0], null, [0.12, 0.15, 0.06]);
      r.add(G.sphere(14, 10), '#ff7fa4', [0, -0.08, 0.03], null, [0.08, 0.05, 0.04]);
      r.fx(0, 0.3).add(G.torus(TAU, 0.18, 20), mixc(Y, '#ff9a6a', 0.3), [0, 0, 0.01], null, [0.125, 0.155, 0.08]);
      r.pop().fx(0, 0); }
    r.pop();
    // antenler: kavisli, pofuduk ponponlu
    for (const sd of [-1, 1]) {
      r.on(sd > 0 ? 'antL' : 'antR').fx(0, 0.3);
      const a = [0.22 * sd, 2.38, 0.2], e = [0.34 * sd, 2.7, 0.3], t = [0.48 * sd, 2.82, 0.4];
      r.seg(a, e, 0.035, D, 0.03, 8); r.seg(e, t, 0.03, D, 0.026, 8);
      r.fx(0, 0, 1, 1).add(G.sphere(14, 10), Y, t, null, 0.1);
      for (let k = 0; k < 5; k++) { const ang = k / 5 * TAU; r.add(G.sphere(8, 6), YL, [t[0] + Math.sin(ang) * 0.07, t[1] + Math.cos(ang) * 0.07, t[2] + 0.02], null, 0.05); }
      r.fx(0, 0);
    }
    // minik yamuk taç
    K.crown(r.on('crown'), [0.05, 2.43, 0.06], 0.75);
    // polen bulutu (geyser'de ağızdan öne doğru), bal damlası (bubbles'ta ağızda), "z z z" (uyurken)
    r.on('pollen').fx(0.35, 0, 0, 1);
    for (let i = 0; i < 22; i++) {
      const u = (i + 0.5) / 22, d = 0.2 + u * 1.9, sp = 0.12 + u * 0.75, a = i * 2.39996;
      const p = [Math.sin(a) * sp * hash(i, 2, 9), 1.55 + Math.cos(a) * sp * 0.6 * hash(i, 5, 3) - u * 0.35, 0.8 + d];
      r.add(G.sphere(10, 8), mixc('#fff3a0', '#ffd23a', hash(i, 7, 7)), p, null, 0.08 + 0.12 * u * (0.6 + 0.4 * hash(i, 3, 3)));
    }
    r.fx(1, 0);
    for (let i = 0; i < 10; i++) { const a = i * 1.7, u = (i + 0.5) / 10; r.add(G.octa(), hdr('#fff8c0', 1.6), [Math.sin(a) * (0.2 + u * 0.6), 1.6 + Math.cos(a) * 0.3 * u, 1.0 + u * 1.7], [a, a, 0], 0.035); }
    r.on('drop').fx(0.2, 1).add(G.sphere(16, 12), hdr('#ffae1a', 1.1), [0, 1.5, 0.86], null, [0.11, 0.13, 0.11]);
    r.fx(1, 0).add(G.sphere(8, 6), hdr('#ffffff', 1.6), [-0.04, 1.55, 0.95], null, 0.025);
    r.on('zz').fx(0.6, 0);
    const zg = zGeo();
    r.add(zg, '#9ab8ff', [0.55, 2.45, 0.2], [0, 0, 0.15], 0.12);
    r.add(zg, '#b8ccff', [0.78, 2.7, 0.2], [0, 0, -0.1], 0.16);
    r.add(zg, '#d0deff', [1.05, 3.0, 0.2], [0, 0, 0.12], 0.21);
    r.fx(0, 0);
    r.on('head').mark('muzzle', [0, 1.55, 0.9]);
    return { height: 2.6, glowC: col('#ffd84a'), glowK: 0.6, dieHop: 0.1, hide: ['pollen', 'drop', 'zz', 'yawn', 'sleepE'],
      portrait: { cx: 0, cy: 1.85, cz: 0.4, rad: 1.15 },
      tex: (typeof TEX !== 'undefined' && TEX && TEX.fabric ? (TEX.rep ? TEX.rep('fabric', 2, 2) || TEX.fabric : TEX.fabric) : undefined),
      mat: { rough: 0.85, ns: 0.6, sss: col('#ffe0a0').multiplyScalar(0.06), rim: '#fff4c8', rimK: 0.4, rimP: 2.0, wob: 0.006, wobF: 5, wobS: 3 } };
  }
  const bph = st => (st.dying >= 0 ? 'dying' : (st.phase || 'idle'));
  const bpt = st => clamp(+st.phaseT || 0, 0, 1);
  function bossHalf(m) {   // yarı candan az mı? (GAME.boss bu model ise)
    try { const b = typeof GAME !== 'undefined' && GAME && GAME.boss; if (b && b.m === m && b.maxHp) return b.hp < b.maxHp * 0.5; } catch (e) { /* yok say */ }
    return false;
  }
  function animAri(m, dt, st, s) {
    const B = m.B, ph = bph(st), t = bpt(st), br = Math.sin(s.t * 1.6 + s.ph);
    let sy = 1 + 0.02 * br, sxz = 1 - 0.012 * br, y = 0, z = 0, rx = 0, rz = 0, ry = 0, armUp = 0, wave = 0, hopY = 0;
    let flapF = 9, flapA = 0.22, cheek = 0, yawn = 0, pollen = 0, drop = 0, zz = 0, sleep = 0, dip = 0, headX = 0, headZ = 0;
    const calm = ph === 'idle' && !(st.move > 0.05);
    s.preK = damp(s.preK || 0, st.aggro === false && ph === 'idle' && !(st.move > 0.05) && !(st.dying >= 0) ? 1 : 0, 3, dt);
    const pre = s.preK;
    // yürüyüş: paytak paytak, kanatlar hızlı
    s.wk = damp(s.wk || 0, ph === 'move' || (ph === 'idle' && st.move > 0.05) ? 1 : 0, 5, dt);
    if (s.wk > 0.01) s.walk += dt * 5 * s.wk;
    const wa = Math.sin(s.walk) * 0.08 * s.wk, wy = Math.abs(Math.sin(s.walk)) * 0.07 * s.wk;
    rz += wa; y += wy; flapF += 10 * s.wk;
    B.footL.position.y += Math.max(0, Math.sin(s.walk)) * 0.14 * s.wk; B.footR.position.y += Math.max(0, -Math.sin(s.walk)) * 0.14 * s.wk;
    B.footL.position.z += Math.cos(s.walk) * 0.1 * s.wk; B.footR.position.z -= Math.cos(s.walk) * 0.1 * s.wk;
    wave += Math.sin(s.walk) * 0.2 * s.wk;
    switch (ph) {
      case 'shake': {   // hazırlık: derin nefes, yanaklar balon gibi şişer, gövde kabarır, kıpır kıpır
        const k = sm(t / 0.3) * (1 - sm((t - 0.94) / 0.06)), f = 16 + 10 * t;
        cheek = sm(t / 0.7) * k; sxz *= 1 + 0.08 * k * t; sy *= 1 + 0.04 * k;
        rz += Math.sin(s.t * f) * 0.03 * k; rx -= 0.12 * k; headX -= 0.12 * k;
        armUp = 0.25 * k; s.eyeK = lerp(1, 1.2, k); s.browY = 0.03 * k; flapF = 20; flapA = 0.3;
        if (B.mouth) B.mouth.scale.setScalar(Math.max(0.0001, 1 - 0.7 * k));
        break;
      }
      case 'geyser': {   // "füüü": öne eğilip polen bulutu üfler (0.14–0.84), yanaklar yavaşça söner
        const on = sm((t - 0.06) / 0.1) * (1 - sm((t - 0.84) / 0.12));
        cheek = (1 - sm((t - 0.1) / 0.75)) * 0.9; pollen = sm((t - 0.1) / 0.12) * (1 - sm((t - 0.8) / 0.12));
        rx += 0.22 * on; z += 0.1 * on; headX += 0.12 * on; sxz *= 1 - 0.05 * on; armUp = 0.15 * on; wave = -0.2 * on;
        s.mouthO = on; s.eyeK = lerp(1, 0.6, on); flapF = 24; flapA = 0.32;
        rz += Math.sin(s.t * 30) * 0.015 * on;
        break;
      }
      case 'bubbles': {   // şişer, sonra beş bal damlası tükürür (soldan sağa dönerek)
        const k = sm(t / 0.3) * (1 - sm((t - 0.88) / 0.12));
        sxz *= 1 + 0.05 * k; rx -= 0.06 * k; ry = lerp(-0.34, 0.34, sm((t - 0.36) / 0.48)) * k; cheek = 0.4 * k;
        for (const c of [0.4, 0.5, 0.6, 0.7, 0.8]) {
          const p = bump(t - c + 0.02, 0.08); rx += 0.1 * p; sy *= 1 - 0.04 * p; s.mouthO = Math.max(s.mouthO, p); cheek -= 0.3 * p;
          drop = Math.max(drop, bump(t - c + 0.07, 0.08));
        }
        if (t < 0.38) drop = Math.max(drop, sm(t / 0.3) * 0.6);
        armUp = 0.2 * k;
        break;
      }
      case 'slam': {   // çömel, büyük bir hop (kanatlar vızır vızır), 0.8'de pofff diye iner
        if (t < 0.2) { const k = sm(t / 0.2); sy *= 1 - 0.18 * k; sxz *= 1 + 0.08 * k; armUp = 0.3 * k; flapF = 18; }
        else if (t < 0.8) {
          const u = (t - 0.2) / 0.6, e = Math.abs(Math.cos(PI * u));
          hopY = Math.sin(PI * u) * 1.3; sy *= 1 + 0.07 * e; sxz *= 1 - 0.04 * e; armUp = 0.4 + 0.6 * Math.sin(PI * u);
          flapF = 34; flapA = 0.5; wave = Math.sin(s.t * 20) * 0.5 * Math.sin(PI * u); s.eyeK = 1 + 0.2 * Math.sin(PI * u);
          B.footL.position.y += 0.1 * Math.sin(PI * u); B.footR.position.y += 0.1 * Math.sin(PI * u);
        } else { const u = (t - 0.8) / 0.2, k = Math.sin(PI * Math.min(1, u * 1.3)) * (1 - 0.5 * u); sy *= 1 - 0.2 * k; sxz *= 1 + 0.12 * k; s.eyeK = 1 - 0.4 * k; }
        break;
      }
      case 'summon': {   // asasını sallayarak üç kez zıplar: "uğur böcekleri, gelin!"
        const k = sm(t / 0.15) * (1 - sm((t - 0.85) / 0.15)), b = Math.abs(Math.sin(t * PI * 3));
        y += b * 0.28 * k; sy *= 1 + 0.06 * (b - 0.5) * k; armUp = k; wave = Math.sin(t * PI * 8) * k; dip = k;
        flapF = 26; flapA = 0.4; s.mouthW = k;
        break;
      }
      case 'roar': {   // uyanış: gerinip kocaman esner (kollar havaya), sonra gözlerini ovuşturup gülümser
        const st2 = sm(t / 0.25) * (1 - sm((t - 0.75) / 0.2));
        yawn = bump(t - 0.1, 0.6); armUp = st2; sy *= 1 + 0.08 * st2; sxz *= 1 - 0.03 * st2; rx -= 0.12 * st2; headX -= 0.25 * yawn;
        s.eyeK = lerp(1, 0.25, yawn); zz = yawn * 0.8; flapF = 14; flapA = 0.35;
        const rub = bump(t - 0.7, 0.25); wave = Math.sin(s.t * 18) * 0.4 * rub; s.mouthW = Math.max(s.mouthW, sm((t - 0.82) / 0.1));
        break;
      }
      case 'blow': case 'hiccup': {   // (kullanılmıyor; gelirse küçük bir hıçkırık/üfleme)
        const hk = bump((t * 3) % 1, 0.3);
        y += 0.15 * hk; s.mouthO = hk; s.eyeK = 1 + 0.2 * hk;
        break;
      }
      case 'dying': armUp = 0.9; wave = Math.sin(s.t * 10); flapF = 30; flapA = 0.5; break;   // çok mutlu: el sallar, kanatlar pırpır
    }
    // uyku (Feza'yı görmeden): gözler kapalı, derin horlama nefesi, baş öne düşer, "z z z"
    if (pre > 0.01) {
      sleep = pre;
      const sn = Math.sin(s.t * 1.3);
      sxz *= 1 + 0.04 * sn * pre; sy *= 1 + 0.03 * sn * pre; headX += 0.18 * pre; headZ += 0.08 * pre;
      s.eyeK = lerp(s.eyeK, 0.08, pre); zz = Math.max(zz, pre); flapA *= 1 - 0.8 * pre; flapF = lerp(flapF, 3, pre);
      if (B.mouth) B.mouth.scale.y *= 1 - 0.3 * pre * (0.5 + 0.5 * sn);
    }
    // bekleme: ara sıra kocaman esneme (yarı candan sonra daha sık); esnemeler arası göz kapakları ağır
    if (ph === 'idle' && pre < 0.05) {
      const half = bossHalf(m), drowsy = half ? 0.65 : 0.82;
      s.eyeK = Math.min(s.eyeK, drowsy + 0.05 * Math.sin(s.t * 0.7));
      const ya = act(s, 'yawnT', dt, half ? 3.5 : 7, half ? 6 : 12, 2.4, calm);
      if (ya >= 0) {
        const o = bump(ya - 0.1, 0.75);
        yawn = Math.max(yawn, o); armUp = Math.max(armUp, 0.8 * o); sy *= 1 + 0.07 * o; rx -= 0.1 * o; headX -= 0.25 * o; s.eyeK = lerp(s.eyeK, 0.12, o);
        zz = Math.max(zz, 0.7 * bump(ya - 0.5, 0.5)); headZ += Math.sin(ya * 6) * 0.06 * o;
      }
    }
    // hasar: gözler sıkılır, yanaklar titrer
    if (st.hurt > 0 && ph !== 'dying') { const h = st.hurt * st.hurt; s.eyeK = Math.min(s.eyeK, 1 - 0.5 * h); headZ += Math.sin(s.t * 40) * 0.05 * h; flapF = 30; }
    // yarıda kesilen hop: yerçekimiyle iner
    if (ph === 'slam') { if (dt > 0) s.airV = clamp(((s.airY || 0) - hopY) / dt, -8, 8); s.airY = hopY; }
    else if (s.airY > 0) { s.airV = (s.airV || 0) + 16 * dt; s.airY = Math.max(0, s.airY - s.airV * dt); if (s.airY <= 0) { s.airV = 0; s.landT = 1; } }
    y += s.airY || 0;
    if (s.landT > 0) { const k = Math.sin(PI * (1 - s.landT)); sy *= 1 - 0.18 * k; sxz *= 1 + 0.1 * k; s.landT = Math.max(0, s.landT - dt / 0.3); }
    // uygula
    B.body.position.y += y; B.body.position.z += z;
    B.body.scale.set(sxz, sy, sxz); B.body.rotation.set(rx, ry, rz);
    const jy = Math.max(0, y - wy); B.footL.position.y += jy; B.footR.position.y += jy;
    B.head.rotation.x = headX + Math.sin(s.t * 1.1 + s.ph) * 0.03; B.head.rotation.z = headZ + Math.sin(s.t * 0.9 + s.ph) * 0.04;
    const f = Math.sin(s.t * flapF * 1.0);
    B.wingL.rotation.z = -0.1 + flapA * f; B.wingR.rotation.z = 0.1 - flapA * f;
    B.wingL.rotation.y = 0.15 * f * flapA; B.wingR.rotation.y = -0.15 * f * flapA;
    const sw = Math.sin(s.t * 1.5 + s.ph) * 0.06;
    B.armL.rotation.z = 0.05 + sw + 1.5 * armUp + 0.3 * wave; B.armR.rotation.z = -(0.05 + sw + 1.4 * armUp - 0.3 * wave);
    B.armL.rotation.x = -0.3 * armUp; B.armR.rotation.x = -0.3 * armUp;
    B.dipper.rotation.z = 0.25 * dip * Math.sin(s.t * 12);
    B.antL.rotation.z = -0.08 + Math.sin(s.t * 2.1 + s.ph) * 0.1 - 0.4 * sleep; B.antR.rotation.z = 0.08 - Math.sin(s.t * 2.3 + s.ph) * 0.1 + 0.4 * sleep;
    B.antL.rotation.x = 0.3 * sleep + 0.2 * yawn; B.antR.rotation.x = 0.3 * sleep + 0.2 * yawn;
    B.crown.rotation.z = -0.18 + 0.1 * sleep + Math.sin(s.t * 1.3) * 0.03; B.crown.position.y += 0.03 * Math.abs(Math.sin(s.t * flapF * 0.5)) * (ph === 'slam' ? 1 : 0);
    B.tail.rotation.y = Math.sin(s.t * 2.4 + s.ph) * 0.15; B.tail.rotation.x = Math.sin(s.t * 1.7) * 0.06;
    const ch = Math.max(0, cheek);
    B.cheekL.scale.setScalar(1 + 0.75 * ch); B.cheekR.scale.setScalar(1 + 0.75 * ch);
    B.cheekL.position.x += 0.07 * ch; B.cheekR.position.x -= 0.07 * ch;
    if (s.mood === 'happy') yawn = 0;
    // (resetPose her karede ölçeği 1'e döndürür: gizli parçalar her karede yeniden gizlenir)
    if (yawn > 0.01) { B.yawn.scale.setScalar(0.3 + 0.7 * yawn); B.yawn.scale.y *= 0.6 + 0.6 * yawn; if (B.mouth) B.mouth.scale.setScalar(0.0001); }
    else B.yawn.scale.setScalar(0.0001);
    if (pollen > 0.001) {
      const w = Math.sin(s.t * 11), w2 = Math.sin(s.t * 7.3 + 1);
      B.pollen.scale.set(pollen * (1 + 0.1 * w), pollen * (1 + 0.1 * w2), Math.max(0.0001, pollen * (1 + 0.08 * w2)));
      B.pollen.rotation.z = s.t * 1.5; B.pollen.rotation.x = 0.05 * w;
    } else B.pollen.scale.setScalar(0.0001);
    B.drop.scale.setScalar(drop > 0.01 ? drop : 0.0001);
    if (zz > 0.01 && s.mood !== 'happy') {
      const zt = (s.t * 0.5) % 1;
      B.zz.scale.setScalar(zz * (0.9 + 0.1 * Math.sin(s.t * 3))); B.zz.position.y += 0.15 * zt; B.zz.position.x += 0.05 * Math.sin(s.t * 2); B.zz.rotation.z = 0.08 * Math.sin(s.t * 1.7);
    } else B.zz.scale.setScalar(0.0001);
    // gözler neredeyse kapalıysa: sıkılmış göz yerine huzurlu ◡ ◡ uyku gözleri, kaşlar yukarıda
    const shut = s.mood !== 'happy' ? sm((0.4 - s.eyeK) / 0.15) : 0;
    if (shut > 0.5) { s.eyeK = 0.0001; s.eyeW = 0.0001; s.browY = Math.max(s.browY, 0.02); B.sleepE.scale.setScalar(1); }
    else B.sleepE.scale.setScalar(0.0001);
  }

  // ════════════════ Kayıt ════════════════
  const RARE_STATS = { hp: 14, dmg: 2, speed: 3.0, xp: 30, gold: 12, aggro: 7 };
  const T = [
    // id, ad, base, saldiri, stats, kurucu, anim, lod, ilkSoz, nadir
    ['bahceSalyangozu', 'Bahçe Salyangozu', 'goblin', 'yuvarlanan', { eliteAd: 'Kocaman Salyangoz', hp: 26, dmg: 5, speed: 2.2, r: 0.48, height: 0.95, atkRange: 2.4, atkCd: 2.3, windup: 0.85, aggro: 9, trailCol: '#e8fff4' }, buildSalyangoz, animSalyangoz, 0.55, 'ilk_salyangoz'],
    ['ugurBocegi', 'Uğur Böceği', 'kopuk', 'uzak', { eliteAd: 'Kocaman Uğur Böceği', hp: 18, dmg: 4, speed: 2.2, r: 0.42, height: 0.9, atkRange: 6.5, range: 6.5, atkCd: 2.8, windup: 0.85, fly: true, hover: 0.8, aggro: 9, shot: { kind: 'jelly', speed: 3.6, r: 0.24, col: '#ff4a5a' } }, buildUgur, animUgur, 0.55, 'ilk_ugurBocegi'],
    ['karinca', 'Minik Karınca', 'goblin', 'yakin', { eliteAd: 'Kocaman Karınca', hp: 22, dmg: 4, speed: 2.7, r: 0.42, height: 0.8, atkRange: 1.05, atkCd: 1.9, windup: 0.75, aggro: 9 }, buildKarinca, animKarinca, 0.55, 'ilk_karinca'],
    ['tirtil', 'Tırtıl', 'yogurt', 'ziplayan', { eliteAd: 'Kocaman Tırtıl', hp: 24, dmg: 4, speed: 2.3, r: 0.45, height: 0.55, atkRange: 2.4, atkCd: 2.1, windup: 0.8, aggro: 8.5 }, buildTirtil, animTirtil, 0.55, 'ilk_tirtil'],
    ['altinUgur', 'Altın Uğur Böceği', 'kopuk', 'uzak', Object.assign({ r: 0.42, height: 0.9, atkRange: 6.5, range: 6.5, atkCd: 3.0, windup: 0.95, fly: true, hover: 0.8, shot: { kind: 'jelly', speed: 3.4, r: 0.24, col: '#ffd23a' } }, RARE_STATS), (r, o) => buildUgur(r, Object.assign({}, o, { rare: true })), animUgur, 0.55, 'ilk_altinUgur', true],
  ];
  const RARE = {};
  for (const [id, ad, base, saldiri, stats, mk, an, lod, ilk, rare] of T) {
    const def = { ad, base, saldiri, stats, ilkSoz: ilk };
    if (HAS) {
      EMODEL.addType(id, mk, an, lod);
      def.model = o => EMODEL.buildRaw(id, o || {});
    }
    if (rare) RARE[id] = true;
    HUYSUZ.type(id, def);
  }
  // Boss
  const bdef = { ad: 'Uykucu Arı Kraliçe', base: 'kefirdev', stats: { r: 1.35, height: 2.6 },
    lines: { giris: 'ariKralice_giris', bitti: 'ariKralice_bitti', yarim: 'ariKralice_yarim' },
    bossKit: { add: 'ugurBocegi', at: [0.66, 0.33], n: [2, 2], col: '#ffd84a', roar: 1.3 } };
  if (HAS) { EMODEL.addType('ariKralice', buildAri, animAri, 0.8); bdef.model = o => EMODEL.buildRaw('ariKralice', o || {}); }
  HUYSUZ.boss('ariKralice', bdef);
  HUYSUZ.zone('balkon', { enemies: { bahceSalyangozu: 3, ugurBocegi: 3, karinca: 4, tirtil: 3, altinUgur: 0.3 }, elites: ['karinca'], boss: 'ariKralice' });

  // Nadir (Altın Uğur Böceği) neşelenince: "gizli" çıkartma + altın şeker + parıltı (konfetiyi 05h zaten saçar)
  let saidRare = 0;
  function hook() {
    if (typeof GAME === 'undefined' || !GAME || !GAME.on) { setTimeout(hook, 250); return; }
    GAME.on('happy', e => {
      if (!e || !RARE[e.type] || e.boss) return;
      try {
        const P = GAME.P;
        if (P && P.cikartmalar && P.cikartmalar[e.type]) P.cikartmalar[e.type].tur = 'gizli';
        if (GAME.addGoldSugar) GAME.addGoldSugar(1);
        if (typeof FX !== 'undefined' && FX) {
          if (FX.burst) { FX.burst('confetti', e.x, 1.0, e.z, { scale: 1.4 }); FX.burst('sparkle', e.x, 1.2, e.z, { color: '#ffd84a', count: 20 }); }
          if (FX.floatText) FX.floatText(e.x, 1.9, e.z, '+1 altın şeker', 'word');
        }
        if (typeof AUD !== 'undefined' && AUD && AUD.say) AUD.say(saidRare++ % 2 ? 'nadir_yakalandi2' : 'nadir_yakalandi', { prio: 2 });
      } catch (err) { console.warn('[balkon] nadir', err); }
    });
  }
  hook();
})();
