import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Check, ChevronRight, CirclePlay, Headphones, MessageCircle, Phone, Send, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "./app-shell";
import {
  LANGUAGE_OPTIONS,
  type Contact,
  type FontSize,
} from "./data";
import { findContactBySpeech, useVoiceConnect } from "./voice-connect-provider";
import { isExplicitSendConfirmation, matchesPhrase, normalizeSpeech } from "./voice-utils";

export function WelcomeScreen() {
  const { settings, updateSettings, speak, speechOutputSupported } = useVoiceConnect();
  const router = useRouter();

  function continueToDashboard() {
    speak("Welcome to VoiceConnect AI. Your dashboard is ready.");
    void router.navigate({ to: "/dashboard" });
  }

  return (
    <AppShell page="welcome">
      <section className="vc-welcome-layout">
        <div className="vc-welcome-copy">
          <p className="vc-kicker"><span className="vc-kicker-line" /> A calmer way to connect</p>
          <h2>VoiceConnect AI</h2>
          <p className="vc-welcome-lede">Everyday conversations, at your pace.</p>
          <p className="vc-muted-copy">Choose the language you would like to speak and listen in. You can change it anytime.</p>
        </div>
        <div className="vc-welcome-controls">
          <label className="vc-field-label" htmlFor="welcome-language">Spoken language</label>
          <select
            id="welcome-language"
            className="vc-select"
            value={settings.language}
            onChange={(event) => updateSettings({ language: event.target.value as typeof settings.language })}
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language.code} value={language.code}>{language.label} · {language.nativeLabel}</option>
            ))}
          </select>
          <p className="vc-field-hint">Voice input depends on browser and microphone support. Typing is always available.</p>
          <Button type="button" size="lg" className="vc-primary-action" onClick={continueToDashboard}>
            Continue to dashboard <ChevronRight aria-hidden="true" />
          </Button>
          <p className="vc-demo-disclaimer">
            {speechOutputSupported ? "Sample contacts and messages are stored on this device." : "Speech playback is unavailable here; on-screen text remains available."}
            <br />Messages and calls are demonstrations only.
          </p>
        </div>
      </section>
      <section className="vc-language-strip" aria-label="Available spoken languages">
        {LANGUAGE_OPTIONS.map((language) => <span key={language.code}>{language.nativeLabel}</span>)}
      </section>
    </AppShell>
  );
}

