#!/usr/bin/env python3
"""Select, validate, or stage Hugo documentation versions."""

import argparse
from itertools import combinations
import json
from pathlib import Path
import re
import shutil
import subprocess


def valid_version(value):
    return (isinstance(value, str) and bool(value)
            and value not in {"v", ".", "..", ".git", ".github", "latest", "index.html", "versions.json"}
            and not re.search(r"[/\\:?#%+\-\s\x00-\x1f\x7f-\x9f\ufeff]", value))


def load_versions(stored):
    manifest = stored / "versions.json"
    entries = json.loads(manifest.read_text(encoding="utf-8"))["versions"] if manifest.exists() else []
    return {entry["id"]: entry for entry in entries}


def natural_key(value):
    return tuple((1, int(part)) if part.isdecimal() else (0, part)
                 for part in re.split(r"(\d+)", value))


def version_key(entry):
    version = (entry["version"] or "").removeprefix("v")
    return entry["id"] == "latest", natural_key(version.casefold())


def select_release_refs(refs):
    selected = {}
    for ref in sorted(refs, key=lambda ref: (natural_key(ref.replace("+", "-")), ref)):
        version = re.split(r"[-+]", ref.removeprefix("refs/tags/"), maxsplit=1)[0]
        selected[version] = ref
    return selected


def stage(stored, build, output, version, commit=None):
    paths = [path.resolve() for path in (stored, build, output)]
    for left, right in combinations(paths, 2):
        if left == right or left in right.parents or right in left.parents:
            raise ValueError("stored, build and output directories must not overlap")
    if not (build / "index.html").is_file():
        raise ValueError(f"build is missing index.html: {build}")
    editions = load_versions(stored)
    editions[version] = {
        "id": version,
        "version": None if version == "latest" else version,
        "commit": commit,
    }

    if output.exists():
        shutil.rmtree(output)
    if stored.exists():
        shutil.copytree(stored, output, ignore=shutil.ignore_patterns(".git"))
    else:
        output.mkdir(parents=True)
    selected = output / version
    if selected.exists():
        shutil.rmtree(selected)
    shutil.copytree(build, selected, ignore=shutil.ignore_patterns(".git"))

    # Keep saved pages compatible with the shared version manifest.
    selector = Path("assets/js/version-selector.js")
    if (build / selector).is_file():
        for edition in editions:
            destination = output / edition / selector
            if destination.is_file():
                shutil.copyfile(build / selector, destination)
    ordered = sorted(editions.values(), key=lambda entry: entry["id"])
    ordered.sort(key=version_key, reverse=True)
    manifest = {"versions": ordered}
    (output / "versions.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    shutil.copyfile(Path(__file__).resolve().parent / "versioned_docs" / "index.html",
                    output / "index.html")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check-version", action="store_true",
                      help="validate the version without staging files")
    mode.add_argument("--list-releases", action="store_true",
                      help="list the selected version, source tag, and commit for each release")
    parser.add_argument("--commit")
    parser.add_argument("--stored", type=Path)
    parser.add_argument("--build", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        if args.list_releases:
            refs_output = subprocess.check_output(
                ["git", "for-each-ref", "--format=%(refname)", "refs/tags/v*"],
                text=True)
            refs = [ref for ref in refs_output.split("\n") if ref]
            for version, ref in select_release_refs(refs).items():
                commit = subprocess.check_output(
                    ["git", "rev-parse", f"{ref}^{{commit}}"], text=True).strip()
                print(f"{version}\t{ref}\t{commit}")
            return
        if args.version is None:
            parser.error("the following arguments are required: --version")
        if args.version != "latest" and not valid_version(args.version):
            raise ValueError(f"invalid version path: {args.version}")
        if args.check_version:
            return
        missing = [f"--{name}" for name in ("stored", "build", "output")
                   if getattr(args, name) is None]
        if missing:
            parser.error(f"the following arguments are required: {', '.join(missing)}")
        stage(args.stored, args.build, args.output, args.version, args.commit)
    except (KeyError, TypeError, ValueError, OSError, subprocess.CalledProcessError) as error:
        parser.exit(1, f"error: {error}\n")


if __name__ == "__main__":
    main()
