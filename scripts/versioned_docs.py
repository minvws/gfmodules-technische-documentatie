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
    return (isinstance(value, str) and value.startswith("v") and len(value) > 1
            and value != "versions.json"
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


def configured_release_refs(config):
    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate configuration key: {key}")
            result[key] = value
        return result

    data = json.loads(config.read_text(encoding="utf-8"), object_pairs_hook=unique_object)
    if not isinstance(data, dict) or set(data) != {"versions"} or not isinstance(data["versions"], dict):
        raise ValueError("configuration must contain a versions mapping")
    releases = []
    for version, source in sorted(data["versions"].items()):
        if not valid_version(version):
            raise ValueError(f"invalid version path: {version}")
        if not isinstance(source, str):
            raise ValueError(f"invalid source for {version}")
        if re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", source):
            ref = source
        else:
            ref = f"refs/tags/{source}"
            subprocess.run(["git", "check-ref-format", ref], check=True, capture_output=True)
        commit = subprocess.check_output(
            ["git", "rev-parse", "--verify", f"{ref}^{{commit}}"],
            text=True, stderr=subprocess.PIPE).strip()
        releases.append((version, ref, commit))
    return releases


def reconcile(stored, versions):
    if not stored.exists():
        return
    manifest_path = stored / "versions.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict) or not isinstance(manifest.get("versions"), list):
        raise ValueError("invalid cached manifest")
    entries = manifest["versions"]
    ids = set()
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("id"), str):
            raise ValueError("invalid cached manifest entry")
        version = entry["id"]
        if (version != "latest" and not valid_version(version)) or version in ids:
            raise ValueError(f"invalid cached version: {version}")
        if not (stored / version).is_dir() or (stored / version).is_symlink():
            raise ValueError(f"missing or unsafe cached version: {version}")
        ids.add(version)
    for child in stored.iterdir():
        if child.is_dir() and (child.name == "latest" or valid_version(child.name)) and child.name not in ids:
            raise ValueError(f"unlisted cached version: {child.name}")
    kept = versions | {"latest"}
    for version in ids - kept:
        shutil.rmtree(stored / version)
    manifest["versions"] = [entry for entry in entries if entry["id"] in kept]
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


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
    if version == "latest" and (build / "404.html").is_file():
        shutil.copyfile(build / "404.html", output / "404.html")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check-version", action="store_true",
                      help="validate the version without staging files")
    mode.add_argument("--list-releases", action="store_true",
                      help="list the selected version, source ref, and commit for each release")
    mode.add_argument("--reconcile", action="store_true",
                      help="remove cached releases absent from the configuration")
    parser.add_argument("--commit")
    parser.add_argument("--stored", type=Path)
    parser.add_argument("--build", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        if args.reconcile:
            if args.stored is None:
                parser.error("--reconcile requires --stored")
            reconcile(args.stored, {version for version, _, _ in configured_release_refs(Path("versions.json"))})
            return
        if args.list_releases:
            for version, ref, commit in configured_release_refs(Path("versions.json")):
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
