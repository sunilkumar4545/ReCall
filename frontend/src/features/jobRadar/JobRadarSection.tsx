import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Clock,
  Radio,
  Building2,
  MapPin,
  ArrowRight,
  Sparkles,
  Leaf,
} from 'lucide-react';
import { api } from '@/services/api';
import { JobNotification, JobStats } from '@/types';
import { JobDetailModal } from '@/components/common/JobDetailModal';

interface JobRadarSectionProps {
  onOpenWorkspace: () => void;
}

export const JobRadarSection: React.FC<JobRadarSectionProps> = ({ onOpenWorkspace }) => {
  const [jobs, setJobs] = useState<JobNotification[]>([]);
  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    maxCapacity: 150,
    estimatedSizeKb: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedJob, setSelectedJob] = useState<JobNotification | null>(null);
  const [streamEnabled, setStreamEnabled] = useState<boolean>(false);
  const [toggling, setToggling] = useState<boolean>(false);

  // Load preview jobs & in-memory stream status ONCE on mount (0 continuous DB polling!)
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getJobs({ limit: 6 }),
      api.getJobStats(),
      api.getJobStreamStatus(),
    ])
      .then(([jobsData, statsData, statusData]) => {
        if (!isMounted) return;
        setJobs(jobsData || []);
        if (statsData) setStats(statsData);
        if (statusData) setStreamEnabled(statusData.enabled);
      })
      .catch((err) => console.warn('Could not load job preview:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    <section id="job-radar" className="py-12 px-6 sm:px-10 max-w-7xl mx-auto border-t-2 border-ink">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-[10px]">
            <span className="flex items-center gap-1 font-bold bg-green-600 text-white px-2 py-0.5 uppercase">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>LIVE TELEGRAM RADAR</span>
            </span>
            <span className="text-ink-quiet">
              // ZERO-WASTE CIRCULAR BUFFER
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-sans">
            Job Notifications
          </h2>

          <p className="text-xs font-mono text-ink-quiet mt-1">
            Real-time hiring alerts streamed from your Telegram channels. Auto-purged to stay under {stats.maxCapacity} records (~{stats.estimatedSizeKb} KB DB footprint).
          </p>
        </div>

        {/* Actions: Eco Mode Switch + Open Dedicated Job Portal */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Eco Mode Compute-Hour Saver Switch (In-Memory Spring Boot Gatekeeper) */}
          <button
            onClick={toggleStreamStatus}
            disabled={toggling}
            className={`border-2 border-ink px-3 py-2 font-mono text-xs flex items-center gap-2 transition-all shadow-xs ${
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
                <span>● LIVE INGEST: ON</span>
              </>
            ) : (
              <>
                <Leaf className="w-3.5 h-3.5 text-green-700" />
                <span>○ ECO MODE: PAUSED</span>
                <span className="text-[10px] bg-green-700 text-white px-1.5 py-0.2 font-bold">0 CU-hrs</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenWorkspace}
            className="bg-ink text-ground font-mono text-xs font-bold px-5 py-2.5 border-2 border-ink hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs group"
          >
            <span>EXPLORE ALL JOBS ({stats.totalJobs})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 6-Card Preview Grid */}
      {loading ? (
        <div className="border border-ink p-10 text-center bg-ground font-mono text-xs text-ink-quiet">
          Loading latest job highlights...
        </div>
      ) : jobs.length === 0 ? (
        <div className="border border-dashed border-ink p-8 text-center bg-light/30 font-mono text-xs text-ink-quiet">
          No job notifications available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="border border-ink bg-ground p-4 flex flex-col justify-between hover:border-black hover:shadow-xs cursor-pointer transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2 font-mono text-[10px]">
                  <span className="text-ink-quiet truncate max-w-[170px]">
                    via {job.channelTitle || 'Telegram'}
                  </span>
                  <span className="text-ink-quiet flex items-center gap-1 shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimeAgo(job.postedAt)}
                  </span>
                </div>

                <h3 className="font-sans font-bold text-sm text-ink leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-ink-quiet mb-3">
                  {job.company && (
                    <span className="flex items-center gap-1 font-semibold text-ink">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[120px]">{job.company}</span>
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[100px]">{job.location}</span>
                    </span>
                  )}
                </div>

                {job.description && (
                  <p className="font-sans text-xs text-ink-quiet line-clamp-2 leading-relaxed bg-light/30 p-2 border-l-2 border-ink">
                    {job.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-ink-hairline flex items-center justify-between mt-3 font-mono text-[11px]">
                <span className="text-ink-quiet group-hover:text-ink font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-ink" />
                  <span>View Details</span>
                </span>

                <a
                  href={cleanApplyUrl(job.applyUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="tech-pill-black text-[10px] px-2.5 py-1 flex items-center gap-1"
                >
                  <span>APPLY</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA to Job Portal */}
      <div className="border border-ink bg-light/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-mono text-xs text-ink">
          Showing <strong>{jobs.length} latest highlights</strong>. Browse all {stats.totalJobs} live openings with role and tech stack filters in the dedicated portal.
        </div>
        <button
          onClick={onOpenWorkspace}
          className="tech-pill-black font-mono text-xs px-5 py-2 hover:bg-neutral-800 transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span>OPEN FULL JOB RADAR ({stats.totalJobs})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </section>
  );
};