export function DashboardScreen() {
  const { contacts, messages, speak, settings, setStatus } = useVoiceConnect();
  const latestReceived = messages.find((message) => message.direction === "received");
  const selectedLanguage = LANGUAGE_OPTIONS.find((language) => language.code === settings.language);

  return (
    <AppShell page="dashboard">
      <section className="vc-dashboard-intro">
        <div>
          <p className="vc-kicker"><span className="vc-kicker-line" /> YOUR VOICE, YOUR CHOICE</p>
          <h2>Ready to connect?</h2>
          <p className="vc-muted-copy">Speak a command or choose an action below. You stay in control at every step.</p>
        </div>
        <div className="vc-language-chip"><span className="vc-language-dot" aria-hidden="true" />{selectedLanguage?.label ?? "English (India)"}</div>
      </section>

      <section className="vc-quick-actions" aria-label="Quick actions">
        <Button asChild variant="outline" className="vc-action-tile">
          <Link to="/send"><span className="vc-action-icon"><MessageCircle aria-hidden="true" /></span><span className="vc-action-copy"><strong>Send a message</strong><small>Speak or type, then confirm</small></span><ChevronRight aria-hidden="true" /></Link>
        </Button>
        <Button asChild variant="outline" className="vc-action-tile">
          <Link to="/messages"><span className="vc-action-icon is-teal"><Headphones aria-hidden="true" /></span><span className="vc-action-copy"><strong>Listen to messages</strong><small>{messages.length} sample conversations</small></span><ChevronRight aria-hidden="true" /></Link>
        </Button>
        <Button asChild variant="outline" className="vc-action-tile">
          <Link to="/contacts"><span className="vc-action-icon is-amber"><Phone aria-hidden="true" /></span><span className="vc-action-copy"><strong>Contacts and calls</strong><small>{contacts.length} demonstration contacts</small></span><ChevronRight aria-hidden="true" /></Link>
        </Button>
      </section>

      <section className="vc-dashboard-lower">
        <div className="vc-section-block">
          <div className="vc-section-heading"><div><p className="vc-eyebrow">RECENT MESSAGE</p><h3>A quick listen</h3></div><Button asChild variant="link"><Link to="/messages">Open inbox <ChevronRight aria-hidden="true" /></Link></Button></div>
          {latestReceived ? (
            <div className="vc-recent-message">
              <div className="vc-avatar">{latestReceived.contactName.slice(0, 1)}</div>
              <div className="vc-recent-copy"><div className="vc-row-title"><strong>{latestReceived.contactName}</strong><span>{latestReceived.time}</span></div><p>{latestReceived.text}</p></div>
              <Button variant="secondary" size="icon" aria-label={`Read message from ${latestReceived.contactName}`} title="Read message aloud" onClick={() => { speak(`${latestReceived.contactName} says: ${latestReceived.text}`); setStatus("Reading the sample message aloud."); }}><Volume2 aria-hidden="true" /></Button>
            </div>
          ) : <p className="vc-empty-note">No sample messages yet.</p>}
        </div>
        <aside className="vc-command-guide" aria-label="Voice command examples">
          <p className="vc-eyebrow">VOICE SHORTCUTS</p>
          <p><span>“Send a message”</span><span>“Listen to messages”</span><span>“Read contacts”</span></p>
          <Button type="button" variant="ghost" onClick={() => speak("Try saying: Send a message. Listen to messages. Read contacts. Say: go to home, repeat, or stop speaking.")}>Hear commands <Volume2 aria-hidden="true" /></Button>
        </aside>
      </section>
    </AppShell>
  );
}

type MessageStep = "recipient" | "message" | "confirm" | "sent";

