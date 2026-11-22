/* ASD1-M2-02 — zapis i odczyt danych (JSON z wersją formatu).
 * Import sprawdza cały plik, zanim cokolwiek podmieni: najpierw buduję
 * nowy zestaw w kopii, a dopiero po walidacji oddaję go aplikacji.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./algorithms.js'));
  else root.PortfolioData = factory(root.PortfolioAlgorithms);
})(typeof self !== 'undefined' ? self : this, function (A) {
  'use strict';

  var FORMAT = 'asd1-m2-02-portfolio';
  var VERSION = 1;

  // Plik eksportu: nazwa formatu, wersja, autor i lista projektów.
  // Każdy rekord przepisuję pole po polu, żeby do pliku nie trafiło nic więcej.
  function exportSet(projects, author) {
    var list = projects || [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      out.push({
        id: p.id,
        title: p.title,
        description: p.description,
        year: p.year,
        status: p.status,
        technologies: p.technologies.slice(),
        role: p.role,
        repoUrl: p.repoUrl,
        demoUrl: p.demoUrl || ''
      });
    }
    return {
      format: FORMAT,
      version: VERSION,
      author: author || 'Lukaš Radivilovič',
      exportedAt: new Date().toISOString().slice(0, 10),
      projects: out
    };
  }

  function exportJson(projects, author) {
    return JSON.stringify(exportSet(projects, author), null, 2);
  }

  // Zwraca gotowy zestaw albo rzuca ValidationError. Nic nie zapisuje,
  // więc błędny plik nie kasuje bieżącej pracy.
  function parseImport(text) {
    var raw;
    try {
      raw = typeof text === 'string' ? JSON.parse(text) : text;
    } catch (e) {
      throw A.ValidationError('Plik nie jest poprawnym JSON-em: ' + e.message, 'file');
    }
    if (!raw || typeof raw !== 'object') throw A.ValidationError('Plik musi zawierać obiekt JSON.', 'file');
    if (raw.format !== FORMAT) throw A.ValidationError('Nieznany format pliku: „' + raw.format + '”. Oczekiwałem „' + FORMAT + '”.', 'format');
    if (Number(raw.version) !== VERSION) throw A.ValidationError('Nieobsługiwana wersja formatu: ' + raw.version + '. Ta aplikacja czyta wersję ' + VERSION + '.', 'version');
    var projects = A.validateProjectSet(raw.projects);

    // Zakres lat liczę zwykłą pętlą, żeby podsumowanie importu było czytelne.
    var years = 'brak';
    if (projects.length > 0) {
      var min = projects[0].year;
      var max = projects[0].year;
      for (var i = 1; i < projects.length; i++) {
        if (projects[i].year < min) min = projects[i].year;
        if (projects[i].year > max) max = projects[i].year;
      }
      years = min + '–' + max;
    }

    return {
      format: raw.format,
      version: Number(raw.version),
      author: raw.author || '',
      projects: projects,
      summary: {
        count: projects.length,
        years: years,
        techs: A.summarize(projects).techList.length
      }
    };
  }

  return { FORMAT: FORMAT, VERSION: VERSION, exportSet: exportSet, exportJson: exportJson, parseImport: parseImport };
});
