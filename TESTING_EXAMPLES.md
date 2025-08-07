# Example AI Responses for Testing

## Test Case 1: "create a hello world JavaScript file"

**Expected AI Response:**
```
I'll create a hello world JavaScript file for you:

```json
{
  "action": "create_file",
  "params": {
    "path": "hello.js",
    "content": "console.log('Hello, World!');\n\n// This is a simple hello world program\nfunction sayHello() {\n    return 'Hello, World!';\n}\n\nsayHello();",
    "description": "A simple hello world JavaScript file"
  }
}
```

This creates a basic JavaScript file with a hello world message and a simple function. You can run it with `node hello.js` to see the output.
```

**What Extension Does:**
1. Parses the JSON command
2. Creates `hello.js` in workspace with the specified content  
3. Shows: "✅ Action completed: Created file: hello.js" + explanation text

## Test Case 2: "create a React component called Button" 

**Expected AI Response:**
```
I'll create a React Button component for you:

```json
{
  "action": "create_file", 
  "params": {
    "path": "src/components/Button.jsx",
    "content": "import React from 'react';\nimport './Button.css';\n\nconst Button = ({ children, onClick, variant = 'primary', disabled = false }) => {\n  return (\n    <button \n      className={`btn btn-${variant}`}\n      onClick={onClick}\n      disabled={disabled}\n    >\n      {children}\n    </button>\n  );\n};\n\nexport default Button;",
    "description": "A reusable React Button component"
  }
}
```

This creates a flexible React Button component with props for customization. The component supports different variants, click handlers, and disabled states.
```

## Test Case 3: "edit package.json to add a test script"

**Expected AI Response:**
```
I'll edit your package.json to add a test script:

```json
{
  "action": "edit_file",
  "params": {
    "path": "package.json", 
    "content": "{\n  \"name\": \"my-app\",\n  \"version\": \"1.0.0\",\n  \"scripts\": {\n    \"start\": \"node index.js\",\n    \"test\": \"jest\",\n    \"test:watch\": \"jest --watch\"\n  },\n  \"dependencies\": {}\n}",
    "description": "Updated package.json with test scripts"
  }
}
```

I've added test scripts to your package.json. The "test" script runs Jest, and "test:watch" runs Jest in watch mode for development.
```

## Test Case 4: Regular Chat (No JSON)

**User:** "What is React?"
**Expected AI Response:**
```
React is a popular JavaScript library for building user interfaces, particularly web applications. It was developed by Facebook and is now maintained by Meta and the community.

Key features of React include:
- Component-based architecture
- Virtual DOM for efficient updates  
- Declarative programming style
- Strong ecosystem and community support

React is commonly used for creating interactive, dynamic web applications and is often paired with other tools like React Router for navigation and state management libraries like Redux.
```

**What Extension Does:**
- No JSON detected, so treats as regular chat
- Shows response normally in chat interface
- No file operations performed

## How to Test

1. **Compile the extension:** `npm run compile`
2. **Test in VS Code:** Press F5 to launch extension host
3. **Open chat panel:** Look for LMS Copilot in sidebar
4. **Try the test cases above**
5. **Check workspace:** Files should be created/edited
6. **Check console:** Look for debug logs starting with `[LMS Copilot]`

The key is that LM Studio should now return the JSON format due to the system prompt we added!
