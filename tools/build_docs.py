# -*- coding: utf-8 -*-
"""Składa dokumentację ASD1-M2-02 (.docx) na bazie stylów moich sprawozdań.

Uruchomienie: python tools/build_docs.py
Treść siedzi w tools/tresc_dokumentacji.py. Spis treści, numery rysunków
i spis rysunków wstawiam jako pola Worda, więc numery przelicza Word,
a nie ja ręcznie (tools/update_fields.py).
"""
import os, sys, docx
from docx.shared import Cm
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tresc_dokumentacji import (TYTUL, WSTEP, ROZDZIALY, ZAKONCZENIE,
                                BIBLIOGRAFIA, SHOTS, SHOTFILES)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(ROOT), 'ASD1-M2-02_zasoby', 'szablon_sprawozdania_TS-NR3.docx')
OUT = os.path.join(ROOT, 'docs', 'ASD1-M2-02_Radivilovic_dokumentacja.docx')

ST_TOC_H = 'DYP: nazwa spisu treści'
ST_R = 'DYP: nazwa rodziału (ROZDZIAŁ X)'
ST_H = 'DYP: nazwa rozdziału'
ST_SUB = 'DYP: nazwa podrozdziału'
ST_T = 'DYP: tekst główny'
ST_FIGT = 'DYP: tablice i rysunki (tytuł)'
ST_FIGS = 'DYP: tablice i rysunki (źródło)'
ST_SPIS = 'DYP: tablice i rysunki (spis)'


def field(paragraph, instr, placeholder='1'):
    """Wstawia pole Worda: begin -> instrText -> separate -> tekst -> end."""
    r = paragraph.add_run()
    r._r.append(parse_xml('<w:fldChar %s w:fldCharType="begin" w:dirty="true"/>' % nsdecls('w')))
    r2 = paragraph.add_run()
    it = parse_xml('<w:instrText %s xml:space="preserve"/>' % nsdecls('w'))
    it.text = instr
    r2._r.append(it)
    r3 = paragraph.add_run()
    r3._r.append(parse_xml('<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w')))
    r4 = paragraph.add_run(placeholder)
    r5 = paragraph.add_run()
    r5._r.append(parse_xml('<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w')))


d = docx.Document(SRC)

# --- strona tytułowa: podmieniam tylko teksty, style i logo zostają z szablonu
repl = {
    'SPRAWOZDANIE NR 3': TYTUL['naglowek'],
    'Technologie sieciowe': TYTUL['temat'],
}
for p in d.paragraphs[:30]:
    for old, new in repl.items():
        if old in p.text:
            # tekst bywa rozbity na kilka runów, więc składam go w pierwszym
            p.runs[0].text = p.text.replace(old, new)
            for r in p.runs[1:]:
                r.text = ''

# puste akapity pod tytułem wypełniam resztą danych z karty
podtytul = [TYTUL['przedmiot'], TYTUL['github']]
k = 0
for p in d.paragraphs[14:24]:
    if p.text.strip() == '' and k < len(podtytul):
        p.add_run(podtytul[k])
        k += 1

# --- wszystko od SPIS TREŚCI w dół buduję od nowa
start = next(i for i, p in enumerate(d.paragraphs) if p.text.strip() == 'SPIS TREŚCI')
for p in d.paragraphs[start:]:
    p._element.getparent().remove(p._element)
for tbl in list(d.tables):
    tbl._element.getparent().remove(tbl._element)
for sh in list(d.inline_shapes):
    pass  # logo na stronie tytułowej zostaje

add = lambda style, text='': d.add_paragraph(text, style=style)

add(ST_TOC_H, 'SPIS TREŚCI')
field(add('toc 1'), ' TOC \\o "1-2" \\h \\z \\u ', 'Spis treści odświeży Word.')
add('Normal')

add(ST_H, 'WSTĘP')
for t in WSTEP:
    add(ST_T, t)
add('Normal')

fig_no = 0
for r in ROZDZIALY:
    add(ST_R, r['tytul'])
    for s in r['sekcje']:
        add(ST_SUB, s['tytul'])
        for el in s['tresc']:
            if isinstance(el, tuple):
                caption, key = el
                fig_no += 1
                width = SHOTFILES[key][1] if isinstance(SHOTFILES[key], tuple) else 15.0
                name = SHOTFILES[key][0] if isinstance(SHOTFILES[key], tuple) else SHOTFILES[key]
                add(ST_FIGT).add_run().add_picture(os.path.join(SHOTS, name), width=Cm(width))
                cap = add(ST_FIGT)
                cap.add_run('Rysunek ')
                field(cap, ' SEQ Rysunek \\* ARABIC ', str(fig_no))
                cap.add_run('. ' + caption)
                add(ST_FIGS, 'źródło: Opracowanie własne')
            else:
                add(ST_T, el)
    add('Normal')

add(ST_H, 'ZAKOŃCZENIE')
for t in ZAKONCZENIE:
    add(ST_T, t)
add('Normal')

add(ST_H, 'SPIS RYSUNKÓW')
field(add('table of figures'), ' TOC \\h \\z \\c "Rysunek" ', 'Spis rysunków odświeży Word.')
add('Normal')

add(ST_H, 'BIBLIOGRAFIA')
for b in BIBLIOGRAFIA:
    add(ST_SPIS, b)

# numeracja stron: strona tytułowa to 1 (bez numeru), treść zaczyna się od 2
for sec in d.sections[1:]:
    pn = sec._sectPr.find(qn('w:pgNumType'))
    if pn is not None:
        pn.set(qn('w:start'), '2')

os.makedirs(os.path.dirname(OUT), exist_ok=True)
d.save(OUT)
print('zapisano:', OUT, '| rysunków:', fig_no)
