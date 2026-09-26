# First Draft

First Draft is an Obsidian community plugin for writing screenplays efficiently
in plain-text [Fountain](https://fountain.io/) syntax.

The guiding principle is simple: think about the movie, not the syntax. First
Draft adds screenplay-aware assistance while keeping every document portable,
human-readable, and useful when the plugin is not installed.

> First Draft is in early private development. It is not yet available in the
> Obsidian community-plugin directory.

## Milestone 5

The current build provides:

- screenplay mode for `.fountain` files;
- screenplay mode for Markdown notes with `screenplay: true` frontmatter;
- Fountain-aware scene and character parsing;
- a debounced status item with word and scene counts;
- screenplay-aware estimated pages for US Letter or A4;
- configurable runtime estimation based on minutes per page;
- a current-document statistics dialog with character dialogue rankings;
- parenthetical insertion with common, recently used, and custom choices;
- transition insertion with common, previously used, and custom choices;
- non-destructive export to a clean `.fountain` file;
- non-destructive Final Draft `.fdx` export for the six core screenplay element
  types;
- context-aware character, character-extension, scene-location, and time
  autocomplete;
- keyboard-first Character, Character Extension, and New Scene commands;
- settings for activation, autocomplete ranking, result limits, scene types,
  and times of day.

See [FDX compatibility](docs/FDX_COMPATIBILITY.md) for the intentionally narrow
MVP compatibility boundary.

## Development

Requirements: Node.js 22 and npm. If you use nvm, run `nvm use` in the
repository before installing dependencies.

```bash
npm install
npm test
npm run lint
npm run build
```

Run `npm run dev` for a watch build.

## Test safely in Obsidian

Never develop against your everyday vault. Build and install into the ignored,
repository-local `First Draft Test Vault` directory:

```bash
npm run test-vault
```

Then open the visible `First Draft Test Vault` directory as a separate Obsidian
vault, enable or reload **First Draft** in Settings → Community plugins, and
open `Milestone 5.md`.

Expected result:

- the status bar shows estimated pages, estimated runtime, words, and scenes;
- run `Screenplay: Show Statistics` to see document totals and dialogue counts
  by character;
- put the caret in dialogue, run `Screenplay: Parenthetical`, and choose a
  common or custom direction;
- run `Screenplay: Transition` on a blank line and choose a common or custom
  transition;
- run `Screenplay: Export to Fountain`; First Draft opens a new sibling
  `.fountain` file with the Obsidian frontmatter removed, leaving the original
  note untouched;
- run `Screenplay: Export to Final Draft FDX`; First Draft creates a new sibling
  `.fdx` file without changing the source. Open that file in Final Draft and
  confirm the scene heading, action, character extension, parenthetical,
  dialogue, and transition retain their element types;
- switch page size, minutes per page, or individual status fields under
  Settings → First Draft and confirm the display updates;
- use `Milestone 3 Settings Demo.md` when comparing Letter/A4 or runtime ratios;
  its length makes the differences visible without editing the fixture;
- type `JA` on the final blank line: choose `JANE` with Tab or Enter and start
  typing dialogue on the next line;
- type `INT. MIL`, accept a known location, then accept a time;
- run `Screenplay: New Scene` from the command palette and complete all three
  steps without the mouse;
- put the caret on a character cue and run
  `Screenplay: Character Extension`;
- changing dialogue updates the word count after a short delay;
- removing `screenplay: true` and reopening the note hides the item;
- creating a `.fountain` file activates it without frontmatter;
- ordinary Markdown notes are unchanged.

To use another dedicated test vault:

```bash
node scripts/install-test-vault.mjs /absolute/path/to/test-vault
```

## Automated testing

`npm test` covers parsing, estimation, helpers, both export formats, strict XML
parsing, XML escaping, and structural FDX compatibility. `npm run test-vault`
builds the production bundle and installs it into the isolated vault.

Browser Playwright alone cannot exercise an Obsidian plugin because Obsidian is
an Electron desktop application rather than a website. A separate Electron UI
harness is possible, but it would be platform-specific and more brittle than
the model-level tests. The remaining acceptance check is therefore a short run
in the isolated Obsidian vault; see [FDX compatibility](docs/FDX_COMPATIBILITY.md).

## Privacy

First Draft is local-only. It includes no telemetry and needs no network
connection during ordinary use. See [PRIVACY.md](PRIVACY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). By participating, you agree to follow
the [Code of Conduct](CODE_OF_CONDUCT.md).

## Licence

[MIT](LICENSE)
