import { EditableFileView, TFile, type WorkspaceLeaf } from "obsidian";
import { render } from "solid-js/web";
import SolidView from "./solidView";

export const WHISPER_VIEW_TYPE = "whisper-view";

export class WhisperView extends EditableFileView {
  private dispose: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return WHISPER_VIEW_TYPE;
  }

  getDisplayText() {
    if (this.file) {
      // Extract filename from the whisper file metadata when available
      // For now, use the file basename as fallback
      return this.file.basename;
    }

    return "Whisper";
  }

  async onLoadFile(file: TFile): Promise<void> {
    console.log("Loading file", file);
    this.renderSolidView(file);
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
  }

  private renderSolidView(file: TFile) {
    const container = this.containerEl.children[1];
    container.empty();

    this.dispose = render(
      () => SolidView({ file, vault: this.app.vault }),
      container,
    );
  }

  async onClose() {
    if (this.dispose) {
      this.dispose();
      this.dispose = null;
    }
  }
}
