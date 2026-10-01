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

The next build embeds unmodified Liberation Mono 2.1.5 regular and bold fonts
locally. It includes representative extended Latin (such as Polish and Czech),
Greek and Cyrillic support, including tested combining accents. Font bytes are
bundled with the plugin and PDFs embed only the glyphs they use; no downloads
or installed fonts are needed. The editor and preview font are unchanged.

PDF export stops when the embedded font cannot represent
the text. It reports up to eight distinct unsupported characters with Unicode
code points; no PDF is saved and the source remains unchanged. Genuine `?`
characters and supported accents still export normally. Preview remains
available, and Fountain export preserves text for use in another application.
This is not complete Unicode font support: emoji and unencoded characters remain unsupported,
and right-to-left/complex-script layout is not guaranteed. Published 0.11.0 still substitutes
unsupported characters with `?`; the safety check is not released yet.

### Development-build Chinese, Japanese and Korean PDFs

- Horizontal output for representative Simplified/Traditional Chinese,
  Japanese kana/kanji and Korean Hangul. Mixed Latin text is supported.
- Choose **Settings → First Draft → PDF language** to select regional Han
  character forms. The default is Simplified Chinese; select Japanese for a
  Japanese screenplay, Korean for Korean, or Traditional Chinese for Taiwan
  forms. This does not translate text; Hong Kong-specific forms are not included
  as a selectable mode. One PDF uses one selected language.
- CJK-containing PDFs use local Noto Sans CJK 2.004 regular/bold; Latin-only
  PDFs retain Liberation Mono. Noto is proportional for Latin letters. Both
  fonts are bundled and glyph-subsetted into each PDF, with no network requests.
- CJK wrapping uses measured font widths and Unicode line-break opportunities,
  with 14.4-point line spacing for readable 12-point CJK text (Latin-only output
  keeps its existing spacing),
  with grapheme-safe emergency wrapping for oversized words. Canonically
  equivalent decomposed Hangul is normalized only for drawing, never in source.
- Preview line breaks/page counts are approximate; review the exported PDF.
  Vertical typesetting, ruby, specialist typographic layout and universal Han
  coverage are not promised. Newer/rare ideographs and emoji can still stop
  export with the existing diagnostic. Forced character cues (`@美咲`) remain
  useful for names without uppercase/lowercase forms.
- The compressed Noto assets add approximately 23 MB before base64 bundling;
  the plugin bundle is approximately 33 MB. Font decoding happens on CJK export,
  not on a Latin-only export. PDF subsets are much smaller than these assets.
  Physical iPhone/iPad memory and performance acceptance remains required.

`npm run test:pdf-output` generates eight multi-page review PDFs (all four
languages in Letter/A4) and timings in ignored `output/pdf/`. Render them with
Poppler for visual review. Reproducible font source details and licence are in
`assets/fonts/noto-cjk/README.md`.

For interchange with Final Draft, see [FDX compatibility](FDX_COMPATIBILITY.md).
