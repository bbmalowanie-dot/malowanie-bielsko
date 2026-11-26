/* Cloudflare Worker: przyjmuje zgłoszenie z kalkulatora (POST /api/wycena)
   i wysyła je e-mailem ze zdjęciami przez Cloudflare Email Routing.
   Wymagane w ustawieniach Workera:
   - powiązanie (binding) typu "Send email" o nazwie MAIL,
     z adresem docelowym = zweryfikowany adres w Email Routing (np. bb.malowanie@gmail.com),
   - zmienne: TO = bb.malowanie@gmail.com, FROM = formularz@malowaniebielsko.pl
   - trasa (route): malowaniebielsko.pl/api/*  */
import { EmailMessage } from 'cloudflare:email';

const MAX_FILES = 8;
const MAX_TOTAL = 18 * 1024 * 1024;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const b64 = bytes => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/.{1,76}/g, '$&\r\n');
};
const b64text = text => b64(new TextEncoder().encode(text));
const header = text => `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(text)))}?=`;
const clean = (v, max = 500) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
const oneLine = v => clean(v, 200).replace(/[\r\n]+/g, ' ');

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/wycena') return json({ ok: false, error: 'Nie znaleziono' }, 404);
    if (request.method !== 'POST') return json({ ok: false, error: 'Metoda niedozwolona' }, 405);

    let form;
    try { form = await request.formData(); } catch { return json({ ok: false, error: 'Nieprawidłowe dane' }, 400); }
    if (clean(form.get('strona_www'))) return json({ ok: true }); // pułapka na boty

    const imie = oneLine(form.get('imie'));
    const telefon = oneLine(form.get('telefon'));
    const miejscowosc = oneLine(form.get('miejscowosc'));
    const email = oneLine(form.get('email'));
    if (!imie || telefon.replace(/\D/g, '').length < 9 || !miejscowosc || form.get('zgoda') !== 'on')
      return json({ ok: false, error: 'Uzupełnij imię, telefon, miejscowość i zgodę.' }, 400);

    const files = form.getAll('zdjecia').filter(f => f && typeof f === 'object' && f.size > 0).slice(0, MAX_FILES);
    let total = 0;
    const attachments = [];
    for (const [i, f] of files.entries()) {
      if (!/^image\//.test(f.type)) continue;
      total += f.size;
      if (total > MAX_TOTAL) break;
      const ext = (f.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
      attachments.push({ name: `zdjecie-${i + 1}.${ext}`, type: f.type, data: new Uint8Array(await f.arrayBuffer()) });
    }

    const body = [
      'Nowe zgłoszenie z kalkulatora wyceny na malowaniebielsko.pl',
      '',
      `Imię: ${imie}`,
      `Telefon: ${telefon}`,
      `E-mail: ${email || '—'}`,
      `Miejscowość: ${miejscowosc}`,
      `Termin: ${oneLine(form.get('termin')) || '—'}`,
      '',
      '--- Wybrane w kalkulatorze ---',
      clean(form.get('podsumowanie'), 3000) || '—',
      '',
      '--- Wiadomość ---',
      clean(form.get('wiadomosc'), 3000) || '—',
      '',
      `Zdjęcia: ${attachments.length}`,
      `Wysłano: ${new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}`
    ].join('\r\n');

    const boundary = 'b' + crypto.randomUUID().replace(/-/g, '');
    const domain = (env.FROM || 'formularz@malowaniebielsko.pl').split('@')[1];
    const lines = [
      `From: ${header('Formularz Malowanie Bielsko')} <${env.FROM}>`,
      `To: <${env.TO}>`,
      ...(/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(email) ? [`Reply-To: <${email}>`] : []),
      `Subject: ${header(`Wycena: ${imie}, ${miejscowosc} — tel. ${telefon}`)}`,
      `Message-ID: <${crypto.randomUUID()}@${domain}>`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64text(body)
    ];
    for (const a of attachments) {
      lines.push(`--${boundary}`, `Content-Type: ${a.type}; name="${a.name}"`, 'Content-Transfer-Encoding: base64', `Content-Disposition: attachment; filename="${a.name}"`, '', b64(a.data));
    }
    lines.push(`--${boundary}--`, '');

    try {
      await env.MAIL.send(new EmailMessage(env.FROM, env.TO, lines.join('\r\n')));
    } catch (e) {
      console.error('Wysyłka nieudana', e);
      return json({ ok: false, error: 'Nie udało się wysłać wiadomości.' }, 502);
    }
    return json({ ok: true });
  }
};
