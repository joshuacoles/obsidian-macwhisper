import {
  type MarkdownPostProcessorContext,
  type MetadataCache,
  type Vault,
  TFile,
} from "obsidian";

let vault: Vault;
let metadataCache: MetadataCache;

export function initializeWhisperPostProcessor(app: any) {
  vault = app.vault;
  metadataCache = app.metadataCache;
}

export async function whisperMarkdownPostProcessor(
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  const embeddedItems = el.querySelectorAll(".internal-embed");

  if (embeddedItems.length === 0) {
    // Editing mode (live preview)
    await processEditingMode(el, ctx);
    return;
  }

  // Reading mode
  await processReadingMode(embeddedItems, ctx);
}

async function processEditingMode(
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  const file = vault.getAbstractFileByPath(ctx.sourcePath);

  if (!(file instanceof TFile)) return;
  if (!isWhisperFile(file)) return;

  // @ts-expect-error
  if (ctx.remainingNestLevel < 4) return;

  // @ts-expect-error
  const containerEl = ctx.containerEl;
  let internalEmbedDiv: HTMLElement = containerEl;

  while (
    !internalEmbedDiv.hasClass("cm-embed-block") &&
    !internalEmbedDiv.hasClass("internal-embed") &&
    !internalEmbedDiv.hasClass("markdown-reading-view") &&
    !internalEmbedDiv.hasClass("markdown-embed") &&
    internalEmbedDiv.parentElement
  ) {
    internalEmbedDiv = internalEmbedDiv.parentElement;
  }

  if (internalEmbedDiv.hasClass("cm-embed-block")) {
    return;
  }

  const markdownEmbed = internalEmbedDiv.hasClass("markdown-embed");
  const markdownReadingView = internalEmbedDiv.hasClass(
    "markdown-reading-view",
  );

  if (
    !internalEmbedDiv.hasClass("internal-embed") &&
    (markdownEmbed || markdownReadingView)
  ) {
    el.empty();

    if (!el.querySelector(".frontmatter")) {
      if (el.parentElement === containerEl) {
        containerEl.removeChild(el);
      }
    }

    internalEmbedDiv.empty();
    const foundDiv = createWhisperFoundDiv();
    internalEmbedDiv.appendChild(foundDiv);

    if (markdownEmbed) {
      internalEmbedDiv.removeClass("markdown-embed");
      internalEmbedDiv.removeClass("inline-embed");
    }
    return;
  }

  el.empty();

  if (internalEmbedDiv.hasAttribute("ready")) return;

  internalEmbedDiv.setAttribute("ready", "");
  internalEmbedDiv.empty();

  const foundDiv = createWhisperFoundDiv();
  internalEmbedDiv.appendChild(foundDiv);

  if (markdownEmbed) {
    internalEmbedDiv.removeClass("markdown-embed");
    internalEmbedDiv.removeClass("inline-embed");
  }
}

async function processReadingMode(
  embeddedItems: NodeListOf<Element>,
  ctx: MarkdownPostProcessorContext,
) {
  embeddedItems.forEach(async (maybeWhisper) => {
    const fname = maybeWhisper.getAttribute("src")?.split("#")[0];
    if (!fname) return;

    const file = metadataCache.getFirstLinkpathDest(fname, ctx.sourcePath);

    if (file && file instanceof TFile && isWhisperFile(file)) {
      const parent = maybeWhisper.parentElement;
      const foundDiv = createWhisperFoundDiv();
      parent?.replaceChild(foundDiv, maybeWhisper);
    }
  });
}

function isWhisperFile(file: TFile): boolean {
  return file.extension === "whisper";
}

function createWhisperFoundDiv(): HTMLDivElement {
  const div = document.createElement("div");
  div.style.padding = "10px";
  div.style.textAlign = "center";
  div.style.fontWeight = "bold";
  div.textContent = "FOUND";
  return div;
}
