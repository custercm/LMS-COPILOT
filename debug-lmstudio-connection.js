// Debug script to test LM Studio connection
const axios = require('axios');

async function testLMStudioConnection() {
    console.log('🔍 Testing LM Studio Connection...\n');
    
    const endpoint = 'http://localhost:1234';
    
    try {
        // Test 1: Check if LM Studio is running
        console.log('1. Testing if LM Studio is running...');
        const healthResponse = await axios.get(`${endpoint}/v1/models`, {
            timeout: 5000
        });
        
        console.log('✅ LM Studio is running!');
        console.log('Available models:', healthResponse.data.data?.map(m => m.id) || 'No models found');
        
        // Test 2: Test a simple chat completion
        console.log('\n2. Testing chat completion...');
        const chatResponse = await axios.post(`${endpoint}/v1/chat/completions`, {
            model: "qwen", // Use the simplest model name
            messages: [{ role: 'user', content: 'Hello, can you respond with just "Hello back!"?' }],
            max_tokens: 50,
            temperature: 0.1
        }, {
            timeout: 10000
        });
        
        console.log('✅ Chat completion works!');
        console.log('Response:', chatResponse.data.choices[0]?.message?.content || 'No response');
        
        // Test 3: Test project creation prompt
        console.log('\n3. Testing project creation prompt...');
        const projectResponse = await axios.post(`${endpoint}/v1/chat/completions`, {
            model: "qwen",
            messages: [{ 
                role: 'user', 
                content: 'I want to create a simple React project. Please respond with exactly: CREATE_PROJECT:REACT:my-app' 
            }],
            max_tokens: 100,
            temperature: 0.1
        }, {
            timeout: 15000
        });
        
        console.log('✅ Project creation prompt works!');
        console.log('Response:', projectResponse.data.choices[0]?.message?.content || 'No response');
        
        console.log('\n🎉 All tests passed! LM Studio connection is working.');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting steps:');
            console.log('1. Make sure LM Studio is running');
            console.log('2. Check that the server is started in LM Studio');
            console.log('3. Verify the endpoint is http://localhost:1234');
            console.log('4. Ensure a model is loaded in LM Studio');
        } else if (error.response) {
            console.log('Server responded with error:', error.response.status, error.response.data);
        } else {
            console.log('Network or other error:', error.message);
        }
    }
}

testLMStudioConnection();
