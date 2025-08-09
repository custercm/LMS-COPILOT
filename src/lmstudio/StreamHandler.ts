import { LMStudioClient } from "./LMStudioClient";

export class StreamHandler {
  private client: LMStudioClient;
  private onChunkCallback: (chunk: string) => void;
  private abortController: AbortController | null = null;

  constructor(
    client: LMStudioClient,
    onChunkCallback: (chunk: string) => void,
  ) {
    this.client = client;
    this.onChunkCallback = onChunkCallback;
  }

  // Handle streaming responses from LM Studio API
  async streamResponse(message: string): Promise<void> {
    this.abortController = new AbortController();

    try {
      // Try to use streaming if available
      await this.client.streamMessage(
        message,
        this.onChunkCallback,
        this.abortController?.signal,
      );
    } catch (error) {
      if (this.abortController?.signal.aborted) {
        return;
      }

      // Fallback to regular response and simulate streaming
      try {
        const response = await this.client.sendMessage(message);

        // Split response into chunks and emit each one with delay to simulate streaming
        const chunks = response.split(" ");
        for (const chunk of chunks) {
          if (this.abortController?.signal.aborted) {
            break;
          }
          if (chunk.trim()) {
            this.onChunkCallback(chunk + " ");
            // Small delay to simulate streaming
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  }

  // Cancel ongoing stream requests
  cancelStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
