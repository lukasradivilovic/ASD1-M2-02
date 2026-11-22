# Składa prezentację ASD1-M2-02 (dokładnie 10 slajdów) z python-pptx.
# Liczby biorę z docs/wyniki-porownania.json i tests/wyniki-testow.json,
# więc na slajdach są wyniki faktycznego uruchomienia.
# Uruchomienie: python tools/make_slides.py [plik.pptx]
import json, os, sys
from pptx import Presentation
from pptx.util import Mm, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'docs', 'img')
LOGO = os.path.join(ROOT, 'assets', 'img', 'logo_uwb.jpeg')
res = json.load(open(os.path.join(ROOT, 'docs', 'wyniki-porownania.json'), encoding='utf-8'))
tests = json.load(open(os.path.join(ROOT, 'tests', 'wyniki-testow.json'), encoding='utf-8'))
REPO = 'https://github.com/lukasradivilovic/ASD1-M2-02'

INK = RGBColor(0x1F, 0x23, 0x28)
COBALT = RGBColor(0x2F, 0x5B, 0xEA)
COBALT_D = RGBColor(0x1C, 0x3F, 0xAE)
LIME = RGBColor(0xC5, 0xF0, 0x5A)
MUTED = RGBColor(0x5B, 0x66, 0x72)
LINE = RGBColor(0xD8, 0xDD, 0xE4)
SOFT = RGBColor(0xF4, 0xF6, 0xF9)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
WARM = RGBColor(0xFF, 0xE9, 0xA8)

H_FONT = 'Space Grotesk'
T_FONT = 'IBM Plex Sans'
M_FONT = 'IBM Plex Mono'

prs = Presentation()
prs.slide_width, prs.slide_height = Mm(338.7), Mm(190.5)
BLANK = prs.slide_layouts[6]
W, H = prs.slide_width, prs.slide_height


def text(slide, x, y, w, h, lines, size=18, color=INK, bold=False, align=PP_ALIGN.LEFT,
         font=T_FONT, anchor=MSO_ANCHOR.TOP, space=6):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Mm(1)
    tf.margin_top = tf.margin_bottom = Mm(0.5)
    if isinstance(lines, str):
        lines = [lines]
    for k, ln in enumerate(lines):
        opt = {}
        if isinstance(ln, tuple):
            ln, opt = ln
        p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
        r = p.add_run()
        r.text = ln
        r.font.size = Pt(opt.get('size', size))
        r.font.bold = opt.get('bold', bold)
        r.font.color.rgb = opt.get('color', color)
        r.font.name = opt.get('font', font)
        p.alignment = opt.get('align', align)
        p.space_after = Pt(opt.get('after', space))
    return tb


def bullets(slide, x, y, w, h, items, size=17, color=INK):
    out = []
    for i in items:
        if isinstance(i, tuple):
            out.append(i)
        elif i.startswith('   '):
            out.append((i, {'size': size - 3, 'color': MUTED}))
        else:
            out.append(('▸  ' + i, {'size': size, 'color': color}))
    return text(slide, x, y, w, h, out, size=size)


def box(slide, x, y, w, h, fill, label='', size=13, color=INK, line=LINE, bold=False,
        shape=MSO_SHAPE.RECTANGLE, font=T_FONT, align=PP_ALIGN.CENTER, lw=1.0):
    s = slide.shapes.add_shape(shape, int(x), int(y), int(w), int(h))
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(lw)
    s.shadow.inherit = False
    tf = s.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Mm(1.2)
    tf.margin_top = tf.margin_bottom = Mm(0.6)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    for k, ln in enumerate(label.split('\n')):
        p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run()
        r.text = ln
        r.font.size = Pt(size)
        r.font.color.rgb = color
        r.font.bold = bold
        r.font.name = font
    return s


def frame(slide, no, title, sub=None):
    bg = slide.background.fill
    bg.solid()
    bg.fore_color.rgb = WHITE
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Mm(21.5), W, Mm(1.2))
    bar.fill.solid(); bar.fill.fore_color.rgb = INK; bar.line.fill.background(); bar.shadow.inherit = False
    acc = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Mm(14), Mm(21.5), Mm(26), Mm(1.2))
    acc.fill.solid(); acc.fill.fore_color.rgb = LIME; acc.line.fill.background(); acc.shadow.inherit = False
    text(slide, Mm(14), Mm(6), Mm(260), Mm(14), title, size=26, bold=True, font=H_FONT, anchor=MSO_ANCHOR.MIDDLE)
    if sub:
        text(slide, Mm(14), H - Mm(13), Mm(200), Mm(8), sub, size=10, color=MUTED)
    slide.shapes.add_picture(LOGO, W - Mm(30), H - Mm(14), height=Mm(9))
    text(slide, W - Mm(48), H - Mm(13), Mm(16), Mm(8), '%02d/10' % no, size=11, color=MUTED,
         align=PP_ALIGN.RIGHT, font=M_FONT)


