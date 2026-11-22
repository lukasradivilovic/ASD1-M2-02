/* Zapisuje wyniki porównania do docs/wyniki-porownania.json.
 * Uruchomienie: node tools/export-results.js
 */
const fs = require('fs');
const path = require('path');
const C = require('../src/compare.js');

const res = C.runAll();
const file = path.join(__dirname, '..', 'docs', 'wyniki-porownania.json');
fs.writeFileSync(file, JSON.stringify(res, null, 2) + '\n', 'utf8');
console.log('zapisano', path.relative(process.cwd(), file));
for (let i = 0; i < res.sortowanie.length; i++) {
  const r = res.sortowanie[i];
  console.log('n=' + r.n + ' ' + r.uklad + ': ' + r.porownania + ' porównań (min ' + r.teoriaMin +
    ', max ' + r.teoriaMax + '), wzorzec: ' + (r.zgodneZWzorcem ? 'zgodny' : 'RÓŻNY'));
}
for (let j = 0; j < res.wyszukiwanie.length; j++) {
  const s = res.wyszukiwanie[j];
  console.log(s.przypadek + ': sprawdzone ' + s.sprawdzone_wszystkie +
    ' (wariant pierwszego dopasowania: ' + s.sprawdzone_pierwsze + ')');
}
