import { type MarkdownPostProcessorContext, type App, TFile } from "obsidian";
import {
  createWhisperEmbedRenderer,
  WhisperEmbedRenderer,
} from "./WhisperEmbedRenderer";

let app: App;
let renderer: WhisperEmbedRenderer;

export function initializeWhisperPostProcessor(appInstance: App) {
  app = appInstance;
  renderer = createWhisperEmbedRenderer(app);
}

export async function whisperMarkdownPostProcessor(
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  // Only process reading mode (when .internal-embed elements exist)
  const embeddedItems = el.querySelectorAll(".internal-embed");
  if (embeddedItems.length === 0) return;

  for (const embed of Array.from(embeddedItems)) {
    const fname = embed.getAttribute("src")?.split("#")[0];
    if (!fname) continue;

    const file = app.metadataCache.getFirstLinkpathDest(fname, ctx.sourcePath);
    if (file && file instanceof TFile && file.extension === "whisper") {
      // Create a container for the whisper component
      const container = document.createElement("div");

      try {
        // Render the whisper component
        await renderer.render(container, fname);
        embed.parentElement?.replaceChild(container, embed);
      } catch (error) {
        console.error("Error rendering whisper embed in reading mode:", error);
        container.innerHTML =
          '<div style="padding: 8px; color: var(--text-error);">Error loading whisper file</div>';
        embed.parentElement?.replaceChild(container, embed);
      }
    }
  }
}
