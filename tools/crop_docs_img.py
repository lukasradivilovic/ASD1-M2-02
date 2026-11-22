# -*- coding: utf-8 -*-
"""Przycina zrzuty do fragmentów, które pokazuję w dokumentacji.
Pełne zrzuty zostają w docs/img, przycięte lądują obok z przedrostkiem doc_.
Uruchomienie: python tools/crop_docs_img.py
"""
import os
from PIL import Image

IMG = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'docs', 'img')

# nazwa: (plik źródłowy, lewo, góra, prawo, dół)
CROPS = {
    'doc_filtr.png': ('filtr.png', 0, 0, 1500, 620),
    'doc_formularz.png': ('formularz.png', 380, 60, 1120, 560),
    'doc_kroki.png': ('kroki_sort.png', 0, 90, 1500, 620),
    'doc_porownanie.png': ('porownanie.png', 0, 90, 1500, 700),
    'doc_testy.png': ('testy.png', 0, 90, 1500, 720),
}

for out, (src, *bbox) in CROPS.items():
    im = Image.open(os.path.join(IMG, src)).crop(tuple(bbox))
    im.save(os.path.join(IMG, out))
    print(out, im.size)
