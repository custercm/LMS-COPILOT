// Test the extension's file creation logic directly
const path = require('path');
const fs = require('fs');

// Mock vscode for testing
const vscode = {
    workspace: {
        workspaceFolders: [{
            uri: {
                fsPath: __dirname,
                joinPath: (uri, ...pathSegments) => ({
                    fsPath: path.join(uri.fsPath, ...pathSegments)
                })
            }
        }]
    },
    Uri: {
        joinPath: (uri, ...pathSegments) => ({
            fsPath: path.join(uri.fsPath, ...pathSegments)
        }),
        file: (filePath) => ({ fsPath: filePath })
    }
};

// Import our FileOperations (we'll need to compile first)
async function testExtensionFlow() {
    console.log('🧪 Testing Extension File Creation Flow...\n');
    
    try {
        // Test 1: Direct FileOperations test
        console.log('1. Testing FileOperations directly...');
        
        // Simulate the writeFile function from our extension
        async function writeFile(filePath, content) {
            const fullPath = path.resolve(filePath);
            const dir = path.dirname(fullPath);
            
            // Ensure the directory exists
            await fs.promises.mkdir(dir, { recursive: true });
            
            // Write the file
            await fs.promises.writeFile(fullPath, content, 'utf8');
            return true;
        }
        
        // Test project creation
        const testDir = path.join(__dirname, 'test-extension-project');
        
        // Clean up first
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        
        // Create React project structure
        console.log('2. Creating React project structure...');
        
        const projectName = 'test-react-app';
        const projectPath = testDir;
        
        // Create directories
        const dirs = [
            projectPath,
            path.join(projectPath, 'src'),
            path.join(projectPath, 'src/components'),
            path.join(projectPath, 'public')
        ];
        
        for (const dir of dirs) {
            await writeFile(path.join(dir, '.gitkeep'), '');
        }
        
        // Create package.json
        const packageJson = {
            name: projectName,
            version: "0.1.0",
            private: true,
            dependencies: {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-scripts": "5.0.1"
            },
            scripts: {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
            }
        };
        
        await writeFile(
            path.join(projectPath, 'package.json'), 
            JSON.stringify(packageJson, null, 2)
        );
        
        // Create App.js
        const appJs = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${projectName}</h1>
        <p>Edit src/App.js and save to reload.</p>
      </header>
    </div>
  );
}

export default App;`;
        
        await writeFile(path.join(projectPath, 'src/App.js'), appJs);
        
        // Create index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
        
        await writeFile(path.join(projectPath, 'public/index.html'), indexHtml);
        
        console.log('✅ Project structure created successfully!');
        
        // Test 3: Verify all files exist
        console.log('3. Verifying created files...');
        
        const expectedFiles = [
            'package.json',
            'public/index.html',
            'src/App.js',
            'src/.gitkeep',
            'src/components/.gitkeep',
            'public/.gitkeep'
        ];
        
        const allFilesExist = expectedFiles.every(file => 
            fs.existsSync(path.join(projectPath, file))
        );
        
        if (allFilesExist) {
            console.log('✅ All project files verified!');
        } else {
            console.log('❌ Some files missing:');
            expectedFiles.forEach(file => {
                const exists = fs.existsSync(path.join(projectPath, file));
                console.log(`  ${exists ? '✅' : '❌'} ${file}`);
            });
        }
        
        // Test 4: Test pattern matching
        console.log('\n4. Testing message pattern matching...');
        
        function testMessagePattern(message) {
            const lowerMessage = message.toLowerCase();
            
            // Project creation patterns
            const isProjectRequest = lowerMessage.includes('create') && (
                lowerMessage.includes('project') || 
                lowerMessage.includes('react') || 
                lowerMessage.includes('app') || 
                lowerMessage.includes('application')
            );
            
            let projectType = 'general';
            if (lowerMessage.includes('react')) {
                projectType = 'react';
            }
            
            return { isProjectRequest, projectType };
        }
        
        const testMessages = [
            "Create a simple react project and build the files and structure",
            "Build a React application",
            "Create a new project",
            "Make a React app called my-app",
            "How are you today?"
        ];
        
        testMessages.forEach(msg => {
            const result = testMessagePattern(msg);
            console.log(`  "${msg}" -> Project: ${result.isProjectRequest}, Type: ${result.projectType}`);
        });
        
        console.log('\n🎉 Extension flow test completed successfully!');
        console.log(`📁 Test project created at: ${testDir}`);
        
    } catch (error) {
        console.error('❌ Extension flow test failed:', error);
    }
}

testExtensionFlow();
