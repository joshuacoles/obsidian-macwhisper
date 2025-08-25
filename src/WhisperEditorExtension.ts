import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";
import { App } from "obsidian";
import {
  createWhisperEmbedRenderer,
  WhisperEmbedRenderer,
} from "./WhisperEmbedRenderer";

class WhisperViewPlugin {
  private observer: MutationObserver;
  private renderer: WhisperEmbedRenderer;
  private disposeMap = new Map<HTMLElement, () => void>();

  constructor(
    private view: EditorView,
    private app: App,
  ) {
    this.renderer = createWhisperEmbedRenderer(app);
    this.processWhisperEmbeds();
    this.observer = new MutationObserver(() => this.processWhisperEmbeds());
    this.observer.observe(this.view.dom, { childList: true, subtree: true });
  }

  private async processWhisperEmbeds() {
    const embeds = Array.from(
      this.view.dom.querySelectorAll(
        ".internal-embed.file-embed:not([data-whisper-modified])",
      ),
    ).filter((el) => {
      const src = el.getAttribute("src");
      return src && src.split("#")[0].endsWith(".whisper");
    });

    for (const embed of Array.from(embeds)) {
      const embedEl = embed as HTMLElement;
      embedEl.setAttribute("data-whisper-modified", "true");

      const filePath = embedEl.getAttribute("src")?.split("#")[0];
      if (!filePath) continue;

      // Clean up any previous render
      const previousDispose = this.disposeMap.get(embedEl);
      if (previousDispose) {
        previousDispose();
        this.disposeMap.delete(embedEl);
      }

      // Reset text alignment from .file-embed.mod-generic rule
      embedEl.style.textAlign = "left";

      // Render the whisper component
      try {
        const dispose = await this.renderer.render(embedEl, filePath);
        this.disposeMap.set(embedEl, dispose);
      } catch (error) {
        console.error("Error rendering whisper embed:", error);
        embedEl.innerHTML =
          '<div style="padding: 8px; color: var(--text-error);">Error loading whisper file</div>';
      }
    }
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      setTimeout(() => this.processWhisperEmbeds(), 10);
    }
  }

  destroy() {
    this.observer.disconnect();
    // Clean up all SolidJS components
    this.disposeMap.forEach((dispose) => dispose());
    this.disposeMap.clear();
  }
}

export function createWhisperEditorExtension(app: App) {
  return ViewPlugin.define(
    (view: EditorView) => new WhisperViewPlugin(view, app),
  );
}