export function SendMessageScreen() {
  const router = useRouter();
  const {
    contacts,
    addDemoMessage,
    draftRecipient,
    setDraftRecipient,
    lastTranscript,
    transcriptVersion,
    transcriptRoute,
    settings,
    speak,
    setStatus,
  } = useVoiceConnect();
  const [contactId, setContactId] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<MessageStep>("recipient");
  const [resultMessage, setResultMessage] = useState("");
  const handledVersion = useRef(0);
  const selectedContact = contacts.find((contact) => contact.id === contactId);

  useEffect(() => {
    if (!draftRecipient) return;
    const contact = contacts.find((entry) => entry.id === draftRecipient);
    if (contact) {
      setContactId(contact.id);
      setStep("message");
      setStatus(`Recipient selected: ${contact.name}. Say or type your message.`);
    }
    setDraftRecipient(null);
  }, [contacts, draftRecipient, setDraftRecipient, setStatus]);

  useEffect(() => {
    if (transcriptVersion === 0 || transcriptVersion === handledVersion.current || transcriptRoute !== "/send") return;
    handledVersion.current = transcriptVersion;
    const transcript = lastTranscript;
    if (matchesPhrase(transcript, ["cancel", "never mind"])) {
      setContactId("");
      setMessage("");
      setStep("recipient");
      setStatus("Message cancelled. Nothing was recorded.");
      return;
    }
    if (step === "recipient") {
      const contact = findContactBySpeech(transcript, contacts);
      if (!contact) {
        setStatus("I could not identify that recipient. Choose a contact or say their name again.");
        speak("I could not identify the recipient. Please choose a contact or say their name again.");
        return;
      }
      setContactId(contact.id);
      setStep("message");
      setStatus(`Recipient selected: ${contact.name}.`);
      speak(`What would you like to say to ${contact.name}?`);
      return;
    }
    if (step === "message") {
      setMessage(transcript);
      setStep("confirm");
      const recipient = selectedContact?.name ?? "your contact";
      speak(`Your message to ${recipient} is: ${transcript}. Say yes, send to record this demo message, or say edit or cancel.`);
      return;
    }
    if (step === "confirm") {
      if (isExplicitSendConfirmation(transcript, settings.language)) {
        sendDemoMessage();
      } else if (matchesPhrase(transcript, ["edit", "change it"])) {
        setStep("message");
        setStatus("Go ahead and edit your message.");
        speak("Go ahead and edit your message.");
      } else {
        setStatus("No message was recorded. Say “Yes, send” to confirm, or choose Edit or Cancel.");
      }
    }
    // Keep each utterance tied to the step that was active when it arrived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts, lastTranscript, settings.language, step, transcriptRoute, transcriptVersion]);

  function sendDemoMessage() {
    if (!selectedContact || !message.trim()) {
      setStatus("Choose a recipient and add a message before confirming.");
      return;
    }
    addDemoMessage(selectedContact, message.trim());
    setResultMessage(`Demo message recorded for ${selectedContact.name}. No real message was sent.`);
    setStep("sent");
    setStatus(`Demo message recorded for ${selectedContact.name}. No real message was sent.`);
    speak(`Demo message recorded for ${selectedContact.name}. No real message was sent.`);
  }

  function reviewMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedContact || !message.trim()) return;
    setStep("confirm");
    speak(`Your message to ${selectedContact.name} is: ${message.trim()}. Review it, then choose Yes, send demo message to record it.`);
  }

  function cancelMessage() {
    setStep("recipient");
    setContactId("");
    setMessage("");
    setResultMessage("Message cancelled. Nothing was recorded.");
    setStatus("Message cancelled. Nothing was recorded.");
  }

  return (
    <AppShell page="send">
      <div className="vc-form-layout">
        <section className="vc-section-block vc-message-form-section">
          <div className="vc-section-heading"><div><p className="vc-eyebrow">DEMO MESSAGE</p><h2>{step === "sent" ? "Recorded for this demo" : "Compose a message"}</h2></div><span className={`vc-step-badge ${step}`}>{step === "recipient" ? "1 · Recipient" : step === "message" ? "2 · Message" : step === "confirm" ? "3 · Review" : "Complete"}</span></div>
          {resultMessage && <p className="vc-inline-status" role="status"><Check aria-hidden="true" />{resultMessage}</p>}
          <form onSubmit={reviewMessage} className="vc-message-form">
            <label className="vc-field-label" htmlFor="message-recipient">To</label>
            <select id="message-recipient" className="vc-select" value={contactId} onChange={(event) => { setContactId(event.target.value); setStep("message"); setResultMessage(""); }} disabled={step === "sent"}>
              <option value="">Choose a demonstration contact</option>
              {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.relation}</option>)}
            </select>
            <label className="vc-field-label" htmlFor="message-body">Message</label>
            <Textarea id="message-body" rows={5} value={message} onChange={(event) => { setMessage(event.target.value); setStep("message"); setResultMessage(""); }} placeholder="Type your message, or use the microphone or command box below." disabled={step === "sent"} />
            {step === "confirm" && selectedContact && (
              <div className="vc-confirm-panel" role="group" aria-label="Confirm demonstration message">
                <p className="vc-eyebrow">PLEASE CONFIRM</p>
                <p>Send this demo message to <strong>{selectedContact.name}</strong>?</p>
                <blockquote>{message}</blockquote>
                <p className="vc-muted-copy">This only adds a sample record in this app. No text will be sent to a phone.</p>
              </div>
            )}
            <div className="vc-form-actions">
              {step !== "sent" && step !== "confirm" && <Button type="submit" disabled={!selectedContact || !message.trim()}><Check aria-hidden="true" />Review message</Button>}
              {step === "confirm" && <>
                <Button type="button" onClick={sendDemoMessage} disabled={!selectedContact || !message.trim()}><Send aria-hidden="true" />Yes, send demo message</Button>
                <Button type="button" variant="outline" onClick={() => { setStep("message"); setStatus("Edit your message, then review it again."); }}>Edit</Button>
              </>}
              {step !== "sent" && <Button type="button" variant="ghost" onClick={cancelMessage}>Cancel</Button>}
              {step === "sent" && <Button asChild variant="secondary"><Link to="/messages">View demo messages <ChevronRight aria-hidden="true" /></Link></Button>}
            </div>
          </form>
        </section>
        <aside className="vc-process-note">
          <div className="vc-note-icon"><Volume2 aria-hidden="true" /></div>
          <p className="vc-eyebrow">YOUR CONTROL</p>
          <h3>Nothing happens without your confirmation.</h3>
          <p>The message is read back before it can be recorded. Say or choose “Yes, send” to confirm, or edit and cancel.</p>
        </aside>
      </div>
    </AppShell>
  );
}

