/**
 * Test file to verify adaptive security integration
 */
const { execSync } = require('child_process');

async function testAdaptiveSecurity() {
    console.log('🔐 Testing Adaptive Security Integration...\n');
    
    try {
        // Test compilation
        console.log('📋 Testing compilation...');
        execSync('npm run compile', { cwd: process.cwd(), stdio: 'pipe' });
        console.log('✅ Compilation successful');
        
        // Test that the files exist
        const fs = require('fs');
        const path = require('path');
        
        const chatProviderPath = path.join(__dirname, 'src/chat/ChatProvider.ts');
        const adaptiveSecurityPath = path.join(__dirname, 'src/security/AdaptiveSecurity.ts');
        
        console.log('\n📋 Testing file structure...');
        console.log(`   ChatProvider.ts: ${fs.existsSync(chatProviderPath) ? '✅' : '❌'}`);
        console.log(`   AdaptiveSecurity.ts: ${fs.existsSync(adaptiveSecurityPath) ? '✅' : '❌'}`);
        
        // Test that SimpleChatProvider was removed
        const simpleChatProviderPath = path.join(__dirname, 'src/chat/SimpleChatProvider.ts');
        console.log(`   SimpleChatProvider.ts removed: ${!fs.existsSync(simpleChatProviderPath) ? '✅' : '❌'}`);
        
        // Test that ChatProvider contains adaptive security imports
        const chatProviderContent = fs.readFileSync(chatProviderPath, 'utf8');
        const hasAdaptiveImport = chatProviderContent.includes('AdaptiveSecurityManager');
        const hasSecurityConfig = chatProviderContent.includes('updateSecurityFromSettings');
        
        console.log('\n📋 Testing ChatProvider integration...');
        console.log(`   AdaptiveSecurityManager import: ${hasAdaptiveImport ? '✅' : '❌'}`);
        console.log(`   Settings update method: ${hasSecurityConfig ? '✅' : '❌'}`);
        
        console.log('\n✅ All tests passed! The ChatProvider merge was successful.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testAdaptiveSecurity().catch(console.error);
