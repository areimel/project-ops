import type { ModeSetting } from "../../shared/settings";
import { Icon, type IconName } from "../components/common/Icon";
import { IconButton } from "../components/common/IconButton";
import { Kbd } from "../components/common/Kbd";

const MODE_ICON: Record<ModeSetting, IconName> = { system: "monitor", light: "sun", dark: "moon" };

interface Props {
  name: string;
  mode: ModeSetting;
  /** Tooltip text per command id, from the command table. */
  hintOf(id: string): string;
  /** The palette command's key, from the command table. */
  paletteKey?: string;
  onPalette(): void;
  onCycleMode(): void;
  onSettings(): void;
}

/** In-page header under the native window frame: where you are, the command palette, mode and settings. */
export function TitleBar({ name, mode, hintOf, paletteKey, onPalette, onCycleMode, onSettings }: Props) {
  return (
    <header className="titlebar">
      <span className="titlebar-name">{name}</span>
      <div className="titlebar-actions">
        <button type="button" className="titlebar-palette" onClick={onPalette} title={hintOf("shell.palette")}>
          <Icon name="search" size={18} />
          <span>Search commands</span>
          {paletteKey && <Kbd k={paletteKey} />}
        </button>
        <IconButton icon={MODE_ICON[mode]} label={hintOf("shell.cycleMode")} onClick={onCycleMode} />
        <IconButton icon="settings" label={hintOf("shell.settings")} onClick={onSettings} />
      </div>
    </header>
  );
}
