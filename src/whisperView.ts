import { ItemView, type WorkspaceLeaf } from "obsidian";

export const WHISPER_VIEW_TYPE = "whisper-view";

export class WhisperView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return WHISPER_VIEW_TYPE;
  }

  getDisplayText() {
    return "Whisper";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "This is a whisper view" });
  }

  async onClose() {
    // Nothing to clean up.
  }
}
