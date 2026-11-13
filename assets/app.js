(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var P = window.PRODUCTS || [];
  var byId = {};
  P.forEach(function (p) { byId[p.id] = p; p.slug = p.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'); });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return Math.round(n).toLocaleString('uk-UA').replace(/,/g, ' ') + ' ' + (CFG.currency || '₴'); };
  var num = function (n, d) { return (+n).toLocaleString('uk-UA', { maximumFractionDigits: d == null ? 1 : d }); };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- config ---------- */
  $$('[data-cfg="brand"]').forEach(function (el) { el.textContent = CFG.brand || ''; });
  document.title = (CFG.brand || '') + ' — підбір системи резервного живлення';
  var telHref = CFG.phone ? 'tel:' + CFG.phone.replace(/[^\d+]/g, '') : '';

  function contactLinks() {
    var out = [];
    if (CFG.phone) out.push('<a href="' + telHref + '">📞<span>' + esc(CFG.phone) + '<small>Дзвінок</small></span></a>');
    if (CFG.telegram) out.push('<a href="https://t.me/' + esc(CFG.telegram) + '" target="_blank" rel="noopener">✈️<span>@' + esc(CFG.telegram) + '<small>Telegram</small></span></a>');
    if (CFG.viber) out.push('<a href="viber://chat?number=' + encodeURIComponent(CFG.viber.replace(/[^\d+]/g, '')) + '">💬<span>' + esc(CFG.viber) + '<small>Viber</small></span></a>');
    if (CFG.email) out.push('<a href="mailto:' + esc(CFG.email) + '">✉️<span>' + esc(CFG.email) + '<small>Email</small></span></a>');
    if (CFG.city || CFG.hours) out.push('<div>📍<span>' + esc(CFG.city || '') + '<small>' + esc(CFG.hours || '') + '</small></span></div>');
    return out.join('');
  }
  $('#cLinks').innerHTML = contactLinks();

  /* ---------- helpers for products ---------- */
  var CAT = {
    kit: { t: 'Комплекти', one: 'Комплект' },
    inverter: { t: 'Інвертори', one: 'Інвертор' },
    battery: { t: 'Акумулятори 24/48 В', one: 'Акумулятор' },
    hv: { t: 'Високовольтні HV', one: 'Система HV' }
  };
  function short(p) {
    var n = p.name;
    if (p.cat === 'inverter') {
      var m = n.match(/(Deye|Anern)\s+([A-Z0-9][A-Z0-9.\-]+)/);
      return m ? m[1] + ' ' + m[2].replace(/-EU.*$/, '') : n;
    }
    if (p.cat === 'battery' || p.cat === 'hv') {
      n = n.replace(/^(Акумуляторна батарея|Високовольтна система зберігання енергії)\s+/, '');
      n = n.replace(/\s*\(.*$/, '').replace(/\s+LiFePO4.*$/, '').replace(/\s+\d+(\.\d+)?\s*В\b/, '');
      return n;
    }
    n = n.split(':')[0].replace(/^(Система резервного живлення|Комплект резервного живлення|Система зберігання енергії)\s*(однофазн\S*|гібридн\S*)?\s*/, '');
    return n.replace(/\s+\d+(,\d+)?\s*кВт\s*\/.*$/, '').trim() || p.name;
  }
  function specList(p) {
    var s = [];
    if (p.kw) s.push(num(p.kw) + ' кВт');
    if (p.kwh) s.push(num(p.kwh, 2) + ' кВт·год');
    if (p.cat === 'inverter') { s.push(p.bus === 'HV' ? 'HV батареї' : p.bus + ' В'); s.push(p.phases + (p.phases === 1 ? ' фаза' : ' фази')); }
    if (p.volt) s.push(num(p.volt) + ' В');
    if (p.solar) s.push('☀ ' + num(p.solarKw || 0, 2) + ' кВт панелей');
    return s;
  }
  var ICON = {
    inverter: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3"><rect x="22" y="12" width="56" height="76" rx="8"/><rect x="34" y="24" width="32" height="18" rx="3"/><circle cx="50" cy="62" r="8"/><path d="M40 80h20"/></svg>',
    battery: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3"><rect x="26" y="16" width="48" height="74" rx="7"/><path d="M40 10h20v6H40z"/><path d="M36 74h28M36 62h28M36 50h28" stroke-width="5" stroke-linecap="round" opacity=".5"/><path d="m52 26-8 12h8l-4 10" stroke-linejoin="round"/></svg>',
    hv: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3"><rect x="24" y="10" width="52" height="18" rx="4"/><rect x="24" y="32" width="52" height="18" rx="4"/><rect x="24" y="54" width="52" height="18" rx="4"/><rect x="24" y="76" width="52" height="14" rx="4"/></svg>',
    kit: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3"><rect x="10" y="22" width="36" height="52" rx="6"/><rect x="18" y="30" width="20" height="12" rx="2"/><rect x="54" y="18" width="36" height="70" rx="6"/><path d="M62 70h20M62 58h20M62 46h20" stroke-width="5" stroke-linecap="round" opacity=".5"/></svg>'
  };
  function ph(p, i) {
    var src = p.img && p.img[i || 0];
    if (!src) return '<div class="ph-fallback">' + ICON[p.cat] + '</div>';
    return '<img src="' + esc(src) + '" alt="' + esc(p.name) + '" loading="lazy" data-cat="' + p.cat + '">';
  }
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t.tagName === 'IMG' && t.dataset.cat) {
      var d = document.createElement('div'); d.className = 'ph-fallback'; d.innerHTML = ICON[t.dataset.cat];
      t.replaceWith(d);
    }
  }, true);

  var kits = P.filter(function (p) { return p.cat === 'kit'; });

  /* =====================================================
     PICKER
     ===================================================== */
  // w — потужність під час роботи, avg — середнє споживання за годину, surge — кратність пускового струму
  var APPS = [
    { id: 'fridge', ic: '🧊', n: 'Холодильник', w: 150, avg: 60, surge: 4 },
    { id: 'freezer', ic: '❄️', n: 'Морозильна камера', w: 150, avg: 60, surge: 4 },
    { id: 'gasboiler', ic: '🔥', n: 'Газовий котел з насосом', w: 150, avg: 110, surge: 2 },
    { id: 'router', ic: '📶', n: 'Роутер, інтернет', w: 20, avg: 20 },
    { id: 'light', ic: '💡', n: 'LED-освітлення', w: 100, avg: 60, hint: 'на квартиру / поверх' },
    { id: 'tv', ic: '📺', n: 'Телевізор', w: 120, avg: 70 },
    { id: 'laptop', ic: '💻', n: 'Ноутбук', w: 70, avg: 50 },
    { id: 'pc', ic: '🖥️', n: "Комп'ютер", w: 350, avg: 200 },
    { id: 'cams', ic: '📹', n: 'Камери, охорона', w: 40, avg: 40 },
    { id: 'pump', ic: '💧', n: 'Насос свердловини', w: 1000, avg: 150, surge: 3 },
    { id: 'micro', ic: '🍲', n: 'Мікрохвильовка', w: 1200, avg: 60 },
    { id: 'kettle', ic: '☕', n: 'Електрочайник', w: 2000, avg: 80 },
    { id: 'washer', ic: '🧺', n: 'Пральна машина', w: 2000, avg: 250, surge: 2 },
    { id: 'dish', ic: '🍽️', n: 'Посудомийка', w: 1800, avg: 200 },
    { id: 'ac', ic: '🌬️', n: 'Кондиціонер', w: 1200, avg: 600, surge: 3 },
    { id: 'heater', ic: '♨️', n: 'Бойлер', w: 2000, avg: 400 },
    { id: 'stove', ic: '🍳', n: 'Електроплита (конфорка)', w: 2000, avg: 400 },
    { id: 'eboiler', ic: '🏭', n: 'Електрокотел / тепловий насос', w: 6000, avg: 2500, surge: 2 },
    { id: 'server', ic: '🗄️', n: 'Сервер, каса, POS', w: 300, avg: 250 },
    { id: 'coffee', ic: '☕', n: 'Кавомашина', w: 1500, avg: 150 }
  ];
  var APPMAP = {}; APPS.forEach(function (a) { APPMAP[a.id] = a; });
  var PRESETS = {
    flat: { fridge: 1, router: 1, light: 1, tv: 1, laptop: 1 },
    house: { fridge: 1, gasboiler: 1, router: 1, light: 2, tv: 1, laptop: 1, pump: 1, cams: 1 },
    biz: { router: 1, light: 2, pc: 3, server: 1, fridge: 1, coffee: 1, cams: 1 }
  };
  // старт порожній: користувач сам обирає прилади, типовий набір — лише за кнопкою
  var DEF = { obj: '', ph: '', sol: '', hours: 8, on: 4, mode: 'apps', ownAvg: '', ownPeak: '', qty: {} };
  var S = store.get('picker-v3') || JSON.parse(JSON.stringify(DEF));
  var OBJN = { flat: 'квартири', house: 'будинку', biz: 'офісу' };
  function renderPresets() {
    var row = $('#presetRow');
    if (!S.obj) { row.innerHTML = '<span class="muted">Натискайте на прилади або «+», щоб додати. Можна обрати об\'єкт вище — запропонуємо типовий набір.</span>'; return; }
    row.innerHTML = '<button type="button" class="link-btn" data-preset="' + S.obj + '">Додати типовий набір для ' + OBJN[S.obj] + '</button>' +
      (Object.keys(S.qty).length ? '<button type="button" class="link-btn" data-preset="">Очистити прилади</button>' : '');
  }

  function seg(id, key, onSet) {
    var el = $(id);
    function paint() { $$('button', el).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S[key]); }); }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      S[key] = b.dataset.v; if (onSet) onSet(b.dataset.v); paint(); update();
    });
    paint(); return paint;
  }
  var paintObj = seg('#objSeg', 'obj', function () { renderPresets(); });
  $('#presetRow').addEventListener('click', function (e) {
    var b = e.target.closest('[data-preset]'); if (!b) return;
    S.qty = b.dataset.preset ? JSON.parse(JSON.stringify(PRESETS[b.dataset.preset])) : {};
    renderApps(); update();
  });
  var paintPh = seg('#phSeg', 'ph');
  var paintSol = seg('#solSeg', 'sol');

  function renderApps() {
    $('#apps').innerHTML = APPS.map(function (a) {
      var q = S.qty[a.id] || 0;
      return '<div class="app' + (q ? ' on' : '') + '" data-id="' + a.id + '"><span class="ic">' + a.ic + '</span>' +
        '<span class="nm">' + esc(a.n) + '<small>' + (a.w >= 1000 ? num(a.w / 1000) + ' кВт' : a.w + ' Вт') + (a.hint ? ' · ' + a.hint : '') + '</small></span>' +
        '<span class="qty"><button data-d="-1" aria-label="Менше">−</button><span>' + q + '</span><button data-d="1" aria-label="Більше">+</button></span></div>';
    }).join('');
  }
  $('#apps').addEventListener('click', function (e) {
    var card = e.target.closest('.app'); if (!card) return;
    var id = card.dataset.id, b = e.target.closest('button');
    var q = S.qty[id] || 0;
    if (b) q = Math.max(0, Math.min(20, q + (+b.dataset.d)));
    else q = q ? 0 : 1;
    if (q) S.qty[id] = q; else delete S.qty[id];
    card.classList.toggle('on', !!q); $('span.qty span', card).textContent = q;
    update();
  });

  var hoursEl = $('#hours'), onEl = $('#onHours'), ownAvgEl = $('#ownAvg'), ownPeakEl = $('#ownPeak');
  hoursEl.value = S.hours; onEl.value = S.on; ownAvgEl.value = S.ownAvg; ownPeakEl.value = S.ownPeak;
  // режим споживання: прилади або власні цифри
  function paintMode() {
    $$('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === S.mode); });
    $('#modeApps').style.display = S.mode === 'apps' ? '' : 'none';
    $('#modeOwn').classList.toggle('on', S.mode === 'own');
  }
  $('#modeSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    S.mode = b.dataset.mode; paintMode(); update();
    if (S.mode === 'own') ownAvgEl.focus();
  });
  ownAvgEl.addEventListener('input', function () { S.ownAvg = ownAvgEl.value; update(); });
  ownPeakEl.addEventListener('input', function () { S.ownPeak = ownPeakEl.value; update(); });
  paintMode();
  hoursEl.addEventListener('input', function () { S.hours = +hoursEl.value; update(); });
  // цифри біля повзунків можна вписати вручну
  var hoursNum = $('#hoursNum'), onNum = $('#onNum');
  function numInput(el, key, rangeEl, min, max) {
    el.addEventListener('input', function () {
      var v = Math.round(+el.value);
      if (!el.value || isNaN(v)) return;
      S[key] = Math.max(min, Math.min(max, v)); rangeEl.value = S[key]; update();
    });
    el.addEventListener('blur', function () { el.value = S[key]; });
  }
  numInput(hoursNum, 'hours', hoursEl, 1, 24);
  onEl.addEventListener('input', function () { S.on = +onEl.value; update(); });
  numInput(onNum, 'on', onEl, 1, 12);
  // плашки графіка: «світло X год є, Y год немає»
  $('#schedSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    S.on = +b.dataset.on; S.hours = +b.dataset.off; onEl.value = S.on; hoursEl.value = S.hours; update();
  });
  function paintSched() {
    $$('#schedSeg button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.on === S.on && +b.dataset.off === S.hours); });
  }
  $('#resetPicker').addEventListener('click', function () {
    S = JSON.parse(JSON.stringify(DEF)); hoursEl.value = S.hours; onEl.value = S.on; ownAvgEl.value = ''; ownPeakEl.value = ''; paintMode();
    paintObj(); paintPh(); paintSol(); renderApps(); update();
  });

  function calcNeed() {
    var sumW = 0, avgW = 0, surgeExtra = 0, heavy = [], count = 0;
    Object.keys(S.qty).forEach(function (id) {
      var a = APPMAP[id], q = S.qty[id]; if (!a || !q) return;
      count += q; sumW += a.w * q; avgW += a.avg * q;
      surgeExtra = Math.max(surgeExtra, a.w * ((a.surge || 1) - 1));
      if (a.w >= 1800) heavy.push(a.n);
    });
    // не всі прилади працюють одночасно: понад 3 кВт рахуємо 60% (коефіцієнт одночасності)
    var simult = sumW <= 3000 ? sumW : 3000 + (sumW - 3000) * 0.6;
    var own = S.mode === 'own';
    if (own) {
      // власні цифри: середнє за годину і (необов'язково) одночасний максимум
      avgW = Math.max(0, +S.ownAvg || 0); count = avgW > 0 ? 1 : 0; heavy = [];
      var pk = Math.max(0, +S.ownPeak || 0);
      simult = pk > 0 ? Math.max(pk, avgW) : Math.max(avgW * 3, 2000);
      surgeExtra = pk > 0 ? 0 : 0;
    }
    var peak = simult + surgeExtra;
    var needKw = Math.max(simult * 1.2, peak / 2) / 1000; // гібридні інвертори тримають 2× номіналу кілька секунд
    var needKwh = avgW * S.hours / (0.8 * 0.9) / 1000;     // 80% глибина розряду, 90% ККД
    var outKwh = avgW * S.hours / 0.9 / 1000;               // скільки забирають з батареї за відключення
    var needChargeKw = outKwh / (S.on * 0.95);              // яка потужність зарядки потрібна, щоб відновити це, поки світло є
    return { own: own, peakGuess: own && !(+S.ownPeak > 0), count: count, sumW: sumW, simult: simult, peak: peak, avgW: avgW, needKw: needKw, needKwh: needKwh, heavy: heavy, outKwh: outKwh, needChargeKw: needChargeKw };
  }

  /* ---------- зарядка від мережі ----------
     Потужність зарядки = менше з: струм заряду інвертора та допустимий струм батарей, × напруга батареї.
     Значення взято з описів товарів. Для комплектів — реальна потужність зарядки з їхніх описів. */
  var INV_CHARGE_A = {
    'PE-INV-DEYE-8K': 190, 'PE-INV-ANERN-4200': 60, 'PE-INV-DEYE-6K': 140, 'PE-INV-DEYE-6K-SG05': 135,
    'PE-INV-DEYE-6.6K-OG': 140, 'PE-INV-DEYE-10K': 250, 'PE-INV-DEYE-12K-1F': 250, 'PE-INV-DEYE-12K-3F': 240,
    'PE-INV-DEYE-15K-3F': 280, 'PE-INV-DEYE-20K-3F': 350, 'PE-INV-DEYE-30K-HV': 100, 'PE-INV-DEYE-50K-HV': 100
  };
  var BAT_CHARGE_A = { 'PE-TYT-16': 125, 'PE-TYT-8': 100, 'PE-GOBEL-16': 150, 'PE-DEYE-SEF16C': 100, 'PE-DEYE-SEF5PRO': 100 }; // HV — 50 А
  var KIT_CHARGE_KW = {
    'PE-PKG-MAX': 6.4, 'PE-PKG-OPTIMAL': 4, 'PE-PKG-HOME': 1.5, 'PE-PKG-DEYE6-TYT16': 6.4, 'PE-PKG-DEYE8-TYT16': 6.4,
    'PE-KIT-DEYE6-DYNPB16': 5.1, 'PE-KIT-DEYE6-SEF16': 5.1, 'PE-KIT-DEYE5-SEG51': 5.1, 'PE-KIT-DEYE6SG06-SEF5': 5.1,
    'PE-KIT-DEYE66OG-SEF5': 5.1, 'PE-KIT-DEYE6-DL5-RACK': 3.8, 'PE-KIT-DEYE6SG06-SEF16': 5.1, 'PE-KIT-DEYE6SG06-LVTG4': 7.2,
    'PE-KIT-MAXPLUS': 6.4, 'PE-KIT-HOME-SOLAR': 1.5, 'PE-KIT-AN13200-TYT-SOL': 6.4, 'PE-KIT-ANERN13200-DYNPB16': 5.1
  };
  function chargeKw(c) {
    if (c.kind === 'kit') return KIT_CHARGE_KW[c.main.id] || Math.min(c.kw, c.kwh * 0.5);
    var inv = c.parts[0][0], b = c.parts[1][0], n = c.parts[1][1];
    var batA = (b.cat === 'hv' ? 50 : (BAT_CHARGE_A[b.id] || 100)) * n;
    return Math.min(INV_CHARGE_A[inv.id] || 100, batA) * b.volt / 1000;
  }

  // Готові комплекти, що складаються з тих самих товарів каталогу: пари «інвертор + батарея»,
  // які їх повторюють, у підборі не показуємо — лишаємо тільки комплект.
  var KIT_SAME_AS = {
    'PE-PKG-HOME': 'PE-INV-ANERN-4200+1xPE-TYT-8',
    'PE-PKG-DEYE6-TYT16': 'PE-INV-DEYE-6K-SG05+1xPE-TYT-16',
    'PE-PKG-DEYE8-TYT16': 'PE-INV-DEYE-8K+1xPE-TYT-16',
    'PE-KIT-DEYE6-SEF16': 'PE-INV-DEYE-6K-SG05+1xPE-DEYE-SEF16C',
    'PE-KIT-DEYE6SG06-SEF5': 'PE-INV-DEYE-6K+1xPE-DEYE-SEF5PRO',
    'PE-KIT-DEYE66OG-SEF5': 'PE-INV-DEYE-6.6K-OG+1xPE-DEYE-SEF5PRO',
    'PE-KIT-DEYE6SG06-SEF16': 'PE-INV-DEYE-6K+1xPE-DEYE-SEF16C'
  };
  var DUP_BUILDS = {};
  Object.keys(KIT_SAME_AS).forEach(function (k) { DUP_BUILDS[KIT_SAME_AS[k]] = k; });

  // усі можливі конфігурації: готові комплекти + інвертор із батареями
  var INV = P.filter(function (p) { return p.cat === 'inverter'; });
  var BAT = P.filter(function (p) { return p.cat === 'battery' || p.cat === 'hv'; });
  function candidates(need) {
    var out = [];
    kits.forEach(function (k) {
      out.push({ key: k.id, kind: 'kit', title: k.name, main: k, parts: [[k, 1]], kw: k.kw, kwh: k.kwh, phases: k.phases || 1, solar: !!k.solar, price: k.price });
    });
    INV.forEach(function (inv) {
      BAT.filter(function (b) { return b.bus === inv.bus; }).forEach(function (b) {
        var n = b.cat === 'hv' ? 1 : Math.max(1, Math.min(4, Math.ceil(need.needKwh / b.kwh - 0.05)));
        if (DUP_BUILDS[inv.id + '+' + n + 'x' + b.id]) return; // такий готовий комплект уже є
        out.push({
          key: inv.id + '+' + n + 'x' + b.id, kind: 'build', main: inv,
          title: short(inv) + ' + ' + (n > 1 ? n + ' × ' : '') + short(b),
          parts: [[inv, 1], [b, n]], kw: inv.kw, kwh: b.kwh * n, phases: inv.phases, solar: false,
          price: inv.price + b.price * n
        });
      });
    });
    return out;
  }
  function evalCand(c, need) {
    c.hoursRun = need.avgW ? c.kwh * 0.8 * 0.9 * 1000 / need.avgW : 99;
    c.load = need.simult / (c.kw * 1000);
    c.okKw = c.kw >= need.needKw;
    c.okKwh = c.kwh >= need.needKwh * 0.95;
    c.phaseOk = S.ph === '3' ? true : c.phases === 1; // фаза не обрана — рахуємо як 1 фазу
    c.inBudget = true;
    // зарядка: за S.on годин світла з 20% (захисний мінімум)
    c.chargeKw = chargeKw(c);
    var usable = c.kwh * 0.8, cin = Math.min(c.chargeKw * S.on * 0.95, usable);
    c.chargeTo = Math.min(100, 20 + cin / c.kwh * 100);
    c.fullH = usable / (c.chargeKw * 0.95);
    c.okCharge = cin >= need.outKwh * 0.98; // заряду за час зі світлом вистачає на наступне відключення
    return c;
  }

  function pick(need) {
    var all = candidates(need).map(function (c) { return evalCand(c, need); }).filter(function (c) { return c.phaseOk; });
    // для 3 фаз з великим навантаженням — тільки трифазні
    var bigLoad = need.simult > 7000 || need.heavy.some(function (h) { return /Електрокотел/.test(h); });
    if (S.ph === '3' && bigLoad) all = all.filter(function (c) { return c.phases === 3; });
    // не пропонуємо надмірно потужні інвертори (понад 4× потреби) — вони тільки дорожчі
    all = all.filter(function (c) { return c.kw <= Math.max(need.needKw * 4, 8); });
    var byPrice = function (a, b) { return a.price - b.price || b.kwh - a.kwh; };
    var valid = all.filter(function (c) { return c.okKw && c.okKwh; }).sort(byPrice);
    var validB = valid.filter(function (c) { return c.inBudget; });
    var res = [];
    var used = {};
    function add(c, tag, best) { if (c && !used[c.key]) { used[c.key] = 1; res.push({ c: c, tag: tag, best: best }); } }

    // переважно ті, що встигають відновити заряд, поки світло є
    var charged = validB.filter(function (c) { return c.okCharge; });
    var pool = charged.length ? charged : validB;
    var first = pool[0];
    if (S.sol === 'yes') {
      var s = pool.filter(function (c) { return c.solar; })[0];
      if (s) first = s;
    }
    add(first, 'Оптимально', true);
    add(pool.filter(function (c) { return c.kwh >= need.needKwh * 1.4 && c.kw >= need.needKw * 1.3; })[0], 'З запасом');
    if (S.sol !== 'no') add(pool.filter(function (c) { return c.solar; })[0], 'З сонячними панелями');
    // економ: тягне всі прилади, але працює менше годин
    var eco = all.filter(function (c) { return c.okKw && !c.okKwh && c.kwh >= need.needKwh * 0.45 && c.inBudget && (!first || c.price < first.price); }).sort(byPrice)[0];
    add(eco, 'Економ');
    var over = !validB.length && valid.length ? valid[0] : null;
    return { res: res.slice(0, 3), all: valid, over: over, partial: !validB.length ? all.filter(function (c) { return c.inBudget && c.okKw; }).sort(function (a, b) { return b.kwh - a.kwh || a.price - b.price; })[0] : null };
  }

  function bar(v, cls) { return '<div class="bar"><i class="' + (cls || '') + '" style="width:' + Math.round(Math.max(4, Math.min(1, v) * 100)) + '%"></i></div>'; }
  function recCard(r, need) {
    var c = r.c, partsTxt = c.kind === 'kit' ? 'Готовий комплект' + (c.solar ? ' · панелі ' + num(c.main.solarKw, 2) + ' кВт' : '') : c.parts.map(function (x) { return (x[1] > 1 ? x[1] + ' × ' : '') + short(x[0]); }).join(' + ');
    var hrs = Math.min(c.hoursRun, 99), cov = hrs / S.hours;
    var load = c.load;
    var notes = [];
    if (S.ph === '3' && c.phases === 1) notes.push('живить одну фазу');
    if (S.sol === 'yes' && !c.solar) notes.push('панелі додаються окремо');
    return '<div class="rec' + (r.best ? ' best' : '') + '">' +
      '<div class="ph">' + ph(c.main) + '</div><div>' +
      '<span class="tag">' + esc(r.tag) + '</span>' +
      '<h4>' + esc(c.kind === 'kit' ? short(c.main) : c.title) + '</h4>' +
      '<div class="parts">' + esc(partsTxt) + ' · ' + num(c.kw) + ' кВт / ' + num(c.kwh, 2) + ' кВт·год' + (notes.length ? ' · ' + notes.join(', ') : '') + '</div>' +
      '<div class="meters">' +
      '<div class="meter"><span>Від повної батареї <b>≈ ' + (hrs >= 99 ? '99+' : num(hrs, 0)) + ' год</b></span>' + bar(cov, cov < 0.95 ? (cov < 0.7 ? 'low' : 'mid') : '') + '</div>' +
      '<div class="meter"><span>Завантаження інвертора <b>' + Math.round(load * 100) + '%</b></span>' + bar(load, load > 0.85 ? 'mid' : '') + '</div>' +
      '</div>' + chargeBlock(c, need) +
      '<div class="rec-foot"><span class="price">' + fmt(c.price) + '</span>' +
      '<button class="btn btn-ghost btn-sm" data-open="' + c.main.id + '">Деталі</button>' +
      '<button class="btn btn-dark btn-sm" data-order="' + esc(c.key) + '">Замовити</button></div>' +
      '</div></div>';
  }

  /* Блок зарядки. Порівнюємо в кВт·год, щоб батареї різної ємності було видно однаково:
     скільки енергії батарея набере, поки світло є (з 20% — захисного мінімуму),
     і скільки потрібно на наступний період без світла. */
  function chargeBlock(c, need) {
    var perH = c.chargeKw * 0.95 / c.kwh * 100;              // % заряду за 1 год світла
    var lvl = function (h) { return Math.min(100, 20 + perH * h); };
    var gain = function (h) { return (lvl(h) - 20) / 100 * c.kwh; }; // кВт·год, які можна використати
    var hs = [];
    if (S.on <= 6) { for (var i = 1; i <= S.on; i++) hs.push(i); }
    else hs = [1, 2, 3, 4, 6, S.on].filter(function (h, i, arr) { return h <= S.on && arr.indexOf(h) === i; });
    var X = lvl(S.on), got = gain(S.on), want = need.outKwh;
    var ok = got >= want * 0.98;
    var kwh = function (v) { return num(v, v < 10 ? 1 : 0) + ' кВт·год'; };

    var res;
    if (ok) {
      res = '<div class="chg-res ok">✓ Вистачить на ' + S.hours + ' год без світла' +
        '<small>Після відключення залишиться ≈ ' + kwh(got - want) + ' понад захисні 20% (батарея опуститься з ' + Math.round(X) + '% до ≈ ' + Math.round(X - want / c.kwh * 100) + '%).</small></div>';
    } else {
      var lastH = got * 0.9 * 1000 / need.avgW;
      var maxW = got * 0.9 * 1000 / S.hours;                 // яке споживання витягне цей заряд
      var tips = [];
      tips.push('зменшити споживання до ≈ <b>' + num(Math.floor(maxW / 10) * 10, 0) + ' Вт</b> за годину (зараз ' + num(need.avgW, 0) + ' Вт — на ' + num(Math.ceil((need.avgW - maxW) / 10) * 10, 0) + ' Вт менше)');
      if (X >= 99.5) {
        // батарея заряджається повністю, але її замало — потрібна більша
        tips.push('або батарею від ≈ <b>' + num(Math.ceil(want / 0.8 * 2) / 2) + ' кВт·год</b> (ця — ' + num(c.kwh, 2) + ')');
      } else {
        // батарея не встигає зарядитися — потрібно довше світло
        tips.push('або щоб світло було ≈ <b>' + num(Math.ceil(want / (c.chargeKw * 0.95) * 2) / 2) + ' год</b> (зараз ' + S.on + ')');
      }
      res = '<div class="chg-res bad">✗ Не вистачить: заряду вистачить на ≈ ' + num(lastH, 1) + ' год із ' + S.hours +
        '<small>Щоб вистачило на всі ' + S.hours + ' год, треба:</small><ul class="chg-tips">' + tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>';
    }

    return '<div class="chg">' +
      '<div class="chg-t">Світло дали — батарея ' + num(c.kwh, 2) + ' кВт·год заряджається з 20% (≈ ' + num(c.chargeKw, 1) + ' кВт на годину):</div>' +
      '<div class="chg-row">' + hs.map(function (h) {
        return '<span' + (h === S.on ? ' class="cur"' : '') + '>' + h + ' год → <b>' + Math.round(lvl(h)) + '%</b><i>+' + kwh(gain(h)) + '</i></span>';
      }).join('') + '</div>' +
      '<div class="chg-cmp">' +
      '<div><span>Набере за ' + S.on + ' год світла</span><b>' + kwh(got) + '</b></div>' +
      '<div class="' + (ok ? 'ok' : 'bad') + '"><span>Потрібно на ' + S.hours + ' год без світла</span><b>' + kwh(want) + '</b></div>' +
      '</div>' + res + '</div>';
  }

  var LAST = { cands: {} };
  function update() {
    store.set('picker-v3', S); renderPresets();
    if (document.activeElement !== hoursNum) hoursNum.value = S.hours;
    if (document.activeElement !== onNum) onNum.value = S.on;
    paintSched();
    var need = calcNeed();
    $('#appsCount').textContent = S.mode === 'apps' && need.count ? 'обрано: ' + need.count : '';
    var html = '';
    if (!need.count) {
      $('#result').innerHTML = '<div class="empty"><b style="color:var(--ink);font-size:17px">Розрахунок з\'явиться тут</b><br>' +
        (S.mode === 'own' ? 'Впишіть середнє споживання за годину (крок 4).' : 'Відмітьте прилади, які мають працювати без світла (крок 4), або впишіть своє споживання.') + ' Підбір оновлюється одразу.</div>';
      $('#mbar').classList.remove('show');
      return;
    }
    html += '<div class="need"><div class="eyebrow" style="color:var(--amber)">Ваша потреба</div>' +
      '<div class="need-grid">' +
      '<div class="need-box"><span>Інвертор від</span><b>' + num(Math.ceil(need.needKw * 2) / 2) + ' <small>кВт</small></b></div>' +
      '<div class="need-box"><span>Батарея від</span><b>' + num(Math.ceil(need.needKwh * 2) / 2) + ' <small>кВт·год</small></b></div>' +
      '<div class="need-box"><span>Зарядка від (за ' + S.on + ' год світла)</span><b>' + num(Math.ceil(need.needChargeKw * 10) / 10) + ' <small>кВт</small></b></div>' +
      '<div class="need-box"><span>Одночасне навантаження</span><b>' + num(need.simult / 1000, 1) + ' <small>кВт</small></b></div>' +
      '</div><div class="need-note">Графік: ' + S.hours + ' год без світла, ' + S.on + ' год світло є. За одне відключення ' + (need.own ? 'будинок витратить' : 'прилади витратять') + ' ≈ ' + num(need.avgW * S.hours / 1000, 1) + ' кВт·год (у середньому ' + num(need.avgW, 0) + ' Вт за годину). ' +
      (need.peakGuess ? 'Одночасний максимум не вказано — взяли ' + num(need.simult / 1000, 1) + ' кВт.' : 'Пусковий пік ≈ ' + num(need.peak / 1000, 1) + ' кВт.') + '</div></div>';

    if (!S.ph) html += '<div class="warn">ℹ️<span>Не обрано фазність мережі — рахуємо для 1 фази (220 В). Якщо у вас 3 фази, оберіть це в кроці 3.</span></div>';
    if (need.heavy.length) html += '<div class="warn">⚡<span><b>' + esc(need.heavy.join(', ')) + '</b> — потужні прилади. Вони різко скорочують час роботи від батареї; краще вмикати їх, коли є світло або сонце.</span></div>';

    if (need.needKw > 50 || need.needKwh > 42) {
      html += '<div class="warn">🏗️<span>Таке навантаження — це індивідуальний проєкт (кілька інверторів або HV-система). Надішліть розрахунок, і ми підготуємо пропозицію.</span></div>' +
        '<button class="btn btn-dark btn-block" data-order="__calc">Надіслати розрахунок</button>';
      $('#result').innerHTML = html; return;
    }
    var r = pick(need);
    LAST.cands = {}; LAST.need = need;
    r.all.concat(r.res.map(function (x) { return x.c; }), r.over ? [r.over] : [], r.partial ? [r.partial] : []).forEach(function (c) { LAST.cands[c.key] = c; });

    if (!r.res.length) {
      if (r.over) {
        html += '<div class="warn">💸<span>У межах бюджету повної системи немає. Найближчий варіант — на ' + '' + 'дорожче:</span></div>';
        html += recCard({ c: r.over, tag: 'Поза бюджетом', best: true }, need);
      }
      if (r.partial) html += recCard({ c: r.partial, tag: 'У межах бюджету, менше годин' }, need);
      if (!r.over && !r.partial) html += '<div class="empty">Не знайшли відповідної конфігурації. Зменште кількість потужних приладів або напишіть нам — підберемо індивідуально.</div>';
    } else {
      html += r.res.map(function (x) { return recCard(x, need); }).join('');
    }
    var rest = r.all.filter(function (c) { return c.inBudget && !r.res.some(function (x) { return x.c.key === c.key; }); });
    if (rest.length) {
      html += '<button class="alt-toggle" id="altT">Усі сумісні варіанти (' + rest.length + ')</button><div class="alt-list" id="altL">' +
        rest.slice(0, 30).map(function (c) {
          return '<div class="alt-row"><span class="a-n">' + esc(c.kind === 'kit' ? short(c.main) : c.title) + '<small>' + num(c.kw) + ' кВт · ' + num(c.kwh, 2) + ' кВт·год · ≈ ' + num(Math.min(c.hoursRun, 99), 0) + ' год · зарядка до ' + Math.round(c.chargeTo) + '%' + (c.okCharge ? '' : ' ⚠') + (c.solar ? ' · ☀' : '') + '</small></span><b>' + fmt(c.price) + '</b><button data-order="' + esc(c.key) + '">Замовити</button></div>';
        }).join('') + '</div>';
    }
    $('#result').innerHTML = html;
    $('#mbarT').innerHTML = '<b>від ' + num(Math.ceil(need.needKw * 2) / 2) + ' кВт · ' + num(Math.ceil(need.needKwh * 2) / 2) + ' кВт·год</b><br>' + (r.res.length ? 'Найкраще: ' + fmt(r.res[0].c.price) : 'Дивіться варіанти');
    var t = $('#altT'); if (t) t.addEventListener('click', function () { $('#altL').classList.toggle('open'); });
  }

  /* =====================================================
     CATALOG
     ===================================================== */
  var C = { tab: 'all', brand: '', q: '', sort: 'pop' };
  var ORDER = ['kit', 'inverter', 'battery', 'hv'];
  function renderTabs() {
    var cnt = function (k) { return P.filter(function (p) { return k === 'all' || p.cat === k; }).length; };
    $('#tabs').innerHTML = ['all'].concat(ORDER).map(function (k) {
      return '<button data-v="' + k + '" aria-pressed="' + (C.tab === k) + '">' + (k === 'all' ? 'Усі' : CAT[k].t) + '<span class="c">' + cnt(k) + '</span></button>';
    }).join('');
    var bs = Array.from(new Set(P.filter(function (p) { return C.tab === 'all' || p.cat === C.tab; }).map(function (p) { return p.brand; }))).sort();
    if (C.brand && bs.indexOf(C.brand) < 0) C.brand = '';
    $('#brands').innerHTML = '<button data-b="" aria-pressed="' + (!C.brand) + '">Усі бренди</button>' + bs.map(function (b) { return '<button data-b="' + esc(b) + '" aria-pressed="' + (C.brand === b) + '">' + esc(b) + '</button>'; }).join('');
  }
  function renderGrid() {
    var q = C.q.toLowerCase().replace(',', '.').trim();
    var list = P.filter(function (p) {
      if (C.tab !== 'all' && p.cat !== C.tab) return false;
      if (C.brand && p.brand !== C.brand) return false;
      if (q) { var hay = (p.name + ' ' + p.brand + ' ' + specList(p).join(' ')).toLowerCase().replace(/,/g, '.'); return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; }); }
      return true;
    });
    var s = {
      pop: function (a, b) { return ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat) || a.price - b.price; },
      pa: function (a, b) { return a.price - b.price; }, pd: function (a, b) { return b.price - a.price; },
      kw: function (a, b) { return (b.kw || 0) - (a.kw || 0); }, kwh: function (a, b) { return (b.kwh || 0) - (a.kwh || 0); }
    }[C.sort];
    list.sort(s);
    $('#grid').innerHTML = list.length ? list.map(function (p) {
      return '<article class="card" data-open="' + p.id + '" tabindex="0">' +
        '<div class="ph">' + ph(p) + (p.solar ? '<span class="badge sol">☀ з панелями</span>' : p.cat === 'kit' ? '<span class="badge">Комплект</span>' : '') + '</div>' +
        '<div class="body"><div class="brand">' + esc(p.brand) + '</div><h3>' + esc(p.name) + '</h3>' +
        '<div class="specs">' + specList(p).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
        '<div class="foot"><div><div class="price">' + fmt(p.price) + '</div>' + (p.avail ? '<div class="avail">● В наявності</div>' : '') + '</div>' +
        '<button class="btn btn-amber btn-sm" data-order="' + p.id + '">Замовити</button></div></div></article>';
    }).join('') : '<div class="empty" style="grid-column:1/-1">Нічого не знайдено. Спробуйте інший запит.</div>';
  }
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; C.tab = b.dataset.v; renderTabs(); renderGrid(); });
  $('#brands').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; C.brand = b.dataset.b; renderTabs(); renderGrid(); });
  $('#q').addEventListener('input', function (e) { C.q = e.target.value; renderGrid(); });
  $('#sort').addEventListener('change', function (e) { C.sort = e.target.value; renderGrid(); });

  /* =====================================================
     PRODUCT MODAL
     ===================================================== */
  function compatible(p) {
    if (p.cat === 'inverter') return BAT.filter(function (b) { return b.bus === p.bus; });
    if (p.cat === 'battery' || p.cat === 'hv') return INV.filter(function (i) { return i.bus === p.bus; });
    return [];
  }
  function openModal(id) { $(id).classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeModal(m) {
    m.classList.remove('open');
    if (!$$('.modal.open').length) document.body.style.overflow = '';
    if (m.id === 'pModal' && /^#p-/.test(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  }
  function openProduct(id) {
    var p = byId[id]; if (!p) return;
    var rows = p.chars.map(function (c) { return '<tr><td>' + esc(c[0]) + '</td><td>' + esc(c[1]) + '</td></tr>'; }).join('');
    if (p.weight) rows += '<tr><td>Вага</td><td>' + num(p.weight) + ' кг</td></tr>';
    var comp = compatible(p);
    var imgs = (p.img || []).length ? p.img : [''];
    $('#pSheet').innerHTML = '<button class="x" aria-label="Закрити" data-close>×</button><div class="pd">' +
      '<div class="pd-gal"><div class="pd-main" id="pdMain">' + ph(p, 0) + '</div>' +
      (imgs.length > 1 ? '<div class="thumbs">' + imgs.map(function (s, i) { return '<button data-i="' + i + '" aria-pressed="' + (i === 0) + '">' + ph(p, i) + '</button>'; }).join('') + '</div>' : '') +
      '</div><div class="pd-info"><div class="eyebrow">' + esc(CAT[p.cat].one) + ' · ' + esc(p.brand) + '</div><h2>' + esc(p.name) + '</h2>' +
      '<div class="specs">' + specList(p).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<div class="pd-buy"><div><div class="price">' + fmt(p.price) + '</div>' + (p.avail ? '<div class="avail">● В наявності</div>' : '') + '</div><button class="btn btn-amber" style="margin-left:auto" data-order="' + p.id + '">Замовити</button></div>' +
      '<table class="kv">' + rows + '</table>' +
      (comp.length ? '<div class="compat"><h4>' + (p.cat === 'inverter' ? 'Сумісні акумулятори' : 'Сумісні інвертори') + '</h4><div class="row">' + comp.map(function (c) { return '<button data-open="' + c.id + '">' + esc(short(c)) + '</button>'; }).join('') + '</div></div>' : '') +
      '</div>' + (p.desc ? '<div class="desc"><div class="desc-inner">' + p.desc + '</div></div>' : '') + '</div>';
    $$('.thumbs button', $('#pSheet')).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.thumbs button', $('#pSheet')).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        $('#pdMain').innerHTML = ph(p, +b.dataset.i);
      });
    });
    openModal('#pModal');
    $('#pModal').scrollTop = 0;
    try { history.replaceState(null, '', '#p-' + p.slug); } catch (e) {}
  }

  /* =====================================================
     ORDER
     ===================================================== */
  function orderLines(key) {
    if (byId[key]) return { items: [[byId[key], 1]], total: byId[key].price, title: byId[key].name };
    var c = LAST.cands[key];
    if (c) return { items: c.parts, total: c.price, title: c.kind === 'kit' ? c.main.name : c.title, calc: true };
    return { items: [], total: 0, title: 'Індивідуальний розрахунок', calc: true };
  }
  function calcSummary() {
    var n = LAST.need || calcNeed();
    var apps = S.mode === 'own'
      ? 'власне споживання ' + (S.ownAvg || 0) + ' Вт за годину' + (+S.ownPeak > 0 ? ', одночасно до ' + S.ownPeak + ' Вт' : '')
      : Object.keys(S.qty).map(function (id) { return APPMAP[id].n + (S.qty[id] > 1 ? ' ×' + S.qty[id] : ''); }).join(', ');
    return 'Підбір: ' + ({ flat: 'квартира', house: 'приватний будинок', biz: 'офіс / бізнес' }[S.obj] || 'об\'єкт не вказано') + ', ' + (S.ph || '1') + ' фаз(а), ' + S.hours + ' год без світла / ' + S.on + ' год світло є.\nПрилади: ' + apps +
      '.\nПотреба: інвертор від ' + num(n.needKw, 1) + ' кВт, батарея від ' + num(n.needKwh, 1) + ' кВт·год.';
  }
  function openOrder(key) {
    var o = orderLines(key);
    var draft = store.get('order-contact') || {};
    $('#oSheet').innerHTML = '<button class="x" aria-label="Закрити" data-close>×</button><form class="form" id="oForm" novalidate>' +
      '<h2>Заявка</h2><div class="muted" style="font-size:14px">Залиште контакт — підготуємо повідомлення, яке залишиться лише надіслати.</div>' +
      (o.items.length ? '<div class="order-items">' + o.items.map(function (x) { return '<div><span>' + (x[1] > 1 ? x[1] + ' × ' : '') + esc(x[0].name) + '</span><b>' + fmt(x[0].price * x[1]) + '</b></div>'; }).join('') +
        (o.items.length > 1 || o.items[0][1] > 1 ? '<div style="border-top:1px solid var(--line);margin-top:6px;padding-top:8px"><span>Разом</span><b>' + fmt(o.total) + '</b></div>' : '') + '</div>' : '') +
      '<label for="oName">Ім\'я</label><input id="oName" autocomplete="name" value="' + esc(draft.name || '') + '">' +
      '<label for="oPhone">Телефон *</label><input id="oPhone" type="tel" autocomplete="tel" placeholder="+380" value="' + esc(draft.phone || '') + '">' +
      '<label for="oNote">Коментар</label><textarea id="oNote" rows="3" placeholder="Місто, потрібен монтаж, питання…"></textarea>' +
      '<div class="send"><button class="btn btn-dark btn-block" type="submit">Підготувати заявку</button></div><div id="oOut"></div></form>';
    openModal('#oModal');
    $('#oForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#oName').value.trim(), phone = $('#oPhone').value.trim(), note = $('#oNote').value.trim();
      if (phone.replace(/\D/g, '').length < 9) { $('#oPhone').focus(); $('#oPhone').style.borderColor = 'var(--red)'; return; }
      store.set('order-contact', { name: name, phone: phone });
      var text = 'Заявка з сайту ' + (CFG.brand || '') + '\n\n' +
        (o.items.length ? o.items.map(function (x) { return '• ' + (x[1] > 1 ? x[1] + ' × ' : '') + x[0].name + ' — ' + fmt(x[0].price * x[1]); }).join('\n') + '\nРазом: ' + fmt(o.total) + '\n\n' : '') +
        (o.calc ? calcSummary() + '\n\n' : '') +
        'Ім\'я: ' + (name || '—') + '\nТелефон: ' + phone + (note ? '\nКоментар: ' + note : '');
      var links = [];
      if (CFG.telegram) links.push('<a class="btn btn-amber btn-block" href="https://t.me/' + esc(CFG.telegram) + '" target="_blank" rel="noopener" data-copy>Відкрити Telegram @' + esc(CFG.telegram) + '</a>');
      if (CFG.viber) links.push('<a class="btn btn-ghost btn-block" href="viber://forward?text=' + encodeURIComponent(text) + '">Надіслати у Viber</a>');
      if (CFG.email) links.push('<a class="btn btn-ghost btn-block" href="mailto:' + esc(CFG.email) + '?subject=' + encodeURIComponent('Заявка: ' + o.title) + '&body=' + encodeURIComponent(text) + '">Надіслати на ' + esc(CFG.email) + '</a>');
      if (CFG.phone) links.push('<a class="btn btn-ghost btn-block" href="' + telHref + '">Подзвонити ' + esc(CFG.phone) + '</a>');
      $('#oOut').innerHTML = '<label>Текст заявки</label><textarea rows="8" readonly id="oText">' + esc(text) + '</textarea>' +
        '<div class="send"><button class="btn btn-dark btn-block" type="button" id="oCopy">Скопіювати текст</button>' + links.join('') +
        '<small>Скопіюйте текст і надішліть зручним способом' + (CFG.telegram ? ' — для Telegram текст копіюється автоматично' : '') + '.</small></div>';
      $('.send', $('#oForm')).style.display = 'none';
      function copy() {
        var ok = function () { toast('Текст скопійовано'); };
        try { navigator.clipboard.writeText(text).then(ok, function () { $('#oText').select(); }); } catch (err) { $('#oText').select(); }
      }
      $('#oCopy').addEventListener('click', copy);
      var tg = $('[data-copy]', $('#oOut')); if (tg) tg.addEventListener('click', copy);
    });
  }
  var tt;
  function toast(s) { var t = $('#toast'); t.textContent = s; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); }, 1800); }

  /* ---------- global clicks ---------- */
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-order]');
    if (o) { e.stopPropagation(); openOrder(o.dataset.order); return; }
    var op = e.target.closest('[data-open]');
    if (op) { openProduct(op.dataset.open); return; }
    if (e.target.closest('[data-close]') || e.target.classList.contains('modal')) {
      closeModal(e.target.closest('.modal'));
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var m = $$('.modal.open').pop(); if (m) closeModal(m); }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('card')) openProduct(e.target.dataset.open);
  });
  function fromHash() {
    var m = location.hash.match(/^#p-(.+)$/);
    if (m) { var p = P.filter(function (x) { return x.slug === m[1]; })[0]; if (p) openProduct(p.id); }
  }
  window.addEventListener('hashchange', fromHash);

  // мобільна панель з підсумком: видно, поки користувач у формі підбору, а не в результатах
  if ('IntersectionObserver' in window) {
    var vis = { form: false, res: false };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[e.target.id === 'result' ? 'res' : 'form'] = e.isIntersecting; });
      $('#mbar').classList.toggle('show', vis.form && !vis.res && calcNeed().count > 0);
    }, { threshold: 0 });
    io.observe($('#pidbir .panel')); io.observe($('#result'));
  }
  renderApps(); update(); renderTabs(); renderGrid(); fromHash();
  // для перевірки логіки підбору з консолі
  window.__picker = { calcNeed: calcNeed, pick: pick, S: function () { return S; }, set: function (s) { S = s; update(); } };
})();
