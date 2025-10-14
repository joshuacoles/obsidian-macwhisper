# Obsidian MacWhisper Plugin

View and embed MacWhisper `.whisper` files in Obsidian with audio playback and transcript display.

## Features

- Open `.whisper` files directly in Obsidian
- Embed whisper files in markdown notes with `![[file.whisper]]`
- Time-range filtered transcripts with `![[file.whisper#MM:SS-MM:SS]]` syntax
- Audio playback synchronized with transcript display
- Works in both Live Preview and Reading modes

## Installation

### Via BRAT (Recommended for Beta Testing)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) from the Obsidian Community Plugins
2. Open the command palette and run `BRAT: Add a beta plugin for testing`
3. Enter this repository URL: `https://github.com/joshuacoles/obsidian-macwhisper`
4. Enable the plugin in Settings → Community Plugins

BRAT will keep the plugin automatically updated with the latest releases.

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/joshuacoles/obsidian-macwhisper/releases/latest)
2. Create a folder in your vault: `VaultFolder/.obsidian/plugins/obsidian-macwhisper/`
3. Copy the downloaded files into that folder
4. Enable the plugin in Settings → Community Plugins

## Development Setup

Follow these steps to get your local dev loop going:

1. [Install mise](https://mise.jdx.dev/getting-started.html)
2. Run `mise install` to install Bun
3. Run `bun install` to install dependencies
4. Run `bun run dev` to build and watch for changes

To test your plugin in Obsidian with hot-reloading:

1. Run `bun run link` to symlink your built plugin into the test vault
2. Add `./test-vault` to Obsidian as a new vault
3. Enable community plugins and activate the MacWhisper plugin

Any changes to your plugin source will automatically reload in Obsidian.

## Releasing new releases

1. Update the version in `package.json` to your new version number (e.g., `1.0.1`)
2. Run `bun run version` to update `manifest.json` and `versions.json`
3. Commit the changes
4. Create and push a git tag with the version number (e.g., `git tag 1.0.1 && git push origin 1.0.1`)

The GitHub Actions workflow will automatically:
- Build the plugin
- Verify version consistency
- Create a GitHub release with `main.js`, `manifest.json`, and `styles.css` attached
- BRAT users will be automatically notified of the update

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- Publish an initial version
- Make sure you have a `README.md` file in the root of your repo
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin

## Improve code quality with eslint (optional)

- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code.
- To use eslint with this project, `bun run lint`.

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
  "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
  "fundingUrl": {
    "Buy Me a Coffee": "https://buymeacoffee.com",
    "GitHub Sponsor": "https://github.com/sponsors",
    "Patreon": "https://www.patreon.com/"
  }
}
```

## API Documentation

See https://github.com/obsidianmd/obsidian-api
