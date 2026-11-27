/* Worker strony malowaniebielsko.pl (konfiguracja: /wrangler.jsonc).
   Obsługuje POST /api/wycena, pozostałe adresy oddaje plikom strony z dist/.
   1) wysyła zgłoszenie (ze zdjęciami) do właściciela (OWNER → Email Routing → prywatny Gmail),
   2) wysyła klientowi potwierdzenie z podsumowaniem wstępnej wyceny i informacjami „co dalej”.
   Wysyłka przez Resend — domena malowaniebielsko.pl zweryfikowana w Resend.
   Sekret RESEND_API_KEY: panel Cloudflare → Worker → Settings → Variables and Secrets. */

const MAX_FILES = 8;
const MAX_TOTAL = 18 * 1024 * 1024;
const PHONE = '726 747 602';
const SITE = 'https://malowaniebielsko.pl';
const REVIEWS = 'https://share.google/P3WPBpt1GnGOxd6JP';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clean = (v, max = 500) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
const oneLine = (v, max = 200) => clean(v, max).replace(/[\r\n]+/g, ' ');
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zl = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const range = r => r[0] === r[1] ? `${zl(r[0])} zł` : `${zl(r[0])} – ${zl(r[1])} zł`;
const isEmail = v => /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(v);
const toB64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };

/* Wycena z przeglądarki — przyjmujemy tylko liczby i krótkie nazwy pozycji. */
function parseQuote(raw) {
  try {
    const q = JSON.parse(String(raw || ''));
    const pair = a => Array.isArray(a) && a.length === 2 && a.every(n => Number.isFinite(n) && n >= 0 && n < 1e8) ? a : null;
    const lines = (Array.isArray(q.lines) ? q.lines : []).slice(0, 20).map(l => ({ name: oneLine(l.name, 120), qty: Number(l.qty) || 0, unit: oneLine(l.unit, 4), sum: pair(l.sum) })).filter(l => l.name && l.sum);
    const total = pair(q.total);
    if (!lines.length || !total) return null;
    return { lines, total, minimum: !!q.minimum, notes: (q.notes || []).slice(0, 5).map(n => oneLine(n, 240)), individual: (q.individual || []).slice(0, 6).map(n => oneLine(n, 60)) };
  } catch { return null; }
}

