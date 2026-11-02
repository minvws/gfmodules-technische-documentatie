# Generieke Functies Technische Documentatie

This repository contains the technical documentation for the 'Generieke Functies, lokalisatie en addressering' project
of the Ministry of Health, Welfare and Sport of the Dutch government.

The documentation covers services and integration patterns for
the Generieke Functies. It is published as a static site using
[Hugo](https://gohugo.io).

Read the [latest documentation](https://minvws.github.io/gfmodules-technische-documentatie/latest/).

> [!CAUTION]
>
> ## Disclaimer
>
> This project and all associated code serve solely as **documentation and
> demonstration purposes** to illustrate potential system communication
> patterns and architectures.
>
> This codebase:
>
> - Is NOT intended for production use
> - Does NOT represent a final specification
> - Should NOT be considered feature-complete or secure
> - May contain errors, omissions, or oversimplified implementations
> - Has NOT been tested or hardened for real-world scenarios
>
> The code examples are *only* meant to help understand concepts and
> demonstrate possibilities.
>
> By using or referencing this code, you acknowledge that you do so at your
> own risk and that the authors assume no liability for any consequences of
> its use.

## Prerequisites

- [Hugo](https://gohugo.io/installation/) extended edition

## Usage

To preview the documentation locally, run from the repository root:

```bash
hugo server
```

Hugo will print a local URL (usually `http://localhost:1313/gfmodules-technische-documentatie/`).

To test the version selector locally with sample versions (requires Python 3):

```bash
bash scripts/preview-versioned-docs.sh v1 v1.2.3
```

Open <http://localhost:8000/>. Press Ctrl+C to stop and remove the temporary preview files.

## Publishing

GitHub Actions publishes to [GitHub Pages](https://minvws.github.io/gfmodules-technische-documentatie/)
only on pushes to `main`. `/latest/` is always built from `main`; pushing a
tag alone does not deploy.

Configure release paths and source tags or full commit hashes in the root `versions.json`:

```json
{
  "versions": {
    "v1.0": "3b1ee5f44795d6d59841e9704b99f412e329b511",
    "v2.0": "v2.0.0"
  }
}
```

This publishes the pinned commit at `/v1.0/` and tag `v2.0.0` at `/v2.0/` on the
next main deployment. Version paths must start with `v` and cannot contain
URL separators, whitespace, `+` or `-`. Tags must already exist and point to
commits. Full commit hashes pin releases even if tags are moved. An invalid
configuration, missing tag, or missing commit fails the build.

An empty mapping publishes only `/latest/`. Removing a mapping removes that
version from the next deployment. Cached releases are reused when their
configured source still resolves to the same commit; new or changed releases
are rebuilt.

## Contribution

As stated in the [Disclaimer](#disclaimer) this project and all associated
code serve solely as documentation and demonstration purposes to illustrate
potential system communication patterns and architectures.

For that reason we will only accept contributions that fit this goal. We do
appreciate any effort from the community, but because our time is limited
it is possible that your PR or issue is closed without a full justification.

If you plan to make non-trivial changes, we recommend opening an issue
beforehand where we can discuss your planned changes. This increases the
chance that we might be able to use your contribution (or it avoids doing
work if there are reasons why we wouldn't be able to use it).

Note that all commits should be signed using a gpg key.

When starting to introduce changes, it is important to leave user specific
files such as IDE or text-editor settings outside the repository. For this,
create a local `.gitignore` file and configure git like below.

```bash
git config --global core.excludesfile ~/.gitignore
```
