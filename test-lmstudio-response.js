/**
 * Test LM Studio connection and response format
 * This will help identify if the issue is with the AI model's responses
 */

const axios = require('axios');

console.log('🔗 Testing LM Studio Connection and Response Format...\n');

async function testLMStudioConnection() {
    const endpoint = 'http://localhost:1234';
    
    try {
        // Test 1: Check if LM Studio is running
        console.log('1. 🔍 Testing LM Studio connection...');
        const modelsResponse = await axios.get(`${endpoint}/v1/models`, { timeout: 5000 });
        console.log('✅ LM Studio is running');
        console.log('📋 Available models:', modelsResponse.data.data.map(m => m.id));
        
        // Test 2: Send a test message to see the response format
        console.log('\n2. 🤖 Testing AI response format...');
        
        const systemPrompt = `You are an AI coding assistant with file operation capabilities. When users request file operations like creating, editing, or analyzing files, respond with a JSON action block in this format:

\`\`\`json
{
  "action": "create_file",
  "params": {
    "path": "filename.ext",
    "content": "file content here"
  }
}
\`\`\`

Always include both the JSON action AND a human-readable explanation.`;

        const testMessage = "Create a file named hello.js with console.log('Hello from agent mode!');";
        
        console.log('📤 Sending test message:', testMessage);
        
        const chatResponse = await axios.post(
            `${endpoint}/v1/chat/completions`,
            {
                model: 'qwen3-coder-30b-a3b-instruct-1m@q4_k_xl', // Using your default model
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: testMessage }
                ],
                max_tokens: 2000,
                temperature: 0.7
            },
            { timeout: 30000 }
        );
        
        const aiResponse = chatResponse.data.choices[0].message.content;
        console.log('\n📥 AI Response:');
        console.log('=' + '='.repeat(60));
        console.log(aiResponse);
        console.log('=' + '='.repeat(60));
        
        // Test 3: Parse the response using the same logic as the extension
        console.log('\n3. 🔍 Testing response parsing...');
        
        const jsonMatch = aiResponse.match(/```json\s*\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            console.log('✅ Found JSON code block');
            const jsonStr = jsonMatch[1].trim();
            
            try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.action && parsed.params) {
                    console.log('✅ Valid action structure');
                    console.log('🎯 Action:', parsed.action);
                    console.log('📁 Path:', parsed.params.path);
                    console.log('📄 Content preview:', parsed.params.content.substring(0, 50) + '...');
                    console.log('\n🎉 SUCCESS: This response SHOULD trigger agent mode!');
                } else {
                    console.log('❌ Invalid action structure - missing action or params');
                }
            } catch (error) {
                console.log('❌ JSON parsing failed:', error.message);
            }
        } else {
            console.log('❌ No JSON code block found in response');
            console.log('💡 The AI model is not outputting the required JSON format');
            console.log('🔧 Solution: The model needs better prompting or a different model');
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ LM Studio is not running or not accessible');
            console.log('💡 Solution: Start LM Studio and ensure it\'s running on http://localhost:1234');
        } else if (error.response) {
            console.log('❌ LM Studio error:', error.response.status, error.response.statusText);
            console.log('💡 Response:', error.response.data);
        } else {
            console.log('❌ Connection error:', error.message);
        }
    }
}

// Run the test
testLMStudioConnection().catch(console.error);
