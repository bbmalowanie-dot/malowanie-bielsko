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
const footer = home.match(/  <footer class="site-footer"[\s\S]*?<\/footer>/)[0]
  .replaceAll('href="#', 'href="../../index.html#').replaceAll('href="cennik/', 'href="../../cennik/');
const PHOTOS = {
  malowanie: [['poddasze-kamienica-po-remoncie', 540, 'Poddasze w kamienicy po malowaniu — jasne ściany i cegła'], ['malowanie-garazu-po-jaworze', 540, 'Garaż w Jaworzu po malowaniu ścian i sufitu'], ['poddasze-okno-dachowe-malowanie', 540, 'Pokój na poddaszu z oknem dachowym po malowaniu'], ['loft-wysokie-sciany-malowanie', 540, 'Wysokie ściany w lofcie po malowaniu']],
  gladzie: [['mieszkanie-pekniety-sufit-przed', 540, 'Przed: popękany sufit w mieszkaniu w bloku'], ['mieszkanie-gladzie-sufit-gk-w-trakcie', 540, 'W trakcie: szpachlowanie ścian i sufitu'], ['mieszkanie-gladzie-malowanie-po', 540, 'Po: gładkie, białe ściany i sufit'], ['poddasze-kamienica-gladzie-malowanie', 540, 'Poddasze w kamienicy po gładziach i malowaniu']],
  'sciany-dekoracyjne': [['sciana-dekoracyjna-przed', 540, 'Przed: zniszczona ściana w przedpokoju'], ['sciana-dekoracyjna-beton-czarny', 406, 'Ściana dekoracyjna — czarny beton'], ['sciana-dekoracyjna-czarna-zloto', 406, 'Ściana dekoracyjna — czarna faktura ze złotymi płatkami'], ['sciana-dekoracyjna-marmur-zylki', 406, 'Ściana dekoracyjna z efektem marmuru i żyłkami']],
  'sufity-zabudowy-gk': [['mieszkanie-sufit-podwieszany-gk-konstrukcja', 540, 'Konstrukcja sufitu podwieszanego G-K w mieszkaniu'], ['scianki-dzialowe-gk-welna', 540, 'Ścianki działowe G-K wypełnione wełną'], ['scianki-dzialowe-gk-plyty-spoinowanie', 540, 'Zbrojenie i spoinowanie połączeń płyt G-K'], ['biuro-scianki-gk-po', 540, 'Gotowe biuro po zabudowie G-K i malowaniu']],
  'renowacja-drewna': [['renowacja-drzwi-drewnianych-przed', 540, 'Przed: zniszczone drewniane drzwi'], ['renowacja-drzwi-drewnianych-po-jaworze', 540, 'Po: odnowione drzwi wejściowe w Jaworzu'], ['renowacja-okien-drewnianych-przed', 720, 'Przed: zniszczony, zbutwiały parapet okna drewnianego'], ['renowacja-okien-drewnianych-jaworze', 540, 'Renowacja okien drewnianych w Jaworzu']],
  'prace-wykonczeniowe': [['poddasze-kamienica-przed-remontem', 540, 'Przed: poddasze w kamienicy przed remontem'], ['poddasze-kamienica-po-remoncie', 540, 'Po: poddasze w kamienicy po wykończeniu'], ['korytarz-sklepienie-ceglane-malowanie', 540, 'Korytarz z ceglanym sklepieniem po wykończeniu'], ['klatka-schodowa-cegla-renowacja', 540, 'Klatka schodowa z odsłoniętą cegłą']]
};
const gallery = slug => (PHOTOS[slug] || []).length ? `    <section class="service-gallery" id="realizacjeUslugi" aria-labelledby="galleryTitle">
      <h2 id="galleryTitle">Nasze realizacje</h2>
      <ul>${PHOTOS[slug].map(([file, w, alt]) => `<li><figure><img src="../../assets/realizacje/${file}-m.jpg" width="${w}" height="${w === 720 ? 540 : 720}" loading="lazy" alt="${escape(alt)}"><figcaption>${escape(alt)}</figcaption></figure></li>`).join('')}</ul>
      <a class="text-link" href="../../index.html#realizacje">Zobacz więcej realizacji przed i po</a>
    </section>
` : '';
const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9"/></svg>';
const phoneIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3h3l1.6 4.2-2.1 1.4a11 11 0 0 0 6.3 6.3l1.4-2.1L21 14.4v3A2.6 2.6 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6 2.6 2.6 0 0 1 6.6 3Z"/></svg>';
const rates = JSON.parse(await readFile(resolve(root, 'content/stawki.json'), 'utf8'));
const posts = JSON.parse(await readFile(resolve(root, 'content/posts.json'), 'utf8'));
// {{malowanie.prywatny.0}} → wartość ze stawki.json, żeby ceny na podstronach zgadzały się z kalkulatorem
const fill = text => text.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
  const value = path.split('.').reduce((node, key) => node?.[key], rates);
  if (value === undefined) throw new Error(`Brak stawki: ${path}`);
  return typeof value === 'number' ? value.toLocaleString('pl-PL') : value;
});
const strip = text => text.replace(/\s+/g, ' ').trim();
const ctaButtons = label => `<div class="svc-ctas">
        <a class="svc-cta svc-cta-primary" href="tel:+48726747602">${phoneIcon}Zadzwoń: 726 747 602</a>
        <a class="svc-cta" href="../../cennik/#kalkulator">Policz cenę online</a>
        <a class="svc-cta svc-cta-ghost" href="../../index.html#oddzwonimy">Zamów oddzwonienie</a>
      </div>`;

