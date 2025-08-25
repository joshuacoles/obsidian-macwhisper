import {
  type MarkdownPostProcessorContext,
  type MetadataCache,
  TFile,
} from "obsidian";

let metadataCache: MetadataCache;

export function initializeWhisperPostProcessor(app: any) {
  metadataCache = app.metadataCache;
}

export async function whisperMarkdownPostProcessor(
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  // Only process reading mode (when .internal-embed elements exist)
  const embeddedItems = el.querySelectorAll(".internal-embed");
  if (embeddedItems.length === 0) return;

  embeddedItems.forEach((embed) => {
    const fname = embed.getAttribute("src")?.split("#")[0];
    if (!fname) return;

    const file = metadataCache.getFirstLinkpathDest(fname, ctx.sourcePath);
    if (file && file instanceof TFile && file.extension === "whisper") {
      const foundDiv = document.createElement("div");
      foundDiv.style.cssText =
        "padding: 10px; text-align: center; font-weight: bold;";
      foundDiv.textContent = "FOUND";
      embed.parentElement?.replaceChild(foundDiv, embed);
    }
  });
}
