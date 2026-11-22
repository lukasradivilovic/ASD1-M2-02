# ASD1-M2-02 — Portfolio projektów studenckich

Mini-projekt M2 z przedmiotu Algorytmy i struktury danych I.

- Autor: Lukaš Radivilovič, nr albumu 93795, kierunek Informatyka
- Filia Uniwersytetu w Białymstoku w Wilnie, rok akademicki 2026/2027
- Kod tematu: ASD1-M2-02, praca indywidualna

## Po co to jest

Aplikacja jest osobistą wizytówką prac jednego studenta. Odbiorca ma szybko znaleźć projekt
dotyczący wybranej technologii, przeczytać, co autor w nim zrobił, i otworzyć materiały.
Listę można przeszukiwać po fragmencie tytułu albo opisu, zawężać filtrami i układać
w dwóch porządkach. Wszystkie wyliczenia (statusy, częstość technologii, liczniki pracy
algorytmu) dotyczą listy widocznej po filtrach.

## Uruchomienie aplikacji

Nie trzeba niczego instalować. Wystarczy otworzyć plik `index.html` w przeglądarce
(dwuklik w File Explorer albo przeciągnięcie pliku do okna przeglądarki). Fonty i logo leżą
w katalogu `assets/`, więc aplikacja działa bez internetu.

## Uruchomienie testów

Potrzebny jest Node.js. W katalogu projektu:

```
node tests/run-tests.js
```

Polecenie wypisuje dla każdego przypadku wejście, wynik oczekiwany, wynik rzeczywisty i status,
a na końcu zapisuje `tests/wyniki-testow.json`. Ten sam plik testów uruchamia zakładka „Testy”
w aplikacji, więc w przeglądarce i w Node sprawdzam dokładnie ten sam kod.

Pozostałe polecenia pomocnicze:

```
node tools/make-data.js        # generuje pliki scenariuszy w data/
node tools/export-results.js   # zapisuje docs/wyniki-porownania.json
python tools/make_slides.py    # składa prezentację PPTX
./tools/shoot.sh nazwa "tab=algorytm&steps=8"   # zrzut ekranu (Edge headless)
```

## Zakładki aplikacji

| Zakładka | Co w niej jest |
|---|---|
| Projekty | wyszukiwanie, filtry z licznikami trafień, karty projektów, pełny opis, formularz dodawania i edycji |
| Statystyki | liczba projektów w każdym statusie i częstość technologii na widocznej liście |
| Algorytm | tabela „przed → decyzja → po” dla sortowania i dla wyszukiwania, liczniki, koszt operacji |
| Porównanie | porównania kluczy dla n = 10, 100, 1000 i trzy przypadki wyszukiwania |
| Dane | cztery zestawy danych, eksport i import JSON, zapis lokalny |
| Testy | ten sam zestaw testów co w Node |

## Model danych

Rekord „Projekt”: `id`, `title`, `description`, `year`, `status`, `technologies`, `role`,
`repoUrl`, `demoUrl`. Identyfikator jest niepusty, unikalny i niezmienny po utworzeniu
(dozwolone znaki: A–Z, cyfry i łącznik). Rok mieści się w przedziale 2000–2100. Status to
jedna z wartości `planowany`, `w trakcie`, `gotowy`. Technologie powtórzone w obrębie jednego
projektu, po usunięciu skrajnych spacji i zignorowaniu wielkości liter, liczą się raz.
Portfolio mieści do 1000 rekordów.

## Format pliku JSON

```json
{
  "format": "asd1-m2-02-portfolio",
  "version": 1,
  "author": "Lukaš Radivilovič",
  "exportedAt": "2026-11-22",
  "projects": [ { "id": "A", "title": "Atlas", "...": "..." } ]
}
```

Import najpierw sprawdza cały plik: nazwę formatu, wersję i każdy rekord osobno. Dopiero po
potwierdzeniu podmienia zestaw, więc wadliwy plik nie kasuje bieżącej pracy. Zapis w pamięci
przeglądarki jest dodatkiem i nie zastępuje eksportu.

## Przykład kontrolny

A „Atlas”, 2026, gotowy, [Python, python, HTML]; B „Budżet”, 2025, w trakcie, [Python];
C „Gra”, 2026, gotowy, [JavaScript]. Po filtrze technologii Python zostają A i B, statystyki
pokazują 1 gotowy i 1 w trakcie, Python występuje w 2 projektach, HTML w 1. Dołożenie filtra
rok 2026 zostawia samo A. Zestaw wczytuje przycisk „Wczytaj przykład kontrolny” w zakładce
Dane albo plik `data/przyklad-kontrolny.json`.

## Algorytmy

Wyszukiwanie liniowe szuka wszystkich dopasowań, więc pętla zawsze przechodzi całą listę
i licznik sprawdzonych rekordów wynosi n. Filtry łączę przez AND w jednej pętli. Sortowanie
robi własna funkcja sortowania przez wstawianie (insertion sort): zwraca nową tablicę, jest
stabilna i liczy porównania kluczy. Wbudowanego `Array.prototype.sort` nie używam w głównej
ścieżce programu, tylko w testach i w porównaniu jako niezależnego wzorca. Porządek tytułów
opiera się na własnej tabeli znaków polskiego alfabetu, a nie na `localeCompare`, którego wynik
zależy od przeglądarki.

| Operacja | Najlepszy | Najgorszy | Pamięć |
|---|---|---|---|
| wyszukiwanie i filtr (wszystkie dopasowania) | n sprawdzeń | n sprawdzeń | O(k) wynik |
| sortowanie przez wstawianie | n − 1 porównań | n(n − 1)/2 porównań | O(n) kopia |
| zliczanie technologii | suma długości list technologii | | O(t) |

## Katalogi

```
index.html              aplikacja
src/                    algorithms.js, steps.js, data-io.js, compare.js, app.js, style.css
data/                   przykład kontrolny i trzy scenariusze + wbudowane.js
tests/                  test-cases.js, run-tests.js, wyniki-testow.json
tools/                  generator danych, eksport wyników, generator slajdów, zrzuty
assets/                 fonty (OFL) i logo uczelni
docs/                   zrzuty, wyniki porównania, źródło dokumentacji
```

## Źródła

- Karta tematu ASD1-M2-02 z Dziennika UwB.
- Materiały z wykładów i ćwiczeń z Algorytmów i struktur danych I (wyszukiwanie liniowe,
  sortowania proste, koszt operacji).
- Thomas H. Cormen i in., *Wprowadzenie do algorytmów*, rozdział o sortowaniu przez wstawianie.
- Dokumentacja MDN (`Array`, `FileReader`, `dialog`, generatory `function*`).
- Fonty: Space Grotesk i IBM Plex (licencja SIL OFL, pliki licencji w `assets/fonts/`).

## O pomocy AI

Jako narzędzia pomocniczego używałem asystenta AI Claude (Anthropic): przy pisaniu i poprawianiu
fragmentów kodu, redakcji tekstów oraz składaniu slajdów. Koncepcja interfejsu i przepływu
użytkownika, reguły normalizacji technologii i tytułów, dobór przypadków testowych, ręczna
weryfikacja przykładu kontrolnego oraz przygotowanie obrony to moja praca. Każdą liczbę
w dokumentacji i na slajdach biorę z faktycznego uruchomienia testów i porównania.
