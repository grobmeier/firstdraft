# Understanding scanner messages

## Runtime base64

Starting with 0.13.1, bundled Liberation Mono fonts are embedded as literal
byte arrays at build time. First Draft no longer calls browser `atob()` or
`btoa()` to decode fonts. The production build rejects these calls and release
assets at or above 5,000,000 bytes.

The upstream `pdf-lib` and `@pdf-lib/fontkit` libraries still contain encoding
utilities and compressed font/shaping tables represented as base64. They are
data used for local PDF generation, not encoded JavaScript to execute. A scanner
that detects these broader patterns may still show an advisory. We do not
rename, conceal or patch those library utilities merely to suppress a warning.

## Unavailable malware or obfuscation scans

“Scan not available” means that the external scanner did not return a result.
It is neither a malware finding nor proof that the release is clean. The plugin
cannot enable those external checks. Retry the service's scan on the published
release; if still unavailable, report it to that service's operator.

GitHub release CI runs tests, lint, a dependency audit and the production build.
The three standard Obsidian assets have build-provenance attestations. These
checks establish specific evidence, not a substitute for an unavailable malware
scan. See [releasing](RELEASING.md) for verification commands.
