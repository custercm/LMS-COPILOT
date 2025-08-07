// Simple test to verify file creation works
const fs = require('fs');
const path = require('path');

async function testActualFileCreation() {
    console.log('Testing actual file creation...\n');
    
    // Simulate the FileOperations.writeFile function
    async function writeFile(filePath, content) {
        try {
            console.log(`FileOperations.writeFile: Writing to ${filePath}`);
            
            const fullPath = path.resolve(filePath);
            const dir = path.dirname(fullPath);
            
            console.log(`FileOperations.writeFile: Full path ${fullPath}, directory: ${dir}`);
            
            // Ensure the directory exists
            await fs.promises.mkdir(dir, { recursive: true });
            console.log(`FileOperations.writeFile: Directory created/verified: ${dir}`);
            
            // Write the file
            await fs.promises.writeFile(fullPath, content, 'utf8');
            console.log(`FileOperations.writeFile: File written successfully to ${fullPath}`);
        } catch (error) {
            console.error(`FileOperations.writeFile: Failed to write file ${filePath}:`, error);
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }
    
    // Test 1: Create a simple test file
    const testFile1 = './test-output/simple.txt';
    const content1 = 'Hello from LMS Copilot file creation test!';
    
    try {
        await writeFile(testFile1, content1);
        console.log('✓ Test 1 passed: Simple file creation\n');
    } catch (error) {
        console.error('❌ Test 1 failed:', error.message, '\n');
    }
    
    // Test 2: Create a file with nested directories
    const testFile2 = './test-output/nested/components/TestComponent.tsx';
    const content2 = `import React from 'react';

interface TestComponentProps {
  message: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ message }) => {
  return (
    <div className="test-component">
      <h1>LMS Copilot Test</h1>
      <p>{message}</p>
    </div>
  );
};

export default TestComponent;`;
    
    try {
        await writeFile(testFile2, content2);
        console.log('✓ Test 2 passed: Nested directory file creation\n');
    } catch (error) {
        console.error('❌ Test 2 failed:', error.message, '\n');
    }
    
    // Test 3: Verify files were actually created
    console.log('Verifying created files...');
    
    try {
        const files = [testFile1, testFile2];
        for (const file of files) {
            const fullPath = path.resolve(file);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                console.log(`✓ ${file} exists (${content.length} chars)`);
            } else {
                console.log(`❌ ${file} does not exist`);
            }
        }
    } catch (error) {
        console.error('Error verifying files:', error.message);
    }
    
    // Cleanup
    console.log('\nCleaning up test files...');
    try {
        if (fs.existsSync('./test-output')) {
            fs.rmSync('./test-output', { recursive: true, force: true });
            console.log('✓ Cleanup completed');
        }
    } catch (error) {
        console.error('Cleanup failed:', error.message);
    }
}

testActualFileCreation();
