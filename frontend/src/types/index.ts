// ==============================================================================
// ReCall by sunil4224 – Core Types
// ==============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface TopicContent {
  id: string;
  categoryId: string;
  topicTitle: string;
  summary: string;
  explanation: string;
  codeLanguage?: string;
  codeSnippet?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  youtubeEmbedUrl?: string;
  drivePdfUrl?: string;
  pdfName?: string;
  updatedAt?: string;
  readTime?: string;
}

export interface RecallEntry {
  id: string;
  categoryId: string;
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
  source?: string;
  createdAt?: string;
  contentKey?: string;
  savingsPercentage?: number;
}

export interface AiTokenStats {
  totalTokensUsed: number;
  tokenLimit: number;
  usagePercentage: number;
  tokensRemaining: number;
  totalQueries: number;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  provider?: string;
  referencedNotes?: string[];
  timestamp: string;
  promptTokens?: number;
  completionTokens?: number;
  messageTokens?: number;
}

export interface AiChatRequest {
  message: string;
  history?: { role: string; content: string }[];
  categorySlug?: string;
}

export interface AiChatResponse {
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
}

export interface JobNotification {
  id: number;
  title: string;
  company?: string;
  location?: string;
  applyUrl: string;
  description?: string;
  channelTitle?: string;
  channelUsername?: string;
  postedAt?: string;
  createdAt?: string;
}

export interface JobStats {
  totalJobs: number;
  maxCapacity: number;
  estimatedSizeKb: number;
  newestPostedAt?: string;
}


