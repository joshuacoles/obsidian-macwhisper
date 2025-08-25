import { createSignal, createResource, onCleanup, For } from "solid-js";
import { TFile } from "obsidian";
import * as whisperFile from "./whisperFile";
import { WhisperFile, Transcript } from "./whisperFile";

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

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  onCleanup(() => {
    if (audioRef?.src) {
      URL.revokeObjectURL(audioRef.src);
    }
  });

  return (
    <div style={{ padding: "16px" }}>
      <h4>Whisper Transcription</h4>

      <audio
        ref={audioRef}
        controls
        src={whisperData() ? createAudioUrl(whisperData()!) : undefined}
        style={{ width: "100%", "margin-bottom": "16px" }}
      />

      {whisperData.loading && <p>Loading whisper file...</p>}
      {whisperData.error && (
        <p style={{ color: "red" }}>
          Error loading file: {whisperData.error.message}
        </p>
      )}

      {whisperData() && (
        <div>
          <div
            style={{
              "margin-bottom": "16px",
              padding: "12px",
              border: "1px solid #ccc",
              "border-radius": "4px",
            }}
          >
            <h5 style={{ margin: "0 0 8px 0" }}>File Information</h5>
            <p style={{ margin: "4px 0" }}>
              <strong>Original Filename:</strong>{" "}
              {whisperData()!.metadata.originalMediaFilename}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Language:</strong>{" "}
              {whisperData()!.metadata.detectedLanguageRaw}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Model:</strong> {whisperData()!.metadata.modelEngine}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Created:</strong>{" "}
              {formatDate(whisperData()!.metadata.dateCreated)}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Total Segments:</strong>{" "}
              {whisperData()!.metadata.transcripts.length}
            </p>
          </div>

          <div>
            <h5 style={{ "margin-bottom": "8px" }}>Transcript</h5>
            <div
              style={{
                "max-height": "400px",
                "overflow-y": "auto",
                border: "1px solid #ccc",
                "border-radius": "4px",
              }}
            >
              <For each={whisperData()!.metadata.transcripts}>
                {(transcript: Transcript) => (
                  <div
                    style={{
                      padding: "8px 12px",
                      "border-bottom": "1px solid #eee",
                      "background-color": transcript.favorited
                        ? "#fff3cd"
                        : "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        "align-items": "center",
                        "margin-bottom": "4px",
                        "font-size": "12px",
                        color: "#666",
                      }}
                    >
                      <span
                        style={{
                          color: `hsl(${transcript.speaker.color}, 70%, 50%)`,
                          "font-weight": "bold",
                          "margin-right": "8px",
                        }}
                      >
                        {transcript.speaker.name}
                      </span>
                      <span style={{ "margin-right": "8px" }}>
                        {formatTime(transcript.start)} -{" "}
                        {formatTime(transcript.end)}
                      </span>
                      {transcript.favorited && (
                        <span style={{ color: "#ffc107" }}>★</span>
                      )}
                    </div>
                    <div style={{ "font-size": "14px", "line-height": "1.4" }}>
                      {transcript.text}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
