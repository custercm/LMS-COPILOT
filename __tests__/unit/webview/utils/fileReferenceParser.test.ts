import { 
  extractFileReferences, 
  hasFileReferences, 
  getFileCategory, 
  formatDisplayPath 
} from '../../../../src/webview/utils/fileReferenceParser';

describe('fileReferenceParser', () => {
  describe('extractFileReferences', () => {
    it('extracts basic file paths', () => {
      const content = 'Check out the file src/components/Example.tsx for the implementation.';
      const references = extractFileReferences(content);
      
      expect(references).toHaveLength(1);
      expect(references[0]).toEqual({
        path: 'src/components/Example.tsx'
      });
    });

    it('extracts file paths with line numbers', () => {
      const content = 'Error at src/utils/parser.ts:42 needs fixing.';
      const references = extractFileReferences(content);
      
      expect(references).toHaveLength(1);
      expect(references[0]).toEqual({
        path: 'src/utils/parser.ts',
        line: 42
      });
    });

    it('extracts file paths with line and column numbers', () => {
      const content = 'The issue is in config/webpack.js:28:15 where the loader is defined.';
      const references = extractFileReferences(content);
      
      expect(references).toHaveLength(1);
      expect(references[0]).toEqual({
        path: 'config/webpack.js',
        line: 28,
        column: 15
      });
    });

    it('extracts multiple file references', () => {
      const content = `
        The main component is in src/App.tsx and the styles are in styles/main.css.
        Also check package.json for dependencies.
      `;
      const references = extractFileReferences(content);
      
      expect(references).toHaveLength(3);
      expect(references[0].path).toBe('src/App.tsx');
      expect(references[1].path).toBe('styles/main.css');
      expect(references[2].path).toBe('package.json');
    });

    it('extracts markdown-style file links', () => {
      const content = 'See [the configuration file](config/settings.json) for options.';
      const references = extractFileReferences(content);
      
      expect(references).toHaveLength(1);
      expect(references[0].path).toBe('config/settings.json');
    });

    it('handles relative paths', () => {
      const content = 'Import from ./utils/helper.js and ../shared/constants.ts';
      const references = extractFileReferences(content);
      
      expect(references).toHaveLength(2);
      expect(references[0].path).toBe('./utils/helper.js');
      expect(references[1].path).toBe('../shared/constants.ts');
    });

    it('ignores unsupported file extensions', () => {
      const content = 'Check image.png and video.mp4 files.';
      const references = extractFileReferences(content);
      
      expect(references).toHaveLength(0);
    });

    it('removes duplicates', () => {
      const content = 'File src/test.js appears twice. Yes, src/test.js is mentioned again.';
      const references = extractFileReferences(content);
      
      expect(references).toHaveLength(1);
      expect(references[0].path).toBe('src/test.js');
    });
  });

  describe('hasFileReferences', () => {
    it('returns true when file references exist', () => {
      const content = 'Check the file src/component.tsx';
      expect(hasFileReferences(content)).toBe(true);
    });

    it('returns false when no file references exist', () => {
      const content = 'This is just regular text without any file paths.';
      expect(hasFileReferences(content)).toBe(false);
    });
  });

  describe('getFileCategory', () => {
    it('categorizes code files correctly', () => {
      expect(getFileCategory('src/component.tsx')).toBe('code');
      expect(getFileCategory('utils/helper.js')).toBe('code');
      expect(getFileCategory('app.py')).toBe('code');
    });

    it('categorizes config files correctly', () => {
      expect(getFileCategory('package.json')).toBe('config');
      expect(getFileCategory('config.yaml')).toBe('config');
      expect(getFileCategory('settings.xml')).toBe('config');
    });

    it('categorizes documentation files correctly', () => {
      expect(getFileCategory('README.md')).toBe('doc');
      expect(getFileCategory('docs/guide.txt')).toBe('doc');
    });

    it('categorizes data files correctly', () => {
      expect(getFileCategory('data.csv')).toBe('data');
      expect(getFileCategory('query.sql')).toBe('data');
    });

    it('categorizes unknown files as other', () => {
      expect(getFileCategory('unknown.xyz')).toBe('other');
      expect(getFileCategory('file')).toBe('other');
    });
  });

  describe('formatDisplayPath', () => {
    it('returns short paths unchanged', () => {
      const path = 'src/app.tsx';
      expect(formatDisplayPath(path, 50)).toBe(path);
    });

    it('truncates long paths with ellipsis', () => {
      const path = 'src/very/deep/nested/folder/structure/component.tsx';
      const result = formatDisplayPath(path, 30);
      
      expect(result).toContain('...');
      expect(result).toContain('component.tsx');
      expect(result.length).toBeLessThanOrEqual(35); // Some buffer for ellipsis
    });

    it('preserves filename for very long paths', () => {
      const path = 'extremely/deep/nested/folder/structure/with/many/levels/file.js';
      const result = formatDisplayPath(path, 20);
      
      expect(result).toContain('file.js');
      expect(result).toContain('...');
    });

    it('handles paths with few segments gracefully', () => {
      const path = 'folder/file.txt';
      const result = formatDisplayPath(path, 10);
      
      // Should return original if can't be meaningfully truncated
      expect(result).toBe(path);
    });
  });
});
