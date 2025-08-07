// React component for lazy-loaded syntax highlighting
import React from 'react';
import { highlightCode } from '../utils/prismLoader';

const PrismHighlighter: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [highlightedCode, setHighlightedCode] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const highlight = async () => {
      try {
        const highlighted = await highlightCode(code, language);
        if (isMounted) {
          setHighlightedCode(highlighted);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setHighlightedCode(code);
          setIsLoading(false);
        }
      }
    };

    highlight();

    return () => {
      isMounted = false;
    };
  }, [code, language]);

  if (isLoading) {
    return (
      <div className="code-loading">
        <span className="loading-spinner">⏳</span>
        Loading syntax highlighting...
      </div>
    );
  }

  return (
    <pre className={`language-${language}`}>
      <code 
        className={`language-${language}`}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );
};

export default PrismHighlighter;