def codeblock(slide, x, y, w, h, lines, size=13):
    box(slide, x, y, w, h, SOFT, '', line=LINE)
    fmt = []
    for ln in lines:
        c = MUTED if ln.lstrip().startswith('//') else INK
        fmt.append((ln, {'color': c, 'font': M_FONT, 'size': size, 'after': 1}))
    text(slide, x + Mm(2), y + Mm(2), w - Mm(4), h - Mm(4), fmt, size=size)


def notes(slide, t):
    slide.notes_slide.notes_text_frame.text = t


def grid(slide, x, y, headers, rows, widths, rh=Mm(9), size=11, hl=None):
    """Prosta tabela z prostokątów: łatwiej panuję nad kolorem niż w tabeli PPTX."""
    cx = x
    for k, hdr in enumerate(headers):
        box(slide, cx, y, widths[k], rh, INK, hdr, size=size, color=WHITE, bold=True, line=INK, align=PP_ALIGN.LEFT, font=H_FONT)
        cx += widths[k]
    for r, row in enumerate(rows):
        cx = x
        fill = WHITE if r % 2 == 0 else SOFT
        if hl is not None and r == hl:
            fill = WARM
        for k, cell in enumerate(row):
            box(slide, cx, y + rh * (r + 1), widths[k], rh, fill, cell, size=size, line=LINE,
                align=PP_ALIGN.LEFT, font=M_FONT if k else T_FONT)
            cx += widths[k]


sort_rows = {(r['n'], r['uklad']): r for r in res['sortowanie']}
search_rows = {r['przypadek']: r for r in res['wyszukiwanie']}

# ------------------------------------------------------------------ 1. tytuł
s = prs.slides.add_slide(BLANK)
bg = s.background.fill; bg.solid(); bg.fore_color.rgb = INK
band = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Mm(10), H)
band.fill.solid(); band.fill.fore_color.rgb = LIME; band.line.fill.background(); band.shadow.inherit = False
plate = s.shapes.add_shape(MSO_SHAPE.OVAL, Mm(258), Mm(28), Mm(56), Mm(56))
plate.fill.solid(); plate.fill.fore_color.rgb = WHITE; plate.line.fill.background(); plate.shadow.inherit = False
s.shapes.add_picture(LOGO, Mm(268), Mm(40), height=Mm(32))
text(s, Mm(24), Mm(30), Mm(220), Mm(10), 'ASD1-M2-02 · mini-projekt M2 · 2026/2027', size=15, color=LIME, font=M_FONT)
text(s, Mm(24), Mm(44), Mm(230), Mm(50),
     [('Portfolio', {'size': 54, 'bold': True, 'color': WHITE, 'font': H_FONT, 'after': 0}),
      ('projektów studenckich', {'size': 54, 'bold': True, 'color': WHITE, 'font': H_FONT})], size=54)
text(s, Mm(24), Mm(104), Mm(240), Mm(12),
     'Wizytówka prac jednego studenta: szukaj, filtruj, czytaj i otwieraj materiały.', size=17, color=RGBColor(0xC9, 0xD2, 0xDE))
line = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Mm(24), Mm(122), Mm(40), Mm(0.9))
line.fill.solid(); line.fill.fore_color.rgb = LIME; line.line.fill.background(); line.shadow.inherit = False
text(s, Mm(24), Mm(130), Mm(240), Mm(30),
     [('Lukaš Radivilovič', {'size': 22, 'bold': True, 'color': WHITE, 'font': H_FONT, 'after': 2}),
      ('nr albumu 93795 · Informatyka', {'size': 14, 'color': RGBColor(0xC9, 0xD2, 0xDE), 'after': 2}),
      ('Filia Uniwersytetu w Białymstoku w Wilnie · Algorytmy i struktury danych I', {'size': 14, 'color': RGBColor(0xC9, 0xD2, 0xDE)})], size=14)
notes(s, 'Dzień dobry. Nazywam się Lukaš Radivilovič, numer albumu 93795. Przedstawiam mini-projekt M2 o kodzie ASD1-M2-02: portfolio projektów studenckich. Celem było zrobić wizytówkę własnych prac, w której odbiorca szybko znajdzie projekt z wybranej technologii, przeczyta, co w nim zrobiłem, i otworzy repozytorium.')

