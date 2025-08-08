import { FileReference } from '../types/api';

// Enhanced file path detection patterns
const FILE_PATH_PATTERNS = [
  // Standard file paths
  /(?:^|[\s\(\[\{])([a-zA-Z]:)?[\/\\]?(?:[a-zA-Z0-9_\-\.]+[\/\\])*[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+(?:\:[0-9]+(?:\:[0-9]+)?)?(?=[\s\)\]\}\.\,\;]|$)/gm,
  
  // Relative paths
  /(?:^|[\s\(\[\{])\.{0,2}\/(?:[a-zA-Z0-9_\-\.]+\/)*[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+(?:\:[0-9]+(?:\:[0-9]+)?)?(?=[\s\)\]\}\.\,\;]|$)/gm,
  
  // Common workspace patterns (src/, dist/, node_modules/, etc.)
  /(?:^|[\s\(\[\{])(?:src|dist|lib|build|public|assets|components|utils|hooks|types|styles|tests?|__tests__|spec|\.vscode|node_modules|config|configs|scripts)\/(?:[a-zA-Z0-9_\-\.]+\/)*[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+(?:\:[0-9]+(?:\:[0-9]+)?)?(?=[\s\)\]\}\.\,\;]|$)/gm,
  
  // Markdown-style file links [filename](path)
  /\[([^\]]+)\]\(([^)]+\.[a-zA-Z0-9]+(?:\:[0-9]+(?:\:[0-9]+)?)?)\)/gm
];

// File extensions to include
const SUPPORTED_EXTENSIONS = new Set([
  // Code files
  'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte',
  'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'kt',
  'swift', 'dart', 'scala', 'clj', 'hs', 'elm', 'ml', 'fs', 'vb',
  
  // Web files
  'html', 'htm', 'css', 'scss', 'sass', 'less', 'stylus',
  
  // Config files
  'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
  'env', 'properties', 'plist',
  
  // Documentation
  'md', 'txt', 'rst', 'adoc', 'tex',
  
  // Data files
  'csv', 'tsv', 'sql',
  
  // Build/Package files
  'Dockerfile', 'Makefile', 'gradle', 'maven', 'sbt',
  'package', 'cargo', 'gemfile', 'requirements',
  
  // Other common extensions
  'gitignore', 'gitattributes', 'editorconfig', 'prettierrc',
  'eslintrc', 'babelrc', 'npmrc', 'yarnrc'
]);

/**
 * Extract file references from message content
 */
export function extractFileReferences(content: string): FileReference[] {
  const references: FileReference[] = [];
  const foundPaths = new Set<string>(); // Prevent duplicates

  // Try each pattern
  for (const pattern of FILE_PATH_PATTERNS) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(content)) !== null) {
      let filePath: string;
      
      // Handle markdown-style links differently
      if (match[0].includes('[') && match[0].includes('](')) {
        filePath = match[2]; // The path part of [text](path)
      } else {
        filePath = match[1] || match[0].trim();
      }
      
      // Clean up the path
      filePath = cleanFilePath(filePath);
      
      // Skip if already found or invalid
      if (foundPaths.has(filePath) || !isValidFilePath(filePath)) {
        continue;
      }
      
      foundPaths.add(filePath);
      
      // Parse line and column if present
      const { path, line, column } = parseLineAndColumn(filePath);
      
      references.push({
        path,
        line,
        column
      });
    }
  }

  return references;
}

/**
 * Clean and normalize file path
 */
