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

export interface SearchHit {
  title: string;
  url: string;
  content: string;
}

export interface ClaimEvidence {
  claim: string;
  hits: SearchHit[];
}

export interface ClassifyInput {
  transcript: string;
  claims: string[];
  evidence: ClaimEvidence[];
}

export interface VerificationDeps {
  transcribe(audioBase64: string): Promise<string>;
  extractClaims(transcript: string): Promise<string[]>;
  searchEvidence(query: string): Promise<SearchHit[]>;
  classifyReport(input: ClassifyInput): Promise<VerificationReport>;
}