# ------------------------------------------------------------------ 2. użytkownik i problem
s = prs.slides.add_slide(BLANK)
frame(s, 2, 'Dla kogo i po co', 'ASD1-M2-02 · Portfolio projektów studenckich')
box(s, Mm(14), Mm(30), Mm(92), Mm(78), SOFT, '', line=LINE)
box(s, Mm(20), Mm(36), Mm(18), Mm(18), COBALT, 'KR', size=15, color=WHITE, bold=True, font=H_FONT, line=None, shape=MSO_SHAPE.OVAL)
text(s, Mm(42), Mm(36), Mm(60), Mm(18),
     [('Karolina, 2. rok', {'size': 16, 'bold': True, 'font': H_FONT, 'after': 1}),
      ('szuka osoby do projektu', {'size': 12, 'color': MUTED})], size=12)
text(s, Mm(20), Mm(60), Mm(82), Mm(44),
     [('„Potrzebuję kogoś, kto pisał coś w Pythonie w tym roku', {'size': 13, 'after': 0}),
      ('i skończył projekt do końca.”', {'size': 13, 'after': 6}),
      ('Ma minutę, nie pół godziny. Nie chce czytać CV ani', {'size': 12, 'color': MUTED, 'after': 0}),
      ('przeglądać dwudziestu repozytoriów po kolei.', {'size': 12, 'color': MUTED})], size=13)
steps = [('1', 'Wpisuje fragment', 'słowo z tytułu albo z opisu, np. „gra”'),
         ('2', 'Zawęża filtrami', 'technologia Python, rok 2026, status gotowy — warunki łączą się przez AND'),
         ('3', 'Otwiera kartę', 'pełny opis, moja rola w projekcie i adres repozytorium')]
for k, (n, t, d) in enumerate(steps):
    y = Mm(30) + k * Mm(27)
    box(s, Mm(116), y, Mm(14), Mm(14), LIME, n, size=16, bold=True, font=H_FONT, line=None, shape=MSO_SHAPE.OVAL)
    text(s, Mm(134), y - Mm(1), Mm(190), Mm(10), t, size=18, bold=True, font=H_FONT)
    text(s, Mm(134), y + Mm(8), Mm(190), Mm(14), d, size=13, color=MUTED)
box(s, Mm(116), Mm(112), Mm(208), Mm(16), SOFT,
    'Efekt: zamiast listy dwudziestu repozytoriów widzi dwa projekty, które naprawdę pasują.',
    size=14, line=LINE, align=PP_ALIGN.LEFT)
box(s, Mm(14), Mm(112), Mm(92), Mm(16), WARM, 'Portfolio ma jednego autora.\nWspółautorów opisuję w polu „rola”.', size=12, line=LINE)
notes(s, 'Odbiorcą jest ktoś, kto szuka konkretnej pracy: koleżanka z roku, prowadzący albo firma na praktyki. Taka osoba ma minutę. Scenariusz jest trzykrokowy: wpisuje fragment słowa, zawęża filtrami i otwiera kartę projektu. Filtry łączą się przez AND, więc każdy kolejny tylko zawęża wynik. Portfolio należy do jednego autora, a współautorów opisuję tekstem w polu rola.')

# ------------------------------------------------------------------ 3. zakres i reguły
s = prs.slides.add_slide(BLANK)
frame(s, 3, 'Co działa w aplikacji', 'ASD1-M2-02 · Portfolio projektów studenckich')
cols = [('Lista i karty', ['karty projektów + pełny opis', 'formularz dodawania i edycji', 'powód odrzucenia przy polu']),
        ('Szukanie', ['fragment tytułu lub opisu', 'filtry: technologia, rok, status', 'AND + przycisk Wyczyść']),
        ('Porządki', ['najnowsze: rok ↓, przy remisie ID ↑', 'tytuły: własna tabela znaków', 'obie przez insertion sort']),
        ('Liczby', ['statusy i częstość technologii', 'statystyki z widocznej listy', 'liczniki sprawdzeń i porównań'])]
for k, (t, items) in enumerate(cols):
    x = Mm(14) + k * Mm(78)
    box(s, x, Mm(30), Mm(74), Mm(12), INK, t, size=15, color=WHITE, bold=True, font=H_FONT, line=INK)
    text(s, x + Mm(1), Mm(44), Mm(72), Mm(34), ['▸ ' + i for i in items], size=12)
