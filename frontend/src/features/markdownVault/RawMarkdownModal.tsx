import React, { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { LocalMarkdownNote } from './markdownParser';

interface RawMarkdownModalProps {
  note: LocalMarkdownNote | null;
  onClose: () => void;
}

export const RawMarkdownModal: React.FC<RawMarkdownModalProps> = ({ note, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!note) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(note.rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([note.rawContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = note.filename || `${note.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-ground border-2 border-ink p-6 sm:p-8 shadow-brutalist max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="tech-pill-black text-[11px]">RAW .MD FILE</span>
            <span className="text-ink-quiet text-[11px] truncate max-w-sm">
              frontend/src/content/notes/{note.relativePath}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="tech-pill hover:bg-ink hover:text-ground text-[11px] flex items-center gap-1 font-semibold"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={handleCopy}
              className="tech-pill hover:bg-ink hover:text-ground text-[11px] flex items-center gap-1 font-semibold"
              title="Copy raw markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-4 bg-neutral-900 text-neutral-100 font-mono text-xs leading-relaxed border border-ink rounded-xs">
          <pre className="whitespace-pre-wrap">{note.rawContent}</pre>
        </div>
      </div>
    </div>
  );
};
