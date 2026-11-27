import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "@tanstack/react-router";

import {
  DEFAULT_SETTINGS,
  DEMO_CONTACTS,
  INITIAL_MESSAGES,
  LANGUAGE_OPTIONS,
  type AppSettings,
  type Contact,
  type DemoMessage,
  type LanguageCode,
} from "./data";
import { matchesPhrase, normalizeSpeech } from "./voice-utils";

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionErrorLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface VoiceCommandSet {
  home: string[];
  send: string[];
  messages: string[];
  contacts: string[];
  repeat: string[];
  stop: string[];
  back: string[];
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

interface VoiceConnectContextValue {
  settings: AppSettings;
  updateSettings: (next: Partial<AppSettings>) => void;
  messages: DemoMessage[];
  contacts: Contact[];
  addDemoMessage: (contact: Contact, text: string) => void;
  draftRecipient: string | null;
  setDraftRecipient: (contactId: string | null) => void;
  status: string;
  setStatus: (status: string) => void;
  isListening: boolean;
  isSpeaking: boolean;
  recognitionSupported: boolean;
  speechOutputSupported: boolean;
  lastTranscript: string;
  transcriptVersion: number;
  transcriptRoute: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  processCommand: (text: string) => void;
}

const VoiceConnectContext = createContext<VoiceConnectContextValue | null>(null);

const VOICE_COMMANDS: Record<LanguageCode, VoiceCommandSet> = {
  "en-IN": {
    home: ["go to home", "go home", "home"],
    send: ["send a message", "send message"],
    messages: ["listen to messages", "read messages", "open messages"],
    contacts: ["read contacts", "open contacts", "make a call", "call"],
    repeat: ["repeat", "say that again"],
    stop: ["stop speaking", "stop reading", "stop"],
    back: ["go back", "back"],
  },
  "ta-IN": {
    home: ["முகப்புக்குச் செல்", "முகப்பு"],
    send: ["செய்தி அனுப்பு"],
    messages: ["செய்திகளை கேள்", "செய்திகளைப் படி"],
    contacts: ["தொடர்புகளைப் படி", "அழை", "அழைப்பு செய்"],
    repeat: ["மீண்டும் சொல்", "மீண்டும்"],
    stop: ["பேசுவதை நிறுத்து", "நிறுத்து"],
    back: ["பின்செல்"],
  },
  "hi-IN": {
    home: ["होम पर जाएं", "घर जाएं"],
    send: ["संदेश भेजें", "मैसेज भेजें"],
    messages: ["संदेश सुनें", "संदेश पढ़ें"],
    contacts: ["संपर्क पढ़ें", "कॉल करें"],
    repeat: ["दोहराएं", "फिर से बोलें"],
    stop: ["बोलना बंद करें", "रुकें"],
    back: ["वापस जाएं"],
  },
  "te-IN": {
    home: ["హోమ్‌కు వెళ్ళు", "హోమ్"],
    send: ["సందేశం పంపు"],
    messages: ["సందేశాలు విను", "సందేశాలు చదువు"],
    contacts: ["పరిచయాలు చదువు", "కాల్ చేయి"],
    repeat: ["మళ్ళీ చెప్పు", "మళ్ళీ"],
    stop: ["మాట్లాడటం ఆపు", "ఆపు"],
    back: ["వెనక్కి వెళ్ళు"],
  },
  "kn-IN": {
    home: ["ಮನೆಗೆ ಹೋಗು", "ಮುಖಪುಟಕ್ಕೆ ಹೋಗು"],
    send: ["ಸಂದೇಶ ಕಳುಹಿಸು"],
    messages: ["ಸಂದೇಶಗಳನ್ನು ಕೇಳು", "ಸಂದೇಶಗಳನ್ನು ಓದು"],
    contacts: ["ಸಂಪರ್ಕಗಳನ್ನು ಓದು", "ಕರೆ ಮಾಡು"],
    repeat: ["ಮತ್ತೆ ಹೇಳು", "ಮತ್ತೆ"],
    stop: ["ಮಾತನಾಡುವುದನ್ನು ನಿಲ್ಲಿಸು", "ನಿಲ್ಲಿಸು"],
    back: ["ಹಿಂದಕ್ಕೆ ಹೋಗು"],
  },
  "ml-IN": {
    home: ["ഹോമിലേക്ക് പോകൂ", "ഹോം"],
    send: ["സന്ദേശം അയയ്ക്കൂ"],
    messages: ["സന്ദേശങ്ങൾ കേൾക്കൂ", "സന്ദേശങ്ങൾ വായിക്കൂ"],
    contacts: ["കോൺടാക്ടുകൾ വായിക്കൂ", "വിളിക്കൂ"],
    repeat: ["വീണ്ടും പറയൂ", "വീണ്ടും"],
    stop: ["സംസാരിക്കുന്നത് നിർത്തൂ", "നിർത്തൂ"],
    back: ["തിരികെ പോകൂ"],
  },
};

function readStoredSettings(): AppSettings {
  try {
    const stored = window.localStorage.getItem("voiceconnect-settings");
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<AppSettings>;
    const validLanguage = LANGUAGE_OPTIONS.some((language) => language.code === parsed.language);
    const fontSize = parsed.fontSize === "normal" || parsed.fontSize === "large" || parsed.fontSize === "largest"
      ? parsed.fontSize
      : DEFAULT_SETTINGS.fontSize;
    return {
      language: validLanguage ? (parsed.language as LanguageCode) : DEFAULT_SETTINGS.language,
      theme: parsed.theme === "light" ? "light" : "dark",
      fontSize,
      highContrast: typeof parsed.highContrast === "boolean" ? parsed.highContrast : DEFAULT_SETTINGS.highContrast,
      speechRate: typeof parsed.speechRate === "number" ? parsed.speechRate : DEFAULT_SETTINGS.speechRate,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function readStoredMessages(): DemoMessage[] {
  try {
    const stored = window.localStorage.getItem("voiceconnect-messages");
    if (!stored) return INITIAL_MESSAGES;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as DemoMessage[]) : INITIAL_MESSAGES;
  } catch {
    return INITIAL_MESSAGES;
  }
}

export function VoiceConnectProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [messages, setMessages] = useState<DemoMessage[]>(INITIAL_MESSAGES);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [status, setStatus] = useState("Ready when you are.");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [speechOutputSupported, setSpeechOutputSupported] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [transcriptVersion, setTranscriptVersion] = useState(0);
  const [transcriptRoute, setTranscriptRoute] = useState("/");
  const [lastSpoken, setLastSpoken] = useState("");
  const [draftRecipient, setDraftRecipient] = useState<string | null>(null);

  useEffect(() => {
    setSettings(readStoredSettings());
    setMessages(readStoredMessages());
    const browserWindow = window as SpeechWindow;
    setRecognitionSupported(Boolean(browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition));
    setSpeechOutputSupported("speechSynthesis" in window);
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    window.localStorage.setItem("voiceconnect-settings", JSON.stringify(settings));
    window.localStorage.setItem("voiceconnect-messages", JSON.stringify(messages));
  }, [messages, settings, settingsLoaded]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", settings.theme === "light");
    document.documentElement.classList.toggle("high-contrast", settings.highContrast);
  }, [settings.highContrast, settings.theme]);

  const updateSettings = useCallback((next: Partial<AppSettings>) => {
    setSettings((current) => ({ ...current, ...next }));
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setStatus("Speech output is not available in this browser.");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = settings.language;
      utterance.rate = settings.speechRate;
      const languagePrefix = settings.language.split("-")[0]?.toLowerCase();
      const selectedVoice = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix ?? ""));
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        setStatus("Speech playback stopped. You can try again.");
      };
      setLastSpoken(text);
      setStatus("Speaking.");
      window.speechSynthesis.speak(utterance);
    },
    [settings.language, settings.speechRate],
  );

  const processCommand = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setLastTranscript(trimmed);
      setTranscriptVersion((version) => version + 1);
      setStatus(`Heard: ${trimmed}`);

      const commands = VOICE_COMMANDS[settings.language];
      let destination = router.state.location.pathname;
      if (matchesPhrase(trimmed, commands["stop"])) {
        stopSpeaking();
        setStatus("Speech stopped.");
        return;
      }
      if (matchesPhrase(trimmed, commands["repeat"])) {
        if (lastSpoken) speak(lastSpoken);
        else setStatus("Nothing has been read aloud yet.");
        return;
      }
      if (matchesPhrase(trimmed, commands["home"])) {
        destination = "/dashboard";
        setStatus("Opening your dashboard.");
        void router.navigate({ to: "/dashboard" });
      } else if (matchesPhrase(trimmed, commands["send"])) {
        destination = "/send";
        setStatus("Opening messages.");
        void router.navigate({ to: "/send" });
      } else if (matchesPhrase(trimmed, commands["messages"])) {
        destination = "/messages";
        setStatus("Opening your inbox.");
        void router.navigate({ to: "/messages" });
      } else if (matchesPhrase(trimmed, commands["contacts"])) {
        destination = "/contacts";
        setStatus("Opening contacts.");
        void router.navigate({ to: "/contacts" });
      } else if (matchesPhrase(trimmed, commands["back"])) {
        if (window.history.length > 1) window.history.back();
        else void router.navigate({ to: "/dashboard" });
        destination = window.history.length > 1 ? router.state.location.pathname : "/dashboard";
      }
      setTranscriptRoute(destination);
    },
    [lastSpoken, router, settings.language, speak, stopSpeaking],
  );

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const browserWindow = window as SpeechWindow;
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setRecognitionSupported(false);
      setStatus("Voice input is not available here. Use the text command box instead.");
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = settings.language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex]?.[0]?.transcript;
      if (result) processCommand(result);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setStatus("Microphone access was denied. Allow microphone access in your browser settings, or use text input.");
      } else if (event.error === "network") {
        setStatus("The browser speech service needs an internet connection. Text input is still available.");
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        setStatus("Voice input was unclear. Please try again or use text input.");
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      setStatus((current) => (current === "Listening. Speak now." ? "Voice input ended. Ready when you are." : current));
    };
    recognitionRef.current = recognition;
    setRecognitionSupported(true);
    setIsListening(true);
    setStatus("Listening. Speak now.");
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setStatus("Could not start voice input. Check microphone access or use text input.");
    }
  }, [processCommand, settings.language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatus("Voice input stopped.");
  }, []);

  const addDemoMessage = useCallback((contact: Contact, text: string) => {
    const time = `Today · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    const message: DemoMessage = {
      id: `demo-${Date.now()}`,
      contactId: contact.id,
      contactName: contact.name,
      text,
      time,
      direction: "sent",
    };
    setMessages((current) => [message, ...current]);
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const value = useMemo<VoiceConnectContextValue>(
    () => ({
      settings,
      updateSettings,
      messages,
      contacts: DEMO_CONTACTS,
      addDemoMessage,
      draftRecipient,
      setDraftRecipient,
      status,
      setStatus,
      isListening,
      isSpeaking,
      recognitionSupported,
      speechOutputSupported,
      lastTranscript,
      transcriptRoute,
      transcriptVersion,
      startListening,
      stopListening,
      speak,
      stopSpeaking,
      processCommand,
    }),
    [
      addDemoMessage,
      draftRecipient,
      isListening,
      isSpeaking,
      lastTranscript,
      messages,
      processCommand,
      recognitionSupported,
      settings,
      speechOutputSupported,
      speak,
      startListening,
      status,
      stopListening,
      stopSpeaking,
      transcriptVersion,
      transcriptRoute,
      updateSettings,
    ],
  );

  return <VoiceConnectContext.Provider value={value}>{children}</VoiceConnectContext.Provider>;
}

export function useVoiceConnect(): VoiceConnectContextValue {
  const context = useContext(VoiceConnectContext);
  if (!context) throw new Error("VoiceConnectProvider is missing from the app tree.");
  return context;
}

export function findContactBySpeech(text: string, contacts: Contact[]): Contact | undefined {
  const normalized = normalizeSpeech(text);
  return contacts.find((contact) => normalized.includes(normalizeSpeech(contact.name)));
}