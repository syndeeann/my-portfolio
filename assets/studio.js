/* My AI Studio renderer.
   Reads data/*.json and fills the studio tiles, latest outputs, studio pages, workflow and Claude skills sections.
   The NEW badge is worked out in the visitor's browser from each item's "published" date, so it switches off by
   itself after newBadgeDays days (data/studios.json) with no redeploy. */
(() => {
  'use strict';
  const html = document.documentElement;
  const BASE = (html.dataset.base || '.').replace(/\/$/, '');
  const DAY = 864e5;

  /* ---------- tiny DOM helpers (all data goes in as text, never as markup) ---------- */
  const h = (tag, props = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'style') node.setAttribute('style', v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return node;
  };
  const svg = (d, extra = '') => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = d + extra; // d is a fixed string from this file, never from data
    return s;
  };
  const ICONS = {
    ads: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
    kids: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    stories: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h6M8 11h6"/>',
    apps: '<rect x="3" y="4" width="14" height="11" rx="2"/><path d="M8 19h4M10 15v4"/><rect x="17" y="8" width="4" height="10" rx="1"/>',
    default: '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>'
  };
  const ARROW = '<path d="M5 12h14M13 6l6 6-6 6"/>';
  const PLAY = '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>';
  const GITHUB = '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>';

  /* ---------- data ---------- */
  const load = name => fetch(`${BASE}/data/${name}.json`, { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(`${name}.json: ${r.status}`); return r.json(); })
    .catch(err => { console.warn('[studio]', err.message); return null; });

  const safeUrl = u => {
    if (!u || typeof u !== 'string') return null;
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[\w./-]+$/.test(u) && !u.startsWith('/') && !u.includes('..')) return `${BASE}/${u}`;
    return null;
  };
  const ytId = v => {
    if (!v) return null;
    if (/^[\w-]{11}$/.test(v)) return v;
    const m = /(?:shorts\/|v=|youtu\.be\/|embed\/)([\w-]{11})/.exec(v);
    return m ? m[1] : null;
  };

  /* ---------- dates and the NEW badge ---------- */
  const parseDay = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const ageDays = item => { const d = parseDay(item.published); return d ? Math.round((today() - d) / DAY) : null; };
  const isNew = (item, days) => { const a = ageDays(item); return a !== null && a >= 0 && a <= days; };
  const fmtDate = s => { const d = parseDay(s); return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; };
  const fmtDur = s => { if (!s) return ''; const m = Math.floor(s / 60), r = Math.round(s % 60); return `${m}:${String(r).padStart(2, '0')}`; };

  /* ---------- lookups ---------- */
  const makeCtx = ([studios, projects, items, skills, workflow]) => {
    const ctx = {
      studios: (studios && studios.studios) || [],
      newDays: (studios && studios.newBadgeDays) || 7,
      projects: (projects && projects.projects) || {},
      items: ((items && items.items) || []).slice().sort((a, b) => (b.published || '').localeCompare(a.published || '') || (b.id || '').localeCompare(a.id || '')),
      skills: (skills && skills.skills) || [],
      skillsRepo: (skills && skills.repo) || 'https://github.com/syndeeann/custom-claude-skills',
      pipelines: (workflow && workflow.pipelines) || {}
    };
    ctx.skill = id => ctx.skills.find(s => s.id === id);
    ctx.studio = id => ctx.studios.find(s => s.id === id);
    ctx.projectName = slug => (ctx.projects[slug] && ctx.projects[slug].name) || slug;
    ctx.itemsOf = id => ctx.items.filter(i => i.studio === id);
    ctx.pipelineSkills = pid => { const p = ctx.pipelines[pid]; return p ? [...new Set(p.steps.flatMap(s => s.skills || []))] : []; };
    return ctx;
  };

  const skillChip = (ctx, id) => {
    const s = ctx.skill(id);
    if (!s) return h('span', { class: 'chip-s skill' }, id);
    return h('a', { class: 'chip-s skill', href: s.url, target: '_blank', rel: 'noopener', title: s.role }, s.name);
  };

  /* ---------- cards ---------- */
  const poster = item => {
    if (item.poster) return safeUrl(item.poster);
    const id = ytId(item.youtube);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  };

  const playInline = (btn, item) => {
    const id = ytId(item.youtube);
    const src = safeUrl(item.src);
    let media;
    if (src) media = h('video', { src, controls: true, autoplay: true, playsinline: true, preload: 'metadata', poster: poster(item) || null });
    else if (id) media = h('iframe', { src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`, title: item.title, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, loading: 'lazy' });
    else return;
    const frame = h('div', { class: 'vframe' }, media);
    btn.replaceWith(frame);
    const badge = frame.parentElement && frame.parentElement.querySelector('.badge-slot');
    if (badge) badge.style.display = 'none';
  };

  const links = (item, ctx) => {
    const out = [];
    const yt = ytId(item.youtube);
    if (yt) out.push(h('a', { href: `https://www.youtube.com/shorts/${yt}`, target: '_blank', rel: 'noopener' }, 'YouTube ↗'));
    for (const [key, label] of [['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['instagram', 'Instagram'], ['link', item.type === 'app' ? 'Live app' : 'Watch'], ['repo', 'Source']]) {
      const u = safeUrl(item[key]);
      if (u && /^https?:/i.test(u)) out.push(h('a', { href: u, target: '_blank', rel: 'noopener' }, `${label} ↗`));
    }
    return out.length ? h('div', { class: 'links' }, out) : null;
  };

  const metaLine = (item, ctx) => h('div', { class: 'meta' },
    h('b', {}, ctx.projectName(item.project)),
    fmtDate(item.published) && h('span', {}, fmtDate(item.published)),
    item.language && h('span', {}, item.language));

  const badge = (item, ctx) => isNew(item, ctx.newDays)
    ? h('span', { class: 'badge-slot' }, h('span', { class: 'pill-new', title: `Published within the last ${ctx.newDays} days` }, 'New'))
    : null;

  const skillRow = (item, ctx, studio) => {
    const ids = (item.skills && item.skills.length) ? item.skills : ctx.pipelineSkills(studio && studio.pipeline);
    return ids.length ? h('div', { class: 'chips' }, ids.map(id => skillChip(ctx, id))) : null;
  };

  const videoCard = (item, ctx, i) => {
    const studio = ctx.studio(item.studio);
    const img = poster(item);
    const playable = !!(ytId(item.youtube) || safeUrl(item.src));
    const thumb = h(playable ? 'button' : 'div', {
      class: 'vthumb' + (playable ? '' : ' static'), type: playable ? 'button' : null,
      'aria-label': playable ? `Play ${item.title}` : null,
      onclick: playable ? e => playInline(e.currentTarget, item) : null
    },
      img && h('img', { src: img, alt: '', loading: 'lazy', onerror: e => e.currentTarget.remove() }),
      !img && h('span', { class: 'fallback' }, item.title),
      h('span', { class: 'shade' }),
      playable && h('span', { class: 'play' }, svg(PLAY)),
      item.duration_s && h('span', { class: 'vdur' }, fmtDur(item.duration_s)));
    return h('article', { class: 'vcard' + (isNew(item, ctx.newDays) ? ' is-new' : ''), style: `--d:${Math.min(i, 8) * 0.06}s` },
      badge(item, ctx), thumb,
      h('div', { class: 'obody' },
        h('h3', {}, item.title), metaLine(item, ctx),
        item.description && h('p', { class: 'desc' }, item.description),
        skillRow(item, ctx, studio), links(item, ctx)));
  };

  const appCard = (item, ctx, i) => {
    const studio = ctx.studio(item.studio);
    const img = poster(item);
    return h('article', { class: 'acard' + (isNew(item, ctx.newDays) ? ' is-new' : ''), style: `--d:${Math.min(i, 8) * 0.06}s` },
      badge(item, ctx),
      h('div', { class: 'athumb' }, img ? h('img', { src: img, alt: `${item.title} preview`, loading: 'lazy', onerror: e => e.currentTarget.remove() }) : h('span', { class: 'fallback' }, item.title)),
      h('div', { class: 'obody' },
        h('h3', {}, item.title), metaLine(item, ctx),
        (item.platforms && item.platforms.length) && h('div', { class: 'chips' }, item.platforms.map(p => h('span', { class: 'chip-s' }, p))),
        item.description && h('p', { class: 'desc' }, item.description),
        skillRow(item, ctx, studio), links(item, ctx)));
  };

  const card = (item, ctx, i) => (item.type === 'app' ? appCard : videoCard)(item, ctx, i);

  /* ---------- studio tiles ---------- */
  const studioTile = (studio, ctx, i, current) => {
    const mine = ctx.itemsOf(studio.id);
    const fresh = mine.filter(x => isNew(x, ctx.newDays)).length;
    const noun = studio.kind === 'app' ? 'app' : 'video';
    const count = mine.length === 1 ? `1 ${noun}` : `${mine.length} ${noun}s`;
    return h('a', { class: 'studio-tile' + (current ? ' current' : ''), href: `${BASE}/${studio.path}`, style: `--d:${i * 0.08}s;${studio.accent ? '--acc:' + studio.accent : ''}`, 'aria-label': `${studio.name}: ${count}${fresh ? `, ${fresh} new` : ''}`, 'aria-current': current ? 'page' : null },
      h('div', { class: 'top' }, h('span', { class: 'ico' }, svg(ICONS[studio.icon] || ICONS[studio.id] || ICONS.default)),
        fresh > 0 && h('span', { class: 'pill-new' }, `${fresh} new`)),
      h('h3', {}, studio.name), h('p', {}, studio.tagline),
      h('div', { class: 'foot' }, h('span', {}, mine.length ? count : 'Coming soon'), h('span', { class: 'go' }, current ? 'You are here' : 'Open studio', current ? null : svg(ARROW))));
  };

  const fillStudios = (el, ctx) => {
    const skip = (el.dataset.exclude || '').split(',').map(x => x.trim()).filter(Boolean);
    el.replaceChildren(...ctx.studios.filter(s => !skip.includes(s.id)).map((s, i) => studioTile(s, ctx, i, false)));
  };

  const fillLatest = (el, ctx) => {
    const limit = +el.dataset.limit || 8;
    const list = ctx.items.slice(0, limit);
    if (!list.length) { el.replaceChildren(h('div', { class: 'studio-state' }, h('strong', {}, 'First outputs are on their way. '), 'New videos and apps appear here as soon as they are delivered.')); return; }
    el.classList.add('out-grid');
    el.replaceChildren(...list.map((it, i) => card(it, ctx, i)));
  };

  /* ---------- workflow: the pipeline diagram (same design as the Kwento: Kilabot studio) ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const COLS = 4;
  const pad2 = n => String(n).padStart(2, '0');

  const diagram = (id, p, ctx) => {
    const steps = p.steps || [];
    const nodes = [], wires = {};
    const edges = [];
    steps.forEach((st, i) => { if (i) edges.push([i - 1, i]); });
    steps.forEach((st, i) => { if (st.loop) edges.push([i, st.loop.to, 'loop', st.loop.label || 'retry']); });

    const flow = h('div', { class: 'flow' });
    const wireSvg = document.createElementNS(NS, 'svg');
    wireSvg.setAttribute('class', 'wires'); wireSvg.setAttribute('aria-hidden', 'true');
    flow.append(wireSvg);
    const detail = h('div', { class: 'detail', 'aria-live': 'polite' });
    const consoleEl = h('div', { class: 'console', 'aria-live': 'polite', 'aria-label': 'Run log' }, h('span', { class: 't' }, '$ '), 'press run to watch a project move through the pipeline…');

    steps.forEach((st, i) => {
      const row = Math.floor(i / COLS) + 1, k = i % COLS;
      const col = row % 2 ? k + 1 : COLS - k;
      const who = [...(st.skills || []).map(sid => (ctx.skill(sid) || {}).name || sid), ...(st.tools || [])];
      const btn = h('button', { class: 'node' + ((st.skills || []).length ? ' claude' : ''), type: 'button', style: `--r:${row};--c:${col}`, 'data-i': i },
        h('span', { class: 'ix' }, `${pad2(i + 1)} · ${(st.tag || st.title.split(' ')[0]).toUpperCase()}`),
        h('b', {}, st.title), h('small', {}, who.length ? who.join(' · ') : 'Me'), h('i', { class: 'ok' }, '✓'));
      btn.addEventListener('click', () => showDetail(i));
      nodes.push(btn); flow.append(btn);
    });

    const showDetail = i => {
      const st = steps[i];
      detail.replaceChildren(
        h('span', { class: 'ix' }, `${pad2(i + 1)} · ${(st.tag || st.title.split(' ')[0]).toUpperCase()}`),
        h('h3', {}, st.title), h('p', {}, st.text),
        h('div', { class: 'chips' }, (st.skills || []).map(sid => skillChip(ctx, sid)), (st.tools || []).map(t => h('span', { class: 'chip-s' }, t))));
      nodes.forEach((n, j) => n.classList.toggle('sel', i === j));
    };

    const geom = () => {
      const fr = flow.getBoundingClientRect();
      if (!fr.width) return;
      const box = i => { const r = nodes[i].getBoundingClientRect(); return { x: r.left - fr.left, y: r.top - fr.top, w: r.width, h: r.height, cx: r.left - fr.left + r.width / 2, cy: r.top - fr.top + r.height / 2 }; };
      wireSvg.replaceChildren();
      edges.forEach(([a, b, kind, label]) => {
        const A = box(a), B = box(b);
        let d, lx, ly;
        const sameRow = Math.abs(A.cy - B.cy) < Math.min(A.h, B.h) * .6;
        if (kind === 'loop') {
          if (sameRow) { const y = Math.min(A.y, B.y), lift = 46; d = `M${A.cx},${A.y} C${A.cx},${y - lift} ${B.cx},${y - lift} ${B.cx},${B.y}`; lx = (A.cx + B.cx) / 2; ly = y - lift + 6; }
          else { const x = Math.max(A.x + A.w, B.x + B.w), push = 26; d = `M${A.x + A.w},${A.cy} C${x + push},${A.cy} ${x + push},${B.cy} ${B.x + B.w},${B.cy}`; lx = x + push + 2; ly = (A.cy + B.cy) / 2; }
        } else if (sameRow) {
          const dir = B.cx > A.cx ? 1 : -1, x1 = dir > 0 ? A.x + A.w : A.x, x2 = dir > 0 ? B.x : B.x + B.w, k = Math.abs(x2 - x1) * .45;
          d = `M${x1},${A.cy} C${x1 + dir * k},${A.cy} ${x2 - dir * k},${B.cy} ${x2},${B.cy}`;
        } else {
          const down = B.cy > A.cy ? 1 : -1, y1 = down > 0 ? A.y + A.h : A.y, y2 = down > 0 ? B.y : B.y + B.h, k = Math.abs(y2 - y1) * .5;
          d = `M${A.cx},${y1} C${A.cx},${y1 + down * k} ${B.cx},${y2 - down * k} ${B.cx},${y2}`;
        }
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', d); path.setAttribute('class', 'wire' + (kind === 'loop' ? ' loop' : ''));
        wireSvg.append(path); wires[`${a}>${b}${kind ? '!' : ''}`] = path;
        if (label) { const t = document.createElementNS(NS, 'text'); t.setAttribute('x', lx); t.setAttribute('y', ly); t.setAttribute('text-anchor', 'middle'); if (!sameRow) t.setAttribute('transform', `rotate(90 ${lx} ${ly})`); t.setAttribute('class', 'wire-label'); t.textContent = label; wireSvg.append(t); }
      });
    };

    const log = (time, text, cls = 'g') => { consoleEl.append(h('div', {}, h('span', { class: 't' }, time + ' '), h('span', { class: cls }, text))); consoleEl.scrollTop = consoleEl.scrollHeight; };
    const spark = key => new Promise(res => {
      const path = wires[key]; if (!path) return res();
      path.classList.add('flowing');
      if (reduce) return res();
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 4.5); c.setAttribute('class', 'spark'); wireSvg.append(c);
      const L = path.getTotalLength(), t0 = performance.now(), dur = 600;
      const step = now => { const k = Math.min(1, (now - t0) / dur), pt = path.getPointAtLength(L * k); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); if (k < 1) requestAnimationFrame(step); else { c.remove(); res(); } };
      requestAnimationFrame(step);
    });
    const light = (i, cls = 'done') => { const n = nodes[i]; n.classList.remove('warn'); n.classList.add('lit', cls); setTimeout(() => n.classList.remove('lit'), reduce ? 0 : 900); };

    const runBtn = h('button', { class: 'run', type: 'button' }, p.run_label || 'Run a sample');
    let running = false, clock = 0;
    const stamp = () => { clock += 1 + Math.floor(Math.random() * 2); return `00:${pad2(clock)}`; };
    const run = async () => {
      if (running) return; running = true; runBtn.disabled = true; clock = 0;
      nodes.forEach(n => n.classList.remove('done', 'warn', 'lit'));
      Object.values(wires).forEach(w => w.classList.remove('flowing'));
      consoleEl.replaceChildren();
      log('00:00', p.start_log || 'Run started');
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        if (i) await spark(`${i - 1}>${i}`);
        if (st.loop && st.warn) {
          nodes[i].classList.add('warn'); showDetail(i); log(stamp(), st.warn, 'w'); await wait(650);
          await spark(`${i}>${st.loop.to}!`); light(st.loop.to); log(stamp(), st.loop.log || 'Fixed and re-run'); await wait(250);
          await spark(`${st.loop.to}>${i}`).catch(() => {});
        }
        light(i); if (i === 0 || st.tools || st.skills) showDetail(i);
        log(stamp(), st.log || `${st.title} ✓`); await wait(280);
      }
      log(stamp(), p.end_log || 'Done ✓');
      running = false; runBtn.disabled = false; runBtn.textContent = 'Run it again';
    };
    runBtn.addEventListener('click', run);

    const root = h('div', { class: 'diagram' },
      h('div', { class: 'd-top' }, h('span', { class: 'lbl' }, h('b', {}, '● '), `pipeline: ${id}${p.trigger ? ' · trigger: ' + p.trigger : ''}`), runBtn),
      flow, h('div', { class: 'd-bottom' }, consoleEl, detail),
      (p.claude_does || p.i_do) ? h('div', { class: 'd-role' }, p.claude_does && h('span', {}, h('b', {}, 'Claude does: '), p.claude_does), p.i_do && h('span', {}, h('b', {}, 'I do: '), p.i_do)) : null);
    // measure once it is in the page
    requestAnimationFrame(() => { geom(); showDetail(Math.min(2, steps.length - 1)); });
    if ('ResizeObserver' in window) new ResizeObserver(geom).observe(flow); else addEventListener('resize', geom);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(geom);
    if ('IntersectionObserver' in window && !reduce) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: .45 }); io.observe(flow); }
    return root;
  };

  const fillWorkflow = (el, ctx) => {
    const only = el.dataset.pipeline;
    const ids = (only ? [only] : Object.keys(ctx.pipelines)).filter(id => ctx.pipelines[id]);
    if (!ids.length) { el.replaceChildren(h('div', { class: 'studio-state' }, 'The workflow will appear here soon.')); return; }
    const panel = h('div', { role: 'tabpanel' });
    const show = id => { const p = ctx.pipelines[id]; panel.replaceChildren(...[p.intro && h('p', { class: 'flow-intro' }, p.intro), diagram(id, p, ctx), p.note && h('p', { class: 'mono-note flow-note' }, p.note)].filter(Boolean)); };
    if (ids.length === 1) { show(ids[0]); el.replaceChildren(panel); return; }
    const buttons = ids.map((id, i) => h('button', { class: 'flow-tab', type: 'button', role: 'tab', 'aria-selected': i === 0 ? 'true' : 'false', onclick: () => { buttons.forEach((b, j) => b.setAttribute('aria-selected', String(i === j))); show(id); } }, ctx.pipelines[id].title || id));
    el.replaceChildren(h('div', { class: 'flow-tabs', role: 'tablist' }, buttons), panel);
    show(ids[0]);
  };

  /* ---------- Claude skills ---------- */
  const skillCard = (s, ctx, i) => {
    const projects = (s.projects && s.projects.length) ? s.projects.map(p => h('span', { class: 'chip-s' }, ctx.projectName(p))) : [h('span', { class: 'chip-s' }, 'All projects')];
    return h('article', { class: 'skill-card', style: `--d:${Math.min(i, 8) * 0.06}s` },
      h('div', { class: 'head' }, h('span', { class: 'mark', 'aria-hidden': 'true' }, (s.name || '?').trim()[0].toUpperCase()),
        h('div', {}, h('h3', {}, s.name), h('div', { class: 'role' }, s.role || s.category))),
      s.summary && h('p', { class: 'sum' }, s.summary),
      (s.responsibilities && s.responsibilities.length) && h('div', {}, h('div', { class: 'label' }, 'Responsibilities'), h('ul', {}, s.responsibilities.map(r => h('li', {}, r)))),
      h('div', {}, h('div', { class: 'label' }, 'Used in'), h('div', { class: 'chips' }, projects)),
      h('div', { class: 'foot' }, h('span', {}, `skill: ${s.id}${s.version ? ' · v' + s.version : ''}`), h('a', { href: s.url, target: '_blank', rel: 'noopener' }, 'Source ↗')));
  };

  const fillSkills = (el, ctx) => {
    if (!ctx.skills.length) { el.replaceChildren(h('div', { class: 'studio-state' }, 'My Claude skills will be listed here soon.')); return; }
    el.replaceChildren(...ctx.skills.map((s, i) => skillCard(s, ctx, i)));
  };

  /* ---------- studio page ---------- */
  const fillStudioPage = ctx => {
    const studio = ctx.studio(html.dataset.studio);
    if (!studio) return;
    document.querySelectorAll('[data-studio-tagline]').forEach(n => { n.textContent = studio.description || studio.tagline; });
    const mine = ctx.itemsOf(studio.id);
    const fresh = mine.filter(x => isNew(x, ctx.newDays)).length;
    const noun = studio.kind === 'app' ? 'app' : 'video';
    document.querySelectorAll('[data-studio-count]').forEach(n => {
      n.replaceChildren(...[h('span', {}, h('b', {}, String(mine.length)), ` ${noun}${mine.length === 1 ? '' : 's'}`),
        fresh ? h('span', { class: 'pill-new' }, `${fresh} new`) : null].filter(Boolean));
    });
    const out = document.querySelector('[data-outputs]');
    if (out) {
      if (!mine.length) out.replaceChildren(h('div', { class: 'studio-state' }, h('strong', {}, 'Nothing here yet. '), `The first ${studio.name.replace(/ Studio$/, '').toLowerCase()} ${noun} will appear as soon as it is delivered.`));
      else { out.classList.add('out-grid'); if (studio.kind === 'app') out.classList.add('apps'); out.replaceChildren(...mine.map((it, i) => card(it, ctx, i))); }
    }
    const wf = document.querySelector('[data-workflow]');
    if (wf && !wf.dataset.pipeline) wf.dataset.pipeline = studio.pipeline;
    const used = document.querySelector('[data-skills-used]');
    if (used) {
      const ids = ctx.pipelineSkills(studio.pipeline);
      const list = ids.map(id => ctx.skill(id)).filter(Boolean);
      used.replaceChildren(...(list.length ? list.map((s, i) => skillCard(s, ctx, i)) : [h('div', { class: 'studio-state' }, 'No custom Claude skills are attached to this studio yet.')]));
    }
    const others = document.querySelector('[data-other-studios]');
    if (others) others.replaceChildren(...ctx.studios.filter(s => s.id !== studio.id).map((s, i) => studioTile(s, ctx, i, false)));
  };

  /* ---------- go ---------- */
  Promise.all(['studios', 'projects', 'videos', 'skills', 'workflow'].map(load)).then(data => {
    const ctx = makeCtx(data);
    if (!ctx.studios.length) {
      document.querySelectorAll('[data-studio-grid], [data-latest], [data-outputs]').forEach(n => n.replaceChildren(h('div', { class: 'studio-state' }, 'The studio could not be loaded. Please refresh the page.')));
      return;
    }
    if (html.dataset.studio) fillStudioPage(ctx);
    document.querySelectorAll('[data-studio-grid]').forEach(n => fillStudios(n, ctx));
    document.querySelectorAll('[data-latest]').forEach(n => fillLatest(n, ctx));
    document.querySelectorAll('[data-workflow]').forEach(n => fillWorkflow(n, ctx));
    document.querySelectorAll('[data-skills]').forEach(n => fillSkills(n, ctx));
    document.querySelectorAll('[data-studio-total]').forEach(n => { const c = ctx.itemsOf(n.dataset.studioTotal).length; if (c) n.textContent = String(c); });
    document.querySelectorAll('[data-new-total]').forEach(n => { const c = ctx.items.filter(x => isNew(x, ctx.newDays)).length; if (c) n.replaceChildren(h('span', { class: 'pill-new' }, `${c} new`)); });
    window.dispatchEvent(new CustomEvent('studio:ready', { detail: { items: ctx.items.length } }));
  });
})();
