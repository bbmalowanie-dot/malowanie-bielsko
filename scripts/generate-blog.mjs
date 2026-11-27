import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://malowaniebielsko.pl';
const posts = JSON.parse(await readFile(resolve(root, 'content/posts.json'), 'utf8'));
const services = JSON.parse(await readFile(resolve(root, 'content/services.json'), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
let home = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const organization = {
  '@type':'HousePainter','@id':origin+'/#firma',name:'Malowanie Bielsko',url:origin+'/',
  description:'Malowanie wnętrz, gładzie i szpachlowanie Q1–Q4, zabudowy G-K oraz prace wykończeniowe w Bielsku-Białej i okolicach.',
  email:'kontakt@malowaniebielsko.pl',telephone:'+48726747602',
  logo:{'@type':'ImageObject',url:origin+'/assets/logo-transparent.png'},image:origin+'/assets/logo-transparent.png',
  address:{'@type':'PostalAddress',addressLocality:'Bielsko-Biała',addressRegion:'śląskie',addressCountry:'PL'},
  areaServed:[{'@type':'City',name:'Bielsko-Biała'},{'@type':'AdministrativeArea',name:'powiat bielski'}],
  knowsAbout:['malowanie ścian i sufitów','malowanie natryskowe','gładzie gipsowe','szpachlowanie Q1–Q4','zabudowy G-K','sufity podwieszane'],
  sameAs:['https://www.instagram.com/malowanie_bielsko/','https://www.facebook.com/profile.php?id=61594850486109']
};
const jsonLd = data => `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<','\\u003c')}</script>`;
const dateLabel = date => new Intl.DateTimeFormat('pl-PL',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Warsaw'}).format(new Date(date+'T12:00:00Z'));
const topics = [
  {id:'gladzie',title:'Gładzie i szpachlowanie',description:'Materiały, przygotowanie powierzchni i standardy Q1–Q4.'},
  {id:'malowanie',title:'Malowanie ścian i sufitów',description:'Wycena, gruntowanie oraz wybór metody malowania wnętrz.'},
  {id:'zabudowy-gk',title:'Zabudowy G-K i sufity podwieszane',description:'Ścianki działowe, konstrukcje sufitów, wnęki karniszowe i oświetlenie LED.'},
  {id:'planowanie',title:'Planowanie i wycena',description:'Kolejność prac i informacje potrzebne do przygotowania oferty.'}
];
const topicOf = post => post.topic ?? ({malowanie:'malowanie',gladzie:'gladzie','sufity-zabudowy-gk':'zabudowy-gk'}[post.service] ?? 'planowanie');
const postBySlug = new Map(posts.map(post=>[post.slug,post]));
if(postBySlug.size!==posts.length) throw new Error('Powtarzający się slug artykułu.');
for(const post of posts) {
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) throw new Error(`Nieprawidłowy slug: ${post.slug}`);
  if(!topics.some(topic=>topic.id===topicOf(post))) throw new Error(`Nieznany temat: ${post.slug}`);
  if(!services.some(service=>service.slug===post.service)) throw new Error(`Nieznana usługa: ${post.slug}`);
  const ids=post.sections.map(section=>section.id);
  if(new Set(ids).size!==ids.length || ids.includes('faq')) throw new Error(`Powtarzające się sekcje: ${post.slug}`);
  for(const slug of post.related??[]) if(!postBySlug.has(slug)||slug===post.slug) throw new Error(`Nieprawidłowe powiązanie: ${slug}`);
}
function wordCount(post) { return [post.lead,...post.sections.flatMap(s=>[s.heading,...(s.paragraphs??[]),...(s.items??[])]),...(post.faq??[]).flatMap(q=>[q.question,q.answer])].join(' ').trim().split(/\s+/).length; }
function minutes(post) { return Math.max(1,Math.ceil(wordCount(post)/180)); }
function cards(prefix, selection=posts) {
  return `<div class="blog-cards">${selection.map(post=>`<a class="blog-card" href="${prefix}${post.slug}/"><span class="blog-card-category">${esc(post.category)}</span><h3>${esc(post.title)}</h3><p>${esc(post.description)}</p><span class="blog-card-bottom"><span>Czytaj poradnik</span><span>${minutes(post)} min czytania</span></span></a>`).join('\n')}</div>`;
}
function relatedPosts(post) {
  const candidates=[...(post.related??[]).map(slug=>postBySlug.get(slug)),...posts.filter(p=>topicOf(p)===topicOf(post)),...posts];
  return [...new Map(candidates.filter(p=>p.slug!==post.slug).map(p=>[p.slug,p])).values()].slice(0,3);
}
function renderSection(section) {
  const sources=section.sources??(section.source?[section.source]:[]);
  return `<section id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${(section.paragraphs??[]).map(p=>`<p>${esc(p)}</p>`).join('')}${section.items?`<ul>${section.items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:''}${sources.map(source=>`<p class="article-source">Więcej informacji: <a href="${esc(source.url)}">${esc(source.label)}</a>.</p>`).join('')}</section>`;
}
function renderFaq(post) {
  return post.faq?.length?`<section id="faq" class="article-faq"><h2>Najczęstsze pytania</h2>${post.faq.map(q=>`<div class="article-faq-item"><h3>${esc(q.question)}</h3><p>${esc(q.answer)}</p></div>`).join('')}</section>`:'';
}
const featured=[...posts.filter(p=>p.featured),...posts.filter(p=>!p.featured)].slice(0,3);
home = home.replace(/<!-- BLOG_CARDS_START -->[\s\S]*?<!-- BLOG_CARDS_END -->/,`<!-- BLOG_CARDS_START -->\n      ${cards('blog/',featured)}\n      <!-- BLOG_CARDS_END -->`);
home = home.replace(/<p class="blog-intro">[\s\S]*?<\/p>/,'<p class="blog-intro">Gładzie, malowanie, zabudowy G-K i sufity podwieszane. Praktyczne odpowiedzi, które pomogą Ci zaplanować wykończenie wnętrza.</p>');
home = home.replace(/(<a class="blog-all" href="blog\/">)[\s\S]*?(<\/a>)/,`$1Zobacz wszystkie poradniki (${posts.length})$2`);
home = home.replace(/\s*<script id="organizationData" type="application\/ld\+json">[\s\S]*?<\/script>/,'');
home = home.replace('</head>',`  ${jsonLd({'@context':'https://schema.org',...organization}).replace('<script ', '<script id="organizationData" ')}\n</head>`);
await writeFile(resolve(root, 'dist/index.html'), home, 'utf8');

function shell({title,description,path,prefix,body,schema}) {
  const header = home.match(/  <header[\s\S]*?<\/header>/)[0].replaceAll('href="#',`href="${prefix}index.html#`).replaceAll('src="assets/',`src="${prefix}assets/`);
  const menu = home.match(/  <dialog class="menu-dialog"[\s\S]*?<\/dialog>/)[0].replaceAll('href="#',`href="${prefix}index.html#`).replaceAll('src="assets/',`src="${prefix}assets/`).replaceAll('href="cennik/',`href="${prefix}cennik/`);
  const footer = home.match(/  <footer class="site-footer"[\s\S]*?<\/footer>/)[0].replaceAll('href="#',`href="${prefix}index.html#`).replaceAll('href="cennik/',`href="${prefix}cennik/`);
  return `<!doctype html>
<html lang="pl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#e3f0ef"><meta name="color-scheme" content="light dark"><script src="${prefix}appearance.js?v=9"></script>
<title>${esc(title)} — Malowanie Bielsko</title>
<meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${origin}${path}">
<meta property="og:title" content="${esc(title)} — Malowanie Bielsko"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="${path==='/blog/'?'website':'article'}"><meta property="og:url" content="${origin}${path}"><meta property="og:image" content="${origin}/assets/logo-transparent.png">
<link rel="icon" type="image/png" href="${prefix}assets/logo-192.png"><link rel="stylesheet" href="${prefix}styles.css"><link rel="stylesheet" href="${prefix}brand-theme.css"><link rel="stylesheet" href="${prefix}blog-contact.css"><link rel="stylesheet" href="${prefix}appearance.css?v=9"><link rel="stylesheet" href="${prefix}layout-refinements.css?v=16"><script src="${prefix}app.js?v=9" defer></script>
${jsonLd(schema)}
</head><body class="blog-page"><a href="#main" class="skip-link">Przejdź do treści</a>
${header}
${body}
${footer}
${menu}
</body></html>`;
}
function articleContact(prefix) {
  return `<aside class="article-contact"><p class="eyebrow">Twój pomysł. Nasza praca.</p><h2>Porozmawiajmy o Twoim wnętrzu.</h2><p>Możesz zadzwonić, napisać lub przesłać projekt do bezpłatnej wyceny.</p><div><a href="mailto:kontakt@malowaniebielsko.pl?subject=Projekt%20do%20wyceny">Napisz: kontakt@malowaniebielsko.pl</a><a href="tel:+48726747602">Zadzwoń: 726 747 602</a></div><a class="text-link" href="${prefix}index.html#kontakt">Zobacz wszystkie możliwości kontaktu</a></aside>`;
}

const groups=topics.map(topic=>({...topic,posts:posts.filter(post=>topicOf(post)===topic.id)})).filter(group=>group.posts.length);
const topicNav=`<nav class="blog-topic-nav" aria-label="Tematy poradników">${groups.map(group=>`<a href="#${group.id}">${esc(group.title)}<span>${group.posts.length}</span></a>`).join('')}</nav>`;
const topicSections=groups.map(group=>`<section class="blog-topic" id="${group.id}" aria-labelledby="${group.id}-title"><header class="blog-topic-heading"><h2 id="${group.id}-title">${esc(group.title)}</h2><p>${esc(group.description)}</p></header>${cards('',group.posts)}</section>`).join('\n');
await mkdir(resolve(root,'dist/blog'),{recursive:true});
await writeFile(resolve(root,'dist/blog/index.html'),shell({
 title:'Blog: gładzie, malowanie, zabudowy G-K i sufity podwieszane',description:'Poradniki o gładziach, szpachlowaniu Q1–Q4, malowaniu ścian, zabudowach G-K i sufitach podwieszanych. Zaplanuj prace i bezpłatną wycenę.',path:'/blog/',prefix:'../',
 body:`<main id="main" class="blog-main"><nav class="article-breadcrumb" aria-label="Ścieżka strony"><a href="../index.html">Strona główna</a><span aria-hidden="true">/</span><span aria-current="page">Blog</span></nav><header class="blog-page-heading"><p class="eyebrow">Blog Malowanie Bielsko</p><h1>Gładzie, malowanie i zabudowy G-K. Praktyczne poradniki.</h1><p>${posts.length} poradników o wykończeniu wnętrz. Wybierz temat i sprawdź, co warto ustalić przed rozpoczęciem prac.</p></header>${topicNav}${topicSections}${articleContact('../')}</main>`,
 schema:{'@context':'https://schema.org','@type':'Blog',name:'Blog Malowanie Bielsko',url:origin+'/blog/',publisher:organization,blogPost:posts.map(p=>({'@type':'BlogPosting',headline:p.title,url:origin+'/blog/'+p.slug+'/'}))}
}),'utf8');

for(const post of posts) {
 const path='/blog/'+post.slug+'/';
 const breadcrumbs=[{name:'Strona główna',item:origin+'/'},{name:'Blog',item:origin+'/blog/'},{name:post.title,item:origin+path}];
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'BlogPosting',headline:post.title,description:post.description,datePublished:post.date,dateModified:post.modified??post.date,inLanguage:'pl-PL',articleSection:post.category,wordCount:wordCount(post),mainEntityOfPage:{'@type':'WebPage','@id':origin+path},author:organization,publisher:organization},
  {'@type':'BreadcrumbList',itemListElement:breadcrumbs.map((b,i)=>({'@type':'ListItem',position:i+1,...b}))}
 ]};
 const body=`<main id="main" class="blog-main article-main"><nav class="article-breadcrumb" aria-label="Ścieżka strony"><a href="../../index.html">Strona główna</a><span aria-hidden="true">/</span><a href="../">Blog</a><span aria-hidden="true">/</span><span aria-current="page">${esc(post.category)}</span></nav><article>
 <header class="article-header"><p class="eyebrow">${esc(post.category)}</p><h1>${esc(post.title)}</h1><div class="article-meta"><span>Malowanie Bielsko</span><time datetime="${post.date}">${dateLabel(post.date)}</time><span>${minutes(post)} min czytania</span></div><p class="article-lead">${esc(post.lead)}</p></header>
 <div class="article-layout"><nav class="article-toc" aria-label="W tym poradniku"><p>W tym poradniku</p>${post.sections.map(s=>`<a href="#${esc(s.id)}">${esc(s.heading)}</a>`).join('')}${post.faq?.length?'<a href="#faq">Najczęstsze pytania</a>':''}</nav><div class="article-body">${post.sections.map(renderSection).join('')}${renderFaq(post)}
 <div class="article-service"><p>Planujesz podobne prace?</p><a href="../../uslugi/${post.service}/">${esc(post.serviceLabel)}</a><a href="../../index.html#wycena">Poznaj proces bezpłatnej wyceny</a></div></div></div></article>
 ${articleContact('../../')}<nav class="article-related" aria-label="Powiązane poradniki"><h2>Przeczytaj także</h2>${relatedPosts(post).map(p=>`<a href="../${p.slug}/">${esc(p.title)}</a>`).join('')}<a class="text-link" href="../#${topicOf(post)}">Więcej poradników na ten temat</a><a class="text-link" href="../">Wszystkie poradniki</a></nav></main>`;
 const dir=resolve(root,'dist/blog',post.slug);await mkdir(dir,{recursive:true});
 await writeFile(resolve(dir,'index.html'),shell({title:post.title,description:post.description,path,prefix:'../../',body,schema}),'utf8');
}

const urls=['/','/cennik/','/blog/','/polityka-prywatnosci/',...services.map(s=>'/uslugi/'+s.slug+'/'),...posts.map(p=>'/blog/'+p.slug+'/')];
const modificationDates=new Map(posts.map(post=>['/blog/'+post.slug+'/',post.modified??post.date]));
await writeFile(resolve(root,'dist/sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${origin}${url}</loc>${modificationDates.has(url)?`<lastmod>${modificationDates.get(url)}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`,'utf8');
await writeFile(resolve(root,'dist/robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,'utf8');
console.log(`Wygenerowano blog, ${posts.length} artykułów w ${groups.length} tematach i mapę ${urls.length} adresów.`);
