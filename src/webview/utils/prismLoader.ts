// Lazy Prism loader for performance optimization
import React from 'react';

// Dynamic imports for Prism components to reduce initial bundle size
export const loadPrismLanguage = async (language: string): Promise<void> => {
  try {
    switch (language.toLowerCase()) {
      case 'typescript':
      case 'ts':
        await import('prismjs/components/prism-typescript');
        break;
      case 'javascript':
      case 'js':
        await import('prismjs/components/prism-javascript');
        break;
      case 'python':
      case 'py':
        await import('prismjs/components/prism-python');
        break;
      case 'jsx':
        await import('prismjs/components/prism-jsx');
        break;
      case 'tsx':
        await import('prismjs/components/prism-tsx');
        break;
      case 'json':
        await import('prismjs/components/prism-json');
        break;
      case 'css':
        await import('prismjs/components/prism-css');
        break;
      case 'scss':
        await import('prismjs/components/prism-scss');
        break;
      case 'markdown':
      case 'md':
        await import('prismjs/components/prism-markdown');
        break;
      case 'bash':
      case 'shell':
        await import('prismjs/components/prism-bash');
        break;
      case 'sql':
        await import('prismjs/components/prism-sql');
        break;
      case 'yaml':
      case 'yml':
        await import('prismjs/components/prism-yaml');
        break;
      default:
        // Fallback to basic highlighting
        break;
    }
  } catch (error) {
    console.warn(`Failed to load Prism language support for ${language}:`, error);
  }
};

// Lazy load Prism core
export const loadPrismCore = async () => {
  const Prism = await import('prismjs');
  await import('prismjs/themes/prism.css');
  return Prism.default;
};

// Highlight code with lazy-loaded Prism
export const highlightCode = async (code: string, language: string): Promise<string> => {
  try {
    const Prism = await loadPrismCore();
    await loadPrismLanguage(language);
    
    const grammar = Prism.languages[language.toLowerCase()];
    if (grammar) {
      return Prism.highlight(code, grammar, language);
    } else {
      // Return code with basic HTML escaping if no grammar found
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  } catch (error) {
    console.warn('Prism highlighting failed:', error);
    // Return escaped code as fallback
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};
