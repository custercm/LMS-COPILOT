#!/usr/bin/env node

const axios = require('axios');

async function testLMStudioConnection() {
    console.log('🔄 Testing LM Studio connection...');
    
    try {
        // Test 1: Check if server is running
        console.log('1. Testing server availability...');
        const modelsResponse = await axios.get('http://localhost:1234/v1/models', {
            timeout: 5000
        });
        
        console.log('✅ Server is running!');
        console.log('📋 Available models:');
        modelsResponse.data.data.forEach(model => {
            console.log(`   - ${model.id}`);
        });
        
        // Test 2: Test chat completion
        console.log('\n2. Testing chat completion...');
        const chatResponse = await axios.post('http://localhost:1234/v1/chat/completions', {
            model: 'qwen3-coder-30b-a3b-instruct-1m@q4_k_xl',
            messages: [
                { role: 'user', content: 'Say "Connection test successful!" and nothing else.' }
            ],
            max_tokens: 10,
            temperature: 0.1
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Chat completion successful!');
        console.log('🤖 AI Response:', chatResponse.data.choices[0].message.content);
        
        console.log('\n🎉 All tests passed! LM Studio is ready for the extension.');
        
    } catch (error) {
        console.error('❌ Connection test failed!');
        
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 LM Studio server is not running. Please:');
            console.error('   1. Open LM Studio');
            console.error('   2. Load a model');
            console.error('   3. Start the local server');
        } else if (error.response) {
            console.error(`📡 Server responded with error: ${error.response.status}`);
            console.error('📄 Response:', error.response.data);
        } else {
            console.error('🔧 Error details:', error.message);
        }
        
        process.exit(1);
    }
}

testLMStudioConnection();
