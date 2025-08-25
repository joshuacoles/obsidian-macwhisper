import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";

class WhisperViewPlugin {
  private observer: MutationObserver;

  constructor(private view: EditorView) {
    this.processExistingEmbeds();
    this.setupMutationObserver();
  }

  private processExistingEmbeds() {
    // Find all rendered embed elements that reference whisper files
    const embeds = this.view.dom.querySelectorAll(
      '.internal-embed.file-embed[src$=".whisper"]',
    );
    embeds.forEach((embed) => this.modifyEmbedContent(embed as HTMLElement));
  }

  private setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            // Check if the added node is a whisper embed
            if (
              element.matches('.internal-embed.file-embed[src$=".whisper"]')
            ) {
              this.modifyEmbedContent(element);
            }
            // Also check child nodes in case the embed is nested
            const childEmbeds = element.querySelectorAll(
              '.internal-embed.file-embed[src$=".whisper"]',
            );
            childEmbeds.forEach((embed) =>
              this.modifyEmbedContent(embed as HTMLElement),
            );
          }
        });
      });
    });

    this.observer.observe(this.view.dom, {
      childList: true,
      subtree: true,
    });
  }

  private modifyEmbedContent(embed: HTMLElement) {
    // Check if already modified
    if (embed.hasAttribute("data-whisper-modified")) {
      return;
    }

    // Mark as modified to avoid duplicate processing
    embed.setAttribute("data-whisper-modified", "true");

    // Instead of replacing the entire element, just modify its content
    // This prevents CodeMirror from trying to sync the DOM changes back to the document
    embed.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        background-color: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        font-weight: bold;
        color: var(--text-normal);
        font-size: 0.9em;
        min-height: 24px;
      ">
        FOUND
      </div>
    `;

    // Ensure the embed container maintains its structure
    embed.style.cssText = `
      display: inline-block;
      vertical-align: middle;
    `;
  }

  update(update: ViewUpdate) {
    // Process any new embeds that might have been added
    if (update.docChanged || update.viewportChanged) {
      // Small delay to let Obsidian render the embeds first
      setTimeout(() => {
        this.processExistingEmbeds();
      }, 10);
    }
  }

  destroy() {
    this.observer?.disconnect();
  }
}

export const whisperEditorExtension = ViewPlugin.fromClass(WhisperViewPlugin);
