/*
 * Google Analytics 4 tracking for syndeeann.github.io/my-portfolio
 * Tracking plan and Looker Studio guide: docs/ANALYTICS.md
 *
 * SETUP: paste your GA4 Measurement ID below (Admin > Data streams > your web stream).
 * Until it is set, nothing is sent to Google. Add ?ga_debug=1 to any page URL to see
 * every event in the browser console and in GA4 DebugView.
 */
(function () {
  'use strict';

  var GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';   // <-- your Measurement ID
  var SITE_VERSION = 'v4';

  /* ---------- page context (from <meta name="analytics-*"> tags) ---------- */
  var meta = function (name, fallback) {
    var el = document.querySelector('meta[name="analytics-' + name + '"]');
    return (el && el.getAttribute('content')) || fallback;
  };
  var PAGE_TYPE = meta('page-type', 'portfolio');      // portfolio | workflow
  var WORKFLOW = meta('workflow', '(none)');            // e.g. kwento_kilabot
  var enabled = /^G-[A-Z0-9]{4,}$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';
  var debug = /[?&]ga_debug=1/.test(location.search);

  /* ---------- gtag ---------- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (enabled) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('set', { page_type: PAGE_TYPE, workflow_name: WORKFLOW, site_version: SITE_VERSION });
    var cfg = { page_type: PAGE_TYPE, workflow_name: WORKFLOW, site_version: SITE_VERSION };
    if (debug) cfg.debug_mode = true;
    window.gtag('config', GA_MEASUREMENT_ID, cfg);
  } else if (debug) {
    console.info('[analytics] Measurement ID not set: events are logged here only.');
  }

  /* ---------- helpers ---------- */
  var clean = function (v) {
    if (v === undefined || v === null) return v;
    if (typeof v !== 'string') return v;
    return v.replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{FE0F}↗→]/gu, '')
      .replace(/\s+/g, ' ').trim().slice(0, 100);
  };
  var track = function (name, params) {
    var p = { page_type: PAGE_TYPE, workflow_name: WORKFLOW, site_version: SITE_VERSION };
    for (var k in params || {}) if (Object.prototype.hasOwnProperty.call(params, k)) p[k] = clean(params[k]);
    if (debug) console.info('[analytics]', name, p);
    if (enabled) window.gtag('event', name, p);
  };
  window.track = track;

  /* friendly section names: element id -> section_name */
  var SECTIONS = {
    top: 'hero', focus: 'focus', studio: 'ai_studio', credentials: 'credentials', origin: 'background', contact: 'contact',
    gate: 'hero', workflow: 'workflow_diagram', videos: 'videos', channels: 'channels'
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
  var workflowFromUrl = function (url) {
    var m = /studio\/([a-z0-9-]+)/i.exec(url || '');
    return m ? m[1].replace(/-/g, '_').replace(/\.html$/, '') : '(unknown)';
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
    if (isLink && /studio\/[a-z0-9-]+/i.test(el.getAttribute('href') || '')) track('workflow_open', { workflow_name: workflowFromUrl(el.getAttribute('href')), link_group: group });
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
