import { useRef, useState, type DragEvent } from "react";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { Icon } from "../../components/common/Icon";
import { useFullscreen } from "../../hooks/useFullscreen";
import { useCommandHandlers, useTitleInfo } from "../../shell/ShellContext";
import { formatBytes } from "../../utils/format";
import { isAudioName } from "../../../shared/mediaTypes";
import { SEEK_STEP_SEC } from "./playerModel";
import { PlayerControls } from "./PlayerControls";
import { usePlayback } from "./usePlayback";
import "./player.css";

export default function PlayerApp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const p = usePlayback();
  const fs = useFullscreen(rootRef);
  const [dragging, setDragging] = useState(false);
  const { file, error } = p;

  useTitleInfo({ count: file && !error ? formatBytes(file.sizeBytes) : undefined });
  useCommandHandlers({
    "player.open": () => void p.open(),
    "player.togglePlay": p.toggle,
    "player.back": () => p.seek(p.time - SEEK_STEP_SEC),
    "player.forward": () => p.seek(p.time + SEEK_STEP_SEC),
    "player.fullscreen": fs.toggle,
    "player.mute": p.toggleMute,
  });

  // The page never reads the dropped file. It hands the File objects to the preload, which turns them
  // into paths for main, and main decides whether and how to serve them.
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void p.openDropped(Array.from(e.dataTransfer.files));
  };
  const openButton = <Button icon="folder" onClick={() => void p.open()}>Open a file</Button>;

  let body;
  if (error) {
    body = <EmptyState icon="warning" title="Can't play this file" body={error} action={openButton} />;
  } else if (!file) {
    body = (
      <EmptyState
        icon="player" title="Nothing open yet" action={openButton}
        body="Open a video or audio file, or drop one here. MP4, WebM and MP3 play best."
      />
    );
  }

  return (
    <div
      ref={rootRef} className={`app-root player${dragging ? " is-dragging" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
      onDrop={onDrop}
    >
      {body ? <div className="player-empty">{body}</div> : file && (
        <>
          <div className="player-stage" onClick={p.toggle} onDoubleClick={fs.toggle}>
            {/* No `controls` attribute: the bar below is ours. The same element plays audio files. */}
            <video
              key={file.url} ref={p.videoRef} src={file.url} autoPlay
              className={isAudioName(file.name) ? "player-video is-audio" : "player-video"}
              onError={() => void p.onError()}
            />
            {isAudioName(file.name) && (
              <div className="player-audio-name"><Icon name="player" size={28} /><span>{file.name}</span></div>
            )}
          </div>
          <PlayerControls p={p} fullscreen={fs.active} onFullscreen={fs.toggle} />
        </>
      )}
    </div>
  );
}
