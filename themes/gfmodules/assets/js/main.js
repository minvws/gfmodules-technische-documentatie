/* ===== TABS ===== */
document.querySelectorAll('[data-tabs]').forEach(container => {
  const buttons = container.querySelectorAll('.tab-btn');
  const panels  = container.querySelectorAll('.tab-panel');

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      panels[i].classList.add('active');
    });
  });
});

/* ===== INTEGRATION SECTION NAVIGATION ===== */
document.querySelectorAll('.integration-sidebar').forEach(sidebar => {
  const links = [...sidebar.querySelectorAll('a[href^="#"]')];
  const targetIds = new Set(links.map(link => link.getAttribute('href').slice(1)));
  const sections = [...document.querySelectorAll('.integration-content [id]')]
    .filter(section => targetIds.has(section.id));
  if (!sections.length) return;

  let currentId;
  let framePending = false;

  function updateCurrentSection() {
    framePending = false;
    let current = sections[0];
    sections.forEach(section => {
      const offset = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
      if (section.getBoundingClientRect().top <= offset + 1) current = section;
    });
    if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight) {
      current = sections[sections.length - 1];
    }
    if (current.id !== currentId) {
      currentId = current.id;
      links.forEach(link => {
        const active = link.getAttribute('href') === `#${currentId}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    if (sidebar.scrollHeight > sidebar.clientHeight) {
      const activeLink = links.find(link =>
        link.getAttribute('href') === `#${currentId}` && link.getClientRects().length);
      if (!activeLink) return;
      const top = sidebar.getBoundingClientRect().top + sidebar.clientTop;
      const bottom = top + sidebar.clientHeight;
      const bounds = activeLink.getBoundingClientRect();
      if (bounds.top < top) sidebar.scrollTop += bounds.top - top;
      else if (bounds.bottom > bottom) sidebar.scrollTop += bounds.bottom - bottom;
    }
  }

  function scheduleUpdate() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(updateCurrentSection);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('hashchange', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  updateCurrentSection();
});

/* ===== COPY TO CLIPBOARD ===== */
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Gekopieerd!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('copied');
    }, 1800);
  });
}

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const code = btn.closest('.endpoint-row')?.querySelector('code')?.textContent
               ?? btn.dataset.copy ?? '';
    copyText(code, btn);
  });
});

document.querySelectorAll('.copy-code').forEach(btn => {
  btn.addEventListener('click', () => {
    const pre = btn.closest('.code-block')?.querySelector('pre');
    copyText(pre?.textContent ?? '', btn);
  });
});

/* ===== SERVICE / CHANGELOG FILTERS ===== */
document.querySelectorAll('[data-filter-group]').forEach(group => {
  const key     = group.dataset.filterGroup;
  const buttons = group.querySelectorAll('.filter-btn');
  const items   = document.querySelectorAll(`[data-filter-item="${key}"]`);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const val = btn.dataset.filter;
      items.forEach(item => {
        const match = val === 'all' || item.dataset.filterVal.split(' ').includes(val);
        item.style.display = match ? '' : 'none';
      });
    });
  });
});

/* ===== DOCUMENTATION VERSIONS ===== */
document.querySelectorAll('[data-version-selector]').forEach(async container => {
  const select = container.querySelector('select');
  const currentVersion = container.dataset.docsVersion;
  const docsRoot = container.dataset.docsRoot;
  container.setAttribute('aria-busy', 'true');

  try {
    const versions = await window.DocsVersions.loadManifest(docsRoot, currentVersion, window.location.href);
    const options = versions.map(version => {
      const option = document.createElement('option');
      option.value = version.id;
      option.textContent = version.id === 'latest' ? 'Latest (ontwikkeling)' : version.id;
      return option;
    });
    select.replaceChildren(...options);
    select.value = currentVersion;
    select.addEventListener('change', () => {
      const target = versions.find(version => version.id === select.value);
      if (!target || target.id === currentVersion) return;
      // Keep the source page's version selected when returning through history.
      select.value = currentVersion;
      window.location.assign(window.DocsVersions.versionURL(
        docsRoot, currentVersion, target, window.location.href, container.dataset.editionBase
      ));
    });
    select.disabled = false;
  } catch (_) {
    container.title = 'Documentatieversies zijn tijdelijk niet beschikbaar';
  } finally {
    container.removeAttribute('aria-busy');
  }
});
