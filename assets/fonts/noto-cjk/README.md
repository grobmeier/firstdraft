# Noto Sans CJK 2.004

Copyright 2014–2021 Adobe (http://www.adobe.com/), with Reserved Font Name
'Source'. Licensed under SIL OFL 1.1,
not the plugin's Apache licence; full terms are in `LICENSE` and the plugin banner.

Source revision: `f8d157532fbfaeda587e826d4cd5b21a49186f7c` of
https://github.com/notofonts/noto-cjk . Variable TrueType source:

`Sans/Variable/TTF/NotoSansCJKjp-VF.ttf`

These pan-CJK fonts include the other regions' glyphs. PDF generation selects
OpenType localized forms with `ZHS `, `ZHT `, `JAN ` or `KOR `, rather than
assuming all Han text is Japanese. Traditional Chinese uses the Taiwan forms;
Hong Kong forms are outside this slice. Fontkit also shapes decomposed Hangul
after per-line NFC normalization; stored screenplay text is never rewritten.

FontTools 4.66.1 generated static regular (`wght=400`) and bold (`wght=700`)
TrueType instances with four-byte glyph alignment, then packaged them as WOFF
using lossless zlib compression.
The full glyph inventory and regional OpenType tables are retained; the PDF
embeds only used glyphs. TrueType outlines with aligned glyph records are required
for correct subset output with the installed fontkit. WOFF avoids the installed
fontkit's slow JavaScript Brotli decoder and transformed-outline incompatibility.
The runtime reconstructs the sfnt tables once using native browser deflate
decompression (pako fallback for older browsers), avoiding fontkit's repeated
WOFF table inflation for every glyph. Fonts are decoded per export, not retained
in an unbounded cache. FontTools/fontkit are not downloaded at runtime.
CFF subsets, unaligned glyph records and transformed
WOFF2 glyf data failed actual rendering/subset checks and are not distributed.
To reproduce:

1. Download the source from the pinned `raw.githubusercontent.com` revision
   and verify the SHA-256 below.
2. From the repository root, run
   `uv tool run --from 'fonttools[woff]==4.66.1' python scripts/prepare-cjk-fonts.py /path/to/NotoSansCJKjp-VF.ttf`.
   This checks the source hash, instantiates both weights, aligns glyph records,
   and uses WOFF/zlib compression without transformed outlines.
3. Verify character sets, regional substitution, embedded-subset regression
   tests and rendered PDFs. Asset hashes can differ with compressor versions
   and generated font timestamps; source hashes must match.

| File                 | SHA-256                                                            |
| -------------------- | ------------------------------------------------------------------ |
| Source variable TTF  | `240c9b83bf7b386edbae39995ae7e068ed4583f484d92e4a74c34158b5f27b1a` |
| Regular bundled WOFF | `d61013536b8fe91d998513b0eaf752fa42d3a17ec189b06989344c050f37be21` |
| Bold bundled WOFF    | `43c0db530c9d2af4e1a294939e45beb58da7bb6d9197b8e6743660ef35708367` |

The two assets total 23,365,148 bytes. They are included in `main.js`, not fetched
at runtime. Character coverage is finite: emoji and newer/rare ideographs may
still be rejected. Full Chinese/Japanese typography, vertical layout and ruby
annotations are not claimed.
