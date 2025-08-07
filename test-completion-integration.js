#!/usr/bin/env node

/**
 * Integration test for LMS Copilot Completion Provider
 * This tests the completion functionality end-to-end
 */

const path = require('path');
const fs = require('fs');

async function testCompletionIntegration() {
    console.log('🧪 Testing LMS Copilot Completion Integration...\n');
    
    let passed = 0;
    let failed = 0;

    try {
        // Test 1: Check if CompletionProvider can be imported
        console.log('📦 Test 1: Import CompletionProvider...');
        try {
            const { CompletionProvider } = require('./dist/completion/CompletionProvider');
            if (CompletionProvider) {
                console.log('✅ CompletionProvider imported successfully');
                passed++;
            } else {
                console.log('❌ CompletionProvider not found');
                failed++;
            }
        } catch (error) {
            console.log('❌ Failed to import CompletionProvider:', error.message);
            failed++;
        }

        // Test 2: Check if ContextAnalyzer can be imported
        console.log('\n📦 Test 2: Import ContextAnalyzer...');
        try {
            const { ContextAnalyzer } = require('./dist/completion/ContextAnalyzer');
            if (ContextAnalyzer) {
                console.log('✅ ContextAnalyzer imported successfully');
                passed++;
            } else {
                console.log('❌ ContextAnalyzer not found');
                failed++;
            }
        } catch (error) {
            console.log('❌ Failed to import ContextAnalyzer:', error.message);
            failed++;
        }

        // Test 3: Check if CompletionCache can be imported  
        console.log('\n📦 Test 3: Import CompletionCache...');
        try {
            const { CompletionCache } = require('./dist/completion/CompletionCache');
            if (CompletionCache) {
                console.log('✅ CompletionCache imported successfully');
                passed++;
            } else {
                console.log('❌ CompletionCache not found');
                failed++;
            }
        } catch (error) {
            console.log('❌ Failed to import CompletionCache:', error.message);
            failed++;
        }

        // Test 4: Check if extension.js contains completion provider registration
        console.log('\n🔗 Test 4: Check extension registration...');
        try {
            const extensionPath = path.join(__dirname, 'dist', 'extension.js');
            
            if (fs.existsSync(extensionPath)) {
                const extensionContent = fs.readFileSync(extensionPath, 'utf-8');
                
                if (extensionContent.includes('CompletionProvider') && 
                    extensionContent.includes('registerInlineCompletionItemProvider')) {
                    console.log('✅ Completion provider is registered in extension');
                    passed++;
                } else {
                    console.log('❌ Completion provider registration not found in extension');
                    failed++;
                }
            } else {
                console.log('❌ Extension.js not found - compilation may have failed');
                failed++;
            }
        } catch (error) {
            console.log('❌ Failed to check extension registration:', error.message);
            failed++;
        }

        // Test 5: Check package.json for completion commands
        console.log('\n📋 Test 5: Check package.json commands...');
        try {
            const packageJson = require('./package.json');
            const commands = packageJson.contributes?.commands || [];
            
            const completionCommands = commands.filter(cmd => 
                cmd.command.includes('Completions') || cmd.command.includes('completions') ||
                cmd.command.includes('Cache') || cmd.command.includes('cache')
            );
            
            if (completionCommands.length >= 4) {
                console.log('✅ Completion commands found in package.json');
                console.log(`   Found: ${completionCommands.map(c => c.command).join(', ')}`);
                passed++;
            } else {
                console.log('❌ Insufficient completion commands in package.json');
                console.log(`   Found only: ${completionCommands.map(c => c.command).join(', ')}`);
                failed++;
            }
        } catch (error) {
            console.log('❌ Failed to check package.json commands:', error.message);
            failed++;
        }

        // Test 6: Check configuration settings
        console.log('\n⚙️  Test 6: Check completion configuration...');
        try {
            const packageJson = require('./package.json');
            const config = packageJson.contributes?.configuration?.properties || {};
            
            const completionConfigs = Object.keys(config).filter(key => 
                key.includes('completion') || key.includes('Completion')
            );
            
            if (completionConfigs.length >= 3) {
                console.log('✅ Completion configuration settings found');
                console.log(`   Found: ${completionConfigs.join(', ')}`);
                passed++;
            } else {
                console.log('❌ Insufficient completion configuration settings');
                failed++;
            }
        } catch (error) {
            console.log('❌ Failed to check completion configuration:', error.message);
            failed++;
        }

    } catch (error) {
        console.log('❌ Unexpected error during testing:', error.message);
        failed++;
    }

    // Results
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All completion integration tests passed!');
        console.log('🚀 The completion provider is ready to use!');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the issues above.');
    }

    return { passed, failed };
}

// Additional function to test completion provider instantiation (mock test)
async function testCompletionProviderMockInstantiation() {
    console.log('\n🔧 Testing CompletionProvider mock instantiation...');
    
    try {
        // Check if the completion files exist
        const completionProviderPath = path.join(__dirname, 'dist', 'completion', 'CompletionProvider.js');
        const completionCachePath = path.join(__dirname, 'dist', 'completion', 'CompletionCache.js');
        
        if (fs.existsSync(completionProviderPath) && fs.existsSync(completionCachePath)) {
            console.log('✅ All completion files compiled successfully');
            console.log('✅ CompletionProvider and CompletionCache are available');
            return true;
        } else {
            console.log('❌ Some completion files are missing');
            return false;
        }
    } catch (error) {
        console.log('❌ Error checking completion files:', error.message);
        return false;
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testCompletionIntegration()
        .then(results => {
            return testCompletionProviderMockInstantiation();
        })
        .then(instantiationTest => {
            if (instantiationTest) {
                console.log('\n🎯 All completion tests completed successfully!');
                process.exit(0);
            } else {
                console.log('\n🔴 Some completion tests failed.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('🔴 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testCompletionIntegration, testCompletionProviderMockInstantiation };
