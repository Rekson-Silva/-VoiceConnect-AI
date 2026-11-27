import { createFileRoute } from "@tanstack/react-router";
import { VoiceSettingsScreen } from "@/components/voiceconnect/screens";

export const Route = createFileRoute("/voice-settings")({
  head: () => ({ meta: [
    { title: "VoiceConnect AI — Voice settings" },
    { name: "description", content: "Choose the spoken language and playback speed for VoiceConnect AI." },
    { property: "og:title", content: "VoiceConnect AI — Voice settings" },
    { property: "og:description", content: "Choose the spoken language and playback speed." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: VoiceSettingsScreen,
});