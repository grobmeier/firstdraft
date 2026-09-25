# First Draft

First Draft is an Obsidian community plugin for writing screenplays efficiently
in plain-text [Fountain](https://fountain.io/) syntax.

The guiding principle is simple: think about the movie, not the syntax. First
Draft adds screenplay-aware assistance while keeping every document portable,
human-readable, and useful when the plugin is not installed.

> First Draft is in early private development. It is not yet available in the
> Obsidian community-plugin directory.

## Milestone 3

The current build provides:

- screenplay mode for `.fountain` files;
- screenplay mode for Markdown notes with `screenplay: true` frontmatter;
- Fountain-aware scene and character parsing;
- a debounced status item with word and scene counts;
- screenplay-aware estimated pages for US Letter or A4;
- configurable runtime estimation based on minutes per page;
- a current-document statistics dialog with character dialogue rankings;
- context-aware character, character-extension, scene-location, and time
  autocomplete;
- keyboard-first Character, Character Extension, and New Scene commands;
- settings for activation, autocomplete ranking, result limits, scene types,
  and times of day.

Parenthetical and transition helpers, Fountain export, and Final Draft export
are planned for later milestones.

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
open `Milestone 3.md`.

Expected result:

- the status bar shows estimated pages, estimated runtime, words, and scenes;
- run `Screenplay: Show Statistics` to see document totals and dialogue counts
  by character;
- switch page size, minutes per page, or individual status fields under
  Settings → First Draft and confirm the display updates;
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

## Privacy

First Draft is local-only. It includes no telemetry and needs no network
connection during ordinary use. See [PRIVACY.md](PRIVACY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). By participating, you agree to follow
the [Code of Conduct](CODE_OF_CONDUCT.md).

## Licence

[MIT](LICENSE)
