import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Database, Cloud, ShieldCheck, Trash2, Download } from 'lucide-react';
import { api, StorageStats, API_BASE_URL } from '../../services/api';

interface StorageQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageQuotaModal: React.FC<StorageQuotaModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStorageStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load storage telemetry:', err);
      setError('Could not fetch storage metrics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-ground border-2 border-ink p-6 sm:p-8 shadow-brutalist my-8 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between pb-4 border-b border-ink-hairline mb-6 font-mono text-xs">
          <div>
            <div className="text-[11px] text-ink-quiet tracking-wider uppercase mb-1">
              LIVE CLOUD TELEMETRY // STORAGE & QUOTAS
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight font-sans">
              Storage & Compression
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="tech-pill text-[11px] flex items-center gap-1.5 hover:bg-ink hover:text-ground transition-all"
              title="Refresh live storage metrics"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-red-500 bg-red-50 text-red-700 font-mono text-xs">
            {error}
          </div>
        )}

        {loading && !stats ? (
          <div className="py-16 text-center font-mono text-sm text-ink-quiet animate-pulse">
            Querying Neon PostgreSQL & Backblaze B2 storage allocations...
          </div>
        ) : stats ? (
          <div className="space-y-6">
            
            {/* Top Overview Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Neon PostgreSQL */}
              <div className="border border-ink p-5 bg-ground flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-ink">
                      <Database className="w-3.5 h-3.5" />
                      <span>NEON POSTGRESQL</span>
                    </div>
                    <span className="tech-pill text-[10px] bg-light">500 MB FREE</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between font-mono text-[11px] text-ink mb-1.5">
                      <span className="font-semibold">Used: {stats.neon.usedFormatted}</span>
                      <span className="text-ink-quiet">Limit: {stats.neon.limitFormatted}</span>
                    </div>
                    <div className="w-full bg-light h-3 border border-ink p-0.5">
                      <div
                        className="bg-ink h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(1, stats.neon.usagePercentage))}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-quiet">
                      <span>{stats.neon.usagePercentage}% quota used</span>
                      <span className="font-bold text-ink">{stats.neon.freeFormatted} FREE</span>
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="font-mono text-[11px] space-y-1.5 pt-2 border-t border-ink-hairline text-ink">
                    <div className="flex justify-between">
                      <span className="text-ink-quiet">Total Indexed Entries:</span>
                      <span className="font-bold">{stats.neon.totalEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-quiet">Category Indexes:</span>
                      <span className="font-bold">{stats.neon.totalCategories}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 text-[10px] text-ink-quiet">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-green-600" />
                        Row bloat shielded:
                      </span>
                      <span className="text-green-600 font-bold">100% OFF-LOADED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Backblaze B2 Object Storage */}
              <div className="border border-ink p-5 bg-ground flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-ink">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>BACKBLAZE B2 STORAGE</span>
                    </div>
                    <span className="tech-pill text-[10px] bg-light">10 GB FREE</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between font-mono text-[11px] text-ink mb-1.5">
                      <span className="font-semibold">Used: {stats.backblaze.usedFormatted}</span>
                      <span className="text-ink-quiet">Limit: {stats.backblaze.limitFormatted}</span>
                    </div>
                    <div className="w-full bg-light h-3 border border-ink p-0.5">
                      <div
                        className="bg-ink h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0.5, stats.backblaze.usagePercentage * 10))}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-quiet">
                      <span>{stats.backblaze.usagePercentage}% quota used</span>
                      <span className="font-bold text-ink">{stats.backblaze.freeFormatted} FREE</span>
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="font-mono text-[11px] space-y-1.5 pt-2 border-t border-ink-hairline text-ink">
                    <div className="flex justify-between">
                      <span className="text-ink-quiet">Raw Text Offloaded:</span>
                      <span className="font-bold">{stats.backblaze.rawFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-quiet">GZIP Compressed Size:</span>
                      <span className="font-bold">{stats.backblaze.usedFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-quiet">Compression Savings:</span>
                      <span className="font-bold text-green-600">-{Math.max(0, Math.round(stats.backblaze.savingsPercentage || 0))}% saved</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-ink-quiet pt-1">
                      <span>Bucket Name:</span>
                      <span className="font-mono font-bold text-ink">{stats.backblaze.bucketName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offline Backup & Data Sovereignty Export */}
            <div className="p-4 border border-ink bg-ground flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-ink uppercase mb-1">
                  <Download className="w-3.5 h-3.5 text-ink" />
                  <span>Offline Backup & Snapshot Export</span>
                </div>
                <p className="text-ink-body text-[11px]">
                  Download a complete self-contained <strong className="text-ink">.zip</strong> archive containing <code className="text-ink">recall-metadata.json</code> and all decompressed markdown notes.
                </p>
              </div>

              <a
                href={`${API_BASE_URL}/backup/export`}
                download="recall-backup.zip"
                className="bg-ink text-ground px-4 py-2 font-mono text-xs font-semibold hover:bg-neutral-800 transition-colors border border-ink flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ZIP</span>
              </a>
            </div>

            {/* Maintenance & Deletion Protocol */}
            <div className="p-4 border border-ink bg-light font-mono text-xs leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-ink uppercase mb-2">
                <Trash2 className="w-3.5 h-3.5 text-ink" />
                <span>EASY CLEANUP</span>
              </div>
              <p className="text-ink-body mb-1 text-[11px]">
                Done with an older note? Hit <strong className="text-ink">[X]</strong> to remove it from the database and clear its stored file so your space stays tidy.
              </p>
            </div>

          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-ink-hairline flex items-center justify-between font-mono text-xs text-ink-quiet">
          <span>CLAIM-CHECK REFERENCE PATTERN / REAL-TIME TELEMETRY</span>
          <button
            onClick={onClose}
            className="tech-pill hover:bg-ink hover:text-ground font-bold"
          >
            Close Monitor
          </button>
        </div>

      </div>
    </div>
  );
};
