import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileCode,
  Upload,
  Plus,
  Search,
  Hash,
  BookOpen,
  Trash2,
  Download,
  FolderGit2,
  RefreshCw,
  X,
  Zap,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Code,
  GitBranch,
} from 'lucide-react';
import { localNotesApi, CreateNotePayload } from '@/services/localNotesApi';
import { LocalMarkdownNote } from './markdownParser';
import { NewLocalMarkdownModal } from './NewLocalMarkdownModal';
import { UploadMarkdownModal } from './UploadMarkdownModal';
import { RawMarkdownModal } from './RawMarkdownModal';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { CodeBox } from '@/components/common/CodeBox';
import { ThemeToggle } from '@/components/common/ThemeToggle';

interface GitMarkdownVaultProps {
  onBack: () => void;
  initialNoteId?: string;
}

export const GitMarkdownVault: React.FC<GitMarkdownVaultProps> = ({
  onBack,
  initialNoteId,
}) => {
  const [notes, setNotes] = useState<LocalMarkdownNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(initialNoteId || null);
  const [gitHubStatus, setGitHubStatus] = useState<{
    enabled: boolean;
    repo: string;
    branch: string;
  }>({ enabled: false, repo: 'sunil4224/recall', branch: 'main' });

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedRawNote, setSelectedRawNote] = useState<LocalMarkdownNote | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<LocalMarkdownNote | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Load notes from local disk / Vite bundle
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await localNotesApi.getNotesData();
      setNotes(data.notes);
      setGitHubStatus({
        enabled: Boolean(data.gitHubSyncEnabled),
        repo: data.gitHubRepo || 'sunil4224/recall',
        branch: data.gitHubBranch || 'main',
      });
    } catch (err: any) {
      console.error('Failed to load local markdown notes:', err);
      showNotice('Notice: using locally bundled notes from repository.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Create new .md file
  const handleCreateNote = async (payload: CreateNotePayload) => {
    try {
      const created = await localNotesApi.createNote(payload);
      showNotice(`Successfully created ${payload.title} in src/content/notes/${payload.category}/`);
      await loadNotes();
      if (created && created.id) {
        setActiveNoteId(created.id);
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Upload existing .md file
  const handleUploadFile = async (file: File, category?: string) => {
    try {
      const created = await localNotesApi.uploadFile(file, category);
      showNotice(`Uploaded ${file.name} to local repository vault!`);
      await loadNotes();
      if (created && created.id) {
        setActiveNoteId(created.id);
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Delete .md file
  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    try {
      await localNotesApi.deleteNote(noteToDelete.relativePath);
      showNotice(`Deleted ${noteToDelete.filename} from disk`);
      if (activeNoteId === noteToDelete.id) {
        setActiveNoteId(null);
      }
      setNoteToDelete(null);
      await loadNotes();
    } catch (err: any) {
      showNotice('Failed to delete note from disk: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  // Download .md file directly
  const handleDownloadNote = (note: LocalMarkdownNote) => {
    const blob = new Blob([note.rawContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = note.filename || `${note.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyRaw = (rawText: string) => {
    navigator.clipboard.writeText(rawText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.category) set.add(n.category.toLowerCase());
    });
    return Array.from(set);
  }, [notes]);

  // Filter notes by search and category
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesCat = activeCategory === 'all' || note.category.toLowerCase() === activeCategory.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        note.title.toLowerCase().includes(q) ||
        note.summary.toLowerCase().includes(q) ||
        note.explanation.toLowerCase().includes(q) ||
        note.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [notes, activeCategory, searchQuery]);

  // Currently selected note for Full Preview
  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Navigation indices for sequential reading
  const activeNoteIndex = useMemo(() => {
    if (!activeNote) return -1;
    return filteredNotes.findIndex((n) => n.id === activeNote.id);
  }, [filteredNotes, activeNote]);

  const prevNote = activeNoteIndex > 0 ? filteredNotes[activeNoteIndex - 1] : null;
  const nextNote = activeNoteIndex >= 0 && activeNoteIndex < filteredNotes.length - 1 ? filteredNotes[activeNoteIndex + 1] : null;

  // Total size on disk
  const totalDiskBytes = useMemo(() => {
    return notes.reduce((acc, n) => acc + (n.sizeBytes || new Blob([n.rawContent]).size), 0);
  }, [notes]);
  const totalDiskKb = (totalDiskBytes / 1024).toFixed(1);

  // --------------------------------------------------------------------------
  // VIEW 1: FULL PREVIEW MODE (When a card is opened)
  // Replaces the small box modal with a full-window editorial reading workspace
  // --------------------------------------------------------------------------
  if (activeNote) {
    return (
      <div className="min-h-screen bg-ground text-ink flex flex-col font-sans">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-ground border-b-2 border-ink px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Back to All Notes & Category Tag */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveNoteId(null)}
              className="tech-pill flex items-center gap-1.5 hover:bg-ink hover:text-ground font-mono text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← All Markdown Notes</span>
            </button>

            <span className="tech-pill-black font-mono text-xs">
              / {activeNote.category}
            </span>

            <span className="tech-pill font-mono text-xs text-ink-quiet hidden sm:inline">
              {activeNote.readTime}
            </span>

            <span className="tech-pill text-[10px] bg-neutral-900 text-neutral-100 font-mono hidden md:inline">
              lang: {activeNote.codeLanguage}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <ThemeToggle />

            <button
              onClick={() => handleCopyRaw(activeNote.rawContent)}
              className="tech-pill hover:bg-ink hover:text-ground flex items-center gap-1"
              title="Copy raw markdown content"
            >
              {copiedRaw ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRaw ? 'Copied' : 'Copy MD'}</span>
            </button>

            <button
              onClick={() => handleDownloadNote(activeNote)}
              className="tech-pill hover:bg-ink hover:text-ground flex items-center gap-1"
              title="Download .md file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={() => setSelectedRawNote(activeNote)}
              className="tech-pill hover:bg-ink hover:text-ground flex items-center gap-1"
              title="View raw markdown with line numbers"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Raw Source</span>
            </button>

            <button
              onClick={() => setNoteToDelete(activeNote)}
              className="tech-pill hover:bg-red-50 hover:border-red-600 hover:text-red-600 flex items-center gap-1 text-ink-quiet"
              title="Delete this file"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              onClick={onBack}
              className="w-7 h-7 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors ml-1"
              title="Exit to Main App"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 2-Column Layout: Sidebar with Topics + Main Reading Pane */}
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
          {/* Left Sidebar: Notes Navigator */}
          <aside className="w-full md:w-80 border-b-2 md:border-b-0 md:border-r-2 border-ink p-4 sm:p-6 bg-ground flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4 font-mono text-xs">
                <span className="font-bold uppercase text-ink">
                  VAULT NOTES ({filteredNotes.length})
                </span>
                <span className="text-ink-quiet">LOCAL REPO</span>
              </div>

              {/* Quick Search */}
              <div className="flex items-center border border-ink bg-ground px-2.5 py-1.5 mb-4">
                <Search className="w-3.5 h-3.5 text-ink-quiet mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="filter list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent font-mono text-xs text-ink focus:outline-none placeholder:text-ink-quiet"
                />
              </div>

              {/* Note Item List */}
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {filteredNotes.map((note) => {
                  const isActive = note.id === activeNote.id;
                  return (
                    <button
                      key={note.id}
                      onClick={() => setActiveNoteId(note.id)}
                      className={`w-full text-left p-2.5 border transition-all text-xs font-mono flex flex-col gap-1 ${
                        isActive
                          ? 'bg-ink text-ground border-ink shadow-brutalist'
                          : 'border-transparent hover:border-ink hover:bg-light text-ink'
                      }`}
                    >
                      <div className="font-bold text-xs font-sans line-clamp-1">
                        {note.title}
                      </div>
                      <div className="flex items-center justify-between text-[10px] opacity-75">
                        <span>/ {note.category}</span>
                        <span>{note.readTime}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer Action */}
            <div className="pt-4 border-t border-ink-hairline mt-4">
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="w-full bg-ink text-ground hover:bg-neutral-800 p-2 font-mono text-xs font-bold border border-ink flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ NEW NOTE</span>
              </button>
            </div>
          </aside>

          {/* Main Reading Pane: Full Editorial Preview */}
          <main className="flex-1 p-6 sm:p-12 overflow-y-auto">
            {/* File Path Breadcrumb */}
            <div className="font-mono text-xs text-ink-quiet mb-3 flex items-center gap-2">
              <FolderGit2 className="w-3.5 h-3.5 text-ink" />
              <code className="bg-light px-2 py-0.5 border border-ink-hairline text-ink">
                frontend/src/content/notes/{activeNote.relativePath}
              </code>
            </div>

            {/* Note Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight font-sans leading-tight mb-4">
              {activeNote.title}
            </h1>

            {/* Summary Callout Block */}
            {activeNote.summary && (
              <div className="my-6 text-sm sm:text-base text-ink font-sans leading-relaxed border-l-4 border-ink pl-4 py-1 italic bg-light/50">
                {activeNote.summary}
              </div>
            )}

            {/* Detailed Explanation */}
            <div className="my-8 pt-6 border-t border-ink-hairline text-ink font-sans text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
              {activeNote.explanation}
            </div>

            {/* Code Box */}
            {activeNote.codeSnippet && (
              <div className="my-8">
                <div className="flex items-center justify-between font-mono text-xs mb-2">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" />
                    <span>Implementation Snippet</span>
                  </span>
                  <span className="tech-pill text-[10px]">
                    {activeNote.codeLanguage || 'code'}
                  </span>
                </div>
                <CodeBox
                  code={activeNote.codeSnippet}
                  language={activeNote.codeLanguage || 'java'}
                  filename={activeNote.filename}
                />
              </div>
            )}

            {/* Sequential Prev/Next Reading Footer */}
            <div className="mt-12 pt-6 border-t-2 border-ink flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              {prevNote ? (
                <button
                  onClick={() => setActiveNoteId(prevNote.id)}
                  className="tech-pill flex items-center gap-1.5 hover:bg-ink hover:text-ground text-left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">Prev: {prevNote.title}</span>
                </button>
              ) : (
                <div />
              )}

              {nextNote ? (
                <button
                  onClick={() => setActiveNoteId(nextNote.id)}
                  className="tech-pill flex items-center gap-1.5 hover:bg-ink hover:text-ground text-right"
                >
                  <span className="line-clamp-1">Next: {nextNote.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </main>
        </div>

        {/* Modals */}
        <NewLocalMarkdownModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={handleCreateNote}
          existingCategories={categories}
        />

        <RawMarkdownModal
          note={selectedRawNote}
          onClose={() => setSelectedRawNote(null)}
        />

        <DeleteConfirmModal
          isOpen={!!noteToDelete}
          itemTitle={noteToDelete?.filename || noteToDelete?.title || ''}
          onConfirm={handleConfirmDelete}
          onCancel={() => setNoteToDelete(null)}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VIEW 2: GRID OVERVIEW (Full-Page Native Scroll)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-ground text-ink flex flex-col font-sans">
      {/* Top Banner Notice */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 border font-mono text-xs shadow-brutalist flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-neutral-900 text-neutral-100 border-ink'
              : 'bg-red-50 text-red-700 border-red-500'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-6 sm:px-10 py-6 flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-ink-hairline gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs mb-2">
              <span className="tech-pill-black flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>GIT-BACKED MARKDOWN VAULT</span>
              </span>
              <span className="tech-pill text-[10px] text-green-700 border-green-600 bg-green-50 flex items-center gap-1">
                <Zap className="w-3 h-3 text-green-600" />
                <span>ZERO-DB (0.00 CU-hrs)</span>
              </span>
              <span className="text-ink-quiet text-[11px] hidden sm:inline">
                frontend/src/content/notes/
              </span>
              {gitHubStatus.enabled ? (
                <span
                  className="tech-pill bg-purple-900 text-purple-100 border-purple-500 font-mono text-[10px] flex items-center gap-1 shadow-xs"
                  title={`Live GitOps: Commits directly to https://github.com/${gitHubStatus.repo} (${gitHubStatus.branch})`}
                >
                  <GitBranch className="w-3 h-3 text-purple-300" />
                  <span>GITHUB AUTO-COMMIT: ON ({gitHubStatus.repo})</span>
                </span>
              ) : (
                <span
                  className="tech-pill font-mono text-[10px] text-ink-quiet flex items-center gap-1"
                  title="Add GITHUB_TOKEN to backend/.env to auto-commit directly to GitHub"
                >
                  <GitBranch className="w-3 h-3" />
                  <span>GIT AUTO-COMMIT: READY</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans">
              Local Markdown Notes Engine
            </h1>
            <p className="text-xs sm:text-sm text-ink-body font-sans mt-1">
              Pure local filesystem vault. Drop or create <code className="bg-light px-1 border border-ink-hairline text-ink">.md</code> files directly in the codebase—no Neon database connection, no Backblaze B2, completely offline capable.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 font-mono text-xs shrink-0">
            <ThemeToggle />

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="bg-ink text-ground hover:bg-neutral-800 px-4 py-2 font-bold border border-ink flex items-center gap-1.5 shadow-brutalist transition-transform active:translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>NEW NOTE</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="tech-pill hover:bg-ink hover:text-ground px-3.5 py-2 flex items-center gap-1.5 font-semibold"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>UPLOAD .MD</span>
            </button>

            <button
              onClick={loadNotes}
              className="tech-pill hover:bg-ink hover:text-ground p-2"
              title="Refresh local files"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onBack}
              className="w-8 h-8 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors ml-2"
              title="Return to Main Memory Logs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* System Telemetry & Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 font-mono text-xs">
          <div className="p-3 border border-ink bg-light">
            <div className="text-ink-quiet text-[10px] uppercase">Discovered Files</div>
            <div className="text-lg font-bold text-ink mt-0.5">{notes.length} Markdown Notes</div>
          </div>

          <div className="p-3 border border-ink bg-light">
            <div className="text-ink-quiet text-[10px] uppercase">Disk Footprint</div>
            <div className="text-lg font-bold text-ink mt-0.5">{totalDiskKb} KB on Disk</div>
          </div>

          <div className="p-3 border border-ink bg-light">
            <div className="text-ink-quiet text-[10px] uppercase">Folder Structure</div>
            <div className="text-lg font-bold text-ink mt-0.5">{categories.length} Categories</div>
          </div>

          <div className="p-3 border border-ink bg-light">
            <div className="text-ink-quiet text-[10px] uppercase">Storage Mode</div>
            <div className="text-lg font-bold text-green-700 mt-0.5 flex items-center gap-1">
              <span>Local Git Repo</span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Navigation */}
        <div className="space-y-4 mb-8">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-quiet" />
            <input
              type="text"
              placeholder="Search local markdown notes by title, concept, code, or explanation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ground border border-ink pl-10 pr-10 py-2.5 font-mono text-xs text-ink focus:outline-hidden focus:ring-1 focus:ring-ink"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-quiet hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 border transition-all ${
                activeCategory === 'all'
                  ? 'bg-ink text-ground border-ink font-bold'
                  : 'border-ink text-ink hover:bg-neutral-100'
              }`}
            >
              / all ({notes.length})
            </button>

            {categories.map((cat) => {
              const count = notes.filter((n) => n.category.toLowerCase() === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 border transition-all ${
                    activeCategory === cat
                      ? 'bg-ink text-ground border-ink font-bold'
                      : 'border-ink text-ink hover:bg-neutral-100'
                  }`}
                >
                  / {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-ink-quiet">
            Scanning frontend/src/content/notes/ for markdown files...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="border border-dashed border-ink p-12 text-center font-mono text-xs bg-light">
            <FileCode className="w-8 h-8 text-ink mx-auto mb-2 opacity-50" />
            <div className="font-bold text-ink">No Markdown Notes Found</div>
            <div className="text-ink-quiet mt-1">
              {searchQuery
                ? `No files match query "${searchQuery}".`
                : 'Create a new .md file or drop one in frontend/src/content/notes/.'}
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="bg-ink text-ground px-4 py-2 font-bold border border-ink"
              >
                + CREATE NOTE
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="tech-pill px-4 py-2"
              >
                UPLOAD FILE
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className="relative bg-ground border border-ink p-6 hover:shadow-brutalist transition-all duration-150 flex flex-col justify-between group cursor-pointer"
              >
                {/* Top Row: Category, Read time, Code Language, Delete */}
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] mb-3 pb-2 border-b border-ink-hairline">
                    <span className="flex items-center gap-1 font-semibold text-ink">
                      <Hash className="w-3 h-3 text-ink" />
                      {note.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="tech-pill text-[9px] py-0.5 px-1 bg-neutral-900 text-neutral-100 font-mono">
                        {note.codeLanguage}
                      </span>
                      <span className="text-ink-quiet text-[10px]">{note.readTime}</span>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete(note);
                        }}
                        className="w-5 h-5 border border-transparent hover:border-ink hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-ink-quiet transition-all"
                        title="Delete .md file from repo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Relative File Path Sub-header */}
                  <div className="font-mono text-[9px] text-ink-quiet mb-2 truncate" title={note.relativePath}>
                    src/content/notes/{note.relativePath}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-ink tracking-tight group-hover:underline mb-2 font-sans">
                    {note.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-ink-body leading-relaxed font-sans line-clamp-3 mb-4">
                    {note.summary || note.explanation.slice(0, 160) + '...'}
                  </p>

                  {/* Teaser code snippet if present */}
                  {note.codeSnippet && (
                    <div className="bg-neutral-900 text-neutral-300 font-mono text-[10px] p-2 rounded-xs border border-ink/40 line-clamp-2 overflow-hidden mb-4 opacity-80">
                      <code>{note.codeSnippet.split('\n')[0]}</code>
                    </div>
                  )}
                </div>

                {/* Card Footer: Quick Actions */}
                <div className="mt-4 pt-3 border-t border-ink-hairline flex items-center justify-between font-mono text-[10px] text-ink">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNoteId(note.id);
                    }}
                    className="tech-pill text-[10px] flex items-center gap-1 hover:bg-ink hover:text-ground font-semibold"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Full Preview</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRawNote(note);
                      }}
                      className="hover:underline text-ink-quiet hover:text-ink flex items-center gap-0.5"
                      title="View raw markdown source"
                    >
                      <FileCode className="w-3 h-3" />
                      <span>raw</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadNote(note);
                      }}
                      className="hover:underline text-ink-quiet hover:text-ink flex items-center gap-0.5"
                      title="Download .md file"
                    >
                      <Download className="w-3 h-3" />
                      <span>.md</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* "+ NEW MARKDOWN NOTE" Card Placeholder */}
            <div
              onClick={() => setIsNewModalOpen(true)}
              className="border border-dashed border-ink hover:border-ink p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-light hover:bg-ground transition-all group min-h-[220px]"
            >
              <div className="w-9 h-9 border border-ink flex items-center justify-center group-hover:bg-ink group-hover:text-ground transition-colors mb-3">
                <Plus className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs font-bold text-ink uppercase">
                + NEW MARKDOWN NOTE
              </span>
              <span className="font-mono text-[11px] text-ink-quiet mt-1">
                Save directly to frontend/src/content/notes/
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-10 pb-6 border-t border-ink-hairline flex flex-col sm:flex-row items-center justify-between font-mono text-[11px] text-ink-quiet gap-4">
          <div>
            GIT-BACKED VAULT // 100% REPO-STORED // 0 CU-HOURS CONSUMED
          </div>
          <button
            onClick={onBack}
            className="tech-pill hover:bg-ink hover:text-ground text-xs font-mono"
          >
            ← Return to Main Memory Logs
          </button>
        </footer>
      </div>

      {/* Form Modal: Create new .md file */}
      <NewLocalMarkdownModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateNote}
        existingCategories={categories}
      />

      {/* Upload Modal: Drag & drop .md file */}
      <UploadMarkdownModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadFile}
        existingCategories={categories}
      />

      {/* Raw Markdown Viewer Modal */}
      <RawMarkdownModal
        note={selectedRawNote}
        onClose={() => setSelectedRawNote(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!noteToDelete}
        itemTitle={noteToDelete?.filename || noteToDelete?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
};
