# Mobile testing

First Draft uses browser-compatible Obsidian APIs and declares mobile support,
but physical-device acceptance remains outstanding. Record it before claiming
verified mobile support; if a release proceeds without a device, disclose the
untested layout/performance in its release notes.
Use a dedicated test vault containing no private screenplay material.

## Recommended: install the release candidate with BRAT

This path works on both Android and iOS/iPadOS once the First Draft repository
is public and has a GitHub release.

1. Install the **BRAT** community plugin in the mobile test vault.
2. In BRAT, choose **Add Beta plugin**.
3. Enter `grobmeier/firstdraft` and select the intended test release. For the
   activated-note palette and bundle-size fixes, select `0.13.1-beta.3` explicitly; the stable
   `0.13.0` release does not include it.
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

### Activated-note palette regression

For the palette-context fix, repeat these checks on the iPad in a disposable
vault. The public 0.13.0 release does not contain this fix; use the matching test
build, then restart Obsidian or disable/re-enable First Draft.

1. Open an existing Markdown screenplay with boolean `screenplay: true`.
2. Open the First Draft Palette, focus its controls, close/reopen the sidebar
   repeatedly, and switch between editing and reading views. Writing controls
   should remain available without asking you to activate the note again.
3. Create a project, open its parts, and return to the original screenplay.
   Each view should show the corresponding controls, not those of the previous
   note. While properties load, a waiting message is preferable to activation.
4. Switch to an ordinary note, an empty tab, a project, and a character page.
   Only the ordinary Markdown note should offer screenplay activation; no action
   should edit a screenplay left open in another tab by mistake.
5. In an editable disposable note, change `screenplay: true` to `false`, then
   back to `true`, and remove the property. Controls should reflect the current
   properties. A malformed or incomplete YAML block should show waiting feedback
   rather than an activation button.
6. Restart Obsidian, lock/resume the device, and repeat steps 1–3.

Record any failure together with the note type, reading/editing mode and whether
the sidebar was focused. Automated context and rendering tests are not physical
iPad acceptance.

### General acceptance

- Open a `.fountain` file and a Markdown note with `screenplay: true`.
- Confirm autocomplete works with the on-screen keyboard.
- Open the First Draft Palette and use its common actions.
- Create and open a character dossier.
- Open a multi-part screenplay project and navigate between parts.
- View project statistics and character checks.
- In a build containing the scene workspace, check narrow cards, filters, scene
  editing and cross-part move/restore on disposable notes.
- In a build containing the continuity inspector, check scrolling/wrapped
  evidence, source navigation, Refresh and stale-report warnings.
- Preview a standalone screenplay and a multi-part project in both portrait
  and landscape orientation without horizontal page clipping.
- Export Fountain, FDX, and PDF files without changing the source document;
  open the PDF and confirm its pages are readable.
- Confirm Latin PDFs work without the optional font pack. A CJK PDF should offer
  clear installation instructions without saving a partial PDF. Run **Install
  offline CJK PDF fonts**, select both official files from the device file picker,
  then verify Japanese, Chinese and Korean PDF output and regional forms. See
  [font-pack instructions](CJK_FONT_PACK.md). Verify cancelled selection, retry
  after interrupted installation and reinstall on each device; do not assume
  auxiliary font chunks are transferred by Obsidian Sync.
- Change First Draft settings, restart Obsidian, and confirm they persist.
- Lock and resume the device, then confirm the active screenplay still works.

Record the Obsidian version, operating system version, and device type with the
test result. Mobile acceptance is separate from the automated model tests and
the desktop test-vault check.
