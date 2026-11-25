import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Search,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Radio,
  RefreshCw,
  Building2,
  MapPin,
  Trash2,
  Terminal,
  Filter,
  Eye,
  Leaf,
} from 'lucide-react';
import { api } from '@/services/api';
import { JobNotification, JobStats } from '@/types';
import { JobDetailModal } from '@/components/common/JobDetailModal';

const FILTER_TAGS = [
  'All',
  'Remote',
  'Internship',
  'Fresher',
  'Java',
  'Frontend',
  'Fullstack',
  'Python',
  'DevOps',
];

interface JobRadarWorkspaceProps {
  onBack: () => void;
}

export const JobRadarWorkspace: React.FC<JobRadarWorkspaceProps> = ({ onBack }) => {
  const [jobs, setJobs] = useState<JobNotification[]>([]);
  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    maxCapacity: 150,
    estimatedSizeKb: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [streamEnabled, setStreamEnabled] = useState<boolean>(false);
  const [toggling, setToggling] = useState<boolean>(false);

  // Search input state vs committed query (triggers search on 'Find' or 'Enter')
  const [inputQuery, setInputQuery] = useState<string>('');
  const [committedQuery, setCommittedQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Detail Modal
  const [selectedJob, setSelectedJob] = useState<JobNotification | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchJobs = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [jobsData, statsData, statusData] = await Promise.all([
        api.getJobs({
          query: committedQuery || undefined,
          filter: activeFilter !== 'All' ? activeFilter : undefined,
          limit: 150,
        }),
        api.getJobStats(),
        api.getJobStreamStatus(),
      ]);

      setJobs(jobsData || []);
      if (statsData) setStats(statsData);
      if (statusData) setStreamEnabled(statusData.enabled);
    } catch (err) {
      console.warn('Could not fetch jobs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [committedQuery, activeFilter]);

  const toggleStreamStatus = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const next = !streamEnabled;
      const res = await api.setJobStreamStatus(next);
      setStreamEnabled(res.enabled);
    } catch (err) {
      console.error('Failed to toggle stream status:', err);
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCommittedQuery(inputQuery.trim());
  };

  const handleFilterClick = (tag: string) => {
    setActiveFilter(tag);
  };

  const cleanApplyUrl = (rawUrl?: string): string => {
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

  const handleCopyLink = (url: string, id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanApplyUrl(url));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteJob = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setStats((prev) => ({
        ...prev,
        totalJobs: Math.max(0, prev.totalJobs - 1),
      }));
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
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

  return (
    <div className="min-h-screen bg-ground text-ink flex flex-col font-sans">
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-ground/95 backdrop-blur-xs border-b-2 border-ink px-6 sm:px-10 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Back button & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="bg-ink text-ground px-3 py-1.5 font-mono text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← BACK TO VAULT</span>
            </button>

            <div className="h-5 w-[1px] bg-ink-hairline hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-mono text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 uppercase">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>Job Radar Portal</span>
              </span>
              <span className="font-mono text-xs font-bold text-ink hidden md:inline">
                / {stats.totalJobs} Active Openings
              </span>
            </div>
          </div>

          {/* Telemetry Gauge, Eco Mode Switch & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Eco Mode Compute-Hour Saver Switch */}
            <button
              onClick={toggleStreamStatus}
              disabled={toggling}
              className={`border-2 border-ink px-3 py-1 font-mono text-xs flex items-center gap-2 transition-all shadow-xs ${
                streamEnabled
                  ? 'bg-green-600 text-white font-bold'
                  : 'bg-light text-ink hover:bg-neutral-200'
              }`}
              title={
                streamEnabled
                  ? 'Live Telegram stream active. Click to switch to Eco Mode (Sleep Neon Compute)'
                  : 'Eco Mode active (Neon asleep at 0.00 CU-hrs). Click to resume live Telegram ingestion.'
              }
            >
              {streamEnabled ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>● LIVE STREAM: ON</span>
                </>
              ) : (
                <>
                  <Leaf className="w-3.5 h-3.5 text-green-700" />
                  <span>○ ECO MODE: PAUSED</span>
                  <span className="text-[10px] bg-green-700 text-white px-1 py-0 font-bold">0 CU-hrs</span>
                </>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-3 border border-ink bg-light px-3 py-1 font-mono text-xs">
              <span>
                Capacity: <strong>{stats.totalJobs} / {stats.maxCapacity}</strong>
              </span>
              <span className="text-ink-hairline">|</span>
              <span className="text-green-600 font-bold">
                {stats.estimatedSizeKb} KB Footprint
              </span>
            </div>

            <button
              onClick={() => fetchJobs(true)}
              disabled={refreshing}
              className="tech-pill flex items-center gap-1.5 font-bold hover:bg-ink hover:text-ground text-xs py-1.5"
              title="Sync latest Telegram jobs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-8">
        {/* Search Bar with dedicated 'FIND' Button */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2 mb-6">
          <div className="flex-1 flex items-center border-2 border-ink bg-ground px-3 py-2.5 shadow-xs">
            <Search className="w-4 h-4 text-ink mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search by role, company, skills (e.g. Java, Python, Frontend, Deloitte)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="w-full bg-transparent font-mono text-xs sm:text-sm text-ink focus:outline-none placeholder:text-ink-quiet"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => {
                  setInputQuery('');
                  setCommittedQuery('');
                }}
                className="text-xs font-mono text-ink-quiet hover:text-ink mr-2"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            className="bg-ink text-ground font-mono text-xs sm:text-sm font-black px-6 py-2.5 border-2 border-ink hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>FIND JOBS</span>
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b border-ink-hairline">
          <span className="font-mono text-xs text-ink-quiet flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleFilterClick(tag)}
              className={`font-mono text-xs px-3 py-1 border border-ink transition-colors ${
                activeFilter === tag
                  ? 'bg-ink text-ground font-bold'
                  : 'bg-ground text-ink hover:bg-light'
              }`}
            >
              {tag}
            </button>
          ))}
          {committedQuery && (
            <span className="tech-pill text-[10px] ml-auto">
              Searching: "{committedQuery}"
            </span>
          )}
        </div>

        {/* Grid of Job Cards */}
        {loading ? (
          <div className="border-2 border-ink p-16 text-center bg-ground">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-ink mb-4" />
            <p className="font-mono text-sm text-ink font-bold">Scanning active job database...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="border-2 border-dashed border-ink p-12 text-center bg-light/30">
            <Terminal className="w-8 h-8 text-ink mx-auto mb-3 opacity-60" />
            <h3 className="font-sans font-bold text-base text-ink mb-1">
              No Matching Jobs Found
            </h3>
            <p className="font-mono text-xs text-ink-quiet max-w-md mx-auto mb-4">
              Try adjusting your search query or switching filters to "All".
            </p>
            <button
              onClick={() => {
                setInputQuery('');
                setCommittedQuery('');
                setActiveFilter('All');
              }}
              className="tech-pill-black text-xs font-mono px-4 py-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="border-2 border-ink bg-ground p-5 flex flex-col justify-between hover:border-black hover:shadow-md cursor-pointer transition-all relative group"
              >
                <div>
                  {/* Channel Tag & Time */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-ink bg-light text-ink truncate max-w-[180px]">
                      via {job.channelTitle || 'Telegram'}
                    </span>
                    <span className="font-mono text-[10px] text-ink-quiet flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(job.postedAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-sans font-extrabold text-sm text-ink leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>

                  {/* Company & Location */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-ink-quiet mb-3">
                    {job.company && (
                      <span className="flex items-center gap-1 font-semibold text-ink">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[130px]">{job.company}</span>
                      </span>
                    )}
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[110px]">{job.location}</span>
                      </span>
                    )}
                  </div>

                  {/* Description snippet */}
                  {job.description && (
                    <p className="font-sans text-xs text-ink-quiet line-clamp-3 mb-4 leading-relaxed bg-light/30 p-2 border-l-2 border-ink">
                      {job.description}
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-ink-hairline flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleCopyLink(job.applyUrl, job.id, e)}
                      className="tech-pill text-[10px] flex items-center gap-1 hover:bg-ink hover:text-ground transition-colors"
                      title="Copy Link"
                    >
                      {copiedId === job.id ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-green-600" />
                          <span className="text-green-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => handleDeleteJob(job.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-ink-quiet hover:text-red-500 transition-opacity"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-ink-quiet flex items-center gap-0.5 group-hover:text-ink">
                      <Eye className="w-2.5 h-2.5" />
                      <span>Details</span>
                    </span>
                    <a
                      href={cleanApplyUrl(job.applyUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-ink text-ground font-mono text-xs font-bold px-3 py-1.5 border border-ink hover:bg-neutral-800 transition-colors flex items-center gap-1"
                    >
                      <span>APPLY</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
};
