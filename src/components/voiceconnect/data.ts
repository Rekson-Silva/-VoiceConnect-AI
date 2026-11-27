export type LanguageCode = "ta-IN" | "en-IN" | "hi-IN" | "te-IN" | "kn-IN" | "ml-IN";
export type FontSize = "normal" | "large" | "largest";

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  initials: string;
}

export interface DemoMessage {
  id: string;
  contactId: string;
  contactName: string;
  text: string;
  time: string;
  direction: "received" | "sent";
}

export interface AppSettings {
  language: LanguageCode;
  theme: "dark" | "light";
  fontSize: FontSize;
  highContrast: boolean;
  speechRate: number;
}

export const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; label: string; nativeLabel: string }> = [
  { code: "ta-IN", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "en-IN", label: "English (India)", nativeLabel: "English" },
  { code: "hi-IN", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "te-IN", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "kn-IN", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "ml-IN", label: "Malayalam", nativeLabel: "മലയാളം" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  language: "en-IN",
  theme: "dark",
  fontSize: "normal",
  highContrast: true,
  speechRate: 1,
};

export const DEMO_CONTACTS: Contact[] = [
  { id: "mother", name: "Mother", relation: "Family", phone: "+91 00000 00001", initials: "M" },
  { id: "father", name: "Father", relation: "Family", phone: "+91 00000 00002", initials: "F" },
  { id: "doctor", name: "Doctor", relation: "Care team", phone: "+91 00000 00003", initials: "D" },
  { id: "friend", name: "Friend", relation: "Friend", phone: "+91 00000 00004", initials: "A" },
];

export const INITIAL_MESSAGES: DemoMessage[] = [
  {
    id: "sample-mother",
    contactId: "mother",
    contactName: "Mother",
    text: "Good morning! I am on my way. Would you like me to bring anything?",
    time: "Today · 9:20 AM",
    direction: "received",
  },
  {
    id: "sample-father",
    contactId: "father",
    contactName: "Father",
    text: "The garden is looking lovely today. I will visit after lunch.",
    time: "Today · 8:42 AM",
    direction: "received",
  },
  {
    id: "sample-doctor",
    contactId: "doctor",
    contactName: "Doctor",
    text: "Your appointment is confirmed for Thursday at 10:30 AM.",
    time: "Yesterday · 4:15 PM",
    direction: "received",
  },
  {
    id: "sample-friend",
    contactId: "friend",
    contactName: "Friend",
    text: "Would you like to listen to the new playlist I sent you?",
    time: "Yesterday · 1:05 PM",
    direction: "received",
  },
];