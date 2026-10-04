# Changelog

All notable changes to First Draft are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Read-only continuity inspector with source-linked character identity/link checks,
  optional dossier and empty-scene/missing-time advice, stale-evidence guards and
  explicit incomplete-scope reporting.
- Scene workspace in the palette and command palette for standalone scripts and
  explicitly ordered projects: click-to-jump, active-scene highlighting, search,
  part/character/location/time filters and approximate page positions.
- Scene creation, portable `= Synopsis` editing, same-file Up/Down and explicit
  destination moves, with normal editor undo for single-file changes.
- Confirmed cross-part moves with a local pre-move recovery copy, destination-first
  writes, stale-source checks, rollback and conflict-aware restore.

### Fixed

- Override the vulnerable development-only Moment dependency with patched 2.31.0.
- Same-file scene transactions leave unchanged frontmatter and surrounding text
  outside the replacement range.

- Exclude Fountain synopsis lines from screenplay statistics, preview and PDF
  output while preserving them in source and Fountain export.

### Known limitations

- Scripts with sections, dual dialogue, boneyards, multiline notes or fenced code
  remain navigable, but scene mutations are disabled to protect boundaries.
- Cross-part moves require saved notes and ordinary non-hidden note paths.
- Initial desktop user acceptance passed. Focused undo/conflict interaction
  checks and physical mobile acceptance remain outstanding; automated tests
  do not establish device compatibility.

## [0.12.0] - 2026-10-01

### Added

- Optional unnumbered title pages from Fountain title blocks or screenplay/project
  Markdown properties, with body numbering starting at 1.
- Dialogue pagination with `(MORE)` and repeated `(CONT'D)` speaker cues;
  keep short speeches and parentheticals with their dialogue where possible.
- Offline horizontal Chinese, Japanese and Korean PDFs with regional glyph
  selection, measured wrapping and embedded Noto fonts.
- Bundled Liberation Mono fonts for broader Latin, Greek and Cyrillic PDF text.

### Fixed

- Stop PDF export with explicit missing-glyph or oversized-metadata diagnostics
  instead of silently substituting text or clipping indivisible blocks.
- Include current editor title metadata in preview and export without modifying
  screenplay source.
- Improve screenplay activation controls and command-palette access.

### Known limitations

- The bundle is approximately 33 MB. Physical iPhone memory/performance testing
  remains outstanding; CJK preview pagination is approximate.

## [0.11.0] - 2026-09-29

### Added

- Add a read-only screenplay preview for standalone files and ordered
  multi-file projects.
- Export local, non-destructive US Letter or A4 PDFs with Courier typography,
  screenplay element positioning, deterministic wrapping, page breaks, and
  page numbers.
- Add a visual feature tour, publication-ready screenshots, and a short
  preview-to-PDF demo.

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

[Unreleased]: https://github.com/grobmeier/firstdraft/compare/0.12.0...HEAD
[0.12.0]: https://github.com/grobmeier/firstdraft/releases/tag/0.12.0
[0.11.0]: https://github.com/grobmeier/firstdraft/releases/tag/0.11.0
[0.10.2]: https://github.com/grobmeier/firstdraft/releases/tag/0.10.2
[0.10.1]: https://github.com/grobmeier/firstdraft/releases/tag/0.10.1
[0.10.0]: https://github.com/grobmeier/firstdraft/releases/tag/0.10.0