async function send(env, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function clientEmail({ imie, rodzaj, kiedy, quote, individual }) {
  const first = esc(imie.split(' ')[0]);
  const call = rodzaj === 'telefon'
    ? `Dziękujemy za prośbę o kontakt. Zadzwonimy do Ciebie ${kiedy && kiedy !== 'Jak najszybciej' ? `<strong>${esc(kiedy.toLowerCase())}</strong>` : '<strong>najszybciej, jak to możliwe</strong>'}.`
    : 'Dziękujemy za przesłanie zgłoszenia. Przejrzymy zdjęcia i zadzwonimy z wyceną — zwykle tego samego lub następnego dnia roboczego.';
  const rows = quote ? quote.lines.map(l => `<tr><td style="padding:8px 0;border-bottom:1px solid #d5e6e8">${esc(l.name)}<br><span style="color:#5b7680;font-size:13px">${zl(l.qty)} ${esc(l.unit)}</span></td><td style="padding:8px 0;border-bottom:1px solid #d5e6e8;text-align:right;white-space:nowrap;font-weight:600">${range(l.sum)}</td></tr>`).join('') : '';
  const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#e3f0ef;font-family:Arial,Helvetica,sans-serif;color:#0b3542">
<div style="max-width:600px;margin:0 auto;padding:28px 18px">
<p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#467f87;margin:0 0 6px">Malowanie Bielsko · Bielsko-Biała i okolice</p>
<h1 style="font-size:26px;font-weight:400;margin:0 0 18px">Dzień dobry, ${first}!</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 22px">${call}</p>
${quote ? `<div style="background:#fafcfb;border:1px solid #9fc6cb;border-radius:12px;padding:20px">
<p style="font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#467f87;margin:0">Twoja wstępna wycena (netto, z materiałami)</p>
<p style="font-size:30px;font-weight:600;margin:6px 0 14px">${range(quote.total)}</p>
<table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px">${rows}</table>
${quote.individual.length ? `<p style="font-size:14px;margin:12px 0 0">Wycenimy indywidualnie: ${esc(quote.individual.join(', '))}.</p>` : ''}
${quote.notes.map(n => `<p style="font-size:13px;color:#405e69;margin:10px 0 0">${esc(n)}</p>`).join('')}
<p style="font-size:13px;color:#405e69;margin:10px 0 0">To cena orientacyjna. Ostateczną kwotę podamy po bezpłatnych oględzinach. Do cen netto doliczamy VAT — dla mieszkań i domów najczęściej 8%, w pozostałych przypadkach 23%.</p>
</div>` : individual.length ? `<p style="font-size:15px">Prace do wyceny: ${esc(individual.join(', '))}.</p>` : ''}
<h2 style="font-size:20px;font-weight:400;margin:28px 0 10px">Co dalej?</h2>
<ol style="font-size:15px;line-height:1.7;padding-left:20px;margin:0">
<li><strong>Rozmowa</strong> — ustalimy zakres prac i Twoje oczekiwania.</li>
<li><strong>Bezpłatne oględziny</strong> — sprawdzimy podłoże i dokładnie zmierzymy powierzchnie.</li>
<li><strong>Kosztorys na piśmie</strong> — z podziałem na etapy, bez ukrytych kosztów.</li>
<li><strong>Termin</strong> — ustalamy daty wejścia i odbioru prac. Materiały kupujemy i dowozimy my.</li>
</ol>
<h2 style="font-size:20px;font-weight:400;margin:28px 0 10px">Przed rozmową warto przygotować</h2>
<ul style="font-size:15px;line-height:1.7;padding-left:20px;margin:0">
<li>zdjęcia pomieszczeń (najlepiej w dziennym świetle),</li>
<li>metraż lub rzut mieszkania,</li>
<li>planowany termin i ewentualny projekt lub kolory.</li>
</ul>
<div style="margin:28px 0;padding:18px;background:#0b3542;border-radius:12px;color:#e5f3f3">
<p style="margin:0 0 6px;font-size:14px;color:#a7d6da">Masz pytanie? Zadzwoń lub odpowiedz na tego maila.</p>
<p style="margin:0;font-size:24px"><a href="tel:+48726747602" style="color:#e5f3f3;text-decoration:none">${PHONE}</a></p>
</div>
<p style="font-size:14px;line-height:1.6;margin:0">Zobacz <a href="${REVIEWS}" style="color:#0b3542">opinie naszych klientów w Google (5,0 ★)</a> oraz <a href="${SITE}/blog/" style="color:#0b3542">poradniki przed remontem</a>.</p>
<p style="font-size:12px;color:#5b7680;line-height:1.5;margin:24px 0 0">Otrzymujesz tę wiadomość, bo zostawiłeś(-aś) dane w formularzu na malowaniebielsko.pl. Jeśli to pomyłka, odpowiedz na tego maila — usuniemy Twoje dane.</p>
</div></body></html>`;
  const text = [`Dzień dobry, ${imie.split(' ')[0]}!`, '', call.replace(/<[^>]+>/g, ''), '',
    ...(quote ? ['Twoja wstępna wycena (netto, z materiałami): ' + range(quote.total), ...quote.lines.map(l => `- ${l.name}: ${zl(l.qty)} ${l.unit} → ${range(l.sum)}`), 'To cena orientacyjna. Ostateczną kwotę podamy po bezpłatnych oględzinach.', ''] : []),
    'Co dalej: rozmowa → bezpłatne oględziny → kosztorys na piśmie → termin prac.', '', `Telefon: ${PHONE}`, SITE].join('\n');
  return { html, text };
}

// Safari/iOS odtwarza <video> tylko, gdy serwer obsługuje Range (odpowiedź 206).
async function serveVideo(request, env) {
  const plain = new Request(request.url, { method: 'GET' });
  const res = await env.ASSETS.fetch(plain);
  if (!res.ok) return res;
  const body = await res.arrayBuffer();
  const size = body.byteLength;
  const headers = new Headers(res.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=604800');
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range') || '');
  if (!match || (match[1] === '' && match[2] === '')) {
    headers.set('Content-Length', String(size));
    return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers });
  }
  let start, end;
  if (match[1] === '') { start = Math.max(0, size - Number(match[2])); end = size - 1; }
  else { start = Number(match[1]); end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1); }
  if (start >= size || start > end) {
    headers.set('Content-Range', `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(request.method === 'HEAD' ? null : body.slice(start, end + 1), { status: 206, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/assets/video/') && env.ASSETS && (request.method === 'GET' || request.method === 'HEAD')) return serveVideo(request, env);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(request) : json({ ok: false }, 404);
    if (url.pathname !== '/api/wycena') return json({ ok: false, error: 'Nie znaleziono' }, 404);
    if (!env.RESEND_API_KEY) return json({ ok: false, error: 'Wysyłka nie jest jeszcze skonfigurowana.' }, 503);
    if (request.method !== 'POST') return json({ ok: false, error: 'Metoda niedozwolona' }, 405);
    if (env.RATE) {
      const { success } = await env.RATE.limit({ key: request.headers.get('cf-connecting-ip') || 'x' });
      if (!success) return json({ ok: false, error: 'Za dużo zgłoszeń. Spróbuj za chwilę lub zadzwoń.' }, 429);
    }

    let form;
    try { form = await request.formData(); } catch { return json({ ok: false, error: 'Nieprawidłowe dane' }, 400); }
    if (clean(form.get('strona_www'))) return json({ ok: true }); // pułapka na boty

    const rodzaj = form.get('rodzaj') === 'zdjecia' ? 'zdjecia' : 'telefon';
    const imie = oneLine(form.get('imie'), 60);
    const telefon = oneLine(form.get('telefon'), 30);
    const email = oneLine(form.get('email'), 120);
    const miejscowosc = oneLine(form.get('miejscowosc'), 80);
    const kiedy = oneLine(form.get('kiedy'), 40);
    if (!imie || telefon.replace(/\D/g, '').length < 9 || form.get('zgoda') !== 'on')
      return json({ ok: false, error: 'Uzupełnij imię, telefon i zgodę.' }, 400);
    if (rodzaj === 'zdjecia' && !miejscowosc) return json({ ok: false, error: 'Podaj miejscowość.' }, 400);
    const quote = parseQuote(form.get('wycena_json'));

    const attachments = [];
    let total = 0;
    for (const [i, f] of form.getAll('zdjecia').filter(f => f && typeof f === 'object' && f.size > 0).slice(0, MAX_FILES).entries()) {
      if (!/^image\//.test(f.type) || (total += f.size) > MAX_TOTAL) continue;
      const ext = (f.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
      attachments.push({ filename: `zdjecie-${i + 1}.${ext}`, content: toB64(new Uint8Array(await f.arrayBuffer())) });
    }

    const ownerText = [
      rodzaj === 'telefon' ? '📞 PROŚBA O TELEFON' : '📷 ZGŁOSZENIE ZE ZDJĘCIAMI',
      '',
      `Imię: ${imie}`,
      `Telefon: ${telefon}`,
      ...(rodzaj === 'telefon' ? [`Kiedy dzwonić: ${kiedy || 'Jak najszybciej'}`] : [`Termin prac: ${oneLine(form.get('termin')) || '—'}`]),
      `E-mail: ${email || '—'}`,
      `Miejscowość: ${miejscowosc || '—'}`,
      '',
      '--- Z kalkulatora ---',
      clean(form.get('podsumowanie'), 4000) || '—',
      ...(rodzaj === 'zdjecia' ? ['', '--- Wiadomość ---', clean(form.get('wiadomosc'), 3000) || '—', '', `Zdjęcia w załączniku: ${attachments.length}`] : []),
      '',
      `Wysłano: ${new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}`
    ].join('\n');

    try {
      await send(env, {
        from: env.FROM, to: [env.OWNER],
        ...(isEmail(email) ? { reply_to: email } : {}),
        subject: `${rodzaj === 'telefon' ? '📞 Zadzwoń' : '📷 Wycena'}: ${imie}, tel. ${telefon}${miejscowosc ? ', ' + miejscowosc : ''}${quote ? ' — ' + range(quote.total) : ''}`,
        text: ownerText,
        ...(attachments.length ? { attachments } : {})
      });
    } catch (e) {
      console.error('Mail do właściciela nieudany', e);
      return json({ ok: false, error: 'Nie udało się wysłać wiadomości.' }, 502);
    }

    let mailed = false;
    if (isEmail(email)) {
      try {
        const { html, text } = clientEmail({ imie, rodzaj, kiedy, quote, individual: quote ? quote.individual : [] });
        await send(env, { from: env.FROM, to: [email], reply_to: env.OWNER, subject: quote ? `Twoja wstępna wycena: ${range(quote.total)} netto — Malowanie Bielsko` : 'Dziękujemy za kontakt — Malowanie Bielsko', html, text });
        mailed = true;
      } catch (e) { console.error('Mail do klienta nieudany', e); }
    }
    return json({ ok: true, mailed });
  }
};
