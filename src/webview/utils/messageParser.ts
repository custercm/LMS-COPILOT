import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Simple markdown parser for code blocks and formatting
export function parseMessageContent(content: string): string {
  try {
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