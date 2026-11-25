import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, Plus, Check, Video, FileText, Image as ImageIcon, 
  Code, Trash2, Edit3, Eye, ExternalLink, Search
} from 'lucide-react';
import { Category, TopicContent } from '@/types';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { CodeBox } from '@/components/common/CodeBox';

interface CategoryWorkspaceProps {
  category: Category;
  topics: TopicContent[];
  onBack: () => void;
  onSaveTopic: (topic: TopicContent) => Promise<TopicContent | void>;
  onDeleteTopic: (topicId: string) => void;
}

// Helper to convert strictly validated standard YouTube links to embeddable URLs
const convertToYouTubeEmbed = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  const match = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?].*)?$/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return '';
};

/**
 * CategoryWorkspace
 * 
 * Full-Window Documentation & Blog Reader/Editor (W3Schools / GitBook style)
 * - Exact Koval SEO aesthetic (paper white ground, 16px dot-matrix raster, Space Mono & Instrument Sans)
 * - Left Sidebar: Ordered topic navigation (Spring IoC, DI, Bean Lifecycle...)
 * - Main Pane: Interactive reader & live modular editor (Text, Code, YouTube, Diagrams, Drive PDFs)
 * - Smooth transition from the home index
 */
export const CategoryWorkspace: React.FC<CategoryWorkspaceProps> = ({
  category,
  topics,
  onBack,
  onSaveTopic,
  onDeleteTopic,
}) => {
  const [activeTopicId, setActiveTopicId] = useState<string>(topics[0]?.id || '1');
  const [searchTopic, setSearchTopic] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<TopicContent | null>(null);

  // Active topic data
  const currentTopic = topics.find((t) => t.id === activeTopicId) || topics[0];

  // Editable draft state
  const [draftTitle, setDraftTitle] = useState(currentTopic?.topicTitle || '');
  const [draftSummary, setDraftSummary] = useState(currentTopic?.summary || '');
  const [draftExplanation, setDraftExplanation] = useState(currentTopic?.explanation || '');
  const [draftCodeLang, setDraftCodeLang] = useState(currentTopic?.codeLanguage || 'java');
  const [draftCode, setDraftCode] = useState(currentTopic?.codeSnippet || '');
  const [draftYoutube, setDraftYoutube] = useState(currentTopic?.youtubeUrl || '');
  const [draftImage, setDraftImage] = useState(currentTopic?.imageUrl || '');
  const [draftDrivePdf, setDraftDrivePdf] = useState(currentTopic?.drivePdfUrl || '');
  const [draftPdfName, setDraftPdfName] = useState(currentTopic?.pdfName || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync draft when topic changes
  const handleSelectTopic = (topic: TopicContent) => {
    setActiveTopicId(topic.id);
    setDraftTitle(topic.topicTitle);
    setDraftSummary(topic.summary);
    setDraftExplanation(topic.explanation);
    setDraftCodeLang(topic.codeLanguage || 'java');
    setDraftCode(topic.codeSnippet || '');
    setDraftYoutube(topic.youtubeUrl || '');
    setDraftImage(topic.imageUrl || '');
    setDraftDrivePdf(topic.drivePdfUrl || '');
    setDraftPdfName(topic.pdfName || '');
    setIsEditing(false);
    setSaveSuccess(false);
  };

  // Start new topic creation with a temporary ID prefixed with "new-"
  const handleCreateNewTopic = async () => {
    const tempId = `new-${Date.now()}`;
    const newTopic: TopicContent = {
      id: tempId,
      categoryId: category.slug,
      topicTitle: 'New Topic Title',
      summary: '1-2 sentence overview of this topic.',
      explanation: 'Write your detailed notes, interview talking points, or explanation here...',
      codeLanguage: 'java',
      codeSnippet: '// Write your code snippet here...',
      readTime: '3 min read',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    handleSelectTopic(newTopic);
    setIsEditing(true);
    const saved = await onSaveTopic(newTopic);
    if (saved) {
      setActiveTopicId(saved.id);
    }
  };

  // Save changes
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTopic) return;

    const embedUrl = convertToYouTubeEmbed(draftYoutube);

    const updated: TopicContent = {
      ...currentTopic,
      topicTitle: draftTitle.trim() || 'Untitled Topic',
      summary: draftSummary.trim(),
      explanation: draftExplanation.trim(),
      codeLanguage: draftCodeLang,
      codeSnippet: draftCode.trim(),
      youtubeUrl: draftYoutube.trim() || undefined,
      youtubeEmbedUrl: embedUrl || undefined,
      imageUrl: draftImage.trim() || undefined,
      drivePdfUrl: draftDrivePdf.trim() || undefined,
      pdfName: draftPdfName.trim() || (draftDrivePdf ? 'Reference-Document.pdf' : undefined),
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const saved = await onSaveTopic(updated);
    if (saved) {
      setActiveTopicId(saved.id);
    }
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Filter topics in sidebar
  const filteredTopics = topics.filter((t) =>
    t.topicTitle.toLowerCase().includes(searchTopic.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-ground text-ink flex flex-col font-sans">
      {/* Top Technical Workspace Header (Koval SEO Style) */}
      <header className="sticky top-0 z-40 bg-ground border-b-2 border-ink px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back to Index & Category Tag */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="tech-pill flex items-center gap-1.5 hover:bg-ink hover:text-ground font-mono text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Memory Logs</span>
          </button>

          <span className="tech-pill-black font-mono text-xs">
            / {category.slug}
          </span>

          <span className="font-mono text-xs text-ink-quiet hidden sm:inline">
            W3Schools-Style Interactive Notebook
          </span>
        </div>

        {/* Right: Theme Toggle, Mode Toggle & Add Topic */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Brutalist Minimal Theme Toggle */}
          <ThemeToggle />

          {saveSuccess && (
            <span className="text-green-700 font-semibold flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Saved to Index!</span>
            </span>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`tech-pill flex items-center gap-1.5 ${
              isEditing ? 'bg-ink text-ground' : 'hover:bg-light'
            }`}
          >
            {isEditing ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Mode</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit / Write Mode</span>
              </>
            )}
          </button>

          <button
            onClick={handleCreateNewTopic}
            className="bg-ink text-ground px-3 py-1.5 font-semibold hover:bg-neutral-800 transition-colors border border-ink flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ next topic</span>
          </button>
        </div>
      </header>

      {/* Workspace Body: 2-Column Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Left Sidebar: W3Schools Topics Index */}
        <aside className="w-full md:w-80 border-b-2 md:border-b-0 md:border-r-2 border-ink p-4 sm:p-6 bg-ground flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-ink-hairline mb-4 font-mono text-xs">
              <span className="font-bold uppercase text-ink">
                TOPICS ({topics.length})
              </span>
              <span className="text-ink-quiet">INDEX CHRONOLOGY</span>
            </div>

            {/* Topic Search Input */}
            <div className="flex items-center border border-ink bg-ground px-2.5 py-1.5 mb-4">
              <Search className="w-3.5 h-3.5 text-ink-quiet mr-2" />
              <input
                type="text"
                placeholder="search topic..."
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                className="w-full bg-transparent font-mono text-xs text-ink focus:outline-none placeholder:text-ink-quiet"
              />
            </div>

            {/* Topic Navigation List */}
            <nav className="space-y-1 overflow-y-auto max-h-[60vh] pr-1">
              {filteredTopics.map((topic, index) => {
                const isSelected = topic.id === activeTopicId;
                return (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    className={`group flex items-center justify-between p-2.5 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-ink bg-ink text-ground shadow-brutalist-sm font-semibold'
                        : 'border-transparent hover:border-ink hover:bg-light text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate font-mono text-xs">
                      <span className={isSelected ? 'text-ground' : 'text-ink-quiet'}>
                        {index + 1}.
                      </span>
                      <span className="truncate">{topic.topicTitle}</span>
                    </div>

                    {/* Delete button on topic */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTopicToDelete(topic);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity ${
                        isSelected ? 'text-ground' : 'text-ink-quiet'
                      }`}
                      title="Delete topic"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Action */}
          <div className="pt-4 border-t border-ink-hairline mt-6">
            <button
              onClick={handleCreateNewTopic}
              className="w-full tech-pill justify-center hover:bg-ink hover:text-ground py-2 font-mono text-xs font-semibold"
            >
              + Add Next Topic Lesson
            </button>
          </div>
        </aside>

        {/* Main Document & Blog Editor Pane */}
        <main className="flex-1 p-6 sm:p-10 bg-ground overflow-y-auto">
          {currentTopic ? (
            isEditing ? (
              /* ================= EDIT MODE: MODULAR WRITING CANVAS ================= */
              <form onSubmit={handleSaveDraft} className="max-w-3xl space-y-6">
                <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
                  <div>
                    <span className="tech-pill-black text-[10px] px-2 py-0.5">
                      EDITING LESSON
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
                      Edit "{currentTopic.topicTitle}"
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="tech-pill text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-ink text-ground px-5 py-2 font-mono text-xs font-semibold hover:bg-neutral-800 transition-colors border border-ink"
                    >
                      Save Topic
                    </button>
                  </div>
                </div>

                {/* Title & Summary */}
                <div>
                  <label className="block font-mono text-xs uppercase font-semibold text-ink mb-1">
                    Topic Title *
                  </label>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="w-full bg-ground border-2 border-ink p-2.5 font-sans text-base font-bold text-ink focus:outline-none"
                    placeholder="e.g. Spring IoC & Dependency Injection Explained"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase font-semibold text-ink mb-1">
                    Summary / Key Takeaway
                  </label>
                  <input
                    type="text"
                    value={draftSummary}
                    onChange={(e) => setDraftSummary(e.target.value)}
                    className="w-full bg-ground border border-ink p-2 font-sans text-xs text-ink focus:outline-none"
                    placeholder="Short 1-2 sentence core concept summary"
                  />
                </div>

                {/* Detailed Concept Explanation */}
                <div>
                  <label className="block font-mono text-xs uppercase font-semibold text-ink mb-1">
                    Detailed Blog Notes / Explanation (Markdown supported)
                  </label>
                  <textarea
                    rows={8}
                    value={draftExplanation}
                    onChange={(e) => setDraftExplanation(e.target.value)}
                    className="w-full bg-ground border border-ink p-3 font-sans text-sm text-ink focus:outline-none leading-relaxed"
                    placeholder="Write your lesson notes step by step..."
                  />
                </div>

                {/* Modular Option: Code Block */}
                <div className="border-2 border-ink p-4 bg-light">
                  <div className="flex items-center justify-between mb-2 font-mono text-xs">
                    <span className="font-semibold text-ink flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5" />
                      <span>CODE BOX</span>
                    </span>
                    <select
                      value={draftCodeLang}
                      onChange={(e) => setDraftCodeLang(e.target.value)}
                      className="bg-ground border border-ink text-xs px-2 py-0.5 focus:outline-none"
                    >
                      <option value="java">Java</option>
                      <option value="typescript">TypeScript</option>
                      <option value="sql">SQL</option>
                      <option value="python">Python</option>
                      <option value="bash">Bash</option>
                      <option value="dockerfile">Dockerfile</option>
                    </select>
                  </div>
                  <textarea
                    rows={5}
                    value={draftCode}
                    onChange={(e) => setDraftCode(e.target.value)}
                    className="w-full bg-ground border border-ink p-3 font-mono text-xs text-ink focus:outline-none leading-relaxed"
                    placeholder="// Paste formatted code here..."
                  />

                  {draftCode.trim() && (
                    <div className="mt-3">
                      <span className="font-mono text-[10px] text-ink-quiet uppercase tracking-wider block mb-1">
                        Live VS Code Preview:
                      </span>
                      <CodeBox
                        code={draftCode}
                        language={draftCodeLang}
                        filename={`preview.${draftCodeLang}`}
                      />
                    </div>
                  )}
                </div>

                {/* Modular Options: Media URLs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  {/* YouTube */}
                  <div>
                    <label className="flex items-center gap-1 text-ink uppercase font-semibold mb-1">
                      <Video className="w-3 h-3" />
                      <span>YouTube Embed Link</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={draftYoutube}
                      onChange={(e) => setDraftYoutube(e.target.value)}
                      className="w-full bg-ground border border-ink p-2 text-xs text-ink focus:outline-none"
                    />
                  </div>

                  {/* Image */}
                  <div>
                    <label className="flex items-center gap-1 text-ink uppercase font-semibold mb-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Diagram / Image Link</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://.../diagram.png"
                      value={draftImage}
                      onChange={(e) => setDraftImage(e.target.value)}
                      className="w-full bg-ground border border-ink p-2 text-xs text-ink focus:outline-none"
                    />
                  </div>

                  {/* Drive / PDF Link */}
                  <div>
                    <label className="flex items-center gap-1 text-ink uppercase font-semibold mb-1">
                      <FileText className="w-3 h-3" />
                      <span>Google Drive / PDF URL</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://drive.google.com/..."
                      value={draftDrivePdf}
                      onChange={(e) => setDraftDrivePdf(e.target.value)}
                      className="w-full bg-ground border border-ink p-2 text-xs text-ink focus:outline-none"
                    />
                  </div>
                </div>

                {/* Save Action Bar */}
                <div className="pt-6 border-t-2 border-ink flex items-center justify-between font-mono text-xs">
                  <span className="text-ink-quiet">
                    Next day, you can reopen and continue writing or editing.
                  </span>
                  <button
                    type="submit"
                    className="bg-ink text-ground px-6 py-2.5 font-bold hover:bg-neutral-800 transition-colors border border-ink"
                  >
                    Save & Finish Editing
                  </button>
                </div>
              </form>
            ) : (
              /* ================= READ MODE: W3SCHOOLS-STYLE EDITORIAL BLOG ================= */
              <article className="max-w-3xl space-y-6">
                {/* Topic Metadata & Edit Shortcut */}
                <div className="flex items-center justify-between pb-4 border-b border-ink-hairline font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="tech-pill-black text-[11px]">
                      / {category.slug}
                    </span>
                    <span className="text-ink-quiet">
                      Updated: {currentTopic.updatedAt || 'Recent'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="tech-pill flex items-center gap-1.5 hover:bg-ink hover:text-ground text-[11px]"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit This Topic</span>
                  </button>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight font-sans leading-tight">
                  {currentTopic.topicTitle}
                </h1>

                {/* Short Summary Callout */}
                {currentTopic.summary && (
                  <div className="p-4 border-l-4 border-ink bg-light font-sans text-sm text-ink-body leading-relaxed">
                    <span className="font-bold text-ink font-mono text-xs block mb-1">
                      KEY TAKEAWAY:
                    </span>
                    {currentTopic.summary}
                  </div>
                )}

                {/* Diagram / Image (if present) */}
                {currentTopic.imageUrl && (
                  <div className="my-6 border-2 border-ink bg-light">
                    <img
                      src={currentTopic.imageUrl}
                      alt={currentTopic.topicTitle}
                      className="w-full max-h-96 object-contain p-2"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  </div>
                )}

                {/* Detailed Topic Explanation */}
                <div className="py-2 text-ink-body font-sans text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4">
                  {currentTopic.explanation}
                </div>

                {/* VS Code Syntax-Highlighted Code Box */}
                {currentTopic.codeSnippet && (
                  <CodeBox
                    code={currentTopic.codeSnippet}
                    language={currentTopic.codeLanguage || 'java'}
                    filename={`${currentTopic.categoryId}.${currentTopic.codeLanguage || 'java'}`}
                  />
                )}

                {/* Embedded YouTube Player */}
                {currentTopic.youtubeEmbedUrl && (
                  <div className="my-6">
                    <div className="flex items-center gap-1.5 font-mono text-xs uppercase font-semibold text-ink mb-2">
                      <Video className="w-3.5 h-3.5" />
                      <span>Video Explanation Walkthrough</span>
                    </div>
                    <div className="aspect-video w-full border-2 border-ink bg-black shadow-brutalist-sm">
                      <iframe
                        src={currentTopic.youtubeEmbedUrl}
                        title={currentTopic.topicTitle}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Google Drive / PDF Attachment */}
                {currentTopic.drivePdfUrl && (
                  <div className="my-6 p-4 border-2 border-ink bg-light flex items-center justify-between font-mono text-xs shadow-brutalist-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-ink" />
                      <div>
                        <span className="font-bold text-ink block">
                          {currentTopic.pdfName || 'Reference Documentation / PDF Cheatsheet'}
                        </span>
                        <span className="text-[10px] text-ink-quiet">Google Drive / Attached File</span>
                      </div>
                    </div>
                    <a
                      href={currentTopic.drivePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tech-pill-black flex items-center gap-1.5 text-[11px]"
                    >
                      <span>Open Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Next / Previous Topic Navigation (Like W3Schools) */}
                <div className="mt-12 pt-8 border-t-2 border-ink flex items-center justify-between font-mono text-xs">
                  <button
                    onClick={() => {
                      const currentIndex = topics.findIndex((t) => t.id === activeTopicId);
                      if (currentIndex > 0) handleSelectTopic(topics[currentIndex - 1]);
                    }}
                    disabled={topics.findIndex((t) => t.id === activeTopicId) <= 0}
                    className="tech-pill disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous Lesson</span>
                  </button>

                  <button
                    onClick={() => {
                      const currentIndex = topics.findIndex((t) => t.id === activeTopicId);
                      if (currentIndex < topics.length - 1) handleSelectTopic(topics[currentIndex + 1]);
                    }}
                    disabled={topics.findIndex((t) => t.id === activeTopicId) >= topics.length - 1}
                    className="tech-pill-black disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <span>Next Lesson</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            )
          ) : (
            <div className="text-center py-20 font-mono text-sm text-ink-quiet">
              No topics in this category yet. Click "+ next topic" to start writing!
            </div>
          )}
        </main>
      </div>

      {/* Delete Topic Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!topicToDelete}
        itemTitle={topicToDelete?.topicTitle || ''}
        onConfirm={() => {
          if (topicToDelete) {
            const deletedId = topicToDelete.id;
            onDeleteTopic(deletedId);
            setTopicToDelete(null);
            const remaining = topics.filter((t) => t.id !== deletedId);
            if (remaining.length > 0) {
              handleSelectTopic(remaining[0]);
            } else {
              setActiveTopicId('');
            }
          }
        }}
        onCancel={() => setTopicToDelete(null)}
      />
    </div>
  );
};
