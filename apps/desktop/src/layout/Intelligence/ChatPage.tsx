import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { useNavigate } from "react-router-dom";
import { Button, TextArea } from "@radix-ui/themes";
import { ArrowUp, Eraser, Loader2, Settings, Sparkles } from "lucide-react";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";
import type { ChatMessage } from "@/stores/createChatSlice";

/** Tool name → human-readable label for the activity indicator. */
const TOOL_LABELS: Record<string, string> = {
  get_today_signals: "获取今日 Signal",
  search_signals: "搜索 Signal",
  get_signal_detail: "获取 Signal 详情",
  get_topics: "获取 Topic",
  search_topics: "搜索 Topic",
};

const SUGGESTIONS = [
  "最近有什么值得关注的？",
  "帮我搜一下 AI 相关的 Signal",
  "目前有哪些 Topic？",
];

export function ChatPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const store = useBearStore(
    useShallow((state) => ({
      chatMessages: state.chatMessages,
      chatLoading: state.chatLoading,
      chatHasApiKey: state.chatHasApiKey,
      sendMessage: state.sendMessage,
      clearChat: state.clearChat,
      checkChatConfig: state.checkChatConfig,
    })),
  );

  useEffect(() => {
    store.checkChatConfig();
  }, []);

  // Auto-scroll to bottom when messages change or while loading.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [store.chatMessages, store.chatLoading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || store.chatLoading) return;
    setInput("");
    store.sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- No API key state ---
  if (store.chatHasApiKey === false) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--app-canvas)]">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <Sparkles size={48} className="text-[var(--gray-9)]" />
          <h2 className="text-lg font-semibold">需要配置 AI</h2>
          <p className="text-sm text-[var(--gray-10)]">
            问答助手需要一个兼容 OpenAI 的 API Key 才能工作。请先在设置中配置。
          </p>
          <Button onClick={() => navigate(RouteConfig.SETTINGS)}>
            <Settings size={16} />
            前往设置
          </Button>
        </div>
      </div>
    );
  }

  const hasMessages = store.chatMessages.length > 0;

  return (
    <div className="flex h-full w-full flex-col bg-[var(--app-canvas)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--gray-4)] px-6 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--accent-9)]" />
          <span className="text-sm font-semibold">问答助手</span>
        </div>
        {hasMessages && (
          <Button
            variant="ghost"
            size="1"
            onClick={store.clearChat}
            disabled={store.chatLoading}
          >
            <Eraser size={14} />
            清空对话
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4"
        style={{ scrollbarGutter: "stable" }}
      >
        {!hasMessages ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Sparkles size={40} className="text-[var(--gray-8)]" />
            <p className="text-sm text-[var(--gray-10)]">
              向我提问关于你订阅内容的问题，我会检索已分析的 Signal 和 Topic 来回答。
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="soft"
                  size="2"
                  onClick={() => store.sendMessage(s)}
                  disabled={store.chatLoading}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {store.chatMessages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {store.chatLoading && (
              <div className="flex items-center gap-2 text-sm text-[var(--gray-10)]">
                <Loader2 size={16} className="animate-spin" />
                <span>正在思考…</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--gray-4)] px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <TextArea
            placeholder="问点什么…（Enter 发送，Shift+Enter 换行）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={store.chatLoading}
            rows={1}
            className="min-h-[40px] flex-1 resize-none"
            style={{ maxHeight: 120 }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || store.chatLoading}
            size="2"
          >
            <ArrowUp size={16} />
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}

/** A single message bubble — user messages right-aligned, assistant left. */
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
          isUser
            ? "bg-[var(--accent-9)] text-white"
            : "bg-[var(--gray-3)] text-[var(--gray-12)]"
        }`}
      >
        {/* Tool activity badges (assistant messages only) */}
        {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {msg.toolCalls.map((tc, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded bg-[var(--gray-5)] px-2 py-0.5 text-xs text-[var(--gray-10)]"
              >
                🔧 {TOOL_LABELS[tc.name] || tc.name}
              </span>
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
      </div>
    </div>
  );
}
