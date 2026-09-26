import { Component, ReactNode } from "react";
import { Button } from "@astryxdesign/core/Button";
import { RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8 max-w-md">
            <div className="mb-4 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Oops, something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error?.message && (
              <pre className="mb-6 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-md bg-gray-100 px-3 py-2 text-left text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={this.handleReset}
                size="lg"
                icon={<RefreshCw size={16} />}
                label="Try Again"
              />
              {/* 原地重置对「缓存/热更新污染」类错误可能立刻再崩：整页刷新才是可靠出口 */}
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                variant="ghost"
                label="Reload page"
              />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
