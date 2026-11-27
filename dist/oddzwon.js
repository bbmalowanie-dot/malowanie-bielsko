/* Szybki formularz „Oddzwonimy” — wysyła prośbę o telefon na /api/wycena. */
document.querySelectorAll('form[data-callback]').forEach(form => {
  const msg = form.querySelector('.cb-msg');
  const show = (text, ok) => { msg.textContent = text; msg.hidden = false; msg.style.color = ok ? '' : '#9b2c1c'; };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.imie.value.trim()) return show('Podaj imię.'), form.imie.focus();
    if (form.telefon.value.replace(/\D/g, '').length < 9) return show('Podaj poprawny numer telefonu.'), form.telefon.focus();
    if (!form.zgoda.checked) return show('Zaznacz zgodę na kontakt.'), form.zgoda.focus();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Wysyłam…';
    const fd = new FormData(form);
    fd.set('rodzaj', 'telefon');
    fd.set('podsumowanie', `Szybka prośba o telefon ze strony ${location.pathname}`);
    try {
      const res = await fetch('/api/wycena', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error();
      window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'oddzwonienie_zamowione', zrodlo: 'strona_glowna' });
      if (typeof window.fbq === 'function') window.fbq('track', 'Contact');
      form.innerHTML = `<p class="cb-msg"><strong>Dziękujemy!</strong> Zadzwonimy na numer ${fd.get('telefon').replace(/[<>&"]/g, '')}${fd.get('kiedy') !== 'Jak najszybciej' ? ' — ' + fd.get('kiedy').toLowerCase() : ' najszybciej, jak to możliwe'}.</p>`;
    } catch {
      btn.disabled = false; btn.textContent = 'Zamów rozmowę';
      show('Nie udało się wysłać. Zadzwoń bezpośrednio: 726 747 602.');
    }
  });
});
