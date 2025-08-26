// Originally from: https://github.com/joegesualdo/vtt-to-json, licensed MIT © Joe Gesualdo
// Vendored: 2025-08-26

export interface VttWord {
  word: string;
  time: number | undefined;
}

export interface VttSection {
  start: number;
  end: number;
  part: string;
  words: VttWord[];
  speaker?: string;
}

// Constants for regex patterns and magic strings
const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g;
const TIME_MARKER_REGEX = /(<([0-9:.>]+)>)/gi;
const SPEAKER_TAG_REGEX = /<v\s+([^>]+)>/i;
const TIME_SEPARATOR = "-->";
const TIME_MARKER_PREFIX = "==";
const EMPTY_STRINGS = new Set(["", " ", "##"]);

// Utility functions
function stripHtmlTags(text: string): string {
  return text.replace(HTML_TAG_REGEX, "");
}

function extractSpeaker(text: string): { speaker?: string; cleanText: string } {
  const speakerMatch = text.match(SPEAKER_TAG_REGEX);
  if (speakerMatch) {
    return {
      speaker: speakerMatch[1].trim(),
      cleanText: text.replace(SPEAKER_TAG_REGEX, "").trim(),
    };
  }
  return { cleanText: text };
}

function isEmptyLine(line: string): boolean {
  // Check if line contains only whitespace (including various line endings)
  return /^\s*$/.test(line);
}

function isTimestampLine(line: string): boolean {
  return line.includes(TIME_SEPARATOR);
}

function parseTimestamp(line: string): { start: number; end: number } {
  const [startTime, endTime] = line.split(TIME_SEPARATOR).map((s) => s.trim());
  return {
    start: timeString2ms(startTime.split(" ").pop() || ""),
    end: timeString2ms(endTime.split(" ").shift() || ""),
  };
}

function parseWordsWithTimestamps(text: string): VttWord[] {
  const processedText = text
    .split(" ")
    .map((word) =>
      word.replace(
        TIME_MARKER_REGEX,
        (match) =>
          `${TIME_MARKER_PREFIX}${match.replace("<", "").replace(">", "")}`,
      ),
    )
    .join(" ");

  const cleanText = stripHtmlTags(processedText);

  return cleanText
    .split(" ")
    .filter((word) => word.length > 0)
    .map(parseWordWithTime)
    .filter((word): word is VttWord => word !== null);
}

function parseWordWithTime(item: string): VttWord | null {
  if (item.includes(TIME_MARKER_PREFIX)) {
    const [word, timeStr] = item.split(TIME_MARKER_PREFIX);
    if (EMPTY_STRINGS.has(word)) {
      return null;
    }
    return {
      word: cleanWord(word),
      time: timeString2ms(timeStr),
    };
  }

  return {
    word: cleanWord(item),
    time: undefined,
  };
}

function parseVttLines(lines: string[]): Omit<VttSection, "words">[] {
  const sections: Array<Omit<VttSection, "words">> = [];
  let current: Partial<Omit<VttSection, "words">> = {};
  let inSection = false;

  for (const line of lines) {
    if (isEmptyLine(line)) {
      // Empty line marks end of a section
      if (inSection && current.start !== undefined) {
        sections.push(current as Omit<VttSection, "words">);
        current = {};
        inSection = false;
      }
      continue;
    }

    if (isTimestampLine(line)) {
      // Start of a new section
      inSection = true;
      const timestamp = parseTimestamp(line);
      current = { ...timestamp, part: "", speaker: undefined };
    } else if (inSection) {
      // Content line within a section
      const { speaker, cleanText } = extractSpeaker(line);
      const cleanLine = stripHtmlTags(cleanText);

      // Skip duplicate lines
      if (
        sections.length > 0 &&
        stripHtmlTags(sections[sections.length - 1].part) === cleanLine
      ) {
        continue;
      }

      // Set speaker if found and not already set
      if (speaker && !current.speaker) {
        current.speaker = speaker;
      }

      // Use cleanText instead of original line to remove speaker tags
      current.part = current.part ? `${current.part} ${cleanText}` : cleanText;
    }
  }

  // Push final section if exists
  if (inSection && current.start !== undefined) {
    sections.push(current as Omit<VttSection, "words">);
  }

  return sections;
}

export function convertVttToJson(vttString: string): VttSection[] {
  if (!vttString?.trim()) {
    return [];
  }

  const lines = vttString.split("\n");
  const sections = parseVttLines(lines);

  return sections.map((section) => ({
    ...section,
    words: parseWordsWithTimestamps(section.part),
    part: stripHtmlTags(section.part),
  }));
}

function timeString2ms(timeString: string): number {
  const parts = timeString.split(".");
  const milliseconds = parseInt(parts[1]) || 0;
  const timeParts = parts[0].split(":").map(Number);

  if (timeParts.length === 3) {
    return (
      milliseconds +
      (timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]) * 1000
    );
  } else if (timeParts.length === 2) {
    return milliseconds + (timeParts[0] * 60 + timeParts[1]) * 1000;
  } else {
    return milliseconds + timeParts[0] * 1000;
  }
}

function cleanWord(word: string): string {
  return word.replace(/[^0-9a-z'-]/gi, "").toLowerCase();
}
