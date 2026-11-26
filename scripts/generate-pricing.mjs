import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const home = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const relative = html => html.replaceAll('href="#', 'href="../index.html#')
  .replaceAll('src="assets/', 'src="../assets/')
  .replaceAll('href="cennik/"', 'href="./" aria-current="page"');
const header = relative(home.match(/  <header[\s\S]*?<\/header>/)[0]);
const menu = relative(home.match(/  <dialog class="menu-dialog"[\s\S]*?<\/dialog>/)[0]);
const footer = relative(home.match(/  <footer[\s\S]*?<\/footer>/)[0]);
const html = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#e3f0ef">
  <meta name="color-scheme" content="light dark">
  <script src="../appearance.js?v=9"></script>
  <title>Cennik — Malowanie Bielsko</title>
  <meta name="description" content="Przygotowujemy kalkulator orientacyjnej wyceny prac wykończeniowych. Już teraz poproś o indywidualną, bezpłatną wycenę.">
  <meta name="robots" content="noindex, follow">
  <link rel="icon" type="image/png" href="../assets/logo-192.png">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="../brand-theme.css">
  <link rel="stylesheet" href="../blog-contact.css">
  <link rel="stylesheet" href="../appearance.css?v=9">
  <link rel="stylesheet" href="../layout-refinements.css?v=9">
  <script src="../app.js?v=9" defer></script>
</head>
<body class="pricing-page">
  <a href="#main" class="skip-link">Przejdź do treści</a>
${header}
  <main id="main" class="pricing-main">
    <nav class="article-breadcrumb" aria-label="Ścieżka strony"><a href="../index.html">Strona główna</a><span aria-hidden="true">/</span><span aria-current="page">Cennik</span></nav>
    <section class="pricing-intro" aria-labelledby="pricingTitle">
      <p class="eyebrow">Cennik</p>
      <h1 id="pricingTitle">Twój zakres prac.<br>Twoja wycena.</h1>
      <p>Koszt wykończenia zależy od wnętrza, jego stanu i zakresu prac. Pomagamy ustalić, czego potrzebuje Twoja przestrzeń.</p>
    </section>
    <section class="pricing-notice" aria-labelledby="pricingStatus">
      <span class="pricing-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="7" y="3" width="18" height="26" rx="3"/><path d="M11 8h10v5H11Z M11 18h2m6 0h2m-10 6h2m6 0h2"/></svg></span>
      <div>
        <h2 id="pricingStatus">Kalkulator wyceny w przygotowaniu</h2>
        <p>Wkrótce wybierzesz usługę, odpowiesz na pytania o planowane prace i podasz obmiar, aby poznać orientacyjny koszt. Tymczasem zapraszamy do bezpłatnej, indywidualnej wyceny.</p>
        <div class="pricing-actions"><a href="mailto:bb.malowanie@gmail.com?subject=Bezp%C5%82atna%20wycena">Napisz lub prześlij projekt</a><a href="tel:+48726747602">Zadzwoń: 726 747 602</a></div>
      </div>
    </section>
    <a class="text-link" href="../index.html#start">Zobacz wszystkie usługi</a>
  </main>
${footer}
${menu}
</body>
</html>`;
await mkdir(resolve(root, 'dist/cennik'), { recursive: true });
await writeFile(resolve(root, 'dist/cennik/index.html'), html, 'utf8');
console.log('Wygenerowano stronę Cennik (zapowiedź, bez ankiety i obliczeń).');
