/* ASD1-M2-02 — Portfolio projektów studenckich
 * Moduł z algorytmami. Nie dotyka DOM, więc te same pliki działają
 * w przeglądarce i w Node (testy). Format UMD jak w moim projekcie M1.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PortfolioAlgorithms = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Błąd walidacji z komunikatem po polsku i nazwą pola, przy którym go pokazuję.
  function ValidationError(message, field) {
    var e = new Error(message);
    e.name = 'ValidationError';
    e.field = field || null;
    return e;
  }

  var STATUSES = ['planowany', 'w trakcie', 'gotowy'];
  var YEAR_MIN = 2000;
  var YEAR_MAX = 2100;
  var MAX_RECORDS = 1000;
  var ID_PATTERN = /^[A-Z0-9-]+$/;

  /* ------------------------------------------------------------------ *
   * Normalizacja technologii
   * ------------------------------------------------------------------ */

  // Klucz porównania nazwy technologii: bez skrajnych spacji, bez wielkości liter.
  // Przykład z karty: "Python", "python" i " python " dają ten sam klucz.
  // Koszt: O(długość nazwy).
  function normalizeTech(name) {
    return String(name == null ? '' : name).trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Lista technologii jednego projektu bez powtórzeń. Zachowuję pierwszą pisownię
  // do wyświetlania, a do porównań używam klucza znormalizowanego.
  // Przykład z karty: [Python, python, HTML] → [Python, HTML].
  // Koszt: O(t) przy t technologiach (klucze trzymam w obiekcie).
  function uniqueTechs(list) {
    var seen = Object.create(null);
    var out = [];
    var arr = Array.isArray(list) ? list : [];
    for (var i = 0; i < arr.length; i++) {
      var raw = String(arr[i] == null ? '' : arr[i]).trim().replace(/\s+/g, ' ');
      if (raw === '') continue;
      var key = normalizeTech(raw);
      if (seen[key]) continue;
      seen[key] = true;
      out.push(raw);
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Normalizacja i porównanie tytułów
   * ------------------------------------------------------------------ */

  // Stała tabela porządku znaków (polski alfabet). Nie używam localeCompare,
  // bo jego wynik zależy od przeglądarki i systemu, a wynik sortowania
  // ma być zawsze taki sam.
  var ALPHABET = 'aąbcćdeęfghijklłmnńoópqrsśtuvwxyzźż';
  var CHAR_RANK = Object.create(null);
  for (var ci = 0; ci < ALPHABET.length; ci++) CHAR_RANK[ALPHABET[ci]] = ci + 1;
  for (var di = 0; di <= 9; di++) CHAR_RANK[String(di)] = 100 + di;
  CHAR_RANK[' '] = 0; // spacja przed wszystkim

  // Ranga pojedynczego znaku: litera z tabeli, potem cyfry, potem reszta po kodzie.
  function charRank(ch) {
    var r = CHAR_RANK[ch];
    return r === undefined ? 1000 + ch.charCodeAt(0) : r;
  }

  // Tytuł do sortowania: trim → zwinięte spacje → małe litery.
  // Koszt: O(długość tytułu).
  function normalizeTitle(title) {
    return String(title == null ? '' : title).trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Porównanie dwóch tytułów znak po znaku według tabeli ALPHABET.
  // Zwraca liczbę ujemną, zero albo dodatnią. Przykład: "Łódź" < "Mapa",
  // bo ł ma rangę 19, a m rangę 20.
  function compareTitles(a, b) {
    var x = normalizeTitle(a);
    var y = normalizeTitle(b);
    var n = Math.min(x.length, y.length);
    for (var i = 0; i < n; i++) {
      var d = charRank(x[i]) - charRank(y[i]);
      if (d !== 0) return d;
    }
    return x.length - y.length;
  }

  /* ------------------------------------------------------------------ *
   * Wyszukiwanie i filtry
   * ------------------------------------------------------------------ */

  // Licznik pracy algorytmu. checked = sprawdzone rekordy, comparisons = porównania kluczy.
  function makeCounter() {
    return { checked: 0, comparisons: 0 };
  }

  // Tekst do wyszukiwania fragmentu: małe litery, bez skrajnych spacji.
  function normalizeText(s) {
    return String(s == null ? '' : s).trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Wyszukiwanie liniowe. Szukam WSZYSTKICH dopasowań, więc pętla zawsze
  // przechodzi całą listę i licznik sprawdzonych rekordów to zawsze n.
  // Dopasowanie = fragment (includes) w tytule albo w opisie.
  // Koszt: n sprawdzeń, pamięć O(k) na wynik.
  function linearSearch(records, query, counter) {
    var q = normalizeText(query);
    var out = [];
    for (var i = 0; i < records.length; i++) {
      if (counter) counter.checked++;
      if (q === '') { out.push(records[i]); continue; }
      var r = records[i];
      if (normalizeText(r.title).indexOf(q) !== -1 || normalizeText(r.description).indexOf(q) !== -1) {
        out.push(r);
      }
    }
    return out;
  }

  // Wariant "pierwsze dopasowanie" — pokazuję go tylko w porównaniu,
  // żeby było widać różnicę w liczbie sprawdzeń (1 / n / n).
  function linearSearchFirst(records, query, counter) {
    var q = normalizeText(query);
    for (var i = 0; i < records.length; i++) {
      if (counter) counter.checked++;
      var r = records[i];
      if (q === '' || normalizeText(r.title).indexOf(q) !== -1 || normalizeText(r.description).indexOf(q) !== -1) {
        return r;
      }
    }
    return null;
  }

  // Czy rekord pasuje do kompletu filtrów. Warunki łączę przez AND.
  // Technologia = dokładne dopasowanie znormalizowanej nazwy,
  // tekst = fragment tytułu lub opisu. To jest różnica z pytania do obrony.
  function matchesFilters(record, filters) {
    var f = filters || {};
    if (f.text) {
      var q = normalizeText(f.text);
      if (normalizeText(record.title).indexOf(q) === -1 &&
          normalizeText(record.description).indexOf(q) === -1) return false;
    }
    if (f.tech) {
      var want = normalizeTech(f.tech);
      var techs = uniqueTechs(record.technologies);
      var hit = false;
      for (var i = 0; i < techs.length; i++) {
        if (normalizeTech(techs[i]) === want) { hit = true; break; }
      }
      if (!hit) return false;
    }
    if (f.year !== undefined && f.year !== null && f.year !== '') {
      if (Number(record.year) !== Number(f.year)) return false;
    }
    if (f.status) {
      if (record.status !== f.status) return false;
    }
    return true;
  }

  // Jedna pętla po wszystkich rekordach, wszystkie warunki naraz (AND).
  // Koszt: n sprawdzeń niezależnie od wyniku, pamięć O(k).
  function applyFilters(records, filters, counter) {
    var out = [];
    for (var i = 0; i < records.length; i++) {
      if (counter) counter.checked++;
      if (matchesFilters(records[i], filters)) out.push(records[i]);
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Sortowanie przez wstawianie
   * ------------------------------------------------------------------ */

  // Sortowanie przez wstawianie (insertion sort). Zwraca NOWĄ tablicę,
  // wejście zostaje nietknięte. Algorytm jest stabilny, bo przesuwam
  // element tylko wtedy, gdy jest ostro większy od wstawianego.
  // Licznik: comparisons rośnie przy każdym porównaniu kluczy.
  // Koszt: dane posortowane n−1 porównań, odwrócone n(n−1)/2, pamięć O(n).
  // Pułapka: warunek musi być > 0, nie >= 0, inaczej traci stabilność.
  function insertionSort(records, compareFn, counter) {
    var a = records.slice();
    for (var i = 1; i < a.length; i++) {
      var key = a[i];
      var j = i - 1;
      while (j >= 0) {
        if (counter) counter.comparisons++;
        if (compareFn(a[j], key) > 0) {
          a[j + 1] = a[j];
          j--;
        } else {
          break;
        }
      }
      a[j + 1] = key;
    }
    return a;
  }

  // Porządek "najnowsze": rok malejąco, przy remisie ID rosnąco.
  function byNewest(a, b) {
    if (a.year !== b.year) return b.year - a.year;
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
  }

  // Porządek "tytuły": znormalizowany tytuł wg tabeli znaków, przy remisie ID.
  function byTitle(a, b) {
    var d = compareTitles(a.title, b.title);
    if (d !== 0) return d;
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
  }

  /* ------------------------------------------------------------------ *
   * Statystyki widocznej listy
   * ------------------------------------------------------------------ */

  // Liczby statusów i częstość technologii liczone zwykłą pętlą.
  // Technologia liczy się raz na projekt, nawet jeśli powtórzono ją w rekordzie.
  // Pusta lista daje same zera, bez dzielenia przez zero i bez NaN.
  // Koszt: suma długości list technologii, pamięć O(t).
  function summarize(visibleRecords) {
    var res = {
      total: 0,
      statuses: { planowany: 0, 'w trakcie': 0, gotowy: 0 },
      techs: {},
      techList: []
    };
    var records = visibleRecords || [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      res.total++;
      if (res.statuses[r.status] === undefined) res.statuses[r.status] = 0;
      res.statuses[r.status]++;
      var techs = uniqueTechs(r.technologies);
      for (var j = 0; j < techs.length; j++) {
        var key = normalizeTech(techs[j]);
        if (!res.techs[key]) res.techs[key] = { label: techs[j], count: 0 };
        res.techs[key].count++;
      }
    }
    for (var k in res.techs) res.techList.push({ key: k, label: res.techs[k].label, count: res.techs[k].count });
    // porządek pomocniczy dla wykresu: częstość malejąco, przy remisie nazwa
    res.techList = insertionSort(res.techList, function (a, b) {
      if (a.count !== b.count) return b.count - a.count;
      return compareTitles(a.label, b.label);
    }, null);
    res.percent = function (count) {
      return res.total === 0 ? 0 : Math.round((count / res.total) * 100);
    };
    return res;
  }

  /* ------------------------------------------------------------------ *
   * Walidacja
   * ------------------------------------------------------------------ */

  // Sprawdzam cały rekord i dopiero potem oddaję gotową kopię.
  // Dzięki temu odrzucona operacja nie zostawia częściowego zapisu.
  // existing = aktualna lista (do kontroli unikalności ID), editId = ID edytowanego rekordu.
  function validateProject(input, existing, editId) {
    var data = input || {};
    var list = existing || [];
    var id = String(data.id == null ? '' : data.id).trim().toUpperCase();
    if (id === '') throw ValidationError('Podaj identyfikator projektu.', 'id');
    if (!ID_PATTERN.test(id)) throw ValidationError('Identyfikator może zawierać tylko wielkie litery A–Z, cyfry i łącznik.', 'id');
    if (editId && id !== String(editId).toUpperCase()) throw ValidationError('Identyfikatora nie można zmienić po utworzeniu projektu.', 'id');
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id && list[i].id !== editId) throw ValidationError('Projekt o identyfikatorze ' + id + ' już istnieje.', 'id');
    }
    if (!editId && list.length >= MAX_RECORDS) throw ValidationError('Portfolio mieści najwyżej ' + MAX_RECORDS + ' projektów.', 'id');

    var title = String(data.title == null ? '' : data.title).trim().replace(/\s+/g, ' ');
    if (title === '') throw ValidationError('Podaj tytuł projektu.', 'title');
    if (title.length > 120) throw ValidationError('Tytuł może mieć najwyżej 120 znaków.', 'title');

    var description = String(data.description == null ? '' : data.description).trim();
    if (description === '') throw ValidationError('Podaj opis projektu.', 'description');
    if (description.length > 2000) throw ValidationError('Opis może mieć najwyżej 2000 znaków.', 'description');

    var yearRaw = String(data.year == null ? '' : data.year).trim();
    if (!/^-?\d+$/.test(yearRaw)) throw ValidationError('Rok musi być liczbą całkowitą.', 'year');
    var year = parseInt(yearRaw, 10);
    if (year < YEAR_MIN || year > YEAR_MAX) throw ValidationError('Rok musi mieścić się w przedziale ' + YEAR_MIN + '–' + YEAR_MAX + '.', 'year');

    var status = String(data.status == null ? '' : data.status).trim();
    if (STATUSES.indexOf(status) === -1) throw ValidationError('Status musi być jedną z wartości: ' + STATUSES.join(', ') + '.', 'status');

    var techsRaw = Array.isArray(data.technologies)
      ? data.technologies
      : String(data.technologies == null ? '' : data.technologies).split(',');
    var technologies = uniqueTechs(techsRaw);
    if (technologies.length === 0) throw ValidationError('Podaj co najmniej jedną technologię.', 'technologies');

    var role = String(data.role == null ? '' : data.role).trim();
    if (role === '') throw ValidationError('Opisz swoją rolę w projekcie.', 'role');

    var repoUrl = String(data.repoUrl == null ? '' : data.repoUrl).trim();
    if (repoUrl === '') throw ValidationError('Podaj adres repozytorium.', 'repoUrl');
    if (!/^https?:\/\/\S+$/.test(repoUrl)) throw ValidationError('Adres repozytorium musi zaczynać się od http:// albo https://.', 'repoUrl');

    var demoUrl = String(data.demoUrl == null ? '' : data.demoUrl).trim();
    if (demoUrl !== '' && !/^https?:\/\/\S+$/.test(demoUrl)) {
      throw ValidationError('Adres demonstracji musi zaczynać się od http:// albo https://.', 'demoUrl');
    }

    return {
      id: id,
      title: title,
      description: description,
      year: year,
      status: status,
      technologies: technologies,
      role: role,
      repoUrl: repoUrl,
      demoUrl: demoUrl
    };
  }

  // Walidacja całego zestawu (import pliku). Sprawdzam wszystko przed podmianą.
  function validateProjectSet(records) {
    if (!Array.isArray(records)) throw ValidationError('Pole "projects" musi być listą projektów.', 'projects');
    if (records.length > MAX_RECORDS) throw ValidationError('Plik zawiera więcej niż ' + MAX_RECORDS + ' projektów.', 'projects');
    var out = [];
    for (var i = 0; i < records.length; i++) {
      try {
        out.push(validateProject(records[i], out, null));
      } catch (e) {
        throw ValidationError('Projekt nr ' + (i + 1) + ': ' + e.message, e.field);
      }
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Jedna ścieżka przeliczania widoku
   * ------------------------------------------------------------------ */

  // Po każdej zmianie danych albo filtrów liczę wszystko od nowa:
  // filtr → sortowanie → statystyki. Nie ma tu żadnego stanu z poprzedniego widoku.
  function computeView(records, filters, order) {
    var counter = makeCounter();
    var visible = applyFilters(records, filters, counter);
    var cmp = order === 'tytuly' ? byTitle : byNewest;
    var sorted = insertionSort(visible, cmp, counter);
    var stats = summarize(sorted);
    return { visible: sorted, stats: stats, counter: counter };
  }

  return {
    ValidationError: ValidationError,
    STATUSES: STATUSES,
    YEAR_MIN: YEAR_MIN,
    YEAR_MAX: YEAR_MAX,
    MAX_RECORDS: MAX_RECORDS,
    ALPHABET: ALPHABET,
    charRank: charRank,
    normalizeTech: normalizeTech,
    uniqueTechs: uniqueTechs,
    normalizeTitle: normalizeTitle,
    normalizeText: normalizeText,
    compareTitles: compareTitles,
    makeCounter: makeCounter,
    linearSearch: linearSearch,
    linearSearchFirst: linearSearchFirst,
    matchesFilters: matchesFilters,
    applyFilters: applyFilters,
    insertionSort: insertionSort,
    byNewest: byNewest,
    byTitle: byTitle,
    summarize: summarize,
    validateProject: validateProject,
    validateProjectSet: validateProjectSet,
    computeView: computeView
  };
});
