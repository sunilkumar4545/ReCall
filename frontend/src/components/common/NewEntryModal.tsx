import React, { useState, useEffect } from 'react';
import { X, Code, Video, FileText, Image as ImageIcon } from 'lucide-react';
import { Category, RecallEntry } from '@/types';

interface NewEntryModalProps {
  isOpen: boolean;
  categories: Category[];
  activeCategory: string;
  onClose: () => void;
  onSubmit: (entry: Omit<RecallEntry, 'id' | 'createdAt'>) => void;
}

// Convert common YouTube URLs to standard embed URL
const convertToYouTubeEmbed = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  return trimmed;
};

/**
 * NewEntryModal
 * 
 * Input drawer/modal to capture new concept/code entries with:
 * - Category/Topic selection
 * - Title & Summary
 * - Detailed Explanation
 * - Code snippet & language selector
 * - Concept image, YouTube video URL, and PDF link
 */
export const NewEntryModal: React.FC<NewEntryModalProps> = ({
  isOpen,
  categories,
  activeCategory,
  onClose,
  onSubmit,
}) => {
  const [categoryId, setCategoryId] = useState<string>('java');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [explanation, setExplanation] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('java');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [error, setError] = useState('');

  // Sync selected category whenever modal opens or active category changes
  useEffect(() => {
    if (isOpen) {
      const targetSlug = activeCategory !== 'all' 
        ? activeCategory 
        : (categories.find(c => c.slug !== 'all')?.slug || 'java');
      setCategoryId(targetSlug);
    }
  }, [isOpen, activeCategory, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    const embedUrl = convertToYouTubeEmbed(youtubeUrl);

    onSubmit({
      categoryId,
      title: title.trim(),
      summary: summary.trim() || 'No summary provided.',
      explanation: explanation.trim() || summary.trim(),
      codeLanguage: codeLanguage.trim(),
      codeSnippet: codeSnippet.trim(),
      imageUrl: imageUrl.trim() || undefined,
      youtubeUrl: youtubeUrl.trim() || undefined,
      youtubeEmbedUrl: embedUrl || undefined,
      pdfUrl: pdfUrl.trim() || undefined,
      pdfName: pdfName.trim() || (pdfUrl ? 'document.pdf' : undefined),
      readTime: '3 min read',
      source: `doc://${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
    });

    // Reset form
    setTitle('');
    setSummary('');
    setExplanation('');
    setCodeSnippet('');
    setImageUrl('');
    setYoutubeUrl('');
    setPdfUrl('');
    setPdfName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-ground border-2 border-ink p-6 sm:p-8 shadow-brutalist my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-6">
          <div className="flex items-center gap-2">
            <span className="tech-pill-black text-[10px] px-2 py-0.5">
              NEW ENTRY
            </span>
            <span className="font-mono text-xs text-ink uppercase tracking-wider font-semibold">
              INDEX MEMORY LOG
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-xs text-ink uppercase tracking-wider font-semibold mb-1">
                Field / Category * <span className="text-ink-quiet font-normal lowercase">(e.g., dsa, backend, interview)</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-ground border border-ink p-2 font-mono text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                {categories.filter(c => c.slug !== 'all').map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    / {cat.slug}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono text-xs text-ink uppercase tracking-wider font-semibold mb-1">
                Entry Title *
              </label>
              <input
                type="text"
                placeholder="Topic title (e.g., Binary Search Edge Cases)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-ground border border-ink p-2 font-sans text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>

          {/* Row 2: Short Summary */}
          <div>
            <label className="block font-mono text-xs text-ink uppercase tracking-wider font-semibold mb-1">
              Short Description / Summary
            </label>
            <input
              type="text"
              placeholder="Write the key idea in your own words—short and clear."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-ground border border-ink p-2 font-sans text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          {/* Row 3: Detailed Explanation */}
          <div>
            <label className="block font-mono text-xs text-ink uppercase tracking-wider font-semibold mb-1">
              Detailed Concept Explanation (Blog Reader View)
            </label>
            <textarea
              rows={4}
              placeholder="Write the key idea in your own words—short and clear."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full bg-ground border border-ink p-2 font-sans text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          {/* Row 4: Code Block */}
          <div className="border border-ink p-3 bg-light/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-ink">
                <Code className="w-3.5 h-3.5" />
                <span>CODE SNIPPET</span>
              </div>
              <select
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="bg-ground border border-ink text-xs font-mono px-2 py-0.5 focus:outline-none"
              >
                <option value="java">Java</option>
                <option value="typescript">TypeScript</option>
                <option value="sql">SQL</option>
                <option value="python">Python</option>
                <option value="bash">Bash / Shell</option>
                <option value="dockerfile">Dockerfile</option>
              </select>
            </div>
            <textarea
              rows={3}
              placeholder="Paste the code snippet you want handy later."
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              className="w-full bg-ground border border-ink p-2 font-mono text-xs text-ink focus:outline-none"
            />
          </div>

          {/* Row 5: Media URLs (YouTube, Diagram, PDF) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div>
              <label className="flex items-center gap-1 text-ink uppercase font-semibold mb-1">
                <Video className="w-3 h-3" />
                <span>YouTube URL</span>
              </label>
              <input
                type="text"
                placeholder="Optional: paste a helpful video link"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full bg-ground border border-ink p-1.5 text-xs text-ink focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-ink uppercase font-semibold mb-1">
                <ImageIcon className="w-3 h-3" />
                <span>Image / Diagram URL</span>
              </label>
              <input
                type="text"
                placeholder="Optional: image or diagram URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-ground border border-ink p-1.5 text-xs text-ink focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-ink uppercase font-semibold mb-1">
                <FileText className="w-3 h-3" />
                <span>PDF Cheatsheet URL</span>
              </label>
              <input
                type="text"
                placeholder="Optional: paste a helpful video or PDF link"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                className="w-full bg-ground border border-ink p-1.5 text-xs text-ink focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="font-mono text-xs text-red-600 font-semibold">{error}</p>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-ink-hairline flex items-center justify-between font-mono text-xs">
            <span className="text-ink-quiet text-[11px]">
              No cloud fees. Stored cleanly in Recall.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="tech-pill px-4 py-2 hover:bg-light"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-ink text-ground px-5 py-2 font-semibold hover:bg-neutral-800 transition-colors border border-ink"
              >
                Save to Index
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
