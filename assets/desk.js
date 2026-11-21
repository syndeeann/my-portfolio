/* Video Desk. Builds the request form from data/desk.json, hands the request to GitHub, and animates the team floor
   from data/runs/<id>.json, which the video director updates while it works. All data is rendered as text. */
(() => {
  'use strict';
  const BASE = (document.documentElement.dataset.base || '.').replace(/\/$/, '');
  const $ = id => document.getElementById(id);
  const h = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return n;
  };
  const load = (name, bust) => fetch(`${BASE}/data/${name}.json${bust ? `?t=${Date.now()}` : ''}`, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  const store = {
    get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
    del: k => { try { localStorage.removeItem(k); } catch (_) {} }
  };
  const ICON_YOU = '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>';
  const ICON_GEN = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>';
  const icon = d => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = d; return s; };
  const safeSrc = u => (typeof u === 'string' && /^(https:\/\/|[\w./-]+$)/.test(u) && !u.includes('..') ? (/^https:/.test(u) ? u : `${BASE}/${u}`) : null);

  let cfg, team = {}, skills = {}, projects = {};
  let active = null;          // { id, brief, created, demo }
  let run = null;             // latest run record (live) or the simulated one (demo)
  let timer = null, demoTimer = null, sentApproval = null, scene = null;
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ensureScene = () => { if (!scene && window.DeskScene && cfg) scene = window.DeskScene.create($('scene'), { steps: cfg.steps, person, base: BASE, reduced: reducedMotion() }); return scene; };
  window.addEventListener('resize', () => scene && scene.resize());

  const opts = (sel, list, value) => list.forEach(o => sel.append(h('option', { value: o.id || o, selected: (o.id || o) === value }, o.label || o)));

  /* ---------- form ---------- */
  function buildForm() {
    opts($('tool'), cfg.tools, cfg.defaults.tool);
    opts($('type'), cfg.types, cfg.defaults.type);
    opts($('look'), cfg.looks, cfg.defaults.look);
    opts($('length'), cfg.lengths, cfg.defaults.length);
    const ps = Object.entries(projects).map(([id, p]) => ({ id, label: p.name }));
    opts($('project'), [{ id: '', label: 'Let Angge pick or create one' }, ...ps, { id: '__new', label: 'A new project…' }], '');
    cfg.platforms.forEach(p => $('platforms').append(h('label', { class: 'chip' }, h('input', { type: 'checkbox', name: 'platform', value: p.id }), h('span', {}, p.label))));
    $('tool').addEventListener('change', () => { $('tool-other').hidden = $('tool').value !== 'Other'; });
    $('project').addEventListener('change', () => { $('project-new').hidden = $('project').value !== '__new'; });
    $('length').addEventListener('change', () => { $('length-custom').hidden = $('length').value !== 'custom'; });
    $('desk-form').addEventListener('submit', onGenerate);
    $('demo').addEventListener('click', startDemo);
    $('clear').addEventListener('click', clearAll);
    $('copy').addEventListener('click', copyMessage);
  }
  const label = (list, id) => (list.find(o => o.id === id) || {}).label || id;

  function readBrief() {
    const idea = $('idea').value.trim();
    if (idea.length < 10) { $('form-err').textContent = 'Describe the video in at least a sentence.'; $('idea').focus(); return null; }
    let tool = $('tool').value; if (tool === 'Other') tool = $('tool-other').value.trim() || 'Other';
    let project = $('project').value; if (project === '__new') project = $('project-new').value.trim();
    let length = $('length').value; if (length === 'custom') length = ($('length-custom').value || '').trim() ? `${$('length-custom').value} seconds` : 'auto';
    if (length && /^\d+$/.test(length)) length = `${length} seconds`;
    $('form-err').textContent = '';
    return {
      idea, tool, project: project || 'auto', type: $('type').value, look: $('look').value, length,
      platforms: [...document.querySelectorAll('input[name="platform"]:checked')].map(i => i.value)
    };
  }
  const newId = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `req-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}-${Math.random().toString(36).slice(2, 6)}`; };

  function requestText(a) {
    const b = a.brief;
    return [
      `Angge, new video request ${a.id}`, '',
      `Idea: ${b.idea}`, '',
      `- Generate with: ${b.tool}`, `- Project: ${b.project === 'auto' ? 'you pick or create one' : b.project}`,
      `- Type: ${label(cfg.types, b.type)}`, `- Character look: ${label(cfg.looks, b.look)}`,
      `- Length: ${b.length === 'auto' ? 'you decide' : b.length}`,
      `- Post to: ${b.platforms.length ? b.platforms.map(p => label(cfg.platforms, p)).join(', ') : 'nowhere, just deliver it'}`, '',
      'Run the whole workflow. Update data/runs/' + a.id + '.json on the portfolio as each helper works, and stop for my approval before the portfolio is updated.', '',
      '```json', JSON.stringify({ id: a.id, ...b }, null, 2), '```'
    ].join('\n');
  }
  const issueUrl = (a, kind = 'request', title, body) => {
    const t = title || `Video request: ${a.brief.idea.slice(0, 60).replace(/\s+/g, ' ')}`;
    const q = new URLSearchParams({ title: t, body: body || requestText(a), labels: cfg.labels[kind] });
    return `https://github.com/${cfg.repo}/issues/new?${q}`;
  };

  function onGenerate(e) {
    e.preventDefault();
    const brief = readBrief(); if (!brief) return;
    stopAll(); scene && scene.reset();
    active = { id: newId(), brief, created: Date.now(), demo: false };
    store.set('desk.active', active);
    run = null; sentApproval = null;
    showFloor();
    const url = issueUrl(active);
    $('send').href = url;
    window.open(url, '_blank', 'noopener');   // the owner still has to press "Submit new issue" on GitHub
    poll(); timer = setInterval(poll, 10000);
  }

  async function copyMessage() {
    try { await navigator.clipboard.writeText(requestText(active)); $('copied').textContent = 'Copied. Paste it to Claude.'; }
    catch (_) { $('copied').textContent = 'Copy failed. Use the GitHub button instead.'; }
  }

  /* ---------- floor ---------- */
  function showFloor() {
    $('floor').hidden = false; ensureScene(); if (scene && active) scene.setTool(active.brief.tool); $('handoff').hidden = !!(active && active.demo);
    $('copied').textContent = '';
    render();
    $('floor').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  const person = s => {
    if (s.skill && skills[s.skill]) { const m = team[s.skill] || {}; return { name: m.name || skills[s.skill].name, role: m.title || skills[s.skill].role || '', img: m.avatar }; }
    if (s.who === 'you') return { name: 'You', role: 'Approver', img: null, svg: ICON_YOU };
    return { name: (active && active.brief.tool) || 'The generator', role: 'Video tool', img: null, svg: ICON_GEN };
  };

  function render() {
    if (!active) return;
    const steps = cfg.steps;
    const rs = {}; ((run && run.steps) || []).forEach(s => { rs[s.key] = s; });
    if (ensureScene()) scene.apply(rs, { animate: true, waiting: !run && !active.demo });
    const failed = run && run.status === 'failed';
    const rail = $('rail'); rail.replaceChildren();
    let working = null;
    steps.forEach((s, i) => {
      const st = (rs[s.key] && rs[s.key].status) || 'pending';
      const who = person(s);
      const prevDone = i > 0 && ((rs[steps[i - 1].key] || {}).status === 'done');
      const waiting = st === 'working' && s.who === 'you';
      const cls = ['stn', waiting ? 'waiting' : st];
      if (st === 'working' && prevDone) cls.push('send');
      if (st === 'working') working = { s, who, note: (rs[s.key] || {}).note };
      const av = h('div', { class: 'av' }, who.img ? h('img', { src: `${BASE}/${who.img}`, alt: '' }) : icon(who.svg || ICON_GEN));
      const note = (rs[s.key] || {}).note;
      rail.append(h('li', { class: cls.join(' ') },
        av, h('span', { class: 'tick', 'aria-hidden': 'true' }, st === 'failed' ? '!' : '✓'), h('span', { class: 'packet', 'aria-hidden': 'true' }),
        h('div', { class: 'body' },
          h('div', { class: 'who' }, who.name, h('small', {}, who.role)),
          h('div', { class: 'what' }, `${i + 1}. ${s.label}${st === 'skipped' ? ' (skipped)' : ''}`),
          h('div', { class: 'bubble' }, note || (waiting ? 'Waiting for you to watch the video…' : `${who.name} ${s.doing}…`), h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'))))));
    });
    // header
    const mode = $('mode');
    const status = run && run.status;
    if (active.demo) { mode.textContent = 'Demo'; mode.className = 'tag demo'; }
    else if (!run) { mode.textContent = 'Waiting for Angge'; mode.className = 'tag wait'; }
    else if (failed) { mode.textContent = 'Stopped'; mode.className = 'tag bad'; }
    else if (status === 'published') { mode.textContent = 'On the portfolio'; mode.className = 'tag live'; }
    else { mode.textContent = 'Live'; mode.className = 'tag live'; }
    if (!run && !active.demo) { $('now').textContent = 'Request ready'; $('now-sub').textContent = 'Submit it on GitHub, then Angge starts. This page updates by itself.'; }
    else if (failed) { $('now').textContent = 'The run stopped'; $('now-sub').textContent = run.note || 'See the activity log.'; }
    else if (status === 'published') { $('now').textContent = 'Done. It is on your portfolio.'; $('now-sub').textContent = ''; }
    else if (working && working.s.who === 'you') { $('now').textContent = 'Your turn: watch the video and approve it'; $('now-sub').textContent = `Step ${steps.indexOf(working.s) + 1} of ${steps.length}`; }
    else if (working) { $('now').textContent = `${working.who.name} ${working.s.doing}`; $('now-sub').textContent = `Step ${steps.indexOf(working.s) + 1} of ${steps.length}`; }
    else if (status === 'review') { $('now').textContent = 'Ready for your approval'; $('now-sub').textContent = 'Watch it below, then approve or ask for changes.'; }
    else { $('now').textContent = active.demo ? 'Demo finished' : 'Working'; $('now-sub').textContent = active.demo ? 'In a real run the finished video appears here for you to approve.' : ''; }
    // log
    const log = $('log'); const entries = (run && run.log) || [];
    log.hidden = !entries.length; log.replaceChildren(...entries.slice(-30).map(l => h('div', {}, h('b', {}, (l.t || '').slice(11, 16) || '·'), '  ', l.text)));
    renderReview();
  }

  function renderReview() {
    const box = $('review');
    if (!run || active.demo || run.status !== 'review' || !run.review) { box.hidden = true; box.replaceChildren(); return; }
    const r = run.review, wide = r.aspect === '16:9';
    let media = null;
    if (/^[\w-]{11}$/.test(r.youtube || '')) media = h('iframe', { src: `https://www.youtube-nocookie.com/embed/${r.youtube}`, title: 'Video to approve', allow: 'encrypted-media; picture-in-picture', allowfullscreen: true });
    else if (safeSrc(r.src)) media = h('video', { src: safeSrc(r.src), controls: true, playsinline: true, preload: 'metadata' });
    const notes = h('textarea', { id: 'changes', placeholder: 'If something is off, say what to change (for example: the voice-over repeats a word at 0:32)…', maxlength: '1500' });
    box.replaceChildren(...[
      h('h3', {}, 'Watch it, then decide'),
      media ? h('div', { class: wide ? 'player wide' : 'player' }, media) : h('p', { class: 'note' }, 'The video link is not ready yet.'),
      r.notes ? h('p', { class: 'note' }, r.notes) : null,
      notes,
      h('div', { class: 'row' },
        h('button', { class: 'btn go', type: 'button', onclick: () => decide('approve', '') }, 'Approve and update my portfolio'),
        h('button', { class: 'btn', type: 'button', onclick: () => decide('changes', notes.value.trim()) }, 'Request changes'),
        h('span', { class: 'sent', id: 'decision', role: 'status' }, sentApproval || '')),
      h('p', { class: 'note' }, 'These buttons open a prefilled message on GitHub for you to submit. You can also just tell Angge “approve” in Claude.')].filter(Boolean));
    box.hidden = false;
  }
  function decide(kind, notes) {
    if (kind === 'changes' && !notes) { $('decision').textContent = 'Say what to change first.'; return; }
    const id = active.id;
    const body = kind === 'approve' ? `Approved: ${id}\n\nAngge, I watched it and approve. Update the portfolio.` : `Changes requested: ${id}\n\n${notes}`;
    window.open(issueUrl(active, 'approval', `${kind === 'approve' ? 'Approve' : 'Changes'}: ${id}`, body), '_blank', 'noopener');
    sentApproval = kind === 'approve' ? 'Opened on GitHub. Submit it there to approve.' : 'Opened on GitHub. Submit it there to send your notes.';
    $('decision').textContent = sentApproval;
  }

  /* ---------- live polling ---------- */
  async function poll() {
    if (!active || active.demo || document.hidden) return;
    const r = await load(`runs/${active.id}`, true);
    if (r) { run = r; render(); if (['published', 'failed', 'cancelled'].includes(r.status)) { clearInterval(timer); timer = null; } }
    refreshRecent();
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });

  /* ---------- demo ---------- */
  function startDemo() {
    stopAll(); scene && scene.reset();
    const brief = { idea: 'A demo run. Nothing is sent and nothing is made.', tool: cfg.defaults.tool, project: 'demo', type: cfg.defaults.type, look: 'auto', length: 'auto', platforms: [] };
    active = { id: 'demo', brief, created: Date.now(), demo: true };
    run = { status: 'working', steps: cfg.steps.map(s => ({ key: s.key, status: 'pending' })), log: [] };
    showFloor();
    let i = 0;
    const tick = () => {
      const steps = run.steps;
      if (i > 0) steps[i - 1].status = 'done';
      if (i >= steps.length) { run.status = 'demo-done'; render(); demoTimer = null; return; }
      steps[i].status = 'working';
      run.log.push({ t: new Date().toISOString(), text: `${cfg.steps[i].label} started` });
      render(); i += 1;
      demoTimer = setTimeout(tick, 5200);
    };
    tick();
  }

  function stopAll() { clearInterval(timer); timer = null; clearTimeout(demoTimer); demoTimer = null; }
  function clearAll() { stopAll(); scene && scene.reset(); store.del('desk.active'); active = null; run = null; $('floor').hidden = true; }

  /* ---------- recent ---------- */
  async function refreshRecent() {
    const idx = await load('runs/index', true);
    const list = (idx && idx.runs) || [];
    const box = $('recent-list');
    if (!list.length) { box.replaceChildren(h('p', { class: 'note' }, 'Nothing yet.')); return; }
    box.replaceChildren(...list.slice(0, 12).map(r => h('button', { type: 'button', onclick: () => openRun(r.id) },
      h('span', { class: 't' }, r.title || r.id), h('span', { class: 'm' }, `${r.status} · ${(r.updated || r.created || '').slice(0, 10)}`))));
  }
  async function openRun(id) {
    const r = await load(`runs/${id}`, true); if (!r) return;
    stopAll(); scene && scene.reset(); active = { id, brief: r.brief || {}, created: Date.parse(r.created) || Date.now(), demo: false }; run = r; sentApproval = null;
    store.set('desk.active', { id, brief: active.brief, created: active.created, demo: false });
    showFloor(); $('handoff').hidden = true;
    if (!['published', 'failed', 'cancelled'].includes(r.status)) timer = setInterval(poll, 10000);
  }

  /* ---------- start ---------- */
  Promise.all([load('desk'), load('team'), load('skills'), load('projects')]).then(([c, t, s, p]) => {
    if (!c) { $('form-err').textContent = 'Could not load the desk settings.'; return; }
    cfg = c; team = (t && t.members) || {}; projects = (p && p.projects) || {};
    ((s && s.skills) || []).forEach(k => { skills[k.id] = k; });
    buildForm(); refreshRecent();
    const saved = store.get('desk.active');
    if (saved && saved.id && !saved.demo) openRun(saved.id).then(() => { if (!run) { active = saved; showFloor(); $('send').href = issueUrl(active); poll(); timer = setInterval(poll, 10000); } });
  });
})();
