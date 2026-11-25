import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Building2,
  MapPin,
  Clock,
  Radio,
} from 'lucide-react';
import { JobNotification } from '@/types';

interface JobDetailModalProps {
  job: JobNotification | null;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!job) return null;

  const cleanUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '#';
    let url = rawUrl.trim();
    if (url.startsWith('ttps://')) url = 'h' + url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const match = url.match(/https?:\/\/[^\s]+/);
      if (match) return match[0];
      url = 'https://' + url.replace(/^[^a-zA-Z0-9]+/, '');
    }
    return url;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanUrl(job.applyUrl));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimeAgo = (isoDate?: string) => {
    if (!isoDate) return 'recent';
    const now = new Date();
    const posted = new Date(isoDate);
    const diffSec = Math.floor((now.getTime() - posted.getTime()) / 1000);
    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  };

  const targetUrl = cleanUrl(job.applyUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-ground border-2 border-ink shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-ink">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-[10px]">
              <span className="flex items-center gap-1 font-bold bg-green-600 text-white px-2 py-0.5 uppercase">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>Verified Job Post</span>
              </span>
              <span className="tech-pill text-[10px] text-ink-quiet">
                via {job.channelTitle || 'Telegram Channel'}
              </span>
              <span className="text-ink-quiet flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {formatTimeAgo(job.postedAt)}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight font-sans">
              {job.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-ink bg-ground hover:bg-ink hover:text-ground transition-colors shrink-0"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Company & Meta info strip */}
        <div className="flex flex-wrap items-center gap-4 py-3 border-b border-ink-hairline font-mono text-xs">
          {job.company && (
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <Building2 className="w-4 h-4 text-ink-quiet" />
              <span>{job.company}</span>
            </div>
          )}
          {job.location && (
            <div className="flex items-center gap-1.5 text-ink-quiet">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
          )}
        </div>

        {/* Scrollable Description Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4 font-sans text-xs sm:text-sm text-ink leading-relaxed">
          <div className="font-mono text-[11px] font-bold text-ink-quiet uppercase tracking-wider">
            Job Details & Description:
          </div>
          <div className="bg-light/40 border border-ink p-4 font-sans text-ink leading-relaxed whitespace-pre-wrap select-text">
            {job.description || 'No additional summary provided. Click Apply below to view full requirements.'}
          </div>

          {/* Application link preview */}
          <div className="border border-ink-hairline p-3 bg-ground font-mono text-[11px] flex items-center justify-between gap-3">
            <div className="truncate text-ink-quiet">
              <span className="text-ink font-semibold mr-1">Direct Target:</span>
              <span className="underline">{targetUrl}</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-4 border-t-2 border-ink flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="tech-pill flex items-center justify-center gap-1.5 font-mono text-xs py-2 px-4 w-full sm:w-auto hover:bg-ink hover:text-ground transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Apply Link</span>
              </>
            )}
          </button>

          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ink text-ground font-mono text-xs font-bold py-2.5 px-6 border-2 border-ink hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-xs"
          >
            <span>APPLY ON OFFICIAL PORTAL</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
