import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// DANE FIRMY — uzupełnij i uruchom: node scripts/generate-privacy.mjs
const FIRMA = {
  nazwa: '',   // pełna nazwa firmy (jak w CEIDG), np. „Jan Kowalski Malowanie Bielsko”
  adres: '',   // adres siedziby, np. „ul. Przykładowa 1, 43-300 Bielsko-Biała”
  nip: ''      // NIP
};
const OBOWIAZUJE_OD = '27 listopada 2026 r.';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const home = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const blank = '<span class="pp-blank" aria-label="do uzupełnienia">&nbsp;</span>';
const val = v => (v ? esc(v) : blank);
const relative = html => html.replaceAll('href="#', 'href="../index.html#')
  .replaceAll('src="assets/', 'src="../assets/')
  .replaceAll('href="cennik/', 'href="../cennik/');
const header = relative(home.match(/  <header[\s\S]*?<\/header>/)[0]);
const menu = relative(home.match(/  <dialog class="menu-dialog"[\s\S]*?<\/dialog>/)[0]);
const footer = relative(home.match(/  <footer class="site-footer"[\s\S]*?<\/footer>/)[0]);

const html = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#e3f0ef">
  <meta name="color-scheme" content="light dark">
  <script src="../appearance.js?v=9"></script>
  <meta name="description" content="Polityka prywatności serwisu malowaniebielsko.pl — jakie dane zbieramy w formularzach wyceny, w jakim celu, komu je przekazujemy i jakie masz prawa.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://malowaniebielsko.pl/polityka-prywatnosci/">
  <title>Polityka prywatności — Malowanie Bielsko</title>
  <link rel="icon" type="image/png" href="../assets/logo-192.png">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="../service-pages.css?v=4">
  <link rel="stylesheet" href="../brand-theme.css">
  <link rel="stylesheet" href="../blog-contact.css">
  <link rel="stylesheet" href="../appearance.css?v=9">
  <link rel="stylesheet" href="../layout-refinements.css?v=13">
  <style>
    .pp { max-width: 820px; padding: 40px 0 70px; }
    .pp h1 { font-size: clamp(36px, 4.6vw, 60px); font-weight: 400; letter-spacing: -.045em; line-height: 1.08; margin: 0 0 14px; }
    .pp-meta { font-size: 15px; opacity: .75; margin: 0 0 34px; }
    .pp h2 { font-size: clamp(22px, 2.2vw, 28px); font-weight: 500; letter-spacing: -.02em; line-height: 1.25; margin: 40px 0 12px; }
    .pp p, .pp li { font-size: 17px; line-height: 1.7; }
    .pp ul { padding-left: 22px; margin: 10px 0; }
    .pp li { margin-bottom: 6px; }
    .pp a { text-decoration: underline; text-underline-offset: 3px; }
    .pp-box { padding: 20px 22px; border-radius: 10px; background: #edf6f5; border: 1px solid #d2e5e5; }
    .pp-box p { margin: 4px 0; }
    .pp-blank { display: inline-block; min-width: 14em; border-bottom: 1px dotted currentColor; }
    [data-theme="dark"] .pp-box { background: #17394a; border-color: #2e5866; }
  </style>
  <script src="../app.js?v=9" defer></script>
</head>
<body class="service-page">
  <a href="#main" class="skip-link">Przejdź do treści</a>
${header}

  <main id="main" class="service-main">
    <nav class="service-breadcrumb" aria-label="Ścieżka strony"><a href="../index.html#start">Strona główna</a><span aria-hidden="true">/</span><span aria-current="page">Polityka prywatności</span></nav>
    <article class="pp">
      <h1>Polityka prywatności</h1>
      <p class="pp-meta">Obowiązuje od ${OBOWIAZUJE_OD}</p>
      <p>Tu wyjaśniamy prostym językiem, jakie dane zbieramy, gdy kontaktujesz się z nami przez stronę malowaniebielsko.pl, telefon lub e-mail, po co je zbieramy i jakie masz prawa. Polityka spełnia wymogi RODO (rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679).</p>

      <h2>1. Kto jest administratorem Twoich danych</h2>
      <div class="pp-box">
        <p><strong>Administrator:</strong> ${val(FIRMA.nazwa)}</p>
        <p><strong>Adres:</strong> ${val(FIRMA.adres)}</p>
        <p><strong>NIP:</strong> ${val(FIRMA.nip)}</p>
        <p><strong>Kontakt w sprawie danych:</strong> <a href="mailto:kontakt@malowaniebielsko.pl">kontakt@malowaniebielsko.pl</a>, tel. <a href="tel:+48726747602">726 747 602</a></p>
      </div>

      <h2>2. Jakie dane zbieramy</h2>
      <ul>
        <li><strong>Formularz wyceny i „Oddzwonimy”:</strong> imię, numer telefonu, opcjonalnie adres e-mail, miejscowość, preferowany termin kontaktu lub prac, opis prac, przesłane zdjęcia oraz parametry wyceny z kalkulatora (rodzaj obiektu, usługi, metraż).</li>
        <li><strong>Kontakt telefoniczny, SMS i e-mail:</strong> dane, które sam nam przekażesz w rozmowie lub wiadomości.</li>
        <li><strong>Dane techniczne:</strong> adres IP i informacje o przeglądarce, które serwer zapisuje automatycznie w celach bezpieczeństwa i ochrony przed spamem.</li>
      </ul>
      <p>Podanie danych jest dobrowolne, ale bez numeru telefonu nie oddzwonimy, a bez opisu prac nie przygotujemy wyceny.</p>

      <h2>3. W jakim celu i na jakiej podstawie</h2>
      <ul>
        <li><strong>Przygotowanie wyceny, kontakt w jej sprawie i wysłanie potwierdzenia z podsumowaniem</strong> — działania na Twoje żądanie przed zawarciem umowy (art. 6 ust. 1 lit. b RODO).</li>
        <li><strong>Wykonanie zlecenia i rozliczenie</strong>, jeśli zawrzemy umowę — art. 6 ust. 1 lit. b RODO, a w zakresie dokumentów księgowych i podatkowych — obowiązek prawny (art. 6 ust. 1 lit. c RODO).</li>
        <li><strong>Bezpieczeństwo strony, ochrona przed nadużyciami i ewentualne dochodzenie roszczeń</strong> — nasz prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).</li>
      </ul>
      <p>Nie wysyłamy reklam ani newslettera. Twoich danych nie sprzedajemy i nie przekazujemy innym firmom w celach marketingowych.</p>

      <h2>4. Komu przekazujemy dane</h2>
      <p>Korzystamy z zaufanych dostawców, którzy przetwarzają dane wyłącznie na nasze polecenie:</p>
      <ul>
        <li><strong>Cloudflare, Inc.</strong> — hosting strony, obsługa formularzy i przekierowanie poczty,</li>
        <li><strong>Resend</strong> — wysyłka wiadomości e-mail z formularza (potwierdzenie dla Ciebie i zgłoszenie dla nas),</li>
        <li><strong>Google</strong> — skrzynka pocztowa, do której trafiają zgłoszenia,</li>
        <li>biuro rachunkowe — wyłącznie gdy zawrzemy umowę i wystawimy fakturę.</li>
      </ul>
      <p>Część z tych firm ma siedzibę w USA. Przekazanie danych poza Europejski Obszar Gospodarczy odbywa się na podstawie decyzji Komisji Europejskiej (EU-US Data Privacy Framework) lub standardowych klauzul umownych zatwierdzonych przez Komisję.</p>

      <h2>5. Jak długo przechowujemy dane</h2>
      <ul>
        <li><strong>Zapytania o wycenę, które nie zakończyły się zleceniem</strong> — do 12 miesięcy od ostatniego kontaktu, chyba że wcześniej poprosisz o ich usunięcie.</li>
        <li><strong>Dane związane z wykonanym zleceniem</strong> — przez czas wymagany przepisami podatkowymi i do przedawnienia roszczeń.</li>
        <li><strong>Dane techniczne (logi serwera)</strong> — przez krótki okres określony przez dostawcę hostingu.</li>
      </ul>

      <h2>6. Twoje prawa</h2>
      <p>Masz prawo do:</p>
      <ul>
        <li>dostępu do swoich danych i otrzymania ich kopii,</li>
        <li>sprostowania nieprawidłowych danych,</li>
        <li>usunięcia danych,</li>
        <li>ograniczenia przetwarzania,</li>
        <li>przeniesienia danych,</li>
        <li>sprzeciwu wobec przetwarzania opartego na naszym prawnie uzasadnionym interesie.</li>
      </ul>
      <p>Wystarczy napisać na <a href="mailto:kontakt@malowaniebielsko.pl">kontakt@malowaniebielsko.pl</a>. Masz też prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, <a href="https://uodo.gov.pl" target="_blank" rel="noopener">uodo.gov.pl</a>).</p>

      <h2>7. Kalkulator i zautomatyzowane decyzje</h2>
      <p>Kalkulator wyceny liczy orientacyjną cenę bezpośrednio w Twojej przeglądarce. To tylko podpowiedź — nie podejmujemy wobec Ciebie decyzji w sposób zautomatyzowany i nie profilujemy Cię.</p>

      <h2>8. Pliki cookies i pamięć przeglądarki</h2>
      <p>Strona nie używa cookies analitycznych ani reklamowych. W pamięci Twojej przeglądarki (localStorage) zapisujemy jedynie wybór motywu jasnego lub ciemnego — ta informacja nie opuszcza Twojego urządzenia. Dostawca hostingu (Cloudflare) może stosować techniczne cookies niezbędne do ochrony strony przed atakami i botami.</p>
      <p>Jeśli w przyszłości dodamy narzędzia analityczne lub reklamowe (np. Google Analytics, Meta Pixel), uruchomimy je wyłącznie po Twojej zgodzie i zaktualizujemy tę politykę.</p>

      <h2>9. Linki do innych serwisów</h2>
      <p>Na stronie są linki do naszych profili na Instagramie i Facebooku oraz do opinii w Google. Po przejściu do tych serwisów obowiązują ich własne zasady prywatności.</p>

      <h2>10. Zmiany polityki</h2>
      <p>Politykę możemy aktualizować, np. gdy zmienią się narzędzia, z których korzystamy. Aktualna wersja jest zawsze dostępna na tej stronie, z datą, od której obowiązuje.</p>
    </article>
  </main>

${footer}
${menu}
</body>
</html>
`;
await mkdir(resolve(root, 'dist/polityka-prywatnosci'), { recursive: true });
await writeFile(resolve(root, 'dist/polityka-prywatnosci/index.html'), html, 'utf8');
console.log('Wygenerowano politykę prywatności.' + (FIRMA.nazwa && FIRMA.adres && FIRMA.nip ? '' : ' Uwaga: brak danych firmy (nazwa / adres / NIP).'));
