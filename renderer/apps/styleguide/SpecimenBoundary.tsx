import { Component, type ReactNode } from "react";

interface Props { label: string; children: ReactNode }

/** One bad specimen shows a readable error in its own cell instead of blanking the page. */
export class SpecimenBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <p className="styleguide-error" role="alert">
        {this.props.label} did not render: {this.state.error.message || "unknown error"}
      </p>
    );
  }
}
