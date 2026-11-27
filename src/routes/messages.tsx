import { createFileRoute } from "@tanstack/react-router";
import { MessagesScreen } from "@/components/voiceconnect/screens";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [
    { title: "VoiceConnect AI — Messages" },
    { name: "description", content: "Read sample incoming messages aloud and prepare a reply with confirmation." },
    { property: "og:title", content: "VoiceConnect AI — Messages" },
    { property: "og:description", content: "Read sample incoming messages and prepare a reply with confirmation." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MessagesScreen,
});