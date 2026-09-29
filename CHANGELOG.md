# Changelog

All notable changes to First Draft are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Discover screenplay projects through explicit links and nearby project notes
  instead of enumerating every Markdown file in the vault.
- Limit character discovery to the configured character folder.
- Present selectable cheat-sheet examples without reading or writing the system
  clipboard.

## [0.10.2] - 2026-09-28

### Changed

- Split the First Draft Palette into focused character, project, screenplay,
  and recent-item modules while preserving its existing behaviour.
- Update the GitHub Actions runtime and compatible development dependencies.
- Adopt TypeScript 6 and remove deprecated compiler configuration.

## [0.10.1] - 2026-09-28

### Fixed

- Preserve the user's dock placement when First Draft unloads.
- Use popout-window-safe timers and remove unnecessary type assertions.
- Make command names concise and searchable without repeating the plugin name.
- Adopt Obsidian's declarative settings API and remove deprecated slider calls.
- Check export-name collisions without enumerating every vault file.
- Publish only Obsidian-supported assets with GitHub build-provenance
  attestations.

## [0.10.0] - 2026-09-28

### Added

- Fountain-aware editing, autocomplete, statistics, runtime estimates, and
  keyboard-first screenplay commands.
- Non-destructive Fountain and Final Draft FDX exports.
- A dockable First Draft Palette with contextual and recent actions.
- Portable Markdown character dossiers, relationship graphs, derived usage,
  and deterministic consistency checks.
- Ordered multi-file screenplay projects with project-wide navigation,
  statistics, checks, exports, and project-local character folders.
- Vertically stacked project-part links, a conflict-safe example screenplay
  generator, and an offline screenplay/Fountain cheat sheet.
- Local-only operation without telemetry, accounts, or network access.

### Compatibility

- Requires Obsidian 1.13.7 or later.
- Declares desktop and mobile support. See the physical-device checklist in
  `docs/MOBILE_TESTING.md`.
- FDX export intentionally supports the six core screenplay element types; see
  `docs/FDX_COMPATIBILITY.md`.

[Unreleased]: https://github.com/grobmeier/firstdraft/compare/0.10.2...HEAD
[0.10.2]: https://github.com/grobmeier/firstdraft/releases/tag/0.10.2
[0.10.1]: https://github.com/grobmeier/firstdraft/releases/tag/0.10.1
[0.10.0]: https://github.com/grobmeier/firstdraft/releases/tag/0.10.0