export function MessagesScreen() {
  const router = useRouter();
  const { messages, setDraftRecipient, speak, setStatus, lastTranscript, transcriptVersion, transcriptRoute } = useVoiceConnect();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyPrompted, setReplyPrompted] = useState(false);
  const handledVersion = useRef(0);
  const selectedMessage = messages.find((message) => message.id === selectedId) ?? messages[0];

  useEffect(() => {
    if (!selectedId && messages[0]) setSelectedId(messages[0].id);
  }, [messages, selectedId]);

  useEffect(() => {
    if (!replyPrompted || transcriptVersion === 0 || handledVersion.current === transcriptVersion || transcriptRoute !== "/messages") return;
    handledVersion.current = transcriptVersion;
    if (matchesPhrase(lastTranscript, ["yes", "yes reply", "അതെ", "हाँ", "అవును", "ಹೌದು", "ஆம்"])) {
      if (!selectedMessage) return;
      setDraftRecipient(selectedMessage.contactId);
      setStatus(`Opening a reply to ${selectedMessage.contactName}.`);
      void router.navigate({ to: "/send" });
    } else if (matchesPhrase(lastTranscript, ["no", "no thanks", "இல்லை", "नहीं", "కాదు", "ಇಲ್ಲ", "ഇല്ല"])) {
      setReplyPrompted(false);
      setStatus("No reply started.");
    }
  }, [lastTranscript, replyPrompted, router, selectedMessage, setDraftRecipient, setStatus, transcriptRoute, transcriptVersion]);

  function readMessage() {
    if (!selectedMessage) return;
    setReplyPrompted(true);
    speak(`${selectedMessage.contactName} says: ${selectedMessage.text}. Would you like to dictate a reply?`);
  }

  function openReply() {
    if (!selectedMessage) return;
    setDraftRecipient(selectedMessage.contactId);
    void router.navigate({ to: "/send" });
  }

  return (
    <AppShell page="messages">
      <div className="vc-inbox-layout">
        <section className="vc-inbox-list" aria-label="Message list">
          <div className="vc-section-heading"><div><p className="vc-eyebrow">INBOX</p><h2>Recent conversations</h2></div><span className="vc-count-badge">{messages.length}</span></div>
          <div className="vc-message-list">
            {messages.map((message) => (
              <Button key={message.id} type="button" variant="ghost" className={`vc-message-row ${selectedMessage?.id === message.id ? "is-selected" : ""}`} onClick={() => { setSelectedId(message.id); setReplyPrompted(false); }} aria-pressed={selectedMessage?.id === message.id}>
                <span className="vc-avatar">{message.contactName.slice(0, 1)}</span>
                <span className="vc-message-row-copy"><span className="vc-row-title"><strong>{message.contactName}</strong><time>{message.time}</time></span><span className="vc-message-preview">{message.direction === "sent" ? "You: " : ""}{message.text}</span></span>
                <span className={`vc-direction-tag ${message.direction}`}>{message.direction === "sent" ? "Demo sent" : "Received"}</span>
              </Button>
            ))}
          </div>
        </section>
        {selectedMessage ? (
          <section className="vc-message-detail" aria-label={`Message from ${selectedMessage.contactName}`}>
            <div className="vc-detail-head"><div className="vc-avatar vc-avatar-large">{selectedMessage.contactName.slice(0, 1)}</div><div><h3>{selectedMessage.contactName}</h3><p>{selectedMessage.direction === "sent" ? "Demonstration message" : "Sample incoming message"} · {selectedMessage.time}</p></div></div>
            <p className="vc-message-full">{selectedMessage.text}</p>
            <div className="vc-detail-actions">
              <Button type="button" variant="secondary" onClick={readMessage}><Volume2 aria-hidden="true" />Read aloud</Button>
              <Button type="button" variant="outline" onClick={openReply}><MessageCircle aria-hidden="true" />Dictate a reply</Button>
            </div>
            {replyPrompted && <p className="vc-inline-status" role="status">Would you like to dictate a reply? Say “Yes” or choose the reply button.</p>}
            <p className="vc-detail-disclaimer">Sample messages only. Replies require review and confirmation.</p>
          </section>
        ) : <p className="vc-empty-note">Your inbox is empty.</p>}
      </div>
    </AppShell>
  );
}

