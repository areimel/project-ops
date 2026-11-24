import { formatKey } from "../../../shared/commands";
import { IS_MAC } from "../../utils/platform";

/** Key hint from a KeyboardEvent.key or Electron accelerator, e.g. `<Kbd k="CmdOrCtrl+O" />`. */
/** `mac` forces the Mac or non-Mac spelling (the styleguide shows both); default is this machine. */
export function Kbd({ k, mac }: { k: string; mac?: boolean }) {
  return <kbd>{formatKey(k, mac ?? IS_MAC)}</kbd>;
}
