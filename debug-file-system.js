#!/usr/bin/env node

/**
 * Alternative File Creation Test
 * Bypasses VS Code API and uses Node.js fs directly for testing
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Alternative File Creation Test\n');

// Test if we can create files using Node.js fs directly
async function testDirectFileCreation() {
    const testDir = process.cwd();
    const testFilePath = path.join(testDir, 'direct-test.js');
    const testContent = 'console.log("Direct file creation test");';
    
    try {
        console.log('📁 Test directory:', testDir);
        console.log('📝 Creating file:', testFilePath);
        
        // Write file directly using Node.js fs
        fs.writeFileSync(testFilePath, testContent);
        
        // Verify file was created
        if (fs.existsSync(testFilePath)) {
            const readContent = fs.readFileSync(testFilePath, 'utf8');
            console.log('✅ File created successfully!');
            console.log('📄 Content:', readContent);
            
            // Clean up
            fs.unlinkSync(testFilePath);
            console.log('🧹 Test file cleaned up');
            
            return true;
        } else {
            console.log('❌ File was not created');
            return false;
        }
    } catch (error) {
        console.log('❌ Direct file creation failed:', error.message);
        return false;
    }
}

// Test the VS Code workspace structure
function testWorkspaceStructure() {
    console.log('\n📂 Workspace Structure Test:');
    
    const currentDir = process.cwd();
    console.log('📁 Current directory:', currentDir);
    
    // List files in current directory
    const files = fs.readdirSync(currentDir);
    console.log('📋 Files in workspace:');
    files.slice(0, 10).forEach(file => {
        const filePath = path.join(currentDir, file);
        const isDirectory = fs.statSync(filePath).isDirectory();
        console.log(`   ${isDirectory ? '📁' : '📄'} ${file}`);
    });
    
    // Check if this looks like the LMS Copilot workspace
    const expectedFiles = ['package.json', 'src', 'dist'];
    const hasExpectedFiles = expectedFiles.every(file => files.includes(file));
    
    if (hasExpectedFiles) {
        console.log('✅ Workspace structure looks correct');
        return true;
    } else {
        console.log('⚠️  Workspace might not be the extension directory');
        return false;
    }
}

// Test alternative file creation that mimics AgentManager
function testAgentManagerFileCreation() {
    console.log('\n🤖 AgentManager-style File Creation Test:');
    
    const params = {
        path: 'agent-test-alternative.js',
        content: 'console.log("AgentManager alternative test");'
    };
    
    const basePath = process.cwd();
    const createPath = path.resolve(basePath, params.path);
    
    console.log('📁 Base path:', basePath);
    console.log('📝 Create path:', createPath);
    console.log('📄 Content length:', params.content.length);
    
    try {
        // Mimic the AgentManager logic
        const directory = path.dirname(createPath);
        console.log('📂 Directory to ensure:', directory);
        
        // Ensure directory exists
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
            console.log('📂 Directory created');
        } else {
            console.log('📂 Directory already exists');
        }
        
        // Write file
        fs.writeFileSync(createPath, params.content);
        console.log('💾 File written');
        
        // Verify
        if (fs.existsSync(createPath)) {
            console.log('✅ AgentManager-style creation successful!');
            
            // Clean up
            fs.unlinkSync(createPath);
            console.log('🧹 Cleaned up');
            return true;
        } else {
            console.log('❌ File verification failed');
            return false;
        }
        
    } catch (error) {
        console.log('❌ AgentManager-style creation failed:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running comprehensive file creation tests...\n');
    
    const directTest = await testDirectFileCreation();
    const workspaceTest = testWorkspaceStructure();
    const agentTest = testAgentManagerFileCreation();
    
    console.log('\n📊 Test Results:');
    console.log(`📁 Direct file creation: ${directTest ? '✅' : '❌'}`);
    console.log(`📂 Workspace structure: ${workspaceTest ? '✅' : '❌'}`);
    console.log(`🤖 AgentManager-style: ${agentTest ? '✅' : '❌'}`);
    
    if (directTest && agentTest) {
        console.log('\n✅ File system operations work correctly!');
        console.log('🔍 The issue is likely in VS Code API or extension context.');
        console.log('\n💡 Next steps:');
        console.log('1. Check if VS Code API is available in AgentManager context');
        console.log('2. Add fallback to use fs.writeFileSync instead of vscode.workspace.fs');
        console.log('3. Check if workspace folders are properly detected');
    } else {
        console.log('\n❌ File system has issues - check permissions and workspace setup');
    }
}

runAllTests().catch(console.error);
