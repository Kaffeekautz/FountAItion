import type { ChatMessage } from "../types";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { DisclaimerBox } from "../components/DisclaimerBox";
import { HelpChat } from "../components/HelpChat";

interface AskMeViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => Promise<void>;
}

const exampleMessages = ["Ja", "Nein", "Was ist ein eingetragener Verein?", "Was bedeutet Rechtsfähigkeit?", "Was ist Gemeinnützigkeit?"];

export function AskMeView({ messages, isLoading, onSend }: AskMeViewProps) {
  return (
    <div className="space-y-6">
      <CollapsibleSection id="ask-me-overview" label="Frag mich" title="Frag mich">
        <p className="text-sm text-slate-600">
          Dieser Chat ist bewusst eng geführt. Er beantwortet kurze Pilotfragen zu e.V., Begriffen und Grundlagen oder weicht
          außerhalb des Umfangs kontrolliert aus.
        </p>
      </CollapsibleSection>

      <CollapsibleSection id="ask-me-chat" label="Bereich" title="Chat">
        <HelpChat
          messages={messages}
          isLoading={isLoading}
          onSend={onSend}
          placeholder="Antworte mit Ja/Nein oder stelle eine enge Pilotfrage..."
          suggestions={exampleMessages}
        />
      </CollapsibleSection>
      <DisclaimerBox text="Frag mich bleibt bewusst eingeschränkt und beantwortet nur knappe Fragen im FoundAItion-Pilotkontext." />
    </div>
  );
}
