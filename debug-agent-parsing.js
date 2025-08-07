/**
 * Debug script to test LMS Copilot agent response parsing
 * This will help identify exactly where the agent mode is failing
 */

console.log('🔍 Debugging LMS Copilot Agent Mode Flow...\n');

// Test the actual parsing logic used by the extension
function parseStructuredResponse(response) {
    console.log('🔍 Testing response parsing...');
    console.log('📝 Input response:', response);
    console.log('');
    
    try {
        // Method 1: Look for JSON code blocks in the response
        console.log('🔍 Method 1: Looking for JSON code blocks...');
        const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            console.log('✅ Found JSON block');
            const jsonStr = jsonMatch[1].trim();
            console.log('📄 JSON content:', jsonStr);
            
            try {
                const parsed = JSON.parse(jsonStr);
                console.log('✅ Successfully parsed JSON');
                
                // Validate that it has the expected structure
                if (parsed.action && parsed.params) {
                    console.log('✅ Valid action structure found');
                    console.log('🎯 Action:', parsed.action);
                    console.log('📂 Params:', parsed.params);
                    return parsed;
                } else {
                    console.log('❌ Missing action or params in JSON');
                }
            } catch (parseError) {
                console.log('❌ JSON parse error:', parseError.message);
            }
        } else {
            console.log('❌ No JSON code block found');
        }

        // Method 2: Look for natural language patterns
        console.log('\n🔍 Method 2: Looking for natural language patterns...');
        const naturalAction = parseNaturalLanguageActions(response);
        if (naturalAction) {
            console.log('✅ Found natural language action');
            return naturalAction;
        } else {
            console.log('❌ No natural language patterns found');
        }

        return null;
    } catch (error) {
        console.log('❌ Parsing failed:', error.message);
        return null;
    }
}

function parseNaturalLanguageActions(response) {
    const lowerResponse = response.toLowerCase();
    
    // Check for file creation patterns
    if (lowerResponse.includes('create') && (lowerResponse.includes('file') || lowerResponse.includes('.js') || lowerResponse.includes('.ts'))) {
        console.log('📝 Detected file creation intent');
        
        // Look for filename
        const filenameMatch = response.match(/(?:create|save|write).*?(?:file|named|called)\s+["`']?([^\s"`']+\.[a-zA-Z]+)["`']?/i);
        if (filenameMatch) {
            const filename = filenameMatch[1];
            console.log('📁 Extracted filename:', filename);
            
            // Look for code block content
            const codeMatch = response.match(/```\w*\n([\s\S]*?)\n```/);
            const content = codeMatch ? codeMatch[1].trim() : '';
            
            return {
                action: 'create_file',
                params: {
                    path: filename,
                    content: content,
                    description: 'Parsed from natural language'
                }
            };
        }
    }
    
    return null;
}

// Test responses that should trigger agent actions
const testResponses = [
    {
        name: 'Perfect JSON Response',
        response: `I'll create that file for you.

\`\`\`json
{
  "action": "create_file",
  "params": {
    "path": "hello.js",
    "content": "console.log('Hello from agent mode!');"
  }
}
\`\`\`

This will create a new JavaScript file with your requested content.`
    },
    {
        name: 'Natural Language + Code Block',
        response: `I'll create a file called test.js with the following content:

\`\`\`javascript
console.log('Hello World!');
\`\`\`

This file will output "Hello World!" when run.`
    },
    {
        name: 'Just Explanation (Should Not Trigger)',
        response: `To create a JavaScript file, you would typically use the following syntax:

\`\`\`javascript
console.log('Hello World!');
\`\`\`

You can save this code to any .js file and run it with Node.js.`
    },
    {
        name: 'Broken JSON (Should Fail Gracefully)',
        response: `I'll create that file:

\`\`\`json
{
  "action": "create_file"
  "params": {
    "path": "broken.js"
  }
}
\`\`\`

This JSON is missing a comma and has incomplete params.`
    }
];

console.log('🧪 Testing different response types...\n');

testResponses.forEach((test, index) => {
    console.log(`\n📋 Test ${index + 1}: ${test.name}`);
    console.log('=' + '='.repeat(50));
    
    const result = parseStructuredResponse(test.response);
    
    if (result) {
        console.log('🎉 SUCCESS: Action detected and parsed');
        console.log('🔧 Would execute:', result.action);
        console.log('📁 Target:', result.params.path);
    } else {
        console.log('❌ FAILED: No action detected');
    }
    
    console.log('');
});

console.log('\n🎯 Next Steps for Debugging:');
console.log('1. Test your extension with the "Perfect JSON Response" format above');
console.log('2. Check the Debug Console for any parsing errors');
console.log('3. Verify that your AI model is outputting the exact JSON format');
console.log('4. Make sure LM Studio is connected and responding');

console.log('\n💡 Quick Test:');
console.log('Send this exact message to your extension:');
console.log('"Create a file named debug-test.js with console.log(\'test\');"');
console.log('');
console.log('The AI should respond with the Perfect JSON Response format shown above.');
console.log('If it doesn\'t, the issue is with your AI model\'s response format.');
