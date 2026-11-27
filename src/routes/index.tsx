import { createFileRoute } from "@tanstack/react-router";
import { WelcomeScreen } from "@/components/voiceconnect/screens";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoiceConnect AI — Welcome and language" },
      { name: "description", content: "Choose your spoken language and enter VoiceConnect AI, a hands-free communication demonstration." },
      { property: "og:title", content: "VoiceConnect AI — Welcome and language" },
      { property: "og:description", content: "Choose your spoken language and enter your hands-free communication demonstration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomeScreen,
});
