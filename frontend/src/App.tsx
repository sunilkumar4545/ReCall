import React, { useState, useEffect, useCallback } from 'react';
import { SmoothScrollWrapper } from './components/layout/SmoothScrollWrapper';
import { HeroSection } from './features/landing/HeroSection';
import { CategoryWorkspace } from './features/categoryWorkspace/CategoryWorkspace';
import { DeleteConfirmModal } from './components/common/DeleteConfirmModal';
import { NewCategoryModal } from './components/common/NewCategoryModal';
import { NewEntryModal } from './components/common/NewEntryModal';
import { BlogReaderModal } from './components/common/BlogReaderModal';
import { StorageQuotaModal } from './components/common/StorageQuotaModal';
import { AiTutorDrawer } from './components/common/AiTutorDrawer';
import { StorageTelemetrySection } from './features/telemetry/StorageTelemetrySection';
import { JobRadarSection } from './features/jobRadar/JobRadarSection';
import { JobRadarWorkspace } from './features/jobRadar/JobRadarWorkspace';
import { GitMarkdownVault } from './features/markdownVault/GitMarkdownVault';
import { startProductTour } from './features/tour/productTour';
import { Category, RecallEntry, TopicContent } from './types';
import { api, ApiRecallEntry } from './services/api';
import { Search, Plus, ArrowUpRight, Hash, X, BookOpen, HardDrive, Bot, FolderGit2 } from 'lucide-react';

// Mapper from backend API entry to frontend RecallEntry
const mapApiEntryToRecallEntry = (item: ApiRecallEntry): RecallEntry => ({
  id: item.id.toString(),
  categoryId: item.categorySlug,
  title: item.title,
  summary: item.summary || '',
  explanation: item.explanation || '',
  codeLanguage: item.codeLanguage || 'java',
  codeSnippet: item.codeSnippet || '',
  imageUrl: item.imageUrl,
  youtubeUrl: item.youtubeUrl,
  youtubeEmbedUrl: item.youtubeEmbedUrl,
  pdfUrl: item.pdfUrl,
  pdfName: item.pdfName,
  readTime: item.readTime || '3 min read',
  createdAt: item.createdAt ? item.createdAt.slice(0, 10) : '',
  contentKey: item.contentKey,
  savingsPercentage: item.savingsPercentage,
});

