/** Verification report shape — mirrors backend `VerificationReport` (spec.md). */
export interface CorrectClaim {
  afirmacion: string;
  fuente: string;
  url?: string;
}

export interface FalseClaim {
  afirmacion: string;
  fuente: string;
  explicacion: string;
  url?: string;
}

export interface UnverifiableClaim {
  afirmacion: string;
  nota: string;
}

export interface SelectiveAnalysis {
  resultado: "Sí" | "No";
  explicacion: string;
}

export interface MeasuresAnalysis {
  medidas_propuestas: string[];
  efectivas: boolean;
  razon: string;
  fuentes: string[];
}

export interface VerificationReport {
  correcta: CorrectClaim[];
  falsa: FalseClaim[];
  sin_evidencia: UnverifiableClaim[];
  selectiva: SelectiveAnalysis;
  analisis_medidas: MeasuresAnalysis;
}

export interface VerifyRequestBody {
  transcript?: string;
  audioBase64?: string;
  reelUrl?: string;
}

export type VerificationStatus =
  | "idle"
  | "extracting"
  | "verifying"
  | "error";

export const DEFAULT_BACKEND_URL = "http://localhost:3000";

export const STORAGE_KEYS = {
  backendUrl: "backendUrl",
  verificationReport: "verificationReport",
  verificationStatus: "verificationStatus",
  verificationError: "verificationError",
  panelPending: "panelPending",
} as const;
