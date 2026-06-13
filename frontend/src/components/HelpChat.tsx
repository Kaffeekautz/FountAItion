import { useState } from "react";

import type { ChatMessage } from "../types";
import { StatusBadge } from "./StatusBadge";

interface HelpChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => Promise<void>;
}

export function HelpChat({ messages, isLoading, onSend }: HelpChatProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }
    setMessage("");
    await onSend(trimmed);
  };

  return (
    <div className="panel-section">
      <div className="space-y-4">
        {messages.map((entry) => (
          <div
            key={entry.id}
            className={`rounded-3xl px-4 py-4 ${
              entry.role === "user" ? "bg-slate-900 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{entry.role === "user" ? "Du" : "FoundAItion"}</p>
              {entry.response ? <StatusBadge status={entry.response.intent} /> : null}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{entry.text}</p>
            {entry.response ? (
              <>
                {entry.response.sources.length > 0 ? (
                  <div className="mt-4 rounded-2xl bg-white/80 p-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Quellen</p>
                    <div className="mt-2 space-y-2">
                      {entry.response.sources.map((source) => (
                        <div key={`${source.title}-${source.reference_id ?? source.excerpt ?? "source"}`} className="rounded-xl bg-slate-50 p-2">
                          <p className="font-medium">{source.title}</p>
                          {source.excerpt ? <p className="mt-1 text-xs text-slate-500">{source.excerpt}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {entry.response.warnings.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {entry.response.warnings.join(" ")}
                  </div>
                ) : null}
                <p className="mt-4 text-xs text-slate-500">{entry.response.disclaimer}</p>
              </>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="Stelle eine erlaubte FoundAItion-Frage..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-brand-violet"
        />
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void handleSubmit()}
          className="rounded-2xl bg-brand-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Antwortet..." : "Senden"}
        </button>
      </div>
    </div>
  );
}

