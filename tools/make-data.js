/* Buduje pliki danych w katalogu data/.
 * Uruchomienie: node tools/make-data.js
 */
const fs = require('fs');
const path = require('path');
const A = require('../src/algorithms.js');
const D = require('../src/data-io.js');
const C = require('../src/compare.js');

const ROOT = path.join(__dirname, '..');

const typowy = [
  ['PRJ-2024-01', 'Kalkulator ocen', 'Liczy średnią ważoną z ocen semestralnych i pokazuje, ile brakuje do zaliczenia.', 2024, 'gotowy', ['Python', 'Tkinter'], 'autor całości', 'https://github.com/lukasradivilovic/kalkulator-ocen', ''],
  ['PRJ-2024-02', 'Lista zadań', 'Aplikacja do zapisywania zadań z terminami, z zapisem w pliku JSON.', 2024, 'gotowy', ['JavaScript', 'HTML', 'CSS'], 'autor, projekt interfejsu', 'https://github.com/lukasradivilovic/lista-zadan', 'https://example.org/lista-zadan'],
  ['PRJ-2025-01', 'Łódź na fali', 'Gra 2D w przeglądarce: sterowanie łodzią i omijanie przeszkód.', 2025, 'gotowy', ['JavaScript', 'Canvas'], 'autor, grafika', 'https://github.com/lukasradivilovic/lodz-na-fali', ''],
  ['PRJ-2025-02', 'Baza płyt', 'Katalog płyt z wyszukiwaniem po wykonawcy i roku wydania.', 2025, 'w trakcie', ['Java', 'SQL'], 'autor warstwy danych, praca w parze z kolegą z grupy', 'https://github.com/lukasradivilovic/baza-plyt', ''],
  ['PRJ-2025-03', 'Pogoda w Wilnie', 'Czyta zapisany plik z pomiarami i rysuje wykres temperatury z ostatniego tygodnia.', 2025, 'gotowy', ['Python', 'Matplotlib'], 'autor całości', 'https://github.com/lukasradivilovic/pogoda-wilno', ''],
  ['PRJ-2025-04', 'Śledzenie wydatków', 'Zapisuje wydatki i pokazuje, na co idzie najwięcej pieniędzy w miesiącu.', 2025, 'w trakcie', ['Python', 'SQLite'], 'autor, testy', 'https://github.com/lukasradivilovic/wydatki', ''],
  ['PRJ-2026-01', 'PrefiksLab', 'Mini-projekt M1: sumy prefiksowe i zapytania na zakresach, krok po kroku.', 2026, 'gotowy', ['JavaScript', 'HTML', 'CSS', 'Node.js'], 'autor całości, koncepcja wizualizacji', 'https://github.com/lukasradivilovic/ASD1-M1-13', ''],
  ['PRJ-2026-02', 'Portfolio projektów', 'Mini-projekt M2: wyszukiwanie, filtry i własne sortowanie przez wstawianie.', 2026, 'w trakcie', ['JavaScript', 'HTML', 'CSS', 'Node.js'], 'autor całości', 'https://github.com/lukasradivilovic/ASD1-M2-02', ''],
  ['PRJ-2026-03', 'Notatnik wykładowy', 'Notatki z wykładów z tagami i szybkim wyszukiwaniem fragmentu treści.', 2026, 'planowany', ['TypeScript', 'React'], 'autor', 'https://github.com/lukasradivilovic/notatnik', ''],
  ['PRJ-2026-04', 'Quiz z sieci', 'Pytania powtórkowe z technologii sieciowych, wynik liczony na końcu.', 2026, 'planowany', ['HTML', 'JavaScript'], 'autor pytań i kodu', 'https://github.com/lukasradivilovic/quiz-sieci', ''],
  ['PRJ-2023-01', 'Żółw rysuje', 'Pierwszy program z pierwszego semestru: rysowanie figur biblioteką turtle.', 2023, 'gotowy', ['Python'], 'autor', 'https://github.com/lukasradivilovic/zolw', ''],
  ['PRJ-2023-02', 'Strona o Wilnie', 'Statyczna strona z opisem miasta, zrobiona na zajęciach z podstaw HTML.', 2023, 'gotowy', ['HTML', 'CSS'], 'autor, zdjęcia własne', 'https://github.com/lukasradivilovic/strona-wilno', '']
];

