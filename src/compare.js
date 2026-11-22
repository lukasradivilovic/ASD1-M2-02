/* ASD1-M2-02 — eksperyment porównawczy.
 * Dane generuję powtarzalnie (generator liniowy LCG ze stałym ziarnem),
 * więc każde uruchomienie daje te same liczby.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./algorithms.js'));
  else root.PortfolioCompare = factory(root.PortfolioAlgorithms);
})(typeof self !== 'undefined' ? self : this, function (A) {
  'use strict';

  // Generator liniowy: x = (a*x + c) mod m. Ten sam wzór co w moim M1.
  function lcg(seed) {
    var x = seed >>> 0;
    return function () {
      x = (1103515245 * x + 12345) % 2147483648;
      return x / 2147483648;
    };
  }

  var WORDS = ['Atlas', 'Budżet', 'Gra', 'Kalendarz', 'Mapa', 'Notatnik', 'Pogoda', 'Quiz', 'Sklep', 'Łódź', 'Śledzik', 'Żagiel', 'Czat', 'Dziennik'];
  var TECHS = ['Python', 'JavaScript', 'HTML', 'CSS', 'Java', 'C++', 'SQL', 'Node.js'];
  var STATUSES = A.STATUSES;

  function pad(n, len) {
    var s = String(n);
    while (s.length < len) s = '0' + s;
    return s;
  }

  // n powtarzalnych rekordów. order: 'losowy' | 'posortowany' | 'odwrocony'.
  function generate(n, order, seed) {
    var rnd = lcg(seed === undefined ? 2026 : seed);
    var out = [];
    for (var i = 0; i < n; i++) {
      var word = WORDS[Math.floor(rnd() * WORDS.length)];
      var year = 2000 + Math.floor(rnd() * 27);
      var t1 = TECHS[Math.floor(rnd() * TECHS.length)];
      var t2 = TECHS[Math.floor(rnd() * TECHS.length)];
      out.push({
        id: 'G-' + pad(i + 1, 4),
        title: word + ' ' + pad(i + 1, 4),
        description: 'Projekt wygenerowany do testów wydajności, numer ' + (i + 1) + '.',
        year: year,
        status: STATUSES[Math.floor(rnd() * STATUSES.length)],
        technologies: t1 === t2 ? [t1] : [t1, t2],
        role: 'autor',
        repoUrl: 'https://example.org/repo/' + pad(i + 1, 4),
        demoUrl: ''
      });
    }
    if (order === 'posortowany') out = A.insertionSort(out, A.byNewest, null);
    if (order === 'odwrocony') out = A.insertionSort(out, A.byNewest, null).reverse();
    return out;
  }

  // Wzorzec niezależny: wbudowane sortowanie. Używam go wyłącznie do kontroli
  // wyniku w porównaniu i w testach, nigdy w głównej ścieżce aplikacji.
  // Zapamiętuję pierwotną pozycję każdego rekordu, żeby wzorzec też był stabilny
  // i żeby porównanie z moim sortowaniem było uczciwe.
  function referenceSort(records, compareFn) {
    var pary = [];
    for (var i = 0; i < records.length; i++) {
      pary.push({ rekord: records[i], pozycja: i });
    }
    pary.sort(function (x, y) {
      var d = compareFn(x.rekord, y.rekord);
      if (d !== 0) return d;
      return x.pozycja - y.pozycja;
    });
    var out = [];
    for (var j = 0; j < pary.length; j++) {
      out.push(pary[j].rekord);
    }
    return out;
  }

  function sameOrder(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i].id !== b[i].id) return false;
    return true;
  }

  // Porównanie sortowania dla n = 10, 100, 1000 i trzech układów danych.
  function runSortExperiment(sizes) {
    var rozmiary = sizes || [10, 100, 1000];
    var uklady = ['posortowany', 'odwrocony', 'losowy'];
    var rows = [];
    for (var i = 0; i < rozmiary.length; i++) {
      for (var j = 0; j < uklady.length; j++) {
        var n = rozmiary[i];
        var data = generate(n, uklady[j], 2026);
        var c = A.makeCounter();
        var mine = A.insertionSort(data, A.byNewest, c);
        var ref = referenceSort(data, A.byNewest);
        rows.push({
          n: n,
          uklad: uklady[j],
          porownania: c.comparisons,
          teoriaMin: n - 1,
          teoriaMax: n * (n - 1) / 2,
          zgodneZWzorcem: sameOrder(mine, ref)
        });
      }
    }
    return rows;
  }

  // Porównanie wyszukiwania: trafienie na początku, na końcu i brak wyniku.
  // Pokazuję dwa warianty pętli, bo licznik sprawdzeń zależy od tego,
  // czy szukam wszystkich dopasowań, czy tylko pierwszego.
  function runSearchExperiment(n) {
    var size = n || 100;
    var data = generate(size, 'losowy', 2026);
    data[0] = Object.assign({}, data[0], { title: 'Pierwszy znacznik', description: 'rekord na początku listy' });
    data[size - 1] = Object.assign({}, data[size - 1], { title: 'Ostatni znacznik', description: 'rekord na końcu listy' });
    var cases = [
      { nazwa: 'trafienie na początku', query: 'pierwszy znacznik' },
      { nazwa: 'trafienie na końcu', query: 'ostatni znacznik' },
      { nazwa: 'brak wyniku', query: 'zzz nie ma takiego projektu' }
    ];
    var rows = [];
    for (var i = 0; i < cases.length; i++) {
      var c = cases[i];
      var cAll = A.makeCounter();
      var all = A.linearSearch(data, c.query, cAll);
      var cFirst = A.makeCounter();
      var first = A.linearSearchFirst(data, c.query, cFirst);
      rows.push({
        n: size,
        przypadek: c.nazwa,
        zapytanie: c.query,
        wszystkie_trafienia: all.length,
        sprawdzone_wszystkie: cAll.checked,
        sprawdzone_pierwsze: cFirst.checked,
        znaleziono_pierwsze: first ? first.id : null
      });
    }
    return rows;
  }

  function runAll() {
    return {
      ziarno: 2026,
      sortowanie: runSortExperiment([10, 100, 1000]),
      wyszukiwanie: runSearchExperiment(100)
    };
  }

  return {
    lcg: lcg,
    generate: generate,
    referenceSort: referenceSort,
    sameOrder: sameOrder,
    runSortExperiment: runSortExperiment,
    runSearchExperiment: runSearchExperiment,
    runAll: runAll
  };
});