for (const service of services) {
  const title = escape(service.title);
  const seoTitle = `${title} Bielsko-Biała i okolice — Malowanie Bielsko`;
  const description = escape(fill(service.metaDescription || `${service.intro} Bielsko-Biała i okolice.`));
  const priceFrom = escape(fill(service.price.from));
  const priceNote = escape(fill(service.price.note));
  const faq = service.faq.map(([q, a]) => [q, fill(a)]);
  const articles = (service.articles || []).map(slug => posts.find(post => post.slug === slug)).filter(Boolean);
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Service', name: service.title, serviceType: service.label, description: strip(service.intro),
        url: `https://malowaniebielsko.pl/uslugi/${service.slug}/`,
        provider: { '@id': 'https://malowaniebielsko.pl/#firma' },
        areaServed: [{ '@type': 'City', name: 'Bielsko-Biała' }, { '@type': 'AdministrativeArea', name: 'powiat bielski' }] },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Usługi', item: 'https://malowaniebielsko.pl/#uslugi' },
        { '@type': 'ListItem', position: 2, name: service.label, item: `https://malowaniebielsko.pl/uslugi/${service.slug}/` }] }
    ]
  }).replace(/</g, '\\u003c');
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
  <link rel="stylesheet" href="../../service-pages.css?v=4">
  <link rel="stylesheet" href="../../brand-theme.css">
  <link rel="stylesheet" href="../../blog-contact.css">
  <link rel="stylesheet" href="../../appearance.css?v=9">
  <link rel="stylesheet" href="../../layout-refinements.css?v=13">
  <script src="../../app.js?v=9" defer></script>
  <script type="application/ld+json">${schema}</script>
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
      <p class="svc-price"><span>Cena</span><strong>${priceFrom}</strong><small>${priceNote}</small></p>
      <p class="svc-intro-links"><a href="#realizacjeUslugi">Zobacz realizacje</a><a href="../../cennik/#kalkulator">Policz cenę w kalkulatorze</a></p>
    </section>
    <div class="service-detail-layout">
      <div class="service-content">
        <section class="svc-block" aria-labelledby="whenTitle">
          <h2 id="whenTitle">Kiedy nas wołasz</h2>
          <ul class="svc-when">${service.when.map(item => `<li>${escape(item)}</li>`).join('')}</ul>
        </section>
        <section class="service-specification svc-block" aria-labelledby="specificationTitle">
          <h2 id="specificationTitle">Zakres i sposób wykonania</h2>
          <ul class="feature-list">
