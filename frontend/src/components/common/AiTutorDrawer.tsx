import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, BookOpen, RefreshCw, Terminal, Check, Copy, Cpu } from 'lucide-react';
import { api } from '@/services/api';
import { AiChatMessage, AiTokenStats } from '@/types';

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory?: string;
}

const QUICK_PROMPTS = [
  'Quiz me on my saved notes',
  'Explain Sliding Window algorithm',
  'System Design interview checklist',
  'Whiteboard problem: Two Sum edge cases',
];

export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  isOpen,
  onClose,
  activeCategory,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "**Hello! I'm your ReCall AI Interview Tutor.**\n\nI can quiz you on your saved notes, explain coding concepts, walk through system design trade-offs, and help you prepare for technical interviews.\n\nAsk me anything or click one of the quick prompts below!",
      modelUsed: 'gemini-3.5-flash / groq-120b',
      provider: 'Dual-Engine',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tokenStats, setTokenStats] = useState<AiTokenStats>({
    totalTokensUsed: 0,
    tokenLimit: 1000000,
    usagePercentage: 0,
    tokensRemaining: 1000000,
    totalQueries: 0,
  });
  const chatFeedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync token metrics on open
  useEffect(() => {
    if (isOpen) {
      api.getAiTokenStats()
        .then((stats) => {
          if (stats) setTokenStats(stats);
        })
        .catch((err) => console.warn('Could not fetch initial token telemetry:', err));
    }
  }, [isOpen]);

  // Auto-scroll inside the chat container ONLY (never affects parent page)
  useEffect(() => {
    if (isOpen && chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle Send Message
  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: AiChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build lightweight conversation history
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.aiChat({
        message: textToSend,
        history,
        categorySlug: activeCategory !== 'all' ? activeCategory : undefined,
      });

      const assistantMessage: AiChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        modelUsed: res.modelUsed,
        provider: res.provider,
        referencedNotes: res.referencedNotes,
        promptTokens: res.promptTokens,
        completionTokens: res.completionTokens,
        messageTokens: res.messageTokens,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (res.totalTokensUsed != null) {
        setTokenStats({
          totalTokensUsed: res.totalTokensUsed,
          tokenLimit: res.tokenLimit || 1000000,
          usagePercentage: res.usagePercentage || 0,
          tokensRemaining: res.tokensRemaining != null ? res.tokensRemaining : 1000000 - res.totalTokensUsed,
          totalQueries: tokenStats.totalQueries + 1,
        });
      }
    } catch (err: any) {
      console.error('AI Tutor request failed:', err);
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      const errorContent = isTimeout
        ? "⏱️ **The AI tutor took longer than expected to synthesize the answer.**\n\nPlease try asking again or select one of the quick prompts above."
        : `⚠️ **Could not connect to AI Tutor.**\n\n${err?.response?.data?.detail || err?.message || 'Please check that the Spring Boot backend is active on http://localhost:8080.'}`;

      const errorMessage: AiChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        modelUsed: 'offline',
        provider: 'System',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 overflow-hidden flex justify-end"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Pane */}
      <div
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className="relative z-10 w-full sm:w-[460px] md:w-[500px] bg-ground border-l-2 border-ink h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overscroll-contain"
      >
        
        {/* Header Bar */}
        <div className="p-4 border-b border-ink flex items-center justify-between bg-ground">
          <div className="flex items-center gap-2">
            <span className="tech-pill-black text-[10px] px-2 py-0.5 flex items-center gap-1">
              <Bot className="w-3 h-3" />
              <span>RECALL AI TUTOR</span>
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-green-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>LIVE RAG</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setMessages([
                  {
                    id: 'reset',
                    role: 'assistant',
                    content: 'Chat history cleared. What topic or problem would you like to review now?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              className="tech-pill text-[10px] hover:bg-light"
              title="Clear conversation"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 border border-ink flex items-center justify-center hover:bg-ink hover:text-ground transition-colors"
              aria-label="Close AI Tutor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Token & Quota Monitor (Bklit UI Inspired 0-100% Meter) */}
        <div className="px-4 py-2.5 border-b border-ink bg-ground font-mono text-[10px]">
          <div className="flex items-center justify-between text-ink mb-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <Cpu className="w-3.5 h-3.5 text-ink" />
              <span>AI TOKEN METER</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink font-semibold">
                {tokenStats.totalTokensUsed.toLocaleString()} / {tokenStats.tokenLimit.toLocaleString()}
              </span>
              <span className="tech-pill text-[9px] px-1 py-0.2 bg-light">
                {tokenStats.usagePercentage}% used
              </span>
            </div>
          </div>

          {/* Bklit Segmented / Percentage Bar */}
          <div className="w-full bg-light h-2 border border-ink overflow-hidden p-0.5">
            <div
              className="bg-ink h-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(tokenStats.totalTokensUsed > 0 ? 1 : 0, tokenStats.usagePercentage))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-ink-quiet mt-1.5">
            <span>
              <strong className="text-ink">{tokenStats.tokensRemaining.toLocaleString()}</strong> tokens left
            </span>
            <span className="text-green-600 font-bold uppercase">
              {tokenStats.totalQueries} Queries / 100% Free
            </span>
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-3 py-2 border-b border-ink-hairline bg-light/30 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          <Sparkles className="w-3 h-3 text-ink shrink-0 ml-1 mr-0.5" />
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="tech-pill text-[10px] whitespace-nowrap hover:bg-ink hover:text-ground shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Feed */}
        <div
          ref={chatFeedRef}
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs overscroll-contain"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message Box */}
              <div
                className={`max-w-[92%] p-3.5 border border-ink leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-ink text-ground font-medium'
                    : 'bg-ground text-ink shadow-xs'
                }`}
              >
                {/* Assistant Model Tag & Token Usage */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink-hairline font-mono text-[9px] text-ink-quiet">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-2.5 h-2.5" />
                      <span>{msg.provider || 'ReCall AI'} ({msg.modelUsed || 'dual-engine'})</span>
                      {msg.messageTokens && (
                        <span className="tech-pill text-[8px] px-1 py-0 bg-light text-ink">
                          ⚡ {msg.messageTokens.toLocaleString()} tok
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-ink flex items-center gap-0.5"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-green-600" />
                          <span className="text-green-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Content with basic formatting */}
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.content}
                </div>

                {/* Referenced Notes from RAG */}
                {msg.referencedNotes && msg.referencedNotes.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-ink-hairline font-mono text-[10px]">
                    <div className="text-ink-quiet flex items-center gap-1 mb-1">
                      <BookOpen className="w-3 h-3" />
                      <span>Vault Notes Referenced:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {msg.referencedNotes.map((note, i) => (
                        <span
                          key={i}
                          className="tech-pill text-[9px] bg-light text-ink py-0.5 px-1.5"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="font-mono text-[9px] text-ink-quiet mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Loading Animation */}
          {loading && (
            <div className="flex items-start">
              <div className="p-3.5 border border-ink bg-ground text-ink font-mono text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-ink" />
                <span>querying vault & synthesizing answer...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-ink bg-ground">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border border-ink p-1.5 bg-ground focus-within:ring-1 focus-within:ring-ink"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or request a quiz..."
              className="flex-1 bg-transparent font-sans text-xs text-ink placeholder:text-ink-quiet focus:outline-none resize-none px-2 py-1 max-h-24"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-ink text-ground hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-ink p-2 font-mono text-xs transition-colors shrink-0"
              title="Send message (Enter)"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Micro Footer Notice */}
          <div className="flex items-center justify-between mt-2 font-mono text-[9px] text-ink-quiet px-1">
            <span>ZERO EXPOSED SECRETS // GROUNDED IN RECALL NOTES</span>
            <span>Ctrl + J to toggle</span>
          </div>
        </div>

      </div>
    </div>
  );
};
