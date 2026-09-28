# Mobile testing

First Draft uses browser-compatible Obsidian APIs and declares mobile support,
but a physical-device check is still required before the first public release.
Use a dedicated test vault containing no private screenplay material.

## Recommended: install the release candidate with BRAT

This path works on both Android and iOS/iPadOS once the First Draft repository
is public and has a GitHub release.

1. Install the **BRAT** community plugin in the mobile test vault.
2. In BRAT, choose **Add Beta plugin**.
3. Enter `grobmeier/firstdraft` and select the `0.10.0` release.
4. Enable **First Draft** under **Settings → Community plugins**.
5. Open the project fixture and complete the checklist below.

BRAT is only a release-candidate installation aid. First Draft itself does not
depend on BRAT and does not access the network.

## Android: direct local installation

For testing before a public release, build on the development computer and copy
these files into `<test-vault>/.obsidian/plugins/firstdraft/` on the device:

- `main.js`
- `manifest.json`
- `styles.css`

Restart Obsidian, then enable First Draft under **Settings → Community
plugins**. Android file access varies by device; USB transfer or an existing
vault sync method can be used. Do not point the development build at an
everyday vault.

Direct installation on iOS/iPadOS is constrained by app file access, so the
BRAT release-candidate path is the practical option there.

## Mobile acceptance checklist

- Open a `.fountain` file and a Markdown note with `screenplay: true`.
- Confirm autocomplete works with the on-screen keyboard.
- Open the First Draft Palette and use its common actions.
- Create and open a character dossier.
- Open a multi-part screenplay project and navigate between parts.
- View project statistics and character checks.
- Export Fountain and FDX files without changing the source document.
- Change First Draft settings, restart Obsidian, and confirm they persist.
- Lock and resume the device, then confirm the active screenplay still works.

Record the Obsidian version, operating system version, and device type with the
test result. Mobile acceptance is separate from the automated model tests and
the desktop test-vault check.
