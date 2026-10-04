# Development dependency security

The Obsidian development package pins Moment 2.29.4, including through the
Obsidian lint plugin. [Dependabot alert 1](https://github.com/grobmeier/firstdraft/security/dependabot/1)
reports GHSA-4p3w-j4w9-5jqw, patched in Moment 2.31.0.

`package.json` narrowly overrides Moment to **2.31.0** and the lockfile resolves
all development copies to that version. Moment is not a First Draft runtime
dependency; this does not update the Moment version inside users' Obsidian apps.
Remove the override only after upstream tooling requests a patched release and
the complete dependency tree remains clean.

On Node 24, run `npm ci --ignore-scripts`, `npm ls moment`, `npm audit`, then the
build, lint and test suite. The 2026-10-03 local audit reports zero vulnerabilities.
The hosted alert remains open until this change reaches GitHub and is rescanned;
do not dismiss the alert as a substitute for shipping the patched lockfile.
