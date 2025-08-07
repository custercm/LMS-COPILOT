#!/usr/bin/env node

/**
 * Comprehensive Agent Action Trace
 * Tests the complete flow from ChatProvider to file creation
 */

console.log('🔍 Comprehensive Agent Action Trace\n');

// Test the complete flow with debugging
async function testCompleteFlow() {
    console.log('📋 Testing complete agent action flow...\n');
    
    // Step 1: Simulate user input
    const userMessage = "Create a file called test.js with console.log('hello world');";
    console.log('1. User Input:', userMessage);
    
    // Step 2: Simulate ChatProvider.handleSendMessage()
    console.log('\n2. ChatProvider.handleSendMessage() processing...');
    
    // Step 2a: Input sanitization
    const sanitizedMessage = userMessage; // Simplified for test
    console.log('   ✓ Message sanitized:', sanitizedMessage);
    
    // Step 2b: Call AgentManager.processMessage()
    console.log('\n3. AgentManager.processMessage() called...');
    
    // Step 3a: Simulate LM Studio response with action detection
    const mockLMStudioResponse = `I'll create a file called test.js with that code.

\`\`\`javascript
console.log('hello world');
\`\`\`

This creates a simple JavaScript file that outputs "hello world" to the console.`;
    
    console.log('   📡 Mock LM Studio response:', mockLMStudioResponse.substring(0, 100) + '...');
    
    // Step 3b: Parse for structured actions
    const parseStructuredResponse = (response) => {
        // Natural language pattern detection
        const createFilePattern = /(?:i'll|let me|i will|i'm going to)\s+create\s+(?:a\s+)?(?:file\s+)?(?:called\s+|named\s+)?['"`]?([^'"`\s]+)['"`]?\s*(?:with|containing)?\s*(?:content|code)?[:\s]*[`'"]*([^`'"]*)[`'"]*/i;
        const createMatch = response.match(createFilePattern);
        if (createMatch) {
            const codeMatch = response.match(/```\w*\s*\n([\s\S]*?)\n```/);
            const content = codeMatch ? codeMatch[1] : createMatch[2] || '';
            
            return {
                action: 'create_file',
                params: {
                    path: createMatch[1],
                    content: content.trim(),
                    description: `Created via natural language: ${createMatch[0]}`
                }
            };
        }
        return null;
    };
    
    const structuredAction = parseStructuredResponse(mockLMStudioResponse);
    
    if (structuredAction) {
        console.log('   ✅ Action detected:', structuredAction.action);
        console.log('   📁 File path:', structuredAction.params.path);
        console.log('   📝 Content:', structuredAction.params.content);
        
        // Step 3c: Execute the action (simulated)
        console.log('\n4. Executing action...');
        console.log('   🔧 Action type: create_file');
        console.log('   📍 Would create file at: workspace/' + structuredAction.params.path);
        console.log('   💾 Would write content:', structuredAction.params.content);
        
        // Step 3d: Format successful response
        const actionResult = `Created file: ${structuredAction.params.path} (${structuredAction.params.content.length} characters)`;
        const finalResponse = `✅ **Action completed:** ${actionResult}\n\nThis creates a simple JavaScript file that outputs "hello world" to the console.`;
        
        console.log('   ✅ Action execution result:', actionResult);
        
        // Step 4: ChatProvider.processActionResult()
        console.log('\n5. ChatProvider.processActionResult() processing...');
        
        const processActionResult = (response) => {
            const actionCompletedMatch = response.match(/✅ \*\*Action completed:\*\* (.+)/);
            
            if (actionCompletedMatch) {
                const actionDescription = actionCompletedMatch[1];
                console.log('   ✅ Action completion detected:', actionDescription);
                
                const metadata = {
                    actionType: 'file_operation',
                    actionCompleted: true,
                    operation: 'create',
                    filePath: 'test.js'
                };
                
                return {
                    formattedResponse: `### 🎯 Action Completed\n\n**${actionDescription}**\n\n---\n\nThis creates a simple JavaScript file that outputs "hello world" to the console.`,
                    actionCompleted: true,
                    notificationMessage: actionDescription,
                    metadata
                };
            }
            
            return {
                formattedResponse: response,
                actionCompleted: false
            };
        };
        
        const actionResult_processed = processActionResult(finalResponse);
        
        console.log('   ✅ Formatted response prepared');
        console.log('   🎯 Action completed:', actionResult_processed.actionCompleted);
        console.log('   📢 Notification:', actionResult_processed.notificationMessage);
        
        // Step 5: Send response to webview
        console.log('\n6. Sending response to webview...');
        console.log('   📤 Command: addMessage');
        console.log('   👤 Role: assistant');
        console.log('   📝 Content preview:', actionResult_processed.formattedResponse.substring(0, 100) + '...');
        
        if (actionResult_processed.actionCompleted) {
            console.log('   📢 Additional notification sent');
        }
        
        console.log('\n🎉 Complete Flow Analysis:');
        console.log('✅ Input processed correctly');
        console.log('✅ Action detected from LM Studio response');
        console.log('✅ File creation would be executed');
        console.log('✅ Success response formatted properly');
        console.log('✅ Webview would receive formatted response');
        
        console.log('\n🔍 If files are NOT being created, the issue is likely:');
        console.log('1. VS Code workspace API permissions');
        console.log('2. Extension context not available during action execution');
        console.log('3. Security settings blocking file operations');
        console.log('4. LM Studio returning different response format');
        
    } else {
        console.log('   ❌ No action detected - this would explain why only chat happens!');
        console.log('   🔧 LM Studio response needs better action patterns');
    }
}

// Run the test
testCompleteFlow().catch(console.error);
