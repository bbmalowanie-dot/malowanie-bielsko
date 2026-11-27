import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://malowaniebielsko.pl';
const home = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const R = JSON.parse(await readFile(resolve(root, 'content/stawki.json'), 'utf8'));
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const relative = html => html.replaceAll('href="#', 'href="../index.html#')
  .replaceAll('src="assets/', 'src="../assets/')
  .replaceAll('href="cennik/#', 'href="#').replaceAll('href="cennik/"', 'href="./" aria-current="page"');
const header = relative(home.match(/  <header[\s\S]*?<\/header>/)[0]);
const menu = relative(home.match(/  <dialog class="menu-dialog"[\s\S]*?<\/dialog>/)[0]);
const footer = relative(home.match(/  <footer class="site-footer"[\s\S]*?<\/footer>/)[0]);

const r = ([a, b]) => `${a}–${b} zł/m²`;
const m = R.malowanie, g = R.gladzie.podloza;
const rows = [
  ['Malowanie ścian i sufitów na biało (mieszkanie, dom)', r(m.prywatny)],
  ['Malowanie w kolorze, 2–3 kolory (mieszkanie, dom)', r(m.prywatny.map(v => Math.round(v * m.kolory.kilka.mnoznik)))],
  ['Malowanie biur', r(m.biuro)],
  [`Malowanie hal i magazynów (natrysk, od ${m.halaMinimalnyMetraz} m²)`, r(m.hala)],
  ['Malowanie lokali usługowych', r(m.lokal)],
  ...Object.entries(g).filter(([k]) => k !== 'nie_wiem').map(([, v]) => [`Gładź + malowanie na gotowo — ${v.nazwa[0].toLowerCase() + v.nazwa.slice(1)}`, r(v.zMalowaniem)]),
  ...Object.entries(g).filter(([k]) => k !== 'nie_wiem').map(([, v]) => [`Sama gładź — ${v.nazwa[0].toLowerCase() + v.nazwa.slice(1)}`, r(v.sama)]),
  ...Object.values(R.sufityGK.poziomy).map(v => [`Sufit podwieszany G-K — ${v.nazwa.toLowerCase()}`, r(v.stawka)]),
  [R.sufityGK.wnekaLED.nazwa, R.sufityGK.wnekaLED.stawka.join('–') + ' zł/mb'],
  [R.sufityGK.wnekaKarnisz.nazwa, R.sufityGK.wnekaKarnisz.stawka.join('–') + ' zł/mb'],
  [R.sufityGK.zbrojenieTasma.nazwa, r(R.sufityGK.zbrojenieTasma.stawka)],
  ['Ścianki działowe i zabudowy G-K', r(R.zabudowyGK.stawka)],
  ['Tapetowanie (tapeta klienta)', r(R.tapetowanie.stawka)]
];
const faq = [
  ['Ile kosztuje malowanie mieszkania w Bielsku-Białej?', `Malowanie ścian i sufitów na biało, razem z materiałami, to orientacyjnie ${r(m.prywatny)} netto. Mieszkanie 50 m² to zwykle ok. 170 m² ścian i sufitów. Dokładną cenę podajemy po bezpłatnych oględzinach.`],
  ['Ile kosztują gładzie z malowaniem na gotowo?', `Na tynku gipsowym to orientacyjnie ${r(g.gipsowy.zMalowaniem)} netto, ze wszystkimi materiałami: zabezpieczeniem, gruntowaniem, akrylami, gładzią, szlifowaniem i malowaniem.`],
  ['Ile kosztuje sufit podwieszany z płyt G-K?', `Sufit jednopoziomowy to orientacyjnie ${r(R.sufityGK.poziomy.jeden.stawka)} netto z materiałem (konstrukcja, płyty, montaż). Wnęka pod LED kosztuje ${R.sufityGK.wnekaLED.stawka.join('–')} zł/mb, wnęka karniszowa ${R.sufityGK.wnekaKarnisz.stawka.join('–')} zł/mb. Gładź i malowanie liczone są osobno.`],
  ['Czy mogę zamówić kilka usług naraz?', 'Tak. W kalkulatorze zaznaczysz np. sufity G-K z wnękami, zbrojenie połączeń taśmą, gładzie na ścianach i sufitach, malowanie i tapetę na jednej ścianie — policzymy wszystko razem.'],
  ['Od czego zależy cena gładzi?', 'Najbardziej od podłoża (tynk gipsowy, cementowo-wapienny, płyty G-K czy stare pomalowane ściany), jego stanu, liczby warstw i wymaganego standardu Q1–Q4.'],
  ['Czy ceny zawierają materiały?', 'Tak. Wszystkie ceny w cenniku i w kalkulatorze są z materiałami: zabezpieczenie powierzchni, grunty, akryle, gładź i farba.'],
  ['Czy ceny są netto czy brutto?', R.vatInfo],
  ['Czy wycena jest płatna?', 'Nie. Oględziny i wycena w Bielsku-Białej i okolicach są bezpłatne. Możesz też przesłać zdjęcia przez formularz.']
];
const schema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
};
const ratesJson = JSON.stringify(R).replaceAll('<', '\\u003c');

