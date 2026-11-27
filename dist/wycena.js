/* Kalkulator orientacyjnej wyceny (łączenie wielu usług) + formularz zgłoszenia ze zdjęciami.
   Stawki pochodzą z <script id="stawki" type="application/json"> (źródło: content/stawki.json). */
(() => {
  const root = document.getElementById('kalkulator');
  const ratesEl = document.getElementById('stawki');
  if (!root || !ratesEl) return;
  const R = JSON.parse(ratesEl.textContent);
  const API = '/api/wycena';
  const MAX_PHOTOS = 8;
  const zl = { format: n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') };
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return n > 0 ? n : 0; };

  const S = {
    klient: null, obiekt: null, uslugi: [], stan: null, wysokosc: null, czynny: false,
    gl: { gipsowy: '', cementowy: '', gk: '', stare: '', nie_wiem: '' }, glSufity: true,
    mal: { kolory: null, teSame: true, tryb: 'podloga', zakres: 'scianyISufity', metraz: '' },
    suf: { poziom: 'jeden', m2: '', led: '', karnisz: '', tasma: true },
    zab: { m2: '' }, tap: { m2: '' }
  };
  const photos = [];
  let step = 0;
  let mode = 'telefon';

  const OBIEKTY = {
    prywatny: [['mieszkanie', 'Mieszkanie', 'Blok, kamienica, apartament'], ['dom', 'Dom', 'Dom jednorodzinny, bliźniak, szeregowiec']],
    firma: [['biuro', 'Biuro', 'Biura, gabinety, sale konferencyjne'], ['hala', 'Hala lub magazyn', `Hale, magazyny — od ${R.malowanie.halaMinimalnyMetraz} m²`], ['lokal', 'Lokal usługowy', 'Sklepy, restauracje, salony'], ['inne', 'Inne pomieszczenia', 'Szkoły, klatki schodowe, obiekty']]
  };
  /* kolejność = kolejność prac na budowie */
  const USLUGI = [
    ['sufity', 'Sufity podwieszane G-K', 'Też wnęki LED i karniszowe'],
    ['zabudowy', 'Ścianki i zabudowy G-K', 'Ścianki działowe, obudowy'],
    ['gladzie', 'Gładzie', 'Na tynku, płytach G-K, starych ścianach'],
    ['malowanie', 'Malowanie', 'Na biało lub w kolorze'],
    ['tapeta', 'Tapetowanie', 'Np. jedna ściana dekoracyjna'],
    ['dekoracyjne', 'Ściany dekoracyjne', 'Wycena indywidualna'],
    ['drewno', 'Renowacja drewna', 'Wycena indywidualna'],
    ['inne', 'Inne prace', 'Opiszesz w wiadomości']
  ];
  const PRICED = ['sufity', 'zabudowy', 'gladzie', 'malowanie', 'tapeta'];
  const has = id => S.uslugi.includes(id);
  const firm = () => S.klient === 'firma';
  const anyPriced = () => S.uslugi.some(u => PRICED.includes(u));
  const glSum = () => Object.values(S.gl).reduce((a, v) => a + num(v), 0) + (has('sufity') && S.glSufity ? num(S.suf.m2) : 0);
  const paintSame = () => has('gladzie') && has('malowanie') && S.mal.teSame;
  const paintArea = () => paintSame() ? glSum() : S.mal.tryb === 'podloga' ? num(S.mal.metraz) * R.powierzchniaZPodlogi[S.mal.zakres] : num(S.mal.metraz);

  function steps() {
    const list = ['klient', 'obiekt', 'uslugi'];
    if (!S.uslugi.length) return list;
    if (!anyPriced()) return [...list, 'kontakt'];
    list.push('warunki');
    for (const u of PRICED) if (has(u)) list.push(u);
    list.push('wynik');
    return list;
  }

  /* ---------- wycena ---------- */
  function quote() {
    const k = firm() ? R.wysokosc[S.wysokosc].mnoznik * (S.czynny ? R.obiektCzynny.mnoznik : 1) : R.stan[S.stan].mnoznik;
    const disc = q => (R.rabatyIlosciowe.find(t => q >= t.od) || { mnoznik: 1 }).mnoznik;
    const round = v => Math.round(v / R.zaokraglenie) * R.zaokraglenie;
    const lines = [], notes = [];
    let discounted = false;
    const add = (name, qty, unit, rate, useDisc = true) => {
      if (!(qty > 0)) return;
      const d = useDisc ? disc(qty) : 1;
      if (d < 1) discounted = true;
      lines.push({ name, qty: Math.round(qty), unit, sum: [round(rate[0] * k * d * qty), round(rate[1] * k * d * qty)] });
    };
    const scale = (r, m) => [r[0] * m, r[1] * m];
    const paintRate = area => {
      let key = firm() ? S.obiekt : 'prywatny';
      if (key === 'hala' && area < R.malowanie.halaMinimalnyMetraz) { key = R.malowanie.halaPonizejMinimum; notes.push(`Stawki halowe obowiązują od ${zl.format(R.malowanie.halaMinimalnyMetraz)} m². Mniejszą powierzchnię policzyliśmy jak pomieszczenia biurowe.`); }
      return R.malowanie[key];
    };
    const colour = has('malowanie') ? R.malowanie.kolory[S.mal.kolory].mnoznik : 1;

    if (has('sufity')) {
      const s = R.sufityGK, m2 = num(S.suf.m2);
      add(`Sufit podwieszany G-K — ${s.poziomy[S.suf.poziom].nazwa.toLowerCase()}`, m2, 'm²', s.poziomy[S.suf.poziom].stawka);
      add(s.wnekaLED.nazwa, num(S.suf.led), 'mb', s.wnekaLED.stawka, false);
      add(s.wnekaKarnisz.nazwa, num(S.suf.karnisz), 'mb', s.wnekaKarnisz.stawka, false);
      if (S.suf.tasma) add(s.zbrojenieTasma.nazwa, m2, 'm²', s.zbrojenieTasma.stawka);
    }
    if (has('zabudowy')) add('Ścianki i zabudowy G-K', num(S.zab.m2), 'm²', R.zabudowyGK.stawka);
    if (has('gladzie')) {
      const fk = firm() ? R.gladzie.mnoznikFirma : 1;
      const same = paintSame();
      const areas = { ...Object.fromEntries(Object.entries(S.gl).map(([k2, v]) => [k2, num(v)])) };
      if (has('sufity') && S.glSufity) areas.gk += num(S.suf.m2);
      for (const [key, qty] of Object.entries(areas)) {
        const p = R.gladzie.podloza[key];
        add(`${same ? 'Gładź + malowanie na gotowo' : 'Gładź'} — ${p.nazwa.charAt(0).toLowerCase() + p.nazwa.slice(1)}`, qty, 'm²', scale(same ? p.zMalowaniem : p.sama, fk));
      }
      if (same && colour > 1) { const pr = paintRate(glSum()); add(`Dopłata za kolory (${R.malowanie.kolory[S.mal.kolory].nazwa.toLowerCase()})`, glSum(), 'm²', [pr[0] * (colour - 1), pr[1] * (colour - 1)]); }
    }
    if (has('malowanie') && !paintSame()) { const a = paintArea(); add(`Malowanie — ${R.malowanie.kolory[S.mal.kolory].nazwa.toLowerCase()}`, a, 'm²', scale(paintRate(a), colour)); }
    if (has('tapeta')) { add('Tapetowanie (tapeta klienta)', num(S.tap.m2), 'm²', R.tapetowanie.stawka); notes.push('Tapetowanie: cena obejmuje przygotowanie ściany, klej i klejenie. Tapetę wybiera i dostarcza klient.'); }

    let total = lines.reduce((a, l) => [a[0] + l.sum[0], a[1] + l.sum[1]], [0, 0]);
    const minimum = total[1] < R.minimalneZlecenie;
    if (minimum) total = [R.minimalneZlecenie, Math.max(R.minimalneZlecenie, total[1])];
    const individual = S.uslugi.filter(u => !PRICED.includes(u)).map(u => USLUGI.find(x => x[0] === u)[1]);
    return { lines, total, minimum, discounted, notes: [...new Set(notes)], individual };
  }
  const range = r => r[0] === r[1] ? `${zl.format(r[0])} zł` : `${zl.format(r[0])} – ${zl.format(r[1])} zł`;

  function summary() {
    const out = [];
    out.push(`Klient: ${firm() ? 'Firma' : 'Prywatny'} · ${labelOf(OBIEKTY[S.klient] || [], S.obiekt)}`);
    out.push(`Usługi: ${S.uslugi.map(u => labelOf(USLUGI, u)).join(', ')}`);
    if (anyPriced()) {
      out.push(firm() ? `Wysokość: ${R.wysokosc[S.wysokosc].nazwa}${S.czynny ? ' · obiekt czynny w trakcie prac' : ''}` : `Stan: ${R.stan[S.stan].nazwa}`);
      const q = quote();
      out.push('', 'Pozycje (netto, z materiałami):');
      q.lines.forEach(l => out.push(`- ${l.name}: ${zl.format(l.qty)} ${l.unit} → ${range(l.sum)}`));
      out.push(`RAZEM: ${range(q.total)}${q.minimum ? ' (minimalne zlecenie)' : ''}`);
      if (q.individual.length) out.push(`Do wyceny indywidualnej: ${q.individual.join(', ')}`);
    }
    return out.join('\n');
  }
  const labelOf = (list, id) => (list.find(o => o[0] === id) || [, id])[1];

  /* ---------- widoki ---------- */
  const card = (name, value, title, sub, selected, multi) => `<button type="button" class="wz-card${multi ? ' wz-multi' : ''}" ${multi ? 'data-multi' : 'data-set'}="${name}" data-value="${esc(value)}" aria-pressed="${selected ? 'true' : 'false'}"><strong>${esc(title)}</strong>${sub ? `<span>${esc(sub)}</span>` : ''}</button>`;
  const cards = (name, opts) => `<div class="wz-cards">${opts.map(([v, t, s]) => card(name, v, t, s, S[name] === v)).join('')}</div>`;
  const fromRates = obj => Object.entries(obj).map(([k, v]) => [k, v.nazwa, '']);
  const getPath = p => p.split('.').reduce((o, k) => o[k], S);
  const setPath = (p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((o, k) => o[k], S)[last] = v; };
  const field = (path, label, unit, ph) => `<label class="wz-field wz-num"><span>${label}</span><span class="wz-input-unit"><input type="number" inputmode="decimal" min="0" step="any" data-path="${path}" value="${esc(getPath(path))}" placeholder="${ph || '0'}"><b>${unit}</b></span></label>`;
  const seg = (path, opts) => `<div class="wz-seg" role="group">${opts.map(([v, t]) => `<button type="button" data-seg="${path}" data-value="${v}" aria-pressed="${getPath(path) === v}">${t}</button>`).join('')}</div>`;
  const check = (path, text) => `<label class="wz-check"><input type="checkbox" data-check="${path}" ${getPath(path) ? 'checked' : ''}><span>${text}</span></label>`;

  const VIEWS = {
    klient: () => ({ title: 'Dla kogo wycena?', body: cards('klient', [['prywatny', 'Dom lub mieszkanie', 'Klient indywidualny'], ['firma', 'Firma lub obiekt', 'Biura, hale, magazyny, lokale']]) }),
    obiekt: () => ({ title: firm() ? 'Jaki to obiekt?' : 'Gdzie mamy pracować?', body: cards('obiekt', OBIEKTY[S.klient]) }),
    uslugi: () => ({
      title: 'Co mamy zrobić?', hint: 'Zaznacz wszystko, czego potrzebujesz — policzymy całość razem.', manual: true,
      body: `<div class="wz-cards">${USLUGI.map(([v, t, s]) => card('uslugi', v, t, s, has(v), true)).join('')}</div>`
    }),
    warunki: () => firm()
      ? { title: 'Jak wysokie są pomieszczenia?', body: cards('wysokosc', fromRates(R.wysokosc)) + check('czynny', 'Obiekt będzie działał w trakcie prac (praca etapami, po godzinach)'), manual: true }
      : { title: 'W jakim stanie jest wnętrze?', body: cards('stan', fromRates(R.stan)) },
    sufity: () => ({
      title: 'Sufity podwieszane G-K', manual: true,
      body: seg('suf.poziom', Object.entries(R.sufityGK.poziomy).map(([k, v]) => [k, v.nazwa])) +
        `<div class="wz-grid3">${field('suf.m2', 'Powierzchnia sufitów', 'm²', 'np. 40')}${field('suf.led', 'Wnęki pod LED', 'mb', '0')}${field('suf.karnisz', 'Wnęki karniszowe', 'mb', '0')}</div>` +
        check('suf.tasma', 'Zbrojenie połączeń płyt taśmą i szpachlowanie spoin') +
        `<p class="wz-hint wz-small">mb = metry bieżące, czyli długość wnęki. Gładź i malowanie sufitów dodasz w kolejnych krokach.</p>`
    }),
    zabudowy: () => ({ title: 'Ścianki i zabudowy G-K', manual: true, hint: 'Podaj powierzchnię ścianek (długość × wysokość).', body: field('zab.m2', 'Powierzchnia ścianek', 'm²', 'np. 12') }),
    gladzie: () => ({
      title: 'Gładzie — na jakim podłożu?', manual: true,
      hint: 'Wpisz metraż przy każdym podłożu, które występuje. Ściany i sufity razem.',
      body: `<div class="wz-grid2">${Object.entries(R.gladzie.podloza).map(([k, v]) => field(`gl.${k}`, v.nazwa, 'm²')).join('')}</div>` +
        (has('sufity') ? check('glSufity', `Gładź także na nowych sufitach G-K (${zl.format(num(S.suf.m2))} m² doliczymy automatycznie)`) : '') +
        `<p class="wz-calc" id="wzCalc"></p>`
    }),
    malowanie: () => ({
      title: 'Malowanie', manual: true,
      body: `<p class="wz-label">Jakie kolory?</p>${seg('mal.kolory', Object.entries(R.malowanie.kolory).map(([k, v]) => [k, v.nazwa]))}` +
        (has('gladzie') ? check('mal.teSame', `Malujemy te same powierzchnie co gładź (${zl.format(glSum())} m²)`) : '') +
        (paintSame() ? '' : `<p class="wz-label">Co malujemy?</p>${seg('mal.zakres', [['scianyISufity', 'Ściany i sufity'], ['sciany', 'Tylko ściany'], ['sufity', 'Tylko sufity']])}
          ${seg('mal.tryb', [['podloga', 'Znam metraż podłogi'], ['powierzchnia', 'Znam m² ścian/sufitów']])}
          ${field('mal.metraz', S.mal.tryb === 'podloga' ? 'Metraż podłogi' : 'Powierzchnia do malowania', 'm²', firm() ? 'np. 1200' : 'np. 55')}`) +
        `<p class="wz-calc" id="wzCalc"></p>`
    }),
    tapeta: () => ({ title: 'Tapetowanie', manual: true, hint: 'Np. jedna ściana 4 m × 2,6 m = ok. 10 m².', body: field('tap.m2', 'Powierzchnia do tapetowania', 'm²', 'np. 10') }),
    wynik: () => {
      const q = quote();
      return {
        title: 'Twoja wycena orientacyjna', manual: true, noNext: true,
        body: `<div class="wz-result">
          <p class="wz-total"><span>Razem netto, z materiałami</span><strong>${range(q.total)}</strong></p>
          <table class="wz-lines"><tbody>${q.lines.map(l => `<tr><th scope="row">${esc(l.name)}<small>${zl.format(l.qty)} ${l.unit}</small></th><td>${range(l.sum)}</td></tr>`).join('')}</tbody></table>
          ${q.individual.length ? `<p class="wz-note"><strong>Wycenimy indywidualnie:</strong> ${esc(q.individual.join(', '))}.</p>` : ''}
          ${q.discounted ? `<p class="wz-note">Uwzględniono rabat za duży metraż.</p>` : ''}
          ${q.minimum ? `<p class="wz-note">Przy małym zakresie obowiązuje minimalna wartość zlecenia ${zl.format(R.minimalneZlecenie)} zł netto.</p>` : ''}
          ${q.notes.map(n => `<p class="wz-note">${esc(n)}</p>`).join('')}
          <p class="wz-note">Ceny zawierają materiały: zabezpieczenie powierzchni, grunty, akryle, gładzie, farby i elementy konstrukcji G-K. ${esc(R.vatInfo.replace('Ceny netto, z materiałami. ', ''))}</p>
          <p class="wz-note"><strong>To cena orientacyjna.</strong> Dokładną kwotę podamy po bezpłatnych oględzinach lub na podstawie zdjęć.</p>
        </div>` + contactForm('Chcesz dokładną wycenę? Zostaw kontakt i dołącz zdjęcia.')
      };
    },
    kontakt: () => ({ title: 'Te prace wyceniamy indywidualnie', manual: true, noNext: true, body: contactForm('Opisz krótko zakres prac i dołącz zdjęcia — oddzwonimy z wyceną.') })
  };

  function valid(id) {
    switch (id) {
      case 'uslugi': return S.uslugi.length > 0;
      case 'warunki': return firm() ? !!S.wysokosc : !!S.stan;
      case 'sufity': return num(S.suf.m2) > 0 || num(S.suf.led) > 0 || num(S.suf.karnisz) > 0;
      case 'zabudowy': return num(S.zab.m2) > 0;
      case 'gladzie': return glSum() > 0;
      case 'malowanie': return !!S.mal.kolory && paintArea() > 0;
      case 'tapeta': return num(S.tap.m2) > 0;
      default: return !!S[id];
    }
  }

  function contactForm(lead) {
    return `<form class="wz-form" id="wzForm" novalidate data-mode="${mode}">
      <p class="wz-form-lead">${esc(lead)}</p>
      <div class="wz-seg wz-mode" role="group" aria-label="Jak się skontaktować">
        <button type="button" data-mode="telefon" aria-pressed="${mode === 'telefon'}">📞 Zadzwońcie do mnie</button>
        <button type="button" data-mode="zdjecia" aria-pressed="${mode === 'zdjecia'}">📷 Wyślę zdjęcia do wyceny</button>
      </div>
      <p class="wz-mode-info" data-only="telefon">Zostaw numer — oddzwonimy w wybranej porze. Podaj e-mail, a od razu wyślemy Ci podsumowanie tej wyceny.</p>
      <p class="wz-mode-info" data-only="zdjecia">Dołącz zdjęcia pomieszczeń — przygotujemy dokładniejszą wycenę. Podsumowanie wyślemy na Twój e-mail.</p>
      <div class="wz-grid">
        <label class="wz-field"><span>Imię *</span><input name="imie" autocomplete="given-name" maxlength="80"></label>
        <label class="wz-field"><span>Telefon *</span><input name="telefon" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="np. 600 100 200"></label>
        <label class="wz-field" data-only="telefon"><span>Kiedy najlepiej zadzwonić?</span><select name="kiedy"><option>Jak najszybciej</option><option>Rano (8–12)</option><option>Po południu (12–17)</option><option>Wieczorem (17–20)</option><option>W weekend</option></select></label>
        <label class="wz-field"><span>E-mail <small>(wyślemy podsumowanie)</small></span><input name="email" type="email" autocomplete="email" maxlength="120"></label>
        <label class="wz-field"><span>Miejscowość<b data-only="zdjecia"> *</b></span><input name="miejscowosc" autocomplete="address-level2" maxlength="80" placeholder="np. Bielsko-Biała"></label>
        <label class="wz-field" data-only="zdjecia"><span>Kiedy chcesz zacząć?</span><select name="termin"><option>Jak najszybciej</option><option>W ciągu miesiąca</option><option>Za 1–3 miesiące</option><option>Termin elastyczny</option></select></label>
        <label class="wz-field wz-full" data-only="zdjecia"><span>Dodatkowe informacje</span><textarea name="wiadomosc" rows="3" maxlength="3000" placeholder="Np. liczba pomieszczeń, pęknięcia, preferowane dni, szczegóły wnęk"></textarea></label>
      </div>
      <div class="wz-photos" data-only="zdjecia">
        <label class="wz-upload"><input type="file" id="wzFiles" accept="image/*" multiple><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l2-3h6l2 3h3v12H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>Dodaj zdjęcia pomieszczeń</span><small>Do ${MAX_PHOTOS} zdjęć. Zmniejszymy je automatycznie.</small></label>
        <ul class="wz-thumbs" id="wzThumbs"></ul>
      </div>
      <label class="wz-hp" aria-hidden="true">Strona www<input name="strona_www" tabindex="-1" autocomplete="off"></label>
      <label class="wz-check"><input type="checkbox" name="zgoda"><span>Zgadzam się na kontakt telefoniczny i e-mailowy w sprawie wyceny. Dane wykorzystamy wyłącznie do przygotowania oferty, a na prośbę wysłaną na kontakt@malowaniebielsko.pl usuniemy je. *</span></label>
      <p class="wz-error" id="wzError" role="alert" hidden></p>
      <button class="wz-submit" type="submit">${mode === 'telefon' ? 'Zamów rozmowę' : 'Wyślij zgłoszenie'}</button>
      <p class="wz-or">albo zadzwoń: <a href="tel:+48726747602">726 747 602</a></p>
    </form>`;
  }

  /* ---------- render ---------- */
  function render(focus = true) {
    const list = steps();
    step = Math.min(step, list.length - 1);
    const id = list[step];
    const v = VIEWS[id]();
    const total = Math.max(list.length, 5);
    const pct = Math.round(((step + 1) / total) * 100);
    root.innerHTML = `
      <div class="wz-top"><button type="button" class="wz-back" data-back ${step === 0 ? 'hidden' : ''}>← Wstecz</button><span class="wz-count">Krok ${step + 1}${list.length > 3 ? ` z ${list.length}` : ''}</span></div>
      <div class="wz-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <h2 class="wz-title" tabindex="-1">${v.title}</h2>
      ${v.hint ? `<p class="wz-hint">${v.hint}</p>` : ''}
      <div class="wz-body">${v.body}</div>
      ${v.manual && !v.noNext ? `<button type="button" class="wz-next" data-next>${list[step + 1] === 'wynik' ? 'Pokaż wycenę' : 'Dalej'}</button>` : ''}`;
    refresh();
    if (root.querySelector('#wzForm')) bindForm();
    if (focus) root.querySelector('.wz-title').focus({ preventScroll: true });
    if (focus && root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    track('wycena_krok', { krok: id });
  }

  function refresh() {
    const id = steps()[step];
    const btn = root.querySelector('[data-next]');
    if (btn) btn.disabled = !valid(id);
    const out = root.querySelector('#wzCalc');
    if (!out) return;
    if (id === 'gladzie') out.textContent = glSum() ? `Razem gładzi: ${zl.format(glSum())} m².` : '';
    if (id === 'malowanie') out.textContent = !paintSame() && S.mal.tryb === 'podloga' && paintArea() ? `To orientacyjnie ok. ${zl.format(paintArea())} m² do malowania.` : '';
  }

  root.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-back]')) { step = Math.max(0, step - 1); render(); return; }
    if (t.closest('[data-next]')) { if (valid(steps()[step])) { step++; render(); } return; }
    const multi = t.closest('[data-multi]');
    if (multi) {
      const v = multi.dataset.value;
      S.uslugi = has(v) ? S.uslugi.filter(x => x !== v) : [...S.uslugi, v];
      multi.setAttribute('aria-pressed', has(v)); refresh(); return;
    }
    const sg = t.closest('[data-seg]');
    if (sg) { setPath(sg.dataset.seg, sg.dataset.value); render(false); return; }
    const opt = t.closest('[data-set]');
    if (opt) {
      const name = opt.dataset.set, value = opt.dataset.value;
      if (name === 'klient' && S.klient !== value) { S.obiekt = null; S.stan = null; S.wysokosc = null; }
      S[name] = value;
      if (VIEWS[steps()[step]]().manual) { render(false); return; }
      opt.setAttribute('aria-pressed', 'true');
      setTimeout(() => { step++; render(); }, 140);
    }
  });
  root.addEventListener('change', e => {
    const c = e.target.dataset.check;
    if (c) { setPath(c, e.target.checked); if (c === 'mal.teSame') render(false); else refresh(); }
  });
  root.addEventListener('input', e => { const p = e.target.dataset.path; if (p) { setPath(p, e.target.value); refresh(); } });
  root.addEventListener('keydown', e => { if (e.target.dataset.path && e.key === 'Enter') { e.preventDefault(); root.querySelector('[data-next]')?.click(); } });

  /* ---------- zdjęcia ---------- */
  async function shrink(file) {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
      if (blob) return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch (_) { /* format nieobsługiwany przez przeglądarkę — wyślij oryginał */ }
    return file.size <= 6 * 1024 * 1024 ? file : null;
  }
  function drawThumbs() {
    const ul = root.querySelector('#wzThumbs');
    if (!ul) return;
    ul.innerHTML = photos.map((p, i) => `<li><img src="${p.url}" alt=""><button type="button" data-remove="${i}" aria-label="Usuń zdjęcie ${i + 1}">×</button></li>`).join('');
  }

  function bindForm() {
    const form = root.querySelector('#wzForm');
    const input = root.querySelector('#wzFiles');
    const err = root.querySelector('#wzError');
    drawThumbs();
    input.addEventListener('change', async () => {
      err.hidden = true;
      for (const f of [...input.files]) {
        if (photos.length >= MAX_PHOTOS) { err.textContent = `Możesz dodać maksymalnie ${MAX_PHOTOS} zdjęć.`; err.hidden = false; break; }
        const small = await shrink(f);
        if (small) photos.push({ file: small, url: URL.createObjectURL(small) });
      }
      input.value = '';
      drawThumbs();
    });
    root.querySelector('#wzThumbs').addEventListener('click', e => {
      const b = e.target.closest('[data-remove]');
      if (!b) return;
      const [p] = photos.splice(+b.dataset.remove, 1);
      URL.revokeObjectURL(p.url); drawThumbs();
    });
    form.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode; form.dataset.mode = mode;
      form.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === mode));
      form.querySelector('.wz-submit').textContent = mode === 'telefon' ? 'Zamów rozmowę' : 'Wyślij zgłoszenie';
      err.hidden = true;
    }));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      err.hidden = true;
      const fail = (msg, el) => { err.textContent = msg; err.hidden = false; el?.focus(); };
      if (!form.imie.value.trim()) return fail('Podaj imię.', form.imie);
      if (form.telefon.value.replace(/\D/g, '').length < 9) return fail('Podaj poprawny numer telefonu.', form.telefon);
      if (form.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email.value.trim())) return fail('Sprawdź adres e-mail.', form.email);
      if (mode === 'zdjecia' && !form.miejscowosc.value.trim()) return fail('Podaj miejscowość.', form.miejscowosc);
      if (!form.zgoda.checked) return fail('Zaznacz zgodę na kontakt.', form.zgoda);
      const btn = form.querySelector('.wz-submit');
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Wysyłam…';
      const fd = new FormData(form);
      fd.set('rodzaj', mode);
      if (mode === 'telefon') { fd.delete('termin'); fd.delete('wiadomosc'); } else fd.delete('kiedy');
      fd.set('podsumowanie', summary());
      if (anyPriced()) { const q = quote(); fd.set('wycena_json', JSON.stringify({ lines: q.lines, total: q.total, minimum: q.minimum, notes: q.notes, individual: q.individual })); }
      if (mode === 'zdjecia') photos.forEach((p, i) => fd.append('zdjecia', p.file, `zdjecie-${i + 1}-${p.file.name}`));
      try {
        const res = await fetch(API, { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Błąd wysyłki');
        track(mode === 'telefon' ? 'oddzwonienie_zamowione' : 'wycena_wyslana', { uslugi: S.uslugi.join(','), klient: S.klient });
        const mail = form.email.value.trim();
        const when = form.kiedy?.value;
        root.innerHTML = `<div class="wz-done"><span aria-hidden="true">✓</span><h2 class="wz-title" tabindex="-1">Dziękujemy, ${esc(form.imie.value.trim())}!</h2>
          <p>${mode === 'telefon' ? `Zadzwonimy na numer <strong>${esc(form.telefon.value.trim())}</strong>${when && when !== 'Jak najszybciej' ? ` — ${esc(when.toLowerCase())}` : ' najszybciej, jak to możliwe'}.` : 'Zgłoszenie ze zdjęciami dotarło. Przygotujemy wycenę i oddzwonimy — zwykle tego samego lub następnego dnia roboczego.'}</p>
          ${mail && data.mailed ? `<p>Podsumowanie wyceny wysłaliśmy na <strong>${esc(mail)}</strong>. Sprawdź też folder Oferty lub Spam.</p>` : ''}
          <a class="wz-submit" href="tel:+48726747602">Pilne? Zadzwoń: 726 747 602</a></div>`;
        root.querySelector('.wz-title').focus();
      } catch (ex) {
        btn.disabled = false; btn.textContent = label;
        const body = encodeURIComponent(`Dzień dobry,\n${mode === 'telefon' ? 'proszę o telefon w sprawie wyceny.' : 'proszę o wycenę.'}\n\n${summary()}\n\nImię: ${form.imie.value}\nTelefon: ${form.telefon.value}\nMiejscowość: ${form.miejscowosc.value}\n${form.wiadomosc?.value || ''}`);
        err.innerHTML = `Nie udało się wysłać formularza. Zadzwoń: <a href="tel:+48726747602">726 747 602</a> albo <a href="mailto:kontakt@malowaniebielsko.pl?subject=${encodeURIComponent('Wycena ze strony')}&body=${body}">wyślij e-mail z podsumowaniem</a>.`;
        err.hidden = false;
      }
    });
  }
  function track(event, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
    if (event === 'wycena_wyslana' && typeof window.fbq === 'function') window.fbq('track', 'Lead');
  }

  render(false);
})();