text(s, Mm(14), Mm(82), Mm(150), Mm(10), 'Reguły, które trzymam dosłownie', size=18, bold=True, font=H_FONT)
bullets(s, Mm(14), Mm(94), Mm(150), Mm(60), [
    'ID niepuste, unikalne, niezmienne po utworzeniu',
    'rok całkowity z przedziału 2000–2100',
    'powtórzona technologia w projekcie liczy się raz',
    'walidacja przed zmianą stanu, bez częściowego zapisu'], size=14)
text(s, Mm(174), Mm(82), Mm(150), Mm(10), 'Dane i bezpieczeństwo', size=18, bold=True, font=H_FONT)
bullets(s, Mm(174), Mm(94), Mm(150), Mm(60), [
    'eksport i import JSON z wersją formatu',
    'import sprawdza cały plik, potem pyta o potwierdzenie',
    'teksty wstawiam przez textContent, wpisany HTML zostaje tekstem',
    'do 1000 rekordów, zapis lokalny tylko jako dodatek'], size=14)
notes(s, 'To jest pełny zakres obowiązkowy z karty. Cztery grupy funkcji: lista z kartami i formularzem, szukanie z filtrami, dwa porządki i liczby. Z reguł najważniejsze: identyfikator jest niezmienny, rok musi być z przedziału dwa tysiące do dwa tysiące sto, a powtórzona technologia liczy się raz. Walidacja zawsze idzie przed zmianą stanu, więc odrzucona operacja nie zostawia połowy zapisu.')

# ------------------------------------------------------------------ 4. model danych
s = prs.slides.add_slide(BLANK)
frame(s, 4, 'Model danych: rekord „Projekt”', 'ASD1-M2-02 · Portfolio projektów studenckich')
fields = [('id', 'A, PRJ-2026-01', 'niepusty, unikalny, niezmienny'),
          ('title / description', 'Atlas / Atlas map z zajęć…', 'tekst, przeszukiwany po fragmencie'),
          ('year', '2026', 'liczba całkowita 2000–2100'),
          ('status', 'planowany / w trakcie / gotowy', 'trzy dozwolone wartości'),
          ('technologies', '[Python, HTML]', 'bez powtórzeń po normalizacji'),
          ('role', 'autor całości', 'tu też współautorzy, tekstem'),
          ('repoUrl / demoUrl', 'https://…', 'repozytorium wymagane, demo opcjonalne')]
box(s, Mm(14), Mm(30), Mm(150), Mm(12), COBALT, 'Projekt', size=16, color=WHITE, bold=True, font=H_FONT, line=COBALT, align=PP_ALIGN.LEFT)
for k, (name, example, rule) in enumerate(fields):
    y = Mm(42) + k * Mm(14)
    box(s, Mm(14), y, Mm(48), Mm(14), SOFT, name, size=11, line=LINE, align=PP_ALIGN.LEFT, font=M_FONT)
    box(s, Mm(62), y, Mm(102), Mm(14), WHITE, example + '  ·  ' + rule, size=10, line=LINE, align=PP_ALIGN.LEFT)
codeblock(s, Mm(176), Mm(30), Mm(148), Mm(88), [
    '{ "format": "asd1-m2-02-portfolio",',
    '  "version": 1,',
    '  "projects": [',
    '    { "id": "A",',
    '      "title": "Atlas",',
    '      "year": 2026,',
    '      "status": "gotowy",',
    '      "technologies": ["Python", "python", "HTML"],',
    '      "role": "autor całości",',
    '      "repoUrl": "https://github.com/..." } ] }'], size=11)
box(s, Mm(176), Mm(122), Mm(148), Mm(28), WARM,
    'Technologie po normalizacji: trim + małe litery.\n[Python, python, HTML] → Python, HTML.\nDo wyświetlania zostaje pierwsza pisownia.',
    size=12, line=LINE)
notes(s, 'Rekord ma dziewięć pól. Identyfikator jest kluczem: niepusty, unikalny i zablokowany w edycji, bo inaczej straciłbym powiązanie z wcześniej wyeksportowanym plikiem. Rok jest liczbą z przedziału. Status ma trzy dozwolone wartości. Po prawej prawdziwy plik eksportu: nazwa formatu, wersja i lista projektów. Na dole przykład normalizacji technologii z karty: Python, python i HTML dają dwie technologie, bo porównuję klucze bez wielkości liter.')

# ------------------------------------------------------------------ 5. algorytm
s = prs.slides.add_slide(BLANK)
frame(s, 5, 'Sortowanie przez wstawianie', 'ASD1-M2-02 · Portfolio projektów studenckich')
codeblock(s, Mm(14), Mm(30), Mm(150), Mm(72), [
    '// zwracam nową tablicę: wejście zostaje nietknięte',
    'const a = records.slice();',
    'for (let i = 1; i < a.length; i++) {',
    '  const key = a[i]; let j = i - 1;',
    '  while (j >= 0) {',
    '    counter.comparisons++;        // jedno porównanie',
    '    if (compareFn(a[j], key) > 0) // ostro większy?',
    '      { a[j + 1] = a[j]; j--; }   // przesuwam w prawo',
    '    else break;                   // miejsce znalezione',
    '  }',
    '  a[j + 1] = key;                 // wstawiam klucz',
    '}'], size=11)
