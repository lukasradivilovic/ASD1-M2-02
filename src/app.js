/* ASD1-M2-02 — interfejs aplikacji.
 * Logika liczenia siedzi w src/algorithms.js; tutaj jest tylko rysowanie,
 * obsługa zdarzeń i zapis danych. Teksty wstawiam przez textContent,
 * więc wpisany HTML nigdy się nie wykona.
 */
(function () {
  'use strict';

  var A = window.PortfolioAlgorithms;
  var S = window.PortfolioSteps;
  var D = window.PortfolioData;
  var C = window.PortfolioCompare;
  var SCEN = window.PortfolioScenarios || {};
  var STORAGE_KEY = 'asd1-m2-02-portfolio';

  var state = {
    projects: [],
    filters: { text: '', tech: '', year: '', status: '' },
    order: 'najnowsze',
    selected: null,
    algo: 'sort',
    gen: null,
    rows: []
  };

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = String(text);
    return e;
  }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 4000);
  }

  function statusClass(s) {
    return s === 'gotowy' ? 'gotowy' : (s === 'w trakcie' ? 'wtrakcie' : 'planowany');
  }

  /* ---------------------------------------------------------------- *
   * Obliczenie widoku i rysowanie listy
   * ---------------------------------------------------------------- */

  var view = { visible: [], stats: null, counter: { checked: 0, comparisons: 0 } };

  // Jedno miejsce, w którym wszystko liczy się od nowa: filtry → sortowanie → statystyki.
  function recompute() {
    view = A.computeView(state.projects, state.filters, state.order);
    renderCards();
    renderFilters();
    renderStats();
    renderDetail();
    resetSteps();
    save();
  }

  // Jedna karta projektu. Trzymam to w osobnej funkcji, żeby pętla niżej
  // była krótka, a kliknięcie pamiętało właściwy rekord.
  function makeCard(r) {
    var card = el('button', 'card' + (state.selected === r.id ? ' is-active' : ''));
    card.type = 'button';
    card.setAttribute('aria-label', 'Projekt ' + r.title + ', ' + r.year + ', ' + r.status);
    card.appendChild(el('span', 'cid', r.id + ' · ' + r.year));
    card.appendChild(el('h3', null, r.title));
    var opis = r.description;
    if (opis.length > 110) opis = opis.slice(0, 110) + '…';
    card.appendChild(el('p', 'desc', opis));
    card.appendChild(el('span', 'status ' + statusClass(r.status), r.status.toUpperCase()));
    var chips = el('div', 'chips');
    var techs = A.uniqueTechs(r.technologies);
    for (var i = 0; i < techs.length; i++) {
      chips.appendChild(el('span', 'chip', techs[i]));
    }
    card.appendChild(chips);
    card.addEventListener('click', function () {
      state.selected = r.id;
      renderCards();
      renderDetail();
    });
    return card;
  }

  function renderCards() {
    var box = $('#cards');
    box.textContent = '';
    for (var i = 0; i < view.visible.length; i++) {
      box.appendChild(makeCard(view.visible[i]));
    }
    var info = $('#result-info');
    info.textContent = view.visible.length + ' z ' + state.projects.length + ' projektów';
    var empty = $('#empty');
    if (view.visible.length === 0) {
      empty.hidden = false;
      empty.textContent = 'Brak projektów dla filtrów: ' + describeFilters() + '. Użyj przycisku „Wyczyść filtry”, żeby wrócić do całej listy.';
    } else {
      empty.hidden = true;
    }
    $('#counters').textContent = 'sprawdzone rekordy: ' + view.counter.checked + ' · porównania kluczy: ' + view.counter.comparisons;
  }

  function describeFilters() {
    var f = state.filters;
    var p = [];
    if (f.text) p.push('fragment „' + f.text + '”');
    if (f.tech) p.push('technologia ' + f.tech);
    if (f.year) p.push('rok ' + f.year);
    if (f.status) p.push('status ' + f.status);
    return p.length ? p.join(', ') : 'brak filtrów';
  }

  // Listy filtrów z licznikami trafień. Licznik pokazuje, ile rekordów
  // zostałoby po dołożeniu tej wartości do pozostałych filtrów.
  function renderFilters() {
    fillSelect('#f-tech', optionsWithCounts('tech'), state.filters.tech);
    fillSelect('#f-year', optionsWithCounts('year'), String(state.filters.year));
    fillSelect('#f-status', optionsWithCounts('status'), state.filters.status);
    var sel = $('#in-status');
    if (sel && sel.options.length === 0) {
      for (var i = 0; i < A.STATUSES.length; i++) {
        var o = document.createElement('option');
        o.value = A.STATUSES[i];
        o.textContent = A.STATUSES[i];
        sel.appendChild(o);
      }
    }
  }

  // Wartości jednego filtra razem z liczbą trafień. Do porządkowania używam
  // własnych funkcji z algorithms.js, więc wbudowanego sortowania tu nie ma.
  function optionsWithCounts(kind) {
    var values = [];
    var i, j;

    if (kind === 'tech') {
      var widziane = {};
      var doSortowania = [];
      for (i = 0; i < state.projects.length; i++) {
        var techs = A.uniqueTechs(state.projects[i].technologies);
        for (j = 0; j < techs.length; j++) {
          var klucz = A.normalizeTech(techs[j]);
          if (!widziane[klucz]) {
            widziane[klucz] = true;
            doSortowania.push({ title: techs[j], id: klucz });
          }
        }
      }
      var poSortowaniu = A.insertionSort(doSortowania, A.byTitle, null);
      for (i = 0; i < poSortowaniu.length; i++) {
        values.push(poSortowaniu[i].title);
      }

    } else if (kind === 'year') {
      var lata = {};
      for (i = 0; i < state.projects.length; i++) {
        lata[state.projects[i].year] = true;
      }
      var listaLat = [];
      for (var rok in lata) {
        listaLat.push({ year: Number(rok), id: rok });
      }
      // rok malejąco, czyli ten sam porządek co na liście „najnowsze”
      var lataPoSortowaniu = A.insertionSort(listaLat, A.byNewest, null);
      for (i = 0; i < lataPoSortowaniu.length; i++) {
        values.push(String(lataPoSortowaniu[i].year));
      }

    } else {
      values = A.STATUSES.slice();
    }

    var out = [];
    for (i = 0; i < values.length; i++) {
      var probe = Object.assign({}, state.filters);
      probe[kind] = values[i];
      var ile = A.applyFilters(state.projects, probe, null).length;
      out.push({ value: values[i], label: values[i] + ' (' + ile + ')' });
    }
    return out;
  }

  function fillSelect(sel, items, current) {
    var s = $(sel);
    var keep = current || '';
    s.textContent = '';
    var all = document.createElement('option');
    all.value = ''; all.textContent = 'wszystkie (' + A.applyFilters(state.projects, Object.assign({}, state.filters, firstKeyOf(sel)), null).length + ')';
    s.appendChild(all);
    for (var i = 0; i < items.length; i++) {
      var o = document.createElement('option');
      o.value = items[i].value;
      o.textContent = items[i].label;
      s.appendChild(o);
    }
    s.value = keep;
  }

  function firstKeyOf(sel) {
    var k = sel.replace('#f-', '');
    var o = {};
    o[k] = '';
    return o;
  }

  function renderDetail() {
    var box = $('#detail');
    box.textContent = '';
    var r = null;
    for (var i = 0; i < state.projects.length; i++) {
      if (state.projects[i].id === state.selected) { r = state.projects[i]; break; }
    }
    if (!r) {
      box.appendChild(el('p', 'hint', 'Wybierz kartę projektu, żeby zobaczyć pełny opis.'));
      return;
    }
    box.appendChild(el('h2', null, 'Pełny opis'));
    box.appendChild(el('h3', null, r.title));
    box.appendChild(el('span', 'status ' + statusClass(r.status), r.status.toUpperCase()));
    var dl = document.createElement('dl');
    function row(k, v) {
      dl.appendChild(el('dt', null, k));
      dl.appendChild(el('dd', null, v));
    }
    row('Identyfikator', r.id);
    row('Rok', String(r.year));
    row('Opis', r.description);
    row('Technologie', A.uniqueTechs(r.technologies).join(', '));
    row('Moja rola', r.role);
    dl.appendChild(el('dt', null, 'Repozytorium'));
    var dd = document.createElement('dd');
    dd.appendChild(link(r.repoUrl));
    dl.appendChild(dd);
    if (r.demoUrl) {
      dl.appendChild(el('dt', null, 'Demonstracja'));
      var dd2 = document.createElement('dd');
      dd2.appendChild(link(r.demoUrl));
      dl.appendChild(dd2);
    }
    box.appendChild(dl);
    var act = el('div', 'actions');
    var edit = el('button', 'btn primary', 'Edytuj');
    edit.type = 'button';
    edit.addEventListener('click', function () { openForm(r); });
    var del = el('button', 'btn ghost', 'Usuń');
    del.type = 'button';
    del.addEventListener('click', function () {
      confirmBox('Usunąć projekt ' + r.id + '?', 'Tego nie cofnę, ale dane można wczytać ponownie z pliku.', function () {
        var zostaja = [];
        for (var i = 0; i < state.projects.length; i++) {
          if (state.projects[i].id !== r.id) zostaja.push(state.projects[i]);
        }
        state.projects = zostaja;
        state.selected = null;
        recompute();
        toast('Projekt ' + r.id + ' usunięty.');
      });
    });
    act.appendChild(edit);
    act.appendChild(del);
    box.appendChild(act);
  }

  function link(url) {
    var a = document.createElement('a');
    a.href = url; a.textContent = url; a.rel = 'noopener noreferrer'; a.target = '_blank';
    return a;
  }

  /* ---------------------------------------------------------------- *
   * Statystyki
   * ---------------------------------------------------------------- */

  function renderStats() {
    var s = view.stats;
    var boxes = $('#stats-boxes');
    boxes.textContent = '';
    var liczby = [
      ['Widoczne projekty', s.total],
      ['Gotowe', s.statuses.gotowy],
      ['W trakcie', s.statuses['w trakcie']],
      ['Planowane', s.statuses.planowany],
      ['Różnych technologii', s.techList.length]
    ];
    for (var i = 0; i < liczby.length; i++) {
      var b = el('div', 'box');
      b.appendChild(el('b', null, liczby[i][1]));
      b.appendChild(el('span', null, liczby[i][0]));
      boxes.appendChild(b);
    }
    var bars = $('#tech-bars');
    bars.textContent = '';
    if (s.techList.length === 0) {
      bars.appendChild(el('p', 'empty', 'Brak danych do podsumowania (filtry: ' + describeFilters() + ').'));
      return;
    }
    var max = s.techList[0].count;
    for (var j = 0; j < s.techList.length; j++) {
      var t = s.techList[j];
      var row = el('div', 'bar-row');
      row.appendChild(el('span', null, t.label));
      var track = el('div');
      var bar = el('div', 'bar');
      bar.style.width = Math.round((t.count / max) * 100) + '%';
      track.appendChild(bar);
      row.appendChild(track);
      row.appendChild(el('span', 'num', t.count + ' z ' + s.total + ' (' + s.percent(t.count) + '%)'));
      bars.appendChild(row);
    }
  }

  /* ---------------------------------------------------------------- *
   * Kroki algorytmu
   * ---------------------------------------------------------------- */

  function sampleRecords() {
    return view.visible.slice(0, 6).length >= 2 ? view.visible.slice(0, 6) : state.projects.slice(0, 6);
  }

  function resetSteps() {
    state.gen = null;
    state.rows = [];
    var tb = $('#steps-table').querySelector('tbody');
    if (tb) tb.textContent = '';
    var c = $('#step-counter');
    if (c) c.textContent = 'Kroków: 0. Naciśnij „Krok”.';
  }

  function makeGen() {
    var data = sampleRecords();
    if (state.algo === 'sort') {
      return S.insertionSteps(data, state.order === 'tytuly' ? A.byTitle : A.byNewest);
    }
    return S.searchSteps(state.projects.slice(0, 8), state.filters);
  }

  function stepOnce() {
    if (!state.gen) state.gen = makeGen();
    var n = state.gen.next();
    if (n.done) { toast('To już ostatni krok.'); return; }
    addStepRow(n.value);
    if (n.value.done) state.gen = { next: function () { return { done: true }; } };
  }

  function addStepRow(v) {
    var tb = $('#steps-table').querySelector('tbody');
    var tr = document.createElement('tr');
    if (v.matched === true) tr.className = 'hit';
    if (v.matched === false) tr.className = 'miss';
    tr.appendChild(el('td', 'mono', String(tb.children.length + 1)));
    tr.appendChild(el('td', 'mono', v.before.join(' ') || '—'));
    tr.appendChild(el('td', null, v.decision));
    tr.appendChild(el('td', 'mono', v.after.join(' ') || '—'));
    tr.appendChild(el('td', 'mono', v.comparisons !== undefined ? 'porównania: ' + v.comparisons : 'sprawdzone: ' + v.checked));
    tb.appendChild(tr);
    $('#step-counter').textContent = 'Kroków: ' + tb.children.length + (v.done ? ' (koniec)' : '');
  }

  function allSteps() {
    resetSteps();
    var rows = S.collect(makeGen(), 400);
    for (var i = 0; i < rows.length; i++) {
      addStepRow(rows[i]);
    }
  }

  /* ---------------------------------------------------------------- *
   * Porównanie
   * ---------------------------------------------------------------- */

  function renderCompare() {
    var out = $('#compare-out');
    out.textContent = '';
    out.appendChild(el('p', 'hint', 'Liczę…'));
    setTimeout(function () {
      var res = C.runAll();
      out.textContent = '';
      out.appendChild(el('h3', null, 'Sortowanie przez wstawianie: porównania kluczy'));
      var wierszeSort = [];
      for (var i = 0; i < res.sortowanie.length; i++) {
        var w = res.sortowanie[i];
        wierszeSort.push([String(w.n), w.uklad, String(w.porownania), String(w.teoriaMin),
          String(w.teoriaMax), w.zgodneZWzorcem ? 'tak ✓' : 'nie ✗']);
      }
      var t1 = table(['n', 'układ danych', 'porównania', 'n − 1', 'n(n−1)/2', 'zgodne z wzorcem'], wierszeSort);
      out.appendChild(t1);
      out.appendChild(el('p', 'hint', 'Dane uporządkowane kosztują dokładnie n − 1 porównań, odwrócone dokładnie n(n−1)/2. Losowe wychodzą mniej więcej w połowie. Przy 1000 rekordów różnica to 999 porównań wobec 499 500, czyli pięćset razy więcej pracy.'));
      out.appendChild(el('h3', null, 'Wyszukiwanie: trafienie na początku, na końcu i brak wyniku'));
      var wierszeSzukania = [];
      for (var j = 0; j < res.wyszukiwanie.length; j++) {
        var s = res.wyszukiwanie[j];
        wierszeSzukania.push([s.przypadek, s.zapytanie, String(s.wszystkie_trafienia),
          String(s.sprawdzone_wszystkie), String(s.sprawdzone_pierwsze)]);
      }
      var t2 = table(['przypadek', 'zapytanie', 'trafienia', 'sprawdzone (wszystkie dopasowania)', 'sprawdzone (pierwsze dopasowanie)'], wierszeSzukania);
      out.appendChild(t2);
      out.appendChild(el('p', 'hint', 'W aplikacji szukam wszystkich dopasowań, więc pętla zawsze przechodzi całą listę i licznik wynosi n. Gdybym przerywał na pierwszym trafieniu, kolumna obok pokazuje 1 przy trafieniu na początku i n w pozostałych przypadkach.'));
    }, 30);
  }

  function table(head, rows) {
    var wrap = el('div', 'table-wrap');
    var t = document.createElement('table');
    var thead = document.createElement('thead');
    var htr = document.createElement('tr');
    for (var i = 0; i < head.length; i++) {
      htr.appendChild(el('th', null, head[i]));
    }
    thead.appendChild(htr);
    t.appendChild(thead);
    var tb = document.createElement('tbody');
    for (var j = 0; j < rows.length; j++) {
      var tr = document.createElement('tr');
      for (var k = 0; k < rows[j].length; k++) {
        tr.appendChild(el('td', 'mono', rows[j][k]));
      }
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    wrap.appendChild(t);
    return wrap;
  }

  /* ---------------------------------------------------------------- *
   * Formularz
   * ---------------------------------------------------------------- */

  var editingId = null;
  var FIELDS = ['id', 'title', 'description', 'year', 'status', 'technologies', 'role', 'repoUrl', 'demoUrl'];

  function openForm(record) {
    editingId = record ? record.id : null;
    $('#form-title').textContent = record ? 'Edycja projektu ' + record.id : 'Nowy projekt';
    for (var i = 0; i < FIELDS.length; i++) {
      var pole = FIELDS[i];
      var wartosc = record ? record[pole] : '';
      if (pole === 'technologies' && record) wartosc = A.uniqueTechs(record.technologies).join(', ');
      if (pole === 'status' && !record) wartosc = 'w trakcie'; // sensowna wartość domyślna
      if (wartosc === undefined || wartosc === null) wartosc = '';
      $('#in-' + pole).value = wartosc;
      clearError(pole);
    }
    $('#in-id').readOnly = !!record;
    $('#err-form').textContent = '';
    $('#form-dialog').showModal();
    setTimeout(function () { $(record ? '#in-title' : '#in-id').focus(); }, 10);
  }

  function clearError(f) {
    $('#err-' + f).textContent = '';
    $('#in-' + f).removeAttribute('aria-invalid');
  }

  function showError(e) {
    var f = e.field;
    if (f && $('#err-' + f)) {
      $('#err-' + f).textContent = e.message;
      $('#in-' + f).setAttribute('aria-invalid', 'true');
      $('#in-' + f).focus();
    } else {
      $('#err-form').textContent = e.message;
    }
  }

  function submitForm(ev) {
    ev.preventDefault();
    for (var i = 0; i < FIELDS.length; i++) {
      clearError(FIELDS[i]);
    }
    $('#err-form').textContent = '';
    var data = {};
    for (var j = 0; j < FIELDS.length; j++) {
      data[FIELDS[j]] = $('#in-' + FIELDS[j]).value;
    }
    try {
      // Najpierw buduję i sprawdzam nowy rekord w kopii listy. Dopiero kiedy
      // walidacja przejdzie, podmieniam dane. Odrzucona operacja nic nie zmienia.
      var record = A.validateProject(data, state.projects, editingId);
      var next = [];
      if (editingId) {
        for (var k = 0; k < state.projects.length; k++) {
          if (state.projects[k].id === editingId) next.push(record);
          else next.push(state.projects[k]);
        }
      } else {
        next = state.projects.slice();
        next.push(record);
      }
      state.projects = next;
      state.selected = record.id;
      $('#form-dialog').close();
      recompute();
      toast(editingId ? 'Zapisałem zmiany w projekcie ' + record.id + '.' : 'Dodałem projekt ' + record.id + '.');
    } catch (e) {
      if (e.name === 'ValidationError') showError(e);
      else { $('#err-form').textContent = 'Nieoczekiwany błąd: ' + e.message; }
    }
  }

  function confirmBox(title, text, onYes) {
    $('#confirm-title').textContent = title;
    $('#confirm-text').textContent = text;
    var dlg = $('#confirm-dialog');
    function yes() { cleanup(); dlg.close(); onYes(); }
    function no() { cleanup(); dlg.close(); }
    function cleanup() {
      $('#confirm-yes').removeEventListener('click', yes);
      $('#confirm-no').removeEventListener('click', no);
    }
    $('#confirm-yes').addEventListener('click', yes);
    $('#confirm-no').addEventListener('click', no);
    dlg.showModal();
  }

  /* ---------------------------------------------------------------- *
   * Dane: scenariusze, eksport, import, zapis lokalny
   * ---------------------------------------------------------------- */

  function loadScenario(name) {
    var set = SCEN[name];
    if (!set) { toast('Nie znalazłem scenariusza „' + name + '”.'); return; }
    try {
      var parsed = D.parseImport(JSON.stringify(set));
      state.projects = parsed.projects;
      state.selected = null;
      state.filters = { text: '', tech: '', year: '', status: '' };
      syncInputs();
      recompute();
      toast('Wczytałem zestaw: ' + name + ' (' + parsed.projects.length + ' projektów).');
    } catch (e) {
      toast('Nie udało się wczytać zestawu: ' + e.message);
    }
  }

  function doExport() {
    var json = D.exportJson(state.projects);
    var blob = new Blob([json], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'portfolio-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Zapisałem ' + state.projects.length + ' projektów do pliku JSON.');
  }

  function doImport(file) {
    var report = $('#import-report');
    report.textContent = '';
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = D.parseImport(String(reader.result));
      } catch (e) {
        var bad = el('div', 'report-bad');
        bad.appendChild(el('b', null, 'Plik odrzucony. Dane w aplikacji zostały bez zmian.'));
        bad.appendChild(el('p', null, e.message));
        report.appendChild(bad);
        return;
      }
      var ok = el('div', 'report-ok');
      ok.appendChild(el('b', null, 'Plik sprawdzony w całości.'));
      ok.appendChild(el('p', null, 'Projektów: ' + parsed.summary.count + ', lata: ' + parsed.summary.years + ', różnych technologii: ' + parsed.summary.techs + '. Autor: ' + (parsed.author || 'nie podano') + '.'));
      report.appendChild(ok);
      confirmBox('Zastąpić bieżące dane?', 'W aplikacji jest teraz ' + state.projects.length + ' projektów, plik zawiera ' + parsed.summary.count + '. Po potwierdzeniu bieżący zestaw zostanie zastąpiony.', function () {
        state.projects = parsed.projects;
        state.selected = null;
        recompute();
        toast('Zestaw zastąpiony: ' + parsed.projects.length + ' projektów.');
      });
    };
    reader.readAsText(file, 'utf-8');
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, D.exportJson(state.projects));
    } catch (e) { /* brak pamięci albo tryb prywatny: pomijam, bo to tylko dodatek */ }
  }

  function loadSaved() {
    try {
      var txt = localStorage.getItem(STORAGE_KEY);
      if (!txt) return false;
      state.projects = D.parseImport(txt).projects;
      return true;
    } catch (e) { return false; }
  }

  /* ---------------------------------------------------------------- *
   * Testy w przeglądarce
   * ---------------------------------------------------------------- */

  function runTests() {
    var out = window.PortfolioTests.runAll();
    $('#tests-summary').textContent = 'Wynik: ' + out.passed + '/' + out.total + ' testów przeszło, błędnych: ' + out.failed + '.';
    var tb = $('#tests-table').querySelector('tbody');
    tb.textContent = '';
    for (var i = 0; i < out.results.length; i++) {
      var r = out.results[i];
      var tr = document.createElement('tr');
      tr.appendChild(el('td', 'mono', r.id));
      tr.appendChild(el('td', null, r.name));
      tr.appendChild(el('td', null, r.input));
      tr.appendChild(el('td', null, r.expected));
      tr.appendChild(el('td', null, r.got));
      tr.appendChild(el('td', r.status === 'OK' ? 'tag-ok' : 'tag-bad', r.status));
      tb.appendChild(tr);
    }
  }

  /* ---------------------------------------------------------------- *
   * Zakładki, zdarzenia, start
   * ---------------------------------------------------------------- */

  function showTab(name) {
    var taby = $$('.tab');
    for (var i = 0; i < taby.length; i++) {
      taby[i].setAttribute('aria-selected', String(taby[i].dataset.tab === name));
    }
    var panele = $$('.panel');
    for (var j = 0; j < panele.length; j++) {
      panele[j].hidden = panele[j].id !== 'panel-' + name;
    }
    if (name === 'testy' && !$('#tests-table').querySelector('tbody').children.length) runTests();
    if (name === 'porownanie' && !$('#compare-out').children.length) renderCompare();
  }

  function syncInputs() {
    $('#q').value = state.filters.text;
    renderFilters();
  }

  // Zaznacza jeden przycisk w grupie (porządek listy albo wybór algorytmu).
  function setActive(selector, button) {
    var guziki = $$(selector);
    for (var i = 0; i < guziki.length; i++) {
      guziki[i].classList.toggle('is-on', guziki[i] === button);
    }
  }

  function bindTab(button) {
    button.addEventListener('click', function () { showTab(button.dataset.tab); });
  }

  function bindOrder(button) {
    button.addEventListener('click', function () {
      state.order = button.dataset.order;
      setActive('.order-btn', button);
      recompute();
    });
  }

  function bindAlgo(button) {
    button.addEventListener('click', function () {
      state.algo = button.dataset.algo;
      setActive('.algo-btn', button);
      resetSteps();
    });
  }

  function bindScenario(button) {
    button.addEventListener('click', function () { loadScenario(button.dataset.scenario); });
  }

  function bind() {
    var i;
    var taby = $$('.tab');
    for (i = 0; i < taby.length; i++) bindTab(taby[i]);
    $('#q').addEventListener('input', function () { state.filters.text = this.value; recompute(); });
    $('#f-tech').addEventListener('change', function () { state.filters.tech = this.value; recompute(); });
    $('#f-year').addEventListener('change', function () { state.filters.year = this.value; recompute(); });
    $('#f-status').addEventListener('change', function () { state.filters.status = this.value; recompute(); });
    $('#clear').addEventListener('click', function () {
      state.filters = { text: '', tech: '', year: '', status: '' };
      syncInputs();
      recompute();
      toast('Filtry wyczyszczone, widać całą listę.');
    });
    var porzadki = $$('.order-btn');
    for (i = 0; i < porzadki.length; i++) bindOrder(porzadki[i]);
    var algorytmy = $$('.algo-btn');
    for (i = 0; i < algorytmy.length; i++) bindAlgo(algorytmy[i]);
    $('#step').addEventListener('click', stepOnce);
    $('#all-steps').addEventListener('click', allSteps);
    $('#reset-steps').addEventListener('click', resetSteps);
    $('#run-compare').addEventListener('click', renderCompare);
    $('#run-tests').addEventListener('click', runTests);
    $('#new').addEventListener('click', function () { openForm(null); });
    $('#project-form').addEventListener('submit', submitForm);
    $('#form-cancel').addEventListener('click', function () { $('#form-dialog').close(); });
    var scenariusze = $$('.scenarios .btn');
    for (i = 0; i < scenariusze.length; i++) bindScenario(scenariusze[i]);
    $('#export').addEventListener('click', doExport);
    $('#import-file').addEventListener('change', function () {
      if (this.files && this.files[0]) doImport(this.files[0]);
      this.value = '';
    });
    $('#forget').addEventListener('click', function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nic */ }
      toast('Zapis lokalny wyczyszczony. Dane w oknie zostają do czasu odświeżenia.');
    });
  }

  // Parametry adresu ułatwiają robienie zrzutów: ?tab=algorytm&scenario=typowy&steps=5
  function applyUrl() {
    var q = new URLSearchParams(location.search);
    if (q.get('scenario')) loadScenario(q.get('scenario'));
    if (q.get('q')) { state.filters.text = q.get('q'); $('#q').value = q.get('q'); }
    if (q.get('tech')) state.filters.tech = q.get('tech');
    if (q.get('year')) state.filters.year = q.get('year');
    if (q.get('status')) state.filters.status = q.get('status');
    var i;
    if (q.get('order')) {
      state.order = q.get('order');
      var porzadki = $$('.order-btn');
      for (i = 0; i < porzadki.length; i++) {
        porzadki[i].classList.toggle('is-on', porzadki[i].dataset.order === state.order);
      }
    }
    if (q.get('algo')) {
      state.algo = q.get('algo');
      var algorytmy = $$('.algo-btn');
      for (i = 0; i < algorytmy.length; i++) {
        algorytmy[i].classList.toggle('is-on', algorytmy[i].dataset.algo === state.algo);
      }
    }
    if (q.get('select')) state.selected = q.get('select');
    recompute();
    if (q.get('steps')) {
      var n = parseInt(q.get('steps'), 10);
      resetSteps();
      for (var i = 0; i < n; i++) stepOnce();
    }
    if (q.get('tests')) runTests();
    if (q.get('tab')) showTab(q.get('tab'));
    if (q.get('form') === 'nowy') openForm(null);
    if (q.get('form') === 'blad') {
      // Do zrzutu: pokazuję formularz z błędnymi danymi i komunikatami przy polach.
      openForm(null);
      $('#in-id').value = 'PRJ-2026-05';
      $('#in-title').value = '';
      $('#in-description').value = 'Projekt bez tytułu i z błędnym rokiem.';
      $('#in-year').value = '1999';
      $('#in-technologies').value = 'Python';
      $('#in-role').value = 'autor';
      $('#in-repoUrl').value = 'github.com/brak-protokolu';
      $('#project-form').dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }

  function start() {
    bind();
    if (!loadSaved()) {
      state.projects = D.parseImport(JSON.stringify(SCEN.typowy)).projects;
    }
    syncInputs();
    recompute();
    showTab('projekty');
    applyUrl();
  }

  document.addEventListener('DOMContentLoaded', start);
})();
