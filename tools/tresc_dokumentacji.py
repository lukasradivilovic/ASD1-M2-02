# -*- coding: utf-8 -*-
"""Treść dokumentacji ASD1-M2-02. Liczby pochodzą z uruchomienia
node tests/run-tests.js oraz node tools/export-results.js.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'docs', 'img')
SHOTFILES = {
    'filtr': ('doc_filtr.png', 14.0),
    'formularz': ('doc_formularz.png', 9.0),
    'kroki': ('doc_kroki.png', 14.0),
    'porownanie': ('doc_porownanie.png', 14.0),
    'testy': ('doc_testy.png', 14.0),
}

TYTUL = {
    'naglowek': 'MINI-PROJEKT M2 — ASD1-M2-02',
    'temat': 'Portfolio projektów studenckich',
    'przedmiot': 'Algorytmy i struktury danych I, rok akademicki 2026/2027',
    'github': 'GitHub: https://github.com/lukasradivilovic/ASD1-M2-02',
}

WSTEP = [
    'Tematem mojego mini-projektu M2 jest portfolio projektów studenckich. Zbudowałem aplikację, '
    'w której trzymam opisy własnych prac i w której można je przeszukiwać, zawężać filtrami, '
    'układać w dwóch porządkach i oglądać w postaci kart oraz pełnego opisu.',

    'Punktem wyjścia była karta tematu ASD1-M2-02. Zakres obowiązkowy obejmuje formularz dodawania '
    'i edycji projektu, wyszukiwanie fragmentu tytułu lub opisu, jednoczesne filtry technologii, roku '
    'i statusu, dwa porządki listy oraz podsumowanie liczby projektów i częstości technologii. '
    'Sedno zadania jest algorytmiczne: wyszukiwanie liniowe, własne sortowanie przez wstawianie '
    'i zliczanie technologii pętlą.',

    'Dokumentacja opisuje, co zbudowałem, jakimi regułami kieruje się program i ile pracy wykonują '
    'moje algorytmy. Wszystkie liczby pochodzą z uruchomienia programu na moim komputerze: testy '
    'z polecenia node tests/run-tests.js, a wyniki porównania z pliku docs/wyniki-porownania.json.',
]

ROZDZIALY = [
    {
        'tytul': 'CEL, ODBIORCA I ZAKRES PROJEKTU',
        'sekcje': [
            {
                'tytul': 'Problem i odbiorca',
                'tresc': [
                    'Odbiorcą aplikacji jest osoba, która szuka konkretnej pracy studenta: koleżanka '
                    'z roku szukająca kogoś do wspólnego projektu, prowadzący sprawdzający dorobek albo '
                    'firma oferująca praktyki. Taka osoba ma minutę, nie pół godziny. Chce zobaczyć, '
                    'czy ktoś pisał coś w wybranej technologii, czy projekt jest skończony i co autor '
                    'w nim zrobił.',

                    'Bez narzędzia trzeba przejrzeć kilkanaście repozytoriów i wyłowić z nich te właściwe. '
                    'Moja aplikacja skraca to do trzech ruchów: wpisania fragmentu słowa, zawężenia filtrami '
                    'i otwarcia karty z pełnym opisem oraz adresem repozytorium. Jedno portfolio należy do '
                    'jednego autora, a współautorów opisuję tekstem w polu roli.',
                ],
            },
            {
                'tytul': 'Zrealizowany zakres obowiązkowy',
                'tresc': [
                    'Aplikacja ma formularz dodawania i edycji projektu z kontrolą pól obowiązkowych '
                    'i widocznym powodem odrzucenia przy polu. Lista pokazuje karty projektów, a wybrana '
                    'karta otwiera pełny opis z rolą autora oraz odnośnikami do repozytorium i demonstracji. '
                    'Wyszukiwanie działa na fragmencie tytułu lub opisu, a trzy filtry (technologia, rok, '
                    'status) łączą się przez AND i mają przy wartościach liczniki trafień. Przycisk '
                    '„Wyczyść filtry” przywraca całą listę.',

                    'Listę układam w dwóch porządkach. „Najnowsze” to rok malejąco, a przy remisie roku '
                    'identyfikator rosnąco. „Tytuły” to porządek według własnej tabeli znaków polskiego '
                    'alfabetu, również z identyfikatorem jako rozstrzygnięciem remisu. Oba porządki liczy '
                    'moja funkcja sortowania przez wstawianie.',

                    'Osobne zakładki pokazują statystyki widocznej listy, tabelę kroków algorytmu z licznikami, '
                    'eksperyment porównawczy, zarządzanie danymi oraz wyniki testów. Poza zakresem '
                    'obowiązkowym zostawiłem konta użytkowników, płatne API i wdrożenie w internecie.',
                ],
            },
        ],
    },
    {
        'tytul': 'REGUŁY DZIAŁANIA I MODEL DANYCH',
        'sekcje': [
            {
                'tytul': 'Rekord „Projekt”',
                'tresc': [
                    'Rekord ma dziewięć pól: id, title, description, year, status, technologies, role, '
                    'repoUrl i demoUrl. Identyfikator jest niepusty, unikalny i niezmienny po utworzeniu, '
                    'więc w formularzu edycji pole jest zablokowane, a próba podmiany identyfikatora kończy '
                    'się odrzuceniem. Dopuszczam w nim wielkie litery A–Z, cyfry i łącznik, na przykład A '
                    'albo PRJ-2026-01. Rok jest liczbą całkowitą z przedziału od 2000 do 2100, a status '
                    'przyjmuje jedną z trzech wartości: planowany, w trakcie, gotowy. Portfolio mieści '
                    'do 1000 rekordów.',

                    'Przykładowe rekordy z mojego zestawu: A „Atlas”, 2026, gotowy, technologie Python, '
                    'python i HTML, rola „autor całości”; B „Budżet”, 2025, w trakcie, technologia Python; '
                    'C „Gra”, 2026, gotowy, technologia JavaScript. Ten zestaw jest jednocześnie przykładem '
                    'kontrolnym z karty tematu i leży w pliku data/przyklad-kontrolny.json.',
                ],
            },
            {
                'tytul': 'Normalizacja, walidacja i przeliczanie widoku',
                'tresc': [
                    'Technologie w obrębie jednego projektu porównuję po kluczu znormalizowanym: usuwam '
                    'skrajne spacje i sprowadzam nazwę do małych liter. Dzięki temu lista Python, python, '
                    'HTML daje dwie technologie, a do wyświetlania zostaje pierwsza napotkana pisownia. '
                    'Filtr technologii wymaga dokładnej zgodności takiego klucza, natomiast wyszukiwanie '
                    'sprawdza, czy wpisany fragment występuje w tytule albo w opisie. To jest właśnie '
                    'różnica, o którą pyta karta: fragment łapie każde wystąpienie ciągu znaków, a filtr '
                    'wymaga pełnej nazwy.',

                    'Tytuły do sortowania normalizuję jawnie: usuwam skrajne spacje, zwijam wielokrotne '
                    'spacje i zamieniam litery na małe. Porównanie idzie znak po znaku według stałej tabeli '
                    'a ą b c ć d e ę f g h i j k l ł m n ń o ó p q r s ś t u v w x y z ź ż, potem cyfr, '
                    'a na końcu pozostałych znaków według kodu. Nie korzystam z metody localeCompare, '
                    'bo jej wynik zależy od przeglądarki.',

                    'Walidacja idzie przed zmianą stanu. Funkcja sprawdzająca buduje nowy rekord w kopii '
                    'i zwraca go dopiero wtedy, gdy wszystkie pola są poprawne, a przy błędzie zgłasza '
                    'wyjątek ValidationError z komunikatem po polsku i nazwą pola. Operacja odrzucona nie '
                    'zostawia więc częściowego zapisu. Po każdej udanej zmianie przeliczam cały widok od '
                    'nowa: filtry, porządek i statystyki, żeby nigdy nie pokazać starego wyniku jako nowego.',

                    'Teksty wpisane przez użytkownika trafiają na ekran przez textContent, a nie przez '
                    'innerHTML. Tytuł w rodzaju <img src=x onerror=alert(1)> wyświetla się jako zwykły '
                    'tekst i nic nie wykonuje, co sprawdza jeden z testów.',
                ],
            },
        ],
    },
    {
        'tytul': 'WŁASNE ALGORYTMY I KOSZT OPERACJI',
        'sekcje': [
            {
                'tytul': 'Wyszukiwanie liniowe i filtry',
                'tresc': [
                    'Wyszukiwanie jest przeszukiwaniem liniowym i szuka wszystkich dopasowań, a nie tylko '
                    'pierwszego. Pętla zawsze przechodzi całą listę, więc licznik sprawdzonych rekordów '
                    'wynosi n niezależnie od tego, gdzie leży trafienie. Filtry wykonuję w tej samej jednej '
                    'pętli, łącząc warunki przez AND.',

                    'Pseudokod: dla każdego rekordu zwiększ licznik sprawdzonych, sprawdź kolejno warunek '
                    'tekstu, technologii, roku i statusu, a jeżeli wszystkie są spełnione, dopisz rekord '
                    'do wyniku. Koszt to n sprawdzeń, pamięć O(k) przy k dopasowaniach.',
                ],
            },
            {
                'tytul': 'Sortowanie przez wstawianie',
                'tresc': [
                    'Porządek listy ustala moja funkcja sortowania przez wstawianie (insertion sort). '
                    'Pseudokod: skopiuj tablicę wejściową; dla i od 1 do n − 1 weź klucz a[i] i ustaw j na '
                    'i − 1; dopóki j ≥ 0 i element a[j] jest ostro większy od klucza, przesuń a[j] o jedno '
                    'miejsce w prawo i zmniejsz j; na koniec wstaw klucz na pozycję j + 1. Każde porównanie '
                    'kluczy zwiększa licznik porównań.',

                    'Funkcja zwraca nową tablicę, więc dane wejściowe zostają nietknięte. Warunek '
                    'przesunięcia jest ostry, dlatego elementy o równych kluczach nie zamieniają się '
                    'miejscami i porządek jest stabilny. W głównej ścieżce programu nie używam wbudowanej '
                    'metody Array.prototype.sort; pojawia się ona wyłącznie w testach i w porównaniu, jako '
                    'niezależny wzorzec do sprawdzenia mojego wyniku.',

                    'Komparator „najnowsze” zwraca różnicę lat w odwrotnej kolejności, a przy remisie '
                    'porównuje identyfikatory rosnąco. Komparator „tytuły” porównuje znormalizowane tytuły '
                    'według tabeli znaków, a przy remisie również identyfikatory. Zliczanie technologii '
                    'to zwykła pętla po widocznych rekordach, w której każda technologia liczy się raz '
                    'na projekt.',
                ],
            },
            {
                'tytul': 'Koszt najważniejszych operacji',
                'tresc': [
                    'Wyszukiwanie i filtrowanie kosztuje n sprawdzeń w każdym przypadku, bo zbieram '
                    'wszystkie dopasowania, a pamięć rośnie z liczbą wyników. Sortowanie przez wstawianie '
                    'przy danych już uporządkowanych wykonuje n − 1 porównań, a przy danych odwróconych '
                    'n(n − 1)/2, czyli koszt kwadratowy; pamięć to kopia tablicy, czyli O(n). Zliczanie '
                    'technologii kosztuje tyle, ile wynosi suma długości list technologii, a pamięć zależy '
                    'od liczby różnych technologii.',

                    'Statystyki opisują listę widoczną po filtrach, więc po zawężeniu zmieniają się razem '
                    'z nią. Pusta lista zwraca same zera i nie powoduje dzielenia przez zero.',
                ],
            },
        ],
    },
    {
        'tytul': 'PROGRAM: TECHNOLOGIE, ARCHITEKTURA I OBSŁUGA',
        'sekcje': [
            {
                'tytul': 'Technologie, uruchomienie i moduły',
                'tresc': [
                    'Aplikację napisałem w HTML, CSS i JavaScripcie, bez bibliotek zewnętrznych. '
                    'Uruchomienie polega na otwarciu pliku index.html w przeglądarce; fonty (licencja '
                    'SIL OFL) i logo uczelni leżą w katalogu assets, więc program działa bez internetu. '
                    'Testy uruchamiam jednym poleceniem node tests/run-tests.js i potrzebuję do tego '
                    'tylko środowiska Node.js.',

                    'Kod podzieliłem na moduły. Plik algorithms.js zawiera normalizację, wyszukiwanie, '
                    'filtry, sortowanie przez wstawianie, statystyki i walidację. Plik steps.js to '
                    'generatory kroków, data-io.js odpowiada za eksport i import, compare.js za '
                    'powtarzalne dane i eksperyment, a app.js i index.html za interfejs. Moduły zapisałem '
                    'w formacie UMD, dzięki czemu przeglądarka i Node ładują te same pliki, a testy '
                    'sprawdzają dokładnie ten kod, który widać w aplikacji.',

                    'Dane zapisuję do pliku JSON z nazwą formatu „asd1-m2-02-portfolio” i numerem wersji 1. '
                    'Import czyta cały plik, sprawdza format, wersję i każdy rekord osobno, pokazuje '
                    'podsumowanie i dopiero po potwierdzeniu zastępuje zestaw, więc wadliwy plik nie kasuje '
                    'bieżącej pracy. Kopia w pamięci przeglądarki jest tylko dodatkiem.',
                ],
            },
            {
                'tytul': 'Obsługa i przykład kontrolny',
                'tresc': [
                    'Przykład kontrolny wczytuję przyciskiem w zakładce „Dane”. Po wybraniu filtra '
                    'technologii Python na liście zostają A i B, statystyki pokazują jeden projekt gotowy '
                    'i jeden w trakcie, Python występuje w dwóch projektach, a HTML w jednym. Dołożenie '
                    'filtra rok 2026 zostawia samo A. Zgadza się to z wynikiem podanym w karcie tematu, '
                    'który policzyłem ręcznie przed napisaniem testów.',

                    ('Przykład kontrolny z filtrem technologii Python: wynik A i B oraz licznik trzech '
                     'sprawdzonych rekordów', 'filtr'),

                    'Wynik pośredni, który potrafię wytłumaczyć krok po kroku, wygląda tak: po sprawdzeniu '
                    'rekordów A i B licznik sprawdzonych wynosi 2, a wynik tymczasowy to lista A i B. '
                    'Rekord C zostaje odrzucony, bo wśród jego technologii nie ma Pythona, więc po całej '
                    'pętli licznik pokazuje 3 sprawdzone rekordy, a wynik nadal A i B.',

                    'Dane błędne są odrzucane z widocznym powodem przy polu. Na rysunku poniżej próbuję '
                    'zapisać projekt bez tytułu i z rokiem 1999. Program pokazuje komunikat przy polu '
                    'tytułu, ustawia na nim kursor i nie zmienia listy projektów.',

                    ('Odrzucenie błędnych danych w formularzu: powód widoczny przy polu tytułu', 'formularz'),

                    'Zakładka „Algorytm” pokazuje tabelę „przed → decyzja → po”. Wiersze powstają '
                    'z generatora, który wykonuje ten sam algorytm co aplikacja i po każdym kroku oddaje '
                    'stan listy, decyzję i wartość licznika, a przycisk „Krok” odpowiada jednemu '
                    'wywołaniu generatora.',

                    ('Tabela kroków sortowania przez wstawianie z licznikiem porównań', 'kroki'),
                ],
            },
        ],
    },
    {
        'tytul': 'WYNIKI: PORÓWNANIE I TESTY',
        'sekcje': [
            {
                'tytul': 'Porównanie i liczniki operacji',
                'tresc': [
                    'Eksperyment liczy porównania kluczy mojego sortowania dla n równego 10, 100 i 1000 '
                    'oraz dla trzech układów danych: uporządkowanego, odwróconego i losowego. Dane generuję '
                    'powtarzalnie generatorem liniowym ze stałym ziarnem 2026, więc każde uruchomienie daje '
                    'te same liczby. Wynik każdego sortowania porównuję z wynikiem wbudowanej metody '
                    'Array.prototype.sort, używanej tu wyłącznie jako wzorzec. We wszystkich dziewięciu '
                    'przypadkach kolejność była zgodna.',

                    ('Wyniki porównania: porównania kluczy i liczba sprawdzeń przy wyszukiwaniu', 'porownanie'),

                    'Dla danych uporządkowanych liczby wyszły dokładnie takie, jak przewiduje wzór n − 1: '
                    '9, 99 i 999 porównań. Dla danych odwróconych zgadzają się ze wzorem n(n − 1)/2: '
                    '45, 4950 i 499 500 porównań. Dane losowe leżą mniej więcej w połowie: 36, 2469 '
                    'i 246 322 porównania. Przy tysiącu rekordów różnica między najlepszym a najgorszym '
                    'układem to 999 wobec 499 500, czyli pięćsetkrotnie więcej pracy.',

                    'Wniosek czytam uczciwie. Sortowanie przez wstawianie jest dobrym wyborem przy małych '
                    'zbiorach i przy liście, która jest już prawie uporządkowana, bo wtedy koszt rośnie '
                    'liniowo. Przy tysiącu odwróconych rekordów kosztuje pół miliona porównań i widać, '
                    'dlaczego do dużych zbiorów stosuje się algorytmy o koszcie n log n.',

                    'Wyszukiwanie sprawdziłem w trzech przypadkach na stu rekordach: trafienie na początku '
                    'listy, trafienie na końcu i brak wyniku. W każdym z nich licznik pokazał 100 '
                    'sprawdzonych rekordów, bo zbieram wszystkie dopasowania. Dla kontrastu policzyłem '
                    'wariant przerywający na pierwszym trafieniu: tam wyszło 1, 100 i 100 sprawdzeń. '
                    'Licznik odpowiada więc faktycznej pętli, a nie przyjętemu z góry wzorowi.',
                ],
            },
            {
                'tytul': 'Testy',
                'tresc': [
                    'Napisałem 22 automatyczne przypadki testowe. Każdy ma identyfikator, wejście, wynik '
                    'oczekiwany, asercję i status. Uruchamiam je jednym poleceniem node tests/run-tests.js, '
                    'a te same przypadki wykonuje zakładka „Testy” w aplikacji, bo obydwa środowiska ładują '
                    'ten sam plik. Wyniki zapisuję do pliku tests/wyniki-testow.json. Wartości oczekiwane '
                    'biorę z karty tematu albo z obliczeń zrobionych ręcznie, nigdy z wyniku programu.',

                    ('Wyniki testów w aplikacji: 22 z 22 przypadków zakończonych powodzeniem', 'testy'),

                    'Testy pokrywają przykład kontrolny ze statystykami, powtórzoną technologię w jednym '
                    'projekcie, łączne działanie dwóch filtrów i powrót do pełnej listy, odrzucenie projektu '
                    'bez tytułu bez zmiany stanu, remis roku rozstrzygany identyfikatorem, pustą listę bez '
                    'dzielenia przez zero, eksport i ponowny import oraz cztery wadliwe pliki, a także '
                    'zgodność mojego sortowania z wzorcem. Dodałem też niezmienność identyfikatora w edycji, '
                    'wpisany HTML jako tekst, polskie znaki w tytułach, liczniki wyszukiwania i dwa stany '
                    'pośrednie z generatora kroków.',

                    'Dwie rzeczy poprawiłem już w trakcie pracy. Pierwsza wyszła przy przeglądaniu zrzutów: '
                    'formularz nowego projektu otwierał się z pustym polem statusu, bo żadna z trzech '
                    'wartości nie była wybrana. Ustawiłem wartość domyślną „w trakcie”. Druga dotyczy '
                    'wczytywania zestawów danych. Gdyby aplikacja pobierała pliki z katalogu data '
                    'zapytaniem sieciowym, po otwarciu strony wprost z dysku przeglądarka zablokowałaby '
                    'odczyt, więc gotowe zestawy wbudowałem w plik data/wbudowane.js generowany skryptem, '
                    'a pliki JSON zostawiłem do importu ręcznego.',
                ],
            },
        ],
    },
]

ZAKONCZENIE = [
    'Zbudowałem działające portfolio projektów studenckich z pełnym zakresem obowiązkowym z karty: '
    'formularzem z walidacją, kartami i pełnym opisem, wyszukiwaniem fragmentu, trzema filtrami '
    'łączonymi przez AND, dwoma porządkami z własnego sortowania przez wstawianie oraz eksportem '
    'i importem JSON z wersją formatu.',

    'Najważniejszy wniosek algorytmiczny jest taki, że koszt sortowania przez wstawianie zależy nie '
    'od samej liczby rekordów, ale od tego, jak bardzo dane są już uporządkowane. Przy tysiącu '
    'rekordów różnica między listą uporządkowaną a odwróconą to 999 wobec 499 500 porównań. '
    'W wyszukiwaniu decyduje co innego: skoro zbieram wszystkie dopasowania, pętla zawsze przechodzi '
    'całą listę i żadne trafienie jej nie skraca.',

    'Ograniczenia widzę wyraźnie. Liczę operacje algorytmu, a nie czas w milisekundach. Po każdej '
    'zmianie sortuję całą widoczną listę od nowa. Tabela znaków opisuje polski alfabet, więc tytuły '
    'w innych językach trafiają na koniec porządku, a dane zostają u użytkownika, bo nie ma serwera.',

    'Naturalne rozszerzenia to wersja portfolio do wydruku, wyszukiwanie z pominięciem znaków '
    'diakrytycznych i wstawianie nowego rekordu w już posortowaną listę zamiast pełnego sortowania.',

    'Mój wkład w tę pracę to koncepcja interfejsu i przepływu użytkownika, reguły normalizacji '
    'technologii i tytułów wraz z tabelą znaków, dobór przypadków testowych, ręczne policzenie '
    'przykładu kontrolnego przed napisaniem testów, eksperyment porównawczy na powtarzalnych danych, '
    'dopracowanie wyglądu i przygotowanie obrony. Jako narzędzia pomocniczego używałem asystenta AI '
    'Claude (Anthropic): przy pisaniu i poprawianiu fragmentów kodu, redakcji tekstów oraz składaniu '
    'slajdów. Każdą liczbę w tym dokumencie sprawdziłem, uruchamiając testy i eksperyment porównawczy '
    'u siebie, a kod, który oddaję, rozumiem na tyle, żeby zmienić w nim dane albo regułę podczas obrony.',
]

BIBLIOGRAFIA = [
    'Karta tematu ASD1-M2-02 „Portfolio projektów studenckich”, Dziennik UwB, 2026.',
    'T. H. Cormen i in., Wprowadzenie do algorytmów, WNT, rozdział o sortowaniu przez wstawianie.',
    'Materiały z wykładów i ćwiczeń z przedmiotu Algorytmy i struktury danych I, 2026/2027.',
    'MDN Web Docs, dokumentacja JavaScriptu (dostęp: listopad 2026), https://developer.mozilla.org.',
    'Space Grotesk i IBM Plex, kroje pisma na licencji SIL Open Font License 1.1.',
]
