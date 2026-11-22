/* Uruchomienie testów: node tests/run-tests.js
 * Wypisuje wejście, wynik oczekiwany, wynik rzeczywisty i status,
 * a na końcu zapisuje tests/wyniki-testow.json.
 */
const fs = require('fs');
const path = require('path');
const T = require('./test-cases.js');

const out = T.runAll();
let group = '';
for (let i = 0; i < out.results.length; i++) {
  const r = out.results[i];
  if (r.group !== group) {
    group = r.group;
    console.log('\n== ' + group + ' ==');
  }
  console.log(r.id + ' ' + (r.status === 'OK' ? '[OK]  ' : '[BŁĄD]') + ' ' + r.name);
  console.log('      wejście:    ' + r.input);
  console.log('      oczekiwane: ' + r.expected);
  console.log('      otrzymane:  ' + r.got);
}
console.log(`\nRazem: ${out.passed}/${out.total} testów przeszło, błędnych: ${out.failed}`);

const file = path.join(__dirname, 'wyniki-testow.json');
fs.writeFileSync(file, JSON.stringify({ data: new Date().toISOString().slice(0, 10), total: out.total, passed: out.passed, failed: out.failed, results: out.results }, null, 2) + '\n', 'utf8');
console.log('Wyniki zapisane w', path.relative(process.cwd(), file));
process.exit(out.failed === 0 ? 0 : 1);
