MALOWANIE BIELSKO — KOMPLETNY PROJEKT DO EDYCJI
Wersja strony: 5. Eksport przygotowany 24 listopada 2026.

Na początek przeczytaj START-TUTAJ.txt.

ZAWARTOŚĆ
dist/                         gotowa strona do podglądu i umieszczenia na serwerze
  index.html                  strona główna
  styles.css                  układ podstawowy, menu, responsywność
  brand-theme.css             wspólna kolorystyka i proces wyceny
  service-pages.css           podstrony usług
  blog-contact.css            blog, artykuły i kontakt
  app.js                      menu, rozwijanie opisów, animacje, rok w stopce
  assets/                     wszystkie grafiki zapisane lokalnie
  uslugi/                     6 gotowych podstron usług
  blog/                       strona bloga i 11 pełnych artykułów
  sitemap.xml                 mapa adresów dla wyszukiwarek
  robots.txt                  ustawienia dostępu robotów wyszukiwarek
content/services.json         dane źródłowe sześciu usług
content/posts.json            dane źródłowe 11 artykułów
scripts/generate-blog.mjs     generator bloga, kafelków, mapy strony i robots.txt
scripts/generate-services.mjs generator podstron usług i linków do specyfikacji
.vscode/extensions.json       rekomendacja rozszerzenia Live Server
ASSET-PROMPTS.txt             pochodzenie i opisy generowania grafik
SPIS-PLIKOW.sha256            lista plików paczki z sumami kontrolnymi

Strona jest statyczna: HTML, CSS i JavaScript bez Reacta i Vite.
Nie wymaga instalowania bibliotek, npm install, bazy danych ani konta Sites.
Kod nie jest zminimalizowany. Wszystkie gotowe podstrony są już w dist.
Nie są to puste szablony ani fragmenty do samodzielnego łączenia.

URUCHOMIENIE LOKALNE
Otwórz cały folder Malowanie-Bielsko w VS Code. Zainstaluj Live Server
(Ritwick Dey), kliknij prawym przyciskiem dist/index.html i wybierz
Open with Live Server. Zapisuj zmiany przez Ctrl+S.
Adres i port podglądu ustala rozszerzenie. Zatrzymasz je poleceniem
Live Server: Stop Live Server w palecie poleceń VS Code.
Używaj serwera lokalnego zamiast file://, ponieważ podstrony mają adresy katalogów.

Alternatywa, jeżeli masz już Python 3:
W terminalu w katalogu Malowanie-Bielsko uruchom:
python -m http.server 4173 --bind 127.0.0.1 --directory dist
Otwórz http://127.0.0.1:4173/ . Serwer zatrzymasz przez Ctrl+C.

EDYCJA WYGLĄDU I STRONY GŁÓWNEJ
Edytuj dist/index.html oraz właściwy plik CSS. Kolejność arkuszy ma znaczenie:
brand-theme.css nadpisuje część pierwotnych ustawień styles.css, a blog-contact.css
odpowiada za aktualny blog i kontakt. Sprawdzaj też wygląd na wąskim ekranie.
Pliki zapisuj w UTF-8, aby zachować polskie znaki.

Logo znajduje się w dist/assets/logo-transparent.png i ma przezroczyste tło.
Pozostawiono też wcześniejsze grafiki hero.png, detail.png oraz logo-original.jpg.
Aktualny układ nie wyświetla tych trzech wcześniejszych obrazów.

EDYCJA USŁUG I BLOGA
Najwygodniej edytować treści w content/services.json i content/posts.json.
Po zapisaniu JSON trzeba wygenerować wynikowe pliki HTML.
Do tego opcjonalnie zainstaluj Node.js LTS z https://nodejs.org/ .
Po instalacji ponownie otwórz VS Code. Terminal powinien wskazywać katalog
Malowanie-Bielsko, w którym znajdują się foldery dist, content i scripts.
Uruchom kolejno:

node scripts/generate-blog.mjs
node scripts/generate-services.mjs

Generatory używają wyłącznie wbudowanych modułów Node.js. Nie ma zależności
do pobierania ani polecenia npm install. Po wygenerowaniu wróć do podglądu.

Możesz także ręcznie edytować gotowe pliki dist/uslugi/*/index.html oraz
dist/blog/*/index.html. Pamiętaj jednak, że następne uruchomienie generatora
nadpisze te podstrony treścią z JSON i szablonu w scripts.

Wspólny nagłówek, menu i stopkę zmieniaj w dist/index.html. Następnie uruchom
oba generatory w podanej wyżej kolejności, aby przenieść zmiany na podstrony.
Dane kontaktowe występują również w szablonach generatorów; przy ich zmianie
wyszukaj stary numer lub e-mail w całym projekcie (Ctrl+Shift+F).