box(s, Mm(14), Mm(106), Mm(150), Mm(22), SOFT,
    'Warunek > 0, a nie >= 0: dzięki temu równe klucze nie zamieniają się miejscami i porządek jest stabilny.',
    size=12, line=LINE, align=PP_ALIGN.LEFT)
box(s, Mm(14), Mm(132), Mm(150), Mm(18), WARM,
    'Koszt: dane uporządkowane n − 1 porównań, odwrócone n(n − 1)/2, pamięć O(n).', size=12, line=LINE, align=PP_ALIGN.LEFT)
grid(s, Mm(176), Mm(30), ['Przed', 'Decyzja (porządek: najnowsze)', 'Po'],
     [['A B C', 'B (2025) z A (2026): A nie jest większy → wstawiam B na 1', 'A B C'],
      ['A B C', 'C (2026) z B (2025): B większy → przesuwam B w prawo', 'A B B'],
      ['A B B', 'C (2026) z A (2026): remis roku, ID A < C → stop', 'A B B'],
      ['A B B', 'wstawiam C na pozycję 1', 'A C B']],
     [Mm(26), Mm(96), Mm(26)], rh=Mm(13), size=10, hl=1)
text(s, Mm(176), Mm(96), Mm(148), Mm(26),
     [('Przykład z karty: A „Atlas” 2026, B „Budżet” 2025, C „Gra” 2026.', {'size': 12, 'after': 2}),
      ('Wynik: A, C, B. Porównania kluczy: 3.', {'size': 12, 'bold': True, 'color': COBALT_D})], size=12)
box(s, Mm(176), Mm(124), Mm(148), Mm(26), SOFT,
    'Tabela w aplikacji powstaje z generatora (function*), który liczy ten sam algorytm i po każdym kroku oddaje stan. Nic tu nie jest wpisane ręcznie.',
    size=12, line=LINE, align=PP_ALIGN.LEFT)
notes(s, 'To jest prawdziwy kod z pliku algorithms.js. Biorę kopię tablicy, więc wejście zostaje nietknięte. Dla każdego kolejnego elementu cofam się w lewo i przesuwam wszystko, co jest od niego ostro większe. Warunek musi być ostro większy, bo inaczej równe klucze zamieniłyby się miejscami i stracilbym stabilność. Licznik zwiększam dokładnie w miejscu porównania. Po prawej ten sam przebieg na przykładzie z karty: A, B, C w porządku najnowszych daje A, C, B przy trzech porównaniach. Podświetlony wiersz to ten, który zwykle tłumaczę na obronie: C jest nowsze od B, więc B idzie w prawo.')

# ------------------------------------------------------------------ 6. technologie i moduły
s = prs.slides.add_slide(BLANK)
frame(s, 6, 'Technologie, moduły i zapis danych', 'ASD1-M2-02 · Portfolio projektów studenckich')
mods = [('algorithms.js', 'normalizacja, wyszukiwanie, filtry,\ninsertion sort, statystyki, walidacja', Mm(14), Mm(32)),
        ('steps.js', 'generatory kroków\n„przed → decyzja → po”', Mm(14), Mm(70)),
        ('data-io.js', 'eksport i import JSON\nz nazwą formatu i wersją', Mm(14), Mm(108)),
        ('compare.js', 'powtarzalne dane (LCG, ziarno 2026)\ni eksperyment porównawczy', Mm(116), Mm(32)),
        ('test-cases.js', '22 przypadki testowe\nwspólne dla Node i przeglądarki', Mm(116), Mm(70)),
        ('app.js + index.html', 'rysowanie, zdarzenia, formularz,\nzakładki, zapis lokalny', Mm(116), Mm(108))]
for name, desc, x, y in mods:
    box(s, x, y, Mm(88), Mm(10), INK, name, size=13, color=WHITE, bold=True, font=M_FONT, line=INK, align=PP_ALIGN.LEFT)
    box(s, x, y + Mm(10), Mm(88), Mm(18), SOFT, desc, size=11, line=LINE, align=PP_ALIGN.LEFT)