export function ContactsScreen() {
  const { contacts, lastTranscript, transcriptVersion, transcriptRoute, speak, setStatus } = useVoiceConnect();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [callNotice, setCallNotice] = useState("");
  const handledVersion = useRef(0);
  const filteredContacts = contacts.filter((contact) => normalizeSpeech(`${contact.name} ${contact.relation}`).includes(normalizeSpeech(search)));
  const selectedContact = contacts.find((contact) => contact.id === selectedId) ?? filteredContacts[0];

  useEffect(() => {
    if (transcriptVersion === 0 || handledVersion.current === transcriptVersion || transcriptRoute !== "/contacts") return;
    handledVersion.current = transcriptVersion;
    const match = findContactBySpeech(lastTranscript, contacts);
    if (match) {
      setSearch(match.name);
      setSelectedId(match.id);
      setStatus(`${match.name} selected. Choose the simulated call action if you want to continue.`);
    }
  }, [contacts, lastTranscript, setStatus, transcriptRoute, transcriptVersion]);

  function simulateCall(contact: Contact) {
    const notice = `Call demonstration for ${contact.name}. No real call was placed.`;
    setCallNotice(notice);
    setStatus(notice);
    speak(notice);
  }

  return (
    <AppShell page="contacts">
      <section className="vc-section-block vc-contacts-section">
        <div className="vc-section-heading"><div><p className="vc-eyebrow">DEMONSTRATION CONTACTS</p><h2>Who would you like to reach?</h2></div><span className="vc-count-badge">{contacts.length}</span></div>
        <label className="vc-field-label" htmlFor="contact-search">Search by name or relationship</label>
        <Input id="contact-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try Mother, Father, Doctor, or Friend" />
        {callNotice && <p className="vc-inline-status" role="status"><Phone aria-hidden="true" />{callNotice}</p>}
        <div className="vc-contact-grid">
          {filteredContacts.map((contact) => (
            <article key={contact.id} className={`vc-contact-row ${selectedContact?.id === contact.id ? "is-selected" : ""}`}>
              <button type="button" className="vc-contact-select" onClick={() => { setSelectedId(contact.id); setCallNotice(""); }} aria-pressed={selectedContact?.id === contact.id}>
                <span className="vc-avatar vc-avatar-large">{contact.initials}</span>
                <span className="vc-contact-copy"><strong>{contact.name}</strong><span>{contact.relation}</span><small>{contact.phone} · demonstration number</small></span>
              </button>
              <Button type="button" variant="outline" onClick={() => simulateCall(contact)}><Phone aria-hidden="true" />Simulate call</Button>
            </article>
          ))}
          {filteredContacts.length === 0 && <p className="vc-empty-note">No matching demonstration contacts.</p>}
        </div>
      </section>
      <p className="vc-detail-disclaimer">All contact names and phone numbers are sample data. Calls are simulated only.</p>
    </AppShell>
  );
}

