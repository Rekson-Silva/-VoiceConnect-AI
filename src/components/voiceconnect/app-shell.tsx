import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Accessibility,
  AudioLines,
  ContactRound,
  House,
  Inbox,
  Languages,
  Mic,
  MicOff,
  MessageSquarePlus,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceConnect } from "./voice-connect-provider";

type AppPage = "welcome" | "dashboard" | "send" | "messages" | "contacts" | "voice" | "accessibility";

const PAGE_DETAILS: Record<AppPage, { title: string; subtitle: string }> = {
  welcome: { title: "Welcome", subtitle: "Make this space yours before you begin." },
  dashboard: { title: "Your dashboard", subtitle: "Your conversations, within easy reach." },
  send: { title: "Send a message", subtitle: "Review every detail before a demo message is recorded." },
  messages: { title: "Your messages", subtitle: "Choose a message to listen or reply." },
  contacts: { title: "Your contacts", subtitle: "Find a person or explore a simulated call." },
  voice: { title: "Voice settings", subtitle: "Set the language and speaking pace that suit you." },
  accessibility: { title: "Accessibility", subtitle: "Adjust the display for comfortable reading." },
};

const NAV_ITEMS = [
  { key: "welcome", label: "Welcome", to: "/", icon: Languages },
  { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: House },
  { key: "send", label: "Send a message", to: "/send", icon: MessageSquarePlus },
  { key: "messages", label: "Messages", to: "/messages", icon: Inbox },
  { key: "contacts", label: "Contacts", to: "/contacts", icon: ContactRound },
  { key: "voice", label: "Voice settings", to: "/voice-settings", icon: AudioLines },
  { key: "accessibility", label: "Accessibility", to: "/accessibility", icon: Accessibility },
] as const;

export function AppShell({ page, children }: { page: AppPage; children: ReactNode }) {
  const {
    settings,
    isListening,
    isSpeaking,
    status,
    startListening,
    stopListening,
    processCommand,
  } = useVoiceConnect();
  const [command, setCommand] = useState("");
  const pageDetails = PAGE_DETAILS[page];

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!command.trim()) return;
    processCommand(command);
    setCommand("");
  }

  return (
    <div className={`vc-app vc-font-${settings.fontSize}`}>
      <aside className="vc-sidebar" aria-label="Main navigation">
        <Link to="/dashboard" className="vc-brand-link" aria-label="VoiceConnect AI dashboard">
          <span className="vc-brand-mark" aria-hidden="true"><AudioLines /></span>
          <span className="vc-brand-name">VoiceConnect <span>AI</span></span>
        </Link>
        <p className="vc-nav-caption">YOUR SPACE</p>
        <nav className="vc-nav-list" aria-label="App pages">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                asChild
                variant={page === item.key ? "secondary" : "ghost"}
                className={`vc-nav-button ${page === item.key ? "is-current" : ""}`}
              >
                <Link to={item.to} aria-current={page === item.key ? "page" : undefined}>
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="vc-sidebar-note">
          <span className="vc-demo-mark" aria-hidden="true">D</span>
          <div><strong>Demonstration mode</strong><span>Nothing is sent or called.</span></div>
        </div>
      </aside>

      <div className="vc-main">
        <header className="vc-header">
          <div className="vc-header-title">
            <p className="vc-eyebrow">VOICECONNECT AI</p>
            <h1>{pageDetails.title}</h1>
            <p className="vc-header-subtitle">{pageDetails.subtitle}</p>
          </div>
          <div className="vc-header-actions">
            <span className={`vc-mode-indicator ${isListening ? "is-listening" : isSpeaking ? "is-speaking" : ""}`}>
              <span className="vc-status-dot" aria-hidden="true" />
              {isListening ? "Listening" : isSpeaking ? "Speaking" : "Demo mode"}
            </span>
            <Button asChild variant="outline" size="icon" aria-label="Open voice settings" title="Voice settings">
              <Link to="/voice-settings"><Settings2 aria-hidden="true" /></Link>
            </Button>
          </div>
        </header>

        <main className="vc-page-content">{children}</main>

        <section className="vc-command-dock" aria-label="Voice and text controls">
          <div className="vc-dock-row">
            <div className="vc-status-copy" aria-live="polite" role="status">
              <span className={`vc-status-dot ${isListening ? "is-active" : ""}`} aria-hidden="true" />
              <span>{status}</span>
            </div>
            <Button
              type="button"
              size="icon"
              className={`vc-mic-button ${isListening ? "is-listening" : ""}`}
              aria-label={isListening ? "Stop listening" : "Start voice command"}
              aria-pressed={isListening}
              title={isListening ? "Stop listening" : "Start voice command"}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
            </Button>
          </div>
          <form className="vc-command-form" onSubmit={submitCommand}>
            <Input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              aria-label="Type a voice command or message"
              placeholder="Type a command or dictate here"
            />
            <Button type="submit" variant="secondary" disabled={!command.trim()}>Submit</Button>
          </form>
        </section>

        <nav className="vc-mobile-nav" aria-label="App pages">
          {NAV_ITEMS.filter((item) => item.key !== "welcome").map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                asChild
                variant="ghost"
                className={`vc-mobile-nav-button ${page === item.key ? "is-current" : ""}`}
              >
                <Link to={item.to} aria-current={page === item.key ? "page" : undefined}>
                  <Icon aria-hidden="true" />
                  <span>{item.key === "accessibility" ? "Access" : item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}