for (x1, y1, x2, y2) in [(Mm(102), Mm(42), Mm(116), Mm(42)), (Mm(102), Mm(80), Mm(116), Mm(80)), (Mm(102), Mm(118), Mm(116), Mm(118))]:
    ln = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x1, y1, x2, y2)
    ln.line.color.rgb = MUTED; ln.line.width = Pt(1.5)
bullets(s, Mm(214), Mm(32), Mm(110), Mm(70), [
    'HTML, CSS i JavaScript bez bibliotek',
    'Node.js tylko do uruchomienia testów',
    'moduły w formacie UMD: te same pliki czyta przeglądarka i Node',
    'fonty i logo w repozytorium, więc działa offline'], size=13)
box(s, Mm(214), Mm(78), Mm(110), Mm(32), WARM,
    'Zapis danych: plik JSON (eksport i import) jako podstawa,\npamięć przeglądarki tylko jako dodatek.',
    size=12, line=LINE, align=PP_ALIGN.LEFT)
codeblock(s, Mm(214), Mm(114), Mm(110), Mm(36), [
    '// jeden plik, dwa środowiska',
    'if (module && module.exports)',
    '  module.exports = factory();',
    'else root.PortfolioAlgorithms = factory();'], size=10)
notes(s, 'Aplikacja to czysty HTML, CSS i JavaScript, bez żadnych bibliotek. Node jest potrzebny tylko do uruchomienia testów. Moduły zapisałem w formacie UMD, dzięki czemu przeglądarka i Node ładują dokładnie te same pliki, a testy sprawdzają kod, który widać w aplikacji. Podstawą zapisu jest plik JSON z nazwą formatu i wersją. Pamięć przeglądarki jest tylko dodatkiem, żeby dane nie znikały po odświeżeniu.')

# ------------------------------------------------------------------ 7. interfejs
s = prs.slides.add_slide(BLANK)
frame(s, 7, 'Interfejs i droga użytkownika', 'ASD1-M2-02 · Portfolio projektów studenckich')
win = box(s, Mm(13), Mm(29), Mm(214), Mm(126), SOFT, '', line=INK, lw=1.5)
s.shapes.add_picture(os.path.join(IMG, 'filtr.png'), Mm(15), Mm(31), width=Mm(210))
marks = [('1', Mm(34), Mm(56)), ('2', Mm(34), Mm(76)), ('3', Mm(86), Mm(47)), ('4', Mm(176), Mm(46))]
for n, x, y in marks:
    box(s, x, y, Mm(8), Mm(8), LIME, n, size=11, bold=True, font=H_FONT, line=INK, shape=MSO_SHAPE.OVAL)
items = [('1', 'Wyszukiwanie fragmentu tytułu lub opisu'),
         ('2', 'Filtry z licznikiem trafień przy każdej wartości'),
         ('3', 'Przełącznik porządku: najnowsze albo tytuły'),
         ('4', 'Karta projektu i pełny opis z adresem repozytorium')]
for k, (n, t) in enumerate(items):
    y = Mm(32) + k * Mm(17)
    box(s, Mm(234), y, Mm(8), Mm(8), LIME, n, size=11, bold=True, font=H_FONT, line=INK, shape=MSO_SHAPE.OVAL)
    text(s, Mm(245), y - Mm(1), Mm(80), Mm(14), t, size=12)
box(s, Mm(234), Mm(102), Mm(90), Mm(24), SOFT,
    'Zrzut: przykład kontrolny z filtrem technologii Python. Widać wynik A i B oraz licznik 3 sprawdzonych rekordów.',
    size=11, line=LINE, align=PP_ALIGN.LEFT)
box(s, Mm(234), Mm(130), Mm(90), Mm(25), WARM,
    'Status ma etykietę tekstową, nie tylko kolor. Formularz obsługuje się klawiaturą, a fokus jest widoczny.',
    size=11, line=LINE, align=PP_ALIGN.LEFT)
notes(s, 'To mój zrzut z aplikacji, zrobiony na przykładzie kontrolnym z karty. Po lewej wyszukiwanie i filtry, każda wartość filtra ma w nawiasie liczbę trafień. Na górze przełącznik porządku. Po prawej pełny opis wybranego projektu z adresem repozytorium. Na dole licznik: trzy sprawdzone rekordy i jedno porównanie kluczy. Kolor nie jest jedynym nośnikiem informacji, bo status ma też etykietę tekstową.')

