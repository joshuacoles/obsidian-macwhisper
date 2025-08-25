export interface TimeRange {
  start: number; // milliseconds
  end: number; // milliseconds
}

/**
 * Parse a time string in MM:SS or M:SS format to milliseconds
 * @param timeStr Time string like "01:30" or "1:30"
 * @returns Time in milliseconds
 */
export function parseTimeToMs(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);

  if (
    isNaN(minutes) ||
    isNaN(seconds) ||
    minutes < 0 ||
    seconds < 0 ||
    seconds >= 60
  ) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  return (minutes * 60 + seconds) * 1000;
}

/**
 * Parse a time range string in MM:SS-MM:SS format
 * @param rangeStr Time range string like "01:30-02:45"
 * @returns TimeRange object with start and end in milliseconds
 */
export function parseTimeRange(rangeStr: string): TimeRange {
  const parts = rangeStr.split("-");
  if (parts.length !== 2) {
    throw new Error(`Invalid time range format: ${rangeStr}`);
  }

  const start = parseTimeToMs(parts[0].trim());
  const end = parseTimeToMs(parts[1].trim());

  if (start >= end) {
    throw new Error(`Invalid time range: start time must be before end time`);
  }

  return { start, end };
}

/**
 * Extract file path and time range from a src attribute
 * @param src Source string like "file.whisper" or "file.whisper#01:30-02:45"
 * @returns Object with filePath and optional timeRange
 */
export function parseEmbedSrc(src: string): {
  filePath: string;
  timeRange?: TimeRange;
} {
  const parts = src.split("#");
  const filePath = parts[0];

  if (parts.length === 1) {
    return { filePath };
  }

  if (parts.length === 2) {
    try {
      const timeRange = parseTimeRange(parts[1]);
      return { filePath, timeRange };
    } catch (error) {
      console.warn(
        `Failed to parse time range "${parts[1]}": ${error.message}`,
      );
      return { filePath };
    }
  }

  // More than one # - just use the first part as file path
  return { filePath };
}

/**
 * Format milliseconds back to MM:SS format
 * @param ms Time in milliseconds
 * @returns Formatted time string
 */
export function formatTimeFromMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
