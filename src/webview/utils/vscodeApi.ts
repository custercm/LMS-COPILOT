// Declare the VS Code API function that's available in webview context
declare function acquireVsCodeApi(): any;

export function getVsCodeAPI() {
  if (typeof acquireVsCodeApi !== "undefined") {
    return acquireVsCodeApi();
  }
  throw new Error("VS Code API not available");
}
