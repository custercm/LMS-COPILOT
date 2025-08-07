#!/usr/bin/env node

/**
 * Debug Agent Action Flow
 * Tests exactly what happens when a file creation request is processed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debug Agent Action Flow\n');

// Mock the actual response that would come from LM Studio for a file creation request
const mockLMStudioResponses = [
    {
        description: "JSON format response",
        response: `I'll help you create that file.

\`\`\`json
{
  "action": "create_file",
  "params": {
    "path": "test.js",
    "content": "console.log('Hello from test.js!');"
  }
}
\`\`\`

This creates a simple JavaScript file that logs a message to the console.`
    },
    {
        description: "Natural language response",
        response: `I'll create a file called test.js with console.log('Hello from test.js!');

Here's the code:

\`\`\`javascript
console.log('Hello from test.js!');
\`\`\`

This creates a simple JavaScript file that will output a greeting message when run.`
    },
    {
        description: "Current ChatGPT-style response (problematic)",
        response: `I'll create a test.js file for you with some JavaScript code.

\`\`\`javascript
// test.js - A simple JavaScript test file
console.log("Hello from test.js!");

// Function to calculate factorial
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Array of numbers
const numbers = [1, 2, 3, 4, 5];

// Calculate sum of array elements
const sum = numbers.reduce((acc, num) => acc + num, 0);
console.log(\`Sum of numbers: \${sum}\`);
console.log(\`Factorial of 5: \${factorial(5)}\`);

// Simple class example
class TestClass {
    constructor(name) {
        this.name = name;
    }
    
    greet() {
        return \`Hello, \${this.name}!\`;
    }
}

const testInstance = new TestClass("World");
console.log(testInstance.greet());
\`\`\`

This file contains various JavaScript examples including functions, arrays, and classes.`
    }
];

// Simulate the AgentManager parsing logic
function parseStructuredResponse(response) {
    try {
        // Method 1: Look for JSON code blocks in the response
        const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[1].trim();
            const parsed = JSON.parse(jsonStr);
            
            // Validate that it has the expected structure
            if (parsed.action && parsed.params) {
                return parsed;
            }
        }

        // Method 2: Look for natural language patterns
        const lowerResponse = response.toLowerCase();
        
        const createFilePattern = /(?:i'll|let me|i will|i'm going to)\s+create\s+(?:a\s+)?(?:file\s+)?(?:called\s+|named\s+)?['"`]?([^'"`\s]+)['"`]?\s*(?:with|containing)?\s*(?:content|code)?[:\s]*[`'"]*([^`'"]*)[`'"]*/i;
        const createMatch = response.match(createFilePattern);
        if (createMatch) {
            // Look for code blocks after the create statement
            const codeMatch = response.match(/```\w*\s*\n([\s\S]*?)\n```/);
            const content = codeMatch ? codeMatch[1] : createMatch[2] || '';
            
            return {
                action: 'create_file',
                params: {
                    path: createMatch[1],
                    content: content.trim(),
                    description: `Created via natural language: ${createMatch[0]}`
                }
            };
        }

        return null;
    } catch (error) {
        console.log('Failed to parse:', error.message);
        return null;
    }
}

console.log('🧪 Testing different LM Studio response formats:\n');

mockLMStudioResponses.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.description}`);
    console.log('Response preview:', test.response.substring(0, 100) + '...');
    
    const parsedAction = parseStructuredResponse(test.response);
    
    if (parsedAction) {
        console.log('✅ Action detected:', parsedAction.action);
        console.log('   File path:', parsedAction.params.path);
        console.log('   Content preview:', parsedAction.params.content.substring(0, 50) + '...');
        console.log('   → File would be created!');
    } else {
        console.log('❌ No action detected');
        console.log('   → Only chat response, no file creation');
    }
    console.log('');
});

console.log('🎯 Key Finding:');
console.log('The agent action detection depends on the LM Studio response format.');
console.log('If LM Studio returns a casual response without the expected patterns,');
console.log('the file creation won\'t be triggered even though the code is shown.');

console.log('\n🔧 Potential Solutions:');
console.log('1. Improve the system prompt to request structured responses');
console.log('2. Add more natural language detection patterns');
console.log('3. Add fallback detection for code blocks with file context');
console.log('4. Enable manual action buttons in the UI for detected code');
