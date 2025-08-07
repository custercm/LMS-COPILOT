"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamHandler = void 0;
class StreamHandler {
    constructor(client, onChunkCallback) {
        this.abortController = null;
        this.client = client;
        this.onChunkCallback = onChunkCallback;
    }
    // Handle streaming responses from LM Studio API
    async streamResponse(message) {
        this.abortController = new AbortController();
        try {
            // Try to use streaming if available
            await this.client.streamMessage(message, this.onChunkCallback, this.abortController.signal);
        }
        catch (error) {
            if (this.abortController.signal.aborted) {
                return;
            }
            // Fallback to regular response and simulate streaming
            try {
                const response = await this.client.sendMessage(message);
                // Split response into chunks and emit each one with delay to simulate streaming
                const chunks = response.split(' ');
                for (const chunk of chunks) {
                    if (this.abortController.signal.aborted) {
                        break;
                    }
                    if (chunk.trim()) {
                        this.onChunkCallback(chunk + ' ');
                        // Small delay to simulate streaming
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                }
            }
            catch (fallbackError) {
                throw fallbackError;
            }
        }
    }
    // Cancel ongoing stream requests
    cancelStream() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}
exports.StreamHandler = StreamHandler;
