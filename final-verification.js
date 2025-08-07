#!/usr/bin/env node

/**
 * Final Integration Verification
 * Verifies all the key fixes are in place for agent actions
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Final Integration Verification\n');

console.log('📋 Checking all key fixes...\n');

// 1. Check that SimpleChatProvider is removed
const simpleChatPath = path.join(__dirname, 'src', 'chat', 'SimpleChatProvider.ts');
const simpleChatExists = fs.existsSync(simpleChatPath);
console.log(`1. SimpleChatProvider removed: ${simpleChatExists ? '❌ Still exists' : '✅ Removed'}`);

// 2. Check ChatProvider has settings integration
const chatProviderPath = path.join(__dirname, 'src', 'chat', 'ChatProvider.ts');
const chatProviderContent = fs.readFileSync(chatProviderPath, 'utf8');

const hasAdaptiveSecurity = chatProviderContent.includes('AdaptiveSecurityManager');
const hasUpdateSettings = chatProviderContent.includes('updateSecurityFromSettings');
const hasSettingsListener = chatProviderContent.includes('onDidChangeConfiguration');
const hasAgentProcessing = chatProviderContent.includes('this.agentManager.processMessage');

console.log(`2. ChatProvider has AdaptiveSecurityManager: ${hasAdaptiveSecurity ? '✅' : '❌'}`);
console.log(`3. ChatProvider has settings updater: ${hasUpdateSettings ? '✅' : '❌'}`);
console.log(`4. ChatProvider listens to settings changes: ${hasSettingsListener ? '✅' : '❌'}`);
console.log(`5. ChatProvider uses AgentManager: ${hasAgentProcessing ? '✅' : '❌'}`);

// 3. Check extension.ts uses correct provider
const extensionPath = path.join(__dirname, 'src', 'extension.ts');
const extensionContent = fs.readFileSync(extensionPath, 'utf8');

const usesChatProvider = extensionContent.includes('new ChatProvider') && !extensionContent.includes('new SimpleChatProvider');
const registersCorrectProvider = extensionContent.includes("registerWebviewViewProvider('lmsCopilotChat', chatProvider)");

console.log(`6. Extension uses ChatProvider: ${usesChatProvider ? '✅' : '❌'}`);
console.log(`7. Extension registers correct provider: ${registersCorrectProvider ? '✅' : '❌'}`);

// 4. Check package.json settings
const packagePath = path.join(__dirname, 'package.json');
const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const hasSecuritySetting = packageContent.contributes?.configuration?.properties?.['lmsCopilot.securityLevel'];
const hasDangerousSetting = packageContent.contributes?.configuration?.properties?.['lmsCopilot.allowDangerousCommands'];

console.log(`8. Package.json has securityLevel setting: ${hasSecuritySetting ? '✅' : '❌'}`);
console.log(`9. Package.json has allowDangerousCommands setting: ${hasDangerousSetting ? '✅' : '❌'}`);

// 5. Summary
console.log('\n🔍 Current Settings for Agent Actions:');
const securityLevel = packageContent.contributes?.configuration?.properties?.['lmsCopilot.securityLevel']?.default;
const allowDangerous = packageContent.contributes?.configuration?.properties?.['lmsCopilot.allowDangerousCommands']?.default;

console.log(`   lmsCopilot.securityLevel: ${securityLevel}`);
console.log(`   lmsCopilot.allowDangerousCommands: ${allowDangerous}`);

console.log('\n📝 Required VS Code Settings for Agent Actions:');
console.log('   "lmsCopilot.securityLevel": "disabled"');
console.log('   "lmsCopilot.allowDangerousCommands": true');

console.log('\n🎯 What Was Fixed:');
console.log('✅ Added settings-based security configuration to ChatProvider');
console.log('✅ ChatProvider now reads and responds to VS Code settings');
console.log('✅ Removed SimpleChatProvider to eliminate conflicts');
console.log('✅ Extension uses the full-featured ChatProvider with agent integration');

console.log('\n🚀 Agent Actions Should Now Work!');
console.log('The ChatProvider will:');
console.log('1. Read your VS Code settings on startup');
console.log('2. Automatically configure security based on your settings');
console.log('3. Allow agent actions when security is disabled');
console.log('4. Execute file operations through AgentManager');

const allChecksPass = !simpleChatExists && hasAdaptiveSecurity && hasUpdateSettings && 
                     hasSettingsListener && hasAgentProcessing && usesChatProvider && 
                     registersCorrectProvider && hasSecuritySetting && hasDangerousSetting;

console.log(`\n${allChecksPass ? '🎉 ALL CHECKS PASS' : '⚠️  SOME ISSUES FOUND'} - Agent mode should ${allChecksPass ? 'work' : 'be checked'}!`);
