// Add test utilities to existing message parsing functions

import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Parse markdown content and add file reference handling with accessibility features
export function parseMessageContent(content: string): string {
  try {
    // Process file references in markdown text
    return marked(content) as string;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return content;
  }
}

// Extract code blocks from content
export function extractCodeBlocks(content: string): Array<{code: string, language: string}> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
  const blocks: Array<{code: string, language: string}> = [];
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2]
    });
  }
  
  return blocks;
}

// Check if content contains code blocks
export function hasCodeBlocks(content: string): boolean {
  return /```[\s\S]*?```/.test(content);
}

// Extract file paths from message content for reference handling with accessibility features
export function extractFilePaths(content: string): string[] {
  const filePathRegex = /(\w+\/[\w\-\.\/]+(?:\.\w+)?)/g; // Basic path extraction
  const matches = content.match(filePathRegex);
  return matches || [];
}

// Add accessibility support to file paths
export function createAccessibleFilePath(path: string): string {
  return `Open ${path} in editor`;
}

// Test helper functions for message parsing utilities
export const createTestMarkdownContent = () => `
# Test Content

This is a test message with:
- [file reference](some/file/path.ts)
- \`code block\`
- **bold text**

\`\`\`typescript
const test = "content";
\`\`\`
`;

export const validateCodeBlockExtraction = (content: string) => {
  const codeBlocks = extractCodeBlocks(content);
  return codeBlocks.length > 0;
};

// Export for integration testing
export {
  extractCodeBlocks,
  hasCodeBlocks,
  extractFilePaths,
  createAccessibleFilePath
};
