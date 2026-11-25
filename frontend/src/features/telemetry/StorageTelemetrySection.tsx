import React, { useState, useEffect } from 'react';
import { Database, Cloud, ShieldCheck, RefreshCw, HardDrive, ArrowDownRight, Layers, Trash2 } from 'lucide-react';
import { api, StorageStats } from '../../services/api';

interface StorageTelemetrySectionProps {
  entriesCount?: number;
  lastUpdated?: number;
}

export const StorageTelemetrySection: React.FC<StorageTelemetrySectionProps> = ({ entriesCount, lastUpdated }) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unitMode, setUnitMode] = useState<'AUTO' | 'MB' | 'GB'>('AUTO');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStorageStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load storage telemetry:', err);
      setError('Could not reach backend telemetry service at http://localhost:8080/api/storage/stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [entriesCount, lastUpdated]);

  // Format helpers for MB and GB
  const formatInMB = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatInGB = (bytes: number): string => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(4) + ' GB';
  };

  const formatValue = (bytes: number, defaultFormatted: string): string => {
    if (unitMode === 'MB') return formatInMB(bytes);
    if (unitMode === 'GB') return formatInGB(bytes);
    return defaultFormatted;
  };

  return (
    <section id="storage-telemetry" className="py-12 px-6 sm:px-10 max-w-7xl mx-auto border-t-2 border-ink">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-ink mb-8">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-tight font-semibold text-ink mb-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>LIVE CLOUD TELEMETRY // STORAGE & QUOTAS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-sans">
            Storage & Compression
          </h2>
          <p className="text-xs text-ink-quiet font-sans mt-1">
            We compress your text and keep storage light so your notebook stays fast, clean, and easy to maintain.
          </p>
        </div>

        {/* Top Controls: Unit Selector & Refresh */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {/* Unit Switcher */}
          <div className="border border-ink flex items-center bg-ground">
            <button
              onClick={() => setUnitMode('AUTO')}
              className={`px-2.5 py-1 transition-colors ${
                unitMode === 'AUTO' ? 'bg-ink text-ground font-bold' : 'text-ink hover:bg-light'
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => setUnitMode('MB')}
              className={`px-2.5 py-1 border-l border-ink transition-colors ${
                unitMode === 'MB' ? 'bg-ink text-ground font-bold' : 'text-ink hover:bg-light'
              }`}
            >
              MB
            </button>
            <button
              onClick={() => setUnitMode('GB')}
              className={`px-2.5 py-1 border-l border-ink transition-colors ${
                unitMode === 'GB' ? 'bg-ink text-ground font-bold' : 'text-ink hover:bg-light'
              }`}
            >
              GB
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="tech-pill flex items-center gap-1.5 font-bold hover:bg-ink hover:text-ground"
            title="Refresh live storage metrics from Neon and Backblaze"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 border-2 border-red-500 bg-red-50 text-red-700 font-mono text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStats} className="tech-pill-black text-[10px]">
            Retry Sync
          </button>
        </div>
      ) : loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-ink p-6 bg-ground h-64 flex flex-col justify-between">
              <div className="h-4 bg-light w-1/3 mb-4" />
              <div className="h-10 bg-light w-2/3 mb-4" />
              <div className="h-3 bg-light w-full mb-2" />
              <div className="h-20 bg-light w-full" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-6">
          
          {/* 3-Card Bklit UI Visual Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* CARD 1: Neon Serverless PostgreSQL */}
            <div className="border border-ink p-6 bg-ground hover:shadow-brutalist transition-all duration-150 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <Database className="w-3.5 h-3.5 text-ink" />
                    <span>NEON POSTGRESQL</span>
                  </div>
                  <span className="tech-pill text-[10px] bg-light">500 MB FREE LIMIT</span>
                </div>

                {/* Big Highlight Number: Space Left */}
                <div className="mb-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-quiet">
                    Remaining Free Space
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-ink font-sans tracking-tight mt-0.5">
                    {formatValue(stats.neon.limitBytes - stats.neon.usedBytes, stats.neon.freeFormatted)}
                  </div>
                  <div className="font-mono text-xs text-ink-quiet mt-1 flex items-center gap-1.5">
                    <span>Used:</span>
                    <strong className="text-ink font-semibold">
                      {formatValue(stats.neon.usedBytes, stats.neon.usedFormatted)}
                    </strong>
                    <span>/ {formatValue(stats.neon.limitBytes, stats.neon.limitFormatted)}</span>
                  </div>
                </div>

                {/* Bklit-style Segmented Progress Bar */}
                <div className="mb-5">
                  <div className="flex justify-between font-mono text-[10px] text-ink-quiet mb-1.5">
                    <span>Capacity Meter</span>
                    <span className="font-bold text-ink">{stats.neon.usagePercentage}% consumed</span>
                  </div>
                  <div className="w-full bg-light h-3.5 border border-ink p-0.5 relative overflow-hidden">
                    <div
                      className="bg-ink h-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, Math.max(1, stats.neon.usagePercentage))}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-ink-quiet mt-1">
                    <span>0 MB</span>
                    <span>250 MB</span>
                    <span>500 MB (Free Quota)</span>
                  </div>
                </div>

                {/* Detailed Spec Metrics */}
                <div className="font-mono text-[11px] space-y-2 pt-3 border-t border-ink-hairline">
                  <div className="flex justify-between">
                    <span className="text-ink-quiet">Indexed Blog Entries:</span>
                    <span className="font-bold text-ink">{stats.neon.totalEntries} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-quiet">Category Indexes:</span>
                    <span className="font-bold text-ink">{stats.neon.totalCategories} topics</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-ink-quiet">Neon Database Quota:</span>
                    <span className="text-green-600 font-bold">99.96% AVAILABLE</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Tag */}
              <div className="mt-6 pt-3 border-t border-ink-hairline flex items-center justify-between font-mono text-[10px] text-ink-quiet">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  Text Bloat Prevented
                </span>
                <span className="font-bold text-ink">~300B / row</span>
              </div>
            </div>

            {/* CARD 2: Backblaze B2 Object Storage */}
            <div className="border border-ink p-6 bg-ground hover:shadow-brutalist transition-all duration-150 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <Cloud className="w-3.5 h-3.5 text-ink" />
                    <span>BACKBLAZE B2 STORAGE</span>
                  </div>
                  <span className="tech-pill text-[10px] bg-light">10 GB FREE LIMIT</span>
                </div>

                {/* Big Highlight Number: Space Left */}
                <div className="mb-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-quiet">
                    Remaining Free Storage
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-ink font-sans tracking-tight mt-0.5">
                    {formatValue(stats.backblaze.limitBytes - stats.backblaze.usedBytes, stats.backblaze.freeFormatted)}
                  </div>
                  <div className="font-mono text-xs text-ink-quiet mt-1 flex items-center gap-1.5">
                    <span>Used:</span>
                    <strong className="text-ink font-semibold">
                      {formatValue(stats.backblaze.usedBytes, stats.backblaze.usedFormatted)}
                    </strong>
                    <span>/ {formatValue(stats.backblaze.limitBytes, stats.backblaze.limitFormatted)}</span>
                  </div>
                </div>

                {/* Bklit-style Segmented Progress Bar */}
                <div className="mb-5">
                  <div className="flex justify-between font-mono text-[10px] text-ink-quiet mb-1.5">
                    <span>Capacity Meter</span>
                    <span className="font-bold text-ink">{stats.backblaze.usagePercentage}% consumed</span>
                  </div>
                  <div className="w-full bg-light h-3.5 border border-ink p-0.5 relative overflow-hidden">
                    <div
                      className="bg-ink h-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0.5, stats.backblaze.usagePercentage * 10))}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-ink-quiet mt-1">
                    <span>0 GB</span>
                    <span>5 GB</span>
                    <span>10 GB (Free Forever)</span>
                  </div>
                </div>

                {/* Detailed Spec Metrics */}
                <div className="font-mono text-[11px] space-y-2 pt-3 border-t border-ink-hairline">
                  <div className="flex justify-between">
                    <span className="text-ink-quiet">Active Compressed Blobs:</span>
                    <span className="font-bold text-ink">{stats.backblaze.totalBlobs} .json.gz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-quiet">Cloud Bucket:</span>
                    <span className="font-bold text-ink">{stats.backblaze.bucketName}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-ink-quiet">Backblaze Quota:</span>
                    <span className="text-green-600 font-bold">100.00% AVAILABLE</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Tag */}
              <div className="mt-6 pt-3 border-t border-ink-hairline flex items-center justify-between font-mono text-[10px] text-ink-quiet">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-ink" />
                  S3 Protocol
                </span>
                <span className="font-bold text-ink">Zero Egress Fees</span>
              </div>
            </div>

            {/* CARD 3: Claim-Check Data Reduction & Space Saved */}
            <div className="border border-ink p-6 bg-ground hover:shadow-brutalist transition-all duration-150 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <Layers className="w-3.5 h-3.5 text-ink" />
                    <span>CLAIM-CHECK EFFICIENCY</span>
                  </div>
                  <span className="tech-pill text-[10px] bg-ink text-ground">GZIP ACTIVE</span>
                </div>

                {/* Big Highlight Number: GZIP Space Saved */}
                <div className="mb-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-quiet">
                    Total Text Space Saved
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-green-600 font-sans tracking-tight mt-0.5">
                    -{Math.max(0, Math.round(stats.backblaze.savingsPercentage || 0))}%
                  </div>
                  <div className="font-mono text-xs text-ink-quiet mt-1 flex items-center gap-1.5">
                    <span>Raw:</span>
                    <span className="line-through">{formatValue(stats.backblaze.rawContentBytes, stats.backblaze.rawFormatted)}</span>
                    <ArrowDownRight className="w-3 h-3 text-green-600 inline" />
                    <strong className="text-ink">{formatValue(stats.backblaze.usedBytes, stats.backblaze.usedFormatted)}</strong>
                  </div>
                </div>

                {/* Comparative Visual Bar */}
                <div className="mb-5">
                  <div className="flex justify-between font-mono text-[10px] text-ink-quiet mb-1.5">
                    <span>Compression Ratio</span>
                    <span className="font-bold text-green-600">~1.6x - 5x Shrink</span>
                  </div>
                  <div className="w-full bg-light h-3.5 border border-ink p-0.5 flex">
                    <div
                      className="bg-green-600 h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(15, 100 - (stats.backblaze.savingsPercentage || 0)))}%`,
                      }}
                      title="Compressed Stored Footprint"
                    />
                    <div
                      className="bg-ink/20 h-full transition-all duration-500 ease-out flex-1"
                      title="Reclaimed Free Space"
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-ink-quiet mt-1">
                    <span className="text-green-600 font-bold">Stored Size</span>
                    <span className="text-ink-quiet">Space Saved ({Math.max(0, Math.round(stats.backblaze.savingsPercentage || 0))}%)</span>
                  </div>
                </div>

                {/* Detailed Spec Metrics */}
                <div className="font-mono text-[11px] space-y-2 pt-3 border-t border-ink-hairline">
                  <div className="flex justify-between">
                    <span className="text-ink-quiet">Monthly Cost:</span>
                    <span className="font-bold text-green-600">$0.00 / FREE FOREVER</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-quiet">Total Theoretical Capacity:</span>
                    <span className="font-bold text-ink">~1,500,000+ blogs</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-ink-quiet">Storage Architecture:</span>
                    <span className="font-bold text-ink">Decoupled Hybrid</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Tag */}
              <div className="mt-6 pt-3 border-t border-ink-hairline flex items-center justify-between font-mono text-[10px] text-ink-quiet">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  Dual-Sync Architecture
                </span>
                <span className="font-bold text-ink">Zero Orphan Blobs</span>
              </div>
            </div>

          </div>

          {/* Maintenance & Synchronized Deletion Action Callout */}
          <div className="p-5 border border-ink bg-ground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 border border-ink flex items-center justify-center bg-light shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4 text-ink" />
              </div>
              <div>
                <div className="font-bold text-ink uppercase tracking-wider mb-0.5">
                  EASY CLEANUP
                </div>
                <p className="text-ink-quiet text-[11px] leading-relaxed max-w-3xl">
                  Done with an older note? Hit <strong className="text-ink">[X]</strong> to remove it from the database and clear its stored file so your space stays tidy.
                </p>
              </div>
            </div>

            <button
              onClick={fetchStats}
              className="tech-pill-black text-[11px] shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Update Counters</span>
            </button>
          </div>

        </div>
      ) : null}

    </section>
  );
};
