# Truth Tracker MVP — Specification

**Status:** ready-for-agent  
**Shape:** A (Chrome extension + Next.js verification pipeline)  
**Sources:** goal.md · shaping.md · breadboarding.md · visual-style-reference.md  
**Date:** 2026-08-01

---

## Testing Seams (proposed)

**Primary seam (single boundary):** `POST /api/verify`

All backend verification behavior is tested through this HTTP contract. External services (Deepgram, Tavily, Anthropic) are mocked at this boundary. The extension and side panel are validated manually or via E2E in later slices; they consume the same `VerificationReport` JSON returned by this endpoint.

| Seam | What it isolates | When to use |
|------|------------------|-------------|
| **`POST /api/verify`** (primary) | Full pipeline: STT → claim extraction → search → classification | Unit/integration tests for R0, R3, R4, R6, R9 |
| Manual transcript modal → panel (V1) | Extension UI without auto-extraction | Manual demo; E2E optional |
| Content script extraction (V4) | Instagram DOM/audio | Spike A2 first; no automated tests until spike resolves |

---

## Problem Statement

Las personas que consumen reels informativos en Instagram no tienen forma rápida de comprobar si lo que escuchan es veraz, está incompleto o carece de respaldo. Hoy deben buscar manualmente cada afirmación, contrastar fuentes y detectar omisiones de contexto — un proceso lento que desincentiva el fact-checking mientras scrollean.

El usuario (desarrollador, uso personal) quiere activar la verificación con un clic mientras ve un reel y recibir un informe estructurado en español, con fuentes, sin salir de Instagram.

---

## Solution

Truth Tracker es una extensión Chrome (Manifest V3) que, al ver un reel de Instagram, extrae el guión (captions del DOM o audio vía Deepgram), lo envía a un backend Next.js local, y muestra un **panel lateral** dentro de Instagram con un informe categorizado: afirmaciones correctas, falsas, sin evidencia suficiente, análisis de selectividad, y evaluación de medidas propuestas.

Activación desde botón flotante en el reel o desde el popup de la extensión (solo activación y config — el informe no se muestra en el popup). Si la extracción automática falla, el usuario puede pegar el guión manualmente y continuar.

---

## User Stories

1. Como usuario de Instagram, quiero pulsar un botón "Verificar" mientras veo un reel, para iniciar el análisis sin copiar texto manualmente.
2. Como usuario, quiero activar la verificación desde el popup de la extensión, para tener un segundo punto de entrada si el botón flotante falla.
3. Como usuario, quiero que la extensión lea los captions del reel si están disponibles en el DOM, para obtener el guión de forma rápida y barata.
4. Como usuario, quiero que la extensión capture el audio del video cuando no hay captions, para que reels sin subtítulos también sean verificables.
5. Como usuario, quiero ver un indicador de carga mientras se verifica, para saber que el proceso está en curso.
6. Como usuario, quiero pegar el guión manualmente si la extracción automática falla, para no quedar bloqueado cuando Instagram cambie su DOM.
7. Como usuario, quiero cancelar el modal de pegado manual y volver al reel, para abortar sin perder contexto.
8. Como usuario, quiero que el backend transcriba audio en español, para reels hablados en mi idioma principal.
9. Como usuario, quiero recibir un informe en español, para leerlo sin traducir mentalmente.
10. Como usuario, quiero ver afirmaciones **correctas** con fuente citada, para confiar en lo que sí está respaldado.
11. Como usuario, quiero ver afirmaciones **falsas** con fuente o explicación, para entender por qué son incorrectas.
12. Como usuario, quiero ver afirmaciones **sin evidencia suficiente** separadas de las falsas, para no confundir "no comprobable" con "falso".
13. Como usuario, quiero saber si el reel presenta información **selectiva** (Sí/No) con explicación del contexto faltante, para entender el panorama completo.
14. Como usuario, quiero ver un **análisis de medidas propuestas** (p. ej. más cámaras, más policías) con evaluación basada en evidencia, para juzgar si las soluciones del video tienen sentido.
15. Como usuario, quiero que el informe se abra automáticamente en un panel lateral dentro de Instagram, para leerlo junto al reel sin cambiar de pestaña.
16. Como usuario, quiero cerrar el panel lateral y seguir viendo reels, para retomar el scroll cuando termine de leer.
17. Como usuario, quiero hacer clic en las fuentes del informe, para verificar la evidencia original.
18. Como usuario, quiero configurar la URL del backend en el popup, para apuntar a localhost en desarrollo y a la nube después.
19. Como desarrollador, quiero que el backend corra en localhost primero, para iterar sin desplegar.
20. Como desarrollador, quiero desplegar el mismo backend a la nube después, para usar la extensión sin tener el servidor local encendido.
21. Como desarrollador, quiero un JSON estructurado con secciones `correcta`, `falsa`, `sin_evidencia`, `selectiva`, `analisis_medidas`, para validar el pipeline programáticamente.
22. Como desarrollador, quiero que el caso de prueba "San Miguel" produzca todas las categorías pobladas, para tener un benchmark de referencia.
23. Como desarrollador, quiero completar una verificación en ≤ 90 s para un reel de 30–60 s, para que la experiencia sea usable.
24. Como desarrollador, quiero una alerta si el costo por verificación supera ~$0.50 de forma sostenida, para controlar gastos de APIs.
25. Como desarrollador, quiero que afirmaciones sin fuentes no detengan el informe, para que el análisis parcial siga siendo útil.
26. Como desarrollador, quiero que el panel use el estilo visual Soft Atelier Glow, para una UI coherente y legible.
27. Como usuario, quiero ver un mensaje de error claro si algo falla (extracción, backend caído, timeout), para saber qué hacer a continuación.
28. Como desarrollador, quiero implementar en slices verticales demo-ables (V1→V5), para validar progreso incremental.
29. Como usuario, quiero que la extensión funcione solo en Instagram Reels (MVP), para un alcance acotado y predecible.
30. Como desarrollador, quiero ≥ 80% del contenido hablado extraído en reels de prueba, para confiar en la calidad del input al pipeline.

