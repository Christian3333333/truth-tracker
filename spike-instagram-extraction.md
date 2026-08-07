# Spike A2 — Extracción de guión en Instagram (Chrome MV3)

**Date:** 2026-08-06  
**Status:** resolved (accionable)  
**Tickets:** 04 — Spike: extracción Instagram  
**Questions:** A2-Q1 … A2-Q4  

Este spike documenta *cómo* implementar extracción automática para el slice V4. No es código de producto.

---

## Resumen ejecutivo

| Pregunta | Respuesta corta |
|----------|-----------------|
| **A2-Q1** Captions DOM | Usar selectores semánticos / accesibilidad + heurísticas; **no** confiar en clases CSS ofuscadas. Esperar roturas frecuentes. |
| **A2-Q2** `<video>` audio | El nodo `<video>` es visible, pero el audio útil **no** se obtiene de forma fiable vía `captureStream()` / element audio tracks (MSE/`blob:`). Preferir **tab capture**. |
| **A2-Q3** Permisos MV3 | `activeTab` + `tabCapture` + `offscreen` (+ `storage` ya usado). Host `instagram.com`. |
| **A2-Q4** Fallback | Modal manual (P4) — ya implementado en tickets 02–03. |

**Conclusión para V4:** captions primero (barato/frágil) → si vacío, `tabCapture` + offscreen + `MediaRecorder` → audioBase64 al backend → si falla, abrir P4.

---

## A2-Q1 — Selectores / atributos de captions en Reels (2026)

### Hallazgos

1. **Instagram ofusca clases** (`x1…`) y cambia el DOM con frecuencia. Extensiones reales (p. ej. descargadores MV3) reportan roturas ~mensuales y dependen de **`aria-label` / roles**, no de clases.
2. Los `aria-label` suelen estar en **inglés** si el UI de Instagram está en EN; con `?hl=es` o UI en español cambian las cadenas. Cualquier selector por texto de accesibilidad debe ser **multidioma** o usar atributos estructurales.
3. El **caption del post** (texto bajo el reel / “más”) es distinto de los **subtítulos quemados o timed captions** del video. Para fact-checking del *discurso hablado*, el caption del post es un proxy incompleto; los auto-captions del player, si existen en el DOM, suelen vivir en overlays efímeros.
4. Proyectos vecinos (Reeliable y similares) complementan el DOM con un script en **`world: "MAIN"`** que camina el **árbol React fiber** para resolver shortcode / metadata cuando el markup es opaco (`blob:` URLs en el player).

### Selectores candidatos (verificar en DevTools antes de shippear V4)

Orden de intento sugerido (content script, isolated world):

```text
1. article [role="menuitem"], sección de “Más opciones” / caption expandido
2. h1 / span cercanos al reel activo con texto largo (>40 chars) en el viewport
3. [aria-label*="Caption" i], [aria-label*="Audio" i]  — frágil por idioma
4. Elementos de subtítulos del player: divs absolutos sobre <video> con texto que cambia con el tiempo
5. Fallback MAIN-world: leer props del fiber del nodo <video> / contenedor del reel
```

**Heurística de “reel activo”:** el `<video>` con mayor área de intersección con el viewport (`IntersectionObserver` / `getBoundingClientRect`), URL que contenga `/reel/` o `/reels/`.

### Riesgos

- Falsos positivos (comentarios, usernames).
- Caption del post ≠ guión hablado.
- Rotura silenciosa tras un deploy de Instagram.

### Pasos concretos de implementación (V4)

1. Añadir `tryExtractCaptionsFromDOM(activeReelRoot): string | null` en el content script.
2. Fixture HTML mínimo en tests (DOM sintético) — no scrape live en CI.
3. Feature flag / timeout corto (p. ej. 800 ms) antes de pasar a audio.
4. Loguear longitud del texto extraído; si `< 20` chars, tratar como fallo.

---

## A2-Q2 — Accesibilidad del `<video>` para captura de audio

### Hallazgos

