import {
  createResource,
  onCleanup,
  For,
  createSignal,
  createEffect,
  onMount,
  createMemo,
} from "solid-js";
import { WhisperFile, Transcript } from "./whisperFile";
import { TimeRange, formatTimeFromMs } from "./timeRangeUtils";
import styles from "./styles.module.css";

interface SolidViewProps {
  whisperFile: Promise<WhisperFile>;
  timeRange?: TimeRange;
}

export default function SolidView(props: SolidViewProps) {
  let audioRef: HTMLAudioElement | undefined;
  let transcriptRefs: HTMLDivElement[] = [];

  const [activeTranscriptIndex, setActiveTranscriptIndex] =
    createSignal<number>(-1);

  const [whisperData] = createResource(
    () => props.whisperFile,
    (promise: Promise<WhisperFile>) => promise,
  );

  // Filter transcripts based on time range
  const filteredTranscripts = createMemo(() => {
    const data = whisperData();
    if (!data || !props.timeRange) {
      return data?.metadata.transcripts || [];
    }

    const { start, end } = props.timeRange;
    return data.metadata.transcripts.filter(
      (transcript) =>
        // Include transcript if it overlaps with the time range
        transcript.start < end && transcript.end > start,
    );
  });

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

  const getDisplayDuration = () => {
    if (props.timeRange) {
      return props.timeRange.end - props.timeRange.start;
    }
    return getTotalDuration(filteredTranscripts());
  };

  const findActiveTranscriptIndex = (
    currentTime: number,
    transcripts: Transcript[],
  ) => {
    const currentTimeMs = currentTime * 1000;
    return transcripts.findIndex(
      (transcript) =>
        currentTimeMs >= transcript.start && currentTimeMs <= transcript.end,
    );
  };

  const handleTimeUpdate = () => {
    if (!audioRef || !whisperData()) return;

    const transcripts = filteredTranscripts();
    const newIndex = findActiveTranscriptIndex(
      audioRef.currentTime,
      transcripts,
    );

    if (newIndex !== activeTranscriptIndex()) {
      setActiveTranscriptIndex(newIndex);
    }
  };

  // Set up audio event listeners when audio element becomes available
  createEffect(() => {
    const audio = audioRef;
    const data = whisperData();

    if (audio && data) {
      console.log("Setting up timeupdate listener on audio element");

      const setupListener = () => {
        audio.addEventListener("timeupdate", handleTimeUpdate);
        console.log("Timeupdate listener attached");
      };

      if (audio.src && audio.readyState >= 1) {
        // Audio is already ready
        setupListener();
      } else {
        // Wait for audio to be ready
        audio.addEventListener("loadeddata", setupListener, { once: true });
      }

      return () => {
        console.log("Cleaning up timeupdate listener");
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadeddata", setupListener);
      };
    }
  });

  // Auto-scroll to active transcript
  createEffect(() => {
    const activeIndex = activeTranscriptIndex();
    if (activeIndex >= 0 && transcriptRefs[activeIndex]) {
      transcriptRefs[activeIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  });

  onCleanup(() => {
    if (audioRef?.src) {
      URL.revokeObjectURL(audioRef.src);
    }
    // Cleanup will be handled by the createEffect cleanup function
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
              {props.timeRange ? (
                <>
                  <span>
                    <strong>Range:</strong>{" "}
                    {formatTimeFromMs(props.timeRange.start)} -{" "}
                    {formatTimeFromMs(props.timeRange.end)}
                  </span>
                  <span>
                    <strong>Duration:</strong>{" "}
                    {formatTime(getDisplayDuration())}
                  </span>
                </>
              ) : (
                <span>
                  <strong>Duration:</strong>{" "}
                  {formatTime(
                    getTotalDuration(whisperData()!.metadata.transcripts),
                  )}
                </span>
              )}
              <span>
                <strong>Segments:</strong> {filteredTranscripts().length}
                {props.timeRange &&
                  ` (of ${whisperData()!.metadata.transcripts.length})`}
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
              <For each={filteredTranscripts()}>
                {(transcript: Transcript, index) => (
                  <div
                    ref={(el) => (transcriptRefs[index()] = el!)}
                    onClick={() => seekToTime(transcript.start)}
                    class={`${styles.transcriptItem} ${transcript.favorited ? styles.favorited : ""} ${activeTranscriptIndex() === index() ? styles.activeTranscript : ""}`}
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
