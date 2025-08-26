import * as JSZip from "jszip";
import { TFile, Vault } from "obsidian";
import { convertVttToJson } from "./parseVtt";
import { convertVttToTranscript } from "./formatAdapter";

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

// Unified interface for both whisper and VTT files
export interface TranscriptFile {
  originalAudio?: ArrayBuffer; // Optional for VTT files
  metadata: WhisperFileMetadata;
}

// Audio file extensions to search for when loading VTT files
const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "webm", "ogg", "aac"];

async function findAssociatedAudio(
  vttFile: TFile,
  vault: Vault,
): Promise<ArrayBuffer | undefined> {
  const baseName = vttFile.basename;
  const folder = vttFile.parent;

  if (!folder) return undefined;

  // Search for audio files with the same basename
  for (const ext of AUDIO_EXTENSIONS) {
    const audioPath = `${folder.path}/${baseName}.${ext}`;
    const audioFile = vault.getAbstractFileByPath(audioPath);

    if (audioFile && audioFile instanceof TFile) {
      try {
        return await vault.readBinary(audioFile);
      } catch (error) {
        console.warn(`Failed to read audio file ${audioPath}:`, error);
        continue;
      }
    }
  }

  return undefined;
}

export async function parseTranscriptFile(
  file: TFile,
  vault: Vault,
): Promise<TranscriptFile> {
  if (file.extension === "whisper") {
    // Parse existing whisper ZIP file
    const arrayBuffer = await vault.readBinary(file);
    return parseWhisperFile(arrayBuffer);
  } else if (file.extension === "vtt") {
    // Parse VTT file
    const content = await vault.read(file);
    const vttSections = convertVttToJson(content);
    const converted = convertVttToTranscript(vttSections, file.name);

    // Try to find associated audio
    const originalAudio = await findAssociatedAudio(file, vault);

    // Create metadata in whisper format
    const metadata: WhisperFileMetadata = {
      speakers: converted.speakers,
      dateUpdated: converted.metadata.dateUpdated,
      detectedLanguageRaw: "unknown",
      modelEngine: "vtt",
      transcripts: converted.transcripts,
      modelLanguageID: "unknown",
      originalMediaExtension: originalAudio ? "unknown" : "",
      modelQualityID: "unknown",
      wasTranslatedToEnglish: false,
      dateCreated: converted.metadata.dateCreated,
      startTimeOffset: { seconds: 0, minutes: 0, hours: 0, milliseconds: 0 },
      originalMediaFilename:
        converted.metadata.originalMediaFilename || file.basename,
    };

    return {
      originalAudio,
      metadata,
    };
  } else {
    throw new Error(`Unsupported file extension: ${file.extension}`);
  }
}

// Legacy function for whisper files - keep for compatibility
async function parseWhisperFile(
  arrayBuffer: ArrayBuffer,
): Promise<TranscriptFile> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const originalAudio = await zip.file("originalAudio")!.async("arraybuffer");
  const metadata = JSON.parse(await zip.file("metadata.json")!.async("string"));

  return {
    originalAudio,
    metadata,
  };
}

// Re-export for compatibility
export async function parse(arrayBuffer: ArrayBuffer): Promise<TranscriptFile> {
  return parseWhisperFile(arrayBuffer);
}