---

## Implementation Decisions

### Architecture

- **Shape A selected:** Chrome MV3 extension + Next.js 16 backend in `todo/`.
- **Phase 1:** backend on `localhost`; **Phase 2:** deploy to cloud (e.g. Vercel) without rewriting the pipeline.
- **Cost model:** personal use; developer pays API keys; no auth/freemium in MVP.
- **Communication:** service worker ↔ content script via messages; service worker → backend via `fetch`.

### Chrome Extension (MV3)

- **Manifest:** permissions `activeTab`, host `instagram.com`; service worker; popup; content script injected on Instagram.
- **Places (breadboard):** P1 Instagram Reel, P2 Extension Popup (activation only), P3 Side Panel, P4 Manual Transcript Modal, P5 Backend.
- **Activation:** floating "Verificar" button on active reel (P1) + "Verificar reel actual" in popup (P2).
- **Extraction pipeline (content script):** try captions from DOM → else capture `<video>` audio blob → else open manual modal (P4).
- **Extraction unknowns (spike A2 pending):** caption selectors and audio capture mechanism flagged ⚠️; V1 slice bypasses via manual paste.
- **On verify complete:** service worker stores report → notifies content script → `openSidePanel()` + `renderSidePanel(report)`. No summary popup.
- **Popup role:** backend URL config, trigger verification, loading/error states only.
- **Visual style:** Soft Atelier Glow per visual-style-reference.md — pink glow gradient on panel header, serif section titles, sans body text.

### Backend (Next.js)

- **Single entry point:** `POST /api/verify`
- **Request body:**

```typescript
{
  transcript?: string;      // plain text if already extracted or manual
  audioBase64?: string;   // optional; backend sends to Deepgram if no transcript
  reelUrl?: string;         // optional metadata
}
```

- **Response body (`VerificationReport`):**

```typescript
{
  correcta: Array<{
    afirmacion: string;
    fuente: string;
    url?: string;
  }>;
  falsa: Array<{
    afirmacion: string;
    fuente: string;
    explicacion: string;
    url?: string;
  }>;
  sin_evidencia: Array<{
    afirmacion: string;
    nota: string;
  }>;
  selectiva: {
    resultado: "Sí" | "No";
    explicacion: string;
  };
  analisis_medidas: {
    medidas_propuestas: string[];
    efectivas: boolean;
    razon: string;
    fuentes: string[];
  };
}
```

- **Pipeline order:**
  1. If `audioBase64` and no `transcript` → Deepgram STT (Spanish)
  2. Claude Haiku → extract claims from transcript
  3. Tavily → search evidence per claim/topic
  4. Claude Haiku → classify claims, build selectiva analysis, evaluate medidas
  5. Return `VerificationReport` JSON

### External services

