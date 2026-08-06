import type { VerificationReport } from "@/lib/verification/types";

export const SAN_MIGUEL_TRANSCRIPT =
  "En San Miguel hay 3000 extorsiones en este año, la mayoría de asaltos son por venezolanos y por motos. Por eso, para acabar con ella vamos a instalar más cámaras y vamos a sacar más policías a las calles.";

/** Independent fixture — spec reference case for assertions. */
export const SAN_MIGUEL_REPORT: VerificationReport = {
  correcta: [
    {
      afirmacion:
        "San Miguel registra un aumento significativo de denuncias por extorsión",
      fuente: "Policía Nacional del Perú — reporte de criminalidad 2025",
      url: "https://example.com/pnp-extorsion",
    },
  ],
  falsa: [
    {
      afirmacion: "Hay exactamente 3000 extorsiones en San Miguel este año",
      fuente: "Ministerio del Interior — estadísticas oficiales",
      explicacion:
        "No existe una cifra oficial pública que confirme exactamente 3000 extorsiones en San Miguel.",
      url: "https://example.com/mininterior-stats",
    },
  ],
  sin_evidencia: [
    {
      afirmacion:
        "La mayoría de asaltos son cometidos por venezolanos y en moto",
      nota: "No hay datos públicos confiables que vinculen la mayoría de asaltos con una nacionalidad específica en San Miguel.",
    },
  ],
  selectiva: {
    resultado: "Sí",
    explicacion:
      "El reel presenta cifras sin contexto histórico ni factores estructurales de la inseguridad en la zona.",
  },
  analisis_medidas: {
    medidas_propuestas: [
      "instalar más cámaras",
      "sacar más policías a las calles",
    ],
    efectivas: false,
    razon:
      "La evidencia muestra que más vigilancia sin reformas institucionales tiene efecto limitado sobre la extorsión organizada.",
    fuentes: ["Estudio de políticas de seguridad urbana — Lima 2024"],
  },
};
