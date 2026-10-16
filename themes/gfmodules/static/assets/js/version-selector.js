(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.DocsVersions = api;
  }
})(typeof globalThis === 'object' ? globalThis : this, function () {
  function safeVersion(value) {
    return typeof value === 'string' && value.length > 0 && value !== '.' && value !== '..'
      && !/[/\\:?#%\s\x00-\x1f\x7f-\x9f+\-]/.test(value);
  }

  function validateManifest(manifest, currentVersion) {
    if (!manifest || !Array.isArray(manifest.versions) || manifest.versions.length === 0) {
      throw new Error('Ongeldig versiemanifest');
    }
    const seen = new Set();
    const versions = manifest.versions.map(entry => {
      if (!entry || seen.has(entry.id)) throw new Error('Ongeldige of dubbele documentatieversie');
      const validEdition = entry.id === 'latest'
        ? entry.version === null
        : safeVersion(entry.id) && safeVersion(entry.version);
      if (!validEdition) {
        throw new Error('Ongeldige documentatieversie');
      }
      seen.add(entry.id);
      return { id: entry.id, version: entry.version };
    });
    if (!seen.has(currentVersion)) {
      throw new Error('De huidige documentatieversie ontbreekt');
    }
    return versions;
  }

  function publicationRoot(docsRoot, currentURL) {
    const root = new URL(docsRoot, currentURL);
    if (!['http:', 'https:'].includes(root.protocol) || root.search || root.hash) {
      throw new Error('Ongeldige publicatieroot');
    }
    root.pathname = root.pathname.replace(/\/?$/, '/');
    return root;
  }

  function versionURL(docsRoot, currentVersion, targetVersion, currentURL, editionBase) {
    const root = publicationRoot(docsRoot, currentURL);
    const current = new URL(currentURL);
    const currentBase = editionBase
      ? publicationRoot(editionBase, currentURL)
      : new URL(`${currentVersion}/`, root);
    const target = new URL(`${targetVersion.id}/`, root);
    if (current.origin !== currentBase.origin) return target.href;
    if (current.pathname === currentBase.pathname.slice(0, -1)) {
      target.pathname = target.pathname.slice(0, -1);
    } else if (current.pathname.startsWith(currentBase.pathname)) {
      target.pathname += current.pathname.slice(currentBase.pathname.length);
    } else {
      return target.href;
    }
    target.search = current.search;
    target.hash = current.hash;
    return target.href;
  }

  async function loadManifest(docsRoot, currentVersion, currentURL, fetchManifest = globalThis.fetch) {
    const manifestURL = new URL('versions.json', publicationRoot(docsRoot, currentURL));
    const response = await fetchManifest(manifestURL.href, { cache: 'no-store' });
    if (!response.ok) throw new Error('Documentatieversies zijn niet beschikbaar');
    return validateManifest(await response.json(), currentVersion);
  }

  return { validateManifest, versionURL, loadManifest };
});
