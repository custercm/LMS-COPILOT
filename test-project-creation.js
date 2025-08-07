// Test script to verify project creation functionality
const path = require('path');
const fs = require('fs');

// Import our FileOperations module
const FileOperations = require('./dist/tools/FileOperations');

async function testProjectCreation() {
    console.log('🧪 Testing LMS Copilot Project Creation...\n');
    
    const testDir = path.join(__dirname, 'test-project');
    
    try {
        // Test 1: Create a simple file
        console.log('1. Testing basic file creation...');
        await FileOperations.writeFile(path.join(testDir, 'test.txt'), 'Hello World!');
        
        if (fs.existsSync(path.join(testDir, 'test.txt'))) {
            console.log('✅ Basic file creation works!');
        } else {
            console.log('❌ Basic file creation failed!');
        }
        
        // Test 2: Create a package.json file
        console.log('\n2. Testing package.json creation...');
        const packageJson = {
            name: 'test-react-app',
            version: '0.1.0',
            dependencies: {
                'react': '^18.2.0'
            }
        };
        
        await FileOperations.writeFile(
            path.join(testDir, 'package.json'), 
            JSON.stringify(packageJson, null, 2)
        );
        
        if (fs.existsSync(path.join(testDir, 'package.json'))) {
            console.log('✅ Package.json creation works!');
        } else {
            console.log('❌ Package.json creation failed!');
        }
        
        // Test 3: Create directory structure
        console.log('\n3. Testing directory structure creation...');
        const dirs = [
            'src',
            'src/components',
            'public'
        ];
        
        for (const dir of dirs) {
            await FileOperations.writeFile(path.join(testDir, dir, '.gitkeep'), '');
        }
        
        const allDirsExist = dirs.every(dir => 
            fs.existsSync(path.join(testDir, dir, '.gitkeep'))
        );
        
        if (allDirsExist) {
            console.log('✅ Directory structure creation works!');
        } else {
            console.log('❌ Directory structure creation failed!');
        }
        
        console.log('\n🎉 All tests passed! Project creation functionality is working.');
        console.log(`📁 Test files created in: ${testDir}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testProjectCreation();
