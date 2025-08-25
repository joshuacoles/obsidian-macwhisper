import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";

class WhisperViewPlugin {
  private observer: MutationObserver;

  constructor(private view: EditorView) {
    this.processWhisperEmbeds();
    this.observer = new MutationObserver(() => this.processWhisperEmbeds());
    this.observer.observe(this.view.dom, { childList: true, subtree: true });
  }

  private processWhisperEmbeds() {
    const embeds = this.view.dom.querySelectorAll(
      '.internal-embed.file-embed[src$=".whisper"]:not([data-whisper-modified])',
    );
    embeds.forEach((embed) => {
      embed.setAttribute("data-whisper-modified", "true");
      (embed as HTMLElement).innerHTML =
        '<div style="padding: 8px 12px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 6px; font-weight: bold; text-align: center;">FOUND</div>';
    });
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      setTimeout(() => this.processWhisperEmbeds(), 10);
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}

export const whisperEditorExtension = ViewPlugin.fromClass(WhisperViewPlugin);