const graniczny = [
  ['A-2000', 'Archiwum', 'Najstarszy dopuszczalny rok w portfolio, czyli 2000.', 2000, 'gotowy', ['Pascal'], 'autor', 'https://example.org/a2000', ''],
  ['Z-2100', 'Zamysł', 'Najpóźniejszy dopuszczalny rok, czyli 2100. Projekt wyłącznie na papierze.', 2100, 'planowany', ['brak'], 'pomysłodawca', 'https://example.org/z2100', ''],
  ['DUP-TECH', 'Powtórki', 'Rekord z powtórzoną technologią: Python, python i PYTHON to jedna pozycja.', 2026, 'w trakcie', ['Python', 'python', 'PYTHON', ' Python '], 'autor', 'https://example.org/dup', ''],
  ['TIE-1', 'Remis drugi', 'Ten sam rok co TIE-0, więc o kolejności decyduje identyfikator.', 2026, 'gotowy', ['SQL'], 'autor', 'https://example.org/tie1', ''],
  ['TIE-0', 'Remis pierwszy', 'Dodany po TIE-1, ale ma mniejsze ID, więc na liście najnowszych stoi wyżej.', 2026, 'gotowy', ['SQL'], 'autor', 'https://example.org/tie0', ''],
  ['PL-ZNAKI', 'Łódź, Żagiel i Śruba', 'Tytuł z polskimi znakami, żeby sprawdzić własny porządek alfabetyczny.', 2024, 'gotowy', ['C++'], 'autor', 'https://example.org/pl', ''],
  ['XSS-TEST', '<img src=x onerror=alert(1)>', 'Opis ze znacznikiem <b>pogrubienia</b>, który ma się pokazać jako zwykły tekst.', 2026, 'planowany', ['HTML'], 'autor', 'https://example.org/xss', '']
];

function toProjects(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    out.push(A.validateProject({
      id: r[0], title: r[1], description: r[2], year: r[3], status: r[4],
      technologies: r[5], role: r[6], repoUrl: r[7], demoUrl: r[8]
    }, out, null));
  }
  return out;
}

const wbudowane = {};

function save(key, name, projects) {
  const file = path.join(ROOT, 'data', name);
  fs.writeFileSync(file, D.exportJson(projects) + '\n', 'utf8');
  wbudowane[key] = D.exportSet(projects);
  console.log('zapisano', name, '— projektów:', projects.length);
}

const kontrolny = D.parseImport(fs.readFileSync(path.join(ROOT, 'data', 'przyklad-kontrolny.json'), 'utf8')).projects;
wbudowane.kontrolny = D.exportSet(kontrolny);
save('typowy', 'scenariusz-typowy.json', toProjects(typowy));
save('graniczny', 'scenariusz-graniczny.json', toProjects(graniczny));
save('duzy', 'scenariusz-duzy.json', A.validateProjectSet(C.generate(1000, 'losowy', 2026)));

/* Zestawy wbudowane w stronę: dzięki temu aplikacja otwarta z pliku
 * (protokół file://) wczytuje scenariusze bez żądań sieciowych. */
const js = '/* Plik generowany przez tools/make-data.js — nie edytuję go ręcznie. */\n' +
  'window.PortfolioScenarios = ' + JSON.stringify(wbudowane) + ';\n';
fs.writeFileSync(path.join(ROOT, 'data', 'wbudowane.js'), js, 'utf8');
console.log('zapisano data/wbudowane.js');
