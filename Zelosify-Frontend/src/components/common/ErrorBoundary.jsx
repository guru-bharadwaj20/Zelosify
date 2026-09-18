"use client";
import { Component } from "react";
import ErrorComponent from "./ErrorComponent";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Something went wrong." };
  }

  componentDidCatch(error, info) {
    console.error("UI error boundary caught an error:", error, info);
  }

  handleRetry() {
    this.setState({ hasError: false, message: "" });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorComponent
          title={this.props.title || "This section could not be displayed"}
          message={this.state.message}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
