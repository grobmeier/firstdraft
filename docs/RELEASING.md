# Releasing First Draft

Releases are built by GitHub Actions from an exact semantic-version tag. The
tag must not have a `v` prefix because Obsidian requires it to match the version
in `manifest.json`.

## Before tagging

1. Update the version in `manifest.json`, `package.json`, and `package-lock.json`.
2. Add the version and minimum Obsidian version to `versions.json`.
3. Add user-facing notes at `docs/releases/<version>.md` and update
   `CHANGELOG.md`.
4. Complete the desktop test-vault checklist in `README.md`.
5. Complete and record the physical-device checklist in `MOBILE_TESTING.md`.
6. Confirm `main` is clean, reviewed, and pushed.
7. Run the same local quality gate as CI:

   ```bash
   npm ci
   npm run license:headers:check
   npm run format:check
   npm run lint
   npm test
   npm audit --audit-level=high
   npm run build
   ```

## Publish

Create and push an annotated tag whose name exactly matches the manifest
version:

```bash
git tag -a 0.11.0 -m "First Draft 0.11.0"
git push origin 0.11.0
```

The Release workflow verifies that the tag is on `main`, repeats the complete
quality gate, builds the plugin, creates build-provenance attestations, and
creates the GitHub release. It uploads only the `main.js`, `manifest.json`, and
`styles.css` files supported by Obsidian.

Do not move or reuse a published tag. Correct a failed release with a new patch
version unless the tag never produced a public release.

## After publishing

1. Install the published assets in the desktop test vault and repeat the smoke
   test.
2. Install the same release on a physical mobile device and repeat its focused
   checklist.
3. For the initial public release, submit the repository through Obsidian's
   community-plugin submission process.
4. Confirm the GitHub release and CI checks remain green, and review Dependabot
   and security alerts.
5. Verify the downloaded assets' provenance with:

   ```bash
   gh attestation verify main.js -R grobmeier/firstdraft
   gh attestation verify manifest.json -R grobmeier/firstdraft
   gh attestation verify styles.css -R grobmeier/firstdraft
   ```
