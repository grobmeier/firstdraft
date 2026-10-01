# Copyright 2026 Christian Grobmeier
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Generate offline CJK fonts from the pinned upstream variable TrueType font.

Usage: uv tool run --from 'fonttools[woff]==4.66.1' python
       scripts/prepare-cjk-fonts.py /path/to/NotoSansCJKjp-VF.ttf
"""

import hashlib
import sys
from pathlib import Path

import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SOURCE_SHA256 = "240c9b83bf7b386edbae39995ae7e068ed4583f484d92e4a74c34158b5f27b1a"

if fontTools.version != "4.66.1":
    raise SystemExit("Use FontTools 4.66.1 for reproducible font preparation.")
source = Path(sys.argv[1])
if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA256:
    raise SystemExit("Source font checksum mismatch; refusing to generate assets.")
destination = Path(__file__).resolve().parent.parent / "assets/fonts/noto-cjk"
destination.mkdir(parents=True, exist_ok=True)
for weight, label in [(400, "Regular"), (700, "Bold")]:
    with TTFont(source) as font:
        instantiateVariableFont(font, {"wght": weight}, inplace=True, updateFontNames=True)
        # fontkit can emit short loca offsets in PDF subsets. All glyph lengths
        # must be even/aligned, or those offsets truncate and erase later glyphs.
        font["glyf"].padding = 4
        # WOFF uses lossless zlib compression without transformed glyph records;
        # the browser's fontkit decoder is faster than its JS Brotli decoder.
        font.flavor = "woff"
        output = destination / f"NotoSansCJK-{label}.woff"
        font.save(output)
        print(output.name, output.stat().st_size, hashlib.sha256(output.read_bytes()).hexdigest())
