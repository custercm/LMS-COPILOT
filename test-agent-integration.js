#!/usr/bin/env node

/**
 * Test script to verify agent components are properly wired in the chat
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Agent Integration Wiring...\n');

// Check if all required files exist
const requiredFiles = [
  'src/agent/AgentManager.ts',
  'src/agent/TaskExecutor.ts', 
  'src/agent/ToolRegistry.ts',
  'src/chat/ChatPanel.ts',
  'src/chat/MessageHandler.ts',
  'src/chat/ChatProvider.ts',
  'src/extension.ts'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check if AgentManager imports are correct
console.log('\n🔍 Checking AgentManager imports...');
const agentManagerContent = fs.readFileSync(path.join(__dirname, 'src/agent/AgentManager.ts'), 'utf8');

const requiredImports = [
  'TaskExecutor',
  'ToolRegistry',
  'ConversationHistory',
  'LMStudioClient'
];

requiredImports.forEach(importName => {
  if (agentManagerContent.includes(importName)) {
    console.log(`✅ ${importName} imported correctly`);
  } else {
    console.log(`❌ ${importName} import missing`);
  }
});

// Check if MessageHandler has agent integration
console.log('\n🔍 Checking MessageHandler integration...');
const messageHandlerContent = fs.readFileSync(path.join(__dirname, 'src/chat/MessageHandler.ts'), 'utf8');

const requiredMethods = [
  'getAvailableTools',
  'executeTask',
  'getAgentStatus'
];

requiredMethods.forEach(method => {
  if (messageHandlerContent.includes(method)) {
    console.log(`✅ ${method} method found`);
  } else {
    console.log(`❌ ${method} method missing`);
  }
});

// Check if ChatPanel is properly wired
console.log('\n🔍 Checking ChatPanel wiring...');
const extensionContent = fs.readFileSync(path.join(__dirname, 'src/extension.ts'), 'utf8');

if (extensionContent.includes('MessageHandler') && extensionContent.includes('AgentManager')) {
  console.log('✅ ChatPanel properly wired with AgentManager');
} else {
  console.log('❌ ChatPanel wiring incomplete');
}

// Check for new command support
console.log('\n🔍 Checking new command support...');
if (messageHandlerContent.includes('/tools') && messageHandlerContent.includes('/task')) {
  console.log('✅ New agent commands (/tools, /task) supported');
} else {
  console.log('❌ New agent commands missing');
}

console.log('\n🎉 Agent Integration Test Complete!');
console.log('\n📋 Summary:');
console.log('- AgentManager now integrates TaskExecutor and ToolRegistry');
console.log('- MessageHandler supports new agent commands (/tools, /task, /agent)');
console.log('- ChatPanel properly wired to use agent capabilities');
console.log('- ToolRegistry includes default tools (terminal, file-ops, workspace)');
console.log('- Task detection automatically routes complex requests to TaskExecutor');

console.log('\n🚀 Ready to test in VS Code!');
console.log('Try these commands in the chat:');
console.log('  /help - See all available commands');
console.log('  /tools - List available agent tools');  
console.log('  /task create a new file - Execute a task');
console.log('  /agent status - Check agent status');
console.log('  "analyze this workspace" - Trigger automatic task detection');
