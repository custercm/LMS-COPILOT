import { LMStudioClient, LMStudioConfig } from "./LMStudioClient";

export class ModelManager {
  private client: LMStudioClient;
  private currentModel: string;

  constructor(config?: Partial<LMStudioConfig>) {
    this.client = new LMStudioClient(config);
    this.currentModel = config?.model || "llama3";
  }

  async getAvailableModels(): Promise<string[]> {
    return await this.client.listModels();
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  setCurrentModel(model: string): void {
    this.currentModel = model;
  }
}