const html = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#e3f0ef">
  <meta name="color-scheme" content="light dark">
  <script src="../appearance.js?v=12"></script>
  <title>Cennik malowania i gładzi Bielsko-Biała — kalkulator wyceny | Malowanie Bielsko</title>
  <meta name="description" content="Ile kosztuje malowanie i gładź w Bielsku-Białej? Sprawdź cennik i policz orientacyjną cenę w kalkulatorze. Domy, mieszkania, biura, hale. Bezpłatna wycena.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${origin}/cennik/">
  <meta property="og:title" content="Cennik malowania i gładzi Bielsko-Biała — kalkulator wyceny">
  <meta property="og:description" content="Policz orientacyjną cenę malowania i gładzi w kilka kliknięć i wyślij zdjęcia do dokładnej wyceny.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${origin}/cennik/">
  <meta property="og:image" content="${origin}/assets/logo-transparent.png">
  <link rel="icon" type="image/png" href="../assets/logo-192.png">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="../brand-theme.css">
  <link rel="stylesheet" href="../blog-contact.css">
  <link rel="stylesheet" href="../appearance.css?v=12">
  <link rel="stylesheet" href="../layout-refinements.css?v=16">
  <link rel="stylesheet" href="../wycena.css?v=14">
  <script src="../app.js?v=12" defer></script>
  <script src="../wycena.js?v=13" defer></script>
  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
</head>
<body class="pricing-page">
  <a href="#main" class="skip-link">Przejdź do treści</a>
${header}
  <main id="main" class="pricing-main">
    <nav class="article-breadcrumb" aria-label="Ścieżka strony"><a href="../index.html">Strona główna</a><span aria-hidden="true">/</span><span aria-current="page">Cennik</span></nav>
    <section class="pricing-intro" aria-labelledby="pricingTitle">
      <p class="eyebrow">Cennik · Bielsko-Biała i okolice</p>
      <h1 id="pricingTitle">Policz koszt malowania i gładzi.</h1>
      <p>Odpowiedz na kilka pytań i od razu zobacz orientacyjną cenę. Potem zostaw kontakt i dołącz zdjęcia — przygotujemy dokładną wycenę za darmo.</p>
    </section>
    <section class="calc-section" aria-label="Kalkulator wyceny">
      <div class="calc-shell" id="kalkulator">
        <noscript><p>Kalkulator wymaga włączonego JavaScriptu. Zadzwoń: <a href="tel:+48726747602">726 747 602</a> lub napisz: <a href="mailto:kontakt@malowaniebielsko.pl">kontakt@malowaniebielsko.pl</a>.</p></noscript>
      </div>
      <script id="stawki" type="application/json">${ratesJson}</script>
    </section>
    <section class="price-table-wrap" aria-labelledby="priceTableTitle">
      <h2 id="priceTableTitle">Cennik orientacyjny (netto)</h2>
      <p>Ceny za m² powierzchni ścian i sufitów, z materiałami. Ostateczna kwota zależy od stanu ścian, metrażu i dostępu — podajemy ją po bezpłatnych oględzinach. Minimalna wartość zlecenia: ${R.minimalneZlecenie} zł netto.</p>
      <table class="price-table">
        <thead><tr><th scope="col">Usługa</th><th scope="col">Cena netto</th></tr></thead>
        <tbody>
${rows.map(([n, p]) => `          <tr><th scope="row">${esc(n)}</th><td>${esc(p)}</td></tr>`).join('\n')}
        </tbody>
      </table>
      <p class="wz-note">${esc(R.vatInfo)}</p>
    </section>
    <section class="price-faq" aria-labelledby="priceFaqTitle">
      <h2 id="priceFaqTitle">Najczęstsze pytania o ceny</h2>
${faq.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </section>
  </main>
${footer}
${menu}
</body>
</html>`;
await mkdir(resolve(root, 'dist/cennik'), { recursive: true });
await writeFile(resolve(root, 'dist/cennik/index.html'), html, 'utf8');
console.log('Wygenerowano stronę Cennik z kalkulatorem wyceny.');
