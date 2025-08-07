import {
  parseMessageContent,
  extractCodeBlocks,
  hasCodeBlocks,
  extractFilePaths,
  createTestMarkdownContent,
  validateCodeBlockExtraction
} from '../../../webview/utils/messageParser';

describe('messageParser', () => {
  describe('parseMessageContent', () => {
    it('should parse markdown content correctly', () => {
      const markdown = '# Title\n\nThis is **bold** text';
      const result = parseMessageContent(markdown);
      
      expect(result).toContain('Title');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should handle empty content', () => {
      const result = parseMessageContent('');
      expect(result).toBe('');
    });

    it('should handle invalid markdown gracefully', () => {
      const invalidMarkdown = '# Title\n\n[broken link](';
      const result = parseMessageContent(invalidMarkdown);
      
      // Should not throw and return some content
      expect(typeof result).toBe('string');
    });
  });

  describe('extractCodeBlocks', () => {
    it('should extract code blocks with language', () => {
      const content = '```typescript\nconst x = 1;\n```';
      const blocks = extractCodeBlocks(content);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].language).toBe('typescript');
      expect(blocks[0].code).toBe('const x = 1;');
    });

    it('should extract code blocks without language', () => {
      const content = '```\nconst x = 1;\n```';
      const blocks = extractCodeBlocks(content);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].language).toBe('text');
      expect(blocks[0].code).toBe('const x = 1;');
    });

    it('should extract multiple code blocks', () => {
      const content = '```js\ncode1\n```\n\nSome text\n\n```python\ncode2\n```';
      const blocks = extractCodeBlocks(content);
      
      expect(blocks).toHaveLength(2);
      expect(blocks[0].language).toBe('js');
      expect(blocks[1].language).toBe('python');
    });

    it('should return empty array when no code blocks exist', () => {
      const content = 'Just plain text';
      const blocks = extractCodeBlocks(content);
      
      expect(blocks).toHaveLength(0);
    });
  });

  describe('hasCodeBlocks', () => {
    it('should return true when content has code blocks', () => {
      const content = 'Text with ```code``` blocks';
      expect(hasCodeBlocks(content)).toBe(true);
    });

    it('should return false when content has no code blocks', () => {
      const content = 'Just plain text';
      expect(hasCodeBlocks(content)).toBe(false);
    });

    it('should handle multiline code blocks', () => {
      const content = 'Text with\n```\nmultiline\ncode\n```\nblocks';
      expect(hasCodeBlocks(content)).toBe(true);
    });
  });

  describe('extractFilePaths', () => {
    it('should extract file paths from content', () => {
      const content = 'Check the file src/components/App.tsx for details';
      const paths = extractFilePaths(content);
      
      expect(paths).toContain('src/components/App.tsx');
    });

    it('should extract multiple file paths', () => {
      const content = 'Files: src/index.ts and test/utils.spec.ts';
      const paths = extractFilePaths(content);
      
      expect(paths.length).toBeGreaterThan(0);
    });

    it('should return empty array when no paths exist', () => {
      const content = 'No file paths here';
      const paths = extractFilePaths(content);
      
      expect(paths).toHaveLength(0);
    });
  });

  describe('test helpers', () => {
    it('should create valid test markdown content', () => {
      const content = createTestMarkdownContent();
      
      expect(content).toContain('# Test Content');
      expect(content).toContain('```typescript');
      expect(content).toContain('**bold text**');
    });

    it('should validate code block extraction', () => {
      const contentWithCode = 'Text with ```code``` block';
      const contentWithoutCode = 'Text without code';
      
      expect(validateCodeBlockExtraction(contentWithCode)).toBe(true);
      expect(validateCodeBlockExtraction(contentWithoutCode)).toBe(false);
    });
  });
});
