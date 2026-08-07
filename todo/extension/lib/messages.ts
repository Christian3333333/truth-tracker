import type { VerificationReport, VerificationStatus } from "./types";

export const MessageType = {
  MANUAL_VERIFY: "MANUAL_VERIFY",
  AUTO_VERIFY: "AUTO_VERIFY",
  TRIGGER_VERIFY: "TRIGGER_VERIFY",
  REPORT_READY: "REPORT_READY",
  OPEN_MANUAL_MODAL: "OPEN_MANUAL_MODAL",
  STATUS_CHANGED: "STATUS_CHANGED",
  VERIFY_ERROR: "VERIFY_ERROR",
} as const;

export type MessageTypeName =
  (typeof MessageType)[keyof typeof MessageType];

export interface ManualVerifyMessage {
  type: typeof MessageType.MANUAL_VERIFY;
  transcript: string;
  reelUrl?: string;
}

export interface AutoVerifyMessage {
  type: typeof MessageType.AUTO_VERIFY;
  transcript?: string;
  reelUrl: string;
}

export interface TriggerVerifyMessage {
  type: typeof MessageType.TRIGGER_VERIFY;
}

export interface ReportReadyMessage {
  type: typeof MessageType.REPORT_READY;
  report: VerificationReport;
}

export interface OpenManualModalMessage {
  type: typeof MessageType.OPEN_MANUAL_MODAL;
}

export interface StatusChangedMessage {
  type: typeof MessageType.STATUS_CHANGED;
  status: VerificationStatus;
}

export interface VerifyErrorMessage {
  type: typeof MessageType.VERIFY_ERROR;
  error: string;
}

export type ExtensionMessage =
  | ManualVerifyMessage
  | AutoVerifyMessage
  | TriggerVerifyMessage
  | ReportReadyMessage
  | OpenManualModalMessage
  | StatusChangedMessage
  | VerifyErrorMessage;

export function createManualVerifyMessage(
  transcript: string,
  reelUrl?: string,
): ManualVerifyMessage {
  return { type: MessageType.MANUAL_VERIFY, transcript, reelUrl };
}

export function createAutoVerifyMessage(
  reelUrl: string,
  transcript?: string,
): AutoVerifyMessage {
  return { type: MessageType.AUTO_VERIFY, reelUrl, transcript };
}

export function createTriggerVerifyMessage(): TriggerVerifyMessage {
  return { type: MessageType.TRIGGER_VERIFY };
}

export function createReportReadyMessage(
  report: VerificationReport,
): ReportReadyMessage {
  return { type: MessageType.REPORT_READY, report };
}

export function createOpenManualModalMessage(): OpenManualModalMessage {
  return { type: MessageType.OPEN_MANUAL_MODAL };
}

export function createStatusChangedMessage(
  status: VerificationStatus,
): StatusChangedMessage {
  return { type: MessageType.STATUS_CHANGED, status };
}

export function createVerifyErrorMessage(error: string): VerifyErrorMessage {
  return { type: MessageType.VERIFY_ERROR, error };
}

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return (
    type === MessageType.MANUAL_VERIFY ||
    type === MessageType.AUTO_VERIFY ||
    type === MessageType.TRIGGER_VERIFY ||
    type === MessageType.REPORT_READY ||
    type === MessageType.OPEN_MANUAL_MODAL ||
    type === MessageType.STATUS_CHANGED ||
    type === MessageType.VERIFY_ERROR
  );
}
