#!/usr/bin/env node

/**
 * Debug Extension Integration
 * Tests if the AgentManager is properly integrated into the extension
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Extension Integration\n');

// Read and analyze extension.ts
const extensionPath = path.join(__dirname, 'src', 'extension.ts');
const extensionContent = fs.readFileSync(extensionPath, 'utf8');

console.log('📁 Checking extension.ts registration...');

// Check if AgentManager is imported
const agentManagerImport = extensionContent.includes('import { AgentManager }');
console.log(`✓ AgentManager imported: ${agentManagerImport}`);

// Check if AgentManager is instantiated
const agentManagerInstantiation = extensionContent.includes('new AgentManager');
console.log(`✓ AgentManager instantiated: ${agentManagerInstantiation}`);

// Check if ChatProvider is properly registered
const chatProviderRegistration = extensionContent.includes('ChatProvider') && extensionContent.includes('registerWebviewViewProvider');
console.log(`✓ ChatProvider registered: ${chatProviderRegistration}`);

console.log('\n📁 Checking ChatProvider.ts integration...');

// Read and analyze ChatProvider.ts
const chatProviderPath = path.join(__dirname, 'src', 'chat', 'ChatProvider.ts');
const chatProviderContent = fs.readFileSync(chatProviderPath, 'utf8');

// Check if AgentManager is imported
const chatProviderAgentImport = chatProviderContent.includes('import { AgentManager }');
console.log(`✓ AgentManager imported in ChatProvider: ${chatProviderAgentImport}`);

// Check if agentManager is used
const agentManagerUsage = chatProviderContent.includes('this.agentManager') || chatProviderContent.includes('agentManager');
console.log(`✓ AgentManager used in ChatProvider: ${agentManagerUsage}`);

// Check for agent processing logic
const agentProcessing = chatProviderContent.includes('processAgentActions') || chatProviderContent.includes('executeAgentAction');
console.log(`✓ Agent processing logic present: ${agentProcessing}`);

console.log('\n🔍 Checking message flow patterns...');

// Look for message handling patterns
const messageHandling = chatProviderContent.includes('onDidReceiveMessage') || chatProviderContent.includes('receiveMessage');
console.log(`✓ Message handling present: ${messageHandling}`);

// Look for webview communication
const webviewComm = chatProviderContent.includes('postMessage') && chatProviderContent.includes('webview');
console.log(`✓ Webview communication present: ${webviewComm}`);

console.log('\n🔍 Analyzing potential issues...');

// Check for potential issues
const issues = [];

// Check if there are multiple chat providers
const simpleChatProviderExists = fs.existsSync(path.join(__dirname, 'src', 'chat', 'SimpleChatProvider.ts'));
if (simpleChatProviderExists) {
    issues.push('SimpleChatProvider.ts still exists - potential conflict');
}

// Check if there are old extension files
const extensionOldExists = fs.existsSync(path.join(__dirname, 'src', 'extension-old.ts'));
const extensionFixedExists = fs.existsSync(path.join(__dirname, 'src', 'extension-fixed.ts'));
if (extensionOldExists) issues.push('extension-old.ts still exists');
if (extensionFixedExists) issues.push('extension-fixed.ts still exists');

// Check registration patterns in extension.ts
const registrationPatterns = [
    'context.subscriptions.push',
    'vscode.window.registerWebviewViewProvider',
    'ChatProvider'
];

let registrationIssues = [];
registrationPatterns.forEach(pattern => {
    if (!extensionContent.includes(pattern)) {
        registrationIssues.push(`Missing: ${pattern}`);
    }
});

if (registrationIssues.length > 0) {
    issues.push(`Registration issues: ${registrationIssues.join(', ')}`);
}

// Check if the webview provider ID matches
const webviewViewId = 'lms-copilot.chatView';
const correctViewId = extensionContent.includes(webviewViewId);
if (!correctViewId) {
    issues.push('Webview view ID mismatch');
}

console.log('\n📋 Results:');
if (issues.length === 0) {
    console.log('✅ No obvious integration issues found');
} else {
    console.log('⚠️  Potential issues:');
    issues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('\n🔍 Next steps:');
console.log('1. Check VS Code Developer Console for runtime errors');
console.log('2. Verify package.json contributes section');
console.log('3. Test actual message flow in running extension');