function cleanFilePath(path: string): string {
  // Remove leading/trailing whitespace and common punctuation
  path = path.replace(/^[\s\(\[\{'"]+|[\s\)\]\}'"\.]+$/g, '');
  
  // Normalize path separators
  path = path.replace(/\\/g, '/');
  
  // Remove duplicate slashes
  path = path.replace(/\/+/g, '/');
  
  return path;
}

/**
 * Check if the path is a valid file path
 */
function isValidFilePath(path: string): boolean {
  // First remove line/column info to get just the file path
  const { path: cleanPath } = parseLineAndColumn(path);
  
  // Must have an extension or be a known file without extension
  const lastPart = cleanPath.split('/').pop() || '';
  const hasExtension = lastPart.includes('.') && !lastPart.endsWith('.');
  
  if (hasExtension) {
    const extension = lastPart.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_EXTENSIONS.has(extension);
  }
  
  // Check for known files without extensions
  const knownFiles = [
    'Dockerfile', 'Makefile', 'Gemfile', 'Rakefile', 'Vagrantfile',
    'Procfile', 'LICENSE', 'README', 'CHANGELOG', 'CONTRIBUTING'
  ];
  
  return knownFiles.some(known => lastPart.toLowerCase().includes(known.toLowerCase()));
}

/**
 * Parse line and column numbers from file path
 */
function parseLineAndColumn(filePath: string): { path: string; line?: number; column?: number } {
  const lineColumnMatch = filePath.match(/^(.+?):(\d+)(?::(\d+))?$/);
  
  if (lineColumnMatch) {
    return {
      path: lineColumnMatch[1],
      line: parseInt(lineColumnMatch[2], 10),
      column: lineColumnMatch[3] ? parseInt(lineColumnMatch[3], 10) : undefined
    };
  }
  
  return { path: filePath };
}

/**
 * Replace file references in content with clickable components
 * Returns JSX-like structure for React rendering
 */
export function replaceFileReferencesInContent(
  content: string,
  onOpenFile?: (filePath: string, lineNumber?: number) => void,
  onPreviewFile?: (filePath: string) => Promise<string>
): { content: string; references: FileReference[] } {
  const references = extractFileReferences(content);
  
  if (references.length === 0) {
    return { content, references: [] };
  }
  
  let processedContent = content;
  
  // Sort references by position (longest first to avoid partial replacements)
  const sortedRefs = references.sort((a, b) => {
    const aFull = a.line ? `${a.path}:${a.line}` : a.path;
    const bFull = b.line ? `${b.path}:${b.line}` : b.path;
    return bFull.length - aFull.length;
  });
  
  // Replace each file reference with a placeholder for React component
  sortedRefs.forEach((ref, index) => {
    const fullPath = ref.line ? `${ref.path}:${ref.line}` : ref.path;
    const placeholder = `__FILE_REF_${index}__`;
    
    // Escape special regex characters
    const escapedPath = fullPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedPath}\\b`, 'g');
    
    processedContent = processedContent.replace(regex, placeholder);
  });
  
  return { content: processedContent, references };
}

/**
 * Check if content contains file references
 */
export function hasFileReferences(content: string): boolean {
  return extractFileReferences(content).length > 0;
}

/**
 * Get file type category for grouping
 */
export function getFileCategory(filePath: string): 'code' | 'config' | 'doc' | 'data' | 'other' {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs'];
  const configExtensions = ['json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'];
  const docExtensions = ['md', 'txt', 'rst', 'adoc'];
  const dataExtensions = ['csv', 'tsv', 'sql'];
  
  if (codeExtensions.includes(extension)) return 'code';
  if (configExtensions.includes(extension)) return 'config';
  if (docExtensions.includes(extension)) return 'doc';
  if (dataExtensions.includes(extension)) return 'data';
  
  return 'other';
}

/**
 * Format file path for display (truncate long paths)
 */
export function formatDisplayPath(filePath: string, maxLength: number = 50): string {
  if (filePath.length <= maxLength) {
    return filePath;
  }
  
  const parts = filePath.split('/');
  if (parts.length <= 2) {
    return filePath;
  }
  
  const fileName = parts[parts.length - 1];
  const firstPart = parts[0];
  
  if (fileName.length + firstPart.length + 5 <= maxLength) {
    return `${firstPart}/.../${fileName}`;
  }
  
  return `.../${fileName}`;
}