| Service | Role | Notes |
|---------|------|-------|
| Deepgram | STT | Spanish; backend only |
| Tavily | Web search | One or more queries per claim |
| Claude Haiku | LLM | Claim extraction + classification + medidas analysis |

### State and messaging

- `verificationReport` stored in extension storage (session vs local TBD — see breadboarding Q3).
- `verificationStatus`: `idle` | `extracting` | `verifying` | `error`.
- `backendUrl` configurable in popup; default `http://localhost:3000`.

### Implementation slices (order)

| Slice | Scope | Demo |
|-------|-------|------|
| **V1** | Manual paste + backend + side panel | Paste San Miguel script → panel with report |
| **V2** | Backend pipeline only | `POST /api/verify` returns valid JSON |
| **V3** | Auto-open panel on verify complete | Verify → panel opens with report |
| **V4** | Floating button + auto extraction | Click on reel → panel (depends on spike A2) |
| **V5** | Visual polish | Full flow with Soft Atelier Glow |

### Reference test case (San Miguel)

**Input transcript:**
> En San Miguel hay 3000 extorsiones en este año, la mayoría de asaltos son por venezolanos y por motos. Por eso, para acabar con ella vamos a instalar más cámaras y vamos a sacar más policías a las calles.

**Expected:** all report sections populated; sources cited where verifiable; `sin_evidencia` for unverifiable nationality claim; `analisis_medidas` evaluates cameras/police proposal.

---

## Testing Decisions

### What makes a good test

- Test **external behavior**, not implementation details.
- Assert on **HTTP response shape and content categories**, not internal function calls.
- Mock external APIs (Deepgram, Tavily, Anthropic) at the HTTP client boundary.
- Do not unit-test LLM prompt wording; test that the orchestrator returns well-formed JSON and handles error paths.

### Primary seam: `POST /api/verify`

| Test | Input | Assert |
|------|-------|--------|
| Text-only verify | San Miguel transcript | 200; all sections present; `correcta`/`falsa`/`sin_evidencia` non-empty where expected |
| Audio path | audioBase64 fixture + mocked Deepgram | transcript extracted then same as text-only |
| Missing input | empty body | 400 with clear error |
| No evidence claim | transcript with unverifiable claim | claim in `sin_evidencia`, not `falsa`; report still complete |
| Timeout guard | mocked slow APIs | 504 or error within acceptable bound |
| Spanish output | any Spanish transcript | response text fields in Spanish |

### Modules tested

- **Verification API handler** — primary; all pipeline tests here.
- **Extension UI** — manual demo for MVP; E2E optional in V4/V5.
- **Content script extraction** — deferred until spike A2 resolves; then integration test with fixture DOM.

### Prior art

- Greenfield project: no existing tests. Next.js 16 scaffold in `todo/` has no test setup yet. Introduce Vitest (or similar) with first V2 slice.

---

## Out of Scope

- YouTube, TikTok, or other platforms
- Automatic verification without user action (real-time overlay)
- Proprietary fact-checking database
- Legal moderation by jurisdiction
- Deepfake or visual manipulation detection
- User auth, quotas, freemium billing
- Popup summary view (removed — report only in side panel)
- Production deployment in MVP (localhost first)

---

## Further Notes

### Stop conditions

- Stop and consult user if neither automatic extraction nor manual paste is viable for MVP.
- Stop if sustained cost exceeds ~$0.50/verification.
- Do **not** stop for individual claims without web sources — classify as `sin_evidencia`.

### Open questions (from breadboarding)

1. Does popup stay open showing loading during ~90 s verify, or close and rely on panel notification?
2. Does side panel block reel interaction (separate Place) or allow semi-transparent overlay?
3. `chrome.storage.session` vs `local` for report handoff between service worker and content script?

### Success criteria (from goal.md)

| Criterion | Threshold |
|-----------|-----------|
| Extension loads | No errors in Chrome |
| Script extraction | ≥ 80% of spoken content on test reel |
| Structured report | Valid JSON with all five sections |
| San Miguel case | All categories populated with sources |
| Response time | ≤ 90 s for 30–60 s reel |
| Minimum accuracy | ≥ 2/3 curated test reels classify obvious true/false correctly |

### Related documents

- `goal.md` — objective and grilling decisions
- `shaping.md` — requirements R0–R9, Shape A parts, fit check
- `breadboarding.md` — affordance tables, wiring, slices V1–V5
- `visual-style-reference.md` — Soft Atelier Glow design tokens
