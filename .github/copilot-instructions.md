# LMS Copilot Extension Instructions

## Overview
This extension is a VS Code implementation that replicates GitHub Copilot's functionality using LM Studio as the backend AI engine.

## Key Features to Implement
1. Chat interface with exact theme matching
2. File operations through workspace APIs
3. Code completion capabilities  
4. Task execution orchestration
5. Streaming responses from LM Studio

## Implementation Details
- Use OpenAI-compatible `/v1/chat/completions` endpoint of LM Studio
- Match GitHub Copilot UI colors exactly:
  - Background: #1e1e1e (dark theme)
  - User bubbles: #0078d4
  - AI bubbles: #2d2d30
  - Text color: #cccccc
  - Border color: #3c3c3c
- Implement proper VS Code webview integration
- Handle conversation history management
- Support for model switching in settings

## Architecture
The extension follows a modular structure:
1. Extension entry point (extension.ts)
2. Chat provider managing the UI component
3. LM Studio client handling API communication
4. Tool system for file operations and workspace interaction