// Test script to verify agent action parsing and execution
const { LMStudioClient } = require('./src/lmstudio/LMStudioClient');
const { AgentManager } = require('./src/agent/AgentManager');

async function testAgentActions() {
    console.log('🧪 Testing Agent Action Parsing and Execution...\n');

    // Mock LMStudioClient for testing
    const mockClient = {
        sendMessage: async (message) => {
            console.log('📤 Sending to LM Studio:', message);
            
            // Simulate different AI responses based on input
            if (message.includes('create a hello world')) {
                return `I'll create a hello world JavaScript file for you:

\`\`\`json
{
  "action": "create_file",
  "params": {
    "path": "hello.js",
    "content": "console.log('Hello, World!');\\n",
    "description": "Simple hello world JavaScript file"
  }
}
\`\`\`

This will create a basic hello.js file that prints "Hello, World!" to the console.`;
            }
            
            if (message.includes('edit package.json')) {
                return `I'll edit the package.json file to add a new dependency:

\`\`\`json
{
  "action": "edit_file", 
  "params": {
    "path": "package.json",
    "content": "{\\n  \\"name\\": \\"test-project\\",\\n  \\"version\\": \\"1.0.0\\",\\n  \\"dependencies\\": {\\n    \\"express\\": \\"^4.18.0\\"\\n  }\\n}",
    "description": "Added Express.js dependency to package.json"
  }
}
\`\`\`

This adds Express.js as a dependency to your project.`;
            }

            if (message.includes('create React component')) {
                return `I'll create a React component called Button:

\`\`\`json
{
  "action": "create_file",
  "params": {
    "path": "components/Button.jsx",
    "content": "import React from 'react';\\n\\nconst Button = ({ children, onClick }) => {\\n  return <button onClick={onClick}>{children}</button>;\\n};\\n\\nexport default Button;",
    "description": "Reusable Button React component"
  }
}
\`\`\`

This creates a reusable Button component with proper props.`;
            }

            return "I understand your request, but I don't see any specific file operations to perform. Could you be more specific about what files you'd like me to create or edit?";
        },
        analyzeWorkspace: async (structure) => {
            return `Workspace Analysis Complete:\n- Found ${structure.split('\n').length} files\n- Appears to be a Node.js/JavaScript project\n- Recommended: Add proper documentation`;
        },
        listModels: async () => ['qwen3-coder-30b', 'llama-3.1-8b-instruct'],
        healthCheck: async () => ({ status: 'connected', latency: 45 })
    };

    const agentManager = new AgentManager(mockClient);

    // Test 1: Structured JSON Action
    console.log('🔬 Test 1: Structured JSON Action (create file)');
    console.log('Input: "create a hello world JavaScript file"');
    try {
        const response1 = await agentManager.processMessage('create a hello world JavaScript file');
        console.log('✅ Response:', response1);
        console.log('');
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('');
    }

    // Test 2: Edit operation
    console.log('🔬 Test 2: File Edit Action');
    console.log('Input: "edit package.json to add express dependency"');
    try {
        const response2 = await agentManager.processMessage('edit package.json to add express dependency');
        console.log('✅ Response:', response2);
        console.log('');
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('');
    }

    // Test 3: Component creation
    console.log('🔬 Test 3: React Component Creation');
    console.log('Input: "create React component Button"');
    try {
        const response3 = await agentManager.processMessage('create React component Button');
        console.log('✅ Response:', response3);
        console.log('');
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('');
    }

    // Test 4: Regular chat (no action)
    console.log('🔬 Test 4: Regular Chat (no action)');
    console.log('Input: "What is JavaScript?"');
    try {
        const response4 = await agentManager.processMessage('What is JavaScript?');
        console.log('✅ Response:', response4);
        console.log('');
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('');
    }

    // Test 5: Action parsing detection
    console.log('🔬 Test 5: Testing Action Detection...');
    const testResponses = [
        `\`\`\`json\n{"action": "create_file", "params": {"path": "test.js", "content": "console.log('test');"}}\n\`\`\``,
        `I'll create a file called app.js with the following content:\n\`\`\`javascript\nconsole.log('Hello');\n\`\`\``,
        `Let me edit the README.md file:\n\`\`\`markdown\n# My Project\nThis is awesome!\n\`\`\``,
        `Here's some information about JavaScript without any file operations.`
    ];

    for (let i = 0; i < testResponses.length; i++) {
        const response = testResponses[i];
        const action = agentManager.testParseStructuredResponse(response);
        console.log(`Response ${i + 1}: ${action ? '✅ Action detected' : '❌ No action'} - ${action?.action || 'N/A'}`);
    }
}

// Run the test
if (require.main === module) {
    testAgentActions().catch(console.error);
}

module.exports = { testAgentActions };
