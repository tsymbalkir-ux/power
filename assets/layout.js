// Спільні шапка й підвал для всіх сторінок + підстановка значень з config.js
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var isHome = document.body.dataset.page === 'home';
  var home = isHome ? '' : './';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var tel = CFG.phone ? 'tel:' + CFG.phone.replace(/[^\d+]/g, '') : '';

  var PAGES = [
    ['oplata-dostavka.html', 'Оплата і доставка'],
    ['povernennya.html', 'Повернення та обмін'],
    ['garantiya.html', 'Гарантія'],
    ['kontakty.html', 'Контакти та реквізити'],
    ['oferta.html', 'Публічна оферта'],
    ['privacy.html', 'Конфіденційність']
  ];

  var h = document.getElementById('siteHeader');
  if (h) {
    h.className = 'top';
    h.innerHTML = '<div class="wrap">' +
      '<a class="logo" href="' + (home || './') + '"><span class="logo-mark"><svg viewBox="0 0 24 24" fill="#ffbf1f"><path d="M13.5 2 4 14h6.5L9.5 22 20 9.5h-6.6L13.5 2z"/></svg></span><span>' + esc(CFG.brand) + '</span></a>' +
      '<nav class="nav" id="nav">' +
      '<a href="' + home + '#pidbir">Підбір</a>' +
      '<a href="' + home + '#catalog">Каталог</a>' +
      '<a href="oplata-dostavka.html">Оплата і доставка</a>' +
      '<a href="garantiya.html">Гарантія</a>' +
      '<a href="kontakty.html">Контакти</a>' +
      '</nav>' +
      (CFG.phone ? '<a class="phone" href="' + tel + '">' + esc(CFG.phone) + '</a>' : '') +
      '<button class="burger" aria-label="Меню" id="burger"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      '</div>';
    document.getElementById('burger').addEventListener('click', function () { document.getElementById('nav').classList.toggle('open'); });
    Array.prototype.forEach.call(h.querySelectorAll('#nav a'), function (a) {
      a.addEventListener('click', function () { document.getElementById('nav').classList.remove('open'); });
      if (a.getAttribute('href') === location.pathname.split('/').pop()) a.setAttribute('aria-current', 'page');
    });
  }

  var f = document.getElementById('siteFooter');
  if (f) {
    var contacts = [];
    if (CFG.phone) contacts.push('<a href="' + tel + '">' + esc(CFG.phone) + '</a>');
    if (CFG.email) contacts.push('<a href="mailto:' + esc(CFG.email) + '">' + esc(CFG.email) + '</a>');
    if (CFG.telegram) contacts.push('<a href="https://t.me/' + esc(CFG.telegram) + '" target="_blank" rel="noopener">Telegram @' + esc(CFG.telegram) + '</a>');
    if (CFG.hours) contacts.push('<span>' + esc(CFG.hours) + '</span>');
    var L = CFG.legal || {};
    f.className = 'foot-site';
    f.innerHTML = '<div class="wrap foot-grid">' +
      '<div><a class="logo" href="' + (home || './') + '"><span class="logo-mark"><svg viewBox="0 0 24 24" fill="#ffbf1f"><path d="M13.5 2 4 14h6.5L9.5 22 20 9.5h-6.6L13.5 2z"/></svg></span><span>' + esc(CFG.brand) + '</span></a>' +
      '<p>Інвертори, акумулятори LiFePO4 і готові системи резервного живлення.</p></div>' +
      '<div><h4>Магазин</h4><a href="' + home + '#pidbir">Онлайн-підбір</a><a href="' + home + '#catalog">Каталог</a><a href="' + home + '#faq">Питання</a></div>' +
      '<div><h4>Покупцям</h4>' + PAGES.map(function (p) { return '<a href="' + p[0] + '">' + p[1] + '</a>'; }).join('') + '</div>' +
      '<div><h4>Контакти</h4>' + contacts.join('') + '</div>' +
      '</div><div class="wrap foot-bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(CFG.brand) + (L.name ? ' · ' + esc(L.name) : '') + '</span><span>Ціни вказано в гривнях.</span></div>';
  }

  // підстановка значень з конфігу: <span data-v="legal.iban"></span>
  Array.prototype.forEach.call(document.querySelectorAll('[data-cfgv]'), function (el) {
    var v = el.dataset.cfgv.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, CFG);
    if (v) el.textContent = v;
    else if (el.hasAttribute('data-hide-empty')) { var row = el.closest('[data-row]'); (row || el).remove(); }
    else { el.textContent = 'не вказано'; el.classList.add('todo'); }
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-list]'), function (el) {
    var list = CFG[el.dataset.list] || [];
    el.innerHTML = list.map(function (x) { return '<div class="info-card"><h3>' + esc(x[0]) + '</h3><p>' + esc(x[1]) + '</p></div>'; }).join('');
  });
})();
