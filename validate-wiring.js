const fs = require('fs');

// Validation checks to ensure no functionality was lost
const validationChecks = [
    {
        name: 'ChatProvider has all required methods',
        check: () => {
            const chatProviderContent = fs.readFileSync('src/chat/ChatProvider.ts', 'utf8');
            const requiredMethods = [
                'handleSendMessage',
                'handleGetModels',
                'handleSetModel',
                'handleAnalyzeWorkspace',
                'handleGetWorkspaceStructure',
                'handleApplyChange',
                'handleRunCode',
                'handleEditInEditor',
                'handleRegenerateResponse',
                'handleFileUpload',
                'handleCreateFile'
            ];
            
            return requiredMethods.every(method => 
                chatProviderContent.includes(`private async ${method}(`) ||
                chatProviderContent.includes(`async ${method}(`)
            );
        }
    },
    {
        name: 'Security components preserved',
        check: () => {
            const chatProviderContent = fs.readFileSync('src/chat/ChatProvider.ts', 'utf8');
            return [
                'SecurityManager',
                'PermissionsManager', 
                'RateLimiter',
                'AdaptiveSecurityManager'
            ].every(component => chatProviderContent.includes(component));
        }
    },
    {
        name: 'Extension commands preserved',
        check: () => {
            const extensionContent = fs.readFileSync('src/extension.ts', 'utf8');
            return [
                'lms-copilot.startChat',
                'lms-copilot.togglePanel',
                'lms-copilot.enableCompletions',
                'lms-copilot.disableCompletions'
            ].every(command => extensionContent.includes(command));
        }
    },
    {
        name: 'MessageHandler interface preserved',
        check: () => {
            const messageHandlerContent = fs.readFileSync('src/chat/MessageHandler.ts', 'utf8');
            return [
                'handleMessage',
                'setChatProvider',
                'setChatPanel'
            ].every(method => messageHandlerContent.includes(method));
        }
    }
];

// Run validation
console.log('🔍 Validating wiring fixes...\n');

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

console.log(`\n${allPassed ? '🎉 All validation checks passed!' : '⚠️  Some validation checks failed!'}`);
process.exit(allPassed ? 0 : 1);
