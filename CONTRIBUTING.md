# Contributing

First Draft is being prepared for open-source community development.

## Before opening a change

1. Keep Fountain source portable; never add hidden proprietary document syntax.
2. Keep domain parsing independent from Obsidian UI code.
3. Prefer documented Obsidian APIs and browser-compatible runtime APIs.
4. Do not add telemetry, cloud dependencies, or screenplay-content logging.
5. Add focused tests for behavioural changes.

## Verification

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Use a separate test vault for manual Obsidian checks. Do not include vault data,
private screenplays, generated `main.js`, or credentials in a contribution.
