#!/usr/bin/env bash
set -euo pipefail

preview_repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
preview_dir="$(mktemp -d)"
trap 'rm -rf "$preview_dir"' EXIT
cd "$preview_repo_dir"

if [[ $# -eq 0 ]]; then
  set -- v1.2.3
fi

for version in latest "$@"; do
  version="${version%%[-+]*}"
  HUGO_PARAMS_DOCSROOT="http://localhost:8000/" \
  HUGO_PARAMS_DOCSVERSION="$version" \
  HUGO_RESOURCEDIR="$preview_dir/resources" \
    hugo --minify --noBuildLock --cleanDestinationDir \
      --baseURL "http://localhost:8000/$version/" \
      --destination "$preview_dir/build" --cacheDir "$preview_dir/cache"

  python3 scripts/versioned_docs.py --version "$version" \
    --stored "$preview_dir/stored" --build "$preview_dir/build" \
    --output "$preview_dir/site"
  rm -rf "$preview_dir/stored"
  mv "$preview_dir/site" "$preview_dir/stored"
done

printf '\nPreview: http://localhost:8000/ (Ctrl+C to stop)\n'
python3 -m http.server 8000 --bind 127.0.0.1 --directory "$preview_dir/stored"