# ------------------------------------------------------------------ 8. testy i porównanie
s = prs.slides.add_slide(BLANK)
frame(s, 8, 'Testy i porównanie', 'ASD1-M2-02 · Portfolio projektów studenckich')
cd = CategoryChartData()
cd.categories = ['n = 10', 'n = 100', 'n = 1000']
cd.add_series('dane uporządkowane', [sort_rows[(n, 'posortowany')]['porownania'] for n in (10, 100, 1000)])
cd.add_series('dane losowe', [sort_rows[(n, 'losowy')]['porownania'] for n in (10, 100, 1000)])
cd.add_series('dane odwrócone', [sort_rows[(n, 'odwrocony')]['porownania'] for n in (10, 100, 1000)])
ch = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Mm(14), Mm(30), Mm(180), Mm(108), cd).chart
ch.has_legend = True
ch.legend.position = XL_LEGEND_POSITION.TOP
ch.legend.include_in_layout = False
ch.legend.font.size = Pt(11)
ch.category_axis.tick_labels.font.size = Pt(11)
ch.value_axis.tick_labels.font.size = Pt(10)
ch.plots[0].has_data_labels = True
ch.plots[0].data_labels.font.size = Pt(9)
for k, col in enumerate([LIME, COBALT, INK]):
    ser = ch.plots[0].series[k]
    ser.format.fill.solid()
    ser.format.fill.fore_color.rgb = col
text(s, Mm(14), Mm(140), Mm(180), Mm(14),
     'Porównania kluczy własnego sortowania, dane generowane powtarzalnie (ziarno 2026). '
     'Przy 1000 rekordów: %d wobec %d porównań.' % (sort_rows[(1000, 'posortowany')]['porownania'], sort_rows[(1000, 'odwrocony')]['porownania']),
     size=11, color=MUTED)
box(s, Mm(204), Mm(30), Mm(120), Mm(26), LIME, '%d / %d testów przechodzi' % (tests['passed'], tests['total']),
    size=20, bold=True, font=H_FONT, line=INK)
bullets(s, Mm(204), Mm(60), Mm(120), Mm(60), [
    'przykład kontrolny z karty (A, B; 1/1; Python 2, HTML 1)',
    'stany pośrednie z generatora kroków',
    'walidacja, remis roku, pusta lista, wpisany HTML',
    'eksport → import i cztery wadliwe pliki',
    'wynik sortowania zgodny z wzorcem dla n = 10, 100, 1000'], size=11)
grid(s, Mm(204), Mm(112), ['Wyszukiwanie', 'sprawdzone'],
     [['trafienie na początku', str(search_rows['trafienie na początku']['sprawdzone_wszystkie'])],
      ['trafienie na końcu', str(search_rows['trafienie na końcu']['sprawdzone_wszystkie'])],
      ['brak wyniku', str(search_rows['brak wyniku']['sprawdzone_wszystkie'])]],
     [Mm(84), Mm(36)], rh=Mm(9), size=10)
notes(s, 'Wszystkie dwadzieścia dwa testy przechodzą, uruchamiam je jednym poleceniem node tests slash run-tests. Na wykresie liczba porównań kluczy mojego sortowania. Dane uporządkowane kosztują n minus jeden, czyli przy tysiącu rekordów dziewięćset dziewięćdziesiąt dziewięć porównań. Dane odwrócone kosztują n razy n minus jeden przez dwa, czyli czterysta dziewięćdziesiąt dziewięć i pół tysiąca. To pięćset razy więcej pracy. Tabela po prawej: w wyszukiwaniu zawsze sprawdzam sto rekordów ze stu, bo szukam wszystkich dopasowań, a nie pierwszego.')

# ------------------------------------------------------------------ 9. wnioski
s = prs.slides.add_slide(BLANK)
frame(s, 9, 'Wnioski, ograniczenia i źródła', 'ASD1-M2-02 · Portfolio projektów studenckich')
text(s, Mm(14), Mm(30), Mm(100), Mm(8), 'Co wyszło', size=17, bold=True, font=H_FONT, color=COBALT_D)
bullets(s, Mm(14), Mm(40), Mm(100), Mm(60), [
    'sortowanie przez wstawianie jest dobre przy małych danych i przy liście prawie uporządkowanej',
    'przy 1000 odwróconych rekordów kosztuje pół miliona porównań, więc do dużych zbiorów się nie nadaje',
    'wyszukiwanie wszystkich dopasowań zawsze kosztuje n sprawdzeń'], size=12)
text(s, Mm(120), Mm(30), Mm(100), Mm(8), 'Ograniczenia', size=17, bold=True, font=H_FONT, color=COBALT_D)
bullets(s, Mm(120), Mm(40), Mm(100), Mm(60), [
    'liczę operacje algorytmu, nie milisekundy',
    'przy każdej zmianie sortuję całą widoczną listę od nowa',
    'porządek tytułów opisuje polski alfabet, inne języki trafiają na koniec tabeli znaków',
    'limit 1000 rekordów, bez serwera i kont'], size=12)
