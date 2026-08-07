---

## shaping: true

# Truth Tracker — Shaping

**Phase:** Shaping (breadboarded — ready to slice)  
**Related docs:** [goal.md](goal.md) · [visual-style-reference.md](visual-style-reference.md) · [breadboarding.md](breadboarding.md)  
**Last updated:** 2026-08-01 (🟡 sync desde `goal.md`: informe solo en panel lateral)

---

## Entry point

Este documento parte de **R (Requirements)** definidos en `goal.md` y una sesión de grilling. La shape **A** refleja las decisiones acordadas. Shapes B y C se mantienen como alternativas descartadas para trazabilidad.

**🟡 Cambio reciente (goal.md):** eliminado popup de resumen — el informe completo se muestra directamente en el panel lateral.

**Próximo paso sugerido:** slicing desde [breadboarding.md](breadboarding.md) (V1: manual verify path).

---

## Requirements (R)


| ID  | Requirement                                                                                                                                                            | Status    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| R0  | Verificar afirmaciones de un reel de Instagram y devolver un informe estructurado con secciones `correcta`, `falsa`, `sin_evidencia`, `selectiva` y `analisis_medidas` | Core goal |
| R1  | Extraer el guión del reel con ≥ 80% del contenido hablado (captions del DOM → audio + STT si no hay captions)                                                          | Must-have |
| R2  | Si la extracción automática falla, el usuario puede pegar el guión manualmente y continuar la verificación                                                             | Must-have |
| R3  | Cada afirmación verificada incluye al menos una fuente citada; afirmaciones sin fuentes van a `sin_evidencia`, no detienen el informe                                  | Must-have |
| R4  | 🟡 Tiempo de respuesta ≤ 90 s para un reel de 30–60 s                                                                                                                    | Must-have |
| R5  | 🟡 UI demo-able: activar desde botón flotante o popup; informe completo en panel lateral dentro de Instagram (sin popup de resumen)                                      | Must-have |
| R6  | Idioma principal del informe: español                                                                                                                                  | Must-have |
| R7  | Backend en localhost primero (Next.js); desplegable a nube después sin reescribir el pipeline                                                                          | Must-have |
| R8  | Costo sostenible para uso personal (~alerta si > $0.50/reel de forma consistente)                                                                                      | Must-have |
| R9  | Precisión mínima: en 3 reels curados, ≥ 2 clasifican correctamente afirmaciones obviamente verdaderas/falsas                                                           | Must-have |


**Out of scope (no son R; restricciones de fase):**

- Otras plataformas (YouTube, TikTok)
- Verificación automática sin acción del usuario
- Auth, cuotas, freemium
- Base de datos propia de fact-checking

---



## CURRENT: Greenfield baseline


| Part         | Mechanism                                                    | Flag |
| ------------ | ------------------------------------------------------------ | ---- |
| **CURRENT1** | **Repo state**                                               |      |
| CURRENT1.1   | `goal.md` con decisiones de grilling                         |      |
| CURRENT1.2   | `visual-style-reference.md` (Soft Atelier Glow)              |      |
| CURRENT1.3   | Next.js 16 scaffold en `todo/` — sin API routes ni extensión |      |
| **CURRENT2** | **No existe aún**                                            |      |
| CURRENT2.1   | Extensión Chrome Manifest V3                                 |      |
| CURRENT2.2   | Content script en Instagram Reels                            |      |
| CURRENT2.3   | API de verificación                                          |      |
| CURRENT2.4   | Integraciones Deepgram / Tavily / Claude Haiku               |      |


---



## A: Chrome extension + Next.js verification pipeline

Extensión MV3 extrae guión → backend Next.js (STT + búsqueda + LLM) → panel lateral detalle.


