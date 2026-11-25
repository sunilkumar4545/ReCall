import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseMarkdownNote } from './markdownParser';

interface UploadMarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, category?: string) => Promise<void>;
  existingCategories?: string[];
}

export const UploadMarkdownModal: React.FC<UploadMarkdownModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  existingCategories = ['java', 'system-design', 'react', 'spring'],
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any | null>(null);
  const [category, setCategory] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.md')) {
      setErrorMsg('Please select a valid Markdown (.md) file.');
      return;
    }

    setSelectedFile(file);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseMarkdownNote(text, file.name);
        setParsedPreview(parsed);
        if (parsed.category) {
          setCategory(parsed.category);
        }
      } catch (err: any) {
        console.warn('Could not parse frontmatter preview:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      await onUpload(selectedFile, category.trim() || undefined);
      onClose();
      setSelectedFile(null);
      setParsedPreview(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to upload markdown file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-ground border-2 border-ink p-6 sm:p-8 shadow-brutalist animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ink-hairline mb-6 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="tech-pill-black text-[11px]">[ ⬆ UPLOAD .MD FILE ]</span>
            <span className="text-ink-quiet">Direct Git Repo Storage (Zero-DB)</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 border border-red-500 bg-red-50 text-red-700 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-ink p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-light hover:bg-neutral-100 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <Upload className="w-8 h-8 text-ink mb-2" />
            <span className="font-bold text-ink uppercase text-[11px]">
              {selectedFile ? selectedFile.name : 'Click to Browse or Drag & Drop .md File'}
            </span>
            <span className="text-ink-quiet text-[10px] mt-1">
              Supports YAML frontmatter with title, category, summary, and code blocks
            </span>
          </div>

          {/* Parsed Live Preview */}
          {parsedPreview && (
            <div className="p-4 border border-ink bg-ground space-y-2">
              <div className="flex items-center gap-1.5 text-green-700 font-bold text-[11px]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Frontmatter Extracted Successfully</span>
              </div>
              <div className="text-ink text-sm font-bold font-sans">
                {parsedPreview.title}
              </div>
              {parsedPreview.summary && (
                <div className="text-ink-body text-xs font-sans italic border-l-2 border-ink pl-2">
                  {parsedPreview.summary}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                <span className="tech-pill-black">cat: {category || parsedPreview.category}</span>
                <span className="tech-pill">lang: {parsedPreview.codeLanguage}</span>
                <span className="tech-pill">{parsedPreview.readTime}</span>
              </div>
            </div>
          )}

          {/* Category Override */}
          <div>
            <label className="block text-ink font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Folder / Category (Optional override)
            </label>
            <input
              type="text"
              list="category-suggestions"
              placeholder="e.g., java, system-design, react"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-ground border border-ink px-3 py-2 text-ink focus:outline-hidden"
            />
            <datalist id="category-suggestions">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-ink-hairline flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="tech-pill hover:bg-neutral-100 px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="bg-ink text-ground hover:bg-neutral-800 disabled:opacity-50 px-5 py-2 font-bold text-xs border border-ink flex items-center gap-1.5 shadow-brutalist transition-transform active:translate-y-0.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Saving to Repo...' : 'SAVE TO REPO FOLDER'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
