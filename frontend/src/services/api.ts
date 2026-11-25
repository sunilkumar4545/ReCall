import axios from 'axios';

// Backend Base URL: dynamically supports Vercel / Netlify / Cloud deployments
const RAW_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
export const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  topicCount: number;
  createdAt: string;
}

export interface ApiRecallEntry {
  id: number;
  categorySlug: string;
  categoryName: string;
  title: string;
  summary: string;
  explanation: string;
  codeLanguage?: string;
  codeSnippet?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  youtubeEmbedUrl?: string;
  pdfUrl?: string;
  pdfName?: string;
  readTime: string;
  contentKey?: string;
  savingsPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StorageStats {
  neon: {
    usedBytes: number;
    limitBytes: number;
    usedFormatted: string;
    freeFormatted: string;
    limitFormatted: string;
    usagePercentage: number;
    totalEntries: number;
    totalCategories: number;
  };
  backblaze: {
    usedBytes: number;
    rawContentBytes: number;
    limitBytes: number;
    usedFormatted: string;
    rawFormatted: string;
    freeFormatted: string;
    limitFormatted: string;
    usagePercentage: number;
    savingsPercentage: number;
    totalBlobs: number;
    bucketName: string;
    storageType: string;
  };
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
}

export interface CreateEntryPayload {
  categorySlug: string;
  title: string;
  summary?: string;
  explanation?: string;
  codeLanguage?: string;
  codeSnippet?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  pdfUrl?: string;
  pdfName?: string;
}

export interface UpdateEntryPayload {
  title?: string;
  summary?: string;
  explanation?: string;
  codeLanguage?: string;
  codeSnippet?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  pdfUrl?: string;
  pdfName?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const api = {
  // Category operations
  async getCategories(): Promise<ApiCategory[]> {
    const res = await apiClient.get<ApiResponse<ApiCategory[]>>('/categories');
    return res.data.data;
  },

  async createCategory(payload: CreateCategoryPayload): Promise<ApiCategory> {
    const res = await apiClient.post<ApiResponse<ApiCategory>>('/categories', payload);
    return res.data.data;
  },

  async deleteCategory(id: number | string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },

  async deleteCategoryBySlug(slug: string): Promise<void> {
    await apiClient.delete(`/categories/slug/${slug}`);
  },

  // Entry operations
  async getEntries(categorySlug?: string): Promise<ApiRecallEntry[]> {
    const params = categorySlug && categorySlug !== 'all' ? { category: categorySlug } : {};
    const res = await apiClient.get<ApiResponse<ApiRecallEntry[]>>('/entries', { params });
    return res.data.data;
  },

  async getEntryById(id: number | string): Promise<ApiRecallEntry> {
    const res = await apiClient.get<ApiResponse<ApiRecallEntry>>(`/entries/${id}`);
    return res.data.data;
  },

  async searchEntries(q: string): Promise<ApiRecallEntry[]> {
    const res = await apiClient.get<ApiResponse<ApiRecallEntry[]>>('/entries/search', {
      params: { q },
    });
    return res.data.data;
  },

  async createEntry(payload: CreateEntryPayload): Promise<ApiRecallEntry> {
    const res = await apiClient.post<ApiResponse<ApiRecallEntry>>('/entries', payload);
    return res.data.data;
  },

  async updateEntry(id: number | string, payload: UpdateEntryPayload): Promise<ApiRecallEntry> {
    const res = await apiClient.put<ApiResponse<ApiRecallEntry>>(`/entries/${id}`, payload);
    return res.data.data;
  },

  async deleteEntry(id: number | string): Promise<void> {
    await apiClient.delete(`/entries/${id}`);
  },

  // Storage Quota Telemetry
  async getStorageStats(): Promise<StorageStats> {
    const res = await apiClient.get<ApiResponse<StorageStats>>('/storage/stats');
    return res.data.data;
  },

  // AI Tutor & Interview Assistant (RAG)
  async aiChat(payload: {
    message: string;
    history?: { role: string; content: string }[];
    categorySlug?: string;
  }): Promise<{
    reply: string;
    modelUsed: string;
    provider: string;
    referencedNotes: string[];
    timestamp: string;
    promptTokens?: number;
    completionTokens?: number;
    messageTokens?: number;
    totalTokensUsed?: number;
    tokenLimit?: number;
    usagePercentage?: number;
    tokensRemaining?: number;
  }> {
    const res = await apiClient.post<ApiResponse<{
      reply: string;
      modelUsed: string;
      provider: string;
      referencedNotes: string[];
      timestamp: string;
      promptTokens?: number;
      completionTokens?: number;
      messageTokens?: number;
      totalTokensUsed?: number;
      tokenLimit?: number;
      usagePercentage?: number;
      tokensRemaining?: number;
    }>>('/ai/chat', payload, {
      timeout: 60000, // 60s timeout buffer for LLM deep generation & RAG lookup
    });
    return res.data.data;
  },

  // AI Token Quota Telemetry
  async getAiTokenStats(): Promise<{
    totalTokensUsed: number;
    tokenLimit: number;
    usagePercentage: number;
    tokensRemaining: number;
    totalQueries: number;
  }> {
    const res = await apiClient.get<ApiResponse<{
      totalTokensUsed: number;
      tokenLimit: number;
      usagePercentage: number;
      tokensRemaining: number;
      totalQueries: number;
    }>>('/ai/tokens');
    return res.data.data;
  },

  // Job Notifications Radar (Telegram Real-Time Ingestion)
  async getJobs(params?: { query?: string; filter?: string; limit?: number }): Promise<any[]> {
    const res = await apiClient.get<ApiResponse<any[]>>('/jobs', { params });
    return res.data.data;
  },

  async getJobStats(): Promise<{
    totalJobs: number;
    maxCapacity: number;
    estimatedSizeKb: number;
    newestPostedAt?: string;
  }> {
    const res = await apiClient.get<ApiResponse<{
      totalJobs: number;
      maxCapacity: number;
      estimatedSizeKb: number;
      newestPostedAt?: string;
    }>>('/jobs/stats');
    return res.data.data;
  },

  async deleteJob(id: number | string): Promise<void> {
    await apiClient.delete(`/jobs/${id}`);
  },

  // Job Radar In-Memory Stream Gatekeeper (0 DB Queries - RAM Only)
  async getJobStreamStatus(): Promise<{
    enabled: boolean;
    mode: string;
    computeSavings: string;
  }> {
    const res = await apiClient.get<ApiResponse<{
      enabled: boolean;
      mode: string;
      computeSavings: string;
    }>>('/jobs/stream-status');
    return res.data.data;
  },

  async setJobStreamStatus(enabled: boolean): Promise<{
    enabled: boolean;
    mode: string;
    computeSavings: string;
  }> {
    const res = await apiClient.post<ApiResponse<{
      enabled: boolean;
      mode: string;
      computeSavings: string;
    }>>('/jobs/stream-status', null, {
      params: { enabled },
    });
    return res.data.data;
  },
};
