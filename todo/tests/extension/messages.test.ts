import { describe, expect, it } from "vitest";
import {
  createManualVerifyMessage,
  createReportReadyMessage,
  createTriggerVerifyMessage,
  isExtensionMessage,
  MessageType,
} from "@/extension/lib/messages";
import { SAN_MIGUEL_REPORT } from "@/tests/fixtures/san-miguel";

describe("extension messages", () => {
  it("builds typed messages for manual verify and report-ready handoff", () => {
    const manual = createManualVerifyMessage("guión de prueba");
    expect(manual.type).toBe(MessageType.MANUAL_VERIFY);
    expect(manual.transcript).toBe("guión de prueba");

    const ready = createReportReadyMessage(SAN_MIGUEL_REPORT);
    expect(ready.type).toBe(MessageType.REPORT_READY);
    expect(ready.report.selectiva.resultado).toMatch(/^(Sí|No)$/);

    const trigger = createTriggerVerifyMessage();
    expect(trigger.type).toBe(MessageType.TRIGGER_VERIFY);
  });

  it("rejects unknown payloads", () => {
    expect(isExtensionMessage({ type: "NOPE" })).toBe(false);
    expect(isExtensionMessage(null)).toBe(false);
    expect(
      isExtensionMessage(createManualVerifyMessage("ok")),
    ).toBe(true);
  });
});
