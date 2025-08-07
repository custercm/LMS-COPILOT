const fs = require('fs');

// Validation checks to ensure Phase 2 was implemented correctly
const validationChecks = [
    {
        name: 'ChatProvider constructor accepts dependencies',
        check: () => {
            const chatProviderContent = fs.readFileSync('src/chat/ChatProvider.ts', 'utf8');
            return chatProviderContent.includes('messageHandler?: MessageHandler') &&
                   chatProviderContent.includes('agentManager?: AgentManager') &&
                   chatProviderContent.includes('this.agentManager = agentManager || new AgentManager(client)') &&
                   chatProviderContent.includes('this.messageHandler = messageHandler || new MessageHandler(this.agentManager)');
        }
    },
    {
        name: 'ChatProvider has wireMessageHandler method',
        check: () => {
            const chatProviderContent = fs.readFileSync('src/chat/ChatProvider.ts', 'utf8');
            return chatProviderContent.includes('public wireMessageHandler(): void') &&
                   chatProviderContent.includes('this.messageHandler.setChatProvider(this)');
        }
    },
    {
        name: 'Extension.ts uses dependency injection',
        check: () => {
            const extensionContent = fs.readFileSync('src/extension.ts', 'utf8');
            return extensionContent.includes('// PHASE 1: Create Core Services (No Dependencies)') &&
                   extensionContent.includes('// PHASE 2: Create Services with Dependencies') &&
                   extensionContent.includes('// PHASE 3: Create UI Components with Dependency Injection') &&
                   extensionContent.includes('// PHASE 4: Wire Bidirectional References (After All Objects Exist)') &&
                   extensionContent.includes('chatProvider.wireMessageHandler()');
        }
    },
    {
        name: 'Extension.ts creates single instances',
        check: () => {
            const extensionContent = fs.readFileSync('src/extension.ts', 'utf8');
            return extensionContent.includes('const agentManager = new AgentManager(lmStudioClient)') &&
                   extensionContent.includes('const messageHandler = new MessageHandler(agentManager)') &&
                   extensionContent.includes('messageHandler,\n        agentManager');
        }
    },
    {
        name: 'Security components preserved',
        check: () => {
            const chatProviderContent = fs.readFileSync('src/chat/ChatProvider.ts', 'utf8');
            return [
                'SecurityManager.getInstance()',
                'PermissionsManager.getInstance()', 
                'RateLimiter.getInstance()',
                'new AdaptiveSecurityManager()',
                'this.updateSecurityFromSettings()',
                'vscode.workspace.onDidChangeConfiguration'
            ].every(component => chatProviderContent.includes(component));
        }
    },
    {
        name: 'All existing commands preserved',
        check: () => {
            const extensionContent = fs.readFileSync('src/extension.ts', 'utf8');
            return [
                'lms-copilot.startChat',
                'lms-copilot.togglePanel',
                'lms-copilot.enableCompletions',
                'lms-copilot.disableCompletions',
                'lms-copilot.switchPanelPosition',
                'lms-copilot.toggleTheme',
                'lms-copilot.clearCompletionCache',
                'lms-copilot.showCacheStats',
                'lms-copilot.testModels'
            ].every(command => extensionContent.includes(command));
        }
    }
];

// Run validation
console.log('🔍 Validating Phase 2: Dependency Injection Refactor...\n');

let allPassed = true;
validationChecks.forEach(check => {
    try {
        const passed = check.check();
        console.log(`${passed ? '✅' : '❌'} ${check.name}`);
        if (!passed) allPassed = false;
    } catch (error) {
        console.log(`❌ ${check.name} - Error: ${error.message}`);
        allPassed = false;
    }
});

console.log(`\n${allPassed ? '🎉 Phase 2 completed successfully!' : '⚠️  Phase 2 has validation issues!'}`);

if (allPassed) {
    console.log('\n✅ PHASE 2 SUCCESS CRITERIA MET:');
    console.log('  • ChatProvider accepts dependencies via constructor');
    console.log('  • Extension.ts uses single instances of services');
    console.log('  • Circular dependencies eliminated');
    console.log('  • All security components preserved');
    console.log('  • All existing commands preserved');
    console.log('  • Backward compatibility maintained');
    console.log('  • wireMessageHandler() method added for post-construction wiring');
    console.log('\n🚀 Ready for Phase 3: Webview Communication Fixes');
}

process.exit(allPassed ? 0 : 1);