| Part   | Mechanism                                                                                  | Flag |
| ------ | ------------------------------------------------------------------------------------------ | ---- |
| **A1** | **Extension shell (MV3)**                                                                  |      |
| A1.1   | `manifest.json` con permisos `activeTab`, host `instagram.com`, popup                      |      |
| A1.2   | Service worker: routing de mensajes extensión ↔ content script ↔ backend                   |      |
| A1.3   | Config: URL del backend (`localhost` Fase 1)                                               |      |
| **A2** | **Script extraction (content script)**                                                     |      |
| A2.1   | Detectar reel activo en DOM de Instagram                                                   | ✅ spike |
| A2.2   | Leer captions/subtítulos del DOM si están expuestos                                        | ✅ spike |
| A2.3   | Si no hay captions: capturar audio vía `tabCapture` + offscreen → blob → backend (no `video.captureStream` primario) | ✅ spike |
| A2.4   | Fallback UI: campo para pegar guión manual si A2.2 y A2.3 fallan                           | ✅     |
| **A3** | **Activation affordances**                                                                 |      |
| A3.1   | Botón flotante "Verificar" inyectado junto al reel                                         |      |
| A3.2   | Acción equivalente en popup de la extensión ("Verificar reel actual")                      |      |
| **A4** | **Verification API (Next.js** `todo/`**)**                                                 |      |
| A4.1   | `POST /api/verify` — acepta `{ transcript?, audioBlob?, reelUrl? }`                        |      |
| A4.2   | Orquestador: STT → extracción afirmaciones → búsqueda → clasificación → JSON informe       |      |
| A4.3   | Schema de respuesta: `{ correcta, falsa, sin_evidencia, selectiva, analisis_medidas }`     |      |
| **A5** | **STT (Deepgram)**                                                                         |      |
| A5.1   | Endpoint interno: audio blob → texto (español)                                             |      |
| **A6** | **Search + analysis**                                                                      |      |
| A6.1   | Tavily: búsquedas por afirmación / tema                                                    |      |
| A6.2   | Claude Haiku: extraer afirmaciones del guión                                               |      |
| A6.3   | Claude Haiku: comparar afirmaciones vs evidencia; clasificar; evaluar medidas              |      |
| **A7** | **Extension popup (activación + config)**                                                  |      |
| A7.1   | 🟡 Popup: config URL backend, botón "Verificar reel actual", loading/error durante verificación |      |
| **A8** | **Side panel UI (informe completo)**                                                       |      |
| A8.1   | 🟡 Panel lateral inyectado en Instagram al completar verificación: todas las secciones + fuentes clicables |      |
| A8.2   | Estilos según `visual-style-reference.md` (gradient header Soft Atelier Glow en panel)   |      |


---



## B: Extension-only (APIs desde el navegador)

Extensión llama directo a Deepgram, Tavily y Anthropic; sin backend propio.


| Part   | Mechanism                                                    | Flag |
| ------ | ------------------------------------------------------------ | ---- |
| **B1** | **Extension shell + extraction**                             | ✅ spike |
| B1.1   | Misma extracción que A2                                      | ✅ spike |
| **B2** | **API keys en extensión**                                    |      |
| B2.1   | Usuario configura keys en popup settings                     |      |
| B2.2   | Llamadas fetch directas a APIs externas desde service worker |      |
| **B3** | **UI**                                                       |      |
| B3.1   | 🟡 Popup activación + panel lateral informe (igual que A7/A8) |      |


---



## C: Manual transcript + backend only

Sin extracción automática; usuario pega guión; backend verifica.


| Part   | Mechanism                                     | Flag |
| ------ | --------------------------------------------- | ---- |
| **C1** | **Extension mínima**                          |      |
| C1.1   | Popup con textarea + botón "Verificar"        |      |
| C1.2   | Opcional: capturar URL del reel como metadata |      |
| **C2** | **Backend pipeline**                          |      |
| C2.1   | Mismo pipeline A4–A6, input solo texto        |      |
| **C3** | **UI resultado**                              |      |
| C3.1   | 🟡 Popup activación + panel lateral informe   |      |


---



## Fit Check


| Req | Requirement                                                                                                                                                            | Status    | A   | B   | C   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --- | --- | --- |
| R0  | Verificar afirmaciones de un reel de Instagram y devolver un informe estructurado con secciones `correcta`, `falsa`, `sin_evidencia`, `selectiva` y `analisis_medidas` | Core goal | ✅   | ✅   | ✅   |
| R1  | Extraer el guión del reel con ≥ 80% del contenido hablado (captions del DOM → audio + STT si no hay captions)                                                          | Must-have | ❌   | ❌   | ❌   |
| R2  | Si la extracción automática falla, el usuario puede pegar el guión manualmente y continuar la verificación                                                             | Must-have | ✅   | ✅   | ✅   |
| R3  | Cada afirmación verificada incluye al menos una fuente citada; afirmaciones sin fuentes van a `sin_evidencia`, no detienen el informe                                  | Must-have | ❌   | ❌   | ❌   |
| R4  | Tiempo de respuesta ≤ 90 s para un reel de 30–60 s                                                                                                                     | Must-have | ❌   | ❌   | ❌   |
| R5  | UI demo-able: activar desde botón flotante o popup; informe completo en panel lateral dentro de Instagram (sin popup de resumen)                                        | Must-have | ❌   | ❌   | ❌   |
| R6  | Idioma principal del informe: español                                                                                                                                  | Must-have | ❌   | ❌   | ❌   |
| R7  | Backend en localhost primero (Next.js); desplegable a nube después sin reescribir el pipeline                                                                          | Must-have | ✅   | ❌   | ✅   |
| R8  | Costo sostenible para uso personal (~alerta si > $0.50/reel de forma consistente)                                                                                      | Must-have | ❌   | ❌   | ❌   |
| R9  | Precisión mínima: en 3 reels curados, ≥ 2 clasifican correctamente afirmaciones obviamente verdaderas/falsas                                                           | Must-have | ❌   | ❌   | ❌   |


**Notes:**

- **A, B, C fallan R1, R3–R6, R8, R9** porque los mecanismos aún tienen flags ⚠️ o no están implementados — el fit check refleja estado actual del diseño, no viabilidad teórica final.
- **B falla R7:** sin backend, no hay path localhost → nube acordado.
- **C falla R1 y R5 (parcial):** no hay extracción automática ni botón flotante en reel.
- **Shape seleccionada: A** — única que satisface R7 y el alcance completo del MVP.

