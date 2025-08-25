import { createResource, onCleanup, For } from "solid-js";
import { WhisperFile, Transcript } from "./whisperFile";
import styles from "./styles.module.css";

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
    <div class={styles.container}>
      {whisperData.loading && (
        <p class={styles.loadingText}>Loading whisper file...</p>
      )}
      {whisperData.error && (
        <p class={styles.errorText}>
          Error loading file: {whisperData.error.message}
        </p>
      )}

      {whisperData() && (
        <>
          <div class={styles.headerSection}>
            <div class={styles.metadata}>
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
              class={styles.audioPlayer}
            />
          </div>

          <div class={styles.transcriptContainer}>
            <div class={styles.transcriptScroll}>
              <For each={whisperData()!.metadata.transcripts}>
                {(transcript: Transcript) => (
                  <div
                    onClick={() => seekToTime(transcript.start)}
                    class={`${styles.transcriptItem} ${transcript.favorited ? styles.favorited : ""}`}
                    style={{
                      "--speaker-color": `hsl(${transcript.speaker.color * 45}, 60%, 45%)`,
                    }}
                  >
                    <div class={styles.transcriptMetadata}>
                      <span class={styles.speakerName}>
                        {transcript.speaker.name}
                      </span>
                      <span class={styles.timestamp}>
                        {formatTime(transcript.start)} -{" "}
                        {formatTime(transcript.end)}
                      </span>
                      {transcript.favorited && (
                        <span class={styles.favoriteStar}>★</span>
                      )}
                    </div>
                    <div class={styles.transcriptText}>{transcript.text}</div>
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