export const App: React.FC = () => {
  // Live State synced directly with Neon Serverless PostgreSQL DB
  const [categories, setCategories] = useState<Category[]>([
    { id: 'all', name: 'all', slug: 'all' },
  ]);
  const [entries, setEntries] = useState<RecallEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active filters and views
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workspaceCategory, setWorkspaceCategory] = useState<Category | null>(null);

  // Modals
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<RecallEntry | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [activeReaderEntry, setActiveReaderEntry] = useState<RecallEntry | null>(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isJobRadarOpen, setIsJobRadarOpen] = useState(false);
  const [isMarkdownVaultOpen, setIsMarkdownVaultOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+J / Cmd+J to toggle AI Tutor drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsAiDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load all categories and entries from backend database
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [apiCategories, apiEntries] = await Promise.all([
        api.getCategories(),
        api.getEntries(),
      ]);

      const formattedCategories: Category[] = [
        { id: 'all', name: 'all', slug: 'all' },
        ...apiCategories.map((c) => ({
          id: c.id.toString(),
          name: c.name,
          slug: c.slug,
        })),
      ];

      setCategories(formattedCategories);
      setEntries(apiEntries.map(mapApiEntryToRecallEntry));
    } catch (err: any) {
      console.error('Failed to load data from backend:', err);
      setErrorMsg('Could not reach backend API at http://localhost:8080. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Launch interactive product tour for first-time visitors
  useEffect(() => {
    try {
      const seen = localStorage.getItem('recall_tour_seen');
      if (!seen) {
        const timer = setTimeout(() => {
          startProductTour();
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Filter entries in the main index
  const filteredEntries = entries.filter((entry) => {
    const matchesCategory = activeTab === 'all' || entry.categoryId === activeTab;
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate live count of topics for each category
  const categoryTopicCounts = entries.reduce<Record<string, number>>((acc, item) => {
    acc[item.categoryId] = (acc[item.categoryId] || 0) + 1;
    return acc;
  }, {});

  // Handle adding new category -> persists to Neon PostgreSQL
  const handleAddCategory = async (name: string, slug: string) => {
    try {
      const created = await api.createCategory({ name, slug });
      const newCat: Category = {
        id: created.id.toString(),
        name: created.name,
        slug: created.slug,
      };
      setCategories((prev) => [...prev, newCat]);
      setActiveTab(created.slug);
    } catch (err: any) {
      console.error('Failed to create category:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to create category on database.');
    }
  };

  // Handle creating new entry -> persists to Neon PostgreSQL
  const handleCreateEntry = async (newEntryData: Omit<RecallEntry, 'id' | 'createdAt'>) => {
    try {
      // Resolve to clean slug whether ID or slug was provided
      const targetCat = categories.find(
        (c) => c.slug === newEntryData.categoryId || c.id === newEntryData.categoryId
      );
      const cleanSlug = targetCat && targetCat.slug !== 'all' 
        ? targetCat.slug 
        : (newEntryData.categoryId !== 'all' ? newEntryData.categoryId : (categories[1]?.slug || 'java'));

      const created = await api.createEntry({
        categorySlug: cleanSlug,
        title: newEntryData.title,
        summary: newEntryData.summary,
        explanation: newEntryData.explanation,
        codeLanguage: newEntryData.codeLanguage,
        codeSnippet: newEntryData.codeSnippet,
        imageUrl: newEntryData.imageUrl,
        youtubeUrl: newEntryData.youtubeUrl,
        pdfUrl: newEntryData.pdfUrl,
        pdfName: newEntryData.pdfName,
      });

      const mapped = mapApiEntryToRecallEntry(created);
      setEntries((prev) => [mapped, ...prev]);
    } catch (err: any) {
      console.error('Failed to create entry on database:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to save entry to database.');
    }
  };

  // Handle saving or updating a topic in the Category Workspace
  const handleSaveTopic = async (topicData: TopicContent): Promise<TopicContent | undefined> => {
    try {
      const isExisting = entries.some((e) => e.id === topicData.id && !e.id.startsWith('new-'));

      if (isExisting) {
        const updated = await api.updateEntry(topicData.id, {
          title: topicData.topicTitle,
          summary: topicData.summary,
          explanation: topicData.explanation,
          codeLanguage: topicData.codeLanguage,
          codeSnippet: topicData.codeSnippet,
          imageUrl: topicData.imageUrl,
          youtubeUrl: topicData.youtubeUrl,
          pdfUrl: topicData.drivePdfUrl,
          pdfName: topicData.pdfName,
        });
        const mapped = mapApiEntryToRecallEntry(updated);
        setEntries((prev) => prev.map((e) => (e.id === topicData.id ? mapped : e)));
        return {
          ...topicData,
          id: mapped.id,
          updatedAt: mapped.createdAt,
        };
      } else {
        const targetCat = categories.find(
          (c) => c.slug === topicData.categoryId || c.id === topicData.categoryId
        );
        const cleanSlug = targetCat && targetCat.slug !== 'all' 
          ? targetCat.slug 
          : (topicData.categoryId !== 'all' ? topicData.categoryId : (categories[1]?.slug || 'java'));

        const created = await api.createEntry({
          categorySlug: cleanSlug,
          title: topicData.topicTitle,
          summary: topicData.summary,
          explanation: topicData.explanation,
          codeLanguage: topicData.codeLanguage,
          codeSnippet: topicData.codeSnippet,
          imageUrl: topicData.imageUrl,
          youtubeUrl: topicData.youtubeUrl,
          pdfUrl: topicData.drivePdfUrl,
          pdfName: topicData.pdfName,
        });
        const mapped = mapApiEntryToRecallEntry(created);
        setEntries((prev) => [mapped, ...prev.filter((e) => e.id !== topicData.id)]);
        return {
          ...topicData,
          id: mapped.id,
          updatedAt: mapped.createdAt,
        };
      }
    } catch (err: any) {
      console.error('Failed to save topic to database:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to save topic changes to database.');
      return undefined;
    }
  };

  // Handle deleting a topic in Category Workspace -> persists to Neon PostgreSQL
  const handleDeleteTopic = async (topicId: string) => {
    try {
      if (!topicId.startsWith('new-')) {
        await api.deleteEntry(topicId);
      }
      setEntries((prev) => prev.filter((e) => e.id !== topicId));
    } catch (err: any) {
      console.error('Failed to delete topic from database:', err);
      if (err.response?.status === 404) {
        setEntries((prev) => prev.filter((e) => e.id !== topicId));
      } else {
        setErrorMsg('Failed to delete topic: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  // Handle confirming delete of entry or category
  const handleConfirmDelete = async () => {
    if (entryToDelete) {
      const targetId = entryToDelete.id;
      if (activeReaderEntry?.id === targetId) {
        setActiveReaderEntry(null);
      }
      setEntryToDelete(null);

      try {
        if (!targetId.startsWith('new-')) {
          await api.deleteEntry(targetId);
        }
        setEntries((prev) => prev.filter((e) => e.id !== targetId));
      } catch (err: any) {
        console.error('Failed to delete entry from database:', err);
        if (err.response?.status === 404) {
          setEntries((prev) => prev.filter((e) => e.id !== targetId));
        } else {
          setErrorMsg(err.response?.data?.detail || 'Failed to delete entry from database.');
        }
      }
    } else if (categoryToDelete) {
      const targetSlug = categoryToDelete.slug;
      setCategoryToDelete(null);

      try {
        await api.deleteCategoryBySlug(targetSlug);
        setCategories((prev) => prev.filter((c) => c.slug !== targetSlug));
        setEntries((prev) => prev.filter((e) => e.categoryId !== targetSlug));
        if (activeTab === targetSlug) {
          setActiveTab('all');
        }
      } catch (err: any) {
        console.error('Failed to delete category from database:', err);
        if (err.response?.status === 404) {
          setCategories((prev) => prev.filter((c) => c.slug !== targetSlug));
          setEntries((prev) => prev.filter((e) => e.categoryId !== targetSlug));
          if (activeTab === targetSlug) {
            setActiveTab('all');
          }
        } else {
          setErrorMsg(err.response?.data?.detail || 'Failed to delete category from database.');
        }
      }
    }
  };

  // Open W3Schools-Style Category Workspace for a selected category
  const openWorkspace = (categorySlug: string) => {
    const targetCat = categories.find((c) => c.slug === categorySlug) || categories[1];
    setWorkspaceCategory(targetCat);
  };

  // If Category Workspace is active, render Full-Window W3Schools-style View!
  if (workspaceCategory) {
    const categoryTopics: TopicContent[] = entries
      .filter((e) => e.categoryId === workspaceCategory.slug)
      .map((e) => ({
        id: e.id,
        categoryId: e.categoryId,
        topicTitle: e.title,
        summary: e.summary,
        explanation: e.explanation,
        codeLanguage: e.codeLanguage,
        codeSnippet: e.codeSnippet,
        imageUrl: e.imageUrl,
        youtubeUrl: e.youtubeUrl,
        youtubeEmbedUrl: e.youtubeEmbedUrl,
        drivePdfUrl: e.pdfUrl,
        pdfName: e.pdfName,
        readTime: e.readTime,
        updatedAt: e.createdAt,
      }));

    return (
      <CategoryWorkspace
        category={workspaceCategory}
        topics={categoryTopics}
        onBack={() => setWorkspaceCategory(null)}
        onSaveTopic={handleSaveTopic}
        onDeleteTopic={handleDeleteTopic}
      />
    );
  }

  // If Full-Screen Job Radar Workspace is active, render dedicated Job Portal
  if (isJobRadarOpen) {
    return <JobRadarWorkspace onBack={() => setIsJobRadarOpen(false)} />;
  }

  // If Git-Backed Markdown Vault Workspace is active, render dedicated Local Vault
  if (isMarkdownVaultOpen) {
    return <GitMarkdownVault onBack={() => setIsMarkdownVaultOpen(false)} />;
  }

  return (
    <SmoothScrollWrapper>
      <main className="min-h-screen bg-ground text-ink">
        {/* Hero Section styled exactly like Koval SEO Console */}
        <HeroSection
          onOpenStorageModal={() => setIsStorageModalOpen(true)}
          onOpenAiTutor={() => setIsAiDrawerOpen(true)}
          onOpenJobRadar={() => setIsJobRadarOpen(true)}
          onOpenMarkdownVault={() => setIsMarkdownVaultOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onQuickTopicSelect={(query) => {
            setSearchQuery(query);
            const target = document.getElementById('knowledge-base');
            if (target) {
              target.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        {/* Knowledge Console Section */}
        <section id="knowledge-base" className="py-12 px-6 sm:px-10 max-w-7xl mx-auto border-t-2 border-ink">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              <div className="font-mono text-xs uppercase tracking-tight font-semibold text-ink mb-1">
                DIGITAL NOTEBOOK
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-sans">
                Saved Notes
              </h2>
            </div>

            {/* Action Bar: Search + Workspace Shortcut + New Entry */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div data-tour="search-bar" className="flex items-center border border-ink bg-ground px-3 py-1.5 w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-ink mr-2" />
                <input
                  type="text"
                  placeholder="filter by title or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent font-mono text-xs text-ink focus:outline-none placeholder:text-ink-quiet"
                />
              </div>

              {/* Open Category Full-Screen Workspace */}
              {activeTab !== 'all' && (
                <button
                  onClick={() => openWorkspace(activeTab)}
                  className="tech-pill flex items-center gap-1.5 font-bold hover:bg-ink hover:text-ground"
                  title="Open full-screen documentation notebook"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open {activeTab} Workspace</span>
                </button>
              )}

              {/* Open Git-Backed Markdown Vault (Zero-DB) */}
              <button
                onClick={() => setIsMarkdownVaultOpen(true)}
                className="tech-pill flex items-center gap-1.5 font-bold hover:bg-ink hover:text-ground"
                title="Open Git-backed local Markdown vault (Zero-DB / 0 CU-hrs)"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Local Git Vault</span>
                <span className="text-[9px] px-1 bg-ink text-ground rounded-xs font-bold">zero-db</span>
              </button>

              {/* Storage Quota Monitor Button */}
              <button
                onClick={() => setIsStorageModalOpen(true)}
                className="tech-pill flex items-center gap-1.5 font-bold hover:bg-ink hover:text-ground text-ink"
                title="View live Neon DB & Backblaze B2 storage quotas"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>storage monitor</span>
              </button>

              {/* Add New Entry Button */}
              <button
                data-tour="new-entry"
                onClick={() => setIsNewEntryOpen(true)}
                className="bg-ink text-ground px-4 py-2 font-mono text-xs font-semibold hover:bg-neutral-800 transition-colors border border-ink flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ new entry</span>
              </button>
            </div>
          </div>

          {/* Error notification banner if backend is unreachable */}
          {errorMsg && (
            <div className="mb-6 p-4 border-2 border-red-500 bg-red-50 text-red-700 font-mono text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={loadData} className="tech-pill-black text-[10px]">
                Retry Connection
              </button>
            </div>
          )}

          {/* Dynamic Technical Filter Pills */}
          <div data-tour="categories" className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-ink-hairline">
            {categories.map((cat) => {
              const isActive = activeTab === cat.slug;
              const count = categoryTopicCounts[cat.slug] || 0;
              const canDelete = cat.slug !== 'all';

              return (
                <div
                  key={cat.id}
                  className={`inline-flex items-center group ${
                    isActive ? 'tech-pill-black' : 'tech-pill'
                  }`}
                >
                  <button
                    onClick={() => setActiveTab(cat.slug)}
                    className="focus:outline-none flex items-center gap-1"
                  >
                    <span>/ {cat.slug}</span>
                    {count > 0 && (
                      <span className="text-[9px] opacity-70 ml-0.5">({count})</span>
                    )}
                  </button>

                  {/* Cross button to delete custom category with confirmation */}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryToDelete(cat);
                      }}
                      className="ml-1.5 opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity"
                      title={`Delete category / ${cat.slug}`}
                      aria-label={`Delete category ${cat.slug}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Button to Add New Category Dynamically */}
            <button
              onClick={() => setIsNewCategoryOpen(true)}
              className="tech-pill hover:bg-ink hover:text-ground font-bold text-ink"
              title="Add a new topic/category to the index"
            >
              <span>+ new category</span>
            </button>
          </div>

          {/* Grid of Concept & Code Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-ground border border-ink p-6 flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    {/* Top Row: Tag Placeholder & Read Time Placeholder */}
                    <div className="flex items-center justify-between pb-2 border-b border-ink-hairline mb-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-light border border-ink-hairline rounded-sm" />
                        <div className="h-3 w-16 bg-light border border-ink-hairline rounded-sm" />
                      </div>
                      <div className="h-3 w-14 bg-light border border-ink-hairline rounded-sm" />
                    </div>

                    {/* Title Skeleton */}
                    <div className="space-y-2 mb-4">
                      <div className="h-5 bg-light border border-ink-hairline rounded-sm w-4/5" />
                      <div className="h-5 bg-light border border-ink-hairline rounded-sm w-1/2" />
                    </div>

                    {/* Summary Skeleton */}
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-light border border-ink-hairline rounded-sm w-full" />
                      <div className="h-2.5 bg-light border border-ink-hairline rounded-sm w-11/12" />
                      <div className="h-2.5 bg-light border border-ink-hairline rounded-sm w-3/4" />
                    </div>
                  </div>

                  {/* Card Footer: Buttons Skeleton */}
                  <div className="mt-6 pt-3 border-t border-ink-hairline flex items-center justify-between">
                    <div className="h-6 w-28 bg-light border border-ink-hairline rounded-sm" />
                    <div className="h-3.5 w-16 bg-light border border-ink-hairline rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntries.map((entry) => {
                const topicCount = categoryTopicCounts[entry.categoryId] || 0;
                return (
                  <div
                    key={entry.id}
                    className="relative bg-ground border border-ink p-6 hover:shadow-brutalist transition-all duration-150 flex flex-col justify-between group"
                  >
                    {/* Top Row: Tag, Topic Count, and Cross [X] Delete Button */}
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] mb-4 pb-2 border-b border-ink-hairline">
                        <span className="flex items-center gap-1 font-semibold text-ink">
                          <Hash className="w-3 h-3 text-ink" />
                          {entry.categoryId}
                        </span>

                        <div className="flex items-center gap-2">
                          {entry.savingsPercentage != null && (
                            <span
                              className="tech-pill text-[9px] py-0.5 px-1 bg-ink text-ground"
                              title="Claim-Check: GZIP compressed in object storage"
                            >
                              gz -{Math.max(0, Math.round(entry.savingsPercentage))}%
                            </span>
                          )}
                          <span className="text-ink-quiet">
                            {topicCount > 0 ? `${topicCount} topics` : entry.readTime}
                          </span>

                          {/* Subtle Cross (X) Delete Button with Confirmation Trigger */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEntryToDelete(entry);
                            }}
                            className="w-5 h-5 border border-transparent hover:border-ink hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-ink-quiet transition-all"
                            title="Delete this block"
                            aria-label="Delete block"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => openWorkspace(entry.categoryId)}
                        className="text-lg font-bold text-ink tracking-tight group-hover:underline cursor-pointer mb-2 font-sans"
                      >
                        {entry.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-xs text-ink-body leading-relaxed font-sans line-clamp-3">
                        {entry.summary}
                      </p>
                    </div>

                    {/* Card Footer: Quick Actions */}
                    <div className="mt-6 pt-3 border-t border-ink-hairline flex items-center justify-between font-mono text-[10px] text-ink">
                      <button
                        onClick={() => openWorkspace(entry.categoryId)}
                        className="tech-pill text-[10px] flex items-center gap-1 hover:bg-ink hover:text-ground"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Open Workspace</span>
                      </button>

                      <button
                        onClick={() => setActiveReaderEntry(entry)}
                        className="flex items-center gap-1 font-semibold hover:underline"
                      >
                        <span>quick view</span>
                        <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* "+ NEW NOTE" Card Placeholder */}
              <div
                onClick={() => setIsNewEntryOpen(true)}
                className="border border-dashed border-ink hover:border-ink p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-light hover:bg-ground transition-all group min-h-[220px]"
              >
                <div className="w-9 h-9 border border-ink flex items-center justify-center group-hover:bg-ink group-hover:text-ground transition-colors mb-3">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-ink uppercase">
                  + NEW NOTE
                </span>
                <span className="font-mono text-[11px] text-ink-quiet mt-1">
                  Add a title, notes, code, YouTube link, or PDF
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Live Real-Time Telegram Job Radar (Zero-Waste Circular FIFO Buffer) */}
        <JobRadarSection onOpenWorkspace={() => setIsJobRadarOpen(true)} />

        {/* Live Cloud Infrastructure & Storage Quota Dashboard (Bklit UI Inspired) */}
        <StorageTelemetrySection entriesCount={entries.length} />

        {/* Minimal Footer */}
        <footer className="border-t border-ink-hairline py-8 px-6 sm:px-10 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between font-mono text-[11px] text-ink-quiet gap-4">
          <div>
            RECALL BY SUNIL4224 / 2026 / ALL LOGS VERIFIED
          </div>
          <div className="flex items-center gap-4">
            <a href="#how-it-works" className="hover:text-ink">/ system-design</a>
            <a href="#github" className="hover:text-ink">/ open-source</a>
            <a href="#swagger" className="hover:text-ink">/ api-docs</a>
          </div>
        </footer>

        {/* Modal: Add New Category / Topic */}
        <NewCategoryModal
          isOpen={isNewCategoryOpen}
          onClose={() => setIsNewCategoryOpen(false)}
          onAddCategory={handleAddCategory}
        />

        {/* Modal: Add New Entry / Memory Log */}
        <NewEntryModal
          isOpen={isNewEntryOpen}
          categories={categories}
          activeCategory={activeTab}
          onClose={() => setIsNewEntryOpen(false)}
          onSubmit={handleCreateEntry}
        />

        {/* Modal: Confirm Deleting a Block (with Cross Option) */}
        <DeleteConfirmModal
          isOpen={!!entryToDelete || !!categoryToDelete}
          itemTitle={entryToDelete?.title || categoryToDelete?.name || ''}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setEntryToDelete(null);
            setCategoryToDelete(null);
          }}
        />

        {/* Modal: Quick Reader View */}
        <BlogReaderModal
          entry={activeReaderEntry}
          onClose={() => setActiveReaderEntry(null)}
          onDeleteRequest={(entry) => setEntryToDelete(entry)}
        />

        {/* Modal: Live Storage & Quota Monitor (Neon 500MB + Backblaze B2 10GB) */}
        <StorageQuotaModal
          isOpen={isStorageModalOpen}
          onClose={() => setIsStorageModalOpen(false)}
        />

        {/* Right-Side Slide-Over AI Tutor & Interview Drawer */}
        <AiTutorDrawer
          isOpen={isAiDrawerOpen}
          onClose={() => setIsAiDrawerOpen(false)}
          activeCategory={activeTab}
        />

        {/* Floating AI Tutor Quick Trigger Button */}
        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-ink text-ground hover:bg-neutral-800 border-2 border-ink shadow-brutalist px-3.5 py-2 font-mono text-xs font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5"
          title="Open AI Tutor (Ctrl+J)"
        >
          <Bot className="w-4 h-4 text-ground" />
          <span>AI TUTOR</span>
          <span className="text-[10px] opacity-70 border border-ground/40 px-1 py-0.2">Ctrl+J</span>
        </button>
      </main>
    </SmoothScrollWrapper>
  );
};

export default App;
