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
function closeDialog(dialog) { dialog.close(); }

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
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth' });
    history.replaceState(null, '', link.getAttribute('href'));
  });
});

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
