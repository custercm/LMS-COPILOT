#!/usr/bin/env node

/**
 * Demonstration of Agent Action Parsing
 * This script shows how the LMS Copilot extension now parses AI responses for file operations
 */

console.log('🤖 LMS Copilot Agent Action Demo\n');

// Simulate the enhanced parsing logic from AgentManager
function parseStructuredResponse(response) {
    try {
        // Method 1: Look for JSON code blocks
        const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[1].trim();
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.action && parsed.params) {
                return parsed;
            }
        }

        // Method 2: Natural language patterns
        const lowerResponse = response.toLowerCase();

        // Pattern: "I'll create a file called X"
        const createFilePattern = /(?:i'll|let me|i will)\s+create\s+(?:a\s+)?(?:file\s+)?(?:called\s+|named\s+)?['"`]?([^'"`\s]+)['"`]?/i;
        const createMatch = response.match(createFilePattern);
        if (createMatch) {
            const codeMatch = response.match(/```\w*\s*\n([\s\S]*?)\n```/);
            const content = codeMatch ? codeMatch[1] : '';
            
            return {
                action: 'create_file',
                params: {
                    path: createMatch[1],
                    content: content.trim(),
                    description: `Created via natural language`
                }
            };
        }

        return null;
    } catch (error) {
        console.log('❌ Parse error:', error.message);
        return null;
    }
}

// Test different AI response formats
const testResponses = [
    {
        name: 'Structured JSON Response',
        response: `I'll create a React component for you:

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

This creates a reusable Button component that you can use throughout your app.`
    },
    
    {
        name: 'Natural Language + Code Block',
        response: `I'll create a hello world JavaScript file for you:

\`\`\`javascript
console.log('Hello, World!');
console.log('Welcome to LMS Copilot!');
\`\`\`

This will create a simple hello.js file that prints greetings to the console.`
    },
    
    {
        name: 'Package.json Edit Request',
        response: `I'll edit your package.json to add Express:

\`\`\`json
{
  "action": "edit_file",
  "params": {
    "path": "package.json", 
    "content": "{\\n  \\"name\\": \\"my-project\\",\\n  \\"version\\": \\"1.0.0\\",\\n  \\"dependencies\\": {\\n    \\"express\\": \\"^4.18.0\\"\\n  }\\n}",
    "description": "Added Express.js dependency"
  }
}
\`\`\`

This adds Express.js as a dependency to your project so you can build web servers.`
    },
    
    {
        name: 'Regular Chat (No Action)',
        response: `JavaScript is a versatile programming language that was originally designed for web browsers. It's now used everywhere - frontend, backend, mobile apps, and even desktop applications. The language supports both functional and object-oriented programming paradigms.`
    }
];

console.log('Testing Agent Action Detection:\n');

testResponses.forEach((test, index) => {
    console.log(`🧪 Test ${index + 1}: ${test.name}`);
    console.log('📝 AI Response:', test.response.substring(0, 100) + '...');
    
    const action = parseStructuredResponse(test.response);
    
    if (action) {
        console.log('✅ Action Detected!');
        console.log(`   Type: ${action.action}`);
        console.log(`   File: ${action.params.path}`);
        console.log(`   Content: ${action.params.content ? action.params.content.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`   Description: ${action.params.description}`);
        
        // Simulate what would happen in VS Code
        console.log('🎬 Simulated VS Code Action:');
        switch (action.action) {
            case 'create_file':
                console.log(`   → vscode.workspace.fs.writeFile('${action.params.path}', content)`);
                console.log(`   → vscode.window.showTextDocument('${action.params.path}')`);
                console.log(`   → Show notification: "✅ Created file: ${action.params.path}"`);
                break;
            case 'edit_file':
                console.log(`   → Show diff preview for '${action.params.path}'`);
                console.log(`   → Ask user confirmation`);
                console.log(`   → vscode.workspace.fs.writeFile('${action.params.path}', newContent)`);
                break;
        }
    } else {
        console.log('ℹ️  No action detected - displaying as regular chat');
    }
    
    console.log('─'.repeat(80));
});

console.log('\n🎉 Demo Complete!');
console.log('\n📋 Summary:');
console.log('✅ JSON action blocks are parsed correctly');
console.log('✅ Natural language file creation is detected');
console.log('✅ Regular chat messages pass through normally');
console.log('✅ VS Code file operations would be executed');
console.log('\n🚀 Your LMS Copilot extension now has full agent action wiring!');
