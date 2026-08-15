import VoiceChat from "@/components/VoiceChat";
import PageHeader from "@/components/PageHeader";

export default function VoicePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="00 · Голосовая планёрка"
        title="Утренний созвон с собой"
        subtitle="Расскажи, как дела и что по плану — план на день соберётся из разговора. Распознавание речи работает прямо в браузере, ничего не записывается на диск."
      />
      <VoiceChat />
    </div>
  );
}
