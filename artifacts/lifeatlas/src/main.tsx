import { createRoot } from "react-dom/client";

import App from "./App";
import { ErrorBoundary, type ErrorFallbackProps } from "@/components/error-boundary";
import GlobalError from "@/app/global-error";

import "./index.css";

function GlobalFallback({ error, resetError }: ErrorFallbackProps) {
  return <GlobalError error={error} retry={resetError} />;
}

createRoot(document.getElementById("root")!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary FallbackComponent={GlobalFallback}>
    <App />
  </ErrorBoundary>,
);