text(s, Mm(226), Mm(30), Mm(98), Mm(8), 'Źródła i pomoc AI', size=17, bold=True, font=H_FONT, color=COBALT_D)
bullets(s, Mm(226), Mm(40), Mm(98), Mm(70), [
    'karta tematu ASD1-M2-02, wykłady z ASD I',
    'Cormen, rozdział o sortowaniu przez wstawianie',
    'dokumentacja MDN, fonty na licencji OFL',
    'Claude (Anthropic) jako narzędzie pomocnicze: fragmenty kodu, redakcja tekstów, składanie slajdów'], size=12)
box(s, Mm(14), Mm(112), Mm(310), Mm(38), SOFT,
    'Mój wkład: koncepcja interfejsu i przepływu użytkownika, reguły normalizacji technologii i tytułów, '
    'dobór przypadków testowych, ręczne policzenie przykładu kontrolnego przed napisaniem testów, '
    'eksperyment porównawczy z powtarzalnymi danymi i przygotowanie obrony. Każda liczba na slajdach '
    'pochodzi z faktycznego uruchomienia testów i porównania.',
    size=13, line=LINE, align=PP_ALIGN.LEFT)
notes(s, 'Najważniejszy wniosek: sortowanie przez wstawianie jest dobre przy małych albo prawie uporządkowanych danych, a przy tysiącu odwróconych rekordów kosztuje pół miliona porównań. Ograniczenia podaję uczciwie: mierzę operacje, nie czas, i przy każdej zmianie sortuję listę od nowa. Claude był narzędziem pomocniczym przy fragmentach kodu, redakcji tekstów i składaniu slajdów. Przykład kontrolny policzyłem ręcznie, zanim napisałem testy.')

# ------------------------------------------------------------------ 10. plan pokazu
s = prs.slides.add_slide(BLANK)
frame(s, 10, 'Plan pokazu na żywo', 'ASD1-M2-02 · Portfolio projektów studenckich')
plan = [('1', 'Aplikacja', 'otwieram index.html, scenariusz typowy, 12 projektów'),
        ('2', 'Przykład kontrolny', 'filtr Python → A i B, statystyki 1 gotowy i 1 w trakcie'),
        ('3', 'Zmiana danych na żywo', 'dokładam rok 2026 → zostaje samo A; dopisuję projekt i liczby się przeliczają'),
        ('4', 'Przypadek błędny', 'projekt bez tytułu i rok 1999 → powód odrzucenia przy polu'),
        ('5', 'Krok po kroku', 'tabela przed → decyzja → po i liczniki'),
        ('6', 'Testy', 'node tests/run-tests.js → %d/%d' % (tests['passed'], tests['total']))]
for k, (n, t, d) in enumerate(plan):
    y = Mm(32) + k * Mm(19)
    box(s, Mm(14), y, Mm(12), Mm(12), COBALT, n, size=14, color=WHITE, bold=True, font=H_FONT, line=None, shape=MSO_SHAPE.OVAL)
    text(s, Mm(30), y - Mm(1), Mm(90), Mm(10), t, size=15, bold=True, font=H_FONT)
    text(s, Mm(30), y + Mm(7), Mm(160), Mm(10), d, size=11, color=MUTED)
box(s, Mm(204), Mm(32), Mm(120), Mm(46), INK,
    'Repozytorium GitHub\n' + REPO, size=13, color=WHITE, font=M_FONT, line=INK)
qr = os.path.join(IMG, 'qr-repo.png')
if os.path.exists(qr):
    s.shapes.add_picture(qr, Mm(236), Mm(84), width=Mm(56))
text(s, Mm(204), Mm(142), Mm(120), Mm(10), 'Kod QR prowadzi do repozytorium.', size=11, color=MUTED, align=PP_ALIGN.CENTER)
notes(s, 'Pokaz zaczynam od otwarcia aplikacji na scenariuszu typowym. Potem wczytuję przykład kontrolny i pokazuję filtr Pythona: zostają A i B. Dokładam rok dwa tysiące dwadzieścia sześć i zostaje samo A. Następnie zmieniam dane na żywo, pokazuję odrzucenie błędnego projektu z powodem przy polu, tabelę kroków z licznikami i na koniec uruchamiam testy w konsoli. Adres repozytorium jest na slajdzie, kod QR prowadzi w to samo miejsce.')

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'ASD1-M2-02_Radivilovic_prezentacja.pptx')
prs.save(out)
print('zapisano', out, '· slajdy:', len(prs.slides._sldIdLst))
