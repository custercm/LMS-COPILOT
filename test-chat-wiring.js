#!/usr/bin/env node

/**
 * Integration test to verify chat components are properly wired
 */

console.log('🔧 Testing Chat Component Wiring...\n');

let totalTests = 0;
let passedTests = 0;

function test(name, testFn) {
    totalTests++;
    try {
        const result = testFn();
        if (result) {
            console.log(`✅ ${name}`);
            passedTests++;
        } else {
            console.log(`❌ ${name}`);
        }
    } catch (error) {
        console.log(`❌ ${name} - Error: ${error.message}`);
    }
}

// Test 1: Check if all required chat files exist
test('All chat component files exist', () => {
    const fs = require('fs');
    const path = require('path');
    
    const requiredFiles = [
        'src/chat/ChatPanel.ts',
        'src/chat/ChatProvider.ts', 
        'src/chat/MessageHandler.ts',
        'src/extension.ts'
    ];
    
    return requiredFiles.every(file => {
        const filePath = path.join(__dirname, file);
        const exists = fs.existsSync(filePath);
        if (!exists) console.log(`   Missing: ${file}`);
        return exists;
    });
});

// Test 2: Check if ChatPanel exports the class correctly
test('ChatPanel exports class correctly', () => {
    const fs = require('fs');
    const content = fs.readFileSync('./src/chat/ChatPanel.ts', 'utf8');
    
    const hasExportClass = content.includes('export class ChatPanel');
    const hasConstructor = content.includes('constructor(webview: vscode.Webview)');
    const hasSetMessageHandler = content.includes('setMessageHandler');
    const hasInit = content.includes('init(): void');
    const hasAddMessage = content.includes('addMessage(role:');
    
    if (!hasExportClass) console.log('   Missing: export class ChatPanel');
    if (!hasConstructor) console.log('   Missing: constructor');
    if (!hasSetMessageHandler) console.log('   Missing: setMessageHandler');
    if (!hasInit) console.log('   Missing: init method');
    if (!hasAddMessage) console.log('   Missing: addMessage method');
    
    return hasExportClass && hasConstructor && hasSetMessageHandler && hasInit && hasAddMessage;
});

// Test 3: Check if MessageHandler is properly integrated
test('MessageHandler is properly integrated', () => {
    const fs = require('fs');
    const content = fs.readFileSync('./src/chat/MessageHandler.ts', 'utf8');
    
    const hasExportClass = content.includes('export class MessageHandler');
    const hasSetChatProvider = content.includes('setChatProvider');
    const hasSetChatPanel = content.includes('setChatPanel');
    const hasHandleMessage = content.includes('handleMessage');
    const hasCommandHandling = content.includes('handleCommand');
    
    if (!hasExportClass) console.log('   Missing: export class MessageHandler');
    if (!hasSetChatProvider) console.log('   Missing: setChatProvider method');
    if (!hasSetChatPanel) console.log('   Missing: setChatPanel method');
    if (!hasHandleMessage) console.log('   Missing: handleMessage method');
    if (!hasCommandHandling) console.log('   Missing: command handling');
    
    return hasExportClass && hasSetChatProvider && hasSetChatPanel && hasHandleMessage && hasCommandHandling;
});

// Test 4: Check if ChatProvider imports MessageHandler
test('ChatProvider imports and uses MessageHandler', () => {
    const fs = require('fs');
    const content = fs.readFileSync('./src/chat/ChatProvider.ts', 'utf8');
    
    const importsMessageHandler = content.includes("import { MessageHandler }");
    const importsAgentManager = content.includes("import { AgentManager }");
    const hasMessageHandlerProperty = content.includes('messageHandler: MessageHandler');
    const hasAgentManagerProperty = content.includes('agentManager: AgentManager');
    const initializesMessageHandler = content.includes('new MessageHandler');
    const setsProviderReference = content.includes('setChatProvider(this)');
    
    if (!importsMessageHandler) console.log('   Missing: MessageHandler import');
    if (!importsAgentManager) console.log('   Missing: AgentManager import');
    if (!hasMessageHandlerProperty) console.log('   Missing: messageHandler property');
    if (!hasAgentManagerProperty) console.log('   Missing: agentManager property');
    if (!initializesMessageHandler) console.log('   Missing: MessageHandler initialization');
    if (!setsProviderReference) console.log('   Missing: setChatProvider call');
    
    return importsMessageHandler && importsAgentManager && hasMessageHandlerProperty && 
           hasAgentManagerProperty && initializesMessageHandler && setsProviderReference;
});

// Test 5: Check if extension.ts properly wires everything
test('Extension properly wires all components', () => {
    const fs = require('fs');
    const content = fs.readFileSync('./src/extension.ts', 'utf8');
    
    const importsChatPanel = content.includes("import { ChatPanel }");
    const importsChatProvider = content.includes("import { ChatProvider }");
    const importsMessageHandler = content.includes("import { MessageHandler }");
    const createsMessageHandler = content.includes('new MessageHandler');
    const createsChatPanel = content.includes('new ChatPanel');
    const createsChatProvider = content.includes('new ChatProvider');
    const setsMessageHandler = content.includes('setMessageHandler');
    const registersCommands = content.includes('registerCommand');
    
    if (!importsChatPanel) console.log('   Missing: ChatPanel import');
    if (!importsChatProvider) console.log('   Missing: ChatProvider import');
    if (!importsMessageHandler) console.log('   Missing: MessageHandler import');
    if (!createsMessageHandler) console.log('   Missing: MessageHandler creation');
    if (!createsChatPanel) console.log('   Missing: ChatPanel creation');
    if (!createsChatProvider) console.log('   Missing: ChatProvider creation');
    if (!setsMessageHandler) console.log('   Missing: setMessageHandler call');
    if (!registersCommands) console.log('   Missing: command registration');
    
    return importsChatPanel && importsChatProvider && importsMessageHandler && 
           createsMessageHandler && createsChatPanel && createsChatProvider && 
           setsMessageHandler && registersCommands;
});

// Test 6: Check VS Code configuration in package.json
test('VS Code extension configuration is correct', () => {
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    const hasViewContainer = packageJson.contributes?.viewsContainers?.panel?.some(
        container => container.id === 'lmsCopilotContainer'
    );
    const hasView = packageJson.contributes?.views?.lmsCopilotContainer?.some(
        view => view.id === 'lmsCopilotChat'
    );
    const hasStartChatCommand = packageJson.contributes?.commands?.some(
        cmd => cmd.command === 'lms-copilot.startChat'
    );
    const hasTogglePanelCommand = packageJson.contributes?.commands?.some(
        cmd => cmd.command === 'lms-copilot.togglePanel'
    );
    
    if (!hasViewContainer) console.log('   Missing: viewContainer configuration');
    if (!hasView) console.log('   Missing: view configuration');
    if (!hasStartChatCommand) console.log('   Missing: startChat command');
    if (!hasTogglePanelCommand) console.log('   Missing: togglePanel command');
    
    return hasViewContainer && hasView && hasStartChatCommand && hasTogglePanelCommand;
});

// Summary
console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);

if (passedTests === totalTests) {
    console.log('🎉 All chat components are properly wired! ✨');
    console.log('\n✅ Ready to test the extension:');
    console.log('   1. Press F5 to launch the extension');
    console.log('   2. Open the LMS Copilot panel in the side panel');
    console.log('   3. Or use Command Palette: "LMS Copilot: Start Chat"');
    console.log('   4. Test messaging functionality');
} else {
    console.log('❌ Some wiring issues remain. Please check the failed tests above.');
    process.exit(1);
}
