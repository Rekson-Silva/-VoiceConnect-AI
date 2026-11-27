import { createFileRoute } from "@tanstack/react-router";
import { DashboardScreen } from "@/components/voiceconnect/screens";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "VoiceConnect AI — Dashboard" },
    { name: "description", content: "Open VoiceConnect AI quick actions, recent sample messages, and voice shortcuts." },
    { property: "og:title", content: "VoiceConnect AI — Dashboard" },
    { property: "og:description", content: "Open quick actions, sample conversations, and voice shortcuts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DashboardScreen,
});