import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { KnowledgeCore3D } from '@/components/canvas3d/KnowledgeCore3D';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { CornerDownLeft, HardDrive, Bot, FolderGit2 } from 'lucide-react';

interface HeroSectionProps {
  onOpenStorageModal?: () => void;
  onOpenAiTutor?: () => void;
  onOpenJobRadar?: () => void;
  onOpenMarkdownVault?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenStorageModal,
  onOpenAiTutor,
  onOpenJobRadar,
  onOpenMarkdownVault,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [queryInput, setQueryInput] = useState('');

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      headlineRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
    ).fromTo(
      inputRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      '-=0.3'
    );
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full pt-4 pb-12 px-6 sm:px-10 max-w-7xl mx-auto"
    >
      {/* Top Technical Navigation Bar (Exact Koval SEO style with Theme Toggle) */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-8 pt-2 border-b border-ink-hairline">
        {/* Left Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <span className="tech-pill-black">recall.sunil4224</span>
          <a href="#how-it-works" className="tech-pill">
            / how-it-works
          </a>
          <a href="#vector-rag" className="tech-pill">
            / rulebooks
          </a>
          <a href="#knowledge-base" className="tech-pill">
            / blog
          </a>
          <button
            onClick={onOpenJobRadar}
            className="tech-pill flex items-center gap-1 font-semibold hover:bg-ink hover:text-ground cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span>/ job-radar</span>
          </button>
          <button
            onClick={onOpenMarkdownVault}
            className="tech-pill flex items-center gap-1 font-semibold hover:bg-ink hover:text-ground cursor-pointer"
            title="Local Git-Backed Markdown Vault (Zero-DB / 0 CU-hrs)"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>/ markdown-vault</span>
            <span className="text-[9px] px-1 bg-ink text-ground rounded-xs font-bold">zero-db</span>
          </button>
        </div>

        {/* Right Header Navigation, Theme Toggle & Geometric Logo */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            {/* Simple Good-Looking Theme Toggle */}
            <ThemeToggle />

            {/* Storage Quota Trigger */}
            {onOpenStorageModal && (
              <button
                onClick={onOpenStorageModal}
                className="tech-pill hover:bg-ink hover:text-ground flex items-center gap-1 font-semibold"
                title="View live Neon DB & Backblaze B2 storage capacity"
              >
                <HardDrive className="w-3 h-3" />
                <span>storage</span>
              </button>
            )}

            {/* AI Tutor Trigger */}
            {onOpenAiTutor && (
              <button
                onClick={onOpenAiTutor}
                className="tech-pill-black hover:bg-neutral-800 flex items-center gap-1 font-semibold text-[11px]"
                title="Open AI Tutor & Interview Mentor (Ctrl+J)"
              >
                <Bot className="w-3 h-3 text-ground" />
                <span>ai tutor</span>
              </button>
            )}

            <span className="tech-pill">/ en</span>
            <button className="tech-pill">
              / login
            </button>
          </div>

          {/* Geometric Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 border-2 border-ink flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-ink"></div>
            </div>
            <span className="font-sans font-black tracking-tight text-base text-ink uppercase hidden sm:inline">
              RECALL BY SUNIL4224
            </span>
          </div>
        </div>
      </header>

      {/* Hero Main Grid */}
      <div className="pt-14 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-xs uppercase tracking-tight font-semibold">
            <span className="tech-pill-black text-[10px] px-2 py-0.5">
              DIGITAL NOTEBOOK FOR PREP
            </span>
          </div>

          <h1
            ref={headlineRef}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-ink tracking-tight leading-[1.05] mb-8"
          >
            your notes, anywhere you go.
          </h1>

          {/* Koval-Style Search / Command Input Bar */}
          <div ref={inputRef} className="mt-12 max-w-2xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0 border-b-2 border-ink pb-2">
              <div className="flex items-center">
                <span className="tech-pill-black text-xs px-2.5 py-1.5 mr-2">
                  https://
                </span>
                <input
                  type="text"
                  placeholder="search a topic, code snippet, or concept..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="bg-transparent font-mono text-sm sm:text-base text-ink placeholder:text-ink-quiet focus:outline-none w-full sm:w-[340px] py-1"
                />
              </div>

              <div className="sm:ml-auto mt-3 sm:mt-0 flex items-center gap-2">
                <button className="flex items-center justify-center gap-2 bg-ink text-ground hover:bg-neutral-800 font-sans font-semibold text-xs px-5 py-2.5 transition-all">
                  <span>Find note ↵</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-ground" />
                </button>
              </div>
            </div>

            <p className="mt-2.5 font-mono text-[11px] text-ink-quiet">
              Friendly reminder: cloud storage costs money behind the scenes, so save the good stuff—your future self will thank you.
            </p>
          </div>
        </div>

        {/* Right 4 Columns */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full pt-4">
          <p className="text-sm sm:text-base font-normal text-ink-body leading-relaxed max-w-xs">
            Built for people who like keeping notes digitally—save your title, explanation, code, YouTube links, and PDFs in one place and pull them up anytime.
          </p>

          <div className="mt-4">
            <KnowledgeCore3D />
          </div>
        </div>
      </div>

      {/* Halftone Dot Matrix Banner */}
      <div className="mt-12 pt-8 border-t border-ink-hairline flex items-center justify-between overflow-hidden">
        <div className="text-3xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-ink opacity-15 select-none uppercase">
          KEEP IT SHARP.
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="tech-pill text-[10px]">MorphSVG</span>
          <span className="tech-pill text-[10px]">+3</span>
        </div>
      </div>
    </section>
  );
};
