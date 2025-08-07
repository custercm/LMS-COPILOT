// Test script to verify file creation functionality
const fs = require('fs');
const path = require('path');

async function testFileCreation() {
    console.log('Testing file creation functionality...');
    
    const testDir = path.join(__dirname, 'test-files');
    const testFilePath = path.join(testDir, 'test.txt');
    const testContent = 'Hello, this is a test file created by LMS Copilot!';
    
    try {
        // Test 1: Create directory
        console.log('1. Creating directory:', testDir);
        await fs.promises.mkdir(testDir, { recursive: true });
        console.log('✓ Directory created successfully');
        
        // Test 2: Create file
        console.log('2. Creating file:', testFilePath);
        await fs.promises.writeFile(testFilePath, testContent, 'utf8');
        console.log('✓ File created successfully');
        
        // Test 3: Verify file exists and read content
        console.log('3. Verifying file exists and reading content...');
        const readContent = await fs.promises.readFile(testFilePath, 'utf8');
        console.log('✓ File read successfully');
        console.log('Content:', readContent);
        
        // Test 4: Clean up
        console.log('4. Cleaning up test files...');
        await fs.promises.unlink(testFilePath);
        await fs.promises.rmdir(testDir);
        console.log('✓ Cleanup completed');
        
        console.log('\n🎉 All file creation tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
    }
}

testFileCreation();
