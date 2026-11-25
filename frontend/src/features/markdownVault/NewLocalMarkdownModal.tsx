import React, { useState } from 'react';
import { X, FileCode, Eye } from 'lucide-react';
import { CreateNotePayload } from '@/services/localNotesApi';
import { formatMarkdownNote } from './markdownParser';

interface NewLocalMarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateNotePayload) => Promise<void>;
  existingCategories?: string[];
}

const COMMON_LANGUAGES = [
  'java', 'typescript', 'javascript', 'python', 'sql', 'go',
  'rust', 'lua', 'bash', 'yaml', 'json', 'csharp', 'cpp'
];

export const NewLocalMarkdownModal: React.FC<NewLocalMarkdownModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingCategories = ['java', 'system-design', 'react', 'spring'],
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('java');
  const [customCategory, setCustomCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [readTime, setReadTime] = useState('3 min');
  const [codeLanguage, setCodeLanguage] = useState('java');
  const [explanation, setExplanation] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveCategory = category === 'custom' ? (customCategory.trim() || 'general') : category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Note title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSubmit({
        title: title.trim(),
        category: effectiveCategory,
        summary: summary.trim(),
        explanation: explanation.trim(),
        codeSnippet: codeSnippet.trim(),
        codeLanguage,
        readTime: readTime.trim() || '3 min',
        youtubeUrl: youtubeUrl.trim(),
      });
      onClose();
      // Reset form
      setTitle('');
      setSummary('');
      setExplanation('');
      setCodeSnippet('');
      setYoutubeUrl('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to save markdown note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewMarkdown = formatMarkdownNote({
    title,
    category: effectiveCategory,
    summary,
    explanation,
    codeSnippet,
    codeLanguage,
    readTime,
    youtubeUrl,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-ground border-2 border-ink p-6 sm:p-8 shadow-brutalist max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ink-hairline mb-6 font-mono">
          <div className="flex items-center gap-2">
            <span className="tech-pill-black text-xs">[ + LOCAL .MD NOTE ]</span>
            <span className="text-xs text-ink-quiet">Saves directly to frontend/src/content/notes/ (Zero-DB)</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 border border-red-500 bg-red-50 text-red-700 font-mono text-xs">
            {errorMsg}
          </div>
        )}

        {/* Tab switch between Form and Markdown Preview */}
        <div className="flex items-center gap-2 mb-6 font-mono text-xs border-b border-ink-hairline pb-3">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-3 py-1 border transition-all ${
              !showPreview ? 'bg-ink text-ground border-ink' : 'border-ink text-ink hover:bg-neutral-100'
            }`}
          >
            Form Editor
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1 border transition-all flex items-center gap-1 ${
              showPreview ? 'bg-ink text-ground border-ink' : 'border-ink text-ink hover:bg-neutral-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Markdown Preview</span>
          </button>
        </div>

        {showPreview ? (
          <div>
            <div className="p-4 bg-neutral-900 text-neutral-100 font-mono text-xs overflow-x-auto border border-ink rounded-xs max-h-96">
              <pre>{previewMarkdown}</pre>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="tech-pill hover:bg-ink hover:text-ground text-xs font-mono"
              >
                Back to Editing
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {/* Title & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-ink font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Note Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Spring @Transactional Propagation Modes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-ground border border-ink px-3 py-2 text-ink focus:outline-hidden focus:ring-1 focus:ring-ink"
                />
              </div>

              <div>
                <label className="block text-ink font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-ground border border-ink px-3 py-2 text-ink focus:outline-hidden"
                >
                  {Array.from(new Set([...existingCategories, 'java', 'system-design', 'react', 'spring', 'database'])).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="custom">+ Custom Category</option>
                </select>
              </div>
            </div>

            {category === 'custom' && (
              <div>
                <label className="block text-ink font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Custom Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., devops, security, kubernetes"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-ground border border-ink px-3 py-2 text-ink focus:outline-hidden"
                />
              </div>
            )}

            {/* Summary */}
            <div>
              <label className="block text-ink font-semibold mb-1 uppercase tracking-wider text-[11px]">
                Summary (One-liner frontmatter summary)
              </label>
              <textarea
                rows={2}
                placeholder="How REQUIRED, REQUIRES_NEW, and NESTED behave across Spring AOP proxies."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-ground border border-ink px-3 py-2 text-ink focus:outline-hidden font-sans"
              />
            </div>

            {/* Read Time & Code Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-ink font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Estimated Read Time
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4 min"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  className="w-full bg-ground border border-ink px-3 py-2 text-ink focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-ink font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Code Language
                </label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="w-full bg-ground border border-ink px-3 py-2 text-ink focus:outline-hidden"
                >
                  {COMMON_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Detailed Explanation */}
            <div>
              <label className="block text-ink font-semibold mb-1 uppercase tracking-wider text-[11px]">
                ## Explanation (Markdown Text)
              </label>
              <textarea
                rows={6}
                placeholder="Write detailed markdown explanation here..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full bg-ground border border-ink px-3 py-2 text-ink focus:outline-hidden font-sans text-xs leading-relaxed"
              />
            </div>

            {/* Code Snippet */}
            <div>
              <label className="block text-ink font-semibold mb-1 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>## Code (Snippet in {codeLanguage})</span>
                <span className="text-ink-quiet text-[10px]">auto-fenced with ```{codeLanguage}</span>
              </label>
              <textarea
                rows={5}
                placeholder={`@Transactional(propagation = Propagation.REQUIRES_NEW)\npublic void auditLog(String event) {\n    auditRepository.save(new AuditLog(event));\n}`}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className="w-full bg-neutral-900 text-neutral-100 font-mono text-xs p-3 border border-ink focus:outline-hidden rounded-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-ink-hairline flex items-center justify-between">
              <span className="text-[10px] text-ink-quiet">
                File will be created at: <code className="bg-light px-1 border border-ink-hairline">src/content/notes/{effectiveCategory}/{title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'slug'}.md</code>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="tech-pill hover:bg-neutral-100 px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-ink text-ground hover:bg-neutral-800 px-5 py-2 font-bold text-xs border border-ink flex items-center gap-1.5 shadow-brutalist transition-transform active:translate-y-0.5"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving to Disk...' : 'SAVE AS .MD FILE'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
