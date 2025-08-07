#!/usr/bin/env node

/**
 * Test Script for LMS Copilot File Operations
 * 
 * This script tests the basic functionality of file operations
 * to ensure everything is wired up correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing LMS Copilot File Operations...\n');

// Test 1: Check if essential files exist
console.log('📁 Checking extension files...');
const essentialFiles = [
    'src/extension.ts',
    'src/chat/ChatProvider.ts',
    'src/agent/AgentManager.ts',
    'src/tools/FileOperations.ts',
    'src/webview/hooks/useWebviewApi.ts',
    'src/webview/utils/commandHandler.ts'
];

let allFilesExist = true;
essentialFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        allFilesExist = false;
    }
});

// Test 2: Check package.json configuration
console.log('\n📦 Checking package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    
    if (packageJson.activationEvents?.includes('onStartupFinished')) {
        console.log('✅ Extension activation configured');
    } else {
        console.log('❌ Extension activation not configured');
    }
    
    if (packageJson.contributes?.commands?.length > 0) {
        console.log(`✅ ${packageJson.contributes.commands.length} commands registered`);
    } else {
        console.log('❌ No commands registered');
    }
    
    if (packageJson.contributes?.views?.['lms-copilot']) {
        console.log('✅ Chat panel view configured');
    } else {
        console.log('❌ Chat panel view not configured');
    }
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
}

// Test 3: Check for TypeScript compilation
console.log('\n🔧 Checking TypeScript configuration...');
if (fs.existsSync(path.join(__dirname, 'tsconfig.json'))) {
    console.log('✅ TypeScript configuration found');
} else {
    console.log('❌ TypeScript configuration missing');
}

// Test 4: Check webpack configuration
console.log('\n📦 Checking Webpack configuration...');
const webpackFiles = ['webpack.config.js', 'webpack.webview.config.js'];
webpackFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
    }
});

console.log('\n🎯 Test Summary:');
if (allFilesExist) {
    console.log('✅ All essential files are present');
    console.log('🚀 Ready for testing in VS Code!');
    console.log('\nNext steps:');
    console.log('1. Run "npm run compile" to build the extension');
    console.log('2. Press F5 in VS Code to launch extension development host');
    console.log('3. Open LMS Copilot chat panel and test file operations');
    console.log('4. Try dragging files into the chat interface');
    console.log('5. Test commands like "/search", "/workspace", etc.');
} else {
    console.log('❌ Some files are missing - please check the implementation');
}

console.log('\n📝 File Operations to Test:');
console.log('• Drag and drop files into chat');
console.log('• Type: "Create a new test.js file"');
console.log('• Type: "/search function"');
console.log('• Type: "/workspace"');
console.log('• Type: "/run npm --version"');

console.log('\n🔍 Debug Tips:');
console.log('• Check VS Code Developer Tools (Ctrl+Shift+I)');
console.log('• Look for console errors in webview');
console.log('• Check Output panel for extension logs');
console.log('• Use VS Code command palette to test commands');
