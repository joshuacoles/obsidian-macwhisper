import { App, TFile } from "obsidian";
import { render } from "solid-js/web";
import SolidView from "./solidView";
import { parseTranscriptFile } from "./transcriptFile";
import { parseEmbedSrc, formatTimeFromMs } from "./timeRangeUtils";

export interface TranscriptEmbedRenderer {
  render: (container: HTMLElement, src: string) => Promise<() => void>;
}

export function createTranscriptEmbedRenderer(
  app: App,
): TranscriptEmbedRenderer {
  return {
    async render(container: HTMLElement, src: string): Promise<() => void> {
      try {
        // Parse the src to extract file path and optional time range
        const { filePath, timeRange } = parseEmbedSrc(src);

        // Resolve the file path to a TFile
        const file = app.metadataCache.getFirstLinkpathDest(filePath, "");

        if (
          !file ||
          !(file instanceof TFile) ||
          !["whisper", "vtt"].includes(file.extension)
        ) {
          container.innerHTML =
            '<div style="padding: 8px; color: var(--text-error);">Invalid transcript file (must be .whisper or .vtt)</div>';
          return () => {};
        }

        // Create loading indicator
        const fileType = file.extension === "vtt" ? "VTT" : "whisper";
        const loadingText = timeRange
          ? `Loading ${fileType} file (${formatTimeFromMs(timeRange.start)}-${formatTimeFromMs(timeRange.end)})...`
          : `Loading ${fileType} file...`;
        container.innerHTML = `<div style="padding: 12px; text-align: center; color: var(--text-muted);">${loadingText}</div>`;

        // Parse the transcript file (handles both whisper and VTT)
        const transcriptFileData = await parseTranscriptFile(file, app.vault);

        // Clear container and render SolidJS component
        container.empty();

        // Create a promise wrapper for the component
        const transcriptFilePromise = Promise.resolve(transcriptFileData);

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
          () => SolidView({ transcriptFile: transcriptFilePromise, timeRange }),
          container,
        );

        return dispose;
      } catch (error) {
        console.error("Error rendering transcript embed:", error);
        container.innerHTML = `<div style="padding: 8px; color: var(--text-error);">Error loading transcript file: ${error.message}</div>`;
        return () => {};
      }
    },
  };
}

// Keep the old export for backwards compatibility
export type WhisperEmbedRenderer = TranscriptEmbedRenderer;
export const createWhisperEmbedRenderer = createTranscriptEmbedRenderer;
