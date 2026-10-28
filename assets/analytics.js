/*
 * Analytics for syndeeann.github.io/my-portfolio, via Google Tag Manager (GTM-K8G85R8D).
 *
 * This file only pushes events to the data layer. Google Tag Manager turns each one into a
 * GA4 event (G-X3XPDCS4SZ): one custom-event trigger + one GA4 event tag per event, with a
 * data layer variable for every parameter. Tracking plan + Looker Studio guide: docs/ANALYTICS.md
 *
 * Add ?ga_debug=1 to any page URL to log every data layer push in the browser console,
 * or use Preview in Google Tag Manager to watch tags fire.
 */
(function () {
  'use strict';

  var GTM_CONTAINER_ID = 'GTM-K8G85R8D';
  var SITE_VERSION = 'v4';

  /* ---------- page context (from <meta name="analytics-*"> tags) ---------- */
  var meta = function (name, fallback) {
    var el = document.querySelector('meta[name="analytics-' + name + '"]');
    return (el && el.getAttribute('content')) || fallback;
  };
  var PAGE_TYPE = meta('page-type', 'portfolio');      // portfolio | workflow
  var WORKFLOW = meta('workflow', '(none)');            // e.g. kwento_kilabot
  var debug = /[?&]ga_debug=1/.test(location.search);

  /* ---------- data layer + Google Tag Manager ---------- */
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ page_type: PAGE_TYPE, workflow_name: WORKFLOW, site_version: SITE_VERSION });
  (function (w, d, l, i) {
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var j = d.createElement('script');
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i;
    d.head.appendChild(j);
  })(window, document, 'dataLayer', GTM_CONTAINER_ID);

  /* every parameter any event uses: cleared on each push so values never leak between events */
  var KEYS = ['section_name', 'percent_scrolled', 'link_text', 'link_url', 'link_type', 'link_group', 'link_platform',
    'interaction_type', 'interaction_label', 'video_title', 'video_url', 'video_provider', 'video_id', 'video_number',
    'video_source', 'video_destination', 'video_percent', 'video_current_time', 'video_duration', 'contact_method'];

  /* ---------- helpers ---------- */
  var clean = function (v) {
    if (v === undefined || v === null) return v;
    if (typeof v !== 'string') return v;
    return v.replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
      .replace(/\s+/g, ' ').trim().slice(0, 100);
  };
  var track = function (name, params) {
    var p = { page_type: PAGE_TYPE, workflow_name: WORKFLOW, site_version: SITE_VERSION };
    for (var k in params || {}) if (Object.prototype.hasOwnProperty.call(params, k)) p[k] = clean(params[k]);
    var push = { event: name };
    KEYS.forEach(function (key) { push[key] = undefined; });
    for (var q in p) push[q] = p[q];
    if (debug) console.info('[analytics]', name, p);
    window.dataLayer.push(push);
  };
  window.track = track;

  /* friendly section names: element id -> section_name */
  var SECTIONS = {
    top: 'hero', focus: 'focus', studio: 'ai_studio', credentials: 'credentials', origin: 'background', contact: 'contact',
    gate: 'hero', workflow: 'workflow_diagram', videos: 'videos', channels: 'channels',
    /* portfolio-updater:sections:begin */
    outputs: 'studio_outputs', skills: 'skills_used', studios: 'other_studios', 'claude-skills': 'claude_skills'
    /* portfolio-updater:sections:end */
  };
  var groupOf = function (el) {
    if (el.closest('nav')) return 'nav';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.modal')) return 'video_player';
    if (el.closest('.exit')) return 'exit';
    var node = el;
    while (node && node !== document.body) {
      if (node.id && SECTIONS[node.id]) return SECTIONS[node.id];
      node = node.parentElement;
    }
    return 'page';
  };
  var platformOf = function (url) {
    if (!url) return '(none)';
    if (/^mailto:/i.test(url)) return 'email';
    if (/youtu\.?be/i.test(url)) return 'youtube';
    if (/facebook\.com/i.test(url)) return 'facebook';
    if (/instagram\.com/i.test(url)) return 'instagram';
    if (/tiktok\.com/i.test(url)) return 'tiktok';
    if (/linkedin\.com/i.test(url)) return 'linkedin';
    if (/github\.com/i.test(url)) return 'github';
    if (/skillsoft\.com/i.test(url)) return 'skillsoft';
    try { return new URL(url, location.href).host === location.host ? 'site' : 'other'; } catch (e) { return 'other'; }
  };
  var linkTypeOf = function (a) {
    var raw = a.getAttribute('href') || '';
    if (raw === '#' || raw === '') return 'placeholder';
    if (/^mailto:/i.test(raw)) return 'email';
    if (/\.pdf($|[?#])/i.test(raw)) return 'document';
    if (raw.charAt(0) === '#') return 'anchor';
    try { return new URL(a.href, location.href).host === location.host ? 'internal' : 'outbound'; } catch (e) { return 'outbound'; }
  };
  var labelOf = function (el) {
    return el.getAttribute('data-track-label') || el.getAttribute('aria-label') || el.innerText || el.textContent || el.title || '(no text)';
  };
  /* studio pages and their workflow_name (kept in step with data/studios.json by the portfolio-updater skill) */
  /* portfolio-updater:studios:begin */
  var STUDIO_PAGES = {
    'ads/': 'ads',
    'kids/': 'kids',
    'apps/': 'apps',
    'studio/kwento-kilabot.html': 'kwento_kilabot'
  };
  /* portfolio-updater:studios:end */
  var studioOf = function (href) {
    var path;
    try { path = new URL(href, location.href).pathname; } catch (e) { return null; }
    for (var key in STUDIO_PAGES) {
      var k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp('(^|/)' + k + (key.slice(-1) === '/' ? '(index\\.html)?$' : '$')).test(path)) return STUDIO_PAGES[key];
    }
    return null;
  };

  /* ---------- every link and button click ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button');
    if (!el) return;
    var isLink = el.tagName === 'A';
    var url = isLink ? el.href : '';
    var group = groupOf(el);
    var label = labelOf(el);
    track('ui_click', {
      link_text: label,
      link_url: isLink ? url : '(button)',
      link_type: isLink ? linkTypeOf(el) : 'button',
      link_group: group,
      link_platform: isLink ? platformOf(url) : '(none)'
    });
    /* key events */
    if (isLink && /\.pdf($|[?#])/i.test(el.getAttribute('href') || '')) track('cv_open', { link_group: group });
    if (isLink && /^mailto:/i.test(el.getAttribute('href') || '')) track('contact_intent', { contact_method: 'email_app', link_group: group });
    if (el.id === 'copyBtn') track('contact_intent', { contact_method: 'copy_email', link_group: group });
    if (isLink && /linkedin\.com/i.test(url)) track('contact_intent', { contact_method: 'linkedin', link_group: group });
    var wf = isLink && studioOf(el.getAttribute('href') || '');
    if (wf) track('workflow_open', { workflow_name: wf, link_group: group });
  }, true);

  /* ---------- section views + scroll depth ---------- */
  var onReady = function (fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); };
  onReady(function () {
    if ('IntersectionObserver' in window) {
      var seen = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var name = SECTIONS[en.target.id];
          if (en.isIntersecting && name && !seen[name]) { seen[name] = true; track('section_view', { section_name: name }); io.unobserve(en.target); }
        });
      }, { threshold: 0.35 });
      Object.keys(SECTIONS).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
    }
    var marks = [25, 50, 75, 90, 100], hit = {};
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      if (max <= 0) return;
      var pct = (scrollY / max) * 100;
      marks.forEach(function (m) { if (pct >= m - 0.5 && !hit[m]) { hit[m] = true; track('scroll_depth', { percent_scrolled: m }); } });
    };
    addEventListener('scroll', onScroll, { passive: true });
  });
})();
