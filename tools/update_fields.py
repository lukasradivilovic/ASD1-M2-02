# -*- coding: utf-8 -*-
"""Odświeża pola Worda (spis treści, numery rysunków, spis rysunków),
podaje statystyki i eksportuje dokumentację do PDF.

Uruchomienie PO build_docs.py. Dokument nie może być otwarty w Wordzie.
"""
import os
import win32com.client as win32

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCX = os.path.join(ROOT, 'docs', 'ASD1-M2-02_Radivilovic_dokumentacja.docx')
PDF = os.path.join(ROOT, 'ASD1-M2-02_Radivilovic_dokumentacja.pdf')

app = win32.Dispatch('Word.Application')
app.Visible = False
doc = app.Documents.Open(DOCX)
app.ActiveWindow.View.Type = 3
doc.Repaginate()
doc.Fields.Update()
for toc in doc.TablesOfContents:
    toc.Update()
for tof in doc.TablesOfFigures:
    tof.Update()
doc.Fields.Update()
doc.Repaginate()
print('pól:', doc.Fields.Count, '| spisów treści:', doc.TablesOfContents.Count,
      '| spisów rysunków:', doc.TablesOfFigures.Count)
print('słowa:', doc.ComputeStatistics(0), '| strony:', doc.ComputeStatistics(2))
doc.Save()
doc.ExportAsFixedFormat(PDF, 17)
doc.Close(False)
print('PDF:', PDF)
