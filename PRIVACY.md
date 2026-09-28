# Privacy

First Draft processes screenplay text locally inside Obsidian.

- It does not include telemetry or analytics.
- It does not send screenplay text or usage data over the network.
- It does not require an account or cloud service.
- It reconstructs screenplay statistics from the current document rather than
  maintaining an external character database.
- It examines Markdown file paths and cached frontmatter across the vault to
  find screenplay projects and character dossiers. It reads note contents only
  for the current screenplay and its explicitly linked project parts.
- The cheat sheet writes an example to the system clipboard only after the user
  presses its **Copy** button. First Draft never reads clipboard contents.

Obsidian, installed third-party plugins, sync providers, and the operating
system are outside First Draft's control and have their own privacy behaviour.
