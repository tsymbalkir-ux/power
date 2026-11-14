// Аналітика: Google tag (GA4 + Google Ads), Microsoft Clarity, джерела трафіку (UTM / gclid) і події.
// Ідентифікатори задаються в assets/config.js → analytics. Підключати в <head> одразу після config.js.
(function () {
  'use strict';
  var A = (window.SITE_CONFIG || {}).analytics || {};
  var CUR = 'UAH';

  /* ---------- джерело трафіку: перший і останній візит з міткою ---------- */
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid'];
  function sget(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var qs = {};
  try { new URLSearchParams(location.search).forEach(function (v, k) { if (KEYS.indexOf(k) > -1 && v) qs[k] = v.slice(0, 150); }); } catch (e) {}
  if (!Object.keys(qs).length && document.referrer) {
    try {
      var rh = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (rh && rh !== location.hostname.replace(/^www\./, '')) qs = { utm_source: rh, utm_medium: /google|bing|duckduckgo|yahoo|ecosia/.test(rh) ? 'organic' : 'referral' };
    } catch (e) {}
  }
  if (Object.keys(qs).length) {
    qs.ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
    qs.landing = location.pathname;
    if (!sget('attr-first')) sset('attr-first', qs);
    sset('attr-last', qs);
  }
  function attribution() {
    var a = sget('attr-last') || sget('attr-first');
    if (!a) return 'прямий захід';
    var src = (a.gclid || a.gbraid || a.wbraid) ? 'google / cpc' : (a.utm_source || '?') + ' / ' + (a.utm_medium || '?');
    return src + (a.utm_campaign ? ' · ' + a.utm_campaign : '') + (a.utm_term ? ' · «' + a.utm_term + '»' : '');
  }

  /* ---------- Google tag: GA4 + Google Ads ---------- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  var gtag = window.gtag;
  var tagIds = [A.ga4, A.googleAds].filter(Boolean);
  if (tagIds.length) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(tagIds[0]);
    document.head.appendChild(s);
    gtag('js', new Date());
    // Режим згоди v2: Україна не в ЄЕЗ, тож за замовчуванням дозволено; для відвідувачів з ЄЕЗ/UK/CH — заборонено до згоди
    gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
      region: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH']
    });
    gtag('set', 'url_passthrough', true);
    if (A.ga4) gtag('config', A.ga4);
    if (A.googleAds) gtag('config', A.googleAds, { allow_enhanced_conversions: true });
  }

  /* ---------- Microsoft Clarity ---------- */
  if (A.clarity) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', A.clarity);
    var a0 = sget('attr-last');
    if (a0) {
      if (a0.utm_source) window.clarity('set', 'utm_source', a0.utm_source);
      if (a0.utm_campaign) window.clarity('set', 'utm_campaign', a0.utm_campaign);
      if (a0.gclid) window.clarity('set', 'paid', 'google_ads');
    }
  }

  /* ---------- API для сайту ---------- */
  function item(p, qty) {
    return { item_id: p.id, item_name: p.name, item_brand: p.brand, item_category: p.cat, price: p.price, quantity: qty || 1 };
  }
  function track(name, params) {
    params = params || {};
    try { gtag('event', name, params); } catch (e) {}
    try { if (window.clarity) window.clarity('event', name); } catch (e) {}
  }
  function adsConversion(label, params) {
    if (!A.googleAds || !label) return;
    gtag('event', 'conversion', Object.assign({ send_to: A.googleAds + '/' + label }, params || {}));
  }

  window.SiteAnalytics = {
    track: track,
    attribution: attribution,
    viewItem: function (p) {
      track('view_item', { currency: CUR, value: p.price, items: [item(p)] });
    },
    beginCheckout: function (items, total, kind) {
      track('begin_checkout', { currency: CUR, value: total, order_type: kind, items: items.map(function (x) { return item(x[0], x[1]); }) });
    },
    lead: function (items, total, kind, contact) {
      var txn = 'L' + Date.now().toString(36);
      // розширені конверсії: Google хешує телефон на своєму боці
      if (contact && contact.phone) {
        var ph = contact.phone.replace(/[^\d+]/g, '');
        if (ph.charAt(0) !== '+') ph = (ph.indexOf('380') === 0 ? '+' : ph.charAt(0) === '0' ? '+38' : '+') + ph;
        try { gtag('set', 'user_data', { phone_number: ph }); } catch (e) {}
      }
      track('generate_lead', { currency: CUR, value: total, order_type: kind, lead_source: attribution(), items: items.map(function (x) { return item(x[0], x[1]); }) });
      adsConversion(A.adsLeadLabel, { value: total, currency: CUR, transaction_id: txn });
      try { if (window.clarity) window.clarity('upgrade', 'lead'); } catch (e) {}
    }
  };

  /* ---------- кліки по контактах (на всіх сторінках) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var method = /^tel:/.test(h) ? 'phone' : /t\.me\//.test(h) ? 'telegram' : /^viber:/.test(h) ? 'viber' : /^mailto:/.test(h) ? 'email' : '';
    if (!method) return;
    var where = a.closest('#oModal') ? 'order_form' : a.closest('#siteHeader') ? 'header' : a.closest('#siteFooter') ? 'footer' : 'page';
    track('contact_click', { method: method, placement: where });
    if (method === 'phone' || method === 'telegram' || method === 'viber') adsConversion(A.adsCallLabel);
  }, true);
})();
