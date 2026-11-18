// Which files the Player plays. Used by the main process (what it will serve and which dialog filter to
// show) and by the renderer (audio or video, the unsupported message). Pure: no electron, React or DOM.

/** What Chromium plays by itself. Anything else is refused: this template ships no ffmpeg. */
const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  mp4: "video/mp4", m4v: "video/mp4", mov: "video/mp4", webm: "video/webm", ogv: "video/ogg",
  mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", wav: "audio/wav", flac: "audio/flac",
};
const AUDIO = new Set(["mp3", "m4a", "ogg", "wav", "flac"]);

export const MEDIA_EXTENSIONS = Object.keys(MIME_BY_EXTENSION);
export const UNSUPPORTED_MESSAGE = "This file's format isn't supported. Try MP4, WebM or MP3.";

export function extensionOf(name: string): string {
  const m = /\.([^./\\]+)$/.exec(name);
  return m ? m[1]!.toLowerCase() : "";
}

export const isMediaExtension = (name: string): boolean => Object.hasOwn(MIME_BY_EXTENSION, extensionOf(name));
export const isAudioName = (name: string): boolean => AUDIO.has(extensionOf(name));
export const mimeForName = (name: string): string => MIME_BY_EXTENSION[extensionOf(name)] ?? "application/octet-stream";

