import { z } from "zod";

export const verificationReportSchema = z.object({
  correcta: z.array(
    z.object({
      afirmacion: z.string().min(1),
      fuente: z.string().min(1),
      url: z.string().url().optional(),
    }),
  ),
  falsa: z.array(
    z.object({
      afirmacion: z.string().min(1),
      fuente: z.string().min(1),
      explicacion: z.string().min(1),
      url: z.string().url().optional(),
    }),
  ),
  sin_evidencia: z.array(
    z.object({
      afirmacion: z.string().min(1),
      nota: z.string().min(1),
    }),
  ),
  selectiva: z.object({
    resultado: z.enum(["Sí", "No"]),
    explicacion: z.string().min(1),
  }),
  analisis_medidas: z.object({
    medidas_propuestas: z.array(z.string().min(1)),
    efectivas: z.boolean(),
    razon: z.string().min(1),
    fuentes: z.array(z.string().min(1)),
  }),
});

export const verifyRequestSchema = z
  .object({
    transcript: z.string().optional(),
    audioBase64: z.string().optional(),
    reelUrl: z.string().url().optional(),
  })
  .refine(
    (body) =>
      Boolean(body.transcript?.trim()) || Boolean(body.audioBase64?.trim()),
    {
      message:
        "Se requiere transcript o audioBase64 para iniciar la verificación.",
    },
  );
