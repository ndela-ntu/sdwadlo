"use client";

import React, { ErrorInfo } from "react";
import { Button } from "../ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // You can log the error here
    console.error("Uncaught error:", error, errorInfo);
    // You can also send this error to an error reporting service
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-500">
          <div className="bg-500 p-8 rounded-lg shadow-md max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4 text-red-600">
              Oops! Something went wrong.
            </h1>
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Error Details:</h2>
              <pre className="bg-gray-500 p-2 rounded overflow-auto text-sm">
                {this.state.error && this.state.error.toString()}
              </pre>
            </div>
            {this.state.errorInfo && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Component Stack:</h2>
                <pre className="bg-gray-500 p-2 rounded overflow-auto text-sm">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
