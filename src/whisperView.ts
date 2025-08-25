import { EditableFileView, TFile, type WorkspaceLeaf } from "obsidian";
import * as whisperFile from "./whisperFile";
import { WhisperFile } from "./whisperFile";

export const WHISPER_VIEW_TYPE = "whisper-view";

export class WhisperView extends EditableFileView {
  private renderAudio: () => void;
  private whisperFile: Promise<WhisperFile> | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return WHISPER_VIEW_TYPE;
  }

  getDisplayText() {
    return "Whisper";
  }

  async onLoadFile(file: TFile): Promise<void> {
    console.log("Loading file", file);
    this.whisperFile = this.app.vault
      .readBinary(file)
      .then((contents) => whisperFile.parse(contents));

    this.renderAudio();
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "This is a whisper view" });
    const audioElement = container.createEl("audio", {
      attr: { controls: "true", disabled: true },
    });

    this.renderAudio = async () => {
      const whisperFile = await this.whisperFile!;
      audioElement.removeAttribute("disabled");

      const blob = new Blob([whisperFile.originalAudio], { type: "audio/wav" });
      audioElement.src = URL.createObjectURL(blob);
    };
  }

  async onClose() {
    this.whisperFile = null;
    // Nothing to clean up.
  }
}
