import { ArrowUp, Plus } from "lucide-react";
import React, { useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ExpandingTextarea } from "../components/ExpandingTextarea";

interface ChatInputProps {
  onMessageSend: (message: string) => void | Promise<void>;
}

export const ChatInput = React.memo(({ onMessageSend }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const sendMessage = useCallback(
    (e: { preventDefault: () => void }) => {
      e?.preventDefault();
      if (message.trim() === "") return;
      void onMessageSend(message);
      setMessage("");
    },
    [message, onMessageSend],
  );

  return (
    <section className="z-10 flex min-h-14 w-full items-center gap-2 bg-black/80 px-3 backdrop-blur-xl">
      {/* Plus Icon */}
      <button className="duration-[350ms] flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-[#101011] text-white/80 transition-colors">
        <Plus className="size-4" />
      </button>

      {/* Input */}
      <div className="relative w-full">
        <ExpandingTextarea
          autoComplete="off"
          rows={1}
          wrap="hard"
          className="h-auto min-h-9 w-full flex-grow rounded-3xl border border-[#1F2021] bg-transparent px-3 py-[0.35rem] pr-10 text-white placeholder-[#434346] caret-blue-600 outline-none selection:bg-[#346DD9]/30"
          placeholder="Message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (window.innerWidth < 768) return;
            e.key === "Enter" && !e.shiftKey && void sendMessage(e);
          }}
        />

        {/* Send Icon (absolute, right-0) */}
        <button
          onTouchEnd={sendMessage}
          className={twMerge(
            "duration-50 absolute bottom-[0.65rem] right-1 flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-[#0C79FF] text-white/80 opacity-100 transition-all",
            message.length === 0 && "opacity-0",
          )}
          onClick={sendMessage}
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </section>
  );
});
