import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteConfirmModal
 * 
 * Styled with the exact Koval SEO brutalist aesthetic:
 * - Sharp black borders (#111110)
 * - Pure white ground (#ffffff)
 * - Monospace tag badges
 * - Clear confirmation warning before deletion
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  itemTitle,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-ground border-2 border-ink p-6 shadow-brutalist animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4">
          <div className="flex items-center gap-2">
            <span className="tech-pill-black text-[10px] px-2 py-0.5">
              CONFIRMATION
            </span>
            <span className="font-mono text-xs text-ink uppercase tracking-wider font-semibold">
              DELETE MEMORY LOG
            </span>
          </div>
          <button
            onClick={onCancel}
            className="w-6 h-6 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="flex items-start gap-3 my-4">
          <div className="p-2 border border-ink bg-light">
            <AlertTriangle className="w-5 h-5 text-ink" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink tracking-tight font-sans">
              Are you sure you want to delete this block?
            </h4>
            <p className="mt-1 text-xs text-ink-body font-sans leading-relaxed">
              This will permanently erase <span className="font-semibold text-ink font-mono">"{itemTitle}"</span> from your memory index. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-ink-hairline flex items-center justify-end gap-2 font-mono text-xs">
          <button
            onClick={onCancel}
            className="tech-pill px-4 py-2 hover:bg-light"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-ink text-ground px-4 py-2 font-semibold hover:bg-neutral-800 transition-colors border border-ink"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};
