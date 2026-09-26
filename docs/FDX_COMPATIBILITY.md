# FDX compatibility

First Draft exports a deliberately small Final Draft XML document containing
the screenplay content needed for ordinary interchange:

- Scene Heading
- Action
- Character, including character extensions
- Parenthetical
- Dialogue
- Transition

The exporter omits title-page design, revision sets, locked pages, beat boards,
production metadata, pagination state, and application window state.

## Compatibility evidence

The document envelope and typed-paragraph structure follow the public
[`rsdoiel/fdx` reference fixture](https://github.com/rsdoiel/fdx/blob/main/testdata/sample-01.fdx).
Final Draft's own documentation describes scripts as a stack of typed paragraph
elements and identifies `.fdx` as its standard document format:

- [What are script elements?](https://kb.finaldraft.com/hc/en-us/articles/27646947570196-What-are-script-elements)
- [Exporting Final Draft files](https://kb.finaldraft.com/hc/en-us/articles/27525594609684-How-do-I-export-a-Final-Draft-file-to-a-different-format-like-RTF-or-TXT)

Automated tests parse every generated export strictly as XML, compare the
supported paragraph sequence with a compact compatibility fixture, verify XML
escaping, preserve character extensions, and check collision-safe filenames.

FDX is Final Draft's application format and no public normative schema was
located. Consequently, automated structural validation is strong evidence but
does not replace opening a representative export in a current Final Draft
installation before a public release.
