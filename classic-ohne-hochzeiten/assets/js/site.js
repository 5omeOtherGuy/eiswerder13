(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  const mobile = matchMedia('(max-width: 760px)');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    navigation.dataset.collapsed = mobile.matches ? 'true' : 'false';
  }
  menu.hidden = false;
  closeMenu();
  mobile.addEventListener('change', closeMenu);
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.dataset.collapsed = String(!open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });

  const form = document.querySelector('#request-form');
  if (form) {
    const occasion = new URLSearchParams(location.search).get('anlass');
    if ([...form.elements.anlass.options].some(option => option.value === occasion)) form.elements.anlass.value = occasion;
    const germanDate = value => value ? value.split('-').reverse().join('.') : '';
    let copyText = '';
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const occasionText = form.elements.anlass.selectedOptions[0].text;
      const subject = `Anfrage InselSalon – ${occasionText} am ${germanDate(data.get('datum'))}`;
      const lines = ['Guten Tag an das Team des InselSalons,', '', 'ich möchte den InselSalon anfragen.', '', `Anlass: ${occasionText}`];
      const entries = [
        ['datum', 'Wunschtermin', germanDate], ['alternativ', 'Alternativtermin', germanDate],
        ['von', 'Uhrzeit von'], ['bis', 'Uhrzeit bis'], ['dauer', 'Dauer'],
        ['erwachsene', 'Personenzahl Erwachsene'], ['kinder', 'Personenzahl Kinder']
      ];
      for (const [key, label, format] of entries) {
        const value = data.get(key);
        if (value) lines.push(`${label}: ${format ? format(value) : value}`);
      }
      const wishes = data.getAll('wunsch');
      if (wishes.length) lines.push(`Wünsche: ${wishes.join(', ')}`);
      lines.push('');
      for (const [key, label] of [['name', 'Name'], ['email', 'E-Mail'], ['telefon', 'Telefon']]) {
        if (data.get(key)) lines.push(`${label}: ${data.get(key)}`);
      }
      if (data.get('nachricht')) lines.push('', 'Nachricht:', data.get('nachricht'));
      const body = lines.join('\n').replace(/\r?\n/g, '\r\n');
      copyText = `An: info@eiswerder13.org\r\nBetreff: ${subject}\r\n\r\n${body}`;
      const note = document.querySelector('#mail-note');
      note.hidden = false;
      document.querySelector('#copy-status').textContent = '';
      document.querySelector('#copy-fallback').hidden = true;
      note.scrollIntoView({block: 'center', behavior: 'auto'});
      const mailto = `mailto:info@eiswerder13.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      // Visible recovery note is committed before handing off to the local mail application.
      requestAnimationFrame(() => { location.href = mailto; });
    });
    document.querySelector('#copy-request').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyText);
        document.querySelector('#copy-status').textContent = 'Text kopiert. Sie können ihn in Ihre E-Mail einfügen.';
      } catch {
        const fallback = document.querySelector('#copy-fallback');
        fallback.hidden = false; fallback.value = copyText; fallback.focus(); fallback.select();
        document.querySelector('#copy-status').textContent = 'Bitte den markierten Text kopieren und in Ihre E-Mail einfügen.';
      }
    });
  }

  const dialog = document.querySelector('.lightbox');
  if (dialog) {
    let links = [], current = 0, opener;
    const image = dialog.querySelector('#lightbox-image');
    function show(index) {
      current = (index + links.length) % links.length;
      const link = links[current];
      image.src = link.href;
      image.alt = link.dataset.caption;
      dialog.querySelector('#image-caption').textContent = link.dataset.caption;
      dialog.querySelector('#image-count').textContent = `${current + 1} / ${links.length}`;
    }
    document.querySelectorAll('[data-gallery]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault(); opener = link;
      links = [...document.querySelectorAll('[data-gallery]')].filter(item => item.dataset.gallery === link.dataset.gallery);
      show(links.indexOf(link)); dialog.showModal(); dialog.querySelector('[data-close]').focus();
    }));
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-prev]').addEventListener('click', () => show(current - 1));
    dialog.querySelector('[data-next]').addEventListener('click', () => show(current + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => opener?.focus());
  }
})();
