import React, { useState, useEffect } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import Prism from 'prismjs';

// Load extra language grammars into Prism
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';

import { Copy, Check, Code } from 'lucide-react';

interface CodeBoxProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

// Map user/stored language keys to standard Prism language grammar keys
const normalizeLanguage = (lang?: string): string => {
  if (!lang) return 'java';
  const lower = lang.toLowerCase().trim();
  switch (lower) {
    case 'java':
      return 'java';
    case 'typescript':
    case 'ts':
      return 'typescript';
    case 'javascript':
    case 'js':
      return 'javascript';
    case 'python':
    case 'py':
      return 'python';
    case 'sql':
    case 'mysql':
    case 'postgresql':
    case 'postgres':
      return 'sql';
    case 'bash':
    case 'shell':
    case 'sh':
      return 'bash';
    case 'docker':
    case 'dockerfile':
      return 'docker';
    case 'json':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return 'clike';
  }
};

/**
 * CodeBox
 * 
 * VS Code-grade Syntax Highlighted Code Viewer
 * - Exact VS Code color tokens (keywords, methods, types, strings, comments)
 * - Automatically adapts between VS Code Dark+ and VS Code Light+
 * - Top tab with editor dots (red, yellow, green) and language pill
 * - One-click Copy Code with animated feedback
 * - Clear line numbers with non-selectable gutter
 */
export const CodeBox: React.FC<CodeBoxProps> = ({
  code,
  language = 'java',
  filename,
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cleanCode = code ? code.trim() : '';
  const langKey = normalizeLanguage(language);

  // VS Code styling: dark editor #1e1e1e, light editor #f8f9fa
  const editorBg = isDark ? '#1e1e1e' : '#f8f9fa';
  const headerBg = isDark ? '#252526' : '#ededeb';
  const headerBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(17, 17, 16, 0.2)';
  const gutterColor = isDark ? '#858585' : '#a0a09e';

  return (
    <div className="my-6 border-2 border-ink shadow-brutalist-sm overflow-hidden font-mono text-xs sm:text-sm">
      {/* VS Code Window Header Bar */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 py-2 border-b select-none"
        style={{ backgroundColor: headerBg, borderColor: headerBorder }}
      >
        {/* Left: VS Code Window Controls & File Tab */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block" />
          </div>

          <div className="flex items-center gap-1.5 pl-2 font-mono text-xs font-semibold text-ink">
            <Code className="w-3.5 h-3.5 text-ink-quiet" />
            <span>{filename || `${language.toLowerCase()}-snippet`}</span>
          </div>
        </div>

        {/* Right: Language Pill & Copy Action */}
        <div className="flex items-center gap-2">
          <span className="tech-pill text-[10px] uppercase font-bold py-0.5 px-2">
            {language}
          </span>

          <button
            onClick={handleCopy}
            className="tech-pill flex items-center gap-1.5 text-[11px] hover:bg-ink hover:text-ground transition-all"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-green-600 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* VS Code Syntax-Highlighted Editor Canvas */}
      <Highlight
        prism={Prism}
        code={cleanCode}
        language={langKey}
        theme={isDark ? themes.vsDark : themes.vsLight}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} p-4 overflow-x-auto leading-relaxed m-0 text-left`}
            style={{
              ...style,
              backgroundColor: editorBg,
              fontFamily: "'Space Mono', 'JetBrains Mono', Consolas, monospace",
            }}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i });
              return (
                <div key={i} {...lineProps} className="table-row">
                  {showLineNumbers && (
                    <span
                      className="table-cell select-none pr-4 text-right opacity-50 font-mono text-[11px]"
                      style={{ color: gutterColor, minWidth: '2.5rem' }}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span className="table-cell">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </span>
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
};
