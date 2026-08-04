"use client";

// Minimal error boundary — renders nothing if a wrapped subtree throws, so a
// non-critical bolt-on (e.g. HelpLauncher) can never white-screen the app.

import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Swallow — this subtree is optional; failing silently is intended.
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
