import { EditableFileView, TFile, type WorkspaceLeaf } from "obsidian";
import { render } from "solid-js/web";
import SolidView from "./solidView";
import { parseTranscriptFile } from "./transcriptFile";

export const TRANSCRIPT_VIEW_TYPE = "transcript-view";

export class TranscriptView extends EditableFileView {
  private dispose: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return TRANSCRIPT_VIEW_TYPE;
  }

  getDisplayText() {
    if (this.file) {
      return this.file.basename;
    }

    return "Transcript";
  }

  async onLoadFile(file: TFile): Promise<void> {
    console.log("Loading transcript file", file);
    this.renderSolidView(file);
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
  }

  private renderSolidView(file: TFile) {
    const container = this.containerEl.children[1];
    container.empty();

    // Create a promise for the transcript file data (handles both whisper and VTT)
    const transcriptFile = parseTranscriptFile(file, this.app.vault);

    this.dispose = render(() => SolidView({ transcriptFile }), container);
  }

  async onClose() {
    if (this.dispose) {
      this.dispose();
      this.dispose = null;
    }
  }
}

// Keep the old export for backwards compatibility
export const WHISPER_VIEW_TYPE = TRANSCRIPT_VIEW_TYPE;
export const WhisperView = TranscriptView;