---



## Selected shape: A

**Status:** Selected (decisiones de grilling + goal.md)  
**Title:** Chrome extension + Next.js verification pipeline

### Fit check — A only (target state post-build)


| Req | Requirement                                                                                                                                                            | Status    | A   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --- |
| R0  | Verificar afirmaciones de un reel de Instagram y devolver un informe estructurado con secciones `correcta`, `falsa`, `sin_evidencia`, `selectiva` y `analisis_medidas` | Core goal | ❌   |
| R1  | Extraer el guión del reel con ≥ 80% del contenido hablado (captions del DOM → audio + STT si no hay captions)                                                          | Must-have | ❌   |
| R2  | Si la extracción automática falla, el usuario puede pegar el guión manualmente y continuar la verificación                                                             | Must-have | ❌   |
| R3  | Cada afirmación verificada incluye al menos una fuente citada; afirmaciones sin fuentes van a `sin_evidencia`, no detienen el informe                                  | Must-have | ❌   |
| R4  | Tiempo de respuesta ≤ 90 s para un reel de 30–60 s                                                                                                                     | Must-have | ❌   |
| R5  | UI demo-able: activar desde botón flotante o popup; informe completo en panel lateral dentro de Instagram (sin popup de resumen)                                        | Must-have | ❌   |
| R6  | Idioma principal del informe: español                                                                                                                                  | Must-have | ❌   |
| R7  | Backend en localhost primero (Next.js); desplegable a nube después sin reescribir el pipeline                                                                          | Must-have | ❌   |
| R8  | Costo sostenible para uso personal (~alerta si > $0.50/reel de forma consistente)                                                                                      | Must-have | ❌   |
| R9  | Precisión mínima: en 3 reels curados, ≥ 2 clasifican correctamente afirmaciones obviamente verdaderas/falsas                                                           | Must-have | ❌   |


**Unsolved (all ❌ until built + validated):**

- **R1, A2:** Instagram DOM/audio extraction — flagged ⚠️; requiere spike
- **R3–R4, R6, R8–R9, A6:** Pipeline no implementado; precisión y costo sin medir
- **R5, A3/A7/A8:** UI no existe; informe solo en panel lateral (🟡 sin popup resumen)
- **R7, A4:** Backend scaffold only

---



## Spikes



### A2 Spike: Instagram script extraction

**Context:** R1 depende de leer captions o capturar audio del reel. Instagram cambia el DOM con frecuencia; es el mayor riesgo del MVP.

**Goal:** Describir cómo extraer texto o audio de un reel activo en Chrome MV3.


| #     | Question                                                                        |
| ----- | ------------------------------------------------------------------------------- |
| A2-Q1 | ¿Qué selectores/atributos expone Instagram para captions en reels (2026)?       |
| A2-Q2 | ¿El `<video>` del reel es accesible desde content script para captura de audio? |
| A2-Q3 | ¿Qué permisos MV3 se necesitan (`tabCapture`, `offscreen`, etc.)?               |
| A2-Q4 | ¿Cuál es el fallback mínimo viable si Instagram bloquea ambos?                  |


**Acceptance:** ✅ Resuelto en `spike-instagram-extraction.md` — pasos concretos para A2.1–A2.3; A2.4 confirmado como fallback MVP.

---



## Stack (decided)


| Component     | Choice                                          |
| ------------- | ----------------------------------------------- |
| Extension     | Chrome Manifest V3                              |
| Backend       | Next.js 16 (`todo/`)                            |
| STT           | Deepgram                                        |
| Search        | Tavily                                          |
| LLM           | Claude Haiku                                    |
| Visual style  | Soft Atelier Glow (`visual-style-reference.md`) |
| Deploy Fase 1 | `localhost`                                     |
| Deploy Fase 2 | Nube (p. ej. Vercel)                            |


---



## Caso de prueba de referencia

**Input (guión):**

> En San Miguel hay 3000 extorsiones en este año, la mayoría de asaltos son por venezolanos y por motos. Por eso, para acabar con ella vamos a instalar más cámaras y vamos a sacar más policías a las calles.

**Output esperado:** informe JSON con `correcta`, `falsa`, `sin_evidencia`, `selectiva` y `analisis_medidas` poblados; fuentes citadas donde aplique.

---



## Phase transition checklist


| Gate                    | Status                     |
| ----------------------- | -------------------------- |
| Shape selected          | ✅ A                        |
| Fit check passes (no ❌) | ❌ — pending implementation |
| Breadboard complete     | ✅ [breadboarding.md](breadboarding.md) |
| Spikes resolved (A2)    | ✅ `spike-instagram-extraction.md` |
| Ready to slice          | ✅ (V1 puede empezar sin spike A2) |


**→ Shaping → Slicing:** breadboard completo. Slice V1 (pegar guión manual) no depende del spike A2. Fit check sigue ❌ hasta implementación.