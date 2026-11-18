import type { ReactNode } from "react";
import type { SystemInfo, SystemSample } from "../../../shared/ipc/system";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { Spinner } from "../../components/common/Spinner";
import { formatBytes } from "../../utils/format";
import { formatPercent, formatUptime, fraction } from "./systemFormat";
import { useSystem } from "./useSystem";
import "./system.css";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="system-row"><dt>{label}</dt><dd>{children}</dd></div>;
}

/** A plain ruled bar. The value is also printed next to it, so the bar adds no information a screen reader misses. */
function Bar({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="system-meter">
      <div className="system-bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
        <div className="system-bar-fill" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="system-meter-text">{text}</span>
    </div>
  );
}

function Machine({ info }: { info: SystemInfo }) {
  const { versions: v } = info;
  return (
    <section className="system-section" aria-labelledby="system-machine">
      <h2 id="system-machine">This computer</h2>
      <dl className="system-table">
        <Row label="Operating system">{info.os} {info.release}</Row>
        <Row label="Architecture">{info.arch}</Row>
        <Row label="Processor">{info.cpuModel}</Row>
        <Row label="Cores">{info.cores}</Row>
        <Row label="Memory">{formatBytes(info.totalMemBytes)}</Row>
        <Row label="App version">{v.app}</Row>
        <Row label="Electron">{v.electron}</Row>
        <Row label="Chrome">{v.chrome}</Row>
        <Row label="Node">{v.node}</Row>
      </dl>
    </section>
  );
}

function Live({ s }: { s: SystemSample }) {
  return (
    <section className="system-section" aria-labelledby="system-live">
      <h2 id="system-live">Right now</h2>
      <dl className="system-table">
        <Row label="CPU use"><Bar label="CPU use" value={fraction(s.cpuPercent, 100)} text={formatPercent(s.cpuPercent)} /></Row>
        <Row label="Memory in use">
          <Bar label="Memory in use" value={fraction(s.memUsedBytes, s.memTotalBytes)}
            text={`${formatBytes(s.memUsedBytes)} of ${formatBytes(s.memTotalBytes)}`} />
        </Row>
        <Row label="This app's memory">{formatBytes(s.appMemBytes)}</Row>
        <Row label="Uptime">{formatUptime(s.uptimeSec)}</Row>
        <Row label="Load average"><span className="system-load">{(["1", "5", "15"] as const).map((m, i) => <span key={m}>{s.loadAvg[i].toFixed(2)}</span>)}</span> <span className="system-note">(1, 5, 15 min)</span></Row>
      </dl>
    </section>
  );
}

export default function SystemApp() {
  const { info, sample, error, retry } = useSystem();
  let body: ReactNode;
  if (error) {
    body = <EmptyState icon="system" title="Couldn't read system information" body={error} action={<Button onClick={retry}>Try again</Button>} />;
  } else if (!info || !sample) {
    body = <div className="system-loading"><Spinner label="Reading system information" /></div>;
  } else {
    body = <><Live s={sample} /><Machine info={info} /></>;
  }
  return <div className="app-root system">{body}</div>;
}