${service.features.map(([heading, text]) => `          <li class="feature-item"><span class="feature-check">${check}</span><div><h3>${escape(heading)}</h3><p>${escape(text)}</p></div></li>`).join('\n')}
          </ul>
        </section>
        <section class="svc-block" aria-labelledby="processTitle">
          <h2 id="processTitle">Jak przebiega realizacja</h2>
          <ol class="svc-steps">${service.process.map(([heading, text]) => `<li><h3>${escape(heading)}</h3><p>${escape(text)}</p></li>`).join('')}</ol>
        </section>
        <section class="svc-block svc-pricing" aria-labelledby="pricingTitle">
          <h2 id="pricingTitle">Od czego zależy cena</h2>
          <ul>${service.priceFactors.map(item => `<li>${escape(item)}</li>`).join('')}</ul>
          <p class="svc-pricing-note">Wszystkie ceny podajemy netto i z materiałem. Dla mieszkań i domów najczęściej obowiązuje 8% VAT, w pozostałych przypadkach 23%.</p>
          <a class="svc-cta svc-cta-primary" href="../../cennik/#kalkulator">Policz orientacyjną cenę w minutę</a>
        </section>
        <section class="svc-block" aria-labelledby="faqTitle">
          <h2 id="faqTitle">Najczęstsze pytania</h2>
          <div class="svc-faq">${faq.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('')}</div>
        </section>
${articles.length ? `        <section class="svc-block" aria-labelledby="articlesTitle">
          <h2 id="articlesTitle">Poradniki na blogu</h2>
          <ul class="svc-articles">${articles.map(post => `<li><a href="../../blog/${post.slug}/">${escape(post.title)}</a></li>`).join('')}</ul>
        </section>
` : ''}      </div>
      <aside class="service-aside" aria-label="Bezpłatna wycena">
        <div class="service-estimate">
          <p class="eyebrow">Bezpłatna wycena</p>
          <h2>Zadzwoń albo wyślij zdjęcia.</h2>
          <p>Powiedz, co i gdzie trzeba zrobić. Orientacyjną cenę podamy od razu, a dokładny kosztorys dostaniesz na piśmie.</p>
          <a class="estimate-phone" href="tel:+48726747602"><span>Zadzwoń</span><strong>726 747 602</strong></a>
          <a class="estimate-sms" href="sms:+48726747602">Wyślij SMS ze zdjęciem</a>
          <a class="estimate-email" href="mailto:kontakt@malowaniebielsko.pl?subject=${encodeURIComponent('Wycena: ' + service.label)}"><span>Napisz lub prześlij projekt</span><strong>kontakt@malowaniebielsko.pl</strong></a>
          <ul class="estimate-trust"><li><span aria-hidden="true">★</span> 5,0 w opiniach Google</li><li>Ceny z materiałem</li><li>Kosztorys na piśmie</li></ul>
        </div>
      </aside>
    </div>
${gallery(service.slug)}    <section class="svc-final" aria-labelledby="finalTitle">
      <h2 id="finalTitle">${escape(service.label)} w Bielsku-Białej i okolicach — umów bezpłatną wycenę</h2>
      <p>Pracujemy w Bielsku-Białej i okolicach — m.in. w Jaworzu, Czechowicach-Dziedzicach, Kozach, Wilkowicach i Szczyrku. Większe zlecenia realizujemy też dalej, np. w Cieszynie.</p>
      ${ctaButtons()}
    </section>
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
`;  const dir = resolve(root, 'dist/uslugi', service.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, 'index.html'), html, 'utf8');
}
console.log(`Wygenerowano ${services.length} podstron usług.`);
