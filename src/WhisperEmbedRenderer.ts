import { App, TFile } from "obsidian";
import { render } from "solid-js/web";
import SolidView from "./solidView";
import * as whisperFile from "./whisperFile";

export interface WhisperEmbedRenderer {
  render: (container: HTMLElement, filePath: string) => Promise<() => void>;
}

export function createWhisperEmbedRenderer(app: App): WhisperEmbedRenderer {
  return {
    async render(
      container: HTMLElement,
      filePath: string,
    ): Promise<() => void> {
      try {
        // Resolve the file path to a TFile
        const file = app.metadataCache.getFirstLinkpathDest(filePath, "");

        if (!file || !(file instanceof TFile) || file.extension !== "whisper") {
          container.innerHTML =
            '<div style="padding: 8px; color: var(--text-error);">Invalid whisper file</div>';
          return () => {};
        }

        // Create loading indicator
        container.innerHTML =
          '<div style="padding: 12px; text-align: center; color: var(--text-muted);">Loading whisper file...</div>';

        // Read and parse the whisper file
        const contents = await app.vault.readBinary(file);
        const whisperFileData = await whisperFile.parse(contents);

        // Clear container and render SolidJS component
        container.empty();

        // Create a promise wrapper for the component
        const whisperFilePromise = Promise.resolve(whisperFileData);

        // Style the container to match embed styling
        container.style.cssText = `
          border: 1px solid var(--background-modifier-border);
          border-radius: 6px;
          background: var(--background-primary);
          overflow: hidden;
          margin: 4px 0;
          height: 300px;
          text-align: left;
        `;

        // Render the SolidJS component
        const dispose = render(
          () => SolidView({ whisperFile: whisperFilePromise }),
          container,
        );

        return dispose;
      } catch (error) {
        console.error("Error rendering whisper embed:", error);
        container.innerHTML = `<div style="padding: 8px; color: var(--text-error);">Error loading whisper file: ${error.message}</div>`;
        return () => {};
      }
    },
  };
}
