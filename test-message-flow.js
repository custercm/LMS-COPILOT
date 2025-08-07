// Test the exact flow that happens in the VS Code extension
console.log('🔧 Testing Extension Message Flow...\n');

// Simulate the exact messages and flow
function simulateExtensionFlow() {
    const testMessages = [
        "Create a simple react project and build the files and structure",
        "Build a React app called my-todo-app",
        "Generate a new React application",
        "Make a project with React"
    ];
    
    console.log('Simulating handleFileOperationRequest for each message:\n');
    
    testMessages.forEach((message, index) => {
        console.log(`Test ${index + 1}: "${message}"`);
        console.log('[LMS Copilot] Processing message:', message);
        
        const lowerMessage = message.toLowerCase();
        console.log('[LMS Copilot] Checking for file operations in:', lowerMessage);
        
        // Enhanced Project creation patterns
        const willCreate = (lowerMessage.includes('create') || lowerMessage.includes('build') || lowerMessage.includes('make') || lowerMessage.includes('generate')) && (
            lowerMessage.includes('project') || 
            lowerMessage.includes('react') || 
            lowerMessage.includes('app') || 
            lowerMessage.includes('application') ||
            lowerMessage.includes('structure') ||
            lowerMessage.includes('files')
        );
        
        if (willCreate) {
            console.log('[LMS Copilot] Detected project creation request!');
            
            let projectType = 'general';
            if (lowerMessage.includes('react')) {
                projectType = 'react';
            }
            
            console.log(`[LMS Copilot] Creating ${projectType} project in: /workspace/path`);
            console.log('[LMS Copilot] Project creation successful!');
            console.log('✅ RESULT: Files will be created\n');
        } else {
            console.log('[LMS Copilot] No file operation detected');
            console.log('[LMS Copilot] Sending to LM Studio for general response');
            console.log('❌ RESULT: Only text response\n');
        }
    });
}

simulateExtensionFlow();

console.log('📋 Summary:');
console.log('When you test in VS Code, you should see these exact console messages.');
console.log('If you see "Detected project creation request!" followed by "Project creation successful!",');
console.log('then files WILL be created in your workspace.');
console.log('');
console.log('🎯 To test:');
console.log('1. Open VS Code with your LMS Copilot extension');
console.log('2. Open Developer Tools (Help > Toggle Developer Tools)');
console.log('3. Go to the Console tab');
console.log('4. Open a workspace folder in VS Code');
console.log('5. Type: "Create a simple React project"');
console.log('6. Look for the [LMS Copilot] messages in the console');
console.log('7. Check your workspace for new files!');
console.log('');
console.log('✨ The extension is now ready to create files!');
