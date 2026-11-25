// ==============================================================================
// ReCall by sunil4224 – Local Markdown Vault Service (Zero-DB / Local Disk)
// ==============================================================================

import axios from 'axios';
import { LocalMarkdownNote, loadBundledNotes } from '../features/markdownVault/markdownParser';

const RAW_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
const CLEAN_API_BASE = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;
const API_BASE_URL = `${CLEAN_API_BASE}/local-notes`;

export interface CreateNotePayload {
  title: string;
  category: string;
  summary: string;
  explanation: string;
  codeSnippet: string;
  codeLanguage: string;
  readTime: string;
  youtubeUrl?: string;
}

export interface LocalNotesDataResponse {
  notes: LocalMarkdownNote[];
  gitHubSyncEnabled?: boolean;
  gitHubRepo?: string;
  gitHubBranch?: string;
}

export const localNotesApi = {
  /**
   * Fetch all local notes and GitHub sync status from backend (Zero-DB),
   * with automatic fallback to Vite statically bundled notes.
   */
  async getNotesData(): Promise<LocalNotesDataResponse> {
    try {
      const res = await axios.get(API_BASE_URL, { timeout: 3000 });
      if (res.data && Array.isArray(res.data.notes)) {
        const fetchedNotes = res.data.notes;
        const finalNotes = fetchedNotes.length > 0 ? fetchedNotes : loadBundledNotes();
        return {
          notes: finalNotes,
          gitHubSyncEnabled: Boolean(res.data.gitHubSyncEnabled),
          gitHubRepo: res.data.gitHubRepo || 'sunilkumar4545/ReCall',
          gitHubBranch: res.data.gitHubBranch || 'main',
        };
      }
    } catch (err) {
      console.warn('Backend /api/local-notes not responding; using Vite bundled notes.', err);
    }
    // Fallback: Vite static discovery
    return {
      notes: loadBundledNotes(),
      gitHubSyncEnabled: false,
      gitHubRepo: 'sunilkumar4545/ReCall',
      gitHubBranch: 'main',
    };
  },

  async getNotes(): Promise<LocalMarkdownNote[]> {
    const data = await this.getNotesData();
    return data.notes;
  },

  /**
   * Save a note as a `.md` file in `frontend/src/content/notes/<category>/<slug>.md`
   */
  async createNote(payload: CreateNotePayload): Promise<LocalMarkdownNote> {
    const res = await axios.post(API_BASE_URL, payload);
    return res.data;
  },

  /**
   * Upload an existing `.md` file directly to the repo
   */
  async uploadFile(file: File, category?: string): Promise<LocalMarkdownNote> {
    const formData = new FormData();
    formData.append('file', file);
    if (category) {
      formData.append('category', category);
    }
    const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Delete a local `.md` file from the repo disk
   */
  async deleteNote(relativePath: string): Promise<void> {
    await axios.delete(API_BASE_URL, {
      params: { path: relativePath },
    });
  },
};
