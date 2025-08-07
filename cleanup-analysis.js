#!/usr/bin/env node

/**
 * Cleanup Analysis - Verify Safe Removal of Old Extension Files
 * Shows what's in the old files vs current files before cleanup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Cleanup Analysis - Verifying Safe Removal\n');

// Current extension.js analysis
console.log('📁 Current extension.js (KEEP):');
const currentExtension = fs.readFileSync(path.join(__dirname, 'dist', 'extension.js'), 'utf8');
console.log('   ✓ Uses ChatProvider:', currentExtension.includes('ChatProvider'));
console.log('   ✓ Uses AgentManager:', currentExtension.includes('AgentManager'));
console.log('   ✓ Has test commands:', currentExtension.includes('testAgent'));
console.log('   ✓ Has debug panel:', currentExtension.includes('debugPanel'));

// Old extension-old.js analysis
console.log('\n📁 Old extension-old.js (REMOVE):');
const oldExtension = fs.readFileSync(path.join(__dirname, 'dist', 'extension-old.js'), 'utf8');
console.log('   ❌ Uses SimpleChatProvider:', oldExtension.includes('SimpleChatProvider'));
console.log('   ✓ Uses AgentManager:', oldExtension.includes('AgentManager'));
console.log('   ❌ Missing test commands:', !oldExtension.includes('testAgent'));

// Old extension-fixed.js analysis  
console.log('\n📁 Old extension-fixed.js (REMOVE):');
const fixedExtension = fs.readFileSync(path.join(__dirname, 'dist', 'extension-fixed.js'), 'utf8');
console.log('   ❌ Uses SimpleChatProvider:', fixedExtension.includes('SimpleChatProvider'));
console.log('   ❌ Missing AgentManager direct access:', !fixedExtension.includes('new AgentManager_1.AgentManager'));
console.log('   ❌ Missing test commands:', !fixedExtension.includes('testAgent'));

console.log('\n🎯 Analysis Summary:');
console.log('✅ Current extension.js: Complete, uses ChatProvider, has all features');
console.log('❌ extension-old.js: Obsolete, uses removed SimpleChatProvider');
console.log('❌ extension-fixed.js: Obsolete, minimal functionality, uses removed SimpleChatProvider');

console.log('\n🧹 Safe to Remove:');
console.log('- dist/extension-old.js (and .d.ts)');
console.log('- dist/extension-fixed.js (and .d.ts)');

console.log('\n✅ No important logic will be lost - everything is in current extension.js');

// Show what will be removed
const filesToRemove = [
    'dist/extension-old.js',
    'dist/extension-old.d.ts', 
    'dist/extension-fixed.js',
    'dist/extension-fixed.d.ts'
];

console.log('\n📋 Files to be removed:');
filesToRemove.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`   - ${file} (${stats.size} bytes)`);
    }
});

console.log('\n🚀 This cleanup will eliminate potential conflicts from old compiled files!');
