'use strict';

const header = document.querySelector('#siteHeader');
const landing = document.querySelector('#start');
const menu = document.querySelector('#menuDialog');
const menuToggle = document.querySelector('.menu-toggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add('dialog-open');
}
function closeDialog(dialog) {
  dialog.close();
  document.body.classList.remove('dialog-open');
}

function scrollToContact(behavior = reduceMotion.matches ? 'instant' : 'smooth') {
  const title = document.querySelector('#contactTitle');
  const section = document.querySelector('#kontakt');
  if (!title || !section) return;

  // Measure the compact header before scrolling, including its mobile layout.
  // The title starts directly below it, matching the contact section reference.
  header.classList.add('is-aligning-contact', 'is-fixed');
  const top = window.scrollY + title.getBoundingClientRect().top - header.offsetHeight;
  section.setAttribute('tabindex', '-1');
  section.focus({ preventScroll: true });
  window.scrollTo({ top: Math.max(0, top), behavior });
  requestAnimationFrame(() => header.classList.remove('is-aligning-contact'));
}

menuToggle.addEventListener('click', () => {
  openDialog(menu);
  menuToggle.setAttribute('aria-expanded', 'true');
});

for (const dialog of [menu]) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (dialog === menu) menuToggle.setAttribute('aria-expanded', 'false');
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
  });
}

menu.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    closeDialog(menu);
    if (link.hash === '#kontakt') {
      history.replaceState(null, '', link.getAttribute('href'));
      scrollToContact();
      return;
    }
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth' });
    history.replaceState(null, '', link.getAttribute('href'));
  });
});

// Apply the same alignment to quote buttons and links arriving from subpages.
document.querySelectorAll('a[href="#kontakt"]').forEach(link => {
  if (menu.contains(link)) return;
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.replaceState(null, '', '#kontakt');
    scrollToContact();
  });
});
const alignContactHash = () => {
  if (location.hash === '#kontakt') scrollToContact('instant');
};
window.addEventListener('hashchange', alignContactHash);
window.addEventListener('load', alignContactHash, { once: true });
if (location.hash === '#kontakt') requestAnimationFrame(alignContactHash);

if ('IntersectionObserver' in window) {
  if (landing) {
    const headerObserver = new IntersectionObserver(entries => {
      header.classList.toggle('is-fixed', !entries[0].isIntersecting);
    }, { threshold: 0 });
    headerObserver.observe(landing);
  }

  if (!reduceMotion.matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .07, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.reveal').forEach(element => {
      element.classList.add('pending');
      revealObserver.observe(element);
    });
  }
}

document.querySelectorAll('.service').forEach(service => {
  service.addEventListener('toggle', () => {
    if (!service.open) return;
    document.querySelectorAll('.service').forEach(other => {
      if (other !== service) other.open = false;
    });
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();
