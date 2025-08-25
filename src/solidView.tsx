import { createResource, onCleanup, For } from "solid-js";
import { WhisperFile, Transcript } from "./whisperFile";

interface SolidViewProps {
  whisperFile: Promise<WhisperFile>;
}

export default function SolidView(props: SolidViewProps) {
  let audioRef: HTMLAudioElement | undefined;

  const [whisperData] = createResource(
    () => props.whisperFile,
    (promise: Promise<WhisperFile>) => promise,
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

  const seekToTime = (timeInMs: number) => {
    if (audioRef) {
      audioRef.currentTime = timeInMs / 1000;
    }
  };

  const getTotalDuration = (transcripts: Transcript[]) => {
    if (transcripts.length === 0) return 0;
    return Math.max(...transcripts.map((t) => t.end));
  };

  onCleanup(() => {
    if (audioRef?.src) {
      URL.revokeObjectURL(audioRef.src);
    }
  });

  return (
    <div
      style={{
        padding: "16px",
        height: "100%",
        display: "flex",
        "flex-direction": "column",
      }}
    >
      {whisperData.loading && (
        <p style={{ color: "var(--text-normal)" }}>Loading whisper file...</p>
      )}
      {whisperData.error && (
        <p style={{ color: "var(--text-error)" }}>
          Error loading file: {whisperData.error.message}
        </p>
      )}

      {whisperData() && (
        <>
          <div style={{ "margin-bottom": "20px", "flex-shrink": 0 }}>
            <div
              style={{
                display: "flex",
                "flex-wrap": "wrap",
                gap: "16px",
                "font-size": "var(--font-text-size)",
                color: "var(--text-muted)",
                "margin-bottom": "12px",
              }}
            >
              <span>
                <strong>Language:</strong>{" "}
                {whisperData()!.metadata.detectedLanguageRaw}
              </span>
              <span>
                <strong>Model:</strong> {whisperData()!.metadata.modelEngine}
              </span>
              <span>
                <strong>Duration:</strong>{" "}
                {formatTime(
                  getTotalDuration(whisperData()!.metadata.transcripts),
                )}
              </span>
              <span>
                <strong>Segments:</strong>{" "}
                {whisperData()!.metadata.transcripts.length}
              </span>
            </div>
            <audio
              ref={audioRef}
              controls
              src={whisperData() ? createAudioUrl(whisperData()!) : undefined}
              style={{ width: "100%", "margin-bottom": "16px" }}
            />
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              "flex-direction": "column",
              "min-height": 0,
            }}
          >
            <div
              style={{
                flex: 1,
                "overflow-y": "auto",
                padding: "0 4px",
              }}
            >
              <For each={whisperData()!.metadata.transcripts}>
                {(transcript: Transcript, index) => (
                  <div
                    onClick={() => seekToTime(transcript.start)}
                    style={{
                      "margin-top": index() == 0 ? undefined : "16px",
                      padding: "4px 8px",
                      "background-color": transcript.favorited
                        ? "var(--background-modifier-success-hover)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      "border-radius": "4px",
                    }}
                    onMouseEnter={(e) => {
                      if (!transcript.favorited) {
                        e.currentTarget.style.backgroundColor =
                          "var(--background-modifier-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!transcript.favorited) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        "align-items": "center",
                        "margin-bottom": "8px",
                        "font-size": "var(--font-ui-smaller)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span
                        style={{
                          color: `hsl(${transcript.speaker.color * 45}, 60%, 45%)`,
                          "font-weight": "500",
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
                    <div
                      style={{
                        "font-size": "var(--font-text-size)",
                        "line-height": "var(--line-height-normal)",
                      }}
                    >
                      {transcript.text}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
