import { createSignal, createResource, onCleanup } from "solid-js";
import { TFile } from "obsidian";
import * as whisperFile from "./whisperFile";
import { WhisperFile } from "./whisperFile";

interface SolidViewProps {
  file: TFile;
  vault: any;
}

export default function SolidView(props: SolidViewProps) {
  let audioRef: HTMLAudioElement | undefined;

  const [whisperData] = createResource(
    () => props.file,
    async (file: TFile) => {
      const contents = await props.vault.readBinary(file);
      return whisperFile.parse(contents);
    },
  );

  const createAudioUrl = (whisperFile: WhisperFile) => {
    const blob = new Blob([whisperFile.originalAudio], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  };

  onCleanup(() => {
    if (audioRef?.src) {
      URL.revokeObjectURL(audioRef.src);
    }
  });

  return (
    <div>
      <h4>This is a whisper view</h4>
      <audio
        ref={audioRef}
        controls
        src={whisperData() ? createAudioUrl(whisperData()!) : undefined}
      />
      {whisperData.loading && <p>Loading whisper file...</p>}
      {whisperData.error && (
        <p>Error loading file: {whisperData.error.message}</p>
      )}
    </div>
  );
}
