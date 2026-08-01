# 01 — Verification API (texto + audio)

**What to build:** Un endpoint `POST /api/verify` en el backend Next.js que recibe un guión en texto o audio en base64, ejecuta el pipeline de verificación (Deepgram si hay audio → Claude Haiku extracción de afirmaciones → Tavily búsqueda → Claude Haiku clasificación), y devuelve un informe JSON estructurado en español con las secciones `correcta`, `falsa`, `sin_evidencia`, `selectiva` y `analisis_medidas`.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `POST /api/verify` acepta `{ transcript?, audioBase64?, reelUrl? }` y responde con `VerificationReport` según spec
- [ ] Ruta texto: guión San Miguel produce las cinco secciones pobladas; afirmaciones sin fuentes van a `sin_evidencia`, no detienen el informe
- [ ] Ruta audio: `audioBase64` se transcribe vía Deepgram (español) y continúa el mismo pipeline
- [ ] Body vacío o inválido devuelve 400 con mensaje claro
- [ ] Tests de integración mockean Deepgram, Tavily y Anthropic; assert sobre forma del JSON, no prompts internos
- [ ] Demo verificable: `curl` con transcript San Miguel → 200 + JSON válido en ≤ 90 s (con APIs reales en dev)
