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
locked pages, or production tags. Characters outside the built-in Courier
font's encoding are replaced with `?` in the PDF; the source remains
unchanged.

For interchange with Final Draft, see [FDX compatibility](FDX_COMPATIBILITY.md).
