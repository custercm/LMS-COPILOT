#!/usr/bin/env node

/**
 * Test script to verify PanelManager integration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing PanelManager Integration...\n');

// Check if compiled files exist
const distPath = path.join(__dirname, 'dist');
const extensionFile = path.join(distPath, 'extension.js');
const panelManagerFile = path.join(distPath, 'ui', 'PanelManager.js');

let testsPassedCount = 0;
let testsFailedCount = 0;

function testPassed(testName) {
    console.log(`✅ ${testName}`);
    testsPassedCount++;
}

function testFailed(testName, reason) {
    console.log(`❌ ${testName}: ${reason}`);
    testsFailedCount++;
}

// Test 1: Check if compiled files exist
if (fs.existsSync(extensionFile)) {
    testPassed('Extension.js compiled successfully');
} else {
    testFailed('Extension.js compilation', 'File not found');
}

if (fs.existsSync(panelManagerFile)) {
    testPassed('PanelManager.js compiled successfully');
} else {
    testFailed('PanelManager.js compilation', 'File not found');
}

// Test 2: Check imports in compiled extension
if (fs.existsSync(extensionFile)) {
    const extensionContent = fs.readFileSync(extensionFile, 'utf8');
    
    if (extensionContent.includes('PanelManager')) {
        testPassed('PanelManager imported in extension');
    } else {
        testFailed('PanelManager import', 'Import not found in compiled code');
    }
    
    if (extensionContent.includes('setAgentManager')) {
        testPassed('AgentManager wiring detected');
    } else {
        testFailed('AgentManager wiring', 'setAgentManager call not found');
    }
    
    if (extensionContent.includes('setMessageHandler')) {
        testPassed('MessageHandler wiring detected');
    } else {
        testFailed('MessageHandler wiring', 'setMessageHandler call not found');
    }
}

// Test 3: Check PanelManager compiled structure
if (fs.existsSync(panelManagerFile)) {
    const panelManagerContent = fs.readFileSync(panelManagerFile, 'utf8');
    
    if (panelManagerContent.includes('createPanel')) {
        testPassed('PanelManager.createPanel method exists');
    } else {
        testFailed('PanelManager.createPanel', 'Method not found');
    }
    
    if (panelManagerContent.includes('ChatPanel')) {
        testPassed('ChatPanel integration detected');
    } else {
        testFailed('ChatPanel integration', 'ChatPanel not found in compiled code');
    }
    
    if (panelManagerContent.includes('handleWebviewMessage')) {
        testPassed('Webview message handling implemented');
    } else {
        testFailed('Webview message handling', 'handleWebviewMessage not found');
    }
}

// Test 4: Check package.json commands
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (packageJson.contributes && packageJson.contributes.commands) {
            const commands = packageJson.contributes.commands;
            const chatCommand = commands.find(cmd => cmd.command === 'lms-copilot.startChat');
            
            if (chatCommand) {
                testPassed('Chat command registered in package.json');
            } else {
                testFailed('Chat command registration', 'startChat command not found');
            }
        }
    } catch (error) {
        testFailed('Package.json parsing', error.message);
    }
}

console.log('\n📊 Integration Test Results:');
console.log(`✅ Passed: ${testsPassedCount}`);
console.log(`❌ Failed: ${testsFailedCount}`);
console.log(`📈 Success Rate: ${Math.round((testsPassedCount / (testsPassedCount + testsFailedCount)) * 100)}%`);

if (testsFailedCount === 0) {
    console.log('\n🎉 All integration tests passed! PanelManager is properly wired.');
} else {
    console.log('\n⚠️  Some integration tests failed. Check the issues above.');
}
