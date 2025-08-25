import * as JSZip from "jszip";

export interface WhisperFileMetadata {
  speakers: Speaker[];
  dateUpdated: number;
  detectedLanguageRaw: string;
  modelEngine: string;
  transcripts: Transcript[];
  modelLanguageID: string;
  originalMediaExtension: string;
  modelQualityID: string;
  wasTranslatedToEnglish: boolean;
  dateCreated: number;
  startTimeOffset: StartTimeOffset;
  originalMediaFilename: string;
}

export interface Speaker {
  name: string;
  color: number;
  id: string;
}

export interface StartTimeOffset {
  seconds: number;
  minutes: number;
  hours: number;
  milliseconds: number;
}

export interface Transcript {
  favorited: boolean;
  start: number;
  speaker: Speaker;
  unEven: boolean;
  text: string;
  id: string;
  end: number;
}

export interface WhisperFile {
  originalAudio: ArrayBuffer;
  metadata: WhisperFileMetadata;
}

export async function parse(arrayBuffer: ArrayBuffer): Promise<WhisperFile> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const originalAudio = await zip.file("originalAudio")!.async("arraybuffer");
  const metadata = JSON.parse(await zip.file("metadata.json")!.async("string"));

  return {
    originalAudio,
    metadata,
  };
}
