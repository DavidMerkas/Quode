import { DuckMascot } from "@/components/duck/DuckMascot";
import { DUCK_MODES, type ChatMessage as ChatMsg } from "@/types/duck";
import { cn } from "@/lib/utils/cn";

interface ChatMessageProps {
  message: ChatMsg;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";
  const modeLabel = message.mode
    ? DUCK_MODES.find((m) => m.id === message.mode)?.label
    : null;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-surface-2 text-fg max-w-[85%] rounded-lg rounded-br-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <DuckMascot size={28} speaking={isStreaming} />
      <div className="min-w-0 flex-1">
        {modeLabel && (
          <div className="text-fg-subtle mb-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase">
            <span className="bg-[var(--color-duck)] inline-block size-1 rounded-full" />
            Duck · {modeLabel}
          </div>
        )}
        <div
          className={cn(
            "text-fg text-sm leading-relaxed whitespace-pre-wrap",
            isStreaming && "text-fg/95",
          )}
        >
          {message.content || (
            <span className="text-fg-subtle italic">thinking…</span>
          )}
          {isStreaming && message.content && (
            <span className="streaming-caret">&nbsp;</span>
          )}
        </div>
      </div>
    </div>
  );
}
