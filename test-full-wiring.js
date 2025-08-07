/**
 * Comprehensive wiring verification test
 * Tests all major integration points of the LMS Copilot extension
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 LMS Copilot Wiring Verification Test');
console.log('=====================================');

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.log(`❌ ${name}${details ? ` - ${details}` : ''}`);
        failed++;
    }
}

function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return null;
    }
}

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return null;
    }
}

// Test 1: Core build artifacts exist
console.log('\n📦 Build Artifacts');
test('Extension bundle exists', fileExists('./dist/extension.js'));
test('Webview HTML exists', fileExists('./dist/webview/index.html'));
test('React components bundle exists', fileExists('./dist/webview') && fs.readdirSync('./dist/webview').some(f => f.startsWith('main.') && f.endsWith('.js')));

// Test 2: Package.json configuration
console.log('\n📋 Package.json Configuration');
const packageJson = readJson('./package.json');
if (packageJson) {
    test('Package.json is valid JSON', true);
    test('Main entry point configured', packageJson.main === './dist/extension.js');
    test('Browser entry point configured', packageJson.browser === './dist/webview/webview.js');
    test('Commands are defined', packageJson.contributes && packageJson.contributes.commands && packageJson.contributes.commands.length > 0);
    test('Views container configured', packageJson.contributes && packageJson.contributes.viewsContainers && packageJson.contributes.viewsContainers.panel);
    test('Configuration properties defined', packageJson.contributes && packageJson.contributes.configuration && packageJson.contributes.configuration.properties);
} else {
    test('Package.json is valid JSON', false, 'Failed to parse package.json');
}

// Test 3: Extension entry point analysis
console.log('\n🎯 Extension Entry Point');
const extensionCode = readFile('./src/extension.ts');
if (extensionCode) {
    test('Extension.ts exists', true);
    test('Exports activate function', extensionCode.includes('export function activate'));
    test('Exports deactivate function', extensionCode.includes('export function deactivate'));
    test('Imports LMStudioClient', extensionCode.includes('import { LMStudioClient }'));
    test('Imports AgentManager', extensionCode.includes('import { AgentManager }'));
    test('Imports ChatProvider', extensionCode.includes('import { ChatProvider }'));
    test('Imports CompletionProvider', extensionCode.includes('import { CompletionProvider }'));
    test('Registers ChatProvider', extensionCode.includes('registerWebviewViewProvider'));
    test('Registers CompletionProvider', extensionCode.includes('registerInlineCompletionItemProvider'));
    test('Registers commands', extensionCode.includes('registerCommand'));
} else {
    test('Extension.ts exists', false, 'Could not read extension.ts');
}

// Test 4: Core module structure
console.log('\n🏗️ Core Module Structure');
const coreModules = [
    './src/agent/AgentManager.ts',
    './src/lmstudio/LMStudioClient.ts',
    './src/chat/ChatProvider.ts',
    './src/completion/CompletionProvider.ts',
    './src/ui/PanelManager.ts',
    './src/security/SecurityManager.ts'
];

coreModules.forEach(module => {
    const moduleName = path.basename(module, '.ts');
    test(`${moduleName} exists`, fileExists(module));
});

// Test 5: Webview structure
console.log('\n🌐 Webview Structure');
const webviewFiles = [
    './src/webview/index.tsx',
    './src/webview/App.tsx',
    './src/webview/index.html'
];

webviewFiles.forEach(file => {
    const fileName = path.basename(file);
    test(`${fileName} exists`, fileExists(file));
});

// Test 6: Component integration
console.log('\n🔗 Component Integration');
const webviewComponents = [
    './src/webview/components/ChatInterface.tsx',
    './src/webview/components/MessageList.tsx',
    './src/webview/components/InputArea.tsx', // Updated from MessageInput to InputArea
    './src/webview/components/CodeBlock.tsx'
];

webviewComponents.forEach(component => {
    const componentName = path.basename(component, '.tsx');
    test(`${componentName} component exists`, fileExists(component));
});

// Test 7: Configuration files
console.log('\n⚙️ Configuration Files');
const configFiles = [
    './tsconfig.json',
    './webpack.config.js',
    './webpack.webview.config.js'
];

configFiles.forEach(config => {
    const configName = path.basename(config);
    test(`${configName} exists`, fileExists(config));
});

// Test 8: Webpack build verification
console.log('\n📊 Build Output Analysis');
const distDir = './dist';
if (fileExists(distDir)) {
    const distFiles = fs.readdirSync(distDir);
    test('Dist directory not empty', distFiles.length > 0);
    test('Extension.js built', distFiles.includes('extension.js'));
    test('Index.html generated', fileExists('./dist/webview/index.html'));
    test('JS bundles generated', fileExists('./dist/webview') && fs.readdirSync('./dist/webview').some(f => f.endsWith('.js')));
} else {
    test('Dist directory exists', false);
}

// Test 9: Import/Export consistency
console.log('\n🔄 Import/Export Consistency');
const agentManagerCode = readFile('./src/agent/AgentManager.ts');
if (agentManagerCode) {
    test('AgentManager exports class', agentManagerCode.includes('export class AgentManager') || agentManagerCode.includes('export default class AgentManager'));
}

const lmStudioClientCode = readFile('./src/lmstudio/LMStudioClient.ts');
if (lmStudioClientCode) {
    test('LMStudioClient exports class', lmStudioClientCode.includes('export class LMStudioClient') || lmStudioClientCode.includes('export default class LMStudioClient'));
}

const chatProviderCode = readFile('./src/chat/ChatProvider.ts');
if (chatProviderCode) {
    test('ChatProvider exports class', chatProviderCode.includes('export class ChatProvider') || chatProviderCode.includes('export default class ChatProvider'));
}

// Test 10: Security integration check
console.log('\n🔒 Security Integration');
const securityManagerCode = readFile('./src/security/SecurityManager.ts');
if (securityManagerCode) {
    test('SecurityManager exists', true);
    test('SecurityManager exports class', securityManagerCode.includes('export class SecurityManager'));
}

// Check if security is integrated into ChatProvider
if (chatProviderCode) {
    test('ChatProvider imports security', chatProviderCode.includes('security') || chatProviderCode.includes('Security'));
}

// Summary
console.log('\n📊 WIRING VERIFICATION SUMMARY');
console.log('===============================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📋 Total:  ${passed + failed}`);

const successRate = Math.round((passed / (passed + failed)) * 100);
console.log(`🎯 Success Rate: ${successRate}%`);

if (successRate >= 90) {
    console.log('\n🎉 EXCELLENT! Extension wiring is in great shape!');
} else if (successRate >= 75) {
    console.log('\n✅ GOOD! Extension wiring is mostly correct, minor fixes needed.');
} else if (successRate >= 60) {
    console.log('\n⚠️  WARNING! Extension wiring has some issues that need attention.');
} else {
    console.log('\n❌ CRITICAL! Extension wiring has major issues that must be fixed.');
}

// Additional recommendations
console.log('\n💡 Recommendations:');
if (!fileExists('./dist/extension.js')) {
    console.log('   - Run "npm run compile" to build the extension');
}
if (!fileExists('./dist/index.html')) {
    console.log('   - Run "npm run package" to build the webview');
}
if (failed > 0) {
    console.log('   - Check failed tests above for specific issues');
    console.log('   - Ensure all imports are correctly resolved');
    console.log('   - Verify file paths and naming conventions');
}

console.log('\n🔗 Next Steps:');
console.log('   1. Install the extension in VS Code: F5 or "Run Extension"');
console.log('   2. Test the chat interface: Ctrl+Shift+P -> "LMS Copilot: Start Chat"');
console.log('   3. Test code completions: Type code in any file');
console.log('   4. Verify LM Studio connection in settings');
