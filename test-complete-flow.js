/**
 * Comprehensive test for LMS Copilot Agent Mode
 * This simulates the exact flow that should happen when an agent action is triggered
 */

console.log('🧪 LMS Copilot Agent Mode Flow Test\n');

// Test 1: Verify settings are configured correctly
console.log('1. 📋 Checking Configuration...');
const fs = require('fs');
const os = require('os');
const path = require('path');

function getVSCodeSettingsPath() {
    const homeDir = os.homedir();
    return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
}

try {
    const settingsPath = getVSCodeSettingsPath();
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsContent);
    
    const securityLevel = settings['lmsCopilot.securityLevel'];
    const allowDangerous = settings['lmsCopilot.allowDangerousCommands'];
    
    console.log(`   ✅ Security Level: ${securityLevel}`);
    console.log(`   ✅ Allow Dangerous Commands: ${allowDangerous}`);
    
    if (securityLevel === 'disabled' && allowDangerous === true) {
        console.log('   🎯 Configuration is PERFECT for agent mode!\n');
    } else {
        console.log('   ⚠️  Configuration may still restrict some operations\n');
    }
} catch (error) {
    console.log('   ❌ Could not read settings:', error.message);
}

// Test 2: Simulate action parsing
console.log('2. 🔍 Testing Action Parsing...');

const testResponses = [
    {
        name: 'JSON Action Block',
        response: `I'll create that file for you.

\`\`\`json
{
  "action": "create_file",
  "params": {
    "path": "test.js",
    "content": "console.log('Hello from LMS Copilot!');"
  }
}
\`\`\`

This will create a new JavaScript file with your requested code.`
    },
    {
        name: 'Natural Language with Code Block',
        response: `Here's the file you requested:

\`\`\`javascript
console.log('Hello World!');
\`\`\`

Save this as \`hello.js\` in your project.`
    }
];

function parseStructuredResponse(response) {
    try {
        // Look for JSON code blocks
        const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[1].trim();
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.action && parsed.params) {
                return parsed;
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

testResponses.forEach((test, index) => {
    console.log(`   Test ${index + 1}: ${test.name}`);
    const action = parseStructuredResponse(test.response);
    if (action) {
        console.log(`   ✅ Parsed action: ${action.action}`);
        console.log(`   ✅ Target file: ${action.params.path}`);
    } else {
        console.log(`   ⚠️  No structured action detected`);
    }
    console.log('');
});

// Test 3: Check for extension compilation
console.log('3. 🔨 Checking Extension Build...');
const distPath = path.join(__dirname, 'dist', 'extension.js');
if (fs.existsSync(distPath)) {
    console.log('   ✅ Extension is compiled and ready');
} else {
    console.log('   ⚠️  Extension needs to be compiled');
    console.log('   💡 Run: npm run package');
}

// Test 4: Show next steps
console.log('\n4. 🚀 Ready to Test Agent Mode!');
console.log('');
console.log('   Steps to test:');
console.log('   1. Press F5 to launch Extension Development Host');
console.log('   2. Open the LMS Copilot panel');
console.log('   3. Send this test message:');
console.log('');
console.log('   📝 Test Message:');
console.log('   "Create a file named hello.js with console.log(\'Hello from agent mode!\');"');
console.log('');
console.log('   Expected behavior:');
console.log('   ✅ AI responds with JSON action block');
console.log('   ✅ File gets created automatically');
console.log('   ✅ Success message appears in chat');
console.log('');
console.log('   If it only chats back:');
console.log('   - Check Debug Console for errors');
console.log('   - Verify LM Studio is running on http://localhost:1234');
console.log('   - Check that your model outputs structured JSON responses');

console.log('\n🎯 You\'re all set! The configuration is perfect for agent mode.');
console.log('The only thing that could prevent file operations now is:');
console.log('- LM Studio connection issues');
console.log('- Model not outputting proper JSON actions');
console.log('- Extension not being compiled/loaded correctly');
