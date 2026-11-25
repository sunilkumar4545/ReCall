import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (name: string, slug: string) => void;
}

/**
 * NewCategoryModal
 * 
 * Prompts the user for a new category/topic and dynamically
 * generates a clean slug to append to the index.
 * Aesthetic: Koval SEO technical pill form.
 */
export const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
}) => {
  const [topicName, setTopicName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Auto-generate URL-friendly slug
  const slug = topicName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) {
      setError('Please enter a topic name.');
      return;
    }
    if (!slug) {
      setError('Please enter valid alphanumeric characters.');
      return;
    }

    onAddCategory(topicName.trim(), slug);
    setTopicName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-ground border-2 border-ink p-6 shadow-brutalist animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4">
          <div className="flex items-center gap-2">
            <span className="tech-pill-black text-[10px] px-2 py-0.5">
              NEW FIELD
            </span>
            <span className="font-mono text-xs text-ink uppercase tracking-wider font-semibold">
              INDEX NEW CATEGORY
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
        <form onSubmit={handleSubmit}>
          <div className="my-4">
            <label className="block font-mono text-xs text-ink uppercase tracking-wider font-semibold mb-2">
              Topic / Category Name:
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="e.g. System Design, Kafka, Redis..."
                value={topicName}
                onChange={(e) => {
                  setTopicName(e.target.value);
                  setError('');
                }}
                className="w-full bg-ground border border-ink p-2.5 font-sans text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
            {error && (
              <p className="mt-1.5 font-mono text-[11px] text-red-600 font-medium">
                {error}
              </p>
            )}

            {/* Live Slug Preview */}
            <div className="mt-3 p-3 bg-light border border-ink-hairline flex items-center justify-between font-mono text-xs">
              <span className="text-ink-quiet">Generated Index Slug:</span>
              <span className="tech-pill-black text-[11px]">
                / {slug || 'your-topic'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-ink-hairline flex items-center justify-end gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              className="tech-pill px-4 py-2 hover:bg-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-ink text-ground px-4 py-2 font-semibold hover:bg-neutral-800 transition-colors border border-ink flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Index</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
