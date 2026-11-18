import { IconButton } from "../../components/common/IconButton";
import { Slider } from "../../components/common/Slider";
import { useHint } from "../../shell/ShellContext";
import { formatTime } from "../../utils/format";
import type { Playback } from "./usePlayback";
import { SEEK_STEP_SEC } from "./playerModel";

interface Props {
  p: Playback;
  fullscreen: boolean;
  onFullscreen: () => void;
}

/** The slim bar under the picture: play, seek, time, volume, fullscreen, open. */
export function PlayerControls({ p, fullscreen, onFullscreen }: Props) {
  const tip = useHint();
  return (
    <div className="player-controls">
      <IconButton icon={p.paused ? "play" : "pause"} label={tip("player.togglePlay")} onClick={p.toggle} />
      <Slider
        className="player-seek" label="Seek" value={p.time} max={p.duration || 1} buffered={p.buffered}
        keyStep={SEEK_STEP_SEC} onChange={p.seek} tooltip={formatTime} valueText={formatTime}
      />
      <span className="player-time">{formatTime(p.time)} / {formatTime(p.duration)}</span>
      <IconButton icon={p.muted || p.volume === 0 ? "mute" : "volume"} label={tip("player.mute")} onClick={p.toggleMute} />
      <Slider
        className="player-volume" label="Volume" value={p.muted ? 0 : p.volume} max={1} step={0.05}
        onChange={p.setVolume} valueText={(v) => `${Math.round(v * 100)}%`}
      />
      <IconButton icon={fullscreen ? "exitFullscreen" : "fullscreen"} label={tip("player.fullscreen")} onClick={onFullscreen} />
      <IconButton icon="folder" label={tip("player.open")} onClick={() => void p.open()} />
    </div>
  );
}
