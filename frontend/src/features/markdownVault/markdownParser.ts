// ==============================================================================
// ReCall by sunil4224 – Git-Backed Markdown Parser & Vite Glob Discovery
// Zero-DB / Zero-B2 Storage Fallback
// ==============================================================================

export interface LocalMarkdownNote {
  id: string;
  relativePath: string;
  filename: string;
  category: string;
  title: string;
  summary: string;
  explanation: string;
  codeSnippet: string;
  codeLanguage: string;
  readTime: string;
  youtubeUrl: string;
  sizeBytes?: number;
  lastModified?: string;
  rawContent: string;
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---/;
const EXPLANATION_REGEX = /##\s*Explanation\r?\n([\s\S]*?)(?=(##\s*Code|$))/i;
const CODE_BLOCK_REGEX = /```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/;

/**
 * Parse raw markdown content into structured LocalMarkdownNote object.
 */
export function parseMarkdownNote(raw: string, filePath = ''): LocalMarkdownNote {
  const frontmatter: Record<string, string> = {};
  const fmMatch = raw.match(FRONTMATTER_REGEX);

  if (fmMatch && fmMatch[1]) {
    const lines = fmMatch[1].split(/\r?\n/);
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        let val = line.slice(colonIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        frontmatter[key] = val;
      }
    }
  }

  // Derive relative path and filename
  const cleanPath = filePath.replace(/\\/g, '/').replace(/^\/src\/content\/notes\//, '');
  const pathParts = cleanPath.split('/');
  const filename = pathParts[pathParts.length - 1] || 'note.md';
  const inferredCategory = pathParts.length > 1 ? pathParts[0] : 'general';

  const title = frontmatter['title'] || filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
  const category = frontmatter['category'] || inferredCategory;
  const summary = frontmatter['summary'] || '';
  let codeLanguage = frontmatter['code_language'] || 'java';
  const readTime = frontmatter['read_time'] || '3 min';
  const youtubeUrl = frontmatter['youtube_url'] || '';

  // Extract explanation
  let explanation = '';
  const explMatch = raw.match(EXPLANATION_REGEX);
  if (explMatch && explMatch[1]) {
    explanation = explMatch[1].trim();
  } else {
    // Fallback: strip frontmatter and code blocks
    const stripped = raw.replace(/^---[\s\S]*?---\r?\n/, '');
    explanation = stripped.replace(/```[\s\S]*?```/g, '').trim();
  }

  // Extract code snippet
  let codeSnippet = '';
  const codeMatch = raw.match(CODE_BLOCK_REGEX);
  if (codeMatch) {
    if (codeMatch[1] && codeMatch[1].trim()) {
      codeLanguage = codeMatch[1].trim();
    }
    codeSnippet = codeMatch[2] ? codeMatch[2].trim() : '';
  }

  const id = 'local-' + (cleanPath || filename).toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    id,
    relativePath: cleanPath,
    filename,
    category,
    title,
    summary,
    explanation,
    codeSnippet,
    codeLanguage,
    readTime,
    youtubeUrl,
    sizeBytes: new Blob([raw]).size,
    rawContent: raw,
  };
}

/**
 * Format a note into standard .md content with YAML frontmatter.
 */
export function formatMarkdownNote(data: {
  title: string;
  category: string;
  summary?: string;
  explanation?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  readTime?: string;
  youtubeUrl?: string;
}): string {
  const title = (data.title || 'Untitled Note').trim();
  const category = (data.category || 'general').trim().toLowerCase();
  const summary = (data.summary || '').trim();
  const codeLanguage = (data.codeLanguage || 'java').trim();
  const readTime = (data.readTime || '3 min').trim();
  const youtubeUrl = (data.youtubeUrl || '').trim();

  let md = '---\n';
  md += `title: ${title}\n`;
  md += `category: ${category}\n`;
  md += `summary: ${summary}\n`;
  md += `code_language: ${codeLanguage}\n`;
  md += `read_time: ${readTime}\n`;
  md += `youtube_url: "${youtubeUrl}"\n`;
  md += '---\n\n';

  md += '## Explanation\n';
  md += (data.explanation && data.explanation.trim()) ? data.explanation.trim() + '\n\n' : 'No explanation provided.\n\n';

  if (data.codeSnippet && data.codeSnippet.trim()) {
    md += '## Code\n';
    md += `\`\`\`${codeLanguage}\n`;
    md += data.codeSnippet.trim() + '\n';
    md += '```\n';
  }

  return md;
}

/**
 * Static discovery via Vite's import.meta.glob:
 * Reads all `.md` files in `frontend/src/content/notes/` in real-time.
 */
export function loadBundledNotes(): LocalMarkdownNote[] {
  try {
    const globFn = (import.meta as any).glob;
    if (!globFn) return [];
    const modules = globFn('/src/content/notes/**/*.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;

    const notes: LocalMarkdownNote[] = [];
    for (const [filePath, rawContent] of Object.entries(modules)) {
      if (typeof rawContent === 'string') {
        notes.push(parseMarkdownNote(rawContent, filePath));
      }
    }
    return notes;
  } catch (err) {
    console.warn('Vite import.meta.glob notice:', err);
    return [];
  }
}
