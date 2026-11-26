import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const services = JSON.parse(await readFile(resolve(root, 'content/services.json'), 'utf8'));
let home = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const sectionIds = ['malowanie', 'gladzie', 'dekoracje', 'zabudowy', 'drewno', 'wykonczenia'];
services.forEach((service, index) => {
  const pattern = new RegExp(`<details id="usluga-${sectionIds[index]}"[\\s\\S]*?<\\/details>`);
  const link = `<a class="text-link service-detail-link" href="uslugi/${service.slug}/">Pełna specyfikacja<span class="sr-only">: ${escape(service.label)}</span></a>`;
  home = home.replace(pattern, section => section.includes('service-detail-link')
    ? section.replace(/<a class="text-link service-detail-link"[\s\S]*?<\/a>/, link)
    : section.replace('</div></details>', `${link}</div></details>`));
});
await writeFile(resolve(root, 'dist/index.html'), home, 'utf8');
const header = home.match(/  <header[\s\S]*?<\/header>/)[0]
  .replaceAll('href="#', 'href="../../index.html#')
  .replaceAll('src="assets/', 'src="../../assets/');
const menu = home.match(/  <dialog class="menu-dialog"[\s\S]*?<\/dialog>/)[0]
  .replaceAll('href="#', 'href="../../index.html#')
  .replaceAll('href="cennik/"', 'href="../../cennik/"');
const footer = home.match(/  <footer[\s\S]*?<\/footer>/)[0]
  .replaceAll('href="#', 'href="../../index.html#').replaceAll('href="cennik/', 'href="../../cennik/');
const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9"/></svg>';

for (const service of services) {
  const title = escape(service.title);
  const seoTitle = `${title} Bielsko-Biała i okolice — Malowanie Bielsko`;
  const description = escape(`${service.intro} Bielsko-Biała i okolice. Bezpłatna wycena: 726 747 602.`);
  const html = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#e3f0ef">
  <meta name="color-scheme" content="light dark">
  <script src="../../appearance.js?v=9"></script>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://malowaniebielsko.pl/uslugi/${service.slug}/">
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://malowaniebielsko.pl/uslugi/${service.slug}/">
  <title>${seoTitle}</title>
  <link rel="icon" type="image/png" href="../../assets/logo-192.png">
  <link rel="stylesheet" href="../../styles.css">
  <link rel="stylesheet" href="../../service-pages.css">
  <link rel="stylesheet" href="../../brand-theme.css">
  <link rel="stylesheet" href="../../blog-contact.css">
  <link rel="stylesheet" href="../../appearance.css?v=9">
  <link rel="stylesheet" href="../../layout-refinements.css?v=9">
  <script src="../../app.js?v=9" defer></script>
</head>
<body class="service-page">
  <a href="#main" class="skip-link">Przejdź do treści</a>
${header}

  <main id="main" class="service-main">
    <nav class="service-breadcrumb" aria-label="Ścieżka strony"><a href="../../index.html#start">Wszystkie usługi</a><span aria-hidden="true">/</span><span aria-current="page">${escape(service.label)}</span></nav>
    <section class="service-intro" aria-labelledby="serviceTitle">
      <p class="eyebrow">Bielsko-Biała i okolice</p>
      <h1 id="serviceTitle">${title}</h1>
      <p class="service-lead">${escape(service.intro)}</p>
      <ul class="service-highlights" aria-label="Najważniejsze informacje">${service.tags.map(tag => `<li>${escape(tag)}</li>`).join('')}</ul>
    </section>
    <div class="service-detail-layout">
      <section class="service-specification" aria-labelledby="specificationTitle">
        <h2 id="specificationTitle">Zakres i sposób wykonania</h2>
        <ul class="feature-list">
${service.features.map(([heading, description]) => `          <li class="feature-item"><span class="feature-check">${check}</span><div><h3>${escape(heading)}</h3><p>${escape(description)}</p></div></li>`).join('\n')}
        </ul>
      </section>
      <aside class="service-aside" aria-label="Bezpłatna wycena">
        <div class="service-estimate">
          <p class="eyebrow">Porozmawiajmy o wnętrzu</p>
          <h2>Umów się na<br>bezpłatną wycenę.</h2>
          <p>Opowiedz nam o planowanych pracach. Wspólnie ustalimy zakres i szczegóły realizacji.</p>
          <a class="estimate-phone" href="tel:+48726747602"><span>Zadzwoń</span><strong>726 747 602</strong></a>
          <a class="estimate-email" href="mailto:bb.malowanie@gmail.com?subject=${encodeURIComponent('Wycena: ' + service.label)}"><span>Napisz lub prześlij projekt</span><strong>bb.malowanie@gmail.com</strong></a>
          <a class="estimate-process-link" href="../../index.html#wycena">Jak wygląda proces wyceny?</a>
        </div>
      </aside>
    </div>
    <nav class="other-services" aria-labelledby="otherServicesTitle">
      <h2 id="otherServicesTitle">Zobacz też pozostałe usługi</h2>
      <div>${services.filter(other => other.slug !== service.slug).map(other => `<a href="../${other.slug}/">${escape(other.label)}</a>`).join('')}</div>
      <a class="return-services text-link" href="../../index.html#start">Wróć do wszystkich usług</a>
    </nav>
  </main>

${footer}
${menu}
</body>
</html>
`;
  const dir = resolve(root, 'dist/uslugi', service.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, 'index.html'), html, 'utf8');
}
console.log(`Wygenerowano ${services.length} podstron usług.`);
