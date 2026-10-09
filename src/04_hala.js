/* ── Aytuğ Hala (yer tutucu) ──
   Yapay zekâ yardımcı: Feza'yı takip eder, canı azalınca sarılıp can doldurur, düşünce kaldırır, yolu gösterir,
   Takım Hamlesi'ni doldurur. Hasar almaz. Karakter ajanı modeli ve davranışları bu dosyada serbestçe yeniden yazar;
   07_game'in çağırdığı kancalar (src/SPEC.md › "Dev Ev API" › HALA) aynı adlarla kalmalı.
   Genel ad: HALA. */
const HALA = (() => {
  'use strict';
  const S = { root: null, arm: null, x: 0, z: 0, face: 0, ctx: null, L: null, mode: 'follow', t: 0, modeT: 0,
    point: null, pointT: 0, hugCd: 0, hop: 0, downT: 0 };
  const TEAM_FILL = 1 / 45;   // kendiliğinden dolum (/s); her neşelenen huysuz +0.06, boss +0.3
  const api = { charge: 0 };

  function create(scene) {
    if (S.root) return S.root;
    const g = new THREE.Group(); g.name = 'aytugHala';
    const coat = new THREE.MeshStandardMaterial({ color: 0xe8564a, roughness: 0.85 });
    const legs = new THREE.MeshStandardMaterial({ color: 0x1e2440, roughness: 0.7 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xf2c7a5, roughness: 0.6 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.75 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.55, 6, 14), coat); body.position.y = 1.15; g.add(body);
    for (const sd of [-1, 1]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 4, 8), legs); l.position.set(sd * 0.14, 0.42, 0); g.add(l); }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 14), skin); head.position.y = 1.85; g.add(head);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), hair); bun.position.set(0, 2.08, -0.08); g.add(bun);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); cap.position.y = 1.87; g.add(cap);
    const arm = S.arm = new THREE.Group(); arm.position.set(0.36, 1.5, 0);
    const am = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 4, 8), coat); am.position.y = -0.3; arm.add(am); g.add(arm);
    const arm2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 4, 8), coat); arm2.position.set(-0.36, 1.2, 0); g.add(arm2);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.scale.setScalar(0.88);   // Feza ≈ 1.45 m, Hala ≈ 1.9 m
    S.root = g; scene.add(g);
    return g;
  }

  // Feza'nın sol arkasında durulacak yer
  function followSpot(P) {
    const f = P.face || 0, sx = Math.sin(f), cz = Math.cos(f);
    return { x: P.pos.x - sx * 1.4 - cz * 1.1, z: P.pos.z - cz * 1.4 + sx * 1.1 };
  }
  function walkTo(tx, tz, speed, dt, A) {
    const dx = tx - S.x, dz = tz - S.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return d;
    const st = Math.min(d, speed * dt), ux = dx / d, uz = dz / d;
    const p = { x: S.x, z: S.z };
    if (A && A.moveXZ) A.moveXZ(p, ux * st, uz * st, 0.35); else { p.x += ux * st; p.z += uz * st; }
    if (Math.hypot(p.x - S.x, p.z - S.z) < st * 0.2) { p.x = S.x + ux * st; p.z = S.z + uz * st; }   // takıldıysa (yardımcıdır) geç
    S.x = p.x; S.z = p.z;
    S.face = Math.atan2(ux, uz);
    return d;
  }

  function update(dt, ctx) {
    if (!S.root || !ctx || !ctx.P) return;
    S.ctx = ctx; S.t += dt; S.modeT += dt;
    const P = ctx.P, A = ctx.api;
    if (ctx.L !== S.L) {   // yeni bölüm: Feza'nın yanında başla
      S.L = ctx.L; const f = followSpot(P); S.x = f.x; S.z = f.z; S.mode = 'follow';
    }
    if (ctx.state === 'play') api.charge = Math.min(1, api.charge + dt * TEAM_FILL);
    S.hugCd = Math.max(0, S.hugCd - dt);
    let moving = 0;
    const dF = Math.hypot(P.pos.x - S.x, P.pos.z - S.z);
    if (dF > 16) { const f = followSpot(P); S.x = f.x; S.z = f.z; }
    if (S.mode === 'help' || S.mode === 'hug') {   // Feza'ya koş
      const d = walkTo(P.pos.x + 0.7, P.pos.z + 0.3, 6.5, dt, A); moving = d > 0.1 ? 1 : 0;
      if (d < 0.9 && S.mode === 'hug' && S.modeT > 0.2) { if (A) A.heal(0.3); S.mode = 'follow'; S.modeT = 0; }
      if (S.mode === 'help' && !ctx.dead) { S.mode = 'follow'; S.modeT = 0; }
    } else {
      const f = followSpot(P), d = Math.hypot(f.x - S.x, f.z - S.z);
      if (d > 0.6) { walkTo(f.x, f.z, d > 4 ? 6 : 4, dt, A); moving = 1; }
      else S.face = Math.atan2(P.pos.x - S.x, P.pos.z - S.z);
    }
    // işaret etme
    if (S.pointT > 0) { S.pointT -= dt; if (!moving && S.point) S.face = Math.atan2(S.point.x - S.x, S.point.z - S.z); }
    S.arm.rotation.x = S.pointT > 0 ? -1.5 : Math.sin(S.t * 8) * 0.5 * moving;
    S.hop = Math.max(0, S.hop - dt);
    const y = S.hop > 0 ? Math.sin((1 - S.hop / 0.6) * Math.PI) * 0.9 : Math.abs(Math.sin(S.t * 9)) * 0.06 * moving;
    S.root.position.set(S.x, y, S.z); S.root.rotation.y = S.face;
  }

  // ── 07_game'in çağırdığı kancalar ──
  function onFezaHurt(o) { /* yer tutucu: Polar Kalkan burada (api.shield(s)) */ }
  function onFezaLow(o) {
    if (S.hugCd > 0 || S.mode !== 'follow') return;
    S.hugCd = 20; S.mode = 'hug'; S.modeT = 0;
    say('hala_saril');
  }
  function onFezaDown(o) { S.mode = 'help'; S.modeT = 0; say('hala_kalk'); return 1.6; }   // 1.6 s sonra Feza kalkar
  function onCheer(e) { api.charge = Math.min(1, api.charge + (e && e.boss ? 0.3 : 0.06)); }
  const teamReady = () => api.charge >= 1;
  function teamMove(o) {
    if (!teamReady()) return false;
    api.charge = 0; S.hop = 0.6;
    if (o && o.blast) setTimeout(() => o.blast(), 250);
    return true;
  }
  function pointTo(x, z) { S.point = { x, z }; S.pointT = 2.2; }
  function say(key, prio = 2) {
    const A = S.ctx && S.ctx.api;
    if (A && A.hasLine && A.hasLine(key)) return A.say(key, prio);
    return 0;
  }
  return Object.assign(api, { create, update, onFezaHurt, onFezaLow, onFezaDown, onCheer, teamReady, teamMove, pointTo, say,
    _S: S });
})();
