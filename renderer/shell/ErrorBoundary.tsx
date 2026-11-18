import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { useShell } from "./ShellContext";

interface Props {
  /** The boundary clears itself when this changes (the app id). */
  resetKey: string;
  onError?(error: Error, info: ErrorInfo): void;
  children: ReactNode;
}
interface State { error: Error | null; attempt: number; key: string }

function Fallback({ error, onReload }: { error: Error; onReload(): void }) {
  const { navigate } = useShell();
  return (
    <div className="app-root error-sheet">
      <EmptyState
        icon="warning" title="This sheet stopped working"
        body={`Something went wrong while drawing it: ${error.message || "unknown error"}. Your saved data is not affected.`}
        action={(
          <div className="error-sheet-actions">
            <Button onClick={onReload}>Reload this sheet</Button>
            <Button variant="quiet" onClick={() => navigate({ type: "home" })}>Back to index</Button>
          </div>
        )}
      />
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> { return { error }; }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) { this.props.onError?.(error, info); }

  render() {
    if (this.state.error) {
      return <Fallback error={this.state.error} onReload={() => this.setState((s) => ({ error: null, attempt: s.attempt + 1 }))} />;
    }
    // Changing the key remounts the sheet, so "Reload this sheet" starts it from scratch.
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
