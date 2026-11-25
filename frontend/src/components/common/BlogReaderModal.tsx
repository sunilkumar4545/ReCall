import React from 'react';
import { X, Video, FileText, Trash2, ArrowUpRight } from 'lucide-react';
import { RecallEntry } from '@/types';
import { CodeBox } from './CodeBox';

interface BlogReaderModalProps {
  entry: RecallEntry | null;
  onClose: () => void;
  onDeleteRequest: (entry: RecallEntry) => void;
}

/**
 * BlogReaderModal
 * 
 * Clean editorial blog reader view inspired by Koval SEO Console:
 * - High-contrast editorial typography
 * - Formatted code box with one-click Copy button
 * - Embedded responsive YouTube player
 * - Image & PDF viewer links
 * - Cross [ × ] and Delete action triggers confirmation modal
 */
export const BlogReaderModal: React.FC<BlogReaderModalProps> = ({
  entry,
  onClose,
  onDeleteRequest,
}) => {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-ground border-2 border-ink p-6 sm:p-10 shadow-brutalist my-8 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-ink-hairline mb-6 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="tech-pill-black text-[11px]">
              / {entry.categoryId}
            </span>
            <span className="text-ink-quiet">{entry.readTime}</span>
            {entry.savingsPercentage && (
              <span
                className="tech-pill text-[10px] text-ink font-mono"
                title="Claim-Check: Compressed via Java GZIP to save Neon DB quota"
              >
                gz: -{entry.savingsPercentage}% neon storage saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteRequest(entry)}
              className="tech-pill hover:bg-red-50 hover:border-red-600 hover:text-red-600 text-[11px] text-ink-quiet flex items-center gap-1"
              title="Delete this block"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Article Title & Summary */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight font-sans leading-tight">
          {entry.title}
        </h1>

        <p className="mt-4 text-sm sm:text-base text-ink-body font-sans leading-relaxed border-l-2 border-ink pl-4 italic">
          {entry.summary}
        </p>

        {/* Concept Image (if present) */}
        {entry.imageUrl && (
          <div className="my-6 border border-ink overflow-hidden bg-light">
            <img
              src={entry.imageUrl}
              alt={entry.title}
              className="w-full max-h-80 object-cover"
              onError={(e) => {
                // Hide broken images cleanly
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Detailed Explanation */}
        <div className="my-6 pt-4 border-t border-ink-hairline text-ink-body font-sans text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
          {entry.explanation}
        </div>

        {/* VS Code Syntax-Highlighted Code Box */}
        {entry.codeSnippet && (
          <CodeBox
            code={entry.codeSnippet}
            language={entry.codeLanguage || 'java'}
            filename={`${entry.categoryId}.${entry.codeLanguage || 'java'}`}
          />
        )}

        {/* YouTube Embedded Video (if present) */}
        {entry.youtubeEmbedUrl && (
          <div className="my-6">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase font-semibold text-ink mb-2">
              <Video className="w-3.5 h-3.5" />
              <span>Video Walkthrough</span>
            </div>
            <div className="aspect-video w-full border-2 border-ink bg-black">
              <iframe
                src={entry.youtubeEmbedUrl}
                title={entry.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* PDF Document Attachment (if present) */}
        {entry.pdfUrl && (
          <div className="my-6 p-4 border border-ink bg-light flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-ink" />
              <span className="font-semibold text-ink">{entry.pdfName || 'Attached Reference Document.pdf'}</span>
            </div>
            <a
              href={entry.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tech-pill-black flex items-center gap-1 text-[11px]"
            >
              <span>View PDF</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-8 pt-4 border-t border-ink-hairline flex items-center justify-between font-mono text-[11px] text-ink-quiet">
          <span>Source: {entry.source || 'memory://entry'}</span>
          <button
            onClick={onClose}
            className="tech-pill hover:bg-ink hover:text-ground"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};
