import { createFileRoute } from "@tanstack/react-router";
import { AccessibilityScreen } from "@/components/voiceconnect/screens";

export const Route = createFileRoute("/accessibility")({
  head: () => ({ meta: [
    { title: "VoiceConnect AI — Accessibility" },
    { name: "description", content: "Adjust text size, contrast, and display mode in VoiceConnect AI." },
    { property: "og:title", content: "VoiceConnect AI — Accessibility" },
    { property: "og:description", content: "Adjust text size, contrast, and display mode." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AccessibilityScreen,
});