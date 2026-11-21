/* The studio floor. Every helper has a desk around Angge's briefing table. The helper whose step is running works
   at her desk (a small prop shows the kind of work); when a step finishes she carries the result to the next desk,
   hands it over and walks back. Driven by apply() with the same step statuses the run record holds. Decorative:
   the page's headline and step list carry the same information as text. */
(() => {
  'use strict';
  const WALK = 1300, STAGGER = 90;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const txt = (n, s) => { n.textContent = s; return n; };

  // fixed markup, never from data
  const PROP = {
    brief: '<rect x="4" y="2" width="40" height="26" rx="3" class="pg"/><path class="ln" d="M10 9h28M10 15h20M10 21h24"/><circle class="pt" cx="38" cy="22" r="2.4"/>',
    script: '<rect x="9" y="2" width="30" height="27" rx="3" class="pg"/><path class="ln" d="M14 9h20M14 15h20M14 21h12"/>',
    bible: '<rect class="sw s1" x="4" y="6" width="9" height="20" rx="2"/><rect class="sw s2" x="15" y="6" width="9" height="20" rx="2"/><rect class="sw s3" x="26" y="6" width="9" height="20" rx="2"/><rect class="sw s4" x="37" y="6" width="7" height="20" rx="2"/>',
    prompts: '<rect x="5" y="3" width="38" height="26" rx="3" class="pg"/><path class="ln" d="M10 10h24M10 16h28M10 22h16"/><rect class="cur" x="28" y="19" width="3" height="6"/>',
    generate: '<rect class="fr f1" x="3" y="6" width="9" height="16" rx="1.5"/><rect class="fr f2" x="14" y="6" width="9" height="16" rx="1.5"/><rect class="fr f3" x="25" y="6" width="9" height="16" rx="1.5"/><rect class="fr f4" x="36" y="6" width="9" height="16" rx="1.5"/><rect class="bar" x="4" y="26" width="40" height="3" rx="1.5"/>',
    qa: '<rect x="4" y="9" width="40" height="12" rx="2" class="pg"/><path class="ln2" d="M9 15h30"/><circle class="lens" cx="14" cy="15" r="7"/><path class="hnd" d="M19 20l6 7"/>',
    cut: '<rect class="cl ca" x="2" y="6" width="22" height="9" rx="2"/><rect class="cl cb" x="24" y="17" width="22" height="9" rx="2"/><path class="ln2" d="M24 3v26"/>',
    finish: '<path class="trk" d="M5 10h38M5 22h38"/><circle class="knob k1" cx="14" cy="10" r="4"/><circle class="knob k2" cx="34" cy="22" r="4"/>',
    approve: '<rect x="4" y="3" width="40" height="23" rx="3" class="pg"/><path class="play" d="M20 9l11 5.5L20 20z"/>',
    publish: '<path class="up" d="M24 24V8M17 15l7-7 7 7"/><rect class="bar" x="6" y="27" width="36" height="3" rx="1.5"/>'
  };
  const PACK = { doc: '#3de8ff', script: '#ffd23f', swatch: '#ff4fd8', prompt: '#c6ff4a', clips: '#7aa2ff', report: '#ff9f43', reel: '#3de8ff', final: '#c6ff4a', ok: '#c6ff4a' };
  const packSvg = k => `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="${PACK[k] || '#fff'}"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#0c1024" stroke-width="2" stroke-linecap="round"/></svg>`;
  const OUT = { brief: 'doc', script: 'script', bible: 'swatch', prompts: 'prompt', generate: 'clips', rawqa: 'report', cut: 'reel', finish: 'final', finalqa: 'report', approve: 'ok' };
  const stationOf = s => (s.key === 'rawqa' || s.key === 'finalqa' ? 'qa' : s.key);
  const RING = ['script', 'bible', 'prompts', 'generate', 'qa', 'cut', 'finish', 'approve', 'publish'];
  const CENTER = [50, 49];
  const SHORT = { qa: 'Checks', cut: 'Edit & sync', finish: 'Colour & sound', publish: 'Portfolio', prompts: 'Prompts' };

  function create(root, o) {
    const steps = o.steps, reduced = !!o.reduced;
    let gen = 0, q = Promise.resolve(), prev = null;
    root.replaceChildren();
    const beam = el('div', 'beam'), table = el('div', 'table', '<span>Briefing table</span>');
    root.append(table, beam);

    // stations
    const st = {};
    RING.forEach((id, i) => {
      const a = (-120 + i * 40) * Math.PI / 180;
      const pos = [50 + 38 * Math.cos(a), 49 + 33 * Math.sin(a)];
      const first = steps.find(s => stationOf(s) === id);
      const p = o.person(first);
      const kind = id === 'qa' ? 'qa' : id;
      const desk = el('div', `desk d-${kind}`, `<div class="top"><svg class="prop" viewBox="0 0 48 32" aria-hidden="true">${PROP[kind] || ''}</svg></div>`);
      const tray = el('div', 'tray', ''); desk.append(tray);
      txt(desk.appendChild(el('div', 'plate')), SHORT[id] || first.label);
      desk.style.left = pos[0] + '%'; desk.style.top = pos[1] + '%';
      root.append(desk);
      const home = lerp(pos, CENTER, 0.38), dx = CENTER[0] - pos[0], dy = CENTER[1] - pos[1], len = Math.hypot(dx, dy) || 1;
      const near = [home[0] - dy / len * 9, home[1] + dx / len * 9];
      st[id] = { id, pos, desk, tray, person: p, walker: !!(first.skill), home, near, steps: steps.filter(s => stationOf(s) === id), char: null };
    });
    const boss = steps[0];
    const pb = o.person(boss);
    const mkChar = (p, who) => {
      const c = el('div', 'char');
      const av = el('div', 'av');
      if (p.img) { const im = el('img'); im.src = `${o.base}/${p.img}`; im.alt = ''; av.append(im); } else av.innerHTML = p.svg || '';
      c.append(av, el('span', 'tick', '✓'), el('span', 'zz', 'z'), el('div', 'pack'), el('div', 'bubble'));
      c.append(txt(el('div', 'nm'), who || p.name));
      return c;
    };
    RING.forEach(id => { const s = st[id]; if (s.walker) { s.char = mkChar(s.person); root.append(s.char); } else { txt(s.desk.querySelector('.plate'), s.person.name === 'You' ? 'You' : s.person.name); } });
    const angge = mkChar(pb); angge.classList.add('boss'); root.append(angge);
    const place = (n, pos, ms) => { n.style.transitionDuration = `${reduced ? 0 : ms}ms`; n.style.left = pos[0] + '%'; n.style.top = pos[1] + '%'; };
    const say = (c, text, dots = true) => { const b = c.querySelector('.bubble'); b.replaceChildren(document.createTextNode(text)); if (dots) b.append(el('span', 'dots', '<i></i><i></i><i></i>')); c.classList.toggle('talk', !!text); };
    place(angge, [50, 47], 0);
    RING.forEach(id => { const s = st[id]; if (s.char) place(s.char, s.home, 0); });

    const aim = pos => {
      if (!pos) { beam.classList.remove('on'); return; }
      const W = root.clientWidth, H = root.clientHeight;
      const dx = (pos[0] - CENTER[0]) / 100 * W, dy = (pos[1] - CENTER[1]) / 100 * H;
      beam.style.left = CENTER[0] + '%'; beam.style.top = CENTER[1] + '%';
      beam.style.width = `${Math.max(0, Math.hypot(dx, dy) - 40)}px`;
      beam.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      beam.classList.add('on');
    };

    const statusOf = (a, id) => {
      const ss = a.st.filter((_, i) => stationOf(steps[i]) === id);
      if (ss.includes('failed')) return 'failed';
      if (ss.includes('working')) return 'working';
      if (ss.length && ss.every(x => x === 'done' || x === 'skipped')) return 'done';
      return 'pending';
    };
    const focusOf = list => { const w = list.indexOf('working'); if (w >= 0) return w; const d = list.lastIndexOf('done'); return d >= 0 ? Math.min(d + 1, list.length - 1) : -1; };
    const trayKind = (a, id) => { const i = steps.findIndex((s, k) => stationOf(s) === id && a.st[k] === 'working'); return i > 0 ? OUT[steps[i - 1].key] : null; };

    // set every station and character to the state the statuses describe (no walking)
    function snap(a) {
      RING.forEach(id => {
        const s = st[id], state = statusOf(a, id);
        s.desk.className = `desk d-${id === 'qa' ? 'qa' : id} ${state}`;
        const tk = state === 'working' ? trayKind(a, id) : null;
        s.tray.innerHTML = tk ? packSvg(tk) : ''; s.tray.classList.toggle('has', !!tk);
        if (s.char) {
          s.char.className = `char ${state}`;
          place(s.char, s.home, 0);
          const stepIdx = a.st.findIndex((x, i) => x === 'working' && stationOf(steps[i]) === id);
          say(s.char, state === 'working' ? (a.notes[stepIdx] || `${s.person.name} ${steps[stepIdx].doing}`) : '', state === 'working');
          s.char.querySelector('.pack').innerHTML = '';
        }
      });
      angge.className = 'char boss ' + (a.f >= 0 && a.f < steps.length ? 'direct' : '');
      place(angge, [50, 47], 0);
      const cur = a.f >= 0 && a.st[a.f] === 'working' ? stationOf(steps[a.f]) : null;
      aim(cur && cur !== 'brief' ? st[cur].pos : null);
      say(angge, bossLine(a), a.f >= 0 && a.f < steps.length && a.st[a.f] === 'working');
    }
    function bossLine(a) {
      if (a.fail) return 'We hit a problem. Reading the log.';
      if (a.f < 0) return a.waiting ? 'Waiting for your request to reach me.' : 'At my desk, ready.';
      if (a.st.every(x => x === 'done')) return "That's a wrap!";
      const s = steps[a.f];
      if (s.key === 'brief') return 'Team, here is the brief.';
      if (s.key === 'approve') return 'Boss, it is your turn to watch.';
      const p = st[stationOf(s)].person;
      return a.st[a.f] === 'working' ? `${p.name}, you are up.` : 'Standing by.';
    }

    async function walk(c, pos, ms = WALK) { c.classList.add('walking'); place(c, pos, ms); await sleep(reduced ? 0 : ms); c.classList.remove('walking'); }
    const setPack = (c, kind) => { const p = c.querySelector('.pack'); p.innerHTML = kind ? packSvg(kind) : ''; c.classList.toggle('carry', !!kind); };

    async function gather(g, a) {
      angge.classList.add('direct'); say(angge, 'Team, here is the brief.');
      const ws = RING.filter(id => st[id].char);
      await Promise.all(ws.map(async (id, i) => {
        if (g !== gen) return; await sleep(i * STAGGER);
        const ang = (-150 + i * (300 / Math.max(ws.length - 1, 1))) * Math.PI / 180;
        const slot = [CENTER[0] + 17 * Math.cos(ang), CENTER[1] + 17 * Math.sin(ang) + 2];
        st[id].char.classList.add('listen'); await walk(st[id].char, slot);
      }));
    }
    async function disperse(g) {
      const ws = RING.filter(id => st[id].char);
      await Promise.all(ws.map(async (id, i) => { await sleep(i * STAGGER); if (g !== gen) return; await walk(st[id].char, st[id].home); st[id].char.classList.remove('listen'); }));
    }
    function setStations(a) { // statuses and trays without moving anybody
      RING.forEach(id => {
        const s = st[id], state = statusOf(a, id), tk = state === 'working' ? trayKind(a, id) : null;
        s.desk.classList.remove('pending', 'working', 'done', 'failed'); s.desk.classList.add(state);
        s.tray.innerHTML = tk ? packSvg(tk) : ''; s.tray.classList.toggle('has', !!tk);
        if (s.char) { s.char.classList.remove('pending', 'working', 'done', 'failed'); s.char.classList.add(state);
          const i = a.st.findIndex((x, k) => x === 'working' && stationOf(steps[k]) === id);
          say(s.char, state === 'working' ? (a.notes[i] || `${s.person.name} ${steps[i].doing}`) : '', state === 'working'); }
      });
    }
    async function handoff(g, i, j, a) {
      const A = st[stationOf(steps[i])], B = st[stationOf(steps[j])], kind = OUT[steps[i].key] || 'doc';
      if (A === B) { setStations(a); return; }
      aim(B.id === 'brief' ? null : B.pos); say(angge, bossLineFor(B, steps[j]));
      if (steps[i].key === 'brief') { // the brief reaches the first desk; nobody walks
        B.tray.innerHTML = packSvg('doc'); B.tray.classList.add('has'); await sleep(reduced ? 0 : 500); if (g !== gen) return; setStations(a); return;
      }
      if (A.char) {
        A.char.classList.remove('working'); say(A.char, ''); setPack(A.char, kind); await sleep(reduced ? 0 : 350); if (g !== gen) return;
        await walk(A.char, B.near); if (g !== gen) return;
        setPack(A.char, null); setStations(a); await sleep(reduced ? 0 : 450); if (g !== gen) return;
        await walk(A.char, A.home);
      } else if (B.char) { // a machine or the owner produced it: the next helper fetches it
        await walk(B.char, A.near); if (g !== gen) return; setPack(B.char, kind); A.tray.innerHTML = ''; A.tray.classList.remove('has');
        await sleep(reduced ? 0 : 300); await walk(B.char, B.home); if (g !== gen) return; setPack(B.char, null); setStations(a);
      } else { setStations(a); }
    }
    const bossLineFor = (S, step) => (S.person.name === 'You' ? 'Boss, it is your turn to watch.' : S.walker ? `${S.person.name}, you are up.` : `${S.person.name} is on it.`);

    function toModel(rs, extra) {
      const list = steps.map(s => (rs[s.key] && rs[s.key].status) || 'pending');
      return { st: list, notes: steps.map(s => (rs[s.key] && rs[s.key].note) || ''), f: focusOf(list), fail: list.includes('failed'), waiting: !!(extra && extra.waiting) };
    }
    const same = (x, y) => x && JSON.stringify([x.st, x.notes, x.waiting]) === JSON.stringify([y.st, y.notes, y.waiting]);

    return {
      reset() { gen += 1; q = Promise.resolve(); prev = null; root.querySelectorAll('.char').forEach(c => c.classList.remove('walking', 'listen', 'carry')); },
      apply(rs, opts = {}) {
        const a = toModel(rs, opts);
        if (same(prev, a)) return;
        const before = prev; prev = a;
        const g = gen;
        q = q.then(async () => {
          if (g !== gen) return;
          if (!opts.animate || reduced || !before) { snap(a); return; }
          if (a.f === before.f) { setStations(a); aim(a.st[a.f] === 'working' && stationOf(steps[a.f]) !== 'brief' ? st[stationOf(steps[a.f])].pos : null); say(angge, bossLine(a), a.st[a.f] === 'working'); return; }
          if (a.f === 0 && before.f < 0) { setStations(a); aim(null); await gather(g, a); return; }
          if (a.f > before.f) {
            if (before.f === 0) { aim(null); await disperse(g); if (g !== gen) return; }
            for (let k = Math.max(before.f, 0); k < a.f && g === gen; k += 1) await handoff(g, k, k + 1, k + 1 === a.f ? a : toModel(Object.fromEntries(steps.map((s, i) => [s.key, { status: i <= k ? 'done' : (i === k + 1 ? 'working' : 'pending') }])), opts));
          } else { await handoff(g, before.f, a.f, a); }
          if (g !== gen) return;
          snap(a);
        }).catch(() => {});
      },
      setTool(name) { txt(st.generate.desk.querySelector('.plate'), name || 'Video tool'); },
      resize() { if (prev && prev.f >= 0 && prev.st[prev.f] === 'working' && stationOf(steps[prev.f]) !== 'brief') aim(st[stationOf(steps[prev.f])].pos); }
    };
  }
  window.DeskScene = { create };
})();
