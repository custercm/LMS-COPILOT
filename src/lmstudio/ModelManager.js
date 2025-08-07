"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelManager = void 0;
const LMStudioClient_1 = require("./LMStudioClient");
class ModelManager {
    constructor(config) {
        this.client = new LMStudioClient_1.LMStudioClient(config);
        this.currentModel = config?.model || 'llama3';
    }
    async getAvailableModels() {
        return await this.client.listModels();
    }
    getCurrentModel() {
        return this.currentModel;
    }
    setCurrentModel(model) {
        this.currentModel = model;
    }
}
exports.ModelManager = ModelManager;
