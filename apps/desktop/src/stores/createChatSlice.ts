import { StateCreator } from "zustand";
import { invoke } from "@tauri-apps/api/core";

/** A single tool call record returned by the agent, for UI display. */
export interface ToolCallRecord {
  name: string;
  args: string;
}

/** A message in the chat conversation. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Tool calls made by the agent for this assistant turn (optional). */
  toolCalls?: ToolCallRecord[];
}

/** Shape of the AgentResult returned by the `chat_with_agent` command. */
interface AgentResult {
  answer: string;
  tool_calls_made: ToolCallRecord[];
}

/** A history entry sent back to the backend for multi-turn context. */
interface HistoryMessage {
  role: string;
  content: string;
}

export interface ChatSlice {
  /** All messages in the current conversation. */
  chatMessages: ChatMessage[];
  /** True while waiting for the agent to respond. */
  chatLoading: boolean;
  /** Error message from the last request, if any. */
  chatError: string | null;
  /** Whether the user has an API key configured (loaded from AI config). */
  chatHasApiKey: boolean | null;

  /** Send a user message and append the agent's response. */
  sendMessage: (text: string) => Promise<void>;
  /** Clear the conversation. */
  clearChat: () => void;
  /** Check whether an API key is configured. */
  checkChatConfig: () => Promise<void>;
}

export const createChatSlice: StateCreator<ChatSlice, [], [], ChatSlice> = (
  set,
  get,
) => ({
  chatMessages: [],
  chatLoading: false,
  chatError: null,
  chatHasApiKey: null,

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || get().chatLoading) return;

    // Append the user message immediately for responsive UI.
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const prevMessages = get().chatMessages;
    set({
      chatMessages: [...prevMessages, userMsg],
      chatLoading: true,
      chatError: null,
    });

    // Build history from prior turns (exclude the just-added user message).
    const history: HistoryMessage[] = prevMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const result: AgentResult = await invoke("chat_with_agent", {
        message: trimmed,
        history,
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: result.answer,
        toolCalls: result.tool_calls_made?.length
          ? result.tool_calls_made
          : undefined,
      };
      set((s) => ({
        chatMessages: [...s.chatMessages, assistantMsg],
        chatLoading: false,
      }));
    } catch (e) {
      const errStr = String(e);
      // Surface a readable error message.
      let errorMsg = errStr;
      if (errStr.includes("AI_NO_API_KEY")) {
        errorMsg = "未配置 API Key，请先在设置中配置 AI。";
      }
      set((s) => ({
        chatMessages: [
          ...s.chatMessages,
          {
            role: "assistant",
            content: `⚠️ ${errorMsg}`,
          },
        ],
        chatLoading: false,
        chatError: errorMsg,
      }));
    }
  },

  clearChat: () => {
    set({ chatMessages: [], chatError: null });
  },

  checkChatConfig: async () => {
    try {
      const config = await invoke<{ has_api_key: boolean }>("get_ai_config");
      set({ chatHasApiKey: config.has_api_key });
    } catch {
      set({ chatHasApiKey: false });
    }
  },
});
