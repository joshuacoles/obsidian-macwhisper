# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This project uses Bun instead of Node.js for all tooling:

- `bun run dev` - Build and watch source files with hot reload
- `bun run build` - Production build
- `bun run link` - Symlink built plugin into test vault
- `bun run lint` - Run ESLint
- `bun run format` - Run Prettier formatting
- `bun run version` - Bump version in manifest.json and versions.json

## Development Setup

1. Install mise and run `mise install` to install Bun
2. Run `bun install` to install dependencies
3. Run `bun run link` to symlink plugin into test vault
4. Add `./test-vault` as a vault in Obsidian
5. Enable community plugins and activate your plugin
6. Run `bun run dev` for hot reload development

## Architecture Overview

This is an Obsidian plugin for handling MacWhisper `.whisper` files, which are ZIP archives containing audio and transcript metadata.

### Core Components

**Whisper File Handling**:

- `whisperFile.ts` - Parses .whisper ZIP files into structured data
- `WhisperView.ts` - Main file view for opening .whisper files directly
- `solidView.tsx` - SolidJS component rendering transcripts with audio playback

**Embed System** (dual-mode architecture):

- `WhisperEditorExtension.ts` - CodeMirror 6 ViewPlugin for live preview mode
- `WhisperMarkdownPostProcessor.ts` - Obsidian post processor for reading mode
- `WhisperEmbedRenderer.ts` - Shared renderer that creates SolidJS components

### Embed Syntax

The plugin supports embedding whisper files in markdown:

- `![[file.whisper]]` - Full transcript
- `![[file.whisper#MM:SS-MM:SS]]` - Time range filtered transcript (e.g., `#1:30-3:45`)

### Key Architecture Patterns

**Dual Rendering System**: The plugin handles embeds in both Obsidian modes:

- **Live Preview**: Uses CodeMirror 6 ViewPlugin with MutationObserver to detect and replace `.internal-embed.file-embed` elements
- **Reading Mode**: Uses Obsidian's markdown post processor API to replace embed elements during rendering
- Both use the same `WhisperEmbedRenderer` for consistency

**Time Range Filtering**:

- `timeRangeUtils.ts` provides parsing utilities for `MM:SS-MM:SS` syntax
- Filtering is applied at the SolidJS component level, not file parsing level
- Transcripts that overlap with the time range are included (not exact boundaries)

**SolidJS Integration**:

- Uses `solid-js/web` render function to mount components in DOM containers
- Components return dispose functions for proper cleanup
- The editor extension tracks dispose functions in a Map for memory management

**External Dependencies**:

- All `@codemirror/*` packages are marked as external in build config (line 34-44 in `scripts/build.ts`)
- This ensures the plugin uses Obsidian's bundled CodeMirror 6 classes instead of conflicting versions

### File Structure Significance

- `src/main.ts` - Plugin entry point that registers both extensions and processors
- `src/styles.module.css` - CSS modules for SolidJS components
- `scripts/build.ts` - Custom Bun build script with SolidJS plugin integration
- External marking of CodeMirror packages is critical for plugin compatibility

### Development Notes

- The build system uses Bun with `bun-plugin-solid` for SolidJS compilation
- Hot reload works through the test-vault symlink and `.hotreload` file creation
- ESLint and Prettier are configured for code quality
- TypeScript strict mode is enabled with isolated modules