Nowy artykuł:
1. W content/posts.json skopiuj obiekt istniejącego artykułu jako kolejny element.
2. Ustaw unikalny slug (małe litery, cyfry i myślniki), title, description, lead,
   category, date w formacie RRRR-MM-DD, service, serviceLabel oraz sections.
3. Każda sekcja ma unikalne id, heading i paragraphs; może zawierać items
   oraz źródło source z label i url. Zachowaj poprawne przecinki i cudzysłowy JSON.
4. Uruchom generator bloga. Doda artykuł, kafelek, linki i wpis w sitemap.xml.
5. Po usunięciu artykułu z JSON usuń też odpowiadający mu stary folder z dist/blog;
   generator aktualizuje bieżące wpisy, ale nie kasuje dawnych katalogów.

Usługi:
Sześć istniejących usług jest powiązanych z kafelkami i sekcjami strony głównej.
Zmiana opisów w JSON nie wymaga zmiany układu. Dodanie nowej kategorii wymaga
również uzupełnienia kafelka i sekcji w dist/index.html oraz mapowania sectionIds
w scripts/generate-services.mjs. Dla samych zmian opisów zachowaj kolejność
i istniejące wartości slug.

KONTAKT
Telefon: 726 747 602 (tel:+48726747602).
E-mail: bb.malowanie@gmail.com.
Przyciski e-mail korzystają z mailto: i otwierają skonfigurowaną pocztę użytkownika.
Odwiedzający sam dołącza projekt PDF, zdjęcia lub inne pliki i wysyła wiadomość.
Strona nie zawiera formularza wysyłkowego ani funkcji przechowywania załączników.
Nie trzeba konfigurować hasła do poczty, klucza API ani serwera SMTP.

PUBLIKACJA NA WŁASNYM HOSTINGU
1. Dokończ edycję i w razie potrzeby uruchom generatory.
2. Zmień adres strony w ustawieniach SEO, jak opisano poniżej.
3. Prześlij ZAWARTOŚĆ dist, a nie cały folder projektu, do katalogu strony,
   np. public_html. index.html powinien znajdować się bezpośrednio w tym katalogu.
4. Zachowaj strukturę assets, blog i uslugi. Hosting musi udostępniać pliki
   index.html jako domyślne dokumenty w katalogach.
5. W przeglądarce sprawdź stronę główną, usługę, artykuł i przyciski kontaktu.

Na hosting trafia tylko dist. Foldery content, scripts i .vscode oraz dokumentacja
są do lokalnej edycji. Serwer produkcyjny nie musi mieć Node.js ani Pythona.
Nie jest potrzebne przekierowywanie wszystkich adresów na stronę główną:
każda podstrona ma własny plik index.html.

SEO I WŁASNA DOMENA
Adresy canonical, Open Graph, dane strukturalne, mapa strony i robots.txt
wskazują obecnie dotychczasowy adres:
https://malowanie-bielsko.sleekcroissant3.chatgpt.site

Przy przenoszeniu pod własną domenę otwórz w VS Code Zamień w plikach
(Ctrl+Shift+H). W polu plików do uwzględnienia wpisz: dist/**, scripts/**
Zamień powyższy adres na pełny nowy adres, np. https://twoja-domena.pl
bez końcowego ukośnika. Zmiana ma objąć HTML, XML, TXT i oba generatory.
Następnie uruchom oba generatory oraz sprawdź dist/sitemap.xml i dist/robots.txt.
Pozostaw istniejące ścieżki /blog/ i /uslugi/. Ta instrukcja zakłada publikację
w głównym katalogu domeny. Podgląd lokalny nie wymaga zmiany adresów SEO.

Na własnym hostingu strona powinna być publicznie dostępna przez HTTPS.
Meta robots i robots.txt w paczce pozwalają na indeksowanie. Blog ma osobne
tytuły i opisy, dane BlogPosting oraz BreadcrumbList; strona główna dane organizacji.
Po uruchomieniu własnej domeny możesz zgłosić mapę strony w Google Search Console.

POCHODZENIE PACZKI
Pliki dist, content i scripts odpowiadają wersji źródłowej:
e94da230e2550b32e60cc4f77f59400ca3c67a98
Dokumentacja i rekomendacja rozszerzenia zostały dodane do eksportu.
Paczka działa niezależnie od wcześniejszej platformy publikacji.
SPIS-PLIKOW.sha256 zawiera sumy wszystkich pozostałych plików paczki;
jest zapisem stanu przy eksporcie i nie aktualizuje się po Twoich zmianach.

Dokumentacja Live Server:
https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer
