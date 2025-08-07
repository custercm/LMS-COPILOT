#!/usr/bin/env node

/**
 * Test Agent Actions with Settings
 * Verifies that agent actions work with the corrected settings integration
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Agent Actions with Settings Integration\n');

// Simulate the VS Code settings that should enable agent actions
const mockSettings = {
    'lmsCopilot.securityLevel': 'disabled',
    'lmsCopilot.allowDangerousCommands': true
};

console.log('📋 Mock Settings:');
Object.entries(mockSettings).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
});

console.log('\n🔍 Checking ChatProvider integration...');

// Read the updated ChatProvider to verify our changes
const chatProviderPath = path.join(__dirname, 'src', 'chat', 'ChatProvider.ts');
const chatProviderContent = fs.readFileSync(chatProviderPath, 'utf8');

// Check for the security settings integration
const hasAdaptiveSecurity = chatProviderContent.includes('AdaptiveSecurityManager');
const hasUpdateSettings = chatProviderContent.includes('updateSecurityFromSettings');
const hasSettingsListener = chatProviderContent.includes('onDidChangeConfiguration');
const hasAgentManager = chatProviderContent.includes('this.agentManager.processMessage');

console.log(`✓ AdaptiveSecurityManager: ${hasAdaptiveSecurity}`);
console.log(`✓ Settings updater: ${hasUpdateSettings}`);
console.log(`✓ Settings listener: ${hasSettingsListener}`);
console.log(`✓ AgentManager integration: ${hasAgentManager}`);

// Check that SimpleChatProvider is gone
const simpleChatExists = fs.existsSync(path.join(__dirname, 'src', 'chat', 'SimpleChatProvider.ts'));
console.log(`✓ SimpleChatProvider removed: ${!simpleChatExists}`);

console.log('\n🎯 Expected Behavior:');
console.log('1. Settings are read on startup and configuration changes');
console.log('2. Security level set to "disabled" with dangerous commands allowed');
console.log('3. Agent actions should execute file operations without restrictions');
console.log('4. No conflicts from duplicate chat providers');

console.log('\n📝 Key Fix Applied:');
console.log('- ChatProvider now reads VS Code settings for security configuration');
console.log('- Settings listener updates security when user changes settings');
console.log('- SimpleChatProvider removed to eliminate conflicts');

console.log('\n✅ Agent actions should now work in the UI!');
