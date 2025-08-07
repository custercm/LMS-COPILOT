import { LMStudioClient } from './src/lmstudio/LMStudioClient';
import { ModelManager } from './src/lmstudio/ModelManager';
import { StreamHandler } from './src/lmstudio/StreamHandler';

// Test the integration of LM Studio components
async function testLMStudioIntegration(): Promise<boolean> {
    console.log('Testing LM Studio component integration...');
    
    try {
        // Test 1: LMStudioClient initialization
        console.log('1. Testing LMStudioClient initialization...');
        const client = new LMStudioClient({
            endpoint: 'http://localhost:1234',
            model: 'test-model',
            timeout: 5000,
            maxTokens: 100
        });
        console.log('✓ LMStudioClient initialized successfully');
        
        // Test 2: ModelManager initialization
        console.log('2. Testing ModelManager initialization...');
        const modelManager = new ModelManager({
            endpoint: 'http://localhost:1234',
            model: 'test-model'
        });
        console.log('✓ ModelManager initialized successfully');
        console.log(`Current model: ${modelManager.getCurrentModel()}`);
        
        // Test 3: StreamHandler initialization
        console.log('3. Testing StreamHandler initialization...');
        const chunks: string[] = [];
        const streamHandler = new StreamHandler(client, (chunk: string) => {
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
        
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        return false;
    }
}

// Run the test
testLMStudioIntegration().then(success => {
    if (success) {
        console.log('Integration test passed');
    } else {
        console.log('Integration test failed');
        process.exit(1);
    }
});
