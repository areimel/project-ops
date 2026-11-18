import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaFile } from "../../../shared/ipc/player";
import { clamp } from "../../utils/format";
import { UNSUPPORTED_MESSAGE } from "../../../shared/mediaTypes";

/** Native-only playback: which file is open, and the <video> element's state mirrored into React. */
export function usePlayback() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<MediaFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  // Main allowlists one file at a time. Leaving the sheet releases it and lets the screen sleep again.
  useEffect(() => () => {
    void window.app.invoke("player:close");
    void window.app.invoke("player:set-playing", false);
  }, []);

  useEffect(() => {
    void window.app.invoke("player:set-playing", file !== null && !paused && error === null);
  }, [file, paused, error]);

  // Mirror the element's state. Its events are the source of truth; nothing here polls.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const sync = () => {
      setTime(v.currentTime);
      setPaused(v.paused);
      setDuration(Number.isFinite(v.duration) ? v.duration : 0);
      setBuffered(v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0);
    };
    const events = ["timeupdate", "progress", "play", "pause", "durationchange", "seeked", "loadedmetadata", "emptied"];
    events.forEach((e) => v.addEventListener(e, sync));
    sync();
    return () => events.forEach((e) => v.removeEventListener(e, sync));
  }, [file]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) { v.volume = volume; v.muted = muted; }
  }, [file, volume, muted]);

  /** Runs one open request (dialog or drop). null means nothing was chosen: keep what is showing. */
  const load = useCallback(async (request: () => Promise<MediaFile | null>) => {
    try {
      const next = await request();
      if (!next) return;
      setError(null);
      setFile(next);
    } catch (e) {
      setFile(null);
      setError(e instanceof Error ? e.message : UNSUPPORTED_MESSAGE);
    }
  }, []);

  const open = useCallback(() => load(() => window.app.invoke("player:open-dialog")), [load]);
  const openDropped = useCallback((files: File[]) => load(() => window.app.drop("player:open-dropped", files)), [load]);

  /** The element could not play the file. Say why: gone from disk, or a format Chromium cannot decode. */
  const onError = useCallback(async () => {
    const present = await window.app.invoke("player:is-open-file-present");
    setError(present ? UNSUPPORTED_MESSAGE : "This file is no longer there. It may have been moved or deleted.");
  }, []);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  }, []);

  const seek = useCallback((to: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = clamp(to, 0, duration);
    setTime(v.currentTime);
  }, [duration]);

  const setVolume = useCallback((n: number) => {
    setVolumeState(clamp(n, 0, 1));
    if (n > 0) setMuted(false);
  }, []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  return { videoRef, file, error, paused, time, duration, buffered, volume, muted, open, openDropped, onError, toggle, seek, setVolume, toggleMute };
}

export type Playback = ReturnType<typeof usePlayback>;
