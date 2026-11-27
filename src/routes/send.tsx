import { createFileRoute } from "@tanstack/react-router";
import { SendMessageScreen } from "@/components/voiceconnect/screens";

export const Route = createFileRoute("/send")({
  head: () => ({ meta: [
    { title: "VoiceConnect AI — Send a message" },
    { name: "description", content: "Compose, review, and explicitly confirm a simulated VoiceConnect AI message." },
    { property: "og:title", content: "VoiceConnect AI — Send a message" },
    { property: "og:description", content: "Compose, review, and explicitly confirm a simulated message." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SendMessageScreen,
});