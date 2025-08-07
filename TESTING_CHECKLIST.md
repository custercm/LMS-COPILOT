# LMS Copilot Testing Checklist

## 🚀 Pre-Testing Setup

1. **Build the Extension**
   ```bash
   npm run compile
   ```
   ✅ **Status**: Completed - No TypeScript errors

2. **Launch Extension Development Host**
   - Press `F5` in VS Code
   - Or use Command Palette: `Developer: Reload Window`

3. **Open LMS Copilot Panel**
   - Use Command Palette: `LMS Copilot: Open Chat`
   - Or click the LMS Copilot icon in the sidebar

## 📋 Core File Operations Testing

### ✅ File Upload (Drag & Drop)
- [ ] **Test 1**: Drag a `.js` file into chat
  - Expected: File content analysis and AI response
  
- [ ] **Test 2**: Drag an image file into chat
  - Expected: Image metadata extraction and description
  
- [ ] **Test 3**: Drag a `.json` file into chat
  - Expected: JSON structure analysis

### ✅ File Creation
- [ ] **Test 4**: Type: `"Create a new test.js file with a simple function"`
  - Expected: File created in workspace with generated content
  
- [ ] **Test 5**: Type: `"Create a TypeScript interface for user data"`
  - Expected: `.ts` file created with proper interface definition

### ✅ File Search
- [ ] **Test 6**: Type: `/search function`
  - Expected: List of all function definitions in workspace
  
- [ ] **Test 7**: Type: `/search TODO`
  - Expected: All TODO comments found across files

### ✅ Workspace Analysis
- [ ] **Test 8**: Type: `/workspace`
  - Expected: Project structure analysis and insights
  
- [ ] **Test 9**: Type: `"What type of project is this?"`
  - Expected: AI analysis of project type and technologies used

### ✅ Terminal Integration
- [ ] **Test 10**: Type: `/run npm --version`
  - Expected: Command executed in VS Code terminal, version displayed
  
- [ ] **Test 11**: Type: `/run ls -la`
  - Expected: Directory listing in VS Code terminal

### ✅ File Editing
- [ ] **Test 12**: Create a file, then type: `"Edit the test.js file to add error handling"`
  - Expected: File modified with improvements, diff shown for approval

## 🔧 Advanced Feature Testing

### Command Handler Integration
- [ ] **Test 13**: Type: `/files search package.json`
  - Expected: Specific file search results
  
- [ ] **Test 14**: Type: `/explain` (with a file selected)
  - Expected: Code explanation for selected file

### Error Handling
- [ ] **Test 15**: Try to create a file in a non-existent directory
  - Expected: Graceful error message with suggestions
  
- [ ] **Test 16**: Run an invalid terminal command
  - Expected: Error caught and user-friendly message

### Security Features
- [ ] **Test 17**: Try potentially dangerous commands
  - Expected: Commands blocked with security warning
  
- [ ] **Test 18**: Rapid-fire multiple requests
  - Expected: Rate limiting kicks in appropriately

## 🎯 User Experience Testing

### Chat Interface
- [ ] **Test 19**: Long conversation with multiple file operations
  - Expected: Chat history maintained, context preserved
  
- [ ] **Test 20**: File upload with immediate follow-up questions
  - Expected: AI remembers uploaded file context

### Permission System
- [ ] **Test 21**: File creation triggers permission prompt
  - Expected: User approval required before file creation
  
- [ ] **Test 22**: Deny permission for file operation
  - Expected: Operation cancelled gracefully

## 🐛 Debug Information

### If Tests Fail, Check:

1. **VS Code Developer Tools** (`Ctrl+Shift+I`)
   - Look for console errors in webview
   - Check network requests to LM Studio

2. **Output Panel**
   - Select "LMS Copilot" from dropdown
   - Check for extension logs and errors

3. **Terminal Integration**
   - Verify VS Code terminal opens for `/run` commands
   - Check terminal output for errors

4. **File System Permissions**
   - Ensure workspace has write permissions
   - Check if VS Code workspace trust is enabled

### Common Issues & Solutions:

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| File upload not working | Missing drag handler | Check webview event listeners |
| Commands not recognized | Command router issue | Verify commandHandler.ts mappings |
| Terminal not opening | VS Code API issue | Check terminal API permissions |
| File creation fails | Permission or path issue | Verify workspace write access |
| AI not responding | LM Studio connection | Check LM Studio server status |

## 📊 Success Criteria

### ✅ Minimum Viable Product
- [ ] File drag & drop works
- [ ] Basic file creation works
- [ ] Search functionality works
- [ ] Terminal integration works
- [ ] No critical errors in console

### 🚀 Full Feature Set
- [ ] All 22 tests pass
- [ ] Smooth user experience
- [ ] Proper error handling
- [ ] Security features working
- [ ] Performance acceptable

## 🎉 Post-Testing

### If All Tests Pass:
1. **Document any edge cases found**
2. **Create usage examples for README**
3. **Consider additional features for next iteration**

### If Tests Fail:
1. **Note specific failing tests**
2. **Capture error messages and console logs**
3. **Prioritize fixes based on severity**

---

**Note**: This extension replicates GitHub Copilot functionality using LM Studio. All file operations use VS Code APIs and maintain security best practices.
