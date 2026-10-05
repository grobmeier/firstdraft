# Optional offline CJK PDF fonts

First Draft's core plugin is under 5 MB. Chinese, Japanese and Korean writing,
autocomplete, scene planning, preview and Fountain/FDX export do not need a font
pack. **Only CJK PDF export needs these additional fonts.** Latin PDF export
keeps its built-in Courier-compatible fonts.

## Install on a desktop, iPhone or iPad

1. Obtain the official files below (or unpack the optional font-pack ZIP in your
   device's Files app). Keep their exact filenames. The two files total 23.4 MB.
2. In Obsidian's command palette, run **First Draft: Install offline CJK PDF fonts**.
3. Choose **both** `NotoSansCJK-Regular.woff` and `NotoSansCJK-Bold.woff` in the
   file picker, then choose **Install selected fonts**.
4. Wait for the installed message and retry PDF export. Set **PDF language** to
   choose regional glyph forms; this does not translate text.

Official files, pinned to the source used for release 0.13.0:

- [Regular WOFF](https://raw.githubusercontent.com/grobmeier/firstdraft/38623bcd1eddf54eecb8b53277a11d8605394396/assets/fonts/noto-cjk/NotoSansCJK-Regular.woff)
- [Bold WOFF](https://raw.githubusercontent.com/grobmeier/firstdraft/38623bcd1eddf54eecb8b53277a11d8605394396/assets/fonts/noto-cjk/NotoSansCJK-Bold.woff)
- [SIL Open Font License 1.1](https://raw.githubusercontent.com/grobmeier/firstdraft/38623bcd1eddf54eecb8b53277a11d8605394396/assets/fonts/noto-cjk/LICENSE)

Download these through your browser, not through the plugin. If the browser
opens a file instead of saving it, use its download/save action. The fonts are
copyright 2014–2021 Adobe, with Reserved Font Name 'Source', and are distributed
under the SIL Open Font License 1.1, not the plugin's Apache licence.

## Privacy, storage and sync

The plugin reads only the two files you explicitly select. It validates their
sizes and SHA-256 hashes before writing anything. It does not scan your device,
access the network, read the clipboard, or send screenplay text anywhere.

The verified fonts are stored as six binary chunks, each at most 4,000,000 bytes,
under `<vault-config>/plugins/firstdraft/fonts/cjk-2.004/`. Export reads only these
known paths and checks completeness and hashes again. Interrupted installs can
be retried. Missing/corrupt fonts stop PDF export with instructions; the source
screenplay is unchanged. No fonts are retained in an unbounded memory cache.

**Install the pack on each device that needs CJK PDFs.** Each stored chunk is
below Sync Standard's per-file limit, but this does not guarantee that Obsidian
Sync transfers auxiliary plugin files. Do not rely on font-pack sync. Downloaded
WOFF files are larger than 5 MB: keep them in local Downloads/Files, outside a
vault using Sync Standard. After a successful install, those original downloads
are not needed for export. Plugin reinstall/removal may require installing the
pack again. To remove only the installed pack, delete its `fonts/cjk-2.004`
folder manually while no PDF export is running; don't remove screenplay notes.

Physical iPad installation, storage and export acceptance remain unverified.
Full regional glyph support is retained, with horizontal layout only. Emoji,
rare/new ideographs, vertical layout and ruby retain their existing limitations.

## Maintainers

Run `npm run font-pack` to generate `output/font-pack/` containing both fonts,
their OFL licence, these instructions and SHA-256 checksums. This optional pack
is separate from standard release assets (`main.js`, `manifest.json`, `styles.css`).
For a convenient download, ZIP that folder with your usual archive tool; do not
put its 11 MB WOFF files into the core JavaScript or standard release assets.
`npm run build` checks each standard asset is strictly below 5,000,000 bytes.