export function VoiceSettingsScreen() {
  const { settings, updateSettings, recognitionSupported, speechOutputSupported, speak } = useVoiceConnect();
  const [testText, setTestText] = useState("Your voice settings are ready.");

  return (
    <AppShell page="voice">
      <div className="vc-settings-layout">
        <section className="vc-section-block">
          <p className="vc-eyebrow">SPEECH INPUT</p>
          <h2>Choose your spoken language</h2>
          <p className="vc-muted-copy">This setting is used for microphone recognition and spoken playback where your browser has a matching voice.</p>
          <label className="vc-field-label" htmlFor="voice-language">Language</label>
          <select id="voice-language" className="vc-select" value={settings.language} onChange={(event) => updateSettings({ language: event.target.value as typeof settings.language })}>
            {LANGUAGE_OPTIONS.map((language) => <option key={language.code} value={language.code}>{language.label} · {language.nativeLabel}</option>)}
          </select>
          <div className="vc-support-list">
            <p><span className={`vc-support-dot ${recognitionSupported ? "available" : ""}`} />Microphone recognition <strong>{recognitionSupported ? "Available" : "Not detected"}</strong></p>
            <p><span className={`vc-support-dot ${speechOutputSupported ? "available" : ""}`} />Spoken playback <strong>{speechOutputSupported ? "Available" : "Not detected"}</strong></p>
          </div>
          {!recognitionSupported && <p className="vc-field-hint">Voice input varies by browser. If it is unavailable, use the text command box at the bottom of the screen.</p>}
        </section>
        <section className="vc-section-block">
          <p className="vc-eyebrow">SPEECH OUTPUT</p>
          <h2>Set the speaking pace</h2>
          <label className="vc-field-label" htmlFor="speech-rate">Playback speed <span>{settings.speechRate.toFixed(1)}×</span></label>
          <input id="speech-rate" className="vc-range" type="range" min="0.7" max="1.3" step="0.1" value={settings.speechRate} onChange={(event) => updateSettings({ speechRate: Number(event.target.value) })} />
          <div className="vc-range-labels"><span>Slower</span><span>Faster</span></div>
          <label className="vc-field-label" htmlFor="voice-test">Test phrase</label>
          <Input id="voice-test" value={testText} onChange={(event) => setTestText(event.target.value)} />
          <Button type="button" variant="secondary" className="vc-test-voice" onClick={() => speak(testText.trim() || "Your voice settings are ready.")}><CirclePlay aria-hidden="true" />Play test phrase</Button>
        </section>
      </div>
      <p className="vc-detail-disclaimer">Available voices are provided by your browser and device. An internet connection may be needed for recognition.</p>
    </AppShell>
  );
}

export function AccessibilityScreen() {
  const { settings, updateSettings, setStatus } = useVoiceConnect();
  const fontOptions: Array<{ value: FontSize; label: string }> = [
    { value: "normal", label: "Standard" },
    { value: "large", label: "Large" },
    { value: "largest", label: "Largest" },
  ];

  return (
    <AppShell page="accessibility">
      <div className="vc-settings-layout">
        <section className="vc-section-block">
          <p className="vc-eyebrow">READING COMFORT</p>
          <h2>Text size</h2>
          <p className="vc-muted-copy">Choose a size that feels comfortable across the app.</p>
          <div className="vc-segmented-control" role="group" aria-label="Text size">
            {fontOptions.map((option) => (
              <Button key={option.value} type="button" variant={settings.fontSize === option.value ? "secondary" : "outline"} aria-pressed={settings.fontSize === option.value} onClick={() => { updateSettings({ fontSize: option.value }); setStatus(`Text size set to ${option.label.toLowerCase()}.`); }}>{option.label}</Button>
            ))}
          </div>
          <div className="vc-size-preview" aria-live="polite">A comfortable size makes every message easier to read.</div>
        </section>
        <section className="vc-section-block">
          <p className="vc-eyebrow">DISPLAY</p>
          <h2>Choose your display</h2>
          <div className="vc-setting-row">
            <div><label htmlFor="light-mode-switch">Light display</label><p>Switch between the dark and light display.</p></div>
            <Switch id="light-mode-switch" checked={settings.theme === "light"} onCheckedChange={(checked) => updateSettings({ theme: checked ? "light" : "dark" })} aria-label="Light display" />
          </div>
          <div className="vc-setting-row">
            <div><label htmlFor="contrast-switch">High contrast</label><p>Strengthen text and boundary contrast.</p></div>
            <Switch id="contrast-switch" checked={settings.highContrast} onCheckedChange={(checked) => updateSettings({ highContrast: checked })} aria-label="High contrast" />
          </div>
        </section>
      </div>
      <div className="vc-accessibility-note"><Check aria-hidden="true" /><p>Keyboard access, screen-reader labels, and on-screen controls are available throughout the app.</p></div>
    </AppShell>
  );
}