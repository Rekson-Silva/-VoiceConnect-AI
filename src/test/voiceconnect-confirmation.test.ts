import { describe, expect, it } from "vitest";

import { isExplicitSendConfirmation } from "@/components/voiceconnect/voice-utils";

describe("VoiceConnect send confirmation", () => {
  it("accepts the explicit send phrase but never treats a plain yes as confirmation", () => {
    expect(isExplicitSendConfirmation("Yes, send", "en-IN")).toBe(true);
    expect(isExplicitSendConfirmation("yes", "en-IN")).toBe(false);
  });
});