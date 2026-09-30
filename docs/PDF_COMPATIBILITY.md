# PDF preview and export compatibility

First Draft 0.11 adds a local, read-only screenplay preview and
non-destructive PDF export for standalone screenplays and ordered multi-file
projects.

## Supported in 0.11

- Scene headings, action, character cues, character extensions,
  parentheticals, dialogue, and transitions.
- US Letter and A4, using the page size selected under Settings → First Draft.
- Courier-style 12-point typography, screenplay margins, deterministic line
  wrapping, page breaks, and page numbers.
- Combined project output in the explicit order of the project note's `parts`
  property.
- Numbered filenames when an export already exists. First Draft never
  overwrites an existing PDF.

The source Fountain or Markdown files remain authoritative and unchanged. PDF
generation happens entirely on the device; no screenplay text is uploaded.

## Intentional boundary

The PDF is intended for comfortable reading and review. It is not locked
production pagination and is not guaranteed to match Final Draft page for
page.

This release does not yet format Fountain title-page metadata, dual dialogue,
lyrics, centred text, notes, sections, synopses, boneyards, revision colours,
locked pages, or production tags.

### Next-build text safety

The next build stops PDF export when the built-in Courier font cannot represent
the text. It reports up to eight distinct unsupported characters with Unicode
code points; no PDF is saved and the source remains unchanged. Genuine `?`
characters and supported accents still export normally. Preview remains
available, and Fountain export preserves text for use in another application.
This is not complete Unicode font support. Published 0.11.0 still substitutes
unsupported characters with `?`; the safety check is not released yet.

For interchange with Final Draft, see [FDX compatibility](FDX_COMPATIBILITY.md).
