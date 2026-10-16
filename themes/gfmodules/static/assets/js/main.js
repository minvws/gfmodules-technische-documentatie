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