1. El content script **sí** puede seleccionar `document.querySelector("video")` en la página de reels (mismo origen de la página).
2. El media suele servirse vía **MSE** con `src` tipo `blob:`. Eso implica:
   - `video.captureStream()` / tracks de audio del elemento son **poco fiables** o vacíos según codec y políticas del player.
   - Descargar el blob URL desde el mundo aislado no garantiza un archivo de audio limpio.
3. Cross-origin / encrypted media puede bloquear lectura de frames/audio aunque el elemento sea “accesible” en el DOM.
4. La vía soportada por Chrome MV3 para audio de pestaña es **`chrome.tabCapture.getMediaStreamId`** (tras gesto de usuario) + **`getUserMedia` en un offscreen document** + `MediaRecorder` → Blob → `audioBase64` hacia `POST /api/verify`.

### Implicación

No diseñar V4 alrededor de “leer el `<video>` y sacar su audio track”. Usar el `<video>` solo para **detectar reel activo / timing**; capturar audio a nivel de **tab**.

---

## A2-Q3 — Permisos MV3 requeridos

| Permiso / API | ¿Para qué? | ¿MVP V4? |
|---------------|------------|----------|
| `activeTab` | Gesto de usuario al activar desde popup/acción | Sí |
| `tabs` | Localizar tab de Instagram para mensajes / tabCapture target | Ya en uso |
| `storage` | `backendUrl`, `verificationReport` (session) | Ya en uso |
| `host_permissions`: `https://www.instagram.com/*` | Content script + fetch contextual | Ya en uso |
| `tabCapture` | Stream ID de la pestaña activa | **Añadir en V4** |
| `offscreen` | Documento para `getUserMedia` + `MediaRecorder` (SW no tiene DOM) | **Añadir en V4** |
| Host backend (`localhost` / cloud) | `POST /api/verify` con `audioBase64` | Ya en uso |

### Flujo recomendado (Chrome ≥ 116)

```text
User gesture (popup / FAB)
  → service worker: chrome.tabCapture.getMediaStreamId({ targetTabId })
  → chrome.offscreen.createDocument({ reasons: ['USER_MEDIA'], ... })
  → offscreen: getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId }}})
  → MediaRecorder → Blob → base64
  → SW: postVerify(backendUrl, { audioBase64, reelUrl })
  → REPORT_READY → panel (igual que tickets 02–03)
```

**Importante:** reinyectar audio al `AudioContext.destination` mientras se graba para que el usuario no pierda el sonido del reel (documentado por Chrome).

**No** depender de `tabCapture.capture` solo en el popup: el popup se cierra y corta la captura.

---

## A2-Q4 — Fallback mínimo viable

Si captions y tab-capture fallan (DOM vacío, permiso denegado, timeout, Instagram mute/DRM):

1. Abrir **P4 — modal manual** (`OPEN_MANUAL_MODAL`) — ya cableado.
2. Usuario pega guión → `MANUAL_VERIFY` → mismo pipeline de informe.
3. Mostrar error claro en toast/status (`VERIFY_ERROR`) explicando el fallo de extracción.

Esto satisface **R2** aunque **R1** (≥80% extracción automática) quede pendiente de afinar en V4.

---

## Plan de implementación (ticket 05 / slice V4)

1. Manifest: añadir `tabCapture`, `offscreen`.
2. `offscreen.html` + `offscreen.ts` con recorder.
3. Content: `tryExtractCaptionsFromDOM` + detección de reel activo.
4. Background: orquestar captions → capture → manual fallback.
5. Tests: fixtures DOM; mock de `tabCapture` en el seam del orquestador (no E2E Instagram en CI).
6. Demo: un reel con captions visibles + un reel sin captions (ruta audio).

---

## Decisiones tomadas por este spike

| Tema | Decisión |
|------|----------|
| Storage S3 (breadboarding Q3) | `chrome.storage.session` para handoff informe (ya en tickets 02–03) |
| Audio path | tabCapture + offscreen, no `video.captureStream()` como primaria |
| Captions | Heurística DOM + tolerancia a fallo → audio → manual |

---

## Referencias

- [Chrome — Audio recording and screen capture](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture)
- [chrome.tabCapture](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)
- Experiencia de campo: extensiones Instagram MV3 (aria-label, roturas de DOM); patrones fiber/MAIN-world en herramientas de análisis de reels
