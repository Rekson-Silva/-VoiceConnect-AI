import { createFileRoute } from "@tanstack/react-router";
import { ContactsScreen } from "@/components/voiceconnect/screens";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [
    { title: "VoiceConnect AI — Contacts" },
    { name: "description", content: "Search demonstration contacts and safely simulate a call without placing one." },
    { property: "og:title", content: "VoiceConnect AI — Contacts" },
    { property: "og:description", content: "Search demonstration contacts and simulate a call without placing one." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ContactsScreen,
});