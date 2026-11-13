import openpyxl, re, json, sys

import os
# Використання: python3 tools/update_products.py шлях/до/експорту_prom.xlsx
# Оновлює assets/products.js. Фото з папки img/ (img/<код-товару>-0.webp) підхоплюються автоматично.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1]
out = os.path.join(ROOT, 'assets', 'products.js')
wb = openpyxl.load_workbook(src, read_only=True)
rows = list(wb.worksheets[0].iter_rows(values_only=True))
H = rows[0]

CAT = {
    'Аккумуляторные батареи LiFePO4': 'battery',
    'Высоковольтные системы хранения энергии (HV)': 'hv',
    'Готовые системы резервного питания (ИБП)': 'kit',
    'Гибридные инверторы': 'inverter',
}
BRANDS = ['TYTANOVI', 'Gobelpower', 'LVTOPSUN', 'FoxESS', 'Deye', 'Anern', 'Dyness']


def num(s):
    return float(s.replace(',', '.'))


def clean_desc(html):
    if not html:
        return ''
    # drop seller-brand section and anything after it
    html = re.split(r'<h3>\s*Чому PowerEnergy', html)[0]
    # drop the duplicated title paragraph at the top
    html = re.sub(r'^\s*<p><strong>.*?</strong></p>\s*', '', html, count=1, flags=re.S)
    html = re.sub(r'PowerEnergy', 'наш магазин', html)
    html = re.sub(r'\s*border="1" cellpadding="5" cellspacing="0"', '', html)
    return html.strip()


def first_p(html):
    m = re.search(r'<p>(.*?)</p>', html, re.S)
    t = re.sub(r'<[^>]+>', '', m.group(1)) if m else ''
    return t.strip()


items = []
for r in rows[1:]:
    if not r[0]:
        continue
    name = r[2]
    chars = []
    for i in range(51, len(H), 3):
        if r[i]:
            v = str(r[i + 2] or '').strip()
            u = (r[i + 1] or '').strip()
            nm = r[i].replace('Номинальное напряжение', 'Номінальна напруга').replace('Емкость', 'Ємність') \
                .replace('Цвет', 'Колір').replace('Количество фаз', 'Кількість фаз').replace('Тип аккумулятора', 'Тип акумулятора')
            if nm == 'Стан':
                continue
            chars.append([nm, (v + ' ' + u).strip()])
    cat = CAT[r[18]]
    found = [(name.lower().find(b.lower()), b) for b in BRANDS if b.lower() in name.lower()]
    brand = min(found)[1] if found else (r[28] or '')
    d = {
        'id': r[0], 'name': name, 'cat': cat, 'price': r[8], 'brand': brand,
        'img': [s.strip() for s in (r[14] or '').split(',') if s.strip()],
        'avail': r[15] == '+',
        'chars': chars,
    }
    dims = r[44:48]
    if dims[0]:
        d['weight'] = float(dims[0])
    desc = clean_desc(r[6])
    d['desc'] = desc
    d['lead'] = first_p(desc)

    # derived technical fields used by the picker
    kwh = re.search(r'(\d+(?:[.,]\d+)?)\s*кВт·год', name)
    if cat in ('battery', 'hv'):
        d['kwh'] = num(kwh.group(1))
        v = re.search(r'(\d+(?:\.\d+)?)\s*В\b', name)
        volt = num(v.group(1))
        d['volt'] = volt
        d['bus'] = 'HV' if volt > 60 else ('24' if volt < 30 else '48')
    if cat == 'inverter':
        w = next(c for c in chars if c[0] == 'Номінальна потужність')
        d['kw'] = num(w[1].split()[0]) / 1000
        ph = next((c for c in chars if c[0] == 'Кількість фаз'), None)
        d['phases'] = int(ph[1]) if ph else 1
        d['bus'] = 'HV' if 'HV' in name else ('24' if ' 24 В' in name else '48')
        d['offgrid'] = 'off-grid' in name
    if cat == 'kit':
        kw = next(c for c in chars if c[0] == 'Потужність інвертора')
        cap = next(c for c in chars if c[0] == 'Ємність акумулятора')
        d['kw'] = num(kw[1].split()[0])
        d['kwh'] = num(cap[1].split()[0])
        # name is the source of truth where the sheet disagrees
        m = re.search(r'(\d+(?:,\d+)?)\s*кВт\s*/\s*(\d+(?:,\d+)?)\s*кВт·год', name)
        if m:
            d['kw'], d['kwh'] = num(m.group(1)), num(m.group(2))
        m = re.search(r'EVO-(\d+)', name)
        if m:
            d['kw'] = int(m.group(1)) / 1000
        d['phases'] = 3 if 'трифаз' in name.lower() else 1
        sp = re.search(r'(\d+) сонячних панел\w* по (\d+) Вт', name)
        d['solar'] = bool(re.search(r'сонячн', name))
        if sp:
            d['solarKw'] = round(int(sp.group(1)) * int(sp.group(2)) / 1000, 2)
        elif d['solar']:
            m = re.search(r'(\d+) сонячних панел', name) or re.search(r'\+ (\d+) сонячн', name)
            d['solarKw'] = 3.72
    items.append(d)

for d in items:
    imgs = []
    for i, u in enumerate(d['img'][:3]):
        local = 'img/%s-%d.webp' % (d['id'].lower(), i)
        imgs.append(local if os.path.exists(os.path.join(ROOT, local)) else u)
    d['img'] = sorted(imgs, key=lambda x: not x.startswith('img/'))  # локальні фото першими
with open(out, 'w', encoding='utf-8') as f:
    f.write('window.PRODUCTS = ' + json.dumps(items, ensure_ascii=False) + ';\n')
print('Оновлено товарів:', len(items))
