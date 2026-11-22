/* ASD1-M2-02 — generatory kroków "przed → decyzja → po".
 * Wiersze tabeli biorą się z wykonania prawdziwej pętli, a nie z ręcznie
 * wpisanych danych: generator liczy to samo co funkcje z algorithms.js
 * i po każdym kroku oddaje snapshot stanu (yield).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./algorithms.js'));
  else root.PortfolioSteps = factory(root.PortfolioAlgorithms);
})(typeof self !== 'undefined' ? self : this, function (A) {
  'use strict';

  // Lista samych identyfikatorów, żeby w tabeli kroków pokazać krótki stan.
  function ids(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) out.push(list[i].id);
    return out;
  }

  function label(r) {
    return r.id + ' „' + r.title + '”';
  }

  /* Sortowanie przez wstawianie krok po kroku.
   * Każdy yield to jeden wiersz tabeli: stan przed decyzją, treść decyzji
   * i stan po niej. Licznik porównań rośnie dokładnie tam, gdzie
   * w insertionSort z algorithms.js.
   */
  function* insertionSteps(records, compareFn) {
    var a = records.slice();
    var counter = { comparisons: 0 };
    yield {
      kind: 'start',
      before: ids(a),
      decision: 'Zaczynam. Pierwszy element uznaję za posortowany.',
      after: ids(a),
      comparisons: 0,
      highlight: [0]
    };
    for (var i = 1; i < a.length; i++) {
      var key = a[i];
      var before = ids(a);
      var j = i - 1;
      var moved = 0;
      while (j >= 0) {
        counter.comparisons++;
        var cmp = compareFn(a[j], key);
        var beforeCmp = ids(a);
        if (cmp > 0) {
          a[j + 1] = a[j];
          j--;
          moved++;
          yield {
            kind: 'compare',
            before: beforeCmp,
            decision: 'Porównuję ' + label(a[j + 2]) + ' z ' + label(key) + ': większy, więc przesuwam go w prawo.',
            after: ids(a),
            comparisons: counter.comparisons,
            highlight: [j + 1, j + 2]
          };
        } else {
          yield {
            kind: 'compare',
            before: beforeCmp,
            decision: 'Porównuję ' + label(a[j]) + ' z ' + label(key) + ': nie jest większy, więc miejsce znalezione.',
            after: ids(a),
            comparisons: counter.comparisons,
            highlight: [j]
          };
          break;
        }
      }
      a[j + 1] = key;
      yield {
        kind: 'insert',
        before: before,
        decision: 'Wstawiam ' + label(key) + ' na pozycję ' + (j + 1) + ' (przesunięć: ' + moved + ').',
        after: ids(a),
        comparisons: counter.comparisons,
        highlight: [j + 1]
      };
    }
    yield {
      kind: 'done',
      before: ids(a),
      decision: 'Koniec. Porównań kluczy razem: ' + counter.comparisons + '.',
      after: ids(a),
      comparisons: counter.comparisons,
      done: true,
      result: a
    };
  }

  /* Wyszukiwanie i filtrowanie krok po kroku.
   * Pętla przechodzi całą listę, bo zbieram wszystkie dopasowania.
   */
  function* searchSteps(records, filters) {
    var out = [];
    var checked = 0;
    yield {
      kind: 'start',
      before: [],
      decision: 'Zaczynam od pustego wyniku. Sprawdzam każdy rekord po kolei.',
      after: [],
      checked: 0
    };
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var before = out.slice();
      checked++;
      var ok = A.matchesFilters(r, filters);
      var why = reason(r, filters, ok);
      if (ok) out.push(r);
      yield {
        kind: 'check',
        index: i,
        record: r,
        before: ids(before),
        decision: 'Sprawdzam ' + label(r) + ': ' + why,
        after: ids(out),
        checked: checked,
        matched: ok
      };
    }
    yield {
      kind: 'done',
      before: ids(out),
      decision: 'Koniec listy. Sprawdzonych rekordów: ' + checked + ', dopasowań: ' + out.length + '.',
      after: ids(out),
      checked: checked,
      done: true,
      result: out
    };
  }

  // Krótkie uzasadnienie decyzji, po polsku, zgodne z warunkiem w matchesFilters.
  function reason(record, filters, ok) {
    var f = filters || {};
    var parts = [];
    if (f.text) {
      var q = A.normalizeText(f.text);
      var inTitle = A.normalizeText(record.title).indexOf(q) !== -1;
      var inDesc = A.normalizeText(record.description).indexOf(q) !== -1;
      parts.push('fragment „' + f.text + '” ' + (inTitle ? 'jest w tytule' : (inDesc ? 'jest w opisie' : 'nie występuje w tytule ani w opisie')));
    }
    if (f.tech) {
      var want = A.normalizeTech(f.tech);
      var techs = A.uniqueTechs(record.technologies);
      var has = false;
      for (var i = 0; i < techs.length; i++) {
        if (A.normalizeTech(techs[i]) === want) { has = true; break; }
      }
      parts.push('technologia „' + f.tech + '” ' + (has ? 'jest na liście' : 'nie występuje'));
    }
    if (f.year) parts.push('rok ' + record.year + (Number(record.year) === Number(f.year) ? ' zgadza się z filtrem' : ' różni się od ' + f.year));
    if (f.status) parts.push('status „' + record.status + '”' + (record.status === f.status ? ' zgadza się' : ' nie zgadza się z filtrem'));
    if (parts.length === 0) parts.push('brak filtrów, więc rekord wchodzi do wyniku');
    return parts.join('; ') + ' → ' + (ok ? 'dopisuję do wyniku' : 'pomijam') + '.';
  }

  // Wszystkie wiersze naraz (do tabeli i do testów stanów pośrednich).
  function collect(gen, limit) {
    var rows = [];
    var max = limit || 5000;
    var n = gen.next();
    while (!n.done && rows.length < max) {
      rows.push(n.value);
      if (n.value.done) break;
      n = gen.next();
    }
    return rows;
  }

  return { insertionSteps: insertionSteps, searchSteps: searchSteps, collect: collect };
});
