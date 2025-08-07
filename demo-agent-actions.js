#!/usr/bin/env node

/**
 * LMS Copilot Agent Action Wiring Demo
 * 
 * This script demonstrates the new agent action detection and execution capabilities.
 * It simulates various AI responses and shows how they get parsed and executed.
 */

const { AgentManager } = require('./out/agent/AgentManager');
const { LMStudioClient } = require('./out/lmstudio/LMStudioClient');

console.log('🤖 LMS Copilot Agent Action Wiring Demo\n');

// Mock LM Studio client for demonstration
class MockLMStudioClient extends LMStudioClient {
  constructor() {
    super({ endpoint: 'mock://localhost', model: 'demo-model' });
  }

  async sendMessage(message) {
    console.log(`📝 User Input: "${message}"\n`);
    
    // Simulate different types of AI responses based on input
    if (message.includes('create') && message.includes('hello world')) {
      return `I'll create a file called \`hello-world.js\` with the following content:

\`\`\`javascript
console.log('Hello, World!');
console.log('This file was created by LMS Copilot!');
\`\`\`

This creates a simple JavaScript file that outputs a hello world message to the console.`;
    }
    
    if (message.includes('React component')) {
      return `\`\`\`json
{
  "action": "create_file",
  "params": {
    "path": "components/UserCard.tsx",
    "content": "import React from 'react';\n\ninterface UserCardProps {\n  name: string;\n  email: string;\n  role: string;\n}\n\nexport default function UserCard({ name, email, role }: UserCardProps) {\n  return (\n    <div className=\\"user-card\\">\n      <h3>{name}</h3>\n      <p>{email}</p>\n      <span className=\\"role\\">{role}</span>\n    </div>\n  );\n}",
    "description": "User card component displaying name, email, and role"
  }
}
\`\`\`

I've created a TypeScript React component that displays user information in a card format. The component accepts name, email, and role as props and renders them in a clean layout.`;
    }
    
    if (message.includes('package.json') && message.includes('dependency')) {
      return `Let me edit your package.json file to add the requested dependency:

\`\`\`json
{
  "action": "edit_file",
  "params": {
    "path": "package.json",
    "content": "{\\n  \\"name\\": \\"my-project\\",\\n  \\"version\\": \\"1.0.0\\",\\n  \\"dependencies\\": {\\n    \\"express\\": \\"^4.18.0\\",\\n    \\"cors\\": \\"^2.8.5\\",\\n    \\"dotenv\\": \\"^16.0.0\\"\\n  }\\n}",
    "description": "Added express, cors, and dotenv dependencies"
  }
}
\`\`\`

I've updated your package.json to include the Express.js framework along with CORS middleware and environment variable support via dotenv.`;
    }
    
    if (message.includes('TypeScript config')) {
      return `Here's a TypeScript configuration file for your project:

\`\`\`typescript
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
\`\`\`

This configuration enables strict TypeScript checking with modern ES2020 features and proper module resolution.`;
    }
    
    return `I understand you want to work with: "${message}". Here's a general response that doesn't contain any specific file operations.`;
  }
}

// Demonstration scenarios
const scenarios = [
  {
    name: "JSON Structured Action",
    input: "Create a React component for displaying user information",
    expectedAction: "create_file",
    description: "Tests explicit JSON command parsing"
  },
  {
    name: "Natural Language File Creation",
    input: "create a hello world JavaScript file",
    expectedAction: "create_file", 
    description: "Tests natural language pattern detection"
  },
  {
    name: "File Editing with JSON",
    input: "Edit package.json to add express dependency",
    expectedAction: "edit_file",
    description: "Tests file editing through JSON commands"
  },
  {
    name: "Code Block Detection",
    input: "Show me a TypeScript config file",
    expectedAction: "implicit_code_block",
    description: "Tests detection of code blocks that could be saved"
  },
  {
    name: "Regular Conversation",
    input: "What is the weather like today?",
    expectedAction: "none",
    description: "Tests that regular chat doesn't trigger actions"
  }
];

async function runDemo() {
  const mockClient = new MockLMStudioClient();
  const agentManager = new AgentManager(mockClient);
  
  console.log('🚀 Starting Agent Action Wiring Demonstration...\n');
  console.log('=' * 80 + '\n');
  
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`📋 Scenario ${i + 1}: ${scenario.name}`);
    console.log(`📖 Description: ${scenario.description}`);
    console.log(`🎯 Expected Action: ${scenario.expectedAction}`);
    console.log('-' * 60);
    
    try {
      // Process the message through AgentManager
      const response = await agentManager.processMessage(scenario.input);
      
      console.log(`🤖 AI Response:`);
      console.log(response);
      console.log();
      
      // Analyze the response for actions
      const actionDetected = response.includes('✅ **Action completed:**');
      const hasCodeBlock = response.includes('```');
      const hasJsonAction = response.includes('"action":');
      
      console.log(`📊 Analysis:`);
      console.log(`   • Action Executed: ${actionDetected ? '✅ Yes' : '❌ No'}`);
      console.log(`   • Contains Code Block: ${hasCodeBlock ? '✅ Yes' : '❌ No'}`);
      console.log(`   • Contains JSON Action: ${hasJsonAction ? '✅ Yes' : '❌ No'}`);
      
      if (actionDetected) {
        console.log(`   • 🎉 SUCCESS: Action was detected and would be executed!`);
      } else if (hasCodeBlock && scenario.expectedAction !== 'none') {
        console.log(`   • 💡 INFO: Code block detected - user could save this as a file`);
      } else if (scenario.expectedAction === 'none') {
        console.log(`   • ✅ CORRECT: No action detected for general conversation`);
      }
      
    } catch (error) {
      console.log(`❌ Error processing scenario: ${error.message}`);
    }
    
    console.log('\n' + '=' * 80 + '\n');
  }
  
  console.log('🎯 Demo Completed!');
  console.log('\n📈 Summary of Agent Action Wiring Capabilities:');
  console.log('   • ✅ JSON structured action parsing');
  console.log('   • ✅ Natural language pattern detection');
  console.log('   • ✅ Code block identification');
  console.log('   • ✅ Intelligent action/no-action classification');
  console.log('   • ✅ VS Code API integration ready');
  console.log('   • ✅ User confirmation and safety checks');
  console.log('\n🚀 The system is ready to detect and execute file operations from AI responses!');
}

// Mock the VS Code workspace for demonstration
if (typeof require !== 'undefined' && require.main === module) {
  // Set up mock environment
  global.vscode = {
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
      fs: {
        writeFile: async (uri, content) => {
          console.log(`📁 Mock file write: ${uri.path} (${content.length} bytes)`);
        }
      }
    },
    window: {
      showInformationMessage: (msg) => console.log(`ℹ️  ${msg}`),
      showWarningMessage: (msg) => console.log(`⚠️  ${msg}`),
      showTextDocument: async (doc) => console.log(`📖 Opening document: ${doc.uri.path}`)
    }
  };
  
  runDemo().catch(console.error);
}

module.exports = { runDemo, MockLMStudioClient };
