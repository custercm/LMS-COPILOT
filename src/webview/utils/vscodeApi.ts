export function getVsCodeAPI() {
  if (typeof acquireVsCodeApi !== 'undefined') {
    return acquireVsCodeApi();
  }
  throw new Error('VS Code API not available');
}