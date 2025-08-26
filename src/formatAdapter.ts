import { VttSection } from "./parseVtt";
import { Speaker, Transcript } from "./transcriptFile";

// Generate colors for speakers
const SPEAKER_COLORS = [
  0xff6b6b, // Red
  0x4ecdc4, // Teal
  0x45b7d1, // Blue
  0x96ceb4, // Green
  0xffeaa7, // Yellow
  0xdda0dd, // Plum
  0xf7b731, // Orange
  0x5f27cd, // Purple
  0x00d2d3, // Cyan
  0xff9ff3, // Pink
];

export interface VttToTranscriptResult {
  transcripts: Transcript[];
  speakers: Speaker[];
  metadata: {
    originalMediaFilename?: string;
    dateCreated: number;
    dateUpdated: number;
  };
}

export function convertVttToTranscript(
  vttSections: VttSection[],
  filename: string,
): VttToTranscriptResult {
  // Extract unique speakers
  const speakerMap = new Map<string, Speaker>();
  const unknownSpeaker: Speaker = {
    id: "unknown",
    name: "Unknown Speaker",
    color: SPEAKER_COLORS[0],
  };

  speakerMap.set("unknown", unknownSpeaker);

  // Create speakers from VTT data
  let colorIndex = 1;
  vttSections.forEach((section) => {
    if (section.speaker && !speakerMap.has(section.speaker)) {
      const speaker: Speaker = {
        id: section.speaker.toLowerCase().replace(/\s+/g, "_"),
        name: section.speaker,
        color: SPEAKER_COLORS[colorIndex % SPEAKER_COLORS.length],
      };
      speakerMap.set(section.speaker, speaker);
      colorIndex++;
    }
  });

  // Convert VTT sections to transcripts
  const transcripts: Transcript[] = vttSections.map((section) => {
    const speaker = section.speaker
      ? speakerMap.get(section.speaker) || unknownSpeaker
      : unknownSpeaker;

    return {
      id: section.cueId || crypto.randomUUID(),
      start: section.start,
      end: section.end,
      text: section.part,
      speaker,
      favorited: false,
      unEven: false, // VTT doesn't have this concept
    };
  });

  const now = Date.now();
  const speakers = Array.from(speakerMap.values());

  return {
    transcripts,
    speakers,
    metadata: {
      originalMediaFilename: filename.replace(/\.vtt$/, ""),
      dateCreated: now,
      dateUpdated: now,
    },
  };
}
