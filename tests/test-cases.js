/* ASD1-M2-02 — przypadki testowe.
 * Ten sam plik uruchamia Node (tests/run-tests.js) i zakładka "Testy"
 * w aplikacji. Wartości oczekiwane biorę z karty tematu albo z obliczeń
 * zrobionych ręcznie na kartce, nigdy z wyniku programu.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../src/algorithms.js'), require('../src/steps.js'), require('../src/data-io.js'), require('../src/compare.js'));
  } else {
    root.PortfolioTests = factory(root.PortfolioAlgorithms, root.PortfolioSteps, root.PortfolioData, root.PortfolioCompare);
  }
})(typeof self !== 'undefined' ? self : this, function (A, S, D, C) {
  'use strict';

  function p(id, title, year, status, techs, extra) {
    var o = {
      id: id, title: title, description: (extra && extra.description) || ('Opis projektu ' + title + '.'),
      year: year, status: status, technologies: techs,
      role: 'autor', repoUrl: 'https://example.org/' + id.toLowerCase(), demoUrl: ''
    };
    return A.validateProject(o, [], null);
  }

  // Zestaw z karty tematu.
  function karta() {
    return [
      p('A', 'Atlas', 2026, 'gotowy', ['Python', 'python', 'HTML']),
      p('B', 'Budżet', 2025, 'w trakcie', ['Python']),
      p('C', 'Gra', 2026, 'gotowy', ['JavaScript'])
    ];
  }

  // Identyfikatory po przecinku, żeby wynik testu dało się porównać jednym napisem.
  function ids(list) {
    var out = '';
    for (var i = 0; i < list.length; i++) {
      if (i > 0) out += ',';
      out += list[i].id;
    }
    return out;
  }

  // Zamienia listę technologii ze statystyk na obiekt klucz → liczba.
  function techMap(techList) {
    var t = {};
    for (var i = 0; i < techList.length; i++) {
      t[techList[i].key] = techList[i].count;
    }
    return t;
  }

  var cases = [
    {
      id: 'T01', group: 'Przykład kontrolny',
      name: 'Filtr technologii Python daje A i B oraz poprawne statystyki',
      input: 'dane z karty, filtr: technologia = Python',
      expected: 'A,B | gotowy 1, w trakcie 1 | Python 2, HTML 1',
      run: function () {
        var v = A.computeView(karta(), { tech: 'Python' }, 'najnowsze');
        var t = techMap(v.stats.techList);
        return {
          got: ids(v.visible) + ' | gotowy ' + v.stats.statuses.gotowy + ', w trakcie ' + v.stats.statuses['w trakcie'] +
               ' | Python ' + t.python + ', HTML ' + t.html,
          pass: ids(v.visible) === 'A,B' && v.stats.statuses.gotowy === 1 && v.stats.statuses['w trakcie'] === 1 &&
                t.python === 2 && t.html === 1
        };
      }
    },
    {
      id: 'T02', group: 'Przykład kontrolny',
      name: 'Dodanie filtra rok 2026 zostawia tylko A',
      input: 'dane z karty, filtry: technologia = Python ORAZ rok = 2026',
      expected: 'A',
      run: function () {
        var v = A.computeView(karta(), { tech: 'Python', year: 2026 }, 'najnowsze');
        return { got: ids(v.visible), pass: ids(v.visible) === 'A' };
      }
    },
    {
      id: 'T03', group: 'Przykład kontrolny',
      name: 'Stan pośredni: po sprawdzeniu A i B licznik = 2, wynik = A,B',
      input: 'dane z karty, filtr Python, drugi krok generatora',
      expected: 'checked 2, wynik A,B',
      run: function () {
        var rows = S.collect(S.searchSteps(karta(), { tech: 'Python' }));
        var r = rows[2]; // start, sprawdzenie A, sprawdzenie B
        return {
          got: 'checked ' + r.checked + ', wynik ' + r.after.join(','),
          pass: r.checked === 2 && r.after.join(',') === 'A,B'
        };
      }
    },
    {
      id: 'T04', group: 'Technologie',
      name: 'Powtórzona technologia w jednym projekcie nie zawyża statystyki',
      input: '[Python, python, PYTHON, HTML] w jednym projekcie',
      expected: 'Python 1, HTML 1',
      run: function () {
        var rec = [p('X', 'Powtórki', 2026, 'gotowy', ['Python', 'python', 'PYTHON', 'HTML'])];
        var s = A.summarize(rec);
        var t = techMap(s.techList);
        return { got: 'Python ' + t.python + ', HTML ' + t.html, pass: t.python === 1 && t.html === 1 };
      }
    },
    {
      id: 'T05', group: 'Filtry',
      name: 'Dwa filtry działają łącznie, a wyczyszczenie przywraca całą listę',
      input: 'dane z karty: filtr status=gotowy + rok=2026, potem brak filtrów',
      expected: 'A,C a po wyczyszczeniu A,C,B',
      run: function () {
        var data = karta();
        var f = A.computeView(data, { status: 'gotowy', year: 2026 }, 'najnowsze');
        var all = A.computeView(data, {}, 'najnowsze');
        return {
          got: ids(f.visible) + ' / ' + ids(all.visible),
          pass: ids(f.visible) === 'A,C' && ids(all.visible) === 'A,C,B'
        };
      }
    },
    {
      id: 'T06', group: 'Walidacja',
      name: 'Projekt bez tytułu nie jest zapisywany i stan się nie zmienia',
      input: 'tytuł = "   "',
      expected: 'ValidationError, lista nadal 3 rekordy',
      run: function () {
        var data = karta();
        var err = null;
        try {
          data.push(A.validateProject({ id: 'D', title: '   ', description: 'opis', year: 2026, status: 'gotowy', technologies: ['Python'], role: 'autor', repoUrl: 'https://example.org/d' }, data, null));
        } catch (e) { err = e; }
        return {
          got: (err ? err.name + ' (' + err.field + ')' : 'brak błędu') + ', rekordów ' + data.length,
          pass: !!err && err.name === 'ValidationError' && err.field === 'title' && data.length === 3
        };
      }
    },
    {
      id: 'T07', group: 'Sortowanie',
      name: 'Remis roku rozstrzyga ID, niezależnie od kolejności dodawania',
      input: 'Z-2 (2026), A-1 (2026), M-3 (2025) dodane w tej kolejności',
      expected: 'A-1,Z-2,M-3',
      run: function () {
        var data = [p('Z-2', 'Zet', 2026, 'gotowy', ['Python']), p('A-1', 'Alfa', 2026, 'gotowy', ['Python']), p('M-3', 'Mu', 2025, 'gotowy', ['Python'])];
        var out = A.insertionSort(data, A.byNewest, A.makeCounter());
        var rev = A.insertionSort(data.slice().reverse(), A.byNewest, A.makeCounter());
        return { got: ids(out) + ' / ' + ids(rev), pass: ids(out) === 'A-1,Z-2,M-3' && ids(rev) === 'A-1,Z-2,M-3' };
      }
    },
    {
      id: 'T08', group: 'Przypadki brzegowe',
      name: 'Pusta lista: zera w statystykach, bez dzielenia przez zero',
      input: '[]',
      expected: 'total 0, gotowy 0, technologii 0, procent 0',
      run: function () {
        var s = A.summarize([]);
        var v = A.computeView([], { text: 'cokolwiek' }, 'tytuly');
        return {
          got: 'total ' + s.total + ', gotowy ' + s.statuses.gotowy + ', technologii ' + s.techList.length + ', procent ' + s.percent(0) + ', widocznych ' + v.visible.length,
          pass: s.total === 0 && s.statuses.gotowy === 0 && s.techList.length === 0 && s.percent(0) === 0 && isFinite(s.percent(0)) && v.visible.length === 0
        };
      }
    },
    {
      id: 'T09', group: 'Dane',
      name: 'Eksport i ponowny import odtwarzają dane oraz ten sam wynik',
      input: 'dane z karty → JSON → import → filtr Python',
      expected: '3 rekordy, wynik A,B',
      run: function () {
        var json = D.exportJson(karta());
        var back = D.parseImport(json);
        var v = A.computeView(back.projects, { tech: 'Python' }, 'najnowsze');
        return {
          got: back.projects.length + ' rekordy, wynik ' + ids(v.visible),
          pass: back.projects.length === 3 && ids(v.visible) === 'A,B'
        };
      }
    },
    {
      id: 'T10', group: 'Dane',
      name: 'Błędny plik nie nadpisuje danych (zła wersja, zły JSON, duplikat ID, rok 1999)',
      input: 'cztery wadliwe pliki importu',
      expected: '4 razy ValidationError, bieżące dane bez zmian',
      run: function () {
        var current = karta();
        var bad = [
          '{"format":"asd1-m2-02-portfolio","version":9,"projects":[]}',
          '{to nie jest json',
          JSON.stringify({ format: 'asd1-m2-02-portfolio', version: 1, projects: [karta()[0], karta()[0]] }),
          JSON.stringify({ format: 'asd1-m2-02-portfolio', version: 1, projects: [Object.assign({}, karta()[0], { year: 1999 })] })
        ];
        var errs = 0;
        for (var i = 0; i < bad.length; i++) {
          try {
            D.parseImport(bad[i]);
          } catch (e) {
            if (e.name === 'ValidationError') errs++;
          }
        }
        return { got: errs + ' błędy, rekordów ' + current.length, pass: errs === 4 && current.length === 3 };
      }
    },
    {
      id: 'T11', group: 'Sortowanie',
      name: 'Własne sortowanie zgadza się z wzorcem: dane uporządkowane, odwrócone, z remisem',
      input: 'n = 100, trzy układy danych, porządek "najnowsze"',
      expected: 'trzy razy ta sama kolejność co Array.prototype.sort',
      run: function () {
        var ok = true, opis = [];
        var uklady = ['posortowany', 'odwrocony', 'losowy'];
        for (var i = 0; i < uklady.length; i++) {
          var data = C.generate(100, uklady[i], 2026);
          var mine = A.insertionSort(data, A.byNewest, A.makeCounter());
          var ref = C.referenceSort(data, A.byNewest);
          var same = C.sameOrder(mine, ref);
          opis.push(uklady[i] + ': ' + (same ? 'zgodne' : 'różne'));
          if (!same) ok = false;
        }
        var tie = [p('B-2', 'Remis', 2026, 'gotowy', ['Python']), p('A-9', 'Remis', 2026, 'gotowy', ['Python'])];
        var tieOut = A.insertionSort(tie, A.byTitle, A.makeCounter());
        opis.push('remis tytułów → ' + ids(tieOut));
        ok = ok && ids(tieOut) === 'A-9,B-2';
        return { got: opis.join('; '), pass: ok };
      }
    },
    {
      id: 'T12', group: 'Sortowanie',
      name: 'Liczba porównań zgadza się ze wzorami n−1 i n(n−1)/2',
      input: 'n = 10, dane posortowane i odwrócone',
      expected: '9 porównań i 45 porównań',
      run: function () {
        var data = C.generate(10, 'posortowany', 2026);
        var c1 = A.makeCounter(); A.insertionSort(data, A.byNewest, c1);
        var rev = data.slice().reverse();
        var c2 = A.makeCounter(); A.insertionSort(rev, A.byNewest, c2);
        return {
          got: 'posortowane ' + c1.comparisons + ', odwrócone ' + c2.comparisons,
          pass: c1.comparisons === 9 && c2.comparisons === 45
        };
      }
    },
    {
      id: 'T13', group: 'Sortowanie',
      name: 'Sortowanie nie psuje wejścia i jest stabilne',
      input: 'trzy rekordy z tym samym rokiem i tym samym tytułem',
      expected: 'wejście bez zmian, kolejność dodania zachowana przy równych kluczach',
      run: function () {
        var data = [p('P-1', 'Ten sam', 2026, 'gotowy', ['Python']), p('P-2', 'Ten sam', 2026, 'gotowy', ['Python']), p('P-3', 'Ten sam', 2026, 'gotowy', ['Python'])];
        var before = ids(data);
        var out = A.insertionSort(data, function () { return 0; }, A.makeCounter());
        return { got: 'wejście ' + ids(data) + ', wynik ' + ids(out), pass: ids(data) === before && ids(out) === 'P-1,P-2,P-3' };
      }
    },
    {
      id: 'T14', group: 'Tytuły',
      name: 'Polskie znaki w tytułach: Łódź przed Mapa, ale po Lipiec',
      input: '["Mapa", "Łódź", "Lipiec", "lódź"]',
      expected: 'Lipiec, lódź, Łódź, Mapa',
      run: function () {
        var data = [p('T-1', 'Mapa', 2026, 'gotowy', ['Python']), p('T-2', 'Łódź', 2026, 'gotowy', ['Python']),
                    p('T-3', 'Lipiec', 2026, 'gotowy', ['Python']), p('T-4', 'lódź', 2026, 'gotowy', ['Python'])];
        var posortowane = A.insertionSort(data, A.byTitle, A.makeCounter());
        var out = '';
        for (var i = 0; i < posortowane.length; i++) {
          if (i > 0) out += ', ';
          out += posortowane[i].title;
        }
        return { got: out, pass: out === 'Lipiec, lódź, Łódź, Mapa' };
      }
    },
    {
      id: 'T15', group: 'Wyszukiwanie',
      name: 'Trafienie na początku, na końcu i brak wyniku: licznik zawsze n',
      input: 'n = 100 rekordów, trzy zapytania',
      expected: '3 razy sprawdzone 100; wariant "pierwsze dopasowanie": 1, 100, 100',
      run: function () {
        var rows = C.runSearchExperiment(100);
        var opisy = [];
        var wszystkieStoSprawdzen = true;
        for (var i = 0; i < rows.length; i++) {
          opisy.push(rows[i].przypadek + ': ' + rows[i].sprawdzone_wszystkie + '/' + rows[i].sprawdzone_pierwsze);
          if (rows[i].sprawdzone_wszystkie !== 100) wszystkieStoSprawdzen = false;
        }
        var got = opisy.join('; ');
        var pass = wszystkieStoSprawdzen &&
                   rows[0].sprawdzone_pierwsze === 1 && rows[1].sprawdzone_pierwsze === 100 && rows[2].sprawdzone_pierwsze === 100;
        return { got: got, pass: pass };
      }
    },
    {
      id: 'T16', group: 'Wyszukiwanie',
      name: 'Fragment opisu znajduje rekord, którego nie znajdzie filtr technologii',
      input: 'szukam "gra zręcznościowa", filtruję technologię "gra"',
      expected: 'wyszukiwanie 1 rekord, filtr 0 rekordów',
      run: function () {
        var data = [p('S-1', 'Projekt', 2026, 'gotowy', ['JavaScript'], { description: 'Gra zręcznościowa w przeglądarce.' })];
        var found = A.linearSearch(data, 'gra zręcznościowa', A.makeCounter());
        var filtered = A.applyFilters(data, { tech: 'gra' }, A.makeCounter());
        return { got: 'wyszukiwanie ' + found.length + ', filtr ' + filtered.length, pass: found.length === 1 && filtered.length === 0 };
      }
    },
    {
      id: 'T17', group: 'Walidacja',
      name: 'Identyfikatora nie da się zmienić w edycji',
      input: 'edycja rekordu A z nowym ID = "A2"',
      expected: 'ValidationError przy polu id',
      run: function () {
        var data = karta();
        var err = null;
        try {
          A.validateProject(Object.assign({}, data[0], { id: 'A2' }), data, 'A');
        } catch (e) { err = e; }
        return { got: err ? err.message : 'brak błędu', pass: !!err && err.field === 'id' };
      }
    },
    {
      id: 'T18', group: 'Walidacja',
      name: 'Rok poza zakresem 2000–2100 i zły status są odrzucane',
      input: 'rok 1999 oraz status "zrobiony"',
      expected: 'dwa razy ValidationError',
      run: function () {
        var base = { id: 'Q', title: 'Test', description: 'opis', year: 2026, status: 'gotowy', technologies: ['Python'], role: 'autor', repoUrl: 'https://example.org/q' };
        var e1 = null, e2 = null;
        try { A.validateProject(Object.assign({}, base, { year: 1999 }), [], null); } catch (e) { e1 = e; }
        try { A.validateProject(Object.assign({}, base, { status: 'zrobiony' }), [], null); } catch (e) { e2 = e; }
        return { got: (e1 ? e1.field : '-') + ' / ' + (e2 ? e2.field : '-'), pass: !!e1 && e1.field === 'year' && !!e2 && e2.field === 'status' };
      }
    },
    {
      id: 'T19', group: 'Bezpieczeństwo',
      name: 'Wpisany HTML zostaje tekstem (sprawdzam zapis znaków w rekordzie)',
      input: 'tytuł "<img src=x onerror=alert(1)>"',
      expected: 'tytuł zapisany znak w znak, bez wycinania',
      run: function () {
        var rec = p('XSS', '<img src=x onerror=alert(1)>', 2026, 'planowany', ['HTML']);
        var ok = rec.title === '<img src=x onerror=alert(1)>';
        if (typeof document !== 'undefined') {
          var d = document.createElement('div');
          d.textContent = rec.title;
          ok = ok && d.getElementsByTagName('img').length === 0 && d.textContent === rec.title;
        }
        return { got: rec.title + (typeof document !== 'undefined' ? ' (w DOM jako tekst)' : ' (w Node bez DOM)'), pass: ok };
      }
    },
    {
      id: 'T20', group: 'Kroki',
      name: 'Stan pośredni sortowania: po pierwszym wstawieniu B stoi przed C',
      input: 'dane z karty, porządek "najnowsze", krok wstawienia nr 1',
      expected: 'po kroku: A,B,C → A,C,B w kolejnych wstawieniach',
      run: function () {
        var rows = S.collect(S.insertionSteps(karta(), A.byNewest));
        var inserts = [];
        var opisWstawien = [];
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].kind === 'insert') {
            inserts.push(rows[i]);
            opisWstawien.push(rows[i].after.join(''));
          }
        }
        var last = rows[rows.length - 1];
        return {
          got: 'wstawienia: ' + opisWstawien.join(' → ') + ', wynik ' + ids(last.result),
          pass: inserts[0].after.join(',') === 'A,B,C' && ids(last.result) === 'A,C,B'
        };
      }
    },
    {
      id: 'T21', group: 'Kroki',
      name: 'Generator kroków daje ten sam wynik co zwykła funkcja',
      input: 'n = 40 rekordów, porządek "tytuły"',
      expected: 'identyczna kolejność i identyczna liczba porównań',
      run: function () {
        var data = C.generate(40, 'losowy', 7);
        var c = A.makeCounter();
        var direct = A.insertionSort(data, A.byTitle, c);
        var rows = S.collect(S.insertionSteps(data, A.byTitle));
        var last = rows[rows.length - 1];
        return {
          got: 'porównania ' + c.comparisons + ' vs ' + last.comparisons + ', kolejność ' + (C.sameOrder(direct, last.result) ? 'zgodna' : 'różna'),
          pass: c.comparisons === last.comparisons && C.sameOrder(direct, last.result)
        };
      }
    },
    {
      id: 'T22', group: 'Dane',
      name: 'Zestaw 1000 rekordów przechodzi walidację i filtr liczy n sprawdzeń',
      input: 'scenariusz większy, 1000 rekordów, filtr status = gotowy',
      expected: '1000 sprawdzeń, wynik niepusty',
      run: function () {
        var data = A.validateProjectSet(C.generate(1000, 'losowy', 2026));
        var c = A.makeCounter();
        var out = A.applyFilters(data, { status: 'gotowy' }, c);
        return { got: 'sprawdzone ' + c.checked + ', wynik ' + out.length, pass: c.checked === 1000 && out.length > 0 };
      }
    }
  ];

  function runAll() {
    var results = [];
    var passed = 0;
    for (var i = 0; i < cases.length; i++) {
      var c = cases[i];
      var r;
      try {
        r = c.run();
      } catch (e) {
        r = { got: 'wyjątek: ' + e.message, pass: false };
      }
      if (r.pass) passed++;
      results.push({
        id: c.id, group: c.group, name: c.name, input: c.input,
        expected: c.expected, got: r.got, status: r.pass ? 'OK' : 'BŁĄD'
      });
    }
    return { total: results.length, passed: passed, failed: results.length - passed, results: results };
  }

  return { cases: cases, runAll: runAll };
});
