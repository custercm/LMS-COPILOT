"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LMStudioClient_1 = require("./src/lmstudio/LMStudioClient");
const ModelManager_1 = require("./src/lmstudio/ModelManager");
const StreamHandler_1 = require("./src/lmstudio/StreamHandler");
// Test the integration of LM Studio components
async function testLMStudioIntegration() {
    console.log('Testing LM Studio component integration...');
    try {
        // Test 1: LMStudioClient initialization
        console.log('1. Testing LMStudioClient initialization...');
        const client = new LMStudioClient_1.LMStudioClient({
            endpoint: 'http://localhost:1234',
            model: 'test-model',
            timeout: 5000,
            maxTokens: 100
        });
        console.log('✓ LMStudioClient initialized successfully');
        // Test 2: ModelManager initialization
        console.log('2. Testing ModelManager initialization...');
        const modelManager = new ModelManager_1.ModelManager({
            endpoint: 'http://localhost:1234',
            model: 'test-model'
        });
        console.log('✓ ModelManager initialized successfully');
        console.log(`Current model: ${modelManager.getCurrentModel()}`);
        // Test 3: StreamHandler initialization
        console.log('3. Testing StreamHandler initialization...');
        const chunks = [];
        const streamHandler = new StreamHandler_1.StreamHandler(client, (chunk) => {
            chunks.push(chunk);
            console.log(`Received chunk: ${chunk}`);
        });
        console.log('✓ StreamHandler initialized successfully');
        // Test 4: Test connection status methods
        console.log('4. Testing connection status...');
        const status = client.getConnectionStatus();
        console.log(`✓ Connection status: ${status.state}`);
        console.log('🎉 All component integration tests completed successfully!');
        return true;
    }
    catch (error) {
        console.error('❌ Integration test failed:', error);
        return false;
    }
}
// Run the test
testLMStudioIntegration().then(success => {
    if (success) {
        console.log('Integration test passed');
    }
    else {
        console.log('Integration test failed');
        process.exit(1);
    }
});
