import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createDefaultDeps } from "@/lib/verification/create-deps";
import {
  runVerification,
  VerificationError,
} from "@/lib/verification/pipeline";
import { verifyRequestSchema } from "@/lib/verification/schema";
import type { VerificationDeps } from "@/lib/verification/types";

export function createVerifyHandler(
  getDeps: () => VerificationDeps = createDefaultDeps,
) {
  return async function POST(request: NextRequest) {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud debe ser JSON válido." },
        { status: 400 },
      );
    }

    try {
      const parsed = verifyRequestSchema.parse(body);
      const report = await runVerification(parsed, getDeps());
      return NextResponse.json(report);
    } catch (error) {
      if (error instanceof ZodError) {
        const message =
          error.issues[0]?.message ??
          "Solicitud inválida para verificación.";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      if (error instanceof VerificationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      console.error("Verification failed:", error);
      return NextResponse.json(
        { error: "Error interno al verificar el contenido." },
        { status: 500 },
      );
    }
  };
}

export const POST = createVerifyHandler();
