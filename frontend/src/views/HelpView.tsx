import type { ChatMessage } from "../types";
import { DisclaimerBox } from "../components/DisclaimerBox";
import { HelpChat } from "../components/HelpChat";

interface HelpViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => Promise<void>;
}

const exampleMessages = [
  "Habe ich bereits ein Impressum hochgeladen?",
  "Welche Dokumente fehlen noch?",
  "Welche Nachweise habe ich bereits?",
  "Was bedeutet beschränkte Haftung?",
  "Warum ist Datenschutz noch offen?",
  "Welche Dokumente enthalten Impressum?",
];

export function HelpView({ messages, isLoading, onSend }: HelpViewProps) {
  return (
    <div className="space-y-6">
      <section className="panel-section">
        <p className="muted-label">FoundAItion Help</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">FoundAItion Help</h2>
        <p className="mt-3 text-sm text-slate-600">
          Der Help-Chat beantwortet nur Fragen im FoundAItion-Kontext. Er ersetzt keine Rechtsberatung.
        </p>
      </section>

      <section className="panel-section">
        <p className="muted-label">Beispielfragen</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {exampleMessages.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => void onSend(example)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:border-brand-violet hover:text-brand-violet"
            >
              {example}
            </button>
          ))}
        </div>
      </section>

      <HelpChat messages={messages} isLoading={isLoading} onSend={onSend} />
      <DisclaimerBox text="Der Help-Chat nutzt nur den FoundAItion-Systemzustand, Dokumente, Nachweise und den lokalen Wissenskatalog." />
    </div>
  );
}

